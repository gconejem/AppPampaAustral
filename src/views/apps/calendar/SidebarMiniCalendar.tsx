import { useState } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useTheme } from '@mui/material/styles'

interface SidebarMiniCalendarProps {
  onDateSelect?: (date: Date) => void
  currentDate?: Date
}

const SidebarMiniCalendar = ({ onDateSelect, currentDate = new Date() }: SidebarMiniCalendarProps) => {
  const theme = useTheme()
  const [selectedDate, setSelectedDate] = useState(currentDate)
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth())
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear())

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day)

    setSelectedDate(newDate)
    onDateSelect?.(newDate)
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth)
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const days = []

    // Agregar días vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(<Box key={`empty-${i}`} sx={{ width: '30px', height: '30px' }} />)
    }

    // Agregar los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth &&
        selectedDate.getFullYear() === currentYear

      days.push(
        <Box
          key={day}
          onClick={() => handleDateClick(day)}
          sx={{
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '50%',
            backgroundColor: isSelected ? theme.palette.primary.main : 'transparent',
            color: isSelected ? 'white' : 'inherit',
            '&:hover': {
              backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.action.hover
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
    <Box
      sx={{
        width: '100%',
        p: 2,
        '& .MuiBox-root': {
          minWidth: 'unset'
        }
      }}
    >
      {/* Cabecera del calendario */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          px: 1
        }}
      >
        <IconButton size='small' onClick={handlePrevMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography
          variant='subtitle2'
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {`${monthNames[currentMonth]} ${currentYear}`}
        </Typography>
        <IconButton size='small' onClick={handleNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Días de la semana */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          mb: 0.5
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
          gap: 0.5,
          '& > div': {
            width: '25px',
            height: '25px',
            fontSize: '0.75rem'
          }
        }}
      >
        {renderCalendarDays()}
      </Box>
    </Box>
  )
}

export default SidebarMiniCalendar
