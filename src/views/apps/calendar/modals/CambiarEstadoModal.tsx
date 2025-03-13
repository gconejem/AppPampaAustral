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

interface CambiarEstadoModalProps {
  open: boolean
  onClose: () => void
  eventId: string | null
  estadoActual: string
  onCambiarEstado: (nuevoEstado: string) => Promise<void>
  isBulkEdit?: boolean
}

const CambiarEstadoModal = ({
  open,
  onClose,
  estadoActual,
  onCambiarEstado,
  isBulkEdit = false
}: CambiarEstadoModalProps) => {
  const [selectedEstado, setSelectedEstado] = useState<string>(estadoActual)
  const [error, setError] = useState<string>('')

  const handleSubmit = async () => {
    try {
      await onCambiarEstado(selectedEstado)
      onClose()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Error al cambiar el estado')
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>{isBulkEdit ? 'Cambiar Estado de Eventos Seleccionados' : 'Cambiar Estado del Evento'}</DialogTitle>
      <DialogContent>
        {isBulkEdit && (
          <Alert severity='info' sx={{ mb: 2 }}>
            El estado seleccionado se aplicará a todos los eventos seleccionados
          </Alert>
        )}
        <FormControl fullWidth>
          <InputLabel id='estado-select-label'>Estado</InputLabel>
          <Select
            labelId='estado-select-label'
            value={selectedEstado}
            label='Estado'
            onChange={e => setSelectedEstado(e.target.value)}
          >
            <MenuItem value='AGENDADA'>Agendada</MenuItem>
            <MenuItem value='COMPLETADA'>Completada</MenuItem>
            <MenuItem value='SUSPENDIDA'>Suspendida</MenuItem>
            <MenuItem value='REPROGRAMADA'>Reprogramada</MenuItem>
          </Select>
        </FormControl>
        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant='contained' disabled={selectedEstado === estadoActual}>
          {isBulkEdit ? 'Cambiar Estado de Eventos' : 'Cambiar Estado'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CambiarEstadoModal
