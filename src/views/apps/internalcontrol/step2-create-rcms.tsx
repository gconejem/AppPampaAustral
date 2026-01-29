// MUI Imports
import { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Button,
    Card,
    TextField,
    Chip,
    IconButton,
    Checkbox,
    Grid,
    Collapse,
    Popover,
    List,
    ListItem,
    ListItemText,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Menu,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material'
import { formatDateOnly } from '@/utils/dateUtils'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import LayersIcon from '@mui/icons-material/Layers'

const ITEMS_PER_PAGE = 10

interface ProductoType {
    id: number
    sku: string
    nombre: string
    precio: number
    area?: string
    familia?: string
    tipo?: string
    descripcion?: string
    esPaquete?: boolean
    norma?: string
}

interface EnsayoAsociado {
    id: number
    productoId: number
    sku: string
    nombre: string
    norma?: string
    cantidad: number
    observacion: string
    estadoOperativo: string
}

interface RCMData {
    id: number
    rcmType: string
    numeroTarjeta: string
    tipoMaterial: string
    item: string
    ensayos: EnsayoAsociado[]
    fechaServicio: string
    fechaMuestreo?: string
    tomaMuestra?: string
    cantidadMuestras: string
    numeroRcm?: string
    estado: string
    tieneVencimiento?: boolean
    submuestrasVencimiento?: Array<{
        id: number
        submuestra: string
        numero: number
        dias: number
        fechaVencimiento: string
        cantidad: number
    }>
}

interface Step2CreateRcmsProps {
    ensayosAsociados: EnsayoAsociado[]
    setEnsayosAsociados: React.Dispatch<React.SetStateAction<EnsayoAsociado[]>>
    savedRcms: RCMData[]
    setSavedRcms: React.Dispatch<React.SetStateAction<RCMData[]>>
    otData?: any
    selectedAreaNombre?: string
}

const Step2CreateRcms = ({ ensayosAsociados, setEnsayosAsociados, savedRcms, setSavedRcms, otData, selectedAreaNombre }: Step2CreateRcmsProps) => {
    // Función para obtener fecha de hoy en formato YYYY-MM-DD (para input type='date')
    const getTodayDateForInput = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Función para obtener fecha de servicio desde la OT en formato YYYY-MM-DD
    const getFechaServicioForInput = () => {
        if (otData?.fechaServicio) {
            // Si la fecha viene en formato ISO, extraer solo la parte de fecha
            const dateMatch = otData.fechaServicio.match(/^(\d{4})-(\d{2})-(\d{2})/)
            if (dateMatch) {
                return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
            }
            return otData.fechaServicio
        }
        return getTodayDateForInput()
    }

    // Estados para las fechas
    const [fechaCodificacion] = useState(getTodayDateForInput())
    const [fechaServicio, setFechaServicio] = useState(getFechaServicioForInput())
    const [fechaIngreso, setFechaIngreso] = useState(getTodayDateForInput())
    const [fechaEntrega, setFechaEntrega] = useState('')

    const [expandedRcm, setExpandedRcm] = useState(true)
    const [showRcmCard, setShowRcmCard] = useState(false)
    const [rcmType, setRcmType] = useState('')
    const [area, setArea] = useState('')
    const [numeroTarjeta, setNumeroTarjeta] = useState('')
    const [tomaMuestra, setTomaMuestra] = useState('')
    const [tipoMaterial, setTipoMaterial] = useState('')
    const [item, setItem] = useState('')
    const [elemento, setElemento] = useState('')
    const [grado, setGrado] = useState('')
    const [calicata, setCalicata] = useState('')
    const [estrato, setEstrato] = useState('')
    const [cota1, setCota1] = useState('')
    const [cota2, setCota2] = useState('')
    const [procedencia, setProcedencia] = useState('')
    const [ubicacionSector, setUbicacionSector] = useState('')
    const [cantidadMuestras, setCantidadMuestras] = useState('1')
    const [informeEnsayo, setInformeEnsayo] = useState(true)
    const [expandedSavedRcms, setExpandedSavedRcms] = useState<Record<number, boolean>>({})
    const [rcmMenuAnchor, setRcmMenuAnchor] = useState<HTMLElement | null>(null)
    const [selectedRcmId, setSelectedRcmId] = useState<number | null>(null)
    const [isEditingRcm, setIsEditingRcm] = useState(false)
    const [editingRcmId, setEditingRcmId] = useState<number | null>(null)
    const [originalRcm, setOriginalRcm] = useState<RCMData | null>(null)
    const [showEditWarning, setShowEditWarning] = useState(false)
    const [showConfirmNewRcm, setShowConfirmNewRcm] = useState(false)

    // Estados para vencimiento
    const [tieneVencimiento, setTieneVencimiento] = useState(false)
    const [submuestrasVencimiento, setSubmuestrasVencimiento] = useState<Array<{
        id: number
        submuestra: string
        numero: number
        dias: number
        fechaVencimiento: string
        cantidad: number
    }>>([])
    const [errorVencimiento, setErrorVencimiento] = useState('')

    // Estados para el popover de búsqueda de productos
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [statusMenuAnchor, setStatusMenuAnchor] = useState<HTMLElement | null>(null)
    const [selectedEnsayoId, setSelectedEnsayoId] = useState<number | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [productsPage, setProductsPage] = useState(0)
    const [allProductos, setAllProductos] = useState<ProductoType[]>([]) // Todos los productos
    const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([])
    const [familias, setFamilias] = useState<Array<{ id: number; nombre: string }>>([])
    const [tipos, setTipos] = useState<string[]>([])
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
    const [selectedTipo, setSelectedTipo] = useState('')
    const [selectedFamilia, setSelectedFamilia] = useState('')
    const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
    const [totalProductos, setTotalProductos] = useState(0)
    const [paginatedProductos, setPaginatedProductos] = useState<ProductoType[]>([]) // Productos de la página actual
    const [filterResetKey, setFilterResetKey] = useState(0)

    const handleDuplicateLastRcm = () => {
        // TODO: Implementar lógica para duplicar último RCM
        console.log('Duplicar último RCM')
    }

    const handleNewRcm = () => {
        // Validar si hay un RCM en EDICIÓN (editando un RCM guardado)
        if (isEditingRcm) {
            setShowEditWarning(true)
            return
        }

        // Si hay un RCM en CREACIÓN (nuevo RCM sin guardar), mostrar confirmación
        if (showRcmCard && !isEditingRcm) {
            setShowConfirmNewRcm(true)
            return
        }

        // Si no hay RCM en proceso, crear uno nuevo directamente
        createNewRcm()
    }

    const createNewRcm = () => {
        setShowRcmCard(true)
        setRcmType('')
        setArea('')
        setNumeroTarjeta('')
        setTomaMuestra('')
        setTipoMaterial('')
        setItem('')
        setElemento('')
        setGrado('')
        setCalicata('')
        setEstrato('')
        setCota1('')
        setCota2('')
        setProcedencia('')
        setUbicacionSector('')
        setCantidadMuestras('1')
        setEnsayosAsociados([])
        setFechaServicio(getFechaServicioForInput())
        setFechaIngreso(getTodayDateForInput())
        setFechaEntrega('')
        setExpandedRcm(true)

        // Resetear vencimiento
        const shouldHaveVencimiento = selectedAreaNombre?.toLowerCase() === 'hormigón' || selectedAreaNombre?.toLowerCase() === 'elementos y componentes'
        setTieneVencimiento(shouldHaveVencimiento)
        setSubmuestrasVencimiento([])
    }

    const handleConfirmNewRcm = () => {
        setShowConfirmNewRcm(false)
        createNewRcm()
    }

    const handleCancelNewRcm = () => {
        setShowConfirmNewRcm(false)
    }

    const handleCancelEdit = () => {
        // Si estamos editando un RCM, restaurarlo a la lista con sus datos originales
        if (isEditingRcm && editingRcmId !== null && originalRcm !== null) {
            setSavedRcms([...savedRcms, originalRcm])
            setOriginalRcm(null)
        }

        // Cerrar el formulario y limpiar estados
        setShowRcmCard(false)
        setRcmType('')
        setArea('')
        setNumeroTarjeta('')
        setTomaMuestra('')
        setTipoMaterial('')
        setItem('')
        setElemento('')
        setGrado('')
        setCalicata('')
        setEstrato('')
        setCota1('')
        setCota2('')
        setProcedencia('')
        setUbicacionSector('')
        setCantidadMuestras('1')
        setEnsayosAsociados([])
        setTieneVencimiento(false)
        setSubmuestrasVencimiento([])
        setErrorVencimiento('')

        // Limpiar estado de edición
        setIsEditingRcm(false)
        setEditingRcmId(null)
    }

    const handleSaveRcm = () => {
        // Validación 1: Número de tarjeta obligatorio para tipo Muestra
        if (rcmType === 'Muestra' && !numeroTarjeta.trim()) {
            setErrorVencimiento('El número de tarjeta es obligatorio para RCM tipo Muestra')
            return
        }

        // Validación 2: Al menos un ensayo asociado
        if (ensayosAsociados.length === 0) {
            setErrorVencimiento('Debe agregar al menos un ensayo antes de guardar el RCM')
            return
        }

        // Validar submuestras si el vencimiento está activado
        if (tieneVencimiento) {
            // Validación: Al menos una submuestra obligatoria
            if (submuestrasVencimiento.length === 0) {
                setErrorVencimiento('Debe agregar al menos una submuestra cuando el vencimiento está activado')
                return
            }

            // Validación: La suma de cantidades debe coincidir con Cantidad de Muestras
            const sumaCantidades = submuestrasVencimiento.reduce((sum, sub) => sum + sub.cantidad, 0)
            const cantidadRequerida = parseInt(cantidadMuestras) || 0

            if (sumaCantidades !== cantidadRequerida) {
                setErrorVencimiento(`La suma de cantidades de submuestras (${sumaCantidades}) debe coincidir con la Cantidad de Muestras (${cantidadRequerida})`)
                return
            }
        }

        // Limpiar error si pasó las validaciones
        setErrorVencimiento('')

        // Limpiar estado de edición
        setIsEditingRcm(false)
        setEditingRcmId(null)
        setOriginalRcm(null)

        // Determinar el estado según el tipo de RCM
        let estadoRcm = 'Codificado' // Por defecto
        if (rcmType === 'Muestra') {
            estadoRcm = 'Codificado'
        } else if (rcmType === 'Control') {
            estadoRcm = 'Ensayado'
        } else if (rcmType === 'Servicio') {
            estadoRcm = 'Codificado' // O el estado que corresponda para Servicio
        }

        const newRcm: RCMData = {
            id: Date.now(),
            rcmType,
            numeroTarjeta,
            tipoMaterial,
            item,
            ensayos: [...ensayosAsociados],
            fechaServicio,
            fechaMuestreo: fechaServicio, // Usar fecha servicio como fecha muestreo
            tomaMuestra,
            cantidadMuestras,
            numeroRcm: `RCM-${savedRcms.length + 1}`,
            estado: estadoRcm,
            tieneVencimiento,
            submuestrasVencimiento: [...submuestrasVencimiento]
        }
        setSavedRcms([...savedRcms, newRcm])
        setShowRcmCard(false)
        setRcmType('')
        setArea('')
        setNumeroTarjeta('')
        setTomaMuestra('')
        setTipoMaterial('')
        setItem('')
        setElemento('')
        setGrado('')
        setCalicata('')
        setEstrato('')
        setCota1('')
        setCota2('')
        setProcedencia('')
        setUbicacionSector('')
        setCantidadMuestras('1')
        setEnsayosAsociados([])
        setTieneVencimiento(false)
        setSubmuestrasVencimiento([])
    }

    const handleToggleExpand = () => {
        setExpandedRcm(!expandedRcm)
    }

    const handleToggleSavedRcm = (id: number) => {
        setExpandedSavedRcms(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const handleOpenRcmMenu = (event: React.MouseEvent<HTMLElement>, rcmId: number) => {
        event.stopPropagation()
        setRcmMenuAnchor(event.currentTarget)
        setSelectedRcmId(rcmId)
    }

    const handleCloseRcmMenu = () => {
        setRcmMenuAnchor(null)
        setSelectedRcmId(null)
    }

    const handleEditRcm = () => {
        if (selectedRcmId !== null) {
            const rcmToEdit = savedRcms.find(r => r.id === selectedRcmId)
            if (rcmToEdit) {
                // Guardar el RCM completo original para poder restaurarlo si se cancela
                setOriginalRcm({ ...rcmToEdit })

                // Cargar los datos del RCM en el formulario
                setRcmType(rcmToEdit.rcmType)
                setNumeroTarjeta(rcmToEdit.numeroTarjeta)
                setTipoMaterial(rcmToEdit.tipoMaterial)
                setItem(rcmToEdit.item)
                setTomaMuestra(rcmToEdit.tomaMuestra || '')
                setCantidadMuestras(rcmToEdit.cantidadMuestras)
                setFechaServicio(rcmToEdit.fechaServicio)
                setEnsayosAsociados([...rcmToEdit.ensayos])

                // Cargar estados de vencimiento
                setTieneVencimiento(rcmToEdit.tieneVencimiento || false)
                setSubmuestrasVencimiento(rcmToEdit.submuestrasVencimiento || [])

                // Establecer estado de edición
                setIsEditingRcm(true)
                setEditingRcmId(selectedRcmId)

                // Eliminar el RCM de la lista de guardados (se volverá a guardar al editar)
                setSavedRcms(savedRcms.filter(r => r.id !== selectedRcmId))

                // Mostrar el formulario
                setShowRcmCard(true)
                setExpandedRcm(true)
            }
        }
        handleCloseRcmMenu()
    }

    const handleDeleteRcm = () => {
        if (selectedRcmId !== null) {
            setSavedRcms(savedRcms.filter(r => r.id !== selectedRcmId))
        }
        handleCloseRcmMenu()
    }

    const handleDuplicateRcm = () => {
        // Validar si hay un RCM en edición
        if (isEditingRcm) {
            setShowEditWarning(true)
            handleCloseRcmMenu()
            return
        }

        if (selectedRcmId !== null) {
            const rcmToDuplicate = savedRcms.find(r => r.id === selectedRcmId)
            if (rcmToDuplicate) {
                // Cargar los datos del RCM en el formulario (similar a editar)
                setRcmType(rcmToDuplicate.rcmType)
                setNumeroTarjeta('') // Forzar a ingresar un nuevo número de tarjeta
                setTipoMaterial(rcmToDuplicate.tipoMaterial)
                setItem(rcmToDuplicate.item)
                setTomaMuestra(rcmToDuplicate.tomaMuestra || '')
                setCantidadMuestras(rcmToDuplicate.cantidadMuestras)
                setFechaServicio(rcmToDuplicate.fechaServicio)
                setEnsayosAsociados([...rcmToDuplicate.ensayos])

                // Cargar estados de vencimiento
                setTieneVencimiento(rcmToDuplicate.tieneVencimiento || false)
                setSubmuestrasVencimiento(rcmToDuplicate.submuestrasVencimiento || [])

                // NO eliminar el RCM original de la lista (a diferencia de editar)
                // El RCM duplicado será un nuevo RCM cuando se guarde

                // Mostrar el formulario
                setShowRcmCard(true)
                setExpandedRcm(true)
            }
        }
        handleCloseRcmMenu()
    }

    const handleOpenSearchPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)

        // Pre-seleccionar el área del RCM si está definida
        if (area && areas.length > 0) {
            // Buscar el área que coincida con el valor del RCM
            const areaEncontrada = areas.find(a =>
                a.nombre.toLowerCase() === area.toLowerCase() ||
                a.nombre.toLowerCase().includes(area.toLowerCase())
            )
            if (areaEncontrada) {
                setSelectedAreaId(areaEncontrada.id)
            }
        }
    }

    const handleCloseSearchPopover = () => {
        setAnchorEl(null)
        setSearchTerm('')
        setProductsPage(0)
        // Mantener el área seleccionada del RCM
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        setProductsPage(0)
    }

    const handleAreaChange = (event: any) => {
        const areaId = event.target.value ? Number(event.target.value) : null
        setSelectedAreaId(areaId)
        setSelectedTipo('')
        setSelectedFamilia('')
        setProductsPage(0)
    }

    const handleTipoChange = (event: any) => {
        setSelectedTipo(event.target.value)
        setProductsPage(0)
    }

    const handleFamiliaChange = (event: any) => {
        setSelectedFamilia(event.target.value)
        setProductsPage(0)
    }

    const handleShowOnlyPaquetesChange = () => {
        setShowOnlyPaquetes(!showOnlyPaquetes)
        setProductsPage(0)
    }

    const handleClearFilters = () => {
        setSelectedAreaId(null)
        setSelectedTipo('')
        setSelectedFamilia('')
        setSearchTerm('')
        setProductsPage(0)
        setFilterResetKey(prev => prev + 1)
    }

    const handleSelectProduct = (producto: ProductoType) => {
        console.log('=== handleSelectProduct ===')
        console.log('Producto seleccionado:', producto)

        // Usar productoId o id según lo que tenga el producto
        const idProducto = (producto as any).productoId || producto.id
        console.log('ID del producto:', idProducto)

        setEnsayosAsociados(prev => {
            console.log('Estado anterior ensayos:', prev)

            // Verificar si el producto ya está en la lista
            const yaExiste = prev.some(e => e.productoId === idProducto)
            if (yaExiste) {
                console.log('El ensayo ya está agregado, no se agrega')
                return prev
            }

            // Agregar el producto a la lista de ensayos
            const nuevoEnsayo: EnsayoAsociado = {
                id: Date.now(), // ID temporal
                productoId: idProducto,
                sku: producto.sku,
                nombre: producto.nombre,
                norma: producto.norma,
                cantidad: 1,
                observacion: '',
                estadoOperativo: 'Codificado'
            }

            const nuevaLista = [...prev, nuevoEnsayo]
            console.log('Nueva lista de ensayos:', nuevaLista)
            return nuevaLista
        })

        handleCloseSearchPopover()
    }

    const handleDeleteEnsayo = (ensayoId: number) => {
        setEnsayosAsociados(ensayosAsociados.filter(e => e.id !== ensayoId))
    }

    const handleChangeCantidad = (ensayoId: number, cantidad: number) => {
        setEnsayosAsociados(ensayosAsociados.map(e =>
            e.id === ensayoId ? { ...e, cantidad } : e
        ))
    }

    const handleChangeObservacion = (ensayoId: number, observacion: string) => {
        setEnsayosAsociados(ensayosAsociados.map(e =>
            e.id === ensayoId ? { ...e, observacion } : e
        ))
    }

    const handleChangeEstadoOperativo = (ensayoId: number, estadoOperativo: string) => {
        setEnsayosAsociados(ensayosAsociados.map(e =>
            e.id === ensayoId ? { ...e, estadoOperativo } : e
        ))
    }

    const handleOpenStatusMenu = (event: React.MouseEvent<HTMLElement>, ensayoId: number) => {
        setStatusMenuAnchor(event.currentTarget)
        setSelectedEnsayoId(ensayoId)
    }

    const handleCloseStatusMenu = () => {
        setStatusMenuAnchor(null)
        setSelectedEnsayoId(null)
    }

    const handleSelectStatus = (status: string) => {
        if (selectedEnsayoId !== null) {
            handleChangeEstadoOperativo(selectedEnsayoId, status)
        }
        handleCloseStatusMenu()
    }

    // Activar vencimiento automáticamente cuando el área es Hormigón o Elementos y Componentes
    useEffect(() => {
        const shouldHaveVencimiento =
            selectedAreaNombre?.toLowerCase() === 'hormigón' ||
            selectedAreaNombre?.toLowerCase() === 'elementos y componentes'

        if (shouldHaveVencimiento) {
            setTieneVencimiento(true)
        }
    }, [selectedAreaNombre])

    // Cargar áreas
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await fetch('/api/areas')
                if (response.ok) {
                    const data = await response.json()
                    setAreas(data)

                    // Si el popover está abierto y hay un área seleccionada en el RCM, pre-seleccionarla
                    if (anchorEl && area && data.length > 0) {
                        const areaEncontrada = data.find((a: { nombre: string }) =>
                            a.nombre.toLowerCase() === area.toLowerCase() ||
                            a.nombre.toLowerCase().includes(area.toLowerCase())
                        )
                        if (areaEncontrada) {
                            setSelectedAreaId(areaEncontrada.id)
                        }
                    }
                }
            } catch (error) {
                console.error('Error al cargar áreas:', error)
            }
        }
        fetchAreas()
    }, [])

    // Cargar familias cuando cambia el área
    useEffect(() => {
        if (!selectedAreaId) {
            setFamilias([])
            return
        }

        const fetchFamilias = async () => {
            try {
                const response = await fetch(`/api/familias?areaId=${selectedAreaId}`)
                if (response.ok) {
                    const data = await response.json()
                    setFamilias(data)
                }
            } catch (error) {
                console.error('Error al cargar familias:', error)
            }
        }
        fetchFamilias()
    }, [selectedAreaId])

    // Cargar productos con filtros
    useEffect(() => {
        if (!anchorEl) return

        const fetchProductos = async () => {
            try {
                const params = new URLSearchParams({
                    page: productsPage.toString(),
                    limit: ITEMS_PER_PAGE.toString()
                })

                if (searchTerm) params.append('q', searchTerm)
                // Filtrar por el área seleccionada en el paso 1
                if (selectedAreaNombre) params.append('area', selectedAreaNombre)
                if (showOnlyPaquetes) params.append('esPaquete', 'true')

                console.log('Cargando productos con params:', params.toString())
                const response = await fetch(`/api/productos/search?${params.toString()}`)

                if (response.ok) {
                    const data = await response.json()
                    console.log('Productos cargados:', data)

                    // La API devuelve directamente el array o un objeto con productos
                    const productosArray = Array.isArray(data) ? data : (data.productos || [])

                    console.log('Array de productos:', productosArray)
                    console.log('Cantidad de productos:', productosArray.length)

                    setAllProductos(productosArray)
                    setTotalProductos(productosArray.length)
                } else {
                    console.error('Error en la respuesta:', response.status)
                }
            } catch (error) {
                console.error('Error al cargar productos:', error)
            }
        }

        fetchProductos()
    }, [anchorEl, searchTerm, selectedAreaNombre, showOnlyPaquetes])

    // Aplicar paginación local
    useEffect(() => {
        const startIndex = productsPage * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginated = allProductos.slice(startIndex, endIndex)
        setPaginatedProductos(paginated)
    }, [allProductos, productsPage])

    return (
        <Card>
            <Box sx={{ p: 6 }}>
                {/* Fila superior: Título y Botones */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
                    {/* Título y subtítulo */}
                    <Box>
                        <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 1 }}>
                            Paso 2: Crear RCMs (Registro de Control de Muestras)
                        </Typography>
                        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                            Registre las muestras, controles o servicios recolectados en terreno
                        </Typography>
                    </Box>

                    {/* Botones */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant='outlined'
                            startIcon={<ContentCopyIcon />}
                            onClick={handleDuplicateLastRcm}
                            sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                px: 3,
                                color: '#9C27B0',
                                borderColor: '#9C27B0',
                                '&:hover': {
                                    borderColor: '#7B1FA2',
                                    bgcolor: 'rgba(156, 39, 176, 0.04)'
                                }
                            }}
                        >
                            Duplicar último RCM
                        </Button>
                        <Button
                            variant='contained'
                            color='primary'
                            startIcon={<AddIcon />}
                            onClick={handleNewRcm}
                            sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
                        >
                            Nuevo RCM
                        </Button>
                    </Box>
                </Box>

                {/* RCM Card */}
                {showRcmCard && (
                    <Box
                        sx={{
                            bgcolor: '#E3F2FD',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header del RCM */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                bgcolor: '#E3F2FD'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <IconButton size='small' onClick={handleToggleExpand}>
                                    <ExpandMoreIcon
                                        sx={{
                                            transform: expandedRcm ? 'rotate(0deg)' : 'rotate(-90deg)',
                                            transition: 'transform 0.3s'
                                        }}
                                    />
                                </IconButton>
                                {rcmType ? (
                                    <Chip label={rcmType.toUpperCase()} color='primary' sx={{ fontWeight: 'bold' }} />
                                ) : (
                                    <FormControl size='small' sx={{ minWidth: 150 }}>
                                        <InputLabel>Tipo de RCM</InputLabel>
                                        <Select
                                            value={rcmType}
                                            label='Tipo de RCM'
                                            onChange={(e) => setRcmType(e.target.value)}
                                            sx={{ bgcolor: 'white' }}
                                        >
                                            <MenuItem value='Muestra'>Muestra</MenuItem>
                                            <MenuItem value='Control'>Control</MenuItem>
                                            <MenuItem value='Servicio'>Servicio</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                                {numeroTarjeta && (
                                    <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                        Tarjeta: {numeroTarjeta}
                                    </Typography>
                                )}
                                {(tipoMaterial || item) && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                        <LayersIcon fontSize='small' />
                                        <Typography variant='body2'>
                                            {tipoMaterial && `Material: ${tipoMaterial}`}
                                            {tipoMaterial && item && ' • '}
                                            {item && `Ítem: ${item}`}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                            {isEditingRcm && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Checkbox />
                                    <IconButton size='small'>
                                        <MoreVertIcon />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>

                        {/* Contenido colapsable del RCM */}
                        <Collapse in={expandedRcm && rcmType !== ''}>
                            <Box sx={{ p: 3, bgcolor: 'white' }}>
                                {/* Campos principales */}
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            label='RCM'
                                            type='number'
                                            disabled
                                            fullWidth
                                            placeholder='Automático'
                                            InputProps={{
                                                readOnly: true
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            label='Fecha Codificación'
                                            type='date'
                                            value={fechaCodificacion}
                                            required
                                            fullWidth
                                            disabled
                                            InputLabelProps={{ shrink: true }}
                                            InputProps={{
                                                readOnly: true
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            label='Fecha de Servicio'
                                            type='date'
                                            value={fechaServicio}
                                            onChange={(e) => setFechaServicio(e.target.value)}
                                            required
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    {rcmType === 'Muestra' && (
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                label='Fecha de Ingreso'
                                                type='date'
                                                value={fechaIngreso}
                                                onChange={(e) => setFechaIngreso(e.target.value)}
                                                required
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                    )}
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            label='Fecha de Entrega'
                                            type='date'
                                            value={fechaEntrega}
                                            onChange={(e) => setFechaEntrega(e.target.value)}
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel id="area-label">Área</InputLabel>
                                            <Select
                                                labelId="area-label"
                                                label='Área'
                                                value={area}
                                                onChange={(e) => {
                                                    const valor = e.target.value as string
                                                    console.log('Área seleccionada:', valor)
                                                    setArea(valor)
                                                }}
                                            >
                                                <MenuItem value='suelos'>Suelos</MenuItem>
                                                <MenuItem value='hormigon'>Hormigón</MenuItem>
                                                <MenuItem value='asfalto'>Asfalto</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Tipo Servicio</InputLabel>
                                            <Select label='Tipo Servicio'>
                                                <MenuItem value='ensayo'>Ensayo</MenuItem>
                                                <MenuItem value='muestreo'>Muestreo</MenuItem>
                                                <MenuItem value='inspeccion'>Inspección</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Tipo de muestra</InputLabel>
                                            <Select label='Tipo de muestra'>
                                                <MenuItem value='muestra'>Muestra</MenuItem>
                                                <MenuItem value='control'>Control</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    {rcmType === 'Muestra' && (
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                label='Nº Tarjeta'
                                                value={numeroTarjeta}
                                                onChange={(e) => setNumeroTarjeta(e.target.value)}
                                                required
                                                fullWidth
                                            />
                                        </Grid>
                                    )}
                                    {rcmType === 'Muestra' && (
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                label='# Toma de Muestra'
                                                value={tomaMuestra}
                                                onChange={(e) => setTomaMuestra(e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                    )}
                                    {rcmType === 'Muestra' && (
                                        <Grid item xs={12} md={3}>
                                            <FormControl fullWidth>
                                                <InputLabel>Tipo Material</InputLabel>
                                                <Select
                                                    label='Tipo Material'
                                                    value={tipoMaterial}
                                                    onChange={(e) => setTipoMaterial(e.target.value)}
                                                >
                                                    <MenuItem value='Suelo granular'>Suelo granular</MenuItem>
                                                    <MenuItem value='Suelo cohesivo'>Suelo cohesivo</MenuItem>
                                                    <MenuItem value='Hormigón'>Hormigón</MenuItem>
                                                    <MenuItem value='Asfalto'>Asfalto</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    )}
                                    <Grid item xs={12} md={3}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Ítem</InputLabel>
                                            <Select
                                                label='Ítem'
                                                value={item}
                                                onChange={(e) => setItem(e.target.value)}
                                            >
                                                <MenuItem value='Base'>Base</MenuItem>
                                                <MenuItem value='Subbase'>Subbase</MenuItem>
                                                <MenuItem value='Subrasante'>Subrasante</MenuItem>
                                                <MenuItem value='Terraplén'>Terraplén</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    {rcmType === 'Muestra' && (selectedAreaNombre?.toLowerCase() === 'hormigón' || selectedAreaNombre?.toLowerCase() === 'elementos y componentes') && (
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                label='Elemento'
                                                value={elemento}
                                                onChange={(e) => setElemento(e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                    )}
                                    {rcmType === 'Muestra' && (selectedAreaNombre?.toLowerCase() === 'hormigón' || selectedAreaNombre?.toLowerCase() === 'elementos y componentes') && (
                                        <Grid item xs={12} md={3}>
                                            <FormControl fullWidth>
                                                <InputLabel>Grado</InputLabel>
                                                <Select
                                                    label='Grado'
                                                    value={grado}
                                                    onChange={(e) => setGrado(e.target.value)}
                                                >
                                                    <MenuItem value='1'>Grado 1</MenuItem>
                                                    <MenuItem value='2'>Grado 2</MenuItem>
                                                    <MenuItem value='3'>Grado 3</MenuItem>
                                                    <MenuItem value='4'>Grado 4</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    )}
                                    {rcmType === 'Muestra' && selectedAreaNombre?.toLowerCase() === 'suelo' && (
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                label='Calicata'
                                                type='number'
                                                value={calicata}
                                                onChange={(e) => setCalicata(e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                    )}
                                    {rcmType === 'Muestra' && selectedAreaNombre?.toLowerCase() === 'suelo' && (
                                        <Grid item xs={12} md={3}>
                                            <TextField
                                                label='Estrato'
                                                type='number'
                                                value={estrato}
                                                onChange={(e) => setEstrato(e.target.value)}
                                                fullWidth
                                            />
                                        </Grid>
                                    )}
                                    {rcmType === 'Muestra' && selectedAreaNombre?.toLowerCase() === 'suelo' && (
                                        <>
                                            <Grid item xs={12} md={3}>
                                                <TextField
                                                    label='Cota 1'
                                                    type='number'
                                                    value={cota1}
                                                    onChange={(e) => setCota1(e.target.value)}
                                                    fullWidth
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={3}>
                                                <TextField
                                                    label='Cota 2'
                                                    type='number'
                                                    value={cota2}
                                                    onChange={(e) => setCota2(e.target.value)}
                                                    fullWidth
                                                />
                                            </Grid>
                                        </>
                                    )}
                                    <Grid item xs={12} md={3}>
                                        <TextField
                                            label='Cantidad de Muestras'
                                            type='number'
                                            value={cantidadMuestras}
                                            onChange={(e) => {
                                                setErrorVencimiento('') // Limpiar error al modificar cantidad
                                                setCantidadMuestras(e.target.value)
                                            }}
                                            required
                                            fullWidth
                                        />
                                    </Grid>
                                    {rcmType === 'Muestra' && (
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                label='Procedencia'
                                                value={procedencia}
                                                onChange={(e) => setProcedencia(e.target.value)}
                                                fullWidth
                                                multiline
                                                rows={3}
                                            />
                                        </Grid>
                                    )}
                                    <Grid item xs={12} md={4}>
                                        <TextField
                                            label='Ubicación/Sector'
                                            value={ubicacionSector}
                                            onChange={(e) => setUbicacionSector(e.target.value)}
                                            fullWidth
                                            multiline
                                            rows={3}
                                        />
                                    </Grid>
                                    {/* <Grid item xs={12} md={4}>
                                        <FormControl fullWidth>
                                            <InputLabel>Estado</InputLabel>
                                            <Select label='Estado' defaultValue='codificado'>
                                                <MenuItem value='codificado'>Codificado</MenuItem>
                                                <MenuItem value='en_proceso'>En Proceso</MenuItem>
                                                <MenuItem value='ensayado'>Ensayado</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid> */}
                                    <Grid item xs={12} md={4}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={tieneVencimiento}
                                                    onChange={(e) => setTieneVencimiento(e.target.checked)}
                                                />
                                            }
                                            label='Vencimiento'
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={informeEnsayo}
                                                    onChange={(e) => setInformeEnsayo(e.target.checked)}
                                                />
                                            }
                                            label='Informe Ensayo'
                                        />
                                    </Grid>
                                </Grid>

                                {/* Ensayos Asociados */}
                                <Box sx={{ mt: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                            Ensayos Asociados
                                        </Typography>
                                        <Button
                                            startIcon={<SearchIcon />}
                                            variant='outlined'
                                            sx={{ textTransform: 'none' }}
                                            onClick={handleOpenSearchPopover}
                                        >
                                            Buscar ensayo
                                        </Button>
                                    </Box>

                                    {/* Tabla de ensayos */}
                                    {ensayosAsociados.length === 0 ? (
                                        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F5F5F5', borderRadius: '8px' }}>
                                            <Typography variant='body2' color='text.secondary'>
                                                No hay ensayos asociados. Haz clic en "Buscar ensayo" para agregar.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box sx={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#F5F5F5' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>SKU</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>Nombre</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '100px' }}>Cantidad</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '200px' }}>Observación</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '150px' }}>Estado Operativo</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '80px' }}>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ensayosAsociados.map(ensayo => (
                                                        <tr key={ensayo.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                                            <td style={{ padding: '12px' }}>
                                                                <Typography variant='body2' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                                    {ensayo.sku}
                                                                </Typography>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <Typography variant='body2'>
                                                                    {ensayo.nombre}
                                                                </Typography>
                                                                {ensayo.norma && (
                                                                    <Typography variant='caption' color='text.secondary'>
                                                                        {ensayo.norma}
                                                                    </Typography>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <TextField
                                                                    size='small'
                                                                    value={ensayo.cantidad}
                                                                    onChange={(e) => handleChangeCantidad(ensayo.id, parseInt(e.target.value) || 0)}
                                                                    type='number'
                                                                    sx={{ width: '80px' }}
                                                                    inputProps={{ min: 1 }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <TextField
                                                                    size='small'
                                                                    fullWidth
                                                                    value={ensayo.observacion}
                                                                    onChange={(e) => handleChangeObservacion(ensayo.id, e.target.value)}
                                                                    placeholder='Observación...'
                                                                />
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <Chip
                                                                    label={ensayo.estadoOperativo}
                                                                    size='small'
                                                                    onClick={(e) => handleOpenStatusMenu(e, ensayo.id)}
                                                                    color={
                                                                        ensayo.estadoOperativo === 'Codificado' ? 'default' :
                                                                            ensayo.estadoOperativo === 'En Proceso' ? 'info' :
                                                                                ensayo.estadoOperativo === 'Ensayado' ? 'warning' :
                                                                                    'success'
                                                                    }
                                                                    sx={{ cursor: 'pointer' }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <IconButton
                                                                    size='small'
                                                                    color='error'
                                                                    onClick={() => handleDeleteEnsayo(ensayo.id)}
                                                                >
                                                                    <DeleteIcon fontSize='small' />
                                                                </IconButton>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Box>
                                    )}

                                    {/* Menu para seleccionar estado operativo */}
                                    <Menu
                                        anchorEl={statusMenuAnchor}
                                        open={Boolean(statusMenuAnchor)}
                                        onClose={handleCloseStatusMenu}
                                    >
                                        <MenuItem onClick={() => handleSelectStatus('Codificado')}>
                                            <Chip
                                                label='Codificado'
                                                size='small'
                                                color='default'
                                            />
                                        </MenuItem>
                                        <MenuItem onClick={() => handleSelectStatus('En Proceso')}>
                                            <Chip
                                                label='En Proceso'
                                                size='small'
                                                color='info'
                                            />
                                        </MenuItem>
                                        <MenuItem onClick={() => handleSelectStatus('Ensayado')}>
                                            <Chip
                                                label='Ensayado'
                                                size='small'
                                                color='warning'
                                            />
                                        </MenuItem>
                                    </Menu>
                                </Box>

                                {/* Tabla de Submuestras con Vencimiento */}
                                {tieneVencimiento && (
                                    <Box sx={{ mt: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Box>
                                                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                                    Submuestras con Vencimiento
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                                    <Typography variant='body2' color='text.secondary'>
                                                        Cantidad requerida: {cantidadMuestras}
                                                    </Typography>
                                                    <Typography
                                                        variant='body2'
                                                        sx={{
                                                            color: submuestrasVencimiento.reduce((sum, sub) => sum + sub.cantidad, 0) === parseInt(cantidadMuestras || '0')
                                                                ? 'success.main'
                                                                : 'warning.main',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        Suma actual: {submuestrasVencimiento.reduce((sum, sub) => sum + sub.cantidad, 0)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                startIcon={<AddIcon />}
                                                variant='outlined'
                                                size='small'
                                                sx={{ textTransform: 'none' }}
                                                onClick={() => {
                                                    setErrorVencimiento('') // Limpiar error al agregar
                                                    const newId = submuestrasVencimiento.length > 0
                                                        ? Math.max(...submuestrasVencimiento.map(s => s.id)) + 1
                                                        : 1
                                                    const newNumero = submuestrasVencimiento.length + 1
                                                    setSubmuestrasVencimiento([...submuestrasVencimiento, {
                                                        id: newId,
                                                        submuestra: `RCM - ${newNumero}`,
                                                        numero: newNumero,
                                                        dias: 0,
                                                        fechaVencimiento: '',
                                                        cantidad: 1
                                                    }])
                                                }}
                                            >
                                                Agregar Submuestra
                                            </Button>
                                        </Box>

                                        {submuestrasVencimiento.length === 0 ? (
                                            <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#F5F5F5', borderRadius: '8px' }}>
                                                <Typography variant='body2' color='text.secondary'>
                                                    No hay submuestras. Haz clic en "Agregar Submuestra" para añadir.
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ backgroundColor: '#F5F5F5' }}>
                                                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '200px' }}>Submuestra</th>
                                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '80px' }}>#</th>
                                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Días</th>
                                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '200px' }}>Fecha Vencimiento</th>
                                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Cantidad</th>
                                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '100px' }}>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {submuestrasVencimiento.map((submuestra) => (
                                                            <tr key={submuestra.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                                                <td style={{ padding: '12px' }}>
                                                                    <Typography variant='body2'>
                                                                        {submuestra.submuestra}
                                                                    </Typography>
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <Typography variant='body2'>
                                                                        {submuestra.numero}
                                                                    </Typography>
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <TextField
                                                                        size='small'
                                                                        type='number'
                                                                        value={submuestra.dias}
                                                                        onChange={(e) => {
                                                                            const dias = parseInt(e.target.value) || 0
                                                                            const fechaBase = new Date(fechaServicio || getTodayDateForInput())
                                                                            fechaBase.setDate(fechaBase.getDate() + dias)
                                                                            const fechaVenc = `${fechaBase.getFullYear()}-${String(fechaBase.getMonth() + 1).padStart(2, '0')}-${String(fechaBase.getDate()).padStart(2, '0')}`

                                                                            setSubmuestrasVencimiento(submuestrasVencimiento.map(s =>
                                                                                s.id === submuestra.id
                                                                                    ? { ...s, dias, fechaVencimiento: fechaVenc }
                                                                                    : s
                                                                            ))
                                                                        }}
                                                                        sx={{ width: '100px' }}
                                                                        inputProps={{ min: 0 }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <Typography variant='body2' color='text.secondary'>
                                                                        {submuestra.fechaVencimiento ? formatDateOnly(submuestra.fechaVencimiento) : 'Calculada'}
                                                                    </Typography>
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <TextField
                                                                        size='small'
                                                                        type='number'
                                                                        value={submuestra.cantidad}
                                                                        onChange={(e) => {
                                                                            setErrorVencimiento('') // Limpiar error al modificar
                                                                            const cantidad = parseInt(e.target.value) || 1
                                                                            setSubmuestrasVencimiento(submuestrasVencimiento.map(s =>
                                                                                s.id === submuestra.id
                                                                                    ? { ...s, cantidad }
                                                                                    : s
                                                                            ))
                                                                        }}
                                                                        sx={{ width: '100px' }}
                                                                        inputProps={{ min: 1 }}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <IconButton
                                                                        size='small'
                                                                        onClick={() => {
                                                                            // TODO: Implementar edición
                                                                        }}
                                                                    >
                                                                        <EditIcon fontSize='small' />
                                                                    </IconButton>
                                                                    <IconButton
                                                                        size='small'
                                                                        color='error'
                                                                        onClick={() => {
                                                                            setErrorVencimiento('') // Limpiar error al eliminar
                                                                            setSubmuestrasVencimiento(submuestrasVencimiento.filter(s => s.id !== submuestra.id))
                                                                        }}
                                                                    >
                                                                        <DeleteIcon fontSize='small' />
                                                                    </IconButton>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                {/* Observaciones */}
                                <Box sx={{ mt: 4 }}>
                                    <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
                                        Observaciones
                                    </Typography>
                                    <TextField
                                        multiline
                                        rows={3}
                                        fullWidth
                                    />
                                </Box>

                                {/* Botón Guardar RCM */}
                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        variant='outlined'
                                        color='error'
                                        sx={{ textTransform: 'none', px: 4 }}
                                        onClick={handleCancelEdit}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant='contained'
                                        color='primary'
                                        sx={{ textTransform: 'none', px: 4 }}
                                        onClick={handleSaveRcm}
                                    >
                                        Guardar RCM
                                    </Button>
                                </Box>
                            </Box>
                        </Collapse>
                    </Box>
                )}

                {/* Lista de RCMs guardados */}
                {savedRcms.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                            RCMs Creados ({savedRcms.length})
                        </Typography>
                        {savedRcms.map(rcm => (
                            <Box
                                key={rcm.id}
                                sx={{
                                    bgcolor: '#E3F2FD',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    mb: 2
                                }}
                            >
                                {/* Header del RCM guardado */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 2,
                                        bgcolor: '#E3F2FD',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleToggleSavedRcm(rcm.id)}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                        <IconButton size='small'>
                                            <ExpandMoreIcon
                                                sx={{
                                                    transform: expandedSavedRcms[rcm.id] ? 'rotate(0deg)' : 'rotate(-90deg)',
                                                    transition: 'transform 0.3s'
                                                }}
                                            />
                                        </IconButton>
                                        <Chip
                                            label={rcm.rcmType.toUpperCase()}
                                            color={rcm.rcmType === 'Muestra' ? 'primary' : rcm.rcmType === 'Control' ? 'secondary' : 'default'}
                                            sx={{ fontWeight: 'bold' }}
                                        />

                                        {/* Mostrar estado del RCM */}
                                        <Chip
                                            label={rcm.estado}
                                            size='small'
                                            color={rcm.estado === 'Codificado' ? 'default' : rcm.estado === 'Ensayado' ? 'warning' : 'info'}
                                            sx={{ fontWeight: 500 }}
                                        />

                                        {/* Mostrar campos según el tipo de RCM */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                            {/* Número de RCM */}
                                            {rcm.numeroRcm && (
                                                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                    {rcm.numeroRcm}
                                                </Typography>
                                            )}

                                            {/* MUESTRA: #n | N° Tarjeta | Fecha Muestreo | #Toma de Muestra | Material | Item | Cantidad */}
                                            {rcm.rcmType === 'Muestra' && (
                                                <>
                                                    {rcm.numeroTarjeta && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>N° Tarjeta: {rcm.numeroTarjeta}</Typography>
                                                        </>
                                                    )}
                                                    {rcm.fechaMuestreo && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>Fecha Muestreo: {formatDateOnly(rcm.fechaMuestreo)}</Typography>
                                                        </>
                                                    )}
                                                    {rcm.tomaMuestra && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>#Toma: {rcm.tomaMuestra}</Typography>
                                                        </>
                                                    )}
                                                    {rcm.tipoMaterial && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>Material: {rcm.tipoMaterial}</Typography>
                                                        </>
                                                    )}
                                                    {rcm.item && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>Item: {rcm.item}</Typography>
                                                        </>
                                                    )}
                                                    {rcm.cantidadMuestras && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>Cantidad: {rcm.cantidadMuestras}</Typography>
                                                        </>
                                                    )}
                                                </>
                                            )}

                                            {/* CONTROL: #n | Fecha Servicio | Item | Cantidad */}
                                            {rcm.rcmType === 'Control' && (
                                                <>
                                                    {rcm.fechaServicio && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>Fecha Servicio: {formatDateOnly(rcm.fechaServicio)}</Typography>
                                                        </>
                                                    )}
                                                    {rcm.item && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>Item: {rcm.item}</Typography>
                                                        </>
                                                    )}
                                                    {rcm.cantidadMuestras && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>Cantidad: {rcm.cantidadMuestras}</Typography>
                                                        </>
                                                    )}
                                                </>
                                            )}

                                            {/* SERVICIO: #n | Fecha Servicio */}
                                            {rcm.rcmType === 'Servicio' && (
                                                <>
                                                    {rcm.fechaServicio && (
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>Fecha Servicio: {formatDateOnly(rcm.fechaServicio)}</Typography>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                                        <IconButton size='small' onClick={(e) => handleOpenRcmMenu(e, rcm.id)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    </Box>
                                </Box>

                                {/* Contenido expandible del RCM guardado */}
                                <Collapse in={expandedSavedRcms[rcm.id]}>
                                    <Box sx={{ p: 3, bgcolor: 'white' }}>
                                        <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2 }}>
                                            Ensayos Asociados ({rcm.ensayos.length})
                                        </Typography>
                                        <Box sx={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#F5F5F5' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>SKU</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>Nombre</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '100px' }}>Cantidad</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0' }}>Observación</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '150px' }}>Estado Operativo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rcm.ensayos.map(ensayo => (
                                                        <tr key={ensayo.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                                            <td style={{ padding: '12px' }}>
                                                                <Typography variant='body2' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                                                    {ensayo.sku}
                                                                </Typography>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <Typography variant='body2'>
                                                                    {ensayo.nombre}
                                                                </Typography>
                                                                {ensayo.norma && (
                                                                    <Typography variant='caption' color='text.secondary'>
                                                                        {ensayo.norma}
                                                                    </Typography>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                                    {ensayo.cantidad}
                                                                </Typography>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <Typography variant='body2' color='text.secondary'>
                                                                    {ensayo.observacion || '-'}
                                                                </Typography>
                                                            </td>
                                                            <td style={{ padding: '12px' }}>
                                                                <Chip
                                                                    label={ensayo.estadoOperativo}
                                                                    size='small'
                                                                    color={
                                                                        ensayo.estadoOperativo === 'Codificado' ? 'default' :
                                                                            ensayo.estadoOperativo === 'En Proceso' ? 'info' :
                                                                                ensayo.estadoOperativo === 'Ensayado' ? 'warning' :
                                                                                    'success'
                                                                    }
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </Box>
                                    </Box>
                                </Collapse>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Menú de opciones para RCM guardado */}
                <Menu
                    anchorEl={rcmMenuAnchor}
                    open={Boolean(rcmMenuAnchor)}
                    onClose={handleCloseRcmMenu}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}
                >
                    <MenuItem onClick={handleEditRcm}>
                        <EditIcon fontSize='small' sx={{ mr: 1 }} />
                        Editar
                    </MenuItem>
                    <MenuItem onClick={handleDuplicateRcm}>
                        <ContentCopyIcon fontSize='small' sx={{ mr: 1 }} />
                        Duplicar
                    </MenuItem>
                    <MenuItem onClick={handleDeleteRcm} sx={{ color: 'error.main' }}>
                        <DeleteIcon fontSize='small' sx={{ mr: 1 }} />
                        Eliminar
                    </MenuItem>
                </Menu>


                {/* Popover de búsqueda de ensayos */}
                <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={handleCloseSearchPopover}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}
                    PaperProps={{
                        sx: {
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '400px',
                            overflow: 'auto',
                            zIndex: 1300
                        }
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            size='small'
                            placeholder='Buscar por nombre, descripción o norma...'
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                        {selectedAreaNombre && (
                            <Box sx={{ mt: 1 }}>
                                <Chip
                                    label={`Área: ${selectedAreaNombre}`}
                                    size='small'
                                    color='primary'
                                    variant='outlined'
                                />
                            </Box>
                        )}
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch checked={showOnlyPaquetes} onChange={handleShowOnlyPaquetesChange} size='small' />
                                }
                                label='Solo Paquetes'
                            />
                        </Box>
                    </Box>
                    <List sx={{ pt: 0 }}>
                        {paginatedProductos.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant='body2' color='text.secondary'>
                                    No se encontraron ensayos
                                </Typography>
                            </Box>
                        ) : (
                            paginatedProductos.map(producto => (
                                <ListItem
                                    key={producto.id}
                                    onClick={() => handleSelectProduct(producto)}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'action.hover'
                                        },
                                        flexDirection: 'column',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant='body1'>
                                                    {producto.nombre}
                                                    {producto.norma && (
                                                        <Typography component='span' color='text.secondary'>
                                                            {' '}
                                                            - {producto.norma}
                                                        </Typography>
                                                    )}
                                                </Typography>
                                                {producto.esPaquete && (
                                                    <Typography
                                                        variant='caption'
                                                        sx={{
                                                            backgroundColor: 'primary.main',
                                                            color: 'white',
                                                            px: 1,
                                                            py: 0.5,
                                                            borderRadius: 1,
                                                            ml: 1
                                                        }}
                                                    >
                                                        Paquete
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant='caption' color='text.secondary'>
                                                    {producto.area} {producto.tipo && `- ${producto.tipo}`} {producto.familia && `- ${producto.familia}`}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))
                        )}
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
                            Página {productsPage + 1} de {Math.max(1, Math.ceil(totalProductos / ITEMS_PER_PAGE))}
                        </Typography>
                        <Button
                            size='small'
                            onClick={() => setProductsPage(prev => prev + 1)}
                            disabled={(productsPage + 1) * ITEMS_PER_PAGE >= totalProductos}
                        >
                            Siguiente
                        </Button>
                    </Box>
                </Popover>

                {/* Snackbar flotante para mensajes de error */}
                <Snackbar
                    open={Boolean(errorVencimiento)}
                    autoHideDuration={6000}
                    onClose={() => setErrorVencimiento('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert
                        onClose={() => setErrorVencimiento('')}
                        severity='error'
                        variant='filled'
                        sx={{ width: '100%' }}
                    >
                        {errorVencimiento}
                    </Alert>
                </Snackbar>

                {/* Snackbar para advertencia de edición */}
                <Snackbar
                    open={showEditWarning}
                    autoHideDuration={5000}
                    onClose={() => setShowEditWarning(false)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        onClose={() => setShowEditWarning(false)}
                        severity='warning'
                        variant='filled'
                        sx={{ width: '100%' }}
                    >
                        Debe finalizar la edición del RCM actual antes de crear uno nuevo
                    </Alert>
                </Snackbar>

                {/* Dialog de confirmación para crear nuevo RCM */}
                <Dialog
                    open={showConfirmNewRcm}
                    onClose={handleCancelNewRcm}
                    maxWidth='sm'
                    fullWidth
                >
                    <DialogTitle sx={{ fontWeight: 600 }}>
                        ¿Crear nuevo RCM?
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Si crea un nuevo RCM, se perderá la información del RCM actual a menos que lo guarde primero.
                            ¿Desea continuar?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button
                            onClick={handleCancelNewRcm}
                            variant='outlined'
                            sx={{ textTransform: 'none' }}
                        >
                            Continuar creando
                        </Button>
                        <Button
                            onClick={handleConfirmNewRcm}
                            variant='contained'
                            color='primary'
                            sx={{ textTransform: 'none' }}
                        >
                            Crear nuevo
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Card>
    )
}

export default Step2CreateRcms
