// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import SearchIcon from '@mui/icons-material/Search'
import { TextField, InputAdornment, Autocomplete } from '@mui/material'
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
    handleAddEventSidebarToggle
  } = props

  // Estados para los filtros
  const [clienteFilter, setClienteFilter] = useState<Cliente | null>(null)
  const [obraFilter, setObraFilter] = useState<Obra | null>(null)
  const [laboratoristaFilter, setLaboratoristaFilter] = useState<Laboratorista | null>(null)
  const [sectorComercialFilter, setSectorComercialFilter] = useState<string | null>(null)
  // Cambiar el estado de comunaFilter a un array para soportar selección múltiple
  const [comunaFilter, setComunaFilter] = useState<string[]>([])

  // Estado para la lista de clientes y obras
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
  const [comunas, setComunas] = useState<string[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [loadingObras, setLoadingObras] = useState(true)
  const [loadingLaboratoristas, setLoadingLaboratoristas] = useState(true)
  const [loadingComunas, setLoadingComunas] = useState(true)

  // Estado para la región seleccionada
  const [regionFilter, setRegionFilter] = useState<string | null>(null)

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

  // Cargar obras al montar el componente
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const response = await fetch('/api/obras')

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
  }, [])

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

  // Actualizar comunas según la región seleccionada
  useEffect(() => {
    if (regionFilter && (REGIONES_CHILE as Record<string, { comunas: string[] }>)[regionFilter]) {
      setComunas((REGIONES_CHILE as Record<string, { comunas: string[] }>)[regionFilter].comunas)
    } else {
      setComunas([])
    }
    setComunaFilter([])
  }, [regionFilter])

  const handleFilterChange = (filterType: string, value: any) => {
    switch (filterType) {
      case 'Cliente':
        setClienteFilter(value)

        if (value) {
          dispatch(filterCalendarLabel(value.razonSocial))
        }

        break
      case 'Obra':
        setObraFilter(value)

        if (value) {
          dispatch(filterCalendarLabel(value.nombreObra))
        }

        break
      case 'Laboratorista':
        setLaboratoristaFilter(value)

        if (value) {
          dispatch(filterCalendarLabel(value.id))
        }

        break
      case 'SectorComercial':
        setSectorComercialFilter(value)

        if (value) {
          dispatch(filterCalendarLabel(value))
        }

        break
      case 'Comuna':
        setComunaFilter(value)

        if (value) {
          dispatch(filterCalendarLabel(value))
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
          }}
          currentDate={memoizedCurrentDate}
          calendarRef={{ current: calendarApi }}
        />
      </Box>

      {/* <Divider className='is-full' /> */}
      <Box sx={{ px: 5, pb: 5 }}>
        <div className='flex flex-col p-5 is-full'>
          <PickersRange />

        </div>
      </Box>

      <Divider className='is-full' />

      {/* Sección de Filtros */}
      <div className='flex flex-col p-5 is-full'>
        <Typography variant='h6' sx={{ mb: 3 }}>
          Filtros
        </Typography>

        {/* Campo Cliente con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            options={clientes}
            getOptionLabel={option => `${option.razonSocial} (${option.rut})`}
            value={clienteFilter}
            onChange={(_, newValue) => handleFilterChange('Cliente', newValue)}
            loading={loadingClientes}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Cliente'
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
            options={obras}
            getOptionLabel={option => `${option.nombreObra} (${option.numeroObra})`}
            value={obraFilter}
            onChange={(_, newValue) => handleFilterChange('Obra', newValue)}
            loading={loadingObras}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Obra'
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
        </FormControl>

        {/* Campo Laboratorista con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            options={laboratoristas}
            getOptionLabel={option => option.name}
            value={laboratoristaFilter}
            onChange={(_, newValue) => handleFilterChange('Laboratorista', newValue)}
            loading={loadingLaboratoristas}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Laboratorista'
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
        </FormControl>

        {/* Campo Sector Comercial con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            options={SECTORES_COMERCIALES.map(s => s.label)}
            value={sectorComercialFilter}
            onChange={(_, newValue) => handleFilterChange('SectorComercial', newValue)}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Sector Comercial'
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

        {/* Campo Región con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            options={Object.keys(REGIONES_CHILE)}
            value={regionFilter}
            onChange={(_, newValue) => setRegionFilter(newValue)}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Región'
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

        {/* Campo Comuna con Autocomplete */}
        <FormControl fullWidth variant='outlined' sx={{ mb: 2 }}>
          <Autocomplete
            multiple
            options={comunas}
            value={comunaFilter}
            onChange={(_, newValue) => setComunaFilter(newValue)}
            renderInput={params => (
              <TextField
                {...params}
                variant='outlined'
                placeholder='Comunas'
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
      </div>
    </Drawer>
  )
}

export default SidebarLeft
