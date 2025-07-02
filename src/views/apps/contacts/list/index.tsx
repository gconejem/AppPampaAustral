'use client'

import { useState, useEffect } from 'react'

import { Card, CircularProgress } from '@mui/material'

import ContactListTable from './ContactListTable'
import TableFilters from './TableFilters'
import type { ContactoWithRelations } from '@/types/apps/contactTypes'

const ContactList = () => {
  const [loading, setLoading] = useState(true)
  const [contactData, setContactData] = useState<ContactoWithRelations[]>([])
  const [filteredData, setFilteredData] = useState<ContactoWithRelations[]>([])

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/contacts')
        const data = await response.json()

        setContactData(data)
        setFilteredData(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching contacts:', error)
        setLoading(false)
      }
    }

    fetchContacts()
  }, [])

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

  if (loading) {
    return (
      <div className='flex justify-center items-center h-[400px]'>
        <CircularProgress />
      </div>
    )
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
