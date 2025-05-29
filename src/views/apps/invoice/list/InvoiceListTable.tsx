'use client'

// React Imports
import { useState, useEffect, Fragment } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
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
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { es } from 'date-fns/locale'

// Type Imports
// import type { InvoiceType } from '@/types/apps/invoiceTypes'

// Agregar después de las importaciones y antes del componente
interface Contacto {
  nombre: string
  cargo?: string
  email?: string
  telefono1?: string
}

interface InvoiceType {
  id: number
  numeroCotizacion: string
  tipoCotizacion: string
  estado: string
  contacto: Contacto | null
  fecha: string
  comuna: string
  tipo: string
  empresa: string
  detalles: any[]
  total: number
  observacionGestion?: string
  // ... otros campos necesarios
}

const tiposCotizacion = [
  { value: '', label: 'Tipo Cotización' },
  { value: 'A', label: 'Valores Unitarios' },
  { value: 'B', label: 'EMS' },
  { value: 'C', label: 'Mensual' }
]

const estadosCotizacion = [
  { value: '', label: 'Estado' },
  { value: 'BORRADOR', label: 'Borrador' },
  { value: 'COTIZADA', label: 'Cotizada' },
  { value: 'GESTIONADA', label: 'Gestionada' },
  { value: 'ACEPTADA', label: 'Aceptada' },
  { value: 'SIN_RESPUESTA', label: 'Sin Respuesta' },
  { value: 'RECHAZADA', label: 'Rechazada' }
]

const InvoiceListTable = ({ invoiceData }: { invoiceData?: InvoiceType[] }) => {
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [openPreview, setOpenPreview] = useState(false)
  const [selectedCotizacion, setSelectedCotizacion] = useState<any>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [localData, setLocalData] = useState<InvoiceType[]>([])
  const [contactsModalOpen, setContactsModalOpen] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<any[]>([])
  const locale = 'es' // Por defecto usaremos español
  const [gestionText, setGestionText] = useState('')
  const [gestionDialogOpen, setGestionDialogOpen] = useState(false)
  const [pendingEstado, setPendingEstado] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cotizacionToDelete, setCotizacionToDelete] = useState<number | null>(null)
  const [filtroFecha, setFiltroFecha] = useState<string>('')
  const [filtroTipo, setFiltroTipo] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')

  // Inicializar localData con invoiceData
  useEffect(() => {
    if (invoiceData) {
      console.log('invoiceData', invoiceData)
      // Limpia cualquier string 'Sin contacto' y reemplázalo por null
      const cleanData = invoiceData.map(row => ({
        ...row,
        //contacto: typeof row.contacto !== 'string' ? null : row.contacto
      }))

      setLocalData(cleanData)
      console.log('Datos de cotizaciones recibidos en la tabla:', cleanData)
    }
  }, [invoiceData])

  const handleSelectAll = (checked: boolean) => {
    if (checked && invoiceData) {
      setSelectedRows(invoiceData.map(row => row.id))
    } else {
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

      // Preparar los datos para CSV
      const headers = ['N° COTIZACIÓN', 'FECHA', 'COMUNA', 'TIPO', 'CONTACTO', 'ESTADO']

      const selectedData = invoiceData?.filter(row => selectedRows.includes(row.id)) || []

      const csvData = selectedData.map(row => [
        row.numeroCotizacion,
        row.fecha,
        row.comuna,
        row.tipo,
        row.contacto,
        row.estado
      ])

      // Crear el contenido del CSV
      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')

      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
      const link = document.createElement('a')

      link.href = URL.createObjectURL(blob)
      link.download =
        selectedData.length === 1
          ? `Cotizacion_${selectedData[0].numeroCotizacion}.csv`
          : `Cotizaciones_${new Date().toISOString().split('T')[0]}.csv`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

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
      const response = await fetch(`/api/cotizaciones/${id}`)
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
      setOpenPreview(true)
    } catch (error) {
      console.error('Error al cargar la cotización:', error)
      toast.error('Error al cargar la cotización')
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
        method: 'PUT',
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

      setLocalData(prevData =>
        prevData.map(row => (row.id === selectedRowId ? { ...row, estado: updatedData.estado } : row))
      )

      toast.success('Estado actualizado correctamente')

      // Opcional: Recargar los datos completos
      const refreshResponse = await fetch('/api/cotizaciones')

      if (refreshResponse.ok) {
        const freshData = await refreshResponse.json()

        setLocalData(freshData)
      }
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

      setLocalData(prev => prev.filter(row => row.id !== cotizacionToDelete))
      toast.success('Cotización eliminada correctamente')
    } catch (error) {
      toast.error('No se pudo eliminar la cotización')
    } finally {
      setDeleteDialogOpen(false)
      setCotizacionToDelete(null)
    }
  }

  // Modificar filteredData para usar localData en lugar de invoiceData
  const filteredData = localData?.filter(row => {

    /* console.log('filtroFecha, filtroTipo, filtroEstado', {filtroFecha, filtroTipo, filtroEstado})
    console.log('row', row) */

    if (filtroFecha) {
      // Convertir row.fecha (dd-MM-yyyy) a yyyy-MM-dd con ceros a la izquierda
      const [day, month, year] = row.fecha.split('-')
      const rowFechaISO = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      if (rowFechaISO !== filtroFecha) return false
    }
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
                <Typography>{contact.cargo || 'No especificado'}</Typography>
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

  return (
    <Card>
      {/* Fila de filtros */}
      <Card sx={{ boxShadow: 'none', mb: 0 }}>
        <Grid container spacing={2} alignItems="center" sx={{ px: 3, pt: 3 }}>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label="Fecha Creación"
                value={filtroFecha ? new Date(filtroFecha) : null}
                onChange={date => {
                  if (!date) {
                    setFiltroFecha('')
                    return
                  }
                  const year = date.getFullYear()
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const day = String(date.getDate()).padStart(2, '0')
                  setFiltroFecha(`${year}-${month}-${day}`)
                }}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo Cotización</InputLabel>
              <Select
                value={filtroTipo}
                label="Tipo Cotización"
                onChange={e => setFiltroTipo(e.target.value)}
              >
                {tiposCotizacion.map(tipo => (
                  <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtroEstado}
                label="Estado"
                onChange={e => setFiltroEstado(e.target.value)}
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
            {filteredData?.map(row => (
              <TableRow key={row.id}>
                <TableCell padding='checkbox'>
                  <Checkbox
                    checked={selectedRows.includes(row.id)}
                    onChange={event => handleSelectOne(event.target.checked, row.id)}
                  />
                </TableCell>
                <TableCell>{row.numeroCotizacion}</TableCell>
                <TableCell>{row.fecha}</TableCell>
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
                  <Typography>UF {Number(row.total || 0).toFixed(2)}</Typography>
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

      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth='lg' fullWidth>
        <DialogTitle>Vista Previa de Cotización</DialogTitle>
        <DialogContent>
          {selectedCotizacion && (
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
                      <Typography variant='h6'>N° Cotización: #{selectedCotizacion.numeroCotizacion}</Typography>
                      <Typography>
                        Fecha Emisión: {new Date(selectedCotizacion.fechaCreacion).toLocaleDateString('es-CL')}
                      </Typography>
                      <Typography>
                        Fecha Vencimiento:{' '}
                        {new Date(selectedCotizacion.fechaFin || selectedCotizacion.fechaCreacion).toLocaleDateString(
                          'es-CL'
                        )}
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
                      <strong>Cargo:</strong> {selectedCotizacion.contacto.cargo || 'No especificado'}
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
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={selectedCotizacion.infoEMS || ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}

              {selectedCotizacion.tipoCotizacion === 'C' && (
                <Grid item xs={12}>
                  <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                    Información Mensual
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={selectedCotizacion.infoMensual || ''}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}

              {/* Detalles de Productos/Servicios */}
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                  Detalle de Servicios
                </Typography>
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
                      {selectedCotizacion.detalles?.map((detalle: any, index: number) => (
                        <Fragment key={`detalle-${index}`}>
                          <TableRow
                            sx={{
                              backgroundColor: detalle.esPaquete ? 'primary.lighter' : 'inherit'
                            }}
                          >
                            <TableCell>
                              {detalle.esPaquete && (
                                <Chip size='small' label='Paquete' color='primary' sx={{ mr: 1 }} />
                              )}
                              {detalle.producto?.nombre || 'Sin nombre'}
                              {detalle.producto?.norma && ` - ${detalle.producto.norma}`}
                            </TableCell>
                            <TableCell>{detalle.producto?.area || '-'}</TableCell>
                            <TableCell>{detalle.producto?.descripcion || '-'}</TableCell>
                            <TableCell align='right'>{detalle.cantidad}</TableCell>
                            <TableCell align='right'>UF {Number(detalle.precioUnitario || 0).toFixed(2)}</TableCell>
                            <TableCell align='right'>UF {Number(detalle.subtotal || 0).toFixed(2)}</TableCell>
                          </TableRow>
                          {detalle.esPaquete &&
                            detalle.subDetalles?.map((subDetalle: any, subIndex: number) => (
                              <TableRow
                                key={`subproducto-${index}-${subIndex}`}
                                sx={{ backgroundColor: 'action.hover' }}
                              >
                                <TableCell sx={{ pl: 6 }}>
                                  <Typography variant='body2'>{subDetalle.producto?.nombre}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant='body2'>{subDetalle.producto?.area || '-'}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant='body2'>{subDetalle.producto?.descripcion || '-'}</Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='body2'>{subDetalle.cantidad}</Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='body2'>
                                    UF {Number(subDetalle.precioUnitario || 0).toFixed(2)}
                                  </Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography variant='body2'>
                                    UF {Number(subDetalle.subtotal || 0).toFixed(2)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Totales */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, mt: 2 }}>
                  <Typography>
                    <strong>Subtotal:</strong> UF {Number(selectedCotizacion.subtotal || 0).toFixed(2)}
                  </Typography>
                  <Typography>
                    <strong>Descuento:</strong> UF {Number(selectedCotizacion.descuento || 0).toFixed(2)}
                  </Typography>
                  <Typography>
                    <strong>IVA (19%):</strong> UF {Number(selectedCotizacion.impuesto || 0).toFixed(2)}
                  </Typography>
                  <Typography variant='h6' sx={{ mt: 1 }}>
                    <strong>Total:</strong> UF {Number(selectedCotizacion.total || 0).toFixed(2)}
                  </Typography>
                </Box>
              </Grid>

              {/* Observaciones */}
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
                  Observaciones
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={selectedCotizacion.observaciones || 'Sin observaciones'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          )}
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
        <MenuItem onClick={() => handleEstadoChange('BORRADOR')}>
          <ListItemIcon>
            <Chip label='BORRADOR' size='small' color='default' variant='outlined' />
          </ListItemIcon>
          <ListItemText>Borrador</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('COTIZADA')}>
          <ListItemIcon>
            <Chip label='COTIZADA' size='small' color='info' variant='outlined' />
          </ListItemIcon>
          <ListItemText>Cotizada</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('GESTIONADA')}>
          <ListItemIcon>
            <Chip label='GESTIONADA' size='small' color='warning' variant='outlined' />
          </ListItemIcon>
          <ListItemText>Gestionada</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('ACEPTADA')}>
          <ListItemIcon>
            <Chip label='ACEPTADA' size='small' color='success' variant='outlined' />
          </ListItemIcon>
          <ListItemText>Aceptada</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('SIN_RESPUESTA')}>
          <ListItemIcon>
            <Chip label='SIN RESPUESTA' size='small' color='error' variant='outlined' />
          </ListItemIcon>
          <ListItemText>Sin Respuesta</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleEstadoChange('RECHAZADA')}>
          <ListItemIcon>
            <Chip label='RECHAZADA' size='small' color='error' variant='outlined' />
          </ListItemIcon>
          <ListItemText>Rechazada</ListItemText>
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
    </Card>
  )
}

export default InvoiceListTable
