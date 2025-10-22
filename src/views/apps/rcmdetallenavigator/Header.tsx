'use client'

import { useState, useEffect } from 'react'
import { Box, Grid, TextField, Typography, Button, FormControl, InputLabel, Select, MenuItem, Menu } from '@mui/material'

// Importa el componente PickersRange
import PickersRange from './date'

interface Area {
  id: number
  nombre: string
}

interface Familia {
  id: number
  nombre: string
  area: {
    id: number
    nombre: string
  }
}

const ESTADOS_OPERATIVO = [
  'PENDIENTE',
  'DIGITAR',
  'POR_REVISAR',
  'REVISAR',
  'CORREGIR',
  'CODIFICADO',
  'FIRMADO'
]

const ESTADOS_ADMINISTRATIVO = [
  'PENDIENTE',
  'ENVIAR_DIGITACION',
  'ENVIADO',
  'FIRMADO',
  'PAGADO',
  'CODIFICADO',
  'RECHAZADO'
]

const Header = () => {
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [areaOptions, setAreaOptions] = useState<Area[]>([])
  const [familiaOptions, setFamiliaOptions] = useState<Familia[]>([])
  const [selectedEstadoOp, setSelectedEstadoOp] = useState<string>('')
  const [selectedEstadoAd, setSelectedEstadoAd] = useState<string>('')

  // Menu Informes
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const informesOpen = Boolean(anchorEl)
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)

  // Cambiado: abrir informes SIN prefijo de idioma (opción B)
  const handleInforme = (slug: string) => {
    // abre la página directamente en /informes/<slug>
    if (slug === 'densidad') {
      window.open(`/informes/densidad`, '_blank')
    } else if (slug === 'hormigon') {
      window.open(`/informes/hormigon`, '_blank')
    } else {
      window.open(`/informes/${slug}`, '_blank')
    }
    handleMenuClose()
  }

  // Cargar áreas cuando se monta el componente
  useEffect(() => {
    fetch('/api/areas')
      .then(res => res.json())
      .then(data => {
        setAreaOptions(data)
      })
      .catch(error => {
        console.error('Error al cargar áreas:', error)
      })
  }, [])

  // Cargar familias cuando se selecciona un área
  useEffect(() => {
    if (selectedAreaId) {
      fetch(`/api/familias?areaId=${selectedAreaId}`)
        .then(res => res.json())
        .then(data => {
          setFamiliaOptions(data)
        })
        .catch(error => {
          console.error('Error al cargar familias:', error)
        })
    } else {
      setFamiliaOptions([])
      setSelectedFamilia('')
    }
  }, [selectedAreaId])

  const handleAreaChange = (value: string) => {
    const areaId = value ? Number(value) : null
    setSelectedAreaId(areaId)
    setSelectedFamilia('') // Resetear familia cuando cambia el área
  }
  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: 'white',
        boxShadow: 2,
        borderRadius: 2,
        mb: 4
      }}
    >
      {/* Título y Botón */}
      <Grid container alignItems='center' sx={{ mb: 4 }}>
        <Grid item xs={3}>
          <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
            Navegador Detalle de RCM
          </Typography>
        </Grid>
        <Grid item xs={6} />
        <Grid item xs={3} sx={{ textAlign: 'right' }}>
          <Button variant='contained' color='primary' size='large' sx={{ fontWeight: '' }} onClick={handleMenuOpen}>
            Informes
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={informesOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => handleInforme('densidad')}>Muestras por Ensayar</MenuItem>
            <MenuItem onClick={() => handleInforme('hormigon')}>Volumen de Muestras Ensayadas</MenuItem>
          </Menu>
        </Grid>
      </Grid>

      {/* Primera Fila de Inputs */}
      <Grid container spacing={2} sx={{ mb: 2 }} alignItems='center'>
        <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField label='Fecha Codificación' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Wrapper que fuerza ancho completo al input interno del PickersRange */}
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              // Forzar que los elementos internos de MUI ocupen todo el ancho
              '& .MuiInputBase-root': { width: '100%' },
              '& .MuiOutlinedInput-root': { width: '100%' },
              '& input#date-range-picker': { width: '100%' } // selector que aparece en DOM
            }}
          >
            <PickersRange />
          </Box>
        </Grid>

        <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField label='Fecha Vencimiento' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
      </Grid>

      {/* Segunda Fila de Inputs */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size='small'>
            <InputLabel id='area-select'>Área</InputLabel>
            <Select
              label='Área'
              value={selectedAreaId?.toString() || ''}
              onChange={e => handleAreaChange(e.target.value)}
              labelId='area-select'
            >
              <MenuItem value=''>Todas las áreas</MenuItem>
              {areaOptions.map(area => (
                <MenuItem key={area.id} value={area.id}>
                  {area.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size='small'>
            <InputLabel id='familia-select'>Familia</InputLabel>
            <Select
              label='Familia'
              value={selectedFamilia}
              onChange={e => setSelectedFamilia(e.target.value)}
              labelId='familia-select'
              disabled={!selectedAreaId}
            >
              <MenuItem value=''>Todas las familias</MenuItem>
              {familiaOptions.map(familia => (
                <MenuItem key={familia.id} value={familia.nombre}>
                  {familia.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Estado Operativo */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size='small'>
            <InputLabel id='estado-op-select'>Estado Operativo</InputLabel>
            <Select
              labelId='estado-op-select'
              label='Estado Operativo'
              value={selectedEstadoOp}
              onChange={e => setSelectedEstadoOp(e.target.value)}
            >
              <MenuItem value=''>Todos</MenuItem>
              {ESTADOS_OPERATIVO.map(s => (
                <MenuItem key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Estado Administrativo */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size='small'>
            <InputLabel id='estado-ad-select'>Estado Administrativo</InputLabel>
            <Select
              labelId='estado-ad-select'
              label='Estado Administrativo'
              value={selectedEstadoAd}
              onChange={e => setSelectedEstadoAd(e.target.value)}
            >
              <MenuItem value=''>Todos</MenuItem>
              {ESTADOS_ADMINISTRATIVO.map(s => (
                <MenuItem key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Header
