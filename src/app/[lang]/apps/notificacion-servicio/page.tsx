'use client'

import { useState } from 'react'
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Alert,
    CircularProgress,
    Chip,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

// Datos hardcodeados
const CLIENTE = {
    nombre: 'Constructora Ejemplo S.A.',
    obra: 'Edificio Los Aromos',
    direccion: 'Av. Pedro de Valdivia 850, Temuco',
    email: 'guidoconejeros@gmail.com'
}

const SERVICIO = {
    fecha: new Date().toLocaleDateString('es-CL'),
    hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    tecnico: 'Juan Pérez González',
    recepcion: 'María González López'
}

const ORDENES = [
    {
        correlativo: '152023',  // ✅ CAMBIO: usar correlativo
        descripcion: 'Muestreo de Hormigón',
        formato: 'Formato Digital'
    },
    {
        correlativo: '152024',  // ✅ CAMBIO
        descripcion: 'Densidades con Método Nuclear',
        formato: 'Formato Digital'
    },
    {
        correlativo: '152025',  // ✅ CAMBIO
        descripcion: 'Retiro de Probetas',
        formato: 'Formato Digital'
    },
    {
        correlativo: '207',     // ✅ CAMBIO
        descripcion: 'Hi-Lo',
        formato: 'Formato Papel'
    }
]

export default function NotificacionServicioPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [attachments, setAttachments] = useState<File[]>([])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            setAttachments([...attachments, ...newFiles])
        }
    }

    const handleRemoveFile = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index))
    }

    const handleEnviarNotificacion = async () => {
        setError('')
        setSuccess('')
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
                                contentType: file.type || 'application/pdf',
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

            console.log('📤 Enviando notificación a:', CLIENTE.email)

            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: CLIENTE.email,
                    attachments: attachmentsData,
                    clientName: CLIENTE.nombre,
                    fecha: SERVICIO.fecha,
                    hora: SERVICIO.hora,
                    projectName: CLIENTE.obra,
                    projectLocation: CLIENTE.direccion,
                    tecnicoName: SERVICIO.tecnico,
                    recepcionName: SERVICIO.recepcion,
                    orders: ORDENES.map(o => ({
                        correlativo: o.correlativo,  // ✅ CAMBIO: enviar correlativo
                        descripcion: o.descripcion,
                        formato: o.formato
                    }))
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al enviar notificación')
            }

            console.log('✅ Notificación enviada:', data)

            setSuccess(`✅ Notificación enviada correctamente a ${CLIENTE.email}${data.attachmentsCount > 0 ? ` con ${data.attachmentsCount} archivo(s) adjunto(s)` : ''}`)

            // Limpiar archivos después de 3 segundos
            setTimeout(() => {
                setAttachments([])
                setSuccess('')
            }, 5000)

        } catch (err: any) {
            console.error('❌ Error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            <Card>
                <CardHeader
                    title="📧 Notificación de Servicio Completado"
                    subheader="Confirmación de servicios realizados - Pampa Austral"
                />
                <CardContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    {/* Información del Cliente */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📋 Información del Servicio
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Cliente
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {CLIENTE.nombre}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {CLIENTE.email}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Obra
                                    </Typography>
                                    <Typography variant="body1">
                                        {CLIENTE.obra}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Ubicación
                                    </Typography>
                                    <Typography variant="body1">
                                        {CLIENTE.direccion}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Fecha
                                    </Typography>
                                    <Typography variant="body1">
                                        {SERVICIO.fecha} - {SERVICIO.hora}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Técnico
                                    </Typography>
                                    <Typography variant="body1">
                                        {SERVICIO.tecnico}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Tabla de Órdenes */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📝 Órdenes de Trabajo Completadas
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                                            N° Correlativo  {/* ✅ CAMBIO */}
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Formato</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ORDENES.map((orden, index) => (
                                        <TableRow key={index}>
                                            <TableCell align="center">{orden.correlativo}</TableCell>  {/* ✅ CAMBIO */}
                                            <TableCell>{orden.descripcion}</TableCell>
                                            <TableCell align="center">{orden.formato}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Archivos Adjuntos */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            📎 Archivos Adjuntos (Órdenes de Trabajo PDF)
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
                                            secondary={`${(file.size / 1024).toFixed(2)} KB - ${file.type || 'application/pdf'}`}
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

                        {attachments.length === 0 && (
                            <Alert severity="info" variant="outlined">
                                No hay archivos adjuntos. Puedes enviar la notificación sin archivos o agregar PDFs de las órdenes de trabajo.
                            </Alert>
                        )}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Información del Email */}
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom>
                            <strong>📧 Email que se enviará:</strong>
                        </Typography>
                        <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                            <strong>Para:</strong> {CLIENTE.email}
                        </Typography>
                        <Typography variant="caption" component="div">
                            <strong>Asunto:</strong> Laboratorio Pampa Austral - Notificación de servicio
                        </Typography>
                        <Typography variant="caption" component="div">
                            <strong>Adjuntos:</strong> {attachments.length} archivo(s)
                        </Typography>
                    </Alert>

                    {/* Botón Enviar */}
                    <Box display="flex" justifyContent="flex-end" gap={2}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setAttachments([])
                                setError('')
                                setSuccess('')
                            }}
                            disabled={loading}
                        >
                            Limpiar Adjuntos
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleEnviarNotificacion}
                            disabled={loading}
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
