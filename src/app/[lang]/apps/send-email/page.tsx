"use client"

import { useState } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    Box,
    Alert,
    Chip,
    Typography,
    CircularProgress,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import SendIcon from '@mui/icons-material/Send'

export default function SendEmailPage() {
    const [recipients, setRecipients] = useState<string[]>([])
    const [currentEmail, setCurrentEmail] = useState('')
    const [attachments, setAttachments] = useState<File[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleAddEmail = () => {
        const email = currentEmail.trim()
        if (!email) return

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Email inválido')
            return
        }

        if (recipients.includes(email)) {
            setError('Email ya agregado')
            return
        }

        setRecipients([...recipients, email])
        setCurrentEmail('')
        setError('')
    }

    const handleRemoveEmail = (email: string) => {
        setRecipients(recipients.filter(e => e !== email))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setAttachments([...attachments, ...newFiles])
        }
    }

    const handleRemoveFile = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index))
    }

    const handleSend = async () => {
        setError('')
        setSuccess('')

        if (recipients.length === 0) {
            setError('Debe agregar al menos un destinatario')
            return
        }

        setLoading(true)

        try {
            console.log('📎 Procesando', attachments.length, 'archivo(s)...')

            // Convertir archivos a base64
            const attachmentsData = await Promise.all(
                attachments.map(async (file) => {
                    return new Promise<any>((resolve, reject) => {
                        const reader = new FileReader()

                        reader.onload = () => {
                            const base64 = (reader.result as string).split(',')[1]
                            console.log('✅ Archivo convertido:', file.name, `(${file.size} bytes)`)

                            resolve({
                                filename: file.name,
                                content: base64,
                                contentType: file.type || 'application/octet-stream',
                                encoding: 'base64'
                            })
                        }

                        reader.onerror = (error) => {
                            console.error('❌ Error leyendo archivo:', file.name, error)
                            reject(error)
                        }

                        reader.readAsDataURL(file)
                    })
                })
            )

            console.log('📤 Enviando email con', attachmentsData.length, 'adjunto(s)...')

            // Enviar a cada destinatario
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipients.join(', '),
                    attachments: attachmentsData
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al enviar email')
            }

            console.log('✅ Email enviado:', data)

            setSuccess(`✅ Email enviado correctamente a ${recipients.length} destinatario(s)${data.attachmentsCount > 0 ? ` con ${data.attachmentsCount} archivo(s) adjunto(s)` : ''}`)

            // Limpiar formulario después de 3 segundos
            setTimeout(() => {
                setRecipients([])
                setAttachments([])
                setSuccess('')
            }, 3000)
        } catch (err: any) {
            console.error('❌ Error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Card>
                <CardHeader
                    title="📧 Notificación de Servicio"
                    subheader="Laboratorio Pampa Austral - Envío de confirmación de servicios"
                />
                <CardContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    {/* Info sobre el email */}
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom>
                            <strong>📋 Email que se enviará:</strong>
                        </Typography>
                        <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                            <strong>Asunto:</strong> Laboratorio Pampa Austral - Notificación de servicio
                        </Typography>
                        <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                            <strong>Contenido:</strong> Plantilla de confirmación de servicios completados
                        </Typography>
                    </Alert>

                    {/* Destinatarios */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Destinatarios *
                        </Typography>
                        <Box display="flex" gap={1} mb={2}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="email@ejemplo.com"
                                value={currentEmail}
                                onChange={(e) => setCurrentEmail(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddEmail()
                                    }
                                }}
                            />
                            <Button variant="outlined" onClick={handleAddEmail}>
                                Agregar
                            </Button>
                        </Box>

                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {recipients.map((email) => (
                                <Chip
                                    key={email}
                                    label={email}
                                    onDelete={() => handleRemoveEmail(email)}
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Archivos Adjuntos */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Archivos Adjuntos (Órdenes de Trabajo)
                        </Typography>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<AttachFileIcon />}
                            sx={{ mb: 2 }}
                        >
                            Seleccionar Archivos PDF
                            <input
                                type="file"
                                hidden
                                multiple
                                accept=".pdf"
                                onChange={handleFileChange}
                            />
                        </Button>

                        {attachments.length > 0 && (
                            <List dense>
                                {attachments.map((file, index) => (
                                    <ListItem key={index}>
                                        <ListItemText
                                            primary={file.name}
                                            secondary={`${(file.size / 1024).toFixed(2)} KB - ${file.type || 'Tipo desconocido'}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleRemoveFile(index)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>

                    {/* Botones */}
                    <Box display="flex" justifyContent="flex-end" gap={2}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setRecipients([])
                                setAttachments([])
                                setError('')
                                setSuccess('')
                            }}
                            disabled={loading}
                        >
                            Limpiar
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSend}
                            disabled={loading || recipients.length === 0}
                            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                        >
                            {loading ? 'Enviando...' : 'Enviar Notificación'}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}
