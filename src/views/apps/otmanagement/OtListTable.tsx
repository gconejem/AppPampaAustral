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
import DensidadPDF from './pdfs/DensidadPDF'
import HormigonFrescoPDF from './pdfs/HormigonFrescoPDF'
import type { OrdenTrabajo as OTType } from '@/types/otTypes'

// Utils Imports
import { parseDateFromBackend } from '@/utils/dateUtils'

// Interfaces
interface OrdenTrabajo extends OTType {
  user?: {
    id: string
    name?: string
    email?: string
  }
}

interface Agenda {
  id: number
  titulo: string
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

const OtListTable = ({ selectedVisit }: { selectedVisit: Agenda | null }) => {
  // States
  const [pageSize, setPageSize] = useState(6)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [filteredData, setFilteredData] = useState<OrdenTrabajo[]>([])
  // Estados disponibles para las órdenes de trabajo
  const estadosDisponibles = [
    'EN_REVISION',
    'DISPONIBLE',
    'PENDIENTE',
    'COMPLETADA',
    'CANCELADA'
  ]

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
  const [agendas, setAgendas] = useState<Agenda[]>([])

  // Ya no necesitamos el estado del popover, el Tooltip se maneja automáticamente

  // Función helper para obtener información de cliente y obra por agendaId
  const getClienteObraByAgendaId = (agendaId: string | number | undefined) => {
    if (!agendaId) return { cliente: 'Sin cliente', numeroObra: 'Sin obra', nombreObra: 'Sin obra' }

    const agendaIdNum = typeof agendaId === 'string' ? parseInt(agendaId) : agendaId
    const agenda = agendas.find(a => a.id === agendaIdNum)

    if (agenda) {
      return {
        cliente: agenda.cliente?.nombreCliente || 'Sin cliente',
        numeroObra: agenda.obra?.numeroObra || 'Sin obra',
        nombreObra: agenda.obra?.nombreObra || 'Sin obra'
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

  // Cargar todas las OTs al iniciar
  useEffect(() => {
    const fetchAllOTs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/ot')

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
  }, [])

  // Effect para manejar los filtros y la selección de visita
  useEffect(() => {
    // Si no hay OTs, no hacer nada
    if (allOTs.length === 0) return

    // Base de datos a filtrar: todas las OTs o las de la visita seleccionada
    const baseData = selectedVisit
      ? allOTs.filter(ot => ot.agendaId === selectedVisit.id)
      : allOTs

    console.log('OtListTable - selectedVisit:', selectedVisit?.id)
    console.log('OtListTable - allOTs count:', allOTs.length)
    console.log('OtListTable - baseData count:', baseData.length)

    let result = [...baseData]

    // Filtrar por servicio (tipo de OT)
    if (filters.servicioId) {
      result = result.filter(ot => ot.tipoOrdenTrabajoId === parseInt(filters.servicioId))
    }

    // Filtrar por estados seleccionados (múltiples)
    if (filters.estadosSeleccionados.length > 0) {
      result = result.filter(ot => filters.estadosSeleccionados.includes(ot.estado))
    }

    // Filtro "Por codificar" - por ahora no hace nada según requerimiento
    // if (filters.porCodificar) {
    //   // Lógica futura para filtrar por codificar
    // }

    // Búsqueda global - busca en todos los campos relevantes
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase().trim()

      result = result.filter(ot => {
        // Crear array con todos los valores para buscar
        const searchableValues = [
          // Campos directos de la OT
          ot.estado,
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
          const clienteObraInfo = getClienteObraByAgendaId(ot.agendaId)
          searchableValues.push(
            clienteObraInfo.cliente,
            clienteObraInfo.numeroObra,
            clienteObraInfo.nombreObra
          )
        } catch (error) {
          // Silencioso - continuar sin info de cliente/obra
        }

        // Agregar fecha formateada
        if (ot.createdAt) {
          try {
            const dateValue = ot.createdAt
            const dateString = dateValue instanceof Date ? dateValue.toISOString() : dateValue
            const date = parseDateFromBackend(dateString)
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const year = date.getFullYear()
            const fechaFormateada = `${day}-${month}-${year}`
            searchableValues.push(fechaFormateada)
          } catch (error) {
            // Silencioso - continuar sin fecha formateada
          }
        }

        // Filtrar valores válidos y convertir a string
        const validValues = searchableValues
          .filter(value => value != null && value !== '')
          .map(value => String(value).toLowerCase())

        // Buscar el término en cualquiera de los valores
        return validValues.some(value => value.includes(searchTerm))
      })
    }

    setFilteredData(result)
  }, [selectedVisit, allOTs, filters, globalFilter])

  // Handler para limpiar filtros
  const handleClearFilters = () => {
    setFilters({ servicioId: '', estadosSeleccionados: [], porCodificar: false })
    setGlobalFilter('')
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
    setFilters(prev => ({ ...prev, porCodificar: e.target.checked }))
  }

  const handlePDFClick = (ot: OrdenTrabajo) => {
    console.log('OT seleccionada:', ot) // Para debug
    setSelectedOT(ot)
    setPdfModalOpen(true)
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
          // Usar el agendaId para obtener información del cliente y obra
          const agendaId = row.agendaId
          return getClienteObraByAgendaId(agendaId)
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
        cell: info => (
          <Chip
            label={info.getValue().replace('_', ' ')}
            size='small'
            color={
              info.getValue() === 'EN REVISION' ? 'warning' : info.getValue() === 'DISPONIBLE' ? 'success' : 'info'
            }
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('id', {
        header: 'ACCIONES',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton onClick={() => handlePDFClick(row.original)}>
              <i className='ri-file-pdf-line' style={{ fontSize: '1.2rem', color: '#FF0000' }} />
            </IconButton>
            <IconButton
              onClick={() => {
                // TODO: Implementar funcionalidad de edición
                console.log('Editar OT:', row.original.id)
              }}
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
  const tableTitle = selectedVisit
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
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={3}>
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

    </>
  )
}

export default OtListTable
