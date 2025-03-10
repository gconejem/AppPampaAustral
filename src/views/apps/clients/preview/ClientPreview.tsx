import { Typography, Grid, Card, CardContent, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material'

import type { Cliente } from '@/types/forms/cliente'

interface ClientPreviewProps {
  client: Cliente | null
}

const ClientPreview = ({ client }: ClientPreviewProps) => {
  if (!client) return null

  // Agregar log para ver qué datos llegan al componente
  console.log('Datos recibidos en preview:', client)

  // Función para formatear la fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <>
      {/* Primera Card - Información del Cliente */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={4}>
            {/* Primera fila */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Fecha de Creación
              </Typography>
              <Typography>{formatDate(client.fechaCreacion)}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              {/* Espacio invisible */}
            </Grid>

            {/* Segunda fila */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Razón Social
              </Typography>
              <Typography>{client.razonSocial}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Estado
              </Typography>
              <Typography>{client.estado === 'active' ? 'Activo' : 'Inactivo'}</Typography>
            </Grid>

            {/* Tercera fila */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Cliente
              </Typography>
              <Typography>{client.nombreCliente}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                RUT
              </Typography>
              <Typography>{client.rut}</Typography>
            </Grid>

            {/* Cuarta fila */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                País
              </Typography>
              <Typography>{client.pais}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Región
              </Typography>
              <Typography>{client.region}</Typography>
            </Grid>

            {/* Quinta fila: Comuna y Dirección */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Comuna
              </Typography>
              <Typography>{client.comuna}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Dirección
              </Typography>
              <Typography>{client.direccion}</Typography>
            </Grid>

            {/* Sexta fila: Teléfono y Sitio Web */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Teléfono
              </Typography>
              <Typography>{client.telefono}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Sitio Web
              </Typography>
              <Typography>{client.sitioWeb || '-'}</Typography>
            </Grid>

            {/* Séptima fila: Segmento e Industria */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Segmento
              </Typography>
              <Typography>{client.segmento || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Industria
              </Typography>
              <Typography>{client.industria || '-'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Segunda Card - Tabla de Contactos */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 4 }}>
            Contactos Asignados
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>NOMBRE</TableCell>
                <TableCell>CARGO</TableCell>
                <TableCell>EMAIL</TableCell>
                <TableCell>TELÉFONO 1</TableCell>
                <TableCell>TELÉFONO 2</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {client.clientesContactos && client.clientesContactos.length > 0 ? (
                client.clientesContactos.map((contacto, index) => (
                  <TableRow key={index}>
                    <TableCell>{contacto.contacto?.nombre}</TableCell>
                    <TableCell>{contacto.contacto?.cargo}</TableCell>
                    <TableCell>{contacto.contacto?.email}</TableCell>
                    <TableCell>{contacto.contacto?.telefono1}</TableCell>
                    <TableCell>{contacto.contacto?.telefono2 || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align='center'>
                    No hay contactos asignados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tercera Card - Condiciones Comerciales */}
      <Card>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 4 }}>
            Condiciones Comerciales
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant='subtitle2' color='text.secondary'>
                Vendedor
              </Typography>
              <Typography>
                {client.condicionesComerciales && client.condicionesComerciales.length > 0
                  ? client.condicionesComerciales[0].vendedor
                  : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant='subtitle2' color='text.secondary'>
                Condiciones de Venta
              </Typography>
              <Typography>
                {client.condicionesComerciales && client.condicionesComerciales.length > 0
                  ? client.condicionesComerciales[0].condicionVenta
                  : '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant='subtitle2' color='text.secondary'>
                Observaciones
              </Typography>
              <Typography>
                {client.condicionesComerciales && client.condicionesComerciales.length > 0
                  ? client.condicionesComerciales[0].observaciones
                  : '-'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  )
}

export default ClientPreview
