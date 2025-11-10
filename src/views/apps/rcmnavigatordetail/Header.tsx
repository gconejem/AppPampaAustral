'use client'

import { useState, useEffect } from 'react'
import { Box, Grid, TextField, MenuItem, Typography, Button, FormControl, InputLabel, Select, Menu } from '@mui/material'

// Importa el componente PickersRange
import PickersRange from './date'
import OPERATIONAL_STATES from '../../../constants/operationalStates'
import ADMINISTRATIVE_STATES from '../../../constants/administrativeStates'

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

interface HeaderProps {
  onFiltersChange?: (filters?: {
    dateField?: 'fecha_codificacion' | 'fecha_muestreo'
    start?: string
    end?: string
    estadoOperativo?: string
    estadoAdministrativo?: string
    areaId?: number | null
    familia?: string
  }) => void
}

const Header = ({ onFiltersChange }: HeaderProps) => {
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedAreaName, setSelectedAreaName] = useState<string>('')

  const handleAreaChange = (value: string) => {
    const areaId = value ? Number(value) : null
    setSelectedAreaId(areaId)
    setSelectedFamilia('') // Resetear familia cuando cambia el área

    // obtener nombre desde areaOptions (no usar variable indefinida)
    const found = (areaOptions ?? []).find((a: any) => String(a.id) === String(value) || String(a.value) === String(value))
    const name = found ? (found.nombre ?? found.name ?? found.label ?? found.text ?? '') : ''
    setSelectedAreaName(name)

    // emitir inmediatamente con id + nombre (familia reseteada)
    emitFilters(fechaCodificacionOption, dateRange, selectedEstadoOp, areaId, '', selectedEstadoAd, name)
  }

  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [areaOptions, setAreaOptions] = useState<Area[]>([])
  const [familiaOptions, setFamiliaOptions] = useState<Familia[]>([])
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

  const emitFilters = (
    df = fechaCodificacionOption,
    dr = dateRange,
    estOp = selectedEstadoOp,
    areaId = selectedAreaId,
    familia = selectedFamilia,
    estAd = selectedEstadoAd,
    areaName = selectedAreaName
  ) => {
    // si no hay nada seleccionado, limpiar filtros
    if (!df && !estOp && !areaId && !familia && !estAd && !areaName) {
      console.log('Header -> emitFilters: no filters selected, clearing')
      onFiltersChange?.(undefined)
      return
    }
    const payload: any = {}
    if (df) payload.dateField = df
    if (dr.start) payload.start = dr.start
    if (dr.end) payload.end = dr.end
    if (estOp) payload.estadoOperativo = estOp
    if (estAd) payload.estadoAdministrativo = estAd
    if (typeof areaId !== 'undefined' && areaId !== null) payload.areaId = areaId
    if (areaName) payload.areaName = areaName
    if (familia) payload.familia = familia
    console.log('Header -> emitFilters', payload)
    onFiltersChange?.(payload)
  }

  const handleFamiliaChange = (value: string) => {
    setSelectedFamilia(value)
    // emitir con area actual y nueva familia
    emitFilters(fechaCodificacionOption, dateRange, selectedEstadoOp, selectedAreaId, value)
  }

  // permitir valor vacío '' = "Seleccione"
  const [fechaCodificacionOption, setFechaCodificacionOption] = useState<'' | 'fecha_codificacion' | 'fecha_muestreo'>('')

  const [dateRange, setDateRange] = useState<{ start?: string, end?: string }>({})
  const [selectedEstadoOp, setSelectedEstadoOp] = useState<string>('')

  const handleFechaCodOptionChange = (value: string) => {
    const v = value as '' | 'fecha_codificacion' | 'fecha_muestreo'
    setFechaCodificacionOption(v)
    // emitir con rango actual (si v === '' no incluye dateField)
    emitFilters(v, dateRange)
  }

  const handleEstadoOpChange = (value: string) => {
    setSelectedEstadoOp(value)
    // emitir con los filtros actuales (incluirá estadoOperativo aunque no haya dateField)
    emitFilters(fechaCodificacionOption, dateRange, value)
  }

  const handleEstadoAdChange = (value: string) => {
    setSelectedEstadoAd(value)
    emitFilters(fechaCodificacionOption, dateRange, selectedEstadoOp, selectedAreaId, selectedFamilia, value)
  }

  // handler que espera [Date|null, Date|null] o {start,end} o strings
  const handleRangeChangeFlexible = (range: any) => {
    let start = ''
    let end = ''
    if (Array.isArray(range)) {
      const s = range[0], e = range[1]
      start = s ? (s instanceof Date ? s.toISOString().slice(0, 10) : String(s).slice(0, 10)) : ''
      end = e ? (e instanceof Date ? e.toISOString().slice(0, 10) : String(e).slice(0, 10)) : ''
    } else if (range && (range.start || range.end)) {
      start = range.start ? (new Date(range.start)).toISOString().slice(0, 10) : ''
      end = range.end ? (new Date(range.end)).toISOString().slice(0, 10) : ''
    } else {
      start = ''; end = ''
    }

    const next = { start, end }
    setDateRange(next)
    emitFilters(fechaCodificacionOption, next)
  }

  useEffect(() => {
    // emitir valores iniciales (por si ya hay un rango preseleccionado)
    emitFilters()
  }, [])

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
            Navegador Global de RCM
          </Typography>
        </Grid>
        <Grid item xs={6} />
        <Grid item xs={3} sx={{ textAlign: 'right' }}>
          <Button variant='contained' color='primary' disabled size='large' sx={{ fontWeight: '' }} onClick={handleMenuOpen}>
            Informes
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={informesOpen}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => handleInforme('densidad')}>Informe Densidad</MenuItem>
            <MenuItem onClick={() => handleInforme('hormigon')}>Informe Hormigón</MenuItem>
          </Menu>
        </Grid>
      </Grid>

      {/* Primera Fila de Inputs */}
      <Grid container alignItems='center' spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            label='Fecha Codificación'
            size='small'
            fullWidth
            select
            value={fechaCodificacionOption}
            onChange={(e) => handleFechaCodOptionChange(e.target.value)}
          >
            <MenuItem value=''>Seleccione</MenuItem>
            <MenuItem value='fecha_codificacion'>Fecha Codificación</MenuItem>
            <MenuItem value='fecha_muestreo'>Fecha de Muestreo</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          {/* Rango de Fechas: pasar onChange */}
          <PickersRange onChange={handleRangeChangeFlexible} />
        </Grid>

      </Grid>

      {/* Segunda Fila de Inputs */}
      <Grid container spacing={2} alignItems='center'>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size='small'>
            <InputLabel id='area-select'>Área</InputLabel>
            <Select
              labelId='area-select'
              label='Área'
              value={selectedAreaId?.toString() || ''}
              onChange={e => handleAreaChange(e.target.value)}
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
              labelId='familia-select'
              label='Familia'
              value={selectedFamilia}
              onChange={e => handleFamiliaChange(e.target.value)}
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

        <Grid item xs={12} sm={3}>
          <TextField
            label='Estado Operativo'
            size='small'
            fullWidth
            select
            value={selectedEstadoOp}
            onChange={(e) => handleEstadoOpChange(e.target.value)}
          >
            <MenuItem value=''>Seleccione</MenuItem>
            {OPERATIONAL_STATES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size='small'>
            <InputLabel id='estado-ad-select'>Estado Administrativo</InputLabel>
            <Select
              labelId='estado-ad-select'
              label='Estado Administrativo'
              value={selectedEstadoAd}
              onChange={e => handleEstadoAdChange(e.target.value)}
            >
              <MenuItem value=''>Seleccione</MenuItem>
              {ADMINISTRATIVE_STATES.map(s => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
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
