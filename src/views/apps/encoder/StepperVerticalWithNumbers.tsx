'use client'

// React Imports
import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { toast } from 'react-hot-toast'

// Utils
import { formatDateForInput, formatDateForDisplay } from '@/utils/dateUtils'

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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
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
  esPaquete?: boolean
}

interface Servicio {
  codigo: string
  nombre: string
  cantidad: string
  productoId?: number
  estado?: string
}

interface Muestra {
  numeroMuestra: string
  numeroTarjeta: string
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
  estado?: string
  servicios: Array<{
    codigo: string
    nombre: string
    cantidad: number
    productoId: number
    estado?: string
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

// Helper function to get today's date in YYYY-MM-DD format (local timezone)
const getTodayDateString = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

  // Estado para el número de RCM
  const [numeroRcm, setNumeroRcm] = useState<string>('')

  // Estados para el paso 1
  const [fechaCodificacion, setFechaCodificacion] = useState<string>(getTodayDateString())
  const [fechaMuestreo, setFechaMuestreo] = useState<string>(getTodayDateString())
  const [fechaIngreso, setFechaIngreso] = useState<string>(getTodayDateString())
  const [fechaEntrega, setFechaEntrega] = useState<string>(getTodayDateString())

  // Estados para el paso 2
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cantidad, setCantidad] = useState<string>('1')
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null)
  const [editingCantidad, setEditingCantidad] = useState<string>('1')
  const [editingMuestraServiceIndex, setEditingMuestraServiceIndex] = useState<number | null>(null)
  const [editingMuestraCantidad, setEditingMuestraCantidad] = useState<string>('1')
  const [estadoAnchorEl, setEstadoAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({})
  const [probetaEstadoAnchorEl, setProbetaEstadoAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({})

  // Estados disponibles con sus colores
  const estadosDisponibles = [
    { nombre: 'Codificado', valor: 'CODIFICADO', color: '#f3f3f3', textColor: '#424242' },
    /* { nombre: 'En Proceso', valor: 'EN_PROCESO', color: '#c9daf8', textColor: '#1155cc' }, */
    { nombre: 'Ensayado', valor: 'ENSAYADO', color: '#1155cc', textColor: '#ffffff' }
  ]

  // Estados para el paso 3
  const [muestras, setMuestras] = useState<Muestra[]>([])
  const [observaciones, setObservaciones] = useState<string>('')

  // Estados para muestras
  const [vencimiento, setVencimiento] = useState<boolean>(false)
  const [cantidadMuestras, setCantidadMuestras] = useState<string>('1')

  // Estados para probetas
  const [probetaMuestra, setProbetaMuestra] = useState<string>('')
  const [probetaNumero, setProbetaNumero] = useState<string>('')
  const [probetaFechaConfeccion, setProbetaFechaConfeccion] = useState<string>(getTodayDateString())
  const [probetaCantidad, setProbetaCantidad] = useState<string>('1')
  const [probetaDias, setProbetaDias] = useState<string>('7')
  const [probetaFechaVencimiento, setProbetaFechaVencimiento] = useState<string>('')

  const [muestraActual, setMuestraActual] = useState<Muestra>({
    numeroMuestra: '',
    numeroTarjeta: '',
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
    estado: 'CODIFICADO',
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
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [selectedFamilia, setSelectedFamilia] = useState<string>('')
  const [tipos, setTipos] = useState<string[]>([])
  const [areas, setAreas] = useState<string[]>([])
  const [familias, setFamilias] = useState<string[]>([])
  const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)

  // Estados para paginación
  const [productsPage, setProductsPage] = useState(0)
  const [totalProductos, setTotalProductos] = useState(0)
  const ITEMS_PER_PAGE = 10

  // Obtener el próximo número de RCM al cargar el componente
  useEffect(() => {
    fetch('/api/rcm/proximo-numero')
      .then(res => res.json())
      .then(data => {
        setNumeroRcm(data.numeroRcm)
      })
      .catch(error => {
        console.error('Error al obtener próximo número de RCM:', error)
      })
  }, [])

  // Calcular fecha de vencimiento automáticamente cuando cambian fecha de confección o días
  useEffect(() => {
    if (probetaFechaConfeccion && probetaDias) {
      const fecha = new Date(probetaFechaConfeccion)
      fecha.setDate(fecha.getDate() + parseInt(probetaDias))
      const year = fecha.getFullYear()
      const month = String(fecha.getMonth() + 1).padStart(2, '0')
      const day = String(fecha.getDate()).padStart(2, '0')
      setProbetaFechaVencimiento(`${year}-${month}-${day}`)
    }
  }, [probetaFechaConfeccion, probetaDias])

  // Cargar todos los productos al inicio para obtener filtros
  useEffect(() => {
    fetch('/api/productos?limit=1000')
      .then(res => res.json())
      .then(response => {
        const data = response.productos || []

        // Filtrar solo productos simples (no paquetes) para los filtros iniciales
        const productosSimples = data.filter((p: any) => !p.esPaquete)

        // Obtener valores únicos para filtros
        const uniqueTipos = Array.from(new Set(productosSimples.map((p: any) => p.tipo || 'Sin tipo')))
          .filter(tipo => tipo)
          .sort()

        const uniqueAreas = Array.from(new Set(productosSimples.map((p: any) => p.area || 'Sin área')))
          .filter(area => area)
          .sort()

        const uniqueFamilias = Array.from(new Set(productosSimples.map((p: any) => p.familia || 'Sin familia')))
          .filter(familia => familia)
          .sort()

        setTipos(uniqueTipos as string[])
        setAreas(uniqueAreas as string[])
        setFamilias(uniqueFamilias as string[])
        setProductos(data) // Guardar todos los productos (incluidos paquetes)
      })
      .catch(error => {
        console.error('Error al cargar productos:', error)
        setProductos([])
      })
  }, [])

  // Filtrar familias según el área seleccionada
  const familiasFiltradasPorArea = selectedArea
    ? Array.from(
      new Set(
        productos
          .filter(p => {
            // Si showOnlyPaquetes está activado, filtrar solo paquetes
            if (showOnlyPaquetes) {
              return p.area === selectedArea && p.esPaquete
            }
            // Si hay tipo seleccionado, filtrar por ese tipo
            if (selectedTipo) {
              return p.area === selectedArea && p.tipo === selectedTipo && !p.esPaquete
            }
            // Si no hay tipo seleccionado, filtrar solo por área (sin paquetes)
            return p.area === selectedArea && !p.esPaquete
          })
          .map(p => p.familia || 'Sin familia')
      )
    )
      .filter(familia => familia)
      .sort()
    : familias

  // Cargar productos paginados cuando el popover está abierto
  useEffect(() => {
    if (anchorEl) {
      const params = new URLSearchParams()
      params.append('page', (productsPage + 1).toString())
      params.append('limit', ITEMS_PER_PAGE.toString())

      if (searchTerm) params.append('search', searchTerm)
      if (selectedArea) params.append('area', selectedArea)
      if (selectedTipo) params.append('tipo', selectedTipo)
      if (selectedFamilia) params.append('familia', selectedFamilia)
      if (showOnlyPaquetes) params.append('esPaquete', 'true')

      fetch(`/api/productos?${params.toString()}`)
        .then(res => res.json())
        .then(response => {
          const data = response.productos || []
          setFilteredProductos(data)
          setTotalProductos(Number.isFinite(response.total) ? Number(response.total) : 0)
        })
        .catch(error => {
          console.error('Error al cargar productos paginados:', error)
          setFilteredProductos([])
          setTotalProductos(0)
        })
    }
  }, [productsPage, searchTerm, selectedArea, selectedTipo, selectedFamilia, showOnlyPaquetes, anchorEl])

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    if (anchorEl) {
      setProductsPage(0)
    }
  }, [selectedArea, selectedTipo, selectedFamilia, searchTerm, showOnlyPaquetes])

  // Limpiar familia cuando cambie el área o showOnlyPaquetes
  useEffect(() => {
    if (selectedArea && selectedFamilia) {
      // Verificar si la familia seleccionada existe en el área actual
      const familiaExiste = familiasFiltradasPorArea.includes(selectedFamilia)
      if (!familiaExiste) {
        setSelectedFamilia('')
      }
    }
  }, [selectedArea, showOnlyPaquetes])

  // Efecto para cargar un servicio predeterminado basado en el tipo de OT
  /* useEffect(() => {
    if (otData && tipoOT) {
      // Generar un servicio según el tipo de OT
      let servicioDefault = {
        codigo: '100',
        nombre: 'Servicio por defecto',
        cantidad: '1'
      }

      const codigo = otData?.tipoOT?.codigo
      switch (codigo) {
        case 'R-12-03': // Control de Compactación
          servicioDefault = { codigo: 'D001', nombre: 'Densidad Terreno', cantidad: '1' }
          break
        case 'R-12-39': // Muestreo de Hormigón Fresco
          servicioDefault = { codigo: 'H001', nombre: 'Toma de muestra hormigón fresco', cantidad: '1' }
          break
        case 'R-12-99': // Retiro de Probeta
          servicioDefault = { codigo: 'R001', nombre: 'Retiro de Probeta', cantidad: '1' }
          break
        default:
          servicioDefault = { codigo: 'G001', nombre: 'Servicio General', cantidad: '1' }
          break
      }

      // Agregar el servicio predeterminado
      setServicios([servicioDefault])
    }
  }, [otData, tipoOT]) */

  const handleNext = () => {
    if (activeStep === 0) {
      if (!fechaCodificacion || !fechaMuestreo || !fechaIngreso || !fechaEntrega) {
        toast.error('Por favor complete todas las fechas')

        return
      }

      if (servicios.length === 0) {
        toast.error('Por favor agregue al menos un servicio')

        return
      }

      // Avanzar al paso 1 (Muestras)
      setActiveStep(1)
    } else if (activeStep === 1) {
      // Simplemente avanzar al paso 2 (Cierre) sin agregar la muestra
      setActiveStep(2)
    }
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
    setFechaCodificacion(getTodayDateString())
    setFechaMuestreo(getTodayDateString())
    setFechaIngreso(getTodayDateString())
    setFechaEntrega(getTodayDateString())
    setServicios([])
    setCantidad('1')
    setMuestras([])
    setObservaciones('')
  }

  // Abrir el popover
  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setLoadingProductos(true)
    setProductsPage(0)
    setSearchTerm('')
    setSelectedArea('')
    setSelectedTipo('')
    setSelectedFamilia('')
    setLoadingProductos(false)
  }

  // Cerrar el popover
  const handleClosePopover = () => {
    setAnchorEl(null)
  }

  // Función para agregar una muestra y limpiar los campos
  const handleAddMuestra = () => {
    // Validar que se haya ingresado el número de tarjeta
    if (!muestraActual.numeroTarjeta || muestraActual.numeroTarjeta.trim() === '') {
      toast.error('Por favor ingrese el N° Tarjeta')
      return
    }

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

    // Generar número de muestra automáticamente
    const numeroMuestra = `${numeroRcm}-${muestras.length + 1}`

    // Agregar la muestra actual al array de muestras, combinando cota1 y cota2 en cotas
    const muestraConCotas = {
      ...muestraActual,
      numeroMuestra: numeroMuestra,
      cotas: muestraActual.cota1 && muestraActual.cota2
        ? `${muestraActual.cota1} - ${muestraActual.cota2}`
        : muestraActual.cota1 || muestraActual.cota2 || ''
    }
    setMuestras([...muestras, muestraConCotas])

    // Limpiar los campos para agregar una nueva muestra
    setMuestraActual({
      numeroMuestra: '',
      numeroTarjeta: '',
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
      estado: 'CODIFICADO',
      servicios: [],
      probetas: []
    })

    // Limpiar el estado de vencimiento
    setVencimiento(false)

    // Limpiar el campo de servicio
    setServicio('')
    setCantidad('1')
    setSelectedProduct(null)

    toast.success('Muestra agregada exitosamente')
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
      ; (window as any).searchTimeout = setTimeout(() => {
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
        productoId: selectedProduct.productoId,
        estado: 'CODIFICADO'
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
        const nuevosServicios = [...muestraActual.servicios, nuevoServicio]
        const nuevoEstado = calculateSampleState(nuevosServicios)
        setMuestraActual(prev => ({
          ...prev,
          servicios: nuevosServicios,
          estado: nuevoEstado
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

  const handleEditServicio = (index: number) => {
    setEditingServiceIndex(index)
    setEditingCantidad(servicios[index].cantidad)
  }

  const handleSaveEditServicio = (index: number) => {
    const nuevosServicios = [...servicios]
    nuevosServicios[index] = {
      ...nuevosServicios[index],
      cantidad: editingCantidad
    }
    setServicios(nuevosServicios)
    setEditingServiceIndex(null)
    setEditingCantidad('1')
  }

  const handleCancelEditServicio = () => {
    setEditingServiceIndex(null)
    setEditingCantidad('1')
  }

  // Funciones para editar servicios en la muestra
  const handleEditMuestraServicio = (index: number) => {
    setEditingMuestraServiceIndex(index)
    setEditingMuestraCantidad(muestraActual.servicios[index].cantidad.toString())
  }

  const handleSaveEditMuestraServicio = (index: number) => {
    const nuevosServicios = [...muestraActual.servicios]
    nuevosServicios[index] = {
      ...nuevosServicios[index],
      cantidad: parseInt(editingMuestraCantidad) || 1
    }
    setMuestraActual(prev => ({
      ...prev,
      servicios: nuevosServicios
    }))
    setEditingMuestraServiceIndex(null)
    setEditingMuestraCantidad('1')
  }

  const handleCancelEditMuestraServicio = () => {
    setEditingMuestraServiceIndex(null)
    setEditingMuestraCantidad('1')
  }

  const handleDeleteMuestraServicio = (index: number) => {
    const nuevosServicios = [...muestraActual.servicios]
    nuevosServicios.splice(index, 1)
    const nuevoEstado = calculateSampleState(nuevosServicios)
    setMuestraActual(prev => ({
      ...prev,
      servicios: nuevosServicios,
      estado: nuevoEstado
    }))
  }

  // Funciones para manejar el cambio de estado de servicios
  const handleOpenEstadoMenu = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setEstadoAnchorEl(prev => ({ ...prev, [index]: event.currentTarget }))
  }

  const handleCloseEstadoMenu = (index: number) => {
    setEstadoAnchorEl(prev => ({ ...prev, [index]: null }))
  }

  const handleChangeEstado = (index: number, nuevoEstadoValor: string) => {
    const nuevosServicios = [...muestraActual.servicios]
    nuevosServicios[index] = {
      ...nuevosServicios[index],
      estado: nuevoEstadoValor
    }
    const nuevoEstado = calculateSampleState(nuevosServicios)
    setMuestraActual(prev => ({
      ...prev,
      servicios: nuevosServicios,
      estado: nuevoEstado
    }))
    handleCloseEstadoMenu(index)
  }

  // Funciones para manejar el cambio de estado de probetas
  const handleOpenProbetaEstadoMenu = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setProbetaEstadoAnchorEl(prev => ({ ...prev, [index]: event.currentTarget }))
  }

  const handleCloseProbetaEstadoMenu = (index: number) => {
    setProbetaEstadoAnchorEl(prev => ({ ...prev, [index]: null }))
  }

  const handleChangeProbetaEstado = (index: number, nuevoEstadoValor: string) => {
    const nuevasProbetas = [...muestraActual.probetas]
    nuevasProbetas[index] = {
      ...nuevasProbetas[index],
      estado: nuevoEstadoValor
    }
    setMuestraActual(prev => ({
      ...prev,
      probetas: nuevasProbetas
    }))
    handleCloseProbetaEstadoMenu(index)
  }

  // Función para obtener el color del estado
  const getEstadoColor = (estadoValor: string) => {
    const estadoEncontrado = estadosDisponibles.find(e => e.valor === estadoValor)
    return estadoEncontrado || { nombre: 'Codificado', valor: 'CODIFICADO', color: '#f3f3f3', textColor: '#424242' }
  }

  // Función para obtener el nombre del estado desde el valor
  const getEstadoNombre = (estadoValor: string) => {
    const estadoEncontrado = estadosDisponibles.find(e => e.valor === estadoValor)
    return estadoEncontrado?.nombre || 'Codificado'
  }

  // Función para calcular el estado de la muestra basado en los servicios
  const calculateSampleState = (servicios: Array<{ estado?: string }>) => {
    if (servicios.length === 0) {
      return 'CODIFICADO'
    }
    const todosEnsayados = servicios.every(serv => serv.estado === 'ENSAYADO')
    return todosEnsayados ? 'ENSAYADO' : 'CODIFICADO'
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setSelectedTipo('')
    setSelectedArea('')
    setSelectedFamilia('')
    setSearchTerm('')
    setShowOnlyPaquetes(false)
    setProductsPage(0)
  }

  // Función para validar los campos requeridos
  const validateFields = () => {
    // Validar campos del paso 1
    if (!fechaCodificacion || !fechaMuestreo || !fechaIngreso || !fechaEntrega) {
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
      // Solo enviar las muestras que han sido agregadas explícitamente
      // No agregar automáticamente la muestra actual

      // Transformar las muestras para combinar cota1 y cota2 en cotas
      const muestrasTransformadas = muestras.map(muestra => ({
        ...muestra,
        cotas: muestra.cota1 && muestra.cota2
          ? `${muestra.cota1} - ${muestra.cota2}`
          : muestra.cota1 || muestra.cota2 || '',
        // Remover los campos cota1 y cota2 ya que no existen en la API
        cota1: undefined,
        cota2: undefined
      }))

      // Extraer clienteId, obraId y ordenTrabajoId del otData
      const clienteId = otData?.agenda?.cliente?.clienteId || null
      const obraId = otData?.agenda?.obra?.obraId || null
      const ordenTrabajoId = otData?.id || null

      const dataToSend = {
        fechaCodificacion,
        fechaMuestreo,
        fechaIngreso,
        fechaEntrega: fechaEntrega || null,
        servicios,
        muestras: muestrasTransformadas,
        observaciones,
        clienteId,
        obraId,
        ordenTrabajoId
      }

      console.log('Datos a enviar:', dataToSend)
      console.log('Servicios:', servicios)
      console.log('Muestras transformadas:', muestrasTransformadas)

      const response = await fetch('/api/rcm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        throw new Error('Error al guardar el RCM')
      }

      const data = await response.json()

      toast.success(`RCM ${data.numeroRcm} guardado exitosamente`)
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
      <CardContent>
        <StepperWrapper>
          <Stepper activeStep={activeStep} orientation='vertical' nonLinear>
            {steps.map((step, index) => (
              <Step key={index} active={index === 2 ? true : activeStep === index} completed={activeStep > index && index !== 2}>
                <StepLabel StepIconComponent={StepperCustomDot}>
                  <Typography className='step-number' color='text.primary'>{`0${index + 1}`}</Typography>
                  <Typography className='step-title' color='text.primary'>
                    {step.title}
                  </Typography>
                </StepLabel>
                <StepContent TransitionProps={{ in: index === 2 ? true : activeStep === index }}>
                  {index === 0 && (
                    <>
                      {/* RCM Details */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={3}>
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
                        <Grid item xs={3}>
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
                        <Grid item xs={3}>
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
                        <Grid item xs={3}>
                          <TextField
                            label='Fecha de Entrega'
                            size='small'
                            type='date'
                            value={fechaEntrega}
                            onChange={e => setFechaEntrega(e.target.value)}
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
                                  <TextField
                                    fullWidth
                                    size='small'
                                    placeholder='Buscar por nombre, SKU o descripción...'
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position='start'>
                                          <i className='ri-search-line' />
                                        </InputAdornment>
                                      )
                                    }}
                                    sx={{ mb: 2 }}
                                  />
                                  <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                      <FormControl size='small' fullWidth>
                                        <InputLabel shrink>Tipo</InputLabel>
                                        <Select
                                          value={selectedTipo}
                                          label='Tipo'
                                          onChange={e => setSelectedTipo(e.target.value)}
                                          displayEmpty
                                          renderValue={selected => selected === '' ? 'Todos' : selected}
                                        >
                                          <MenuItem value=''>Todos</MenuItem>
                                          {tipos.map((tipo: string) => (
                                            <MenuItem key={tipo} value={tipo}>
                                              {tipo}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <FormControl size='small' fullWidth>
                                        <InputLabel shrink>Área</InputLabel>
                                        <Select
                                          value={selectedArea}
                                          label='Área'
                                          onChange={e => setSelectedArea(e.target.value)}
                                          displayEmpty
                                          renderValue={selected => selected === '' ? 'Todas' : selected}
                                        >
                                          <MenuItem value=''>Todas</MenuItem>
                                          {areas.map((area: string) => (
                                            <MenuItem key={area} value={area}>
                                              {area}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <FormControl size='small' fullWidth>
                                        <InputLabel shrink>Familia</InputLabel>
                                        <Select
                                          value={selectedFamilia}
                                          label='Familia'
                                          onChange={e => setSelectedFamilia(e.target.value)}
                                          displayEmpty
                                          renderValue={selected => selected === '' ? 'Todas' : selected}
                                        >
                                          <MenuItem value=''>Todas</MenuItem>
                                          {familiasFiltradasPorArea.map((familia: string) => (
                                            <MenuItem key={familia} value={familia}>
                                              {familia}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Grid>
                                  </Grid>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      mt: 1
                                    }}
                                  >
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={showOnlyPaquetes}
                                          onChange={e => setShowOnlyPaquetes(e.target.checked)}
                                          size='small'
                                        />
                                      }
                                      label='Solo Paquetes'
                                    />
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

                                  </List>
                                </Box>
                                <Box sx={{ p: 1, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center', gap: 1 }}>
                                  <Button
                                    size='small'
                                    onClick={() => setProductsPage(prev => Math.max(0, prev - 1))}
                                    disabled={productsPage === 0}
                                  >
                                    Anterior
                                  </Button>
                                  <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                                    Página {productsPage + 1} de {Math.max(1, Math.ceil(totalProductos / ITEMS_PER_PAGE))}
                                  </Typography>
                                  <Button
                                    size='small'
                                    onClick={() => setProductsPage(prev => Math.min(Math.ceil(totalProductos / ITEMS_PER_PAGE) - 1, prev + 1))}
                                    disabled={productsPage >= Math.ceil(totalProductos / ITEMS_PER_PAGE) - 1}
                                  >
                                    Siguiente
                                  </Button>
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
                                  <TableCell>
                                    {editingServiceIndex === index ? (
                                      <TextField
                                        size='small'
                                        type='number'
                                        value={editingCantidad}
                                        onChange={e => setEditingCantidad(e.target.value)}
                                        inputProps={{ min: 1 }}
                                        sx={{ width: '80px' }}
                                      />
                                    ) : (
                                      serv.cantidad
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {editingServiceIndex === index ? (
                                      <>
                                        <IconButton
                                          size='small'
                                          color='success'
                                          onClick={() => handleSaveEditServicio(index)}
                                        >
                                          <i className='ri-check-line' />
                                        </IconButton>
                                        <IconButton
                                          size='small'
                                          color='secondary'
                                          onClick={handleCancelEditServicio}
                                        >
                                          <i className='ri-close-line' />
                                        </IconButton>
                                      </>
                                    ) : (
                                      <>
                                        <IconButton
                                          size='small'
                                          color='primary'
                                          onClick={() => handleEditServicio(index)}
                                        >
                                          <EditIcon fontSize='small' />
                                        </IconButton>
                                        <IconButton
                                          size='small'
                                          color='error'
                                          onClick={() => handleDeleteServicio(index)}
                                        >
                                          <DeleteIcon fontSize='small' />
                                        </IconButton>
                                      </>
                                    )}
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

                    </>
                  )}
                  {index === 1 && (
                    <>
                      {/* Lista de muestras agregadas */}
                      {muestras.length > 0 && (
                        <Box sx={{ mt: 3, mb: 3 }}>
                          <Typography variant='h6' sx={{ mb: 2, fontWeight: 'bold' }}>
                            Muestras Agregadas
                          </Typography>
                          {muestras.map((muestra, idx) => (
                            <Accordion key={idx} sx={{ mb: 1 }}>
                              <AccordionSummary
                                expandIcon={<i className='ri-arrow-down-s-line' />}
                                sx={{
                                  backgroundColor: '#fafafa',
                                  border: '1px solid #e0e0e0',
                                  '&:hover': {
                                    backgroundColor: '#f5f5f5'
                                  }
                                }}
                              >
                                <Box display='flex' alignItems='center' gap={2}>
                                  <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                                    Muestra #{idx + 1}
                                  </Typography>
                                  <Chip
                                    label={muestra.numeroMuestra || `${numeroRcm}-${idx + 1}`}
                                    sx={{
                                      backgroundColor: '#e0e0e0',
                                      color: '#424242',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                  {muestra.numeroTarjeta && (
                                    <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                                      N° Tarjeta: {muestra.numeroTarjeta}
                                    </Typography>
                                  )}
                                  <Chip
                                    label={getEstadoNombre(muestra.estado || 'CODIFICADO')}
                                    size='small'
                                    sx={{
                                      backgroundColor: getEstadoColor(muestra.estado || 'CODIFICADO').color,
                                      color: getEstadoColor(muestra.estado || 'CODIFICADO').textColor,
                                      fontWeight: 'bold'
                                    }}
                                  />
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Grid container spacing={2}>
                                  <Grid item xs={6}>
                                    <Typography variant='body2' color='text.secondary'>
                                      <strong>Tipo Material:</strong> {muestra.tipoMaterial}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant='body2' color='text.secondary'>
                                      <strong>Elemento:</strong> {muestra.elemento}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant='body2' color='text.secondary'>
                                      <strong>Ítem:</strong> {muestra.item}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant='body2' color='text.secondary'>
                                      <strong>Grado:</strong> {muestra.grado || 'N/A'}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant='body2' color='text.secondary'>
                                      <strong>Procedencia:</strong> {muestra.procedencia || 'N/A'}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant='body2' color='text.secondary'>
                                      <strong>Cotas:</strong> {muestra.cota1 && muestra.cota2 ? `${muestra.cota1} - ${muestra.cota2}` : muestra.cota1 || muestra.cota2 || 'N/A'}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography variant='body2' color='text.secondary'>
                                      <strong>Ubicación/Sector:</strong> {muestra.ubicacionSector || 'N/A'}
                                    </Typography>
                                  </Grid>
                                  {muestra.observaciones && (
                                    <Grid item xs={12}>
                                      <Typography variant='body2' color='text.secondary'>
                                        <strong>Observaciones:</strong> {muestra.observaciones}
                                      </Typography>
                                    </Grid>
                                  )}
                                  <Grid item xs={12}>
                                    <Typography variant='subtitle2' sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                                      Servicios:
                                    </Typography>
                                    <TableContainer component={Paper} variant='outlined'>
                                      <Table size='small'>
                                        <TableHead>
                                          <TableRow>
                                            <TableCell>Código</TableCell>
                                            <TableCell>Nombre</TableCell>
                                            <TableCell>Cantidad</TableCell>
                                            <TableCell>Estado</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {muestra.servicios.map((serv, servIdx) => {
                                            const estadoInfo = getEstadoColor(serv.estado || 'CODIFICADO')
                                            return (
                                              <TableRow key={servIdx}>
                                                <TableCell>{serv.codigo}</TableCell>
                                                <TableCell>{serv.nombre}</TableCell>
                                                <TableCell>{serv.cantidad}</TableCell>
                                                <TableCell>
                                                  <Chip
                                                    label={getEstadoNombre(serv.estado || 'CODIFICADO')}
                                                    size='small'
                                                    sx={{
                                                      backgroundColor: estadoInfo.color,
                                                      color: estadoInfo.textColor
                                                    }}
                                                  />
                                                </TableCell>
                                              </TableRow>
                                            )
                                          })}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </Grid>
                                  {muestra.vencimiento && muestra.probetas.length > 0 && (
                                    <Grid item xs={12}>
                                      <Typography variant='subtitle2' sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                                        Probetas:
                                      </Typography>
                                      <TableContainer component={Paper} variant='outlined'>
                                        <Table size='small'>
                                          <TableHead>
                                            <TableRow>
                                              <TableCell>N°</TableCell>
                                              <TableCell>Confección</TableCell>
                                              <TableCell>Cantidad</TableCell>
                                              <TableCell>Días</TableCell>
                                              <TableCell>Vencimiento</TableCell>
                                              <TableCell>Estado</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {muestra.probetas.map((probeta, probIdx) => {
                                              const estadoInfo = getEstadoColor(probeta.estado || 'CODIFICADO')
                                              return (
                                                <TableRow key={probIdx}>
                                                  <TableCell>{probeta.numero}</TableCell>
                                                  <TableCell>{formatDateForDisplay(probeta.fechaConfeccion)}</TableCell>
                                                  <TableCell>{probeta.cantidad}</TableCell>
                                                  <TableCell>{probeta.dias}</TableCell>
                                                  <TableCell>{formatDateForDisplay(probeta.fechaVencimiento)}</TableCell>
                                                  <TableCell>
                                                    <Chip
                                                      label={getEstadoNombre(probeta.estado || 'CODIFICADO')}
                                                      size='small'
                                                      sx={{
                                                        backgroundColor: estadoInfo.color,
                                                        color: estadoInfo.textColor
                                                      }}
                                                    />
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            })}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    </Grid>
                                  )}
                                </Grid>
                              </AccordionDetails>
                            </Accordion>
                          ))}
                        </Box>
                      )}

                      {/* Acordeón para Muestra Actual */}
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
                              Muestra #{muestras.length + 1}
                            </Typography>
                            <Chip
                              label={`${numeroRcm}-${muestras.length + 1}`}
                              sx={{
                                backgroundColor: '#e0e0e0',
                                color: '#424242',
                                fontWeight: 'bold',
                                height: '24px'
                              }}
                            />
                            <TextField
                              label='N° Tarjeta'
                              size='small'
                              value={muestraActual.numeroTarjeta}
                              onChange={e => {
                                const newValue = e.target.value
                                setMuestraActual(prev => ({
                                  ...prev,
                                  numeroTarjeta: newValue
                                }))

                                // Si vencimiento está activo, actualizar el campo muestra automáticamente
                                if (vencimiento) {
                                  setProbetaMuestra(newValue)
                                }
                              }}
                              onClick={e => e.stopPropagation()}
                              sx={{ width: '200px' }}
                            />
                          </Box>
                          <Box
                            display='flex'
                            alignItems='center'
                            gap={2}
                            sx={{ marginLeft: 'auto' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <Chip
                              label={getEstadoNombre(muestraActual.estado || 'CODIFICADO')}
                              size='small'
                              sx={{
                                backgroundColor: getEstadoColor(muestraActual.estado || 'CODIFICADO').color,
                                color: getEstadoColor(muestraActual.estado || 'CODIFICADO').textColor,
                                fontWeight: 'bold',
                                height: '24px'
                              }}
                            />
                            <Box display='flex' alignItems='center' gap={1}>
                              <Typography variant='body2'>Vencimiento</Typography>
                              <Checkbox
                                checked={vencimiento}
                                color='primary'
                                onChange={e => {
                                  const isChecked = e.target.checked

                                  // Validar si hay número de tarjeta cuando se activa vencimiento
                                  if (isChecked && !muestraActual.numeroTarjeta) {
                                    toast.error('Por favor ingrese el N° Tarjeta antes de activar Vencimiento')
                                    return
                                  }

                                  setVencimiento(isChecked)
                                  setMuestraActual(prev => ({
                                    ...prev,
                                    vencimiento: isChecked
                                  }))

                                  // Poblar el campo muestra con el número de tarjeta
                                  if (isChecked && muestraActual.numeroTarjeta) {
                                    setProbetaMuestra(muestraActual.numeroTarjeta)
                                  }
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
                            <Grid item xs={4} sx={{ mb: 4 }}>
                              <TextField
                                label='Cantidad muestras'
                                size='small'
                                fullWidth
                                value={cantidadMuestras}
                                onChange={e => setCantidadMuestras(e.target.value)}
                                type='number'
                              />
                            </Grid>
                            <Grid item xs={2} sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <Button
                                variant='contained'
                                color='primary'
                                size='small'
                                startIcon={<i className='ri-add-line' />}
                                onClick={handleAddMuestra}
                                sx={{
                                  padding: '6px 12px'
                                }}
                              >
                                Agregar muestra
                              </Button>
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
                                      <TextField
                                        fullWidth
                                        size='small'
                                        placeholder='Buscar por nombre, SKU o descripción...'
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        InputProps={{
                                          startAdornment: (
                                            <InputAdornment position='start'>
                                              <i className='ri-search-line' />
                                            </InputAdornment>
                                          )
                                        }}
                                        sx={{ mb: 2 }}
                                      />
                                      <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                          <FormControl size='small' fullWidth>
                                            <InputLabel shrink>Tipo</InputLabel>
                                            <Select
                                              value={selectedTipo}
                                              label='Tipo'
                                              onChange={e => setSelectedTipo(e.target.value)}
                                              displayEmpty
                                              renderValue={selected => selected === '' ? 'Todos' : selected}
                                            >
                                              <MenuItem value=''>Todos</MenuItem>
                                              {tipos.map((tipo: string) => (
                                                <MenuItem key={tipo} value={tipo}>
                                                  {tipo}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </Grid>
                                        <Grid item xs={4}>
                                          <FormControl size='small' fullWidth>
                                            <InputLabel shrink>Área</InputLabel>
                                            <Select
                                              value={selectedArea}
                                              label='Área'
                                              onChange={e => setSelectedArea(e.target.value)}
                                              displayEmpty
                                              renderValue={selected => selected === '' ? 'Todas' : selected}
                                            >
                                              <MenuItem value=''>Todas</MenuItem>
                                              {areas.map((area: string) => (
                                                <MenuItem key={area} value={area}>
                                                  {area}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </Grid>
                                        <Grid item xs={4}>
                                          <FormControl size='small' fullWidth>
                                            <InputLabel shrink>Familia</InputLabel>
                                            <Select
                                              value={selectedFamilia}
                                              label='Familia'
                                              onChange={e => setSelectedFamilia(e.target.value)}
                                              displayEmpty
                                              renderValue={selected => selected === '' ? 'Todas' : selected}
                                            >
                                              <MenuItem value=''>Todas</MenuItem>
                                              {familiasFiltradasPorArea.map((familia: string) => (
                                                <MenuItem key={familia} value={familia}>
                                                  {familia}
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </Grid>
                                      </Grid>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          mt: 1
                                        }}
                                      >
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={showOnlyPaquetes}
                                              onChange={e => setShowOnlyPaquetes(e.target.checked)}
                                              size='small'
                                            />
                                          }
                                          label='Solo Paquetes'
                                        />
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

                                      </List>
                                    </Box>
                                    <Box sx={{ p: 1, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center', gap: 1 }}>
                                      <Button
                                        size='small'
                                        onClick={() => setProductsPage(prev => Math.max(0, prev - 1))}
                                        disabled={productsPage === 0}
                                      >
                                        Anterior
                                      </Button>
                                      <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                                        Página {productsPage + 1} de {Math.max(1, Math.ceil(totalProductos / ITEMS_PER_PAGE))}
                                      </Typography>
                                      <Button
                                        size='small'
                                        onClick={() => setProductsPage(prev => Math.min(Math.ceil(totalProductos / ITEMS_PER_PAGE) - 1, prev + 1))}
                                        disabled={productsPage >= Math.ceil(totalProductos / ITEMS_PER_PAGE) - 1}
                                      >
                                        Siguiente
                                      </Button>
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
                                        <TableCell>
                                          {editingMuestraServiceIndex === index ? (
                                            <TextField
                                              size='small'
                                              type='number'
                                              value={editingMuestraCantidad}
                                              onChange={e => setEditingMuestraCantidad(e.target.value)}
                                              inputProps={{ min: 1 }}
                                              sx={{ width: '80px' }}
                                            />
                                          ) : (
                                            serv.cantidad
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={getEstadoNombre(serv.estado || 'CODIFICADO')}
                                            onClick={(e) => handleOpenEstadoMenu(e, index)}
                                            sx={{
                                              backgroundColor: getEstadoColor(serv.estado || 'CODIFICADO').color,
                                              color: getEstadoColor(serv.estado || 'CODIFICADO').textColor,
                                              cursor: 'pointer',
                                              '&:hover': {
                                                opacity: 0.8
                                              }
                                            }}
                                          />
                                          <Popover
                                            open={Boolean(estadoAnchorEl[index])}
                                            anchorEl={estadoAnchorEl[index]}
                                            onClose={() => handleCloseEstadoMenu(index)}
                                            anchorOrigin={{
                                              vertical: 'bottom',
                                              horizontal: 'center'
                                            }}
                                            transformOrigin={{
                                              vertical: 'top',
                                              horizontal: 'center'
                                            }}
                                          >
                                            <List sx={{ p: 0 }}>
                                              {estadosDisponibles.map((estado) => (
                                                <ListItem
                                                  key={estado.valor}
                                                  button
                                                  onClick={() => handleChangeEstado(index, estado.valor)}
                                                  sx={{
                                                    py: 1,
                                                    px: 2,
                                                    '&:hover': {
                                                      backgroundColor: '#f5f5f5'
                                                    }
                                                  }}
                                                >
                                                  <Chip
                                                    label={estado.nombre}
                                                    size='small'
                                                    sx={{
                                                      backgroundColor: estado.color,
                                                      color: estado.textColor,
                                                      width: '120px'
                                                    }}
                                                  />
                                                </ListItem>
                                              ))}
                                            </List>
                                          </Popover>
                                        </TableCell>
                                        <TableCell>
                                          {editingMuestraServiceIndex === index ? (
                                            <>
                                              <IconButton
                                                size='small'
                                                color='success'
                                                onClick={() => handleSaveEditMuestraServicio(index)}
                                              >
                                                <i className='ri-check-line' />
                                              </IconButton>
                                              <IconButton
                                                size='small'
                                                color='secondary'
                                                onClick={handleCancelEditMuestraServicio}
                                              >
                                                <i className='ri-close-line' />
                                              </IconButton>
                                            </>
                                          ) : (
                                            <>
                                              <IconButton
                                                size='small'
                                                color='primary'
                                                onClick={() => handleEditMuestraServicio(index)}
                                              >
                                                <EditIcon fontSize='small' />
                                              </IconButton>
                                              <IconButton
                                                size='small'
                                                color='error'
                                                onClick={() => handleDeleteMuestraServicio(index)}
                                              >
                                                <DeleteIcon fontSize='small' />
                                              </IconButton>
                                            </>
                                          )}
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
                                  <TextField
                                    label='Muestra'
                                    size='small'
                                    fullWidth
                                    value={probetaMuestra}
                                    onChange={e => setProbetaMuestra(e.target.value)}
                                    disabled
                                    InputProps={{
                                      readOnly: true
                                    }}
                                  />
                                </Grid>
                                <Grid item xs={1}>
                                  <TextField
                                    label='N°'
                                    size='small'
                                    fullWidth
                                    value={probetaNumero}
                                    onChange={e => setProbetaNumero(e.target.value)}
                                    type='number'
                                    inputProps={{ min: 1 }}
                                  />
                                </Grid>
                                <Grid item xs={2}>
                                  <TextField
                                    label='Fecha Confección'
                                    type='date'
                                    size='small'
                                    fullWidth
                                    value={probetaFechaConfeccion}
                                    onChange={e => {
                                      setProbetaFechaConfeccion(e.target.value)
                                      // Calcular fecha de vencimiento si hay días especificados
                                      if (probetaDias) {
                                        const fecha = new Date(e.target.value)
                                        fecha.setDate(fecha.getDate() + parseInt(probetaDias))
                                        setProbetaFechaVencimiento(fecha.toISOString().split('T')[0])
                                      }
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                  />
                                </Grid>
                                <Grid item xs={2}>
                                  <TextField
                                    label='Cantidad'
                                    type='number'
                                    size='small'
                                    fullWidth
                                    value={probetaCantidad}
                                    onChange={e => setProbetaCantidad(e.target.value)}
                                    inputProps={{ min: 1 }}
                                  />
                                </Grid>
                                <Grid item xs={1}>
                                  <TextField
                                    label='Días'
                                    type='number'
                                    size='small'
                                    fullWidth
                                    value={probetaDias}
                                    onChange={e => {
                                      setProbetaDias(e.target.value)
                                      // Calcular fecha de vencimiento automáticamente
                                      if (probetaFechaConfeccion && e.target.value) {
                                        const fecha = new Date(probetaFechaConfeccion)
                                        fecha.setDate(fecha.getDate() + parseInt(e.target.value))
                                        setProbetaFechaVencimiento(fecha.toISOString().split('T')[0])
                                      }
                                    }}
                                    inputProps={{ min: 1 }}
                                  />
                                </Grid>
                                <Grid item xs={2}>
                                  <TextField
                                    label='Fecha Vencimiento'
                                    type='date'
                                    size='small'
                                    fullWidth
                                    value={probetaFechaVencimiento}
                                    onChange={e => setProbetaFechaVencimiento(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                  />
                                </Grid>
                                <Grid item xs={2}>
                                  <Button
                                    variant='contained'
                                    color='primary'
                                    size='small'
                                    startIcon={<i className='ri-add-line' />}
                                    onClick={() => {
                                      // Validar campos requeridos
                                      if (!probetaNumero || !probetaFechaConfeccion || !probetaCantidad || !probetaDias || !probetaFechaVencimiento) {
                                        toast.error('Por favor complete todos los campos de la probeta')
                                        return
                                      }

                                      // Agregar probeta
                                      const nuevaProbeta = {
                                        numero: parseInt(probetaNumero),
                                        fechaConfeccion: probetaFechaConfeccion,
                                        cantidad: parseInt(probetaCantidad),
                                        dias: parseInt(probetaDias),
                                        fechaVencimiento: probetaFechaVencimiento,
                                        estado: 'CODIFICADO'
                                      }

                                      setMuestraActual(prev => ({
                                        ...prev,
                                        probetas: [...prev.probetas, nuevaProbeta]
                                      }))

                                      // Limpiar campos excepto muestra
                                      setProbetaNumero('')
                                      setProbetaFechaConfeccion(getTodayDateString())
                                      setProbetaCantidad('1')
                                      setProbetaDias('7')
                                      setProbetaFechaVencimiento('')

                                      toast.success('Probeta agregada exitosamente')
                                    }}
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
                                                label={getEstadoNombre(probeta.estado || 'CODIFICADO')}
                                                onClick={(e) => handleOpenProbetaEstadoMenu(e, index)}
                                                sx={{
                                                  backgroundColor: getEstadoColor(probeta.estado || 'CODIFICADO').color,
                                                  color: getEstadoColor(probeta.estado || 'CODIFICADO').textColor,
                                                  cursor: 'pointer',
                                                  '&:hover': {
                                                    opacity: 0.8
                                                  }
                                                }}
                                              />
                                              <Popover
                                                open={Boolean(probetaEstadoAnchorEl[index])}
                                                anchorEl={probetaEstadoAnchorEl[index]}
                                                onClose={() => handleCloseProbetaEstadoMenu(index)}
                                                anchorOrigin={{
                                                  vertical: 'bottom',
                                                  horizontal: 'center'
                                                }}
                                                transformOrigin={{
                                                  vertical: 'top',
                                                  horizontal: 'center'
                                                }}
                                              >
                                                <List sx={{ p: 0 }}>
                                                  {estadosDisponibles.map((estado) => (
                                                    <ListItem
                                                      key={estado.valor}
                                                      button
                                                      onClick={() => handleChangeProbetaEstado(index, estado.valor)}
                                                      sx={{
                                                        py: 1,
                                                        px: 2,
                                                        '&:hover': {
                                                          backgroundColor: '#f5f5f5'
                                                        }
                                                      }}
                                                    >
                                                      <Chip
                                                        label={estado.nombre}
                                                        size='small'
                                                        sx={{
                                                          backgroundColor: estado.color,
                                                          color: estado.textColor,
                                                          width: '120px'
                                                        }}
                                                      />
                                                    </ListItem>
                                                  ))}
                                                </List>
                                              </Popover>
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
                            Codificar
                          </Button>
                        </Grid>
                      </Grid>
                      <div className='flex gap-4 mt-4'>
                        <Button
                          size='small'
                          color='secondary'
                          variant='outlined'
                          onClick={handleBack}
                        >
                          Atrás
                        </Button>
                      </div>
                    </Box>
                  )}

                  {index !== 2 && (
                    <div className='flex gap-4 mt-4'>
                      <Button variant='contained' onClick={handleNext} size='small'>
                        Siguiente
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
                      {index === 0 && (
                        <Button
                          size='small'
                          variant='outlined'
                          onClick={() => setActiveStep(2)}
                        >
                          Saltar a Cierre
                        </Button>
                      )}
                    </div>
                  )}
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
