import { useEffect, useState } from 'react'

import { Typography, Grid, Card, CardContent, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material'

import type { Cliente } from '@/types/forms/cliente'
import { useUbicacion } from '@/hooks/useUbicacion'

interface ClientPreviewProps {
  client: Cliente | null
}

const ClientPreview = ({ client }: ClientPreviewProps) => {
  const { regiones } = useUbicacion()
  const [nombreRegion, setNombreRegion] = useState<string>('')

  useEffect(() => {
    if (client?.region && regiones.length > 0) {
      // Buscar la región por su ID
      const region = regiones.find(r => r.id.toString() === client.region)

      if (region) {
        setNombreRegion(region.nombre)
      }
    }
  }, [client?.region, regiones])

  if (!client) return null

  // Agregar log detallado para ver qué datos llegan al componente
  console.log('Datos completos del cliente:', {
    giro: client.giro,
    emailFacturacion: client.emailFacturacion,
    todosLosDatos: client
  })

  // Función para formatear la fecha
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Definir los roles legibles
  const ROLES_CONTACTO = [
    { value: 'encargado_obra', label: 'Encargado de Obra' },
    { value: 'envio_informes', label: 'Envío de Informes' },
    { value: 'dueno_representante', label: 'Dueño Representante' },
    { value: 'jefe_obra_planta', label: 'Jefe de Obra / Planta' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'administrador_obra', label: 'Administrador de Obra' },
    { value: 'encargado_calidad', label: 'Encargado de Calidad' },
    { value: 'autocontrol', label: 'Autocontrol' },
    { value: 'profesional', label: 'Profesional' },
    { value: 'laboratorista', label: 'Laboratorista' },
    { value: 'otro', label: 'Otro (Especificar)' }
  ]

  // Función para obtener el label legible
  const getCargoLabel = (value: string) => {
    return ROLES_CONTACTO.find(r => r.value === value)?.label || value
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
              <Typography>{nombreRegion || client.region}</Typography>
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

            {/* Octava fila: Giro y Email de Facturación */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Giro
              </Typography>
              <Typography>{client.giro || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Email de Facturación
              </Typography>
              <Typography>{client.emailFacturacion || '-'}</Typography>
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
                client.clientesContactos.map((cc, index) => (
                  <TableRow key={index}>
                    <TableCell>{cc.contacto?.nombre}</TableCell>
                    <TableCell>{getCargoLabel(cc.cargo)}</TableCell>
                    <TableCell>{cc.contacto?.email}</TableCell>
                    <TableCell>{cc.contacto?.telefono1}</TableCell>
                    <TableCell>{cc.contacto?.telefono2 || '-'}</TableCell>
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
              <Typography>{client.condicionesComerciales?.vendedor || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant='subtitle2' color='text.secondary'>
                Condiciones de Venta
              </Typography>
              <Typography>{client.condicionesComerciales?.condicionVenta || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant='subtitle2' color='text.secondary'>
                Observaciones
              </Typography>
              <Typography>{client.condicionesComerciales?.observaciones || '-'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  )
}

export default ClientPreview
