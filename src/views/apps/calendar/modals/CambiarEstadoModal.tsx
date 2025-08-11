import { useState } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Alert from '@mui/material/Alert'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'

interface CambiarEstadoModalProps {
  open: boolean
  onClose: () => void
  eventId: string | null
  estadoActual: string
  onCambiarEstado: (nuevoEstado: string, observacionEliminada?: string, motivoSuspension?: string, observacionSuspendida?: string) => Promise<void>
  isBulkEdit?: boolean
}

// Estados disponibles del enum EstadoAgenda
const ESTADOS_AGENDA = {
  CREADA: 'Creada',
  ELIMINADA: 'Eliminada',
  AGENDADA: 'Agendada',
  SUSPENDIDA: 'Suspendida',
  SUSPENDIDA_TERRENO: 'Suspendida Terreno',
  COMPLETADA: 'Completada',
  EN_REVISION: 'En Revisión',
  ANULADA: 'Anulada',
  RECIBIDA_OK: 'Recibida OK',
  CODIFICADA: 'Codificada'
}

// Motivos de suspensión del enum MotivoSuspension
const MOTIVOS_SUSPENSION = {
  CLIMA: 'Clima',
  TERRENO_NO_PREPARADO: 'Terreno No Preparado',
  PROBLEMA_PLANTA: 'Problema Planta',
  PROBLEMA_INTERNO_PA: 'Problema Interno PA',
  ACREDITACION_PERSONAL: 'Acreditación Personal',
  OTRO: 'Otro (Especificar)'
}

const CambiarEstadoModal = ({
  open,
  onClose,
  estadoActual,
  onCambiarEstado,
  isBulkEdit = false
}: CambiarEstadoModalProps) => {
  const [selectedEstado, setSelectedEstado] = useState<string>(estadoActual)
  const [observacionEliminada, setObservacionEliminada] = useState<string>('')
  const [motivoSuspension, setMotivoSuspension] = useState<string>('')
  const [observacionSuspendida, setObservacionSuspendida] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSubmit = async () => {
    if (isLoading) return // Prevenir múltiples clicks

    setError('')

    // Validar que si el estado es ELIMINADA, se haya ingresado una observación
    if (selectedEstado === 'ELIMINADA' && !observacionEliminada.trim()) {
      setError('Debe ingresar un motivo para eliminar el evento')
      return
    }

    // Validar que si el estado es SUSPENDIDA, se haya seleccionado un motivo
    if (selectedEstado === 'SUSPENDIDA' && !motivoSuspension) {
      setError('Debe seleccionar un motivo de suspensión')
      return
    }

    // Validar que si el motivo es OTRO, se haya ingresado una observación
    if (selectedEstado === 'SUSPENDIDA' && motivoSuspension === 'OTRO' && !observacionSuspendida.trim()) {
      setError('Debe especificar el motivo de suspensión')
      return
    }

    try {
      setIsLoading(true)

      // Esperar a que se complete la operación completamente
      await onCambiarEstado(
        selectedEstado,
        selectedEstado === 'ELIMINADA' ? observacionEliminada : undefined,
        selectedEstado === 'SUSPENDIDA' ? motivoSuspension : undefined,
        selectedEstado === 'SUSPENDIDA' && motivoSuspension === 'OTRO' ? observacionSuspendida : undefined
      )

      // Solo limpiar campos y cerrar si la operación fue exitosa
      setObservacionEliminada('')
      setMotivoSuspension('')
      setObservacionSuspendida('')
      setError('')
      onClose()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Error al cambiar el estado')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // No permitir cerrar mientras está cargando
    if (isLoading) return

    // Limpiar campos al cerrar
    setSelectedEstado(estadoActual)
    setObservacionEliminada('')
    setMotivoSuspension('')
    setObservacionSuspendida('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{isBulkEdit ? 'Cambiar Estado de Eventos Seleccionados' : 'Cambiar Estado del Evento'}</DialogTitle>
      <DialogContent>
        {isBulkEdit && (
          <Alert severity='info' sx={{ mb: 2 }}>
            El estado seleccionado se aplicará a todos los eventos seleccionados
          </Alert>
        )}
        <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
          <InputLabel id='estado-select-label'>Estado</InputLabel>
          <Select
            labelId='estado-select-label'
            value={selectedEstado}
            label='Estado'
            onChange={e => setSelectedEstado(e.target.value)}
          >
            {Object.entries(ESTADOS_AGENDA).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedEstado === 'ELIMINADA' && (
          <TextField
            fullWidth
            label='Motivo de eliminación'
            multiline
            rows={3}
            value={observacionEliminada}
            onChange={e => setObservacionEliminada(e.target.value)}
            placeholder='Ingrese el motivo por el cual se elimina el evento'
            required
            sx={{ mb: 2 }}
          />
        )}

        {selectedEstado === 'SUSPENDIDA' && (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id='motivo-suspension-label'>Motivo de suspensión</InputLabel>
              <Select
                labelId='motivo-suspension-label'
                value={motivoSuspension}
                label='Motivo de suspensión'
                onChange={e => setMotivoSuspension(e.target.value)}
                required
              >
                {Object.entries(MOTIVOS_SUSPENSION).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {motivoSuspension === 'OTRO' && (
              <TextField
                fullWidth
                label='Especificar motivo'
                multiline
                rows={3}
                value={observacionSuspendida}
                onChange={e => setObservacionSuspendida(e.target.value)}
                placeholder='Ingrese el motivo específico de suspensión'
                required
                sx={{ mb: 2 }}
              />
            )}
          </>
        )}

        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={
            isLoading ||
            selectedEstado === estadoActual ||
            (selectedEstado === 'ELIMINADA' && !observacionEliminada.trim()) ||
            (selectedEstado === 'SUSPENDIDA' && !motivoSuspension) ||
            (selectedEstado === 'SUSPENDIDA' && motivoSuspension === 'OTRO' && !observacionSuspendida.trim())
          }
          startIcon={isLoading ? <CircularProgress size={20} color='inherit' /> : undefined}
        >
          {isLoading
            ? 'Actualizando...'
            : (isBulkEdit ? 'Cambiar Estado de Eventos' : 'Cambiar Estado')
          }
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CambiarEstadoModal
