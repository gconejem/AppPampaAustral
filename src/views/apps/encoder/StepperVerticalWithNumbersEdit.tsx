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
  cotas?: string
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

// Constants
const steps = [
  { title: 'General', subtitle: '' },
  { title: 'Muestras', subtitle: '' },
  { title: 'Cierre', subtitle: '' }
]

// Interface para las propiedades del componente
interface StepperVerticalWithNumbersEditProps {
  rcmId: string
  loading?: boolean
}

const StepperVerticalWithNumbersEdit = ({ rcmId, loading }: StepperVerticalWithNumbersEditProps) => {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [loadingData, setLoadingData] = useState(true)

  // Estado para el número de RCM
  const [numeroRcm, setNumeroRcm] = useState<string>('')

  // Estados para el paso 1
  const [fechaCodificacion, setFechaCodificacion] = useState<string>(new Date().toISOString().split('T')[0])
  const [fechaMuestreo, setFechaMuestreo] = useState<string>(new Date().toISOString().split('T')[0])
  const [fechaIngreso, setFechaIngreso] = useState<string>(new Date().toISOString().split('T')[0])
  const [fechaEntrega, setFechaEntrega] = useState<string>(new Date().toISOString().split('T')[0])

  // Estados para el paso 2
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cantidad, setCantidad] = useState<string>('1')
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null)
  const [editingCantidad, setEditingCantidad] = useState<string>('1')
  const [editingMuestraServiceIndex, setEditingMuestraServiceIndex] = useState<number | null>(null)
  const [editingMuestraCantidad, setEditingMuestraCantidad] = useState<string>('1')
  const [estadoAnchorEl, setEstadoAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({})
  const [estadoProbetaAnchorEl, setEstadoProbetaAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({})

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
  const [editingMuestraIndex, setEditingMuestraIndex] = useState<number | null>(null)

  // Estados para probetas
  const [probetaNumero, setProbetaNumero] = useState<string>('')
  const [probetaFechaConfeccion, setProbetaFechaConfeccion] = useState<string>(new Date().toISOString().split('T')[0])
  const [probetaCantidad, setProbetaCantidad] = useState<string>('1')
  const [probetaDias, setProbetaDias] = useState<string>('7')
  const [probetaFechaVencimiento, setProbetaFechaVencimiento] = useState<string>(() => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + 7)
    return fecha.toISOString().split('T')[0]
  })

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

  // Estados adicionales para el popover de edición de muestra
  const [anchorElEdit, setAnchorElEdit] = useState<HTMLElement | null>(null)
  const [searchTermEdit, setSearchTermEdit] = useState('')
  const [filteredProductosEdit, setFilteredProductosEdit] = useState<Producto[]>([])
  const [productsPageEdit, setProductsPageEdit] = useState(0)
  const [totalProductosEdit, setTotalProductosEdit] = useState(0)

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

  // Cargar datos del RCM existente
  useEffect(() => {
    if (rcmId) {
      setLoadingData(true)
      fetch(`/api/rcm/${rcmId}`)
        .then(res => res.json())
        .then(data => {
          // Cargar datos generales
          setNumeroRcm(data.numeroRcm || '')
          setFechaCodificacion(data.fechaCodificacion ? new Date(data.fechaCodificacion).toISOString().split('T')[0] : '')
          setFechaMuestreo(data.fechaMuestreo ? new Date(data.fechaMuestreo).toISOString().split('T')[0] : '')
          setFechaIngreso(data.fechaIngreso ? new Date(data.fechaIngreso).toISOString().split('T')[0] : '')
          setFechaEntrega(data.fechaEntrega ? new Date(data.fechaEntrega).toISOString().split('T')[0] : '')
          setObservaciones(data.observaciones || '')

          // Cargar servicios generales
          if (data.servicios && Array.isArray(data.servicios)) {
            const serviciosMapeados = data.servicios.map((s: any) => ({
              codigo: s.producto?.sku || s.codigo || '',
              nombre: s.producto?.nombre || s.nombre || '',
              cantidad: s.cantidad?.toString() || '1',
              productoId: s.productoId,
              estado: s.estado || 'CODIFICADO'
            }))
            setServicios(serviciosMapeados)
          }

          // Cargar muestras
          if (data.muestras && Array.isArray(data.muestras)) {
            const muestrasMapeadas = data.muestras.map((m: any) => {
              // Separar cotas si vienen combinadas
              const [cota1 = '', cota2 = ''] = m.cotas ? m.cotas.split(' - ') : ['', '']

              return {
                numeroMuestra: m.numeroMuestra || '',
                numeroTarjeta: m.numeroTarjeta || '',
                tipoMaterial: m.tipoMaterial || '',
                elemento: m.elemento || '',
                item: m.item || '',
                grado: m.grado || '',
                procedencia: m.procedencia || '',
                cota1: cota1,
                cota2: cota2,
                ubicacionSector: m.ubicacionSector || '',
                vencimiento: m.vencimiento || false,
                observaciones: m.observaciones || '',
                estado: m.estadoMuestra || 'CODIFICADO',
                servicios: m.servicios?.map((s: any) => ({
                  codigo: s.producto?.sku || s.codigo || '',
                  nombre: s.producto?.nombre || s.nombre || '',
                  cantidad: s.cantidad || 1,
                  productoId: s.productoId,
                  estado: s.estado || 'CODIFICADO'
                })) || [],
                probetas: m.probetas?.map((p: any) => ({
                  numero: p.numero || 0,
                  fechaConfeccion: p.fechaConfeccion ? new Date(p.fechaConfeccion).toISOString().split('T')[0] : '',
                  cantidad: p.cantidad || 1,
                  dias: p.dias || 0,
                  fechaVencimiento: p.fechaVencimiento ? new Date(p.fechaVencimiento).toISOString().split('T')[0] : '',
                  estado: p.estado || 'PENDIENTE'
                })) || []
              }
            })
            setMuestras(muestrasMapeadas)
          }

          setLoadingData(false)
          toast.success('Datos del RCM cargados exitosamente')
        })
        .catch(error => {
          console.error('Error al cargar datos del RCM:', error)
          toast.error('Error al cargar los datos del RCM')
          setLoadingData(false)
        })
    }
  }, [rcmId])

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

  // Cargar productos paginados para el popover de edición
  useEffect(() => {
    if (anchorElEdit) {
      const params = new URLSearchParams()
      params.append('page', (productsPageEdit + 1).toString())
      params.append('limit', ITEMS_PER_PAGE.toString())

      if (searchTermEdit) params.append('search', searchTermEdit)
      if (selectedArea) params.append('area', selectedArea)
      if (selectedTipo) params.append('tipo', selectedTipo)
      if (selectedFamilia) params.append('familia', selectedFamilia)
      if (showOnlyPaquetes) params.append('esPaquete', 'true')

      fetch(`/api/productos?${params.toString()}`)
        .then(res => res.json())
        .then(response => {
          const data = response.productos || []
          setFilteredProductosEdit(data)
          setTotalProductosEdit(Number.isFinite(response.total) ? Number(response.total) : 0)
        })
        .catch(error => {
          console.error('Error al cargar productos paginados:', error)
          setFilteredProductosEdit([])
          setTotalProductosEdit(0)
        })
    }
  }, [productsPageEdit, searchTermEdit, selectedArea, selectedTipo, selectedFamilia, showOnlyPaquetes, anchorElEdit])

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
    setFechaCodificacion(new Date().toISOString().split('T')[0])
    setFechaMuestreo(new Date().toISOString().split('T')[0])
    setFechaIngreso(new Date().toISOString().split('T')[0])
    setFechaEntrega(new Date().toISOString().split('T')[0])
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

  // Abrir el popover de edición
  const handleOpenPopoverEdit = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElEdit(event.currentTarget)
    setLoadingProductos(true)
    setProductsPageEdit(0)
    setSearchTermEdit('')
    setSelectedArea('')
    setSelectedTipo('')
    setSelectedFamilia('')
    setLoadingProductos(false)
  }

  // Cerrar el popover de edición
  const handleClosePopoverEdit = () => {
    setAnchorElEdit(null)
  }

  // Controlar cambios en el campo de búsqueda de edición
  const handleSearchChangeEdit = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setServicio(value)
    clearTimeout((window as any).searchTimeoutEdit)
      ; (window as any).searchTimeoutEdit = setTimeout(() => {
        setSearchTermEdit(value)
      }, 300)
  }

  // Manejar teclas especiales en el buscador de edición
  const handleSearchKeyDownEdit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && filteredProductosEdit.length > 0 && anchorElEdit) {
      handleSelectProduct(filteredProductosEdit[0])
      event.preventDefault()
    }
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

  // Función para editar una muestra existente
  const handleEditMuestra = (index: number) => {
    const muestra = muestras[index]
    setEditingMuestraIndex(index)
    setMuestraActual({
      ...muestra,
      cota1: muestra.cota1 || '',
      cota2: muestra.cota2 || ''
    })
    setVencimiento(muestra.vencimiento)
  }

  // Función para guardar los cambios de una muestra editada
  const handleSaveMuestra = () => {
    if (editingMuestraIndex === null) return

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

    const muestrasActualizadas = [...muestras]
    muestrasActualizadas[editingMuestraIndex] = {
      ...muestraActual,
      cotas: muestraActual.cota1 && muestraActual.cota2
        ? `${muestraActual.cota1} - ${muestraActual.cota2}`
        : muestraActual.cota1 || muestraActual.cota2 || ''
    }
    setMuestras(muestrasActualizadas)
    setEditingMuestraIndex(null)

    // Limpiar los campos
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
    setVencimiento(false)
    setServicio('')
    setCantidad('1')
    setSelectedProduct(null)

    // Limpiar estados de probetas
    setProbetaNumero('')
    setProbetaFechaConfeccion(new Date().toISOString().split('T')[0])
    setProbetaCantidad('1')
    setProbetaDias('7')
    const fechaVenc = new Date()
    fechaVenc.setDate(fechaVenc.getDate() + 7)
    setProbetaFechaVencimiento(fechaVenc.toISOString().split('T')[0])

    toast.success('Muestra actualizada exitosamente')
  }

  // Función para cancelar la edición de una muestra
  const handleCancelEditMuestra = () => {
    setEditingMuestraIndex(null)
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
      servicios: [],
      probetas: []
    })
    setVencimiento(false)
    setServicio('')
    setCantidad('1')
    setSelectedProduct(null)

    // Limpiar estados de probetas
    setProbetaNumero('')
    setProbetaFechaConfeccion(new Date().toISOString().split('T')[0])
    setProbetaCantidad('1')
    setProbetaDias('7')
    const fechaVenc = new Date()
    fechaVenc.setDate(fechaVenc.getDate() + 7)
    setProbetaFechaVencimiento(fechaVenc.toISOString().split('T')[0])
  }

  // Función para eliminar una muestra
  const handleDeleteMuestra = (index: number) => {
    const nuevasMuestras = muestras.filter((_, i) => i !== index)
    setMuestras(nuevasMuestras)
    toast.success('Muestra eliminada exitosamente')
  }

  // Función para duplicar una muestra
  const handleDuplicateMuestra = (index: number) => {
    const muestraOriginal = muestras[index]

    // Crear una copia de la muestra sin número de tarjeta, sin vencimiento y sin probetas
    const muestraDuplicada: Muestra = {
      ...muestraOriginal,
      numeroMuestra: `${numeroRcm}-${muestras.length + 1}`,
      numeroTarjeta: '', // Limpiar número de tarjeta
      vencimiento: false, // Desactivar vencimiento
      probetas: [] // Sin probetas
    }

    // Agregar la muestra duplicada al array
    setMuestras([...muestras, muestraDuplicada])
    toast.success('Muestra duplicada exitosamente')
  }

  // Función para ensayar todos los ensayos de una muestra
  const handleEnsayarMuestra = (index: number) => {
    setMuestras(prevMuestras => {
      const muestrasActualizadas = [...prevMuestras]

      // Actualizar servicios a ENSAYADO
      muestrasActualizadas[index] = {
        ...muestrasActualizadas[index],
        servicios: muestrasActualizadas[index].servicios.map(servicio => ({
          ...servicio,
          estado: 'ENSAYADO'
        })),
        /* probetas: muestrasActualizadas[index].probetas.map(probeta => ({
          ...probeta,
          estado: 'ENSAYADO'
        })) */
      }

      // Si estamos editando esta muestra, también actualizar muestraActual
      if (editingMuestraIndex === index) {
        setMuestraActual(muestrasActualizadas[index])
      }

      return muestrasActualizadas
    })

    toast.success('Todos los ensayos han sido marcados como ENSAYADO')
  }

  // Función para añadir probeta
  const handleAddProbeta = () => {
    if (!probetaNumero || !probetaFechaConfeccion || !probetaCantidad || !probetaDias || !probetaFechaVencimiento) {
      toast.error('Por favor complete todos los campos de la probeta')
      return
    }

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

    // Limpiar campos
    setProbetaNumero('')
    const fechaActual = new Date()
    setProbetaFechaConfeccion(fechaActual.toISOString().split('T')[0])
    setProbetaCantidad('1')
    setProbetaDias('7')
    const fechaVenc = new Date()
    fechaVenc.setDate(fechaVenc.getDate() + 7)
    setProbetaFechaVencimiento(fechaVenc.toISOString().split('T')[0])

    toast.success('Probeta agregada exitosamente')
  }

  // Función para calcular fecha de vencimiento basada en días
  const handleCalcularFechaVencimiento = (fechaConfeccion: string, dias: string) => {
    if (fechaConfeccion && dias) {
      const fecha = new Date(fechaConfeccion)
      fecha.setDate(fecha.getDate() + parseInt(dias))
      setProbetaFechaVencimiento(fecha.toISOString().split('T')[0])
    }
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

      // Si estamos en el paso 0 (General), agregar al array de servicios general
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

      // Si estamos en el paso 1 (Muestras), agregar al array de servicios de la muestra actual
      // Esto aplica tanto para nueva muestra como para edición
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

  // Funciones para manejar el cambio de estado
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

  // Funciones para manejar el cambio de estado de probetas
  const handleOpenEstadoProbetaMenu = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setEstadoProbetaAnchorEl(prev => ({ ...prev, [index]: event.currentTarget }))
  }

  const handleCloseEstadoProbetaMenu = (index: number) => {
    setEstadoProbetaAnchorEl(prev => ({ ...prev, [index]: null }))
  }

  const handleChangeEstadoProbeta = (index: number, nuevoEstadoValor: string) => {
    const nuevasProbetas = [...muestraActual.probetas]
    nuevasProbetas[index] = {
      ...nuevasProbetas[index],
      estado: nuevoEstadoValor
    }
    setMuestraActual(prev => ({
      ...prev,
      probetas: nuevasProbetas
    }))
    handleCloseEstadoProbetaMenu(index)
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

  // Función para actualizar el RCM
  const handleUpdateRCM = async () => {
    try {
      const muestrasTransformadas = muestras.map(muestra => ({
        ...muestra,
        estadoMuestra: muestra.estado || 'CODIFICADO',
        cotas: muestra.cota1 && muestra.cota2
          ? `${muestra.cota1} - ${muestra.cota2}`
          : muestra.cota1 || muestra.cota2 || '',
        cota1: undefined,
        cota2: undefined
      }))

      const dataToSend = {
        fechaCodificacion,
        fechaMuestreo,
        fechaIngreso,
        fechaEntrega: fechaEntrega || null,
        servicios,
        muestras: muestrasTransformadas,
        observaciones
      }

      console.log('Datos a actualizar:', dataToSend)

      const response = await fetch(`/api/rcm/${rcmId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el RCM')
      }

      const data = await response.json()

      toast.success(`RCM ${data.numeroRcm} actualizado exitosamente`)
      router.push('/en/apps/rcmnavigator')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el RCM')
    }
  }

  // Si está cargando, mostrar indicador de carga
  if (loading || loadingData) {
    return (
      <Card>
        <CardHeader title='Cargando datos...' />
        <CardContent>
          <Typography>Preparando formulario de edición...</Typography>
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
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant='h5'>Editar RCM: {numeroRcm}</Typography>
        </Box>
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
                            <Accordion
                              key={idx}
                              sx={{ mb: 1 }}
                              expanded={editingMuestraIndex === idx}
                              onChange={(e, isExpanded) => {
                                if (isExpanded) {
                                  handleEditMuestra(idx)
                                } else {
                                  handleCancelEditMuestra()
                                }
                              }}
                            >
                              <AccordionSummary
                                expandIcon={<i className='ri-arrow-down-s-line' />}
                                sx={{
                                  backgroundColor: editingMuestraIndex === idx ? '#e3f2fd' : '#fafafa',
                                  border: '1px solid #e0e0e0',
                                  '&:hover': {
                                    backgroundColor: editingMuestraIndex === idx ? '#e3f2fd' : '#f5f5f5'
                                  }
                                }}
                              >
                                <Box display='flex' alignItems='center' justifyContent='space-between' width='100%'>
                                  <Box display='flex' alignItems='center' gap={2}>
                                    <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                                      Muestra #{idx + 1}
                                    </Typography>
                                    <Chip
                                      label={muestra.numeroMuestra || `${numeroRcm}-${idx + 1}`}
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
                                      value={editingMuestraIndex === idx ? muestraActual.numeroTarjeta : muestra.numeroTarjeta}
                                      onChange={e => {
                                        if (editingMuestraIndex === idx) {
                                          setMuestraActual(prev => ({
                                            ...prev,
                                            numeroTarjeta: e.target.value
                                          }))
                                        }
                                      }}
                                      disabled={editingMuestraIndex !== idx}
                                      onClick={e => e.stopPropagation()}
                                      sx={{
                                        width: '200px',
                                        '& .MuiInputBase-input.Mui-disabled': {
                                          WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)'
                                        }
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
                                    <Chip
                                      label={getEstadoNombre(editingMuestraIndex === idx ? (muestraActual.estado || 'CODIFICADO') : (muestra.estado || 'CODIFICADO'))}
                                      size='small'
                                      sx={{
                                        backgroundColor: getEstadoColor(editingMuestraIndex === idx ? (muestraActual.estado || 'CODIFICADO') : (muestra.estado || 'CODIFICADO')).color,
                                        color: getEstadoColor(editingMuestraIndex === idx ? (muestraActual.estado || 'CODIFICADO') : (muestra.estado || 'CODIFICADO')).textColor,
                                        fontWeight: 'bold',
                                        height: '24px'
                                      }}
                                    />
                                    <Box display='flex' alignItems='center' gap={1}>
                                      <Typography variant='body2'>Vencimiento</Typography>
                                      <Checkbox
                                        checked={editingMuestraIndex === idx ? vencimiento : muestra.vencimiento}
                                        disabled={editingMuestraIndex !== idx}
                                        color='primary'
                                        onChange={e => {
                                          if (editingMuestraIndex === idx) {
                                            const isChecked = e.target.checked
                                            setVencimiento(isChecked)
                                            setMuestraActual(prev => ({
                                              ...prev,
                                              vencimiento: isChecked
                                            }))
                                          }
                                        }}
                                        sx={{ padding: '4px' }}
                                      />
                                    </Box>
                                    <IconButton
                                      size='small'
                                      color='primary'
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDuplicateMuestra(idx)
                                      }}
                                      title='Duplicar muestra'
                                    >
                                      <i className='ri-file-copy-line' />
                                    </IconButton>
                                    <IconButton
                                      size='small'
                                      color='success'
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEnsayarMuestra(idx)
                                      }}
                                      title='Ensayar todos los ensayos'
                                    >
                                      <i className='ri-flask-line' />
                                    </IconButton>
                                    <IconButton
                                      size='small'
                                      color='primary'
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteMuestra(idx)
                                      }}
                                      title='Eliminar muestra'
                                    >
                                      <i className='ri-delete-bin-line' />
                                    </IconButton>
                                  </Box>
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails>
                                {editingMuestraIndex === idx ? (
                                  // Formulario de edición (igual al de creación)
                                  <>
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                      <Grid item xs={6}>
                                        <TextField
                                          label='N° Tarjeta'
                                          size='small'
                                          fullWidth
                                          value={muestraActual.numeroTarjeta}
                                          onChange={e =>
                                            setMuestraActual(prev => ({
                                              ...prev,
                                              numeroTarjeta: e.target.value
                                            }))
                                          }
                                        />
                                      </Grid>
                                      <Grid item xs={6}>
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
                                      </Grid>
                                      <Grid item xs={6}>
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
                                      <Grid item xs={6}>
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
                                      <Grid item xs={6}>
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
                                      <Grid item xs={6}>
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
                                      <Grid item xs={6}>
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
                                      <Grid item xs={6}>
                                        <TextField
                                          label='Observaciones'
                                          size='small'
                                          fullWidth
                                          multiline
                                          rows={2}
                                          value={muestraActual.observaciones}
                                          onChange={e =>
                                            setMuestraActual(prev => ({
                                              ...prev,
                                              observaciones: e.target.value
                                            }))
                                          }
                                        />
                                      </Grid>
                                      <Grid item xs={8}>
                                        <TextField
                                          label='Servicio / Ensayo'
                                          size='small'
                                          fullWidth
                                          value={servicio}
                                          onChange={handleSearchChangeEdit}
                                          onClick={handleOpenPopoverEdit}
                                          onKeyDown={handleSearchKeyDownEdit}
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
                                          id='productos-popover-edit'
                                          open={Boolean(anchorElEdit)}
                                          anchorEl={anchorElEdit}
                                          onClose={handleClosePopoverEdit}
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
                                              maxWidth: anchorElEdit && anchorElEdit.offsetWidth > 600 ? anchorElEdit.offsetWidth : 600
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
                                                  value={searchTermEdit}
                                                  onChange={e => setSearchTermEdit(e.target.value)}
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
                                                  {filteredProductosEdit.length > 0 ? (
                                                    filteredProductosEdit.map(producto => (
                                                      <ListItem
                                                        button
                                                        key={producto.productoId}
                                                        onClick={() => {
                                                          handleSelectProduct(producto)
                                                          handleClosePopoverEdit()
                                                        }}
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
                                                  onClick={() => setProductsPageEdit(prev => Math.max(0, prev - 1))}
                                                  disabled={productsPageEdit === 0}
                                                >
                                                  Anterior
                                                </Button>
                                                <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                                                  Página {productsPageEdit + 1} de {Math.max(1, Math.ceil(totalProductosEdit / ITEMS_PER_PAGE))}
                                                </Typography>
                                                <Button
                                                  size='small'
                                                  onClick={() => setProductsPageEdit(prev => Math.min(Math.ceil(totalProductosEdit / ITEMS_PER_PAGE) - 1, prev + 1))}
                                                  disabled={productsPageEdit >= Math.ceil(totalProductosEdit / ITEMS_PER_PAGE) - 1}
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
                                          size='small'
                                          startIcon={<i className='ri-add-line' />}
                                          onClick={handleAddServicio}
                                          fullWidth
                                        >
                                          Añadir
                                        </Button>
                                      </Grid>
                                    </Grid>

                                    {/* Tabla de Servicios */}
                                    <Box sx={{ mt: 3 }}>
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

                                    {/* Sección de probetas (solo si vencimiento está activo) */}
                                    {vencimiento && (
                                      <>
                                        <Grid container spacing={2} sx={{ mt: 3 }}>
                                          <Grid item xs={2}>
                                            <TextField
                                              label='Muestra'
                                              size='small'
                                              fullWidth
                                              value={muestraActual.numeroTarjeta}
                                              InputProps={{
                                                readOnly: true
                                              }}
                                              sx={{
                                                '& .MuiInputBase-input': {
                                                  backgroundColor: '#f5f5f5'
                                                }
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
                                                handleCalcularFechaVencimiento(e.target.value, probetaDias)
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
                                                handleCalcularFechaVencimiento(probetaFechaConfeccion, e.target.value)
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
                                              onClick={handleAddProbeta}
                                              fullWidth
                                            >
                                              Añadir
                                            </Button>
                                          </Grid>
                                        </Grid>

                                        {/* Tabla de probetas */}
                                        <Box sx={{ mt: 3 }}>
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
                                                          label={getEstadoNombre(probeta.estado)}
                                                          onClick={(e) => handleOpenEstadoProbetaMenu(e, index)}
                                                          size='small'
                                                          sx={{
                                                            backgroundColor: getEstadoColor(probeta.estado).color,
                                                            color: getEstadoColor(probeta.estado).textColor,
                                                            cursor: 'pointer',
                                                            '&:hover': {
                                                              opacity: 0.8
                                                            }
                                                          }}
                                                        />
                                                        <Popover
                                                          open={Boolean(estadoProbetaAnchorEl[index])}
                                                          anchorEl={estadoProbetaAnchorEl[index]}
                                                          onClose={() => handleCloseEstadoProbetaMenu(index)}
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
                                                                onClick={() => handleChangeEstadoProbeta(index, estado.valor)}
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

                                    {/* Botones de acción */}
                                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                      <Button
                                        variant='outlined'
                                        color='secondary'
                                        onClick={handleCancelEditMuestra}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        variant='contained'
                                        color='primary'
                                        onClick={handleSaveMuestra}
                                      >
                                        Guardar Cambios
                                      </Button>
                                    </Box>
                                  </>
                                ) : null}
                              </AccordionDetails>
                            </Accordion>
                          ))}
                        </Box>
                      )}

                      {/* Acordeón para Muestra Actual (solo si no estamos editando) */}
                      {editingMuestraIndex === null && (
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
                                onChange={e =>
                                  setMuestraActual(prev => ({
                                    ...prev,
                                    numeroTarjeta: e.target.value
                                  }))
                                }
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
                      )}
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
                            onClick={handleUpdateRCM}
                          >
                            Actualizar RCM
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

export default StepperVerticalWithNumbersEdit
