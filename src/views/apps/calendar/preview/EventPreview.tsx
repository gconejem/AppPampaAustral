import { Dialog, Typography, Box, IconButton, Button, Checkbox, FormControlLabel, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { ROLES_CONTACTO } from '@/constants/roles'
import { useState, useEffect } from 'react'

interface EventPreviewProps {
  open: boolean
  onClose: () => void
  event: any | null
}

const EventPreview = ({ open, onClose, event }: EventPreviewProps) => {
  const [visitaData, setVisitaData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('EventPreview props:', { open, event })
  console.log('Observaciones en EventPreview:', event?.extendedProps?.observaciones)

  // Función para obtener los datos de la visita desde el backend
  const fetchVisitaData = async (visitaId: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/agenda/${visitaId}`)

      if (!response.ok) {
        throw new Error('Error al obtener los datos de la visita')
      }

      const data = await response.json()
      setVisitaData(data)
    } catch (err: any) {
      console.error('Error al obtener datos de la visita:', err)
      setError(err.message || 'Error al obtener los datos de la visita')
    } finally {
      setLoading(false)
    }
  }

  // Efecto para cargar los datos cuando se abre el modal
  useEffect(() => {
    if (open && event?.id) {
      fetchVisitaData(event.id)
    } else if (!open) {
      // Limpiar datos cuando se cierra el modal
      setVisitaData(null)
      setError(null)
    }
  }, [open, event?.id])

  if (!event) {
    console.log('No hay evento para mostrar')
    return null
  }

  // Validar que el evento tenga los campos necesarios
  if (!event.start || !event.title) {
    console.error('El evento no tiene la estructura correcta:', event)
    return null
  }

  // Usar los datos del backend si están disponibles, sino usar los datos del evento
  const displayData = visitaData || event

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

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
            <Typography variant='body2'>{error}</Typography>
          </Box>
        )}

        {!loading && !error && (
          <Grid container spacing={4}>
            {/* Primera fila: Tipo - Fecha - Hora */}
            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Tipo de
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <FormControlLabel
                    control={<Checkbox checked={displayData.tipoVisita} disabled size='small' />}
                    label='Evento'
                  />
                  <FormControlLabel
                    control={<Checkbox checked={displayData.esRecurrente} disabled size='small' />}
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
                  {new Date(displayData.fechaInicio || displayData.start).toLocaleDateString('es-ES', {
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
                  {new Date(displayData.fechaInicio || displayData.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {displayData.fechaFin || displayData.end
                    ? new Date(displayData.fechaFin || displayData.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
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
                <Typography variant='body1'>
                  {displayData.cliente?.nombreCliente || displayData.extendedProps?.cliente || displayData.title}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Obra
                </Typography>
                <Typography variant='body1'>
                  {displayData.obra?.nombreObra ||
                    displayData.obra?.nombreCliente ||
                    displayData.obra?.direccion ||
                    displayData.extendedProps?.obra?.nombreObra ||
                    displayData.extendedProps?.obra?.nombreCliente ||
                    displayData.extendedProps?.obra?.direccion ||
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
                  {displayData.solicitud?.numeroSolicitud
                    ? `Solicitud ${displayData.solicitud.numeroSolicitud}`
                    : displayData.extendedProps?.solicitud?.numeroSolicitud
                      ? `Solicitud ${displayData.extendedProps.solicitud.numeroSolicitud}`
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
                <Typography variant='body1'>{displayData.sectorComercial || displayData.extendedProps?.sectorComercial || 'No especificado'}</Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Región
                </Typography>
                <Typography variant='body1'>{displayData.region || displayData.extendedProps?.region || 'No especificada'}</Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Comuna
                </Typography>
                <Typography variant='body1'>{displayData.comuna || displayData.extendedProps?.comuna || 'No especificada'}</Typography>
              </Box>
            </Grid>

            {/* Cuarta fila: Estado - Servicios */}
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
                    bgcolor: (displayData.backgroundColor || event.backgroundColor) + '20',
                    color: displayData.backgroundColor || event.backgroundColor
                  }}
                >
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {displayData.estado || displayData.extendedProps?.estado}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Contactos */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Contactos
              </Typography>
              {Array.isArray(displayData.contactos) && displayData.contactos.length > 0 ? (
                displayData.contactos.map((contacto: any, index: number) => (
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
              ) : Array.isArray(displayData.extendedProps?.contactos) && displayData.extendedProps.contactos.length > 0 ? (
                displayData.extendedProps.contactos.map((contacto: any, index: number) => (
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
              {Array.isArray(displayData.servicios) && displayData.servicios.length > 0 ? (
                <TableContainer sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Servicio</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Código</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Cantidad</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Segunda Visita</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Observación</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayData.servicios.map((servicio: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {servicio.servicio} {servicio.norma ? `- ${servicio.norma}` : ''}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{servicio.codigo}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{servicio.cantidad}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{servicio.esSegundaVisita ? 'Sí' : 'No'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{servicio.observacion || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : Array.isArray(displayData.extendedProps?.servicios) && displayData.extendedProps.servicios.length > 0 ? (
                <TableContainer sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Servicio</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Código</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Cantidad</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Segunda Visita</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Observación</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayData.extendedProps.servicios.map((servicio: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {servicio.servicio} {servicio.norma ? `- ${servicio.norma}` : ''}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{servicio.codigo}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{servicio.cantidad}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{servicio.esSegundaVisita ? 'Sí' : 'No'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{servicio.observacion || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color='text.secondary'>No hay servicios asignados</Typography>
              )}
            </Grid>

            {/* Laboratoristas Asignados */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Laboratoristas Asignados
              </Typography>
              {Array.isArray(displayData.asignados) && displayData.asignados.length > 0 ? (
                displayData.asignados.map((asignado: any, index: number) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                          Nombre
                        </Typography>
                        <Typography>{asignado?.user?.name || asignado?.name || 'No especificado'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                          Email
                        </Typography>
                        <Typography>{asignado?.user?.email || asignado?.email || 'No especificado'}</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                          Roles
                        </Typography>
                        <Box>
                          {(asignado?.user?.roles || asignado?.roles || []).map((userRol: any, rolIndex: number) => (
                            <Typography key={rolIndex} component='div'>
                              {userRol?.rol?.nombre || userRol?.nombre || 'Rol no especificado'}
                            </Typography>
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              ) : Array.isArray(displayData.extendedProps?.asignados) && displayData.extendedProps.asignados.length > 0 ? (
                displayData.extendedProps.asignados.map((asignado: any, index: number) => (
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
              {Array.isArray(displayData.equipos) && displayData.equipos.length > 0 ? (
                displayData.equipos.map((equipo: any, index: number) => (
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
              ) : Array.isArray(displayData.extendedProps?.equipos) && displayData.extendedProps.equipos.length > 0 ? (
                displayData.extendedProps.equipos.map((equipo: any, index: number) => (
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
            {(displayData.observaciones || displayData.extendedProps?.observaciones) && (
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Observaciones
                </Typography>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography>{displayData.observaciones || displayData.extendedProps.observaciones}</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}

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
