import React, { useState, useEffect } from 'react'

import { Grid, Card, CardContent, Typography, Button, Chip, Skeleton } from '@mui/material'

interface HeaderProps {
  otData?: any
  tipoOT?: string | null
  loading?: boolean
  rcmEstado?: string
  numeroRcmProp?: string // Número de RCM cuando se está editando
  isEditMode?: boolean // Indica si estamos en modo edición
}

const Header = ({ otData, tipoOT, loading, rcmEstado = 'CODIFICADO', numeroRcmProp, isEditMode = false }: HeaderProps) => {
  // Estado para el número de RCM
  const [numeroRcm, setNumeroRcm] = useState<string>('')

  // Obtener el próximo número de RCM al cargar el componente (solo si NO estamos en modo edición)
  useEffect(() => {
    console.log('🎯 Header useEffect - isEditMode:', isEditMode, 'numeroRcmProp:', numeroRcmProp)
    if (isEditMode) {
      // Si estamos editando, usar el número proporcionado cuando esté disponible
      if (numeroRcmProp) {
        console.log('✅ Header estableciendo número RCM:', numeroRcmProp)
        setNumeroRcm(numeroRcmProp)
      } else {
        console.log('⏳ Header esperando número RCM...')
      }
    } else {
      // Si estamos creando, obtener el próximo número
      console.log('🆕 Header obteniendo próximo número RCM...')
      fetch('/api/rcm/proximo-numero')
        .then(res => res.json())
        .then(data => {
          console.log('📊 Header recibió próximo número:', data.numeroRcm)
          setNumeroRcm(data.numeroRcm)
        })
        .catch(error => {
          console.error('Error al obtener próximo número de RCM:', error)
        })
    }
  }, [isEditMode, numeroRcmProp])

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

  // Obtener el servicio desde el objeto tipoOT
  const getServicioNombre = (tipoOT: any) => {
    if (typeof tipoOT === 'object' && tipoOT?.descripcion) {
      return tipoOT.descripcion
    }
    return 'Desconocido'
  }

  const servicioNombre = getServicioNombre(otData?.tipoOT)

  const getAreaOT = (tipoOT: any) => {
    const codigo = tipoOT?.codigo
    switch (codigo) {
      case 'R-12-39': // Muestreo de Hormigón Fresco
        return 'Hormigón'
      case 'R-12-03': // Control de Compactación
        return 'Suelos'
      case 'R-12-31': // Extracción Asfáltica
        return 'Asfaltos'
      default:
        return 'General'
    }
  }

  const areaOT = getAreaOT(otData?.tipoOT)

  // Función para obtener las propiedades de visualización del estado del RCM
  const getRcmEstadoProps = (estado: string) => {
    switch (estado) {
      case 'CODIFICADO':
        return { label: 'Codificado', backgroundColor: '#e3f2fd', color: '#1976d2' }
      case 'EN_PROCESO':
        return { label: 'En Proceso', backgroundColor: '#fff3e0', color: '#f57c00' }
      case 'ENSAYADO':
        return { label: 'Ensayado', backgroundColor: '#e8f5e9', color: '#388e3c' }
      case 'ENVIADO_DIGITACION':
        return { label: 'Enviado a Digitación', backgroundColor: '#f3e5f5', color: '#7b1fa2' }
      case 'DIGITADO':
        return { label: 'Digitado', backgroundColor: '#e0f2f1', color: '#00796b' }
      default:
        return { label: 'Codificado', backgroundColor: '#e3f2fd', color: '#1976d2' }
    }
  }

  const estadoProps = getRcmEstadoProps(rcmEstado)

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
              label={numeroRcm || 'Cargando...'}
              sx={{ backgroundColor: '#e0e0e0', color: '#424242', fontWeight: 'bold' }}
            />
            <Chip
              label={estadoProps.label}
              sx={{ backgroundColor: estadoProps.backgroundColor, color: estadoProps.color, fontWeight: 'bold' }}
            />
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
              onClick={() => window.close()}
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
