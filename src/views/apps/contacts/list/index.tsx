'use client'

import { useState } from 'react'

import { Card } from '@mui/material'

import ContactListTable from './ContactListTable'
import TableFilters from './TableFilters'
import type { ContactoWithRelations } from '@/types/apps/contactTypes'

interface ContactListProps {
  contactData: ContactoWithRelations[]
}

const ContactList = ({ contactData }: ContactListProps) => {
  const [filteredData, setFilteredData] = useState<ContactoWithRelations[]>(contactData)

  const handleDateRangeChange = (range: [Date | null, Date | null]) => {
    const [startDate, endDate] = range

    // Si no hay fechas seleccionadas, mostrar todos los contactos
    if (!startDate && !endDate) {
      setFilteredData(contactData)

      return
    }

    // Filtrar contactos por fecha de creación
    const filtered = contactData.filter(contact => {
      const createdAt = new Date(contact.createdAt)

      // Ajustar las fechas para ignorar la hora
      const startOfDay = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null
      const endOfDay = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null
      const contactDate = new Date(createdAt.setHours(0, 0, 0, 0))

      // Si solo hay fecha de inicio
      if (startOfDay && !endOfDay) {
        return contactDate >= startOfDay
      }

      // Si solo hay fecha de fin
      if (!startOfDay && endOfDay) {
        return contactDate <= endOfDay
      }

      // Si hay ambas fechas
      if (startOfDay && endOfDay) {
        return contactDate >= startOfDay && contactDate <= endOfDay
      }

      return true
    })

    setFilteredData(filtered)
  }

  return (
    <div className='flex flex-col gap-4'>
      <TableFilters onDateRangeChange={handleDateRangeChange} />
      <Card>
        <ContactListTable data={filteredData} />
      </Card>
    </div>
  )
}

export default ContactList
