import { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Typography,
  CircularProgress,
  Box,
  Snackbar,
  Alert
} from '@mui/material'

interface Laboratorista {
  id: string
  nombre: string
  email: string
  rol: string
}

interface AsignarLaboratoristaModalProps {
  open: boolean
  onClose: () => void
  eventId: string | null
  onAssign: (laboratoristas: string[]) => void
  isBulkEdit?: boolean
}

const AsignarLaboratoristaModal = ({
  open,
  onClose,
  eventId,
  onAssign,
  isBulkEdit = false
}: AsignarLaboratoristaModalProps) => {
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
  const [selectedLaboratoristas, setSelectedLaboratoristas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      fetchLaboratoristas()
    }
  }, [open])

  const fetchLaboratoristas = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/users/laboratoristas')

      if (!response.ok) throw new Error('Error al obtener laboratoristas')

      const data = await response.json()

      setLaboratoristas(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (laboratistaId: string) => {
    setSelectedLaboratoristas(prev => {
      if (prev.includes(laboratistaId)) {
        return prev.filter(id => id !== laboratistaId)
      } else {
        return [...prev, laboratistaId]
      }
    })
  }

  const handleAssign = () => {
    onAssign(selectedLaboratoristas)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      onClose()
    }, 1500)
  }

  const handleCloseSnackbar = () => {
    setShowSuccess(false)
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          {isBulkEdit ? 'Asignar Laboratoristas a Eventos Seleccionados' : 'Asignar Laboratorista'}
        </DialogTitle>
        <DialogContent>
          {isBulkEdit && (
            <Alert severity='info' sx={{ mb: 2 }}>
              Los laboratoristas seleccionados serán asignados a todos los eventos seleccionados
            </Alert>
          )}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : laboratoristas.length > 0 ? (
            <List>
              {laboratoristas.map(laboratorista => (
                <ListItem key={laboratorista.id} divider>
                  <ListItemText
                    primary={laboratorista.nombre}
                    secondary={
                      <>
                        <Typography component='span' variant='body2' color='text.primary'>
                          {laboratorista.email}
                        </Typography>
                        <br />
                        {laboratorista.rol}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      edge='end'
                      onChange={() => handleToggle(laboratorista.id)}
                      checked={selectedLaboratoristas.includes(laboratorista.id)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
              No hay laboratoristas disponibles
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAssign} variant='contained' disabled={selectedLaboratoristas.length === 0}>
            {isBulkEdit ? 'Asignar a Eventos' : 'Asignar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={1500}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity='success' sx={{ width: '100%' }}>
          {isBulkEdit
            ? `Laboratorista${selectedLaboratoristas.length > 1 ? 's' : ''} asignado${selectedLaboratoristas.length > 1 ? 's' : ''} a los eventos seleccionados`
            : `Laboratorista${selectedLaboratoristas.length > 1 ? 's' : ''} asignado${selectedLaboratoristas.length > 1 ? 's' : ''} correctamente`}
        </Alert>
      </Snackbar>
    </>
  )
}

export default AsignarLaboratoristaModal
