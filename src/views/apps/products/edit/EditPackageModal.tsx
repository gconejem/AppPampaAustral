'use client'

// React Imports
import { useState, useEffect } from 'react'

import { toast } from 'react-hot-toast'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 1000,
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4
}

interface EditPackageModalProps {
  open: boolean
  onClose: () => void
  paquete: any
  onSave: (updatedPackage: any) => void
}

const EditPackageModal = ({ open, onClose, paquete, onSave }: EditPackageModalProps) => {
  // Estados para el formulario
  const [nombre, setNombre] = useState('')
  const [sku, setSku] = useState('')
  const [norma, setNorma] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [area, setArea] = useState('')
  const [familia, setFamilia] = useState('')
  const [listaPrecios, setListaPrecios] = useState('')
  const [precio, setPrecio] = useState('')
  const [aplicaImpuesto, setAplicaImpuesto] = useState(false)

  // Estados para productos
  const [productos, setProductos] = useState<any[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<any[]>([])
  const [listaPreciosOptions, setListaPreciosOptions] = useState([])

  // Estados para búsqueda
  const [buscarProducto, setBuscarProducto] = useState('')
  const [buscarSeleccionados, setBuscarSeleccionados] = useState('')

  // Estados para selección
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedInPackage, setSelectedInPackage] = useState<number[]>([])

  // Opciones predefinidas
  const areaOptions = ['Suelos', 'Asfaltos', 'Hormigones', 'Áridos', 'Química', 'Otros']
  const familiaOptions = ['Clasificación', 'Compactación', 'Densidad', 'Granulometría', 'Límites', 'Resistencia']

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (open && paquete) {
      // Cargar datos básicos del paquete
      setNombre(paquete.nombre)
      setSku(paquete.sku)
      setNorma(paquete.norma || '')
      setDescripcion(paquete.descripcion || '')
      setArea(paquete.area || '')
      setFamilia(paquete.familia || '')
      setPrecio(paquete.precio?.toString() || '')
      setAplicaImpuesto(paquete.aplicaImpuesto)

      if (paquete.listasPrecios?.[0]) {
        setListaPrecios(paquete.listasPrecios[0].listaPrecio.id.toString())
      }

      // Cargar productos y listas de precios
      fetchProductos()
      fetchListasPrecios()

      // Cargar los productos del paquete
      fetchProductosDelPaquete()
    }
  }, [open, paquete])

  const fetchProductos = async () => {
    try {
      const response = await fetch('/api/productos?esPaquete=false')
      const data = await response.json()

      setProductos(Array.isArray(data.productos) ? data.productos : [])
    } catch (error) {
      console.error('Error al cargar productos:', error)
      setProductos([])
    }
  }

  const fetchListasPrecios = async () => {
    try {
      const response = await fetch('/api/lista-precios')
      const data = await response.json()

      setListaPreciosOptions(data)
    } catch (error) {
      console.error('Error al cargar listas de precios:', error)
    }
  }

  const fetchProductosDelPaquete = async () => {
    try {
      const response = await fetch(`/api/productos/${paquete.productoId}/productos`)
      const data = await response.json()

      if (data.productos) {
        setProductosSeleccionados(data.productos)
      }
    } catch (error) {
      console.error('Error al cargar productos del paquete:', error)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/productos/${paquete.productoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre,
          sku,
          norma,
          descripcion,
          area,
          familia,
          precio: precio ? parseFloat(precio) : null,
          aplicaImpuesto,
          listaPrecioId: listaPrecios ? parseInt(listaPrecios) : undefined,
          productosEnPaquete: productosSeleccionados.map(p => ({ productoId: p.productoId }))
        })
      })

      if (!response.ok) throw new Error('Error al actualizar el paquete')

      const updatedPackage = await response.json()

      toast.success('Paquete actualizado correctamente')
      onSave(updatedPackage)
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el paquete')
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant='h6' component='h2' sx={{ mb: 4 }}>
          Editar Paquete
        </Typography>

        <Grid container spacing={4}>
          {/* Primera fila */}
          <Grid item xs={6}>
            <TextField label='Nombre' value={nombre} onChange={e => setNombre(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={6}>
            <TextField label='SKU' value={sku} onChange={e => setSku(e.target.value)} fullWidth />
          </Grid>

          {/* Nueva fila para descripción */}
          <Grid item xs={12}>
            <TextField
              label='Descripción'
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>

          {/* Segunda fila */}
          <Grid item xs={6}>
            <TextField label='Norma' value={norma} onChange={e => setNorma(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Área</InputLabel>
              <Select value={area} label='Área' onChange={e => setArea(e.target.value)}>
                <MenuItem value=''>
                  <em>Ninguna</em>
                </MenuItem>
                {areaOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Tercera fila */}
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Familia</InputLabel>
              <Select value={familia} label='Familia' onChange={e => setFamilia(e.target.value)}>
                <MenuItem value=''>
                  <em>Ninguna</em>
                </MenuItem>
                {familiaOptions.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Lista de Precios</InputLabel>
              <Select value={listaPrecios} label='Lista de Precios' onChange={e => setListaPrecios(e.target.value)}>
                {listaPreciosOptions.map((lista: any) => (
                  <MenuItem key={lista.id} value={lista.id}>
                    {lista.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Tercera fila */}
          <Grid item xs={6}>
            <TextField
              label='Precio'
              value={precio}
              onChange={e => setPrecio(e.target.value)}
              type='number'
              fullWidth
              InputProps={{
                startAdornment: <Typography>$</Typography>
              }}
            />
          </Grid>
          <Grid item xs={6} display='flex' alignItems='center'>
            <Checkbox checked={aplicaImpuesto} onChange={e => setAplicaImpuesto(e.target.checked)} />
            <Typography>Aplica Impuesto</Typography>
          </Grid>

          {/* Sección de productos */}
          <Grid container item spacing={2}>
            {/* Lista de productos disponibles */}
            <Grid item xs={5}>
              <TextField
                fullWidth
                size='small'
                placeholder='Buscar productos'
                value={buscarProducto}
                onChange={e => setBuscarProducto(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <List sx={{ height: 300, overflow: 'auto' }}>
                  {Array.isArray(productos) &&
                    productos
                      .filter(p => !productosSeleccionados.some(ps => ps.productoId === p.productoId))
                      .filter(p => p.nombre.toLowerCase().includes(buscarProducto.toLowerCase()))
                      .map(producto => (
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
                          <Checkbox edge='end' checked={selectedProducts.includes(producto.productoId)} />
                        </ListItem>
                      ))}
                </List>
              </Box>
            </Grid>

            {/* Botones de control */}
            <Grid item xs={2} container alignItems='center' justifyContent='center'>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant='contained'
                  size='small'
                  onClick={() => {
                    const productsToAdd = productos.filter(p => selectedProducts.includes(p.productoId))

                    setProductosSeleccionados(prev => [...prev, ...productsToAdd])
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
                    setProductosSeleccionados(prev => prev.filter(p => !selectedInPackage.includes(p.productoId)))
                    setSelectedInPackage([])
                  }}
                  disabled={selectedInPackage.length === 0}
                >
                  <ArrowBackIcon />
                </Button>
              </Box>
            </Grid>

            {/* Lista de productos en el paquete */}
            <Grid item xs={5}>
              <TextField
                fullWidth
                size='small'
                placeholder='Buscar en paquete'
                value={buscarSeleccionados}
                onChange={e => setBuscarSeleccionados(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <List sx={{ height: 300, overflow: 'auto' }}>
                  {productosSeleccionados
                    .filter(p => p.nombre.toLowerCase().includes(buscarSeleccionados.toLowerCase()))
                    .map(producto => (
                      <ListItem
                        key={producto.productoId}
                        dense
                        button
                        onClick={() => {
                          if (selectedInPackage.includes(producto.productoId)) {
                            setSelectedInPackage(prev => prev.filter(id => id !== producto.productoId))
                          } else {
                            setSelectedInPackage(prev => [...prev, producto.productoId])
                          }
                        }}
                      >
                        <ListItemText primary={producto.sku} secondary={producto.nombre} />
                        <Checkbox edge='end' checked={selectedInPackage.includes(producto.productoId)} />
                      </ListItem>
                    ))}
                </List>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button onClick={onClose} variant='outlined'>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant='contained'>
            Guardar Cambios
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default EditPackageModal
