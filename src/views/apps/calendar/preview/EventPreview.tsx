import { Dialog, Typography, Box, IconButton, Button, Checkbox, FormControlLabel, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import { ROLES_CONTACTO } from '@/constants/roles'
import { parseDateFromBackend } from '@/utils/dateUtils'
import { useState, useEffect } from 'react'

interface EventPreviewProps {
  open: boolean
  onClose: () => void
  event: any | null
}

type StatusType = 'CREADA' | 'AGENDADA' | 'COMPLETADA' | 'SUSPENDIDA' | 'REPROGRAMADA'

// Definir colores por estado (mismos que en Calendar.tsx)
const statusColors: Record<StatusType, string> = {
  CREADA: '#9C27B0', // Púrpura
  AGENDADA: '#4CAF50', // Verde
  COMPLETADA: '#2196F3', // Azul
  SUSPENDIDA: '#F44336', // Rojo
  REPROGRAMADA: '#FF9800' // Naranja
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
            {/* Primera fila: Fecha - Hora - Estado */}


            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Fecha
                </Typography>
                <Typography variant='body1'>
                  {parseDateFromBackend(displayData.fechaInicio || displayData.start).toLocaleDateString('es-ES', {
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
                  {parseDateFromBackend(displayData.fechaInicio || displayData.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {displayData.fechaFin || displayData.end
                    ? parseDateFromBackend(displayData.fechaFin || displayData.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                    : 'No especificado'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Estado
                </Typography>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: alpha(statusColors[(displayData.estado || displayData.extendedProps?.estado || 'AGENDADA') as StatusType], 0.1),
                    color: statusColors[(displayData.estado || displayData.extendedProps?.estado || 'AGENDADA') as StatusType],
                    border: `1px solid ${statusColors[(displayData.estado || displayData.extendedProps?.estado || 'AGENDADA') as StatusType]}`,
                    minWidth: '80px',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant='body2' sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {displayData.estado || displayData.extendedProps?.estado || 'AGENDADA'}
                  </Typography>
                </Box>
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
                  {(() => {
                    const obra = displayData.obra || displayData.extendedProps?.obra;
                    const numeroObra = obra?.numeroObra || obra?.numero;
                    const nombreObra = obra?.nombreObra || obra?.nombreCliente || obra?.direccion;

                    if (numeroObra && nombreObra) {
                      return `${numeroObra} - ${nombreObra}`;
                    } else if (nombreObra) {
                      return nombreObra;
                    } else if (numeroObra) {
                      return numeroObra;
                    } else {
                      return 'No especificada';
                    }
                  })()}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Solicitud
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant='body1' sx={{ fontWeight: 600 }}>
                    {displayData.solicitud?.numeroSolicitud
                      ? `Solicitud #${displayData.solicitud.numeroSolicitud}`
                      : displayData.extendedProps?.solicitud?.numeroSolicitud
                        ? `Solicitud #${displayData.extendedProps.solicitud.numeroSolicitud}`
                        : displayData.solicitudId
                          ? `Solicitud #${displayData.solicitudId}`
                          : displayData.extendedProps?.solicitudId
                            ? `Solicitud #${displayData.extendedProps.solicitudId}`
                            : 'No especificada'}
                  </Typography>

                  <Typography variant='body2' color='text.secondary'>
                    Cliente: {displayData.solicitud?.cliente?.nombreCliente ||
                      displayData.extendedProps?.solicitud?.cliente?.nombreCliente ||
                      'No especificado'}
                  </Typography>

                  <Typography variant='body2' color='text.secondary'>
                    Obra: {displayData.solicitud?.obra?.nombreObra ||
                      displayData.extendedProps?.solicitud?.obra?.nombreObra ||
                      'No especificada'}
                  </Typography>
                </Box>
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

            {/* Cuarta fila: Dirección - Referencia - Georreferencia */}
            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Dirección
                </Typography>
                <Typography variant='body1'>
                  {displayData.obra?.direccion || displayData.extendedProps?.obra?.direccion || 'No especificada'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Referencia
                </Typography>
                <Typography variant='body1'>
                  {displayData.obra?.referencia || displayData.extendedProps?.obra?.referencia || 'No especificada'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                  Georreferencia
                </Typography>
                <Typography variant='body1'>
                  {(() => {
                    // Buscar georreferencia directamente desde el evento o la obra
                    const georreferencia = displayData.georreferencia ||
                      displayData.obra?.georreferencia ||
                      displayData.extendedProps?.obra?.georreferencia;

                    if (georreferencia) {
                      return georreferencia;
                    }

                    // Fallback: buscar latitud y longitud por separado
                    const obra = displayData.obra || displayData.extendedProps?.obra;
                    const latitud = obra?.latitud || obra?.lat;
                    const longitud = obra?.longitud || obra?.lng || obra?.lon;

                    if (latitud && longitud) {
                      return `${latitud}, ${longitud}`;
                    }

                    return 'No especificada';
                  })()}
                </Typography>
              </Box>
            </Grid>

            {/* Quinta fila: Servicios */}

            {/* Contactos */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Contactos
              </Typography>
              {Array.isArray(displayData.contactos) && displayData.contactos.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Cargo</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Nombre</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Teléfono 1</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Teléfono 2</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Principal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayData.contactos.map((contacto: any, index: number) => (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {ROLES_CONTACTO.find(r => r.value === contacto.rol)?.label || contacto.rol}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.nombre}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.email}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.telefono1}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.telefono2 || 'No especificado'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.isPrincipal ? 'Sí' : 'No'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : Array.isArray(displayData.extendedProps?.contactos) && displayData.extendedProps.contactos.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Cargo</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Nombre</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Teléfono 1</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Teléfono 2</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Principal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayData.extendedProps.contactos.map((contacto: any, index: number) => (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {ROLES_CONTACTO.find(r => r.value === contacto.rol)?.label || contacto.rol}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.nombre}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.email}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.telefono1}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.telefono2 || 'No especificado'}</TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>{contacto.isPrincipal ? 'Sí' : 'No'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
                <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
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
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
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
                <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
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
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
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
                <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Nombre</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Roles</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayData.asignados.map((asignado: any, index: number) => (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {asignado?.user?.name || asignado?.name || 'No especificado'}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {asignado?.user?.email || asignado?.email || 'No especificado'}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {(asignado?.user?.roles || asignado?.roles || []).map((userRol: any, rolIndex: number) => (
                              <Typography key={rolIndex} component='div' sx={{ fontSize: '0.875rem' }}>
                                {userRol?.rol?.nombre || userRol?.nombre || 'Rol no especificado'}
                              </Typography>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : Array.isArray(displayData.extendedProps?.asignados) && displayData.extendedProps.asignados.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Nombre</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Roles</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayData.extendedProps.asignados.map((asignado: any, index: number) => (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {asignado?.name || asignado?.user?.name || 'No especificado'}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {asignado?.email || asignado?.user?.email || 'No especificado'}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {(asignado?.roles || asignado?.user?.roles || []).map((userRol: any, rolIndex: number) => (
                              <Typography key={rolIndex} component='div' sx={{ fontSize: '0.875rem' }}>
                                {userRol?.rol?.nombre || userRol?.nombre || 'Rol no especificado'}
                              </Typography>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
                <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Equipo</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Código</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Cantidad</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Observación</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayData.equipos.map((equipo: any, index: number) => (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {equipo.equipo?.nombre}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {equipo.equipo?.codigo}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {equipo.cantidad}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {equipo.observacion || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : Array.isArray(displayData.extendedProps?.equipos) && displayData.extendedProps.equipos.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Equipo</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Código</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Cantidad</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'divider' }}>Observación</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayData.extendedProps.equipos.map((equipo: any, index: number) => (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { borderBottom: 0 } }}>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {equipo.equipo?.nombre}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {equipo.equipo?.codigo}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {equipo.cantidad}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            {equipo.observacion || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                    {displayData.observaciones || displayData.extendedProps.observaciones}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Observaciones de Suspensión - Solo para eventos SUSPENDIDA */}
            {(displayData.estado === 'SUSPENDIDA' || displayData.extendedProps?.estado === 'SUSPENDIDA') && (
              <>
                {/* Motivo de suspensión */}
                {(displayData.motivoSuspension || displayData.extendedProps?.motivoSuspension) && (
                  <Grid item xs={6}>
                    <Typography variant='h6' sx={{ mb: 2 }}>
                      Motivo de Suspensión
                    </Typography>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                        {(() => {
                          const motivo = displayData.motivoSuspension || displayData.extendedProps?.motivoSuspension;
                          switch (motivo) {
                            case 'CLIMA': return 'Clima';
                            case 'TERRENO_NO_PREPARADO': return 'Terreno No Preparado';
                            case 'PROBLEMA_PLANTA': return 'Problema Planta';
                            case 'PROBLEMA_INTERNO_PA': return 'Problema Interno PA';
                            case 'ACREDITACION_PERSONAL': return 'Acreditación Personal';
                            case 'OTRO': return 'Otro (Especificado)';
                            default: return motivo;
                          }
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Observaciones específicas de suspensión */}
                {(displayData.observacionSuspendida || displayData.extendedProps?.observacionSuspendida) && (
                  <Grid item xs={6}>
                    <Typography variant='h6' sx={{ mb: 2 }}>
                      Observaciones de Suspensión
                    </Typography>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                        {displayData.observacionSuspendida || displayData.extendedProps?.observacionSuspendida}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Si solo hay motivo pero no observaciones específicas, usar columna completa */}
                {(displayData.motivoSuspension || displayData.extendedProps?.motivoSuspension) &&
                  !(displayData.observacionSuspendida || displayData.extendedProps?.observacionSuspendida) && (
                    <Grid item xs={6}>
                      {/* Columna vacía para equilibrar el layout */}
                    </Grid>
                  )}
              </>
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
