import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Checkbox,
    FormControlLabel,
    Box,
    Chip,
    Alert
} from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { es } from 'date-fns/locale'
import { SelectChangeEvent } from '@mui/material/Select'

interface RecurringEventModalProps {
    open: boolean
    onClose: () => void
    onConfirm: (recurringData: RecurringEventData) => void
    fechaInicio: Date | null
    fechaFin: Date | null
    existingRecurringData?: RecurringEventData | null
}

export interface RecurringEventData {
    fechaInicio: Date
    fechaFin: Date
    frecuencia: 'semanal' // Siempre semanal
    intervalo: 1 // Siempre 1 semana
    diasSemana: number[] // 0 = domingo, 1 = lunes, etc.
    fechaTermino: Date
}

const DIAS_SEMANA = [
    { value: 1, label: 'Lunes', short: 'L' },
    { value: 2, label: 'Martes', short: 'M' },
    { value: 3, label: 'Miércoles', short: 'X' },
    { value: 4, label: 'Jueves', short: 'J' },
    { value: 5, label: 'Viernes', short: 'V' },
    { value: 6, label: 'Sábado', short: 'S' },
    { value: 0, label: 'Domingo', short: 'D' }
]

const RecurringEventModal = ({
    open,
    onClose,
    onConfirm,
    fechaInicio,
    fechaFin,
    existingRecurringData
}: RecurringEventModalProps) => {
    const frecuencia = 'semanal' // Siempre semanal
    const intervalo = 1 // Siempre cada semana
    const [diasSemana, setDiasSemana] = useState<number[]>([])
    const [fechaTermino, setFechaTermino] = useState<Date | null>(null)
    const [eventosGenerados, setEventosGenerados] = useState<Date[]>([])

    // Inicializar fechas cuando se abre el modal
    useEffect(() => {
        if (open && fechaInicio) {
            // Si hay datos existentes de recurrencia, cargarlos
            if (existingRecurringData) {
                setDiasSemana(existingRecurringData.diasSemana)
                setFechaTermino(existingRecurringData.fechaTermino)
            } else {
                // Establecer fecha de término por defecto (30 días después)
                const defaultEndDate = new Date(fechaInicio.getTime() + 30 * 24 * 60 * 60 * 1000)
                setFechaTermino(defaultEndDate)

                // Si es frecuencia semanal, seleccionar el día de la semana de la fecha de inicio
                if (frecuencia === 'semanal') {
                    const dayOfWeek = fechaInicio.getDay()
                    setDiasSemana([dayOfWeek])
                }
            }
        }
    }, [open, fechaInicio, frecuencia, existingRecurringData])

    // Generar preview de eventos cuando cambien los parámetros
    useEffect(() => {
        if (fechaInicio && fechaTermino) {
            const eventos = generateRecurringDates({
                fechaInicio,
                fechaFin: fechaFin || fechaInicio,
                frecuencia,
                intervalo,
                diasSemana,
                fechaTermino
            })
            setEventosGenerados(eventos.slice(0, 10)) // Mostrar solo los primeros 10 para preview
        }
    }, [fechaInicio, fechaFin, diasSemana, fechaTermino])

    const handleDiasSemanaChange = (dia: number) => {
        setDiasSemana(prev => {
            if (prev.includes(dia)) {
                return prev.filter(d => d !== dia)
            } else {
                return [...prev, dia].sort()
            }
        })
    }

    const handleConfirm = () => {
        if (!fechaInicio || !fechaTermino) return

        const recurringData: RecurringEventData = {
            fechaInicio,
            fechaFin: fechaFin || fechaInicio,
            frecuencia,
            intervalo,
            diasSemana,
            fechaTermino
        }

        onConfirm(recurringData)
    }

    const handleClose = () => {
        // Resetear valores
        setDiasSemana([])
        setFechaTermino(null)
        setEventosGenerados([])
        onClose()
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                Configurar Recurrencia
            </DialogTitle>

            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {/* Días de la semana */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                            Días de la semana
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {DIAS_SEMANA.map(dia => (
                                <FormControlLabel
                                    key={dia.value}
                                    control={
                                        <Checkbox
                                            checked={diasSemana.includes(dia.value)}
                                            onChange={() => handleDiasSemanaChange(dia.value)}
                                        />
                                    }
                                    label={dia.label}
                                />
                            ))}
                        </Box>
                    </Grid>

                    {/* Fecha de término */}
                    <Grid item xs={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                            <DatePicker
                                label="Fecha de término"
                                value={fechaTermino}
                                onChange={setFechaTermino}
                                minDate={fechaInicio || undefined}
                                maxDate={fechaInicio ? new Date(fechaInicio.getTime() + 30 * 24 * 60 * 60 * 1000) : undefined}
                                slotProps={{
                                    textField: {
                                        fullWidth: true
                                    }
                                }}
                            />
                        </LocalizationProvider>
                    </Grid>

                    {/* Preview de eventos */}
                    {eventosGenerados.length > 0 && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                Vista previa de fechas (primeros 10)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', maxHeight: '200px', overflow: 'auto' }}>
                                {eventosGenerados.map((fecha, index) => (
                                    <Chip
                                        key={index}
                                        label={fecha.toLocaleDateString('es-ES', {
                                            weekday: 'short',
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                        variant="outlined"
                                        size="small"
                                    />
                                ))}
                            </Box>

                        </Grid>
                    )}

                    {/* Validaciones */}
                    {diasSemana.length === 0 && (
                        <Grid item xs={12}>
                            <Alert severity="warning">
                                Debe seleccionar al menos un día de la semana
                            </Alert>
                        </Grid>
                    )}

                    {!fechaTermino && (
                        <Grid item xs={12}>
                            <Alert severity="warning">
                                Debe seleccionar una fecha de término
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={
                        diasSemana.length === 0 ||
                        !fechaTermino ||
                        !fechaInicio
                    }
                >
                    Confirmar Configuración
                </Button>
            </DialogActions>
        </Dialog>
    )
}

// Función para generar las fechas recurrentes
function generateRecurringDates(config: RecurringEventData): Date[] {
    const {
        fechaInicio,
        diasSemana,
        fechaTermino
    } = config

    const eventos: Date[] = []
    let currentDate = new Date(fechaInicio)
    let count = 0
    const maxEvents = 1000 // Límite de seguridad

    while (count < maxEvents && currentDate <= fechaTermino) {
        // Para frecuencia semanal, generar eventos en los días seleccionados
        const startOfWeek = new Date(currentDate)
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()) // Ir al domingo de esa semana

        for (const dia of diasSemana) {
            const eventDate = new Date(startOfWeek)
            eventDate.setDate(startOfWeek.getDate() + dia)
            // Siempre preservar la hora original del evento (incluyendo 00:00 si fue seleccionada)
            eventDate.setHours(fechaInicio.getHours(), fechaInicio.getMinutes(), fechaInicio.getSeconds(), fechaInicio.getMilliseconds())

            if (eventDate >= fechaInicio && eventDate <= fechaTermino && count < maxEvents) {
                eventos.push(new Date(eventDate))
                count++
            }
        }

        // Avanzar a la siguiente semana (siempre intervalo de 1)
        currentDate.setDate(currentDate.getDate() + 7)
        count++

        // Protección contra loops infinitos
        if (count > 1000) break
    }

    return eventos.sort((a, b) => a.getTime() - b.getTime())
}

export default RecurringEventModal
