'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { SyntheticEvent } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import InputLabel from '@mui/material/InputLabel'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import FormControl from '@mui/material/FormControl'
import { SelectChangeEvent } from '@mui/material/Select'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import DeleteIcon from '@mui/icons-material/Delete'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'
import type { FormDataType } from './AddCustomerDrawer'

// Component Imports
import AddCustomerDrawer, { initialFormData } from './AddCustomerDrawer'
import Logo from '@components/layout/shared/Logo'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const AddCard = ({ invoiceData, onFormDataChange }: {
  invoiceData?: InvoiceType[]
  onFormDataChange?: (data: any) => void
}) => {
  const router = useRouter()

  // Estados base
  const [formData, setFormData] = useState({
    // Datos principales
    numeroCotizacion: '',
    tipoCotizacion: '',
    estado: 'PENDIENTE',

    // Fechas
    fechaInicio: null,
    fechaFin: null,

    // Cliente y Obra
    cliente: null,
    obra: null,
    contacto: null,

    // Totales
    subtotal: 0,
    descuento: 0,
    impuesto: 0,
    total: 0,

    // Otros
    observaciones: '',
    vendedorId: '', // Se puede obtener de la sesión
    detalles: [] as Array<{
      productoId: number
      precio: number
      cantidad: number
      subtotal: number
      descuento: number
      descripcion?: string
    }>
  })

  // States
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [selectData, setSelectData] = useState<InvoiceType | null>(null)
  const [issuedDate, setIssuedDate] = useState<Date | null | undefined>(null)
  const [dueDate, setDueDate] = useState<Date | null | undefined>(null)
  const [clientes, setClientes] = useState([])
  const [obras, setObras] = useState([])
  const [productos, setProductos] = useState<Array<{
    productoId: number
    sku: string
    nombre: string
    precio: number
    cantidad: number
    descuento: number
    subtotal: number
  }>>([])

  // Agregar un estado para el descuento
  const [descuento, setDescuento] = useState<number>(0)

  // Agregar un estado para manejar múltiples filas de productos
  const [productRows, setProductRows] = useState([
    {
      id: 1,
      productoId: '',
      cantidad: 1,
      descuento: 0,
      precio: 0
    }
  ])

  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  // Cargar clientes y obras al montar el componente
  useEffect(() => {
    // Cargar clientes
    fetch('/api/clientes')
      .then(res => res.json())
      .then(data => {
        console.log('Clientes cargados:', data)
        setClientes(data)
      })
      .catch(error => console.error('Error al cargar clientes:', error))

    // Cargar obras
    fetch('/api/obras')
      .then(res => res.json())
      .then(data => {
        console.log('Obras cargadas:', data)
        setObras(data)
      })
      .catch(error => console.error('Error al cargar obras:', error))
  }, [])

  // En el useEffect de carga de obras cuando cambia el cliente
  useEffect(() => {
    if (formData.cliente) {
      // Cargar obras del cliente seleccionado
      fetch(`/api/obras?clienteId=${formData.cliente.clienteId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Obras del cliente cargadas:', data)
          setObras(data)
        })
        .catch(error => {
          console.error('Error al cargar obras del cliente:', error)
          // Mantener las obras anteriores en caso de error
          setObras(prev => prev)
        })
    } else {
      // Si no hay cliente seleccionado, cargar todas las obras
      fetch('/api/obras')
        .then(res => res.json())
        .then(data => {
          console.log('Todas las obras cargadas:', data)
          setObras(data)
        })
        .catch(error => console.error('Error al cargar obras:', error))
    }
  }, [formData.cliente])

  // Agregar useEffect para cargar productos
  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        console.log('Productos cargados:', data)
        setProductos(data)
      })
      .catch(error => console.error('Error al cargar productos:', error))
  }, [])

  // Agregar useEffect para cargar el número de cotización
  useEffect(() => {
    fetch('/api/cotizaciones/ultimo-numero')
      .then(res => res.json())
      .then(data => {
        setFormData(prev => ({
          ...prev,
          numeroCotizacion: data.siguienteNumero.toString()
        }))
      })
      .catch(error => console.error('Error al obtener número de cotización:', error))
  }, [])

  const updateFormData = (newData: any) => {
    setFormData(newData)
    if (onFormDataChange) {
      onFormDataChange(newData)
    }
  }

  const handleClienteChange = (e: any) => {
    const selectedClientId = Number(e.target.value)
    const selectedClient = clientes.find(c => c.clienteId === selectedClientId)

    if (selectedClient) {
      updateFormData(prev => ({
        ...prev,
        cliente: selectedClient,
        clienteId: selectedClient.clienteId,
        obra: null
      }))
    }
  }

  const deleteForm = (e: SyntheticEvent) => {
    e.preventDefault()

    // @ts-ignore
    e.target.closest('.repeater-item').remove()
  }

  // Función para manejar el cambio de producto
  const handleProductChange = async (event: SelectChangeEvent, index: number) => {
    const productoId = parseInt(event.target.value)

    try {
      // Obtener los detalles del producto incluyendo el precio
      const response = await fetch(`/api/productos/${productoId}`)
      const producto = await response.json()

      // Actualizar los detalles con el nuevo producto
      const newDetalles = [...formData.detalles]
      if (!newDetalles[index]) {
        newDetalles[index] = {} as any
      }

      newDetalles[index] = {
        ...newDetalles[index],
        productoId: productoId,
        precio: producto.precio || 0,
        cantidad: newDetalles[index]?.cantidad || 1,
        subtotal: (producto.precio || 0) * (newDetalles[index]?.cantidad || 1)
      }

      // Actualizar el estado y recalcular totales
      updateFormData(prev => ({
        ...prev,
        detalles: newDetalles,
        subtotal: newDetalles.reduce((acc, det) => acc + (det?.subtotal || 0), 0)
      }))
    } catch (error) {
      console.error('Error al cargar el producto:', error)
    }
  }

  // Función para calcular subtotales y totales
  const calcularTotales = (items: typeof productos) => {
    const subtotal = items.reduce((acc, item) => {
      const itemSubtotal = (item.precio * item.cantidad) * (1 - item.descuento / 100)
      return acc + itemSubtotal
    }, 0)

    updateFormData(prev => ({
      ...prev,
      subtotal: subtotal,
      total: subtotal + formData.impuesto - formData.descuento
    }))
  }

  // Función para manejar la visualización
  const handlePreview = () => {
    // Guardar los datos del formulario en localStorage para accederlos en la vista previa
    localStorage.setItem('cotizacionPreview', JSON.stringify({
      ...formData,
      fechaInicio: issuedDate,
      fechaFin: dueDate,
      detalles: formData.detalles.map(detalle => ({
        ...detalle,
        precio: detalle.precio?.toLocaleString('es-CL'),
        subtotal: detalle.subtotal?.toLocaleString('es-CL')
      }))
    }))

    // Navegar a la vista previa
    router.push('/apps/invoice/preview')
  }

  const handleAddDetalle = () => {
    if (!selectData || !count) return

    const precio = Number(selectData.precio)
    const cantidad = Number(count)
    const descuentoPorcentaje = Number(descuento)

    // Calcular subtotal y descuento
    const subtotalSinDescuento = precio * cantidad
    const montoDescuento = (subtotalSinDescuento * descuentoPorcentaje) / 100
    const subtotalConDescuento = subtotalSinDescuento - montoDescuento

    const newDetalle = {
      productoId: selectData.productoId,
      producto: selectData,
      cantidad: cantidad,
      precioUnitario: precio,
      descuento: descuentoPorcentaje,
      subtotal: subtotalSinDescuento,  // Guardamos el subtotal sin descuento
      montoDescuento: montoDescuento   // Guardamos el monto del descuento
    }

    const newDetalles = [...formData.detalles, newDetalle]

    // Calcular totales
    const subtotalTotal = newDetalles.reduce((acc, det) => acc + det.subtotal, 0)
    const descuentoTotal = newDetalles.reduce((acc, det) => acc + det.montoDescuento, 0)
    const baseImponible = subtotalTotal - descuentoTotal
    const impuesto = baseImponible * 0.19
    const total = baseImponible + impuesto

    // Actualizar formData
    updateFormData({
      ...formData,
      detalles: newDetalles,
      subtotal: subtotalTotal,
      descuento: descuentoTotal,
      impuesto: impuesto,
      total: total
    })

    // Limpiar campos
    setSelectData(null)
    setCount(1)
    setDescuento(0)
  }

  // Función para agregar una nueva fila
  const handleAddRow = () => {
    setProductRows([
      ...productRows,
      {
        id: productRows.length + 1,
        productoId: '',
        cantidad: 1,
        descuento: 0,
        precio: 0
      }
    ])
  }

  return (
    <>
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {/* Header con logo y datos de empresa */}
            <Grid item xs={12}>
              <div className='p-6 bg-actionHover rounded'>
                <div className='flex justify-between gap-4 flex-col sm:flex-row'>
                  <div className='flex flex-col gap-6'>
                    <div className='flex items-center'>
                      <Logo />
                    </div>
                    <div>
                      <Typography color='text.primary'>Calle Santa Blanca 51, Chillán – Chile.</Typography>
                      <Typography color='text.primary'>Email: contacto@pampaustral.cl</Typography>
                      <Typography color='text.primary'>+56 42-223 82 90 </Typography>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-4'>
                      <Typography variant='h5' className='min-is-[95px]'>
                        N° Cotización
                      </Typography>
                      <TextField
                        name="numeroCotizacion"
                        fullWidth
                        size='small'
                        value={formData.numeroCotizacion}
                        InputProps={{
                          readOnly: true,
                          startAdornment: <InputAdornment position='start'>#</InputAdornment>
                        }}
                      />
                    </div>
                    <div className='flex items-center'>
                      <Typography className='min-is-[95px] mie-4' color='text.primary'>
                        Desde:
                      </Typography>
                      <AppReactDatepicker
                        boxProps={{ className: 'is-full' }}
                        selected={issuedDate}
                        placeholderText='YYYY-MM-DD'
                        dateFormat={'yyyy-MM-dd'}
                        onChange={(date: Date | null) => setIssuedDate(date)}
                        customInput={<TextField fullWidth size='small' />}
                      />
                    </div>
                    <div className='flex items-center'>
                      <Typography className='min-is-[95px] mie-4' color='text.primary'>
                        Hasta:
                      </Typography>
                      <AppReactDatepicker
                        boxProps={{ className: 'is-full' }}
                        selected={dueDate}
                        placeholderText='YYYY-MM-DD'
                        dateFormat={'yyyy-MM-dd'}
                        onChange={(date: Date | null) => setDueDate(date)}
                        customInput={<TextField fullWidth size='small' />}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Grid>

            {/* Datos principales */}
            <Grid item xs={12} md={4}>
              <TextField
                name="numeroCotizacion"
                fullWidth
                label="N° Cotización"
                value={formData.numeroCotizacion}
                onChange={(e) => updateFormData({...formData, numeroCotizacion: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo Cotización</InputLabel>
                <Select
                  name="tipoCotizacion"
                  value={formData.tipoCotizacion}
                  onChange={(e) => updateFormData({...formData, tipoCotizacion: e.target.value})}
                >
                  <MenuItem value="SERVICIO">Servicio</MenuItem>
                  <MenuItem value="PRODUCTO">Producto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={(e) => updateFormData({...formData, estado: e.target.value})}
                >
                  <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                  <MenuItem value="APROBADA">Aprobada</MenuItem>
                  <MenuItem value="RECHAZADA">Rechazada</MenuItem>
                  <MenuItem value="VENCIDA">Vencida</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Fechas */}
            <Grid item xs={12} md={6}>
              <AppReactDatepicker
                label="Fecha Inicio"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={(date) => updateFormData({...formData, fechaInicio: date})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <AppReactDatepicker
                label="Fecha Fin"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={(date) => updateFormData({...formData, fechaFin: date})}
              />
            </Grid>

            {/* Cliente y Obra */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  name="cliente"
                  value={formData.cliente?.clienteId || ''}
                  onChange={handleClienteChange}
                >
                  {clientes.map(cliente => (
                    <MenuItem key={cliente.clienteId} value={cliente.clienteId}>
                      {cliente.nombreCliente}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Obra</InputLabel>
                <Select
                  name="obra"
                  value={formData.obra?.obraId || ''}
                  onChange={(e) => {
                    const obraSeleccionada = obras.find(obra => obra.obraId === e.target.value)
                    updateFormData(prev => ({
                      ...prev,
                      obra: obraSeleccionada
                    }))
                  }}
                  label="Obra"
                >
                  <MenuItem value="">Seleccione una obra</MenuItem>
                  {obras.map((obra: any) => (
                    <MenuItem key={obra.obraId} value={obra.obraId}>
                      {obra.nombreObra}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Observaciones */}
            <Grid item xs={12}>
              <TextField
                name="observaciones"
                fullWidth
                multiline
                rows={4}
                label="Observaciones"
                value={formData.observaciones}
                onChange={(e) => updateFormData({...formData, observaciones: e.target.value})}
              />
            </Grid>

            {/* Detalles de la Cotización */}
            <Grid item xs={12}>
              {productRows.map((row, index) => (
                <Grid container spacing={2} key={row.id} sx={{ mb: 2 }}>
                  {/* Producto */}
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Producto</InputLabel>
                      <Select
                        value={row.productoId}
                        onChange={(e) => {
                          const selectedProduct = productos.find(p => p.productoId === e.target.value)
                          const newRows = [...productRows]
                          newRows[index] = {
                            ...row,
                            productoId: e.target.value,
                            precio: (selectedProduct?.precio || 0) * row.cantidad
                          }
                          setProductRows(newRows)
                        }}
                      >
                        {productos.map((producto) => (
                          <MenuItem key={producto.productoId} value={producto.productoId}>
                            {producto.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Cantidad */}
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad"
                      value={row.cantidad}
                      onChange={(e) => {
                        const cantidad = Number(e.target.value)
                        const newRows = [...productRows]
                        const selectedProduct = productos.find(p => p.productoId === row.productoId)

                        newRows[index] = {
                          ...row,
                          cantidad: cantidad,
                          precio: (selectedProduct?.precio || 0) * cantidad
                        }
                        setProductRows(newRows)

                        // Recalcular totales
                        const subtotalTotal = newRows.reduce((acc, row) => acc + row.precio, 0)
                        const descuentoTotal = newRows.reduce((acc, row) => {
                          return acc + (row.precio * (row.descuento / 100))
                        }, 0)
                        const baseImponible = subtotalTotal - descuentoTotal
                        const impuesto = baseImponible * 0.19
                        const total = baseImponible + impuesto

                        updateFormData({
                          ...formData,
                          subtotal: subtotalTotal,
                          descuento: descuentoTotal,
                          impuesto: impuesto,
                          total: total
                        })
                      }}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  {/* Descuento */}
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Descuento %"
                      value={row.descuento}
                      onChange={(e) => {
                        const descuentoPorcentaje = Number(e.target.value)
                        if (descuentoPorcentaje >= 0 && descuentoPorcentaje <= 100) {
                          const newRows = [...productRows]
                          const precioBase = row.cantidad * (productos.find(p => p.productoId === row.productoId)?.precio || 0)

                          newRows[index] = {
                            ...row,
                            descuento: descuentoPorcentaje,
                            precio: precioBase * (1 - descuentoPorcentaje / 100) // Aplicar el descuento al precio
                          }
                          setProductRows(newRows)

                          // Recalcular totales
                          const subtotalTotal = newRows.reduce((acc, row) => {
                            const precioBase = row.cantidad * (productos.find(p => p.productoId === row.productoId)?.precio || 0)
                            return acc + precioBase
                          }, 0)

                          const descuentoTotal = newRows.reduce((acc, row) => {
                            const precioBase = row.cantidad * (productos.find(p => p.productoId === row.productoId)?.precio || 0)
                            return acc + (precioBase * (row.descuento / 100))
                          }, 0)

                          const baseImponible = subtotalTotal - descuentoTotal
                          const impuesto = baseImponible * 0.19
                          const total = baseImponible + impuesto

                          updateFormData({
                            ...formData,
                            subtotal: subtotalTotal,
                            descuento: descuentoTotal,
                            impuesto: impuesto,
                            total: total
                          })
                        }
                      }}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </Grid>

                  {/* Precio (mostrar el precio con descuento) */}
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      disabled
                      label="Precio"
                      value={row.precio?.toLocaleString('es-CL')}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>
                </Grid>
              ))}

              <Button
                variant="outlined"
                onClick={handleAddRow}
                startIcon={<i className="ri-add-line" />}
              >
                Agregar Producto
              </Button>
            </Grid>

            {/* Totales */}
            <Grid item xs={12}>
              <div className='flex justify-end'>
                <div className='min-w-[300px]'>
                  <div className='flex justify-between mb-2'>
                    <Typography>Subtotal:</Typography>
                    <Typography>${formData.subtotal?.toLocaleString('es-CL') || '0'}</Typography>
                  </div>
                  <div className='flex justify-between mb-2'>
                    <Typography>Descuento:</Typography>
                    <Typography>${formData.descuento?.toLocaleString('es-CL') || '0'}</Typography>
                  </div>
                  <div className='flex justify-between mb-2'>
                    <Typography>IVA (19%):</Typography>
                    <Typography>${formData.impuesto?.toLocaleString('es-CL') || '0'}</Typography>
                  </div>
                  <Divider className='my-2' />
                  <div className='flex justify-between'>
                    <Typography variant='h6'>Total:</Typography>
                    <Typography variant='h6'>${formData.total?.toLocaleString('es-CL') || '0'}</Typography>
                  </div>
                </div>
              </div>
            </Grid>
            <Grid
              container
              spacing={2}
              sx={{
                mt: 4,
                justifyContent: 'center',
                '& .MuiButton-root': {
                  minWidth: '120px',
                  maxWidth: '150px'
                }
              }}
            >
              <Grid item>
                <Button
                  color="primary"
                  variant="contained"
                  onClick={async () => {
                    try {
                      if (!formData.cliente?.clienteId) {
                        throw new Error('Debe seleccionar un cliente')
                      }

                      const dataToSend = {
                        numeroCotizacion: formData.numeroCotizacion,
                        tipoCotizacion: formData.tipoCotizacion,
                        estado: 'PENDIENTE',
                        clienteId: formData.cliente.clienteId,
                        obraId: formData.obra?.obraId || null,
                        fechaInicio: new Date().toISOString(),
                        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        subtotal: formData.subtotal,
                        descuento: formData.descuento,
                        impuesto: formData.impuesto,
                        total: formData.total,
                        observaciones: formData.observaciones,
                        detalles: {
                          create: formData.detalles.map(detalle => ({
                            productoId: detalle.productoId,
                            cantidad: detalle.cantidad,
                            precioUnitario: detalle.precioUnitario,
                            descuento: detalle.descuento || 0,
                            subtotal: detalle.subtotal
                          }))
                        }
                      }

                      console.log('Datos a enviar:', JSON.stringify(dataToSend, null, 2))

                      const response = await fetch('/api/cotizaciones', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(dataToSend)
                      })

                      if (!response.ok) {
                        throw new Error('Error al guardar la cotización')
                      }

                      router.push('/apps/invoice/list')
                    } catch (error) {
                      console.error('Error al guardar:', error)
                      alert(error.message)
                    }
                  }}
                >
                  Guardar
                </Button>
              </Grid>
              <Grid item>
                <Button
                  color="secondary"
                  variant="outlined"
                  onClick={handlePreview}
                >
                  Visualizar
                </Button>
              </Grid>
              <Grid item>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <AddCustomerDrawer open={open} setOpen={setOpen} onFormSubmit={(data) => updateFormData(data)} />
    </>
  )
}

export default AddCard
