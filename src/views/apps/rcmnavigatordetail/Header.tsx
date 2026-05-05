'use client'

import { useEffect, useState } from 'react'

import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'

import PickersRange from './date'

interface Area {
  id: number
  nombre: string
}

interface HeaderProps {
  onFiltersChange?: (filters?: {
    dateField?: 'fecha_codificacion' | 'fecha_muestreo' | 'fecha_ingreso' | 'fecha_vencimiento'
    start?: string
    end?: string
    estadoOperativo?: string
    areaId?: number | null
    areaName?: string | null
    ensayador?: string | null
  }) => void
}

const Header = ({ onFiltersChange }: HeaderProps) => {
  const getIsoDate = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')

    return `${y}-${m}-${d}`
  }

  const getDefaultRange = () => {
    const end = new Date()
    const start = new Date()
    start.setMonth(end.getMonth() - 1)

    return {
      start: getIsoDate(start),
      end: getIsoDate(end)
    }
  }

  const defaultRange = getDefaultRange()

  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedAreaName, setSelectedAreaName] = useState<string>('')
  const [selectedEnsayador, setSelectedEnsayador] = useState<string>('')
  const [ensayadorOptions, setEnsayadorOptions] = useState<string[]>([])
  const [areaOptions, setAreaOptions] = useState<Area[]>([])
  const [fechaTipo, setFechaTipo] = useState<'fecha_codificacion' | 'fecha_muestreo' | 'fecha_ingreso' | 'fecha_vencimiento'>('fecha_codificacion')
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(defaultRange)
  const [rangePickerKey, setRangePickerKey] = useState(0)
  const [selectedEstadoOp, setSelectedEstadoOp] = useState<string>('')

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const informesOpen = Boolean(anchorEl)

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)

  const handleInforme = (slug: string) => {
    if (slug === 'densidad') {
      window.open('/informes/densidad', '_blank')
    } else if (slug === 'hormigon') {
      window.open('/informes/hormigon', '_blank')
    } else {
      window.open(`/informes/${slug}`, '_blank')
    }

    handleMenuClose()
  }

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

  useEffect(() => {
    fetch('/api/users/laboratoristas')
      .then(res => res.json())
      .then(data => {
        const names = Array.isArray(data)
          ? Array.from(new Set(data.map((u: any) => String(u?.name ?? '').trim()).filter((name: string) => Boolean(name))))
          : []

        setEnsayadorOptions(names)
      })
      .catch(error => {
        console.error('Error al cargar ensayadores:', error)
        setEnsayadorOptions([])
      })
  }, [])

  const emitFilters = (
    df = fechaTipo,
    dr = dateRange,
    estOp = selectedEstadoOp,
    areaId = selectedAreaId,
    areaName = selectedAreaName,
    ensayador = selectedEnsayador
  ) => {
    const start = dr.start ?? ''
    const end = dr.end ?? ''

    if (!start && !end && !estOp && !areaId && !areaName && !ensayador) {
      onFiltersChange?.(undefined)

      return
    }

    const payload: {
      dateField?: 'fecha_codificacion' | 'fecha_muestreo' | 'fecha_ingreso' | 'fecha_vencimiento'
      start?: string
      end?: string
      estadoOperativo?: string
      areaId?: number | null
      areaName?: string | null
      ensayador?: string | null
    } = {}

    payload.dateField = df

    if (start) payload.start = start
    if (end) payload.end = end
    if (estOp) payload.estadoOperativo = estOp
    if (typeof areaId !== 'undefined' && areaId !== null) payload.areaId = areaId
    if (areaName) payload.areaName = areaName
    if (ensayador) payload.ensayador = ensayador

    onFiltersChange?.(payload)
  }

  const handleFechaTipoChange = (value: string) => {
    const next = value as 'fecha_codificacion' | 'fecha_muestreo' | 'fecha_ingreso' | 'fecha_vencimiento'

    setFechaTipo(next)
    emitFilters(next, dateRange, selectedEstadoOp, selectedAreaId, selectedAreaName, selectedEnsayador)
  }

  const handleAreaChange = (value: string) => {
    const areaId = value ? Number(value) : null
    const found = areaOptions.find(area => String(area.id) === String(value))
    const areaName = found?.nombre ?? ''

    setSelectedAreaId(areaId)
    setSelectedAreaName(areaName)
    emitFilters(fechaTipo, dateRange, selectedEstadoOp, areaId, areaName, selectedEnsayador)
  }

  const handleEstadoToggle = (_event: React.MouseEvent<HTMLElement>, value: string | null) => {
    const next = value ?? ''

    setSelectedEstadoOp(next)
    emitFilters(fechaTipo, dateRange, next, selectedAreaId, selectedAreaName, selectedEnsayador)
  }

  const handleEnsayadorChange = (value: string) => {
    setSelectedEnsayador(value)
    emitFilters(fechaTipo, dateRange, selectedEstadoOp, selectedAreaId, selectedAreaName, value)
  }

  const handleRangeChangeFlexible = (range: any) => {
    let start = ''
    let end = ''

    if (Array.isArray(range)) {
      const s = range[0]
      const e = range[1]

      start = s ? (s instanceof Date ? s.toISOString().slice(0, 10) : String(s).slice(0, 10)) : ''
      end = e ? (e instanceof Date ? e.toISOString().slice(0, 10) : String(e).slice(0, 10)) : ''
    } else if (range && (range.start || range.end)) {
      start = range.start ? new Date(range.start).toISOString().slice(0, 10) : ''
      end = range.end ? new Date(range.end).toISOString().slice(0, 10) : ''
    }

    const nextRange = { start, end }

    setDateRange(nextRange)
    emitFilters(fechaTipo, nextRange, selectedEstadoOp, selectedAreaId, selectedAreaName, selectedEnsayador)
  }

  const handleClearFilters = () => {
    const nextRange = getDefaultRange()

    setFechaTipo('fecha_codificacion')
    setDateRange(nextRange)
    setRangePickerKey(prev => prev + 1)
    setSelectedAreaId(null)
    setSelectedAreaName('')
    setSelectedEnsayador('')
    setSelectedEstadoOp('')

    emitFilters('fecha_codificacion', nextRange, '', null, '', '')
  }

  useEffect(() => {
    emitFilters('fecha_codificacion', defaultRange, '', null, '', '')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      <Grid container alignItems='center' sx={{ mb: 4 }}>
        <Grid item xs={3}>
          <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
            Navegador RCM — Sala
          </Typography>
        </Grid>
        <Grid item xs={6} />
        <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant='outlined'
            color='primary'
            size='large'
            onClick={handleClearFilters}
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              bgcolor: 'common.white',
              fontWeight: 500,
              minWidth: 150,
              '&:hover': {
                borderColor: 'primary.dark',
                bgcolor: 'rgba(105, 108, 255, 0.06)'
              }
            }}
          >
            Limpiar filtros
          </Button>

          <Button variant='contained' color='primary' disabled size='large' onClick={handleMenuOpen}>
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

      <Grid container alignItems='center' spacing={2}>
        <Grid item xs={12} md={2}>
          <TextField
            label='Tipo de Fecha'
            size='small'
            fullWidth
            select
            value={fechaTipo}
            onChange={e => handleFechaTipoChange(e.target.value)}
          >
            <MenuItem value='fecha_codificacion'>Codificación</MenuItem>
            <MenuItem value='fecha_muestreo'>Muestreo</MenuItem>
            <MenuItem value='fecha_ingreso'>Ingreso</MenuItem>
            <MenuItem value='fecha_vencimiento'>Vencimiento</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} md={3}>
          <PickersRange
            key={rangePickerKey}
            onChange={handleRangeChangeFlexible}
            initialStart={dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : null}
            initialEnd={dateRange.end ? new Date(`${dateRange.end}T00:00:00`) : null}
            maxWidth='100%'
          />
        </Grid>

        <Grid item xs={12} md={2}>
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

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size='small'>
            <InputLabel id='ensayador-select'>Ensayador</InputLabel>
            <Select
              labelId='ensayador-select'
              label='Ensayador'
              value={selectedEnsayador}
              onChange={e => handleEnsayadorChange(e.target.value)}
            >
              <MenuItem value=''>Todos</MenuItem>
              {ensayadorOptions.map(name => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container alignItems='center' spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.75 }}>
            <Typography variant='body2' sx={{ fontWeight: 700, color: 'text.secondary' }}>
              ESTADO OPERATIVO
            </Typography>

            <ToggleButtonGroup
              size='small'
              exclusive
              value={selectedEstadoOp || null}
              onChange={handleEstadoToggle}
              aria-label='estado operativo'
            >
              <ToggleButton value='CODIFICADO'>Codificado</ToggleButton>
              <ToggleButton value='EN_PROCESO'>En Proceso</ToggleButton>
              <ToggleButton value='ENSAYADO'>Ensayado</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Header
