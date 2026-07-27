import { useState, useEffect, useMemo } from 'react'
import type { CodigoAgrupador, RCMData, EnsayoAsociado, AreaType, ProductoType } from '../types/rcm-types'
import { generateTemporaryProductCode } from '../utils/temporaryCodes'

type AgrupadorEnsayo = { productoId: number; sku: string; nombre: string; cantidad?: number }

const normalizeText = (value?: string) =>
    (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

export const isReusableHormigonAridosRcm = (rcm: RCMData) => {
    const area = normalizeText(rcm.area)
    const tipoServicio = normalizeText(rcm.tipoServicio)

    return rcm.rcmType === 'Muestra' && (
        (area === 'hormigon' && tipoServicio === 'dosificaciones hormigon') ||
        (area === 'asfalto' && tipoServicio === 'dosificaciones asfalto')
    )
}

interface UseCodigoAgrupadorParams {
    savedRcms: RCMData[]
    ensayosAsociados: EnsayoAsociado[]
    areas: AreaType[]
    otData?: any
    area: number | ''
    agrupadorSearchAnchor: HTMLElement | null
    setAgrupadorSearchAnchor: (el: HTMLElement | null) => void
    skuSearchAnchor: HTMLElement | null
    setSkuSearchAnchor: (el: HTMLElement | null) => void
    onAutoCodigoProductoCreated?: () => void
}

export function useCodigoAgrupador({
    savedRcms,
    ensayosAsociados,
    areas,
    area,
    agrupadorSearchAnchor,
    setAgrupadorSearchAnchor,
    skuSearchAnchor,
    setSkuSearchAnchor,
    onAutoCodigoProductoCreated,
}: UseCodigoAgrupadorParams) {
    // Códigos Agrupadores
    const [codigosAgrupadores, setCodigosAgrupadores] = useState<CodigoAgrupador[]>([])
    const [selectedRcmIds, setSelectedRcmIds] = useState<number[]>([])
    const [editingAgrupadorId, setEditingAgrupadorId] = useState<string | null>(null)
    const [editingCodigoAgrupadorId, setEditingCodigoAgrupadorId] = useState<string | null>(null)
    const [agrupadorSearchTerm, setAgrupadorSearchTerm] = useState('')
    const [isCreatingCodigo, setIsCreatingCodigo] = useState(false)

    // Dialog state
    const [openCodigoDialog, setOpenCodigoDialog] = useState(false)
    const [showNewCodigoForm, setShowNewCodigoForm] = useState(false)
    const [selectedCodigo, setSelectedCodigo] = useState<string>('')
    const [newCodigoNombre, setNewCodigoNombre] = useState('')
    const [newCodigoDescripcion, setNewCodigoDescripcion] = useState('')
    const [newCodigoTipo, setNewCodigoTipo] = useState('')
    const [dialogSkuSearch, setDialogSkuSearch] = useState('')
    const [dialogSkus, setDialogSkus] = useState<Array<{ sku: string; nombre: string; productoId: number; cantidad: number }>>([])
    const [dialogDescripcionServicio, setDialogDescripcionServicio] = useState('')
    const [dialogCantidad, setDialogCantidad] = useState<number>(1)
    const [dialogFacturacion, setDialogFacturacion] = useState<'Unitario' | 'Fijo'>('Unitario')
    const [dialogMode, setDialogMode] = useState<'nuevo' | 'existente' | 'editar'>('nuevo')
    const [selectedExistingAgrupadorId, setSelectedExistingAgrupadorId] = useState<string>('')
    const [showPreFinalizacion, setShowPreFinalizacion] = useState(false)
    const [dismissedReusableRcmIds, setDismissedReusableRcmIds] = useState<number[]>([])
    const [lastDismissedReusableRcmIds, setLastDismissedReusableRcmIds] = useState<number[]>([])

    // Códigos existentes de la OT
    const [codigosOT, setCodigosOT] = useState<Array<{ id: string; nombre: string; tipo: string; descripcion: string }>>([
        { id: 'COD-001', nombre: 'Hormigón H30', tipo: 'Muestra', descripcion: 'Código para muestras de hormigón grado H30' },
        { id: 'COD-002', nombre: 'Suelo Base', tipo: 'Control', descripcion: 'Control de compactación base estabilizada' },
        { id: 'COD-003', nombre: 'Asfalto CA-24', tipo: 'Muestra', descripcion: 'Muestras de carpeta asfáltica' },
    ])

    const getEnsayoKey = (ensayo: AgrupadorEnsayo) =>
        ensayo.productoId > 0
            ? `producto:${ensayo.productoId}`
            : `sku:${ensayo.sku.trim().toLowerCase()}`

    const getPositiveCantidad = (cantidad?: number) => {
        const value = Number(cantidad ?? 1)
        return Number.isFinite(value) && value > 0 ? value : 1
    }

    const aggregateEnsayos = (ensayos: AgrupadorEnsayo[]) => {
        const aggregated = new Map<string, AgrupadorEnsayo>()

        ensayos.forEach(ensayo => {
            const key = getEnsayoKey(ensayo)
            const cantidad = getPositiveCantidad(ensayo.cantidad)
            const existing = aggregated.get(key)

            if (existing) {
                aggregated.set(key, {
                    ...existing,
                    cantidad: getPositiveCantidad(existing.cantidad) + cantidad
                })
                return
            }

            aggregated.set(key, { ...ensayo, cantidad })
        })

        return Array.from(aggregated.values())
    }

    const buildEnsayosFromRcmIds = (rcmIds: number[]) => {
        const ensayos = rcmIds.flatMap(rcmId => {
            const fullRcm = savedRcms.find(r => r.id === rcmId)
            return fullRcm?.ensayos.map(e => ({
                productoId: e.productoId,
                sku: e.sku,
                nombre: e.nombre,
                cantidad: e.cantidad
            })) ?? []
        })

        return aggregateEnsayos(ensayos)
    }

    useEffect(() => {
        if (dialogMode === 'editar' && dialogFacturacion === 'Fijo' && dialogSkus.length === 0) {
            setDialogFacturacion('Unitario')
        }
    }, [dialogFacturacion, dialogMode, dialogSkus.length])

    const rcmIdsAgrupados = useMemo(() => {
        const groupedIds = new Set<number>()
        codigosAgrupadores.forEach(ag => ag.rcmsVinculados.forEach(rcm => groupedIds.add(rcm.id)))
        return groupedIds
    }, [codigosAgrupadores])

    const reusableRcmsDisponibles = useMemo(() => {
        const dismissedIds = new Set(dismissedReusableRcmIds)

        return savedRcms
            .filter(rcm => isReusableHormigonAridosRcm(rcm))
            .filter(rcm => rcmIdsAgrupados.has(rcm.id))
            .filter(rcm => !dismissedIds.has(rcm.id))
            .sort((a, b) => b.id - a.id)
    }, [dismissedReusableRcmIds, rcmIdsAgrupados, savedRcms])

    useEffect(() => {
        const validReusableIds = new Set(savedRcms.filter(isReusableHormigonAridosRcm).map(rcm => rcm.id))
        setDismissedReusableRcmIds(prev => prev.filter(id => validReusableIds.has(id)))
        setLastDismissedReusableRcmIds(prev => prev.filter(id => validReusableIds.has(id)))
    }, [savedRcms])

    const handleDismissReusableRcm = (rcmId: number) => {
        setDismissedReusableRcmIds(prev => prev.includes(rcmId) ? prev : [...prev, rcmId])
        setLastDismissedReusableRcmIds([rcmId])
        setSelectedRcmIds(prev => prev.filter(id => id !== rcmId))
    }

    const handleDismissAllReusableRcms = () => {
        const ids = reusableRcmsDisponibles.map(rcm => rcm.id)
        if (ids.length === 0) return

        setDismissedReusableRcmIds(prev => [...new Set([...prev, ...ids])])
        setLastDismissedReusableRcmIds(ids)
        setSelectedRcmIds(prev => prev.filter(id => !ids.includes(id)))
    }

    const handleUndoLastDismissedReusableRcms = () => {
        const idsToRestore = lastDismissedReusableRcmIds.length > 0
            ? lastDismissedReusableRcmIds
            : dismissedReusableRcmIds

        if (idsToRestore.length === 0) return

        setDismissedReusableRcmIds(prev => prev.filter(id => !idsToRestore.includes(id)))
        setLastDismissedReusableRcmIds([])
    }

    const handleToggleRcmSelection = (rcmId: number) => {
        setSelectedRcmIds(prev =>
            prev.includes(rcmId)
                ? prev.filter(id => id !== rcmId)
                : [...prev, rcmId]
        )
    }

    const handleOpenCodigoPopup = () => {
        setOpenCodigoDialog(true)
        setShowNewCodigoForm(false)
        setSelectedCodigo('')
        setDialogSkuSearch('')
        setDialogSkus([])
        setDialogDescripcionServicio('')
        setDialogCantidad(1)
        setDialogFacturacion('Unitario')
        setDialogMode('nuevo')
        setEditingCodigoAgrupadorId(null)
        setSelectedExistingAgrupadorId(codigosAgrupadores.length > 0 ? codigosAgrupadores[0].id : '')
    }

    const handleOpenEditAgrupador = (agrupadorId: string) => {
        const agrupador = codigosAgrupadores.find(ag => ag.id === agrupadorId)
        if (!agrupador) return

        setOpenCodigoDialog(true)
        setShowNewCodigoForm(false)
        setSelectedCodigo('')
        setEditingCodigoAgrupadorId(agrupadorId)
        setDialogMode('editar')
        setSelectedExistingAgrupadorId('')
        setSelectedRcmIds(agrupador.rcmsVinculados.map(rcm => rcm.id))
        setDialogSkuSearch('')
        const facturacion = agrupador.facturacion === 'Fijo' ? 'Fijo' : 'Unitario'
        setDialogSkus(facturacion === 'Fijo'
            ? agrupador.ensayos.map(ensayo => ({
                sku: ensayo.sku,
                nombre: ensayo.nombre,
                productoId: ensayo.productoId,
                cantidad: ensayo.cantidad ?? 1
            }))
            : []
        )
        setDialogDescripcionServicio(agrupador.descripcionServicio ?? '')
        setDialogCantidad(agrupador.cantidad || 1)
        setDialogFacturacion(facturacion)
    }

    const handleCloseCodigoPopup = () => {
        const wasEditing = dialogMode === 'editar'
        setOpenCodigoDialog(false)
        setShowNewCodigoForm(false)
        setSelectedCodigo('')
        setNewCodigoNombre('')
        setNewCodigoDescripcion('')
        setNewCodigoTipo('')
        setDialogSkuSearch('')
        setDialogSkus([])
        setDialogDescripcionServicio('')
        setDialogCantidad(1)
        setDialogFacturacion('Unitario')
        setDialogMode('nuevo')
        setEditingCodigoAgrupadorId(null)
        setSelectedExistingAgrupadorId('')
        if (wasEditing) setSelectedRcmIds([])
    }

    const handleSelectCodigo = (codigoId: string) => {
        setSelectedCodigo(codigoId)
    }

    const handleConfirmCodigo = async (
        rcmType: string,
        numeroTarjeta: string,
        showRcmCard: boolean,
        setErrorVencimiento: (msg: string) => void,
    ) => {
        const rcmsToAssign = selectedRcmIds.length > 0
            ? savedRcms.filter(r => selectedRcmIds.includes(r.id)).map(r => ({
                id: r.id,
                numeroTarjeta: r.numeroTarjeta || r.numeroRcm || `T-${r.id}`,
                rcmType: r.rcmType,
                numeroRcm: r.numeroRcm
            }))
            : showRcmCard
                ? [{ id: Date.now(), numeroTarjeta: numeroTarjeta || 'Actual', rcmType: rcmType }]
                : []

        if (rcmsToAssign.length === 0) return

        let allEnsayos: AgrupadorEnsayo[] = []
        const seenProductoIds = new Set<number>()
        const hasDialogSkus = dialogSkus.length > 0 || dialogSkuSearch.trim().length > 0
        if (hasDialogSkus) {
            const seenSkus = new Set<string>()
            dialogSkus.forEach(skuItem => {
                if (seenSkus.has(skuItem.sku)) return
                seenSkus.add(skuItem.sku)
                if (skuItem.productoId && !seenProductoIds.has(skuItem.productoId)) {
                    seenProductoIds.add(skuItem.productoId)
                }
                allEnsayos.push({ productoId: skuItem.productoId, sku: skuItem.sku, nombre: skuItem.nombre, cantidad: skuItem.cantidad })
            })
            if (dialogSkus.length === 0 && dialogSkuSearch.trim()) {
                allEnsayos.push({ productoId: -1, sku: dialogSkuSearch.trim(), nombre: dialogSkuSearch.trim(), cantidad: 1 })
            }
        } else {
            allEnsayos = buildEnsayosFromRcmIds(rcmsToAssign.map(rcmRef => rcmRef.id))
            if (allEnsayos.length === 0 && ensayosAsociados.length > 0) {
                allEnsayos = aggregateEnsayos(ensayosAsociados.map(e => ({
                    productoId: e.productoId,
                    sku: e.sku,
                    nombre: e.nombre,
                    cantidad: e.cantidad
                })))
            }
        }

        const facturacionValue = (dialogSkus.length > 0 || dialogSkuSearch.trim()) ? 'Fijo' : 'Unitario'

        setIsCreatingCodigo(true)
        try {
            // Generate temporary product code (in-memory only, no database save)
            const nextIndex = codigosAgrupadores.length + 1
            const temporaryCode = generateTemporaryProductCode(nextIndex)
            const tempId = `temp-${Date.now()}`

            // Enrich rcmsToAssign with temporaryCode from savedRcms
            const enrichedRcmsToAssign = rcmsToAssign.map(rcmRef => {
                const fullRcm = savedRcms.find(r => r.id === rcmRef.id)
                return {
                    ...rcmRef,
                    temporaryCode: fullRcm?.temporaryCode
                }
            })

            const newAgrupador: CodigoAgrupador = {
                id: tempId,
                temporaryCode: temporaryCode,
                codigoId: temporaryCode,
                codigoNombre: temporaryCode,
                rcmsVinculados: enrichedRcmsToAssign,
                ensayos: allEnsayos,
                descripcionServicio: dialogDescripcionServicio,
                cantidad: dialogCantidad,
                unidad: 'unid',
                facturacion: facturacionValue
            }

            setCodigosAgrupadores(prev => [...prev, newAgrupador])
            setSelectedRcmIds([])
            handleCloseCodigoPopup()
        } catch (err) {
            console.error('Error al crear código de producto:', err)
            setErrorVencimiento(err instanceof Error ? err.message : 'Error al crear código de producto')
        } finally {
            setIsCreatingCodigo(false)
        }
    }

    const handleAddToExistingAgrupador = () => {
        if (!selectedExistingAgrupadorId) return

        const rcmsToAdd = selectedRcmIds.length > 0
            ? savedRcms.filter(r => selectedRcmIds.includes(r.id)).map(r => ({
                id: r.id,
                numeroTarjeta: r.numeroTarjeta || r.numeroRcm || `T-${r.id}`,
                rcmType: r.rcmType,
                numeroRcm: r.numeroRcm
            }))
            : []

        if (rcmsToAdd.length === 0) return

        setCodigosAgrupadores(prev => prev.map(ag => {
            if (ag.id !== selectedExistingAgrupadorId) return ag

            const existingRcmIds = new Set(ag.rcmsVinculados.map(r => r.id))
            const newRcms = rcmsToAdd.filter(r => !existingRcmIds.has(r.id))

            const nextRcmsVinculados = [...ag.rcmsVinculados, ...newRcms]
            const nextEnsayos = ag.facturacion === 'Fijo'
                ? ag.ensayos
                : buildEnsayosFromRcmIds(nextRcmsVinculados.map(r => r.id))

            return {
                ...ag,
                rcmsVinculados: nextRcmsVinculados,
                ensayos: nextEnsayos,
                cantidad: ag.cantidad + newRcms.length
            }
        }))

        setSelectedRcmIds([])
        handleCloseCodigoPopup()
    }

    const handleDeleteAgrupador = async (agrupadorId: string) => {
        const agrupador = codigosAgrupadores.find(a => a.id === agrupadorId)
        const reusableIdsInDeletedAgrupador = (agrupador?.rcmsVinculados ?? [])
            .map(rcmRef => savedRcms.find(rcm => rcm.id === rcmRef.id))
            .filter((rcm): rcm is RCMData => Boolean(rcm) && isReusableHormigonAridosRcm(rcm))
            .map(rcm => rcm.id)

        if (reusableIdsInDeletedAgrupador.length > 0) {
            setDismissedReusableRcmIds(prev => prev.filter(id => !reusableIdsInDeletedAgrupador.includes(id)))
            setLastDismissedReusableRcmIds(prev => prev.filter(id => !reusableIdsInDeletedAgrupador.includes(id)))
        }

        // In-memory only: no database deletion until finalization
        setCodigosAgrupadores(prev => prev.filter(a => a.id !== agrupadorId))
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
            if (a.ensayos.some(e => e.productoId === idProducto)) return a
            return {
                ...a,
                ensayos: [...a.ensayos, { productoId: idProducto, sku: producto.sku, nombre: producto.nombre, cantidad: 1 }]
            }
        }))
        handleCloseAgrupadorSearch()
    }

    const handleOpenSkuSearch = (event: React.MouseEvent<HTMLElement>, setSelectedAreaId: (id: number | null) => void) => {
        setSkuSearchAnchor(event.currentTarget)
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
    }

    const handleSelectProductForSku = (producto: ProductoType) => {
        const sku = producto.sku || producto.nombre
        const idProducto = (producto as any).productoId || producto.id
        setDialogSkus(prev => prev.some(s => s.sku === sku) ? prev : [...prev, { sku, nombre: producto.nombre, productoId: idProducto, cantidad: 1 }])
        if (dialogMode === 'editar') setDialogFacturacion('Fijo')
        setDialogSkuSearch('')
        handleCloseSkuSearch()
    }

    const handleRemoveEnsayoFromAgrupador = (agrupadorId: string, productoId: number) => {
        setCodigosAgrupadores(prev => prev.map(a =>
            a.id === agrupadorId
                ? { ...a, ensayos: a.ensayos.filter(e => e.productoId !== productoId) }
                : a
        ))
    }

    const handleRemoveRcmFromEditingAgrupador = (rcmId: number) => {
        setSelectedRcmIds(prev => prev.filter(id => id !== rcmId))
    }

    const handleSaveEditedAgrupador = () => {
        if (!editingCodigoAgrupadorId || selectedRcmIds.length === 0) return

        const nextRcms = selectedRcmIds.map(id => {
            const fullRcm = savedRcms.find(r => r.id === id)
            return {
                id,
                numeroTarjeta: fullRcm?.numeroTarjeta || fullRcm?.numeroRcm || `T-${id}`,
                rcmType: fullRcm?.rcmType || 'Muestra',
                numeroRcm: fullRcm?.numeroRcm,
                temporaryCode: fullRcm?.temporaryCode
            }
        })

        const nextFacturacion = dialogFacturacion === 'Fijo' && dialogSkus.length > 0 ? 'Fijo' : 'Unitario'
        const nextEnsayos = nextFacturacion === 'Fijo'
            ? dialogSkus.map(skuItem => ({
                productoId: skuItem.productoId,
                sku: skuItem.sku,
                nombre: skuItem.nombre,
                cantidad: skuItem.cantidad
            }))
            : buildEnsayosFromRcmIds(selectedRcmIds)

        setCodigosAgrupadores(prev => prev.map(ag =>
            ag.id === editingCodigoAgrupadorId
                ? {
                    ...ag,
                    rcmsVinculados: nextRcms,
                    ensayos: nextEnsayos,
                    descripcionServicio: dialogDescripcionServicio,
                    cantidad: dialogCantidad,
                    facturacion: nextFacturacion
                }
                : ag
        ))
        handleCloseCodigoPopup()
    }

    /** Agrupar un RCM directamente en un código nuevo sin pasar por la modal (relación 1:1) */
    const handleCodigoUnoAUno = async (
        rcmOrId: RCMData | number,
        setErrorVencimiento: (msg: string) => void,
    ) => {
        const rcm = typeof rcmOrId === 'number'
            ? savedRcms.find(r => r.id === rcmOrId)
            : rcmOrId
        if (!rcm) return

        const rcmRef = {
            id: rcm.id,
            numeroTarjeta: rcm.numeroTarjeta || rcm.numeroRcm || `T-${rcm.id}`,
            rcmType: rcm.rcmType,
            numeroRcm: rcm.numeroRcm,
            temporaryCode: rcm.temporaryCode
        }

        const allEnsayos = aggregateEnsayos(rcm.ensayos.map(e => ({
            productoId: e.productoId,
            sku: e.sku,
            nombre: e.nombre,
            cantidad: e.cantidad
        })))

        setIsCreatingCodigo(true)
        try {
            // Generate temporary product code (in-memory only, no database save)
            const nextIndex = codigosAgrupadores.length + 1
            const temporaryCode = generateTemporaryProductCode(nextIndex)
            const tempId = `temp-${Date.now()}`

            const newAgrupador: CodigoAgrupador = {
                id: tempId,
                temporaryCode: temporaryCode,
                codigoId: temporaryCode,
                codigoNombre: temporaryCode,
                rcmsVinculados: [rcmRef],
                ensayos: allEnsayos,
                descripcionServicio: '',
                cantidad: (rcm.rcmType === 'Control' || rcm.rcmType === 'Servicio')
                    ? (rcm.ensayos[0]?.cantidad ?? 1)
                    : 1,
                unidad: 'unid',
                facturacion: 'Unitario',
            }

            setCodigosAgrupadores(prev => [...prev, newAgrupador])
            setSelectedRcmIds([])
            onAutoCodigoProductoCreated?.()
        } catch (err) {
            console.error('Error al crear código 1:1:', err)
            setErrorVencimiento(err instanceof Error ? err.message : 'Error al crear código de producto')
        } finally {
            setIsCreatingCodigo(false)
        }
    }

    /** Actualizar el agrupador 1:1 asociado a un RCM editado (ensayos y cantidad) */
    const handleUpdateAgrupadorForRcm = (rcm: RCMData) => {
        setCodigosAgrupadores(prev => prev.map(ag => {
            const hasRcm = ag.rcmsVinculados.some(rv => rv.id === rcm.id)
            if (!hasRcm) return ag
            if (ag.rcmsVinculados.length !== 1) return ag
            const ensayos = aggregateEnsayos(rcm.ensayos.map(e => ({
                productoId: e.productoId,
                sku: e.sku,
                nombre: e.nombre,
                cantidad: e.cantidad
            })))
            const nextCantidad = (rcm.rcmType === 'Control' || rcm.rcmType === 'Servicio')
                ? (rcm.ensayos[0]?.cantidad ?? ag.cantidad)
                : ag.cantidad
            return { ...ag, ensayos, cantidad: nextCantidad }
        }))
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

    const computeValidaciones = () => {
        const rcmIdsAgrupados = new Set<number>()
        codigosAgrupadores.forEach(ag => ag.rcmsVinculados.forEach(r => rcmIdsAgrupados.add(r.id)))
        const v1 = savedRcms.every(rcm => rcmIdsAgrupados.has(rcm.id))

        const v2 = savedRcms.every(rcm => {
            if (!rcm.tieneVencimiento || !rcm.submuestrasVencimiento?.length) return true
            const sumaSubmuestras = rcm.submuestrasVencimiento.reduce((acc, s) => acc + (s.cantidad || 0), 0)
            return sumaSubmuestras === parseInt(rcm.cantidadMuestras || '1')
        })

        const v3 = codigosAgrupadores.every(ag => ag.rcmsVinculados.length > 0)

        const v4 = codigosAgrupadores.every(ag => {
            const agAreas = ag.rcmsVinculados.map(rv => savedRcms.find(r => r.id === rv.id)?.area).filter(Boolean)
            return agAreas.length === 0 || new Set(agAreas).size === 1
        })

        const v5 = savedRcms.every(rcm => rcm.ensayos.length > 0)
        const v6 = reusableRcmsDisponibles.length === 0

        const totalRcms = savedRcms.length
        const tipoControl = savedRcms.filter(r => r.rcmType === 'Control').length
        const tipoMuestra = savedRcms.filter(r => r.rcmType === 'Muestra').length
        const tipoServicioCount = savedRcms.filter(r => r.rcmType === 'Servicio').length
        const codigosProducto = codigosAgrupadores.length
        const modoPxQ = codigosAgrupadores.filter(a => a.facturacion === 'Unitario').length
        const modoFijo = codigosAgrupadores.filter(a => a.facturacion === 'Fijo').length

        return { v1, v2, v3, v4, v5, v6, totalRcms, tipoControl, tipoMuestra, tipoServicio: tipoServicioCount, codigosProducto, modoPxQ, modoFijo }
    }

    return {
        // State
        codigosAgrupadores, setCodigosAgrupadores,
        selectedRcmIds, setSelectedRcmIds,
        agrupadorSearchAnchor,
        skuSearchAnchor,
        editingAgrupadorId,
        editingCodigoAgrupadorId,
        agrupadorSearchTerm, setAgrupadorSearchTerm,
        isCreatingCodigo,
        // Dialog state
        openCodigoDialog,
        showNewCodigoForm,
        selectedCodigo,
        newCodigoNombre, setNewCodigoNombre,
        newCodigoDescripcion, setNewCodigoDescripcion,
        newCodigoTipo, setNewCodigoTipo,
        dialogSkuSearch, setDialogSkuSearch,
        dialogSkus, setDialogSkus,
        dialogDescripcionServicio, setDialogDescripcionServicio,
        dialogCantidad, setDialogCantidad,
        dialogFacturacion, setDialogFacturacion,
        dialogMode, setDialogMode,
        selectedExistingAgrupadorId, setSelectedExistingAgrupadorId,
        showPreFinalizacion, setShowPreFinalizacion,
        dismissedReusableRcmIds,
        lastDismissedReusableRcmIds,
        reusableRcmsDisponibles,
        codigosOT,
        // Handlers
        handleToggleRcmSelection,
        handleOpenCodigoPopup,
        handleCloseCodigoPopup,
        handleOpenEditAgrupador,
        handleSelectCodigo,
        handleConfirmCodigo,
        handleAddToExistingAgrupador,
        handleDeleteAgrupador,
        handleChangeAgrupadorCantidad,
        handleChangeAgrupadorFacturacion,
        handleChangeAgrupadorDescripcion,
        handleOpenAgrupadorSearch,
        handleCloseAgrupadorSearch,
        handleSelectProductForAgrupador,
        handleOpenSkuSearch,
        handleCloseSkuSearch,
        handleSelectProductForSku,
        handleRemoveEnsayoFromAgrupador,
        handleRemoveRcmFromEditingAgrupador,
        handleSaveEditedAgrupador,
        handleCrearNuevoCodigo,
        handleCodigoUnoAUno,
        handleUpdateAgrupadorForRcm,
        handleDismissReusableRcm,
        handleDismissAllReusableRcms,
        handleUndoLastDismissedReusableRcms,
        computeValidaciones,
    }
}
