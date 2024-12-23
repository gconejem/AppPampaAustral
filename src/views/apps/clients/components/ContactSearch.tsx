'use client'

import { useState } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import IconButton from '@mui/material/IconButton'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import type { Contacto } from '@/types/forms/cliente'

interface Props {
  onContactSelect: (contact: Contacto) => void
}

const ContactSearch = ({ onContactSelect }: Props) => {
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<Contacto[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const searchContacts = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await axios.get(`/api/contactos/search`, {
        params: { q: query }
      })
      setSearchResults(response.data)
    } catch (error) {
      console.error('Error buscando contactos:', error)
      toast.error('Error al buscar contactos')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      searchContacts(value)
    }, 500)

    setSearchTimeout(timeout)
  }

  return (
    <div className="relative">
      <TextField
        fullWidth
        size='small'
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder='Buscar contacto existente...'
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: isSearching ? (
            <InputAdornment position='end'>
              <CircularProgress size={20} />
            </InputAdornment>
          ) : null
        }}
      />

      {searchResults.length > 0 && (
        <List 
          sx={{ 
            position: 'absolute',
            width: '100%',
            zIndex: 1000,
            mt: 1,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 1
          }}
        >
          {searchResults.map((contact) => (
            <ListItem
              key={contact.id}
              button
              onClick={() => {
                onContactSelect(contact)
                setSearchValue('')
                setSearchResults([])
              }}
            >
              <ListItemText
                primary={contact.nombre}
                secondary={`${contact.cargo} • ${contact.email}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => {
                    onContactSelect(contact)
                    setSearchValue('')
                    setSearchResults([])
                  }}
                >
                  <i className='ri-add-line' />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  )
}

export default ContactSearch 
