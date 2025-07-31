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
  Alert,
  TextField,
  InputAdornment
} from '@mui/material'
import { Search } from '@mui/icons-material'

interface Laboratorista {
  id: string
  name: string
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
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    if (open) {
      fetchLaboratoristas()
      setSelectedLaboratoristas([])
      setSearchText('')
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

  const filteredLaboratoristas = laboratoristas.filter(laboratorista =>
    laboratorista.name.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
        <DialogTitle>
          {isBulkEdit ? 'Asignar Laboratoristas a Eventos Seleccionados' : 'Asignar Laboratorista'}
        </DialogTitle>
        <DialogContent sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
          {isBulkEdit && (
            <Alert severity='info' sx={{ mb: 2 }}>
              Los laboratoristas seleccionados serán asignados a todos los eventos seleccionados
            </Alert>
          )}

          <TextField
            fullWidth
            placeholder='Buscar laboratorista...'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search />
                </InputAdornment>
              )
            }}
          />

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : filteredLaboratoristas.length > 0 ? (
              <List>
                {filteredLaboratoristas.map(laboratorista => (
                  <ListItem key={laboratorista.id} divider>
                    <ListItemText
                      primary={laboratorista.name}
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
            ) : laboratoristas.length > 0 ? (
              <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                No se encontraron laboratoristas que coincidan con la búsqueda
              </Typography>
            ) : (
              <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
                No hay laboratoristas disponibles
              </Typography>
            )}
          </Box>
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
