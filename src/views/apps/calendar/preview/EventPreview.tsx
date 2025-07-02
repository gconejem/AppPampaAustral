import { Dialog, Typography, Box, IconButton, Button, Checkbox, FormControlLabel, Grid } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { ROLES_CONTACTO } from '@/constants/roles'

interface EventPreviewProps {
  open: boolean
  onClose: () => void
  event: any | null
}

const EventPreview = ({ open, onClose, event }: EventPreviewProps) => {
  console.log('EventPreview props:', { open, event })
  console.log('Observaciones en EventPreview:', event?.extendedProps?.observaciones)

  if (!event) {
    console.log('No hay evento para mostrar')

    return null
  }

  // Validar que el evento tenga los campos necesarios
  if (!event.start || !event.title) {
    console.error('El evento no tiene la estructura correcta:', event)

    return null
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='xl'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          padding: 2,
          maxHeight: '90vh',
          overflow: 'auto'
        }
      }}
    >
      <Box sx={{ p: 2, maxHeight: 'calc(90vh - 32px)', overflow: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h6'>Detalles de la Cita</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={onClose} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Primera fila: Tipo - Fecha - Hora */}
          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Tipo de
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <FormControlLabel
                  control={<Checkbox checked={event.extendedProps?.tipoVisita} disabled size='small' />}
                  label='Evento'
                />
                <FormControlLabel
                  control={<Checkbox checked={event.extendedProps?.esRecurrente} disabled size='small' />}
                  label='Recurrente'
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Fecha
              </Typography>
              <Typography variant='body1'>
                {new Date(event.start).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Hora
              </Typography>
              <Typography variant='body1'>
                {new Date(event.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                {event.end
                  ? new Date(event.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                  : 'No especificado'}
              </Typography>
            </Box>
          </Grid>

          {/* Segunda fila: Cliente - Obra - Solicitud */}
          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Cliente
              </Typography>
              <Typography variant='body1'>{event.extendedProps?.cliente || event.title}</Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Obra
              </Typography>
              <Typography variant='body1'>
                {event.extendedProps?.obra?.nombreObra ||
                  event.extendedProps?.obra?.nombreCliente ||
                  event.extendedProps?.obra?.direccion ||
                  'No especificada'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Solicitud
              </Typography>
              <Typography variant='body1'>
                {event.extendedProps?.solicitud?.numeroSolicitud
                  ? `Solicitud ${event.extendedProps.solicitud.numeroSolicitud}`
                  : 'No especificada'}
              </Typography>
            </Box>
          </Grid>

          {/* Tercera fila: Sector Comercial - Región - Comuna */}
          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Sector Comercial
              </Typography>
              <Typography variant='body1'>{event.extendedProps?.sectorComercial || 'No especificado'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Región
              </Typography>
              <Typography variant='body1'>{event.extendedProps?.region || 'No especificada'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Comuna
              </Typography>
              <Typography variant='body1'>{event.extendedProps?.comuna || 'No especificada'}</Typography>
            </Box>
          </Grid>

          {/* Tercera fila: Estado - Servicios */}
          <Grid item xs={4}>
            <Box>
              <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                Estado
              </Typography>
              <Box
                sx={{
                  display: 'inline-block',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: event.backgroundColor + '20',
                  color: event.backgroundColor
                }}
              >
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  {event.extendedProps?.estado}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Contactos */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Contactos
            </Typography>
            {Array.isArray(event.extendedProps?.contactos) && event.extendedProps.contactos.length > 0 ? (
              event.extendedProps.contactos.map((contacto: any, index: number) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={2}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Nombre
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contacto.nombre}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Rol
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ROLES_CONTACTO.find(r => r.value === contacto.rol)?.label || contacto.rol}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Email
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contacto.email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Teléfono 1
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contacto.telefono1}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Teléfono 2
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contacto.telefono2 || 'No especificado'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Principal
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem' }}>
                        {contacto.isPrincipal ? 'Sí' : 'No'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography color='text.secondary'>No hay contactos asignados</Typography>
            )}
          </Grid>

          {/* Servicios */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Servicios
            </Typography>
            {Array.isArray(event.extendedProps?.servicios) && event.extendedProps.servicios.length > 0 ? (
              event.extendedProps.servicios.map((servicio: any, index: number) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Servicio
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {servicio.servicio} {servicio.norma ? `- ${servicio.norma}` : ''}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Código
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem' }}>
                        {servicio.codigo}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Cantidad
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem' }}>
                        {servicio.cantidad}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Segunda Visita
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem' }}>
                        {servicio.esSegundaVisita ? 'Sí' : 'No'}
                      </Typography>
                    </Grid>
                    {servicio.observacion && (
                      <Grid item xs={12}>
                        <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                          Observación
                        </Typography>
                        <Typography sx={{ fontSize: '0.875rem' }}>
                          {servicio.observacion}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography color='text.secondary'>No hay servicios asignados</Typography>
            )}
          </Grid>

          {/* Laboratoristas Asignados */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Laboratoristas Asignados
            </Typography>
            {Array.isArray(event.extendedProps?.asignados) && event.extendedProps.asignados.length > 0 ? (
              event.extendedProps.asignados.map((asignado: any, index: number) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        Nombre
                      </Typography>
                      <Typography>{asignado?.name || asignado?.user?.name || 'No especificado'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        Email
                      </Typography>
                      <Typography>{asignado?.email || asignado?.user?.email || 'No especificado'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        Roles
                      </Typography>
                      <Box>
                        {(asignado?.roles || asignado?.user?.roles || []).map((userRol: any, rolIndex: number) => (
                          <Typography key={rolIndex} component='div'>
                            {userRol?.rol?.nombre || userRol?.nombre || 'Rol no especificado'}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography color='text.secondary'>No hay laboratoristas asignados</Typography>
            )}
          </Grid>

          {/* Equipos */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Equipos
            </Typography>
            {Array.isArray(event.extendedProps?.equipos) && event.extendedProps.equipos.length > 0 ? (
              event.extendedProps.equipos.map((equipo: any, index: number) => (
                <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Equipo
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {equipo.equipo?.nombre}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Código
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem' }}>
                        {equipo.equipo?.codigo}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                        Cantidad
                      </Typography>
                      <Typography sx={{ fontSize: '0.875rem' }}>
                        {equipo.cantidad}
                      </Typography>
                    </Grid>
                    {equipo.observacion && (
                      <Grid item xs={12} md={3}>
                        <Typography variant='subtitle2' sx={{ mb: 0.5, fontSize: '0.75rem' }}>
                          Observación
                        </Typography>
                        <Typography sx={{ fontSize: '0.875rem' }}>
                          {equipo.observacion}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography color='text.secondary'>No hay equipos asignados</Typography>
            )}
          </Grid>

          {/* Observaciones */}
          {event.extendedProps?.observaciones && (
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Observaciones
              </Typography>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography>{event.extendedProps.observaciones}</Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button variant='outlined' onClick={onClose}>
            Cerrar
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default EventPreview
