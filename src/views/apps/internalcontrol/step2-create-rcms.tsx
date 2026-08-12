import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    Box,
    Typography,
    Button,
    Card,
    IconButton,
    Menu,
    MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'

// Types
import type { Step2CreateRcmsProps, RCMData } from './types/rcm-types'

// Hooks
import { useRcmForm } from './hooks/useRcmForm'
import { useEnsayos } from './hooks/useEnsayos'
import { useProductSearch } from './hooks/useProductSearch'
import { useRcmCrud } from './hooks/useRcmCrud'
import { useCodigoAgrupador } from './hooks/useCodigoAgrupador'

// Components
import ProductSearchPopover from './components/ProductSearchPopover'
import RcmDraftForm from './components/RcmDraftForm'
import RcmSavedList from './components/RcmSavedList'
import RcmDialogs from './components/RcmDialogs'
import CodigoCreationDialog from './components/CodigoCreationDialog'
import CodigoAgrupadorPanel from './components/CodigoAgrupadorPanel'

const Step2CreateRcms = ({
    ensayosAsociados, setEnsayosAsociados,
    savedRcms, setSavedRcms,
    otData, initialRcmType, onClearInitialRcmType,
    onDraftCountChange, onAgrupadosCountChange,
    onRegisterFinalizar, onIsSavingChange,
}: Step2CreateRcmsProps) => {

    // ═══════════════════════════════════════
    // HOOKS
    // ═══════════════════════════════════════
    const form = useRcmForm({ otData })
    const ensayoHooks = useEnsayos({ ensayosAsociados, setEnsayosAsociados })
    const [showAutoCodigoProductoMessage, setShowAutoCodigoProductoMessage] = useState(false)

    // Lifted anchor states to break circular dependency between useCodigoAgrupador & useProductSearch
    const [agrupadorSearchAnchor, setAgrupadorSearchAnchor] = useState<HTMLElement | null>(null)
    const [skuSearchAnchor, setSkuSearchAnchor] = useState<HTMLElement | null>(null)

    const productSearch = useProductSearch({
        area: form.area,
        anchorEl: null,
        agrupadorSearchAnchor,
        skuSearchAnchor,
        isInline: true
    })

    const codigoReal = useCodigoAgrupador({
        savedRcms,
        ensayosAsociados,
        areas: productSearch.areas,
        otData,
        area: form.area,
        agrupadorSearchAnchor,
        setAgrupadorSearchAnchor,
        skuSearchAnchor,
        setSkuSearchAnchor,
        onAutoCodigoProductoCreated: () => setShowAutoCodigoProductoMessage(true),
    })

    const isRcmLinkedToCodigoProducto = useCallback((rcmId: number) => {
        return codigoReal.codigosAgrupadores.some(agrupador =>
            agrupador.rcmsVinculados.some(rcm => rcm.id === rcmId)
        )
    }, [codigoReal.codigosAgrupadores])

    const codigoUnoAUnoRef = React.useRef<(rcm: RCMData, setError: (msg: string) => void) => Promise<void>>(
        async () => { /* se sobreescribe después */ }
    )
    const updateAgrupadorRef = React.useRef<(rcm: RCMData) => void>(() => { /* se sobreescribe después */ })

    const crud = useRcmCrud({
        savedRcms, setSavedRcms,
        ensayosAsociados, setEnsayosAsociados,
        areas: productSearch.areas,
        todasLasFamilias: productSearch.todasLasFamilias,
        parametrosArea: productSearch.parametrosArea,
        otData,
        getFormValues: form.getFormValues,
        getTodayDateForInput: form.getTodayDateForInput,
        resetForm: form.resetForm,
        populateFormFromRcm: form.populateFormFromRcm,
        hasUnsavedChanges: form.hasUnsavedChanges,
        setShowRcmCard: form.setShowRcmCard,
        setErrorVencimiento: form.setErrorVencimiento,
        clearEnsayosPendientes: ensayoHooks.clearPendientes,
        resetSearchFilters: productSearch.resetSearchFilters,
        onAutoAgrupar: (newRcm, setError) => codigoUnoAUnoRef.current(newRcm, setError),
        onUpdateAgrupador: (rcm) => updateAgrupadorRef.current(rcm),
        isRcmLinkedToCodigoProducto,
    })

    // ═══════════════════════════════════════
    // DERIVED STATE
    // ═══════════════════════════════════════
    const [infoMessage, setInfoMessage] = useState('')
    const tarjetaLookupRequestRef = useRef(0)

    const rcmIdsAgrupados = new Set<number>()
    codigoReal.codigosAgrupadores.forEach(ag => {
        ag.rcmsVinculados.forEach(rcm => rcmIdsAgrupados.add(rcm.id))
    })
    const rcmsCreados = savedRcms.filter(rcm => !rcmIdsAgrupados.has(rcm.id)).sort((a, b) => b.id - a.id)
    const rcmsAgrupados = savedRcms.filter(rcm => rcmIdsAgrupados.has(rcm.id)).sort((a, b) => b.id - a.id)

    const selectedRcmsData = savedRcms.filter(r => codigoReal.selectedRcmIds.includes(r.id))
    const canAgrupar = selectedRcmsData.length > 0
        && selectedRcmsData.every(r => r.rcmType === selectedRcmsData[0].rcmType)
        && selectedRcmsData.every(r => r.area === selectedRcmsData[0].area)

    const dialogAreaNombre = selectedRcmsData.length > 0
        ? (selectedRcmsData[0].area || '—')
        : (productSearch.areas.find(a => a.id === form.area)?.nombre || '—')

    const selectedRcmLinkedToCodigoProducto = crud.selectedRcmId !== null
        ? isRcmLinkedToCodigoProducto(crud.selectedRcmId)
        : false

    // ═══════════════════════════════════════
    // CARD REF (for bottom panel positioning)
    // ═══════════════════════════════════════
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

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════

    // Mantener ref actualizado con el handler 1:1 más reciente
    useEffect(() => {
        codigoUnoAUnoRef.current = (rcm: RCMData, setError: (msg: string) => void) =>
            codigoReal.handleCodigoUnoAUno(rcm, setError)
        updateAgrupadorRef.current = (rcm: RCMData) =>
            codigoReal.handleUpdateAgrupadorForRcm(rcm)
    })

    useEffect(() => {
        onDraftCountChange?.(form.showRcmCard ? 1 : 0)
    }, [form.showRcmCard])

    useEffect(() => {
        onAgrupadosCountChange?.(rcmIdsAgrupados.size)
    }, [codigoReal.codigosAgrupadores])

    useEffect(() => {
        onIsSavingChange?.(crud.isSaving)
    }, [crud.isSaving])

    useEffect(() => {
        if (!showAutoCodigoProductoMessage) return

        const timeoutId = window.setTimeout(() => {
            setShowAutoCodigoProductoMessage(false)
        }, 10000)

        return () => window.clearTimeout(timeoutId)
    }, [showAutoCodigoProductoMessage])

    // Registrar la función de finalizar en el padre al montar
    useEffect(() => {
        onRegisterFinalizar?.(() => codigoReal.setShowPreFinalizacion(true))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (initialRcmType && !form.showRcmCard) {
            form.setShowRcmCard(true)
            form.setRcmType(initialRcmType)
            form.resetForm(initialRcmType)
            setEnsayosAsociados([])
            onClearInitialRcmType?.()
        }
    }, [initialRcmType])

    // Avisar si el número de tarjeta ya existe en RCMs tipo Muestra locales o persistidos.
    useEffect(() => {
        const tarjeta = form.numeroTarjeta?.trim()
        tarjetaLookupRequestRef.current += 1

        if (form.rcmType !== 'Muestra' || !tarjeta) {
            setInfoMessage('')
            return
        }

        const editingId = crud.editingRcmId
        const duplicadoLocal = savedRcms.find(rcm =>
            rcm.rcmType === 'Muestra' &&
            rcm.numeroTarjeta?.trim() === tarjeta &&
            rcm.id !== editingId
        )

        if (duplicadoLocal) {
            const esAgrupado = codigoReal.codigosAgrupadores.some(ag =>
                ag.rcmsVinculados.some(rcm => rcm.id === duplicadoLocal.id)
            )
            setInfoMessage(`El Nº de Tarjeta "${tarjeta}" ya existe en los RCMs ${esAgrupado ? 'agrupados' : 'pendientes de agrupar'}`)
            return
        }

        const requestId = tarjetaLookupRequestRef.current
        const controller = new AbortController()
        const timeoutId = window.setTimeout(async () => {
            try {
                const params = new URLSearchParams({ numero: tarjeta })
                const excludeId = crud.originalRcm?.dbId

                if (excludeId) params.set('excludeId', String(excludeId))

                const response = await fetch(`/api/rcm/tarjeta?${params.toString()}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                })

                if (!response.ok || tarjetaLookupRequestRef.current !== requestId) return

                const data = await response.json()
                const match = Array.isArray(data.matches) ? data.matches[0] : null

                if (!match) {
                    setInfoMessage('')
                    return
                }

                const rcmLabel = match.numeroRcm ? `RCM ${match.numeroRcm}` : `RCM #${match.id}`
                const obraLabel = match.obra?.nombreObra ? ` (${match.obra.nombreObra})` : ''

                setInfoMessage(`El Nº de Tarjeta "${tarjeta}" ya existe en ${rcmLabel}${obraLabel}`)
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') return
                if (tarjetaLookupRequestRef.current === requestId) setInfoMessage('')
            }
        }, 500)

        return () => {
            controller.abort()
            window.clearTimeout(timeoutId)
        }
    }, [
        form.rcmType,
        form.numeroTarjeta,
        savedRcms,
        codigoReal.codigosAgrupadores,
        crud.editingRcmId,
        crud.originalRcm?.dbId,
    ])

    useEffect(() => {
        if (form.rcmType !== 'Muestra') {
            setInfoMessage('')
        }
    }, [form.rcmType])

    useEffect(() => {
        form.autoEnableVencimiento(productSearch.areas, productSearch.todasLasFamilias)
    }, [form.area, form.tipoServicio, productSearch.areas, productSearch.todasLasFamilias, form.rcmType])

    const handleAreaChange = (nextArea: number | '') => {
        const previousArea = form.area

        if (previousArea === nextArea) return

        form.setArea(nextArea)
        form.resetDynamicFieldsOnAreaChange()

        if (previousArea !== '') {
            if (ensayosAsociados.length > 0) {
                setEnsayosAsociados([])
            }
            ensayoHooks.clearPendientes()
            productSearch.resetSearchFilters()
        }
    }

    const handleQuickDuplicate = (rcmId: number) => {
        crud.handleDuplicateInline(rcmId)
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <>
            <Card ref={cardRef}>
                <Box sx={{ p: 6, pb: codigoReal.codigosAgrupadores.length === 0 ? 'calc(12vh + 48px)' : '348px' }}>
                    {/* Title row */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                            <Box>
                                <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 1 }}>
                                    RCMs creados{' '}
                                    <Typography component='span' sx={{ color: 'text.secondary', fontWeight: 'normal' }}>
                                        {savedRcms.length} {savedRcms.length === 1 ? 'registro' : 'registros'}
                                    </Typography>
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                {!form.showRcmCard && (
                                    <Button variant='contained' color='primary' startIcon={<AddIcon />}
                                        onClick={crud.handleNewRcmClick}
                                        sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}>
                                        Nuevo RCM
                                    </Button>
                                )}
                            </Box>
                            <Menu
                                anchorEl={crud.newRcmMenuAnchor}
                                open={Boolean(crud.newRcmMenuAnchor)}
                                onClose={() => crud.setNewRcmMenuAnchor(null)}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                                slotProps={{ paper: { sx: { minWidth: crud.newRcmMenuAnchor?.offsetWidth || 'auto' } } }}
                            >
                                <MenuItem onClick={() => crud.handleSelectRcmType('Muestra')}>Muestra</MenuItem>
                                <MenuItem onClick={() => crud.handleSelectRcmType('Control')}>Control</MenuItem>
                                <MenuItem onClick={() => crud.handleSelectRcmType('Servicio')}>Servicio</MenuItem>
                            </Menu>
                        </Box>
                        {showAutoCodigoProductoMessage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mt: 1.5, width: '100%', borderRadius: '8px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 28, flexShrink: 0 }} />
                                <Typography variant='body2' sx={{ fontWeight: 600, color: '#15803D', flex: 1 }}>
                                    Código Producto creado automáticamente
                                </Typography>
                                <IconButton
                                    size='small'
                                    onClick={() => setShowAutoCodigoProductoMessage(false)}
                                    sx={{ color: '#15803D', p: 0.5, '&:hover': { bgcolor: '#DCFCE7' } }}
                                >
                                    <CloseIcon fontSize='small' />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    {/* Draft form */}
                    <RcmDraftForm
                        form={form}
                        ensayoHandlers={ensayoHooks}
                        ensayosAsociados={ensayosAsociados}
                        areas={productSearch.areas}
                        todasLasFamilias={productSearch.todasLasFamilias}
                        parametrosArea={productSearch.parametrosArea}
                        isEditingRcm={crud.isEditingRcm}
                        isDuplicatingRcm={crud.isDuplicatingRcm}
                        isSavingRcm={crud.isSavingRcm}
                        onSaveRcm={crud.handleSaveRcm}
                        onCancelEdit={crud.handleCancelEdit}
                        searchTerm={productSearch.searchTerm}
                        onSearchChange={productSearch.handleSearchChange}
                        paginatedProductos={productSearch.paginatedProductos}
                        totalProductos={productSearch.totalProductos}
                        productsPage={productSearch.productsPage}
                        onPageChange={productSearch.setProductsPage}
                        showOnlyPaquetes={productSearch.showOnlyPaquetes}
                        onShowOnlyPaquetesChange={productSearch.handleShowOnlyPaquetesChange}
                        onResetSearchFilters={productSearch.resetSearchInput}
                        onSelectProduct={ensayoHooks.handleSelectProduct}
                        onAreaChange={handleAreaChange}
                    />

                    {/* Saved RCM lists */}
                    <RcmSavedList
                        rcmsCreados={rcmsCreados}
                        rcmsAgrupados={rcmsAgrupados}
                        rcmsDisponiblesReagrupar={codigoReal.reusableRcmsDisponibles}
                        showRcmCard={form.showRcmCard}
                        selectedRcmIds={codigoReal.selectedRcmIds}
                        expandedSavedRcms={crud.expandedSavedRcms}
                        actionBarRcmId={crud.actionBarRcmId}
                        codigosAgrupadores={codigoReal.codigosAgrupadores}
                        canAgrupar={canAgrupar}
                        onToggleSavedRcm={crud.handleToggleSavedRcm}
                        onToggleRcmSelection={codigoReal.handleToggleRcmSelection}
                        onOpenRcmMenu={crud.handleOpenRcmMenu}
                        onNewRcmClick={crud.handleNewRcmClick}
                        onOpenCodigoPopup={(e, rcmIds) => codigoReal.handleOpenCodigoPopup(rcmIds)}
                        onQuickDuplicate={handleQuickDuplicate}
                        onSetActionBarRcmId={crud.setActionBarRcmId}
                        onSetSelectedRcmIds={codigoReal.setSelectedRcmIds}
                        onCodigoUnoAUno={(rcmId) => codigoReal.handleCodigoUnoAUno(rcmId, form.setErrorVencimiento)}
                        onDismissReusableRcm={codigoReal.handleDismissReusableRcm}
                        onDismissAllReusableRcms={codigoReal.handleDismissAllReusableRcms}
                        onUndoLastDismissedReusableRcms={codigoReal.handleUndoLastDismissedReusableRcms}
                        canUndoReusableDismiss={codigoReal.dismissedReusableRcmIds.length > 0}
                        isCreatingCodigo={codigoReal.isCreatingCodigo}
                    />
                </Box>
            </Card>

            {/* Bottom panel: Código Agrupadores */}
            <CodigoAgrupadorPanel
                codigosAgrupadores={codigoReal.codigosAgrupadores}
                savedRcms={savedRcms}
                cardRect={cardRect}
                isSaving={crud.isSaving}
                onFinalizarCodificacion={() => codigoReal.setShowPreFinalizacion(true)}
                onOpenAgrupadorSearch={codigoReal.handleOpenAgrupadorSearch}
                onRemoveEnsayoFromAgrupador={codigoReal.handleRemoveEnsayoFromAgrupador}
                onChangeDescripcion={codigoReal.handleChangeAgrupadorDescripcion}
                onChangeFacturacion={codigoReal.handleChangeAgrupadorFacturacion}
                onEditAgrupador={codigoReal.handleOpenEditAgrupador}
                onDeleteAgrupador={codigoReal.handleDeleteAgrupador}
            />

            {/* RCM context menu */}
            <Menu
                anchorEl={crud.rcmMenuAnchor}
                open={Boolean(crud.rcmMenuAnchor)}
                onClose={crud.handleCloseRcmMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={crud.handleEditRcm}>
                    <EditIcon fontSize='small' sx={{ mr: 1 }} /> Editar
                </MenuItem>
                <MenuItem onClick={crud.handleDuplicateRcm}>
                    <ContentCopyIcon fontSize='small' sx={{ mr: 1 }} /> Duplicar
                </MenuItem>
                <MenuItem
                    onClick={crud.handleDeleteRcm}
                    disabled={selectedRcmLinkedToCodigoProducto}
                    sx={{ color: selectedRcmLinkedToCodigoProducto ? 'text.disabled' : 'error.main' }}
                >
                    <DeleteIcon fontSize='small' sx={{ mr: 1 }} /> Eliminar
                </MenuItem>
            </Menu>

            {/* SKU search popover (for Código dialog) */}
            <ProductSearchPopover
                anchorEl={codigoReal.skuSearchAnchor}
                onClose={codigoReal.handleCloseSkuSearch}
                searchTerm={productSearch.searchTerm}
                onSearchChange={productSearch.handleSearchChange}
                paginatedProductos={productSearch.paginatedProductos}
                totalProductos={productSearch.totalProductos}
                productsPage={productSearch.productsPage}
                onPageChange={productSearch.setProductsPage}
                areaName={productSearch.areas.find(a => a.id === form.area)?.nombre}
                showOnlyPaquetes={productSearch.showOnlyPaquetes}
                onShowOnlyPaquetesChange={productSearch.handleShowOnlyPaquetesChange}
                onSelectProduct={codigoReal.handleSelectProductForSku}
                zIndex={1400}
                autoFocus
                width={codigoReal.skuSearchAnchor?.offsetWidth ? Math.max(codigoReal.skuSearchAnchor.offsetWidth, 420) : 420}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            />

            {/* Agrupador ensayo search popover */}
            <ProductSearchPopover
                anchorEl={codigoReal.agrupadorSearchAnchor}
                onClose={codigoReal.handleCloseAgrupadorSearch}
                searchTerm={productSearch.searchTerm}
                onSearchChange={productSearch.handleSearchChange}
                paginatedProductos={productSearch.paginatedProductos}
                totalProductos={productSearch.totalProductos}
                productsPage={productSearch.productsPage}
                onPageChange={productSearch.setProductsPage}
                areaName={productSearch.areas.find(a => a.id === form.area)?.nombre}
                showOnlyPaquetes={productSearch.showOnlyPaquetes}
                onShowOnlyPaquetesChange={productSearch.handleShowOnlyPaquetesChange}
                onSelectProduct={codigoReal.handleSelectProductForAgrupador}
                zIndex={1300}
            />

            {/* All dialogs & snackbars */}
            <RcmDialogs
                errorVencimiento={form.errorVencimiento}
                setErrorVencimiento={form.setErrorVencimiento}
                successMessage={crud.successMessage}
                setSuccessMessage={crud.setSuccessMessage}
                infoMessage={infoMessage}
                setInfoMessage={setInfoMessage}
                showEditWarning={crud.showEditWarning}
                setShowEditWarning={crud.setShowEditWarning}
                showConfirmNewRcm={crud.showConfirmNewRcm}
                handleConfirmNewRcm={crud.handleConfirmNewRcm}
                handleCancelNewRcm={crud.handleCancelNewRcm}
                showCancelConfirm={crud.showCancelConfirm}
                handleConfirmCancel={crud.handleConfirmCancel}
                handleDismissCancelConfirm={crud.handleDismissCancelConfirm}
                showDeleteConfirm={crud.showDeleteConfirm}
                handleConfirmDelete={crud.handleConfirmDelete}
                handleDismissDeleteConfirm={crud.handleDismissDeleteConfirm}
                showPreFinalizacion={codigoReal.showPreFinalizacion}
                setShowPreFinalizacion={codigoReal.setShowPreFinalizacion}
                computeValidaciones={codigoReal.computeValidaciones}
                handleGuardarTodo={() => crud.handleGuardarTodo(codigoReal.codigosAgrupadores)}
                isSaving={crud.isSaving}
                codigosAgrupadores={codigoReal.codigosAgrupadores}
                savedRcms={savedRcms}
                cardRect={cardRect}
            />

            {/* Código Producto creation dialog */}
            <CodigoCreationDialog
                open={codigoReal.openCodigoDialog}
                onClose={codigoReal.handleCloseCodigoPopup}
                selectedRcmIds={codigoReal.selectedRcmIds}
                savedRcms={savedRcms}
                dialogMode={codigoReal.dialogMode}
                setDialogMode={codigoReal.setDialogMode}
                codigosAgrupadores={codigoReal.codigosAgrupadores}
                selectedExistingAgrupadorId={codigoReal.selectedExistingAgrupadorId}
                setSelectedExistingAgrupadorId={codigoReal.setSelectedExistingAgrupadorId}
                dialogAreaNombre={dialogAreaNombre}
                dialogSkuSearch={codigoReal.dialogSkuSearch}
                setDialogSkuSearch={codigoReal.setDialogSkuSearch}
                dialogSkus={codigoReal.dialogSkus}
                setDialogSkus={codigoReal.setDialogSkus}
                dialogDescripcionServicio={codigoReal.dialogDescripcionServicio}
                setDialogDescripcionServicio={codigoReal.setDialogDescripcionServicio}
                dialogCantidad={codigoReal.dialogCantidad}
                setDialogCantidad={codigoReal.setDialogCantidad}
                dialogFacturacion={codigoReal.dialogFacturacion}
                setDialogFacturacion={codigoReal.setDialogFacturacion}
                onOpenSkuSearch={(e) => codigoReal.handleOpenSkuSearch(e, productSearch.setSelectedAreaId)}
                onConfirmCodigo={() => codigoReal.handleConfirmCodigo(
                    form.rcmType,
                    form.numeroTarjeta,
                    form.showRcmCard,
                    form.setErrorVencimiento,
                )}
                onAddToExisting={codigoReal.handleAddToExistingAgrupador}
                onRemoveRcmFromEditing={codigoReal.handleRemoveRcmFromEditingAgrupador}
                onSaveEditedCodigo={codigoReal.handleSaveEditedAgrupador}
                isCreatingCodigo={codigoReal.isCreatingCodigo}
                isSpecialSkuGrouping={codigoReal.isSpecialSkuGrouping}
            />
        </>
    )
}

export default Step2CreateRcms
