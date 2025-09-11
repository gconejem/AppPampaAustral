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
    IconButton
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import JsonView from '@uiw/react-json-view'
import { lightTheme } from '@uiw/react-json-view/light'

interface JsonEditorModalProps {
    open: boolean
    onClose: () => void
    ot: {
        id: string
        jsonOT?: any
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
            onClose()
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
        onClose()
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
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Editar JSON - OT #{ot?.id}
                    </Typography>
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
                                    Visualización del JSON (solo lectura). Para editar, use el modo "Texto".
                                </Typography>
                                <JsonView
                                    value={jsonData}
                                    style={lightTheme}
                                    enableClipboard={true}
                                    displayDataTypes={true}
                                    displayObjectSize={true}
                                    collapsed={2}
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
                        onClick={() => {/* TODO: Implementar funcionalidad Codificado */ }}
                    >
                        Codificado
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {/* TODO: Implementar funcionalidad Rechazado */ }}
                    >
                        Rechazado
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {/* TODO: Implementar funcionalidad Seguimiento */ }}
                    >
                        Seguimiento
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {/* TODO: Implementar funcionalidad PDF Laboratorio */ }}
                    >
                        PDF Laboratorio
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => {/* TODO: Implementar funcionalidad PDF Cliente */ }}
                    >
                        PDF Cliente
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    )
}

export default JsonEditorModal
