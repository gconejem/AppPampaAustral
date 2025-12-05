'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Third-party Imports
import { toast } from 'react-hot-toast'
import axios from 'axios'

// Icon Imports
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

type DetalleRow = {
    id?: number
    datoEquipo: string
    correccion: string
}

type CalibracionData = {
    id: number
    fechaCalibracion: string
    certificado: string
    detalles: DetalleRow[]
}

type Props = {
    open: boolean
    handleClose: () => void
    equipoId: number
    calibracionId?: number
    onSaved?: () => void
}

const TablaCorreccionModal = ({ open, handleClose, equipoId, calibracionId, onSaved }: Props) => {
    const [fechaCalibracion, setFechaCalibracion] = useState<string>('')
    const [certificado, setCertificado] = useState<string>('')
    const [detalles, setDetalles] = useState<DetalleRow[]>([
        { datoEquipo: '', correccion: '' },
        { datoEquipo: '', correccion: '' },
        { datoEquipo: '', correccion: '' },
        { datoEquipo: '', correccion: '' },
        { datoEquipo: '', correccion: '' }
    ])
    const [isLoading, setIsLoading] = useState(false)
    const [isFetchingData, setIsFetchingData] = useState(false)
    const [currentCalibracionId, setCurrentCalibracionId] = useState<number | null>(null)

    // Cargar datos existentes cuando se abre el modal
    useEffect(() => {
        const fetchCalibracionData = async () => {
            if (!open || !equipoId) return

            setIsFetchingData(true)
            try {
                // Obtener la última calibración del equipo
                const response = await axios.get(`/api/calibracion-equipo?equipoId=${equipoId}`)

                if (response.data && response.data.length > 0) {
                    // Tomar la calibración más reciente
                    const calibracion: CalibracionData = response.data[0]

                    // Formatear la fecha para el input type="date"
                    const fechaFormateada = new Date(calibracion.fechaCalibracion).toISOString().split('T')[0]

                    setCurrentCalibracionId(calibracion.id)
                    setFechaCalibracion(fechaFormateada)
                    setCertificado(calibracion.certificado)

                    // Cargar detalles o usar filas vacías si no hay
                    if (calibracion.detalles && calibracion.detalles.length > 0) {
                        setDetalles(calibracion.detalles.map(d => ({
                            id: d.id,
                            datoEquipo: d.datoEquipo,
                            correccion: d.correccion
                        })))
                    } else {
                        setDetalles([
                            { datoEquipo: '', correccion: '' },
                            { datoEquipo: '', correccion: '' },
                            { datoEquipo: '', correccion: '' },
                            { datoEquipo: '', correccion: '' },
                            { datoEquipo: '', correccion: '' }
                        ])
                    }
                } else {
                    // No hay calibraciones previas, resetear formulario
                    resetForm()
                }
            } catch (error: any) {
                console.error('Error al cargar calibración:', error)
                // Si no hay calibraciones previas o hay error, resetear
                resetForm()
            } finally {
                setIsFetchingData(false)
            }
        }

        fetchCalibracionData()
    }, [open, equipoId])

    const resetForm = () => {
        setCurrentCalibracionId(null)
        setFechaCalibracion('')
        setCertificado('')
        setDetalles([
            { datoEquipo: '', correccion: '' },
            { datoEquipo: '', correccion: '' },
            { datoEquipo: '', correccion: '' },
            { datoEquipo: '', correccion: '' },
            { datoEquipo: '', correccion: '' }
        ])
    }

    const handleAddRow = () => {
        setDetalles([...detalles, { datoEquipo: '', correccion: '' }])
    }

    const handleDeleteRow = (index: number) => {
        if (detalles.length > 1) {
            const newDetalles = detalles.filter((_, i) => i !== index)
            setDetalles(newDetalles)
        }
    }

    const handleDetalleChange = (index: number, field: 'datoEquipo' | 'correccion', value: string) => {
        const newDetalles = [...detalles]
        newDetalles[index][field] = value
        setDetalles(newDetalles)
    }

    const handleSave = async () => {
        // Validaciones
        if (!fechaCalibracion) {
            toast.error('La fecha de calibración es requerida')
            return
        }

        if (!certificado) {
            toast.error('El certificado es requerido')
            return
        }

        // Filtrar detalles vacíos
        const detallesValidos = detalles.filter(d => d.datoEquipo.trim() !== '' && d.correccion.trim() !== '')

        if (detallesValidos.length === 0) {
            toast.error('Debe ingresar al menos un detalle de corrección')
            return
        }

        setIsLoading(true)

        try {
            const payload = {
                fechaCalibracion,
                certificado,
                equipoId,
                detalles: detallesValidos
            }

            if (currentCalibracionId) {
                // Actualizar calibración existente
                await axios.put(`/api/calibracion-equipo/${currentCalibracionId}`, payload)
                toast.success('Calibración actualizada correctamente')
            } else {
                // Crear nueva calibración
                await axios.post('/api/calibracion-equipo', payload)
                toast.success('Calibración guardada correctamente')
            }

            if (onSaved) {
                onSaved()
            }

            handleClose()
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Error al guardar la calibración'
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        resetForm()
        handleClose()
    }

    return (
        <Dialog open={open} onClose={handleCancel} maxWidth='md' fullWidth>
            <DialogTitle>
                <div>
                    <Typography variant='h5' component='div'>
                        Tabla de Corrección
                    </Typography>
                    {currentCalibracionId && !isFetchingData && (
                        <Typography variant='caption' color='text.secondary'>
                            Editando calibración existente (ID: {currentCalibracionId})
                        </Typography>
                    )}
                </div>
            </DialogTitle>

            <DialogContent>
                {isFetchingData ? (
                    <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
                        <CircularProgress />
                        <Typography variant='body2' sx={{ ml: 2 }}>
                            Cargando datos de calibración...
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={3} sx={{ mt: 0 }}>
                        {/* Fecha de Calibración */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                type='date'
                                label='Fecha de calibración'
                                value={fechaCalibracion}
                                onChange={(e) => setFechaCalibracion(e.target.value)}
                                InputLabelProps={{
                                    shrink: true
                                }}
                            />
                        </Grid>

                        {/* Certificado */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label='Certificado'
                                placeholder='Ingrese el certificado'
                                value={certificado}
                                onChange={(e) => setCertificado(e.target.value)}
                            />
                        </Grid>

                        {/* Tabla de Detalles */}
                        <Grid item xs={12}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <Typography variant='subtitle1' component='div'>
                                    Dato Equipo / Corrección
                                </Typography>
                                <Button
                                    variant='contained'
                                    size='small'
                                    startIcon={<AddIcon />}
                                    onClick={handleAddRow}
                                >
                                    Agregar Fila
                                </Button>
                            </div>

                            <TableContainer component={Paper} variant='outlined'>
                                <Table size='small'>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width='50'>ID</TableCell>
                                            <TableCell>Dato Equipo</TableCell>
                                            <TableCell>Corrección</TableCell>
                                            <TableCell width='80' align='center'>Acción</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {detalles.map((detalle, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    <TextField
                                                        fullWidth
                                                        size='small'
                                                        value={detalle.datoEquipo}
                                                        onChange={(e) => handleDetalleChange(index, 'datoEquipo', e.target.value)}
                                                        placeholder='Dato del equipo'
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        fullWidth
                                                        size='small'
                                                        value={detalle.correccion}
                                                        onChange={(e) => handleDetalleChange(index, 'correccion', e.target.value)}
                                                        placeholder='Corrección'
                                                    />
                                                </TableCell>
                                                <TableCell align='center'>
                                                    <IconButton
                                                        size='small'
                                                        color='error'
                                                        onClick={() => handleDeleteRow(index)}
                                                        disabled={detalles.length === 1}
                                                    >
                                                        <DeleteIcon fontSize='small' />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                                Los valores ingresados se utilizarán para corregir resultados de este equipo
                            </Typography>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleCancel} variant='outlined' color='error' disabled={isFetchingData}>
                    Cancelar
                </Button>
                <Button onClick={handleSave} variant='contained' disabled={isLoading || isFetchingData}>
                    {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default TablaCorreccionModal
