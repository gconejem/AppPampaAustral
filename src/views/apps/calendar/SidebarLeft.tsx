// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import SearchIcon from '@mui/icons-material/Search' // Importamos el ícono de búsqueda
import { TextField, InputAdornment } from '@mui/material'

// Third-party imports

import classnames from 'classnames'

// Types Imports
import type { SidebarLeftProps, CalendarFiltersType } from '@/types/apps/calendarTypes'
import type { ThemeColor } from '@core/types'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Slice Imports
import { filterAllCalendarLabels, filterCalendarLabel, selectedEvent } from '@/redux-store/slices/calendar'

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

  // Custom Filters State
  const [clienteFilter, setClienteFilter] = useState<CalendarFiltersType | 'None'>('None')
  const [obraFilter, setObraFilter] = useState<CalendarFiltersType | 'None'>('None')
  const [laboratoristaFilter, setLaboratoristaFilter] = useState<CalendarFiltersType | 'None'>('None')

  const handleFilterChange = (filterType: string, value: CalendarFiltersType | 'None') => {
    switch (filterType) {
      case 'Cliente':
        setClienteFilter(value)
        break
      case 'Obra':
        setObraFilter(value)
        break
      case 'Laboratorista':
        setLaboratoristaFilter(value)
        break
      default:
        break
    }

    // Dispatch the filter change only if the value is not 'None'
    if (value !== 'None') {
      dispatch(filterCalendarLabel(value))
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
      <Divider className='is-full' />
      <AppReactDatepicker
        inline
        onChange={date => calendarApi.gotoDate(date)}
        boxProps={{
          className: 'flex justify-center is-full',
          sx: { '& .react-datepicker': { boxShadow: 'none !important', border: 'none !important' } }
        }}
      />
      <Divider className='is-full' />

      <div className='flex flex-col p-5 is-full'>
        <Typography variant='h5' className='mbe-4'>
          Filtros
        </Typography>

        {/* Campo Cliente con ícono de búsqueda */}
        <FormControl fullWidth variant='outlined' className='mbe-2'>
          <TextField
            variant='outlined'
            placeholder='Cliente'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            onChange={e => handleFilterChange('Cliente', e.target.value as CalendarFiltersType)}
          />
        </FormControl>

        {/* Campo Obra con ícono de búsqueda */}
        <FormControl fullWidth variant='outlined' className='mbe-2'>
          <TextField
            variant='outlined'
            placeholder='Obra'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            onChange={e => handleFilterChange('Obra', e.target.value as CalendarFiltersType)}
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

        {/* Sector Comercial */}
        <FormControl fullWidth variant='outlined' className='mbe-2'>
          <Select
            value={obraFilter}
            onChange={e => handleFilterChange('Obra', e.target.value as CalendarFiltersType)}
            displayEmpty
          >
            <MenuItem value='None'>Sector Comercial</MenuItem>
            <MenuItem value='Obra'></MenuItem>
          </Select>
        </FormControl>

        {/* Comuna */}
        <FormControl fullWidth variant='outlined' className='mbe-2'>
          <Select
            value={obraFilter}
            onChange={e => handleFilterChange('Obra', e.target.value as CalendarFiltersType)}
            displayEmpty
          >
            <MenuItem value='None'>Comuna</MenuItem>
            <MenuItem value='Obra'></MenuItem>
          </Select>
        </FormControl>
      </div>
    </Drawer>
  )
}

export default SidebarLeft
