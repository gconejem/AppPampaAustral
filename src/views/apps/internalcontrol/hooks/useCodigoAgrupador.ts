import { useState, useEffect } from 'react'
import type { CodigoAgrupador, RCMData, EnsayoAsociado, AreaType, FamiliaType, ProductoType } from '../types/rcm-types'

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
    const [dialogSkus, setDialogSkus] = useState<Array<{ sku: string; nombre: string; productoId: number }>>([])
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
        setDialogCantidad(selectedRcmIds.length > 0 ? selectedRcmIds.length : 1)
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

        dialogSkus.forEach(skuItem => {
            const skuAlreadyIncluded = allEnsayos.some(e => e.sku === skuItem.sku)
            if (!skuAlreadyIncluded) {
                allEnsayos.unshift({ productoId: skuItem.productoId, sku: skuItem.sku, nombre: skuItem.nombre })
            }
        })
        if (dialogSkus.length === 0 && dialogSkuSearch.trim()) {
            const skuAlreadyIncluded = allEnsayos.some(e => e.sku === dialogSkuSearch.trim())
            if (!skuAlreadyIncluded) {
                allEnsayos.unshift({ productoId: -1, sku: dialogSkuSearch.trim(), nombre: dialogSkuSearch.trim() })
            }
        }

        const facturacionValue = (dialogSkus.length > 0 || dialogSkuSearch.trim()) ? 'Fijo' : 'Unitario'

        setIsCreatingCodigo(true)
        try {
            const res = await fetch('/api/codigo-agrupador', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcionServicio: dialogDescripcionServicio || null,
                    cantidad: dialogCantidad,
                    unidad: 'unid',
                    facturacion: facturacionValue,
                    ensayos: allEnsayos.map(e => ({ sku: e.sku, nombre: e.nombre })),
                    ordenTrabajoId: otData?.id ?? null,
                }),
            })

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}))
                throw new Error(errBody.error || 'Error al crear código de producto')
            }

            const created = await res.json()

            const newAgrupador: CodigoAgrupador = {
                id: created.codigoNombre,
                dbId: created.id,
                codigoId: created.codigoId,
                codigoNombre: created.codigoNombre,
                rcmsVinculados: rcmsToAssign,
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
        const agrupador = codigosAgrupadores.find(a => a.id === agrupadorId)

        if (agrupador?.dbId) {
            try {
                await fetch(`/api/codigo-agrupador/${agrupador.dbId}`, { method: 'DELETE' })
            } catch (err) {
                console.error('Error al eliminar código agrupador de la DB:', err)
            }
        }

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
        setDialogSkus(prev => prev.some(s => s.sku === sku) ? prev : [...prev, { sku, nombre: producto.nombre, productoId: producto.id }])
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
        computeValidaciones,
    }
}
