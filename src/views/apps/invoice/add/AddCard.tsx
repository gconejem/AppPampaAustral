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
import type { SelectChangeEvent } from '@mui/material/Select'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import InputLabel from '@mui/material/InputLabel'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import FormControl from '@mui/material/FormControl'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import DeleteIcon from '@mui/icons-material/Delete'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import SearchIcon from '@mui/icons-material/Search'

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

interface ProductoEnPaquete {
  productoId: number
  nombre: string
  area: string
  precio: number
  cantidad: number
  descripcion?: string
}

const AddCard = ({
  invoiceData,
  onFormDataChange
}: {
  invoiceData?: InvoiceType[]
  onFormDataChange?: (data: any) => void
}) => {
  const router = useRouter()

  // Estados base
  const [formData, setFormData] = useState({
    // Datos principales
    numeroCotizacion: '',
    tipoCotizacion: '',
    estado: 'BORRADOR',

    // Fechas
    fechaInicio: null,
    fechaFin: null,

    // Contacto
    contacto: null as Contacto | null,

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
    }>,

    // Nuevos campos
    nombreProyecto: '',
    empresa: '',
    ubicacion: ''
  })

  // States
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [selectData, setSelectData] = useState<InvoiceType | null>(null)
  const [issuedDate, setIssuedDate] = useState<Date | null | undefined>(null)
  const [dueDate, setDueDate] = useState<Date | null | undefined>(null)
  const [clientes, setClientes] = useState([])
  const [obras, setObras] = useState([])

  const [productos, setProductos] = useState<
    Array<{
      productoId: number
      sku: string
      nombre: string
      precio: number
      cantidad: number
      descuento: number
      subtotal: number
      area: string
      esPaquete: boolean
      norma: string
      productosEnPaquete: Array<{
        producto: {
          productoId: number
          nombre: string
          precio: number
          area: string
          norma: string
        }
        cantidad: number
      }>
    }>
  >([])

  // Agregar un estado para el descuento
  const [descuento, setDescuento] = useState<number>(0)

  // Agregar un estado para manejar múltiples filas de productos
  const [productRows, setProductRows] = useState([
    {
      id: 1,
      productoId: '',
      cantidad: 1,
      descuento: 0,
      precio: 0,
      area: '',
      descripcion: '',
      subproductos: []
    }
  ])

  // Agregar estado para contactos
  const [contactos, setContactos] = useState<
    Array<{
      contactoId: number
      nombre: string
      cargo: string
      email: string
      telefono?: string
    }>
  >([])

  // Agregar nuevo estado para áreas únicas
  const [areas, setAreas] = useState<string[]>([])
  const [selectedArea, setSelectedArea] = useState<string>('')

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

  // Modificar el useEffect de carga de productos
  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        console.log('Productos cargados (raw):', data) // Ver los datos crudos

        const productosConNorma = data.map((p: any) => {
          console.log('Producto individual:', p) // Ver cada producto

          return {
            ...p,
            nombreCompleto: `${p.nombre}${p.norma ? ` - ${p.norma}` : ''}`
          }
        })

        setProductos(productosConNorma)

        // Obtener áreas únicas
        const uniqueAreas = Array.from(new Set(data.map((p: any) => p.area).filter(Boolean)))

        setAreas(uniqueAreas)
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

  // Modificar el useEffect para cargar contactos
  useEffect(() => {
    // Cambiar la ruta a /api/contacts que es la correcta
    fetch('/api/contacts')
      .then(res => res.json())
      .then(data => {
        console.log('Contactos cargados:', data)

        // Mapear los datos para asegurar la estructura correcta
        const contactosMapeados = data.map((contacto: any) => ({
          contactoId: contacto.contactId, // Asegurarnos de usar los nombres de campos correctos
          nombre: contacto.nombre,
          cargo: contacto.cargo,
          email: contacto.email,
          telefono: contacto.telefono1 || contacto.telefono // Por si acaso el campo se llama diferente
        }))

        console.log('Contactos mapeados:', contactosMapeados)
        setContactos(contactosMapeados)
      })
      .catch(error => {
        console.error('Error al cargar contactos:', error)
        setContactos([]) // En caso de error, inicializar como array vacío
      })
  }, [])

  const updateFormData = (data: any) => {
    if (data.contacto) {
      // Si es un contacto, actualizamos solo el campo de contacto
      setFormData(prev => ({
        ...prev,
        contacto: {
          nombre: data.contacto.nombre,
          cargo: data.contacto.cargo,
          email: data.contacto.email,
          telefono: data.contacto.telefono
        }
      }))
    } else {
      // Para otros datos, actualizamos normalmente
      setFormData(prev => ({ ...prev, ...data }))
    }

    // Si hay una función de callback, la llamamos
    if (onFormDataChange) {
      onFormDataChange(data)
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

  // Función para calcular totales
  const calcularTotales = (rows: typeof productRows) => {
    const subtotal = rows.reduce((acc, row) => {
      // Si es un subproducto, no lo incluimos en el cálculo ya que su precio
      // ya está incluido en el paquete
      if (row.esSubProducto) return acc

      const precioBase = row.precio || 0
      const descuento = (precioBase * (row.descuento || 0)) / 100

      return acc + (precioBase - descuento)
    }, 0)

    const descuentoTotal = rows.reduce((acc, row) => {
      if (row.esSubProducto) return acc

      return acc + ((row.precio || 0) * (row.descuento || 0)) / 100
    }, 0)

    const baseImponible = subtotal - descuentoTotal
    const impuesto = baseImponible * 0.19 // 19% IVA

    updateFormData(prev => ({
      ...prev,
      subtotal: subtotal,
      descuento: descuentoTotal,
      impuesto: impuesto,
      total: baseImponible + impuesto
    }))
  }

  // Función para manejar el cambio de producto
  const handleProductoChange = async (e: SelectChangeEvent<string>, index: number) => {
    const selectedProductId = e.target.value
    const selectedProduct = productos.find(p => p.productoId === selectedProductId)

    if (!selectedProduct) return

    const newRows = [...productRows]

    if (selectedProduct.esPaquete) {
      try {
        // Obtener los productos del paquete
        const response = await fetch(`/api/productos/${selectedProduct.productoId}/productos-paquete`)

        if (!response.ok) throw new Error('Error al obtener productos del paquete')

        const productosEnPaquete = await response.json()

        console.log('Productos en paquete:', productosEnPaquete)

        // Actualizar la fila del paquete
        newRows[index] = {
          ...productRows[index],
          productoId: selectedProductId,
          precio: selectedProduct.precio * productRows[index].cantidad,
          area: selectedProduct.area || '',
          esPaquete: true,
          descripcion: selectedProduct.descripcion || ''
        }

        // Agregar los productos del paquete como subfilas
        const subProductos = productosEnPaquete.map((pp: ProductoEnPaquete) => ({
          id: `${productRows[index].id}-${pp.productoId}`,
          productoId: pp.productoId,
          cantidad: pp.cantidad,
          descuento: 0,
          precio: pp.precio * pp.cantidad,
          area: pp.area,
          descripcion: pp.descripcion,
          esSubProducto: true
        }))

        // Insertar los subproductos después del paquete
        newRows.splice(index + 1, 0, ...subProductos)
        console.log('Nuevas filas después de agregar subproductos:', newRows)
      } catch (error) {
        console.error('Error al obtener productos del paquete:', error)
      }
    } else {
      newRows[index] = {
        ...productRows[index],
        productoId: selectedProductId,
        precio: selectedProduct.precio * productRows[index].cantidad,
        area: selectedProduct.area || '',
        descripcion: selectedProduct.descripcion || '',
        norma: selectedProduct.norma
      }
      console.log('Producto seleccionado:', selectedProduct) // Ver qué datos tiene el producto seleccionado
    }

    setProductRows(newRows)
    calcularTotales(newRows) // Recalcular totales después de cambiar producto
    setSelectedArea(selectedProduct.area || '')
  }

  // Función para manejar la visualización
  const handlePreview = () => {
    // Preparar los datos para la previsualización
    const previewData = {
      ...formData,
      detalles: productRows.map(row => {
        const producto = productos.find(p => p.productoId === Number(row.productoId))

        return {
          productoId: row.productoId,
          nombre: producto?.nombre,
          norma: producto?.norma,
          area: row.area,
          cantidad: row.cantidad,
          precio: row.precio,
          descuento: row.descuento,
          esPaquete: row.esPaquete,
          esSubProducto: row.esSubProducto,
          descripcion: producto?.descripcion
        }
      })
    }

    // Guardar en localStorage
    localStorage.setItem('cotizacionPreview', JSON.stringify(previewData))

    // Abrir en nueva pestaña con la ruta correcta
    window.open('/home/apps/invoice/preview', '_blank')
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
      subtotal: subtotalSinDescuento, // Guardamos el subtotal sin descuento
      montoDescuento: montoDescuento // Guardamos el monto del descuento
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
    const newRows = [
      ...productRows,
      {
        id: productRows.length + 1,
        productoId: '',
        cantidad: 1,
        descuento: 0,
        precio: 0,
        area: '',
        descripcion: '',
        subproductos: []
      }
    ]

    setProductRows(newRows)
    calcularTotales(newRows)
  }

  // Función para eliminar una fila y sus subproductos si es un paquete
  const handleDeleteRow = (index: number) => {
    const rowToDelete = productRows[index]
    const newRows = [...productRows]

    if (rowToDelete.esPaquete) {
      let nextIndex = index + 1

      while (nextIndex < newRows.length && newRows[nextIndex].esSubProducto) {
        nextIndex++
      }

      newRows.splice(index, nextIndex - index)
    } else {
      newRows.splice(index, 1)
    }

    setProductRows(newRows)
    calcularTotales(newRows) // Recalcular totales después de eliminar
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
                        name='numeroCotizacion'
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
                        Fecha Emisión:
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
                        Fecha Vencimiento:
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

            {/* Campos principales */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='tipo-cotizacion-label'>Tipo de Cotización</InputLabel>
                <Select
                  label='Tipo de Cotización'
                  value={formData.tipoCotizacion}
                  onChange={e => updateFormData({ ...formData, tipoCotizacion: e.target.value })}
                >
                  <MenuItem value='A'>Tipo A</MenuItem>
                  <MenuItem value='B'>Tipo B</MenuItem>
                  <MenuItem value='C'>Tipo C</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Segunda fila: Nombre del Proyecto, Empresa, Ubicación */}
            <Grid item xs={12}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Nombre del Proyecto'
                    value={formData.nombreProyecto || ''}
                    onChange={e => updateFormData({ ...formData, nombreProyecto: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Empresa'
                    value={formData.empresa || ''}
                    onChange={e => updateFormData({ ...formData, empresa: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Ubicación'
                    value={formData.ubicacion || ''}
                    onChange={e => updateFormData({ ...formData, ubicacion: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Fechas */}
            <Grid item xs={12} md={6}>
              <AppReactDatepicker
                label='Fecha Inicio'
                name='fechaInicio'
                value={formData.fechaInicio}
                onChange={date => updateFormData({ ...formData, fechaInicio: date })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <AppReactDatepicker
                label='Fecha Fin'
                name='fechaFin'
                value={formData.fechaFin}
                onChange={date => updateFormData({ ...formData, fechaFin: date })}
              />
            </Grid>

            {/* Contacto con búsqueda y detalles */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                fullWidth
                size='small'
                options={contactos}
                getOptionLabel={option => `${option.nombre} - ${option.cargo}`}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Buscar Contacto'
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component='li' {...props}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant='body1'>
                        {option.nombre}{' '}
                        <Typography component='span' color='text.secondary'>
                          #{option.contactoId}
                        </Typography>
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {option.cargo}
                      </Typography>
                    </Box>
                  </Box>
                )}
                filterOptions={(options, { inputValue }) => {
                  return options.filter(
                    option =>
                      option.nombre.toLowerCase().includes(inputValue.toLowerCase()) ||
                      option.cargo.toLowerCase().includes(inputValue.toLowerCase())
                  )
                }}
                onChange={(_, newValue) => {
                  if (newValue) {
                    updateFormData({
                      contacto: {
                        nombre: newValue.nombre,
                        cargo: newValue.cargo,
                        email: newValue.email,
                        telefono: newValue.telefono
                      }
                    })
                  }
                }}
              />

              {/* Detalles del contacto seleccionado */}
              {formData.contacto && (
                <Box sx={{ mt: 2 }}>
                  <div className='flex flex-col gap-2'>
                    <Typography>{formData.contacto.nombre}</Typography>
                    <Typography>{formData.contacto.cargo}</Typography>
                    <Typography>{formData.contacto.email}</Typography>
                  </div>
                </Box>
              )}
            </Grid>

            {/* Espacio para información de facturación fija */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <div className='flex flex-col gap-2 text-right'>
                  <Typography sx={{ fontWeight: 'bold' }}>Emisión de Órden de Compra o Transferencia</Typography>
                  <Typography>Nombre: Sociedad Laboratorio Pampa Austral Ltda.</Typography>
                  <Typography>Rut: 77.390.460-K</Typography>
                  <Typography>Dirección: Calle Santa Blanca N° 51, Chillán. Región de Ñuble, Chile</Typography>
                  <Typography>Cuenta Corriente: 220-02813-03, Banco de Chile.</Typography>
                </div>
              </Box>
            </Grid>

            {/* Detalles de la Cotización */}
            <Grid item xs={12} sx={{ mt: 8 }}>
              {productRows.map((row, index) => (
                <Grid
                  container
                  spacing={2}
                  key={row.id}
                  sx={{
                    mb: 2,
                    ...(row.esPaquete
                      ? {
                          // Estilo para paquetes
                          p: 2,
                          backgroundColor: 'primary.lighter',
                          borderRadius: '4px 4px 0 0',
                          borderLeft: '4px solid',
                          borderLeftColor: 'primary.main'
                        }
                      : row.esSubProducto
                        ? {
                            // Estilo para subproductos del paquete
                            ml: 4,
                            p: 1,
                            backgroundColor: 'action.hover',
                            borderLeft: '2px solid',
                            borderLeftColor: 'primary.light',
                            borderRadius: '0',
                            '& .MuiFormControl-root': {
                              '& .MuiInputBase-root': {
                                height: '40px'
                              },
                              '& .MuiInputLabel-root': {
                                top: '-8px',
                                fontSize: '0.875rem'
                              },
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(0, 0, 0, 0.1)'
                              }
                            },
                            opacity: 0.85,
                            '&:last-of-type': {
                              borderRadius: '0 0 4px 4px',
                              mb: 2
                            }
                          }
                        : {
                            // Estilo para productos normales
                            p: 2,
                            backgroundColor: 'background.paper',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: 'divider',
                            mt:
                              index > 0 && (productRows[index - 1].esPaquete || productRows[index - 1].esSubProducto)
                                ? 6
                                : 2
                          })
                  }}
                >
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Área</InputLabel>
                      <Select
                        value={row.area}
                        onChange={e => {
                          setSelectedArea(e.target.value)
                          const newRows = [...productRows]

                          newRows[index] = {
                            ...row,
                            area: e.target.value,
                            productoId: ''
                          }
                          setProductRows(newRows)
                        }}
                        disabled={row.esPaquete || row.esSubProducto}
                      >
                        <MenuItem value=''>Todas</MenuItem>
                        {areas.map(area => (
                          <MenuItem key={area} value={area}>
                            {area}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Producto</InputLabel>
                      <Select
                        value={row.productoId}
                        onChange={e => handleProductoChange(e, index)}
                        disabled={row.esPaquete || row.esSubProducto}
                      >
                        {productos
                          .filter(p => !row.area || p.area === row.area)
                          .map(producto => (
                            <MenuItem key={producto.productoId} value={producto.productoId}>
                              {producto.nombre} {producto.esPaquete ? '(Paquete)' : ''}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size='small'
                      label='Descripción'
                      value={row.descripcion || ''}
                      disabled
                      InputProps={{
                        readOnly: true
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={1}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Cantidad'
                      value={row.cantidad}
                      onChange={e => {
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
                          return acc + row.precio * (row.descuento / 100)
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

                  <Grid item xs={12} md={1}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Descuento %'
                      value={row.descuento}
                      onChange={e => {
                        const descuentoPorcentaje = Number(e.target.value)

                        if (descuentoPorcentaje >= 0 && descuentoPorcentaje <= 100) {
                          const newRows = [...productRows]

                          const precioBase =
                            row.cantidad * (productos.find(p => p.productoId === row.productoId)?.precio || 0)

                          newRows[index] = {
                            ...row,
                            descuento: descuentoPorcentaje,
                            precio: precioBase * (1 - descuentoPorcentaje / 100) // Aplicar el descuento al precio
                          }
                          setProductRows(newRows)

                          // Recalcular totales
                          const subtotalTotal = newRows.reduce((acc, row) => {
                            const precioBase =
                              row.cantidad * (productos.find(p => p.productoId === row.productoId)?.precio || 0)

                            return acc + precioBase
                          }, 0)

                          const descuentoTotal = newRows.reduce((acc, row) => {
                            const precioBase =
                              row.cantidad * (productos.find(p => p.productoId === row.productoId)?.precio || 0)

                            return acc + precioBase * (row.descuento / 100)
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

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size='small'
                      disabled
                      label='Precio'
                      value={row.precio?.toLocaleString('es-CL')}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>$</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                      color='error'
                      onClick={() => handleDeleteRow(index)}
                      sx={{
                        visibility: row.esSubProducto ? 'hidden' : 'visible'
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}

              <Button variant='outlined' onClick={handleAddRow} startIcon={<i className='ri-add-line' />}>
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
                color='primary'
                variant='contained'
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
              <Button color='secondary' variant='outlined' onClick={handlePreview}>
                Visualizar
              </Button>
            </Grid>
            <Grid item>
              <Button color='error' variant='outlined' onClick={() => router.back()}>
                Cancelar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <AddCustomerDrawer
        open={open}
        setOpen={setOpen}
        onFormSubmit={data => {
          updateFormData({ contacto: data })
        }}
      />
    </>
  )
}

export default AddCard
