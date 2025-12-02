import React, { useState, useMemo } from 'react'

import { Box, IconButton } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import type { ColumnDef } from '@tanstack/react-table'

import ContactPreview from '../../contacts/preview/ContactPreview'
import { ContactType } from '@/types/apps/contactTypes'


// Imports para permisos - NUEVO
import { usePermissions } from '@/hooks/usePermissions'
import { permisos } from '@/permisos/permisos'



interface ContactListTableProps {
  data: ContactType[]
}

const ContactListTable = ({ data: initialData }: ContactListTableProps) => {

    // Hook de permisos
  const { hasPermission } = usePermissions()
  
  // Verificar si el usuario solo tiene permisos de lectura
  const soloLectura =
    hasPermission(permisos.empresa.ver) &&
    !hasPermission(permisos.empresa.crear) &&
    !hasPermission(permisos.empresa.editar) &&
    !hasPermission(permisos.empresa.eliminar)
    
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedContactPreview, setSelectedContactPreview] = useState<ContactType | null>(null)

  const handlePreviewContact = (contact: ContactType) => {
    setSelectedContactPreview(contact)
    setPreviewOpen(true)
  }

  const handleEditContact = (contact: ContactType) => {
    // TODO: Implement edit functionality
    console.log('Edit contact:', contact)
  }

  const handleClickOpenDialog = (contact: ContactType) => {
    // TODO: Implement delete dialog functionality
    console.log('Delete contact:', contact)
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
              <Edit />
            </IconButton>
            <IconButton color='error' onClick={() => handleClickOpenDialog(row.original)}>
              <Delete />
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
