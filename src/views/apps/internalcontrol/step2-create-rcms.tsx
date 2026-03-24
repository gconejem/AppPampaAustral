import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    Box,
    Typography,
    Button,
    Card,
    Menu,
    MenuItem,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

// Types
import type { Step2CreateRcmsProps } from './types/rcm-types'

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
}: Step2CreateRcmsProps) => {

    // ═══════════════════════════════════════
    // HOOKS
    // ═══════════════════════════════════════
    const form = useRcmForm({ otData })
    const ensayoHooks = useEnsayos({ ensayosAsociados, setEnsayosAsociados })

    // Main search popover anchor (managed here since it bridges form & productSearch)
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

    // Lifted anchor states to break circular dependency between useCodigoAgrupador & useProductSearch
    const [agrupadorSearchAnchor, setAgrupadorSearchAnchor] = useState<HTMLElement | null>(null)
    const [skuSearchAnchor, setSkuSearchAnchor] = useState<HTMLElement | null>(null)

    const productSearch = useProductSearch({
        area: form.area,
        anchorEl,
        agrupadorSearchAnchor,
        skuSearchAnchor,
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
    })

    const crud = useRcmCrud({
        savedRcms, setSavedRcms,
        ensayosAsociados, setEnsayosAsociados,
        areas: productSearch.areas,
        todasLasFamilias: productSearch.todasLasFamilias,
        otData,
        getFormValues: form.getFormValues,
        getTodayDateForInput: form.getTodayDateForInput,
        resetForm: form.resetForm,
        populateFormFromRcm: form.populateFormFromRcm,
        hasUnsavedChanges: form.hasUnsavedChanges,
        setShowRcmCard: form.setShowRcmCard,
        setErrorVencimiento: form.setErrorVencimiento,
        clearEnsayosPendientes: ensayoHooks.clearPendientes,
    })

    // ═══════════════════════════════════════
    // DERIVED STATE
    // ═══════════════════════════════════════
    const rcmIdsAgrupados = new Set<number>()
    codigoReal.codigosAgrupadores.forEach(ag => {
        ag.rcmsVinculados.forEach(rcm => rcmIdsAgrupados.add(rcm.id))
    })
    const rcmsCreados = savedRcms.filter(rcm => !rcmIdsAgrupados.has(rcm.id))
    const rcmsAgrupados = savedRcms.filter(rcm => rcmIdsAgrupados.has(rcm.id))

    const selectedRcmsData = savedRcms.filter(r => codigoReal.selectedRcmIds.includes(r.id))
    const canAgrupar = selectedRcmsData.length > 0
        && selectedRcmsData.every(r => r.rcmType === selectedRcmsData[0].rcmType)
        && selectedRcmsData.every(r => r.area === selectedRcmsData[0].area)

    const dialogAreaNombre = selectedRcmsData.length > 0
        ? (selectedRcmsData[0].area || '—')
        : (productSearch.areas.find(a => a.id === form.area)?.nombre || '—')

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
    useEffect(() => {
        onDraftCountChange?.(form.showRcmCard ? 1 : 0)
    }, [form.showRcmCard])

    useEffect(() => {
        onAgrupadosCountChange?.(rcmIdsAgrupados.size)
    }, [codigoReal.codigosAgrupadores])

    useEffect(() => {
        if (initialRcmType && !form.showRcmCard) {
            form.setShowRcmCard(true)
            form.setRcmType(initialRcmType)
            form.resetForm(initialRcmType)
            setEnsayosAsociados([])
            onClearInitialRcmType?.()
        }
    }, [initialRcmType])

    useEffect(() => {
        form.autoEnableVencimiento(productSearch.areas)
    }, [form.area, productSearch.areas])

    // ═══════════════════════════════════════
    // SEARCH POPOVER HANDLERS
    // ═══════════════════════════════════════
    const handleOpenSearchPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
        if (form.area && productSearch.areas.length > 0) {
            productSearch.setSelectedAreaId(form.area as number)
        }
    }

    const handleCloseSearchPopover = () => {
        setAnchorEl(null)
        productSearch.setSearchTerm('')
        productSearch.setProductsPage(0)
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
                <Box sx={{ p: 6 }}>
                    {/* Title row */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
                        <Box>
                            <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 1 }}>
                                RCMs creados{' '}
                                <Typography component='span' sx={{ color: 'text.secondary', fontWeight: 'normal' }}>
                                    {savedRcms.length} {savedRcms.length === 1 ? 'registro' : 'registros'}
                                </Typography>
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {!form.showRcmCard && (
                                <Button variant='contained' color='primary' startIcon={<AddIcon />}
                                    onClick={crud.handleNewRcmClick}
                                    sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}>
                                    Nuevo RCM
                                </Button>
                            )}
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
                    </Box>

                    {/* Draft form */}
                    <RcmDraftForm
                        form={form}
                        ensayoHandlers={ensayoHooks}
                        ensayosAsociados={ensayosAsociados}
                        areas={productSearch.areas}
                        todasLasFamilias={productSearch.todasLasFamilias}
                        isEditingRcm={crud.isEditingRcm}
                        isSavingRcm={crud.isSavingRcm}
                        onOpenSearchPopover={handleOpenSearchPopover}
                        onSaveRcm={crud.handleSaveRcm}
                        onCancelEdit={crud.handleCancelEdit}
                    />

                    {/* Saved RCM lists */}
                    <RcmSavedList
                        rcmsCreados={rcmsCreados}
                        rcmsAgrupados={rcmsAgrupados}
                        showRcmCard={form.showRcmCard}
                        selectedRcmIds={codigoReal.selectedRcmIds}
                        expandedSavedRcms={crud.expandedSavedRcms}
                        actionBarRcmId={crud.actionBarRcmId}
                        codigosAgrupadores={codigoReal.codigosAgrupadores}
                        canAgrupar={canAgrupar}
                        savedRcms={savedRcms}
                        onToggleSavedRcm={crud.handleToggleSavedRcm}
                        onToggleRcmSelection={codigoReal.handleToggleRcmSelection}
                        onOpenRcmMenu={crud.handleOpenRcmMenu}
                        onNewRcmClick={crud.handleNewRcmClick}
                        onOpenCodigoPopup={codigoReal.handleOpenCodigoPopup}
                        onQuickDuplicate={handleQuickDuplicate}
                        onSetActionBarRcmId={crud.setActionBarRcmId}
                        onSetSelectedRcmIds={codigoReal.setSelectedRcmIds}
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
                onChangeCantidad={codigoReal.handleChangeAgrupadorCantidad}
                onChangeFacturacion={codigoReal.handleChangeAgrupadorFacturacion}
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
                <MenuItem onClick={crud.handleDeleteRcm} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize='small' sx={{ mr: 1 }} /> Eliminar
                </MenuItem>
            </Menu>

            {/* Main ensayo search popover */}
            <ProductSearchPopover
                anchorEl={anchorEl}
                onClose={handleCloseSearchPopover}
                searchTerm={productSearch.searchTerm}
                onSearchChange={productSearch.handleSearchChange}
                paginatedProductos={productSearch.paginatedProductos}
                totalProductos={productSearch.totalProductos}
                productsPage={productSearch.productsPage}
                onPageChange={productSearch.setProductsPage}
                areaName={productSearch.areas.find(a => a.id === form.area)?.nombre}
                showOnlyPaquetes={productSearch.showOnlyPaquetes}
                onShowOnlyPaquetesChange={productSearch.handleShowOnlyPaquetesChange}
                onSelectProduct={async (producto) => {
                    await ensayoHooks.handleSelectProduct(producto)
                    handleCloseSearchPopover()
                }}
                zIndex={1300}
            />

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
                showEditWarning={crud.showEditWarning}
                setShowEditWarning={crud.setShowEditWarning}
                showConfirmNewRcm={crud.showConfirmNewRcm}
                handleConfirmNewRcm={crud.handleConfirmNewRcm}
                handleCancelNewRcm={crud.handleCancelNewRcm}
                showCancelConfirm={crud.showCancelConfirm}
                handleConfirmCancel={crud.handleConfirmCancel}
                handleDismissCancelConfirm={crud.handleDismissCancelConfirm}
                showPreFinalizacion={codigoReal.showPreFinalizacion}
                setShowPreFinalizacion={codigoReal.setShowPreFinalizacion}
                computeValidaciones={codigoReal.computeValidaciones}
                handleGuardarTodo={() => crud.handleGuardarTodo(codigoReal.codigosAgrupadores)}
                isSaving={crud.isSaving}
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
                onOpenSkuSearch={(e) => codigoReal.handleOpenSkuSearch(e, productSearch.setSelectedAreaId)}
                onConfirmCodigo={() => codigoReal.handleConfirmCodigo(
                    form.rcmType,
                    form.numeroTarjeta,
                    form.showRcmCard,
                    form.setErrorVencimiento,
                )}
                onAddToExisting={codigoReal.handleAddToExistingAgrupador}
                isCreatingCodigo={codigoReal.isCreatingCodigo}
            />
        </>
    )
}

export default Step2CreateRcms
