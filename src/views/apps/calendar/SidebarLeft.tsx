// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import { TextField, InputAdornment, Autocomplete } from '@mui/material'
import Box from '@mui/material/Box'

// Third-party imports
import classnames from 'classnames'

// Types Imports
import type { SidebarLeftProps } from '@/types/apps/calendarTypes'

// Component Imports

import PickersRange from './RangeCalendar'

// Slice Imports
import { filterCalendarLabel, selectedEvent } from '@/redux-store/slices/calendar'
import { SECTORES_COMERCIALES } from '@/constants/sectoresComerciales'
import { REGIONES_CHILE } from '@/data/clientData'

// Imports para permisos - NUEVO
import { usePermissions } from '@/hooks/usePermissions'
import { permisos } from '@/permisos/permisos'


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
    filters,
    onFilterChange,
    onClearAllFilters
  } = props

    // Hook de permisos
  const { hasPermission } = usePermissions()
  
  // Verificar si el usuario solo tiene permisos de lectura
  const soloLectura =
    hasPermission(permisos.empresa.ver) &&
    !hasPermission(permisos.empresa.crear) &&
    !hasPermission(permisos.empresa.editar) &&
    !hasPermission(permisos.empresa.eliminar)

  // Estado para la lista de clientes y obras
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
  const [comunas, setComunas] = useState<string[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [loadingObras, setLoadingObras] = useState(true)
  const [loadingLaboratoristas, setLoadingLaboratoristas] = useState(true)
  const [loadingComunas, setLoadingComunas] = useState(true)



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
          disabled={soloLectura}
          fullWidth
          variant='contained'
          onClick={handleSidebarToggleSidebar}
          startIcon={<i className='ri-add-line' />}
        >
          Añadir Cita
        </Button>
      </div>



      {/* Sección de Rango de Fechas */}
      <Box sx={{ px: 5 }}>
        <div className='flex flex-col p-5 is-full'>
          <PickersRange onRangeChange={onRangeSelect} />
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
            disabled={soloLectura}
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
            getOptionLabel={option => `${option.numeroObra} - ${option.comuna} - ${option.nombreObra.length > 30 ? option.nombreObra.substring(0, 30) + '...' : option.nombreObra}`}
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
                <Typography variant='body1'>
                  {option.numeroObra} - {option.comuna} - {option.nombreObra.length > 30 ? option.nombreObra.substring(0, 30) + '...' : option.nombreObra}
                </Typography>
              </li>
            )}
          />
          {filters.obras.length > 0 && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {filters.obras.length} obra{filters.obras.length !== 1 ? 's' : ''} seleccionada{filters.obras.length !== 1 ? 's' : ''}
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
          {filters.laboratoristas.length > 0 && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {filters.laboratoristas.length} laboratorista{filters.laboratoristas.length !== 1 ? 's' : ''} seleccionado{filters.laboratoristas.length !== 1 ? 's' : ''}
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
          {filters.sectoresComerciales.length > 0 && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {filters.sectoresComerciales.length} sector{filters.sectoresComerciales.length !== 1 ? 'es' : ''} seleccionado{filters.sectoresComerciales.length !== 1 ? 's' : ''}
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
          {filters.regiones.length > 0 && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {filters.regiones.length} región{filters.regiones.length !== 1 ? 'es' : ''} seleccionada{filters.regiones.length !== 1 ? 's' : ''}
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
          {filters.comunas.length > 0 && (
            <Typography variant='caption' color='textSecondary' sx={{ mt: 1, display: 'block' }}>
              {filters.comunas.length} comuna{filters.comunas.length !== 1 ? 's' : ''} seleccionada{filters.comunas.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </FormControl>
      </div>
    </Drawer>
  )
}

export default SidebarLeft
