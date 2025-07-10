import { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useTheme } from '@mui/material/styles'

interface SidebarMiniCalendarProps {
  onDateSelect: (date: Date) => void
  currentDate?: Date
  calendarRef?: React.RefObject<any>
}

const SidebarMiniCalendar = ({ onDateSelect, currentDate = new Date(), calendarRef }: SidebarMiniCalendarProps) => {
  const theme = useTheme()
  // Usar la fecha actual si currentDate es null o undefined
  const safeDate = currentDate ? new Date(currentDate) : new Date()
  const [selectedDate, setSelectedDate] = useState(safeDate)
  const [currentMonth, setCurrentMonth] = useState(safeDate.getMonth())
  const [currentYear, setCurrentYear] = useState(safeDate.getFullYear())

  // Actualizar el mini calendario cuando cambia la fecha en el calendario principal
  useEffect(() => {
    if (currentDate) {
      const safeDate = new Date(currentDate)
      setSelectedDate(safeDate)
      setCurrentMonth(safeDate.getMonth())
      setCurrentYear(safeDate.getFullYear())
    }
  }, [currentDate])

  const daysOfWeek = ['lu', 'ma', 'mi', 'ju', 'vi', 'sa', 'do']

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ]

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = domingo, 1 = lunes, ..., 6 = sábado
    // Queremos que 0 = lunes, ..., 6 = domingo
    const day = new Date(year, month, 1).getDay()
    return (day === 0 ? 6 : day - 1)
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day)

    setSelectedDate(newDate)
    onDateSelect(newDate)

    // Navegar al día seleccionado en el calendario principal
    if (calendarRef?.current) {
      const api = calendarRef.current.getApi()

      api.gotoDate(newDate)
    }
  }

  const handlePrevMonth = () => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear
    const newDate = new Date(newYear, newMonth, 1)

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
    onDateSelect(newDate)

    // Navegar al mes anterior en el calendario principal
    if (calendarRef?.current) {
      const api = calendarRef.current.getApi()

      api.gotoDate(newDate)
    }
  }

  const handleNextMonth = () => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear
    const newDate = new Date(newYear, newMonth, 1)

    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
    onDateSelect(newDate)

    // Navegar al mes siguiente en el calendario principal
    if (calendarRef?.current) {
      const api = calendarRef.current.getApi()

      api.gotoDate(newDate)
    }
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days = []

    // Agregar días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <Box
          key={`empty-${i}`}
          sx={{
            width: 32,
            height: 32,
            m: 0.5
          }}
        />
      )
    }

    // Agregar los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear

      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentMonth &&
        new Date().getFullYear() === currentYear

      days.push(
        <Box
          key={day}
          onClick={() => handleDateClick(day)}
          sx={{
            width: 32,
            height: 32,
            m: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '50%',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
            backgroundColor: isSelected
              ? theme.palette.primary.main
              : isToday
                ? theme.palette.primary.light
                : 'transparent',
            color: isSelected
              ? theme.palette.primary.contrastText
              : isToday
                ? theme.palette.primary.main
                : theme.palette.text.primary,
            '&:hover': {
              backgroundColor: isSelected ? theme.palette.primary.dark : theme.palette.action.hover
            }
          }}
        >
          {day}
        </Box>
      )
    }

    return days
  }

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* Cabecera del calendario */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <IconButton
          onClick={handlePrevMonth}
          sx={{
            p: 1,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography
          variant='subtitle2'
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 500
          }}
        >
          {`${monthNames[currentMonth]} ${currentYear}`}
        </Typography>
        <IconButton
          onClick={handleNextMonth}
          sx={{
            p: 1,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Días de la semana */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          mb: 1
        }}
      >
        {daysOfWeek.map(day => (
          <Typography
            key={day}
            variant='caption'
            sx={{
              textAlign: 'center',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: '0.75rem'
            }}
          >
            {day}
          </Typography>
        ))}
      </Box>

      {/* Días del mes */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          justifyItems: 'center',
          alignItems: 'center'
        }}
      >
        {renderCalendarDays()}
      </Box>
    </Box>
  )
}

export default SidebarMiniCalendar
