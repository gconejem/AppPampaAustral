// React Imports
import { useEffect, useRef, useState } from 'react'

// MUI Imports
import { useTheme, Button, Modal, Box, TextField, Checkbox, FormControlLabel } from '@mui/material'

// Third-party imports
import type { Dispatch } from '@reduxjs/toolkit'
import 'bootstrap-icons/font/bootstrap-icons.css'

import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { CalendarOptions } from '@fullcalendar/core'

// Type Imports
import type { AddEventType, CalendarColors, CalendarType } from '@/types/apps/calendarTypes'

// Slice Imports
import { filterEvents, selectedEvent, updateEvent } from '@/redux-store/slices/calendar'

type CalenderProps = {
  calendarStore: CalendarType
  calendarApi: any
  setCalendarApi: (val: any) => void
  calendarsColor: CalendarColors
  dispatch: Dispatch
  handleLeftSidebarToggle: () => void
  handleAddEventSidebarToggle: () => void
}

const blankEvent: AddEventType = {
  title: '',
  start: '',
  end: '',
  allDay: false,
  url: '',
  extendedProps: {
    calendar: '',
    guests: [],
    description: ''
  }
}

const Calendar = (props: CalenderProps) => {
  // Props
  const {
    calendarStore,
    calendarApi,
    setCalendarApi,
    calendarsColor,
    dispatch,
    handleAddEventSidebarToggle,
    handleLeftSidebarToggle
  } = props

  // States for checkboxes and modal
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')

  // Refs
  const calendarRef = useRef<any>(null)

  // Hooks
  const theme = useTheme()

  useEffect(() => {
    if (calendarApi === null) {
      setCalendarApi(calendarRef.current?.getApi())
    }
  }, [calendarApi, setCalendarApi])

  // Handle checkbox changes
  const handleCheckboxChange = (eventId: string) => {
    setSelectedEvents(prev => (prev.includes(eventId) ? prev.filter(id => id !== eventId) : [...prev, eventId]))
  }

  // Handle "Seleccionar todo" checkbox change
  const handleSelectAllChange = () => {
    setSelectAll(!selectAll)

    if (!selectAll) {
      const allEventIds = calendarStore.events.map(event => event.id)

      setSelectedEvents(allEventIds)
    } else {
      setSelectedEvents([])
    }
  }

  // Handle opening the modal for editing events
  const handleOpenEditModal = () => {
    if (selectedEvents.length > 0) {
      const event = calendarStore.events.find(e => e.id === selectedEvents[0])

      if (event) setEditedTitle(event.title || '')
      setIsModalOpen(true)
    }
  }

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  // Handle saving the edited title
  const handleSaveTitle = () => {
    selectedEvents.forEach(eventId => {
      const eventToUpdate = calendarApi.getEventById(eventId)

      if (eventToUpdate) {
        eventToUpdate.setProp('title', editedTitle)
        dispatch(updateEvent(eventToUpdate))
      }
    })
    setIsModalOpen(false)
    setSelectedEvents([]) // Clear the selected events
  }

  // calendarOptions(Props)
  const calendarOptions: CalendarOptions = {
    events: calendarStore.events,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      start: 'sidebarToggle, prev, next, title',
      end: 'timeGridWeek, timeGridDay, listMonth, dayGridMonth'
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

    // Avoid opening the event if clicking on the checkbox
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

    customButtons: {
      sidebarToggle: {
        icon: 'bi bi-list',
        click() {
          handleLeftSidebarToggle()
        }
      }
    },

    dateClick(info: any) {
      const ev = { ...blankEvent }

      ev.start = info.date
      ev.end = info.date
      ev.allDay = true

      dispatch(selectedEvent(ev))
      handleAddEventSidebarToggle()
    },

    eventContent: (arg: any) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <input
            type='checkbox'
            onChange={() => handleCheckboxChange(arg.event.id)}
            checked={selectedEvents.includes(arg.event.id)}
            style={{ marginRight: '5px' }}
          />
          <b>{arg.event.title}</b>
        </div>
      </div>
    ),

    eventDrop({ event: droppedEvent }: any) {
      dispatch(updateEvent(droppedEvent))
      dispatch(filterEvents())
    },

    eventResize({ event: resizedEvent }: any) {
      dispatch(updateEvent(resizedEvent))
      dispatch(filterEvents())
    },

    ref: calendarRef,
    direction: theme.direction
  }

  return (
    <>
      {/* Casilla "Seleccionar todo" y botón "Editar" alineados */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <FormControlLabel
          control={<Checkbox checked={selectAll} onChange={handleSelectAllChange} name='selectAll' color='primary' />}
          label='Seleccionar todo'
        />

        <Button
          variant='contained'
          color='primary'
          onClick={handleOpenEditModal}
          disabled={selectedEvents.length === 0}
          style={{ marginLeft: 'auto' }}
        >
          Editar Seleccionados
        </Button>
      </div>

      {/* Full Calendar */}
      <div>
        <FullCalendar {...calendarOptions} />
      </div>

      {/* Modal for editing the event */}
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
