'use client'

import { useState, useEffect } from 'react'
import { Box, Grid, TextField, Typography, Button, FormControl, InputLabel, Select, MenuItem, Menu } from '@mui/material'
import PickersRange from './date'
import OPERATIONAL_STATES from '../../../constants/operationalStates'
import ADMINISTRATIVE_STATES from '../../../constants/administrativeStates'

// Añadidos para DatePicker (date-fns, locale ES)
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'

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

// (se eliminó array local de estados administrativos; se usa ADMINISTRATIVE_STATES)

type FiltersPartial = { dateField?: 'fecha_codificacion' | 'fecha_muestreo'; start?: string; end?: string; estadoOperativo?: string }

const Header = ({ onFiltersChange }: { onFiltersChange?: (f?: FiltersPartial) => void }) => {
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [areaOptions, setAreaOptions] = useState<Area[]>([])
  const [familiaOptions, setFamiliaOptions] = useState<Familia[]>([])
  const [selectedEstadoOp, setSelectedEstadoOp] = useState<string>('') // usa este estado para Estado Operativo
  const [selectedEstadoAd, setSelectedEstadoAd] = useState<string>('')

  // Nuevo estado para Fecha Vencimiento
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('')

  const handleFechaVencimientoChange = (date: Date | null) => {
    setFechaVencimiento(date ? date.toISOString().slice(0, 10) : '')
  }

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

  // Añadir estado para la opción seleccionada en "Fecha Codificacion" ('' = Seleccione)
  const [fechaCodificacionOption, setFechaCodificacionOption] = useState<'' | 'fecha_codificacion' | 'fecha_muestreo'>('')
  const [operationalState, setOperationalState] = useState<OperationalState>('CODIFICADO')

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
            <MenuItem onClick={() => handleInforme('densidad')}>Muestras por Ensayar</MenuItem>
            <MenuItem onClick={() => handleInforme('hormigon')}>Volumen de Muestras Ensayadas</MenuItem>
          </Menu>
        </Grid>
      </Grid>

      {/* Primera Fila de Inputs */}
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <Grid container spacing={2} sx={{ mb: 2 }} alignItems='center'>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label='Fecha Codificación'
              size='small'
              fullWidth
              select
              value={fechaCodificacionOption}
              onChange={(e) => {
                const v = e.target.value as '' | 'fecha_codificacion' | 'fecha_muestreo'
                setFechaCodificacionOption(v)
                // si no hay selección, enviar undefined (sin filtro)
                if (!v) { onFiltersChange?.(undefined); return }
                // emitir con rango actual (PickersRange emitirá también cuando cambie)
                onFiltersChange?.({ dateField: v })
              }}
            >
              <MenuItem value=''>Seleccione</MenuItem>
              <MenuItem value='fecha_codificacion'>Fecha Codificación</MenuItem>
              <MenuItem value='fecha_muestreo'>Fecha de Muestreo</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                '& .MuiInputBase-root': { width: '100%' },
                '& .MuiOutlinedInput-root': { width: '100%' },
                '& input#date-range-picker': { width: '100%' }
              }}
            >
              <PickersRange onChange={(range: [Date | null, Date | null]) => {
                const [sDate, eDate] = range
                // si el rango está incompleto (end null) no emitir filtro todavía
                if (!sDate || !eDate) {
                  console.log('Header -> PickersRange: rango incompleto, esperando end', { sDate, eDate })
                  return
                }

                // construir YYYY-MM-DD usando valores LOCALES (evitar toISOString())
                const pad = (n: number) => String(n).padStart(2, '0')
                const start = `${sDate.getFullYear()}-${pad(sDate.getMonth() + 1)}-${pad(sDate.getDate())}`
                const end = `${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())}`

                // si no hay campo seleccionado no aplicar filtro por fechas
                if (!fechaCodificacionOption) {
                  onFiltersChange?.(undefined)
                  return
                }
                console.log('Header -> emitting date filter (local)', { dateField: fechaCodificacionOption, start, end })
                onFiltersChange?.({ dateField: fechaCodificacionOption as 'fecha_codificacion' | 'fecha_muestreo', start, end })
              }} />
            </Box>
          </Grid>

          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
            <DatePicker
              label='Fecha Vencimiento'
              value={fechaVencimiento ? new Date(fechaVencimiento + 'T00:00:00') : null}
              onChange={handleFechaVencimientoChange}
              slotProps={{
                textField: { fullWidth: true, size: 'small' }
              }}
            />
          </Grid>
        </Grid>
      </LocalizationProvider>

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
                <MenuItem key={area.id} value={area.id.toString()}>
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

        {/* Estado Operativo (ahora sm=3 para 4 columnas iguales) */}
        <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label='Estado Operativo'
            size='small'
            fullWidth
            select
            value={selectedEstadoOp}
            onChange={(e) => {
              const v = e.target.value
              setSelectedEstadoOp(v)
              // emitir filtro parcial; index.tsx lo mergeará con los filtros previos
              onFiltersChange?.({ estadoOperativo: v || undefined })
            }}
          >
            <MenuItem value=''>Todos</MenuItem>
            {OPERATIONAL_STATES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
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
