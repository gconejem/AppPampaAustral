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
    Grid,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'

interface RcmDialogsProps {
    // Error snackbar
    errorVencimiento: string
    setErrorVencimiento: (msg: string) => void
    // Success snackbar
    successMessage: string
    setSuccessMessage: (msg: string) => void
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
}

const RcmDialogs: React.FC<RcmDialogsProps> = ({
    errorVencimiento, setErrorVencimiento,
    successMessage, setSuccessMessage,
    showEditWarning, setShowEditWarning,
    showConfirmNewRcm, handleConfirmNewRcm, handleCancelNewRcm,
    showCancelConfirm, handleConfirmCancel, handleDismissCancelConfirm,
    showDeleteConfirm, handleConfirmDelete, handleDismissDeleteConfirm,
    showPreFinalizacion, setShowPreFinalizacion,
    computeValidaciones, handleGuardarTodo, isSaving,
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

            {/* Dialog: Validación Pre-Finalización */}
            {showPreFinalizacion && (() => {
                const val = computeValidaciones()
                const allPassed = val.v1 && val.v2 && val.v3 && val.v4 && val.v5

                const validaciones = [
                    { key: 'v1', label: 'V1 — RCMs sin Código Producto', desc: val.v1 ? 'Todos los RCMs están agrupados correctamente' : 'Hay RCMs sin código producto asignado', ok: val.v1 },
                    { key: 'v2', label: 'V2 — Submuestras', desc: val.v2 ? 'Cantidades cuadradas con muestras declaradas' : 'Hay submuestras con cantidades inconsistentes', ok: val.v2 },
                    { key: 'v3', label: 'V3 — Códigos vacíos', desc: val.v3 ? 'Sin códigos huérfanos sin RCMs' : 'Hay códigos agrupadores sin RCMs vinculados', ok: val.v3 },
                    { key: 'v4', label: 'V4 — Mezcla de Áreas', desc: val.v4 ? 'Áreas homogéneas en todos los códigos' : 'Hay códigos con RCMs de distintas áreas', ok: val.v4 },
                    { key: 'v5', label: 'V5 — Mínimo 1 ensayo', desc: val.v5 ? 'Todos los RCMs tienen al menos 1 ensayo registrado' : 'Hay RCMs sin ensayos registrados', ok: val.v5 },
                ]

                return (
                    <Dialog
                        open={showPreFinalizacion}
                        onClose={() => setShowPreFinalizacion(false)}
                        maxWidth='sm'
                        fullWidth
                        PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}
                    >
                        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            Validación Pre-Finalización
                            <IconButton size='small' onClick={() => setShowPreFinalizacion(false)} sx={{ color: 'text.secondary' }}>
                                <CloseIcon fontSize='small' />
                            </IconButton>
                        </DialogTitle>
                        <Divider />
                        <DialogContent sx={{ pt: 2, pb: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {validaciones.map(v => (
                                    <Box
                                        key={v.key}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: '8px',
                                            border: '1px solid', borderColor: v.ok ? 'success.light' : 'error.light',
                                            bgcolor: v.ok ? 'success.50' : 'error.50',
                                        }}
                                    >
                                        {v.ok
                                            ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: 22, flexShrink: 0 }} />
                                            : <WarningAmberIcon sx={{ color: 'error.main', fontSize: 22, flexShrink: 0 }} />
                                        }
                                        <Box>
                                            <Typography variant='body2' sx={{ fontWeight: 700, color: v.ok ? 'success.dark' : 'error.dark' }}>
                                                {v.label}
                                            </Typography>
                                            <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                                                {v.desc}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}

                                {/* Resumen de Codificación */}
                                <Box sx={{ mt: 1, p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                                    <Typography variant='body2' sx={{ fontWeight: 700, mb: 1.5 }}>
                                        Resumen de Codificación
                                    </Typography>
                                    <Grid container spacing={1}>
                                        {[
                                            { label: 'Total RCMs', value: val.totalRcms },
                                            { label: 'Tipo Muestra', value: val.tipoMuestra },
                                            { label: 'Tipo Control', value: val.tipoControl },
                                            { label: 'Tipo Servicio', value: val.tipoServicio },
                                            { label: 'Códigos Producto', value: val.codigosProducto },
                                            { label: 'Modo Fijo', value: val.modoFijo },
                                            { label: 'Modo P×Q', value: val.modoPxQ },
                                        ].map(item => (
                                            <Grid item xs={6} key={item.label}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant='caption' color='text.secondary'>{item.label}</Typography>
                                                    <Typography variant='caption' sx={{ fontWeight: 700 }}>{item.value}</Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    <Divider sx={{ my: 1.5 }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant='caption' color='text.secondary'>OT quedará en estado:</Typography>
                                        <Chip
                                            label='Codificada'
                                            size='small'
                                            sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                            <Button
                                onClick={() => setShowPreFinalizacion(false)}
                                variant='outlined'
                                sx={{ textTransform: 'none', borderRadius: '8px' }}
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
                                sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
                            >
                                {isSaving ? 'Guardando...' : 'Confirmar y Finalizar'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                )
            })()}
        </>
    )
}

export default RcmDialogs
