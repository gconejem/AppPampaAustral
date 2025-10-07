import { useState, useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import es from 'date-fns/locale/es'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

interface ReprogramarEventoModalProps {
  open: boolean
  onClose: () => void
  eventId: string | null
  onReprogramar: (fechaInicio: Date, fechaFin: Date, soloCambiarHora?: boolean) => Promise<void>
  fechaInicioActual?: Date
  fechaFinActual?: Date
  isBulkEdit?: boolean
  selectedEvents?: Array<{ id: string; start: string; end: string }>
  events?: any[]
}

const ReprogramarEventoModal = ({
  open,
  onClose,
  onReprogramar,
  fechaInicioActual,
  fechaFinActual,
  isBulkEdit = false,
  selectedEvents = [],
  events = []
}: ReprogramarEventoModalProps) => {
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null)
  const [fechaFin, setFechaFin] = useState<Date | null>(null)
  const [error, setError] = useState<string>('')
  const [soloCambiarHora, setSoloCambiarHora] = useState<boolean>(false)
  const [eventosMismoEstado, setEventosMismoEstado] = useState<boolean>(false)

  // Función para verificar si todos los eventos seleccionados se pueden reprogramar
  const verificarEventosReprogramables = () => {
    if (!isBulkEdit || selectedEvents.length === 0 || events.length === 0) {
      return false
    }

    return selectedEvents.every(selectedEvent => {
      const evento = events.find(e => String(e.id) === String(selectedEvent.id))
      const estado = evento?.extendedProps?.estado || 'AGENDADA'
      return estado === 'CREADA' || estado === 'AGENDADA'
    })
  }

  useEffect(() => {
    if (open) {
      // Verificar si todos los eventos se pueden reprogramar
      const eventosReprogramables = verificarEventosReprogramables()
      setEventosMismoEstado(eventosReprogramables)

      // Si todos los eventos se pueden reprogramar, activar modo "solo cambiar hora" por defecto
      if (eventosReprogramables) {
        setSoloCambiarHora(true)
      }

      if (fechaInicioActual && fechaFinActual) {
        const startDate = new Date(fechaInicioActual)
        const endDate = new Date(fechaFinActual)

        // Mantener las horas originales del evento
        setFechaInicio(startDate)
        setFechaFin(endDate)
      } else {
        // Si no hay fechas actuales, establecer fechas por defecto (hoy) con horas 00:00
        const now = new Date()
        const defaultStart = new Date(now)
        const defaultEnd = new Date(now)

        // Establecer horas y minutos a 00:00
        defaultStart.setHours(0, 0, 0, 0)
        defaultEnd.setHours(0, 0, 0, 0)

        setFechaInicio(defaultStart)
        setFechaFin(defaultEnd)
      }
      setError('')
    } else {
      // Limpiar valores cuando el modal se cierra
      setFechaInicio(null)
      setFechaFin(null)
      setError('')
      setSoloCambiarHora(false)
      setEventosMismoEstado(false)
    }
  }, [open, fechaInicioActual, fechaFinActual, isBulkEdit, selectedEvents, events])

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      if (soloCambiarHora && isBulkEdit && eventosMismoEstado) {
        // Si solo se cambia la hora, mantener las fechas originales pero actualizar las horas
        if (fechaInicio && fechaFin) {
          const newFechaInicio = new Date(newDate)
          const newFechaFin = new Date(newDate)

          // Mantener las horas originales pero cambiar la fecha
          newFechaInicio.setHours(fechaInicio.getHours(), fechaInicio.getMinutes())
          newFechaFin.setHours(fechaFin.getHours(), fechaFin.getMinutes())

          setFechaInicio(newFechaInicio)
          setFechaFin(newFechaFin)
          setError('')
        }
      } else {
        // Comportamiento normal: cambiar fecha y mantener horas
        const newFechaInicio = new Date(newDate)
        const newFechaFin = new Date(newDate)

        if (fechaInicio) {
          newFechaInicio.setHours(fechaInicio.getHours(), fechaInicio.getMinutes())
        }

        if (fechaFin) {
          newFechaFin.setHours(fechaFin.getHours(), fechaFin.getMinutes())
        } else if (fechaInicio) {
          newFechaFin.setHours(fechaInicio.getHours() + 1, fechaInicio.getMinutes())
        }

        // Asegurar que la fecha de fin sea posterior a la fecha de inicio
        if (newFechaFin <= newFechaInicio) {
          // Si la fecha de fin es anterior o igual, ajustar la hora de fin
          newFechaFin.setHours(newFechaInicio.getHours() + 1, newFechaInicio.getMinutes())
        }

        setFechaInicio(newFechaInicio)
        setFechaFin(newFechaFin)
        setError('')
      }
    }
  }

  const handleStartTimeChange = (newTime: Date | null) => {
    if (newTime && fechaInicio) {
      const updatedStart = new Date(fechaInicio)

      updatedStart.setHours(newTime.getHours(), newTime.getMinutes())
      setFechaInicio(updatedStart)

      if (!fechaFin || fechaFin <= updatedStart) {
        const updatedEnd = new Date(updatedStart)

        updatedEnd.setHours(updatedStart.getHours() + 1)
        setFechaFin(updatedEnd)
      }

      setError('')
    }
  }

  const handleEndTimeChange = (newTime: Date | null) => {
    if (newTime && fechaFin) {
      const updatedEnd = new Date(fechaFin)

      updatedEnd.setHours(newTime.getHours(), newTime.getMinutes())

      if (fechaInicio && updatedEnd <= fechaInicio) {
        setError('La hora de fin debe ser posterior a la hora de inicio')

        return
      }

      setFechaFin(updatedEnd)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!fechaInicio || !fechaFin) {
      setError('Por favor, selecciona ambas fechas y horas')

      return
    }

    if (fechaFin <= fechaInicio) {
      setError('La fecha y hora de fin debe ser posterior a la fecha y hora de inicio')

      return
    }

    try {
      // Pasar el parámetro soloCambiarHora si es bulk edit
      if (isBulkEdit) {
        await onReprogramar(fechaInicio, fechaFin, soloCambiarHora)
      } else {
        await onReprogramar(fechaInicio, fechaFin)
      }

      // Limpiar valores y cerrar modal después de una reprogramación exitosa
      setFechaInicio(null)
      setFechaFin(null)
      setError('')
      setSoloCambiarHora(false)
      onClose()
    } catch (error) {
      setError('Error al reprogramar el evento')
      console.error('Error:', error)
    }
  }

  const handleClose = () => {
    // Limpiar valores al cerrar el modal
    setFechaInicio(null)
    setFechaFin(null)
    setError('')
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          {isBulkEdit
            ? (soloCambiarHora ? 'Reprogramar Hora de Eventos Seleccionados' : 'Reprogramar Eventos Seleccionados')
            : 'Reprogramar Evento'
          }
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {isBulkEdit && (
                <Alert severity='info' sx={{ mb: 2 }}>
                  Los cambios se aplicarán a todos los eventos seleccionados
                </Alert>
              )}

              {isBulkEdit && eventosMismoEstado && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity='info' sx={{ mb: 2 }}>
                    Los eventos seleccionados tienen estado CREADA o AGENDADA. Puedes elegir cambiar solo la hora manteniendo la fecha original de cada evento.
                  </Alert>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={soloCambiarHora}
                        onChange={(e) => setSoloCambiarHora(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Solo cambiar hora (mantener fecha original de cada evento)
                      </Typography>
                    }
                  />
                </Box>
              )}

              <Alert severity='info' sx={{ mb: 2 }}>
                Puedes seleccionar una fecha anterior, igual o posterior a la fecha actual del evento
              </Alert>
              <DatePicker
                label='Fecha'
                value={fechaInicio}
                onChange={handleDateChange}
                disablePast={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!error
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TimePicker
                  label='Hora de inicio'
                  value={fechaInicio}
                  onChange={handleStartTimeChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error
                    }
                  }}
                />
                <TimePicker
                  label='Hora de fin'
                  value={fechaFin}
                  onChange={handleEndTimeChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error
                    }
                  }}
                />
              </Box>
              {error && <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{error}</Box>}
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSubmit} variant='contained' color='primary'>
            {isBulkEdit
              ? (soloCambiarHora ? 'Cambiar Hora' : 'Reprogramar Eventos')
              : 'Reprogramar'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ReprogramarEventoModal
