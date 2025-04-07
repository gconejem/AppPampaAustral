'use client'

// React Imports
import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { toast } from 'react-hot-toast'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  Popover,
  InputAdornment,
  CircularProgress
} from '@mui/material'

// Component Imports
import StepperWrapper from '@core/styles/stepper'
import StepperCustomDot from '@components/stepper-dot'

// Interface para productos
interface Producto {
  productoId: number
  sku: string
  nombre: string
  area: string
  familia: string
  precio: number
  tipo?: string
}

interface Servicio {
  codigo: string
  nombre: string
  cantidad: string
  productoId?: number
}

interface Muestra {
  numeroMuestra: string
  tipoMaterial: string
  elemento: string
  item: string
  grado: string
  procedencia: string
  cota1: string
  cota2: string
  ubicacionSector: string
  vencimiento: boolean
  observaciones: string
  servicios: Array<{
    codigo: string
    nombre: string
    cantidad: number
    productoId: number
  }>
  probetas: Array<{
    numero: number
    fechaConfeccion: string
    cantidad: number
    dias: number
    fechaVencimiento: string
    estado: string
  }>
}

// Constants
const steps = [
  { title: 'General', subtitle: '' },
  { title: 'Muestras', subtitle: '' },
  { title: 'Cierre', subtitle: '' }
]

// Interface para las propiedades del componente
interface StepperVerticalWithNumbersProps {
  otData?: any
  otId?: string | null
  tipoOT?: string | null
  servicioId?: string | null
  loading?: boolean
}

const StepperVerticalWithNumbers = ({ otData, tipoOT, loading }: StepperVerticalWithNumbersProps) => {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)

  // Estados para el paso 1
  const [fechaCodificacion, setFechaCodificacion] = useState<string>(new Date().toISOString().split('T')[0])
  const [fechaMuestreo, setFechaMuestreo] = useState<string>(new Date().toISOString().split('T')[0])
  const [fechaIngreso, setFechaIngreso] = useState<string>(new Date().toISOString().split('T')[0])

  // Estados para el paso 2
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cantidad, setCantidad] = useState<string>('1')

  // Estados para el paso 3
  const [muestras, setMuestras] = useState<Muestra[]>([])
  const [observaciones, setObservaciones] = useState<string>('')

  // Estados para muestras
  const [vencimiento, setVencimiento] = useState<boolean>(false)

  const [muestraActual, setMuestraActual] = useState<Muestra>({
    numeroMuestra: '',
    tipoMaterial: '',
    elemento: '',
    item: '',
    grado: '',
    procedencia: '',
    cota1: '',
    cota2: '',
    ubicacionSector: '',
    vencimiento: false,
    observaciones: '',
    servicios: [],
    probetas: []
  })

  // Estado para campos de formulario del servicio
  const [servicio, setServicio] = useState('')

  // Estados para el selector de productos
  const [productos, setProductos] = useState<Producto[]>([])
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [loadingProductos, setLoadingProductos] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)

  // Estados para filtros
  const [tipoFilter, setTipoFilter] = useState<string>('')
  const [areaFilter, setAreaFilter] = useState<string>('')
  const [familiaFilter, setFamiliaFilter] = useState<string>('')
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([])
  const [areasDisponibles, setAreasDisponibles] = useState<string[]>([])
  const [familiasDisponibles, setFamiliasDisponibles] = useState<string[]>([])

  // Cargar productos desde la API
  const fetchProductos = async () => {
    try {
      setLoadingProductos(true)
      const response = await fetch('/api/productos')
      const data = await response.json()

      if (data.productos) {
        // Filtrar solo los que no son paquetes
        const productosSimples = data.productos.filter((p: any) => !p.esPaquete)

        setProductos(productosSimples)
        setFilteredProductos(productosSimples)
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    } finally {
      setLoadingProductos(false)
    }
  }

  // Cargar productos cuando se monta el componente
  useEffect(() => {
    fetchProductos()
  }, [])

  // Extraer valores únicos para filtros cuando se cargan los productos
  useEffect(() => {
    if (productos.length > 0) {
      // Extraer valores únicos para tipos, áreas y familias
      const tipos = [...new Set(productos.map(p => p.tipo).filter(Boolean))] as string[]
      const areas = [...new Set(productos.map(p => p.area).filter(Boolean))] as string[]
      const familias = [...new Set(productos.map(p => p.familia).filter(Boolean))] as string[]

      setTiposDisponibles(tipos)
      setAreasDisponibles(areas)
      setFamiliasDisponibles(familias)
    }
  }, [productos])

  // Filtrar productos cuando se escribe en el campo de búsqueda o cambian los filtros
  useEffect(() => {
    // Aplicar primero los filtros de tipo, área y familia
    let results = productos

    if (tipoFilter) {
      results = results.filter(p => p.tipo === tipoFilter)
    }

    if (areaFilter) {
      results = results.filter(p => p.area === areaFilter)
    }

    if (familiaFilter) {
      results = results.filter(p => p.familia === familiaFilter)
    }

    // Si no hay término de búsqueda, mostrar los resultados filtrados (limitados)
    if (searchTerm.trim() === '') {
      setFilteredProductos(results.slice(0, 50)) // Limitar a 50 resultados cuando no hay búsqueda
    } else {
      const searchTerms = searchTerm
        .toLowerCase()
        .split(' ')
        .filter(term => term.length > 0)

      if (searchTerms.length === 0) {
        setFilteredProductos(results.slice(0, 50))

        return
      }

      // Buscar en múltiples campos y dar prioridad basada en coincidencias exactas
      const filtered = results
        .map(producto => {
          const sku = producto.sku?.toLowerCase() || ''
          const nombre = producto.nombre?.toLowerCase() || ''
          const tipo = producto.tipo?.toLowerCase() || ''
          const area = producto.area?.toLowerCase() || ''
          const familia = producto.familia?.toLowerCase() || ''

          // Calcular puntaje de relevancia
          let score = 0
          let matchesAllTerms = true

          for (const term of searchTerms) {
            let termMatched = false

            // Coincidencia exacta en SKU (máxima prioridad)
            if (sku === term) {
              score += 100
              termMatched = true
            } else if (sku.includes(term)) {
              score += 50
              termMatched = true
            }

            // Coincidencia en nombre
            if (nombre === term) {
              score += 40
              termMatched = true
            } else if (nombre.includes(term)) {
              score += 30
              termMatched = true
            }

            // Coincidencia en tipo
            if (tipo === term) {
              score += 25
              termMatched = true
            } else if (tipo.includes(term)) {
              score += 20
              termMatched = true
            }

            // Coincidencia en área o familia
            if (area.includes(term) || familia.includes(term)) {
              score += 15
              termMatched = true
            }

            // Si algún término no coincide, no cumple con todos los términos
            if (!termMatched) {
              matchesAllTerms = false
            }
          }

          // Solo devolver productos que coinciden con todos los términos de búsqueda
          return matchesAllTerms ? { producto, score } : null
        })
        .filter(item => item !== null)
        .sort((a, b) => b!.score - a!.score)
        .map(item => item!.producto)
        .slice(0, 50) // Limitar resultados para mejor rendimiento

      setFilteredProductos(filtered)
    }
  }, [searchTerm, productos, tipoFilter, areaFilter, familiaFilter])

  // Efecto para cargar un servicio predeterminado basado en el tipo de OT
  useEffect(() => {
    if (otData && tipoOT) {
      // Generar un servicio según el tipo de OT
      let servicioDefault = {
        codigo: '100',
        nombre: 'Servicio por defecto',
        cantidad: '1'
      }

      switch (tipoOT) {
        case 'DENSIDADES':
          servicioDefault = { codigo: 'D001', nombre: 'Densidad Terreno', cantidad: '1' }
          break
        case 'HORMIGON_FRESCO':
          servicioDefault = { codigo: 'H001', nombre: 'Toma de muestra hormigón fresco', cantidad: '1' }
          break
        case 'RETIRO_PROBETA':
          servicioDefault = { codigo: 'R001', nombre: 'Retiro de Probeta', cantidad: '1' }
          break
        case 'ACEPTACION_VISITA':
          servicioDefault = { codigo: 'A001', nombre: 'Aceptación de Visita', cantidad: '1' }
          break
      }

      // Agregar el servicio predeterminado
      setServicios([servicioDefault])
    }
  }, [otData, tipoOT])

  const handleNext = () => {
    if (activeStep === 0) {
      if (!fechaCodificacion || !fechaMuestreo || !fechaIngreso) {
        toast.error('Por favor complete todas las fechas')

        return
      }

      if (servicios.length === 0) {
        toast.error('Por favor agregue al menos un servicio')

        return
      }
    } else if (activeStep === 1) {
      // Validar que los campos requeridos de la muestra estén completos
      if (!muestraActual.tipoMaterial || !muestraActual.elemento || !muestraActual.item) {
        toast.error('Por favor complete los campos requeridos de la muestra (Tipo Material, Elemento, Item)')

        return
      }

      // Validar que haya al menos un servicio en la muestra
      if (muestraActual.servicios.length === 0) {
        toast.error('Por favor agregue al menos un servicio a la muestra')

        return
      }

      // Si tiene vencimiento, validar que haya al menos una probeta
      if (muestraActual.vencimiento && muestraActual.probetas.length === 0) {
        toast.error('Por favor agregue al menos una probeta')

        return
      }

      // Agregar la muestra actual al array de muestras
      setMuestras([...muestras, muestraActual])
    }

    setActiveStep(prevActiveStep => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
    setFechaCodificacion(new Date().toISOString().split('T')[0])
    setFechaMuestreo(new Date().toISOString().split('T')[0])
    setFechaIngreso(new Date().toISOString().split('T')[0])
    setServicios([])
    setCantidad('1')
    setMuestras([])
    setObservaciones('')
  }

  // Abrir el popover
  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)

    if (!productos.length) {
      fetchProductos()
    }
  }

  // Cerrar el popover
  const handleClosePopover = () => {
    setAnchorEl(null)
  }

  // Seleccionar un producto
  const handleSelectProduct = (producto: Producto) => {
    setSelectedProduct(producto)

    // Mostrar el tipo + nombre en el campo de búsqueda
    setServicio(`${producto.tipo ? `${producto.tipo} - ` : ''}${producto.nombre}`)
    handleClosePopover()
  }

  // Controlar cambios en el campo de búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    setServicio(value)

    // Usar setTimeout para implementar un debounce simple
    clearTimeout((window as any).searchTimeout)
    ;(window as any).searchTimeout = setTimeout(() => {
      setSearchTerm(value)
    }, 300) // Esperar 300ms antes de actualizar los resultados
  }

  // Manejar teclas especiales en el buscador
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Si presiona Enter, seleccionar el primer producto de la lista si existe
    if (event.key === 'Enter' && filteredProductos.length > 0 && anchorEl) {
      handleSelectProduct(filteredProductos[0])
      event.preventDefault()
    }
  }

  const handleAddServicio = () => {
    if (servicio.trim() !== '' && selectedProduct) {
      const nuevoServicio = {
        codigo: selectedProduct.sku,
        nombre: servicio,
        cantidad: parseInt(cantidad) || 1,
        productoId: selectedProduct.productoId
      }

      // Si estamos en el paso 1, agregar al array de servicios general
      if (activeStep === 0) {
        setServicios([
          ...servicios,
          {
            codigo: nuevoServicio.codigo,
            nombre: nuevoServicio.nombre,
            cantidad: cantidad || '1'
          }
        ])
      }

      // Si estamos en el paso 2, agregar al array de servicios de la muestra actual
      else if (activeStep === 1) {
        setMuestraActual(prev => ({
          ...prev,
          servicios: [...prev.servicios, nuevoServicio]
        }))
      }

      // Limpiar campos
      setServicio('')
      setCantidad('1')
      setSelectedProduct(null)
    } else {
      toast.error('Por favor seleccione un servicio y especifique la cantidad')
    }
  }

  const handleDeleteServicio = (index: number) => {
    const nuevosServicios = [...servicios]

    nuevosServicios.splice(index, 1)
    setServicios(nuevosServicios)
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setTipoFilter('')
    setAreaFilter('')
    setFamiliaFilter('')
  }

  // Función para validar los campos requeridos
  const validateFields = () => {
    // Validar campos del paso 1
    if (!fechaCodificacion || !fechaMuestreo || !fechaIngreso) {
      toast.error('Por favor complete todas las fechas en el paso 1')

      return false
    }

    // Validar servicios en el paso 1
    if (servicios.length === 0) {
      toast.error('Debe agregar al menos un servicio')

      return false
    }

    // Validar campos del paso 2
    if (!muestraActual.tipoMaterial || !muestraActual.elemento || !muestraActual.item) {
      toast.error('Complete todos los campos requeridos de la muestra')

      return false
    }

    // Validar que haya al menos un servicio en la muestra
    if (muestraActual.servicios.length === 0) {
      toast.error('Debe agregar al menos un servicio a la muestra')

      return false
    }

    // Si tiene vencimiento, validar que haya al menos una probeta
    if (muestraActual.vencimiento && muestraActual.probetas.length === 0) {
      toast.error('Debe agregar al menos una probeta')

      return false
    }

    return true
  }

  // Función para guardar el RCM
  const handleSaveRCM = async () => {
    try {
      const response = await fetch('/api/rcm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fechaCodificacion,
          fechaMuestreo,
          fechaIngreso,
          servicios,
          muestras,
          observaciones
        })
      })

      if (!response.ok) {
        throw new Error('Error al guardar el RCM')
      }

      const data = await response.json()

      toast.success('RCM guardado exitosamente')
      router.push('/en/apps/rcmnavigator')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar el RCM')
    }
  }

  // Si está cargando, mostrar indicador de carga
  if (loading) {
  return (
    <Card>
        <CardHeader title='Cargando datos...' />
        <CardContent>
          <Typography>Preparando formulario de codificación...</Typography>
        </CardContent>
      </Card>
    )
  }

  // Verificar si el popover está abierto
  const open = Boolean(anchorEl)
  const id = open ? 'productos-popover' : undefined

  return (
    <Card>
      <CardHeader title={`Codificación de ${tipoOT || 'Servicio'}`} />
      <CardContent>
        <StepperWrapper>
          <Stepper activeStep={activeStep} orientation='vertical'>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel StepIconComponent={StepperCustomDot}>
                  <Typography className='step-number' color='text.primary'>{`0${index + 1}`}</Typography>
                  <Typography className='step-title' color='text.primary'>
                    {step.title}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {index === 0 && (
                    <>
                      {/* RCM Details */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={4}>
                          <TextField
                            label='Fecha de Codificación'
                            size='small'
                            type='date'
                            value={fechaCodificacion}
                            onChange={e => setFechaCodificacion(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            label='Fecha de Muestreo'
                            size='small'
                            type='date'
                            value={fechaMuestreo}
                            onChange={e => setFechaMuestreo(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            label='Fecha de Ingreso'
                            size='small'
                            type='date'
                            value={fechaIngreso}
                            onChange={e => setFechaIngreso(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      {/* Nuevos Campos */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={8}>
                          <TextField
                            label='Servicio / Ensayo'
                            size='small'
                            fullWidth
                            value={servicio}
                            onChange={handleSearchChange}
                            onClick={handleOpenPopover}
                            onKeyDown={handleSearchKeyDown}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position='start'>
                                  <i className='ri-search-line' style={{ marginRight: 8 }} />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position='end'>
                                  {loadingProductos && <CircularProgress size={20} />}
                                  {selectedProduct && (
                                    <IconButton
                                      size='small'
                                      onClick={e => {
                                        e.stopPropagation()
                                        setSelectedProduct(null)
                                        setServicio('')
                                      }}
                                    >
                                      <i className='ri-close-line' />
                                    </IconButton>
                                  )}
                                </InputAdornment>
                              )
                            }}
                          />
                          <Popover
                            id={id}
                            open={open}
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
                              style: {
                                maxHeight: 500,
                                width: '100%',
                                maxWidth: anchorEl && anchorEl.offsetWidth > 600 ? anchorEl.offsetWidth : 600
                              }
                            }}
                          >
                            {loadingProductos ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <CircularProgress size={24} />
                              </Box>
                            ) : (
                              <>
                                <Box
                                  sx={{
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10,
                                    backgroundColor: '#fff',
                                    borderBottom: '1px solid #eee',
                                    p: 2
                                  }}
                                >
                                  <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                      <TextField
                                        select
                                        size='small'
                                        label='Tipo'
                                        fullWidth
                                        value={tipoFilter}
                                        onChange={e => setTipoFilter(e.target.value)}
                                        SelectProps={{
                                          native: true,
                                          style: { paddingRight: '24px' }
                                        }}
                                      >
                                        <option value=''>Todos</option>
                                        {tiposDisponibles.map(tipo => (
                                          <option key={tipo} value={tipo}>
                                            {tipo}
                                          </option>
                                        ))}
                                      </TextField>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <TextField
                                        select
                                        size='small'
                                        label='Área'
                                        fullWidth
                                        value={areaFilter}
                                        onChange={e => setAreaFilter(e.target.value)}
                                        SelectProps={{
                                          native: true,
                                          style: { paddingRight: '24px' }
                                        }}
                                      >
                                        <option value=''>Todas</option>
                                        {areasDisponibles.map(area => (
                                          <option key={area} value={area}>
                                            {area}
                                          </option>
                                        ))}
                                      </TextField>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <TextField
                                        select
                                        size='small'
                                        label='Familia'
                                        fullWidth
                                        value={familiaFilter}
                                        onChange={e => setFamiliaFilter(e.target.value)}
                                        SelectProps={{
                                          native: true,
                                          style: { paddingRight: '24px' }
                                        }}
                                      >
                                        <option value=''>Todas</option>
                                        {familiasDisponibles.map(familia => (
                                          <option key={familia} value={familia}>
                                            {familia}
                                          </option>
                                        ))}
                                      </TextField>
                                    </Grid>
                                  </Grid>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'flex-end',
                                      mt: 1
                                    }}
                                  >
                                    <Button
                                      size='small'
                                      onClick={handleClearFilters}
                                      startIcon={<i className='ri-filter-off-line' />}
                                      variant='text'
                                    >
                                      Limpiar filtros
                                    </Button>
                                  </Box>
                                </Box>
                                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                                  <List>
                                    {filteredProductos.length > 0 ? (
                                      filteredProductos.map(producto => (
                                        <ListItem
                                          button
                                          key={producto.productoId}
                                          onClick={() => handleSelectProduct(producto)}
                                          divider
                                          sx={{
                                            '&:hover': {
                                              backgroundColor: '#f5f5f5'
                                            }
                                          }}
                                        >
                                          <ListItemText
                                            primary={<Typography fontWeight='medium'>{producto.nombre}</Typography>}
                                            secondary={
                                              <Box>
                                                <Typography
                                                  variant='body2'
                                                  component='span'
                                                  sx={{ fontWeight: 'bold' }}
                                                >
                                                  SKU: {producto.sku}
                                                </Typography>
                                                {' | '}
                                                <Typography variant='body2' component='span'>
                                                  Tipo: {producto.tipo || 'N/A'}
                                                </Typography>
                                                {' | '}
                                                <Typography variant='body2' component='span'>
                                                  Área: {producto.area || 'N/A'}
                                                </Typography>
                                                {' | '}
                                                <Typography variant='body2' component='span'>
                                                  Familia: {producto.familia || 'N/A'}
                                                </Typography>
                                              </Box>
                                            }
                                          />
                                        </ListItem>
                                      ))
                                    ) : (
                                      <ListItem>
                                        <ListItemText
                                          primary='No se encontraron productos'
                                          secondary='Intenta con otros términos o limpia los filtros'
                                        />
                                      </ListItem>
                                    )}

                                    {filteredProductos.length > 0 && filteredProductos.length >= 50 && (
                                      <ListItem>
                                        <ListItemText
                                          secondary='Se muestran los primeros 50 resultados. Refina tu búsqueda para ver resultados más precisos.'
                                          sx={{ textAlign: 'center', fontStyle: 'italic' }}
                                        />
                                      </ListItem>
                                    )}
                                  </List>
                                </Box>
                                <Box sx={{ p: 1, borderTop: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                                  <Typography variant='caption' sx={{ display: 'block', textAlign: 'center' }}>
                                    {filteredProductos.length === 0
                                      ? 'Sin resultados'
                                      : `Mostrando ${filteredProductos.length > 50 ? '50' : filteredProductos.length} de ${productos.length} productos`}
                                  </Typography>
                                </Box>
                              </>
                            )}
                          </Popover>
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Cantidad'
                            size='small'
                            fullWidth
                            value={cantidad}
                            onChange={e => setCantidad(e.target.value)}
                            type='number'
                            inputProps={{ min: 1 }}
                          />
                        </Grid>

                        <Grid item xs={2}>
                          <Button
                            variant='contained'
                            color='primary'
                            size='medium'
                            startIcon={<i className='ri-add-line' />}
                            onClick={handleAddServicio}
                            sx={{
                              width: '170px',
                              padding: '8px 16px',
                              textAlign: 'center'
                            }}
                          >
                            Añadir Servicio
                          </Button>
                        </Grid>
                      </Grid>

                      {/* Tabla for RCM */}
                      <TableContainer
                        component={Paper}
                        sx={{
                          mt: 10,
                          mb: 10,
                          p: 2
                        }}
                      >
                        <Table>
                          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                              <TableCell
                                sx={{
                                  backgroundColor: '#f5f5f5',
                                  padding: '8px'
                                }}
                              >
                                <Typography variant='subtitle2' sx={{ fontWeight: '', color: '#424242' }}>
                                  CÓD INT
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: '#f5f5f5',
                                  padding: '8px'
                                }}
                              >
                                <Typography variant='subtitle2' sx={{ fontWeight: '', color: '#424242' }}>
                                  Servicio
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: '#f5f5f5',
                                  padding: '8px'
                                }}
                              >
                                <Typography variant='subtitle2' sx={{ fontWeight: '', color: '#424242' }}>
                                  Cantidad
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: '#f5f5f5',
                                  padding: '8px'
                                }}
                              >
                                <Typography variant='subtitle2' sx={{ fontWeight: '', color: '#424242' }}>
                                  Acciones
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {servicios.length > 0 ? (
                              servicios.map((serv, index) => (
                                <TableRow key={index}>
                                  <TableCell>{serv.codigo}</TableCell>
                                  <TableCell>{serv.nombre}</TableCell>
                                  <TableCell>{serv.cantidad}</TableCell>
                                  <TableCell>
                                    <IconButton size='small' color='primary'>
                                      <EditIcon fontSize='small' />
                                    </IconButton>
                                    <IconButton size='small' color='error' onClick={() => handleDeleteServicio(index)}>
                                      <DeleteIcon fontSize='small' />
                                    </IconButton>
                                  </TableCell>
                            </TableRow>
                              ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={4} align='center'>
                                  No hay servicios agregados
                                </TableCell>
                            </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Observación y Botón Codificar */}
                      <Box display='flex' alignItems='center' justifyContent='space-between' sx={{ mt: 2 }}>
                        <TextField label='Observación' fullWidth />
                        <Button
                          variant='outlined'
                          color='primary'
                          startIcon={<i className='ri-check-line' />}
                          sx={{ ml: 2 }}
                        >
                          Codificar
                        </Button>
                      </Box>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      {/* Acordeón para Muestra */}
                      <Accordion defaultExpanded sx={{ mt: 3 }}>
                        <AccordionSummary
                          expandIcon={<i className='ri-arrow-down-s-line' />}
                          sx={{
                            backgroundColor: '#f5f5f5',
                            borderBottom: '1px solid #ddd',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Box display='flex' alignItems='center' gap={2}>
                            <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                              Muestra #1
                            </Typography>
                            <Chip
                              label='180280-1'
                              sx={{
                                backgroundColor: '#e0e0e0',
                                color: '#424242',
                                fontWeight: 'bold',
                                height: '24px'
                              }}
                            />
                          </Box>
                          <Box
                            display='flex'
                            alignItems='center'
                            gap={2}
                            sx={{ marginLeft: 'auto' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <Box display='flex' alignItems='center' gap={1}>
                              <Typography variant='body2'>Vencimiento</Typography>
                              <Checkbox
                                checked={vencimiento}
                                color='primary'
                                onChange={e => {
                                  setVencimiento(e.target.checked)
                                  setMuestraActual(prev => ({
                                    ...prev,
                                    vencimiento: e.target.checked
                                  }))
                                }}
                              />
                            </Box>
                            <IconButton color='primary' onClick={() => console.log('Editar clickeado')}>
                              <i className='ri-edit-line' />
                            </IconButton>
                            <IconButton color='primary' onClick={() => console.log('Duplicar clickeado')}>
                              <i className='ri-file-copy-line' />
                            </IconButton>
                            <IconButton color='primary' onClick={() => console.log('Eliminar clickeado')}>
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                          </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                          {/* Campos organizados */}
                          <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField
                                label='Tipo Material'
                                size='small'
                                fullWidth
                                value={muestraActual.tipoMaterial}
                                onChange={e =>
                                  setMuestraActual(prev => ({
                                    ...prev,
                                    tipoMaterial: e.target.value
                                  }))
                                }
                              />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 2 }}>
                              <TextField
                                label='Elemento'
                                size='small'
                                fullWidth
                                value={muestraActual.elemento}
                                onChange={e =>
                                  setMuestraActual(prev => ({
                                    ...prev,
                                    elemento: e.target.value
                                  }))
                                }
                              />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField
                                label='Ítem'
                                size='small'
                                fullWidth
                                value={muestraActual.item}
                                onChange={e =>
                                  setMuestraActual(prev => ({
                                    ...prev,
                                    item: e.target.value
                                  }))
                                }
                              />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField
                                label='Grado'
                                size='small'
                                fullWidth
                                value={muestraActual.grado}
                                onChange={e =>
                                  setMuestraActual(prev => ({
                                    ...prev,
                                    grado: e.target.value
                                  }))
                                }
                              />
                            </Grid>
                            <Grid container item xs={12} spacing={2}>
                              <Grid item xs={6}>
                                <TextField
                                  label='Procedencia'
                                  size='small'
                                  fullWidth
                                  value={muestraActual.procedencia}
                                  onChange={e =>
                                    setMuestraActual(prev => ({
                                      ...prev,
                                      procedencia: e.target.value
                                    }))
                                  }
                                />
                            </Grid>
                              <Grid item xs={3}>
                                <TextField
                                  fullWidth
                                  label='Cota 1'
                                  value={muestraActual.cota1}
                                  onChange={e => setMuestraActual({ ...muestraActual, cota1: e.target.value })}
                                  size='small'
                                />
                            </Grid>
                              <Grid item xs={3}>
                                <TextField
                                  fullWidth
                                  label='Cota 2'
                                  value={muestraActual.cota2}
                                  onChange={e => setMuestraActual({ ...muestraActual, cota2: e.target.value })}
                                  size='small'
                                />
                              </Grid>
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField
                                label='Ubicación / Sector'
                                size='small'
                                fullWidth
                                value={muestraActual.ubicacionSector}
                                onChange={e =>
                                  setMuestraActual(prev => ({
                                    ...prev,
                                    ubicacionSector: e.target.value
                                  }))
                                }
                              />
                            </Grid>
                            <Grid item xs={8} sx={{ mb: 4 }}>
                              <TextField
                                label='Servicio / Ensayo'
                                size='small'
                                fullWidth
                                value={servicio}
                                onChange={handleSearchChange}
                                onClick={handleOpenPopover}
                                onKeyDown={handleSearchKeyDown}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position='start'>
                                      <i className='ri-search-line' style={{ marginRight: 8 }} />
                                    </InputAdornment>
                                  ),
                                  endAdornment: (
                                    <InputAdornment position='end'>
                                      {loadingProductos && <CircularProgress size={20} />}
                                      {selectedProduct && (
                                        <IconButton
                                          size='small'
                                          onClick={e => {
                                            e.stopPropagation()
                                            setSelectedProduct(null)
                                            setServicio('')
                                          }}
                                        >
                                          <i className='ri-close-line' />
                                        </IconButton>
                                      )}
                                    </InputAdornment>
                                  )
                                }}
                              />
                              <Popover
                                id={id}
                                open={open}
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
                                  style: {
                                    maxHeight: 500,
                                    width: '100%',
                                    maxWidth: anchorEl && anchorEl.offsetWidth > 600 ? anchorEl.offsetWidth : 600
                                  }
                                }}
                              >
                                {loadingProductos ? (
                                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                    <CircularProgress size={24} />
                                  </Box>
                                ) : (
                                  <>
                                    <Box
                                      sx={{
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10,
                                        backgroundColor: '#fff',
                                        borderBottom: '1px solid #eee',
                                        p: 2
                                      }}
                                    >
                                      <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                          <TextField
                                            select
                                            size='small'
                                            label='Tipo'
                                            fullWidth
                                            value={tipoFilter}
                                            onChange={e => setTipoFilter(e.target.value)}
                                            SelectProps={{
                                              native: true,
                                              style: { paddingRight: '24px' }
                                            }}
                                          >
                                            <option value=''>Todos</option>
                                            {tiposDisponibles.map(tipo => (
                                              <option key={tipo} value={tipo}>
                                                {tipo}
                                              </option>
                                            ))}
                                          </TextField>
                            </Grid>
                                        <Grid item xs={4}>
                                          <TextField
                                            select
                                            size='small'
                                            label='Área'
                                            fullWidth
                                            value={areaFilter}
                                            onChange={e => setAreaFilter(e.target.value)}
                                            SelectProps={{
                                              native: true,
                                              style: { paddingRight: '24px' }
                                            }}
                                          >
                                            <option value=''>Todas</option>
                                            {areasDisponibles.map(area => (
                                              <option key={area} value={area}>
                                                {area}
                                              </option>
                                            ))}
                                          </TextField>
                            </Grid>
                                        <Grid item xs={4}>
                                          <TextField
                                            select
                                size='small'
                                            label='Familia'
                                            fullWidth
                                            value={familiaFilter}
                                            onChange={e => setFamiliaFilter(e.target.value)}
                                            SelectProps={{
                                              native: true,
                                              style: { paddingRight: '24px' }
                                            }}
                                          >
                                            <option value=''>Todas</option>
                                            {familiasDisponibles.map(familia => (
                                              <option key={familia} value={familia}>
                                                {familia}
                                              </option>
                                            ))}
                                          </TextField>
                            </Grid>
                          </Grid>
                                      <Box
                                        sx={{
                            display: 'flex',
                                          justifyContent: 'flex-end',
                                          mt: 1
                                        }}
                                      >
                                        <Button
                                          size='small'
                                          onClick={handleClearFilters}
                                          startIcon={<i className='ri-filter-off-line' />}
                                          variant='text'
                                        >
                                          Limpiar filtros
                                        </Button>
                          </Box>
                            </Box>
                                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                                      <List>
                                        {filteredProductos.length > 0 ? (
                                          filteredProductos.map(producto => (
                                            <ListItem
                                              button
                                              key={producto.productoId}
                                              onClick={() => handleSelectProduct(producto)}
                                              divider
                                              sx={{
                                                '&:hover': {
                                                  backgroundColor: '#f5f5f5'
                                                }
                                              }}
                                            >
                                              <ListItemText
                                                primary={<Typography fontWeight='medium'>{producto.nombre}</Typography>}
                                                secondary={
                                                  <Box>
                                                    <Typography
                                                      variant='body2'
                                                      component='span'
                                                      sx={{ fontWeight: 'bold' }}
                                                    >
                                                      SKU: {producto.sku}
                                                    </Typography>
                                                    {' | '}
                                                    <Typography variant='body2' component='span'>
                                                      Tipo: {producto.tipo || 'N/A'}
                                                    </Typography>
                                                    {' | '}
                                                    <Typography variant='body2' component='span'>
                                                      Área: {producto.area || 'N/A'}
                                                    </Typography>
                                                    {' | '}
                                                    <Typography variant='body2' component='span'>
                                                      Familia: {producto.familia || 'N/A'}
                                                    </Typography>
                          </Box>
                                                }
                                              />
                                            </ListItem>
                                          ))
                                        ) : (
                                          <ListItem>
                                            <ListItemText
                                              primary='No se encontraron productos'
                                              secondary='Intenta con otros términos o limpia los filtros'
                                            />
                                          </ListItem>
                                        )}

                                        {filteredProductos.length > 0 && filteredProductos.length >= 50 && (
                                          <ListItem>
                                            <ListItemText
                                              secondary='Se muestran los primeros 50 resultados. Refina tu búsqueda para ver resultados más precisos.'
                                              sx={{ textAlign: 'center', fontStyle: 'italic' }}
                                            />
                                          </ListItem>
                                        )}
                                      </List>
                                    </Box>
                                    <Box sx={{ p: 1, borderTop: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
                                      <Typography variant='caption' sx={{ display: 'block', textAlign: 'center' }}>
                                        {filteredProductos.length === 0
                                          ? 'Sin resultados'
                                          : `Mostrando ${filteredProductos.length > 50 ? '50' : filteredProductos.length} de ${productos.length} productos`}
                                      </Typography>
                                    </Box>
                                  </>
                                )}
                              </Popover>
                            </Grid>
                            <Grid item xs={2} sx={{ mb: 4 }}>
                              <TextField
                                label='Cantidad'
                                size='small'
                                fullWidth
                                value={cantidad}
                                onChange={e => setCantidad(e.target.value)}
                                type='number'
                                inputProps={{ min: 1 }}
                              />
                            </Grid>
                            <Grid item xs={2} sx={{ mb: 2 }}>
                              <Button
                                variant='contained'
                                color='primary'
                                size='small'
                                startIcon={<i className='ri-add-line' />}
                                onClick={handleAddServicio}
                                sx={{
                                  maxWidth: '150px',
                                  width: '100%',
                                  padding: '6px 12px'
                                }}
                              >
                                Añadir Servicio
                              </Button>
                            </Grid>
                          </Grid>

                          {/* Tabla de Servicios */}
                          <Box sx={{ mt: 4 }}>
                            <TableContainer component={Paper}>
                              <Table>
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableRow>
                                    <TableCell>CÓD. INT.</TableCell>
                                    <TableCell>ENSAYO / ANÁLISIS</TableCell>
                                    <TableCell>CANTIDAD</TableCell>
                                    <TableCell>ESTADO</TableCell>
                                    <TableCell>ACCIONES</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {muestraActual.servicios.length > 0 ? (
                                    muestraActual.servicios.map((serv, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{serv.codigo}</TableCell>
                                        <TableCell>{serv.nombre}</TableCell>
                                        <TableCell>{serv.cantidad}</TableCell>
                                    <TableCell>
                                      <Chip
                                        label='Codificado'
                                        sx={{
                                              backgroundColor: '#daf3ff',
                                              color: '#16b1ff'
                                        }}
                                      />
                                    </TableCell>
                                        <TableCell>
                                          <IconButton size='small' color='primary'>
                                            <EditIcon fontSize='small' />
                                          </IconButton>
                                          <IconButton
                                            size='small'
                                            color='error'
                                            onClick={() => {
                                              const nuevosServicios = [...muestraActual.servicios]

                                              nuevosServicios.splice(index, 1)
                                              setMuestraActual(prev => ({
                                                ...prev,
                                                servicios: nuevosServicios
                                              }))
                                            }}
                                          >
                                            <DeleteIcon fontSize='small' />
                                          </IconButton>
                                        </TableCell>
                                  </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} align='center'>
                                        No hay servicios agregados
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>

                          {/* Sección condicional de probetas */}
                          {vencimiento && (
                            <>
                          <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={2}>
                              <TextField label='Muestra' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={1}>
                              <TextField label='N°' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={2}>
                                  <TextField
                                    label='Fecha Confección'
                                    type='date'
                                    size='small'
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                  />
                            </Grid>
                            <Grid item xs={2}>
                                  <TextField
                                    label='Cantidad'
                                    type='number'
                                    size='small'
                                    fullWidth
                                    inputProps={{ min: 1 }}
                                  />
                            </Grid>
                            <Grid item xs={1}>
                                  <TextField
                                    label='Días'
                                    type='number'
                                    size='small'
                                    fullWidth
                                    inputProps={{ min: 1 }}
                                  />
                            </Grid>
                            <Grid item xs={2}>
                                  <TextField
                                    label='Fecha Vencimiento'
                                    type='date'
                                    size='small'
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                  />
                            </Grid>
                            <Grid item xs={2}>
                              <Button
                                variant='contained'
                                color='primary'
                                size='small'
                                startIcon={<i className='ri-add-line' />}
                                sx={{
                                  maxWidth: '150px',
                                  width: '100%',
                                  padding: '6px 12px'
                                }}
                              >
                                Añadir
                              </Button>
                            </Grid>
                          </Grid>

                              {/* Tabla de probetas */}
                          <Box sx={{ mt: 4 }}>
                            <TableContainer component={Paper}>
                              <Table>
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>Muestra</TableCell>
                                    <TableCell>Confección</TableCell>
                                    <TableCell>Cantidad</TableCell>
                                    <TableCell>Días</TableCell>
                                    <TableCell>Vencimiento</TableCell>
                                    <TableCell>Estado</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                      {muestraActual.probetas.length > 0 ? (
                                        muestraActual.probetas.map((probeta, index) => (
                                          <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{probeta.numero}</TableCell>
                                            <TableCell>{probeta.fechaConfeccion}</TableCell>
                                            <TableCell>{probeta.cantidad}</TableCell>
                                            <TableCell>{probeta.dias}</TableCell>
                                            <TableCell>{probeta.fechaVencimiento}</TableCell>
                                    <TableCell>
                                      <Chip
                                                label={probeta.estado}
                                        sx={{
                                                  backgroundColor: '#daf3ff',
                                                  color: '#16b1ff'
                                        }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={7} align='center'>
                                            No hay probetas agregadas
                                          </TableCell>
                                        </TableRow>
                                      )}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                            </>
                          )}

                            {/* Campo de Observaciones */}
                            <Grid container spacing={2} sx={{ mt: 4 }}>
                              <Grid item xs={12}>
                              <TextField
                                label='Observaciones Muestra'
                                size='small'
                                fullWidth
                                multiline
                                rows={1}
                                value={muestraActual.observaciones}
                                onChange={e =>
                                  setMuestraActual(prev => ({
                                    ...prev,
                                    observaciones: e.target.value
                                  }))
                                }
                              />
                              </Grid>
                            </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </>
                  )}

                  {index === 2 && (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={9}>
                          <TextField
                            label='Observaciones'
                            size='small'
                            fullWidth
                            multiline
                            rows={2}
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={3} display='flex' justifyContent='flex-end' alignItems='center'>
                          <Button
                            variant='contained'
                            color='primary'
                            size='medium'
                            startIcon={<i className='ri-save-line' />}
                            onClick={handleSaveRCM}
                          >
                            Guardar
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  <div className='flex gap-4 mt-4'>
                    <Button variant='contained' onClick={handleNext} size='small'>
                      {index === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </Button>
                    <Button
                      size='small'
                      color='secondary'
                      variant='outlined'
                      onClick={handleBack}
                      disabled={index === 0}
                    >
                      Atrás
                    </Button>
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </StepperWrapper>
        {activeStep === steps.length && (
          <div className='mt-2'>
            <Typography color='text.primary'>¡Todos los pasos están completados!</Typography>
            <Button variant='contained' onClick={handleReset} size='small' className='mt-2'>
              Reiniciar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StepperVerticalWithNumbers
