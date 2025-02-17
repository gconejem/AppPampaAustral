'use client'

import { useState, useEffect } from 'react'

import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import IconButton from '@mui/material/IconButton'
import axios from 'axios'
import { toast } from 'react-hot-toast'

import type { Contacto } from '@/types/forms/cliente'

interface ContactSearchProps {
  onContactSelect: (contact: Contacto) => void
}

const ContactSearch = ({ onContactSelect }: ContactSearchProps) => {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Contacto[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const fetchContacts = async (search?: string) => {
    setLoading(true)

    try {
      const url = search ? `/api/contacts?search=${encodeURIComponent(search)}` : '/api/contacts'
      const response = await fetch(url)

      if (!response.ok) throw new Error('Error al obtener contactos')
      const data = await response.json()

      setOptions(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar contactos')
      setOptions([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar contactos iniciales
  useEffect(() => {
    fetchContacts()
  }, [])

  // Buscar cuando cambia el input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue) {
        fetchContacts(inputValue)
      } else {
        // Cuando el input está vacío, cargar todos los contactos
        fetchContacts()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue])

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, value) => option.nombre === value.nombre}
      getOptionLabel={option => option.nombre || ''}
      options={options}
      loading={loading}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue)
      }}
      onChange={(_, newValue) => {
        if (newValue) {
          onContactSelect(newValue)

          // Resetear el input y recargar todos los contactos
          setInputValue('')
          fetchContacts()
        }
      }}
      renderInput={params => (
        <TextField
          {...params}
          placeholder='Buscar contacto existente...'
          size='small'
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
      renderOption={(props, option) => (
        <li {...props}>
          <div>
            <div>{option.nombre}</div>
            <div style={{ fontSize: '0.8rem', color: 'gray' }}>
              {option.cargo} - {option.email}
            </div>
          </div>
        </li>
      )}
    />
  )
}

export default ContactSearch
