'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import type { SelectChangeEvent } from '@mui/material/Select'

// Third-party Imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  type FilterFn
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'

// Components Imports
import PDFModal from './components/PDFModal'
import JsonEditorModal from './components/JsonEditorModal'
import DensidadPDF from './pdfs/DensidadPDF'
import HormigonFrescoPDF from './pdfs/HormigonFrescoPDF'
import type { OrdenTrabajo as BaseOrdenTrabajo } from '@/types/otTypes'

// Extender el tipo para incluir el campo estadoOriginal que viene de la API
interface OrdenTrabajo extends BaseOrdenTrabajo {
  estadoOriginal?: string
}

// Utils Imports
import { parseDateFromBackend } from '@/utils/dateUtils'

interface Agenda {
  id: number
  titulo: string
  fechaInicio: Date | string
  cliente?: {
    nombreCliente: string
    rut?: string
  }
  obra?: {
    nombreObra: string
    numeroObra?: string
  }
  ordenesTrabajo?: OrdenTrabajo[] // Opcional ya que no lo usamos más
}

// Table Styles
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper<OrdenTrabajo>()

// Función de filtro fuzzy
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// Función de filtro global
const globalFilterFn: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// Función para obtener el nombre del servicio desde el objeto tipoOT
const getServiceName = (tipoOT: any) => {
  if (typeof tipoOT === 'object' && tipoOT?.descripcion) {
    return tipoOT.descripcion
  }
  return 'Servicio no definido'
}

// Función para obtener el código de OT desde el objeto tipoOT
const getOTCode = (tipoOT: any) => {
  if (typeof tipoOT === 'object' && tipoOT?.codigo) {
    return tipoOT.codigo
  }
  return 'Sin código'
}

const OtListTable = ({
  selectedVisit,
  selectedVisits,
  fechaInicio,
  fechaFin
}: {
  selectedVisit: Agenda | null
  selectedVisits: Agenda[]
  fechaInicio?: string
  fechaFin?: string
}) => {
  // States
  const [pageSize, setPageSize] = useState(6)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [filteredData, setFilteredData] = useState<OrdenTrabajo[]>([])
  // Estados disponibles para las órdenes de trabajo (se cargan todos desde la base de datos)
  const [estadosDisponibles, setEstadosDisponibles] = useState<string[]>([])

  const [filters, setFilters] = useState({
    servicioId: '',
    estadosSeleccionados: [] as string[],
    porCodificar: false
  })
  const [allOTs, setAllOTs] = useState<OrdenTrabajo[]>([])
  const [loading, setLoading] = useState(true)
  // Estado para los tipos de orden de trabajo desde la base de datos
  const [tiposOrdenTrabajo, setTiposOrdenTrabajo] = useState<Array<{ value: number, label: string }>>([])

  // Cargar tipos de orden de trabajo
  useEffect(() => {
    const fetchTiposOT = async () => {
      try {
        const response = await fetch('/api/tipos-orden-trabajo')
        if (response.ok) {
          const tipos = await response.json()
          const tiposFormatted = tipos.map((tipo: any) => ({
            value: tipo.id,
            label: tipo.descripcion || 'Sin descripción'
          }))
          setTiposOrdenTrabajo(tiposFormatted)
        }
      } catch (error) {
        console.error('Error al cargar tipos de OT:', error)
      }
    }

    fetchTiposOT()
  }, [])

  // Cargar todos los estados de OT desde la base de datos
  useEffect(() => {
    const fetchEstadosOT = async () => {
      try {
        const response = await fetch('/api/estados-ot')
        if (response.ok) {
          const estados = await response.json()
          // Usar los estados mapeados (palabras completas) en lugar de los códigos
          const estadosFormatted = estados
            .map((estado: any) => estado.estado)
            .filter(Boolean)
            .sort() // Ordenar alfabéticamente para mejor UX
          setEstadosDisponibles(estadosFormatted)
        }
      } catch (error) {
        console.error('Error al cargar estados de OT:', error)
        // Fallback a estados por defecto en caso de error
        setEstadosDisponibles([
          'AGENDADA',
          'CANCELADA',
          'CODIFICADA',
          'COMPLETADA',
          'DISPONIBLE',
          'EN_PROCESO',
          'EN_REVISION'
        ])
      }
    }

    fetchEstadosOT()
  }, [])
  const [agendas, setAgendas] = useState<Agenda[]>([])

  // Ya no necesitamos el estado del popover, el Tooltip se maneja automáticamente

  // Función helper para obtener información de cliente y obra desde la agenda incluida en la OT
  const getClienteObraFromOT = (ot: OrdenTrabajo) => {
    // Usar la información de la agenda que viene incluida en la respuesta de la API
    if (ot.agenda?.cliente && ot.agenda?.obra) {
      return {
        cliente: ot.agenda.cliente.nombreCliente || 'Sin cliente',
        numeroObra: ot.agenda.obra.numeroObra || 'Sin obra',
        nombreObra: ot.agenda.obra.nombreObra || 'Sin obra'
      }
    }

    return { cliente: 'Sin cliente', numeroObra: 'Sin obra', nombreObra: 'Sin obra' }
  }

  // Cargar todas las agendas
  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const response = await fetch('/api/agenda')
        if (!response.ok) throw new Error('Error al cargar agendas')
        const data = await response.json()
        setAgendas(data)
      } catch (error) {
        console.error('Error al cargar agendas:', error)
      }
    }

    fetchAgendas()
  }, [])

  // Cargar todas las OTs al iniciar y cuando cambien las fechas
  useEffect(() => {
    const fetchAllOTs = async () => {
      try {
        setLoading(true)

        // Construir parámetros de consulta
        const params = new URLSearchParams()
        if (fechaInicio) params.append('fechaInicio', fechaInicio)
        if (fechaFin) params.append('fechaFin', fechaFin)

        const url = params.toString() ? `/api/ot?${params.toString()}` : '/api/ot'
        const response = await fetch(url)

        if (!response.ok) throw new Error('Error al cargar OTs')
        const data = await response.json()

        setAllOTs(data)
        setFilteredData(data)
      } catch (error) {
        console.error('Error al cargar OTs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllOTs()
  }, [fechaInicio, fechaFin])

  // Effect para manejar los filtros y la selección de visita
  useEffect(() => {
    // Si no hay OTs, no hacer nada
    if (allOTs.length === 0) return

    // Base de datos a filtrar: todas las OTs en el rango de fechas (ya filtradas por la API)
    let baseData = allOTs

    // Filtrar por visitas seleccionadas si hay alguna
    if (selectedVisits && selectedVisits.length > 0) {
      const selectedVisitIds = selectedVisits.map(visit => visit.id)
      baseData = allOTs.filter(ot => ot.agendaId && selectedVisitIds.includes(ot.agendaId))
      console.log('OtListTable - Filtrando por visitas seleccionadas:', selectedVisitIds)
      console.log('OtListTable - OTs filtradas por visitas:', baseData.length)
    }

    console.log('OtListTable - selectedVisit:', selectedVisit?.id)
    console.log('OtListTable - selectedVisits count:', selectedVisits?.length || 0)
    console.log('OtListTable - allOTs count:', allOTs.length)
    console.log('OtListTable - fechas:', { fechaInicio, fechaFin })
    console.log('OtListTable - baseData count:', baseData.length)
    console.log('OtListTable - globalFilter:', globalFilter)

    let result = [...baseData]

    // Filtrar por servicio (tipo de OT)
    if (filters.servicioId) {
      result = result.filter(ot => ot.tipoOrdenTrabajoId === parseInt(filters.servicioId))
    }

    // Filtrar por estados seleccionados (múltiples)
    if (filters.estadosSeleccionados.length > 0) {
      result = result.filter(ot => {
        // Comparar tanto con el estado mapeado como con el estado original
        return filters.estadosSeleccionados.includes(ot.estado) ||
          (ot.estadoOriginal && filters.estadosSeleccionados.includes(ot.estadoOriginal))
      })
    }

    // Filtro "Por codificar" - mostrar OTs con estado distinto a CODIFICADA
    // Este filtro se aplica después de los filtros de servicio y estados
    // para mostrar solo las OTs que necesitan ser codificadas
    if (filters.porCodificar) {
      const beforeCount = result.length
      result = result.filter(ot => ot.estado !== 'CODIFICADA')
      console.log(`Filtro "Por codificar": ${beforeCount} -> ${result.length} OTs (excluyendo CODIFICADA)`)
    }

    // Búsqueda global - busca en todos los campos relevantes
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase().trim()

      result = result.filter(ot => {
        // Crear array con todos los valores para buscar
        const searchableValues = [
          // Campos directos de la OT
          ot.estado, // Ahora ya viene mapeado desde la API
          ot.estadoOriginal, // También buscar en el estado original (código)
          ot.numeroTarjeta,
          ot.clave,
          ot.correlativ,
          ot.fklbdocver,
          ot.fklbrutser,
          ot.id,
          // Usuario
          ot.user?.name,
          ot.user?.email,
          // Tipo de OT (campos que se muestran en la tabla)
          ot.tipoOT?.codigo,
          ot.tipoOT?.descripcion
        ]

        // Agregar información de cliente y obra
        try {
          const clienteObraInfo = getClienteObraFromOT(ot)
          searchableValues.push(
            clienteObraInfo.cliente,
            clienteObraInfo.numeroObra,
            clienteObraInfo.nombreObra
          )
        } catch (error) {
          // Silencioso - continuar sin info de cliente/obra
        }

        // Agregar fecha formateada (usando tanto createdAt como la fecha de la agenda relacionada)
        // La fecha de creación de la OT
        if (ot.createdAt) {
          try {
            const dateValue = ot.createdAt
            const dateString = dateValue instanceof Date ? dateValue.toISOString() : dateValue
            const date = parseDateFromBackend(dateString)
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()

            // Agregar ambos formatos para búsqueda
            const fechaFormateadaVista = `${day}-${month}-${year}` // Para mostrar en tabla
            const fechaFormateadaFiltro = `${year}-${month}-${day}` // Para filtrar por rango

            searchableValues.push(fechaFormateadaVista, fechaFormateadaFiltro)
          } catch (error) {
            // Silencioso - continuar sin fecha formateada
          }
        }

        // También agregar la fecha de la agenda relacionada (incluida en la OT)
        try {
          const agenda = ot.agenda as any // Casting temporal para evitar problemas de tipo
          if (agenda?.fechaInicio) {
            const dateString = agenda.fechaInicio instanceof Date ? agenda.fechaInicio.toISOString() : agenda.fechaInicio
            const date = parseDateFromBackend(dateString.toString())
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()

            const fechaAgendaVista = `${day}-${month}-${year}`
            const fechaAgendaFiltro = `${year}-${month}-${day}`

            searchableValues.push(fechaAgendaVista, fechaAgendaFiltro)
          }
        } catch (error) {
          // Silencioso - continuar sin fecha de agenda
        }

        // Filtrar valores válidos y convertir a string
        const validValues = searchableValues
          .filter(value => value != null && value !== '')
          .map(value => String(value).toLowerCase())

        // Buscar el término en cualquiera de los valores
        return validValues.some(value => value.includes(searchTerm))
      })
    }

    console.log('OtListTable - result count after all filters:', result.length)
    setFilteredData(result)
  }, [selectedVisit, selectedVisits, allOTs, filters, globalFilter, fechaInicio, fechaFin])

  // Handler para limpiar filtros
  const handleClearFilters = () => {
    setFilters({ servicioId: '', estadosSeleccionados: [], porCodificar: false })
    setGlobalFilter('')
    console.log('Todos los filtros han sido limpiados')
  }

  // Handler para limpiar solo los estados seleccionados
  const handleClearEstados = () => {
    setFilters(prev => ({ ...prev, estadosSeleccionados: [] }))
  }

  // Handler para manejar los cambios en los filtros de texto
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }))
  }

  // Handler para manejar el cambio del Select de servicio
  const handleServicioChange = (e: SelectChangeEvent<string>) => {
    setFilters(prev => ({ ...prev, servicioId: e.target.value }))
  }

  // Handler para manejar el cambio del Select de estados múltiples
  const handleEstadosChange = (e: SelectChangeEvent<string[]>) => {
    const value = e.target.value as string[]
    setFilters(prev => ({ ...prev, estadosSeleccionados: value }))
  }

  // Handler para manejar el checkbox "Por codificar"
  const handlePorCodificarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked
    setFilters(prev => ({ ...prev, porCodificar: isChecked }))
    console.log(`Filtro "Por codificar" ${isChecked ? 'activado' : 'desactivado'}`)
  }

  const handlePDFClick = (ot: OrdenTrabajo) => {
    console.log('OT seleccionada:', ot) // Para debug
    setSelectedOT(ot)
    setPdfModalOpen(true)
  }

  const handleEditClick = (ot: OrdenTrabajo) => {
    console.log('Editar OT JSON:', ot.id)
    setSelectedOT(ot)
    setJsonModalOpen(true)
  }

  const handleJsonSave = () => {
    // Recargar datos después de guardar el JSON
    window.location.reload()
  }

  const renderPDFComponent = (ot: OrdenTrabajo) => {
    console.log('Rendering PDF for type:', ot.tipoOT) // Debug log

    const codigo = ot.tipoOT?.codigo

    switch (codigo) {
      case 'R-12-03': // Control de Compactación
        return <DensidadPDF ot={ot} />
      case 'R-12-39': // Muestreo de Hormigón Fresco
        return <HormigonFrescoPDF ot={ot} />
      default:
        // Temporalmente mostrar un mensaje para los tipos no implementados
        return <Typography>PDF en desarrollo para el tipo de OT: {getServiceName(ot.tipoOT)}</Typography>
    }
  }

  // Columns Definition
  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: any) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            indeterminate={table.getIsSomeRowsSelected()}
          />
        ),
        cell: ({ row }: any) => <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
        size: 50
      },
      columnHelper.accessor('tipoOT', {
        header: 'OT',
        cell: info => <Typography>{getOTCode(info.getValue())}</Typography>
      }),
      columnHelper.accessor('createdAt', {
        header: 'FECHA',
        cell: info => {
          const dateValue = info.getValue()
          // Si ya es una fecha, convertir a string primero
          const dateString = dateValue instanceof Date ? dateValue.toISOString() : dateValue
          const date = parseDateFromBackend(dateString)
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          const formattedDate = `${day}-${month}-${year}`
          return <Typography>{formattedDate}</Typography>
        }
      }),
      columnHelper.accessor(row => row.user?.name || 'Sin asignar', {
        id: 'laboratorista',
        header: 'LABORATORISTA',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor(
        row => {
          // Usar la información de la agenda incluida en la OT
          return getClienteObraFromOT(row)
        },
        {
          id: 'cliente',
          header: 'CLIENTE/OBRA',
          cell: info => {
            const data = info.getValue()
            return (
              <Tooltip title={`Nombre Obra: ${data.nombreObra}`} arrow>
                <Box sx={{ cursor: 'pointer' }}>
                  <Typography className='capitalize' color='text.primary' variant='body2'>
                    {data.cliente}
                  </Typography>
                  <Typography className='capitalize' color='text.secondary' variant='caption'>
                    {data.numeroObra}
                  </Typography>
                </Box>
              </Tooltip>
            )
          }
        }
      ),
      columnHelper.accessor('tipoOT', {
        id: 'servicio',
        header: 'SERVICIO',
        cell: info => <Typography>{getServiceName(info.getValue())}</Typography>
      }),
      columnHelper.accessor(row => row.numeroTarjeta, {
        id: 'numeroTarjeta',
        header: 'N° TARJETA',
        cell: info => {
          const numeroTarjeta = info.getValue()
          if (!numeroTarjeta) return <Typography>-</Typography>

          const tarjetas = numeroTarjeta.split(',').map(t => t.trim())

          if (tarjetas.length <= 2) {
            return (
              <Box>
                {tarjetas.map((tarjeta, index) => (
                  <Typography key={index} variant='body2'>
                    {tarjeta}
                  </Typography>
                ))}
              </Box>
            )
          }

          // Si hay más de 2 tarjetas, mostrar las primeras 2 y "...ver más"
          const todasLasTarjetas = tarjetas.join('\n')

          return (
            <Box>
              <Typography variant='body2'>{tarjetas[0]}</Typography>
              <Typography variant='body2'>{tarjetas[1]}</Typography>
              <Tooltip title={
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 'bold', mb: 1, color: 'white' }}>
                    Números de Tarjeta:
                  </Typography>
                  {tarjetas.map((tarjeta, index) => (
                    <Typography key={index} variant='body2' sx={{ color: 'white' }}>
                      • {tarjeta}
                    </Typography>
                  ))}
                </Box>
              } arrow>
                <Typography
                  variant='caption'
                  sx={{
                    cursor: 'pointer',
                    color: 'primary.main',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  ...ver más
                </Typography>
              </Tooltip>
            </Box>
          )
        }
      }),
      columnHelper.accessor('estado', {
        header: 'ESTADO',
        cell: info => {
          const estado = info.getValue()
          const estadoFormateado = estado.replace(/_/g, ' ')

          // Determinar el color basado en el estado completo
          let color: 'warning' | 'success' | 'info' | 'error' | 'default' = 'info'
          if (estado === 'EN_REVISION') {
            color = 'warning'
          } else if (estado === 'DISPONIBLE') {
            color = 'success'
          } else if (estado === 'COMPLETADA') {
            color = 'success'
          } else if (estado === 'CANCELADA') {
            color = 'error'
          } else if (estado === 'AGENDADA') {
            color = 'info'
          } else if (estado === 'EN_PROCESO') {
            color = 'warning'
          }

          return (
            <Chip
              label={estadoFormateado}
              size='small'
              color={color}
              className='capitalize'
            />
          )
        }
      }),
      columnHelper.accessor('id', {
        header: 'ACCIONES',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton onClick={() => handlePDFClick(row.original)}>
              <i className='ri-file-pdf-line' style={{ fontSize: '1.2rem', color: '#FF0000' }} />
            </IconButton>
            <IconButton
              onClick={() => handleEditClick(row.original)}
            >
              <i className='ri-edit-line' style={{ fontSize: '1.2rem', color: '#1976d2' }} />
            </IconButton>
            <IconButton
              onClick={() =>
                window.open(`http://localhost:3001/en/apps/internalcontrol?otId=${row.original.id}`, '_blank')
              }
            >
              <i className='ri-code-s-slash-line' style={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton>
              <i className='ri-more-2-fill' style={{ fontSize: '1.2rem' }} />
            </IconButton>
          </div>
        )
      })
    ],
    [selectedVisit, agendas]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
      global: globalFilterFn
    },
    state: {
      pagination: { pageSize, pageIndex }
      // Removido globalFilter del state ya que manejamos el filtro manualmente
    },
    // Removido onGlobalFilterChange ya que manejamos el filtro manualmente
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
    // Removido getFilteredRowModel() ya que filtramos los datos manualmente
  })

  // Título dinámico de la tabla
  const tableTitle = selectedVisits && selectedVisits.length > 0
    ? `Órdenes de Trabajo - ${selectedVisits.length} visita${selectedVisits.length > 1 ? 's' : ''} seleccionada${selectedVisits.length > 1 ? 's' : ''}`
    : (fechaInicio && fechaFin)
      ? `Órdenes de Trabajo (${fechaInicio} - ${fechaFin})`
      : selectedVisit
        ? `Órdenes de Trabajo - ${selectedVisit.cliente?.nombreCliente || ''}`
        : 'Todas las Órdenes de Trabajo'

  // Mostramos mensaje de carga mientras se obtienen las OTs
  if (loading) {
    return (
      <Card>
        <CardHeader title='Cargando Órdenes de Trabajo...' />
        <Box p={4} textAlign='center'>
          <Typography>Cargando datos...</Typography>
        </Box>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader title={tableTitle} />
        <Divider />

        {/* Filtros */}
        <Box p={3}>
          <Grid container spacing={2} alignItems='center'>
            {/* Primera Fila */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size='small'>
                <InputLabel id='servicio-label'>Servicio</InputLabel>
                <Select
                  labelId='servicio-label'
                  value={filters.servicioId}
                  label='Servicio'
                  onChange={handleServicioChange}
                >
                  <MenuItem value=''>
                    <em>Todos los servicios</em>
                  </MenuItem>
                  {tiposOrdenTrabajo.map(tipo => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size='small'>
                <InputLabel id='estados-label'>Estado</InputLabel>
                <Select
                  labelId='estados-label'
                  multiple
                  value={filters.estadosSeleccionados}
                  label='Estado'
                  onChange={handleEstadosChange}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {estadosDisponibles.map(estado => (
                    <MenuItem key={estado} value={estado}>
                      <Checkbox checked={filters.estadosSeleccionados.indexOf(estado) > -1} />
                      <Typography>{estado.replace('_', ' ')}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant='outlined'
                size='small'
                onClick={handleClearEstados}
                disabled={filters.estadosSeleccionados.length === 0}
                title='Limpiar estados seleccionados'
                sx={{
                  minWidth: 'auto',
                  px: 1,
                  height: '40px' // Misma altura que el Select
                }}
              >
                <i className='ri-close-line' style={{ fontSize: '1rem' }} />
              </Button>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Box display='flex' alignItems='center'>
                <Checkbox
                  checked={filters.porCodificar}
                  onChange={handlePorCodificarChange}
                  size='small'
                />
                <Typography variant='body2'>Por codificar</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                size='small'
                placeholder='Buscar'
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                InputProps={{
                  startAdornment: <i className='ri-search-line' style={{ marginRight: '8px', color: '#aaa' }} />
                }}
              />
            </Grid>

            {/* Segunda Fila */}
            <Grid item xs={12} sm={2}>
              <Button variant='contained' fullWidth onClick={handleClearFilters}>
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Tabla */}
        <Box className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '1rem' }}>
                    No se encontraron órdenes de trabajo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>

        {/* Paginación */}
        <TablePagination
          component='div'
          count={filteredData.length}
          rowsPerPage={pageSize}
          page={pageIndex}
          onPageChange={(_, page) => setPageIndex(page)}
          onRowsPerPageChange={e => setPageSize(Number(e.target.value))}
          rowsPerPageOptions={[6, 10, 25, 50]}
        />
      </Card>

      {/* Modal de PDF */}
      {selectedOT && (
        <PDFModal open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} ot={selectedOT}>
          {renderPDFComponent(selectedOT)}
        </PDFModal>
      )}

      {/* Modal de edición JSON */}
      {selectedOT && (
        <JsonEditorModal
          open={jsonModalOpen}
          onClose={() => setJsonModalOpen(false)}
          ot={selectedOT}
          onSave={handleJsonSave}
        />
      )}

    </>
  )
}

export default OtListTable
