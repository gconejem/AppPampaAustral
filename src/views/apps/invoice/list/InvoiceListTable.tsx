'use client'

// React Imports
import { useState, useEffect, Fragment } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import * as XLSX from 'xlsx'

// Función para formatear números UF con formato español (coma decimal y 2 decimales)
const formatUF = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0,00';

  // Usar toFixed(2) para asegurar exactamente 2 decimales
  const formatted = Number(value).toFixed(2);

  // Reemplazar punto por coma para formato español
  return formatted.replace('.', ',');
};
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'
import { toast } from 'react-hot-toast'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MuiLink from '@mui/material/Link'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import TablePagination from '@mui/material/TablePagination'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { es } from 'date-fns/locale'
import { ROLES_CONTACTO } from '@/constants/roles'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

interface InvoiceListTableProps {
  invoiceData?: InvoiceType[]
  onCotizacionDeleted?: () => void
  onDataFiltered?: (data: any[]) => void
}

const tiposCotizacion = [
  { value: '', label: 'Todos' },
  { value: 'A', label: 'Valores Unitarios' },
  { value: 'B', label: 'EMS' },
  { value: 'C', label: 'Mensual' }
]

const estadosCotizacion = [
  { value: '', label: 'Todos' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'COTIZADA', label: 'Cotizada' },
  { value: 'GESTIONADA', label: 'Gestionada' },
  { value: 'ACEPTADA', label: 'Aceptada' },
  { value: 'SIN_RESPUESTA', label: 'Sin Respuesta' },
  { value: 'RECHAZADA', label: 'Rechazada' }
]

const InvoiceListTable = ({ invoiceData, onCotizacionDeleted, onDataFiltered }: InvoiceListTableProps) => {
  // Configuración de localización
  const locale = 'es'

  // Estados de la tabla
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [localData, setLocalData] = useState<InvoiceType[]>(invoiceData || [])

  // Estados de los modales y diálogos
  const [openPreview, setOpenPreview] = useState(false)
  const [selectedCotizacion, setSelectedCotizacion] = useState<any>(null)
  const [contactsModalOpen, setContactsModalOpen] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<any[]>([])
  const [gestionDialogOpen, setGestionDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)

  // Estados de los menús y selecciones
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [cotizacionToDelete, setCotizacionToDelete] = useState<number | null>(null)
  const [selectedCotizacionForPDF, setSelectedCotizacionForPDF] = useState<InvoiceType | null>(null)

  // Estados de gestión y PDF
  const [gestionText, setGestionText] = useState('')
  const [pendingEstado, setPendingEstado] = useState<string | null>(null)
  const [pdfHtmlContent, setPdfHtmlContent] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  // Estados de paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Obtener el primer y último día del mes actual en formato YYYY-MM-DD
  const getFirstAndLastDayOfMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    // Primer día del mes
    const firstDay = new Date(year, month, 1)
    const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`

    // Último día del mes
    const lastDay = new Date(year, month + 1, 0)
    const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

    return { firstDayStr, lastDayStr }
  }

  const { firstDayStr, lastDayStr } = getFirstAndLastDayOfMonth()

  // Estados de filtros
  const [filtroFecha, setFiltroFecha] = useState<string>(firstDayStr)
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>(lastDayStr)
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')

  const formatearFecha = (fecha: string) => {
    if (!fecha) return 'No especificada'

    try {
      // Si la fecha viene en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ), extraer solo la parte de la fecha
      let fechaStr = fecha
      if (fecha.includes('T')) {
        fechaStr = fecha.split('T')[0] // Obtener solo YYYY-MM-DD
      }

      // Crear fecha usando los componentes individuales para evitar problemas de zona horaria
      const [año, mes, dia] = fechaStr.split('-').map(Number)

      // Verificar que los componentes sean válidos
      if (!año || !mes || !dia || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
        return 'Fecha inválida'
      }

      // Formatear como DD/MM/YYYY
      const diaFormateado = dia.toString().padStart(2, '0')
      const mesFormateado = mes.toString().padStart(2, '0')

      return `${diaFormateado}-${mesFormateado}-${año}`
    } catch (error) {
      console.error('Error al formatear fecha:', error)
      return 'Error en fecha'
    }
  }

  // Función auxiliar para formatear fechas
  const formatDate = (date: Date | string) => {
    // Si la fecha ya está en formato dd-mm-aaaa, la retornamos directamente
    if (typeof date === 'string' && date.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return date
    }

    // Si es un string en otro formato, lo convertimos a Date
    const d = typeof date === 'string' ? new Date(date) : date

    // Verificamos si la fecha es válida
    if (isNaN(d.getTime())) {
      console.error('Fecha inválida:', date)
      return 'Fecha inválida'
    }

    // Formateamos la fecha al formato deseado
    return d.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-')
  }

  // Función para resetear la página cuando se apliquen filtros
  const resetPage = () => {
    setPage(0)
  }

  // Función para cargar las cotizaciones con filtros
  const fetchCotizaciones = async (fechaInicio?: string, fechaFin?: string) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (fechaInicio) params.append('fechaInicio', fechaInicio)
      if (fechaFin) params.append('fechaFin', fechaFin)

      console.log('=== FRONTEND: Enviando filtros ===')
      console.log('Fecha Inicio:', fechaInicio)
      console.log('Fecha Fin:', fechaFin)
      console.log('URL:', `/api/cotizaciones?${params.toString()}`)

      const response = await fetch(`/api/cotizaciones?${params.toString()}`)
      if (!response.ok) throw new Error('Error al cargar cotizaciones')

      const data = await response.json()
      console.log('=== FRONTEND: Datos recibidos ===')
      console.log('Total cotizaciones:', data.length)
      if (data.length > 0) {
        console.log('Todas las cotizaciones recibidas:')
        data.forEach((c: any) => {
          console.log(`  - ${c.numeroCotizacion}: ${c.fecha}`)
        })
      }

      setLocalData(data)
      // Notificar inmediatamente con los datos cargados
      onDataFiltered?.(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cotizaciones')
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar cotizaciones al montar el componente
  useEffect(() => {
    if (invoiceData) {
      setLocalData(invoiceData)
      onDataFiltered?.(invoiceData)
    } else {
      // Cargar datos del mes actual al iniciar
      fetchCotizaciones(filtroFecha, filtroFechaFin)
    }
  }, [invoiceData])

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    resetPage()
  }, [filtroTipo, filtroEstado, globalFilter])

  // Aplicar filtros combinados cuando cambien tipo o estado
  useEffect(() => {
    // Recalcular filteredData aquí para asegurar que se use el valor más reciente
    const filtered = localData?.filter(row => {
      if (filtroTipo && row.tipo !== filtroTipo) return false
      if (filtroEstado && row.estado !== filtroEstado) return false

      if (!globalFilter) return true

      const searchStr = globalFilter.toLowerCase()
      return (
        row.numeroCotizacion?.toLowerCase().includes(searchStr) ||
        row.comuna?.toLowerCase().includes(searchStr) ||
        row.empresa?.toLowerCase().includes(searchStr) ||
        row.contacto?.nombre?.toLowerCase().includes(searchStr)
      )
    })

    if (filtered) {
      console.log('=== FILTROS APLICADOS ===')
      console.log('Tipo:', filtroTipo || 'Todos')
      console.log('Estado:', filtroEstado || 'Todos')
      console.log('Búsqueda:', globalFilter || 'Sin búsqueda')
      console.log('Total después de filtrar:', filtered.length)
      console.log('Total cotizado:', filtered.reduce((acc, c) => acc + (c.total || 0), 0))
      onDataFiltered?.(filtered)
    }
  }, [filtroTipo, filtroEstado, globalFilter, localData, onDataFiltered])

  // Modificar los manejadores de cambio de fecha
  const handleFechaInicioChange = (date: Date | null) => {
    if (!date) {
      setFiltroFecha('')
      resetPage()
      return
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const newFecha = `${year}-${month}-${day}`
    setFiltroFecha(newFecha)
    resetPage()
    fetchCotizaciones(newFecha, filtroFechaFin)
  }

  const handleFechaFinChange = (date: Date | null) => {
    if (!date) {
      setFiltroFechaFin('')
      resetPage()
      return
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const newFecha = `${year}-${month}-${day}`
    setFiltroFechaFin(newFecha)
    resetPage()
    fetchCotizaciones(filtroFecha, newFecha)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredData) {
      setSelectedRows(prev => [...new Set([...prev, ...filteredData.map(row => row.id)])])
    } else {
      // Deseleccionar todas las filas filtradas
      setSelectedRows([])
    }
  }

  const handleSelectOne = (checked: boolean, id: number) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id])
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id))
    }
  }

  const handleExport = () => {
    try {
      setIsLoading(true)

      if (selectedRows.length === 0) {
        toast.error('Por favor, seleccione al menos una cotización para exportar')
        return
      }

      const selectedData = localData?.filter(row => selectedRows.includes(row.id)) || []

      // Preparar los datos para Excel
      const excelData = selectedData.map(row => ({
        'N° COTIZACIÓN': row.numeroCotizacion,
        'FECHA': formatDate(row.fecha),
        'COMUNA': row.comuna,
        'EMPRESA': row.empresa || 'No especificada',
        'TIPO': getTipoLabel(row.tipo),
        'CONTACTO': row.contacto?.nombre || '',
        'ESTADO': row.estado,
        'TOTAL UF': row.total,
        'OBSERVACIONES': row.observacionGestion || ''
      }))

      // Crear el libro de trabajo
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Cotizaciones')

      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 15 }, // N° COTIZACIÓN
        { wch: 12 }, // FECHA
        { wch: 15 }, // COMUNA
        { wch: 25 }, // EMPRESA
        { wch: 18 }, // TIPO
        { wch: 25 }, // CONTACTO
        { wch: 15 }, // ESTADO
        { wch: 12 }, // TOTAL UF
        { wch: 30 }  // OBSERVACIONES
      ]
      worksheet['!cols'] = columnWidths

      // Generar el archivo Excel
      const fileName = selectedData.length === 1
        ? `Cotizacion_${selectedData[0].numeroCotizacion}.xlsx`
        : `Cotizaciones_${new Date().toISOString().split('T')[0]}.xlsx`

      XLSX.writeFile(workbook, fileName)

      toast.success(`${selectedData.length} cotización(es) exportada(s) exitosamente`)
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar cotizaciones')
    } finally {
      setIsLoading(false)
    }
  }

  const getEstadoColor = (estado: InvoiceType['estado']) => {
    switch (estado) {
      case 'BORRADOR':
        return 'default'
      case 'COTIZADA':
        return 'info'
      case 'GESTIONADA':
        return 'warning'
      case 'ACEPTADA':
        return 'success'
      case 'SIN_RESPUESTA':
        return 'error'
      case 'RECHAZADA':
        return 'error'
      default:
        return 'default'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'A':
        return 'Valores Unitarios'
      case 'B':
        return 'EMS'
      case 'C':
        return 'Mensual'
      case 'D':
        return 'Genérica'
      default:
        return 'No especificado'
    }
  }

  const getTipoColor = (tipo: InvoiceType['tipo']) => {
    if (!tipo) return 'default'

    switch (tipo) {
      case 'VALORES_UNITARIOS':
        return 'primary'
      case 'EMS':
        return 'info'
      case 'MENSUAL':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const handlePreviewClick = async (id: number) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cotizaciones/${id}`)

      if (!response.ok) {
        throw new Error('Error al cargar la cotización')
      }

      const data = await response.json()

      // Logs detallados para debug
      console.log('Datos completos de la cotización:', data)
      console.log('Detalles recibidos:', data.detalles)
      console.log('Contacto recibido:', data.contacto)

      // Asegurarnos de que los detalles incluyan la información completa del producto
      if (data.detalles?.length > 0) {
        data.detalles.forEach((detalle: any, index: number) => {
          console.log(`Detalle ${index + 1}:`, {
            productoId: detalle.productoId,
            producto: detalle.producto,
            esPaquete: detalle.esPaquete,
            esSubProducto: detalle.esSubProducto,
            paqueteId: detalle.paqueteId
          })
        })
      }

      setSelectedCotizacion(data)
      console.log('selectedCotizacion', data)
      setOpenPreview(true)
    } catch (error) {
      console.error('Error al cargar la cotización:', error)
      toast.error('Error al cargar la cotización')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEstadoClick = (event: React.MouseEvent<HTMLElement>, id: number) => {
    setAnchorEl(event.currentTarget)
    setSelectedRowId(id)
  }

  const handleEstadoClose = () => {
    setAnchorEl(null)
    setSelectedRowId(null)
  }

  const handleEstadoChange = async (newEstado: string) => {
    if (!selectedRowId) return

    console.log('newEstado', newEstado)

    // Si el nuevo estado es 'GESTIONADA' o 'RECHAZADA', mostrar el modal para ingresar texto
    if (newEstado === 'GESTIONADA' || newEstado === 'RECHAZADA') {
      // Precargar la observación guardada
      const cotizacion = localData.find(row => row.id === selectedRowId)
      setGestionText(cotizacion?.observacionGestion || '')
      setPendingEstado(newEstado)
      setGestionDialogOpen(true)
      return
    }

    await updateEstadoCotizacion(newEstado)
  }

  // Nueva función para actualizar el estado y enviar texto de gestión
  const updateEstadoCotizacion = async (newEstado: string, gestionTextValue?: string) => {
    try {
      const response = await fetch(`/api/cotizaciones/${selectedRowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: newEstado,
          fechaActualizacion: new Date().toISOString(),
          gestionText: gestionTextValue || undefined
        })
      })

      if (!response.ok) {
        const error = await response.text()

        throw new Error(error || 'Error al actualizar el estado')
      }

      // Si la actualización en el servidor fue exitosa, actualizamos la UI
      const updatedData = await response.json()

      const newLocalData = localData.map(row => (row.id === selectedRowId ? { ...row, estado: updatedData.estado } : row))
      setLocalData(newLocalData)
      onDataFiltered?.(newLocalData)

      toast.success('Estado actualizado correctamente')

      // Opcional: Recargar los datos completos con los filtros actuales
      fetchCotizaciones(filtroFecha, filtroFechaFin)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el estado: ' + (error as Error).message)
    }

    handleEstadoClose()
  }

  const handleDeleteCotizacion = async () => {
    if (!cotizacionToDelete) return

    try {
      const response = await fetch(`/api/cotizaciones/${cotizacionToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la cotización')
      }

      const updatedData = localData.filter(row => row.id !== cotizacionToDelete)
      setLocalData(updatedData)
      onDataFiltered?.(updatedData)
      toast.success('Cotización eliminada correctamente')
      onCotizacionDeleted?.()
    } catch (error) {
      toast.error('No se pudo eliminar la cotización')
    } finally {
      setDeleteDialogOpen(false)
      setCotizacionToDelete(null)
    }
  }

  // Funciones de paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Modificar filteredData para solo filtrar por tipo, estado y búsqueda global
  const filteredData = localData?.filter(row => {
    if (filtroTipo && row.tipo !== filtroTipo) return false
    if (filtroEstado && row.estado !== filtroEstado) return false

    if (!globalFilter) return true

    const searchStr = globalFilter.toLowerCase()
    return (
      row.numeroCotizacion?.toLowerCase().includes(searchStr) ||
      row.comuna?.toLowerCase().includes(searchStr) ||
      row.empresa?.toLowerCase().includes(searchStr) ||
      row.contacto?.nombre?.toLowerCase().includes(searchStr)
    )
  })

  // Aplicar paginación a los datos filtrados
  const paginatedData = filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) || []

  const ContactsModal = ({ open, handleClose, contact }: { open: boolean; handleClose: () => void; contact: any }) => {
    if (!contact) return null

    return (
      <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>Información del Contacto</DialogTitle>
        <DialogContent>
          <div className='mb-4 p-4 border rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <i className='ri-user-line text-primary' />
              <Typography variant='subtitle1'>{contact.nombre}</Typography>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='flex items-center gap-2'>
                <i className='ri-briefcase-line text-textSecondary' />
                <Typography>{ROLES_CONTACTO.find(c => c.value === contact.cargo)?.label || contact.cargo || 'No especificado'}</Typography>
              </div>
              <div className='flex items-center gap-2'>
                <i className='ri-mail-line text-textSecondary' />
                {contact.email ? (
                  <MuiLink href={`mailto:${contact.email}`} sx={{ textDecoration: 'none' }}>
                    {contact.email}
                  </MuiLink>
                ) : (
                  <Typography>No especificado</Typography>
                )}
              </div>
              <div className='flex items-center gap-2'>
                <i className='ri-phone-line text-textSecondary' />
                {contact.telefono1 ? (
                  <MuiLink href={`tel:${contact.telefono1}`} sx={{ textDecoration: 'none' }}>
                    {contact.telefono1}
                  </MuiLink>
                ) : (
                  <Typography>No especificado</Typography>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    )
  }

  const handleDownloadPDF = async (id: number) => {
    try {
      const response = await fetch(`/api/cotizaciones/${id}/pdf`)
      if (!response.ok) {
        throw new Error('Error al descargar el PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizacion-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al descargar el PDF:', error)
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  }

  const handlePreviewPDF = async (id: number) => {
    try {
      setPdfLoading(true)
      const response = await fetch(`/api/cotizaciones/${id}/pdf?preview=1`)
      if (!response.ok) {
        throw new Error('Error al cargar la previsualización')
      }
      const html = await response.text()
      setPdfHtmlContent(html)
      setSelectedCotizacionForPDF(localData.find(row => row.id === id) || null)
      setPdfPreviewOpen(true)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar la previsualización')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <Card>
      {/* Fila de filtros */}
      <Card sx={{ boxShadow: 'none', mb: 0 }}>
        <Grid container spacing={2} alignItems="center" sx={{ px: 3, pt: 3 }}>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Inicio"
                value={filtroFecha ? new Date(filtroFecha + 'T00:00:00') : null}
                onChange={handleFechaInicioChange}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Fin"
                value={filtroFechaFin ? new Date(filtroFechaFin + 'T00:00:00') : null}
                onChange={handleFechaFinChange}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel shrink>Tipo Cotización</InputLabel>
              <Select
                value={filtroTipo || ''}
                label="Tipo Cotización"
                onChange={e => {
                  const value = e.target.value
                  setFiltroTipo(value)
                }}
                displayEmpty
              >
                {tiposCotizacion.map(tipo => (
                  <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel shrink>Estado</InputLabel>
              <Select
                value={filtroEstado || ''}
                label="Estado"
                onChange={e => {
                  const value = e.target.value
                  setFiltroEstado(value)
                }}
                displayEmpty
              >
                {estadosCotizacion.map(estado => (
                  <MenuItem key={estado.value} value={estado.value}>{estado.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>
      {/* Fila de exportar y buscar */}
      <div className='flex justify-between p-5 pt-2 gap-4 flex-col items-start sm:flex-row sm:items-center'>
        <div className='flex items-center gap-4'>
          <Button
            color='secondary'
            variant='outlined'
            startIcon={<i className='ri-upload-2-line text-xl' />}
            onClick={handleExport}
            disabled={isLoading}
            className='max-sm:is-full'
          >
            Exportar
          </Button>
          {selectedRows.length > 0 && (
            <Typography variant='body2' color='text.secondary'>
              {selectedRows.length} fila(s) seleccionada(s)
            </Typography>
          )}
        </div>
        <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
          <TextField
            size='small'
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder='Buscar'
            style={{ width: '500px' }}
            className='max-sm:is-full min-is-[200px]'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-search-line' />
                </InputAdornment>
              ),
              sx: {
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #E0E0E0'
              }
            }}
          />
        </div>
      </div>
      <Divider />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding='checkbox'>
                <Checkbox
                  indeterminate={
                    filteredData?.length ? selectedRows.length > 0 && selectedRows.length < filteredData.length : false
                  }
                  checked={filteredData?.length ? selectedRows.length === filteredData.length : false}
                  onChange={event => handleSelectAll(event.target.checked)}
                  inputProps={{ 'aria-label': 'select all' }}
                />
              </TableCell>
              <TableCell>N° COTIZACIÓN</TableCell>
              <TableCell>FECHA</TableCell>
              <TableCell>COMUNA</TableCell>
              <TableCell>EMPRESA</TableCell>
              <TableCell>TIPO</TableCell>
              <TableCell>CONTACTO</TableCell>
              <TableCell>ESTADO</TableCell>
              <TableCell align='right'>TOTAL UF</TableCell>
              <TableCell align='center'>ACCIONES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map(row => (
              <TableRow key={row.id}>
                <TableCell padding='checkbox'>
                  <Checkbox
                    checked={selectedRows.includes(row.id)}
                    onChange={event => handleSelectOne(event.target.checked, row.id)}
                  />
                </TableCell>
                <TableCell>{row.numeroCotizacion}</TableCell>
                <TableCell>{formatDate(row.fecha)}</TableCell>
                <TableCell>{row.comuna}</TableCell>
                <TableCell>{row.empresa || 'No especificada'}</TableCell>
                <TableCell>
                  <Chip label={getTipoLabel(row.tipo)} color={getTipoColor(row.tipo)} variant='outlined' size='small' />
                </TableCell>
                <TableCell>
                  {row.contacto && row.contacto.nombre ? (
                    <div
                      className='flex items-center gap-2 cursor-pointer'
                      onClick={() => {
                        setSelectedContacts([row.contacto])
                        setContactsModalOpen(true)
                      }}
                    >
                      <i className='ri-user-line text-primary' style={{ fontSize: '1.25rem' }} />
                      <Typography title={row.contacto.nombre}>
                        {row.contacto.nombre.length > 15
                          ? row.contacto.nombre.substring(0, 15) + '...'
                          : row.contacto.nombre}
                      </Typography>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 rounded-full bg-error' />
                      <Typography color='error'>Sin contacto</Typography>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={row.estado} color={getEstadoColor(row.estado)} variant='outlined' />
                </TableCell>
                <TableCell align='right'>
                  <Typography>UF {formatUF(row.total)}</Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                    <Tooltip title='Ver'>
                      <IconButton size='small' onClick={() => handlePreviewClick(row.id)}>
                        <i className='ri-eye-line' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Editar'>
                      <IconButton size='small' href={`/${locale}/apps/invoice/edit/${row.id}`}>
                        <i className='ri-pencil-line' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Cambiar Estado'>
                      <IconButton
                        size='small'
                        onClick={e => handleEstadoClick(e, row.id)}
                        color={getEstadoColor(row.estado) === 'error' ? 'error' : 'default'}
                      >
                        <i className='ri-settings-4-line' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Descargar PDF'>
                      <IconButton
                        size='small'
                        onClick={() => handleDownloadPDF(row.id)}
                        color='primary'
                      >
                        <i className='ri-file-download-line' />
                      </IconButton>
                    </Tooltip>
                    {/* <Tooltip title='Previsualizar PDF'>
                      <IconButton
                        size='small'
                        onClick={() => handlePreviewPDF(row.id)}
                        color='info'
                      >
                        <i className='ri-eye-line' />
                      </IconButton>
                    </Tooltip> */}
                    <Tooltip title='Duplicar'>
                      <IconButton
                        size='small'
                        color='info'
                        href={`/${locale}/apps/invoice/duplicate/${row.id}`}
                      >
                        <i className='ri-file-copy-line' />
                      </IconButton>
                    </Tooltip>
                    {row.estado === 'BORRADOR' && (
                      <Tooltip title='Eliminar'>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => {
                            setCotizacionToDelete(row.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <i className='ri-delete-bin-line' />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredData?.length || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
      />

      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth='lg' fullWidth>
        <DialogTitle>Vista Previa de Cotización</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <CircularProgress />
            </Box>
          ) : selectedCotizacion ? (
            <Grid container spacing={3}>
              {/* Encabezado con logo y datos de empresa */}
              <Grid item xs={12}>
                <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant='h6'>Laboratorio Pampa Austral</Typography>
                      <Typography>Calle Santa Blanca 51, Chillán – Chile.</Typography>
                      <Typography>Email: contacto@pampaustral.cl</Typography>
                      <Typography>+56 42-223 82 90</Typography>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                      <Typography variant='h6'>N° Cotización: #{selectedCotizacion.numeroCotizacion}-{selectedCotizacion.version || '00'}</Typography>
                      <Typography>
                        Fecha Emisión: {formatearFecha(selectedCotizacion.fechaInicio)}
                      </Typography>
                      <Typography>
                        Fecha Vencimiento: {formatearFecha(selectedCotizacion.fechaFin || selectedCotizacion.fechaCreacion)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Información Principal */}
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                  Información General
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography>
                    <strong>Tipo de Cotización:</strong>{' '}
                    {selectedCotizacion.tipoCotizacion === 'A'
                      ? 'Valores Unitarios'
                      : selectedCotizacion.tipoCotizacion === 'B'
                        ? 'EMS'
                        : selectedCotizacion.tipoCotizacion === 'C'
                          ? 'Servicio Mensual'
                          : selectedCotizacion.tipoCotizacion === 'D'
                            ? 'Genérica'
                            : 'Mensual'}
                  </Typography>
                  <Typography>
                    <strong>Estado:</strong> {selectedCotizacion.estado}
                  </Typography>
                  <Typography>
                    <strong>Forma de Pago:</strong> {selectedCotizacion.formaPago || 'No especificada'}
                  </Typography>
                  <Typography>
                    <strong>Nombre del Proyecto:</strong> {selectedCotizacion.nombreProyecto}
                  </Typography>
                  <Typography>
                    <strong>Empresa:</strong> {selectedCotizacion.empresa || 'No especificada'}
                  </Typography>
                  <Typography>
                    <strong>Ubicación:</strong> {selectedCotizacion.ubicacion}
                  </Typography>
                </Box>
              </Grid>

              {/* Información de Contacto */}
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                  Información de Contacto
                </Typography>
                {selectedCotizacion.contacto ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography>
                      <strong>Nombre:</strong> {selectedCotizacion.contacto.nombre}
                    </Typography>
                    <Typography>
                      <strong>Cargo:</strong> {ROLES_CONTACTO.find(c => c.value === selectedCotizacion.contacto.cargo)?.label || selectedCotizacion.contacto.cargo || 'No especificado'}
                    </Typography>
                    <Typography>
                      <strong>Email:</strong>{' '}
                      {selectedCotizacion.contacto.email ? (
                        <MuiLink href={`mailto:${selectedCotizacion.contacto.email}`}>
                          {selectedCotizacion.contacto.email}
                        </MuiLink>
                      ) : (
                        'No especificado'
                      )}
                    </Typography>
                    <Typography>
                      <strong>Teléfono:</strong>{' '}
                      {selectedCotizacion.contacto.telefono1 ? (
                        <MuiLink href={`tel:${selectedCotizacion.contacto.telefono1}`}>
                          {selectedCotizacion.contacto.telefono1}
                        </MuiLink>
                      ) : (
                        'No especificado'
                      )}
                    </Typography>
                  </Box>
                ) : (
                  <Typography color='error'>Sin contacto asignado</Typography>
                )}
              </Grid>

              {/* Información EMS o Mensual si aplica */}
              {selectedCotizacion.tipoCotizacion === 'B' && (
                <Grid item xs={12}>
                  <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                    Información EMS
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' color='text.secondary'>Superficie EMS</Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedCotizacion.superficieEMS || 'No especificada'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' color='text.secondary'>Antecedentes EMS</Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedCotizacion.antecedentesEMS || 'No especificados'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' color='text.secondary'>Plazo de Entrega EMS</Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedCotizacion.plazoEntregaEMS || 'No especificado'}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {selectedCotizacion.tipoCotizacion === 'C' && (
                <Grid item xs={12}>
                  <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                    Información Mensual
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      <strong>Duración Mensual:</strong> {selectedCotizacion.duracionMensual || 'No especificada'}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      <strong>Jornada Mensual:</strong> {selectedCotizacion.jornadaMensual || 'No especificada'}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      <strong>Antecedentes Mensual:</strong> {selectedCotizacion.antecedentesMensual || 'No especificados'}
                    </Typography>
                    {selectedCotizacion.alcanceServicio && (
                      <Typography sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                        <strong>Alcance del servicio:</strong> {selectedCotizacion.alcanceServicio}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}

              {/* Detalles de Productos/Servicios */}
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                  Detalle de Servicios
                </Typography>
                {selectedCotizacion.tipoCotizacion === 'D' ? (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant='subtitle2' sx={{ mb: 2 }}>
                      INFORMACIÓN DE LA COTIZACIÓN:
                    </Typography>

                    {/* Antecedentes */}
                    {selectedCotizacion.antecedentesGeneral && (
                      <Box sx={{
                        mb: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                        backgroundColor: 'background.paper'
                      }}>
                        <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                          Antecedentes:
                        </Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedCotizacion.antecedentesGeneral}</Typography>
                      </Box>
                    )}

                    {/* Plazo de Entrega */}
                    {selectedCotizacion.plazoEntregaGeneral && (
                      <Box sx={{
                        mb: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 2,
                        backgroundColor: 'background.paper'
                      }}>
                        <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                          Plazo de Entrega:
                        </Typography>
                        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedCotizacion.plazoEntregaGeneral}</Typography>
                      </Box>
                    )}

                    {/* Texto General */}
                    <Box sx={{
                      mb: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      backgroundColor: 'background.paper'
                    }}>
                      <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                        Texto General:
                      </Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{selectedCotizacion.textoGeneral || 'No especificado'}</Typography>
                    </Box>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Servicio/Producto</TableCell>
                          <TableCell>Área</TableCell>
                          <TableCell>Descripción</TableCell>
                          <TableCell align='right'>Cantidad</TableCell>
                          <TableCell align='right'>Precio Unit. (UF)</TableCell>
                          <TableCell align='right'>Total (UF)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedCotizacion.detalles?.filter((detalle: any) => !detalle.esSubProducto).map((detalle: any, index: number) => (
                          <Fragment key={`detalle-${index}`}>
                            <TableRow
                              sx={{
                                backgroundColor: detalle.esPaquete ? 'primary.lighter' : 'inherit'
                              }}
                            >
                              <TableCell>
                                {detalle.producto?.nombre || 'Sin nombre'}
                                {detalle.producto?.norma && ` - ${detalle.producto.norma}`}
                                {detalle.esPaquete && (
                                  <Chip size='small' label='Paquete' color='primary' sx={{ mr: 1 }} />
                                )}
                                {detalle.esPaquete && (
                                  <Box sx={{ mt: 1, pl: 2 }}>
                                    {/* Mostrar subproductos específicos del paquete */}
                                    {(detalle.subproductos || selectedCotizacion.detalles
                                      .filter((d: any) => d.esSubProducto && d.paqueteId === detalle.id))
                                      .map((subProducto: any, subIndex: number) => (
                                        <Typography key={`subproducto-${subIndex}`} variant='body2' sx={{ mb: 0.5 }}>
                                          • {subProducto.producto.nombre}
                                          {subProducto.producto.norma && ` - ${subProducto.producto.norma}`}
                                        </Typography>
                                      ))
                                    }
                                  </Box>
                                )}
                              </TableCell>
                              <TableCell>{detalle.producto?.area || '-'}</TableCell>
                              <TableCell>{detalle.descripcionPersonalizada || detalle.producto?.descripcion || '-'}</TableCell>
                              <TableCell align='right'>
                                {(() => {
                                  // Tipo A con sinCantidad true - mostrar guión
                                  if (selectedCotizacion.tipoCotizacion === 'A' && selectedCotizacion.sinCantidad) {
                                    return '-';
                                  }
                                  // Tipos B, C, D con sinCantidad true, precioProducto false, precioTotal true - mostrar guión
                                  if (['B', 'C', 'D'].includes(selectedCotizacion.tipoCotizacion) &&
                                    selectedCotizacion.sinCantidad === true &&
                                    selectedCotizacion.precioProducto === false &&
                                    selectedCotizacion.precioTotal === true) {
                                    return '-';
                                  }
                                  // Tipos B, C, D con sinCantidad true, precioProducto true, precioTotal false - mostrar guión
                                  if (['B', 'C', 'D'].includes(selectedCotizacion.tipoCotizacion) &&
                                    selectedCotizacion.sinCantidad === true &&
                                    selectedCotizacion.precioProducto === true &&
                                    selectedCotizacion.precioTotal === false) {
                                    return '-';
                                  }
                                  // Para todos los demás casos, mostrar cantidad
                                  return detalle.cantidad;
                                })()}
                              </TableCell>
                              <TableCell align='right'>
                                {(() => {
                                  // Tipo A con sinCantidad true - mostrar guión
                                  if (selectedCotizacion.tipoCotizacion === 'A' && selectedCotizacion.sinCantidad) {
                                    return `UF ${formatUF(detalle.precioUnitario)}`;
                                  }
                                  // Tipos B, C, D con sinCantidad false, precioProducto false, precioTotal true - mostrar guión
                                  if (['B', 'C', 'D'].includes(selectedCotizacion.tipoCotizacion) &&
                                    selectedCotizacion.sinCantidad === false &&
                                    selectedCotizacion.precioProducto === false &&
                                    selectedCotizacion.precioTotal === true) {
                                    return '-';
                                  }
                                  // Tipos B, C, D con sinCantidad true, precioProducto false, precioTotal true - mostrar guión
                                  if (['B', 'C', 'D'].includes(selectedCotizacion.tipoCotizacion) &&
                                    selectedCotizacion.sinCantidad === true &&
                                    selectedCotizacion.precioProducto === false &&
                                    selectedCotizacion.precioTotal === true) {
                                    return '-';
                                  }
                                  // Para todos los demás casos, mostrar precio
                                  return `UF ${formatUF(detalle.precioUnitario)}`;
                                })()}
                              </TableCell>
                              <TableCell align='right'>
                                {(() => {
                                  // Tipo A con sinCantidad true - mostrar guión
                                  if (selectedCotizacion.tipoCotizacion === 'A' && selectedCotizacion.sinCantidad) {
                                    return '-';
                                  }
                                  // Tipos B, C, D con sinCantidad false, precioProducto false, precioTotal true - mostrar guión
                                  if (['B', 'C', 'D'].includes(selectedCotizacion.tipoCotizacion) &&
                                    selectedCotizacion.sinCantidad === false &&
                                    selectedCotizacion.precioProducto === false &&
                                    selectedCotizacion.precioTotal === true) {
                                    return '-';
                                  }
                                  // Tipos B, C, D con sinCantidad true, precioProducto false, precioTotal true - mostrar guión
                                  if (['B', 'C', 'D'].includes(selectedCotizacion.tipoCotizacion) &&
                                    selectedCotizacion.sinCantidad === true &&
                                    selectedCotizacion.precioProducto === false &&
                                    selectedCotizacion.precioTotal === true) {
                                    return '-';
                                  }
                                  // Para todos los demás casos, mostrar total
                                  return `UF ${formatUF(detalle.subtotal)}`;
                                })()}
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>

              {/* Totales */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, mt: 2 }}>
                  {selectedCotizacion.tipoCotizacion === 'A' && selectedCotizacion.sinCantidad ? (
                    <>
                      <Typography>
                        <strong>Subtotal:</strong> -
                      </Typography>
                      <Typography>
                        <strong>Descuento:</strong> -
                      </Typography>
                      <Typography>
                        <strong>IVA (19%):</strong> -
                      </Typography>
                      <Typography variant='h6' sx={{ mt: 1 }}>
                        <strong>Total:</strong> -
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography>
                        <strong>Subtotal:</strong> UF {formatUF(selectedCotizacion.subtotal)}
                      </Typography>
                      <Typography>
                        <strong>Descuento:</strong> UF {formatUF(selectedCotizacion.descuento)}
                      </Typography>
                      <Typography>
                        <strong>IVA (19%):</strong> UF {formatUF(selectedCotizacion.impuesto)}
                      </Typography>
                      <Typography variant='h6' sx={{ mt: 1 }}>
                        <strong>Total:</strong> UF {formatUF(selectedCotizacion.total)}
                      </Typography>
                    </>
                  )}
                </Box>
              </Grid>

              {/* Observaciones */}
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                  Observaciones
                </Typography>
                <Box sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  backgroundColor: 'background.paper',
                  minHeight: '80px'
                }}>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedCotizacion.observaciones || 'Sin observaciones'}
                  </Typography>
                </Box>
              </Grid>

              {/* Notas */}
              {selectedCotizacion.notas && (
                <Grid item xs={12}>
                  <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                    Notas
                  </Typography>
                  <Box sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    backgroundColor: 'background.paper',
                    minHeight: '120px'
                  }}>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedCotizacion.notas}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)} variant='contained'>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <ContactsModal
        open={contactsModalOpen}
        handleClose={() => setContactsModalOpen(false)}
        contact={selectedContacts[0]}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleEstadoClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <Typography variant="subtitle1" sx={{ px: 2, py: 1, fontWeight: 600 }}>
          Cambiar estado
        </Typography>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => handleEstadoChange('BORRADOR')}>
          <ListItemIcon>
            <Chip label='BORRADOR' size='small' color='default' variant='outlined' />
          </ListItemIcon>
          {/* <ListItemText>Borrador</ListItemText> */}
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('COTIZADA')}>
          <ListItemIcon>
            <Chip label='COTIZADA' size='small' color='info' variant='outlined' />
          </ListItemIcon>
          {/* <ListItemText>Cotizada</ListItemText> */}
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('GESTIONADA')}>
          <ListItemIcon>
            <Chip label='GESTIONADA' size='small' color='warning' variant='outlined' />
          </ListItemIcon>
          {/* <ListItemText>Gestionada</ListItemText> */}
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('ACEPTADA')}>
          <ListItemIcon>
            <Chip label='ACEPTADA' size='small' color='success' variant='outlined' />
          </ListItemIcon>
          {/* <ListItemText>Aceptada</ListItemText> */}
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('SIN_RESPUESTA')}>
          <ListItemIcon>
            <Chip label='SIN RESPUESTA' size='small' color='error' variant='outlined' />
          </ListItemIcon>
          {/* <ListItemText>Sin Respuesta</ListItemText> */}
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('RECHAZADA')}>
          <ListItemIcon>
            <Chip label='RECHAZADA' size='small' color='error' variant='outlined' />
          </ListItemIcon>
          {/* <ListItemText>Rechazada</ListItemText> */}
        </MenuItem>
      </Menu>

      <Dialog open={gestionDialogOpen} onClose={() => setGestionDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>
          {pendingEstado === 'GESTIONADA'
            ? 'Observación de Gestión'
            : pendingEstado === 'RECHAZADA'
              ? 'Observación de Rechazo'
              : 'Observación'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label={pendingEstado === 'RECHAZADA' ? 'Ingrese el motivo del rechazo' : 'Ingrese una observación o comentario'}
            type='text'
            fullWidth
            multiline
            minRows={2}
            value={gestionText}
            onChange={e => setGestionText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGestionDialogOpen(false)} color='secondary'>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              await updateEstadoCotizacion(pendingEstado || 'GESTIONADA', gestionText)
              setGestionDialogOpen(false)
              setGestionText('')
              setPendingEstado(null)
            }}
            color='primary'
            variant='contained'
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>¿Eliminar cotización?</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar esta cotización? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color='secondary'>
            Cancelar
          </Button>
          <Button onClick={handleDeleteCotizacion} color='error' variant='contained'>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pdfPreviewOpen} onClose={() => setPdfPreviewOpen(false)} maxWidth='lg' fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogContent>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Vista Previa PDF {selectedCotizacionForPDF ? `- ${selectedCotizacionForPDF.numeroCotizacion}` : ''}</h2>
            <div className='flex gap-2'>
              <IconButton onClick={() => window.print()}>
                <i className='ri-download-line' />
              </IconButton>
              <IconButton onClick={() => setPdfPreviewOpen(false)}>
                <i className='ri-close-line' />
              </IconButton>
            </div>
          </div>
          {pdfLoading ? (
            <div className='flex justify-center items-center h-[60vh]'>
              <CircularProgress />
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: pdfHtmlContent }} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default InvoiceListTable
