'use client'

import { useState, useEffect } from 'react'
import { Box, Grid, TextField, Typography, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material'

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

const Header = () => {
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [areaOptions, setAreaOptions] = useState<Area[]>([])
  const [familiaOptions, setFamiliaOptions] = useState<Familia[]>([])

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
        p: 4,
        backgroundColor: 'white',
        boxShadow: 2,
        borderRadius: 2,
        mb: 4 // Margen inferior para separación
      }}
    >
      {/* Título y Botón */}
      <Grid container alignItems='center' sx={{ mb: 4 }}>
        <Grid item xs={3}>
          <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
            Navegador Global de RCM
          </Typography>
        </Grid>
        <Grid item xs={6} />
        <Grid item xs={3} sx={{ textAlign: 'right' }}>
          <Button variant='contained' color='primary' size='large' sx={{ fontWeight: '' }}>
            Informes
          </Button>
        </Grid>
      </Grid>

      {/* Primera Fila de Inputs */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <TextField label='Fecha Codificación' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={8}>
          {/* Rango de Fechas usando PickersRange */}
          <PickersRange />
        </Grid>
      </Grid>

      {/* Segunda Fila de Inputs */}
      <Grid container spacing={2}>
        <Grid item xs={3}>
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
        <Grid item xs={3}>
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
        <Grid item xs={3}>
          <TextField label='Estado Operativo' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField label='Estado Administrativo' size='small' fullWidth select>
            {/* Opciones */}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Header
