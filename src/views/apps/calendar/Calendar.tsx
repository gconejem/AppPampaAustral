import { useEffect, useState } from 'react'

// import { useSelector } from 'react-redux'
import { alpha, styled } from '@mui/material/styles'
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

type CalenderProps = {
  handleAddEventSidebarToggle: () => void
}

// Estilo personalizado para la barra de herramientas
const ListToolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`
}))

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

  const handleViewEvent = (eventId: string) => {
    console.log('handleViewEvent llamado con ID:', eventId)
    console.log('Eventos disponibles:', events)

    const eventToView = events.find(event => String(event.id) === String(eventId))

    console.log('Evento encontrado:', eventToView)
    console.log(
      'Observaciones en el evento encontrado:',
      eventToView?.observaciones,
      eventToView?.extendedProps?.observaciones
    )

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

      console.log('Evento formateado para preview:', formattedEvent)
      setSelectedEventForView(formattedEvent)
      setPreviewOpen(true)
    } else {
      console.error('Evento no encontrado con ID:', eventId)
    }
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setSelectedEventForView(null)
  }

  const handleEditEvent = () => {
    console.log('Editar evento:', selectedEventForView)
    setEditEventSidebarOpen(true)
    setPreviewOpen(false)
  }

  const handleEditEventSidebarToggle = () => {
    setEditEventSidebarOpen(!editEventSidebarOpen)

    // Si estamos cerrando el sidebar, refrescar los eventos
    if (editEventSidebarOpen) {
      fetchEvents()
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
  const statusColors = {
    AGENDADA: '#4CAF50', // Verde
    COMPLETADA: '#2196F3', // Azul
    SUSPENDIDA: '#F44336', // Rojo
    REPROGRAMADA: '#FF9800' // Naranja
  }

  const fetchEvents = async () => {
    console.log('Iniciando fetchEvents')

    try {
      const response = await fetch('/api/agenda')
      const data = await response.json()

      console.log('Datos completos de la API:', data)

      if (data[0]) {
        console.log('Primer evento:', data[0])
        console.log('Equipos del primer evento:', data[0].equipos)

        if (data[0].equipos && data[0].equipos.length > 0) {
          console.log('Primer equipo detallado:', data[0].equipos[0])
        }
      }

      if (!Array.isArray(data)) {
        console.error('Los datos recibidos no son un array:', data)

        return
      }

      const formattedEvents = data.map(event => {
        console.log('Procesando evento:', event)
        console.log('Equipos del evento:', event.equipos)

        return {
          id: String(event.id),
          title: event.titulo || 'Sin título',
          start: new Date(event.fechaInicio),
          end: new Date(event.fechaFin),
          backgroundColor: statusColors[event.estado as keyof typeof statusColors] || '#1976d2',
          extendedProps: {
            estado: event.estado || 'AGENDADA',
            cliente: event.cliente?.razonSocial || 'Sin cliente',
            servicios:
              event.servicios?.map((s: any) => ({
                codigo: s.codigo,
                nombre: s.servicio,
                cantidad: s.cantidad,
                observacion: s.observacion || '',
                esSegundaVisita: s.esSegundaVisita
              })) || [],
            asignados: event.asignados || [],
            equipos:
              event.equipos?.map((e: any) => {
                return {
                  codigo: e.equipo?.codigo || 'Sin código',
                  nombre: e.equipo?.nombre || 'Sin nombre',
                  cantidad: e.cantidad || 1,
                  observacion: e.observacion || ''
                }
              }) || [],
            observaciones: event.observaciones || '',
            tipoVisita: event.tipoVisita === 'EVENTO',
            esRecurrente: event.esRecurrente || false,
            obra: event.obra?.nombreObra || '',
            solicitud: event.solicitudId || null,
            sector: event.sectorComercial || '',
            region: event.region || '',
            comuna: event.comuna || ''
          }
        }
      })

      console.log('Eventos formateados:', formattedEvents)
      setEvents(formattedEvents)
    } catch (error) {
      console.error('Error al cargar eventos:', error)
    }
  }

  const getCalendarColor = (estado: string) => {
    switch (estado) {
      case 'AGENDADA':
        return 'primary'
      case 'COMPLETADA':
        return 'success'
      case 'SUSPENDIDA':
        return 'warning'
      case 'CANCELADA':
        return 'error'
      case 'EN_PROCESO':
        return 'info'
      default:
        return 'primary'
    }
  }

  const handleEventMenuClose = () => {
    setEventMenuAnchorEl(null)
  }

  const handleMenuAction = (action: string) => {
    console.log(`Acción seleccionada: ${action}`)
    handleEventMenuClose()
  }

  const calendarOptions: CalendarOptions = {
    events,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'listMonth',
    headerToolbar: {
      start: 'prev,next title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    views: {
      listMonth: {
        buttonText: 'List',
        listDayFormat: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
        listDaySideFormat: false,
        dayHeaderContent: arg => {
          return {
            html: `
              <div class="fc-list-day-header" style="flex-direction: column;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                  <div class="fc-list-day-text">${arg.text}</div>
                  <div class="fc-list-day-side-text">${arg.view.type === 'listMonth' ? new Date(arg.date).toLocaleDateString('es-ES', { weekday: 'long' }) : ''}</div>
                </div>
                ${
                  arg.view.type === 'listMonth'
                    ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; width: 100%;">
                      <div style="display: flex; align-items: center;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                          <input
                            type="checkbox"
                            style="margin-right: 8px;"
                            ${isMultiSelect ? 'checked' : ''}
                            onchange="document.dispatchEvent(new CustomEvent('toggleMultiSelect'))"
                          />
                          Selección múltiple
                        </label>
                      </div>
                      <button
                        class="MuiButton-root MuiButton-outlined"
                        style="
                          border: 1px solid #1976d2;
                          color: #1976d2;
                          padding: 4px 10px;
                          font-size: 0.875rem;
                          min-width: 64px;
                          border-radius: 4px;
                          cursor: pointer;
                          background: transparent;
                          display: flex;
                          align-items: center;
                          gap: 4px;
                        "
                      >
                        <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        Editar
                      </button>
                    </div>
                    `
                    : ''
                }
              </div>
            `
          }
        }
      }
    },
    direction: 'ltr',
    initialDate: new Date(),
    dayMaxEvents: 2,
    navLinks: true,
    eventClick(info) {
      // Removemos el manejo del clic en el evento
      return
    },
    dateClick(info) {
      // Manejar el clic en una fecha
      console.log('Fecha clickeada:', info.date)
    },
    datesSet: info => {
      // Manejar el cambio de vista
    },
    eventContent: arg => {
      const backgroundColor = statusColors[arg.event.extendedProps.estado as keyof typeof statusColors]
      const fecha = new Date(arg.event.start!)
      const horaInicio = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })

      const horaFin = arg.event.end
        ? new Date(arg.event.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })
        : ''

      if (arg.view.type === 'listMonth') {
        return {
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 16px;
              padding: 8px;
              width: 100%;
            ">
              <div style="display: flex; align-items: center;">
                <input
                  type="checkbox"
                  style="
                    width: 18px;
                    height: 18px;
                    margin: 0;
                    cursor: pointer;
                  "
                  ${selectedEvents.includes(arg.event.id) ? 'checked' : ''}
                  onchange="document.dispatchEvent(new CustomEvent('toggleEventSelection', { detail: '${arg.event.id}' }))"
                />
              </div>

              <div style="
                display: flex;
                flex-direction: column;
                min-width: 120px;
              ">
                <span style="font-size: 0.875rem; color: #666;">${fecha.toLocaleDateString('es-ES', { weekday: 'long' })}</span>
                <span style="font-size: 0.75rem; color: #888;">${horaInicio} - ${horaFin}</span>
              </div>

              <div style="
                flex: 1;
                font-weight: 500;
              ">
                ${arg.event.title}
              </div>

              <div style="
                background-color: ${alpha(backgroundColor, 0.1)};
                color: ${backgroundColor};
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 0.75rem;
                font-weight: 500;
              ">
                ${arg.event.extendedProps.estado}
              </div>

              <div style="display: flex; gap: 8px;">
                <button
                  class="MuiIconButton-root action-button"
                  style="
                    padding: 8px;
                    color: #666;
                    cursor: pointer;
                    background: transparent;
                    border: none;
                    border-radius: 50%;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
                  onmouseover="this.style.backgroundColor='rgba(0, 0, 0, 0.04)';this.style.color='#1976d2';"
                  onmouseout="this.style.backgroundColor='transparent';this.style.color='#666';"
                  onclick="document.dispatchEvent(new CustomEvent('viewEvent', { detail: '${arg.event.id}' }))"
                  title="Visualizar"
                >
                  <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </button>
                <button
                  class="MuiIconButton-root action-button"
                  style="
                    padding: 8px;
                    color: #666;
                    cursor: pointer;
                    background: transparent;
                    border: none;
                    border-radius: 50%;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
                  onmouseover="this.style.backgroundColor='rgba(0, 0, 0, 0.04)';this.style.color='#1976d2';"
                  onmouseout="this.style.backgroundColor='transparent';this.style.color='#666';"
                  onclick="document.dispatchEvent(new CustomEvent('editEvent', { detail: '${arg.event.id}' }))"
                  title="Editar"
                >
                  <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button
                  class="MuiIconButton-root action-button"
                  style="
                    padding: 8px;
                    color: #666;
                    cursor: pointer;
                    background: transparent;
                    border: none;
                    border-radius: 50%;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
                  onmouseover="this.style.backgroundColor='rgba(0, 0, 0, 0.04)';this.style.color='#f44336';"
                  onmouseout="this.style.backgroundColor='transparent';this.style.color='#666';"
                  title="Eliminar"
                >
                  <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"/>
                  </svg>
                </button>
                <button
                  class="MuiIconButton-root action-button"
                  style="
                    padding: 8px;
                    color: #666;
                    cursor: pointer;
                    background: transparent;
                    border: none;
                    border-radius: 50%;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
                  onmouseover="this.style.backgroundColor='rgba(0, 0, 0, 0.04)';this.style.color='#ff9800';"
                  onmouseout="this.style.backgroundColor='transparent';this.style.color='#666';"
                  title="Reprogramar"
                >
                  <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                </button>
                <button
                  class="MuiIconButton-root action-button"
                  style="
                    padding: 8px;
                    color: #666;
                    cursor: pointer;
                    background: transparent;
                    border: none;
                    border-radius: 50%;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  "
                  onmouseover="this.style.backgroundColor='rgba(0, 0, 0, 0.04)';this.style.color='#1976d2';"
                  onmouseout="this.style.backgroundColor='transparent';this.style.color='#666';"
                  onclick="document.dispatchEvent(new CustomEvent('openMenu', { detail: '${arg.event.id}' }))"
                  title="Más opciones"
                >
                  <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
            </div>
          `
        }
      }

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
              ${arg.event.extendedProps.hora || ''}
              ${arg.event.extendedProps.servicios ? ` - ${arg.event.extendedProps.servicios}` : ''}
            </div>
          </div>
        `
      }
    },
    eventDidMount: info => {
      if (info.view.type === 'listMonth') {
        const eventEl = info.el
        const checkbox = document.createElement('input')

        checkbox.type = 'checkbox'
        checkbox.style.marginRight = '8px'
        checkbox.checked = selectedEvents.includes(info.event.id)

        checkbox.onchange = () => {
          if (checkbox.checked) {
            setSelectedEvents(prev => [...prev, info.event.id])
          } else {
            setSelectedEvents(prev => prev.filter(id => id !== info.event.id))
          }
        }

        if (isMultiSelect) {
          eventEl.prepend(checkbox)
        }
      }
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
