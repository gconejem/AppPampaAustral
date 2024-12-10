import { Box, Grid, TextField, Typography } from '@mui/material'

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
      {/* Título */}
      <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 4 }}>
        Navegador Global de RCM
      </Typography>

      {/* Primera Fila de Inputs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <TextField label='Fecha Codificación' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField label='Fecha desde' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField label='Fecha hasta' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
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
