import { useEffect, useRef, useState } from 'react'

import { useTheme, Button, Modal, Box, TextField, Checkbox, FormControlLabel, Chip, ButtonGroup } from '@mui/material'
import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions } from '@fullcalendar/core'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonIcon from '@mui/icons-material/Person'
import VisibilityIcon from '@mui/icons-material/Visibility'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

import DeleteIcon from '@mui/icons-material/Delete'

import { filterEvents, selectedEvent, updateEvent } from '@/redux-store/slices/calendar'

type CalenderProps = {
  calendarStore: any
  calendarApi: any
  setCalendarApi: (val: any) => void
  calendarsColor: any
  dispatch: any
  handleLeftSidebarToggle: () => void
  handleAddEventSidebarToggle: () => void
}

const Calendar = (props: CalenderProps) => {
  const {
    calendarStore,
    calendarApi,
    setCalendarApi,
    calendarsColor,
    dispatch,
    handleAddEventSidebarToggle,
    handleLeftSidebarToggle
  } = props

  const [currentView, setCurrentView] = useState('timeGridWeek')

  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('Todas')
  const calendarRef = useRef<any>(null)
  const theme = useTheme()

  // Estado y manejadores para el menú del botón "Editar"
  const [editMenuAnchorEl, setEditMenuAnchorEl] = useState<null | HTMLElement>(null)
  const isEditMenuOpen = Boolean(editMenuAnchorEl)

  const handleEditMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEditMenuAnchorEl(event.currentTarget)
  }

  const handleEditMenuClose = () => {
    setEditMenuAnchorEl(null)
  }

  // Estado y manejadores para el menú de acciones en los eventos
  const [eventMenuAnchorEl, setEventMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [currentEvent, setCurrentEvent] = useState<any>(null)
  const isEventMenuOpen = Boolean(eventMenuAnchorEl)

  const handleEventMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, calendarEvent: any) => {
    event.stopPropagation() // Evita que se abra el formulario al hacer clic
    setEventMenuAnchorEl(event.currentTarget)
    setCurrentEvent(calendarEvent)
  }

  const handleEventMenuClose = () => {
    setEventMenuAnchorEl(null)
    setCurrentEvent(null)
  }

  const handleMenuAction = (action: string) => {
    if (action === 'Reprogramar') {
      console.log('Reprogramar', currentEvent)
    } else if (action === 'Duplicar') {
      console.log('Duplicar', currentEvent)
    } else if (action === 'Cambiar Estado') {
      console.log('Cambiar Estado', currentEvent)
    }

    handleEventMenuClose()
  }

  useEffect(() => {
    if (calendarApi === null) {
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [calendarApi, setCalendarApi])

  const handleCheckboxChange = (eventId: string) => {
    setSelectedEvents(prev => (prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]))
  }

  const handleSelectAllChange = () => {
    setSelectAll(!selectAll)

    if (!selectAll) {
      const allEventIds = calendarStore.events.map(event => event.id)

      setSelectedEvents(allEventIds)
    } else {
      setSelectedEvents([])
    }
  }

  const handleOpenEditModal = () => {
    if (selectedEvents.length > 0) {
      const event = calendarStore.events.find(e => e.id === selectedEvents[0])

      if (event) setEditedTitle(event.title || '')
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSaveTitle = () => {
    selectedEvents.forEach(eventId => {
      const eventToUpdate = calendarApi.getEventById(eventId)

      if (eventToUpdate) {
        eventToUpdate.setProp('title', editedTitle)
        dispatch(updateEvent(eventToUpdate))
      }
    })
    setIsModalOpen(false)
    setSelectedEvents([])
  }

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter)

    // Aquí puedes agregar la lógica para filtrar los eventos según el filtro seleccionado
  }

  const handleEditEvent = (event: any) => {
    // Abre el modal para editar el título del evento
    setEditedTitle(event.title)
    setSelectedEvents([event.id])
    setIsModalOpen(true)
  }

  const handleDeleteEvent = (event: any) => {
    // Elimina el evento del calendario
    event.remove()
    dispatch(filterEvents())
  }

  const calendarOptions: CalendarOptions = {
    events: calendarStore.events,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'listMonth',
    headerToolbar: {
      start: 'sidebarToggle, prev, next, title',
      end: 'dayGridMonth, timeGridWeek, timeGridDay, listMonth'
    },
    views: {
      week: {
        titleFormat: { year: 'numeric', month: 'short', day: 'numeric' }
      }
    },
    editable: true,
    eventResizableFromStart: true,
    dragScroll: true,
    dayMaxEvents: 2,
    navLinks: true,
    eventClassNames({ event: calendarEvent }: any) {
      const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar]

      return [`event-bg-${colorName}`]
    },
    customButtons: {
      sidebarToggle: {
        icon: 'bi bi-list',
        click() {
          handleLeftSidebarToggle()
        }
      }
    },
    dateClick(info: any) {
      const ev = { title: '', start: info.date, end: info.date, allDay: true, extendedProps: { calendar: '' } }

      dispatch(selectedEvent(ev))
      handleAddEventSidebarToggle()
    },
    eventContent: (arg: any) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {/* Checkbox visible solo en modo 'list' */}
          {currentView === 'listMonth' && (
            <input
              type='checkbox'
              onClick={e => e.stopPropagation()} // Detener propagación
              onChange={() => handleCheckboxChange(arg.event.id)}
              checked={selectedEvents.includes(arg.event.id)}
              style={{ marginRight: '5px' }}
            />
          )}
          <b>{arg.event.title}</b>
          {currentView === 'listMonth' && (
            <Chip
              label='Agendada' // Aquí puedes usar dinámicamente el estado
              color='success' // Color verde
              size='small'
              style={{ marginLeft: '500px' }}
            />
          )}
        </div>
        {/* Acciones */}
        {currentView === 'listMonth' && (
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
            <IconButton size='small' onClick={e => e.stopPropagation()}>
              <VisibilityIcon fontSize='small' />
            </IconButton>
            <IconButton size='small' onClick={e => e.stopPropagation()}>
              <EditIcon fontSize='small' />
            </IconButton>
            <IconButton
              size='small'
              onClick={e => handleEventMenuOpen(e, arg.event)} // Abre el menú de acciones del evento
            >
              <MoreVertIcon fontSize='small' />
            </IconButton>
          </div>
        )}
      </div>
    ),
    eventClick({ event: clickedEvent, jsEvent }: any) {
      if ((jsEvent.target as HTMLElement).tagName !== 'INPUT') {
        jsEvent.preventDefault()
        dispatch(selectedEvent(clickedEvent))
        handleAddEventSidebarToggle()

        if (clickedEvent.url) {
          window.open(clickedEvent.url, '_blank')
        }
      }
    },
    eventDrop({ event: droppedEvent }: any) {
      dispatch(updateEvent(droppedEvent))
      dispatch(filterEvents())
    },
    eventResize({ event: resizedEvent }: any) {
      dispatch(updateEvent(resizedEvent))
      dispatch(filterEvents())
    },
    ref: calendarRef,
    direction: theme.direction,
    datesSet: info => {
      setCurrentView(info.view.type)
    }
  }

  return (
    <>
      {/* Menú para las acciones en los eventos */}
      <Menu
        anchorEl={eventMenuAnchorEl}
        open={isEventMenuOpen}
        onClose={handleEventMenuClose}
        MenuListProps={{
          'aria-labelledby': 'event-menu-button'
        }}
      >
        <MenuItem onClick={() => handleMenuAction('Reprogramar')}>Reprogramar</MenuItem>
        <MenuItem onClick={() => handleMenuAction('Duplicar')}>Duplicar</MenuItem>

        <MenuItem onClick={() => handleMenuAction('Cambiar Estado')}>Cambiar Estado</MenuItem>
      </Menu>

      {/* Casilla "Seleccionar todo", botones de filtro y botón Editar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
        <FormControlLabel
          control={<Checkbox checked={selectAll} onChange={handleSelectAllChange} name='selectAll' color='primary' />}
          label='Seleccionar todo'
        />

        {/* Botones de filtro */}
        <ButtonGroup variant='outlined' aria-label='outlined button group'>
          <Button
            variant={selectedFilter === 'Todas' ? 'contained' : 'outlined'}
            onClick={() => handleFilterChange('Todas')}
          >
            Todas
          </Button>
          <Button
            variant={selectedFilter === 'Por Agendar' ? 'contained' : 'outlined'}
            onClick={() => handleFilterChange('Por Agendar')}
          >
            Por Agendar
          </Button>
          <Button
            variant={selectedFilter === 'Agendadas' ? 'contained' : 'outlined'}
            onClick={() => handleFilterChange('Agendadas')}
          >
            Agendadas
          </Button>
          <Button
            variant={selectedFilter === 'Completadas' ? 'contained' : 'outlined'}
            onClick={() => handleFilterChange('Completadas')}
          >
            Completadas
          </Button>
          <Button
            variant={selectedFilter === 'Suspendidas' ? 'contained' : 'outlined'}
            onClick={() => handleFilterChange('Suspendidas')}
          >
            Suspendidas
          </Button>
        </ButtonGroup>

        {/* Botón Editar */}
        <Button variant='contained' color='primary' onClick={handleEditMenuOpen} disabled={selectedEvents.length === 0}>
          Editar
        </Button>

        {/* Menú para el botón "Editar" */}
        <Menu
          anchorEl={editMenuAnchorEl}
          open={isEditMenuOpen}
          onClose={handleEditMenuClose}
          MenuListProps={{
            'aria-labelledby': 'edit-menu-button'
          }}
        >
          <MenuItem
            onClick={() => {
              /* Lógica para asignar laboratorista */
              handleEditMenuClose()
            }}
          >
            Asignar Laboratorista
          </MenuItem>
          <MenuItem
            onClick={() => {
              /* Lógica para reprogramar */
              handleEditMenuClose()
            }}
          >
            Reprogramar
          </MenuItem>
          <MenuItem
            onClick={() => {
              /* Lógica para cambiar estado */
              handleEditMenuClose()
            }}
          >
            Cambiar Estado
          </MenuItem>
        </Menu>
      </div>

      {/* Full Calendar */}
      <div className='calendar-container'>
        <FullCalendar {...calendarOptions} />
      </div>

      {/* Modal para editar el evento */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4
          }}
        >
          <h2>Editar Eventos Seleccionados</h2>
          <TextField
            fullWidth
            label='Título del evento'
            value={editedTitle}
            onChange={e => setEditedTitle(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button variant='contained' color='primary' onClick={handleSaveTitle}>
            Guardar
          </Button>
        </Box>
      </Modal>
    </>
  )
}

export default Calendar
