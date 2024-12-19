// MUI Imports
import { Grid, Chip, Button, TextField, Card, CardContent, CardHeader } from '@mui/material'

const Header = () => {
  return (
    <Card>
      <CardHeader
        title='Control de Muestras'
        action={
          <Chip
            label='En Proceso'
            sx={{
              bgcolor: '#fff3cd',
              color: '#856404',
              fontWeight: 'bold',
              borderRadius: '4px',
              padding: '8px 16px',
              border: '1px solid #856404',
              fontSize: '14px',
              textAlign: 'center'
            }}
          />
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Primera fila */}
          <Grid item xs={4}>
            <TextField label='Orden de Trabajo' defaultValue='12345' variant='outlined' fullWidth size='small' />
          </Grid>
          <Grid item xs={4}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label='N° Obra' defaultValue='54321' variant='outlined' fullWidth size='small' />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Nombre Obra'
                  defaultValue='Edificio Central'
                  variant='outlined'
                  fullWidth
                  size='small'
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={4}>
            <TextField label='Cliente' defaultValue='John Doe' variant='outlined' fullWidth size='small' />
          </Grid>

          {/* Segunda fila */}
          <Grid item xs={4}>
            <TextField label='Fecha de Muestreo' defaultValue='01/11/2023' variant='outlined' fullWidth size='small' />
          </Grid>
          <Grid item xs={4}>
            <TextField label='Muestreado por...' defaultValue='Técnico 1' variant='outlined' fullWidth size='small' />
          </Grid>
          <Grid item xs={4}>
            <TextField label='Comuna' defaultValue='Santiago' variant='outlined' fullWidth size='small' />
          </Grid>

          {/* Tercera fila */}
          <Grid item xs={4}>
            <TextField label='Fecha de Ingreso' defaultValue='02/11/2023' variant='outlined' fullWidth size='small' />
          </Grid>

          <Grid item xs={4}>
            <TextField label='Laboratorista' defaultValue='Luis Pérez' variant='outlined' fullWidth size='small' />
          </Grid>

          {/* Cuarta fila */}
          <Grid item xs={4}>
            <TextField label='Mandante' defaultValue='Empresa XYZ' variant='outlined' fullWidth size='small' />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Header
