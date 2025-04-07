// MUI Imports
import { Grid, Chip, TextField, Card, CardContent, CardHeader, Skeleton, Box, Typography } from '@mui/material'

// Interfaces
interface HeaderProps {
  otData?: any
  loading: boolean
}

const Header = ({ otData, loading }: HeaderProps) => {
  // Si está cargando o no hay datos, mostrar esqueletos
  if (loading) {
    return (
      <Card>
        <CardHeader title={<Skeleton width={300} height={30} />} action={<Skeleton width={100} height={40} />} />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Skeleton variant='rectangular' height={150} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  // Si no hay datos de OT
  if (!otData) {
    return (
      <Card>
        <CardHeader title='Control de Muestras' />
        <CardContent>
          <Box textAlign='center' py={3}>
            <Typography variant='h6'>No se ha seleccionado ninguna orden de trabajo</Typography>
            <Typography variant='body2' color='textSecondary'>
              Por favor, seleccione una OT desde la tabla de órdenes de trabajo
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Obtener el estado de la OT para mostrar el chip apropiado
  const getChipProps = () => {
    switch (otData.estado) {
      case 'PENDIENTE':
        return {
          label: 'Pendiente',
          sx: {
            bgcolor: '#fff3cd',
            color: '#856404',
            fontWeight: 'bold',
            borderRadius: '4px',
            padding: '8px 16px',
            border: '1px solid #856404',
            fontSize: '14px',
            textAlign: 'center'
          }
        }
      case 'EN_PROCESO':
      case 'EN PROCESO':
        return {
          label: 'En Proceso',
          sx: {
            bgcolor: '#fff3cd',
            color: '#856404',
            fontWeight: 'bold',
            borderRadius: '4px',
            padding: '8px 16px',
            border: '1px solid #856404',
            fontSize: '14px',
            textAlign: 'center'
          }
        }
      case 'FINALIZADO':
        return {
          label: 'Finalizado',
          sx: {
            bgcolor: '#d4edda',
            color: '#155724',
            fontWeight: 'bold',
            borderRadius: '4px',
            padding: '8px 16px',
            border: '1px solid #155724',
            fontSize: '14px',
            textAlign: 'center'
          }
        }
      default:
        return {
          label: otData.estado || 'Sin Estado',
          sx: {
            bgcolor: '#f8f9fa',
            color: '#6c757d',
            fontWeight: 'bold',
            borderRadius: '4px',
            padding: '8px 16px',
            border: '1px solid #6c757d',
            fontSize: '14px',
            textAlign: 'center'
          }
        }
    }
  }

  const chipProps = getChipProps()

  return (
    <Card>
      <CardHeader title='Control de Muestras' action={<Chip label={chipProps.label} sx={chipProps.sx} />} />
      <CardContent>
        <Grid container spacing={3}>
          {/* Primera fila */}
          <Grid item xs={4}>
            <TextField
              label='Orden de Trabajo'
              value={otData.clave || ''}
              variant='outlined'
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={4}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label='N° Obra'
                  value={otData.agenda?.obra?.numeroObra || ''}
                  variant='outlined'
                  fullWidth
                  size='small'
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Nombre Obra'
                  value={otData.agenda?.obra?.nombreObra || ''}
                  variant='outlined'
                  fullWidth
                  size='small'
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={4}>
            <TextField
              label='Cliente'
              value={otData.agenda?.cliente?.nombreCliente || ''}
              variant='outlined'
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Segunda fila */}
          <Grid item xs={4}>
            <TextField
              label='Fecha de Muestreo'
              value={otData.createdAt ? new Date(otData.createdAt).toLocaleDateString() : ''}
              variant='outlined'
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label='Muestreado por...'
              value={otData.user?.name || 'No asignado'}
              variant='outlined'
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label='Comuna'
              value={otData.agenda?.comuna || ''}
              variant='outlined'
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Tercera fila */}
          <Grid item xs={4}>
            <TextField
              label='Fecha de Ingreso'
              value={otData.createdAt ? new Date(otData.createdAt).toLocaleDateString() : ''}
              variant='outlined'
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={4}>
            <TextField
              label='Laboratorista'
              value={otData.user?.name || 'No asignado'}
              variant='outlined'
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
            />
          </Grid>

          {/* Cuarta fila */}
          <Grid item xs={4}>
            <TextField
              label='Mandante'
              value={otData.agenda?.obra?.mandante || ''}
              variant='outlined'
              fullWidth
              size='small'
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Header
