'use client'

import { useState, useEffect } from 'react'

import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import { toast } from 'react-hot-toast'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

import type { Contacto } from '@/types/forms/cliente'

interface ContactSearchProps {
  onContactSelect: (contact: Contacto) => void
  refreshKey?: number
  onContactCreated?: (contact: Contacto) => void
}

const ContactSearch = ({ onContactSelect, refreshKey, onContactCreated }: ContactSearchProps) => {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Contacto[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (open && options.length === 0) {
      loadAllContacts()
    }
  }, [open])

  useEffect(() => {
    loadAllContacts()
  }, [refreshKey])

  const loadAllContacts = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()

      console.log('Contactos cargados:', data)
      setOptions(data || [])
      if (onContactCreated && data && data.length > 0) {
        onContactCreated(data[0])
      }
    } catch (error) {
      console.error('Error cargando contactos:', error)
      toast.error('Error al cargar los contactos')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (searchValue: string) => {
    setInputValue(searchValue)

    if (!searchValue) {
      loadAllContacts()
      return
    }

    if (searchValue.length < 2) {
      setOptions([])
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/contacts/search?q=${encodeURIComponent(searchValue)}`)
      const data = await response.json()

      console.log('Resultados de búsqueda:', data)
      setOptions(data || [])
    } catch (error) {
      console.error('Error buscando contactos:', error)
      toast.error('Error al buscar contactos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Autocomplete
      open={open}
      onOpen={() => {
        setOpen(true);
        loadAllContacts();
      }}
      onClose={() => setOpen(false)}
      value={null}
      onChange={(_, newValue) => {
        if (newValue) {
          onContactSelect(newValue)
          setInputValue('')
        }
      }}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => handleSearch(newInputValue)}
      isOptionEqualToValue={(option, value) => option.email === value.email}
      getOptionLabel={option => `${option.nombre}${option.cargo ? ` - ${option.cargo}` : ''}${option.email ? ` (${option.email})` : ''}`}
      options={options}
      loading={loading}
      noOptionsText={inputValue.length < 2 ? 'Ingrese al menos 2 caracteres para buscar' : 'No se encontraron contactos'}
      renderOption={(props, option) => (
        <ListItem {...props}>
          <ListItemText
            primary={option.nombre}
            secondary={`${option.cargo || 'Sin cargo'} - ${option.email || 'Sin email'} - ${option.telefono1 || 'Sin teléfono'}`}
          />
        </ListItem>
      )}
      renderInput={params => (
        <TextField
          {...params}
          label='Buscar contacto'
          placeholder='Haga clic para ver todos los contactos'
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color='inherit' size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  )
}

export default ContactSearch
