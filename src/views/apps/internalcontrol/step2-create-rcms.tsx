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
import LayersIcon from '@mui/icons-material/Layers'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

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
    selectedAreaNombre?: string
    initialRcmType?: string
    onClearInitialRcmType?: () => void
}

const Step2CreateRcms = ({ ensayosAsociados, setEnsayosAsociados, savedRcms, setSavedRcms, otData, selectedAreaNombre, initialRcmType, onClearInitialRcmType }: Step2CreateRcmsProps) => {
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
    const [tipos, setTipos] = useState<string[]>([])
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
    const [selectedTipo, setSelectedTipo] = useState('')
    const [selectedFamilia, setSelectedFamilia] = useState('')
    const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
    const [totalProductos, setTotalProductos] = useState(0)
    const [paginatedProductos, setPaginatedProductos] = useState<ProductoType[]>([]) // Productos de la página actual
    const [filterResetKey, setFilterResetKey] = useState(0)
    const [pendingRcmType, setPendingRcmType] = useState<string>('')

    // Estados para popup de códigos
    const [codigoAnchorEl, setCodigoAnchorEl] = useState<HTMLElement | null>(null)
    const [showNewCodigoForm, setShowNewCodigoForm] = useState(false)
    const [selectedCodigo, setSelectedCodigo] = useState<string>('')
    const [newCodigoNombre, setNewCodigoNombre] = useState('')
    const [newCodigoDescripcion, setNewCodigoDescripcion] = useState('')
    const [newCodigoTipo, setNewCodigoTipo] = useState('')

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
    const [editingAgrupadorId, setEditingAgrupadorId] = useState<string | null>(null)
    const [agrupadorSearchTerm, setAgrupadorSearchTerm] = useState('')

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
        setObservacionItem('')
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
        createNewRcm(pendingRcmType)
        setPendingRcmType('')
    }

    const handleCancelNewRcm = () => {
        setShowConfirmNewRcm(false)
    }

    // Función para detectar si hay cambios sin guardar en el formulario
    const hasUnsavedChanges = (): boolean => {
        if (isEditingRcm && originalRcm) {
            // Comparar con los datos originales del RCM que se está editando
            return (
                numeroTarjeta !== originalRcm.numeroTarjeta ||
                tipoMaterial !== originalRcm.tipoMaterial ||
                item !== originalRcm.item ||
                tomaMuestra !== (originalRcm.tomaMuestra || '') ||
                cantidadMuestras !== originalRcm.cantidadMuestras ||
                fechaServicio !== originalRcm.fechaServicio ||
                JSON.stringify(ensayosAsociados) !== JSON.stringify(originalRcm.ensayos) ||
                tieneVencimiento !== (originalRcm.tieneVencimiento || false) ||
                JSON.stringify(submuestrasVencimiento) !== JSON.stringify(originalRcm.submuestrasVencimiento || [])
            )
        } else {
            // Nuevo RCM: verificar si se ha ingresado algún dato
            return (
                numeroTarjeta.trim() !== '' ||
                tipoMaterial.trim() !== '' ||
                item.trim() !== '' ||
                elemento.trim() !== '' ||
                grado.trim() !== '' ||
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
        setObservacionItem('')
        setCantidadMuestras('1')
        setEnsayosAsociados([])
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
        setActionBarRcmId(newRcm.id)
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

                // Marcar como duplicación y mostrar el formulario
                setIsDuplicatingRcm(true)
                setShowRcmCard(true)
                setExpandedRcm(true)
            }
        }
        handleCloseRcmMenu()
    }

    // Handlers para popup de códigos
    const handleOpenCodigoPopup = (event: React.MouseEvent<HTMLElement>) => {
        setCodigoAnchorEl(event.currentTarget)
        setShowNewCodigoForm(false)
        setSelectedCodigo('')
    }

    const handleCloseCodigoPopup = () => {
        setCodigoAnchorEl(null)
        setShowNewCodigoForm(false)
        setSelectedCodigo('')
        setNewCodigoNombre('')
        setNewCodigoDescripcion('')
        setNewCodigoTipo('')
    }

    const handleSelectCodigo = (codigoId: string) => {
        setSelectedCodigo(codigoId)
    }

    const handleConfirmCodigo = () => {
        if (selectedCodigo) {
            const codigo = codigosOT.find(c => c.id === selectedCodigo)
            if (!codigo) return

            // Get the RCMs that are checked (selected) or use the current RCM being created
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

            // Collect SKUs from the assigned RCMs
            const allSkus: string[] = []
            let ensayoNombre = ''
            rcmsToAssign.forEach(rcmRef => {
                const fullRcm = savedRcms.find(r => r.id === rcmRef.id)
                if (fullRcm) {
                    fullRcm.ensayos.forEach(e => {
                        if (!allSkus.includes(e.sku)) allSkus.push(e.sku)
                        if (!ensayoNombre) ensayoNombre = e.nombre
                    })
                }
            })

            // If only the current (unsaved) RCM, use ensayosAsociados
            if (allSkus.length === 0 && ensayosAsociados.length > 0) {
                ensayosAsociados.forEach(e => {
                    if (!allSkus.includes(e.sku)) allSkus.push(e.sku)
                    if (!ensayoNombre) ensayoNombre = e.nombre
                })
            }

            const newAgrupador: CodigoAgrupador = {
                id: `PRD-${String(codigosAgrupadores.length + 1).padStart(3, '0')}`,
                codigoId: codigo.id,
                codigoNombre: codigo.nombre,
                rcmsVinculados: rcmsToAssign,
                ensayos: allSkus.map((sku, idx) => ({ productoId: idx, sku, nombre: ensayoNombre || codigo.nombre })),
                descripcionServicio: codigo.descripcion || codigo.nombre,
                cantidad: rcmsToAssign.length,
                unidad: 'unid',
                facturacion: 'Unitario'
            }

            setCodigosAgrupadores(prev => [...prev, newAgrupador])
            setSelectedRcmIds([])
        }
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

    // Efecto para inicializar RCM cuando viene del paso 1 con un tipo seleccionado
    useEffect(() => {
        if (initialRcmType && !showRcmCard) {
            setShowRcmCard(true)
            setRcmType(initialRcmType)
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
            setObservacionItem('')
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

            // Limpiar el tipo inicial después de usarlo
            if (onClearInitialRcmType) {
                onClearInitialRcmType()
            }
        }
    }, [initialRcmType])

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
        if (!anchorEl && !agrupadorSearchAnchor) return

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
    }, [anchorEl, agrupadorSearchAnchor, searchTerm, selectedAreaNombre, showOnlyPaquetes])

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
                        {/* <Button
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
                        </Button> */}
                        <Button
                            variant='contained'
                            color='primary'
                            startIcon={<AddIcon />}
                            onClick={handleNewRcmClick}
                            sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
                        >
                            Nuevo RCM
                        </Button>
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
                                <Chip label={rcmType.toUpperCase()} color='primary' sx={{ fontWeight: 'bold' }} />
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
                                <Button
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
                                </Button>
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
                                    {rcmType === 'Muestra' && (
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
                                    )}
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
                                    {rcmType === 'Control' && (
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                label='Observación al Ítem'
                                                value={observacionItem}
                                                onChange={(e) => setObservacionItem(e.target.value)}
                                                fullWidth
                                                multiline
                                                rows={3}
                                                placeholder='Ingrese observaciones sobre el ítem...'
                                            />
                                        </Grid>
                                    )}
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
                                                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                                                        <DatePicker
                                                                            value={submuestra.fechaVencimiento ? new Date(submuestra.fechaVencimiento + 'T00:00:00') : null}
                                                                            minDate={fechaCodificacion ? new Date(fechaCodificacion + 'T00:00:00') : undefined}
                                                                            onChange={(newValue) => {
                                                                                const nuevaFecha = newValue ? `${newValue.getFullYear()}-${String(newValue.getMonth() + 1).padStart(2, '0')}-${String(newValue.getDate()).padStart(2, '0')}` : ''
                                                                                const fechaBase = new Date(fechaServicio || getTodayDateForInput())
                                                                                const fechaVenc = new Date(nuevaFecha)
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

                                        {/* Mostrar estado de agrupación según tipo */}
                                        <Chip
                                            label={rcm.rcmType === 'Muestra' ? 'Pendiente de agrupar' : 'Agrupado'}
                                            size='small'
                                            sx={{
                                                fontWeight: 600,
                                                bgcolor: rcm.rcmType === 'Muestra' ? '#FFF3E0' : '#E8F5E9',
                                                color: rcm.rcmType === 'Muestra' ? '#E65100' : '#2E7D32',
                                                border: rcm.rcmType === 'Muestra' ? '1px solid #FFB74D' : '1px solid #81C784',
                                            }}
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

                                {/* Barra de acciones rápidas debajo del RCM recién guardado */}
                                {actionBarRcmId === rcm.id && (
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
                                                    setNumeroTarjeta('')
                                                    setTipoMaterial(rcmToDuplicate.tipoMaterial)
                                                    setItem(rcmToDuplicate.item)
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

                {/* Sección de Códigos Agrupadores (Productos) */}
                {codigosAgrupadores.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        {/* Barra de selección */}
                        {selectedRcmIds.length > 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    bgcolor: '#E3F2FD',
                                    borderRadius: '8px',
                                    p: 2,
                                    mb: 3
                                }}
                            >
                                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                                    {selectedRcmIds.length} RCMs seleccionados
                                </Typography>
                                <Button
                                    variant='contained'
                                    startIcon={<LayersIcon />}
                                    sx={{
                                        textTransform: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        bgcolor: '#1976D2',
                                        '&:hover': { bgcolor: '#1565C0' }
                                    }}
                                >
                                    Agrupar en Producto
                                </Button>
                            </Box>
                        )}

                        {/* Título y botón Finalizar Codificación */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                            <Box>
                                <Typography variant='h6' sx={{ fontWeight: 700 }}>
                                    Códigos Agrupadores (Productos)
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
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
                        <Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>CÓDIGO ID</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>RCMS VINCULADOS</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>SKUS / ENSAYOS</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>DESCRIPCIÓN DEL SERVICIO</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>CANTIDAD</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>FACTURACIÓN</th>
                                        <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#6B7280', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {codigosAgrupadores.map((agrupador) => (
                                        <tr key={agrupador.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                            {/* Código ID */}
                                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                                <Typography variant='body2' sx={{ fontWeight: 700, color: '#1976D2', fontFamily: 'monospace' }}>
                                                    {agrupador.id}
                                                </Typography>
                                            </td>

                                            {/* RCMs Vinculados */}
                                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
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
                                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
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
                                            <td style={{ padding: '16px', verticalAlign: 'top' }}>
                                                <TextField
                                                    size='small'
                                                    value={agrupador.descripcionServicio}
                                                    onChange={(e) => handleChangeAgrupadorDescripcion(agrupador.id, e.target.value)}
                                                    sx={{ width: 180 }}
                                                />
                                            </td>

                                            {/* Cantidad */}
                                            <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'top' }}>
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
                                            <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'top' }}>
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
                                            <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'top' }}>
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

                {/* Popover de Códigos */}
                <Popover
                    open={Boolean(codigoAnchorEl)}
                    anchorEl={codigoAnchorEl}
                    onClose={handleCloseCodigoPopup}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{
                        paper: {
                            sx: {
                                width: 400,
                                maxHeight: 500,
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                overflow: 'hidden'
                            }
                        }
                    }}
                >
                    {/* Header del popover */}
                    <Box sx={{ p: 2, bgcolor: '#F5F7FA', borderBottom: '1px solid #E0E0E0' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon sx={{ color: '#1976D2', fontSize: 20 }} />
                            <Typography variant='subtitle1' sx={{ fontWeight: 700, color: '#1A2027' }}>
                                Códigos de la OT
                            </Typography>
                        </Box>
                        <Typography variant='caption' sx={{ color: 'text.secondary', mt: 0.5 }}>
                            Seleccione un código existente o cree uno nuevo
                        </Typography>
                    </Box>

                    {/* Lista de códigos existentes */}
                    <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
                        <RadioGroup value={selectedCodigo} onChange={(e) => handleSelectCodigo(e.target.value)}>
                            <List disablePadding>
                                {codigosOT.length === 0 ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant='body2' color='text.secondary'>
                                            No hay códigos creados en esta OT
                                        </Typography>
                                    </Box>
                                ) : (
                                    codigosOT.map((codigo) => (
                                        <ListItemButton
                                            key={codigo.id}
                                            selected={selectedCodigo === codigo.id}
                                            onClick={() => handleSelectCodigo(codigo.id)}
                                            sx={{
                                                py: 1.5,
                                                px: 2,
                                                borderBottom: '1px solid #F0F0F0',
                                                '&.Mui-selected': {
                                                    bgcolor: 'rgba(25, 118, 210, 0.06)',
                                                    '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.10)' }
                                                }
                                            }}
                                        >
                                            <Radio
                                                value={codigo.id}
                                                size='small'
                                                sx={{ p: 0.5, mr: 1.5 }}
                                            />
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant='body2' sx={{ fontWeight: 600, fontFamily: 'monospace', color: '#1976D2' }}>
                                                            {codigo.id}
                                                        </Typography>
                                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                                            {codigo.nombre}
                                                        </Typography>
                                                        <Chip label={codigo.tipo} size='small' sx={{ height: 20, fontSize: '0.7rem' }} />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant='caption' color='text.secondary' sx={{ mt: 0.25, display: 'block' }}>
                                                        {codigo.descripcion}
                                                    </Typography>
                                                }
                                            />
                                        </ListItemButton>
                                    ))
                                )}
                            </List>
                        </RadioGroup>
                    </Box>

                    <Divider />

                    {/* Botón para crear nuevo código / Sub-formulario */}
                    {!showNewCodigoForm ? (
                        <Box sx={{ p: 2 }}>
                            {selectedCodigo && (
                                <Button
                                    variant='contained'
                                    fullWidth
                                    onClick={handleConfirmCodigo}
                                    sx={{
                                        mb: 1.5,
                                        textTransform: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        bgcolor: '#1976D2',
                                        '&:hover': { bgcolor: '#1565C0' }
                                    }}
                                >
                                    Asignar código seleccionado
                                </Button>
                            )}
                            <Button
                                variant='outlined'
                                fullWidth
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={() => setShowNewCodigoForm(true)}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    borderColor: '#1976D2',
                                    color: '#1976D2',
                                    '&:hover': {
                                        borderColor: '#1565C0',
                                        bgcolor: 'rgba(25, 118, 210, 0.04)'
                                    }
                                }}
                            >
                                Crear nuevo Código
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ p: 2, bgcolor: '#FAFBFC' }}>
                            <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 2, color: '#1A2027' }}>
                                Nuevo Código
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <TextField
                                    label='Nombre'
                                    size='small'
                                    fullWidth
                                    required
                                    value={newCodigoNombre}
                                    onChange={(e) => setNewCodigoNombre(e.target.value)}
                                    placeholder='Ej: Hormigón H30'
                                />
                                <FormControl fullWidth size='small'>
                                    <InputLabel>Tipo</InputLabel>
                                    <Select
                                        label='Tipo'
                                        value={newCodigoTipo}
                                        onChange={(e) => setNewCodigoTipo(e.target.value)}
                                    >
                                        <MenuItem value='Muestra'>Muestra</MenuItem>
                                        <MenuItem value='Control'>Control</MenuItem>
                                        <MenuItem value='Servicio'>Servicio</MenuItem>
                                        <MenuItem value='General'>General</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label='Descripción'
                                    size='small'
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={newCodigoDescripcion}
                                    onChange={(e) => setNewCodigoDescripcion(e.target.value)}
                                    placeholder='Descripción breve del código...'
                                />
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                    <Button
                                        variant='outlined'
                                        size='small'
                                        onClick={() => {
                                            setShowNewCodigoForm(false)
                                            setNewCodigoNombre('')
                                            setNewCodigoDescripcion('')
                                            setNewCodigoTipo('')
                                        }}
                                        sx={{ flex: 1, textTransform: 'none', borderRadius: '8px' }}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant='contained'
                                        size='small'
                                        onClick={handleCrearNuevoCodigo}
                                        disabled={!newCodigoNombre.trim()}
                                        sx={{
                                            flex: 1,
                                            textTransform: 'none',
                                            borderRadius: '8px',
                                            bgcolor: '#1976D2',
                                            '&:hover': { bgcolor: '#1565C0' }
                                        }}
                                    >
                                        Crear
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    )}
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
            </Box>
        </Card>
    )
}

export default Step2CreateRcms
