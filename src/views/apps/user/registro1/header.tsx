'use client'

import { Box, Grid, TextField, Typography, Button } from '@mui/material'

// Importa el componente PickersRange
import PickersRange from './date'

const Header = () => {
  return (
    <Box
      sx={{
        p: 4,
        backgroundColor: 'white',
        boxShadow: 2,
        borderRadius: 2,
        mb: 4 // Margen inferior para separación
      }}
    >
      {/* Título y Botón */}
      <Grid container alignItems='center' sx={{ mb: 4 }}>
        <Grid item xs={3}>
          <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
            Navegador Global de RCM
          </Typography>
        </Grid>
        <Grid item xs={6} />
        <Grid item xs={3} sx={{ textAlign: 'right' }}>
          <Button variant='contained' color='primary' size='large' sx={{ fontWeight: '' }}>
            Informes
          </Button>
        </Grid>
      </Grid>

      {/* Primera Fila de Inputs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <TextField label='Fecha Codificación' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={8}>
          {/* Rango de Fechas usando PickersRange */}
          <PickersRange />
        </Grid>
      </Grid>

      {/* Segunda Fila de Inputs */}
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <TextField label='Área' size='small' fullWidth />
        </Grid>
        <Grid item xs={3}>
          <TextField label='Familia' size='small' fullWidth />
        </Grid>
        <Grid item xs={3}>
          <TextField label='Estado Operativo' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField label='Estado Administrativo' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Header
