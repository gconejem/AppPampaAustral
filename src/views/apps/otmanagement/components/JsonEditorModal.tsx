'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    TextField,
    IconButton,
    Menu,
    MenuItem,
    Snackbar
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import JsonView from 'react18-json-view'

interface JsonEditorModalProps {
    open: boolean
    onClose: () => void
    ot: {
        id: string
        numeroCorrelativo?: number | null
        jsonOT?: any
        tipoOT?: {
            codigo?: string | null
            descripcion?: string | null
        }
        agenda?: {
            cliente?: {
                nombreCliente?: string | null
            }
            obra?: {
                numeroObra?: string | null
            }
        }
    }
    onSave?: () => void
}

const JsonEditorModal = ({ open, onClose, ot, onSave }: JsonEditorModalProps) => {
    const [jsonData, setJsonData] = useState<any>({})
    const [jsonText, setJsonText] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasChanges, setHasChanges] = useState(false)
    const [jsonError, setJsonError] = useState<string | null>(null)
    const [editMode, setEditMode] = useState<'visual' | 'text'>('visual')
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [generatingPDF, setGeneratingPDF] = useState(false)
    const numeroOT = ot?.numeroCorrelativo != null
        ? String(ot.numeroCorrelativo).padStart(6, '0')
        : ot?.tipoOT?.codigo || ot?.id

    // Load JSON data when modal opens
    useEffect(() => {
        if (open && ot) {
            setLoading(true)
            setError(null)
            setJsonError(null)
            setHasChanges(false)

            try {
                // Parse the JSON data if it's a string, otherwise use as is
                let parsedData = ot.jsonOT
                if (typeof ot.jsonOT === 'string') {
                    parsedData = JSON.parse(ot.jsonOT)
                }
                const dataToLoad = parsedData || {}
                setJsonData(dataToLoad)
                // Format JSON with proper indentation
                setJsonText(JSON.stringify(dataToLoad, null, 2))
            } catch (err) {
                console.error('Error parsing JSON:', err)
                setError('Error al cargar el JSON de la OT')
                setJsonData({})
                setJsonText('{}')
            } finally {
                setLoading(false)
            }
        }
    }, [open, ot])

    const handleJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value
        setJsonText(newValue)
        setHasChanges(true)

        // Validate JSON
        try {
            const parsed = JSON.parse(newValue)
            setJsonData(parsed)
            setJsonError(null)
        } catch (err) {
            setJsonError('JSON inválido')
        }
    }

    // Función para actualizar el JSON desde modo visual (no necesaria ya que es solo lectura)
    // const handleVisualJsonChange = (newData: any) => {
    //     setJsonData(newData)
    //     setJsonText(JSON.stringify(newData, null, 2))
    //     setHasChanges(true)
    //     setJsonError(null)
    // }

    const handleSave = async () => {
        if (!hasChanges || !ot || jsonError) return

        setSaving(true)
        setError(null)

        try {
            // Use jsonData instead of parsing jsonText again
            const response = await fetch(`/api/ot/${ot.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jsonOT: jsonData
                })
            })

            if (!response.ok) {
                throw new Error('Error al actualizar la OT')
            }

            setHasChanges(false)
            onSave?.()
        } catch (err) {
            console.error('Error saving JSON:', err)
            setError('Error al guardar los cambios')
        } finally {
            setSaving(false)
        }
    }

    const handleClose = () => {
        if (hasChanges) {
            const confirmClose = window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?')
            if (!confirmClose) return
        }
        setAnchorEl(null) // Cerrar menú si está abierto
        onClose()
    }

    const handleActionsClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleActionsClose = () => {
        setAnchorEl(null)
    }

    const handleStatusChange = async (newStatus: 'EN_REVISION' | 'ANULADA') => {
        if (!ot) return

        setUpdatingStatus(true)
        setAnchorEl(null)

        try {
            const response = await fetch(`/api/ot/${ot.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    estado: newStatus
                })
            })

            if (!response.ok) {
                throw new Error('Error al actualizar el estado de la OT')
            }

            setSnackbarMessage(`Estado cambiado a ${newStatus === 'EN_REVISION' ? 'En Revisión' : 'Anulada'} exitosamente`)
            setSnackbarOpen(true)
            onSave?.() // Refrescar datos

            // Cerrar el modal después del cambio exitoso
            setTimeout(() => {
                onClose()
            }, 1500)
        } catch (err) {
            console.error('Error updating status:', err)
            setSnackbarMessage('Error al cambiar el estado de la OT')
            setSnackbarOpen(true)
        } finally {
            setUpdatingStatus(false)
        }
    }

    const handlePDFClick = async () => {
        if (!ot) return

        setGeneratingPDF(true)

        try {
            // Llamar al endpoint del backend para generar y descargar el PDF
            const response = await fetch(`/api/ot/${ot.id}/pdf`)

            if (!response.ok) {
                throw new Error('Error al generar el PDF')
            }

            // Obtener el blob del PDF
            const blob = await response.blob()

            // Crear URL temporal para el blob
            const url = window.URL.createObjectURL(blob)

            // Crear elemento <a> para forzar la descarga
            const link = document.createElement('a')
            link.href = url

            // Generar nombre del archivo
            const tipoCode = ot.tipoOT?.codigo || 'OT'
            const fileName = `${tipoCode}_${numeroOT}.pdf`
            link.download = fileName

            // Simular click para iniciar descarga
            document.body.appendChild(link)
            link.click()

            // Limpiar
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            setSnackbarMessage('PDF generado y descargado exitosamente')
            setSnackbarOpen(true)
        } catch (error) {
            console.error('Error al descargar PDF:', error)
            setSnackbarMessage('Error al generar el PDF')
            setSnackbarOpen(true)
        } finally {
            setGeneratingPDF(false)
        }
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { height: '80vh' }
            }}
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                            Numero de ot: {numeroOT} - {ot?.tipoOT?.codigo || 'Sin código'} - {ot?.tipoOT?.descripcion || 'Sin descripción'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {ot?.agenda?.cliente?.nombreCliente || 'Sin cliente'} - N° de Obra: {ot?.agenda?.obra?.numeroObra || 'Sin número de obra'}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                            size="small"
                            variant={editMode === 'visual' ? 'contained' : 'outlined'}
                            onClick={() => setEditMode('visual')}
                        >
                            Visual
                        </Button>
                        <Button
                            size="small"
                            variant={editMode === 'text' ? 'contained' : 'outlined'}
                            onClick={() => setEditMode('text')}
                        >
                            Texto
                        </Button>
                        <IconButton
                            aria-label="cerrar"
                            onClick={handleClose}
                            sx={{ ml: 1 }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ height: '100%', overflow: 'auto' }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {jsonError && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {jsonError}
                    </Alert>
                )}

                {/* Botón Guardar arriba del JSON */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={!hasChanges || saving || !!jsonError}
                        startIcon={saving ? <CircularProgress size={16} /> : null}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ height: '100%', minHeight: '400px' }}>
                        {editMode === 'visual' ? (
                            <Box sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                padding: '16px',
                                backgroundColor: '#fafafa',
                                maxHeight: '500px',
                                overflow: 'auto'
                            }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Visualización y edición del JSON. También puede usar el modo "Texto" para edición avanzada.
                                </Typography>
                                <JsonView
                                    src={jsonData}
                                    collapsed={2}
                                    editable={true}
                                    onEdit={(params) => {
                                        console.log('JSON editado:', params)
                                        // Actualizar el JSON cuando se edite
                                        setJsonData(params.src)
                                        setJsonText(JSON.stringify(params.src, null, 2))
                                        setHasChanges(true)
                                        setJsonError(null)
                                    }}
                                    onAdd={(params) => {
                                        console.log('JSON añadido:', params)
                                        // Actualizar el JSON cuando se añada un elemento
                                        setJsonData(params.src)
                                        setJsonText(JSON.stringify(params.src, null, 2))
                                        setHasChanges(true)
                                        setJsonError(null)
                                    }}
                                    onDelete={(params) => {
                                        console.log('JSON eliminado:', params)
                                        // Actualizar el JSON cuando se elimine un elemento
                                        setJsonData(params.src)
                                        setJsonText(JSON.stringify(params.src, null, 2))
                                        setHasChanges(true)
                                        setJsonError(null)
                                    }}
                                />
                            </Box>
                        ) : (
                            <TextField
                                fullWidth
                                multiline
                                rows={20}
                                value={jsonText}
                                onChange={handleJsonChange}
                                variant="outlined"
                                placeholder="Ingrese el JSON aquí..."
                                error={!!jsonError}
                                helperText={jsonError || 'Edite el JSON de la orden de trabajo'}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                                        fontSize: '14px'
                                    }
                                }}
                            />
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={handleActionsClick}
                        endIcon={<ExpandMoreIcon />}
                        disabled={updatingStatus}
                    >
                        Acciones
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleActionsClose}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                    >
                        <MenuItem onClick={() => handleStatusChange('EN_REVISION')} disabled={updatingStatus}>
                            {updatingStatus ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                            Cambiar a En Revisión
                        </MenuItem>
                        <MenuItem onClick={() => handleStatusChange('ANULADA')} disabled={updatingStatus}>
                            {updatingStatus ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                            Cambiar a Anulada
                        </MenuItem>
                    </Menu>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={handlePDFClick}
                        disabled={generatingPDF}
                        startIcon={generatingPDF ? <CircularProgress size={16} /> : null}
                    >
                        {generatingPDF ? 'Generando...' : 'PDF OT'}
                    </Button>
                    {/* Solo mostrar PDF Cliente para Control de Compactación (R-12-03) */}
                    {ot?.tipoOT?.codigo === 'R-12-03' && (
                        <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            onClick={() => {/* TODO: Implementar funcionalidad PDF Cliente */ }}
                        >
                            PDF Cliente
                        </Button>
                    )}
                </Box>
            </DialogActions>

            {/* Snackbar para mostrar mensajes de estado */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Dialog>
    )
}

export default JsonEditorModal
