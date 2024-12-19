import { Box, Grid, Typography, TextField } from '@mui/material'

const Header2 = () => {
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
        Navegador Detalle de RCM
      </Typography>

      {/* Fila de Inputs */}
      <Grid container spacing={2}>
        {/* Primera fila */}
        <Grid item xs={3}>
          <TextField label='Fecha Codificación' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField label='Fecha Desde' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField label='Fecha Hasta' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField label='Vencimiento' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>

        {/* Segunda fila */}
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

export default Header2
