import { Box, Button, Grid, TextField, Typography, Chip } from '@mui/material'

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
      {/* Fila 1: Título y botón */}
      <Grid container spacing={2} alignItems='center' sx={{ mb: 4 }}>
        <Grid item xs={3}>
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Codificación
          </Typography>
        </Grid>
        <Grid item xs={6}></Grid> {/* Espacio invisible */}
        <Grid item xs={3} display='flex' justifyContent='flex-end'>
          <Button variant='contained' color='primary' startIcon={<i className='ri-add-line' />}>
            Nuevo Registro
          </Button>
        </Grid>
      </Grid>

      {/* Fila 2: Inputs principales */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={3}>
          <TextField label='Orden de Trabajo' size='small' fullWidth />
        </Grid>
        <Grid item xs={2}>
          <TextField label='N° Obra' size='small' fullWidth />
        </Grid>
        <Grid item xs={3}>
          <TextField label='Nombre Obra' size='small' fullWidth />
        </Grid>
        <Grid item xs={2}>
          <TextField label='Cliente' size='small' fullWidth />
        </Grid>
        <Grid item xs={2}>
          <Chip
            label='En Proceso'
            sx={{
              backgroundColor: '#ffe8d5',
              color: '#ff9f43',
              fontWeight: 'bold',
              height: '32px',
              display: 'flex',
              alignItems: 'center'
            }}
          />
        </Grid>
      </Grid>

      {/* Fila 3: Tipo de Servicio */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={4}>
          <TextField label='Tipo Servicio' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField label='Muestreado por' size='small' fullWidth />
        </Grid>
        <Grid item xs={4}>
          <TextField label='Laboratorista' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
      </Grid>

      {/* Fila 4: Región, Comuna y Mandante */}
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <TextField label='Región' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField label='Comuna' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField label='Mandante' size='small' fullWidth />
        </Grid>
      </Grid>
    </Box>
  )
}

export default Header
