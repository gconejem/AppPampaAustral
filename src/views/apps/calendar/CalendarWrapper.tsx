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

const AppCalendar = () => {
  // States
  const [calendarApi, setCalendarApi] = useState<null | any>(null)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false)
  const [addEventSidebarOpen, setAddEventSidebarOpen] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null } | null>(null)
  const [dateRangeEnabled, setDateRangeEnabled] = useState<boolean>(false)

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
      />
      <div className='p-5 pbe-0 flex-grow overflow-visible bg-backgroundPaper rounded'>
        <Calendar
          handleAddEventSidebarToggle={handleAddEventSidebarToggle}
          selectedDate={dateRangeEnabled ? null : selectedDate}
          selectedDateRange={dateRangeEnabled ? selectedDateRange : null}
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
