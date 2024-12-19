import React, { useState } from 'react'

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Grid } from '@mui/material'

interface ResultadosPopupProps {
  open: boolean
  onClose: () => void
  ensayador: string
  onSave: (resultados: { resultado1: string; resultado2: string }) => void
}

const ResultadosPopup: React.FC<ResultadosPopupProps> = ({ open, onClose, ensayador, onSave }) => {
  const [resultado1, setResultado1] = useState('')
  const [resultado2, setResultado2] = useState('')

  const handleSave = () => {
    onSave({ resultado1, resultado2 })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          width: '400px',
          maxWidth: '100%'
        }
      }}
    >
      <DialogTitle>Resultados</DialogTitle>
      <DialogContent>
        <Typography variant='body1' sx={{ mb: 2 }}>
          Ensayador: <strong>{ensayador}</strong>
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField label='Resultado 1' value={resultado1} onChange={e => setResultado1(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={6}>
            <TextField label='Resultado 2' value={resultado2} onChange={e => setResultado2(e.target.value)} fullWidth />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary'>
          Cerrar
        </Button>
        <Button onClick={handleSave} variant='contained' color='primary'>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ResultadosPopup
