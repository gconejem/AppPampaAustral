// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'

// Types
import type { ContactoObra } from '@/types/forms/obra'

interface Props {
  onContactSelect: (contact: ContactoObra) => void
}

const ContactSearchObra = ({ onContactSelect }: Props) => {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ContactoObra[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setOptions([])
    }
  }, [open])

  const handleSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/contactos-obra/search?q=${searchTerm}`)
      const data = await response.json()

      setOptions(data)
    } catch (error) {
      console.error('Error buscando contactos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={isLoading}
      getOptionLabel={option => option.nombre}
      onChange={(_, newValue) => {
        if (newValue) {
          onContactSelect(newValue)
        }
      }}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue)
        handleSearch(newInputValue)
      }}
      renderInput={params => (
        <TextField
          {...params}
          placeholder='Buscar contacto...'
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color='inherit' size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
          sx={{ width: '400px' }}
        />
      )}
    />
  )
}

export default ContactSearchObra
