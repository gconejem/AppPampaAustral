// MUI Imports
import React, { useState, useEffect, useRef, useCallback } from 'react'
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
    ListItemButton,
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
    DialogActions,
    Divider,
    Radio,
    RadioGroup
} from '@mui/material'
import { formatDateOnly } from '@/utils/dateUtils'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import InventoryIcon from '@mui/icons-material/Inventory'
import LayersIcon from '@mui/icons-material/Layers'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CloseIcon from '@mui/icons-material/Close'

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

interface SubProducto {
    id: number
    productoId: number
    sku: string
    nombre: string
    norma?: string
    cantidad: number
    observacion: string
    isEditing?: boolean
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
    esPaquete?: boolean
    subProductos?: SubProducto[]
    isEditing?: boolean
}

interface RCMData {
    id: number
    rcmType: string
    sede?: string
    area?: string
    tipoServicio?: string
    numeroTarjeta: string
    tipoMaterial: string
    item: string
    procedencia?: string
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
    grado?: string
    codigoProducto?: string
}

interface CodigoAgrupador {
    id: string
    codigoId: string
    codigoNombre: string
    rcmsVinculados: Array<{ id: number; numeroTarjeta: string; rcmType: string }>
    ensayos: Array<{ productoId: number; sku: string; nombre: string }>
    descripcionServicio: string
    cantidad: number
    unidad: string
    facturacion: 'Unitario' | 'Fijo'
}

interface Step2CreateRcmsProps {
    ensayosAsociados: EnsayoAsociado[]
    setEnsayosAsociados: React.Dispatch<React.SetStateAction<EnsayoAsociado[]>>
    savedRcms: RCMData[]
    setSavedRcms: React.Dispatch<React.SetStateAction<RCMData[]>>
    otData?: any
    initialRcmType?: string
    onClearInitialRcmType?: () => void
    onDraftCountChange?: (count: number) => void
    onAgrupadosCountChange?: (count: number) => void
}

const Step2CreateRcms = ({ ensayosAsociados, setEnsayosAsociados, savedRcms, setSavedRcms, otData, initialRcmType, onClearInitialRcmType, onDraftCountChange, onAgrupadosCountChange }: Step2CreateRcmsProps) => {
    // Ref para el campo de cantidad del último ensayo agregado
    const lastEnsayoCantidadRef = useRef<HTMLInputElement>(null)

    // Estado para rastrear ensayos pendientes de confirmación
    const [ensayosPendientes, setEnsayosPendientes] = useState<Set<number>>(new Set())

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
    const [fechaConfeccion, setFechaConfeccion] = useState('')

    const [expandedRcm, setExpandedRcm] = useState(true)
    const [showRcmCard, setShowRcmCard] = useState(false)
    const [rcmType, setRcmType] = useState('')

    // Notificar al padre cuando cambia el estado del borrador (formulario abierto)
    useEffect(() => {
        onDraftCountChange?.(showRcmCard ? 1 : 0)
    }, [showRcmCard])
    const [sede, setSede] = useState('PA Chillán')
    const [customSede, setCustomSede] = useState('')
    const [area, setArea] = useState<number | ''>('')
    const [tipoServicio, setTipoServicio] = useState<number | ''>('')
    const [numeroTarjeta, setNumeroTarjeta] = useState('')
    const [tomaMuestra, setTomaMuestra] = useState('')
    const [tipoMaterial, setTipoMaterial] = useState('')
    const [customTipoMaterial, setCustomTipoMaterial] = useState('')
    const [item, setItem] = useState('')
    const [customItem, setCustomItem] = useState('')
    const [elemento, setElemento] = useState('')
    const [grado, setGrado] = useState('')
    const [customGrado, setCustomGrado] = useState('')
    const [calicata, setCalicata] = useState('')
    const [estrato, setEstrato] = useState('')
    const [cota1, setCota1] = useState('')
    const [cota2, setCota2] = useState('')
    const [procedencia, setProcedencia] = useState('')
    const [ubicacionSector, setUbicacionSector] = useState('')
    const [observacionItem, setObservacionItem] = useState('')
    const [cantidadMuestras, setCantidadMuestras] = useState('1')
    const [informeEnsayo, setInformeEnsayo] = useState(true)
    const [expandedSavedRcms, setExpandedSavedRcms] = useState<Record<number, boolean>>({})
    const [rcmMenuAnchor, setRcmMenuAnchor] = useState<HTMLElement | null>(null)
    const [newRcmMenuAnchor, setNewRcmMenuAnchor] = useState<HTMLElement | null>(null)
    const [selectedRcmId, setSelectedRcmId] = useState<number | null>(null)
    const [isEditingRcm, setIsEditingRcm] = useState(false)
    const [isDuplicatingRcm, setIsDuplicatingRcm] = useState(false)
    const [editingRcmId, setEditingRcmId] = useState<number | null>(null)
    const [originalRcm, setOriginalRcm] = useState<RCMData | null>(null)
    const [showEditWarning, setShowEditWarning] = useState(false)
    const [showConfirmNewRcm, setShowConfirmNewRcm] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [actionBarRcmId, setActionBarRcmId] = useState<number | null>(null)

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
    const [todasLasFamilias, setTodasLasFamilias] = useState<Array<{ id: number, nombre: string, areaId: number }>>([])
    const [tipos, setTipos] = useState<string[]>([])
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
    const [selectedTipo, setSelectedTipo] = useState('')
    const [selectedFamilia, setSelectedFamilia] = useState('')
    const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
    const [totalProductos, setTotalProductos] = useState(0)
    const [paginatedProductos, setPaginatedProductos] = useState<ProductoType[]>([]) // Productos de la página actual
    const [filterResetKey, setFilterResetKey] = useState(0)
    const [pendingRcmType, setPendingRcmType] = useState<string>('')

    // Estados para Dialog de Crear Código Producto
    const [openCodigoDialog, setOpenCodigoDialog] = useState(false)
    const [codigoAnchorEl, setCodigoAnchorEl] = useState<HTMLElement | null>(null)
    const [showNewCodigoForm, setShowNewCodigoForm] = useState(false)
    const [selectedCodigo, setSelectedCodigo] = useState<string>('')
    const [newCodigoNombre, setNewCodigoNombre] = useState('')
    const [newCodigoDescripcion, setNewCodigoDescripcion] = useState('')
    const [newCodigoTipo, setNewCodigoTipo] = useState('')
    // Nuevos campos del Dialog
    const [dialogSkuSearch, setDialogSkuSearch] = useState('')
    const [dialogDescripcionServicio, setDialogDescripcionServicio] = useState('')
    const [dialogCantidad, setDialogCantidad] = useState<number>(1)
    // Modo del dialog: 'nuevo' | 'existente'
    const [dialogMode, setDialogMode] = useState<'nuevo' | 'existente'>('nuevo')
    const [selectedExistingAgrupadorId, setSelectedExistingAgrupadorId] = useState<string>('')

    // Códigos existentes de la OT (mock data)
    const [codigosOT, setCodigosOT] = useState<Array<{ id: string; nombre: string; tipo: string; descripcion: string }>>([
        { id: 'COD-001', nombre: 'Hormigón H30', tipo: 'Muestra', descripcion: 'Código para muestras de hormigón grado H30' },
        { id: 'COD-002', nombre: 'Suelo Base', tipo: 'Control', descripcion: 'Control de compactación base estabilizada' },
        { id: 'COD-003', nombre: 'Asfalto CA-24', tipo: 'Muestra', descripcion: 'Muestras de carpeta asfáltica' },
    ])

    // Códigos Agrupadores (Productos)
    const [codigosAgrupadores, setCodigosAgrupadores] = useState<CodigoAgrupador[]>([])
    const [selectedRcmIds, setSelectedRcmIds] = useState<number[]>([])
    const [agrupadorSearchAnchor, setAgrupadorSearchAnchor] = useState<HTMLElement | null>(null)
    const [skuSearchAnchor, setSkuSearchAnchor] = useState<HTMLElement | null>(null)
    const [editingAgrupadorId, setEditingAgrupadorId] = useState<string | null>(null)
    const [agrupadorSearchTerm, setAgrupadorSearchTerm] = useState('')

    // Notificar al padre cuando cambia la cantidad de RCMs agrupados
    useEffect(() => {
        // Contar RCMs únicos vinculados a códigos agrupadores
        const rcmIdsAgrupados = new Set<number>()
        codigosAgrupadores.forEach(ag => {
            ag.rcmsVinculados.forEach(rcm => rcmIdsAgrupados.add(rcm.id))
        })
        onAgrupadosCountChange?.(rcmIdsAgrupados.size)
    }, [codigosAgrupadores])

    /* const handleDuplicateLastRcm = () => {
        // TODO: Implementar lógica para duplicar último RCM
        console.log('Duplicar último RCM')
    } */

    const handleNewRcmClick = (event: React.MouseEvent<HTMLElement>) => {
        // Validar si hay un RCM en EDICIÓN (editando un RCM guardado)
        if (isEditingRcm) {
            setShowEditWarning(true)
            return
        }

        // Abrir el menú de tipos de RCM
        setNewRcmMenuAnchor(event.currentTarget)
    }

    const handleSelectRcmType = (type: string) => {
        setNewRcmMenuAnchor(null)

        // Si hay un RCM en CREACIÓN (nuevo RCM sin guardar), mostrar confirmación
        if (showRcmCard && !isEditingRcm) {
            setPendingRcmType(type)
            setShowConfirmNewRcm(true)
            return
        }

        // Si no hay RCM en proceso, crear uno nuevo directamente
        createNewRcm(type)
    }

    const createNewRcm = (type?: string) => {
        setShowRcmCard(true)
        setRcmType(type || '')

        // Resetear sede a valor por defecto
        setSede('PA Chillán')
        setCustomSede('')

        setArea('')
        setTipoServicio('')
        setNumeroTarjeta('')
        setTomaMuestra('')
        setTipoMaterial('')
        setCustomTipoMaterial('')
        setItem('')
        setCustomItem('')
        setElemento('')
        setGrado('')
        setCustomGrado('')
        setCalicata('')
        setEstrato('')
        setCota1('')
        setCota2('')
        setProcedencia('')
        setUbicacionSector('')
        setObservacionItem('')
        setCantidadMuestras('1')
        setEnsayosAsociados([])
        setFechaServicio(getFechaServicioForInput())
        setFechaIngreso(getTodayDateForInput())
        setFechaEntrega('')
        setExpandedRcm(true)

        // Resetear vencimiento
        setTieneVencimiento(false)
        setSubmuestrasVencimiento([])
    }

    const handleConfirmNewRcm = () => {
        setShowConfirmNewRcm(false)
        createNewRcm(pendingRcmType)
        setPendingRcmType('')
    }

    const handleCancelNewRcm = () => {
        setShowConfirmNewRcm(false)
    }

    // Función para detectar si hay cambios sin guardar en el formulario
    const hasUnsavedChanges = (): boolean => {
        const currentAreaName = areas.find(a => a.id === area)?.nombre || ''
        const currentTipoServicioName = todasLasFamilias.find(f => f.id === tipoServicio)?.nombre || ''
        const currentSede = sede === 'Otro' ? customSede : sede

        if (isEditingRcm && originalRcm) {
            // Comparar con los datos originales del RCM que se está editando
            return (
                currentSede !== (originalRcm.sede || '') ||
                currentAreaName !== (originalRcm.area || '') ||
                currentTipoServicioName !== (originalRcm.tipoServicio || '') ||
                numeroTarjeta !== originalRcm.numeroTarjeta ||
                (tipoMaterial === 'Otro' ? customTipoMaterial : tipoMaterial) !== originalRcm.tipoMaterial ||
                (item === 'Otro' ? customItem : item) !== originalRcm.item ||
                (grado === 'Otro' ? customGrado : grado) !== (originalRcm.grado || '') ||
                tomaMuestra !== (originalRcm.tomaMuestra || '') ||
                cantidadMuestras !== originalRcm.cantidadMuestras ||
                fechaServicio !== originalRcm.fechaServicio ||
                JSON.stringify(ensayosAsociados) !== JSON.stringify(originalRcm.ensayos) ||
                tieneVencimiento !== (originalRcm.tieneVencimiento || false) ||
                JSON.stringify(submuestrasVencimiento) !== JSON.stringify(originalRcm.submuestrasVencimiento || [])
            )
        } else {
            // Nuevo RCM: verificar si se ha ingresado algún dato o cambiado el área/servicio default
            return (
                (sede !== 'PA Chillán' || customSede.trim() !== '') ||
                (area !== '') ||
                (tipoServicio !== '') ||
                numeroTarjeta.trim() !== '' ||
                tipoMaterial.trim() !== '' ||
                customTipoMaterial.trim() !== '' ||
                item.trim() !== '' ||
                customItem.trim() !== '' ||
                elemento.trim() !== '' ||
                grado.trim() !== '' ||
                customGrado.trim() !== '' ||
                calicata.trim() !== '' ||
                estrato.trim() !== '' ||
                cota1.trim() !== '' ||
                cota2.trim() !== '' ||
                procedencia.trim() !== '' ||
                ubicacionSector.trim() !== '' ||
                observacionItem.trim() !== '' ||
                tomaMuestra.trim() !== '' ||
                ensayosAsociados.length > 0 ||
                submuestrasVencimiento.length > 0
            )
        }
    }

    const handleCancelEdit = () => {
        // Si estamos duplicando, cancelar directamente sin modal
        if (isDuplicatingRcm) {
            performCancelEdit()
            return
        }
        // Si hay cambios sin guardar, mostrar modal de confirmación
        if (hasUnsavedChanges()) {
            setShowCancelConfirm(true)
            return
        }
        // Si no hay cambios, cancelar directamente
        performCancelEdit()
    }

    const performCancelEdit = () => {
        // Si estamos editando un RCM, restaurarlo a la lista con sus datos originales
        if (isEditingRcm && editingRcmId !== null && originalRcm !== null) {
            setSavedRcms([...savedRcms, originalRcm])
            setOriginalRcm(null)
        }

        // Cerrar el formulario y limpiar estados
        setShowRcmCard(false)
        setRcmType('')
        setSede('PA Chillán')
        setCustomSede('')
        setArea('')
        setTipoServicio('')
        setNumeroTarjeta('')
        setTomaMuestra('')
        setTipoMaterial('')
        setCustomTipoMaterial('')
        setItem('')
        setCustomItem('')
        setElemento('')
        setGrado('')
        setCustomGrado('')
        setCalicata('')
        setEstrato('')
        setCota1('')
        setCota2('')
        setProcedencia('')
        setUbicacionSector('')
        setObservacionItem('')
        setCantidadMuestras('1')
        setEnsayosAsociados([])
        setEnsayosPendientes(new Set())
        setTieneVencimiento(false)
        setSubmuestrasVencimiento([])
        setErrorVencimiento('')

        // Limpiar estado de edición y duplicación
        setIsEditingRcm(false)
        setEditingRcmId(null)
        setIsDuplicatingRcm(false)
    }

    const handleConfirmCancel = () => {
        setShowCancelConfirm(false)
        performCancelEdit()
    }

    const handleDismissCancelConfirm = () => {
        setShowCancelConfirm(false)
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

            // Validación: Todas las submuestras deben tener fecha de vencimiento
            const sinFecha = submuestrasVencimiento.some(sub => !sub.fechaVencimiento)
            if (sinFecha) {
                setErrorVencimiento('Todas las submuestras deben tener una fecha de vencimiento calculada o ingresada')
                return
            }
        }

        // Limpiar error si pasó las validaciones
        setErrorVencimiento('')

        // Obtener nombres para guardar en el objeto RCM
        const sedeNombre = sede === 'Otro' ? customSede : sede
        const areaNombre = areas.find(a => a.id === area)?.nombre || ''
        const tipoServicioNombre = todasLasFamilias.find(f => f.id === tipoServicio)?.nombre || ''

        // Limpiar estado de edición y duplicación
        setIsEditingRcm(false)
        setEditingRcmId(null)
        setOriginalRcm(null)
        setIsDuplicatingRcm(false)

        // Determinar el estado según el tipo de RCM
        let estadoRcm = 'Codificado' // Por defecto
        if (rcmType === 'Muestra') {
            estadoRcm = 'Codificado'
        } else if (rcmType === 'Control') {
            estadoRcm = 'Ensayado'
        } else if (rcmType === 'Servicio') {
            estadoRcm = 'Ejecutado'
        }

        const newRcm: RCMData = {
            id: Date.now(),
            rcmType,
            sede: sedeNombre,
            area: areaNombre,
            tipoServicio: tipoServicioNombre,
            numeroTarjeta,
            tipoMaterial: tipoMaterial === 'Otro' ? customTipoMaterial : tipoMaterial,
            item: item === 'Otro' ? customItem : item,
            grado: grado === 'Otro' ? customGrado : grado,
            procedencia,
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
        setActionBarRcmId(newRcm.id)
        setShowRcmCard(false)
        setRcmType('')
        setSede('PA Chillán')
        setCustomSede('')
        setArea('')
        setTipoServicio('')
        setNumeroTarjeta('')
        setTomaMuestra('')
        setTipoMaterial('')
        setCustomTipoMaterial('')
        setItem('')
        setCustomItem('')
        setElemento('')
        setGrado('')
        setCustomGrado('')
        setCalicata('')
        setEstrato('')
        setCota1('')
        setCota2('')
        setProcedencia('')
        setUbicacionSector('')
        setCantidadMuestras('1')
        setEnsayosAsociados([])
        setEnsayosPendientes(new Set())
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

                // Cargar sede
                const standardSedes = ['PA Chillán', 'PA Concepción', 'Cliente']
                if (rcmToEdit.sede && !standardSedes.includes(rcmToEdit.sede)) {
                    setSede('Otro')
                    setCustomSede(rcmToEdit.sede)
                } else {
                    setSede(rcmToEdit.sede || 'PA Chillán')
                    setCustomSede('')
                }

                // Encontrar IDs por nombre
                const areaFound = areas.find(a => a.nombre === rcmToEdit.area)
                setArea(areaFound ? areaFound.id : '')

                const familiaFound = todasLasFamilias.find(f => f.nombre === rcmToEdit.tipoServicio)
                setTipoServicio(familiaFound ? familiaFound.id : '')

                setNumeroTarjeta(rcmToEdit.numeroTarjeta)

                // Manejar tipoMaterial "Otro"
                const standardMaterials = ['Suelo granular', 'Suelo cohesivo', 'Hormigón', 'Asfalto']
                if (rcmToEdit.tipoMaterial && !standardMaterials.includes(rcmToEdit.tipoMaterial)) {
                    setTipoMaterial('Otro')
                    setCustomTipoMaterial(rcmToEdit.tipoMaterial)
                } else {
                    setTipoMaterial(rcmToEdit.tipoMaterial)
                    setCustomTipoMaterial('')
                }

                // Manejar item "Otro"
                const standardItems = ['Base', 'Subbase', 'Subrasante', 'Terraplén']
                if (rcmToEdit.item && !standardItems.includes(rcmToEdit.item)) {
                    setItem('Otro')
                    setCustomItem(rcmToEdit.item)
                } else {
                    setItem(rcmToEdit.item)
                    setCustomItem('')
                }
                setGrado(rcmToEdit.grado || '')

                // Manejar grado "Otro"
                const standardGrades = ['1', '2', '3', '4']
                if (rcmToEdit.grado && !standardGrades.includes(rcmToEdit.grado)) {
                    setGrado('Otro')
                    setCustomGrado(rcmToEdit.grado)
                } else {
                    setGrado(rcmToEdit.grado || '')
                    setCustomGrado('')
                }

                setProcedencia(rcmToEdit.procedencia || '')
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

                // Cargar sede
                const standardSedes = ['PA Chillán', 'PA Concepción', 'Cliente']
                if (rcmToDuplicate.sede && !standardSedes.includes(rcmToDuplicate.sede)) {
                    setSede('Otro')
                    setCustomSede(rcmToDuplicate.sede)
                } else {
                    setSede(rcmToDuplicate.sede || 'PA Chillán')
                    setCustomSede('')
                }

                // Encontrar IDs por nombre
                const areaFound = areas.find(a => a.nombre === rcmToDuplicate.area)
                setArea(areaFound ? areaFound.id : '')

                const familiaFound = todasLasFamilias.find(f => f.nombre === rcmToDuplicate.tipoServicio)
                setTipoServicio(familiaFound ? familiaFound.id : '')

                setNumeroTarjeta('') // Forzar a ingresar un nuevo número de tarjeta

                // Manejar tipoMaterial "Otro"
                const standardMaterials = ['Suelo granular', 'Suelo cohesivo', 'Hormigón', 'Asfalto']
                if (rcmToDuplicate.tipoMaterial && !standardMaterials.includes(rcmToDuplicate.tipoMaterial)) {
                    setTipoMaterial('Otro')
                    setCustomTipoMaterial(rcmToDuplicate.tipoMaterial)
                } else {
                    setTipoMaterial(rcmToDuplicate.tipoMaterial)
                    setCustomTipoMaterial('')
                }

                // Manejar item "Otro"
                const standardItems = ['Base', 'Subbase', 'Subrasante', 'Terraplén']
                if (rcmToDuplicate.item && !standardItems.includes(rcmToDuplicate.item)) {
                    setItem('Otro')
                    setCustomItem(rcmToDuplicate.item)
                } else {
                    setItem(rcmToDuplicate.item)
                    setCustomItem('')
                }
                setProcedencia(rcmToDuplicate.procedencia || '')

                // Manejar grado "Otro"
                const standardGrades = ['1', '2', '3', '4']
                if (rcmToDuplicate.grado && !standardGrades.includes(rcmToDuplicate.grado)) {
                    setGrado('Otro')
                    setCustomGrado(rcmToDuplicate.grado)
                } else {
                    setGrado(rcmToDuplicate.grado || '')
                    setCustomGrado('')
                }

                setTomaMuestra(rcmToDuplicate.tomaMuestra || '')
                setCantidadMuestras(rcmToDuplicate.cantidadMuestras)
                setFechaServicio(rcmToDuplicate.fechaServicio)
                setEnsayosAsociados([...rcmToDuplicate.ensayos])

                // Cargar estados de vencimiento
                setTieneVencimiento(rcmToDuplicate.tieneVencimiento || false)
                setSubmuestrasVencimiento(rcmToDuplicate.submuestrasVencimiento || [])

                // NO eliminar el RCM original de la lista (a diferencia de editar)
                // El RCM duplicado será un nuevo RCM cuando se guarde

                // Marcar como duplicación y mostrar el formulario
                setIsDuplicatingRcm(true)
                setShowRcmCard(true)
                setExpandedRcm(true)
            }
        }
        handleCloseRcmMenu()
    }

    // Handlers para Dialog de Crear Código Producto
    const handleOpenCodigoPopup = (_event: React.MouseEvent<HTMLElement>) => {
        setOpenCodigoDialog(true)
        setShowNewCodigoForm(false)
        setSelectedCodigo('')
        setDialogSkuSearch('')
        setDialogDescripcionServicio('')
        setDialogCantidad(selectedRcmIds.length > 0 ? selectedRcmIds.length : 1)
        // Si ya hay códigos creados, abrir por defecto en modo 'existente'
        setDialogMode(codigosAgrupadores.length > 0 ? 'existente' : 'nuevo')
        setSelectedExistingAgrupadorId(codigosAgrupadores.length > 0 ? codigosAgrupadores[0].id : '')
    }

    const handleCloseCodigoPopup = () => {
        setOpenCodigoDialog(false)
        setCodigoAnchorEl(null)
        setShowNewCodigoForm(false)
        setSelectedCodigo('')
        setNewCodigoNombre('')
        setNewCodigoDescripcion('')
        setNewCodigoTipo('')
        setDialogSkuSearch('')
        setDialogDescripcionServicio('')
        setSelectedExistingAgrupadorId('')
    }

    const handleSelectCodigo = (codigoId: string) => {
        setSelectedCodigo(codigoId)
    }

    const handleConfirmCodigo = () => {
        // Determinar los RCMs a agrupar
        const rcmsToAssign = selectedRcmIds.length > 0
            ? savedRcms.filter(r => selectedRcmIds.includes(r.id)).map(r => ({
                id: r.id,
                numeroTarjeta: r.numeroTarjeta || r.numeroRcm || `T-${r.id}`,
                rcmType: r.rcmType
            }))
            : showRcmCard
                ? [{ id: Date.now(), numeroTarjeta: numeroTarjeta || 'Actual', rcmType: rcmType }]
                : []

        if (rcmsToAssign.length === 0) return

        // Recopilar todos los ensayos de los RCMs seleccionados
        const allEnsayos: Array<{ productoId: number; sku: string; nombre: string }> = []
        const seenProductoIds = new Set<number>()

        rcmsToAssign.forEach(rcmRef => {
            const fullRcm = savedRcms.find(r => r.id === rcmRef.id)
            if (fullRcm) {
                fullRcm.ensayos.forEach(e => {
                    if (!seenProductoIds.has(e.productoId)) {
                        seenProductoIds.add(e.productoId)
                        allEnsayos.push({ productoId: e.productoId, sku: e.sku, nombre: e.nombre })
                    }
                })
            }
        })

        if (allEnsayos.length === 0 && ensayosAsociados.length > 0) {
            ensayosAsociados.forEach(e => {
                if (!seenProductoIds.has(e.productoId)) {
                    seenProductoIds.add(e.productoId)
                    allEnsayos.push({ productoId: e.productoId, sku: e.sku, nombre: e.nombre })
                }
            })
        }

        // Si hay SKU seleccionado, incluirlo como ensayo si no está ya
        if (dialogSkuSearch.trim()) {
            const skuAlreadyIncluded = allEnsayos.some(e => e.sku === dialogSkuSearch.trim())
            if (!skuAlreadyIncluded) {
                allEnsayos.unshift({ productoId: -1, sku: dialogSkuSearch.trim(), nombre: dialogSkuSearch.trim() })
            }
        }

        const newAgrupador: CodigoAgrupador = {
            id: `PRD-${String(codigosAgrupadores.length + 1).padStart(3, '0')}`,
            codigoId: `PRD-${String(codigosAgrupadores.length + 1).padStart(3, '0')}`,
            codigoNombre: dialogDescripcionServicio || `Código ${codigosAgrupadores.length + 1}`,
            rcmsVinculados: rcmsToAssign,
            ensayos: allEnsayos,
            descripcionServicio: dialogDescripcionServicio,
            cantidad: dialogCantidad,
            unidad: 'unid',
            facturacion: dialogSkuSearch.trim() ? 'Fijo' : 'Unitario'
        }

        setCodigosAgrupadores(prev => [...prev, newAgrupador])
        setSelectedRcmIds([])
        handleCloseCodigoPopup()
    }

    const handleAddToExistingAgrupador = () => {
        if (!selectedExistingAgrupadorId) return

        // Determinar los RCMs a agregar
        const rcmsToAdd = selectedRcmIds.length > 0
            ? savedRcms.filter(r => selectedRcmIds.includes(r.id)).map(r => ({
                id: r.id,
                numeroTarjeta: r.numeroTarjeta || r.numeroRcm || `T-${r.id}`,
                rcmType: r.rcmType
            }))
            : []

        if (rcmsToAdd.length === 0) return

        setCodigosAgrupadores(prev => prev.map(ag => {
            if (ag.id !== selectedExistingAgrupadorId) return ag

            // Evitar RCMs duplicados
            const existingRcmIds = new Set(ag.rcmsVinculados.map(r => r.id))
            const newRcms = rcmsToAdd.filter(r => !existingRcmIds.has(r.id))

            // Recopilar ensayos de los nuevos RCMs sin duplicar
            const existingEnsayoIds = new Set(ag.ensayos.map(e => e.productoId))
            const newEnsayos: Array<{ productoId: number; sku: string; nombre: string }> = []

            newRcms.forEach(rcmRef => {
                const fullRcm = savedRcms.find(r => r.id === rcmRef.id)
                if (fullRcm) {
                    fullRcm.ensayos.forEach(e => {
                        if (!existingEnsayoIds.has(e.productoId)) {
                            existingEnsayoIds.add(e.productoId)
                            newEnsayos.push({ productoId: e.productoId, sku: e.sku, nombre: e.nombre })
                        }
                    })
                }
            })

            return {
                ...ag,
                rcmsVinculados: [...ag.rcmsVinculados, ...newRcms],
                ensayos: [...ag.ensayos, ...newEnsayos],
                cantidad: ag.cantidad + newRcms.length
            }
        }))

        setSelectedRcmIds([])
        handleCloseCodigoPopup()
    }

    const handleDeleteAgrupador = (agrupadorId: string) => {
        setCodigosAgrupadores(prev => prev.filter(a => a.id !== agrupadorId))
    }

    const handleToggleRcmSelection = (rcmId: number) => {
        setSelectedRcmIds(prev =>
            prev.includes(rcmId)
                ? prev.filter(id => id !== rcmId)
                : [...prev, rcmId]
        )
    }

    const handleChangeAgrupadorCantidad = (agrupadorId: string, cantidad: number) => {
        setCodigosAgrupadores(prev => prev.map(a =>
            a.id === agrupadorId ? { ...a, cantidad } : a
        ))
    }

    const handleChangeAgrupadorFacturacion = (agrupadorId: string, facturacion: 'Unitario' | 'Fijo') => {
        setCodigosAgrupadores(prev => prev.map(a =>
            a.id === agrupadorId ? { ...a, facturacion } : a
        ))
    }

    const handleChangeAgrupadorDescripcion = (agrupadorId: string, descripcionServicio: string) => {
        setCodigosAgrupadores(prev => prev.map(a =>
            a.id === agrupadorId ? { ...a, descripcionServicio } : a
        ))
    }

    const handleOpenAgrupadorSearch = (event: React.MouseEvent<HTMLElement>, agrupadorId: string) => {
        setAgrupadorSearchAnchor(event.currentTarget)
        setEditingAgrupadorId(agrupadorId)
        setAgrupadorSearchTerm('')
    }

    const handleCloseAgrupadorSearch = () => {
        setAgrupadorSearchAnchor(null)
        setEditingAgrupadorId(null)
        setAgrupadorSearchTerm('')
    }

    const handleSelectProductForAgrupador = (producto: ProductoType) => {
        if (!editingAgrupadorId) return
        const idProducto = (producto as any).productoId || producto.id

        setCodigosAgrupadores(prev => prev.map(a => {
            if (a.id !== editingAgrupadorId) return a
            // Don't add duplicates
            if (a.ensayos.some(e => e.productoId === idProducto)) return a
            return {
                ...a,
                ensayos: [...a.ensayos, { productoId: idProducto, sku: producto.sku, nombre: producto.nombre }]
            }
        }))
        handleCloseAgrupadorSearch()
    }

    const handleOpenSkuSearch = (event: React.MouseEvent<HTMLElement>) => {
        setSkuSearchAnchor(event.currentTarget)
        setSearchTerm(dialogSkuSearch)
        // Pre-filtrar por area de los RCMs seleccionados
        if (selectedRcmIds.length > 0) {
            const firstRcm = savedRcms.find(r => selectedRcmIds.includes(r.id))
            const areaId = firstRcm?.area ? areas.find(a => a.nombre === firstRcm.area || String(a.id) === String(firstRcm.area))?.id : null
            if (areaId) setSelectedAreaId(areaId)
        } else if (area) {
            setSelectedAreaId(area as number)
        }
    }

    const handleCloseSkuSearch = () => {
        setSkuSearchAnchor(null)
        setSearchTerm('')
    }

    const handleSelectProductForSku = (producto: ProductoType) => {
        setDialogSkuSearch(producto.sku || producto.nombre)
        handleCloseSkuSearch()
    }

    const handleRemoveEnsayoFromAgrupador = (agrupadorId: string, productoId: number) => {
        setCodigosAgrupadores(prev => prev.map(a =>
            a.id === agrupadorId
                ? { ...a, ensayos: a.ensayos.filter(e => e.productoId !== productoId) }
                : a
        ))
    }

    const handleCrearNuevoCodigo = () => {
        if (!newCodigoNombre.trim()) return
        const newCodigo = {
            id: `COD-${String(codigosOT.length + 1).padStart(3, '0')}`,
            nombre: newCodigoNombre,
            tipo: newCodigoTipo || 'General',
            descripcion: newCodigoDescripcion
        }
        setCodigosOT([...codigosOT, newCodigo])
        setSelectedCodigo(newCodigo.id)
        setShowNewCodigoForm(false)
        setNewCodigoNombre('')
        setNewCodigoDescripcion('')
        setNewCodigoTipo('')
    }

    const handleOpenSearchPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)

        // Pre-seleccionar el área del RCM si está definida
        if (area && areas.length > 0) {
            setSelectedAreaId(area as number)
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

    const handleSelectProduct = async (producto: ProductoType) => {
        // Usar productoId o id según lo que tenga el producto
        const idProducto = (producto as any).productoId || producto.id

        // Verificar si el producto ya está en la lista
        const yaExiste = ensayosAsociados.some(e => e.productoId === idProducto)
        if (yaExiste) {
            handleCloseSearchPopover()
            return
        }

        if (producto.esPaquete) {
            // Fetch sub-products del paquete
            try {
                const response = await fetch(`/api/productos/${idProducto}/productos`)
                if (response.ok) {
                    const data = await response.json()
                    const productosDelPaquete = data.productos || []

                    const subProductos: SubProducto[] = productosDelPaquete.map((p: any, idx: number) => ({
                        id: Date.now() + idx + 1,
                        productoId: p.productoId,
                        sku: p.sku,
                        nombre: p.nombre,
                        norma: p.norma || '',
                        cantidad: p.cantidad || 1,
                        observacion: '',
                        isEditing: false
                    }))

                    const nuevoEnsayoPaquete: EnsayoAsociado = {
                        id: Date.now(),
                        productoId: idProducto,
                        sku: producto.sku,
                        nombre: producto.nombre,
                        norma: producto.norma,
                        cantidad: 1,
                        observacion: '',
                        estadoOperativo: 'Codificado',
                        esPaquete: true,
                        subProductos
                    }

                    setEnsayosAsociados(prev => [...prev, nuevoEnsayoPaquete])
                    // No marcar como pendiente ni hacer focus para paquetes
                }
            } catch (error) {
                console.error('Error al cargar productos del paquete:', error)
            }
        } else {
            // Producto individual (lógica existente)
            const nuevoEnsayo: EnsayoAsociado = {
                id: Date.now(),
                productoId: idProducto,
                sku: producto.sku,
                nombre: producto.nombre,
                norma: producto.norma,
                cantidad: 1,
                observacion: '',
                estadoOperativo: 'Codificado'
            }

            setEnsayosAsociados(prev => [...prev, nuevoEnsayo])
            setEnsayosPendientes(prev => new Set([...prev, nuevoEnsayo.id]))
        }

        handleCloseSearchPopover()
    }

    const handleDeleteEnsayo = (ensayoId: number) => {
        setEnsayosAsociados(ensayosAsociados.filter(e => e.id !== ensayoId))
        setEnsayosPendientes(prev => {
            const newSet = new Set(prev)
            newSet.delete(ensayoId)
            return newSet
        })
    }

    // Handlers para sub-productos de paquetes
    const handleDeleteSubProducto = (ensayoId: number, subProductoId: number) => {
        setEnsayosAsociados(prev => prev.map(e => {
            if (e.id !== ensayoId || !e.subProductos) return e
            return { ...e, subProductos: e.subProductos.filter(sp => sp.id !== subProductoId) }
        }))
    }

    const handleToggleEditSubProducto = (ensayoId: number, subProductoId: number) => {
        setEnsayosAsociados(prev => prev.map(e => {
            if (e.id !== ensayoId || !e.subProductos) return e
            return {
                ...e,
                subProductos: e.subProductos.map(sp =>
                    sp.id === subProductoId ? { ...sp, isEditing: !sp.isEditing } : sp
                )
            }
        }))
    }

    const handleChangeSubProductoCantidad = (ensayoId: number, subProductoId: number, cantidad: number) => {
        setEnsayosAsociados(prev => prev.map(e => {
            if (e.id !== ensayoId || !e.subProductos) return e
            return {
                ...e,
                subProductos: e.subProductos.map(sp =>
                    sp.id === subProductoId ? { ...sp, cantidad } : sp
                )
            }
        }))
    }

    const handleChangeSubProductoObservacion = (ensayoId: number, subProductoId: number, observacion: string) => {
        setEnsayosAsociados(prev => prev.map(e => {
            if (e.id !== ensayoId || !e.subProductos) return e
            return {
                ...e,
                subProductos: e.subProductos.map(sp =>
                    sp.id === subProductoId ? { ...sp, observacion } : sp
                )
            }
        }))
    }

    const handleToggleEditEnsayo = (ensayoId: number) => {
        setEnsayosAsociados(prev => prev.map(e =>
            e.id === ensayoId ? { ...e, isEditing: !e.isEditing } : e
        ))
    }

    const handleConfirmEnsayo = (ensayoId: number) => {
        // Remover de pendientes
        setEnsayosPendientes(prev => {
            const newSet = new Set(prev)
            newSet.delete(ensayoId)
            return newSet
        })

        // Quitar el foco del campo actual
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur()
        }
    }

    const handleCancelEnsayo = (ensayoId: number) => {
        // Eliminar el ensayo si se cancela antes de confirmar
        handleDeleteEnsayo(ensayoId)
    }

    const handleChangeCantidad = (ensayoId: number, cantidad: number) => {
        setEnsayosAsociados(ensayosAsociados.map(e =>
            e.id === ensayoId ? { ...e, cantidad } : e
        ))
    }

    const handleKeyPressQuantity = (e: React.KeyboardEvent, ensayoId: number) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleConfirmEnsayo(ensayoId)
        }
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

    // Effect para hacer focus en el campo de cantidad cuando se agrega un nuevo ensayo (no paquete)
    useEffect(() => {
        if (ensayosAsociados.length > 0 && lastEnsayoCantidadRef.current) {
            // No hacer focus si el último ensayo es un paquete
            const lastEnsayo = ensayosAsociados[ensayosAsociados.length - 1]
            if (lastEnsayo.esPaquete) return

            setTimeout(() => {
                const inputElement = lastEnsayoCantidadRef.current?.querySelector('input')
                if (inputElement) {
                    inputElement.focus()
                    inputElement.select()
                }
            }, 0)
        }
    }, [ensayosAsociados.length])

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

    // Efecto para inicializar RCM cuando viene del paso 1 con un tipo seleccionado
    useEffect(() => {
        if (initialRcmType && !showRcmCard) {
            setShowRcmCard(true)
            setRcmType(initialRcmType)

            // Resetear sede a valor por defecto
            setSede('PA Chillán')
            setCustomSede('')

            setArea('')
            setTipoServicio('')
            setNumeroTarjeta('')
            setTomaMuestra('')
            setTipoMaterial('')
            setCustomTipoMaterial('')
            setItem('')
            setCustomItem('')
            setElemento('')
            setGrado('')
            setCustomGrado('')
            setCalicata('')
            setEstrato('')
            setCota1('')
            setCota2('')
            setProcedencia('')
            setUbicacionSector('')
            setObservacionItem('')
            setCantidadMuestras('1')
            setEnsayosAsociados([])
            setFechaServicio(getFechaServicioForInput())
            setFechaIngreso(getTodayDateForInput())
            setFechaEntrega('')
            setExpandedRcm(true)

            // Resetear vencimiento
            setTieneVencimiento(false)
            setSubmuestrasVencimiento([])

            // Limpiar el tipo inicial después de usarlo
            if (onClearInitialRcmType) {
                onClearInitialRcmType()
            }
        }
    }, [initialRcmType])

    // Activar vencimiento automáticamente cuando el área es Hormigón o Elementos y Componentes
    useEffect(() => {
        const foundArea = areas.find(a => a.id === area)
        const currentAreaName = foundArea?.nombre?.toLowerCase()
        const shouldHaveVencimiento =
            currentAreaName === 'hormigón' ||
            currentAreaName === 'elementos y componentes'

        if (shouldHaveVencimiento) {
            setTieneVencimiento(true)
        }
    }, [area, areas])

    // Cargar áreas y familias iniciales
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Cargar áreas y familias en paralelo
                const [areasResponse, familiasResponse] = await Promise.all([
                    fetch('/api/areas'),
                    fetch('/api/familias')
                ])

                if (areasResponse.ok) {
                    const areasData = await areasResponse.json()
                    setAreas(areasData)
                }

                if (familiasResponse.ok) {
                    const familiasData = await familiasResponse.json()
                    // Transformar los datos para incluir areaId y filtrar localmente
                    const familiasConAreaId = familiasData.map((f: any) => ({
                        id: f.id,
                        nombre: f.nombre,
                        areaId: f.area?.id || 0
                    }))
                    setTodasLasFamilias(familiasConAreaId)
                }
            } catch (error) {
                console.error('Error al cargar datos iniciales:', error)
            }
        }
        fetchInitialData()
    }, [])



    // Cargar familias filtradas para el popover de búsqueda cuando cambia el área
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
        if (!anchorEl && !agrupadorSearchAnchor && !skuSearchAnchor) return

        const fetchProductos = async () => {
            try {
                const params = new URLSearchParams({
                    page: productsPage.toString(),
                    limit: ITEMS_PER_PAGE.toString()
                })

                if (searchTerm) params.append('q', searchTerm)

                // Filtrar por el área del RCM si está definida
                const currentAreaName = areas.find(a => a.id === area)?.nombre
                if (currentAreaName) params.append('area', currentAreaName)

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
    }, [anchorEl, agrupadorSearchAnchor, skuSearchAnchor, searchTerm, area, areas, showOnlyPaquetes])

    // Aplicar paginación local
    useEffect(() => {
        const startIndex = productsPage * ITEMS_PER_PAGE
        const endIndex = startIndex + ITEMS_PER_PAGE
        const paginated = allProductos.slice(startIndex, endIndex)
        setPaginatedProductos(paginated)
    }, [allProductos, productsPage])

    // Computar los IDs de RCMs que ya están agrupados (vinculados a algún código agrupador)
    const rcmIdsAgrupados = new Set<number>()
    codigosAgrupadores.forEach(ag => {
        ag.rcmsVinculados.forEach(rcm => rcmIdsAgrupados.add(rcm.id))
    })

    // Listado 1: Borradores → manejado por showRcmCard (formulario abierto)
    // Listado 2: Creados (Pendientes de Agrupar) → guardados, SIN código producto
    const rcmsCreados = savedRcms.filter(rcm => !rcmIdsAgrupados.has(rcm.id))
    // Listado 3: Agrupados → guardados, CON código producto (vinculados a un agrupador)
    const rcmsAgrupados = savedRcms.filter(rcm => rcmIdsAgrupados.has(rcm.id))

    // Ref y estado para rastrear posición/ancho de la Card
    const cardRef = useRef<HTMLDivElement>(null)
    const [cardRect, setCardRect] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

    const updateCardRect = useCallback(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect()
            setCardRect({ left: rect.left, width: rect.width })
        }
    }, [])

    useEffect(() => {
        updateCardRect()
        window.addEventListener('resize', updateCardRect)
        window.addEventListener('scroll', updateCardRect, true)

        let observer: ResizeObserver | null = null
        if (cardRef.current) {
            observer = new ResizeObserver(updateCardRect)
            observer.observe(cardRef.current)
        }

        return () => {
            window.removeEventListener('resize', updateCardRect)
            window.removeEventListener('scroll', updateCardRect, true)
            observer?.disconnect()
        }
    }, [updateCardRect])

    return (
        <>
            <Card ref={cardRef}>
                <Box sx={{ p: 6 }}>
                    {/* Fila superior: Título y Botones */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
                        {/* Título y subtítulo */}
                        <Box>
                            <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 1 }}>
                                RCMs creados <Typography component='span' sx={{ color: 'text.secondary', fontWeight: 'normal' }}>{savedRcms.length} {savedRcms.length === 1 ? 'registro' : 'registros'}</Typography>
                            </Typography>

                        </Box>

                        {/* Botones */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {!showRcmCard && (
                                <Button
                                    variant='contained'
                                    color='primary'
                                    startIcon={<AddIcon />}
                                    onClick={handleNewRcmClick}
                                    sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
                                >
                                    Nuevo RCM
                                </Button>
                            )}
                            <Menu
                                anchorEl={newRcmMenuAnchor}
                                open={Boolean(newRcmMenuAnchor)}
                                onClose={() => setNewRcmMenuAnchor(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            minWidth: newRcmMenuAnchor?.offsetWidth || 'auto'
                                        }
                                    }
                                }}
                            >
                                <MenuItem onClick={() => handleSelectRcmType('Muestra')}>
                                    Muestra
                                </MenuItem>
                                <MenuItem onClick={() => handleSelectRcmType('Control')}>
                                    Control
                                </MenuItem>
                                <MenuItem onClick={() => handleSelectRcmType('Servicio')}>
                                    Servicio
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Box>
                    {/* ═══════════════════════════════════════════ */}
                    {/* LISTADO 1: BORRADORES (formulario abierto) */}
                    {/* ═══════════════════════════════════════════ */}
                    {showRcmCard && (
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                    Borradores
                                </Typography>
                                <Chip
                                    label='1'
                                    size='small'
                                    sx={{
                                        fontWeight: 700,
                                        bgcolor: '#EEEEEE',
                                        color: '#616161',
                                        border: '1px solid #BDBDBD',
                                        minWidth: 28,
                                    }}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* RCM Card (Borrador) */}
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
                                    <Chip
                                        label={rcmType.toUpperCase()}
                                        sx={{
                                            fontWeight: 'bold',
                                            backgroundColor: rcmType === 'Muestra' ? '#1976d2' : rcmType === 'Control' ? '#e91e63' : '#424242',
                                            color: '#ffffff'
                                        }}
                                    />
                                    <Chip
                                        label='Borrador'
                                        size='small'
                                        sx={{
                                            fontWeight: 600,
                                            bgcolor: '#EEEEEE',
                                            color: '#616161',
                                            border: '1px solid #BDBDBD',
                                        }}
                                    />
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    {/* <Button
                                        variant='outlined'
                                        size='small'
                                        onClick={handleOpenCodigoPopup}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: '8px',
                                            borderColor: '#1976D2',
                                            color: '#1976D2',
                                            fontWeight: 600,
                                            px: 2,
                                            '&:hover': {
                                                borderColor: '#1565C0',
                                                bgcolor: 'rgba(25, 118, 210, 0.04)'
                                            }
                                        }}
                                    >
                                        Asignar a código / Crear nuevo código
                                    </Button> */}
                                    {isEditingRcm && (
                                        <>
                                            <Checkbox />
                                            <IconButton size='small'>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </>
                                    )}
                                </Box>
                            </Box>

                            {/* Contenido colapsable del RCM */}
                            <Collapse in={expandedRcm}>
                                <Box sx={{ p: 3, bgcolor: 'white' }}>
                                    {/* ═══════════════════════════════════════════ */}
                                    {/* LAYOUT PARA TIPO MUESTRA                   */}
                                    {/* ═══════════════════════════════════════════ */}
                                    {rcmType === 'Muestra' ? (
                                        <>
                                            {/* Fila 1: Área, Tipo Servicio, Sede */}
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={4}>
                                                    <FormControl fullWidth>
                                                        <InputLabel id="area-label-muestra" shrink>Área</InputLabel>
                                                        <Select
                                                            labelId="area-label-muestra"
                                                            label='Área'
                                                            value={area}
                                                            displayEmpty
                                                            notched
                                                            onChange={(e) => {
                                                                const valor = e.target.value as number | ''
                                                                setArea(valor)
                                                                setTipoServicio('')
                                                            }}
                                                        >
                                                            <MenuItem value='' disabled>Seleccionar área</MenuItem>
                                                            {areas.map((a) => (
                                                                <MenuItem key={a.id} value={a.id}>
                                                                    {a.nombre}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <FormControl fullWidth>
                                                        <InputLabel id="tipo-servicio-label-muestra" shrink>Tipo Servicio</InputLabel>
                                                        <Select
                                                            labelId="tipo-servicio-label-muestra"
                                                            label='Tipo Servicio'
                                                            value={tipoServicio}
                                                            displayEmpty
                                                            notched
                                                            disabled={!area}
                                                            onChange={(e) => setTipoServicio(e.target.value as number | '')}
                                                        >
                                                            <MenuItem value='' disabled>Seleccionar tipo de servicio</MenuItem>
                                                            {todasLasFamilias
                                                                .filter(f => f.areaId === area)
                                                                .map((f) => (
                                                                    <MenuItem key={f.id} value={f.id}>
                                                                        {f.nombre}
                                                                    </MenuItem>
                                                                ))
                                                            }
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <FormControl fullWidth>
                                                        <InputLabel id="sede-label-muestra">Sede</InputLabel>
                                                        <Select
                                                            labelId="sede-label-muestra"
                                                            label='Sede'
                                                            value={sede}
                                                            onChange={(e) => {
                                                                setSede(e.target.value)
                                                                if (e.target.value !== 'Otro') {
                                                                    setCustomSede('')
                                                                }
                                                            }}
                                                        >
                                                            <MenuItem value='PA Chillán'>PA Chillán</MenuItem>
                                                            <MenuItem value='PA Concepción'>PA Concepción</MenuItem>
                                                            <MenuItem value='Cliente'>Cliente</MenuItem>
                                                            <MenuItem value='Otro'>Otro</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    {sede === 'Otro' && (
                                                        <TextField
                                                            label='Especificar Sede'
                                                            value={customSede}
                                                            onChange={(e) => setCustomSede(e.target.value)}
                                                            fullWidth
                                                            required
                                                            placeholder='Ingrese la sede'
                                                            sx={{ mt: 2 }}
                                                        />
                                                    )}
                                                </Grid>
                                            </Grid>

                                            {/* Fila 2: Fecha Codificación, Fecha Muestreo, Fecha Ingreso, Fecha Entrega */}
                                            <Grid container spacing={3} sx={{ mt: 0 }}>
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
                                                        label='Fecha Muestreo'
                                                        type='date'
                                                        value={fechaServicio}
                                                        onChange={(e) => setFechaServicio(e.target.value)}
                                                        required
                                                        fullWidth
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </Grid>
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
                                            </Grid>

                                            {/* Título: Descripción de la muestra */}
                                            <Typography variant='subtitle1' sx={{ fontWeight: 700, mt: 4, mb: 1 }}>
                                                Descripción de la muestra
                                            </Typography>
                                            <Divider sx={{ mb: 3 }} />

                                            {/* Fila 3: Tipo de Material, Ítem, Nº Tarjeta, Nº Muestra */}
                                            <Grid container spacing={3}>
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
                                                            <MenuItem value='Otro'>Otro</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    {tipoMaterial === 'Otro' && (
                                                        <TextField
                                                            label='Especificar Material'
                                                            value={customTipoMaterial}
                                                            onChange={(e) => setCustomTipoMaterial(e.target.value)}
                                                            fullWidth
                                                            required
                                                            placeholder='Ingrese el tipo de material'
                                                            sx={{ mt: 2 }}
                                                        />
                                                    )}
                                                </Grid>
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
                                                            <MenuItem value='Otro'>Otro</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    {item === 'Otro' && (
                                                        <TextField
                                                            label='Especificar Ítem'
                                                            value={customItem}
                                                            onChange={(e) => setCustomItem(e.target.value)}
                                                            fullWidth
                                                            required
                                                            placeholder='Ingrese el ítem'
                                                            sx={{ mt: 2 }}
                                                        />
                                                    )}
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        label='Nº Tarjeta'
                                                        value={numeroTarjeta}
                                                        onChange={(e) => setNumeroTarjeta(e.target.value)}
                                                        required
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        label='Nº Muestra'
                                                        value={tomaMuestra}
                                                        onChange={(e) => setTomaMuestra(e.target.value)}
                                                        fullWidth
                                                    />
                                                </Grid>
                                            </Grid>




                                            {/* Fila 4: Procedencia, Ubicación/Sector */}
                                            <Grid container spacing={3} sx={{ mt: 0 }}>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        label='Procedencia'
                                                        value={procedencia}
                                                        onChange={(e) => setProcedencia(e.target.value)}
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        label='Ubicación/Sector'
                                                        value={ubicacionSector}
                                                        onChange={(e) => setUbicacionSector(e.target.value)}
                                                        fullWidth
                                                    />
                                                </Grid>
                                            </Grid>

                                            {/* Fila 5: Cantidad Muestras, Vencimiento, Informe Ensayo */}
                                            <Grid container spacing={3} sx={{ mt: 0 }} alignItems='center'>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        label='Cantidad de Muestras'
                                                        type='number'
                                                        value={cantidadMuestras}
                                                        onChange={(e) => {
                                                            setErrorVencimiento('')
                                                            setCantidadMuestras(e.target.value)
                                                        }}
                                                        required
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
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
                                                <Grid item xs={12} md={3}>
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
                                        </>
                                    ) : rcmType === 'Control' ? (
                                        /* ═══════════════════════════════════════════ */
                                        /* LAYOUT PARA TIPO CONTROL                   */
                                        /* ═══════════════════════════════════════════ */
                                        <>
                                            {/* Fila 1: Área, Tipo Servicio, Sede */}
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={4}>
                                                    <FormControl fullWidth>
                                                        <InputLabel id="area-label-control" shrink>Área</InputLabel>
                                                        <Select
                                                            labelId="area-label-control"
                                                            label='Área'
                                                            value={area}
                                                            displayEmpty
                                                            notched
                                                            onChange={(e) => {
                                                                const valor = e.target.value as number | ''
                                                                setArea(valor)
                                                                setTipoServicio('')
                                                            }}
                                                        >
                                                            <MenuItem value='' disabled>Seleccionar área</MenuItem>
                                                            {areas.map((a) => (
                                                                <MenuItem key={a.id} value={a.id}>
                                                                    {a.nombre}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <FormControl fullWidth>
                                                        <InputLabel id="tipo-servicio-label-control" shrink>Tipo Servicio</InputLabel>
                                                        <Select
                                                            labelId="tipo-servicio-label-control"
                                                            label='Tipo Servicio'
                                                            value={tipoServicio}
                                                            displayEmpty
                                                            notched
                                                            disabled={!area}
                                                            onChange={(e) => setTipoServicio(e.target.value as number | '')}
                                                        >
                                                            <MenuItem value='' disabled>Seleccionar tipo de servicio</MenuItem>
                                                            {todasLasFamilias
                                                                .filter(f => f.areaId === area)
                                                                .map((f) => (
                                                                    <MenuItem key={f.id} value={f.id}>
                                                                        {f.nombre}
                                                                    </MenuItem>
                                                                ))
                                                            }
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <FormControl fullWidth>
                                                        <InputLabel id="sede-label-control">Sede</InputLabel>
                                                        <Select
                                                            labelId="sede-label-control"
                                                            label='Sede'
                                                            value={sede}
                                                            onChange={(e) => {
                                                                setSede(e.target.value)
                                                                if (e.target.value !== 'Otro') {
                                                                    setCustomSede('')
                                                                }
                                                            }}
                                                        >
                                                            <MenuItem value='PA Chillán'>PA Chillán</MenuItem>
                                                            <MenuItem value='PA Concepción'>PA Concepción</MenuItem>
                                                            <MenuItem value='Cliente'>Cliente</MenuItem>
                                                            <MenuItem value='Otro'>Otro</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                    {sede === 'Otro' && (
                                                        <TextField
                                                            label='Especificar Sede'
                                                            value={customSede}
                                                            onChange={(e) => setCustomSede(e.target.value)}
                                                            fullWidth
                                                            required
                                                            placeholder='Ingrese la sede'
                                                            sx={{ mt: 2 }}
                                                        />
                                                    )}
                                                </Grid>
                                            </Grid>

                                            {/* Fila 2: Fecha Codificación, Fecha Servicio, Fecha Ingreso, Fecha Entrega */}
                                            <Grid container spacing={3} sx={{ mt: 0 }}>
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
                                            </Grid>

                                            {/* Título: Descripción del control */}
                                            <Typography variant='subtitle1' sx={{ fontWeight: 700, mt: 4, mb: 1 }}>
                                                Descripción del control
                                            </Typography>
                                            <Divider sx={{ mb: 3 }} />

                                            {/* Fila 3: Ítem, Observación al Ítem */}
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={6}>
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
                                                            <MenuItem value='Otro'>Otro</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        label='Observación al Ítem'
                                                        value={observacionItem}
                                                        onChange={(e) => setObservacionItem(e.target.value)}
                                                        fullWidth
                                                        placeholder='Ingrese observaciones sobre el ítem...'
                                                    />
                                                </Grid>
                                            </Grid>
                                            {/* Fila "Otro" para Ítem — se muestra debajo cuando se selecciona Otro */}
                                            {item === 'Otro' && (
                                                <Grid container spacing={3} sx={{ mt: 0 }}>
                                                    <Grid item xs={12} md={6}>
                                                        <TextField
                                                            label='Especificar Ítem'
                                                            value={customItem}
                                                            onChange={(e) => setCustomItem(e.target.value)}
                                                            fullWidth
                                                            required
                                                            placeholder='Ingrese el ítem'
                                                        />
                                                    </Grid>
                                                </Grid>
                                            )}

                                            {/* Fila 4: Ubicación/Sector, Informe de Ensayo */}
                                            <Grid container spacing={3} sx={{ mt: 0 }} alignItems='center'>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        label='Ubicación/Sector'
                                                        value={ubicacionSector}
                                                        onChange={(e) => setUbicacionSector(e.target.value)}
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={informeEnsayo}
                                                                onChange={(e) => setInformeEnsayo(e.target.checked)}
                                                            />
                                                        }
                                                        label='Informe de Ensayo'
                                                    />
                                                </Grid>
                                            </Grid>
                                        </>
                                    ) : (
                                        /* ═══════════════════════════════════════════ */
                                        /* LAYOUT PARA TIPO SERVICIO                  */
                                        /* ═══════════════════════════════════════════ */
                                        <Grid container spacing={3}>
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
                                            <Grid item xs={12} md={3}>
                                                <FormControl fullWidth>
                                                    <InputLabel id="sede-label">Sede</InputLabel>
                                                    <Select
                                                        labelId="sede-label"
                                                        label='Sede'
                                                        value={sede}
                                                        onChange={(e) => {
                                                            setSede(e.target.value)
                                                            if (e.target.value !== 'Otro') {
                                                                setCustomSede('')
                                                            }
                                                        }}
                                                    >
                                                        <MenuItem value='PA Chillán'>PA Chillán</MenuItem>
                                                        <MenuItem value='PA Concepción'>PA Concepción</MenuItem>
                                                        <MenuItem value='Cliente'>Cliente</MenuItem>
                                                        <MenuItem value='Otro'>Otro</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            {sede === 'Otro' && (
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        label='Especificar Sede'
                                                        value={customSede}
                                                        onChange={(e) => setCustomSede(e.target.value)}
                                                        fullWidth
                                                        required
                                                        placeholder='Ingrese la sede'
                                                    />
                                                </Grid>
                                            )}
                                            <Grid item xs={12} md={4}>
                                                <FormControl fullWidth>
                                                    <InputLabel id="area-label" shrink>Área</InputLabel>
                                                    <Select
                                                        labelId="area-label"
                                                        label='Área'
                                                        value={area}
                                                        displayEmpty
                                                        notched
                                                        onChange={(e) => {
                                                            const valor = e.target.value as number | ''
                                                            setArea(valor)
                                                            setTipoServicio('')
                                                        }}
                                                    >
                                                        <MenuItem value='' disabled>Seleccionar área</MenuItem>
                                                        {areas.map((a) => (
                                                            <MenuItem key={a.id} value={a.id}>
                                                                {a.nombre}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <FormControl fullWidth>
                                                    <InputLabel id="tipo-servicio-label" shrink>Tipo Servicio</InputLabel>
                                                    <Select
                                                        labelId="tipo-servicio-label"
                                                        label='Tipo Servicio'
                                                        value={tipoServicio}
                                                        displayEmpty
                                                        notched
                                                        disabled={!area}
                                                        onChange={(e) => setTipoServicio(e.target.value as number | '')}
                                                    >
                                                        <MenuItem value='' disabled>Seleccionar tipo de servicio</MenuItem>
                                                        {todasLasFamilias
                                                            .filter(f => f.areaId === area)
                                                            .map((f) => (
                                                                <MenuItem key={f.id} value={f.id}>
                                                                    {f.nombre}
                                                                </MenuItem>
                                                            ))
                                                        }
                                                    </Select>
                                                </FormControl>
                                            </Grid>
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
                                                        <MenuItem value='Otro'>Otro</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            {item === 'Otro' && (
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        label='Especificar Ítem'
                                                        value={customItem}
                                                        onChange={(e) => setCustomItem(e.target.value)}
                                                        fullWidth
                                                        required
                                                        placeholder='Ingrese el ítem'
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
                                    )}

                                    {/* Campos dinámicos Área Hormigón — antes de ensayos */}
                                    {rcmType === 'Muestra' && (areas.find(a => a.id === area)?.nombre?.toLowerCase() === 'hormigón' || areas.find(a => a.id === area)?.nombre?.toLowerCase() === 'elementos y componentes') && (
                                        <Box sx={{ mt: 4, p: 3, border: '1px solid #f3e5f5', borderRadius: 2, bgcolor: '#fdf6ff' }}>
                                            <Typography
                                                variant='overline'
                                                sx={{
                                                    fontWeight: 800,
                                                    letterSpacing: 2,
                                                    color: '#e91e8c',
                                                    display: 'block',
                                                    mb: 2
                                                }}
                                            >
                                                Campos Dinámicos — Área {areas.find(a => a.id === area)?.nombre}
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        label='Fecha Confección'
                                                        type='date'
                                                        value={fechaConfeccion}
                                                        onChange={(e) => setFechaConfeccion(e.target.value)}
                                                        fullWidth
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <TextField
                                                        label='Elemento'
                                                        value={elemento}
                                                        onChange={(e) => setElemento(e.target.value)}
                                                        fullWidth
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={3}>
                                                    <FormControl fullWidth>
                                                        <InputLabel>Grado</InputLabel>
                                                        <Select
                                                            label='Grado'
                                                            value={grado}
                                                            onChange={(e) => setGrado(e.target.value)}
                                                        >
                                                            <MenuItem value=''>Seleccionar...</MenuItem>
                                                            <MenuItem value='G5'>G5</MenuItem>
                                                            <MenuItem value='G10'>G10</MenuItem>
                                                            <MenuItem value='G15'>G15</MenuItem>
                                                            <MenuItem value='G20'>G20</MenuItem>
                                                            <MenuItem value='G25'>G25</MenuItem>
                                                            <MenuItem value='G30'>G30</MenuItem>
                                                            <MenuItem value='G35'>G35</MenuItem>
                                                            <MenuItem value='G40'>G40</MenuItem>
                                                            <MenuItem value='Otro'>Otro...</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                {grado === 'Otro' && (
                                                    <Grid item xs={12} md={3}>
                                                        <TextField
                                                            label='Especificar Grado'
                                                            value={customGrado}
                                                            onChange={(e) => setCustomGrado(e.target.value)}
                                                            fullWidth
                                                            required
                                                            placeholder='Ingrese el grado'
                                                        />
                                                    </Grid>
                                                )}
                                            </Grid>
                                        </Box>
                                    )}

                                    {/* Campos dinámicos Área Asfalto — antes de ensayos */}
                                    {rcmType === 'Muestra' && areas.find(a => a.id === area)?.nombre?.toLowerCase() === 'asfalto' && (
                                        <Box sx={{ mt: 4, p: 3, border: '1px solid #f3e5f5', borderRadius: 2, bgcolor: '#fdf6ff' }}>
                                            <Typography
                                                variant='overline'
                                                sx={{
                                                    fontWeight: 800,
                                                    letterSpacing: 2,
                                                    color: '#e91e8c',
                                                    display: 'block',
                                                    mb: 2
                                                }}
                                            >
                                                Campos Dinámicos — Área Asfalto
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid item xs={6} md={3}>
                                                    <TextField
                                                        label='Fecha Confección'
                                                        type='date'
                                                        value={fechaConfeccion}
                                                        onChange={(e) => setFechaConfeccion(e.target.value)}
                                                        fullWidth
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}

                                    {/* Campos dinámicos Área Suelo — antes de ensayos */}
                                    {rcmType === 'Muestra' && areas.find(a => a.id === area)?.nombre?.toLowerCase() === 'suelo' && (
                                        <Box sx={{ mt: 4, p: 3, border: '1px solid #f3e5f5', borderRadius: 2, bgcolor: '#fdf6ff' }}>
                                            <Typography
                                                variant='overline'
                                                sx={{
                                                    fontWeight: 800,
                                                    letterSpacing: 2,
                                                    color: '#e91e8c',
                                                    display: 'block',
                                                    mb: 2
                                                }}
                                            >
                                                Campos Dinámicos — Área Suelo
                                            </Typography>
                                            <Grid container spacing={3}>
                                                <Grid item xs={6} md={3}>
                                                    <TextField
                                                        label='Cota 1'
                                                        type='number'
                                                        value={cota1}
                                                        onChange={(e) => setCota1(e.target.value)}
                                                        fullWidth
                                                        placeholder='Ej: 0.0'
                                                    />
                                                </Grid>
                                                <Grid item xs={6} md={3}>
                                                    <TextField
                                                        label='Cota 2'
                                                        type='number'
                                                        value={cota2}
                                                        onChange={(e) => setCota2(e.target.value)}
                                                        fullWidth
                                                        placeholder='Ej: 1.5'
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}

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
                                                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '80px' }}>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ensayosAsociados.map((ensayo, index) => (
                                                            ensayo.esPaquete ? (
                                                                // Renderizado de paquete
                                                                <React.Fragment key={ensayo.id}>
                                                                    {/* Fila cabecera del paquete */}
                                                                    <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #BBDEFB' }}>
                                                                        <td style={{ padding: '12px' }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                <InventoryIcon sx={{ fontSize: 18, color: '#1565C0' }} />
                                                                                <Typography variant='body2' sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1565C0' }}>
                                                                                    PAQUETE SKU {ensayo.sku}
                                                                                </Typography>
                                                                            </Box>
                                                                        </td>
                                                                        <td style={{ padding: '12px' }}>
                                                                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                                                {ensayo.nombre}
                                                                            </Typography>
                                                                        </td>
                                                                        <td colSpan={2} style={{ padding: '12px' }}>
                                                                            <Alert severity='warning' sx={{ py: 0, px: 1, '& .MuiAlert-message': { fontSize: '12px' } }}>
                                                                                Puedes quitar ítems individuales; recuerda que ítems fuera de cotización pueden generar costos no previstos
                                                                            </Alert>
                                                                        </td>
                                                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                                                            <Button
                                                                                size='small'
                                                                                color='error'
                                                                                variant='outlined'
                                                                                startIcon={<CloseIcon />}
                                                                                onClick={() => handleDeleteEnsayo(ensayo.id)}
                                                                                sx={{ textTransform: 'none', fontSize: '12px' }}
                                                                            >
                                                                                Quitar paquete completo
                                                                            </Button>
                                                                        </td>
                                                                    </tr>
                                                                    {/* Filas de sub-productos */}
                                                                    {ensayo.subProductos?.map((sub) => (
                                                                        <tr key={sub.id} style={{ borderBottom: '1px solid #E3F2FD', backgroundColor: '#F5F9FF' }}>
                                                                            <td style={{ padding: '12px', paddingLeft: '36px' }}>
                                                                                <Typography variant='body2' sx={{ fontFamily: 'monospace', color: '#1976D2' }}>
                                                                                    {sub.sku}
                                                                                </Typography>
                                                                            </td>
                                                                            <td style={{ padding: '12px' }}>
                                                                                <Typography variant='body2'>
                                                                                    {sub.nombre}
                                                                                </Typography>
                                                                                {sub.norma && (
                                                                                    <Typography variant='caption' color='text.secondary'>
                                                                                        {sub.norma}
                                                                                    </Typography>
                                                                                )}
                                                                            </td>
                                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                                {sub.isEditing ? (
                                                                                    <TextField
                                                                                        size='small'
                                                                                        value={sub.cantidad}
                                                                                        onChange={(e) => handleChangeSubProductoCantidad(ensayo.id, sub.id, parseInt(e.target.value) || 0)}
                                                                                        type='number'
                                                                                        sx={{ width: '80px' }}
                                                                                        inputProps={{ min: 1 }}
                                                                                    />
                                                                                ) : (
                                                                                    <Typography variant='body2'>{sub.cantidad}</Typography>
                                                                                )}
                                                                            </td>
                                                                            <td style={{ padding: '12px' }}>
                                                                                {sub.isEditing ? (
                                                                                    <TextField
                                                                                        size='small'
                                                                                        fullWidth
                                                                                        value={sub.observacion}
                                                                                        onChange={(e) => handleChangeSubProductoObservacion(ensayo.id, sub.id, e.target.value)}
                                                                                        placeholder='Observación...'
                                                                                    />
                                                                                ) : (
                                                                                    <Typography variant='body2' color='text.secondary'>
                                                                                        {sub.observacion || '\u2014'}
                                                                                    </Typography>
                                                                                )}
                                                                            </td>
                                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                                                    <IconButton
                                                                                        size='small'
                                                                                        sx={{ color: '#FFA726' }}
                                                                                        onClick={() => handleToggleEditSubProducto(ensayo.id, sub.id)}
                                                                                        title={sub.isEditing ? 'Guardar cambios' : 'Modificar'}
                                                                                    >
                                                                                        {sub.isEditing ? <CheckCircleIcon fontSize='small' /> : <EditIcon fontSize='small' />}
                                                                                    </IconButton>
                                                                                    <IconButton
                                                                                        size='small'
                                                                                        color='error'
                                                                                        onClick={() => handleDeleteSubProducto(ensayo.id, sub.id)}
                                                                                        title='Quitar del paquete'
                                                                                    >
                                                                                        <DeleteIcon fontSize='small' />
                                                                                    </IconButton>
                                                                                </Box>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </React.Fragment>
                                                            ) : (
                                                                // Renderizado de ensayo individual
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
                                                                        {ensayo.isEditing || ensayosPendientes.has(ensayo.id) ? (
                                                                            <TextField
                                                                                ref={index === ensayosAsociados.length - 1 ? lastEnsayoCantidadRef : null}
                                                                                size='small'
                                                                                value={ensayo.cantidad}
                                                                                onChange={(e) => handleChangeCantidad(ensayo.id, parseInt(e.target.value) || 0)}
                                                                                onKeyPress={(e) => handleKeyPressQuantity(e, ensayo.id)}
                                                                                type='number'
                                                                                sx={{ width: '80px' }}
                                                                                inputProps={{ min: 1 }}
                                                                            />
                                                                        ) : (
                                                                            <Typography variant='body2'>{ensayo.cantidad}</Typography>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '12px' }}>
                                                                        {ensayo.isEditing || ensayosPendientes.has(ensayo.id) ? (
                                                                            <TextField
                                                                                size='small'
                                                                                fullWidth
                                                                                value={ensayo.observacion}
                                                                                onChange={(e) => handleChangeObservacion(ensayo.id, e.target.value)}
                                                                                placeholder='Observación...'
                                                                            />
                                                                        ) : (
                                                                            <Typography variant='body2' color='text.secondary'>
                                                                                {ensayo.observacion || '\u2014'}
                                                                            </Typography>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                        {ensayosPendientes.has(ensayo.id) ? (
                                                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                                                <IconButton
                                                                                    size='small'
                                                                                    color='success'
                                                                                    onClick={() => handleConfirmEnsayo(ensayo.id)}
                                                                                    title='Confirmar ensayo'
                                                                                >
                                                                                    <CheckCircleIcon fontSize='small' />
                                                                                </IconButton>
                                                                                <IconButton
                                                                                    size='small'
                                                                                    color='error'
                                                                                    onClick={() => handleCancelEnsayo(ensayo.id)}
                                                                                    title='Cancelar ensayo'
                                                                                >
                                                                                    <CloseIcon fontSize='small' />
                                                                                </IconButton>
                                                                            </Box>
                                                                        ) : (
                                                                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                                                <IconButton
                                                                                    size='small'
                                                                                    sx={{ color: '#FFA726' }}
                                                                                    onClick={() => handleToggleEditEnsayo(ensayo.id)}
                                                                                    title={ensayo.isEditing ? 'Guardar cambios' : 'Modificar'}
                                                                                >
                                                                                    {ensayo.isEditing ? <CheckCircleIcon fontSize='small' /> : <EditIcon fontSize='small' />}
                                                                                </IconButton>
                                                                                <IconButton
                                                                                    size='small'
                                                                                    color='error'
                                                                                    onClick={() => handleDeleteEnsayo(ensayo.id)}
                                                                                    title='Eliminar ensayo'
                                                                                >
                                                                                    <DeleteIcon fontSize='small' />
                                                                                </IconButton>
                                                                            </Box>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </Box>
                                        )}


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

                                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '80px' }}>N°</th>
                                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Días</th>
                                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '200px' }}>Fecha Vencimiento</th>
                                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Cantidad</th>
                                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '100px' }}>Acciones</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {submuestrasVencimiento.map((submuestra) => (
                                                                <tr key={submuestra.id} style={{ borderBottom: '1px solid #E0E0E0' }}>

                                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                        <TextField
                                                                            size='small'
                                                                            type='number'
                                                                            value={submuestra.numero}
                                                                            onChange={(e) => {
                                                                                const numero = parseInt(e.target.value) || 0
                                                                                setSubmuestrasVencimiento(submuestrasVencimiento.map(s =>
                                                                                    s.id === submuestra.id
                                                                                        ? { ...s, numero }
                                                                                        : s
                                                                                ))
                                                                            }}
                                                                            sx={{ width: '70px' }}
                                                                            inputProps={{ min: 1 }}
                                                                        />
                                                                    </td>
                                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                        <TextField
                                                                            size='small'
                                                                            type='number'
                                                                            value={submuestra.dias}
                                                                            onChange={(e) => {
                                                                                const dias = parseInt(e.target.value) || 0
                                                                                const fechaBase = new Date((fechaCodificacion || getTodayDateForInput()) + 'T00:00:00')
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
                                                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                                            <DatePicker
                                                                                value={submuestra.fechaVencimiento ? new Date(submuestra.fechaVencimiento + 'T00:00:00') : null}
                                                                                minDate={fechaCodificacion ? new Date(fechaCodificacion + 'T00:00:00') : undefined}
                                                                                onChange={(newValue) => {
                                                                                    const nuevaFecha = newValue ? `${newValue.getFullYear()}-${String(newValue.getMonth() + 1).padStart(2, '0')}-${String(newValue.getDate()).padStart(2, '0')}` : ''
                                                                                    const fechaBase = new Date((fechaCodificacion || getTodayDateForInput()) + 'T00:00:00')
                                                                                    const fechaVenc = new Date(nuevaFecha + 'T00:00:00')
                                                                                    const diffTime = fechaVenc.getTime() - fechaBase.getTime()
                                                                                    const diffDias = Math.round(diffTime / (1000 * 60 * 60 * 24))
                                                                                    setSubmuestrasVencimiento(submuestrasVencimiento.map(s =>
                                                                                        s.id === submuestra.id
                                                                                            ? { ...s, fechaVencimiento: nuevaFecha, dias: diffDias >= 0 ? diffDias : 0 }
                                                                                            : s
                                                                                    ))
                                                                                }}
                                                                                slotProps={{
                                                                                    textField: { size: 'small', sx: { width: '170px' } }
                                                                                }}
                                                                            />
                                                                        </LocalizationProvider>
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

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* LISTADO 2: CREADOS (Pendientes de Agrupar)            */}
                    {/* ═══════════════════════════════════════════════════════ */}

                    {/* Estado vacío cuando no hay RCMs creados */}
                    {rcmsCreados.length === 0 && !showRcmCard && (
                        <Box sx={{ mt: 6, textAlign: 'center', py: 8 }}>
                            <Box sx={{ mb: 3 }}>
                                <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                            </Box>
                            <Typography variant='h6' sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                                No hay RCMs creados aún
                            </Typography>
                            <Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>
                                Presiona "+ Nuevo RCM" para comenzar.
                            </Typography>
                            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                                Puedes crear muestras, controles o servicios.
                            </Typography>
                        </Box>
                    )}

                    {rcmsCreados.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                    Creados (Pendientes de Agrupar)
                                </Typography>
                                <Chip
                                    label={rcmsCreados.length}
                                    size='small'
                                    sx={{
                                        fontWeight: 700,
                                        bgcolor: '#FFF3E0',
                                        color: '#E65100',
                                        border: '1px solid #FFB74D',
                                        minWidth: 28,
                                    }}
                                />
                            </Box>
                            {rcmsCreados.map(rcm => (
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
                                                sx={{
                                                    fontWeight: 'bold',
                                                    backgroundColor: rcm.rcmType === 'Muestra' ? '#1976d2' : rcm.rcmType === 'Control' ? '#e91e63' : '#424242',
                                                    color: '#ffffff'
                                                }}
                                            />

                                            {/* Mostrar estado: Pendiente de agrupar (amarillo-naranja) */}
                                            <Chip
                                                label='Pendiente de agrupar'
                                                size='small'
                                                sx={{
                                                    fontWeight: 600,
                                                    bgcolor: '#FFF3E0',
                                                    color: '#E65100',
                                                    border: '1px solid #FFB74D',
                                                }}
                                            />

                                            {/* Mostrar campos según el tipo de RCM */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>

                                                {/* MUESTRA: Sede | Área | Tipo de Servicio | Tarjeta | #Toma de Muestra | Material | Ítem | Procedencia | Ensayo/Servicio | Fecha Ensayo | Cantidad */}
                                                {rcm.rcmType === 'Muestra' && (
                                                    <>
                                                        {rcm.sede && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.sede}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.area && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.area}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.tipoServicio && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.tipoServicio}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.numeroTarjeta && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.numeroTarjeta}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.tomaMuestra && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>#{rcm.tomaMuestra}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.tipoMaterial && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.tipoMaterial}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.item && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.item}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.procedencia && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.procedencia}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.ensayos.length > 0 && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.ensayos[0].nombre}</Typography>
                                                            </>
                                                        )}
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>
                                                                {(() => {
                                                                    if (rcm.tieneVencimiento && rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0) {
                                                                        const fechas = rcm.submuestrasVencimiento
                                                                            .map(sub => sub.fechaVencimiento)
                                                                            .filter(f => !!f)
                                                                            .sort()
                                                                        if (fechas.length === 0) return formatDateOnly(rcm.fechaServicio)
                                                                        if (fechas.length === 1) return formatDateOnly(fechas[0])
                                                                        return `${formatDateOnly(fechas[0])} - ${formatDateOnly(fechas[fechas.length - 1])}`
                                                                    }
                                                                    return formatDateOnly(rcm.fechaServicio)
                                                                })()}
                                                            </Typography>
                                                        </>
                                                        {rcm.cantidadMuestras && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.cantidadMuestras}</Typography>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {/* CONTROL: Sede | Área | Tipo de Servicio | Fecha Servicio | Ítem | Ensayo/Servicio | Cantidad */}
                                                {rcm.rcmType === 'Control' && (
                                                    <>
                                                        {rcm.sede && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.sede}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.area && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.area}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.tipoServicio && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.tipoServicio}</Typography>
                                                            </>
                                                        )}
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>
                                                                {(() => {
                                                                    if (rcm.tieneVencimiento && rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0) {
                                                                        const fechas = rcm.submuestrasVencimiento
                                                                            .map(sub => sub.fechaVencimiento)
                                                                            .filter(f => !!f)
                                                                            .sort()
                                                                        if (fechas.length === 0) return formatDateOnly(rcm.fechaServicio)
                                                                        if (fechas.length === 1) return formatDateOnly(fechas[0])
                                                                        return `${formatDateOnly(fechas[0])} - ${formatDateOnly(fechas[fechas.length - 1])}`
                                                                    }
                                                                    return formatDateOnly(rcm.fechaServicio)
                                                                })()}
                                                            </Typography>
                                                        </>
                                                        {rcm.item && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.item}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.ensayos.length > 0 && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.ensayos[0].nombre}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.cantidadMuestras && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.cantidadMuestras}</Typography>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {/* SERVICIO: Sede | Área | Tipo de Servicio | Fecha Servicio | Cantidad */}
                                                {rcm.rcmType === 'Servicio' && (
                                                    <>
                                                        {rcm.sede && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.sede}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.area && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.area}</Typography>
                                                            </>
                                                        )}
                                                        {rcm.tipoServicio && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.tipoServicio}</Typography>
                                                            </>
                                                        )}
                                                        <>
                                                            <Typography variant='body2' color='text.secondary'>|</Typography>
                                                            <Typography variant='body2'>
                                                                {(() => {
                                                                    if (rcm.tieneVencimiento && rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0) {
                                                                        const fechas = rcm.submuestrasVencimiento
                                                                            .map(sub => sub.fechaVencimiento)
                                                                            .filter(f => !!f)
                                                                            .sort()
                                                                        if (fechas.length === 0) return formatDateOnly(rcm.fechaServicio)
                                                                        if (fechas.length === 1) return formatDateOnly(fechas[0])
                                                                        return `${formatDateOnly(fechas[0])} - ${formatDateOnly(fechas[fechas.length - 1])}`
                                                                    }
                                                                    return formatDateOnly(rcm.fechaServicio)
                                                                })()}
                                                            </Typography>
                                                        </>
                                                        {rcm.cantidadMuestras && (
                                                            <>
                                                                <Typography variant='body2' color='text.secondary'>|</Typography>
                                                                <Typography variant='body2'>{rcm.cantidadMuestras}</Typography>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                size='small'
                                                checked={selectedRcmIds.includes(rcm.id)}
                                                onChange={() => handleToggleRcmSelection(rcm.id)}
                                            />
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
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </Box>

                                            {rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0 && (
                                                <>
                                                    <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2, mt: 4 }}>
                                                        Submuestras con Vencimiento ({rcm.submuestrasVencimiento.length})
                                                    </Typography>
                                                    <Box sx={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ backgroundColor: '#F5F5F5' }}>
                                                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '80px' }}>N°</th>
                                                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Días</th>
                                                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '200px' }}>Fecha Vencimiento</th>
                                                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', borderBottom: '2px solid #E0E0E0', width: '120px' }}>Cantidad</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {rcm.submuestrasVencimiento.map((submuestra) => (
                                                                    <tr key={submuestra.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                            <Typography variant='body2'>{submuestra.numero}</Typography>
                                                                        </td>
                                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                            <Typography variant='body2'>{submuestra.dias}</Typography>
                                                                        </td>
                                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                            <Typography variant='body2'>{formatDateOnly(submuestra.fechaVencimiento)}</Typography>
                                                                        </td>
                                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                            <Typography variant='body2'>{submuestra.cantidad}</Typography>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </Box>
                                                </>
                                            )}
                                        </Box>
                                    </Collapse>

                                    {/* Barra de acciones rápidas debajo del RCM recién guardado */}
                                    {actionBarRcmId === rcm.id && !showRcmCard && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                gap: 1.5,
                                                px: 2,
                                                py: 1.5,
                                                bgcolor: '#BBDEFB',
                                                borderTop: '1px solid #90CAF9'
                                            }}
                                        >
                                            <Button
                                                variant='contained'
                                                size='small'
                                                startIcon={<AddIcon />}
                                                onClick={handleNewRcmClick}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: '6px',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    bgcolor: '#1976D2',
                                                    '&:hover': { bgcolor: '#1565C0' }
                                                }}
                                            >
                                                Nuevo RCM
                                            </Button>
                                            <Button
                                                variant='outlined'
                                                size='small'
                                                startIcon={<ContentCopyIcon />}
                                                onClick={() => {
                                                    setSelectedRcmId(rcm.id)
                                                    setActionBarRcmId(null)
                                                    // Duplicar lógica inline
                                                    const rcmToDuplicate = savedRcms.find(r => r.id === rcm.id)
                                                    if (rcmToDuplicate) {
                                                        setRcmType(rcmToDuplicate.rcmType)

                                                        // Cargar sede
                                                        const standardSedes = ['PA Chillán', 'PA Concepción', 'Cliente']
                                                        if (rcmToDuplicate.sede && !standardSedes.includes(rcmToDuplicate.sede)) {
                                                            setSede('Otro')
                                                            setCustomSede(rcmToDuplicate.sede)
                                                        } else {
                                                            setSede(rcmToDuplicate.sede || 'PA Chillán')
                                                            setCustomSede('')
                                                        }

                                                        // Encontrar IDs por nombre
                                                        const areaFound = areas.find(a => a.nombre === rcmToDuplicate.area)
                                                        setArea(areaFound ? areaFound.id : '')

                                                        const familiaFound = todasLasFamilias.find(f => f.nombre === rcmToDuplicate.tipoServicio)
                                                        setTipoServicio(familiaFound ? familiaFound.id : '')

                                                        setNumeroTarjeta('')
                                                        setTipoMaterial(rcmToDuplicate.tipoMaterial)
                                                        setItem(rcmToDuplicate.item)
                                                        setProcedencia(rcmToDuplicate.procedencia || '')
                                                        setTomaMuestra(rcmToDuplicate.tomaMuestra || '')
                                                        setCantidadMuestras(rcmToDuplicate.cantidadMuestras)
                                                        setFechaServicio(rcmToDuplicate.fechaServicio)
                                                        setEnsayosAsociados([...rcmToDuplicate.ensayos])
                                                        setTieneVencimiento(rcmToDuplicate.tieneVencimiento || false)
                                                        setSubmuestrasVencimiento(rcmToDuplicate.submuestrasVencimiento || [])
                                                        setIsDuplicatingRcm(true)
                                                        setShowRcmCard(true)
                                                        setExpandedRcm(true)
                                                    }
                                                }}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: '6px',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    borderColor: '#1976D2',
                                                    color: '#1976D2',
                                                    bgcolor: 'white',
                                                    '&:hover': { bgcolor: '#E3F2FD', borderColor: '#1565C0' }
                                                }}
                                            >
                                                Duplicar este
                                            </Button>
                                            <Button
                                                variant='outlined'
                                                size='small'
                                                startIcon={<LayersIcon />}
                                                onClick={(e) => {
                                                    setSelectedRcmIds([rcm.id])
                                                    handleOpenCodigoPopup(e)
                                                }}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: '6px',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    borderColor: '#7B1FA2',
                                                    color: '#7B1FA2',
                                                    bgcolor: 'white',
                                                    '&:hover': { bgcolor: '#F3E5F5', borderColor: '#6A1B9A' }
                                                }}
                                            >
                                                Asociar a Producto
                                            </Button>
                                            <Button
                                                variant='text'
                                                size='small'
                                                onClick={() => setActionBarRcmId(null)}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: '6px',
                                                    fontWeight: 600,
                                                    fontSize: '0.8rem',
                                                    color: '#666',
                                                    '&:hover': { bgcolor: '#E0E0E0' }
                                                }}
                                            >
                                                Cerrar
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* ═══════════════════════════════════════════════════════ */}
                    {/* LISTADO 3: AGRUPADOS (con Código Producto)             */}
                    {/* ═══════════════════════════════════════════════════════ */}
                    {rcmsAgrupados.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                    Agrupados
                                </Typography>
                                <Chip
                                    label={rcmsAgrupados.length}
                                    size='small'
                                    sx={{
                                        fontWeight: 700,
                                        bgcolor: '#E8F5E9',
                                        color: '#2E7D32',
                                        border: '1px solid #81C784',
                                        minWidth: 28,
                                    }}
                                />
                            </Box>
                            {rcmsAgrupados.map(rcm => (
                                <Box
                                    key={rcm.id}
                                    sx={{
                                        bgcolor: '#E8F5E9',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        mb: 2
                                    }}
                                >
                                    {/* Header del RCM agrupado */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 2,
                                            bgcolor: '#E8F5E9',
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
                                                sx={{
                                                    fontWeight: 'bold',
                                                    backgroundColor: rcm.rcmType === 'Muestra' ? '#1976d2' : rcm.rcmType === 'Control' ? '#e91e63' : '#424242',
                                                    color: '#ffffff'
                                                }}
                                            />

                                            {/* Mostrar estado: Agrupado (verde) */}
                                            <Chip
                                                label='Agrupado'
                                                size='small'
                                                sx={{
                                                    fontWeight: 600,
                                                    bgcolor: '#C8E6C9',
                                                    color: '#2E7D32',
                                                    border: '1px solid #81C784',
                                                }}
                                            />

                                            {/* Mostrar campos según el tipo de RCM */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                                {rcm.area && (
                                                    <>
                                                        <Typography variant='body2' color='text.secondary'>|</Typography>
                                                        <Typography variant='body2'>{rcm.area}</Typography>
                                                    </>
                                                )}
                                                {rcm.tipoServicio && (
                                                    <>
                                                        <Typography variant='body2' color='text.secondary'>|</Typography>
                                                        <Typography variant='body2'>{rcm.tipoServicio}</Typography>
                                                    </>
                                                )}
                                                {rcm.numeroTarjeta && (
                                                    <>
                                                        <Typography variant='body2' color='text.secondary'>|</Typography>
                                                        <Typography variant='body2'>{rcm.numeroTarjeta}</Typography>
                                                    </>
                                                )}
                                                {rcm.ensayos.length > 0 && (
                                                    <>
                                                        <Typography variant='body2' color='text.secondary'>|</Typography>
                                                        <Typography variant='body2'>{rcm.ensayos[0].nombre}</Typography>
                                                    </>
                                                )}
                                                <>
                                                    <Typography variant='body2' color='text.secondary'>|</Typography>
                                                    <Typography variant='body2'>
                                                        {(() => {
                                                            if (rcm.tieneVencimiento && rcm.submuestrasVencimiento && rcm.submuestrasVencimiento.length > 0) {
                                                                const fechas = rcm.submuestrasVencimiento
                                                                    .map(sub => sub.fechaVencimiento)
                                                                    .filter(f => !!f)
                                                                    .sort()
                                                                if (fechas.length === 0) return formatDateOnly(rcm.fechaServicio)
                                                                if (fechas.length === 1) return formatDateOnly(fechas[0])
                                                                return `${formatDateOnly(fechas[0])} - ${formatDateOnly(fechas[fechas.length - 1])}`
                                                            }
                                                            return formatDateOnly(rcm.fechaServicio)
                                                        })()}
                                                    </Typography>
                                                </>
                                                {rcm.cantidadMuestras && (
                                                    <>
                                                        <Typography variant='body2' color='text.secondary'>|</Typography>
                                                        <Typography variant='body2'>{rcm.cantidadMuestras}</Typography>
                                                    </>
                                                )}
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                            {/* Checkbox solo si Tipo Servicio = Dosificación */}
                                            {rcm.tipoServicio?.toLowerCase() === 'dosificación' && (
                                                <Checkbox
                                                    size='small'
                                                    checked={selectedRcmIds.includes(rcm.id)}
                                                    onChange={() => handleToggleRcmSelection(rcm.id)}
                                                />
                                            )}
                                            <IconButton size='small' onClick={(e) => handleOpenRcmMenu(e, rcm.id)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Contenido expandible del RCM agrupado */}
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
                                                                    <Typography variant='body2'>{ensayo.nombre}</Typography>
                                                                </td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <Typography variant='body2' sx={{ fontWeight: 600 }}>{ensayo.cantidad}</Typography>
                                                                </td>
                                                                <td style={{ padding: '12px' }}>
                                                                    <Typography variant='body2' color='text.secondary'>{ensayo.observacion || '-'}</Typography>
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

                    {/* Botón flotante de agrupación - solo visible cuando hay RCMs seleccionados */}
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 32,
                            left: '50%',
                            transform: selectedRcmIds.length > 0
                                ? 'translateX(-50%) translateY(0)'
                                : 'translateX(-50%) translateY(120px)',
                            opacity: selectedRcmIds.length > 0 ? 1 : 0,
                            pointerEvents: selectedRcmIds.length > 0 ? 'auto' : 'none',
                            transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
                            zIndex: 1300,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                bgcolor: '#1976D2',
                                borderRadius: '8px',
                                px: 3,
                                py: 1.5,
                                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.45), 0 2px 8px rgba(0,0,0,0.2)',
                            }}
                        >
                            <Typography
                                variant='body2'
                                sx={{
                                    fontWeight: 600,
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {selectedRcmIds.length} RCM{selectedRcmIds.length > 1 ? 's' : ''} seleccionado{selectedRcmIds.length > 1 ? 's' : ''}
                            </Typography>
                            <Button
                                variant='contained'
                                startIcon={<LayersIcon />}
                                onClick={(e) => handleOpenCodigoPopup(e)}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    px: 3,
                                    py: 1,
                                    bgcolor: 'white',
                                    color: '#1976D2',
                                    boxShadow: 'none',
                                    '&:hover': {
                                        bgcolor: '#E3F2FD',
                                        boxShadow: 'none',
                                    }
                                }}
                            >
                                Agrupar en Código Producto
                            </Button>
                        </Box>
                    </Box>

                    {/* Spacer para que el contenido no quede oculto detrás del panel fijo */}
                    {codigosAgrupadores.length > 0 && (
                        <Box sx={{ height: '340px' }} />
                    )}
                </Box>
            </Card>

            {/* Sección de Códigos Agrupadores (Productos) - Fija en la parte inferior */}
            {
                codigosAgrupadores.length > 0 && (
                    <Box
                        sx={{
                            position: 'fixed',
                            bottom: 0,
                            left: `${cardRect.left}px`,
                            width: `${cardRect.width}px`,
                            zIndex: 1200,
                            bgcolor: 'white',
                            borderTop: '2px solid #E5E7EB',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                            borderRadius: '0 0 8px 8px',
                        }}
                    >
                        {/* Título y botón Finalizar Codificación */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 1.5 }}>
                            <Box>
                                <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                                    Códigos Agrupadores (Productos)
                                </Typography>
                                <Typography variant='caption' color='text.secondary'>
                                    Productos comerciales facturables generados
                                </Typography>
                            </Box>
                            <Button
                                variant='contained'
                                startIcon={<CheckCircleIcon sx={{ color: 'white' }} />}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    px: 3,
                                    bgcolor: '#1976D2',
                                    '&:hover': { bgcolor: '#1565C0' }
                                }}
                            >
                                Finalizar Codificación
                            </Button>
                        </Box>

                        {/* Tabla de Códigos Agrupadores */}
                        <Box sx={{ overflowX: 'auto', maxHeight: '250px', overflowY: 'auto', px: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>CÓDIGO ID</th>
                                        <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>RCMS VINCULADOS</th>
                                        <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>SKUS / ENSAYOS</th>
                                        <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>DESCRIPCIÓN DEL SERVICIO</th>
                                        <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>CANTIDAD</th>
                                        <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>FACTURACIÓN</th>
                                        <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {codigosAgrupadores.map((agrupador) => (
                                        <tr key={agrupador.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                            {/* Código ID */}
                                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                                <Typography variant='body2' sx={{ fontWeight: 700, color: '#1976D2', fontFamily: 'monospace' }}>
                                                    {agrupador.id}
                                                </Typography>
                                            </td>

                                            {/* RCMs Vinculados */}
                                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {agrupador.rcmsVinculados.map((rcm, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={`RCM-${idx + 1}`}
                                                            size='small'
                                                            sx={{
                                                                bgcolor: '#EEF2FF',
                                                                color: '#4338CA',
                                                                fontWeight: 600,
                                                                fontSize: '0.75rem'
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </td>

                                            {/* SKUs / Ensayos */}
                                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                    {agrupador.ensayos.length > 0 && (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {agrupador.ensayos.map((ensayo, idx) => (
                                                                <Chip
                                                                    key={idx}
                                                                    label={`${ensayo.nombre} (${ensayo.sku})`}
                                                                    size='small'
                                                                    onDelete={() => handleRemoveEnsayoFromAgrupador(agrupador.id, ensayo.productoId)}
                                                                    sx={{
                                                                        bgcolor: '#F0F7FF',
                                                                        color: '#1976D2',
                                                                        fontWeight: 500,
                                                                        fontSize: '0.7rem',
                                                                        '& .MuiChip-deleteIcon': { color: '#90CAF9', '&:hover': { color: '#1976D2' } }
                                                                    }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                    <Button
                                                        startIcon={<SearchIcon />}
                                                        size='small'
                                                        variant='outlined'
                                                        onClick={(e) => handleOpenAgrupadorSearch(e, agrupador.id)}
                                                        sx={{
                                                            textTransform: 'none',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            borderColor: '#E0E0E0',
                                                            color: '#666',
                                                            '&:hover': { borderColor: '#1976D2', color: '#1976D2' }
                                                        }}
                                                    >
                                                        Buscar ensayo
                                                    </Button>
                                                </Box>
                                            </td>

                                            {/* Descripción del Servicio */}
                                            <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                                                <TextField
                                                    size='small'
                                                    value={agrupador.descripcionServicio}
                                                    onChange={(e) => handleChangeAgrupadorDescripcion(agrupador.id, e.target.value)}
                                                    sx={{ width: 180 }}
                                                />
                                            </td>

                                            {/* Cantidad */}
                                            <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'top' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                    <TextField
                                                        size='small'
                                                        type='number'
                                                        value={agrupador.cantidad}
                                                        onChange={(e) => handleChangeAgrupadorCantidad(agrupador.id, parseInt(e.target.value) || 0)}
                                                        sx={{ width: 70 }}
                                                        inputProps={{ min: 1 }}
                                                    />
                                                    <Typography variant='body2' color='text.secondary'>
                                                        {agrupador.unidad}
                                                    </Typography>
                                                </Box>
                                            </td>

                                            {/* Facturación */}
                                            <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'top' }}>
                                                <Chip
                                                    label={agrupador.facturacion}
                                                    size='small'
                                                    onClick={() => handleChangeAgrupadorFacturacion(
                                                        agrupador.id,
                                                        agrupador.facturacion === 'Unitario' ? 'Fijo' : 'Unitario'
                                                    )}
                                                    sx={{
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                        bgcolor: agrupador.facturacion === 'Unitario' ? '#EEF2FF' : '#F0FDF4',
                                                        color: agrupador.facturacion === 'Unitario' ? '#4338CA' : '#16A34A',
                                                        '&:hover': {
                                                            bgcolor: agrupador.facturacion === 'Unitario' ? '#E0E7FF' : '#DCFCE7'
                                                        }
                                                    }}
                                                />
                                            </td>

                                            {/* Acciones */}
                                            <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'top' }}>
                                                <IconButton
                                                    size='small'
                                                    onClick={() => handleDeleteAgrupador(agrupador.id)}
                                                    sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}
                                                >
                                                    <DeleteIcon fontSize='small' />
                                                </IconButton>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                )
            }

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
                    {areas.find(a => a.id === area)?.nombre && (
                        <Box sx={{ mt: 1 }}>
                            <Chip
                                label={`Área: ${areas.find(a => a.id === area)?.nombre}`}
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
                    Debe finalizar la edición del RCM actual o cancelarla antes de crear uno nuevo
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

            {/* Dialog de confirmación para cancelar con cambios sin guardar */}
            <Dialog
                open={showCancelConfirm}
                onClose={handleDismissCancelConfirm}
                maxWidth='sm'
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon sx={{ color: '#ED6C02', fontSize: 28 }} />
                    ¿Deseas salir sin guardar los cambios?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Se perderá la información ingresada.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleConfirmCancel}
                        variant='outlined'
                        color='error'
                        sx={{ textTransform: 'none' }}
                    >
                        Cancelar sin guardar
                    </Button>
                    <Button
                        onClick={handleDismissCancelConfirm}
                        variant='contained'
                        color='primary'
                        sx={{ textTransform: 'none' }}
                    >
                        Volver al formulario
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: Crear Código Producto */}
            <Dialog
                open={openCodigoDialog}
                onClose={handleCloseCodigoPopup}
                maxWidth='sm'
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }
                }}
            >
                {/* Título */}
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        pb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    Agrupar en Código Producto
                    <IconButton size='small' onClick={handleCloseCodigoPopup} sx={{ color: 'text.secondary' }}>
                        <CloseIcon fontSize='small' />
                    </IconButton>
                </DialogTitle>

                <Divider />

                <DialogContent sx={{ pt: 2.5, pb: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                        {/* Sección RCMs a agrupar */}
                        {selectedRcmIds.length > 0 && (
                            <Box
                                sx={{
                                    bgcolor: '#EFF6FF',
                                    border: '1px solid',
                                    borderColor: '#DBEAFE',
                                    borderRadius: '8px',
                                    p: 2
                                }}
                            >
                                <Typography
                                    variant='caption'
                                    sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 1 }}
                                >
                                    RCMs a agrupar en este código
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                    {selectedRcmIds.map((id, idx) => {
                                        const rcm = savedRcms.find(r => r.id === id)
                                        const label = rcm?.numeroRcm || `RCM-${String(idx + 1).padStart(3, '0')}`
                                        return (
                                            <Chip
                                                key={id}
                                                label={`${label}`}
                                                size='small'
                                                sx={{
                                                    bgcolor: 'white',
                                                    border: '1px solid',
                                                    borderColor: '#BFDBFE',
                                                    color: 'text.primary',
                                                    fontWeight: 500,
                                                    fontSize: '0.78rem'
                                                }}
                                            />
                                        )
                                    })}
                                </Box>
                            </Box>
                        )}

                        {/* Selector de modo: existente vs nuevo (solo si hay agrupadores) */}
                        {codigosAgrupadores.length > 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    bgcolor: '#F3F4F6',
                                    borderRadius: '8px',
                                    p: 0.5,
                                    gap: 0.5
                                }}
                            >
                                <Button
                                    fullWidth
                                    size='small'
                                    variant={dialogMode === 'existente' ? 'contained' : 'text'}
                                    onClick={() => {
                                        setDialogMode('existente')
                                        if (!selectedExistingAgrupadorId && codigosAgrupadores.length > 0) {
                                            setSelectedExistingAgrupadorId(codigosAgrupadores[0].id)
                                        }
                                    }}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        ...(dialogMode === 'existente' ? {
                                            bgcolor: 'white',
                                            color: 'primary.main',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                            '&:hover': { bgcolor: 'white' }
                                        } : {
                                            color: 'text.secondary',
                                            '&:hover': { bgcolor: 'transparent', color: 'text.primary' }
                                        })
                                    }}
                                >
                                    Agregar a código existente
                                </Button>
                                <Button
                                    fullWidth
                                    size='small'
                                    variant={dialogMode === 'nuevo' ? 'contained' : 'text'}
                                    onClick={() => setDialogMode('nuevo')}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        fontSize: '0.82rem',
                                        ...(dialogMode === 'nuevo' ? {
                                            bgcolor: 'white',
                                            color: 'primary.main',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                                            '&:hover': { bgcolor: 'white' }
                                        } : {
                                            color: 'text.secondary',
                                            '&:hover': { bgcolor: 'transparent', color: 'text.primary' }
                                        })
                                    }}
                                >
                                    Crear nuevo código
                                </Button>
                            </Box>
                        )}

                        {/* MODO: Agregar a código existente */}
                        {dialogMode === 'existente' && codigosAgrupadores.length > 0 && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    Seleccionar código al que agregar los RCMs
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {codigosAgrupadores.map((ag) => (
                                        <Box
                                            key={ag.id}
                                            onClick={() => setSelectedExistingAgrupadorId(ag.id)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                                p: 1.5,
                                                borderRadius: '8px',
                                                border: '1.5px solid',
                                                borderColor: selectedExistingAgrupadorId === ag.id ? 'primary.main' : '#E5E7EB',
                                                bgcolor: selectedExistingAgrupadorId === ag.id ? '#EFF6FF' : 'white',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                '&:hover': {
                                                    borderColor: 'primary.light',
                                                    bgcolor: '#F8FAFF'
                                                }
                                            }}
                                        >
                                            {/* Radio visual */}
                                            <Box
                                                sx={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: '50%',
                                                    border: '2px solid',
                                                    borderColor: selectedExistingAgrupadorId === ag.id ? 'primary.main' : '#9CA3AF',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {selectedExistingAgrupadorId === ag.id && (
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                                )}
                                            </Box>

                                            {/* Info del código */}
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant='body2' sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace' }}>
                                                        {ag.id}
                                                    </Typography>
                                                    {ag.descripcionServicio && (
                                                        <Typography variant='body2' sx={{ fontWeight: 500 }} noWrap>
                                                            {ag.descripcionServicio}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25, flexWrap: 'wrap' }}>
                                                    <Typography variant='caption' color='text.secondary'>
                                                        {ag.rcmsVinculados.length} RCM{ag.rcmsVinculados.length !== 1 ? 's' : ''} vinculado{ag.rcmsVinculados.length !== 1 ? 's' : ''}
                                                    </Typography>
                                                    {ag.facturacion && (
                                                        <Chip
                                                            label={ag.facturacion}
                                                            size='small'
                                                            sx={{ height: 18, fontSize: '0.68rem', fontWeight: 600 }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* MODO: Crear nuevo código */}
                        {(dialogMode === 'nuevo' || codigosAgrupadores.length === 0) && (
                            <>
                                {/* Área (heredado) + SKU Producto */}
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                            Área (heredado automáticamente)
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            size='small'
                                            value={areas.find(a => a.id === area)?.nombre || '—'}
                                            disabled
                                            InputProps={{ readOnly: true }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                            SKU Producto (opcional)
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            size='small'
                                            placeholder='Buscar SKU...'
                                            value={dialogSkuSearch}
                                            onChange={(e) => setDialogSkuSearch(e.target.value)}
                                            onClick={handleOpenSkuSearch}
                                            inputProps={{ readOnly: true, style: { cursor: 'pointer' } }}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position='start'>
                                                        <SearchIcon fontSize='small' sx={{ color: 'text.disabled' }} />
                                                    </InputAdornment>
                                                ),
                                                endAdornment: dialogSkuSearch ? (
                                                    <InputAdornment position='end'>
                                                        <IconButton
                                                            size='small'
                                                            onClick={(e) => { e.stopPropagation(); setDialogSkuSearch('') }}
                                                            sx={{ p: 0.25 }}
                                                        >
                                                            <CloseIcon fontSize='small' />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ) : undefined
                                            }}
                                        />
                                    </Box>
                                </Box>

                                {/* Descripción del Servicio */}
                                <Box>
                                    <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                        Descripción del Servicio
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size='small'
                                        placeholder='Ej: Dosificación G20 — 3 áridos'
                                        value={dialogDescripcionServicio}
                                        onChange={(e) => setDialogDescripcionServicio(e.target.value)}
                                    />
                                </Box>

                                {/* Cantidad + Modo de Facturación (automático según SKU) */}
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                            Cantidad (unidades a facturar)
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            size='small'
                                            type='number'
                                            value={dialogCantidad}
                                            onChange={(e) => setDialogCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                            inputProps={{ min: 1 }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                            Modo de Facturación
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                height: 40,
                                                px: 1.5,
                                                borderRadius: '8px',
                                                border: '1px solid',
                                                borderColor: dialogSkuSearch.trim() ? '#FDE68A' : 'divider',
                                                bgcolor: dialogSkuSearch.trim() ? '#FEF3C7' : '#F9FAFB',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: '50%',
                                                    bgcolor: dialogSkuSearch.trim() ? '#D97706' : 'primary.main',
                                                    flexShrink: 0,
                                                    transition: 'background-color 0.2s ease'
                                                }}
                                            />
                                            <Typography
                                                variant='body2'
                                                sx={{
                                                    fontWeight: 600,
                                                    color: dialogSkuSearch.trim() ? '#D97706' : 'primary.main',
                                                    fontSize: '0.8rem',
                                                    transition: 'color 0.2s ease'
                                                }}
                                            >
                                                {dialogSkuSearch.trim()
                                                    ? 'Fijo — SKU \u00d7 Cantidad'
                                                    : 'Unitario — P\u00d7Q por ensayos'
                                                }
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Nota informativa */}
                                <Box
                                    sx={{
                                        bgcolor: '#FFFDE7',
                                        border: '1px solid #FFF176',
                                        borderRadius: '8px',
                                        p: 1.5,
                                        display: 'flex',
                                        gap: 1,
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <Typography sx={{ fontSize: '1rem', lineHeight: 1.3 }}>💡</Typography>
                                    <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                                        Si dejas el SKU vacío, la minuta calculará el cobro sumando los ensayos individuales de cada RCM (modo P×Q).
                                        Si asignas un SKU, el cobro será precio del SKU × cantidad.
                                    </Typography>
                                </Box>
                            </>
                        )}

                    </Box>
                </DialogContent>

                <Divider />

                <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                    <Button
                        variant='outlined'
                        onClick={handleCloseCodigoPopup}
                        sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, px: 3 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant='contained'
                        startIcon={<CheckCircleIcon />}
                        disabled={dialogMode === 'existente' && !selectedExistingAgrupadorId}
                        onClick={dialogMode === 'existente' ? handleAddToExistingAgrupador : handleConfirmCodigo}
                        sx={{
                            textTransform: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            px: 3,
                            bgcolor: 'primary.main',
                            '&:hover': { bgcolor: 'primary.dark' }
                        }}
                    >
                        {dialogMode === 'existente' ? '✓ Agregar al código' : '✓ Crear Código Producto'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Popover de búsqueda de SKU para el Dialog de Código Producto */}
            <Popover
                open={Boolean(skuSearchAnchor)}
                anchorEl={skuSearchAnchor}
                onClose={handleCloseSkuSearch}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        width: skuSearchAnchor?.offsetWidth ? Math.max(skuSearchAnchor.offsetWidth, 420) : 420,
                        maxHeight: '400px',
                        overflow: 'auto',
                        zIndex: 1400
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
                        autoFocus
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                    {areas.find(a => a.id === area)?.nombre && (
                        <Box sx={{ mt: 1 }}>
                            <Chip
                                label={`Área: ${areas.find(a => a.id === area)?.nombre}`}
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
                                onClick={() => handleSelectProductForSku(producto)}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { backgroundColor: 'action.hover' },
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
                                                        {' '}- {producto.norma}
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

            {/* Popover de búsqueda de ensayos para Agrupadores */}
            <Popover
                open={Boolean(agrupadorSearchAnchor)}
                anchorEl={agrupadorSearchAnchor}
                onClose={handleCloseAgrupadorSearch}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
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
                    {areas.find(a => a.id === area)?.nombre && (
                        <Box sx={{ mt: 1 }}>
                            <Chip
                                label={`Área: ${areas.find(a => a.id === area)?.nombre}`}
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
                                onClick={() => handleSelectProductForAgrupador(producto)}
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
        </>
    )
}

export default Step2CreateRcms
