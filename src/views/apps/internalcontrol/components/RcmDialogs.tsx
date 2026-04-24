import React from 'react'
import {
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    IconButton,
    Box,
    Typography,
    Chip,
    Divider,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import type { RCMData, CodigoAgrupador } from '../types/rcm-types'

interface RcmDialogsProps {
    // Error snackbar
    errorVencimiento: string
    setErrorVencimiento: (msg: string) => void
    // Success snackbar
    successMessage: string
    setSuccessMessage: (msg: string) => void
    // Info snackbar
    infoMessage: string
    setInfoMessage: (msg: string) => void
    // Edit warning snackbar
    showEditWarning: boolean
    setShowEditWarning: (show: boolean) => void
    // Confirm new RCM dialog
    showConfirmNewRcm: boolean
    handleConfirmNewRcm: () => void
    handleCancelNewRcm: () => void
    // Cancel confirm dialog
    showCancelConfirm: boolean
    handleConfirmCancel: () => void
    handleDismissCancelConfirm: () => void
    // Delete confirm dialog
    showDeleteConfirm: boolean
    handleConfirmDelete: () => void
    handleDismissDeleteConfirm: () => void
    // Pre-finalization dialog
    showPreFinalizacion: boolean
    setShowPreFinalizacion: (show: boolean) => void
    computeValidaciones: () => {
        v1: boolean; v2: boolean; v3: boolean; v4: boolean; v5: boolean
        totalRcms: number; tipoControl: number; tipoMuestra: number; tipoServicio: number
        codigosProducto: number; modoPxQ: number; modoFijo: number
    }
    handleGuardarTodo: () => Promise<void>
    isSaving: boolean
    codigosAgrupadores: CodigoAgrupador[]
    savedRcms: RCMData[]
}

const RcmDialogs: React.FC<RcmDialogsProps> = ({
    errorVencimiento, setErrorVencimiento,
    successMessage, setSuccessMessage,
    infoMessage, setInfoMessage,
    showEditWarning, setShowEditWarning,
    showConfirmNewRcm, handleConfirmNewRcm, handleCancelNewRcm,
    showCancelConfirm, handleConfirmCancel, handleDismissCancelConfirm,
    showDeleteConfirm, handleConfirmDelete, handleDismissDeleteConfirm,
    showPreFinalizacion, setShowPreFinalizacion,
    computeValidaciones, handleGuardarTodo, isSaving,
    codigosAgrupadores, savedRcms,
}) => {
    return (
        <>
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

            {/* Snackbar de éxito al guardar */}
            <Snackbar
                open={Boolean(successMessage)}
                autoHideDuration={5000}
                onClose={() => setSuccessMessage('')}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSuccessMessage('')}
                    severity='success'
                    variant='filled'
                    sx={{ width: '100%' }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* Snackbar informativo para tarjeta duplicada */}
            <Snackbar
                open={Boolean(infoMessage)}
                autoHideDuration={5000}
                onClose={() => setInfoMessage('')}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setInfoMessage('')}
                    severity='info'
                    variant='filled'
                    sx={{ width: '100%' }}
                >
                    {infoMessage}
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
                    sx: { borderRadius: '12px', overflow: 'hidden' }
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

            {/* Dialog de confirmación para eliminar RCM */}
            <Dialog
                open={showDeleteConfirm}
                onClose={handleDismissDeleteConfirm}
                maxWidth='sm'
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '12px', overflow: 'hidden' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon sx={{ color: '#D32F2F', fontSize: 28 }} />
                    ¿Eliminar RCM?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Este RCM se eliminará permanentemente. ¿Deseas continuar?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleDismissDeleteConfirm}
                        variant='outlined'
                        sx={{ textTransform: 'none' }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        variant='contained'
                        color='error'
                        sx={{ textTransform: 'none' }}
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: Revisar y Finalizar Codificación */}
            {showPreFinalizacion && (() => {
                const val = computeValidaciones()
                const allPassed = val.v1 && val.v2 && val.v3 && val.v4 && val.v5
                const failedValidaciones = [
                    !val.v1 && 'Hay RCMs sin código producto asignado',
                    !val.v2 && 'Submuestras con cantidades inconsistentes',
                    !val.v3 && 'Códigos agrupadores sin RCMs vinculados',
                    !val.v4 && 'Códigos con RCMs de distintas áreas',
                    !val.v5 && 'Hay RCMs sin ensayos registrados',
                ].filter(Boolean) as string[]
                return (
                    <Dialog
                        open={showPreFinalizacion}
                        onClose={() => setShowPreFinalizacion(false)}
                        maxWidth='md'
                        fullWidth
                        PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}
                    >
                        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            Revisar y Finalizar Codificación
                            <IconButton size='small' onClick={() => setShowPreFinalizacion(false)} sx={{ color: 'text.secondary' }}>
                                <CloseIcon fontSize='small' />
                            </IconButton>
                        </DialogTitle>
                        <Divider />
                        <DialogContent sx={{ pt: 2, pb: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Banner de estado */}
                                {allPassed ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                        <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 28 }} />
                                        <Typography variant='body2' sx={{ fontWeight: 600, color: '#15803D' }}>
                                            Todo en orden — listo para finalizar
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                                            <WarningAmberIcon sx={{ color: '#DC2626', fontSize: 28 }} />
                                            <Typography variant='body2' sx={{ fontWeight: 600, color: '#991B1B' }}>
                                                Hay problemas que deben corregirse
                                            </Typography>
                                        </Box>
                                        <Box sx={{ pl: 5.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                            {failedValidaciones.map((msg, i) => (
                                                <Typography key={i} variant='caption' sx={{ color: '#B91C1C' }}>• {msg}</Typography>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                                {/* Encabezado resumen */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                    <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                        Resumen de Codificación — {val.codigosProducto} Código{val.codigosProducto !== 1 ? 's' : ''} Producto
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            label='~ IDs temporales'
                                            size='small'
                                            sx={{ bgcolor: '#FB923C', color: 'white', fontWeight: 700, fontSize: '0.72rem', height: 24, '& .MuiChip-label': { px: 1.5 } }}
                                        />
                                        <Typography variant='caption' color='text.secondary'>
                                            IDs definitivos asignados al confirmar
                                        </Typography>
                                    </Box>
                                </Box>
                                {/* Tabla de códigos producto */}
                                <Box sx={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                                    {/* Header */}
                                    <Box sx={{
                                        display: 'grid', gridTemplateColumns: '110px 120px 160px 1fr 200px',
                                        bgcolor: 'primary.main', borderBottom: '1px solid #E5E7EB',
                                    }}>
                                        {['Código', 'Área · Tipo', 'SKU(s) × Cant.', 'Descripción', 'RCMs'].map(h => (
                                            <Typography key={h} variant='caption' sx={{ fontWeight: 700, color: 'white', px: 1.5, py: 1, fontSize: '0.72rem' }}>
                                                {h}
                                            </Typography>
                                        ))}
                                    </Box>
                                    {/* Filas */}
                                    {codigosAgrupadores.map((ag, agIdx) => {
                                        const firstRcm = savedRcms.find(r => ag.rcmsVinculados.some(rv => rv.id === r.id))
                                        const areaName = firstRcm?.area || '—'
                                        const tipoName = firstRcm?.tipoServicio || ''
                                        const rcmCodes = ag.rcmsVinculados.map(rv => {
                                            const rcm = savedRcms.find(r => r.id === rv.id)
                                            return {
                                                code: rv.temporaryCode || (rv.numeroRcm ? `RCM-${String(rv.numeroRcm).padStart(3, '0')}` : `RCM-${String(rv.id).padStart(3, '0')}`),
                                                type: rv.rcmType,
                                                tarjeta: rv.numeroTarjeta,
                                                area: rcm?.area || '',
                                                tipoServicio: rcm?.tipoServicio || '',
                                            }
                                        })
                                        const skuItems = ag.ensayos || []
                                        const descripcion = ag.descripcionServicio || '—'
                                        const codigoDisplay = ag.temporaryCode || ag.id
                                        return (
                                            <Box
                                                key={ag.id}
                                                sx={{
                                                    display: 'grid', gridTemplateColumns: '110px 120px 160px 1fr 200px',
                                                    borderBottom: agIdx < codigosAgrupadores.length - 1 ? '1px solid #E5E7EB' : 'none',
                                                    '&:hover': { bgcolor: '#FAFAFA' },
                                                }}
                                            >
                                                {/* Código */}
                                                <Box sx={{ px: 1.5, py: 1.25, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                                    <Typography variant='body2' sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                                        {codigoDisplay}
                                                    </Typography>
                                                    <Typography variant='caption' sx={{ color: '#9CA3AF', fontSize: '0.68rem' }}>
                                                        ~ temporal
                                                    </Typography>
                                                </Box>
                                                {/* Área · Tipo */}
                                                <Box sx={{ px: 1.5, py: 1.25, width: 110, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.78rem', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                        {areaName === '—' ? '—' : ''}
                                                    </Typography>
                                                    <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.72rem', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                        {areaName !== '—' ? areaName : ''}{tipoName ? ` — ${tipoName}` : ''}
                                                    </Typography>
                                                </Box>
                                                {/* SKU(s) × Cant. */}
                                                <Box sx={{ px: 1.5, py: 1.25, width: 150, display: 'flex', flexDirection: 'column', gap: 0.5, justifyContent: 'center' }}>
                                                    {skuItems.length > 0 ? skuItems.map((sku, sIdx) => (
                                                        <Box key={sIdx} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', pb: sIdx < skuItems.length - 1 ? 0.5 : 0, borderBottom: sIdx < skuItems.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                                                            <Chip
                                                                label={sku.sku}
                                                                size='small'
                                                                sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.7rem', height: 22, '& .MuiChip-label': { px: 1 } }}
                                                            />
                                                            <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.72rem', wordBreak: 'break-word', whiteSpace: 'normal', flex: 1 }}>
                                                                {sku.nombre} <Box component='span' sx={{ color: 'primary.main', fontWeight: 700 }}>×{ag.cantidad}</Box>
                                                            </Typography>
                                                        </Box>
                                                    )) : (
                                                        <Typography variant='caption' sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.72rem' }}>
                                                            Modo P×Q
                                                        </Typography>
                                                    )}
                                                </Box>
                                                {/* Descripción */}
                                                <Box sx={{ px: 1.5, py: 1.25, width: 180 }}>
                                                    <Typography variant='body2' sx={{ fontSize: '0.82rem', color: 'text.primary', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                        {descripcion}
                                                    </Typography>
                                                </Box>
                                                {/* RCMs */}
                                                <Box sx={{ px: 1.5, py: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    {rcmCodes.map((rcmInfo, rIdx) => {
                                                        const typeLabel = rcmInfo.type === 'Muestra' ? 'MUE' : rcmInfo.type === 'Control' ? 'CTR' : 'SRV'
                                                        const typeColor = rcmInfo.type === 'Muestra' ? '#16A34A' : rcmInfo.type === 'Control' ? '#2563EB' : '#9333EA'
                                                        return (
                                                            <Box key={rIdx}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                                                    <Chip
                                                                        label={typeLabel}
                                                                        size='small'
                                                                        sx={{ bgcolor: typeColor, color: 'white', fontWeight: 700, fontSize: '0.65rem', height: 20, minWidth: 36, '& .MuiChip-label': { px: 1 } }}
                                                                    />
                                                                    <Typography variant='caption' sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                                        ~{rcmInfo.code}
                                                                    </Typography>
                                                                </Box>
                                                                <Typography variant='caption' sx={{ color: '#9CA3AF', fontSize: '0.68rem', display: 'block', pl: 0.5 }} noWrap>
                                                                    {rcmInfo.type === 'Muestra' && rcmInfo.tarjeta ? `T:${rcmInfo.tarjeta}` : ''}{rcmInfo.type === 'Muestra' && rcmInfo.tarjeta && rcmInfo.area ? ` · ` : ''}{rcmInfo.area ? rcmInfo.area : ''}{rcmInfo.tipoServicio ? ` · ${rcmInfo.tipoServicio}` : ''}
                                                                </Typography>
                                                            </Box>
                                                        )
                                                    })}
                                                </Box>
                                            </Box>
                                        )
                                    })}
                                </Box>
                            </Box>
                        </DialogContent>
                        <Divider />
                        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Typography variant='caption' color='text.secondary'>OT →</Typography>
                                <Chip
                                    icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E', ml: 0.5, mr: 0.5 }} />}
                                    label='Codificada'
                                    size='small'
                                    sx={{ bgcolor: '#F0FDF4', color: '#15803D', fontWeight: 600, fontSize: '0.75rem', height: 26, border: '1px solid #BBF7D0', '& .MuiChip-label': { px: 1.5 }, '& .MuiChip-icon': { marginRight: '4px' } }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    onClick={() => setShowPreFinalizacion(false)}
                                    variant='outlined'
                                    sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
                                >
                                    Volver a Revisar
                                </Button>
                                <Button
                                    onClick={async () => {
                                        setShowPreFinalizacion(false)
                                        await handleGuardarTodo()
                                    }}
                                    variant='contained'
                                    disabled={!allPassed || isSaving}
                                    startIcon={<CheckCircleIcon />}
                                    sx={{
                                        textTransform: 'none', borderRadius: '8px', fontWeight: 700, px: 3,
                                        bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' },
                                        '&.Mui-disabled': { bgcolor: '#D1D5DB', color: 'white' },
                                    }}
                                >
                                    {isSaving ? 'Guardando...' : 'Confirmar y Finalizar'}
                                </Button>
                            </Box>
                        </DialogActions>
                    </Dialog>
                )
            })()}
        </>
    )
}

export default RcmDialogs
