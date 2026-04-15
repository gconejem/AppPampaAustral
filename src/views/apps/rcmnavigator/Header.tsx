'use client'

import { useMemo, useState, useEffect } from 'react'
import { Box, Grid, TextField, MenuItem, Typography, Button, FormControl, InputLabel, Select, Menu, Checkbox, ListItemText } from '@mui/material'

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
    estadoOperativo?: string | string[]
    estadoAdministrativo?: string | string[]
    areaId?: number | null
    areaName?: string
    familia?: string
    sede?: string
  }) => void
}

const Header = ({ onFiltersChange }: HeaderProps) => {
  const OP_ALL = '__ALL_OP__'
  const AD_ALL = '__ALL_AD__'

  const formatYMDLocal = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const computeDefaultDateRange = () => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - 2)
    return { start: formatYMDLocal(start), end: formatYMDLocal(end) }
  }

  const parseYMDToDate = (ymd?: string) => {
    const s = String(ymd ?? '').trim()
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }

  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedAreaName, setSelectedAreaName] = useState<string>('')
  const [selectedSede, setSelectedSede] = useState<string>('')
  const [sedeOptions, setSedeOptions] = useState<string[]>([])

  const handleAreaChange = (value: string) => {
    const areaId = value ? Number(value) : null
    setSelectedAreaId(areaId)
    setSelectedFamilia('') // Resetear familia cuando cambia el área

    // obtener nombre desde areaOptions (no usar variable indefinida)
    const found = (areaOptions ?? []).find(a => String(a.id) === String(value))
    const name = found?.nombre ?? ''
    setSelectedAreaName(name)

    // emitir inmediatamente con id + nombre (familia reseteada)
    emitFilters(fechaCodificacionOption, dateRange, selectedEstadoOp, areaId, '', selectedEstadoAd, name)
  }

  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [areaOptions, setAreaOptions] = useState<Area[]>([])
  const [familiaOptions, setFamiliaOptions] = useState<Familia[]>([])
  const [selectedEstadoAd, setSelectedEstadoAd] = useState<string[]>([])

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

  // Cargar sedes (para filtro)
  useEffect(() => {
    fetch('/api/sedes')
      .then(res => res.json())
      .then(data => {
        setSedeOptions(Array.isArray(data) ? data : [])
      })
      .catch(error => {
        console.error('Error al cargar sedes:', error)
        setSedeOptions([])
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
    areaName = selectedAreaName,
    sede = selectedSede
  ) => {
    const hasAny = (v: any) => {
      if (Array.isArray(v)) return v.length > 0
      return Boolean(String(v ?? '').trim())
    }

    // si no hay nada seleccionado, limpiar filtros
    if (!df && !hasAny(estOp) && !areaId && !familia && !hasAny(estAd) && !areaName && !hasAny(sede)) {
      console.log('Header -> emitFilters: no filters selected, clearing')
      onFiltersChange?.(undefined)
      return
    }
    const payload: any = {}
    if (df) payload.dateField = df
    if (dr.start) payload.start = dr.start
    if (dr.end) payload.end = dr.end
    if (hasAny(estOp)) payload.estadoOperativo = estOp
    if (hasAny(estAd)) payload.estadoAdministrativo = estAd
    if (typeof areaId !== 'undefined' && areaId !== null) payload.areaId = areaId
    if (areaName) payload.areaName = areaName
    if (familia) payload.familia = familia
    if (hasAny(sede)) payload.sede = sede
    console.log('Header -> emitFilters', payload)
    onFiltersChange?.(payload)
  }

  const handleFamiliaChange = (value: string) => {
    setSelectedFamilia(value)
    // emitir con area actual y nueva familia
    emitFilters(fechaCodificacionOption, dateRange, selectedEstadoOp, selectedAreaId, value)
  }

  const handleSedeChange = (value: string) => {
    setSelectedSede(value)
    emitFilters(fechaCodificacionOption, dateRange, selectedEstadoOp, selectedAreaId, selectedFamilia, selectedEstadoAd, selectedAreaName, value)
  }

  // permitir valor vacío '' = "Seleccione"
  const [fechaCodificacionOption, setFechaCodificacionOption] = useState<'' | 'fecha_codificacion' | 'fecha_muestreo'>('fecha_codificacion')

  // Default: mostrar 2 meses hacia atrás
  const [dateRange, setDateRange] = useState<{ start?: string, end?: string }>(computeDefaultDateRange)
  const [selectedEstadoOp, setSelectedEstadoOp] = useState<string[]>([])
  const [pickerResetTick, setPickerResetTick] = useState(0)

  const operationalStatesForFilter = useMemo(
    () =>
      (OPERATIONAL_STATES ?? []).filter((s: any) => {
        const v = String(s?.value ?? '').trim()
        return v && v !== 'EVENTO' && v !== 'CERRADO_OP'
      }),
    []
  )

  const operationalValues = useMemo(
    () => operationalStatesForFilter.map((s: any) => String(s?.value ?? '').trim()).filter(Boolean),
    [operationalStatesForFilter]
  )
  const administrativeValues = useMemo(
    () => (ADMINISTRATIVE_STATES ?? []).map((s: any) => String(s?.value ?? '').trim()).filter(Boolean),
    []
  )

  const isAllOpSelected = selectedEstadoOp.length > 0 && selectedEstadoOp.length === operationalValues.length
  const isAllAdSelected = selectedEstadoAd.length > 0 && selectedEstadoAd.length === administrativeValues.length

  const handleFechaCodOptionChange = (value: string) => {
    const v = value as '' | 'fecha_codificacion' | 'fecha_muestreo'
    setFechaCodificacionOption(v)
    // emitir con rango actual (si v === '' no incluye dateField)
    emitFilters(v, dateRange)
  }

  const handleEstadoOpChange = (raw: any) => {
    const incoming = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : []
    if (incoming.includes(OP_ALL)) {
      const next = isAllOpSelected ? [] : operationalValues
      setSelectedEstadoOp(next)
      emitFilters(fechaCodificacionOption, dateRange, next)
      return
    }
    const next = incoming.filter((v: any) => v !== OP_ALL)
    setSelectedEstadoOp(next)
    emitFilters(fechaCodificacionOption, dateRange, next)
  }

  const handleEstadoAdChange = (raw: any) => {
    const incoming = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : []
    if (incoming.includes(AD_ALL)) {
      const next = isAllAdSelected ? [] : administrativeValues
      setSelectedEstadoAd(next)
      emitFilters(fechaCodificacionOption, dateRange, selectedEstadoOp, selectedAreaId, selectedFamilia, next)
      return
    }
    const next = incoming.filter((v: any) => v !== AD_ALL)
    setSelectedEstadoAd(next)
    emitFilters(fechaCodificacionOption, dateRange, selectedEstadoOp, selectedAreaId, selectedFamilia, next)
  }

  // handler que espera [Date|null, Date|null] o {start,end} o strings
  const handleRangeChangeFlexible = (range: any) => {
    let start = ''
    let end = ''
    if (Array.isArray(range)) {
      const s = range[0], e = range[1]
      start = s ? (s instanceof Date ? formatYMDLocal(s) : String(s).slice(0, 10)) : ''
      end = e ? (e instanceof Date ? formatYMDLocal(e) : String(e).slice(0, 10)) : ''
    } else if (range && (range.start || range.end)) {
      start = range.start ? formatYMDLocal(new Date(range.start)) : ''
      end = range.end ? formatYMDLocal(new Date(range.end)) : ''
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

  const handleClearFilters = () => {
    const nextDateRange = computeDefaultDateRange()

    setFechaCodificacionOption('fecha_codificacion')
    setDateRange(nextDateRange)
    setPickerResetTick(t => t + 1)

    setSelectedAreaId(null)
    setSelectedAreaName('')
    setSelectedFamilia('')
    setSelectedEstadoOp([])
    setSelectedEstadoAd([])
    setSelectedSede('')

    // Mantener fecha por defecto y liberar el resto.
    onFiltersChange?.({
      dateField: 'fecha_codificacion',
      start: nextDateRange.start,
      end: nextDateRange.end
    })
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
            Navegador
          </Typography>
        </Grid>
        <Grid item xs={6} />
        <Grid item xs={3} sx={{ textAlign: 'right' }}>
          <Button
            variant='outlined'
            color='primary'
            size='large'
            sx={{ mr: 2, textTransform: 'none' }}
            onClick={handleClearFilters}
          >
            Limpiar filtros
          </Button>

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
          <PickersRange
            key={pickerResetTick}
            onChange={handleRangeChangeFlexible}
            initialStart={parseYMDToDate(dateRange.start) ?? undefined}
            initialEnd={parseYMDToDate(dateRange.end) ?? undefined}
          />
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
            <InputLabel id='familia-select'>Tipo de Servicio</InputLabel>
            <Select
              labelId='familia-select'
              label='Tipo de Servicio'
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
          <FormControl fullWidth size='small'>
            <InputLabel id='estado-op-select' shrink>
              Estado Operativo
            </InputLabel>
            <Select
              labelId='estado-op-select'
              label='Estado Operativo'
              multiple
              displayEmpty
              value={selectedEstadoOp}
              onChange={e => handleEstadoOpChange(e.target.value)}
              renderValue={(selected) => {
                const arr = Array.isArray(selected) ? selected : []
                if (!arr.length) return 'Seleccione'
                if (arr.length === operationalValues.length) return 'Todos'
                return `${arr.length} seleccionado(s)`
              }}
            >
              <MenuItem value={OP_ALL}>
                <Checkbox
                  checked={isAllOpSelected}
                  indeterminate={selectedEstadoOp.length > 0 && !isAllOpSelected}
                />
                <ListItemText primary='Seleccionar todos' />
              </MenuItem>
              {operationalStatesForFilter.map((s: any) => (
                <MenuItem key={s.value} value={s.value}>
                  <Checkbox checked={selectedEstadoOp.includes(s.value)} />
                  <ListItemText primary={s.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size='small'>
            <InputLabel id='estado-ad-select' shrink>
              Estado Administrativo
            </InputLabel>
            <Select
              labelId='estado-ad-select'
              label='Estado Administrativo'
              multiple
              displayEmpty
              value={selectedEstadoAd}
              onChange={e => handleEstadoAdChange(e.target.value)}
              renderValue={(selected) => {
                const arr = Array.isArray(selected) ? selected : []
                if (!arr.length) return 'Seleccione'
                if (arr.length === administrativeValues.length) return 'Todos'
                return `${arr.length} seleccionado(s)`
              }}
            >
              <MenuItem value={AD_ALL}>
                <Checkbox
                  checked={isAllAdSelected}
                  indeterminate={selectedEstadoAd.length > 0 && !isAllAdSelected}
                />
                <ListItemText primary='Seleccionar todos' />
              </MenuItem>
              {ADMINISTRATIVE_STATES.map((s: any) => (
                <MenuItem key={s.value} value={s.value}>
                  <Checkbox checked={selectedEstadoAd.includes(s.value)} />
                  <ListItemText primary={s.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Tercera Fila: Sede */}
      <Grid container spacing={2} alignItems='center' sx={{ mt: 0.5 }}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size='small'>
            <InputLabel id='sede-select'>Sede</InputLabel>
            <Select
              labelId='sede-select'
              label='Sede'
              value={selectedSede}
              onChange={e => handleSedeChange(String(e.target.value ?? ''))}
            >
              <MenuItem value=''>Todas las sedes</MenuItem>
              {sedeOptions.map(s => (
                <MenuItem key={s} value={s}>
                  {s}
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
