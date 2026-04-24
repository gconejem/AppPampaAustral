import { useState, useEffect } from 'react'
import type { CodigoAgrupador, RCMData, EnsayoAsociado, AreaType, FamiliaType, ProductoType } from '../types/rcm-types'
import { generateTemporaryProductCode } from '../utils/temporaryCodes'

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
}

export function useCodigoAgrupador({
    savedRcms,
    ensayosAsociados,
    areas,
    otData,
    area,
    agrupadorSearchAnchor,
    setAgrupadorSearchAnchor,
    skuSearchAnchor,
    setSkuSearchAnchor,
}: UseCodigoAgrupadorParams) {
    // Códigos Agrupadores
    const [codigosAgrupadores, setCodigosAgrupadores] = useState<CodigoAgrupador[]>([])
    const [selectedRcmIds, setSelectedRcmIds] = useState<number[]>([])
    const [editingAgrupadorId, setEditingAgrupadorId] = useState<string | null>(null)
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
    const [dialogMode, setDialogMode] = useState<'nuevo' | 'existente'>('nuevo')
    const [selectedExistingAgrupadorId, setSelectedExistingAgrupadorId] = useState<string>('')
    const [showPreFinalizacion, setShowPreFinalizacion] = useState(false)

    // Códigos existentes de la OT
    const [codigosOT, setCodigosOT] = useState<Array<{ id: string; nombre: string; tipo: string; descripcion: string }>>([
        { id: 'COD-001', nombre: 'Hormigón H30', tipo: 'Muestra', descripcion: 'Código para muestras de hormigón grado H30' },
        { id: 'COD-002', nombre: 'Suelo Base', tipo: 'Control', descripcion: 'Control de compactación base estabilizada' },
        { id: 'COD-003', nombre: 'Asfalto CA-24', tipo: 'Muestra', descripcion: 'Muestras de carpeta asfáltica' },
    ])

    const handleToggleRcmSelection = (rcmId: number) => {
        setSelectedRcmIds(prev =>
            prev.includes(rcmId)
                ? prev.filter(id => id !== rcmId)
                : [...prev, rcmId]
        )
    }

    const handleOpenCodigoPopup = (_event: React.MouseEvent<HTMLElement>) => {
        setOpenCodigoDialog(true)
        setShowNewCodigoForm(false)
        setSelectedCodigo('')
        setDialogSkuSearch('')
        setDialogDescripcionServicio('')
        setDialogCantidad(1)
        setDialogMode('nuevo')
        setSelectedExistingAgrupadorId(codigosAgrupadores.length > 0 ? codigosAgrupadores[0].id : '')
    }

    const handleCloseCodigoPopup = () => {
        setOpenCodigoDialog(false)
        setShowNewCodigoForm(false)
        setSelectedCodigo('')
        setNewCodigoNombre('')
        setNewCodigoDescripcion('')
        setNewCodigoTipo('')
        setDialogSkuSearch('')
        setDialogSkus([])
        setDialogDescripcionServicio('')
        setSelectedExistingAgrupadorId('')
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

        const allEnsayos: Array<{ productoId: number; sku: string; nombre: string }> = []
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
                allEnsayos.push({ productoId: skuItem.productoId, sku: skuItem.sku, nombre: skuItem.nombre })
            })
            if (dialogSkus.length === 0 && dialogSkuSearch.trim()) {
                allEnsayos.push({ productoId: -1, sku: dialogSkuSearch.trim(), nombre: dialogSkuSearch.trim() })
            }
        } else {
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

    const handleDeleteAgrupador = async (agrupadorId: string) => {
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
                ensayos: [...a.ensayos, { productoId: idProducto, sku: producto.sku, nombre: producto.nombre }]
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

        const allEnsayos: Array<{ productoId: number; sku: string; nombre: string }> = []
        const seenIds = new Set<number>()
        rcm.ensayos.forEach(e => {
            if (!seenIds.has(e.productoId)) {
                seenIds.add(e.productoId)
                allEnsayos.push({ productoId: e.productoId, sku: e.sku, nombre: e.nombre })
            }
        })

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
        } catch (err) {
            console.error('Error al crear código 1:1:', err)
            setErrorVencimiento(err instanceof Error ? err.message : 'Error al crear código de producto')
        } finally {
            setIsCreatingCodigo(false)
        }
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

        const totalRcms = savedRcms.length
        const tipoControl = savedRcms.filter(r => r.rcmType === 'Control').length
        const tipoMuestra = savedRcms.filter(r => r.rcmType === 'Muestra').length
        const tipoServicioCount = savedRcms.filter(r => r.rcmType === 'Servicio').length
        const codigosProducto = codigosAgrupadores.length
        const modoPxQ = codigosAgrupadores.filter(a => a.facturacion === 'Unitario').length
        const modoFijo = codigosAgrupadores.filter(a => a.facturacion === 'Fijo').length

        return { v1, v2, v3, v4, v5, totalRcms, tipoControl, tipoMuestra, tipoServicio: tipoServicioCount, codigosProducto, modoPxQ, modoFijo }
    }

    return {
        // State
        codigosAgrupadores, setCodigosAgrupadores,
        selectedRcmIds, setSelectedRcmIds,
        agrupadorSearchAnchor,
        skuSearchAnchor,
        editingAgrupadorId,
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
        dialogMode, setDialogMode,
        selectedExistingAgrupadorId, setSelectedExistingAgrupadorId,
        showPreFinalizacion, setShowPreFinalizacion,
        codigosOT,
        // Handlers
        handleToggleRcmSelection,
        handleOpenCodigoPopup,
        handleCloseCodigoPopup,
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
        handleCrearNuevoCodigo,
        handleCodigoUnoAUno,
        computeValidaciones,
    }
}
