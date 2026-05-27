import { useState, useEffect } from 'react'
import type { EnsayoAsociado, RCMData, SubmuestraVencimiento, AreaType, FamiliaType, ParametroAreaType } from '../types/rcm-types'

interface UseRcmFormParams {
    otData?: any
}

const STANDARD_SEDES = ['PA Chillán', 'PA Concepción', 'Cliente']

const normalizeName = (value?: string | null) =>
    (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export function useRcmForm({ otData }: UseRcmFormParams) {
    const getTodayDateForInput = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const getFechaServicioForInput = () => {
        // El usuario requiere que se muestre la fecha de la OT (createdAt en otData)
        const dateStr = otData?.createdAt || otData?.fechaServicio
        if (dateStr) {
            const date = new Date(dateStr)
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                return `${year}-${month}-${day}`
            }
        }
        return getTodayDateForInput()
    }

    // Fechas
    const [fechaCodificacion] = useState(getTodayDateForInput())
    const [fechaServicio, setFechaServicio] = useState(getFechaServicioForInput())
    const [fechaIngreso, setFechaIngreso] = useState(getTodayDateForInput())
    const [fechaEntrega, setFechaEntrega] = useState('')
    const [fechaConfeccion, setFechaConfeccion] = useState('')

    // UI
    const [expandedRcm, setExpandedRcm] = useState(true)
    const [showRcmCard, setShowRcmCard] = useState(false)
    const [rcmType, setRcmType] = useState('')

    // Campos del formulario
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
    const [observaciones, setObservaciones] = useState('')
    const [cantidadMuestras, setCantidadMuestras] = useState('1')
    const [informeEnsayo, setInformeEnsayo] = useState(true)

    // Vencimiento
    const [tieneVencimiento, setTieneVencimiento] = useState(false)
    const [submuestrasVencimiento, setSubmuestrasVencimiento] = useState<SubmuestraVencimiento[]>([])
    const [errorVencimiento, setErrorVencimiento] = useState('')

    // Auto-activar vencimiento para áreas Hormigón / Elementos y Componentes
    const autoEnableVencimiento = (areas: AreaType[], familias: FamiliaType[]) => {
        if (rcmType !== 'Muestra') {
            setTieneVencimiento(false)
            setSubmuestrasVencimiento([])
            return
        }
        const foundArea = areas.find(a => a.id === area)
        const foundTipoServicio = familias.find(f => f.id === tipoServicio)

        if ((area !== '' && !foundArea) || (tipoServicio !== '' && !foundTipoServicio)) {
            return
        }

        const currentAreaName = normalizeName(foundArea?.nombre)
        const currentTipoServicioName = normalizeName(foundTipoServicio?.nombre)
        const shouldHaveVencimiento =
            (currentAreaName === 'hormigon' &&
                ['hormigon fresco', 'hormigon endurecido', 'hormigon edurecido'].includes(currentTipoServicioName)) ||
            (currentAreaName === 'elementos y componentes' && currentTipoServicioName === 'elementos y componentes')

        if (shouldHaveVencimiento) {
            setTieneVencimiento(true)
        } else {
            setTieneVencimiento(false)
            setSubmuestrasVencimiento([])
        }
    }

    /**
     * Resetea los campos dinámicos dependientes del área al cambiar de Área.
     * Se mantienen: numeroTarjeta, tomaMuestra, procedencia, ubicacionSector,
     * observaciones, fechas generales, cantidadMuestras, sede, rcmType e informeEnsayo.
     */
    const resetDynamicFieldsOnAreaChange = () => {
        setTipoServicio('')
        setTipoMaterial('')
        setCustomTipoMaterial('')
        setItem('')
        setCustomItem('')
        setGrado('')
        setCustomGrado('')
        setElemento('')
        setFechaConfeccion('')
        setCota1('')
        setCota2('')
        setCalicata('')
        setEstrato('')
        setObservacionItem('')
        setSubmuestrasVencimiento([])
        setErrorVencimiento('')
    }

    const resetForm = (type?: string) => {
        setShowRcmCard(type !== undefined)
        setRcmType(type || '')
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
        setObservaciones('')
        setCantidadMuestras('1')
        setFechaServicio(getFechaServicioForInput())
        setFechaIngreso(getTodayDateForInput())
        setFechaEntrega('')
        setFechaConfeccion('')
        setExpandedRcm(true)
        setTieneVencimiento(false)
        setSubmuestrasVencimiento([])
        setErrorVencimiento('')
        setInformeEnsayo(type !== 'Servicio')
    }

    const populateFormFromRcm = (
        rcm: RCMData,
        areas: AreaType[],
        todasLasFamilias: FamiliaType[],
        mode: 'edit' | 'duplicate',
        parametrosArea: ParametroAreaType[] = []
    ) => {
        setRcmType(rcm.rcmType)

        // Cargar sede
        if (rcm.sede && !STANDARD_SEDES.includes(rcm.sede)) {
            setSede('Otro')
            setCustomSede(rcm.sede)
        } else {
            setSede(rcm.sede || 'PA Chillán')
            setCustomSede('')
        }

        // Encontrar IDs por nombre
        const areaFound = areas.find(a => a.nombre === rcm.area)
        setArea(areaFound ? areaFound.id : '')

        const familiaFound = todasLasFamilias.find(f => f.nombre === rcm.tipoServicio)
        setTipoServicio(familiaFound ? familiaFound.id : '')

        const areaId = areaFound?.id
        const areaName = (areaFound?.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        const validMaterials = areaId ? parametrosArea.filter(p => p.areaId === areaId && p.tipo === 'MATERIAL').map(p => p.descripcion) : []
        const validItems = areaId ? parametrosArea.filter(p => p.areaId === areaId && p.tipo === 'ITEM').map(p => p.descripcion) : []
        const validGrades = areaId ? parametrosArea.filter(p => p.areaId === areaId && p.tipo === 'GRADO').map(p => p.descripcion) : []

        const setSelectOrCustom = (
            value: string | undefined,
            validOptions: string[],
            setValue: (next: string) => void,
            setCustomValue: (next: string) => void
        ) => {
            if (value && !validOptions.includes(value)) {
                setValue('Otro')
                setCustomValue(value)
            } else {
                setValue(value || '')
                setCustomValue('')
            }
        }

        // En duplicar, forzar nuevo número de tarjeta y número de muestra
        setNumeroTarjeta(mode === 'duplicate' ? '' : rcm.numeroTarjeta)
        setTomaMuestra(mode === 'duplicate' ? '' : rcm.tomaMuestra || '')

        // Si es modo duplicar, resetear campos dinámicos que dependen del área
        if (mode === 'duplicate') {
            setSelectOrCustom(rcm.tipoMaterial, validMaterials, setTipoMaterial, setCustomTipoMaterial)
            setSelectOrCustom(rcm.item, validItems, setItem, setCustomItem)
            setSelectOrCustom(rcm.grado, validGrades, setGrado, setCustomGrado)
            setProcedencia(rcm.procedencia || '')
            setUbicacionSector(rcm.ubicacionSector || '')
            setElemento(rcm.elemento || '')
            setCalicata(rcm.calicata || '')
            setEstrato(rcm.estrato || '')
            setCota1(rcm.cota1 || '')
            setCota2(rcm.cota2 || '')
            setObservacionItem(rcm.observacionItem || '')
            setFechaConfeccion(rcm.fechaConfeccion || '')

            if (rcm.rcmType === 'Muestra') {
                if (areaName === 'hormigon' || areaName === 'elementos y componentes') {
                    setFechaConfeccion('')
                    setElemento('')
                    setGrado('')
                    setCustomGrado('')
                } else if (areaName === 'asfalto' || areaName === 'otros') {
                    setFechaConfeccion('')
                } else if (areaName === 'suelo') {
                    setCota1('')
                    setCota2('')
                }
            }
        } else {
            // Modo edición: cargar todos los campos dinámicos
            // Obtener opciones válidas para el área del RCM
            // Manejar tipoMaterial "Otro"
            if (rcm.tipoMaterial && !validMaterials.includes(rcm.tipoMaterial)) {
                setTipoMaterial('Otro')
                setCustomTipoMaterial(rcm.tipoMaterial)
            } else {
                setTipoMaterial(rcm.tipoMaterial)
                setCustomTipoMaterial('')
            }

            // Manejar item "Otro"
            if (rcm.item && !validItems.includes(rcm.item)) {
                setItem('Otro')
                setCustomItem(rcm.item)
            } else {
                setItem(rcm.item)
                setCustomItem('')
            }

            // Manejar grado "Otro"
            if (rcm.grado && !validGrades.includes(rcm.grado)) {
                setGrado('Otro')
                setCustomGrado(rcm.grado)
            } else {
                setGrado(rcm.grado || '')
                setCustomGrado('')
            }

            setProcedencia(rcm.procedencia || '')
            setUbicacionSector(rcm.ubicacionSector || '')
            setElemento(rcm.elemento || '')
            setCalicata(rcm.calicata || '')
            setEstrato(rcm.estrato || '')
            setCota1(rcm.cota1 || '')
            setCota2(rcm.cota2 || '')
            setObservacionItem(rcm.observacionItem || '')
            setFechaConfeccion(rcm.fechaConfeccion || '')
        }

        setObservaciones(rcm.observaciones || '')
        setInformeEnsayo(rcm.informeEnsayo !== undefined ? rcm.informeEnsayo : rcm.rcmType !== 'Servicio')
        // tomaMuestra ya se estableció arriba según el modo (edit/duplicate)
        setCantidadMuestras(rcm.cantidadMuestras)
        setFechaServicio(rcm.fechaServicio)

        // Cargar estados de vencimiento
        setTieneVencimiento(rcm.tieneVencimiento || false)
        setSubmuestrasVencimiento(rcm.submuestrasVencimiento || [])

        // Mostrar formulario
        setShowRcmCard(true)
        setExpandedRcm(true)
    }

    /** Devuelve los valores actuales del formulario como un objeto plano */
    const getFormValues = () => ({
        rcmType,
        sede: sede === 'Otro' ? customSede : sede,
        area,
        tipoServicio,
        fechaCodificacion,
        fechaServicio,
        fechaIngreso,
        fechaEntrega,
        fechaConfeccion,
        numeroTarjeta,
        tomaMuestra,
        tipoMaterial: tipoMaterial === 'Otro' ? customTipoMaterial : tipoMaterial,
        item: item === 'Otro' ? customItem : item,
        elemento,
        grado: grado === 'Otro' ? customGrado : grado,
        calicata,
        estrato,
        cota1,
        cota2,
        procedencia,
        ubicacionSector,
        observacionItem,
        observaciones,
        cantidadMuestras,
        informeEnsayo,
        tieneVencimiento,
        submuestrasVencimiento,
    })

    /** Detecta si hay cambios sin guardar comparando con el RCM original o estado inicial */
    const hasUnsavedChanges = (
        isEditingRcm: boolean,
        originalRcm: RCMData | null,
        areas: AreaType[],
        todasLasFamilias: FamiliaType[],
        ensayosAsociados: EnsayoAsociado[],
    ): boolean => {
        const currentAreaName = areas.find(a => a.id === area)?.nombre || ''
        const currentTipoServicioName = todasLasFamilias.find(f => f.id === tipoServicio)?.nombre || ''
        const currentSede = sede === 'Otro' ? customSede : sede

        if (isEditingRcm && originalRcm) {
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

    return {
        // State
        fechaCodificacion,
        fechaServicio, setFechaServicio,
        fechaIngreso, setFechaIngreso,
        fechaEntrega, setFechaEntrega,
        fechaConfeccion, setFechaConfeccion,
        expandedRcm, setExpandedRcm,
        showRcmCard, setShowRcmCard,
        rcmType, setRcmType,
        sede, setSede,
        customSede, setCustomSede,
        area, setArea,
        tipoServicio, setTipoServicio,
        numeroTarjeta, setNumeroTarjeta,
        tomaMuestra, setTomaMuestra,
        tipoMaterial, setTipoMaterial,
        customTipoMaterial, setCustomTipoMaterial,
        item, setItem,
        customItem, setCustomItem,
        elemento, setElemento,
        grado, setGrado,
        customGrado, setCustomGrado,
        calicata, setCalicata,
        estrato, setEstrato,
        cota1, setCota1,
        cota2, setCota2,
        procedencia, setProcedencia,
        ubicacionSector, setUbicacionSector,
        observacionItem, setObservacionItem,
        observaciones, setObservaciones,
        cantidadMuestras, setCantidadMuestras,
        informeEnsayo, setInformeEnsayo,
        tieneVencimiento, setTieneVencimiento,
        submuestrasVencimiento, setSubmuestrasVencimiento,
        errorVencimiento, setErrorVencimiento,
        // Helpers
        getTodayDateForInput,
        getFechaServicioForInput,
        resetForm,
        populateFormFromRcm,
        getFormValues,
        hasUnsavedChanges,
        autoEnableVencimiento,
        resetDynamicFieldsOnAreaChange,
    }
}
