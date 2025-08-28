import { useState, useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import es from 'date-fns/locale/es'

interface ReprogramarEventoModalProps {
  open: boolean
  onClose: () => void
  eventId: string | null
  onReprogramar: (fechaInicio: Date, fechaFin: Date) => Promise<void>
  fechaInicioActual?: Date
  fechaFinActual?: Date
  isBulkEdit?: boolean
}

const ReprogramarEventoModal = ({
  open,
  onClose,
  onReprogramar,
  fechaInicioActual,
  fechaFinActual,
  isBulkEdit = false
}: ReprogramarEventoModalProps) => {
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null)
  const [fechaFin, setFechaFin] = useState<Date | null>(null)
  const [error, setError] = useState<string>('')
  const [openSnackbar, setOpenSnackbar] = useState(false)

  useEffect(() => {
    if (open) {
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
    }
  }, [open, fechaInicioActual, fechaFinActual])

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
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
      await onReprogramar(fechaInicio, fechaFin)
      setOpenSnackbar(true)
      // Limpiar valores después de una reprogramación exitosa
      setFechaInicio(null)
      setFechaFin(null)
      setError('')
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      setError('Error al reprogramar el evento')
      console.error('Error:', error)
    }
  }

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false)
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
        <DialogTitle>{isBulkEdit ? 'Reprogramar Eventos Seleccionados' : 'Reprogramar Evento'}</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {isBulkEdit && (
                <Alert severity='info' sx={{ mb: 2 }}>
                  Los cambios se aplicarán a todos los eventos seleccionados
                </Alert>
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
            {isBulkEdit ? 'Reprogramar Eventos' : 'Reprogramar'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity='success' sx={{ width: '100%' }}>
          {isBulkEdit ? '¡Eventos reprogramados exitosamente!' : '¡Evento reprogramado exitosamente!'}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ReprogramarEventoModal
