// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { TextField, InputAdornment, Autocomplete, FormControlLabel, Checkbox } from '@mui/material'
import Box from '@mui/material/Box'

// Third-party imports
import classnames from 'classnames'

// Types Imports
import type { SidebarLeftProps } from '@/types/apps/calendarTypes'

// Component Imports
import SidebarMiniCalendar from './SidebarMiniCalendar'
import PickersRange from './RangeCalendar'

// Slice Imports
import { filterCalendarLabel, selectedEvent } from '@/redux-store/slices/calendar'
import { SECTORES_COMERCIALES } from '@/constants/sectoresComerciales'
import { REGIONES_CHILE } from '@/data/clientData'

// Interfaces
interface Cliente {
  clienteId: number
  razonSocial: string
  rut: string
  nombreCliente: string
}

interface Obra {
  obraId: number
  numeroObra: string
  nombreObra: string
  direccion: string
  comuna: string
  region: string
}

interface Laboratorista {
  id: string
  name: string
  email: string
}

interface SectorComercial {
  id: string
  nombre: string
}

const SidebarLeft = (props: SidebarLeftProps) => {
  // Props
  const {
    mdAbove,
    leftSidebarOpen,
    calendarStore,
    calendarApi,
    dispatch,
    handleLeftSidebarToggle,
    handleAddEventSidebarToggle,
    onDateSelect,
    onRangeSelect,
    dateRangeEnabled = false,
    onDateRangeToggle,
    filters,
    onFilterChange,
    onClearAllFilters
  } = props

  // Estado para la lista de clientes y obras
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
  const [comunas, setComunas] = useState<string[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [loadingObras, setLoadingObras] = useState(true)
  const [loadingLaboratoristas, setLoadingLaboratoristas] = useState(true)
  const [loadingComunas, setLoadingComunas] = useState(true)

  // Memoizar la fecha actual del calendario para evitar nuevas instancias en cada render
  const memoizedCurrentDate = useMemo(() => {
    return calendarApi?.getDate() ?? null
  }, [calendarApi])

  // Cargar clientes al montar el componente
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch('/api/clientes')

        if (!response.ok) throw new Error('Error al cargar clientes')
        const data = await response.json()

        setClientes(data)
      } catch (error) {
        console.error('Error cargando clientes:', error)
      } finally {
        setLoadingClientes(false)
      }
    }

    fetchClientes()
  }, [])

  // Cargar obras al montar el componente o cuando cambie el cliente seleccionado
  useEffect(() => {
    const fetchObras = async () => {
      try {
        setLoadingObras(true)

        let url = '/api/obras'
        if (filters.cliente) {
          url += `?clienteId=${filters.cliente.clienteId}`
        }

        const response = await fetch(url)

        if (!response.ok) throw new Error('Error al cargar obras')
        const data = await response.json()

        setObras(data)
      } catch (error) {
        console.error('Error cargando obras:', error)
      } finally {
        setLoadingObras(false)
      }
    }

    fetchObras()
  }, [filters.cliente])

  // Cargar laboratoristas al montar el componente
  useEffect(() => {
    const fetchLaboratoristas = async () => {
      try {
        const response = await fetch('/api/users/laboratoristas')

        if (!response.ok) throw new Error('Error al cargar laboratoristas')
        const data = await response.json()

        setLaboratoristas(data)
      } catch (error) {
        console.error('Error cargando laboratoristas:', error)
      } finally {
        setLoadingLaboratoristas(false)
      }
    }

    fetchLaboratoristas()
  }, [])

  // Cargar comunas al montar el componente
  useEffect(() => {
    const fetchComunas = async () => {
      try {
        const response = await fetch('/api/agenda/comunas')

        if (!response.ok) throw new Error('Error al cargar comunas')
        const data = await response.json()

        setComunas(data)
      } catch (error) {
        console.error('Error cargando comunas:', error)
      } finally {
        setLoadingComunas(false)
      }
    }

    fetchComunas()
  }, [])

  // Actualizar comunas según las regiones seleccionadas
  useEffect(() => {
    if (filters.regiones.length > 0) {
      const todasLasComunas: string[] = []
      filters.regiones.forEach(region => {
        if ((REGIONES_CHILE as Record<string, { comunas: string[] }>)[region]) {
          todasLasComunas.push(...(REGIONES_CHILE as Record<string, { comunas: string[] }>)[region].comunas)
        }
      })
      setComunas(todasLasComunas)
    } else {
      setComunas([])
    }
  }, [filters.regiones])

  const handleFilterChange = (filterType: string, value: any) => {
    switch (filterType) {
      case 'TipoEvento':
        onFilterChange('TipoEvento', value)
        if (value && value.length > 0) {
          dispatch(filterCalendarLabel(value[0]))
        }
        break
      case 'Cliente':
        onFilterChange('Cliente', value)
        if (value) {
          dispatch(filterCalendarLabel(value.razonSocial))
        }
        break
      case 'Obra':
        onFilterChange('Obra', value)
        if (value && value.length > 0) {
          dispatch(filterCalendarLabel(value[0].nombreObra))
        }
        break
      case 'Laboratorista':
        onFilterChange('Laboratorista', value)
        if (value && value.length > 0) {
          dispatch(filterCalendarLabel(value[0].name))
        }
        break
      case 'SectorComercial':
        onFilterChange('SectorComercial', value)
        if (value && value.length > 0) {
          dispatch(filterCalendarLabel(value[0]))
        }
        break
      case 'Region':
        onFilterChange('Region', value)
        break
      case 'Comuna':
        onFilterChange('Comuna', value)
        if (value && value.length > 0) {
          dispatch(filterCalendarLabel(value[0]))
        }
        break
      default:
        break
    }
  }

  const handleSidebarToggleSidebar = () => {
    dispatch(selectedEvent(null))
    handleAddEventSidebarToggle()
  }

  const handleClearAllFilters = () => {
    onClearAllFilters()
    dispatch(filterCalendarLabel(''))
  }

  return (
    <Drawer
      open={leftSidebarOpen}
      onClose={handleLeftSidebarToggle}
      variant={mdAbove ? 'permanent' : 'temporary'}
      ModalProps={{
        disablePortal: true,
        disableAutoFocus: true,
        disableScrollLock: true,
        keepMounted: true // Better open performance on mobile.
      }}
      className={classnames('block', { static: mdAbove, absolute: !mdAbove })}
      PaperProps={{
        className: classnames('items-start is-[280px] shadow-none rounded rounded-se-none rounded-ee-none', {
          static: mdAbove,
          absolute: !mdAbove
        })
      }}
      sx={{
        zIndex: 3,
        '& .MuiDrawer-paper': {
          zIndex: mdAbove ? 2 : 'drawer'
        },
        '& .MuiBackdrop-root': {
          borderRadius: 1,
          position: 'absolute'
        }
      }}
    >
      {/* Botón Añadir Cita */}
      <div className='is-full p-5'>
        <Button
          fullWidth
          variant='contained'
          onClick={handleSidebarToggleSidebar}
          startIcon={<i className='ri-add-line' />}
        >
          Añadir Cita
        </Button>
      </div>

      {/* Mini Calendario */}
      <Box sx={{ px: 5, pb: 5 }}>
        <SidebarMiniCalendar
          onDateSelect={date => {
            if (calendarApi) {
              calendarApi.gotoDate(date)
            }
            // Llamar también al callback del padre si existe
            if (onDateSelect) {
              onDateSelect(date)
            }
          }}
          currentDate={memoizedCurrentDate}
          calendarRef={{ current: calendarApi }}
        />
      </Box>

      {/* Sección de Rango de Fechas */}
      <Box sx={{ px: 5 }}>
        <div className='flex flex-col p-5 is-full'>
          <FormControlLabel
            control={
              <Checkbox
                checked={dateRangeEnabled}
                onChange={(e) => onDateRangeToggle?.(e.target.checked)}
                color="primary"
              />
            }
            label="Buscar por rango de fechas"
            sx={{ mb: 2 }}
          />
        </div>
      </Box>

      <Box sx={{ px: 5 }}>
        <div className='flex flex-col p-5 is-full'>
          {dateRangeEnabled && (
            <PickersRange onRangeChange={onRangeSelect} />
          )}
        </div>
      </Box>

      <Divider className='is-full' />

      {/* Sección de Filtros */}
      <div className='flex flex-col p-5 is-full'>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h6'>
            Filtros
          </Typography>
          <Button
            variant='outlined'
            size='small'
            startIcon={<ClearIcon />}
            onClick={handleClearAllFilters}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            Limpiar
          </Button>
        </Box>

        {/* Campo Tipo de Evento con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            options={['Evento', 'Recurrente']}
            value={filters.tiposEvento.length > 0 ? filters.tiposEvento[0] : null}
            onChange={(_, newValue) => handleFilterChange('TipoEvento', newValue ? [newValue] : [])}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase()
              return options.filter(option => option.toLowerCase().includes(searchTerm))
            }}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Tipo de Evento'
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
          {filters.tiposEvento.length > 0 && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              Tipo seleccionado: {filters.tiposEvento[0]}
            </Typography>
          )}
        </FormControl>

        {/* Campo Cliente con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            options={clientes}
            getOptionLabel={option => `${option.razonSocial} (${option.rut})`}
            value={filters.cliente}
            onChange={(_, newValue) => handleFilterChange('Cliente', newValue)}
            loading={loadingClientes}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase()
              return options.filter(option =>
                option.razonSocial.toLowerCase().includes(searchTerm) ||
                option.rut.toLowerCase().includes(searchTerm) ||
                option.nombreCliente.toLowerCase().includes(searchTerm)
              )
            }}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Clientes'
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant='body1'>{option.razonSocial}</Typography>
                  <Typography variant='caption' color='textSecondary'>
                    RUT: {option.rut}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </FormControl>

        {/* Campo Obra con Autocomplete */}
        <FormControl fullWidth variant='outlined' className='mbe-2'>
          <Autocomplete
            multiple
            options={obras}
            getOptionLabel={option => `${option.nombreObra} (${option.numeroObra})`}
            value={filters.obras}
            onChange={(_, newValue) => handleFilterChange('Obra', newValue)}
            loading={loadingObras}
            disabled={!filters.cliente}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase()
              return options.filter(option =>
                option.nombreObra.toLowerCase().includes(searchTerm) ||
                option.numeroObra.toLowerCase().includes(searchTerm) ||
                option.direccion.toLowerCase().includes(searchTerm)
              )
            }}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder={filters.cliente ? 'Obras' : 'Selecciona un cliente primero'}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant='body1'>{option.nombreObra}</Typography>
                  <Typography variant='caption' color='textSecondary' display='block'>
                    N° Obra: {option.numeroObra}
                  </Typography>
                  <Typography variant='caption' color='textSecondary' display='block'>
                    {option.direccion}, {option.comuna}
                  </Typography>
                </Box>
              </li>
            )}
          />
          {filters.cliente && !loadingObras && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {obras.length} obra{obras.length !== 1 ? 's' : ''} disponible{obras.length !== 1 ? 's' : ''} para {filters.cliente.razonSocial}
              {filters.obras.length > 0 && ` - ${filters.obras.length} seleccionada${filters.obras.length !== 1 ? 's' : ''}`}
            </Typography>
          )}
        </FormControl>

        {/* Campo Laboratorista con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            multiple
            options={laboratoristas}
            getOptionLabel={option => option.name}
            value={filters.laboratoristas}
            onChange={(_, newValue) => handleFilterChange('Laboratorista', newValue)}
            loading={loadingLaboratoristas}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase()
              return options.filter(option =>
                option.name.toLowerCase().includes(searchTerm) ||
                option.email.toLowerCase().includes(searchTerm)
              )
            }}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Laboratoristas'
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant='body1'>{option.name}</Typography>
                  <Typography variant='caption' color='textSecondary'>
                    {option.email}
                  </Typography>
                </Box>
              </li>
            )}
          />
          {!loadingLaboratoristas && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {laboratoristas.length} laboratorista{laboratoristas.length !== 1 ? 's' : ''} disponible{laboratoristas.length !== 1 ? 's' : ''}
              {filters.laboratoristas.length > 0 && ` - ${filters.laboratoristas.length} seleccionado${filters.laboratoristas.length !== 1 ? 's' : ''}`}
            </Typography>
          )}
        </FormControl>

        {/* Campo Sector Comercial con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            multiple
            options={SECTORES_COMERCIALES.map(s => s.label)}
            value={filters.sectoresComerciales}
            onChange={(_, newValue) => handleFilterChange('SectorComercial', newValue)}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase()
              return options.filter(option => option.toLowerCase().includes(searchTerm))
            }}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Sectores comerciales'
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
          {SECTORES_COMERCIALES.length > 0 && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {SECTORES_COMERCIALES.length} sector{(SECTORES_COMERCIALES.length as number) !== 1 ? 'es' : ''} disponible{(SECTORES_COMERCIALES.length as number) !== 1 ? 's' : ''}
              {filters.sectoresComerciales.length > 0 && ` - ${filters.sectoresComerciales.length} seleccionado${filters.sectoresComerciales.length !== 1 ? 's' : ''}`}
            </Typography>
          )}
        </FormControl>

        {/* Campo Región con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            multiple
            options={Object.keys(REGIONES_CHILE)}
            value={filters.regiones}
            onChange={(_, newValue) => handleFilterChange('Region', newValue)}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase()
              return options.filter(option => option.toLowerCase().includes(searchTerm))
            }}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Regiones'
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
          {Object.keys(REGIONES_CHILE).length > 0 && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {Object.keys(REGIONES_CHILE).length} region{Object.keys(REGIONES_CHILE).length !== 1 ? 'es' : ''} disponible{Object.keys(REGIONES_CHILE).length !== 1 ? 's' : ''}
              {filters.regiones.length > 0 && ` - ${filters.regiones.length} seleccionada${filters.regiones.length !== 1 ? 's' : ''}`}
            </Typography>
          )}
        </FormControl>

        {/* Campo Comuna con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            multiple
            options={comunas}
            value={filters.comunas}
            onChange={(_, newValue) => handleFilterChange('Comuna', newValue)}
            disabled={filters.regiones.length === 0}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase()
              return options.filter(option => option.toLowerCase().includes(searchTerm))
            }}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder={filters.regiones.length > 0 ? 'Selecciona una o más comunas' : 'Selecciona una región primero'}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            )}
          />
          {filters.regiones.length > 0 && !loadingComunas && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {comunas.length} comuna{comunas.length !== 1 ? 's' : ''} disponible{comunas.length !== 1 ? 's' : ''} de {filters.regiones.length} región{filters.regiones.length !== 1 ? 'es' : ''}
              {filters.comunas.length > 0 && ` - ${filters.comunas.length} seleccionada${filters.comunas.length !== 1 ? 's' : ''}`}
            </Typography>
          )}
        </FormControl>
      </div>
    </Drawer>
  )
}

export default SidebarLeft
