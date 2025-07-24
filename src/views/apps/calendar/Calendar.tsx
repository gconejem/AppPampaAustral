import { useEffect, useState } from 'react'

import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'

import FullCalendar from '@fullcalendar/react'
import type { EventInput, CalendarOptions } from '@fullcalendar/core'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import axios from 'axios'
import { useSnackbar } from 'notistack'

// Component Imports
import EventPreview from './preview/EventPreview'
import EditEventSidebar from './edit/EditEventSidebar'
import AsignarLaboratoristaModal from './modals/AsignarLaboratoristaModal'
import ReprogramarEventoModal from './modals/ReprogramarEventoModal'
import CambiarEstadoModal from './modals/CambiarEstadoModal'
import type { CalendarProps } from '@/types/apps/calendarTypes'

type CalenderProps = CalendarProps & {
  handleAddEventSidebarToggle: () => void
}

type StatusType = 'AGENDADA' | 'COMPLETADA' | 'SUSPENDIDA' | 'REPROGRAMADA'
type StatusFiltersType = Record<StatusType, boolean>

interface EventInfo {
  event: {
    id: string | number
    title: string
    start: Date
    end: Date
    extendedProps: any
  }
  view: {
    type: string
  }
  timeText: string
}

interface HeaderInfo {
  el: HTMLElement
}

interface SelectedEvent {
  id: string
  title: string
  start: string
  end: string
  laboratoristas?: string[]
}

const Calendar = (props: CalenderProps) => {
  const [eventMenuAnchorEl, setEventMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [bulkEditMenuAnchorEl, setBulkEditMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [events, setEvents] = useState<EventInput[]>([])
  const [selectedEvents, setSelectedEvents] = useState<SelectedEvent[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [selectedEventForView, setSelectedEventForView] = useState<null | any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editEventSidebarOpen, setEditEventSidebarOpen] = useState(false)
  const [asignarLaboratoristaOpen, setAsignarLaboratoristaOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [reprogramarModalOpen, setReprogramarModalOpen] = useState(false)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cambiarEstadoModalOpen, setCambiarEstadoModalOpen] = useState(false)
  const [selectedEventEstado, setSelectedEventEstado] = useState<string>('AGENDADA')

  const [selectedEventDates, setSelectedEventDates] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  })

  const [statusFilters, setStatusFilters] = useState<StatusFiltersType>({
    AGENDADA: true,
    COMPLETADA: false,
    SUSPENDIDA: false,
    REPROGRAMADA: false
  })

  const [filteredEvents, setFilteredEvents] = useState<EventInput[]>([])

  const { enqueueSnackbar } = useSnackbar()

  // Helper function to format date to YYYY-MM-DD in local timezone
  const formatDateToString = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const handleViewEvent = (eventId: string) => {
    const eventToView = events.find(event => String(event.id) === String(eventId))

    if (eventToView) {
      const formattedEvent = {
        id: eventToView.id,
        title: eventToView.title,
        start: eventToView.start,
        end: eventToView.end,
        backgroundColor: statusColors[eventToView.extendedProps?.estado as StatusType] || statusColors.AGENDADA,
        extendedProps: {
          estado: eventToView.extendedProps?.estado || 'AGENDADA',
          tipoVisita: eventToView.extendedProps?.tipoVisita,
          esRecurrente: eventToView.extendedProps?.esRecurrente || false,
          cliente: eventToView.extendedProps?.cliente?.nombreCliente || eventToView.title,
          obra: eventToView.extendedProps?.obra,
          solicitud: eventToView.extendedProps?.solicitud,
          sectorComercial: eventToView.extendedProps?.sectorComercial,
          region: eventToView.extendedProps?.region,
          comuna: eventToView.extendedProps?.comuna,
          servicios: eventToView.extendedProps?.servicios || [],
          asignados: eventToView.extendedProps?.asignados || [],
          equipos: eventToView.extendedProps?.equipos || [],
          observaciones: eventToView.extendedProps?.observaciones,
          contactos: eventToView.extendedProps?.contactos || []
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

  const handleDuplicarEvento = async () => {
    if (!selectedEventId) return

    try {
      const response = await fetch(`/api/agenda/${selectedEventId}/duplicar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Error al duplicar el evento')

      await fetchEvents()
      setSnackbarMessage('¡Evento duplicado exitosamente!')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)
    } catch (error) {
      console.error('Error:', error)
      setSnackbarMessage('Error al duplicar el evento')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
    }
  }

  const handleEliminarEvento = async () => {
    if (!selectedEventId) return

    try {
      const response = await fetch(`/api/agenda/${selectedEventId}/eliminar`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar el evento')

      await fetchEvents()
      setSnackbarMessage('¡Evento eliminado exitosamente!')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error:', error)
      setSnackbarMessage('Error al eliminar el evento')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
    }
  }

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!selectedEventId) return

    try {
      const response = await fetch(`/api/agenda/${selectedEventId}/cambiar-estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (!response.ok) throw new Error('Error al cambiar el estado del evento')

      await fetchEvents()
      setSnackbarMessage('¡Estado actualizado exitosamente!')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)
    } catch (error) {
      console.error('Error:', error)
      setSnackbarMessage('Error al cambiar el estado del evento')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
      throw error
    }
  }

  const handleMenuAction = async (action: string) => {
    switch (action) {
      case 'reprogramar':
        const eventToReprogramar = events.find(event => String(event.id) === String(selectedEventId))

        if (eventToReprogramar) {
          setSelectedEventDates({
            start: new Date(eventToReprogramar.start as string),
            end: new Date(eventToReprogramar.end as string)
          })
          setReprogramarModalOpen(true)
        }

        break
      case 'duplicar':
        await handleDuplicarEvento()
        break
      case 'cambiarEstado':
        const eventToChangeStatus = events.find(event => String(event.id) === String(selectedEventId))

        if (eventToChangeStatus) {
          setSelectedEventEstado(eventToChangeStatus.extendedProps?.estado || 'AGENDADA')
          setCambiarEstadoModalOpen(true)
        }

        break
      case 'eliminar':
        setDeleteDialogOpen(true)
        break
    }

    handleEventMenuClose()
  }

  const handleFilterStatus = (filters: StatusFiltersType) => {
    setStatusFilters(filters)

    // Verificar si todos los filtros están desactivados
    const todosDesactivados = Object.values(filters).every(value => !value)

    // Si todos están desactivados, mostrar todos los eventos
    const filtered = todosDesactivados
      ? events
      : events.filter(event => {
        const eventStatus = event.extendedProps?.estado || 'AGENDADA'

        return filters[eventStatus as StatusType]
      })

    setFilteredEvents(filtered)
  }

  // Agregar filtro por fecha cuando selectedDate esté presente
  useEffect(() => {
    if (props.selectedDateRange && props.selectedDateRange.start && props.selectedDateRange.end) {
      // Filtrar por rango de fechas
      const rangeStart = new Date(props.selectedDateRange.start)
      rangeStart.setHours(0, 0, 0, 0)

      const rangeEnd = new Date(props.selectedDateRange.end)
      rangeEnd.setHours(23, 59, 59, 999)

      const eventsInRange = events.filter(event => {
        const eventStart = new Date(event.start as string)
        return eventStart >= rangeStart && eventStart <= rangeEnd
      })

      setFilteredEvents(eventsInRange)
    } else if (props.selectedDate) {
      // Filtrar por fecha específica
      const selectedDateStart = new Date(props.selectedDate)
      selectedDateStart.setHours(0, 0, 0, 0)

      const selectedDateEnd = new Date(props.selectedDate)
      selectedDateEnd.setHours(23, 59, 59, 999)

      const eventsForDate = events.filter(event => {
        const eventStart = new Date(event.start as string)
        return eventStart >= selectedDateStart && eventStart <= selectedDateEnd
      })

      setFilteredEvents(eventsForDate)
    } else {
      // Si no hay fecha seleccionada, aplicar filtros normales de estado
      handleFilterStatus(statusFilters)
    }
  }, [props.selectedDate, props.selectedDateRange, events])

  const handleSelectAll = () => {
    setSelectAll(prev => {
      const newSelectAll = !prev

      if (newSelectAll) {
        // Solo seleccionar los eventos que están siendo mostrados actualmente en el DOM
        const visibleEventRows = document.querySelectorAll('.fc-list-event')
        const visibleEvents: SelectedEvent[] = []

        visibleEventRows.forEach(row => {
          const eventId = row.querySelector('.fc-list-event-title')?.getAttribute('data-event-id')
          if (eventId) {
            const event = filteredEvents.find(e => String(e.id) === eventId)
            if (event) {
              visibleEvents.push({
                id: eventId,
                title: event.title as string,
                start: event.start as string,
                end: event.end as string,
                laboratoristas: event.extendedProps?.asignados || []
              })
            }
          }
        })

        setSelectedEvents(visibleEvents)
      } else {
        setSelectedEvents([])
      }

      // Actualizar inmediatamente todos los checkboxes visibles
      setTimeout(() => {
        const checkboxes = document.querySelectorAll('.fc-list-event-checkbox input[type="checkbox"]')
        checkboxes.forEach((checkbox: Element) => {
          if (checkbox instanceof HTMLInputElement) {
            checkbox.checked = newSelectAll
          }
        })
      }, 0)

      return newSelectAll
    })
  }

  const handleSelectEvent = (eventId: string) => {
    setSelectedEvents(prevSelection => {
      const event = events.find(e => String(e.id) === String(eventId))

      if (!event) return prevSelection

      const isSelected = prevSelection.some(e => e.id === eventId)

      if (isSelected) {
        const newSelection = prevSelection.filter(e => e.id !== eventId)

        // Si no quedan eventos seleccionados, desactivar "Seleccionar Todo"
        if (newSelection.length === 0) {
          setSelectAll(false)
        }

        return newSelection
      } else {
        const newEvent = {
          id: String(eventId),
          title: event.title as string,
          start: event.start as string,
          end: event.end as string,
          laboratoristas: event.extendedProps?.asignados || []
        }

        return [...prevSelection, newEvent]
      }
    })
  }

  // Actualizar los checkboxes cuando cambia selectedEvents
  useEffect(() => {
    const checkboxes = document.querySelectorAll('.fc-list-event-checkbox input[type="checkbox"]')

    checkboxes.forEach((checkbox: Element) => {
      if (checkbox instanceof HTMLInputElement) {
        const row = checkbox.closest('.fc-list-event')

        if (row instanceof HTMLElement) {
          const eventId = row.querySelector('.fc-list-event-title')?.getAttribute('data-event-id')

          if (eventId) {
            checkbox.checked = selectedEvents.some(event => event.id === eventId)
          }
        }
      }
    })

    // También actualizar el checkbox de "Seleccionar Todo"
    const selectAllCheckbox = document.querySelector('.fc-list-day-checkbox input[type="checkbox"]')
    if (selectAllCheckbox instanceof HTMLInputElement) {
      // Verificar si todos los eventos visibles en el DOM están seleccionados
      const visibleEventRows = document.querySelectorAll('.fc-list-event')
      const visibleEventIds = Array.from(visibleEventRows).map(row =>
        row.querySelector('.fc-list-event-title')?.getAttribute('data-event-id')
      ).filter(Boolean)

      const allVisibleSelected = visibleEventIds.length > 0 &&
        visibleEventIds.every(eventId => selectedEvents.some(event => event.id === eventId))

      selectAllCheckbox.checked = allVisibleSelected
    }
  }, [selectedEvents, selectAll, filteredEvents])

  const handleEditSelected = (event: React.MouseEvent<HTMLElement>) => {
    if (selectedEvents.length === 0) return
    setBulkEditMenuAnchorEl(event.currentTarget)
  }

  const handleBulkMenuAction = (action: string) => {
    switch (action) {
      case 'reprogramar':
        setReprogramarModalOpen(true)
        break
      case 'asignarLaboratorista':
        setAsignarLaboratoristaOpen(true)
        break
      case 'cambiarEstado':
        setCambiarEstadoModalOpen(true)
        break
      case 'eliminar':
        setDeleteDialogOpen(true)
        break
    }

    setBulkEditMenuAnchorEl(null)
  }

  const handleBulkReprogramar = async (fechaInicio: Date, fechaFin: Date) => {
    try {
      // Realizar todas las reprogramaciones en paralelo
      await Promise.all(
        selectedEvents.map(event =>
          fetch(`/api/agenda/${event.id}/reprogramar`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fechaInicio, fechaFin })
          })
        )
      )

      await fetchEvents()
      setSnackbarMessage('¡Eventos reprogramados exitosamente!')
      setSnackbarSeverity('success')
      setOpenSnackbar(true)
      setSelectedEvents([])
      setSelectAll(false)
    } catch (error) {
      console.error('Error:', error)
      setSnackbarMessage('Error al reprogramar los eventos')
      setSnackbarSeverity('error')
      setOpenSnackbar(true)
    }
  }

  const handleReprogramarEvento = async (fechaInicio: Date, fechaFin: Date) => {
    if (!selectedEventId) return

    try {
      const response = await fetch(`/api/agenda/${selectedEventId}/reprogramar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fechaInicio, fechaFin })
      })

      if (!response.ok) throw new Error('Error al reprogramar el evento')

      // Recargar los eventos para mostrar los cambios
      await fetchEvents()
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false)
  }

  const handleBulkAssignLaboratoristas = async (laboratoristas: string[]) => {
    try {
      await Promise.all(
        selectedEvents.map(event =>
          axios.post(`/api/eventos/${event.id}/asignar-laboratorista`, {
            laboratoristas
          })
        )
      )

      // Actualizar eventos en el calendario
      const updatedEvents = events.map(event => {
        if (selectedEvents.some(selected => selected.id === event.id)) {
          return {
            ...event,
            laboratoristas
          }
        }

        return event
      })

      setEvents(updatedEvents)
      setSelectedEvents([])
      setAsignarLaboratoristaOpen(false)

      enqueueSnackbar('Laboratoristas asignados correctamente a los eventos seleccionados', {
        variant: 'success'
      })
    } catch (error) {
      console.error('Error al asignar laboratoristas:', error)
      enqueueSnackbar('Error al asignar laboratoristas a los eventos', {
        variant: 'error'
      })
    }
  }

  const handleBulkCambiarEstado = async (nuevoEstado: string) => {
    try {
      await Promise.all(
        selectedEvents.map(event =>
          fetch(`/api/agenda/${event.id}/cambiar-estado`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
          })
        )
      )

      await fetchEvents()
      setSelectedEvents([])
      setCambiarEstadoModalOpen(false)
      enqueueSnackbar('Estado actualizado correctamente para los eventos seleccionados', {
        variant: 'success'
      })
    } catch (error) {
      console.error('Error:', error)
      enqueueSnackbar('Error al cambiar el estado de los eventos', {
        variant: 'error'
      })
    }
  }

  const handleBulkEliminar = async () => {
    try {
      await Promise.all(
        selectedEvents.map(event =>
          fetch(`/api/agenda/${event.id}/eliminar`, {
            method: 'DELETE'
          })
        )
      )

      await fetchEvents()
      setSelectedEvents([])
      setDeleteDialogOpen(false)
      enqueueSnackbar('Eventos eliminados correctamente', {
        variant: 'success'
      })
    } catch (error) {
      console.error('Error:', error)
      enqueueSnackbar('Error al eliminar los eventos', {
        variant: 'error'
      })
    }
  }

  const calendarOptions: CalendarOptions = {
    events: filteredEvents,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'listMonth',
    locale: esLocale,
    buttonText: {
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      list: 'Lista'
    },
    headerToolbar: {
      start: 'prev,next today',
      center: 'title',
      end: 'listMonth,dayGridMonth,timeGridWeek,timeGridDay'
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
      },
      listMonth: {
        listDayFormat: { weekday: 'long', day: 'numeric', month: 'long' },
        listDaySideFormat: { year: 'numeric' },
        displayEventTime: false,
        displayEventEnd: false,
        noEventsContent: 'No hay eventos para mostrar',
        eventDidMount: info => {
          const row = info.el.closest('.fc-list-event')

          if (row && row instanceof HTMLElement) {
            // Deshabilitar completamente la apariencia clickeable
            row.style.cssText = `
              display: table-row !important;
              width: 100%;
              cursor: default !important;
              background-color: transparent !important;
              height: 60px !important;
            `
            row.classList.remove('fc-event-clickable')
            row.classList.remove('fc-list-event-hoverable')

            row.addEventListener('mouseover', () => {
              row.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
            })

            row.addEventListener('mouseout', () => {
              row.style.backgroundColor = 'transparent'
            })

            // Remover cualquier evento de hover existente
            const cells = row.querySelectorAll('td')

            cells.forEach(cell => {
              if (cell instanceof HTMLElement) {
                // No deshabilitamos pointer-events en las celdas
                if (cell.classList.contains('fc-list-event-time')) {
                  cell.textContent = ''
                }
              }
            })

            // Crear el botón de vista previa
            const viewButton = document.createElement('button')

            viewButton.innerHTML = `
              <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;">
                <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            `
            viewButton.className = 'fc-list-event-preview-button'
            viewButton.style.cssText = `
              background: none;
              border: none;
              cursor: pointer;
              padding: 4px;
              color: #666;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              transition: background-color 0.2s;
              min-width: 32px;
              height: 32px;
              pointer-events: auto;
            `
            viewButton.addEventListener('mouseover', () => {
              viewButton.style.backgroundColor = 'rgba(0,0,0,0.04)'
            })
            viewButton.addEventListener('mouseout', () => {
              viewButton.style.backgroundColor = 'transparent'
            })
            viewButton.addEventListener('click', e => {
              e.preventDefault()
              e.stopPropagation()
              handleViewEvent(info.event.id)
            })

            // Crear el botón de edición
            const editButton = document.createElement('button')

            editButton.innerHTML = `
              <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;">
                <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            `
            editButton.className = 'fc-list-event-edit-button'
            editButton.style.cssText = `
              background: none;
              border: none;
              cursor: pointer;
              padding: 4px;
              color: #666;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              transition: background-color 0.2s;
              min-width: 32px;
              height: 32px;
              pointer-events: auto;
            `
            editButton.addEventListener('mouseover', () => {
              editButton.style.backgroundColor = 'rgba(0,0,0,0.04)'
            })
            editButton.addEventListener('mouseout', () => {
              editButton.style.backgroundColor = 'transparent'
            })
            editButton.addEventListener('click', e => {
              e.preventDefault()
              e.stopPropagation()
              const eventToEdit = events.find(event => String(event.id) === String(info.event.id))

              if (eventToEdit) {
                setSelectedEventForView(eventToEdit)
                setEditEventSidebarOpen(true)
              }
            })

            // Crear el botón de persona
            const personButton = document.createElement('button')

            personButton.innerHTML = `
              <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;">
                <path fill="currentColor" d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12M5,13.28L7.45,14.77L6.8,11.96L9,10.08L6.11,9.83L5,7.19L3.89,9.83L1,10.08L3.2,11.96L2.55,14.77L5,13.28Z"/>
              </svg>
            `
            personButton.className = 'fc-list-event-person-button'
            personButton.style.cssText = `
              background: none;
              border: none;
              cursor: pointer;
              padding: 4px;
              color: #666;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              transition: background-color 0.2s;
              min-width: 32px;
              height: 32px;
              pointer-events: auto;
            `
            personButton.addEventListener('mouseover', () => {
              personButton.style.backgroundColor = 'rgba(0,0,0,0.04)'
            })
            personButton.addEventListener('mouseout', () => {
              personButton.style.backgroundColor = 'transparent'
            })
            personButton.addEventListener('click', e => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedEventId(info.event.id)
              setAsignarLaboratoristaOpen(true)
            })
            personButton.title = 'Asignar Laboratorista'

            // Crear el botón de menú
            const menuButton = document.createElement('button')

            menuButton.innerHTML = `
              <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;">
                <path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
              </svg>
            `
            menuButton.style.cssText = `
              background: none;
              border: none;
              cursor: pointer;
              padding: 8px;
              color: rgba(0, 0, 0, 0.54);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 32px;
              height: 32px;
              transition: background-color 0.2s;
            `
            menuButton.addEventListener('mouseover', () => {
              menuButton.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
            })
            menuButton.addEventListener('mouseout', () => {
              menuButton.style.backgroundColor = 'transparent'
            })
            menuButton.addEventListener('click', e => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedEventId(info.event.id)
              setEventMenuAnchorEl(e.currentTarget as HTMLElement)
            })

            const actionContainer = document.createElement('div')

            actionContainer.className = 'fc-list-event-actions'
            actionContainer.style.cssText = `
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              width: 100%;
            `
            actionContainer.appendChild(viewButton)
            actionContainer.appendChild(editButton)
            actionContainer.appendChild(personButton)
            actionContainer.appendChild(menuButton)

            // Crear la columna de checkbox
            const checkboxCell = document.createElement('div')

            checkboxCell.className = 'fc-list-event-checkbox'
            checkboxCell.style.cssText = `
              display: flex;
              align-items: center;
              justify-content: center;
            `

            const checkbox = document.createElement('input')

            checkbox.type = 'checkbox'
            checkbox.checked = selectedEvents.some(event => String(event.id) === String(info.event.id))
            checkbox.className = 'event-checkbox'
            checkbox.style.cssText = `
              width: 18px;
              height: 18px;
              cursor: pointer;
            `
            checkbox.addEventListener('change', () => {
              handleSelectEvent(String(info.event.id))
            })

            checkboxCell.appendChild(checkbox)

            // Obtener referencias a las columnas
            const timeCol = row.querySelector('.fc-list-event-time')
            const dotCol = row.querySelector('.fc-list-event-graphic')
            const titleCol = row.querySelector('.fc-list-event-title')

            // Ajustar estilos de las columnas existentes
            if (timeCol instanceof HTMLElement) {
              timeCol.style.cssText = `
                width: 150px;
                min-width: 150px;
                padding: 16px 8px;
                vertical-align: middle;
                display: flex;
                flex-direction: column;
                gap: 4px;
              `
            }

            if (dotCol instanceof HTMLElement) {
              dotCol.style.display = 'none'
            }

            if (titleCol instanceof HTMLElement) {
              titleCol.style.cssText = `
                width: 100%;
                position: relative;
                padding: 16px 8px;
                vertical-align: middle;
                display: flex;
                flex-direction: column;
                gap: 12px;
              `

              // Obtener los datos del evento
              const eventDate = info.event.start
              const dayName = eventDate?.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
              const dayNumber = eventDate?.getDate()

              const timeRange =
                info.event.start && info.event.end
                  ? `${info.event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${info.event.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                  : ''

              const cliente = info.event.extendedProps?.cliente?.nombreCliente || 'Sin Cliente'

              const obra =
                info.event.extendedProps?.obra?.nombreObra || info.event.extendedProps?.direccion || 'Sin ubicación'

              // Limpiar el contenido original
              titleCol.textContent = ''

              const infoContainer = document.createElement('div')

              infoContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 24px;
                width: 100%;
                min-width: 0;
              `

              // Crear el contenedor de fecha y checkbox
              const dateCheckboxContainer = document.createElement('div')
              dateCheckboxContainer.style.cssText = `
                min-width: 150px;
                display: flex;
                align-items: center;
                gap: 12px;
              `

              // Agregar el checkbox al contenedor de fecha
              dateCheckboxContainer.appendChild(checkboxCell)

              // Crear el contenedor de fecha
              const dateContainer = document.createElement('div')
              dateContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 4px;
              `
              dateContainer.innerHTML = `
                <div style="
                  font-size: 0.875rem;
                  color: #666;
                  font-weight: 500;
                ">${dayName} ${dayNumber}</div>
                <div style="
                  font-size: 0.875rem;
                  color: #333;
                ">${timeRange}</div>
              `
              dateCheckboxContainer.appendChild(dateContainer)

              // Agregar el nuevo contenido
              infoContainer.innerHTML = ``
              infoContainer.appendChild(dateCheckboxContainer)
              infoContainer.innerHTML += `
                <div style="
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                  min-width: 0;
                ">
                  <div style="
                    font-size: 0.875rem;
                    color: #333;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  ">${cliente}</div>
                  <div style="
                    font-size: 0.875rem;
                    color: #666;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  ">${obra}</div>
                </div>
                <div style="
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  pointer-events: auto;
                ">
                  <div style="
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    background-color: ${alpha(statusColors[info.event.extendedProps?.estado as StatusType] || statusColors.AGENDADA, 0.1)};
                    color: ${statusColors[info.event.extendedProps?.estado as StatusType] || statusColors.AGENDADA};
                    text-align: center;
                  ">
                    ${info.event.extendedProps?.estado || 'AGENDADA'}
                  </div>
                </div>
              `
              //titleCol.appendChild(checkboxCell)
              titleCol.appendChild(infoContainer)
              titleCol.appendChild(actionContainer)

              // Agregar el ID del evento al título para referencia
              titleCol.setAttribute('data-event-id', String(info.event.id))
            }

            // Ocultar la columna de tiempo original ya que mostramos la información en el título
            if (timeCol instanceof HTMLElement) {
              timeCol.style.display = 'none'
            }
          }
        },
        headerDidMount: (info: HeaderInfo) => {
          const headerRow = info.el.querySelector('.fc-list-day')

          if (headerRow && headerRow instanceof HTMLElement) {
            // Crear la columna de checkbox en el encabezado
            const checkboxHeaderCell = document.createElement('th')

            checkboxHeaderCell.className = 'fc-list-day-checkbox'
            checkboxHeaderCell.style.cssText = `
              width: 48px;
              min-width: 48px;
              padding: 16px 8px;
              vertical-align: middle;
              display: flex;
              align-items: center;
              justify-content: center;
            `

            const checkbox = document.createElement('input')

            checkbox.type = 'checkbox'
            checkbox.checked = selectAll && filteredEvents.length > 0
            checkbox.style.cssText = `
              width: 18px;
              height: 18px;
              cursor: pointer;
            `
            checkbox.addEventListener('change', handleSelectAll)

            checkboxHeaderCell.appendChild(checkbox)
            headerRow.insertBefore(checkboxHeaderCell, headerRow.firstChild)
          }
        }
      }
    },
    direction: 'ltr',
    initialDate: new Date(),
    navLinks: true,
    eventClick: undefined,
    dateClick(info) {
      console.log('Fecha clickeada:', info.date)
    },
    eventContent: (info: EventInfo) => {
      // Si estamos en la vista de lista, no aplicamos ningún estilo especial
      if (info.view.type === 'listMonth') {
        return { html: '' }
      }

      const backgroundColor = statusColors[info.event.extendedProps.estado as StatusType]
      const timeText = info.timeText || ''
      const title = info.event.title || ''

      return {
        html: `
          <div style="
            background-color: ${alpha(backgroundColor, 0.1)};
            border-left: 4px solid ${backgroundColor};
            padding: 4px 8px;
            margin: 2px;
            border-radius: 4px;
            max-width: 100%;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          ">
            <div style="
              color: ${backgroundColor};
              font-weight: 500;
              font-size: 0.875rem;
              line-height: 1.2;
              overflow: hidden;
              text-overflow: ellipsis;
            ">
              ${title}
            </div>
            ${timeText
            ? `
              <div style="
                font-size: 0.75rem;
                color: ${alpha(backgroundColor, 0.8)};
                overflow: hidden;
                text-overflow: ellipsis;
              ">
                ${timeText}
              </div>
            `
            : ''
          }
          </div>
        `
      }
    }
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
      // Construir URL con parámetros de fecha si están disponibles
      let url = '/api/agenda'
      const params = new URLSearchParams()

      if (props.selectedDateRange?.start && props.selectedDateRange?.end) {
        // Usar directamente los métodos de fecha local para evitar problemas de zona horaria
        const startDate = new Date(props.selectedDateRange.start)
        const endDate = new Date(props.selectedDateRange.end)

        const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
        const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

        params.append('fechaInicio', startStr)
        params.append('fechaFin', endStr)
      } else if (props.selectedDate) {
        const selectedDate = new Date(props.selectedDate)
        const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        params.append('fechaInicio', selectedDateStr)
        params.append('fechaFin', selectedDateStr)
      } else {
        // Si no hay fecha seleccionada, cargar eventos del día actual
        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        params.append('fechaInicio', todayStr)
        params.append('fechaFin', todayStr)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log('Fetching events from:', url)
      const response = await fetch(url)

      if (!response.ok) throw new Error('Error al obtener eventos')
      const data = await response.json()

      // Formatear los eventos para FullCalendar
      const formattedEvents = data.map((event: any) => ({
        id: event.id,
        title: `${event.tipoVisita} - ${event.cliente?.nombreCliente || 'Sin Cliente'}`,
        start: new Date(event.fechaInicio).toISOString(),
        end: new Date(event.fechaFin).toISOString(),
        extendedProps: {
          estado: event.estado,
          cliente: event.cliente,
          clienteId: event.cliente?.clienteId,
          tipoVisita: event.tipoVisita,
          servicios: event.servicios,
          asignados: event.asignados,
          equipos: event.equipos,
          obra: event.obra,
          obraId: event.obra?.obraId,
          solicitud: event.solicitud,
          solicitudId: event.solicitud?.id || event.solicitudId,
          direccion: event.direccion,
          comuna: event.comuna,
          region: event.region,
          sectorComercial: event.sectorComercial,
          observaciones: event.observaciones,
          contactos: event.contactos
        }
      }))

      console.log('Eventos formateados:', formattedEvents)
      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error al cargar eventos:', error)
      setEvents([])
    }
  }

  // Manejadores de eventos
  useEffect(() => {
    const handleToggleMultiSelect = () => {
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

  // Modificar el manejador del evento de persona
  useEffect(() => {
    const handlePersonEventClick = (e: CustomEvent) => {
      const eventId = e.detail

      setSelectedEventId(eventId)
      setAsignarLaboratoristaOpen(true)
    }

    document.addEventListener('personEvent', handlePersonEventClick as EventListener)

    return () => {
      document.removeEventListener('personEvent', handlePersonEventClick as EventListener)
    }
  }, [])

  // Agregar useEffect para cargar eventos al inicio y cuando cambien las fechas
  useEffect(() => {
    fetchEvents()
  }, [props.selectedDate, props.selectedDateRange])

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{
            height: '100%',
            overflow: 'auto',
            '& .fc-view-harness': {
              width: '100%',
              maxWidth: '100%', // Cambia este valor según necesites
              margin: '0 auto',
              marginLeft: '0px !important'
            },
            '& .fc-listMonth-view': {
              width: '100%'
            },
            '& .fc-list-table': {
              width: '100%'
            }
          }}>
            {/* Contenedor principal de los filtros */}
            <Box sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}>
              {/* Fila de selección y edición */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderBottom: theme => `1px solid ${theme.palette.divider}`
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button
                    variant='text'
                    color='primary'
                    onClick={handleSelectAll}
                    startIcon={<i className={`ri-${selectAll ? 'checkbox-fill' : 'checkbox-blank-line'}`}></i>}
                  >
                    Seleccionar Todo
                  </Button>
                  {selectedEvents.length > 0 && (
                    <Typography variant='body2' color='text.secondary'>
                      {selectedEvents.length} evento{selectedEvents.length !== 1 ? 's' : ''} seleccionado
                      {selectedEvents.length !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>

                {selectedEvents.length > 0 && (
                  <Button
                    variant='contained'
                    color='primary'
                    startIcon={<i className='ri-edit-line'></i>}
                    onClick={handleEditSelected}
                  >
                    Editar ({selectedEvents.length})
                  </Button>
                )}
              </Box>

              {/* Fila de los filtros de estado */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  p: 2,
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}
              >
                {Object.entries(statusColors).map(([status]) => (
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
            </Box>
            <FullCalendar
              {...calendarOptions}
              customButtons={{
                addEventButton: {
                  text: 'Agregar Evento',
                  click: props.handleAddEventSidebarToggle
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <EventPreview open={previewOpen} onClose={handleClosePreview} event={selectedEventForView} />
      <EditEventSidebar
        editEventSidebarOpen={editEventSidebarOpen}
        handleEditEventSidebarToggle={handleEditEventSidebarToggle}
        selectedEvent={selectedEventForView}
      />
      <AsignarLaboratoristaModal
        open={asignarLaboratoristaOpen}
        onClose={() => {
          setAsignarLaboratoristaOpen(false)
          setSelectedEventId(null)
        }}
        eventId={selectedEventId}
        onAssign={selectedEvents.length > 1 ? handleBulkAssignLaboratoristas : handleBulkAssignLaboratoristas}
        isBulkEdit={selectedEvents.length > 1}
      />
      <ReprogramarEventoModal
        open={reprogramarModalOpen}
        onClose={() => {
          setReprogramarModalOpen(false)
          setSelectedEventId(null)
        }}
        eventId={selectedEventId}
        onReprogramar={selectedEvents.length > 1 ? handleBulkReprogramar : handleReprogramarEvento}
        fechaInicioActual={selectedEventDates.start || undefined}
        fechaFinActual={selectedEventDates.end || undefined}
        isBulkEdit={selectedEvents.length > 1}
      />
      <CambiarEstadoModal
        open={cambiarEstadoModalOpen}
        onClose={() => {
          setCambiarEstadoModalOpen(false)
          setSelectedEventId(null)
        }}
        eventId={selectedEventId}
        estadoActual={selectedEventEstado}
        onCambiarEstado={selectedEvents.length > 1 ? handleBulkCambiarEstado : handleCambiarEstado}
        isBulkEdit={selectedEvents.length > 1}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>
          {selectedEvents.length > 1 ? '¿Eliminar eventos seleccionados?' : '¿Eliminar evento?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            {selectedEvents.length > 1
              ? `¿Estás seguro de que deseas eliminar los ${selectedEvents.length} eventos seleccionados? Esta acción no se puede deshacer.`
              : '¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={selectedEvents.length > 1 ? handleBulkEliminar : handleEliminarEvento}
            color='error'
            variant='contained'
            autoFocus
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={eventMenuAnchorEl}
        open={Boolean(eventMenuAnchorEl)}
        onClose={handleEventMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={() => handleMenuAction('reprogramar')}>
          <i className='ri-calendar-line' style={{ marginRight: '8px' }}></i>
          Reprogramar
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('duplicar')}>
          <i className='ri-file-copy-line' style={{ marginRight: '8px' }}></i>
          Duplicar
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('cambiarEstado')}>
          <i className='ri-exchange-line' style={{ marginRight: '8px' }}></i>
          Cambiar Estado
        </MenuItem>
        <MenuItem onClick={() => handleMenuAction('eliminar')} sx={{ color: 'error.main' }}>
          <i className='ri-delete-bin-line' style={{ marginRight: '8px' }}></i>
          Eliminar
        </MenuItem>
      </Menu>

      {/* Menú para edición masiva */}
      <Menu
        anchorEl={bulkEditMenuAnchorEl}
        open={Boolean(bulkEditMenuAnchorEl)}
        onClose={() => setBulkEditMenuAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={() => handleBulkMenuAction('reprogramar')}>
          <ListItemIcon>
            <i className='ri-calendar-line' style={{ fontSize: '1.25rem' }}></i>
          </ListItemIcon>
          <ListItemText>Reprogramar Eventos</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkMenuAction('asignarLaboratorista')}>
          <ListItemIcon>
            <i className='ri-user-star-line' style={{ fontSize: '1.25rem' }}></i>
          </ListItemIcon>
          <ListItemText>Asignar Laboratoristas</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkMenuAction('cambiarEstado')}>
          <ListItemIcon>
            <i className='ri-exchange-line' style={{ fontSize: '1.25rem' }}></i>
          </ListItemIcon>
          <ListItemText>Cambiar Estado</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleBulkMenuAction('eliminar')} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <i className='ri-delete-bin-line' style={{ fontSize: '1.25rem', color: 'error.main' }}></i>
          </ListItemIcon>
          <ListItemText>Eliminar Eventos</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default Calendar
