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

interface CambiarEstadoModalProps {
  open: boolean
  onClose: () => void
  eventId: string | null
  estadoActual: string
  onCambiarEstado: (nuevoEstado: string, observacionEliminada?: string) => Promise<void>
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

const CambiarEstadoModal = ({
  open,
  onClose,
  estadoActual,
  onCambiarEstado,
  isBulkEdit = false
}: CambiarEstadoModalProps) => {
  const [selectedEstado, setSelectedEstado] = useState<string>(estadoActual)
  const [observacionEliminada, setObservacionEliminada] = useState<string>('')
  const [error, setError] = useState<string>('')

  const handleSubmit = async () => {
    try {
      // Validar que si el estado es ELIMINADA, se haya ingresado una observación
      if (selectedEstado === 'ELIMINADA' && !observacionEliminada.trim()) {
        setError('Debe ingresar un motivo para eliminar el evento')
        return
      }

      await onCambiarEstado(selectedEstado, selectedEstado === 'ELIMINADA' ? observacionEliminada : undefined)
      onClose()
      // Limpiar campos al cerrar
      setObservacionEliminada('')
      setError('')
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Error al cambiar el estado')
      }
    }
  }

  const handleClose = () => {
    // Limpiar campos al cerrar
    setSelectedEstado(estadoActual)
    setObservacionEliminada('')
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

        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          disabled={selectedEstado === estadoActual || (selectedEstado === 'ELIMINADA' && !observacionEliminada.trim())}
        >
          {isBulkEdit ? 'Cambiar Estado de Eventos' : 'Cambiar Estado'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CambiarEstadoModal
