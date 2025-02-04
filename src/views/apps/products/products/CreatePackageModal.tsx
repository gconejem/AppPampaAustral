import React, { useState, useEffect } from 'react'

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import SearchIcon from '@mui/icons-material/Search'
import { CircularProgress } from '@mui/material'
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
  ListItemIcon,
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

const listContainerStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  bgcolor: '#fff',
  height: 300,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column' as const
}

const listHeaderStyle = {
  bgcolor: '#fafafa',
  p: 1.5,
  borderBottom: '1px solid #e0e0e0'
}

const listStyle = {
  flex: 1,
  overflow: 'auto',
  p: 0
}

interface CreatePackageModalProps {
  open: boolean
  handleClose: () => void
}

interface ListaPrecio {
  id: number
  nombre: string
}

interface Producto {
  productoId: number
  sku: string
  nombre: string
  precio?: number
  cantidad?: number
  area: string
  familia: string
}

const CreatePackageModal: React.FC<CreatePackageModalProps> = ({ open, handleClose }) => {
  // Estados para el formulario
  const [nombre, setNombre] = useState('')
  const [sku, setSku] = useState('')
  const [tipo, setTipo] = useState('Ensayo')
  const [norma, setNorma] = useState('')
  const [precio, setPrecio] = useState<string>('')
  const [aplicaImpuesto, setAplicaImpuesto] = useState(false)
  const [selectedListaPrecio, setSelectedListaPrecio] = useState<string>('')

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

  // Cargar productos y listas de precios cuando se abre el modal
  useEffect(() => {
    if (open) {
      // Cargar productos
      fetch('/api/productos?esPaquete=false')
        .then(res => res.json())
        .then(data => {
          console.log('Productos cargados:', data)
          setProductos(data)
        })

      // Cargar listas de precios
      fetch('/api/lista-precios')
        .then(res => res.json())
        .then(data => {
          console.log('Listas de precios cargadas:', data)
          setListaPreciosOptions(data)
        })
    }
  }, [open])

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

      // Convertir valores a números
      const precioNumerico = Number(precio)
      const listaPrecioId = parseInt(selectedListaPrecio)

      // Crear el objeto con los datos
      const packageData = {
        sku: sku,
        nombre: nombre,
        tipo: 'Ensayo',
        esPaquete: false,
        norma: norma || '',
        aplicaImpuesto: aplicaImpuesto,
        precio: precioNumerico,
        listaPrecio: listaPrecioId
      }

      // Log para debug
      console.log('Precio antes de enviar:', precioNumerico, typeof precioNumerico)
      console.log('Datos completos a enviar:', packageData)

      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packageData)
      })

      const data = await response.json()
      console.log('Respuesta del servidor:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el producto')
      }

      toast.success('Producto creado exitosamente')
      handleClose()
      window.location.reload()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message)
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

        {/* Segunda fila - Precios */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label='Precio'
              value={precio}
              onChange={(e) => {
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
                onChange={(e) => setSelectedListaPrecio(e.target.value)}
              >
                <MenuItem value=''>Seleccione una lista</MenuItem>
                {listaPreciosOptions.map((lista: any) => (
                  <MenuItem key={lista.id} value={lista.id.toString()}>
                    {lista.nombre}
                  </MenuItem>
                ))}
              </Select>
              {!selectedListaPrecio && (
                <FormHelperText>La lista de precios es requerida</FormHelperText>
              )}
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
        </Grid>

        {/* Cuarta fila - Listas de productos */}
        <Grid container spacing={3}>
          <Grid item xs={5}>
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant='subtitle2'>PRODUCTOS ({productos.length})</Typography>
              </Box>
              <List sx={{ height: 300, overflow: 'auto' }}>
                {productos
                  .filter(p => p.nombre.toLowerCase().includes(buscarProductos.toLowerCase()))
                  .map(producto => (
                    <ListItem
                      key={producto.productoId}
                      dense
                      button
                      onClick={() => {
                        // Solo marcar/desmarcar el checkbox
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
            </Box>
          </Grid>

          <Grid item xs={2} container alignItems='center' justifyContent='center'>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant='contained'
                size='small'
                onClick={() => {
                  // Mover productos seleccionados a la derecha
                  const productsToMove = productos.filter(p => selectedProducts.includes(p.productoId))

                  setProductosSeleccionados(prev => [...prev, ...productsToMove])
                  setSelectedProducts([]) // Limpiar selección
                }}
                disabled={selectedProducts.length === 0}
              >
                <ArrowForwardIcon />
              </Button>
              <Button
                variant='contained'
                size='small'
                onClick={() => {
                  // Mover productos seleccionados a la izquierda
                  setProductosSeleccionados(prev => prev.filter(p => !selectedPaquetes.includes(p.productoId)))
                  setSelectedPaquetes([]) // Limpiar selección
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
                <Typography variant='subtitle2'>PAQUETE ({productosSeleccionados.length})</Typography>
              </Box>
              <List sx={{ height: 300, overflow: 'auto' }}>
                {productosSeleccionados
                  .filter(p => p.nombre.toLowerCase().includes(buscarPaquete.toLowerCase()))
                  .map(producto => (
                    <ListItem
                      key={producto.productoId}
                      dense
                      button
                      onClick={() => {
                        // Solo marcar/desmarcar el checkbox
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
