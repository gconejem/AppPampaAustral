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
import { toast } from 'react-hot-toast'
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
import JsonEditorModal from './components/JsonEditorModal'
import type { OrdenTrabajo as BaseOrdenTrabajo } from '@/types/otTypes'

// Extender el tipo para incluir el campo estadoOriginal que viene de la API
interface OrdenTrabajo extends BaseOrdenTrabajo {
  estadoOriginal?: string
}

// Utils Imports
import { parseDateFromBackend } from '@/utils/dateUtils'


// Imports para permisos - NUEVO
import { usePermissions } from '@/hooks/usePermissions'
import { permisos } from '@/permisos/permisos'


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

const getOTNumber = (ot: OrdenTrabajo) => {
  if (ot.numeroCorrelativo != null) {
    return String(ot.numeroCorrelativo).padStart(6, '0')
  }

  return getOTCode(ot.tipoOT)
}

const OtListTable = ({
  selectedVisit,
  selectedVisits,
  fechaInicio,
  fechaFin,
  refreshTrigger
}: {
  selectedVisit: Agenda | null
  selectedVisits: Agenda[]
  fechaInicio?: string
  fechaFin?: string
  refreshTrigger?: number
}) => {
  // States
  const [pageSize, setPageSize] = useState(6)
  const [pageIndex, setPageIndex] = useState(0)
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [filteredData, setFilteredData] = useState<OrdenTrabajo[]>([])
  // Estados disponibles para las órdenes de trabajo (se cargan todos desde la base de datos)
  const [estadosDisponibles, setEstadosDisponibles] = useState<string[]>([])


  // Hook de permisos
  const { hasPermission } = usePermissions()

  // Verificar si el usuario solo tiene permisos de lectura
  const soloLectura =
    hasPermission(permisos.empresa.ver) &&
    !hasPermission(permisos.empresa.crear) &&
    !hasPermission(permisos.empresa.editar) &&
    !hasPermission(permisos.empresa.eliminar)


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

  // Cargar OTs basadas en visitas seleccionadas o rango de fechas
  useEffect(() => {
    const fetchOTs = async () => {
      try {
        setLoading(true)

        // Construir parámetros de consulta
        const params = new URLSearchParams()

        // Si hay visitas seleccionadas, filtrar por sus IDs
        if (selectedVisits && selectedVisits.length > 0) {
          const agendaIds = selectedVisits.map(visit => visit.id.toString())
          params.append('agendaIds', agendaIds.join(','))
          console.log('Cargando OTs para visitas:', agendaIds)
        } else {
          // Si no hay visitas seleccionadas, usar rango de fechas
          if (fechaInicio) params.append('fechaInicio', fechaInicio)
          if (fechaFin) params.append('fechaFin', fechaFin)
        }

        const url = params.toString() ? `/api/ot?${params.toString()}` : '/api/ot'
        console.log('Fetching OTs from:', url)
        const response = await fetch(url)

        if (!response.ok) throw new Error('Error al cargar OTs')
        const data = await response.json()

        console.log('OTs cargadas:', data.length)
        setAllOTs(data)
        setFilteredData(data)
      } catch (error) {
        console.error('Error al cargar OTs:', error)
        setAllOTs([])
        setFilteredData([])
      } finally {
        setLoading(false)
      }
    }

    fetchOTs()
  }, [selectedVisits, fechaInicio, fechaFin, refreshTrigger])

  // Effect para manejar los filtros
  useEffect(() => {
    // Si no hay OTs, no hacer nada
    if (allOTs.length === 0) return

    console.log('OtListTable - Aplicando filtros locales')
    console.log('OtListTable - allOTs count:', allOTs.length)
    console.log('OtListTable - globalFilter:', globalFilter)

    let result = [...allOTs]

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
          ot.numeroCorrelativo != null ? String(ot.numeroCorrelativo).padStart(6, '0') : undefined,
          ot.numeroCorrelativo != null ? String(ot.numeroCorrelativo) : undefined,
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
  }, [allOTs, filters, globalFilter])

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

  const handlePDFClick = async (ot: OrdenTrabajo) => {
    console.log('OT seleccionada para PDF:', ot) // Para debug

    try {
      // Llamar al endpoint del backend para generar y descargar el PDF
      const response = await fetch(`/api/ot/${ot.id}/pdf`)

      if (!response.ok) {
        throw new Error('Error al generar el PDF')
      }

      // Obtener el blob del PDF
      const blob = await response.blob()

      // Crear URL temporal para el blob
      const url = window.URL.createObjectURL(blob)

      // Crear elemento <a> para forzar la descarga
      const link = document.createElement('a')
      link.href = url

      // Generar nombre del archivo
      const tipoCode = ot.tipoOT?.codigo || 'OT'
      const fileName = `${tipoCode}_${getOTNumber(ot)}.pdf`
      link.download = fileName

      // Simular click para iniciar descarga
      document.body.appendChild(link)
      link.click()

      // Limpiar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('PDF generado y descargado exitosamente')
    } catch (error) {
      console.error('Error al descargar PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }

  const handleEditClick = async (ot: OrdenTrabajo) => {
    console.log('Editar OT JSON:', ot.id)

    try {
      // Cargar datos actualizados desde el backend
      const response = await fetch(`/api/ot/${ot.id}`)
      if (!response.ok) {
        throw new Error('Error al cargar los datos de la OT')
      }

      const otUpdated = await response.json()
      setSelectedOT(otUpdated)
      setJsonModalOpen(true)
    } catch (error) {
      console.error('Error al cargar la OT:', error)
      toast.error('Error al cargar los datos de la OT')
    }
  }

  const handleJsonSave = async () => {
    // Mostrar mensaje de éxito sin recargar la página
    toast.success('JSON guardado exitosamente')

    // Recargar los datos de las OTs para reflejar los cambios
    try {
      setLoading(true)

      // Construir parámetros de consulta (misma lógica que en el useEffect)
      const params = new URLSearchParams()

      // Si hay visitas seleccionadas, filtrar por sus IDs
      if (selectedVisits && selectedVisits.length > 0) {
        const agendaIds = selectedVisits.map(visit => visit.id.toString())
        params.append('agendaIds', agendaIds.join(','))
      } else {
        // Si no hay visitas seleccionadas, usar rango de fechas
        if (fechaInicio) params.append('fechaInicio', fechaInicio)
        if (fechaFin) params.append('fechaFin', fechaFin)
      }

      const url = params.toString() ? `/api/ot?${params.toString()}` : '/api/ot'
      const response = await fetch(url)

      if (!response.ok) throw new Error('Error al cargar OTs')
      const data = await response.json()

      setAllOTs(data)
      setFilteredData(data)
    } catch (error) {
      console.error('Error al recargar OTs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendNotification = async (ot: OrdenTrabajo) => {
    console.log('📧 Enviando notificación para OT:', ot.id)

    try {

      // 1. Obtener PDF
      const pdfResponse = await fetch(`/api/ot/${ot.id}/pdf`)
      if (!pdfResponse.ok) throw new Error('Error al obtener el PDF')

      const blob = await pdfResponse.blob()

      // 2. Convertir a base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1]
          resolve(base64data)
        }
        reader.readAsDataURL(blob)
      })

      const tipoCode = ot.tipoOT?.codigo || 'OT'
      const fileName = `${tipoCode}_${getOTNumber(ot)}.pdf`

      // 3. Obtener información
      const clienteObraInfo = getClienteObraFromOT(ot)

      console.log('🔍 Estructura de la agenda/obra:', {
        agenda: ot.agenda,
        obra: ot.agenda?.obra,
        camposDisponibles: ot.agenda?.obra ? Object.keys(ot.agenda.obra) : []
      })

      const projectLocation = ot.agenda?.obra?.direccion ||
        ot.agenda?.obra?.ubicacion ||
        'Dirección no especificada'

      console.log('📍 Dirección de la obra:', projectLocation)

      // 🔍 Determinar qué campo usar para el correlativo
      // Probar en este orden de prioridad:
      const correlativo = ot.numeroTarjeta ||           // 1. numeroTarjeta (más común)
        ot.correlativ ||               // 2. correlativ (sin 'o')
        (ot as any).correlativo ||     // 3. correlativo (con 'o')
        ot.clave ||                    // 4. clave
        ot.fklbdocver ||               // 5. fklbdocver
        ot.id.toString()               // 6. Fallback: ID de la OT

      console.log('📋 Correlativo seleccionado:', correlativo)


      // 4. Enviar email
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: ot.agenda?.cliente?.email || 'contactopampaustral@gmail.com',
          clientName: clienteObraInfo.cliente,
          fecha: new Date().toLocaleDateString('es-CL'),
          hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          projectName: clienteObraInfo.nombreObra,
          projectLocation: projectLocation,
          tecnicoName: ot.user?.name || 'Sin asignar',
          recepcionName: 'Cliente',
          orders: [{
            correlativo: correlativo,
            descripcion: getServiceName(ot.tipoOT),
            formato: 'Formato Digital'
          }],
          attachments: [{
            filename: fileName,
            content: base64,
            contentType: 'application/pdf',
            encoding: 'base64'
          }]
        })
      })

      if (!response.ok) throw new Error('Error al enviar email')

      // 5. Marcar como enviado en BD
      await fetch(`/api/ot/${ot.id}/mark-notification-sent`, {
        method: 'PATCH'
      })

      toast.success('✅ Notificación enviada correctamente')

      // 6. Recargar datos
      handleJsonSave() // Reutilizar función existente

    } catch (error: any) {
      console.error('❌ Error:', error)
      toast.error('Error al enviar notificación')
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
      columnHelper.accessor('numeroCorrelativo', {
        header: 'OT',
        cell: info => {
          const n = info.getValue() as number | null | undefined
          return (
            <Typography>
              {n != null ? String(n).padStart(6, '0') : getOTCode(info.row.original.tipoOT)}
            </Typography>
          )
        }
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
        cell: ({ row }) => {
          const ot = row.original
          const puedeEnviarNotificacion = ot.estado === 'COMPLETADA'
          const yaEnviado = ot.notificacionEnviada // Campo nuevo en BD

          return (
            <div className='flex items-center gap-2'>
              {/* Botón PDF existente */}
              <IconButton disabled={soloLectura} onClick={() => handlePDFClick(ot)}>
                <i className='ri-file-pdf-line' style={{ fontSize: '1.2rem', color: '#FF0000' }} />
              </IconButton>

              {/* Botón Editar existente */}
              <IconButton disabled={soloLectura} onClick={() => handleEditClick(ot)}>
                <i className='ri-edit-line' style={{ fontSize: '1.2rem', color: '#1976d2' }} />
              </IconButton>

              {/* ✅ NUEVO: Botón Enviar Notificación */}
              {puedeEnviarNotificacion && (
                <Tooltip title={yaEnviado ? 'Notificación ya enviada' : 'Enviar notificación al cliente'}>
                  <IconButton
                    onClick={() => handleSendNotification(ot)}
                    disabled={yaEnviado || soloLectura}
                  >
                    {yaEnviado ? (
                      <i className='ri-checkbox-circle-line' style={{ fontSize: '1.2rem', color: '#4caf50' }} />
                    ) : (
                      <i className='ri-mail-send-line' style={{ fontSize: '1.2rem', color: '#2196F3' }} />
                    )}
                  </IconButton>
                </Tooltip>
              )}

              {/* Botones existentes */}
              <IconButton
                disabled={soloLectura}
                onClick={() =>
                  window.location.href = `${window.location.origin}/en/apps/internalcontrol?otId=${ot.id}`
                }
              >
                <i className='ri-code-s-slash-line' style={{ fontSize: '1.2rem' }} />
              </IconButton>
              <IconButton disabled={soloLectura}>
                <i className='ri-more-2-fill' style={{ fontSize: '1.2rem' }} />
              </IconButton>
            </div>
          )
        }
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
    ? `Órdenes de Trabajo - ${selectedVisits.length} visita${selectedVisits.length > 1 ? 's' : ''} seleccionada${selectedVisits.length > 1 ? 's' : ''} (${filteredData.length} OTs)`
    : (fechaInicio && fechaFin)
      ? `Órdenes de Trabajo (${fechaInicio} - ${fechaFin}) - ${filteredData.length} OTs`
      : `Todas las Órdenes de Trabajo - ${filteredData.length} OTs`

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
                    <em>Servicios Agendados</em>
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
                disabled={filters.estadosSeleccionados.length === 0 || soloLectura}
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
              <Button disabled={soloLectura} variant='contained' fullWidth onClick={handleClearFilters}>
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
