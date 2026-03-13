// MUI Imports
import { Grid, Chip, TextField, Card, CardContent, CardHeader, Skeleton, Box, Typography, Stepper, Step, StepLabel, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckIcon from '@mui/icons-material/Check'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// Utils
import { formatDateForDisplay } from '@/utils/dateUtils'

// Interfaces
interface HeaderProps {
  otData?: any
  loading: boolean
  activeStep?: number
  onStepClick?: (step: number) => void
  canAdvanceToStep2?: boolean
  hasSavedRcms?: boolean
  selectedAreaNombre?: string
  selectedTipoServicioNombre?: string
  // Contadores en tiempo real
  borradores?: number
  pendientes?: number
  agrupados?: number
  totalRcms?: number
}

const Header = ({ otData, loading, activeStep = 1, onStepClick, canAdvanceToStep2 = false, hasSavedRcms = false, selectedAreaNombre, selectedTipoServicioNombre, borradores = 0, pendientes = 0, agrupados = 0, totalRcms = 0 }: HeaderProps) => {
  // Hooks
  const params = useParams()
  const router = useRouter()
  const lang = params?.lang || 'es'

  // State para el diálogo de confirmación
  const [openDialog, setOpenDialog] = useState(false)

  // Función para abrir el diálogo
  const handleBackClick = () => {
    setOpenDialog(true)
  }

  // Función para cerrar el diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  // Función para confirmar y volver a OTs
  const handleConfirmBack = () => {
    setOpenDialog(false)
    router.push(`/${lang}/apps/otmanagement`)
  }

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
    <>
      {/* Sección superior: Título, Stepper y Botón */}
      <Box sx={{ mb: 4 }}>
        {/* Fila superior: Título y Botón */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

            <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
              Codificación de Muestras - RCM
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={handleBackClick}
              variant='outlined'
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                px: 3,
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'text.primary',
                  color: 'text.primary'
                }
              }}
            >
              Volver a OTs
            </Button>
            <Button
              variant='contained'
              color='primary'
              startIcon={<CheckIcon />}
              sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
              disabled={!hasSavedRcms}
            >
              Finalizar Codificación
            </Button>
          </Box>
        </Box>

        {/* Pastillas de contadores */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Borradores */}
          <Chip
            size='small'
            label={`Borradores: ${borradores}`}
            sx={{
              bgcolor: '#E3F2FD',
              color: '#1565C0',
              fontWeight: 600,
              fontSize: '12px',
              height: 26,
              borderRadius: '13px',
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
          {/* Pendientes */}
          <Chip
            size='small'
            label={`Pendientes: ${pendientes}`}
            sx={{
              bgcolor: '#FFF3E0',
              color: '#E65100',
              fontWeight: 600,
              fontSize: '12px',
              height: 26,
              borderRadius: '13px',
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
          {/* Agrupados */}
          <Chip
            size='small'
            label={`Agrupados: ${agrupados}`}
            sx={{
              bgcolor: '#E8F5E9',
              color: '#2E7D32',
              fontWeight: 600,
              fontSize: '12px',
              height: 26,
              borderRadius: '13px',
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
          {/* Total RCMs */}
          <Chip
            size='small'
            label={`Total RCMs: ${totalRcms}`}
            sx={{
              bgcolor: '#F3E5F5',
              color: '#6A1B9A',
              fontWeight: 600,
              fontSize: '12px',
              height: 26,
              borderRadius: '13px',
              '& .MuiChip-label': { px: 1.5 }
            }}
          />
        </Box>
      </Box>

      {/* Card de Datos de la Orden de Trabajo */}
      <Card>
        <Box sx={{ p: 6, position: 'relative' }}>
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

          {/* Título y Contadores */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
              Datos de la Orden de Trabajo
            </Typography>
          </Box>

          {/* Grid de campos */}
          <Grid container spacing={4}>
            {/* Primera fila - 5 columnas */}
            <Grid item xs={2.4}>
              <Box>
                <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                  N° OT
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  {/* Vacío por ahora según requerimientos */}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={2.4}>
              <Box>
                <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                  TIPO OT
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  {formatTipoOT()}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={2.4}>
              <Box>
                <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                  FECHA OT
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  {otData.createdAt ? formatDateForDisplay(otData.createdAt) : ''}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={2.4}>
              <Box>
                <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                  MUESTREADO POR
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  {otData.user?.name || 'No asignado'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={2.4}>
              <Box>
                <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                  ID SOLICITUD
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  {/* Por ahora solo encabezado */}
                </Typography>
              </Box>
            </Grid>

            {/* Segunda fila */}
            <Grid item xs={4}>
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

            <Grid item xs={2.5}>
              <Box>
                <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                  REGIÓN / CIUDAD
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                  {formatRegionCiudad()}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={2.5}>
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

      {/* Mostrar Área y Tipo de Servicio seleccionados cuando estamos en paso 2 o superior */}
      {activeStep >= 2 && selectedAreaNombre && selectedTipoServicioNombre && (
        <Card sx={{ mt: 3 }}>
          <Box sx={{ p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <Box>
                  <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                    ÁREA
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                    {selectedAreaNombre}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5, display: 'block' }}>
                    TIPO DE SERVICIO
                  </Typography>
                  <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
                    {selectedTipoServicioNombre}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}

      {/* Diálogo de confirmación */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          ¿Está seguro que desea volver a OTs?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Si vuelve a las OTs sin finalizar la codificación, se perderá toda la información ingresada que no haya sido guardada.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmBack} color="error" variant="contained" autoFocus>
            Volver a OTs
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Header
