// MUI Imports
import { Grid, Chip, TextField, Card, CardContent, CardHeader, Skeleton, Box, Typography } from '@mui/material'

// Utils
import { formatDateForDisplay } from '@/utils/dateUtils'

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
        <CardHeader title='Codificación' />
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

  // En esta pantalla el estado siempre es "En Proceso"
  const chipProps = {
    label: 'En Proceso',
    sx: {
      bgcolor: '#FFF4E5',
      color: '#C87941',
      fontWeight: 'bold',
      borderRadius: '16px',
      padding: '10px 22px',
      fontSize: '14px',
      textAlign: 'center'
    }
  }

  // Formatear el tipo de OT con el formato "R-12-27 Muestreo de Materiales"
  const formatTipoOT = () => {
    if (!otData.tipoOT) return ''
    const codigo = otData.tipoOT.codigo || ''
    const descripcion = otData.tipoOT.descripcion || ''
    return codigo && descripcion ? `${codigo} ${descripcion}` : codigo || descripcion
  }

  // Formatear obra: "numero | nombre"
  const formatObra = () => {
    const numeroObra = otData.agenda?.obra?.numeroObra || ''
    let nombreObra = otData.agenda?.obra?.nombreObra || ''

    // Limpiar el nombre de la obra eliminando comuna y región si están concatenadas
    if (nombreObra) {
      // Remover " - Comuna de..." y " - Región del..."
      nombreObra = nombreObra.split(' - Comuna de')[0].split(' - Región del')[0].split(' - Region del')[0]
    }

    return numeroObra && nombreObra ? `${numeroObra} | ${nombreObra}` : numeroObra || nombreObra
  }

  // Formatear cliente: "nombre | rut"
  const formatCliente = () => {
    const nombreCliente = otData.agenda?.cliente?.nombreCliente || ''
    const rutCliente = otData.agenda?.cliente?.rut || ''
    return nombreCliente && rutCliente ? `${nombreCliente} | ${rutCliente}` : nombreCliente || rutCliente
  }

  // Formatear región/ciudad: "región / comuna"
  const formatRegionCiudad = () => {
    const region = otData.agenda?.obra?.region || ''
    const comuna = otData.agenda?.obra?.comuna || ''
    return region && comuna ? `${region} / ${comuna}` : region || comuna
  }

  return (
    <Card>
      <Box sx={{ p: 4, position: 'relative' }}>
        {/* Chip de estado en la esquina superior derecha */}
        <Chip
          label={chipProps.label}
          sx={{
            ...chipProps.sx,
            position: 'absolute',
            top: 20,
            right: 20
          }}
        />

        {/* Título */}
        <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 4 }}>
          Datos de la Orden de Trabajo
        </Typography>

        {/* Grid de campos */}
        <Grid container spacing={4}>
          {/* Primera fila */}
          <Grid item xs={3}>
            <Box>
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                N° OT
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                {/* Vacío por ahora según requerimientos */}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Box>
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                TIPO OT
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                {formatTipoOT()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Box>
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                FECHA OT
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                {otData.createdAt ? formatDateForDisplay(otData.createdAt) : ''}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Box>
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                MUESTREADO POR
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                {otData.user?.name || 'No asignado'}
              </Typography>
            </Box>
          </Grid>

          {/* Segunda fila */}
          <Grid item xs={3}>
            <Box>
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                OBRA
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                {formatObra()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Box>
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                CLIENTE
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                {formatCliente()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Box>
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                REGIÓN / CIUDAD
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                {formatRegionCiudad()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={3}>
            <Box>
              <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                MANDANTE
              </Typography>
              <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                {otData.agenda?.obra?.mandante || ''}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Card>
  )
}

export default Header
