import { useEffect, useState } from 'react'

// import { useSelector } from 'react-redux'
import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import EditIcon from '@mui/icons-material/Edit'

import FullCalendar from '@fullcalendar/react'
import type { EventInput, CalendarOptions } from '@fullcalendar/core'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

import { filterEvents } from '@/redux-store/slices/calendar'

// import type { RootState } from '@/redux-store'

// Component Imports
import EventPreview from './preview/EventPreview'
import EditEventSidebar from './edit/EditEventSidebar'
import SidebarLeft from './SidebarLeft'

type CalenderProps = {
  handleAddEventSidebarToggle: () => void
}

type StatusType = 'AGENDADA' | 'COMPLETADA' | 'SUSPENDIDA' | 'REPROGRAMADA'
type StatusFiltersType = Record<StatusType, boolean>

const Calendar = (props: CalenderProps) => {
  const { handleAddEventSidebarToggle } = props

  const [eventMenuAnchorEl, setEventMenuAnchorEl] = useState<null | HTMLElement>(null)
  const isEventMenuOpen = Boolean(eventMenuAnchorEl)

  const [events, setEvents] = useState<EventInput[]>([])
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isMultiSelect, setIsMultiSelect] = useState(false)
  const [selectedEventForView, setSelectedEventForView] = useState<null | any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editEventSidebarOpen, setEditEventSidebarOpen] = useState(false)

  const [statusFilters, setStatusFilters] = useState<StatusFiltersType>({
    AGENDADA: true,
    COMPLETADA: true,
    SUSPENDIDA: true,
    REPROGRAMADA: true
  })

  const [filteredEvents, setFilteredEvents] = useState<EventInput[]>([])

  const handleViewEvent = (eventId: string) => {
    const eventToView = events.find(event => String(event.id) === String(eventId))

    if (eventToView) {
      const formattedEvent = {
        ...eventToView,
        extendedProps: {
          ...eventToView.extendedProps,
          cliente: eventToView.extendedProps?.cliente || eventToView.title,
          estado: eventToView.extendedProps?.estado || 'AGENDADA',
          servicios: eventToView.extendedProps?.servicios || [],
          asignados: eventToView.extendedProps?.asignados || [],
          equipos: eventToView.extendedProps?.equipos || []
        }
      }

      setSelectedEventForView(formattedEvent)
      setPreviewOpen(true)
    }
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setSelectedEventForView(null)
  }

  const handleEditEventSidebarToggle = () => {
    setEditEventSidebarOpen(!editEventSidebarOpen)

    if (editEventSidebarOpen) {
      fetchEvents()
    }
  }

  const handleEventMenuClose = () => {
    setEventMenuAnchorEl(null)
  }

  const handleMenuAction = (action: string) => {
    console.log(`Acción seleccionada: ${action}`)
    handleEventMenuClose()
  }

  const handleFilterStatus = (filters: StatusFiltersType) => {
    setStatusFilters(filters)

    const filtered = events.filter(event => {
      const eventStatus = event.extendedProps?.estado || 'AGENDADA'

      return filters[eventStatus as StatusType]
    })

    setFilteredEvents(filtered)
  }

  useEffect(() => {
    handleFilterStatus(statusFilters)
  }, [events])

  const calendarOptions: CalendarOptions = {
    events: filteredEvents,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: 'prev,next today',
      center: 'title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    views: {
      dayGridMonth: {
        dayMaxEvents: 2
      },
      timeGrid: {
        dayMaxEvents: true
      },
      dayGrid: {
        dayMaxEvents: true
      }
    },
    direction: 'ltr',
    initialDate: new Date(),
    navLinks: true,
    eventClick(info) {
      handleViewEvent(info.event.id)
    },
    dateClick(info) {
      console.log('Fecha clickeada:', info.date)
    },
    eventContent: arg => {
      const backgroundColor = statusColors[arg.event.extendedProps.estado as StatusType]

      return {
        html: `
          <div style="
            background-color: ${alpha(backgroundColor, 0.1)};
            border-left: 4px solid ${backgroundColor};
            padding: 8px;
            border-radius: 4px;
            width: 100%;
          ">
            <div style="color: ${backgroundColor}; font-weight: 500; margin-bottom: 4px;">
              ${arg.event.title}
            </div>
            <div style="font-size: 0.75rem; color: ${alpha(backgroundColor, 0.8)};">
              ${arg.timeText}
              ${arg.event.extendedProps.cliente ? ` - ${arg.event.extendedProps.cliente}` : ''}
            </div>
          </div>
        `
      }
    }
  }

  // Función para formatear la hora
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // Definir colores por estado
  const statusColors: Record<StatusType, string> = {
    AGENDADA: '#4CAF50', // Verde
    COMPLETADA: '#2196F3', // Azul
    SUSPENDIDA: '#F44336', // Rojo
    REPROGRAMADA: '#FF9800' // Naranja
  }

  const fetchEvents = async () => {
    console.log('Iniciando fetchEvents')

    try {
      const response = await fetch('/api/calendar/events')

      if (!response.ok) throw new Error('Error al obtener eventos')
      const data = await response.json()

      setEvents(data)
    } catch (error) {
      console.error('Error al cargar eventos:', error)
      setEvents([])
    }
  }

  // Manejadores de eventos
  useEffect(() => {
    const handleToggleMultiSelect = () => {
      setIsMultiSelect(prev => !prev)
      setSelectedEvents([])
    }

    const handleEditSelected = () => {
      console.log('Editar eventos seleccionados:', selectedEvents)
    }

    document.addEventListener('toggleMultiSelect', handleToggleMultiSelect)
    document.addEventListener('editSelected', handleEditSelected)

    return () => {
      document.removeEventListener('toggleMultiSelect', handleToggleMultiSelect)
      document.removeEventListener('editSelected', handleEditSelected)
    }
  }, [selectedEvents])

  // Agregar el manejador del evento de selección
  useEffect(() => {
    const handleToggleEventSelection = (e: CustomEvent) => {
      const eventId = e.detail

      setSelectedEvents(prev => (prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]))
    }

    document.addEventListener('toggleEventSelection', handleToggleEventSelection as EventListener)

    return () => {
      document.removeEventListener('toggleEventSelection', handleToggleEventSelection as EventListener)
    }
  }, [])

  // Agregar el manejador del evento de visualización
  useEffect(() => {
    const handleViewEventClick = (e: CustomEvent) => {
      handleViewEvent(e.detail)
    }

    document.addEventListener('viewEvent', handleViewEventClick as EventListener)

    return () => {
      document.removeEventListener('viewEvent', handleViewEventClick as EventListener)
    }
  }, [events])

  // Agregar el manejador de edición de eventos
  useEffect(() => {
    const handleEditEventClick = (e: CustomEvent) => {
      const eventId = e.detail
      const eventToEdit = events.find(event => String(event.id) === String(eventId))

      if (eventToEdit) {
        // Cargar el evento y abrir el formulario de edición
        setSelectedEventForView(eventToEdit)
        setEditEventSidebarOpen(true)
      }
    }

    document.addEventListener('editEvent', handleEditEventClick as EventListener)

    return () => {
      document.removeEventListener('editEvent', handleEditEventClick as EventListener)
    }
  }, [events])

  // Agregar useEffect para cargar eventos al inicio
  useEffect(() => {
    fetchEvents()
  }, [])

  return (
    <>
      <Menu anchorEl={eventMenuAnchorEl} open={isEventMenuOpen} onClose={handleEventMenuClose}>
        <MenuItem onClick={() => handleMenuAction('Reprogramar')}>Reprogramar</MenuItem>
        <MenuItem onClick={() => handleMenuAction('Duplicar')}>Duplicar</MenuItem>
        <MenuItem onClick={() => handleMenuAction('Cambiar Estado')}>Cambiar Estado</MenuItem>
      </Menu>

      <Card>
        <CardContent>
          <Box sx={{ height: 'calc(100vh - 16rem)' }}>
            {/* Barra de filtros */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                p: 2,
                borderBottom: theme => `1px solid ${theme.palette.divider}`,
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}
            >
              {Object.entries(statusColors).map(([status, color]) => (
                <Box
                  key={status}
                  onClick={() =>
                    handleFilterStatus({
                      ...statusFilters,
                      [status as StatusType]: !statusFilters[status as StatusType]
                    })
                  }
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    backgroundColor: statusFilters[status as StatusType] ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    border: '1px solid #757575',
                    color: statusFilters[status as StatusType] ? '#1976d2' : '#757575',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.12)',
                      color: '#1976d2'
                    }
                  }}
                >
                  <Box
                    component='span'
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: statusFilters[status as StatusType] ? '#1976d2' : '#757575'
                    }}
                  />
                  {status}
                </Box>
              ))}
            </Box>
            <FullCalendar {...calendarOptions} />
          </Box>
        </CardContent>
      </Card>

      <EventPreview open={previewOpen} onClose={handleClosePreview} event={selectedEventForView} />
      <EditEventSidebar
        editEventSidebarOpen={editEventSidebarOpen}
        handleEditEventSidebarToggle={handleEditEventSidebarToggle}
        selectedEvent={selectedEventForView}
      />
    </>
  )
}

export default Calendar
