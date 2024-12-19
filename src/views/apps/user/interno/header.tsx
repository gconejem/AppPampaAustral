import React from 'react'

import { Grid, Box, Card, CardContent, Typography, Button, Chip } from '@mui/material'

const Header = () => {
  return (
    <Card sx={{ marginBottom: 4, padding: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems='center'>
          {/* Sección 4: Título y estados principales */}
          <Grid item xs={4} display='flex' alignItems='center' gap={2}>
            <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
              RCM
            </Typography>
            <Chip label='180280' sx={{ backgroundColor: '#e0e0e0', color: '#424242', fontWeight: 'bold' }} />
            <Chip label='Codificado' sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontWeight: 'bold' }} />
            <Chip label='Sin Inicio' sx={{ backgroundColor: '#e8f5e9', color: '#388e3c', fontWeight: 'bold' }} />
          </Grid>

          {/* Sección 6: Estados secundarios */}
          <Grid item xs={6} display='flex' alignItems='center' gap={2}>
            <Chip label='OT: 114793' sx={{ backgroundColor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }} />
            <Chip label='Obra: 8175' sx={{ backgroundColor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }} />
            <Chip label='Área: Hormigón' sx={{ backgroundColor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }} />
            <Chip
              label='Familia: Hormigón Fresco'
              sx={{ backgroundColor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }}
            />
          </Grid>

          {/* Sección 2: Botón de cancelar */}
          <Grid item xs={2} display='flex' justifyContent='flex-end'>
            <Button variant='outlined' color='error' sx={{ fontWeight: 'bold', textTransform: 'none' }}>
              Cancelar
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Header
