'use client'

import { Card } from '@mui/material'

import ContactListTable from './ContactListTable'
import type { ContactListProps } from '@/types/apps/contactTypes'

const ContactList = ({ contactData }: ContactListProps) => {
  return (
    <Card>
      <ContactListTable data={contactData} />
    </Card>
  )
}

export default ContactList
