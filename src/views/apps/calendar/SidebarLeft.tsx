// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import SearchIcon from '@mui/icons-material/Search' // Importamos el ícono de búsqueda
import { TextField, InputAdornment, Autocomplete } from '@mui/material'
import Box from '@mui/material/Box'

// Third-party imports

import classnames from 'classnames'

// Types Imports
import type { SidebarLeftProps, CalendarFiltersType } from '@/types/apps/calendarTypes'
import type { ThemeColor } from '@core/types'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import SidebarMiniCalendar from './SidebarMiniCalendar'

// Slice Imports
import { filterAllCalendarLabels, filterCalendarLabel, selectedEvent } from '@/redux-store/slices/calendar'

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
  const [laboratoristaFilter, setLaboratoristaFilter] = useState<CalendarFiltersType | 'None'>('None')

  // Estado para la lista de clientes y obras
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [loadingObras, setLoadingObras] = useState(true)

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

        if (value !== 'None') {
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
          currentDate={calendarApi?.getDate()}
        />
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

        {/* Select para Laboratorista */}
        <FormControl fullWidth variant='outlined' className='mbe-2'>
          <Select
            value={laboratoristaFilter}
            onChange={e => handleFilterChange('Laboratorista', e.target.value as CalendarFiltersType)}
            displayEmpty
          >
            <MenuItem value='None'> Laboratorista</MenuItem>
            <MenuItem value='Laboratorista'>Laboratorista</MenuItem>
          </Select>
        </FormControl>
      </div>
    </Drawer>
  )
}

export default SidebarLeft
