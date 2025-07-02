import React, { useState, useMemo } from 'react'

import { Box, IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import type { ColumnDef } from '@tanstack/react-table'

import ContactPreview from '../../contacts/preview/ContactPreview'
import { ContactType } from '../../../../types/apps/contactTypes'

interface ContactListTableProps {
  data: ContactType[]
}

const ContactListTable = ({ data: initialData }: ContactListTableProps) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedContactPreview, setSelectedContactPreview] = useState<ContactType | null>(null)

  const handlePreviewContact = (contact: ContactType) => {
    setSelectedContactPreview(contact)
    setPreviewOpen(true)
  }

  const handleEditContact = (contact: ContactType) => {
    console.log('Editar contacto', contact)
  }

  const handleClickOpenDialog = (contact: ContactType) => {
    console.log('Abrir diálogo para eliminar', contact)
  }

  const columns = useMemo<ColumnDef<ContactType, any>[]>(
    () => [
      {
        id: 'actions',
        header: 'ACCIONES',
        cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <IconButton color='info' onClick={() => handlePreviewContact(row.original)}>
              <i className='ri-eye-line' />
            </IconButton>
            <IconButton color='primary' onClick={() => handleEditContact(row.original)}>
              <EditIcon />
            </IconButton>
            <IconButton color='error' onClick={() => handleClickOpenDialog(row.original)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ),
        enableSorting: false
      }
    ],
    []
  )

  return (
    <>
      <ContactPreview
        open={previewOpen}
        contact={selectedContactPreview}
        handleClose={() => {
          setPreviewOpen(false)
          setSelectedContactPreview(null)
        }}
      />
    </>
  )
}

export default ContactListTable
