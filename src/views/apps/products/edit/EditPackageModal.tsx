'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

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

const paginatorHeaderStyle = {
  bgcolor: '#f5f5f5',
  padding: '10px',
  borderRadius: '4px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '10px',
  border: '1px solid #e0e0e0'
}

const paginatorFooterStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px',
  borderTop: '1px solid #e0e0e0',
  marginTop: '8px'
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

  // Estados para paginación
  const [paginaProductos, setPaginaProductos] = useState(1)
  const [paginaSeleccionados, setPaginaSeleccionados] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Nuevos estados para manejo local
  const [todosProductos, setTodosProductos] = useState<any[]>([])
  const [cargandoProductos, setCargandoProductos] = useState(false)

  // Manejar cambio en la búsqueda con delay
  const handleBuscarProductoChange = (valor: string) => {
    // Actualizar el valor del campo de búsqueda inmediatamente
    setBuscarProducto(valor);
    setPaginaProductos(1); // Reiniciar página al buscar
  };

  // Función para filtrar resultados de búsqueda que podría contener SKUs incorrectos
  const filtrarResultadosPorSku = (productos: any[], terminoBusqueda: string) => {
    // Si parece ser un SKU (sólo números sin espacios), aplicar filtrado estricto
    const esNumeroPuro = /^\d+$/.test(terminoBusqueda);

    if (esNumeroPuro) {
      console.log(`Término "${terminoBusqueda}" parece ser un SKU - aplicando filtro estricto`);

      // Filtrar para mostrar solo productos cuyo SKU coincida exactamente o comience con el término
      return productos.filter(producto =>
        producto.sku === terminoBusqueda ||
        producto.sku.startsWith(terminoBusqueda)
      );
    }

    // Si no parece un SKU, devolver todos los resultados
    return productos;
  };

  // Cargar todos los productos disponibles una sola vez
  const cargarTodosProductos = async () => {
    try {
      setCargandoProductos(true);
      console.log('Cargando todos los productos disponibles...');

      const params = new URLSearchParams();
      params.append('esPaquete', 'false');
      params.append('limit', '1000'); // Intentar cargar todos los productos de una vez

      const response = await fetch(`/api/productos?${params.toString()}`);
      const data = await response.json();

      let productosDisponibles = [];

      if (data && data.productos && Array.isArray(data.productos)) {
        productosDisponibles = data.productos;
      } else if (Array.isArray(data)) {
        productosDisponibles = data;
      }

      console.log(`Total de productos cargados: ${productosDisponibles.length}`);

      // Guardar todos los productos disponibles
      setTodosProductos(productosDisponibles);
    } catch (error) {
      console.error('Error al cargar todos los productos:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setCargandoProductos(false);
    }
  };

  // Filtrar productos por área si es necesario
  const productosPorArea = useMemo(() => {
    if (!area || todosProductos.length === 0) return todosProductos;

    const areaNombre = areaOptions.find(a => a.id === area)?.nombre;
    if (!areaNombre) return todosProductos;

    return todosProductos.filter(p => p.area === areaNombre);
  }, [todosProductos, area, areaOptions]);

  // Filtrar productos por búsqueda
  const productosFiltrados = useMemo(() => {
    // Primero filtramos para excluir los productos que ya están seleccionados
    const productosNoSeleccionados = productosPorArea.filter(p =>
      !productosSeleccionados.some(ps => ps.productoId === p.productoId)
    );

    // Si no hay término de búsqueda, devolvemos todos
    if (!buscarProducto) return productosNoSeleccionados;

    // Aplicar búsqueda general
    const termino = buscarProducto.toLowerCase();
    const resultadosBusqueda = productosNoSeleccionados.filter(p =>
      p.nombre.toLowerCase().includes(termino) ||
      p.sku.toLowerCase().includes(termino) ||
      (p.norma && p.norma.toLowerCase().includes(termino))
    );

    // Aplicar filtro adicional para SKUs numéricos
    return filtrarResultadosPorSku(resultadosBusqueda, buscarProducto);
  }, [productosPorArea, productosSeleccionados, buscarProducto]);

  // Calcular productos para la página actual
  const productosPaginados = useMemo(() => {
    const startIndex = (paginaProductos - 1) * ITEMS_PER_PAGE;
    return productosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [productosFiltrados, paginaProductos]);

  // Calcular total de páginas
  const totalPaginasProductos = useMemo(() => {
    return Math.max(1, Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE));
  }, [productosFiltrados]);

  // Cargar datos iniciales cuando se abre el modal
  useEffect(() => {
    if (open && paquete) {
      // Cargar datos básicos del paquete
      setNombre(paquete.nombre)
      setSku(paquete.sku)
      setNorma(paquete.norma || '')
      setDescripcion(paquete.descripcion || '')
      setCantidad(paquete.productosEnPaquete?.length > 0 ? paquete.productosEnPaquete[0].cantidad : 1)
      setPrecio(paquete.precio || 0)

      // Cargar cantidades si existen
      if (Array.isArray(paquete.productosEnPaquete)) {
        const cantidadesIniciales: { [key: number]: number } = {}

        paquete.productosEnPaquete.forEach((p: any) => {
          cantidadesIniciales[p.productoId] = p.cantidad || 1
        })
        setCantidades(cantidadesIniciales)
      }

      // Cargar áreas y familias
      fetchAreas()
      fetchFamilias()

      console.log('paquete:', paquete)

      setProductosSeleccionados(paquete.productosEnPaquete || [])

      // Cargar todos los productos disponibles
      cargarTodosProductos();

      // Resetear paginación
      setPaginaProductos(1)
      setPaginaSeleccionados(1)

      // Limpiar búsquedas
      setBuscarProducto('');
      setBuscarSeleccionados('');
    }
  }, [open, paquete])

  // Primer useEffect: setear solo el área
  useEffect(() => {
    if (open && paquete && areaOptions.length > 0) {
      const areaObj = areaOptions.find(opt => opt.nombre === paquete.area || opt.id === paquete.area)
      if (areaObj) {
        setArea(areaObj.id)
        // Ya se filtran automáticamente por área con useMemo
      } else {
        setArea('')
        // Ya se filtran automáticamente por área con useMemo
      }
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
    if (open) {
      if (familia && area && familiaOptions.length > 0) {
        const familiaObj = familiaOptions.find(f => f.id === familia)
        if (familiaObj && String(familiaObj.area?.id) !== String(area)) {
          setFamilia('')
        }
      }

      // Resetear página al cambiar el área
      setPaginaProductos(1)
    }
  }, [area, familia, familiaOptions, open])

  // Para depuración: Loguear productos cada vez que cambian
  useEffect(() => {
    console.log(`Estado de productos filtrados actualizado: ${productosFiltrados.length} productos`)
  }, [productosFiltrados])

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

  // Filtrar productos seleccionados por búsqueda
  const seleccionadosFiltrados = useMemo(() => {
    if (!buscarSeleccionados) return productosSeleccionados;

    const termino = buscarSeleccionados.toLowerCase();
    return productosSeleccionados.filter(p =>
      p?.nombre?.toLowerCase().includes(termino) ||
      p?.sku?.toLowerCase().includes(termino) ||
      (p?.norma && p?.norma.toLowerCase().includes(termino))
    );
  }, [productosSeleccionados, buscarSeleccionados]);

  // Paginación de productos seleccionados en el cliente
  const startIndexSeleccionados = (paginaSeleccionados - 1) * ITEMS_PER_PAGE;
  const seleccionadosActuales = seleccionadosFiltrados.slice(
    startIndexSeleccionados,
    startIndexSeleccionados + ITEMS_PER_PAGE
  );

  const totalPaginasSeleccionados = Math.max(1, Math.ceil(seleccionadosFiltrados.length / ITEMS_PER_PAGE));

  // Efecto para resetear la página de seleccionados si cambia el total
  useEffect(() => {
    if (paginaSeleccionados > totalPaginasSeleccionados && totalPaginasSeleccionados > 0) {
      setPaginaSeleccionados(totalPaginasSeleccionados)
    }
  }, [totalPaginasSeleccionados, paginaSeleccionados])

  // Navegación de paginación
  const handlePrevPage = (tipo: 'productos' | 'seleccionados') => {
    if (tipo === 'productos' && paginaProductos > 1) {
      const nuevaPagina = paginaProductos - 1;
      console.log(`Cambiando a página anterior de productos: ${nuevaPagina}`);
      setPaginaProductos(nuevaPagina);
    } else if (tipo === 'seleccionados' && paginaSeleccionados > 1) {
      const nuevaPagina = paginaSeleccionados - 1;
      console.log(`Cambiando a página anterior de seleccionados: ${nuevaPagina}`);
      setPaginaSeleccionados(nuevaPagina);
    }
  }

  const handleNextPage = (tipo: 'productos' | 'seleccionados') => {
    if (tipo === 'productos' && paginaProductos < totalPaginasProductos) {
      const nuevaPagina = paginaProductos + 1;
      console.log(`Cambiando a página siguiente de productos: ${nuevaPagina}`);
      setPaginaProductos(nuevaPagina);
    } else if (tipo === 'seleccionados' && paginaSeleccionados < totalPaginasSeleccionados) {
      const nuevaPagina = paginaSeleccionados + 1;
      console.log(`Cambiando a página siguiente de seleccionados: ${nuevaPagina}`);
      setPaginaSeleccionados(nuevaPagina);
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
                onChange={e => handleBuscarProductoChange(e.target.value)}
                sx={{ mb: 2 }}
              />

              {/* Encabezado del paginador de productos */}
              <Box sx={paginatorHeaderStyle}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  PRODUCTOS ({productosFiltrados.length}) - Página {paginaProductos} de {totalPaginasProductos || 1}
                </Typography>
              </Box>

              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                <List sx={{ height: 300, overflow: 'auto' }}>
                  {cargandoProductos ? (
                    <ListItem>
                      <ListItemText primary="Cargando productos..." />
                    </ListItem>
                  ) : productosPaginados.length === 0 ? (
                    <ListItem>
                      <ListItemText primary={buscarProducto
                        ? `No se encontraron productos para "${buscarProducto}"`
                        : "No hay productos disponibles"}
                      />
                    </ListItem>
                  ) : productosPaginados.map(producto => (
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
                        secondary={`${producto.nombre} - ${producto.norma || 'Sin norma'} (${producto.area || 'Sin área'})`}
                      />
                      <Checkbox edge='end' checked={selectedProducts.includes(producto.productoId)} />
                    </ListItem>
                  ))}
                </List>

                {/* Paginador inferior de productos */}
                <Box sx={paginatorFooterStyle}>
                  <Button
                    onClick={() => handlePrevPage('productos')}
                    disabled={paginaProductos <= 1}
                    color="primary"
                    variant="text"
                    sx={{ fontWeight: 'medium' }}
                  >
                    Anterior
                  </Button>
                  <Typography variant="body2">
                    Página {paginaProductos} de {totalPaginasProductos || 1}
                  </Typography>
                  <Button
                    onClick={() => handleNextPage('productos')}
                    disabled={paginaProductos >= totalPaginasProductos}
                    color="primary"
                    variant="text"
                    sx={{ fontWeight: 'medium' }}
                  >
                    Siguiente
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Botones de control */}
            <Grid item xs={2} container alignItems='center' justifyContent='center'>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant='contained'
                  size='small'
                  onClick={() => {
                    const productsToAdd = productosPaginados.filter(p => selectedProducts.includes(p.productoId))

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
                onChange={e => {
                  setBuscarSeleccionados(e.target.value)
                  setPaginaSeleccionados(1) // Resetear página al buscar
                }}
                sx={{ mb: 2 }}
              />

              {/* Encabezado del paginador de productos seleccionados */}
              <Box sx={paginatorHeaderStyle}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  PAQUETE ({seleccionadosFiltrados.length}) - Página {paginaSeleccionados} de {totalPaginasSeleccionados}
                </Typography>
              </Box>

              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                <List sx={{ height: 300, overflow: 'auto' }}>
                  {seleccionadosActuales.map(producto => (
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
                        secondary={`${producto.nombre} - ${producto.norma || 'Sin norma'} (${producto.area || 'Sin área'})`}
                      />
                      <Checkbox edge='end' checked={selectedInPackage.includes(producto.productoId)} />
                    </ListItem>
                  ))}
                  {seleccionadosActuales.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No hay productos en el paquete" />
                    </ListItem>
                  )}
                </List>

                {/* Paginador inferior de productos seleccionados */}
                <Box sx={paginatorFooterStyle}>
                  <Button
                    onClick={() => handlePrevPage('seleccionados')}
                    disabled={paginaSeleccionados <= 1}
                    color="primary"
                    variant="text"
                    sx={{ fontWeight: 'medium' }}
                  >
                    Anterior
                  </Button>
                  <Typography variant="body2">
                    Página {paginaSeleccionados} de {totalPaginasSeleccionados}
                  </Typography>
                  <Button
                    onClick={() => handleNextPage('seleccionados')}
                    disabled={paginaSeleccionados >= totalPaginasSeleccionados}
                    color="primary"
                    variant="text"
                    sx={{ fontWeight: 'medium' }}
                  >
                    Siguiente
                  </Button>
                </Box>
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

