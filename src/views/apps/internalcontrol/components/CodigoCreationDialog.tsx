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
import type { RCMData, CodigoAgrupador } from '../types/rcm-types'

interface CodigoCreationDialogProps {
    open: boolean
    onClose: () => void
    // RCM data
    selectedRcmIds: number[]
    savedRcms: RCMData[]
    // Dialog mode
    dialogMode: 'nuevo' | 'existente'
    setDialogMode: (mode: 'nuevo' | 'existente') => void
    // Existing agrupadores
    codigosAgrupadores: CodigoAgrupador[]
    selectedExistingAgrupadorId: string
    setSelectedExistingAgrupadorId: (id: string) => void
    // New code fields
    dialogAreaNombre: string
    dialogSkuSearch: string
    setDialogSkuSearch: (val: string) => void
    dialogSkus: Array<{ sku: string; nombre: string; productoId: number }>
    setDialogSkus: React.Dispatch<React.SetStateAction<Array<{ sku: string; nombre: string; productoId: number }>>>
    dialogDescripcionServicio: string
    setDialogDescripcionServicio: (val: string) => void
    dialogCantidad: number
    setDialogCantidad: (val: number) => void
    // SKU search
    onOpenSkuSearch: (event: React.MouseEvent<HTMLElement>) => void
    // Actions
    onConfirmCodigo: () => void
    onAddToExisting: () => void
    isCreatingCodigo: boolean
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
    onOpenSkuSearch,
    onConfirmCodigo, onAddToExisting, isCreatingCodigo,
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='sm'
            fullWidth
            PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}
        >
            <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Agrupar en Código Producto
                <IconButton size='small' onClick={onClose} sx={{ color: 'text.secondary' }}>
                    <CloseIcon fontSize='small' />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2.5, pb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                    {/* Sección RCMs a agrupar */}
                    {selectedRcmIds.length > 0 && (
                        <Box sx={{ bgcolor: '#EFF6FF', border: '1px solid', borderColor: '#DBEAFE', borderRadius: '8px', p: 2 }}>
                            <Typography variant='caption' sx={{ fontWeight: 700, color: 'primary.main', display: 'block', mb: 1 }}>
                                RCMs a agrupar en este código
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                {selectedRcmIds.map((id, idx) => {
                                    const rcm = savedRcms.find(r => r.id === id)
                                    const rcmNum = rcm?.numeroRcm ? `RCM-${String(rcm.numeroRcm).padStart(3, '0')}` : `RCM-${String(idx + 1).padStart(3, '0')}`
                                    const label = rcm?.tipoServicio ? `${rcmNum} - ${rcm.tipoServicio}` : rcmNum
                                    return (
                                        <Chip
                                            key={id}
                                            label={label}
                                            size='small'
                                            sx={{ bgcolor: 'white', border: '1px solid', borderColor: '#BFDBFE', color: 'text.primary', fontWeight: 500, fontSize: '0.78rem' }}
                                        />
                                    )
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* Selector de modo */}
                    <Box sx={{ display: 'flex', bgcolor: '#F3F4F6', borderRadius: '8px', p: 0.5, gap: 0.5 }}>
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
                    </Box>

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

                    {/* MODO: Crear nuevo código */}
                    {dialogMode === 'nuevo' && (
                        <>
                            {/* Área + SKU Producto */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                        Área (heredado automáticamente)
                                    </Typography>
                                    <TextField fullWidth size='small' value={dialogAreaNombre} disabled InputProps={{ readOnly: true }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
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
                            </Box>

                            {/* Lista de SKUs agregados */}
                            {dialogSkus.length > 0 && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    {dialogSkus.map((item, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75,
                                                borderRadius: '6px', border: '1px solid', borderColor: 'divider', bgcolor: '#F8FAFC'
                                            }}
                                        >
                                            <InventoryIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                                            <Typography variant='body2' sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'primary.main', flexShrink: 0 }}>
                                                {item.sku}
                                            </Typography>
                                            {item.nombre !== item.sku && (
                                                <Typography variant='body2' color='text.secondary' noWrap sx={{ flex: 1 }}>
                                                    {item.nombre}
                                                </Typography>
                                            )}
                                            <IconButton
                                                size='small'
                                                onClick={() => setDialogSkus(prev => prev.filter((_, i) => i !== idx))}
                                                sx={{ ml: 'auto', p: 0.25, flexShrink: 0 }}
                                            >
                                                <CloseIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* Descripción del Servicio */}
                            <Box>
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

                            {/* Cantidad + Modo de Facturación */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                        Cantidad (unidades a facturar)
                                    </Typography>
                                    <TextField
                                        fullWidth size='small' type='number'
                                        value={dialogCantidad}
                                        onChange={(e) => setDialogCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                        inputProps={{ min: 1 }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.75 }}>
                                        Modo de Facturación
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', gap: 1, height: 40, px: 1.5, borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: (dialogSkus.length > 0 || dialogSkuSearch.trim()) ? '#FDE68A' : 'divider',
                                        bgcolor: (dialogSkus.length > 0 || dialogSkuSearch.trim()) ? '#FEF3C7' : '#F9FAFB',
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <Box sx={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            bgcolor: (dialogSkus.length > 0 || dialogSkuSearch.trim()) ? '#D97706' : 'primary.main',
                                            flexShrink: 0, transition: 'background-color 0.2s ease'
                                        }} />
                                        <Typography variant='body2' sx={{
                                            fontWeight: 600,
                                            color: (dialogSkus.length > 0 || dialogSkuSearch.trim()) ? '#D97706' : 'primary.main',
                                            fontSize: '0.8rem', transition: 'color 0.2s ease'
                                        }}>
                                            {(dialogSkus.length > 0 || dialogSkuSearch.trim())
                                                ? 'Fijo — SKU \u00d7 Cantidad'
                                                : 'Unitario — P\u00d7Q por ensayos'
                                            }
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Nota informativa */}
                            <Box sx={{ bgcolor: '#FFFDE7', border: '1px solid #FFF176', borderRadius: '8px', p: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
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
                <Button variant='outlined' onClick={onClose} sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, px: 3 }}>
                    Cancelar
                </Button>
                <Button
                    variant='contained'
                    startIcon={<CheckCircleIcon />}
                    disabled={(dialogMode === 'existente' && !selectedExistingAgrupadorId) || isCreatingCodigo}
                    onClick={dialogMode === 'existente' ? onAddToExisting : onConfirmCodigo}
                    sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700, px: 3, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                    {dialogMode === 'existente' ? '✓ Agregar al código' : isCreatingCodigo ? 'Generando código...' : '✓ Crear Código Producto'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default CodigoCreationDialog
