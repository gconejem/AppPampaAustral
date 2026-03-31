import { useState, useEffect, useRef } from 'react'
import type { RCMData, EnsayoAsociado, AreaType, FamiliaType, SubmuestraVencimiento } from '../types/rcm-types'

interface UseRcmCrudParams {
    savedRcms: RCMData[]
    setSavedRcms: React.Dispatch<React.SetStateAction<RCMData[]>>
    ensayosAsociados: EnsayoAsociado[]
    setEnsayosAsociados: React.Dispatch<React.SetStateAction<EnsayoAsociado[]>>
    areas: AreaType[]
    todasLasFamilias: FamiliaType[]
    otData?: any
    // Form helpers
    getFormValues: () => {
        rcmType: string
        sede: string
        area: number | ''
        tipoServicio: number | ''
        fechaCodificacion: string
        fechaServicio: string
        fechaIngreso: string
        fechaEntrega: string
        fechaConfeccion: string
        numeroTarjeta: string
        tomaMuestra: string
        tipoMaterial: string
        item: string
        elemento: string
        grado: string
        calicata: string
        estrato: string
        cota1: string
        cota2: string
        procedencia: string
        ubicacionSector: string
        observacionItem: string
        observaciones: string
        cantidadMuestras: string
        informeEnsayo: boolean
        tieneVencimiento: boolean
        submuestrasVencimiento: SubmuestraVencimiento[]
    }
    getTodayDateForInput: () => string
    resetForm: (type?: string) => void
    populateFormFromRcm: (rcm: RCMData, areas: AreaType[], familias: FamiliaType[], mode: 'edit' | 'duplicate') => void
    hasUnsavedChanges: (isEditingRcm: boolean, originalRcm: RCMData | null, areas: AreaType[], familias: FamiliaType[], ensayos: EnsayoAsociado[]) => boolean
    setShowRcmCard: (v: boolean) => void
    setErrorVencimiento: (v: string) => void
    clearEnsayosPendientes: () => void
    resetSearchFilters?: () => void
}

export function useRcmCrud({
    savedRcms, setSavedRcms,
    ensayosAsociados, setEnsayosAsociados,
    areas, todasLasFamilias, otData,
    getFormValues, getTodayDateForInput, resetForm, populateFormFromRcm,
    hasUnsavedChanges, setShowRcmCard, setErrorVencimiento,
    clearEnsayosPendientes, resetSearchFilters,
}: UseRcmCrudParams) {
    // Estado de edición
    const [isEditingRcm, setIsEditingRcm] = useState(false)
    const [isDuplicatingRcm, setIsDuplicatingRcm] = useState(false)
    const [editingRcmId, setEditingRcmId] = useState<number | null>(null)
    const [originalRcm, setOriginalRcm] = useState<RCMData | null>(null)
    const [isSavingRcm, setIsSavingRcm] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    // Dialogs
    const [showEditWarning, setShowEditWarning] = useState(false)
    const [showConfirmNewRcm, setShowConfirmNewRcm] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [rcmIdToDelete, setRcmIdToDelete] = useState<number | null>(null)
    const [pendingRcmType, setPendingRcmType] = useState<string>('')

    // Menus
    const [newRcmMenuAnchor, setNewRcmMenuAnchor] = useState<HTMLElement | null>(null)
    const [rcmMenuAnchor, setRcmMenuAnchor] = useState<HTMLElement | null>(null)
    const [selectedRcmId, setSelectedRcmId] = useState<number | null>(null)

    // Barra de acciones post-guardado
    const [actionBarRcmId, setActionBarRcmId] = useState<number | null>(null)
    const actionBarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (actionBarTimerRef.current) clearTimeout(actionBarTimerRef.current)
        if (actionBarRcmId !== null) {
            actionBarTimerRef.current = setTimeout(() => setActionBarRcmId(null), 30000)
        }
        return () => { if (actionBarTimerRef.current) clearTimeout(actionBarTimerRef.current) }
    }, [actionBarRcmId])

    // Expand state for saved RCMs
    const [expandedSavedRcms, setExpandedSavedRcms] = useState<Record<number, boolean>>({})

    const handleNewRcmClick = (event: React.MouseEvent<HTMLElement>) => {
        if (isEditingRcm) {
            setShowEditWarning(true)
            return
        }
        setNewRcmMenuAnchor(event.currentTarget)
    }

    const handleSelectRcmType = (type: string) => {
        setNewRcmMenuAnchor(null)
        const formValues = getFormValues()
        // Si hay un RCM en CREACIÓN (nuevo RCM sin guardar), mostrar confirmación
        if (formValues.rcmType && !isEditingRcm) {
            setPendingRcmType(type)
            setShowConfirmNewRcm(true)
            return
        }
        createNewRcm(type)
    }

    const createNewRcm = (type?: string) => {
        resetForm(type)
        setEnsayosAsociados([])
        clearEnsayosPendientes()
        resetSearchFilters?.()
    }

    const handleConfirmNewRcm = () => {
        setShowConfirmNewRcm(false)
        createNewRcm(pendingRcmType)
        setPendingRcmType('')
    }

    const handleCancelNewRcm = () => {
        setShowConfirmNewRcm(false)
    }

    const handleCancelEdit = () => {
        if (isDuplicatingRcm) {
            performCancelEdit()
            return
        }
        if (hasUnsavedChanges(isEditingRcm, originalRcm, areas, todasLasFamilias, ensayosAsociados)) {
            setShowCancelConfirm(true)
            return
        }
        performCancelEdit()
    }

    const performCancelEdit = () => {
        if (isEditingRcm && editingRcmId !== null && originalRcm !== null) {
            setSavedRcms(prev => [...prev, originalRcm])
            setOriginalRcm(null)
        }
        resetForm()
        setEnsayosAsociados([])
        clearEnsayosPendientes()
        setIsEditingRcm(false)
        setEditingRcmId(null)
        setIsDuplicatingRcm(false)
        setShowRcmCard(false)
    }

    const handleConfirmCancel = () => {
        setShowCancelConfirm(false)
        performCancelEdit()
    }

    const handleDismissCancelConfirm = () => {
        setShowCancelConfirm(false)
    }

    const handleSaveRcm = async () => {
        const formValues = getFormValues()

        // Validación 1: Número de tarjeta obligatorio para tipo Muestra
        if (formValues.rcmType === 'Muestra' && !formValues.numeroTarjeta.trim()) {
            setErrorVencimiento('El número de tarjeta es obligatorio para RCM tipo Muestra')
            return
        }

        // Validación 2: Al menos un ensayo asociado
        if (ensayosAsociados.length === 0) {
            setErrorVencimiento('Debe agregar al menos un ensayo antes de guardar el RCM')
            return
        }

        // Validar submuestras si el vencimiento está activado
        if (formValues.tieneVencimiento) {
            if (formValues.submuestrasVencimiento.length === 0) {
                setErrorVencimiento('Debe agregar al menos una submuestra cuando el vencimiento está activado')
                return
            }

            const sumaCantidades = formValues.submuestrasVencimiento.reduce((sum, sub) => sum + sub.cantidad, 0)
            const cantidadRequerida = parseInt(formValues.cantidadMuestras) || 0

            if (sumaCantidades !== cantidadRequerida) {
                setErrorVencimiento(`La suma de cantidades de submuestras (${sumaCantidades}) debe coincidir con la Cantidad de Muestras (${cantidadRequerida})`)
                return
            }

            const sinFecha = formValues.submuestrasVencimiento.some(sub => !sub.fechaVencimiento)
            if (sinFecha) {
                setErrorVencimiento('Todas las submuestras deben tener una fecha de vencimiento calculada o ingresada')
                return
            }
        }

        setErrorVencimiento('')

        const editandoRcm = isEditingRcm
        const rcmOriginal = originalRcm

        const areaNombre = areas.find(a => a.id === formValues.area)?.nombre || ''
        const tipoServicioNombre = todasLasFamilias.find(f => f.id === formValues.tipoServicio)?.nombre || ''

        let estadoRcm = 'Codificado'
        if (formValues.rcmType === 'Muestra') estadoRcm = 'Codificado'
        else if (formValues.rcmType === 'Control') estadoRcm = 'Ensayado'
        else if (formValues.rcmType === 'Servicio') estadoRcm = 'Ejecutado'

        const today = getTodayDateForInput()
        const payload = {
            rcmType: formValues.rcmType,
            sede: formValues.sede,
            areaId: formValues.area || null,
            familiaId: formValues.tipoServicio || null,
            fechaCodificacion: today,
            fechaServicio: formValues.fechaServicio,
            fechaMuestreo: formValues.fechaServicio,
            fechaIngreso: today,
            numeroTarjeta: formValues.numeroTarjeta,
            tipoMaterial: formValues.tipoMaterial,
            item: formValues.item,
            grado: formValues.grado,
            procedencia: formValues.procedencia,
            ubicacionSector: formValues.ubicacionSector,
            elemento: formValues.elemento,
            cota1: formValues.cota1,
            cota2: formValues.cota2,
            observacionItem: formValues.observacionItem,
            observaciones: formValues.observaciones,
            informeEnsayo: formValues.informeEnsayo,
            tomaMuestra: formValues.tomaMuestra,
            cantidadMuestras: parseInt(formValues.cantidadMuestras) || 1,
            vencimiento: formValues.tieneVencimiento,
            ensayos: ensayosAsociados.map(e => ({
                productoId: e.productoId,
                sku: e.sku,
                nombre: e.nombre,
                norma: e.norma,
                cantidad: e.cantidad,
                observacion: e.observacion,
                estadoOperativo: e.estadoOperativo,
                esPaquete: e.esPaquete,
                subProductos: e.subProductos?.map(sp => ({
                    productoId: sp.productoId,
                    sku: sp.sku,
                    nombre: sp.nombre,
                    norma: sp.norma,
                    cantidad: sp.cantidad,
                    observacion: sp.observacion,
                })),
            })),
            submuestrasVencimiento: formValues.submuestrasVencimiento,
            ordenTrabajoId: otData?.id ?? null,
            clienteId: otData?.clienteId ?? otData?.cliente?.id ?? null,
            obraId: otData?.obraId ?? otData?.obra?.id ?? null,
        }

        setIsSavingRcm(true)
        try {
            let result: any
            if (editandoRcm && rcmOriginal?.dbId) {
                const response = await fetch(`/api/rcm/${rcmOriginal.dbId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}))
                    throw new Error(errBody.error || 'Error al actualizar el RCM')
                }
                result = await response.json()
            } else {
                const response = await fetch('/api/rcm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}))
                    throw new Error(errBody.error || 'Error al guardar el RCM')
                }
                result = await response.json()
            }

            const newRcm: RCMData = {
                id: Date.now(),
                dbId: result.id,
                numeroRcm: result.numeroRcm,
                rcmType: formValues.rcmType,
                sede: formValues.sede,
                area: areaNombre,
                tipoServicio: tipoServicioNombre,
                numeroTarjeta: formValues.numeroTarjeta,
                tipoMaterial: formValues.tipoMaterial,
                item: formValues.item,
                grado: formValues.grado,
                procedencia: formValues.procedencia,
                ubicacionSector: formValues.ubicacionSector,
                elemento: formValues.elemento,
                calicata: formValues.calicata,
                estrato: formValues.estrato,
                cota1: formValues.cota1,
                cota2: formValues.cota2,
                observacionItem: formValues.observacionItem,
                observaciones: formValues.observaciones,
                informeEnsayo: formValues.informeEnsayo,
                ensayos: [...ensayosAsociados],
                fechaServicio: formValues.fechaServicio,
                fechaCodificacion: today,
                fechaMuestreo: formValues.fechaServicio,
                fechaIngreso: formValues.fechaIngreso || today,
                fechaEntrega: formValues.fechaEntrega,
                fechaConfeccion: formValues.fechaConfeccion,
                tomaMuestra: formValues.tomaMuestra,
                cantidadMuestras: formValues.cantidadMuestras,
                estado: estadoRcm,
                tieneVencimiento: formValues.tieneVencimiento,
                submuestrasVencimiento: [...formValues.submuestrasVencimiento],
            }

            setSavedRcms(prev => [...prev, newRcm])
            setActionBarRcmId(newRcm.id)

            // Limpiar estado de edición y duplicación
            setIsEditingRcm(false)
            setEditingRcmId(null)
            setOriginalRcm(null)
            setIsDuplicatingRcm(false)

            // Limpiar formulario
            resetForm()
            setShowRcmCard(false)
            setEnsayosAsociados([])
            clearEnsayosPendientes()
        } catch (error) {
            setErrorVencimiento(error instanceof Error ? error.message : 'Error al guardar el RCM')
        } finally {
            setIsSavingRcm(false)
        }
    }

    const handleToggleExpand = () => {
        // This is for the draft card expand
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
                setOriginalRcm({ ...rcmToEdit })
                populateFormFromRcm(rcmToEdit, areas, todasLasFamilias, 'edit')
                setEnsayosAsociados([...rcmToEdit.ensayos])
                setIsEditingRcm(true)
                setEditingRcmId(selectedRcmId)
                setSavedRcms(savedRcms.filter(r => r.id !== selectedRcmId))
            }
        }
        handleCloseRcmMenu()
    }

    const performDeleteRcm = async (rcmId: number) => {
        const rcmToDelete = savedRcms.find(r => r.id === rcmId)
        if (rcmToDelete?.dbId) {
            try {
                await fetch(`/api/rcm/${rcmToDelete.dbId}`, { method: 'DELETE' })
            } catch {
                // ignorar error de red, igual remover de la UI
            }
        }
        setSavedRcms(prev => prev.filter(r => r.id !== rcmId))
    }

    const handleDeleteRcm = () => {
        if (selectedRcmId !== null) {
            setRcmIdToDelete(selectedRcmId)
            setShowDeleteConfirm(true)
        }
        handleCloseRcmMenu()
    }

    const handleConfirmDelete = async () => {
        if (rcmIdToDelete !== null) {
            await performDeleteRcm(rcmIdToDelete)
        }
        setRcmIdToDelete(null)
        setShowDeleteConfirm(false)
    }

    const handleDismissDeleteConfirm = () => {
        setRcmIdToDelete(null)
        setShowDeleteConfirm(false)
    }

    const handleDuplicateRcm = () => {
        if (isEditingRcm) {
            setShowEditWarning(true)
            handleCloseRcmMenu()
            return
        }

        if (selectedRcmId !== null) {
            const rcmToDuplicate = savedRcms.find(r => r.id === selectedRcmId)
            if (rcmToDuplicate) {
                populateFormFromRcm(rcmToDuplicate, areas, todasLasFamilias, 'duplicate')
                setEnsayosAsociados([...rcmToDuplicate.ensayos])
                setIsDuplicatingRcm(true)
            }
        }
        handleCloseRcmMenu()
    }

    /** Duplicar un RCM inline (desde la barra de acciones) */
    const handleDuplicateInline = (rcmId: number) => {
        const rcmToDuplicate = savedRcms.find(r => r.id === rcmId)
        if (rcmToDuplicate) {
            populateFormFromRcm(rcmToDuplicate, areas, todasLasFamilias, 'duplicate')
            setEnsayosAsociados([...rcmToDuplicate.ensayos])
            setIsDuplicatingRcm(true)
        }
    }

    const handleGuardarTodo = async (codigosAgrupadores: any[]) => {
        if (savedRcms.length === 0) return
        setIsSaving(true)
        try {
            const today = getTodayDateForInput()
            const payload = {
                rcms: savedRcms.map(rcm => ({
                    dbId: rcm.dbId ?? undefined,
                    id: rcm.id,
                    rcmType: rcm.rcmType,
                    sede: rcm.sede,
                    areaId: areas.find(a => a.nombre === rcm.area)?.id ?? null,
                    familiaId: todasLasFamilias.find(f => f.nombre === rcm.tipoServicio)?.id ?? null,
                    fechaCodificacion: today,
                    fechaServicio: rcm.fechaServicio,
                    fechaMuestreo: rcm.fechaMuestreo || rcm.fechaServicio,
                    fechaIngreso: today,
                    numeroTarjeta: rcm.numeroTarjeta,
                    tipoMaterial: rcm.tipoMaterial,
                    item: rcm.item,
                    grado: rcm.grado,
                    elemento: rcm.elemento,
                    procedencia: rcm.procedencia,
                    ubicacionSector: rcm.ubicacionSector,
                    observacionItem: rcm.observacionItem,
                    observaciones: rcm.observaciones,
                    cota1: rcm.cota1,
                    cota2: rcm.cota2,
                    informeEnsayo: rcm.informeEnsayo ?? true,
                    cantidadMuestras: parseInt(rcm.cantidadMuestras) || 1,
                    vencimiento: rcm.tieneVencimiento ?? false,
                    tomaMuestra: rcm.tomaMuestra,
                    ensayos: rcm.ensayos.map(e => ({
                        productoId: e.productoId,
                        sku: e.sku,
                        nombre: e.nombre,
                        norma: e.norma,
                        cantidad: e.cantidad,
                        observacion: e.observacion,
                        estadoOperativo: e.estadoOperativo,
                        esPaquete: e.esPaquete,
                        subProductos: e.subProductos?.map(sp => ({
                            productoId: sp.productoId,
                            sku: sp.sku,
                            nombre: sp.nombre,
                            norma: sp.norma,
                            cantidad: sp.cantidad,
                            observacion: sp.observacion,
                        })),
                    })),
                    submuestrasVencimiento: rcm.submuestrasVencimiento,
                    ordenTrabajoId: otData?.id,
                    clienteId: otData?.clienteId ?? otData?.cliente?.id ?? null,
                    obraId: otData?.obraId ?? otData?.obra?.id ?? null,
                })),
                codigosAgrupadores: codigosAgrupadores.map(ag => ({
                    id: ag.id,
                    codigoId: ag.codigoId,
                    codigoNombre: ag.codigoNombre,
                    descripcionServicio: ag.descripcionServicio,
                    cantidad: ag.cantidad,
                    unidad: ag.unidad,
                    facturacion: ag.facturacion,
                    ensayos: ag.ensayos.map((e: any) => ({ sku: e.sku, nombre: e.nombre })),
                    rcmsVinculados: ag.rcmsVinculados.map((r: any) => ({ id: r.id })),
                })),
                ordenTrabajoId: otData?.id ?? null,
                clienteId: otData?.clienteId ?? otData?.cliente?.id ?? null,
                obraId: otData?.obraId ?? otData?.obra?.id ?? null,
            }

            const response = await fetch('/api/rcm/guardar-lote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errBody = await response.json().catch(() => ({}))
                throw new Error(errBody.message || 'Error al guardar los RCMs')
            }

            const result = await response.json()

            setSavedRcms(prev =>
                prev.map((rcm, idx) => ({
                    ...rcm,
                    dbId: result.rcms[idx]?.id ?? rcm.dbId,
                    numeroRcm: result.rcms[idx]?.id
                        ? result.rcms[idx].id.toString()
                        : rcm.numeroRcm,
                }))
            )

            const total = result.rcms?.length ?? savedRcms.length
            setSuccessMessage(`${total} RCM${total !== 1 ? 's' : ''} guardado${total !== 1 ? 's' : ''} exitosamente`)

            return result
        } catch (error) {
            setErrorVencimiento(error instanceof Error ? error.message : 'Error al guardar')
        } finally {
            setIsSaving(false)
        }
    }

    return {
        // Edit state
        isEditingRcm,
        isDuplicatingRcm,
        editingRcmId,
        originalRcm,
        isSavingRcm,
        isSaving,
        successMessage, setSuccessMessage,
        // Dialogs
        showEditWarning, setShowEditWarning,
        showConfirmNewRcm,
        showCancelConfirm,
        showDeleteConfirm,
        pendingRcmType,
        // Menus
        newRcmMenuAnchor, setNewRcmMenuAnchor,
        rcmMenuAnchor,
        selectedRcmId, setSelectedRcmId,
        // Action bar
        actionBarRcmId, setActionBarRcmId,
        // Expand state
        expandedSavedRcms,
        // Handlers
        handleNewRcmClick,
        handleSelectRcmType,
        createNewRcm,
        handleConfirmNewRcm,
        handleCancelNewRcm,
        handleCancelEdit,
        handleConfirmCancel,
        handleDismissCancelConfirm,
        handleConfirmDelete,
        handleDismissDeleteConfirm,
        handleSaveRcm,
        handleToggleSavedRcm,
        handleOpenRcmMenu,
        handleCloseRcmMenu,
        handleEditRcm,
        handleDeleteRcm,
        handleDuplicateRcm,
        handleDuplicateInline,
        handleGuardarTodo,
    }
}
