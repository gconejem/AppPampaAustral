'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Box from '@mui/material/Box'
import SearchIcon from '@mui/icons-material/Search'
import Popover from '@mui/material/Popover'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import Autocomplete from '@mui/material/Autocomplete'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'

// Third-party Imports
import { toast } from 'react-hot-toast'

// Component Imports
import Logo from '@components/layout/shared/Logo'

interface ProductRow {
  id: number
  productoId: string
  cantidad: number
  precioUnitarioUF: number
  totalNetoUF: number
  area: string
  descripcion: string
  subproductos: never[]
  precio?: number
  descuento?: number
  esSubProducto?: boolean
  esPaquete?: boolean
  servicio?: string
}

interface ProductoType {
  id: number
  productoId: number
  sku: string
  nombre: string
  precio: number
  area?: string
  familia?: string
  tipo?: string
  descripcion?: string
  esPaquete?: boolean
  norma?: string
  nombreCompleto?: string
  servicio?: string
  productosEnPaquete?: any[]
  listasPrecios?: any[]
}

interface ContactoType {
  contactoId: number
  nombre: string
  cargo: string
  email: string
  telefono1: string
}

interface FormDataType {
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  tipoCotizacion: string
  nombreProyecto: string
  ubicacion: string
  observaciones: string
  numeroCotizacion: string
  fechaCreacion: string
  fechaFin: string
  contacto?: ContactoType
  contactoId?: number
  listaPrecioId?: number | null
  formaPago?: string
  empresa?: string
}

const EditCard = ({ id }: { id: string }) => {
  const router = useRouter()

  // Estados principales
  const [formData, setFormData] = useState<FormDataType | null>(null)
  const [productRows, setProductRows] = useState<ProductRow[]>([])
  const [productos, setProductos] = useState<ProductoType[]>([])
  const [contactos, setContactos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [tipos, setTipos] = useState<string[]>([])
  const [familias, setFamilias] = useState<string[]>([])
  const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [filteredProductos, setFilteredProductos] = useState<ProductoType[]>([])
  const [listasPrecios, setListasPrecios] = useState<Array<{ id: number; nombre: string }>>([])

  // Función para calcular totales
  const calcularTotales = useCallback(() => {
    if (!formData) return

    const subtotalTotal = productRows.reduce((acc, row) => acc + (Number(row.totalNetoUF) || 0), 0)
    const descuentoTotal = Number(formData.descuento || 0)
    const baseImponible = Number(subtotalTotal - descuentoTotal)
    const impuesto = Number(baseImponible * 0.19)
    const total = Number(baseImponible + impuesto)

    // Solo actualizar si los valores han cambiado
    if (
      formData.subtotal !== subtotalTotal ||
      formData.descuento !== descuentoTotal ||
      formData.impuesto !== impuesto ||
      formData.total !== total
    ) {
      setFormData(prev => ({
        ...prev!,
        subtotal: Number(subtotalTotal.toFixed(2)),
        descuento: Number(descuentoTotal.toFixed(2)),
        impuesto: Number(impuesto.toFixed(2)),
        total: Number(total.toFixed(2))
      }))
    }
  }, [productRows, formData])

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Cargar la cotización
        const cotizacionResponse = await fetch(`/api/cotizaciones/${id}`)

        if (!cotizacionResponse.ok) throw new Error('Error al cargar la cotización')
        const cotizacionData = await cotizacionResponse.json()

        // Cargar productos
        const productosResponse = await fetch('/api/productos')

        if (!productosResponse.ok) throw new Error('Error al cargar productos')
        const productosData = await productosResponse.json()

        // Cargar contactos
        const contactosResponse = await fetch('/api/contacts')

        if (!contactosResponse.ok) throw new Error('Error al cargar contactos')
        const contactosData = await contactosResponse.json()

        // Cargar listas de precios
        const listasPreciosResponse = await fetch('/api/listas-precios')

        if (!listasPreciosResponse.ok) throw new Error('Error al cargar listas de precios')
        const listasPreciosData = await listasPreciosResponse.json()

        // Formatear productos
        const productosFormateados = productosData.productos.map((p: any) => ({
          id: p.productoId,
          productoId: p.productoId,
          sku: p.sku,
          nombre: p.nombre,
          precio: p.precio || 0,
          area: p.area || 'Sin área',
          familia: p.familia || 'Sin familia',
          tipo: p.tipo || 'Sin tipo',
          descripcion: p.descripcion || '',
          esPaquete: p.esPaquete,
          norma: p.norma || '',
          nombreCompleto: `${p.nombre}${p.norma ? ` - ${p.norma}` : ''}`,
          servicio: p.servicio || '',
          productosEnPaquete: p.productosEnPaquete || [],
          listasPrecios: p.listasPrecios || []
        }))

        // Convertir detalles a formato de filas de productos
        const detallesFormateados = cotizacionData.detalles.map((detalle: any) => ({
          id: detalle.id,
          productoId: detalle.productoId.toString(),
          cantidad: detalle.cantidad,
          precioUnitarioUF: detalle.precioUnitario,
          totalNetoUF: detalle.subtotal,
          area: detalle.producto?.area || '',
          descripcion: detalle.producto?.descripcion || '',
          servicio: detalle.producto?.nombre,
          esPaquete: detalle.esPaquete || false,
          esSubProducto: detalle.esSubProducto || false,
          subproductos: []
        }))

        // Actualizar estados
        setFormData(cotizacionData)
        setProductRows(detallesFormateados)
        setProductos(productosFormateados)
        setFilteredProductos(productosFormateados)
        setContactos(contactosData)
        setListasPrecios(listasPreciosData)

        // Extraer áreas, tipos y familias únicas
        const uniqueAreas = Array.from(new Set(productosFormateados.map((p: ProductoType) => p.area))).filter(Boolean)
        const uniqueTipos = Array.from(new Set(productosFormateados.map((p: ProductoType) => p.tipo))).filter(Boolean)

        const uniqueFamilias = Array.from(new Set(productosFormateados.map((p: ProductoType) => p.familia))).filter(
          Boolean
        )

        setAreas(uniqueAreas as string[])
        setTipos(uniqueTipos as string[])
        setFamilias(uniqueFamilias as string[])

        setLoading(false)
      } catch (error) {
        console.error('Error al cargar datos:', error)
        setError('Error al cargar los datos')
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Efecto para recalcular totales
  useEffect(() => {
    if (formData && productRows.length > 0) {
      calcularTotales()
    }
  }, [productRows]) // Solo depender de productRows, no de calcularTotales ni formData

  // Función para manejar cambios en los productos
  const handleSelectProduct = (producto: ProductoType) => {
    const newRows = [...productRows]
    const precioFinal = producto.precio || 0

    // Eliminar la fila vacía si existe
    const filteredRows = newRows.filter(row => row.productoId !== '0')

    if (producto.esPaquete && producto.productosEnPaquete && producto.productosEnPaquete.length > 0) {
      // Agregar paquete y sus productos
      const paqueteRow = {
        id: Date.now(),
        productoId: producto.productoId.toString(),
        servicio: producto.nombreCompleto,
        descripcion: producto.descripcion || '',
        cantidad: 1,
        precioUnitarioUF: precioFinal,
        totalNetoUF: precioFinal,
        area: producto.area || '',
        esPaquete: true,
        subproductos: []
      }

      const productosRows = (producto.productosEnPaquete || []).map((pp: any) => ({
        id: Date.now() + Math.random(),
        productoId: pp.producto?.productoId?.toString() || '',
        servicio: pp.producto?.nombre || '',
        descripcion: pp.producto?.descripcion || '',
        cantidad: pp.cantidad || 1,
        precioUnitarioUF: pp.producto?.precio || 0,
        totalNetoUF: (pp.producto?.precio || 0) * (pp.cantidad || 1),
        area: pp.producto?.area || '',
        esSubProducto: true,
        subproductos: []
      }))

      setProductRows([...filteredRows, paqueteRow, ...productosRows])
    } else {
      // Agregar producto individual
      const newRow = {
        id: Date.now(),
        productoId: producto.productoId.toString(),
        servicio: producto.nombreCompleto,
        descripcion: producto.descripcion || '',
        cantidad: 1,
        precioUnitarioUF: precioFinal,
        totalNetoUF: precioFinal,
        area: producto.area || '',
        subproductos: []
      }

      setProductRows([...filteredRows, newRow])
    }

    handleClosePopover()
  }

  const handleContactChange = (newValue: ContactoType | null) => {
    if (newValue) {
      setFormData(prev => {
        if (!prev) return null

        return {
          ...prev,
          contacto: newValue,
          contactoId: newValue.contactoId
        }
      })
    } else {
      setFormData(prev => {
        if (!prev) return null

        return {
          ...prev,
          contacto: undefined,
          contactoId: undefined
        }
      })
    }
  }

  // Handlers para la tabla de productos
  const handleCantidadChange = (index: number, cantidad: number) => {
    setProductRows(prevRows => {
      const newRows = [...prevRows]
      const row = newRows[index]

      if (row) {
        row.cantidad = cantidad
        row.totalNetoUF = cantidad * (row.precioUnitarioUF || 0)
      }

      return newRows
    })
  }

  const handlePrecioChange = (index: number, precio: number) => {
    setProductRows(prevRows => {
      const newRows = [...prevRows]
      const row = newRows[index]

      if (row) {
        row.precioUnitarioUF = precio
        row.totalNetoUF = (row.cantidad || 1) * precio
      }

      return newRows
    })
  }

  const handleDeleteRow = (index: number) => {
    setProductRows(prevRows => {
      const newRows = [...prevRows]
      const rowToDelete = newRows[index]

      if (rowToDelete && rowToDelete.esSubProducto) {
        // Si es un subproducto, solo eliminar esta fila
        newRows.splice(index, 1)
      } else {
        // Si es un producto principal, eliminar también sus subproductos
        const subproductosCount = rowToDelete?.subproductos?.length || 0

        newRows.splice(index, 1 + subproductosCount)
      }

      return newRows
    })
  }

  // Funciones para el manejo del popover
  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    filterProducts(searchTerm, selectedArea, selectedTipo, selectedFamilia)
  }

  const handleClosePopover = () => {
    setAnchorEl(null)
  }

  // Función para filtrar productos
  const filterProducts = (search: string, area: string, tipo: string, familia: string) => {
    let filtered = [...productos]

    if (showOnlyPaquetes) {
      filtered = filtered.filter(product => product.esPaquete === true)
    }

    if (search) {
      const searchLower = search.toLowerCase()

      filtered = filtered.filter(
        product =>
          product.nombre.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          (product.descripcion || '').toLowerCase().includes(searchLower)
      )
    }

    if (area) filtered = filtered.filter(product => product.area === area)
    if (tipo) filtered = filtered.filter(product => product.tipo === tipo)
    if (familia) filtered = filtered.filter(product => product.familia === familia)

    setFilteredProductos(filtered)
  }

  // Función para guardar cambios
  const handleSave = async () => {
    try {
      if (!formData) return

      const detallesValidos = productRows.map(row => ({
        productoId: parseInt(row.productoId),
        cantidad: row.cantidad,
        precioUnitario: row.precioUnitarioUF,
        descuento: row.descuento || 0,
        subtotal: row.totalNetoUF,
        esPaquete: row.esPaquete || false,
        esSubProducto: row.esSubProducto || false,
        paqueteId: row.paqueteId || null
      }))

      const dataToSend = {
        ...formData,
        detalles: detallesValidos,
        listaPrecioId: formData.listaPrecioId ? Number(formData.listaPrecioId) : null
      }

      console.log('DATA QUE SE ENVÍA AL PUT:', dataToSend)

      const response = await fetch(`/api/cotizaciones/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la cotización')
      }

      toast.success('Cotización actualizada exitosamente')
      router.push('/es/apps/invoice/list')
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al actualizar la cotización')
    }
  }

  // Función para manejar la vista previa
  const handlePreview = () => {
    if (!formData) return

    const previewData = {
      ...formData,
      detalles: productRows.map(row => ({
        productoId: parseInt(row.productoId),
        servicio: row.servicio || '',
        area: row.area || '',
        descripcion: row.descripcion || '',
        cantidad: row.cantidad,
        precioUnitarioUF: row.precioUnitarioUF,
        totalNetoUF: row.totalNetoUF,
        esPaquete: row.esPaquete || false,
        esSubProducto: row.esSubProducto || false
      }))
    }

    localStorage.setItem('cotizacionPreview', JSON.stringify(previewData))
    window.open('/es/apps/invoice/preview', '_blank')
  }

  if (loading) return <Typography>Cargando...</Typography>
  if (error) return <Typography color='error'>{error}</Typography>
  if (!formData) return <Typography>No se encontró la cotización</Typography>

  return (
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
                </div>
              </div>
            </div>
          </Grid>

          {/* Información de Emisión de Orden de Compra */}
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'right', mb: 4 }}>
              <Typography variant='h6'>Emisión de Orden de Compra o Transferencia</Typography>
              <Typography>Nombre: Sociedad Laboratorio Pampa Austral Ltda.</Typography>
              <Typography>Rut: 77.390.460-K</Typography>
              <Typography>Dirección: Calle Santa Blanca N° 51, Chillán, Región de Ñuble, Chile</Typography>
              <Typography>Cuenta Corriente: 220-02813-03, Banco de Chile.</Typography>
            </Box>
          </Grid>

          {/* Contacto */}
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
              value={formData.contacto || null}
              onChange={(_, newValue) => handleContactChange(newValue)}
            />
          </Grid>

          {/* Primera fila 4-4-4 */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Cotización</InputLabel>
                  <Select
                    value={formData.tipoCotizacion}
                    label='Tipo de Cotización'
                    onChange={e => setFormData({ ...formData, tipoCotizacion: e.target.value })}
                  >
                    <MenuItem value='A'>Valores Unitarios</MenuItem>
                    <MenuItem value='B'>EMS</MenuItem>
                    <MenuItem value='C'>Mensual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Lista de Precios</InputLabel>
                  <Select
                    value={formData.listaPrecioId || ''}
                    label='Lista de Precios'
                    onChange={e => setFormData({ ...formData, listaPrecioId: e.target.value ? Number(e.target.value) : null })}
                  >
                    {listasPrecios.map(lista => (
                      <MenuItem key={lista.id} value={lista.id}>
                        {lista.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Forma de Pago</InputLabel>
                  <Select
                    value={formData.formaPago || 'CONTADO'}
                    label='Forma de Pago'
                    onChange={e => setFormData({ ...formData, formaPago: e.target.value })}
                  >
                    <MenuItem value='CONTADO'>Contado</MenuItem>
                    <MenuItem value='CREDITO_30'>Crédito 30 días</MenuItem>
                    <MenuItem value='CREDITO_60'>Crédito 60 días</MenuItem>
                    <MenuItem value='CREDITO_90'>Crédito 90 días</MenuItem>
                  </Select>
                  <Typography variant='caption' sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                    Métodos de pago: Transferencia, Tarjetas vía flow.cl, solicitar link
                  </Typography>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Segunda fila 4-4-4 */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Nombre del Proyecto'
                  value={formData.nombreProyecto || ''}
                  onChange={e => setFormData({ ...formData, nombreProyecto: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Empresa'
                  value={formData.empresa || ''}
                  onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Ubicación'
                  value={formData.ubicacion || ''}
                  onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Detalles de Servicios */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Detalle de Servicios
            </Typography>

            {productRows.map((row, index) => (
              <Grid container spacing={2} key={row.id}>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label='Servicio' value={row.servicio || ''} onClick={handleOpenPopover} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField fullWidth label='Área' value={row.area || ''} disabled />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField fullWidth label='Descripción' value={row.descripcion || ''} multiline maxRows={4} />
                </Grid>
                <Grid item xs={12} md={1}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Cantidad'
                    value={row.cantidad}
                    onChange={e => handleCantidadChange(index, Number(e.target.value))}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Precio Unitario UF'
                    value={row.precioUnitarioUF}
                    onChange={e => handlePrecioChange(index, Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>UF</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton onClick={() => handleDeleteRow(index)} color='error'>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Button
              variant='outlined'
              onClick={() => {
                setProductRows([
                  ...productRows,
                  {
                    id: Date.now(),
                    productoId: '0',
                    cantidad: 1,
                    precioUnitarioUF: 0,
                    totalNetoUF: 0,
                    area: '',
                    descripcion: '',
                    subproductos: []
                  }
                ])
              }}
              startIcon={<i className='ri-add-line' />}
            >
              Agregar Producto
            </Button>
          </Grid>

          {/* Popover de selección de productos */}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClosePopover}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left'
            }}
            PaperProps={{
              sx: { width: '500px', maxHeight: '400px' }
            }}
          >
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size='small'
                placeholder='Buscar por nombre, código o descripción...'
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value)
                  filterProducts(e.target.value, selectedArea, selectedTipo, selectedFamilia)
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <FormControl size='small' fullWidth>
                  <InputLabel>Área</InputLabel>
                  <Select
                    value={selectedArea}
                    label='Área'
                    onChange={e => {
                      setSelectedArea(e.target.value)
                      filterProducts(searchTerm, e.target.value, selectedTipo, selectedFamilia)
                    }}
                  >
                    <MenuItem value=''>Todas</MenuItem>
                    {areas.map(area => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size='small' fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={selectedTipo}
                    label='Tipo'
                    onChange={e => {
                      setSelectedTipo(e.target.value)
                      filterProducts(searchTerm, selectedArea, e.target.value, selectedFamilia)
                    }}
                  >
                    <MenuItem value=''>Todos</MenuItem>
                    {tipos.map(tipo => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size='small' fullWidth>
                  <InputLabel>Familia</InputLabel>
                  <Select
                    value={selectedFamilia}
                    label='Familia'
                    onChange={e => {
                      setSelectedFamilia(e.target.value)
                      filterProducts(searchTerm, selectedArea, selectedTipo, e.target.value)
                    }}
                  >
                    <MenuItem value=''>Todas</MenuItem>
                    {familias.map(familia => (
                      <MenuItem key={familia} value={familia}>
                        {familia}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyPaquetes}
                    onChange={e => {
                      setShowOnlyPaquetes(e.target.checked)
                      filterProducts(searchTerm, selectedArea, selectedTipo, selectedFamilia)
                    }}
                    size='small'
                  />
                }
                label='Solo Paquetes'
              />
            </Box>

            <List>
              {filteredProductos.map(producto => (
                <ListItem
                  key={producto.id}
                  onClick={() => handleSelectProduct(producto)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>
                          {producto.nombre}
                          {producto.norma && (
                            <Typography component='span' color='text.secondary'>
                              {' '}
                              - {producto.norma}
                            </Typography>
                          )}
                        </Typography>
                        {producto.esPaquete && <Chip size='small' label='Paquete' color='primary' sx={{ ml: 1 }} />}
                      </Box>
                    }
                    secondary={
                      <Typography variant='caption' color='text.secondary'>
                        {producto.area} - {producto.tipo} - {producto.familia}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Popover>

          {/* Observaciones */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Observaciones
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={formData.observaciones || ''}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder='Ingrese aquí cualquier observación o nota adicional para la cotización...'
            />
          </Grid>

          {/* Botones de acción */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant='outlined' color='secondary' onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button variant='contained' onClick={handleSave}>
                Guardar Cambios
              </Button>
              <Button variant='outlined' onClick={handlePreview}>
                Vista Previa
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default EditCard
