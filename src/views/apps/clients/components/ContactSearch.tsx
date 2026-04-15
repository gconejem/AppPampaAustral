'use client'

import { useState, useEffect, useRef } from 'react'

import TextField from '@mui/material/TextField'
import Popover from '@mui/material/Popover'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import { toast } from 'react-hot-toast'

import type { Contacto } from '@/types/forms/cliente'
import { CARGOS_OBRA } from '@/data/obraData'

interface ContactSearchProps {
  onContactSelect: (contact: Contacto) => void
  refreshKey?: number
  onContactCreated?: (contact: Contacto) => void
}

const ITEMS_PER_PAGE = 10

const ContactSearch = ({ onContactSelect, refreshKey }: ContactSearchProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [contacts, setContacts] = useState<Contacto[]>([])
  const [totalContacts, setTotalContacts] = useState(0)
  const [contactsPage, setContactsPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  // 300ms debounce on searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setContactsPage(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch contacts whenever popover opens, page changes, or debounced search changes
  useEffect(() => {
    if (!anchorEl) return

    const fetchContacts = async () => {
      setLoading(true)

      try {
        const params = new URLSearchParams()

        params.set('page', (contactsPage + 1).toString())
        params.set('limit', ITEMS_PER_PAGE.toString())
        if (debouncedSearchTerm) params.set('q', debouncedSearchTerm)

        const response = await fetch(`/api/contacts/search?${params.toString()}`)
        const data = await response.json()

        setContacts(data.contacts || [])
        setTotalContacts(Number.isFinite(data.total) ? Number(data.total) : 0)
      } catch (error) {
        console.error('Error buscando contactos:', error)
        toast.error('Error al buscar contactos')
        setContacts([])
        setTotalContacts(0)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [anchorEl, contactsPage, debouncedSearchTerm, refreshKey])

  const handleOpen = () => {
    setAnchorEl(triggerRef.current)
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setContactsPage(0)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (contact: Contacto) => {
    onContactSelect(contact)
    handleClose()
  }

  const totalPages = Math.max(1, Math.ceil(totalContacts / ITEMS_PER_PAGE))

  return (
    <>
      <div ref={triggerRef}>
        <TextField
          fullWidth
          size='small'
          label='Buscar contacto'
          placeholder='Haga clic para buscar contactos'
          value=''
          onClick={handleOpen}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position='end'>
                <i className='ri-search-line' style={{ cursor: 'pointer' }} />
              </InputAdornment>
            )
          }}
        />
      </div>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: { width: anchorEl?.offsetWidth ?? 400, maxHeight: 420, display: 'flex', flexDirection: 'column' }
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size='small'
            autoFocus
            placeholder='Buscar por nombre, empresa, cargo, email o teléfono...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-search-line' />
                </InputAdornment>
              ),
              endAdornment: loading ? <CircularProgress size={16} /> : null
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {contacts.length === 0 && !loading ? (
            <Typography variant='body2' sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              {debouncedSearchTerm.length > 0 && debouncedSearchTerm.length < 2
                ? 'Ingrese al menos 2 caracteres para buscar'
                : 'No se encontraron contactos'}
            </Typography>
          ) : (
            <List dense disablePadding>
              {contacts.map(contact => {
                const cargoLabel = contact.cargo
                  ? CARGOS_OBRA.find(c => c.value === contact.cargo)?.label || contact.cargo
                  : 'Sin cargo'

                return (
                  <ListItem
                    key={contact.contactId}
                    onClick={() => handleSelect(contact)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <ListItemText
                      primary={contact.nombre}
                      secondary={`${contact.empresa ? `${contact.empresa} - ` : ''}${cargoLabel} - ${contact.email || 'Sin email'} - ${contact.telefono1 || 'Sin teléfono'}`}
                    />
                  </ListItem>
                )
              })}
            </List>
          )}
        </Box>

        {totalContacts > ITEMS_PER_PAGE && (
          <Box
            sx={{
              p: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Button
              size='small'
              onClick={() => setContactsPage(prev => Math.max(0, prev - 1))}
              disabled={contactsPage === 0}
            >
              Anterior
            </Button>
            <Typography variant='body2'>
              Página {contactsPage + 1} de {totalPages}
            </Typography>
            <Button
              size='small'
              onClick={() => setContactsPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={contactsPage >= totalPages - 1}
            >
              Siguiente
            </Button>
          </Box>
        )}
      </Popover>
    </>
  )
}

export default ContactSearch

