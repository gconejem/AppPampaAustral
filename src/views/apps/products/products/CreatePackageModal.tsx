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
  FormHelperText,
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
  precio?: number
  cantidad?: number
  area?: string
  familia?: string
  tipo?: string
  estado?: string
  esPaquete?: boolean
  norma?: string
  listaPrecios?: Array<{
    listaPrecio: {
      id: number
      nombre: string
    }
    precio: number
    activo: boolean
  }>
}

const CreatePackageModal: React.FC<CreatePackageModalProps> = ({ open, handleClose }) => {
  // Estados para el formulario
  const [nombre, setNombre] = useState('')
  const [sku, setSku] = useState('')
  const [descripcionPaquete, setDescripcionPaquete] = useState('')
  const [norma, setNorma] = useState('')
  const [area, setArea] = useState('')
  const [familia, setFamilia] = useState('')
  const [precio, setPrecio] = useState<string>('')
  const [aplicaImpuesto, setAplicaImpuesto] = useState(false)
  const [selectedListaPrecio, setSelectedListaPrecio] = useState<string>('')

  // Opciones predefinidas para área y familia
  const areaOptions = ['Suelos', 'Asfaltos', 'Hormigones', 'Áridos', 'Química', 'Otros']
  const familiaOptions = ['Clasificación', 'Compactación', 'Densidad', 'Granulometria', 'Límites', 'Resistencia']

  // Estados para búsqueda
  const [buscarPaquete, setBuscarPaquete] = useState('')
  const [buscarProductos, setBuscarProductos] = useState('')

  // Estados para productos
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<Producto[]>([])
  const [listaPreciosOptions, setListaPreciosOptions] = useState([])

  // Estados para manejar las selecciones
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedPaquetes, setSelectedPaquetes] = useState<number[]>([])

  // Estados para paginación
  const [productsPage, setProductsPage] = useState(0)
  const [packagePage, setPackagePage] = useState(0)
  const itemsPerPage = 10

  // Cargar productos y listas de precios cuando se abre el modal
  useEffect(() => {
    if (open) {
      // Cargar productos
      fetch('/api/productos?esPaquete=false')
        .then(res => res.json())
        .then(data => {
          console.log('Productos cargados:', data)
          setProductos(data.productos || [])
        })
        .catch(error => {
          console.error('Error al cargar productos:', error)
          toast.error('Error al cargar los productos')
        })

      // Cargar listas de precios
      fetch('/api/lista-precios')
        .then(res => res.json())
        .then(data => {
          console.log('Listas de precios cargadas:', data)
          setListaPreciosOptions(data)
        })
        .catch(error => {
          console.error('Error al cargar listas de precios:', error)
          toast.error('Error al cargar las listas de precios')
        })
    }
  }, [open])

  // Filtrar productos basado en la búsqueda y paginación
  const productosFiltrados = productos.filter(
    producto => producto && producto.nombre && producto.nombre.toLowerCase().includes(buscarProductos.toLowerCase())
  )

  const paginatedProducts = productosFiltrados.slice(productsPage * itemsPerPage, (productsPage + 1) * itemsPerPage)

  const totalProductPages = Math.ceil(productosFiltrados.length / itemsPerPage)

  // Filtrar productos seleccionados basado en la búsqueda y paginación
  const productosSeleccionadosFiltrados = productosSeleccionados.filter(
    producto => producto && producto.nombre && producto.nombre.toLowerCase().includes(buscarPaquete.toLowerCase())
  )

  const paginatedPackageProducts = productosSeleccionadosFiltrados.slice(
    packagePage * itemsPerPage,
    (packagePage + 1) * itemsPerPage
  )

  const totalPackagePages = Math.ceil(productosSeleccionadosFiltrados.length / itemsPerPage)

  const handleCreatePackage = async () => {
    try {
      // Validaciones básicas
      if (!nombre || !sku) {
        toast.error('Por favor complete los campos nombre y SKU')

        return
      }

      // Validar precio
      if (!precio || precio === '0') {
        toast.error('Por favor ingrese un precio válido')

        return
      }

      // Validar lista de precios
      if (!selectedListaPrecio) {
        toast.error('Por favor seleccione una lista de precios')

        return
      }

      // Validar que haya productos seleccionados
      if (productosSeleccionados.length === 0) {
        toast.error('Por favor seleccione al menos un producto para el paquete')

        return
      }

      // Convertir valores a números
      const precioNumerico = Number(precio)
      const listaPrecioId = parseInt(selectedListaPrecio)

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
        precio: precioNumerico,
        listaPrecio: listaPrecioId,
        productos: productosSeleccionados.map(producto => ({
          productoId: producto.productoId,
          cantidad: 1,
          descripcion: `Producto incluido en paquete ${nombre}`
        }))
      }

      // Log para debug
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

        {/* Nueva fila para área y familia */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <FormControl fullWidth size='small'>
              <InputLabel>Área</InputLabel>
              <Select value={area} label='Área' onChange={e => setArea(e.target.value)}>
                <MenuItem value=''>
                  <em>Ninguna</em>
                </MenuItem>
                {areaOptions.map(areaOption => (
                  <MenuItem key={areaOption} value={areaOption}>
                    {areaOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size='small'>
              <InputLabel>Familia</InputLabel>
              <Select value={familia} label='Familia' onChange={e => setFamilia(e.target.value)}>
                <MenuItem value=''>
                  <em>Ninguna</em>
                </MenuItem>
                {familiaOptions.map(familiaOption => (
                  <MenuItem key={familiaOption} value={familiaOption}>
                    {familiaOption}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

        {/* Segunda fila - Precios */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label='Precio'
              value={precio}
              onChange={e => {
                const value = e.target.value

                if (!isNaN(Number(value))) {
                  setPrecio(value)
                  console.log('Precio actualizado:', value) // Debug
                }
              }}
              type='number'
              size='small'
              required
              error={!precio}
              helperText={!precio ? 'El precio es requerido' : ''}
              InputProps={{
                startAdornment: <InputAdornment position='start'>$</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size='small' required error={!selectedListaPrecio}>
              <InputLabel>Lista de Precios</InputLabel>
              <Select
                value={selectedListaPrecio}
                label='Lista de Precios'
                onChange={e => setSelectedListaPrecio(e.target.value)}
              >
                <MenuItem value=''>Seleccione una lista</MenuItem>
                {listaPreciosOptions.map((lista: any) => (
                  <MenuItem key={lista.id} value={lista.id.toString()}>
                    {lista.nombre}
                  </MenuItem>
                ))}
              </Select>
              {!selectedListaPrecio && <FormHelperText>La lista de precios es requerida</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center' }}>
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
                <Typography variant='subtitle2'>PRODUCTOS ({productosFiltrados.length})</Typography>
              </Box>
              <List sx={{ height: 250, overflow: 'auto' }}>
                {paginatedProducts.map(producto => (
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
                    <ListItemText primary={producto.sku} secondary={producto.nombre} />
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
                  const productsToMove = productos.filter(p => selectedProducts.includes(p.productoId))

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
                <Typography variant='subtitle2'>PAQUETE ({productosSeleccionadosFiltrados.length})</Typography>
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
                    <ListItemText primary={producto.sku} secondary={producto.nombre} />
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
