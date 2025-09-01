// React Imports
import type { Dispatch } from 'react'

// Third-party Imports
import type { EventInput } from '@fullcalendar/core'

// Interfaces para los filtros
export interface Cliente {
  clienteId: number
  razonSocial: string
  rut: string
  nombreCliente: string
}

export interface Obra {
  obraId: number
  numeroObra: string
  nombreObra: string
  direccion: string
  comuna: string
  region: string
}

export interface Laboratorista {
  id: string
  name: string
  email: string
}

export interface CalendarFilters {
  cliente: Cliente | null
  obras: Obra[]
  laboratoristas: Laboratorista[]
  sectoresComerciales: string[]
  regiones: string[]
  comunas: string[]
  tiposEvento: string[]
}

// Types
export type CalendarType = {
  events: EventInput[]
  selectedEvent: EventInput | null
  selectedCalendars: string[]
}

export type CalendarColors = {
  [key: string]: string
}

export type AddEventType = Omit<EventInput, 'id'>

export type SidebarLeftProps = {
  mdAbove: boolean
  calendarApi: any
  calendarStore: CalendarType
  leftSidebarOpen: boolean
  dispatch: Dispatch
  calendarsColor: CalendarColors
  handleLeftSidebarToggle: () => void
  handleAddEventSidebarToggle: () => void
  onDateSelect?: (date: Date) => void
  onRangeSelect?: (startDate: Date | null, endDate: Date | null) => void
  dateRangeEnabled?: boolean
  onDateRangeToggle?: (enabled: boolean) => void
  filters: CalendarFilters
  onFilterChange: (filterType: string, value: any) => void
  onClearAllFilters: () => void
}

export type CalendarProps = {
  handleAddEventSidebarToggle: () => void
  selectedDate?: Date | null
  selectedDateRange?: { start: Date | null; end: Date | null } | null
  filters: CalendarFilters
  onDateChange?: (date: Date) => void
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void
}

export type AddEventSidebarType = {
  calendarStore: CalendarType
  addEventSidebarOpen: boolean
  handleAddEventSidebarToggle: () => void
}
