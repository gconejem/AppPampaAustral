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
    title: 'Nombre del Cliente',
    start: date,
    end: nextDay,
    allDay: false,
    extendedProps: {
      calendar: 'Cliente'
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
      calendar: 'Cliente'
    }
  },
  {
    id: '3',
    url: '',
    title: 'Nombre del Cliente',
    allDay: true,
    start: new Date(date.getFullYear(), date.getMonth() + 1, -9),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -7),
    extendedProps: {
      calendar: 'Cliente'
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
      calendar: 'Cliente'
    }
  },
  {
    id: '5',
    url: '',
    title: 'Nombre del Cliente',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Cliente'
    }
  },
  {
    id: '6',
    url: '',
    title: 'Nombre del Cliente',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Cliente'
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
      calendar: 'Cliente'
    }
  },
  {
    id: '8',
    url: '',
    title: 'Nombre del Cliente',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Cliente'
    }
  },
  {
    id: '9',
    url: '',
    title: 'Nombre del Cliente',
    start: nextMonth,
    end: nextMonth,
    allDay: true,
    extendedProps: {
      calendar: 'Cliente'
    }
  },
  {
    id: '10',
    url: '',
    title: 'Nombre del Cliente',
    start: prevMonth,
    end: prevMonth,
    allDay: true,
    extendedProps: {
      calendar: 'Cliente'
    }
  }
]
