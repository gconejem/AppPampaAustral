'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import { useMediaQuery } from '@mui/material'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import { useDispatch, useSelector } from 'react-redux'

// Type Imports
import type { CalendarColors, CalendarType } from '@/types/apps/calendarTypes'

// Component Imports
import Calendar from './Calendar'
import SidebarLeft from './SidebarLeft'
import AddEventSidebar from './AddEventSidebar'

// CalendarColors Object
const calendarsColor: CalendarColors = {
  Personal: 'error',
  Business: 'primary',
  Family: 'warning',
  Holiday: 'success',
  ETC: 'info'
}

// Interfaces para los filtros
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

interface CalendarFilters {
  cliente: Cliente | null
  obras: Obra[]
  laboratoristas: Laboratorista[]
  sectoresComerciales: string[]
  regiones: string[]
  comunas: string[]
  tiposEvento: string[]
}

const AppCalendar = () => {
  // States
  const [calendarApi, setCalendarApi] = useState<null | any>(null)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false)
  const [addEventSidebarOpen, setAddEventSidebarOpen] = useState<boolean>(false)
  // Cambiar aquí: inicializar con la fecha de hoy
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null } | null>(null)
  const [dateRangeEnabled, setDateRangeEnabled] = useState<boolean>(false)

  // Estados para los filtros
  const [filters, setFilters] = useState<CalendarFilters>({
    cliente: null,
    obras: [],
    laboratoristas: [],
    sectoresComerciales: [],
    regiones: [],
    comunas: [],
    tiposEvento: []
  })

  // Hooks
  const dispatch = useDispatch()
  const calendarStore = useSelector((state: { calendarReducer: CalendarType }) => state.calendarReducer)
  const mdAbove = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))

  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen)

  const handleAddEventSidebarToggle = () => setAddEventSidebarOpen(!addEventSidebarOpen)

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Limpiar el rango cuando se selecciona una fecha específica
    setSelectedDateRange(null)
  }

  const handleRangeSelect = (startDate: Date | null, endDate: Date | null) => {
    if (dateRangeEnabled) {
      setSelectedDateRange({ start: startDate, end: endDate })
      // Limpiar la fecha específica cuando se selecciona un rango
      setSelectedDate(null)
    }
  }

  const handleDateRangeToggle = (enabled: boolean) => {
    setDateRangeEnabled(enabled)
    if (!enabled) {
      // Si se desactiva el rango, limpiar la selección de rango
      setSelectedDateRange(null)
    } else {
      // Si se activa el rango, limpiar la fecha específica
      setSelectedDate(null)
    }
  }

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => {
      switch (filterType) {
        case 'Cliente':
          return {
            ...prev,
            cliente: value,
            obras: [] // Limpiar obras cuando cambia el cliente
          }
        case 'Obra':
          return {
            ...prev,
            obras: value
          }
        case 'Laboratorista':
          return {
            ...prev,
            laboratoristas: value
          }
        case 'SectorComercial':
          return {
            ...prev,
            sectoresComerciales: value
          }
        case 'Region':
          return {
            ...prev,
            regiones: value,
            comunas: [] // Limpiar comunas cuando cambian las regiones
          }
        case 'Comuna':
          return {
            ...prev,
            comunas: value
          }
        case 'TipoEvento':
          return {
            ...prev,
            tiposEvento: value
          }
        default:
          return prev
      }
    })
  }

  const handleClearAllFilters = () => {
    setFilters({
      cliente: null,
      obras: [],
      laboratoristas: [],
      sectoresComerciales: [],
      regiones: [],
      comunas: [],
      tiposEvento: []
    })
  }

  return (
    <>
      <SidebarLeft
        mdAbove={mdAbove}
        dispatch={dispatch}
        calendarApi={calendarApi}
        calendarStore={calendarStore}
        calendarsColor={calendarsColor}
        leftSidebarOpen={leftSidebarOpen}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
        handleAddEventSidebarToggle={handleAddEventSidebarToggle}
        onDateSelect={handleDateSelect}
        onRangeSelect={handleRangeSelect}
        dateRangeEnabled={dateRangeEnabled}
        onDateRangeToggle={handleDateRangeToggle}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearAllFilters={handleClearAllFilters}
      />
      <div className='p-5 pbe-0 flex-grow overflow-visible bg-backgroundPaper rounded'>
        <Calendar
          handleAddEventSidebarToggle={handleAddEventSidebarToggle}
          addEventSidebarOpen={addEventSidebarOpen}
          selectedDate={dateRangeEnabled ? null : selectedDate}
          selectedDateRange={dateRangeEnabled ? selectedDateRange : null}
          filters={filters}
          onDateChange={handleDateSelect}
          onDateRangeChange={handleRangeSelect}
        />
      </div>
      <AddEventSidebar
        addEventSidebarOpen={addEventSidebarOpen}
        handleAddEventSidebarToggle={handleAddEventSidebarToggle}
      />
    </>
  )
}

export default AppCalendar
