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
      <Typography variant='h5' sx={{ fontWeight: '', mb: 4 }}>
        Navegador Global
      </Typography>

      {/* Fila de Inputs */}
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <TextField label='Intervalo de Fechas' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={2}>
          <TextField label='Área' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={2}>
          <TextField label='Familia' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField label='Estado OP' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField label='Estado Adm' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Header
