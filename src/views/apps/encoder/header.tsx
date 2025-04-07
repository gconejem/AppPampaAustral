import React from 'react'

import { Grid, Card, CardContent, Typography, Button, Chip, Skeleton } from '@mui/material'

interface HeaderProps {
  otData?: any
  tipoOT?: string | null
  loading?: boolean
}

const Header = ({ otData, tipoOT, loading }: HeaderProps) => {
  // Si está cargando, mostrar esqueletos
  if (loading) {
    return (
      <Card sx={{ marginBottom: 4, padding: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12}>
              <Skeleton variant='rectangular' height={60} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  // Si no hay datos de OT
  if (!otData) {
    return (
      <Card sx={{ marginBottom: 4, padding: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12}>
              <Typography textAlign='center'>
                No hay información de OT disponible. Por favor, seleccione una OT válida.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  // Mostrar el servicio según el tipo de OT
  const getServicioNombre = (tipo: string | null) => {
    switch (tipo) {
      case 'DENSIDADES':
        return 'Control de Compactación'
      case 'HORMIGON_FRESCO':
        return 'Muestreo de Hormigón Fresco'
      case 'RETIRO_PROBETA':
        return 'Retiro de Probeta Hormigón'
      case 'MUESTREO_MATERIALES':
        return 'Muestreo de Materiales'
      case 'TESTIGOS':
        return 'Testigos'
      case 'EXTRACCION_ASFALTICA':
        return 'Extracción Asfáltica'
      case 'ACEPTACION_VISITA':
        return 'Aceptación de Visita'
      default:
        return tipo || 'Desconocido'
    }
  }

  const servicioNombre = getServicioNombre(tipoOT || null)

  const areaOT =
    tipoOT === 'HORMIGON_FRESCO'
      ? 'Hormigón'
      : tipoOT === 'DENSIDADES'
        ? 'Suelos'
        : tipoOT === 'EXTRACCION_ASFALTICA'
          ? 'Asfaltos'
          : 'General'

  return (
    <Card sx={{ marginBottom: 4, padding: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems='center'>
          {/* Sección 4: Título y estados principales */}
          <Grid item xs={4} display='flex' alignItems='center' gap={2}>
            <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
              RCM
            </Typography>
            <Chip
              label={otData.clave || 'Sin OT'}
              sx={{ backgroundColor: '#e0e0e0', color: '#424242', fontWeight: 'bold' }}
            />
            <Chip label='Codificando' sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontWeight: 'bold' }} />
            <Chip label='Sin Inicio' sx={{ backgroundColor: '#e8f5e9', color: '#388e3c', fontWeight: 'bold' }} />
          </Grid>

          {/* Sección 6: Estados secundarios */}
          <Grid item xs={6} display='flex' alignItems='center' gap={2}>
            <Chip
              label={`OT: ${otData.clave?.substring(0, 7) || 'N/A'}`}
              sx={{ backgroundColor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }}
            />
            <Chip
              label={`Obra: ${otData.agenda?.obra?.numeroObra || 'N/A'}`}
              sx={{ backgroundColor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }}
            />
            <Chip label={`Área: ${areaOT}`} sx={{ backgroundColor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }} />
            <Chip
              label={`Servicio: ${servicioNombre}`}
              sx={{ backgroundColor: '#f5f5f5', color: '#424242', fontWeight: 'bold' }}
            />
          </Grid>

          {/* Sección 2: Botón de cancelar */}
          <Grid item xs={2} display='flex' justifyContent='flex-end'>
            <Button
              variant='outlined'
              color='error'
              sx={{ fontWeight: 'bold', textTransform: 'none' }}
              onClick={() => window.close()} // Cerrar la ventana al cancelar
            >
              Cancelar
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Header
