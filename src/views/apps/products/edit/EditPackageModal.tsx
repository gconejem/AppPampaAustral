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
  const [cantidad, setCantidad] = useState(1)
  const [precio, setPrecio] = useState<number>(0)

  // Eliminar precio, lista de precios y aplicar impuesto
  const [cantidades, setCantidades] = useState<{ [key: number]: number }>({})

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

  // Estados para áreas y familias
  const [areaOptions, setAreaOptions] = useState<any[]>([])
  const [familiaOptions, setFamiliaOptions] = useState<any[]>([])

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (open && paquete) {
      // Cargar datos básicos del paquete
      setNombre(paquete.nombre)
      setSku(paquete.sku)
      setNorma(paquete.norma || '')
      setDescripcion(paquete.descripcion || '')
      setCantidad(paquete.productosEnPaquete.length > 0 ? paquete.productosEnPaquete[0].cantidad : 1)
      setPrecio(paquete.precio || 0)

      // Cargar cantidades si existen
      if (Array.isArray(paquete.productosEnPaquete)) {
        const cantidadesIniciales: { [key: number]: number } = {}

        paquete.productosEnPaquete.forEach((p: any) => {
          cantidadesIniciales[p.productoId] = p.cantidad || 1
        })
        setCantidades(cantidadesIniciales)
      }

      // Cargar productos y listas de precios
      fetchProductos()
      fetchListasPrecios()
      fetchAreas()
      fetchFamilias()

      console.log('paquete:', paquete)

      setProductosSeleccionados(paquete.productosEnPaquete)

      // Cargar los productos del paquete
      //fetchProductosDelPaquete()
    }
  }, [open, paquete])

  // Primer useEffect: setear solo el área
  useEffect(() => {
    if (open && paquete && areaOptions.length > 0) {
      const areaObj = areaOptions.find(opt => opt.nombre === paquete.area || opt.id === paquete.area)

      setArea(areaObj ? areaObj.id : '')
    }
  }, [open, paquete, areaOptions])

  // Segundo useEffect: setear la familia cuando el área y las familias estén listas
  useEffect(() => {
    if (open && paquete && area && familiaOptions.length > 0) {
      const familiaId = paquete.familia?.id ?? paquete.familia
      let familiaObj

      if (typeof familiaId === 'number') {
        familiaObj = familiaOptions.find(opt => opt.id === familiaId && String(opt.area?.id) === String(area))
      } else if (typeof familiaId === 'string') {
        familiaObj = familiaOptions.find(opt => opt.nombre === familiaId && String(opt.area?.id) === String(area))
      }

      setFamilia(familiaObj ? familiaObj.id : '')
    }
  }, [open, paquete, area, familiaOptions])

  // Cuando cambia el área, limpiar la familia si ya no corresponde
  useEffect(() => {
    if (familia && area && familiaOptions.length > 0) {
      const familiaObj = familiaOptions.find(f => f.id === familia)

      if (familiaObj && String(familiaObj.area?.id) !== String(area)) {
        setFamilia('')
      }
    }
  }, [area, familia, familiaOptions])

  // Log para depuración de familias y área seleccionada
  useEffect(() => {
    console.log('familiaOptions:', familiaOptions)

    if (familiaOptions.length > 0) {
      console.log('Primer objeto de familiaOptions:', familiaOptions[0])
      console.log('Claves del primer objeto:', Object.keys(familiaOptions[0]))
    }

    console.log('area seleccionada:', area)
    const familiasFiltradas = familiaOptions.filter(option => String(option.areaId) === String(area))

    console.log('familias filtradas:', familiasFiltradas)
  }, [area, familiaOptions])

  const fetchProductos = async () => {
    try {
      // Usar el endpoint de búsqueda que no tiene paginación por defecto
      const response = await fetch('/api/productos/search?esPaquete=false')
      const data = await response.json()

      setProductos(Array.isArray(data) ? data : [])
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

  const fetchAreas = async () => {
    try {
      const response = await fetch('/api/areas')
      const data = await response.json()

      setAreaOptions(data)
    } catch (error) {
      console.error('Error al cargar áreas:', error)
      toast.error('Error al cargar las áreas')
    }
  }

  const fetchFamilias = async () => {
    try {
      const response = await fetch('/api/familias')
      const data = await response.json()

      setFamiliaOptions(data)
    } catch (error) {
      console.error('Error al cargar familias:', error)
      toast.error('Error al cargar las familias')
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
          area: areaOptions.find(opt => opt.id === area)?.nombre,
          familia: familiaOptions.find(opt => opt.id === familia)?.nombre,
          cantidad,
          precio,
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
          <Grid item xs={4}>
            <TextField label='Nombre' value={nombre} onChange={e => setNombre(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={4}>
            <TextField label='SKU' value={sku} onChange={e => setSku(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label='Cantidad'
              type='number'
              value={cantidad}
              onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
              fullWidth
              inputProps={{ min: 1 }}
            />
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
                  <MenuItem key={option.id} value={option.id}>
                    {option.nombre}
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
                {familiaOptions
                  .filter(option => String(option.area?.id) === String(area))
                  .map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.nombre}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
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
                      .filter(p =>
                        p.nombre.toLowerCase().includes(buscarProducto.toLowerCase()) ||
                        p.sku.toLowerCase().includes(buscarProducto.toLowerCase())
                      )
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
                          <ListItemText
                            primary={producto.sku}
                            secondary={`${producto.nombre} - ${producto.norma || 'Sin norma'}`}
                          />
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
                    .filter(p =>
                      p.nombre.toLowerCase().includes(buscarSeleccionados.toLowerCase()) ||
                      p.sku.toLowerCase().includes(buscarSeleccionados.toLowerCase())
                    )
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
                        <ListItemText
                          primary={producto.sku}
                          secondary={`${producto.nombre} - ${producto.norma || 'Sin norma'}`}
                        />
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
