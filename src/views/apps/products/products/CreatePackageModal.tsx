import React, { useState, useEffect } from 'react'

// MUI Imports
import SearchIcon from '@mui/icons-material/Search'
import { toast } from 'react-hot-toast'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

// MUI Imports
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  List,
  ListItem,
  ListItemText
} from '@mui/material'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 900,
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4
}

interface CreatePackageModalProps {
  open: boolean
  handleClose: () => void
}

interface Producto {
  productoId: number
  sku: string
  nombre: string
  cantidad?: number
  area?: string
  familia?: string
  tipo?: string
  estado?: string
  esPaquete?: boolean
  norma?: string
}

const CreatePackageModal: React.FC<CreatePackageModalProps> = ({ open, handleClose }) => {
  // Estados para el formulario
  const [nombre, setNombre] = useState('')
  const [sku, setSku] = useState('')
  const [descripcionPaquete, setDescripcionPaquete] = useState('')
  const [norma, setNorma] = useState('')
  const [area, setArea] = useState('')
  const [aplicaImpuesto, setAplicaImpuesto] = useState(false)
  const [familia, setFamilia] = useState('')

  // Estado para las áreas y familias
  const [areas, setAreas] = useState<string[]>([])
  const [familias, setFamilias] = useState<string[]>([])

  // Estados para búsqueda
  const [buscarPaquete, setBuscarPaquete] = useState('')
  const [buscarProductos, setBuscarProductos] = useState('')

  // Estados para productos y paginación real
  const [productos, setProductos] = useState<Producto[]>([])
  const [totalProductos, setTotalProductos] = useState(0)
  const [productosSeleccionados, setProductosSeleccionados] = useState<Producto[]>([])

  // Estados para manejar las selecciones
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedPaquetes, setSelectedPaquetes] = useState<number[]>([])

  // Estado para cantidades
  const [cantidades, setCantidades] = useState<{ [key: number]: number }>({})

  // Estados para paginación
  const [productsPage, setProductsPage] = useState(0)
  const [packagePage, setPackagePage] = useState(0)
  const ITEMS_PER_PAGE = 10

  // Calcular el total de páginas de productos (debe estar antes de su uso)
  const totalProductPages = Math.ceil(totalProductos / ITEMS_PER_PAGE)

  // Cargar áreas y familias cuando se abre el modal
  useEffect(() => {
    if (open) {
      // Cargar áreas
      fetch('/api/areas')
        .then(res => res.json())
        .then(data => {
          console.log('Áreas recibidas:', data)
          setAreas(data)
        })
        .catch(error => {
          console.error('Error al cargar áreas:', error)
          toast.error('Error al cargar las áreas')
        })

      // Cargar familias
      fetch('/api/familias')
        .then(res => res.json())
        .then(data => {
          console.log('Familias recibidas:', data)
          setFamilias(data)
        })
        .catch(error => {
          console.error('Error al cargar familias:', error)
          toast.error('Error al cargar las familias')
        })
    }
  }, [open])

  // Cargar productos y listas de precios cuando se abre el modal o cambia la página/búsqueda/área
  useEffect(() => {
    if (open) {
      const params = new URLSearchParams()

      params.append('esPaquete', 'false')
      params.append('page', (productsPage + 1).toString())
      params.append('limit', ITEMS_PER_PAGE.toString())
      if (buscarProductos) params.append('search', buscarProductos)
      if (area) params.append('area', area)

      fetch(`/api/productos?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          setProductos(data.productos || [])
          setTotalProductos(Number.isFinite(data.total) ? Number(data.total) : 0)
        })
        .catch(error => {
          console.error('Error al cargar productos:', error)
          toast.error('Error al cargar los productos')
        })
    }
  }, [open, productsPage, buscarProductos, area])

  // Filtrar productos seleccionados basado en la búsqueda y paginación
  const productosSeleccionadosFiltrados = productosSeleccionados.filter(
    producto => producto && producto.nombre && producto.nombre.toLowerCase().includes(buscarPaquete.toLowerCase())
  )

  const startIndexPackage = packagePage * ITEMS_PER_PAGE

  const paginatedPackageProducts = productosSeleccionadosFiltrados.slice(
    startIndexPackage,
    startIndexPackage + ITEMS_PER_PAGE
  )

  const totalPackagePages = Math.ceil(productosSeleccionadosFiltrados.length / ITEMS_PER_PAGE)

  const handleCreatePackage = async () => {
    try {
      // Validaciones básicas
      if (!nombre || !sku) {
        toast.error('Por favor complete los campos nombre y SKU')
        return
      }

      // Validar que haya productos seleccionados
      if (productosSeleccionados.length === 0) {
        toast.error('Por favor seleccione al menos un producto para el paquete')
        return
      }

      // Crear el objeto con los datos
      const packageData = {
        sku: sku,
        nombre: nombre,
        descripcion: descripcionPaquete,
        tipo: 'Paquete',
        esPaquete: true,
        area: area || '',
        familia: familia || '',
        norma: norma || '',
        aplicaImpuesto: aplicaImpuesto,
        cantidad: 1, // Agregamos la cantidad por defecto
        productos: productosSeleccionados.map(producto => ({
          productoId: producto.productoId,
          cantidad: cantidades[producto.productoId] || 1,
          descripcion: `Producto incluido en paquete ${nombre}`
        }))
      }

      console.log('Datos del paquete a enviar:', packageData)

      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packageData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el paquete')
      }

      toast.success('Paquete creado exitosamente')
      handleClose()
      window.location.reload()
    } catch (error: unknown) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant='h6' gutterBottom>
          Crear Paquete
        </Typography>

        {/* Primera fila - Datos básicos */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={4}>
            <TextField fullWidth label='Nombre' value={nombre} onChange={e => setNombre(e.target.value)} size='small' />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label='SKU' value={sku} onChange={e => setSku(e.target.value)} size='small' />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label='Norma' value={norma} onChange={e => setNorma(e.target.value)} size='small' />
          </Grid>
        </Grid>

        {/* Nueva fila para área y cantidad */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Área</InputLabel>
              <Select
                value={area}
                label='Área'
                onChange={e => {
                  console.log('Área seleccionada:', e.target.value)
                  setArea(e.target.value)
                  setProductsPage(0) // Resetear la página al cambiar el filtro
                }}
              >
                <MenuItem value=''>
                  <em>Ninguna</em>
                </MenuItem>
                {areas && areas.length > 0 ? (
                  areas.map((areaOption, index) => (
                    <MenuItem key={index} value={areaOption}>
                      {areaOption}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No hay áreas disponibles</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Familia</InputLabel>
              <Select value={familia} label='Familia' onChange={e => setFamilia(e.target.value)}>
                <MenuItem value=''>
                  <em>Ninguna</em>
                </MenuItem>
                {familias && familias.length > 0 ? (
                  familias.map((familiaOption, index) => (
                    <MenuItem key={index} value={familiaOption}>
                      {familiaOption}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No hay familias disponibles</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={4}>
            <TextField
              fullWidth
              label='Cantidad'
              type='number'
              size='small'
              defaultValue={1}
              onChange={e => {
                const value = parseInt(e.target.value) || 1
                const selectedIds = productosSeleccionados.map(p => p.productoId)
                const newCantidades = { ...cantidades }

                selectedIds.forEach(id => {
                  newCantidades[id] = value
                })

                setCantidades(newCantidades)
              }}
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
          </Grid>
        </Grid>

        {/* Fila para descripción del paquete */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Descripción del Paquete'
              value={descripcionPaquete}
              onChange={e => setDescripcionPaquete(e.target.value)}
              size='small'
              multiline
              rows={3}
              placeholder='Describa el contenido y características del paquete'
            />
          </Grid>
        </Grid>

        {/* Fila para el checkbox de impuesto */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox checked={aplicaImpuesto} onChange={e => setAplicaImpuesto(e.target.checked)} size='small' />
              }
              label='Aplicar Impuesto'
            />
          </Grid>
        </Grid>

        {/* Tercera fila - Búsqueda */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              placeholder='Buscar en Productos'
              value={buscarProductos}
              onChange={e => setBuscarProductos(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size='small'
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              placeholder='Buscar en Paquete'
              value={buscarPaquete}
              onChange={e => setBuscarPaquete(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size='small'
            />
          </Grid>
        </Grid>

        {/* Cuarta fila - Listas de productos */}
        <Grid container spacing={3}>
          <Grid item xs={5}>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant='subtitle2'>
                  PRODUCTOS ({totalProductos}) - Página {productsPage + 1} de {totalProductPages}
                </Typography>
              </Box>
              <List sx={{ height: 250, overflow: 'auto' }}>
                {productos.map(producto => (
                  <ListItem
                    key={producto.productoId}
                    dense
                    button
                    onClick={() => {
                      if (selectedProducts.includes(producto.productoId)) {
                        setSelectedProducts(prev => prev.filter(id => id !== producto.productoId))
                      } else {
                        setSelectedProducts(prev => [...prev, producto.productoId])
                      }
                    }}
                  >
                    <ListItemText 
                      primary={producto.sku}
                      secondary={
                        <Typography variant="body2" component="span">
                          {`${producto.area || 'Sin área'} - ${producto.nombre} - ${producto.norma || 'Sin norma'}`}
                        </Typography>
                      }
                    />
                    <Checkbox edge='end' checked={selectedProducts.includes(producto.productoId)} size='small' />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button
                  size='small'
                  onClick={() => setProductsPage(prev => Math.max(0, prev - 1))}
                  disabled={productsPage === 0}
                >
                  Anterior
                </Button>
                <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                  Página {productsPage + 1} de {totalProductPages || 1}
                </Typography>
                <Button
                  size='small'
                  onClick={() => setProductsPage(prev => Math.min(totalProductPages - 1, prev + 1))}
                  disabled={productsPage >= totalProductPages - 1}
                >
                  Siguiente
                </Button>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={2} container alignItems='center' justifyContent='center'>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant='contained'
                size='small'
                onClick={() => {
                  const productsToMove = productos
                    .filter(p => selectedProducts.includes(p.productoId))

                    // Filtrar productos que ya están en el paquete
                    .filter(p => !productosSeleccionados.some(ps => ps.productoId === p.productoId))

                  if (productsToMove.length === 0) {
                    toast.error('Los productos seleccionados ya están en el paquete')

                    return
                  }

                  setProductosSeleccionados(prev => [...prev, ...productsToMove])
                  setSelectedProducts([])
                }}
                disabled={selectedProducts.length === 0}
              >
                <ArrowForwardIcon />
              </Button>
              <Button
                variant='contained'
                size='small'
                onClick={() => {
                  setProductosSeleccionados(prev => prev.filter(p => !selectedPaquetes.includes(p.productoId)))
                  setSelectedPaquetes([])
                }}
                disabled={selectedPaquetes.length === 0}
              >
                <ArrowBackIcon />
              </Button>
            </Box>
          </Grid>

          <Grid item xs={5}>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant='subtitle2'>
                  PAQUETE ({productosSeleccionadosFiltrados.length}) - Página {packagePage + 1} de {totalPackagePages}
                </Typography>
              </Box>
              <List sx={{ height: 250, overflow: 'auto' }}>
                {paginatedPackageProducts.map(producto => (
                  <ListItem
                    key={producto.productoId}
                    dense
                    button
                    onClick={() => {
                      if (selectedPaquetes.includes(producto.productoId)) {
                        setSelectedPaquetes(prev => prev.filter(id => id !== producto.productoId))
                      } else {
                        setSelectedPaquetes(prev => [...prev, producto.productoId])
                      }
                    }}
                  >
                    <ListItemText 
                      primary={producto.sku}
                      secondary={
                        <Typography variant="body2" component="span">
                          {`${producto.area || 'Sin área'} - ${producto.nombre} - ${producto.norma || 'Sin norma'}`}
                        </Typography>
                      }
                    />
                    <Checkbox edge='end' checked={selectedPaquetes.includes(producto.productoId)} size='small' />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button
                  size='small'
                  onClick={() => setPackagePage(prev => Math.max(0, prev - 1))}
                  disabled={packagePage === 0}
                >
                  Anterior
                </Button>
                <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                  Página {packagePage + 1} de {totalPackagePages || 1}
                </Typography>
                <Button
                  size='small'
                  onClick={() => setPackagePage(prev => Math.min(totalPackagePages - 1, prev + 1))}
                  disabled={packagePage >= totalPackagePages - 1}
                >
                  Siguiente
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button variant='outlined' onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={handleCreatePackage}
            disabled={!nombre || !sku || productosSeleccionados.length === 0}
          >
            Agregar Paquete
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default CreatePackageModal
