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
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedLaboratorista, setSelectedLaboratorista] = useState('')
  const [selectedEstado, setSelectedEstado] = useState<string[]>(todosLosEstados) // Inicializar con todos los estados seleccionados
  const [porRecibir, setPorRecibir] = useState(true)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [selectedOT, setSelectedOT] = useState<OrdenTrabajo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
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

  // Estado para laboratoristas
  const [laboratoristas, setLaboratoristas] = useState<Array<{ id: string, name: string }>>([])
  const [loadingLaboratoristas, setLoadingLaboratoristas] = useState(false)

  // Estados para filtros de cliente y obra
  const [selectedCliente, setSelectedCliente] = useState('')
  const [selectedObra, setSelectedObra] = useState('')
  const [clientes, setClientes] = useState<Array<{ clienteId: number, nombreCliente: string, rut: string }>>([])
  const [obras, setObras] = useState<Array<{ obraId: number, nombreObra: string, numeroObra: string }>>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loadingObras, setLoadingObras] = useState(false)

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
  const fetchObras = async (clienteId: string) => {
    try {
      setLoadingObras(true)

      // Encontrar el RUT del cliente seleccionado
      const clienteSeleccionado = clientes.find(c => c.clienteId.toString() === clienteId)
      if (!clienteSeleccionado) {
        console.warn('Cliente seleccionado no encontrado en la lista')
        setObras([])
        return
      }

      console.log('Cargando obras para cliente RUT:', clienteSeleccionado.rut)
      const response = await fetch(`/api/obras?rut=${encodeURIComponent(clienteSeleccionado.rut)}`)

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
    globalFilter?: string
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
      if (filters.globalFilter) params.append('search', filters.globalFilter)
      if (filters.clienteId) params.append('clienteId', filters.clienteId)
      if (filters.obraId) params.append('obraId', filters.obraId)

      const response = await fetch(`/api/agenda?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Error al cargar las visitas')
      }

      const visitas = await response.json()
      setData(visitas)
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

  // Efecto para cargar datos cuando cambian los filtros (excepto globalFilter)
  useEffect(() => {
    if (fechaInicio || fechaFin) { // Solo hacer llamada si hay al menos una fecha
      fetchVisitasWithFilters({
        fechaInicio,
        fechaFin,
        estado: selectedEstado.length > 0 ? selectedEstado.join(',') : '',
        laboratorista: selectedLaboratorista,
        porRecibir,
        globalFilter,
        clienteId: selectedCliente,
        obraId: selectedObra
      })
    }
  }, [fechaInicio, fechaFin, selectedEstado, selectedLaboratorista, porRecibir, selectedCliente, selectedObra])

  // Debounce para la búsqueda global
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fechaInicio || fechaFin) { // Solo hacer llamada si hay al menos una fecha
        fetchVisitasWithFilters({
          fechaInicio,
          fechaFin,
          estado: selectedEstado.length > 0 ? selectedEstado.join(',') : '',
          laboratorista: selectedLaboratorista,
          porRecibir,
          globalFilter,
          clienteId: selectedCliente,
          obraId: selectedObra
        })
      }
    }, 500) // 500ms de delay

    return () => clearTimeout(timer)
  }, [globalFilter])

  // Efecto para depurar la carga de clientes
  useEffect(() => {
    console.log('Estado de clientes actualizado:', clientes.length, 'clientes cargados')
  }, [clientes])

  // Efecto para depurar la carga de obras
  useEffect(() => {
    console.log('Estado de obras actualizado:', obras.length, 'obras cargadas')
  }, [obras])

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectedLaboratorista(event.target.value)
  }

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

  const handleClienteChange = (event: SelectChangeEvent) => {
    const clienteId = event.target.value
    setSelectedCliente(clienteId)

    // Limpiar obra seleccionada cuando cambia el cliente
    setSelectedObra('')
    setObras([])

    // Cargar obras del cliente seleccionado
    if (clienteId) {
      fetchObras(clienteId)
    }
  }

  const handleObraChange = (event: SelectChangeEvent) => {
    setSelectedObra(event.target.value)
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

            // Mostrar los primeros 2 servicios
            const serviciosVisibles = servicios.slice(0, 2)
            const serviciosRestantes = servicios.length - 2

            return (
              <Box>
                {serviciosVisibles.map((servicio, index) => (
                  <Typography key={index} variant='body2' color='text.primary'>
                    • {servicio.servicio} ({servicio.cantidad})
                  </Typography>
                ))}
                {serviciosRestantes > 0 && (
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
                      <Icon className='ri-add-circle-line' style={{ fontSize: '16px', marginRight: '4px' }} />
                      <Typography variant='caption'>
                        {serviciosRestantes} más
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
              menuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#424242',
                    color: 'white',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': {
                        backgroundColor: '#616161'
                      },
                      '&.Mui-disabled': {
                        color: '#9e9e9e'
                      }
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'white'
                    }
                  }
                }
              }}
              options={[
                {
                  text: 'Ver Comprobante',
                  icon: 'ri-file-pdf-line',
                  menuItemProps: {
                    className: 'flex items-center gap-2',
                    onClick: () => {
                      if (row.original.ordenesTrabajo?.[0]) {
                        setSelectedOT(row.original.ordenesTrabajo[0])
                        setPdfModalOpen(true)
                      }
                    },
                    disabled: !row.original.ordenesTrabajo?.length
                  }
                },
                {
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
                }
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
      fuzzy: fuzzyFilter
    },
    state: {
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10 // Aumentamos el tamaño de página para ver más registros
      }
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
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
              {/* Primera Fila: 2-2-3-3-2 */}
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
              <Grid item xs={12} sm={3}>
                <Select
                  value={selectedCliente}
                  onChange={handleClienteChange}
                  displayEmpty
                  fullWidth
                  size='small'
                  disabled={loadingClientes}
                >
                  <MenuItem value=''>
                    {loadingClientes ? 'Cargando...' : 'Todos los Clientes'}
                  </MenuItem>
                  {clientes.map((cliente) => (
                    <MenuItem key={cliente.clienteId} value={cliente.clienteId.toString()}>
                      {cliente.nombreCliente}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Select
                  value={selectedObra}
                  onChange={handleObraChange}
                  displayEmpty
                  fullWidth
                  size='small'
                  disabled={loadingObras || !selectedCliente}
                >
                  <MenuItem value=''>
                    {loadingObras ? 'Cargando...' : !selectedCliente ? 'Seleccione un cliente' : 'Todas las Obras'}
                  </MenuItem>
                  {obras.map((obra) => (
                    <MenuItem key={obra.obraId} value={obra.obraId.toString()}>
                      {obra.numeroObra} - {obra.nombreObra}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>

              {/* Segunda fila: Laboratorista, Estados, etc. */}
              <Grid item xs={12} sm={3}>
                <Select
                  value={selectedLaboratorista}
                  onChange={handleSelectChange}
                  displayEmpty
                  fullWidth
                  size='small'
                  disabled={loadingLaboratoristas}
                >
                  <MenuItem value=''>
                    {loadingLaboratoristas ? 'Cargando...' : 'Todos los Laboratoristas'}
                  </MenuItem>
                  {laboratoristas.map((lab) => (
                    <MenuItem key={lab.id} value={lab.name}>
                      {lab.name}
                    </MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12} sm={3}>
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
              <Grid item xs={12} sm={2}>
                <FormControlLabel
                  control={<Checkbox checked={porRecibir} onChange={handlePorRecibirChange} />}
                  label='Por Recibir'
                />
              </Grid>

              {/* Segunda Fila: 2-8-2 */}
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
                    setGlobalFilter('')
                    setSelectedCliente('')
                    setSelectedObra('')
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
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Buscar'
                  onChange={e => setGlobalFilter(e.target.value)}
                  InputProps={{
                    startAdornment: <i className='ri-search-line' style={{ marginRight: '8px', color: '#aaa' }}></i>
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Contenedor Principal con Flexbox */}
          <Box display='flex' sx={{ height: '500px' }}>
            {/* Tabla */}
            <Box sx={{ width: '75%', borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
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
                                <div className='cursor-pointer select-none'>
                                  {flexRender(header.column.columnDef.header, header.getContext())}
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

            {/* Detalles de la Visita */}
            <Box
              sx={{
                width: '25%',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%'
              }}
            >
              {selectedVisit ? (
                <>
                  {/* Encabezado con botones */}
                  <Grid container spacing={1}>
                    {isEditing ? (
                      <>
                        <Grid item xs={6}>
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
                        <Grid item xs={6}>
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
                        <Grid item xs={9}>
                          <Button
                            variant='contained'
                            color='primary'
                            size='small'
                            fullWidth
                            onClick={handleStartEditing}
                          >
                            Editar
                          </Button>
                        </Grid>
                        <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <IconButton color='error' size='small'>
                            <i className='ri-delete-bin-line' />
                          </IconButton>
                        </Grid>
                      </>
                    )}
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Información Principal: Hora Llegada y Salida */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size='small'
                          label='Hora Llegada'
                          value={editedVisit.horaLlegada || ''}
                          onChange={e => handleFieldChange('horaLlegada', e.target.value)}
                        />
                      ) : (
                        <Typography variant='body2'>
                          Hora Llegada: <strong>{selectedVisit.horaLlegada || '---'}</strong>
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size='small'
                          label='Hora Salida'
                          value={editedVisit.horaSalida || ''}
                          onChange={e => handleFieldChange('horaSalida', e.target.value)}
                        />
                      ) : (
                        <Typography variant='body2'>
                          Hora Salida: <strong>{selectedVisit.horaSalida || '---'}</strong>
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size='small'
                          label='Movilización'
                          value={editedVisit.movilizacion || ''}
                          onChange={e => handleFieldChange('movilizacion', e.target.value)}
                        />
                      ) : (
                        <Typography variant='body2'>
                          Movilización: <strong>{selectedVisit.movilizacion || '---'}</strong>
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          size='small'
                          label='Km Adicionales'
                          value={editedVisit.kmAdicionales || ''}
                          onChange={e => handleFieldChange('kmAdicionales', e.target.value)}
                        />
                      ) : (
                        <Typography variant='body2'>
                          Km Adicionales: <strong>{selectedVisit.kmAdicionales || '---'}</strong>
                        </Typography>
                      )}
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Servicios Agendado y Extras */}
                  <Box mb={2}>
                    <Typography variant='subtitle2' fontWeight='bold'>
                      Servicios Agendado vs Completado
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant='subtitle2' fontWeight='bold'>
                      Extras Agendados:
                    </Typography>
                  </Box>

                  {/* Botones: PDF, En Revisión, Recepción OK */}
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Button
                        variant='outlined'
                        color='primary'
                        fullWidth
                        size='small'
                        onClick={handlePDFClick}
                        startIcon={<i className='ri-file-pdf-line' style={{ color: '#FF0000' }} />}
                        disabled={!selectedVisit?.ordenesTrabajo?.length}
                      >
                        PDF
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
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
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        variant='outlined'
                        color='success'
                        fullWidth
                        size='small'
                        onClick={handleOKClick}
                        disabled={!selectedVisit?.ordenesTrabajo?.length}
                      >
                        OK
                      </Button>
                    </Grid>
                  </Grid>
                </>
              ) : (
                <Typography variant='body2' color='text.secondary' textAlign='center'>
                  Seleccione una visita para ver los detalles
                </Typography>
              )}
            </Box>
          </Box>
        </Card>
      </Grid>

      {/* Modal del PDF */}
      <PDFModal open={pdfModalOpen} onClose={() => setPdfModalOpen(false)} ot={selectedOT || undefined}>
        {selectedOT && <AceptacionVisitaPDF ot={selectedOT} />}
      </PDFModal>

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
                    <Chip label='SUSPENDIDA_TERRENO' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='COMPLETADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='COMPLETADA' size='small' color='success' />
                  </Box>
                </MenuItem>
                <MenuItem value='EN_REVISION'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='EN_REVISION' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='ANULADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='ANULADA' size='small' color='error' />
                  </Box>
                </MenuItem>
                <MenuItem value='RECIBIDA_OK'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='RECIBIDA_OK' size='small' color='success' />
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
                    <Chip label='SUSPENDIDA_TERRENO' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='COMPLETADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='COMPLETADA' size='small' color='success' />
                  </Box>
                </MenuItem>
                <MenuItem value='EN_REVISION'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='EN_REVISION' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='ANULADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='ANULADA' size='small' color='error' />
                  </Box>
                </MenuItem>
                <MenuItem value='RECIBIDA_OK'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='RECIBIDA_OK' size='small' color='success' />
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
