import { Typography, Grid, Card, CardContent } from '@mui/material'
import type { Cliente } from '@/types/forms/cliente'

interface ClientPreviewProps {
  client: Cliente | null
}

const ClientPreview = ({ client }: ClientPreviewProps) => {
  if (!client) return null

  return (
    <div className='space-y-6'>
      {/* Datos Principales */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Datos Principales
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                RUT
              </Typography>
              <Typography>{client.rut}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Razón Social
              </Typography>
              <Typography>{client.razonSocial}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Nombre Cliente
              </Typography>
              <Typography>{client.nombreCliente}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Estado
              </Typography>
              <Typography>{client.estado}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Ubicación */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Ubicación
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                País
              </Typography>
              <Typography>{client.pais}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Ciudad
              </Typography>
              <Typography>{client.ciudad}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Comuna
              </Typography>
              <Typography>{client.comuna}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                Dirección
              </Typography>
              <Typography>{client.direccion}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Información de Contacto */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Información de Contacto
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Teléfono
              </Typography>
              <Typography>{client.telefono || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Sitio Web
              </Typography>
              <Typography>{client.sitioWeb || '-'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Información Comercial */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Información Comercial
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Segmento
              </Typography>
              <Typography>{client.segmento}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Industria
              </Typography>
              <Typography>{client.industria}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Vendedor
              </Typography>
              <Typography>{client.condicionesComerciales?.vendedor || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Condición de Venta
              </Typography>
              <Typography>{client.condicionesComerciales?.condicionVenta || '-'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                Observaciones
              </Typography>
              <Typography>{client.condicionesComerciales?.observaciones || '-'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Contactos */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Contactos
          </Typography>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead>
              <tr>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>NOMBRE</th>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>CARGO</th>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>EMAIL</th>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>TELÉFONO</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {client.clientesContactos?.map(contacto => (
                <tr key={contacto.id}>
                  <td className='py-3 px-4'>{contacto.contacto.nombre}</td>
                  <td className='py-3 px-4'>{contacto.contacto.cargo}</td>
                  <td className='py-3 px-4'>{contacto.contacto.email}</td>
                  <td className='py-3 px-4'>{contacto.contacto.telefono1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClientPreview
