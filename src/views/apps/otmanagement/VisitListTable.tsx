'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

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
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null) // Solo permite una selección de fila
  const [data, setData] = useState(tableData || [])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedLaboratorista, setSelectedLaboratorista] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [porRecibir, setPorRecibir] = useState(false)
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

  // Hooks
  // const { lang: locale } = useParams()

  // Efecto para inicializar fechas con la fecha actual
  useEffect(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const fechaActual = `${year}-${month}-${day}`

    setFechaInicio(fechaActual)
    setFechaFin(fechaActual)
  }, [])

  // Efecto para actualizar los datos filtrados
  useEffect(() => {
    let result = [...data]

    // Filtrar por rango de fechas
    if (fechaInicio || fechaFin) {
      result = result.filter(item => {
        // Usar parseDateFromBackend para manejar correctamente las fechas del backend
        const itemDate = parseDateFromBackend(item.fechaInicio.toString())

        let isInRange = true

        // Verificar fecha de inicio
        if (fechaInicio) {
          const filterStartDate = new Date(fechaInicio + 'T00:00:00')
          isInRange = isInRange && itemDate >= filterStartDate
        }

        // Verificar fecha de fin
        if (fechaFin) {
          const filterEndDate = new Date(fechaFin + 'T23:59:59')
          isInRange = isInRange && itemDate <= filterEndDate
        }

        return isInRange
      })
    }

    // Filtrar por estado
    if (selectedEstado) {
      result = result.filter(item => item.estado.toLowerCase() === selectedEstado.toLowerCase())
    }

    // Filtrar por laboratorista
    if (selectedLaboratorista) {
      result = result.filter(item =>
        item.asignados?.some(asignado =>
          asignado.user?.name?.toLowerCase().includes(selectedLaboratorista.toLowerCase())
        )
      )
    }

    // Filtrar por "Por Recibir"
    if (porRecibir) {
      result = result.filter(
        item => !item.horaLlegada && !item.horaSalida // Si no tiene hora de llegada ni salida, está por recibir
      )
    }

    setFilteredData(result)
  }, [data, fechaInicio, fechaFin, selectedEstado, selectedLaboratorista, porRecibir])

  // Efecto para actualizar data cuando cambia tableData
  useEffect(() => {
    setData(tableData || [])
  }, [tableData])

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSelectedLaboratorista(event.target.value)
  }

  const handleEstadoChange = (event: SelectChangeEvent) => {
    setSelectedEstado(event.target.value)
  }

  const handlePorRecibirChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPorRecibir(event.target.checked)
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
      columnHelper.accessor(row => row.cliente?.nombreCliente || 'Sin Cliente', {
        id: 'cliente',
        header: 'Cliente',
        cell: info => (
          <Typography className='capitalize' color='text.primary'>
            {info.getValue()}
          </Typography>
        )
      }),
      columnHelper.accessor(row => row.obra?.numeroObra || 'Sin Obra', {
        id: 'obra',
        header: 'Obra',
        cell: info => (
          <Typography className='capitalize' color='text.primary'>
            {info.getValue()}
          </Typography>
        )
      }),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: info => {
          const estado = info.getValue()
          let color: 'info' | 'success' | 'warning' | 'error' | 'primary' = 'primary'

          switch (estado) {
            case 'AGENDADA':
              color = 'info'
              break
            case 'COMPLETADA':
              color = 'success'
              break
            case 'SUSPENDIDA':
              color = 'warning'
              break
            case 'CANCELADA':
              color = 'error'
              break
            case 'REVISIÓN':
              color = 'warning'
              break
            case 'OK':
              color = 'success'
              break
            default:
              color = 'primary'
          }

          return <Chip variant='tonal' label={estado} size='small' color={color} />
        }
      }),
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
                    className: 'flex items-center gap-2 text-textSecondary',
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
                    className: 'flex items-center gap-2 text-textSecondary',
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
    data: filteredData,
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
    console.log('Filtered Data:', filteredData)
    console.log('Table Rows:', table.getRowModel().rows)
  }, [filteredData, table])

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
                <Select value={selectedLaboratorista} onChange={handleSelectChange} displayEmpty fullWidth size='small'>
                  <MenuItem value=''>Todos los Laboratoristas</MenuItem>
                  <MenuItem value='Juan Pérez'>Juan Pérez</MenuItem>
                  <MenuItem value='María González'>María González</MenuItem>
                  <MenuItem value='Carlos Rodríguez'>Carlos Rodríguez</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Select value={selectedEstado} onChange={handleEstadoChange} displayEmpty fullWidth size='small'>
                  <MenuItem value=''>Todos los Estados</MenuItem>
                  <MenuItem value='AGENDADA'>Agendada</MenuItem>
                  <MenuItem value='COMPLETADA'>Completada</MenuItem>
                  <MenuItem value='SUSPENDIDA'>Suspendida</MenuItem>
                  <MenuItem value='CANCELADA'>Cancelada</MenuItem>
                  <MenuItem value='REVISIÓN'>Revisión</MenuItem>
                  <MenuItem value='OK'>OK</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={3}>
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
                    // Limpiar filtros
                    setFechaInicio('')
                    setFechaFin('')
                    setSelectedLaboratorista('')
                    setSelectedEstado('')
                    setPorRecibir(false)
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
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} style={{ cursor: 'pointer' }}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <TablePagination
                rowsPerPageOptions={[6, 10, 25, 50]}
                component='div'
                count={table.getFilteredRowModel().rows.length}
                rowsPerPage={table.getState().pagination.pageSize}
                page={table.getState().pagination.pageIndex}
                onPageChange={(_, page) => table.setPageIndex(page)}
                onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
              />
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
                <MenuItem value='AGENDADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='AGENDADA' size='small' color='info' />
                  </Box>
                </MenuItem>
                <MenuItem value='COMPLETADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='COMPLETADA' size='small' color='success' />
                  </Box>
                </MenuItem>
                <MenuItem value='SUSPENDIDA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='SUSPENDIDA' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='CANCELADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='CANCELADA' size='small' color='error' />
                  </Box>
                </MenuItem>
                <MenuItem value='REVISIÓN'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='REVISIÓN' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='OK'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='OK' size='small' color='success' />
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
                <MenuItem value='AGENDADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='AGENDADA' size='small' color='info' />
                  </Box>
                </MenuItem>
                <MenuItem value='COMPLETADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='COMPLETADA' size='small' color='success' />
                  </Box>
                </MenuItem>
                <MenuItem value='SUSPENDIDA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='SUSPENDIDA' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='CANCELADA'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='CANCELADA' size='small' color='error' />
                  </Box>
                </MenuItem>
                <MenuItem value='REVISIÓN'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='REVISIÓN' size='small' color='warning' />
                  </Box>
                </MenuItem>
                <MenuItem value='OK'>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label='OK' size='small' color='success' />
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
    </Grid>
  )
}

export default VisitListTable
