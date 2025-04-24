'use client'

// React Imports
import { useState, useEffect } from 'react'

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

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

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

  // Inicializar localData con invoiceData
  useEffect(() => {
    if (invoiceData) {
      setLocalData(invoiceData)
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

  const getTipoLabel = (tipo: InvoiceType['tipo']) => {
    if (!tipo) return 'No especificado'

    switch (tipo) {
      case 'VALORES_UNITARIOS':
        return 'Valores Unitarios'
      case 'EMS':
        return 'EMS'
      case 'MENSUAL':
        return 'Mensual'
      default:
        return 'Valores Unitarios' // Valor por defecto si el tipo no es válido
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

    try {
      const response = await fetch(`/api/cotizaciones/${selectedRowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: newEstado,
          fechaActualizacion: new Date().toISOString()
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

  // Modificar filteredData para usar localData en lugar de invoiceData
  const filteredData = localData?.filter(row => {
    if (!globalFilter) return true

    const searchStr = globalFilter.toLowerCase()

    return (
      row.numeroCotizacion?.toLowerCase().includes(searchStr) ||
      row.comuna?.toLowerCase().includes(searchStr) ||
      row.contacto?.toLowerCase().includes(searchStr)
    )
  })

  return (
    <Card>
      <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
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
              <TableCell>TIPO</TableCell>
              <TableCell>CONTACTO</TableCell>
              <TableCell>ESTADO</TableCell>
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
                <TableCell>
                  <Chip label={getTipoLabel(row.tipo)} color={getTipoColor(row.tipo)} variant='outlined' size='small' />
                </TableCell>
                <TableCell>
                  {row.contacto ? (
                    <Button
                      variant='text'
                      size='small'
                      onClick={() => {
                        setSelectedContacts([
                          {
                            contacto: {
                              nombre: row.contacto,
                              cargo: row.cargo || 'No especificado',
                              email: row.email || 'No especificado',
                              telefono1: row.telefono || 'No especificado'
                            }
                          }
                        ])
                        setContactsModalOpen(true)
                      }}
                    >
                      {row.contacto}
                    </Button>
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
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Tooltip title='Ver'>
                      <IconButton size='small' onClick={() => handlePreviewClick(row.id)}>
                        <i className='ri-eye-line' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Editar'>
                      <IconButton size='small' href={`/apps/invoice/edit/${row.id}`}>
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
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth='md' fullWidth>
        <DialogTitle>Vista Previa de Cotización</DialogTitle>
        <DialogContent>
          {selectedCotizacion && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant='h6'>Datos de la Cotización</Typography>
                <Typography>N° Cotización: {selectedCotizacion.numeroCotizacion}</Typography>
                <Typography>Tipo: {selectedCotizacion.tipoCotizacion}</Typography>
                <Typography>Estado: {selectedCotizacion.estado}</Typography>
                <Typography>
                  Fecha Emisión: {new Date(selectedCotizacion.fechaCreacion).toLocaleDateString('es-CL')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='h6'>Datos del Proyecto</Typography>
                <Typography>Nombre: {selectedCotizacion.nombreProyecto}</Typography>
                <Typography>Ubicación: {selectedCotizacion.ubicacion}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant='h6'>Contacto</Typography>
                {selectedCotizacion.contacto && (
                  <>
                    <Typography>Nombre: {selectedCotizacion.contacto.nombre}</Typography>
                    <Typography>Cargo: {selectedCotizacion.contacto.cargo}</Typography>
                    <Typography>Email: {selectedCotizacion.contacto.email}</Typography>
                    <Typography>Teléfono: {selectedCotizacion.contacto.telefono1}</Typography>
                  </>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant='h6'>Detalles</Typography>
                {selectedCotizacion.detalles?.map((detalle: any, index: number) => (
                  <div key={index}>
                    <Typography>Producto: {detalle.producto?.nombre}</Typography>
                    <Typography>Cantidad: {detalle.cantidad}</Typography>
                    <Typography>Precio: ${detalle.precioUnitario?.toLocaleString('es-CL')}</Typography>
                    <Typography>Subtotal: ${detalle.subtotal?.toLocaleString('es-CL')}</Typography>
                    <Divider sx={{ my: 1 }} />
                  </div>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Typography variant='h6'>Totales</Typography>
                <Typography>Subtotal: ${selectedCotizacion.subtotal?.toLocaleString('es-CL')}</Typography>
                <Typography>Descuento: ${selectedCotizacion.descuento?.toLocaleString('es-CL')}</Typography>
                <Typography>IVA: ${selectedCotizacion.impuesto?.toLocaleString('es-CL')}</Typography>
                <Typography variant='h6'>Total: ${selectedCotizacion.total?.toLocaleString('es-CL')}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={contactsModalOpen} onClose={() => setContactsModalOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>Contactos de la Cotización</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cargo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Teléfono</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedContacts.map((contacto, index) => (
                  <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                    <TableCell>{contacto.contacto.nombre}</TableCell>
                    <TableCell>{contacto.contacto.cargo}</TableCell>
                    <TableCell>
                      {contacto.contacto.email !== 'No especificado' ? (
                        <MuiLink
                          href={`mailto:${contacto.contacto.email}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'text.primary',
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          {contacto.contacto.email}
                        </MuiLink>
                      ) : (
                        contacto.contacto.email
                      )}
                    </TableCell>
                    <TableCell>
                      {contacto.contacto.telefono1 !== 'No especificado' ? (
                        <MuiLink
                          href={`tel:${contacto.contacto.telefono1}`}
                          sx={{
                            textDecoration: 'none',
                            color: 'text.primary',
                            '&:hover': { color: 'primary.main' }
                          }}
                        >
                          {contacto.contacto.telefono1}
                        </MuiLink>
                      ) : (
                        contacto.contacto.telefono1
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Button onClick={() => setContactsModalOpen(false)} variant='contained'>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

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
    </Card>
  )
}

export default InvoiceListTable
