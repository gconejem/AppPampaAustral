// Third-party Imports
import type { EventInput } from '@fullcalendar/core'

// Vars
const date = new Date()
const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000)

const nextMonth =
  date.getMonth() === 11 ? new Date(date.getFullYear() + 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() + 1, 1)

const prevMonth =
  date.getMonth() === 11 ? new Date(date.getFullYear() - 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() - 1, 1)

export const events: EventInput[] = [
  {
    id: '1',
    url: '',
    title: 'Obra N1',
    start: date,
    end: nextDay,
    allDay: false,
    extendedProps: {
      calendar: 'Obra' // Cambiado de 'Business' a 'Obra'
    }
  },
  {
    id: '2',
    url: '',
    title: 'Nombre del Cliente',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -11),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -10),
    allDay: true,
    extendedProps: {
      calendar: 'Cliente' // Cambiado de 'Business' a 'Cliente'
    }
  },
  {
    id: '3',
    url: '',
    title: 'Obra N2',
    allDay: true,
    start: new Date(date.getFullYear(), date.getMonth() + 1, -9),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -7),
    extendedProps: {
      calendar: 'Obra' // Cambiado de 'Holiday' a 'Obra'
    }
  },
  {
    id: '4',
    url: '',
    title: 'Nombre del Cliente',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -11),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -10),
    allDay: true,
    extendedProps: {
      calendar: 'Cliente' // Cambiado de 'Personal' a 'Cliente'
    }
  },
  {
    id: '5',
    url: '',
    title: 'Nombre del Laboratorista',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Laboratorista' // Cambiado de 'ETC' a 'Laboratorista'
    }
  },
  {
    id: '6',
    url: '',
    title: 'Nombre del Laboratorista',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Laboratorista' // Cambiado de 'Personal' a 'Laboratorista'
    }
  },
  {
    id: '7',
    url: '',
    title: 'Nombre del Cliente',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Cliente' // Cambiado de 'Family' a 'Cliente'
    }
  },
  {
    id: '8',
    url: '',
    title: 'Obra N3',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Obra' // Cambiado de 'Business' a 'Obra'
    }
  },
  {
    id: '9',
    url: '',
    title: 'Obra N4',
    start: nextMonth,
    end: nextMonth,
    allDay: true,
    extendedProps: {
      calendar: 'Obra' // Cambiado de 'Business' a 'Obra'
    }
  },
  {
    id: '10',
    url: '',
    title: 'Nombre del Laboratorista',
    start: prevMonth,
    end: prevMonth,
    allDay: true,
    extendedProps: {
      calendar: 'Laboratorista' // Cambiado de 'Personal' a 'Laboratorista'
    }
  }
]
