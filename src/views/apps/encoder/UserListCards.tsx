// MUI Imports
import Grid from '@mui/material/Grid'
import { Card, CardContent, Typography } from '@mui/material'

// Interface props
interface UserListCardsProps {
  otData?: any
  loading?: boolean
}

const UserListCards = ({ otData, loading }: UserListCardsProps) => {
  // Si está cargando o no hay datos, mostrar un mensaje
  if (loading || !otData) {
    return null
  }

  // Calcular el número de servicios basado en el tipo de OT
  const calcularTotalServicios = () => {
    if (!otData) return 0

    switch (otData.tipoOT) {
      case 'DENSIDADES':
        return 2 // Por ejemplo, densidad y proctor
      case 'HORMIGON_FRESCO':
        return 2 // Por ejemplo, toma de muestra y cono abrams
      case 'RETIRO_PROBETA':
        return 1 // Solo el retiro
      case 'ACEPTACION_VISITA':
        return 1 // Solo la aceptación
      default:
        return 1
    }
  }

  const getOtType = (tipo: string) => {
    switch (tipo) {
      case 'DENSIDADES':
        return 'Control de Compactación'
      case 'HORMIGON_FRESCO':
        return 'Muestreo de Hormigón Fresco'
      case 'RETIRO_PROBETA':
        return 'Retiro de Probeta'
      case 'ACEPTACION_VISITA':
        return 'Aceptación de Visita'
      default:
        return tipo || 'N/A'
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant='subtitle2' color='textSecondary'>
              Total Servicios
            </Typography>
            <Typography variant='h4' color='primary' fontWeight='bold'>
              {calcularTotalServicios()}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant='subtitle2' color='textSecondary'>
              Tipo de OT
            </Typography>
            <Typography variant='h6' color='primary' fontWeight='bold'>
              {getOtType(otData.tipoOT)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant='subtitle2' color='textSecondary'>
              Cliente
            </Typography>
            <Typography variant='h6' color='primary' fontWeight='bold' noWrap>
              {otData.agenda?.cliente?.nombreCliente || 'N/A'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant='subtitle2' color='textSecondary'>
              Obra
            </Typography>
            <Typography variant='h6' color='primary' fontWeight='bold' noWrap>
              {otData.agenda?.obra?.nombreObra || 'N/A'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default UserListCards
