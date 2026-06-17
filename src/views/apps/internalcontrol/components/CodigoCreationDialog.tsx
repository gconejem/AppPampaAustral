import React from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Box,
    Typography,
    Chip,
    Divider,
    TextField,
    InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import InventoryIcon from '@mui/icons-material/Inventory'
import { formatDateOnly } from '@/utils/dateUtils'
import type { RCMData, CodigoAgrupador } from '../types/rcm-types'

interface CodigoCreationDialogProps {
    open: boolean
    onClose: () => void
    // RCM data
    selectedRcmIds: number[]
    savedRcms: RCMData[]
    // Dialog mode
    dialogMode: 'nuevo' | 'existente' | 'editar'
    setDialogMode: (mode: 'nuevo' | 'existente' | 'editar') => void
    // Existing agrupadores
    codigosAgrupadores: CodigoAgrupador[]
    selectedExistingAgrupadorId: string
    setSelectedExistingAgrupadorId: (id: string) => void
    // New code fields
    dialogAreaNombre: string
    dialogSkuSearch: string
    setDialogSkuSearch: (val: string) => void
    dialogSkus: Array<{ sku: string; nombre: string; productoId: number; cantidad: number }>
    setDialogSkus: React.Dispatch<React.SetStateAction<Array<{ sku: string; nombre: string; productoId: number; cantidad: number }>>>
    dialogDescripcionServicio: string
    setDialogDescripcionServicio: (val: string) => void
    dialogCantidad: number
    setDialogCantidad: (val: number) => void
    dialogFacturacion: 'Unitario' | 'Fijo'
    setDialogFacturacion: (val: 'Unitario' | 'Fijo') => void
    // SKU search
    onOpenSkuSearch: (event: React.MouseEvent<HTMLElement>) => void
    // Actions
    onConfirmCodigo: () => void
    onAddToExisting: () => void
    onRemoveRcmFromEditing: (rcmId: number) => void
    onSaveEditedCodigo: () => void
    isCreatingCodigo: boolean
}

const getRcmTypeShortLabel = (rcmType?: string) => {
    if (rcmType === 'Control') return 'CTR'
    if (rcmType === 'Servicio') return 'SRV'

    return 'MUE'
}

const getRcmTypeColor = (rcmType?: string) => {
    if (rcmType === 'Control') return '#FF0096'
    if (rcmType === 'Servicio') return '#3b3b3b'

    return 'primary.main'
}

const getCantidadRcm = (rcm?: RCMData) => {
    if (!rcm) return ''
    if (rcm.cantidadMuestras) return rcm.cantidadMuestras

    const totalEnsayos = rcm.ensayos.reduce((sum, ensayo) => sum + (ensayo.cantidad || 0), 0)

    return totalEnsayos > 0 ? String(totalEnsayos) : ''
}

const getSelectedRcmSummary = (rcm?: RCMData) => {
    if (!rcm) return ['RCM no encontrado']

    if (rcm.rcmType === 'Muestra') {
        return [
            `T:${rcm.numeroTarjeta || '-'}`,
            rcm.area,
            rcm.tipoServicio,
            rcm.tipoMaterial || '-',
            rcm.item || '-',
            `#${rcm.tomaMuestra || '-'}`
        ].filter(Boolean)
    }

    const cantidadRcm = getCantidadRcm(rcm)

    return [
        rcm.area,
        rcm.tipoServicio,
        rcm.fechaServicio ? formatDateOnly(rcm.fechaServicio) : '',
        rcm.numeroTarjeta ? `T:${rcm.numeroTarjeta}` : '',
        rcm.ensayos[0]?.nombre,
        rcm.sede,
        rcm.rcmType === 'Control' ? rcm.item : '',
        cantidadRcm ? `×${cantidadRcm}` : ''
    ].filter(Boolean)
}

const CodigoCreationDialog: React.FC<CodigoCreationDialogProps> = ({
    open, onClose,
    selectedRcmIds, savedRcms,
    dialogMode, setDialogMode,
    codigosAgrupadores, selectedExistingAgrupadorId, setSelectedExistingAgrupadorId,
    dialogAreaNombre,
    dialogSkuSearch, setDialogSkuSearch,
    dialogSkus, setDialogSkus,
    dialogDescripcionServicio, setDialogDescripcionServicio,
    dialogCantidad, setDialogCantidad,
    dialogFacturacion, setDialogFacturacion,
    onOpenSkuSearch,
    onConfirmCodigo, onAddToExisting, onRemoveRcmFromEditing, onSaveEditedCodigo, isCreatingCodigo,
}) => {
    const isEditMode = dialogMode === 'editar'

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='sm'
            fullWidth
            PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden', maxWidth: '725px' } }}
        >
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {isEditMode ? 'Editar Código Producto' : 'Agrupar en Código Producto'}
                <IconButton size='small' onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon fontSize='small' />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2.5, pb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                    {/* Sección RCMs a agrupar */}
                    {(selectedRcmIds.length > 0 || isEditMode) && (
                        <Box sx={{ bgcolor: '#EFF6FF', border: '1px solid', borderColor: '#DBEAFE', borderRadius: '8px', p: 2 }}>
                            <Typography variant='caption' sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 1 }}>
                                {isEditMode ? 'RCMs vinculados a este código' : 'RCMs a agrupar en este código'}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {selectedRcmIds.length === 0 ? (
                                    <Typography variant='body2' color='error' sx={{ fontWeight: 600 }}>
                                        Debe quedar al menos un RCM vinculado para guardar.
                                    </Typography>
                                ) : selectedRcmIds.map((id, idx) => {
                                    const rcm = savedRcms.find(r => r.id === id)
                                    const rcmNum = rcm?.numeroRcm ? `RCM-${String(rcm.numeroRcm).padStart(3, '0')}` : `RCM-${String(idx + 1).padStart(3, '0')}`
                                    const summaryParts = getSelectedRcmSummary(rcm)
                                    return (
                                        <Box
                                            key={id}
                                            sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'white', border: '1px solid', borderColor: '#BFDBFE', borderRadius: '6px', px: 1, py: 0.5 }}
                                        >
                                            <Chip
                                                label={getRcmTypeShortLabel(rcm?.rcmType)}
                                                size='small'
                                                sx={{ bgcolor: getRcmTypeColor(rcm?.rcmType), color: 'white', fontWeight: 700, fontSize: '0.7rem', height: 24, '& .MuiChip-label': { px: 2 } }}
                                            />
                                            <Typography
                                                variant='body2'
                                                noWrap
                                                sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.82rem', flexShrink: 0 }}
                                            >
                                                {rcmNum}
                                            </Typography>
                                            <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.78rem', minWidth: 0, flex: 1 }} noWrap>
                                                {summaryParts.join(' | ')}
                                            </Typography>
                                            {isEditMode && (
                                                <IconButton
                                                    size='small'
                                                    onClick={() => onRemoveRcmFromEditing(id)}
                                                    disableRipple
                                                    sx={{ width: 28, height: 28, ml: 'auto', color: '#EF4444', '&:hover': { bgcolor: 'transparent' } }}
                                                >
                                                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1, color: '#EF4444' }}>×</Typography>
                                                </IconButton>
                                            )}
                                        </Box>
                                    )
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* Selector de modo */}
                    {!isEditMode && <Box sx={{ display: 'flex', bgcolor: '#F3F4F6', borderRadius: '8px', p: 0.5, gap: 0.5 }}>
                        <Button
                            fullWidth size='small'
                            variant={dialogMode === 'nuevo' ? 'contained' : 'text'}
                            onClick={() => setDialogMode('nuevo')}
                            sx={{
                                textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.82rem',
                                ...(dialogMode === 'nuevo'
                                    ? { bgcolor: 'white', color: 'primary.main', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'white' } }
                                    : { color: 'text.secondary', '&:hover': { bgcolor: 'transparent', color: 'text.primary' } })
                            }}
                        >
                            + Crear nuevo código
                        </Button>
                        <Button
                            fullWidth size='small'
                            variant={dialogMode === 'existente' ? 'contained' : 'text'}
                            onClick={() => {
                                setDialogMode('existente')
                                if (!selectedExistingAgrupadorId && codigosAgrupadores.length > 0) {
                                    setSelectedExistingAgrupadorId(codigosAgrupadores[0].id)
                                }
                            }}
                            sx={{
                                textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.82rem',
                                ...(dialogMode === 'existente'
                                    ? { bgcolor: 'white', color: 'primary.main', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'white' } }
                                    : { color: 'text.secondary', '&:hover': { bgcolor: 'transparent', color: 'text.primary' } })
                            }}
                        >
                            Añadir a código existente
                        </Button>
                    </Box>}

                    {/* MODO: Añadir a existente - vacío */}
                    {dialogMode === 'existente' && codigosAgrupadores.length === 0 && (
                        <Box sx={{ p: 2.5, borderRadius: '8px', border: '1px dashed', borderColor: 'divider', bgcolor: '#FAFAFA', textAlign: 'center' }}>
                            <Typography variant='body2' color='text.secondary'>
                                No hay códigos producto creados aún. Usa <strong>+ Crear nuevo código</strong> para crear el primero.
                            </Typography>
                        </Box>
                    )}

                    {/* MODO: Añadir a existente - lista */}
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
                                            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px',
                                            border: '1.5px solid', borderColor: selectedExistingAgrupadorId === ag.id ? 'primary.main' : '#E5E7EB',
                                            bgcolor: selectedExistingAgrupadorId === ag.id ? '#EFF6FF' : 'white',
                                            cursor: 'pointer', transition: 'all 0.15s ease',
                                            '&:hover': { borderColor: 'primary.light', bgcolor: '#F8FAFF' }
                                        }}
                                    >
                                        <Box sx={{
                                            width: 18, height: 18, borderRadius: '50%', border: '2px solid',
                                            borderColor: selectedExistingAgrupadorId === ag.id ? 'primary.main' : '#9CA3AF',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            {selectedExistingAgrupadorId === ag.id && (
                                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                            )}
                                        </Box>
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
                                                    <Chip label={ag.facturacion} size='small' sx={{ height: 18, fontSize: '0.68rem', fontWeight: 600 }} />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* MODO: Crear nuevo código / editar código */}
                    {(dialogMode === 'nuevo' || isEditMode) && (
                        <>
                            {/* Área + Descripción del Servicio */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                        Área (heredado automáticamente)
                                    </Typography>
                                    <TextField fullWidth size='small' value={dialogAreaNombre} disabled InputProps={{ readOnly: true }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                        Descripción del Servicio
                                    </Typography>
                                    <TextField
                                        fullWidth size='small'
                                        placeholder='Ej: Dosificación G20 — 3 áridos'
                                        value={dialogDescripcionServicio}
                                        onChange={(e) => setDialogDescripcionServicio(e.target.value)}
                                    />
                                </Box>
                            </Box>

                            {isEditMode && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                            Cantidad
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
                                            Facturación
                                        </Typography>
                                        <Box sx={{ display: 'flex', bgcolor: '#F3F4F6', borderRadius: '8px', p: 0.5, gap: 0.5 }}>
                                            {(['Unitario', 'Fijo'] as const).map(option => (
                                                <Button
                                                    key={option}
                                                    fullWidth
                                                    size='small'
                                                    variant={dialogFacturacion === option ? 'contained' : 'text'}
                                                    onClick={() => setDialogFacturacion(option)}
                                                    sx={{
                                                        textTransform: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '0.82rem',
                                                        ...(dialogFacturacion === option
                                                            ? { bgcolor: 'white', color: 'primary.main', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', '&:hover': { bgcolor: 'white' } }
                                                            : { color: 'text.secondary', '&:hover': { bgcolor: 'transparent', color: 'text.primary' } })
                                                    }}
                                                >
                                                    {option}
                                                </Button>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            )}

                            {/* Lista de SKUs agregados - Tabla */}
                            {(!isEditMode || dialogFacturacion === 'Fijo') && dialogSkus.length > 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                    {/* Encabezado */}
                                    <Box sx={{ display: 'flex', gap: 1, px: 1, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', width: 70 }}>SKU</Typography>
                                        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', flex: 1 }}>Nombre producto</Typography>
                                        <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', width: 80, textAlign: 'center' }}>Cantidad</Typography>
                                        <Box sx={{ width: 32 }} />
                                    </Box>
                                    {/* Filas */}
                                    {dialogSkus.map((item, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5,
                                                bgcolor: '#F8FAFC'
                                            }}
                                        >
                                            <Chip
                                                label={item.sku}
                                                size='small'
                                                sx={{
                                                    width: 70, justifyContent: 'center',
                                                    bgcolor: '#EEF2FF', color: 'primary.main', fontWeight: 700,
                                                    fontFamily: 'monospace', fontSize: '0.75rem', height: 24,
                                                    '& .MuiChip-label': { px: 1 }
                                                }}
                                            />
                                            <Typography variant='body2' color='text.secondary' noWrap sx={{ flex: 1, fontSize: '0.85rem' }}>
                                                {item.nombre}
                                            </Typography>
                                            <TextField
                                                type='number'
                                                size='small'
                                                value={item.cantidad}
                                                onChange={(e) => {
                                                    const newCantidad = Math.max(1, parseInt(e.target.value) || 1)
                                                    setDialogSkus(prev => prev.map((s, i) => i === idx ? { ...s, cantidad: newCantidad } : s))
                                                }}
                                                inputProps={{ min: 1, style: { textAlign: 'center', padding: '4px 8px' } }}
                                                sx={{ width: 80, '& .MuiOutlinedInput-root': { height: 28 } }}
                                            />
                                            <IconButton
                                                size='small'
                                                onClick={() => {
                                                    const nextSkus = dialogSkus.filter((_, i) => i !== idx)
                                                    setDialogSkus(nextSkus)
                                                    if (isEditMode && nextSkus.length === 0) setDialogFacturacion('Unitario')
                                                }}
                                                disableRipple
                                                sx={{ width: 32, height: 32, color: '#EF4444', p: 0.25, '&:hover': { bgcolor: 'transparent' } }}
                                            >
                                                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1, color: '#EF4444' }}>×</Typography>
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* Buscador SKU Producto */}
                            <Box>
                                <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                    SKU Producto (opcional)
                                </Typography>
                                <TextField
                                    fullWidth size='small'
                                    placeholder='Buscar SKU...'
                                    value={dialogSkuSearch}
                                    onChange={(e) => setDialogSkuSearch(e.target.value)}
                                    onClick={onOpenSkuSearch}
                                    inputProps={{ readOnly: true, style: { cursor: 'pointer' } }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position='start'><SearchIcon fontSize='small' sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                        endAdornment: dialogSkuSearch ? (
                                            <InputAdornment position='end'>
                                                <IconButton size='small' onClick={(e) => { e.stopPropagation(); setDialogSkuSearch('') }} sx={{ p: 0.25 }}>
                                                    <CloseIcon fontSize='small' />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : undefined
                                    }}
                                />
                            </Box>

                            {/* Mensaje informativo según modo */}
                            {(isEditMode ? dialogFacturacion === 'Fijo' : dialogSkus.length > 0) ? (
                                <Box sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', p: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Chip
                                            label='Modo Fijo'
                                            size='small'
                                            sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700, fontSize: '0.72rem', height: 24, '& .MuiChip-label': { px: 2.25 } }}
                                        />
                                        <Typography variant='body2' sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.85rem' }}>
                                            Cobro por SKU × Cantidad
                                        </Typography>
                                    </Box>
                                    <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block' }}>
                                        La minuta usará el precio unitario de cada SKU aquí definido, multiplicado por su cantidad. No se desglosan los ensayos del RCM.
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', p: 1.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        <Chip
                                            label='Modo P×Q'
                                            size='small'
                                            sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700, fontSize: '0.72rem', height: 24, '& .MuiChip-label': { px: 2.25 } }}
                                        />
                                        <Typography variant='body2' sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.85rem' }}>
                                            Cobro por detalle de ensayos en cada RCM
                                        </Typography>
                                    </Box>
                                    <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block' }}>
                                        La minuta sumará cada ensayo/servicio declarado en los RCMs vinculados, por su precio unitario y cantidad. Se activa automáticamente si no se define ningún SKU.
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button variant='outlined' onClick={onClose} sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, px: 3 }}>
                    Cancelar
                </Button>
                <Button
                    variant='contained'
                    startIcon={<CheckCircleIcon />}
                    disabled={(dialogMode === 'existente' && !selectedExistingAgrupadorId) || (isEditMode && selectedRcmIds.length === 0) || isCreatingCodigo}
                    onClick={dialogMode === 'existente' ? onAddToExisting : isEditMode ? onSaveEditedCodigo : onConfirmCodigo}
                    sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700, px: 3, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                    {dialogMode === 'existente' ? '✓ Agregar al código' : isEditMode ? 'Guardar cambios' : isCreatingCodigo ? 'Generando código...' : '✓ Crear Código Producto'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default CodigoCreationDialog
