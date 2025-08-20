'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

// Next Imports
import { useParams } from 'next/navigation'

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
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import type { SelectChangeEvent } from '@mui/material/Select'
import Select from '@mui/material/Select'
import FormControlLabel from '@mui/material/FormControlLabel'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Switch from '@mui/material/Switch'
import SearchIcon from '@mui/icons-material/Search'

// Third-party Imports
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { es } from 'date-fns/locale'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import TableFilters from './TableFilters'
import AddUserDrawer from './AddUserDrawer'
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import PDFModal from './components/PDFModal'
import AceptacionVisitaPDF from './pdfs/AceptacionVisitaPDF'
import type { OrdenTrabajo } from '@/types/otTypes'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { parseDateFromBackend } from '@/utils/dateUtils'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
    global: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type UserRoleType = {
  [key: string]: { icon: string; color: string }
}

type UserStatusType = {
  [key: string]: ThemeColor
}

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

// Filtro global personalizado que busca en todas las columnas relevantes
const globalFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const searchValue = value.toLowerCase()
  const rowData = row.original as Agenda

  // Campos donde buscar
  const searchFields = [
    // Fecha (formateada)
    rowData.fechaInicio ? parseDateFromBackend(rowData.fechaInicio.toString()).toLocaleDateString('es-ES') : '',
    // Hora (formateada HH:MM)
    rowData.fechaInicio ? (() => {
      const date = parseDateFromBackend(rowData.fechaInicio.toString())
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })() : '',
    // Laboratorista
    rowData.asignados?.[0]?.user?.name || '',
    // Cliente
    rowData.cliente?.nombreCliente || '',
    // RUT del cliente
    rowData.cliente?.rut || '',
    // Nombre de obra
    rowData.obra?.nombreObra || '',
    // Número de obra
    rowData.obra?.numeroObra || '',
    // Comuna
    rowData.obra?.comuna || '',
    // Región
    rowData.obra?.region || '',
    // Estado
    rowData.estado || '',
    // Servicios
    ...(rowData.servicios?.map(s => s.servicio) || []),
    ...(rowData.servicios?.map(s => s.codigo) || []),
    ...(rowData.servicios?.map(s => s.observacion) || []),
    // Título de la visita
    rowData.titulo || '',
    // Tipo de visita
    rowData.tipoVisita || '',
    // Hora llegada y hora salida (datos adicionales de tiempo)
    rowData.horaLlegada || '',
    rowData.horaSalida || ''
  ]

  // Buscar en todos los campos
  const found = searchFields.some(field =>
    field && field.toString().toLowerCase().includes(searchValue)
  )

  // Para compatibilidad con react-table, retornamos el ranking
  const itemRank = rankItem(searchFields.join(' '), value)
  addMeta({ itemRank })

  return found
}

const userRoleObj: UserRoleType = {
  admin: { icon: 'ri-vip-crown-line', color: 'error' },
  author: { icon: 'ri-computer-line', color: 'warning' },
  editor: { icon: 'ri-edit-box-line', color: 'info' },
  maintainer: { icon: 'ri-pie-chart-2-line', color: 'success' },
  subscriber: { icon: 'ri-user-3-line', color: 'primary' }
}

const userStatusObj: UserStatusType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary'
}

// Types
interface Agenda {
  id: number
  titulo: string
  tipoVisita: string
  fechaInicio: Date
  fechaFin: Date
  estado: string
  horaLlegada?: string
  horaSalida?: string
  movilizacion?: string
  kmAdicionales?: string
  cliente?: {
    nombreCliente: string
    rut?: string
  }
  obra?: {
    nombreObra: string
    numeroObra?: string
    comuna?: string
    region?: string
  }
  asignados?: Array<{
    userId: string
    user?: {
      name: string
    }
  }>
  ordenesTrabajo?: OrdenTrabajo[]
  servicios?: Array<{
    id: number
    codigo: string
    servicio: string
    cantidad: number
    observacion?: string
    esSegundaVisita: boolean
  }>
}

const VisitListTable = ({
  tableData,
  onVisitSelect,
  selectedVisit
}: {
  tableData: Agenda[]
  onVisitSelect: (visit: Agenda | null) => void
  selectedVisit: Agenda | null
}) => {
  // Definir todos los estados disponibles
  const todosLosEstados = [
    'CREADA',
    'ELIMINADA',
    'AGENDADA',
    'SUSPENDIDA',
    'SUSPENDIDA_TERRENO',
    'COMPLETADA',
    'EN_REVISION',
    'ANULADA',
    'RECIBIDA_OK',
    'CODIFICADA'
  ]

  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null) // Solo permite una selección de fila
  const [data, setData] = useState<Agenda[]>([])
  const [loading, setLoading] = useState(false)
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [selectedLaboratorista, setSelectedLaboratorista] = useState('')
  const [selectedEstado, setSelectedEstado] = useState<string[]>(todosLosEstados) // Inicializar con todos los estados seleccionados
  const [porRecibir, setPorRecibir] = useState(true)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [detallesModalOpen, setDetallesModalOpen] = useState(false)
  const [editedVisit, setEditedVisit] = useState<Partial<Agenda>>({})
  const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false)
  const [selectedVisitForStatus, setSelectedVisitForStatus] = useState<Agenda | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success')

  // Nuevo estado para manejar selección múltiple
  const [selectedVisits, setSelectedVisits] = useState<Agenda[]>([])
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [bulkNewStatus, setBulkNewStatus] = useState('')

  // Estado para el modal de cambio de estado especial (botón !)
  const [isSpecialStatusOpen, setIsSpecialStatusOpen] = useState(false)
  const [specialStatus, setSpecialStatus] = useState('')

  // Estado para laboratoristas
  const [laboratoristas, setLaboratoristas] = useState<Array<{ id: string, name: string }>>([])
  const [loadingLaboratoristas, setLoadingLaboratoristas] = useState(false)

  // Estados para edición de servicios
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null)
  const [editedServiceData, setEditedServiceData] = useState<{
    cantidad: number
    observacion: string
  }>({ cantidad: 0, observacion: '' })

  // Estados para el buscador de servicios (similar a AddEventSidebar)
  const [serviciosBuscador, setServiciosBuscador] = useState<any[]>([])
  const [servicioSeleccionadoBuscador, setServicioSeleccionadoBuscador] = useState<any | null>(null)
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('Terreno')
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [tipos, setTipos] = useState<string[]>([])
  const [familias, setFamilias] = useState<Array<{ id: number; nombre: string; areaId: number }>>([])
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [serviciosBuscadorAnchorEl, setServiciosBuscadorAnchorEl] = useState<null | HTMLElement>(null)
  const [loadingProductos, setLoadingProductos] = useState(false)
  const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
  const [filteredProductos, setFilteredProductos] = useState<any[]>([])
  const [totalProductos, setTotalProductos] = useState(0)
  const [productsPage, setProductsPage] = useState(0)
  const ITEMS_PER_PAGE = 10

  // Estados para filtros de cliente y obra
  const [selectedCliente, setSelectedCliente] = useState<{ clienteId: number, nombreCliente: string, rut: string } | null>(null)
  const [selectedObra, setSelectedObra] = useState<{ obraId: number, nombreObra: string, numeroObra: string } | null>(null)
  const [clientes, setClientes] = useState<Array<{ clienteId: number, nombreCliente: string, rut: string }>>([])
  const [obras, setObras] = useState<Array<{ obraId: number, nombreObra: string, numeroObra: string }>>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loadingObras, setLoadingObras] = useState(false)

  // Estados para búsqueda por texto
  const [clienteSearchValue, setClienteSearchValue] = useState('')
  const [obraSearchValue, setObraSearchValue] = useState('')
  const [laboratoristaSearchValue, setLaboratoristaSearchValue] = useState('')

  // Estado para el popover de obra
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null)
  const [popoverContent, setPopoverContent] = useState('')

  // Funciones para manejar el popover
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>, nombreObra: string) => {
    setPopoverAnchor(event.currentTarget)
    setPopoverContent(`Nombre Obra: ${nombreObra}`)
  }

  const handlePopoverClose = () => {
    setPopoverAnchor(null)
    setPopoverContent('')
  }

  const isPopoverOpen = Boolean(popoverAnchor)

  // Hooks
  // const { lang: locale } = useParams()

  // Función para cargar laboratoristas desde el backend
  const fetchLaboratoristas = async () => {
    try {
      setLoadingLaboratoristas(true)
      const response = await fetch('/api/equipos/laboratoristas')

      if (!response.ok) {
        throw new Error('Error al cargar laboratoristas')
      }

      const data = await response.json()
      // Ordenar laboratoristas por nombre
      const sortedLaboratoristas = data
        .map((lab: any) => ({
          id: lab.id,
          name: lab.name
        }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

      setLaboratoristas(sortedLaboratoristas)
    } catch (error) {
      console.error('Error al cargar laboratoristas:', error)
      setAlertSeverity('error')
      setAlertMessage('Error al cargar la lista de laboratoristas')
      setAlertOpen(true)
    } finally {
      setLoadingLaboratoristas(false)
    }
  }

  // Función para cargar clientes desde el backend
  const fetchClientes = async () => {
    try {
      setLoadingClientes(true)
      console.log('Intentando cargar clientes...')
      const response = await fetch('/api/clientes')

      if (!response.ok) {
        throw new Error(`Error al cargar clientes: ${response.status}`)
      }

      const data = await response.json()
      console.log('Datos de clientes recibidos:', data)

      if (!Array.isArray(data)) {
        throw new Error('Los datos de clientes no son un array')
      }

      // Ordenar clientes por nombre y incluir RUT para la búsqueda de obras
      const sortedClientes = data
        .filter((cliente: any) => cliente.clienteId && cliente.nombreCliente && cliente.rut) // Filtrar datos válidos
        .map((cliente: any) => ({
          clienteId: cliente.clienteId,
          nombreCliente: cliente.nombreCliente,
          rut: cliente.rut // Incluir RUT para buscar obras
        }))
        .sort((a: any, b: any) => a.nombreCliente.localeCompare(b.nombreCliente))

      setClientes(sortedClientes)
      console.log('Clientes guardados en el estado:', sortedClientes.length, 'clientes válidos')
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      setAlertSeverity('error')
      setAlertMessage('Error al cargar la lista de clientes')
      setAlertOpen(true)
    } finally {
      setLoadingClientes(false)
    }
  }

  // Función para cargar obras de un cliente específico
  const fetchObras = async (cliente: { clienteId: number, nombreCliente: string, rut: string }) => {
    try {
      setLoadingObras(true)

      console.log('Cargando obras para cliente RUT:', cliente.rut)
      const response = await fetch(`/api/obras?rut=${encodeURIComponent(cliente.rut)}`)

      if (!response.ok) {
        throw new Error(`Error al cargar obras: ${response.status}`)
      }

      const data = await response.json()
      console.log('Obras cargadas:', data)

      if (!Array.isArray(data)) {
        throw new Error('Los datos de obras no son un array')
      }

      // Filtrar solo obras activas y ordenar por número de obra descendente
      const obrasActivas = data
        .filter((obra: any) => obra.estadoObra === 'activa' && obra.obraId && obra.nombreObra)
        .map((obra: any) => ({
          obraId: obra.obraId,
          nombreObra: obra.nombreObra,
          numeroObra: obra.numeroObra || 'S/N'
        }))
        .sort((a: any, b: any) => {
          const numeroA = parseInt(a.numeroObra) || 0
          const numeroB = parseInt(b.numeroObra) || 0
          return numeroB - numeroA // Orden descendente (más reciente primero)
        })

      setObras(obrasActivas)
      console.log('Obras activas establecidas:', obrasActivas.length, 'obras válidas')
    } catch (error) {
      console.error('Error al cargar obras:', error)
      setAlertSeverity('error')
      setAlertMessage('Error al cargar la lista de obras')
      setAlertOpen(true)
    } finally {
      setLoadingObras(false)
    }
  }

  // Función para cargar datos desde el backend con filtros
  const fetchVisitasWithFilters = async (filters: {
    fechaInicio?: string
    fechaFin?: string
    estado?: string
    laboratorista?: string
    porRecibir?: boolean
    clienteId?: string
    obraId?: string
  }) => {
    try {
      setLoading(true)

      // Construir parámetros de consulta
      const params = new URLSearchParams()
      if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio)
      if (filters.fechaFin) params.append('fechaFin', filters.fechaFin)
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.laboratorista) params.append('laboratorista', filters.laboratorista)
      if (filters.porRecibir) params.append('porRecibir', 'true')

      if (filters.clienteId) params.append('clienteId', filters.clienteId)
      if (filters.obraId) params.append('obraId', filters.obraId)

      const response = await fetch(`/api/agenda?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Error al cargar las visitas')
      }

      const visitas = await response.json()

      // Ordenar las visitas de la más antigua a la más reciente por fechaInicio
      const visitasOrdenadas = visitas.sort((a: Agenda, b: Agenda) => {
        const fechaA = parseDateFromBackend(a.fechaInicio.toString())
        const fechaB = parseDateFromBackend(b.fechaInicio.toString())
        return fechaA.getTime() - fechaB.getTime()
      })

      setData(visitasOrdenadas)
    } catch (error) {
      console.error('Error al cargar visitas:', error)
      setAlertSeverity('error')
      setAlertMessage('Error al cargar las visitas: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setAlertOpen(true)
    } finally {
      setLoading(false)
    }
  }

  // Efecto para inicializar fechas con la fecha actual y cargar datos
  useEffect(() => {
    console.log('Inicializando VisitListTable...')
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const fechaActual = `${year}-${month}-${day}`

    setFechaInicio(fechaActual)
    setFechaFin(fechaActual)

    // Cargar datos iniciales con fecha actual, todos los estados y por recibir activado
    fetchVisitasWithFilters({
      fechaInicio: fechaActual,
      fechaFin: fechaActual,
      estado: todosLosEstados.join(','),
      porRecibir: true
    })

    // Cargar lista de laboratoristas y clientes
    console.log('Cargando laboratoristas y clientes...')
    fetchLaboratoristas()
    fetchClientes()
  }, [])

  // Efecto para cargar datos cuando cambian los filtros (excepto globalFilterValue)
  useEffect(() => {
    if (fechaInicio || fechaFin) { // Solo hacer llamada si hay al menos una fecha
      fetchVisitasWithFilters({
        fechaInicio,
        fechaFin,
        estado: selectedEstado.length > 0 ? selectedEstado.join(',') : '',
        laboratorista: selectedLaboratorista,
        porRecibir,

        clienteId: selectedCliente?.clienteId.toString(),
        obraId: selectedObra?.obraId.toString()
      })
    }
  }, [fechaInicio, fechaFin, selectedEstado, selectedLaboratorista, porRecibir, selectedCliente, selectedObra])

  // Nota: La búsqueda global ahora se maneja solo en el frontend con react-table

  // Efecto para depurar la carga de clientes
  useEffect(() => {
    console.log('Estado de clientes actualizado:', clientes.length, 'clientes cargados')
  }, [clientes])

  // Efecto para depurar la carga de obras
  useEffect(() => {
    console.log('Estado de obras actualizado:', obras.length, 'obras cargadas')
  }, [obras])

  // Cargar tipos y familias para el buscador de servicios
  useEffect(() => {
    // Cargar todos los servicios para obtener tipos y familias únicas
    fetch('/api/productos?limit=1000')
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al cargar servicios')
        }
        return res.json()
      })
      .then(response => {
        const data = response.productos || []

        // Obtener tipos únicos
        const uniqueTipos = Array.from(new Set(data.map((s: any) => s.tipo || 'Sin tipo')))
          .filter(tipo => tipo)
          .sort()

        // Obtener familias únicas
        const uniqueFamilias = Array.from(new Set(data.map((s: any) => s.familia || 'Sin familia')))
          .filter(familia => familia)
          .sort()

        setTipos(uniqueTipos as string[])
        setFamilias(uniqueFamilias.map((f, index) => ({ id: index, nombre: String(f), areaId: 0 })))
        setServiciosBuscador(data)
      })
      .catch(error => {
        console.error('Error al cargar servicios:', error)
        setAlertSeverity('error')
        setAlertMessage('Error al cargar los servicios')
        setAlertOpen(true)
        setServiciosBuscador([])
      })
  }, [])

  // Cargar áreas para el buscador de servicios
  useEffect(() => {
    fetch('/api/areas')
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al cargar áreas')
        }
        return res.json()
      })
      .then(data => {
        console.log('Áreas cargadas:', data)
        setAreas(data)
      })
      .catch(error => {
        console.error('Error al cargar áreas:', error)
        setAlertSeverity('error')
        setAlertMessage('Error al cargar las áreas')
        setAlertOpen(true)
        setAreas([])
      })
  }, [])

  // Cargar familias cuando se selecciona un área
  useEffect(() => {
    if (selectedAreaId) {
      fetch(`/api/familias?areaId=${selectedAreaId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Error al cargar familias')
          }
          return res.json()
        })
        .then(data => {
          console.log('Familias cargadas:', data)
          setFamilias(data)
        })
        .catch(error => {
          console.error('Error al cargar familias:', error)
          setAlertSeverity('error')
          setAlertMessage('Error al cargar las familias')
          setAlertOpen(true)
          setFamilias([])
        })
    } else {
      setFamilias([])
    }
  }, [selectedAreaId])

  // Efecto de paginación para productos
  useEffect(() => {
    if (serviciosBuscadorAnchorEl) { // Solo ejecutar cuando el popover está abierto
      const params = new URLSearchParams()
      params.append('page', (productsPage + 1).toString())
      params.append('limit', ITEMS_PER_PAGE.toString())
      if (searchTerm) params.append('search', searchTerm)
      if (selectedArea) params.append('area', selectedArea)
      if (selectedTipo) params.append('tipo', selectedTipo)
      if (selectedFamilia) params.append('familia', selectedFamilia)

      fetch(`/api/productos?${params.toString()}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Error al cargar servicios')
          }
          return res.json()
        })
        .then(response => {
          const data = response.productos || []
          setFilteredProductos(data)
          setTotalProductos(Number.isFinite(response.total) ? Number(response.total) : 0)
        })
        .catch(error => {
          console.error('Error al cargar servicios paginados:', error)
          setAlertSeverity('error')
          setAlertMessage('Error al cargar los servicios')
          setAlertOpen(true)
          setFilteredProductos([])
          setTotalProductos(0)
        })
    }
  }, [productsPage, searchTerm, selectedArea, selectedTipo, selectedFamilia, serviciosBuscadorAnchorEl])

  // Resetear la página cuando cambien los filtros
  useEffect(() => {
    if (serviciosBuscadorAnchorEl) {
      setProductsPage(0)
    }
  }, [selectedArea, selectedTipo, selectedFamilia, searchTerm])



  const handleEstadoChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    const newValue = typeof value === 'string' ? value.split(',') : value

    // Si se selecciona "TODOS", seleccionar todos los estados
    if (newValue.includes('TODOS')) {
      if (selectedEstado.length === todosLosEstados.length) {
        // Si ya están todos seleccionados, deseleccionar todos
        setSelectedEstado([])
      } else {
        // Si no están todos seleccionados, seleccionar todos
        setSelectedEstado(todosLosEstados)
      }
    } else {
      setSelectedEstado(newValue)
    }
  }

  const handlePorRecibirChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPorRecibir(event.target.checked)
  }

  const handleClienteChange = (cliente: { clienteId: number, nombreCliente: string, rut: string } | null) => {
    setSelectedCliente(cliente)

    // Limpiar obra seleccionada cuando cambia el cliente
    setSelectedObra(null)
    setObras([])

    // Cargar obras del cliente seleccionado
    if (cliente) {
      fetchObras(cliente)
    }
  }

  const handleObraChange = (obra: { obraId: number, nombreObra: string, numeroObra: string } | null) => {
    setSelectedObra(obra)
  }

  const handleRowSelection = (row: Agenda) => {
    // Si es la fila seleccionada actualmente en el detalle, mantener el comportamiento de deselección
    if (selectedVisit?.id === row.id) {
      onVisitSelect(null)

      // Remover de la lista de seleccionados también
      setSelectedVisits(prev => prev.filter(v => v.id !== row.id))

      return
    }

    // Verificar si ya está en la lista de seleccionados
    const isSelected = selectedVisits.some(v => v.id === row.id)

    if (isSelected) {
      // Si ya está seleccionada, la quitamos de la lista
      setSelectedVisits(prev => prev.filter(v => v.id !== row.id))

      // Si era la que estaba en el detalle, quitar el detalle
      if (selectedVisit?.id === row.id) {
        onVisitSelect(null)
      }
    } else {
      // Si no está seleccionada, la agregamos a la lista
      setSelectedVisits(prev => [...prev, row])

      // Actualizar el detalle para mostrar la fila recién seleccionada
      onVisitSelect(row)
    }
  }

  const handleFechaChange = (date: Date | null) => {
    if (!date) {
      setFechaInicio('')
      return
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const newFecha = `${year}-${month}-${day}`
    setFechaInicio(newFecha)

    // Si la fecha fin es menor que la nueva fecha inicio, actualizarla
    if (fechaFin && newFecha > fechaFin) {
      setFechaFin(newFecha)
    }
  }

  const handleFechaFinChange = (date: Date | null) => {
    if (!date) {
      setFechaFin('')
      return
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const newFecha = `${year}-${month}-${day}`

    // Validar que la fecha fin no sea menor que la fecha inicio
    if (fechaInicio && newFecha < fechaInicio) {
      setAlertSeverity('error')
      setAlertMessage('La fecha de fin no puede ser menor que la fecha de inicio')
      setAlertOpen(true)
      return
    }

    setFechaFin(newFecha)
  }

  const handlePDFClick = () => {
    if (selectedVisit?.ordenesTrabajo?.[0]) {
      setSelectedOT(selectedVisit.ordenesTrabajo[0])
      setPdfModalOpen(true)
    }
  }

  const handleVerComprobante = () => {
    setDetallesModalOpen(true)
  }

  const handleCloseComprobante = () => {
    setDetallesModalOpen(false)
    // Limpiar estado de edición de servicios al cerrar el modal
    setEditingServiceId(null)
    setEditedServiceData({ cantidad: 0, observacion: '' })
  }

  // Función para manejar los cambios en los campos editables
  const handleFieldChange = (field: keyof Agenda, value: string) => {
    setEditedVisit(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Función para guardar los cambios
  const handleSaveChanges = async () => {
    try {
      // Aquí iría la llamada a la API para actualizar los datos
      console.log('Guardando cambios:', editedVisit)

      // Actualizar los datos localmente
      const updatedData = data.map(item => (item.id === selectedVisit?.id ? { ...item, ...editedVisit } : item))

      setData(updatedData)

      // Si la visita seleccionada es la que se está editando, actualizarla
      if (selectedVisit) {
        onVisitSelect({ ...selectedVisit, ...editedVisit })
      }

      setIsEditing(false)
      setEditedVisit({})
    } catch (error) {
      console.error('Error al guardar los cambios:', error)
    }
  }

  // Función para iniciar la edición
  const handleStartEditing = () => {
    if (selectedVisit) {
      setEditedVisit({
        horaLlegada: selectedVisit.horaLlegada || '',
        horaSalida: selectedVisit.horaSalida || '',
        movilizacion: selectedVisit.movilizacion || '',
        kmAdicionales: selectedVisit.kmAdicionales || ''
      })
      setIsEditing(true)
    }
  }

  // Función para manejar el cambio de estado
  const handleChangeStatus = async () => {
    try {
      if (!selectedVisitForStatus || !newStatus) return

      console.log('Cambiando estado de visita a:', { visitId: selectedVisitForStatus.id, newStatus })

      // Llamada a la API para actualizar el estado de la visita
      const response = await fetch(`/api/gestionvisita/${selectedVisitForStatus.id}/cambiar-estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: newStatus

          // No actualizamos el estado de las OTs en este caso
        })
      })

      if (!response.ok) {
        throw new Error('Error al cambiar el estado')
      }

      // Actualizar los datos localmente después de la respuesta de la API
      const updatedData = data.map(item =>
        item.id === selectedVisitForStatus.id ? { ...item, estado: newStatus } : item
      )

      setData(updatedData)

      // Si la visita seleccionada es la que se está editando, actualizarla
      if (selectedVisit?.id === selectedVisitForStatus.id) {
        onVisitSelect({ ...selectedVisit, estado: newStatus })
      }

      // Cerrar el diálogo y limpiar estados
      setIsChangeStatusOpen(false)
      setSelectedVisitForStatus(null)
      setNewStatus('')

      // Mostrar alerta de éxito
      setAlertSeverity('success')
      setAlertMessage(`Estado cambiado a ${newStatus} correctamente`)
      setAlertOpen(true)
    } catch (error) {
      console.error('Error al cambiar el estado:', error)

      // Mostrar alerta de error
      setAlertSeverity('error')
      setAlertMessage('Error al cambiar el estado: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setAlertOpen(true)
    }
  }

  // Función para manejar el cambio de estado a EN_REVISION
  const handleRevisionClick = async () => {
    try {
      if (!selectedVisit?.ordenesTrabajo?.length) return

      console.log('Cambiando estado de visita a REVISIÓN y OTs a EN_REVISION')

      // Llamada a la API para actualizar el estado de la visita
      const response = await fetch(`/api/gestionvisita/${selectedVisit.id}/cambiar-estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: 'REVISIÓN',
          ordenesTrabajoEstado: 'EN_REVISION'
        })
      })

      if (!response.ok) {
        throw new Error('Error al cambiar el estado')
      }

      // Actualizar los datos localmente después de la respuesta de la API
      const updatedData = data.map(item => {
        if (item.id === selectedVisit.id) {
          return {
            ...item,
            estado: 'REVISIÓN',
            ordenesTrabajo: item.ordenesTrabajo?.map(ot => ({
              ...ot,
              estado: 'EN_REVISION'
            }))
          }
        }

        return item
      })

      setData(updatedData)

      // Si la visita seleccionada es la que se está editando, actualizarla
      if (selectedVisit) {
        onVisitSelect({
          ...selectedVisit,
          estado: 'REVISIÓN',
          ordenesTrabajo: selectedVisit.ordenesTrabajo?.map(ot => ({
            ...ot,
            estado: 'EN_REVISION'
          }))
        })
      }

      // Mostrar alerta de éxito
      setAlertSeverity('success')
      setAlertMessage('Estado cambiado a Revisión correctamente')
      setAlertOpen(true)
    } catch (error) {
      console.error('Error al cambiar el estado de las OTs:', error)

      // Mostrar alerta de error
      setAlertSeverity('error')
      setAlertMessage('Error al cambiar el estado: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setAlertOpen(true)
    }
  }

  // Función para manejar el cambio de estado a DISPONIBLE
  const handleOKClick = async () => {
    try {
      if (!selectedVisit?.ordenesTrabajo?.length) return

      console.log('Cambiando estado de visita a OK y OTs a DISPONIBLE')

      // Llamada a la API para actualizar el estado de la visita
      const response = await fetch(`/api/gestionvisita/${selectedVisit.id}/cambiar-estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: 'OK',
          ordenesTrabajoEstado: 'DISPONIBLE'
        })
      })

      if (!response.ok) {
        throw new Error('Error al cambiar el estado')
      }

      // Actualizar los datos localmente después de la respuesta de la API
      const updatedData = data.map(item => {
        if (item.id === selectedVisit.id) {
          return {
            ...item,
            estado: 'OK',
            ordenesTrabajo: item.ordenesTrabajo?.map(ot => ({
              ...ot,
              estado: 'DISPONIBLE'
            }))
          }
        }

        return item
      })

      setData(updatedData)

      // Si la visita seleccionada es la que se está editando, actualizarla
      if (selectedVisit) {
        onVisitSelect({
          ...selectedVisit,
          estado: 'OK',
          ordenesTrabajo: selectedVisit.ordenesTrabajo?.map(ot => ({
            ...ot,
            estado: 'DISPONIBLE'
          }))
        })
      }

      // Mostrar alerta de éxito
      setAlertSeverity('success')
      setAlertMessage('Estado cambiado a OK correctamente')
      setAlertOpen(true)
    } catch (error) {
      console.error('Error al cambiar el estado de las OTs:', error)

      // Mostrar alerta de error
      setAlertSeverity('error')
      setAlertMessage('Error al cambiar el estado: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setAlertOpen(true)
    }
  }

  // Nueva función para manejar el cambio de estado en masa
  const handleBulkStatusChange = async () => {
    try {
      if (!selectedVisits.length || !bulkNewStatus) return

      console.log('Cambiando estado de visitas en masa:', { count: selectedVisits.length, newStatus: bulkNewStatus })

      // Usar Promise.all para hacer todas las solicitudes en paralelo
      const results = await Promise.all(
        selectedVisits.map(visit =>
          fetch(`/api/gestionvisita/${visit.id}/cambiar-estado`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              estado: bulkNewStatus
            })
          })
        )
      )

      // Verificar si todas las solicitudes fueron exitosas
      if (results.some(res => !res.ok)) {
        throw new Error('Algunas visitas no pudieron ser actualizadas')
      }

      // Actualizar los datos localmente después de la respuesta de la API
      const updatedData = data.map(item => {
        if (selectedVisits.some(v => v.id === item.id)) {
          return {
            ...item,
            estado: bulkNewStatus
          }
        }

        return item
      })

      setData(updatedData)

      // Si la visita seleccionada es una de las que se está editando, actualizarla
      if (selectedVisit && selectedVisits.some(v => v.id === selectedVisit.id)) {
        onVisitSelect({ ...selectedVisit, estado: bulkNewStatus })
      }

      // Cerrar el diálogo y limpiar estados
      setIsBulkEditOpen(false)
      setBulkNewStatus('')

      // Mostrar alerta de éxito
      setAlertSeverity('success')
      setAlertMessage(`${selectedVisits.length} visitas actualizadas correctamente a estado ${bulkNewStatus}`)
      setAlertOpen(true)
    } catch (error) {
      console.error('Error al cambiar el estado de las visitas:', error)

      // Mostrar alerta de error
      setAlertSeverity('error')
      setAlertMessage('Error al cambiar el estado: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setAlertOpen(true)
    }
  }

  // Función para manejar el cambio de estado especial (botón !)
  const handleSpecialStatusChange = async () => {
    try {
      if (!selectedVisit || !specialStatus) return

      console.log('Cambiando estado especial de visita:', { visitId: selectedVisit.id, newStatus: specialStatus })

      // Llamada a la API para actualizar el estado de la visita
      const response = await fetch(`/api/gestionvisita/${selectedVisit.id}/cambiar-estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: specialStatus
        })
      })

      if (!response.ok) {
        throw new Error('Error al cambiar el estado')
      }

      // Actualizar los datos localmente después de la respuesta de la API
      const updatedData = data.map(item =>
        item.id === selectedVisit.id ? { ...item, estado: specialStatus } : item
      )

      setData(updatedData)

      // Actualizar la visita seleccionada
      onVisitSelect({ ...selectedVisit, estado: specialStatus })

      // Cerrar el diálogo y limpiar estados
      setIsSpecialStatusOpen(false)
      setSpecialStatus('')

      // Mostrar alerta de éxito
      setAlertSeverity('success')
      setAlertMessage(`Estado cambiado a ${specialStatus} correctamente`)
      setAlertOpen(true)
    } catch (error) {
      console.error('Error al cambiar el estado:', error)

      // Mostrar alerta de error
      setAlertSeverity('error')
      setAlertMessage('Error al cambiar el estado: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setAlertOpen(true)
    }
  }

  // Funciones para edición de servicios
  const handleStartEditingService = (servicio: any) => {
    setEditingServiceId(servicio.id)
    setEditedServiceData({
      cantidad: servicio.cantidad,
      observacion: servicio.observacion || ''
    })
  }

  const handleCancelEditingService = () => {
    setEditingServiceId(null)
    setEditedServiceData({ cantidad: 0, observacion: '' })
  }

  const handleSaveServiceChanges = async () => {
    try {
      if (!selectedVisit || !editingServiceId) return

      console.log('Guardando cambios del servicio:', {
        visitId: selectedVisit.id,
        serviceId: editingServiceId,
        changes: editedServiceData
      })

      // Actualizar los datos localmente primero (simulación)
      if (selectedVisit.servicios) {
        const updatedServicios = selectedVisit.servicios.map(servicio =>
          servicio.id === editingServiceId
            ? { ...servicio, ...editedServiceData }
            : servicio
        )

        const updatedVisit = { ...selectedVisit, servicios: updatedServicios }

        // Actualizar en la lista de datos
        const updatedData = data.map(item =>
          item.id === selectedVisit.id
            ? updatedVisit
            : item
        )

        setData(updatedData)
        onVisitSelect(updatedVisit)
      }

      // Limpiar estado de edición
      setEditingServiceId(null)
      setEditedServiceData({ cantidad: 0, observacion: '' })

      // Mostrar alerta de éxito
      setAlertSeverity('success')
      setAlertMessage('Servicio actualizado correctamente')
      setAlertOpen(true)

      // TODO: Aquí iría la llamada real a la API
      /*
      const response = await fetch(`/api/visitas/${selectedVisit.id}/servicios/${editingServiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedServiceData)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el servicio')
      }
      */

    } catch (error) {
      console.error('Error al guardar cambios del servicio:', error)
      setAlertSeverity('error')
      setAlertMessage('Error al actualizar el servicio: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setAlertOpen(true)
    }
  }

  const handleDeleteService = async (servicioId: number) => {
    try {
      if (!selectedVisit) return

      console.log('Eliminando servicio:', { visitId: selectedVisit.id, serviceId: servicioId })

      // Actualizar los datos localmente (simulación)
      if (selectedVisit.servicios) {
        const updatedServicios = selectedVisit.servicios.filter(servicio => servicio.id !== servicioId)
        const updatedVisit = { ...selectedVisit, servicios: updatedServicios }

        // Actualizar en la lista de datos
        const updatedData = data.map(item =>
          item.id === selectedVisit.id
            ? updatedVisit
            : item
        )

        setData(updatedData)
        onVisitSelect(updatedVisit)
      }

      // Mostrar alerta de éxito
      setAlertSeverity('success')
      setAlertMessage('Servicio eliminado correctamente')
      setAlertOpen(true)

      // TODO: Aquí iría la llamada real a la API
      /*
      const response = await fetch(`/api/visitas/${selectedVisit.id}/servicios/${servicioId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el servicio')
      }
      */

    } catch (error) {
      console.error('Error al eliminar servicio:', error)
      setAlertSeverity('error')
      setAlertMessage('Error al eliminar el servicio: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setAlertOpen(true)
    }
  }

  // Funciones para el buscador de servicios
  const handleAreaChange = (e: SelectChangeEvent<string>) => {
    const areaNombre = e.target.value
    setSelectedArea(areaNombre)
    setSelectedFamilia('') // Resetear familia cuando cambia el área

    // Encontrar el ID del área seleccionada
    const areaSeleccionada = areas.find(a => a.nombre === areaNombre)
    setSelectedAreaId(areaSeleccionada?.id || null)
  }

  const handleFamiliaChange = (e: SelectChangeEvent<string>) => {
    setSelectedFamilia(e.target.value)
  }

  const handleTipoChange = (e: SelectChangeEvent<string>) => {
    setSelectedTipo(e.target.value)
  }

  const handleClearFilters = () => {
    setSelectedArea('')
    setSelectedAreaId(null)
    setSelectedTipo('')
    setSelectedFamilia('')
    setSearchTerm('')
    setShowOnlyPaquetes(false)
    setProductsPage(0)
  }

  // Función para filtrar productos
  const filterProducts = (search: string, area: string, tipo: string, familia: string, onlyPaquetes = showOnlyPaquetes) => {
    const params = new URLSearchParams()
    params.append('page', '1')
    params.append('limit', ITEMS_PER_PAGE.toString())
    if (search) params.append('search', search)
    if (area) params.append('area', area)
    if (tipo) params.append('tipo', tipo)
    if (familia) params.append('familia', familia)
    if (onlyPaquetes) params.append('esPaquete', 'true')

    fetch(`/api/productos?${params.toString()}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al cargar servicios')
        }
        return res.json()
      })
      .then(response => {
        const data = response.productos || []
        setFilteredProductos(data)
        setTotalProductos(Number.isFinite(response.total) ? Number(response.total) : 0)
      })
      .catch(error => {
        console.error('Error al cargar servicios:', error)
        setAlertSeverity('error')
        setAlertMessage('Error al cargar los servicios')
        setAlertOpen(true)
        setFilteredProductos([])
        setTotalProductos(0)
      })
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchTerm(event.target.value)
    filterProducts(event.target.value, selectedArea, selectedTipo, selectedFamilia)
  }

  const handleOpenServiciosBuscador = (element: HTMLElement | null) => {
    setServiciosBuscadorAnchorEl(element)
    setLoadingProductos(true)
    setProductsPage(0)
    setSearchTerm('')
    setSelectedArea('')
    setSelectedAreaId(null)
    setSelectedTipo('Terreno')
    setSelectedFamilia('')
    setShowOnlyPaquetes(false)
    filterProducts('', '', 'Terreno', '', false)
    setLoadingProductos(false)
  }

  const handleCloseServiciosBuscador = () => {
    setServiciosBuscadorAnchorEl(null)
  }

  const handleSelectProduct = (producto: any) => {
    if (!selectedVisit) return

    // Crear nuevo servicio con ID único temporal
    const nuevoServicio = {
      id: Date.now(), // ID temporal único
      codigo: producto.sku,
      servicio: producto.norma ? `${producto.nombre} - ${producto.norma}` : producto.nombre,
      cantidad: 1,
      observacion: '',
      esSegundaVisita: false
    }

    // Agregar el servicio a la lista (crear array si no existe)
    const serviciosActuales = selectedVisit.servicios || []
    const serviciosActualizados = [...serviciosActuales, nuevoServicio]
    const visitaActualizada = { ...selectedVisit, servicios: serviciosActualizados }

    // Actualizar en la lista de datos
    const updatedData = data.map(item =>
      item.id === selectedVisit.id ? visitaActualizada : item
    )

    setData(updatedData)
    onVisitSelect(visitaActualizada)

    // Cerrar el buscador
    handleCloseServiciosBuscador()

    // Mostrar mensaje de éxito
    setAlertSeverity('success')
    setAlertMessage('Servicio agregado correctamente')
    setAlertOpen(true)
  }

  const handleShowOnlyPaquetesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyPaquetes(event.target.checked)
    filterProducts(searchTerm, selectedArea, selectedTipo, selectedFamilia, event.target.checked)
  }

  const columnHelper = createColumnHelper<Agenda>()

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: () => <div></div>,
        cell: ({ row }: { row: any }) => (
          <Checkbox
            checked={selectedVisits.some(v => v.id === row.original.id)}
            onChange={() => handleRowSelection(row.original)}
            inputProps={{ 'aria-label': 'select row' }}
          />
        )
      },
      columnHelper.accessor(
        row => {
          // Usar parseDateFromBackend para manejar correctamente las fechas del backend
          const date = parseDateFromBackend(row.fechaInicio.toString())

          if (isNaN(date.getTime())) {
            console.error('Fecha inválida:', row.fechaInicio)

            return 'Fecha inválida'
          }

          return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`
        },
        {
          id: 'fecha',
          header: 'Fecha',
          enableSorting: true,
          sortingFn: (rowA, rowB, columnId) => {
            const fechaA = parseDateFromBackend(rowA.original.fechaInicio.toString())
            const fechaB = parseDateFromBackend(rowB.original.fechaInicio.toString())
            return fechaA.getTime() - fechaB.getTime()
          },
          cell: info => (
            <Typography className='capitalize' color='text.primary'>
              {info.getValue()}
            </Typography>
          )
        }
      ),
      columnHelper.accessor(
        row => {
          // Usar parseDateFromBackend para manejar correctamente las fechas del backend
          const date = parseDateFromBackend(row.fechaInicio.toString())

          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        },
        {
          id: 'hora',
          header: 'Hora',
          cell: info => (
            <Typography className='capitalize' color='text.primary'>
              {info.getValue()}
            </Typography>
          )
        }
      ),
      columnHelper.accessor(
        row => {
          // Obtener el primer laboratorista asignado
          const laboratorista = row.asignados?.[0]?.user?.name || 'Sin Asignar'
          return laboratorista
        },
        {
          id: 'laboratorista',
          header: 'Laboratorista',
          cell: info => (
            <Typography className='capitalize' color='text.primary'>
              {info.getValue()}
            </Typography>
          )
        }
      ),
      columnHelper.accessor(
        row => ({
          cliente: row.cliente?.nombreCliente || 'Sin Cliente',
          numeroObra: row.obra?.numeroObra || 'Sin Obra',
          nombreObra: row.obra?.nombreObra || 'Sin Obra'
        }),
        {
          id: 'cliente',
          header: 'Cliente/Obra',
          cell: info => {
            const data = info.getValue()
            return (
              <Box
                onMouseEnter={(e) => handlePopoverOpen(e, data.nombreObra)}
                onMouseLeave={handlePopoverClose}
                sx={{ cursor: 'pointer' }}
              >
                <Typography className='capitalize' color='text.primary' variant='body2'>
                  {data.cliente}
                </Typography>
                <Typography className='capitalize' color='text.secondary' variant='caption'>
                  {data.numeroObra}
                </Typography>
              </Box>
            )
          }
        }
      ),
      columnHelper.accessor(
        row => row.obra?.comuna || 'Sin Comuna',
        {
          id: 'comuna',
          header: 'Comuna',
          cell: info => (
            <Typography className='capitalize' color='text.primary'>
              {info.getValue()}
            </Typography>
          )
        }
      ),
      // Nueva columna: Inicio / Fin (vacía por ahora)
      columnHelper.accessor(
        row => '',
        {
          id: 'inicioFin',
          header: 'Inicio / Fin',
          cell: info => (
            <Typography className='capitalize' color='text.primary'>
              {info.getValue()}
            </Typography>
          )
        }
      ),
      // Nueva columna: Estado
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: info => {
          const estado = info.getValue()
          let color: 'info' | 'success' | 'warning' | 'error' | 'primary' = 'primary'

          switch (estado) {
            case 'CREADA':
              color = 'primary'
              break
            case 'ELIMINADA':
              color = 'error'
              break
            case 'AGENDADA':
              color = 'info'
              break
            case 'SUSPENDIDA':
              color = 'warning'
              break
            case 'SUSPENDIDA_TERRENO':
              color = 'warning'
              break
            case 'COMPLETADA':
              color = 'success'
              break
            case 'EN_REVISION':
              color = 'warning'
              break
            case 'ANULADA':
              color = 'error'
              break
            case 'RECIBIDA_OK':
              color = 'success'
              break
            case 'CODIFICADA':
              color = 'info'
              break
            default:
              color = 'primary'
          }

          return <Chip variant='tonal' label={estado} size='small' color={color} />
        }
      }),
      columnHelper.accessor(
        row => row.servicios || [],
        {
          id: 'servicios',
          header: 'Servicios',
          cell: info => {
            const servicios = info.getValue()

            if (!servicios || servicios.length === 0) {
              return (
                <Typography variant='body2' color='text.secondary'>
                  Sin servicios
                </Typography>
              )
            }
            const serviciosTotales = servicios.length

            return (
              <Box>
                {serviciosTotales > 0 && (
                  <Tooltip
                    title={
                      <Box sx={{ p: 1 }}>
                        <Typography variant='subtitle2' sx={{ mb: 1, color: 'white' }}>
                          Todos los servicios:
                        </Typography>
                        {servicios.map((servicio, index) => (
                          <Typography key={index} variant='body2' sx={{ color: 'white' }}>
                            • {servicio.servicio} (Cantidad: {servicio.cantidad})
                            {servicio.observacion && (
                              <Typography variant='caption' sx={{ display: 'block', ml: 2, color: '#e0e0e0' }}>
                                {servicio.observacion}
                              </Typography>
                            )}
                          </Typography>
                        ))}
                      </Box>
                    }
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: '#424242',
                          color: 'white',
                          maxWidth: 300,
                          '& .MuiTooltip-arrow': {
                            color: '#424242'
                          }
                        }
                      }
                    }}
                    arrow
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': {
                          color: 'primary.dark'
                        }
                      }}
                    >
                      <Typography variant='caption'>
                        Ver {serviciosTotales} {serviciosTotales > 1 ? 'servicios' : 'servicio'}
                      </Typography>
                    </Box>
                  </Tooltip>
                )}
              </Box>
            )
          }
        }
      ),
      columnHelper.accessor('id', {
        header: 'Acc',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'Ver Comprobante',
                  icon: 'ri-file-pdf-line',
                  menuItemProps: {
                    className: 'flex items-center gap-2',
                    onClick: () => {
                      onVisitSelect(row.original)
                      handleVerComprobante()
                    }
                  }
                },
                /* {
                  text: 'Cambiar Estado',
                  icon: 'ri-exchange-line',
                  menuItemProps: {
                    className: 'flex items-center gap-2',
                    onClick: () => {
                      setSelectedVisitForStatus(row.original)
                      setNewStatus(row.original.estado)
                      setIsChangeStatusOpen(true)
                    }
                  }
                } */
              ]}
            />
          </div>
        )
      })
    ],
    [selectedVisit, selectedVisits]
  )

  const table = useReactTable({
    data: data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
      global: globalFilter
    },
    state: {
      globalFilter: globalFilterValue
    },
    initialState: {
      pagination: {
        pageSize: 10 // Aumentamos el tamaño de página para ver más registros
      },
      sorting: [
        {
          id: 'fecha',
          desc: false // false = ascendente (más antigua a más reciente)
        }
      ]
    },
    onGlobalFilterChange: setGlobalFilterValue,
    globalFilterFn: 'global',
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  // Debugging
  useEffect(() => {
    console.log('Data:', data)
    console.log('Table Rows:', table.getRowModel().rows)
  }, [data, table])

  const getAvatar = (params: { avatar?: string; fullName?: string }) => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} skin='light' size={34} />
    } else {
      return (
        <CustomAvatar skin='light' size={34}>
          {getInitials(fullName || 'U')}
        </CustomAvatar>
      )
    }
  }

  const handleAlertClose = () => {
    setAlertOpen(false)
  }

  return (
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Gestión de Visitas' />
          <Divider />

          {/* Filtros y Botón Editar */}
          <Box className='p-4'>
            <Grid container spacing={2} alignItems='center'>
              {/* Primera Fila */}
              <Grid item xs={12} sm={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha Inicio"
                    value={fechaInicio ? new Date(fechaInicio + 'T00:00:00') : null}
                    onChange={handleFechaChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small'
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Fecha Fin"
                    value={fechaFin ? new Date(fechaFin + 'T00:00:00') : null}
                    onChange={handleFechaFinChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small'
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Select
                  multiple
                  value={selectedEstado}
                  onChange={handleEstadoChange}
                  displayEmpty
                  fullWidth
                  size='small'
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return 'Ningún estado seleccionado'
                    }
                    if (selected.length === todosLosEstados.length) {
                      return 'Todos los Estados'
                    }
                    if (selected.length === 1) {
                      return selected[0]
                    }
                    return `${selected.length} estados seleccionados`
                  }}
                >
                  <MenuItem value='TODOS'>
                    <Checkbox
                      checked={selectedEstado.length === todosLosEstados.length}
                      indeterminate={selectedEstado.length > 0 && selectedEstado.length < todosLosEstados.length}
                    />
                    Seleccionar todos
                  </MenuItem>
                  <MenuItem value='CREADA'>
                    <Checkbox checked={selectedEstado.indexOf('CREADA') > -1} />
                    Creada
                  </MenuItem>
                  <MenuItem value='ELIMINADA'>
                    <Checkbox checked={selectedEstado.indexOf('ELIMINADA') > -1} />
                    Eliminada
                  </MenuItem>
                  <MenuItem value='AGENDADA'>
                    <Checkbox checked={selectedEstado.indexOf('AGENDADA') > -1} />
                    Agendada
                  </MenuItem>
                  <MenuItem value='SUSPENDIDA'>
                    <Checkbox checked={selectedEstado.indexOf('SUSPENDIDA') > -1} />
                    Suspendida
                  </MenuItem>
                  <MenuItem value='SUSPENDIDA_TERRENO'>
                    <Checkbox checked={selectedEstado.indexOf('SUSPENDIDA_TERRENO') > -1} />
                    Suspendida Terreno
                  </MenuItem>
                  <MenuItem value='COMPLETADA'>
                    <Checkbox checked={selectedEstado.indexOf('COMPLETADA') > -1} />
                    Completada
                  </MenuItem>
                  <MenuItem value='EN_REVISION'>
                    <Checkbox checked={selectedEstado.indexOf('EN_REVISION') > -1} />
                    En Revisión
                  </MenuItem>
                  <MenuItem value='ANULADA'>
                    <Checkbox checked={selectedEstado.indexOf('ANULADA') > -1} />
                    Anulada
                  </MenuItem>
                  <MenuItem value='RECIBIDA_OK'>
                    <Checkbox checked={selectedEstado.indexOf('RECIBIDA_OK') > -1} />
                    Recibida OK
                  </MenuItem>
                  <MenuItem value='CODIFICADA'>
                    <Checkbox checked={selectedEstado.indexOf('CODIFICADA') > -1} />
                    Codificada
                  </MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Autocomplete
                  fullWidth
                  size='small'
                  options={clientes}
                  getOptionLabel={(option) => `${option.nombreCliente} (${option.rut})`}
                  value={selectedCliente}
                  onChange={(_, newValue) => handleClienteChange(newValue)}
                  onInputChange={(_, newInputValue) => setClienteSearchValue(newInputValue)}
                  loading={loadingClientes}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase()
                    return options.filter(option =>
                      option.nombreCliente.toLowerCase().includes(searchTerm) ||
                      option.rut.toLowerCase().includes(searchTerm)
                    )
                  }}
                  noOptionsText={clienteSearchValue.length < 2 ? 'Ingrese al menos 2 caracteres para buscar' : 'No se encontraron clientes'}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={loadingClientes ? 'Cargando...' : 'Buscar cliente por nombre o RUT'}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingClientes ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component='li' {...props} key={option.clienteId}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant='body1'>
                          {option.nombreCliente}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          RUT: {option.rut}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Autocomplete
                  fullWidth
                  size='small'
                  options={obras}
                  getOptionLabel={(option) => `${option.numeroObra} - ${option.nombreObra}`}
                  value={selectedObra}
                  onChange={(_, newValue) => handleObraChange(newValue)}
                  onInputChange={(_, newInputValue) => setObraSearchValue(newInputValue)}
                  loading={loadingObras}
                  disabled={!selectedCliente}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase()
                    return options.filter(option =>
                      option.nombreObra.toLowerCase().includes(searchTerm) ||
                      option.numeroObra.toLowerCase().includes(searchTerm)
                    )
                  }}
                  noOptionsText={
                    !selectedCliente ? 'Seleccione un cliente primero' :
                      obraSearchValue.length < 2 ? 'Ingrese al menos 2 caracteres para buscar' : 'No se encontraron obras'
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={
                        !selectedCliente ? 'Seleccione un cliente primero' :
                          loadingObras ? 'Cargando...' : 'Buscar obra por nombre o número'
                      }
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingObras ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component='li' {...props} key={option.obraId}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant='body1'>
                          {option.numeroObra} - {option.nombreObra}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>

              {/* Segunda fila: Laboratorista, Estados, etc. */}
              <Grid item xs={12} sm={3}>
                <Autocomplete
                  fullWidth
                  size='small'
                  options={laboratoristas}
                  getOptionLabel={(option) => option.name}
                  value={laboratoristas.find(lab => lab.name === selectedLaboratorista) || null}
                  onChange={(_, newValue) => setSelectedLaboratorista(newValue?.name || '')}
                  onInputChange={(_, newInputValue) => setLaboratoristaSearchValue(newInputValue)}
                  loading={loadingLaboratoristas}
                  filterOptions={(options, { inputValue }) => {
                    const searchTerm = inputValue.toLowerCase()
                    return options.filter(option =>
                      option.name.toLowerCase().includes(searchTerm)
                    )
                  }}
                  noOptionsText={laboratoristaSearchValue.length < 2 ? 'Ingrese al menos 2 caracteres para buscar' : 'No se encontraron laboratoristas'}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={loadingLaboratoristas ? 'Cargando...' : 'Buscar laboratorista por nombre'}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingLaboratoristas ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component='li' {...props} key={option.id}>
                      <Typography variant='body1'>
                        {option.name}
                      </Typography>
                    </Box>
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <FormControlLabel
                  control={<Checkbox checked={porRecibir} onChange={handlePorRecibirChange} />}
                  label='Por Recibir'
                />
              </Grid>

              {/* Segunda Fila */}
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Buscar en todas las columnas...'
                  value={globalFilterValue}
                  onChange={e => setGlobalFilterValue(e.target.value)}
                  InputProps={{
                    startAdornment: <i className='ri-search-line' style={{ marginRight: '8px', color: '#aaa' }}></i>,
                    endAdornment: globalFilterValue && (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setGlobalFilterValue('')}
                          edge="end"
                        >
                          <i className='ri-close-line' style={{ fontSize: '16px' }}></i>
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant='contained'
                  fullWidth
                  onClick={() => {
                    // Limpiar filtros y establecer fecha actual
                    const today = new Date()
                    const year = today.getFullYear()
                    const month = String(today.getMonth() + 1).padStart(2, '0')
                    const day = String(today.getDate()).padStart(2, '0')
                    const fechaActual = `${year}-${month}-${day}`

                    setFechaInicio(fechaActual)
                    setFechaFin(fechaActual)
                    setSelectedLaboratorista('')
                    setSelectedEstado(todosLosEstados)
                    setPorRecibir(true)
                    setGlobalFilterValue('')
                    setSelectedCliente(null)
                    setSelectedObra(null)
                    setObras([])
                  }}
                >
                  Limpiar Filtros
                </Button>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant='contained'
                  color='warning'
                  fullWidth
                  onClick={() => setIsBulkEditOpen(true)}
                  disabled={selectedVisits.length === 0}
                >
                  Editar Seleccionadas ({selectedVisits.length})
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} />

            </Grid>
          </Box>

          <Divider />

          {/* Contenedor Principal */}
          <Box sx={{ height: '500px', overflowY: 'auto' }}>
            {/* Tabla */}
            <Box sx={{ width: '100%' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <Typography>Cargando visitas...</Typography>
                </Box>
              ) : (
                <div className='overflow-x-auto'>
                  <table className={tableStyles.table}>
                    <thead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th key={header.id}>
                              {header.isPlaceholder ? null : (
                                <div
                                  className={`select-none ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                                  onClick={header.column.getToggleSortingHandler()}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    userSelect: 'none'
                                  }}
                                >
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {header.column.getCanSort() && (
                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                      {{
                                        asc: ' ↑',
                                        desc: ' ↓',
                                      }[header.column.getIsSorted() as string] ?? ' ↕'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.length === 0 ? (
                        <tr>
                          <td colSpan={table.getAllColumns().length} style={{ textAlign: 'center', padding: '20px' }}>
                            No se encontraron visitas con los filtros aplicados
                          </td>
                        </tr>
                      ) : (
                        table.getRowModel().rows.map(row => (
                          <tr key={row.id} style={{ cursor: 'pointer' }}>
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && (
                <TablePagination
                  rowsPerPageOptions={[6, 10, 25, 50]}
                  component='div'
                  count={data.length}
                  rowsPerPage={table.getState().pagination.pageSize}
                  page={table.getState().pagination.pageIndex}
                  onPageChange={(_, page) => table.setPageIndex(page)}
                  onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
                />
              )}
            </Box>
          </Box>
        </Card>
      </Grid>

      {/* Modal del PDF */}
      <PDFModal open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} ot={selectedOT || undefined}>
        {selectedOT && <AceptacionVisitaPDF ot={selectedOT} />}
      </PDFModal>

      {/* Modal de Comprobante de Visita */}
      <Dialog
        open={detallesModalOpen}
        onClose={handleCloseComprobante}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Comprobante de Visita
          <IconButton
            aria-label="close"
            onClick={handleCloseComprobante}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedVisit ? (
            <Box sx={{ mt: 2 }}>
              {/* Encabezado con botones */}
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {isEditing ? (
                  <>
                    <Grid item xs={6} />
                    <Grid item xs={3}>
                      <Button
                        variant='contained'
                        color='success'
                        size='small'
                        fullWidth
                        onClick={handleSaveChanges}
                      >
                        Guardar
                      </Button>
                    </Grid>
                    <Grid item xs={3}>
                      <Button
                        variant='contained'
                        color='error'
                        size='small'
                        fullWidth
                        onClick={() => {
                          setIsEditing(false)
                          setEditedVisit({})
                        }}
                      >
                        Cancelar
                      </Button>
                    </Grid>
                  </>
                ) : (
                  <>
                    <Grid item xs={9} />
                    <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Button
                        variant='outlined'
                        color='primary'
                        size='small'
                        onClick={handleStartEditing}
                      >
                        Editar
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Información de la visita - Layout similar a la captura */}
              <Grid container spacing={3}>
                {/* Columna izquierda - Información de la visita */}
                <Grid item xs={6}>
                  <Box>
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      Cliente - N° Obra: <strong>{selectedVisit.cliente?.nombreCliente || '---'} - {selectedVisit.obra?.numeroObra || '---'}</strong>
                    </Typography>
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      Fecha Visita: <strong>{selectedVisit.fechaInicio ? parseDateFromBackend(selectedVisit.fechaInicio.toString()).toLocaleDateString('es-ES') : '---'}</strong>
                    </Typography>
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      Laboratorista: <strong>{selectedVisit.asignados?.[0]?.user?.name || '---'}</strong>
                    </Typography>
                  </Box>
                </Grid>

                {/* Columna derecha - Estado */}
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Chip
                      label={selectedVisit.estado}
                      color={
                        selectedVisit.estado === 'COMPLETADA' ? 'success' :
                          selectedVisit.estado === 'EN_REVISION' ? 'warning' :
                            selectedVisit.estado === 'AGENDADA' ? 'info' :
                              'primary'
                      }
                      variant='outlined'
                    />
                  </Box>
                </Grid>

                {/* Información de horarios */}
                <Grid item xs={6}>
                  <Box>
                    {isEditing ? (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant='body2' sx={{ mb: 1 }}>
                            Hora Llegada:
                          </Typography>
                          <TextField
                            fullWidth
                            size='small'
                            value={editedVisit.horaLlegada || ''}
                            onChange={(e) => handleFieldChange('horaLlegada', e.target.value)}
                            placeholder='HH:MM'
                          />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant='body2' sx={{ mb: 1 }}>
                            Hora Salida:
                          </Typography>
                          <TextField
                            fullWidth
                            size='small'
                            value={editedVisit.horaSalida || ''}
                            onChange={(e) => handleFieldChange('horaSalida', e.target.value)}
                            placeholder='HH:MM'
                          />
                        </Box>
                      </>
                    ) : (
                      <>
                        <Typography variant='body2' sx={{ mb: 1 }}>
                          Hora Llegada: <strong>{selectedVisit.horaLlegada || '---'}</strong>
                        </Typography>
                        <Typography variant='body2' sx={{ mb: 1 }}>
                          Hora Salida: <strong>{selectedVisit.horaSalida || '---'}</strong>
                        </Typography>
                      </>
                    )}
                  </Box>
                </Grid>

                {/* Información de movilización */}
                <Grid item xs={6}>
                  <Box>
                    {isEditing ? (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant='body2' sx={{ mb: 1 }}>
                            Movilización:
                          </Typography>
                          <TextField
                            fullWidth
                            size='small'
                            value={editedVisit.movilizacion || ''}
                            onChange={(e) => handleFieldChange('movilizacion', e.target.value)}
                            placeholder='Ingrese movilización'
                          />
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant='body2' sx={{ mb: 1 }}>
                            Km. Adic:
                          </Typography>
                          <TextField
                            fullWidth
                            size='small'
                            value={editedVisit.kmAdicionales || ''}
                            onChange={(e) => handleFieldChange('kmAdicionales', e.target.value)}
                            placeholder='Ingrese km adicionales'
                          />
                        </Box>
                      </>
                    ) : (
                      <>
                        <Typography variant='body2' sx={{ mb: 1 }}>
                          Movilización: <strong>{selectedVisit.movilizacion || '---'}</strong>
                        </Typography>
                        <Typography variant='body2'>
                          Km. Adic: <strong>{selectedVisit.kmAdicionales || '---'}</strong>
                        </Typography>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Tabla de servicios */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Button
                    variant='contained'
                    size='small'
                    onClick={(e) => handleOpenServiciosBuscador(e.currentTarget)}
                  >
                    +
                  </Button>
                </Box>

                <Box sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Grid container sx={{
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    fontWeight: 'bold'
                  }}>
                    <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid #e0e0e0' }}>
                      <Typography variant='body2'>SKU</Typography>
                    </Grid>
                    <Grid item xs={4} sx={{ p: 1, borderRight: '1px solid #e0e0e0' }}>
                      <Typography variant='body2'>Servicio</Typography>
                    </Grid>
                    <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid #e0e0e0' }}>
                      <Typography variant='body2'>Cantidad</Typography>
                    </Grid>
                    <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid #e0e0e0' }}>
                      <Typography variant='body2'>Obs</Typography>
                    </Grid>
                    <Grid item xs={2} sx={{ p: 1 }}>
                      <Typography variant='body2'>Acciones</Typography>
                    </Grid>
                  </Grid>

                  {selectedVisit.servicios && selectedVisit.servicios.length > 0 ? (
                    selectedVisit.servicios.map((servicio, index) => (
                      <Grid container key={index} sx={{ borderBottom: '1px solid #e0e0e0' }}>
                        <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid #e0e0e0' }}>
                          <Typography variant='body2'>{servicio.codigo}</Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ p: 1, borderRight: '1px solid #e0e0e0' }}>
                          <Typography variant='body2'>{servicio.servicio}</Typography>
                        </Grid>
                        <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid #e0e0e0' }}>
                          {editingServiceId === servicio.id ? (
                            <TextField
                              fullWidth
                              size='small'
                              type='number'
                              value={editedServiceData.cantidad}
                              onChange={(e) => setEditedServiceData(prev => ({
                                ...prev,
                                cantidad: parseInt(e.target.value) || 0
                              }))}
                              inputProps={{ min: 0 }}
                            />
                          ) : (
                            <Typography variant='body2'>{servicio.cantidad}</Typography>
                          )}
                        </Grid>
                        <Grid item xs={2} sx={{ p: 1, borderRight: '1px solid #e0e0e0' }}>
                          {editingServiceId === servicio.id ? (
                            <TextField
                              fullWidth
                              size='small'
                              multiline
                              minRows={2}
                              maxRows={6}
                              value={editedServiceData.observacion}
                              onChange={(e) => setEditedServiceData(prev => ({
                                ...prev,
                                observacion: e.target.value
                              }))}
                              placeholder='Observaciones...'
                              sx={{
                                '& .MuiInputBase-input': {
                                  whiteSpace: 'pre-wrap'
                                }
                              }}
                            />
                          ) : (
                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            >
                              {servicio.observacion || '---'}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={2} sx={{ p: 1 }}>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                            {editingServiceId === servicio.id ? (
                              <>
                                <Tooltip title="Guardar cambios">
                                  <IconButton
                                    size='small'
                                    color='success'
                                    onClick={handleSaveServiceChanges}
                                  >
                                    <i className='ri-check-line' style={{ fontSize: '16px' }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancelar edición">
                                  <IconButton
                                    size='small'
                                    color='error'
                                    onClick={handleCancelEditingService}
                                  >
                                    <i className='ri-close-line' style={{ fontSize: '16px' }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                <Tooltip title="Editar servicio">
                                  <IconButton
                                    size='small'
                                    color='primary'
                                    onClick={() => handleStartEditingService(servicio)}
                                  >
                                    <i className='ri-edit-line' style={{ fontSize: '16px' }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar servicio">
                                  <IconButton
                                    size='small'
                                    color='error'
                                    onClick={() => handleDeleteService(servicio.id)}
                                  >
                                    <i className='ri-delete-bin-line' style={{ fontSize: '16px' }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    ))
                  ) : (
                    <Grid container sx={{ p: 2 }}>
                      <Grid item xs={12}>
                        <Typography variant='body2' color='text.secondary' textAlign='center'>
                          No hay servicios registrados
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              </Box>

              {/* Observaciones */}
              <Box sx={{ mb: 3 }}>
                <Typography variant='subtitle1' fontWeight='bold' sx={{ mb: 1 }}>
                  Observaciones
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder='Campo texto abierto'
                  variant='outlined'
                  size='small'
                />
              </Box>

              {/* Botones de acción */}
              <Grid container spacing={2}>
                <Grid item xs={2}>
                  <Button
                    variant='outlined'
                    color='primary'
                    fullWidth
                    size='small'
                    onClick={handlePDFClick}
                    startIcon={<i className='ri-file-pdf-line' />}
                    disabled={!selectedVisit?.ordenesTrabajo?.length}
                  >
                    PDF
                  </Button>
                </Grid>
                <Grid item xs={7} />
                <Grid item xs={2}>
                  <Button
                    variant='contained'
                    color='success'
                    fullWidth
                    size='small'
                  >
                    Recepcionar
                  </Button>
                </Grid>
                {/* <Grid item xs={3}>
                  <Button
                    variant='outlined'
                    color='warning'
                    fullWidth
                    size='small'
                    onClick={handleRevisionClick}
                    disabled={!selectedVisit?.ordenesTrabajo?.length}
                  >
                    Revisión
                  </Button>
                </Grid> */}

                <Grid item xs={1}>
                  <Button
                    variant='outlined'
                    color='info'
                    fullWidth
                    size='small'
                    onClick={() => {
                      setSpecialStatus('')
                      setIsSpecialStatusOpen(true)
                    }}
                  >
                    !
                  </Button>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography variant='body2' color='text.secondary' textAlign='center'>
              No hay visita seleccionada
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cambio de Estado */}
      <Dialog
        open={isChangeStatusOpen}
        onClose={() => {
          setIsChangeStatusOpen(false)
          setSelectedVisitForStatus(null)
          setNewStatus('')
        }}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Cambiar Estado de la Visita</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id='estado-select-label'>Estado</InputLabel>
              <Select
                labelId='estado-select-label'
                value={newStatus}
                label='Estado'
                onChange={e => setNewStatus(e.target.value)}
                size='small'
              >
                <MenuItem value='CREADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='CREADA' size='small' color='primary' />
                  </Box>
                </MenuItem>
                <MenuItem value='ELIMINADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='ELIMINADA' size='small' color='error' />
                  </Box>
                </MenuItem>
                <MenuItem value='AGENDADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='AGENDADA' size='small' color='info' />
                  </Box>
                </MenuItem>
                <MenuItem value='SUSPENDIDA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='SUSPENDIDA' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='SUSPENDIDA_TERRENO'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='SUSPENDIDA TERRENO' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='COMPLETADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='COMPLETADA' size='small' color='success' />
                  </Box>
                </MenuItem>
                <MenuItem value='EN_REVISION'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='EN REVISION' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='ANULADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='ANULADA' size='small' color='error' />
                  </Box>
                </MenuItem>
                <MenuItem value='RECIBIDA_OK'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='RECIBIDA OK' size='small' color='success' />
                  </Box>
                </MenuItem>

                <MenuItem value='CODIFICADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='CODIFICADA' size='small' color='info' />
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsChangeStatusOpen(false)
              setSelectedVisitForStatus(null)
              setNewStatus('')
            }}
          >
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={handleChangeStatus}
            disabled={!newStatus || newStatus === selectedVisitForStatus?.estado}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Cambio de Estado Masivo */}
      <Dialog
        open={isBulkEditOpen}
        onClose={() => {
          setIsBulkEditOpen(false)
          setBulkNewStatus('')
        }}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Cambiar Estado de {selectedVisits.length} Visitas</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id='bulk-estado-select-label'>Nuevo Estado</InputLabel>
              <Select
                labelId='bulk-estado-select-label'
                value={bulkNewStatus}
                label='Nuevo Estado'
                onChange={e => setBulkNewStatus(e.target.value)}
                size='small'
              >
                <MenuItem value='CREADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='CREADA' size='small' color='primary' />
                  </Box>
                </MenuItem>
                <MenuItem value='ELIMINADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='ELIMINADA' size='small' color='error' />
                  </Box>
                </MenuItem>
                <MenuItem value='AGENDADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='AGENDADA' size='small' color='info' />
                  </Box>
                </MenuItem>
                <MenuItem value='SUSPENDIDA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='SUSPENDIDA' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='SUSPENDIDA_TERRENO'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='SUSPENDIDA TERRENO' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='COMPLETADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='COMPLETADA' size='small' color='success' />
                  </Box>
                </MenuItem>
                <MenuItem value='EN_REVISION'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='EN REVISION' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='ANULADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='ANULADA' size='small' color='error' />
                  </Box>
                </MenuItem>
                <MenuItem value='RECIBIDA_OK'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='RECIBIDA OK' size='small' color='success' />
                  </Box>
                </MenuItem>

                <MenuItem value='CODIFICADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='CODIFICADA' size='small' color='info' />
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsBulkEditOpen(false)
              setBulkNewStatus('')
            }}
          >
            Cancelar
          </Button>
          <Button variant='contained' onClick={handleBulkStatusChange} disabled={!bulkNewStatus}>
            Actualizar todas
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Cambio de Estado Especial (Botón !) */}
      <Dialog
        open={isSpecialStatusOpen}
        onClose={() => {
          setIsSpecialStatusOpen(false)
          setSpecialStatus('')
        }}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Cambiar Estado de la Visita</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel id='special-estado-select-label'>Estado</InputLabel>
              <Select
                labelId='special-estado-select-label'
                value={specialStatus}
                label='Estado'
                onChange={e => setSpecialStatus(e.target.value)}
                size='small'
              >

                <MenuItem value='EN_REVISION'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='EN REVISION' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='ANULADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='ANULADA' size='small' color='error' />
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsSpecialStatusOpen(false)
              setSpecialStatus('')
            }}
          >
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={handleSpecialStatusChange}
            disabled={!specialStatus}
          >
            Cambiar Estado
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>

      {/* Popover del buscador de servicios */}
      <Popover
        open={Boolean(serviciosBuscadorAnchorEl)}
        anchorEl={serviciosBuscadorAnchorEl}
        onClose={handleCloseServiciosBuscador}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '500px',
            maxHeight: '400px',
            overflow: 'auto',
            zIndex: 1
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size='small'
            placeholder='Buscar por nombre, descripción o código...'
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Área</InputLabel>
                <Select
                  value={selectedArea}
                  label='Área'
                  onChange={handleAreaChange}
                >
                  <MenuItem value=''>Todas</MenuItem>
                  {areas.map(area => (
                    <MenuItem key={area.id} value={area.nombre}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={selectedTipo}
                  label='Tipo'
                  onChange={handleTipoChange}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  {tipos.map(tipo => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl size='small' fullWidth>
                <InputLabel shrink>Familia</InputLabel>
                <Select
                  value={selectedFamilia}
                  label='Familia'
                  onChange={handleFamiliaChange}
                  displayEmpty
                  renderValue={selected => selected === '' ? 'Todas' : selected}
                  disabled={!selectedAreaId}
                >
                  <MenuItem value=''>Todas</MenuItem>
                  {familias.map(familia => (
                    <MenuItem key={familia.id} value={familia.nombre}>
                      {familia.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <FormControlLabel
            control={
              <Switch
                checked={showOnlyPaquetes}
                onChange={handleShowOnlyPaquetesChange}
                size='small'
              />
            }
            label='Solo paquetes'
            sx={{ mt: 2 }}
          />

          <List sx={{ pt: 2 }}>
            {filteredProductos.map(producto => (
              <ListItem
                key={producto.id}
                onClick={() => handleSelectProduct(producto)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  },
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body1'>
                        {producto.nombre}
                        {producto.norma && (
                          <Typography component='span' color='text.secondary'>
                            {' '}- {producto.norma}
                          </Typography>
                        )}
                      </Typography>
                      {producto.esPaquete && (
                        <Typography
                          variant='caption'
                          sx={{
                            backgroundColor: 'primary.main',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            ml: 1
                          }}
                        >
                          Paquete
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        {producto.area} - {producto.tipo} - {producto.familia}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
          {totalProductos > ITEMS_PER_PAGE && (
            <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button
                size='small'
                onClick={() => setProductsPage(prev => Math.max(0, prev - 1))}
                disabled={productsPage === 0}
              >
                Anterior
              </Button>
              <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                Página {productsPage + 1} de {Math.max(1, Math.ceil(totalProductos / ITEMS_PER_PAGE))}
              </Typography>
              <Button
                size='small'
                onClick={() =>
                  setProductsPage(prev => Math.min(Math.ceil(totalProductos / ITEMS_PER_PAGE) - 1, prev + 1))
                }
                disabled={productsPage >= Math.ceil(totalProductos / ITEMS_PER_PAGE) - 1}
              >
                Siguiente
              </Button>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Popover para mostrar el nombre completo de la obra */}
      <Popover
        id="obra-popover"
        open={isPopoverOpen}
        anchorEl={popoverAnchor}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          pointerEvents: 'none',
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(97, 97, 97, 0.92)',
            color: 'white',
            borderRadius: 1,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
            '& .MuiTypography-root': {
              color: 'white'
            }
          }
        }}
      >
        <Box sx={{ p: 1.5, maxWidth: 300 }}>
          <Typography variant="body2" sx={{ color: 'white', fontSize: '0.875rem' }}>
            {popoverContent}
          </Typography>
        </Box>
      </Popover>
    </Grid>
  )
}

export default VisitListTable
