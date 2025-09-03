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

    const codigo = otData.tipoOT?.codigo
    switch (codigo) {
      case 'R-12-03': // Control de Compactación
        return 2 // Por ejemplo, densidad y proctor
      case 'R-12-39': // Muestreo de Hormigón Fresco
        return 2 // Por ejemplo, toma de muestra y cono abrams
      case 'R-12-99': // Retiro de Probeta
        return 1 // Solo el retiro
      default:
        return 1
    }
  }

  const getOtType = (tipoOT: any) => {
    if (typeof tipoOT === 'object' && tipoOT?.descripcion) {
      return tipoOT.descripcion
    }
    return 'N/A'
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
