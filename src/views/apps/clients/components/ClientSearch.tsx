import { useState, useEffect } from 'react'

import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import axios from 'axios'

interface Cliente {
  clienteId: number
  rut: string
  nombreCliente: string
  razonSocial: string
}

interface Props {
  onClientSelect: (cliente: Cliente) => void
}

const ClientSearch = ({ onClientSelect }: Props) => {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    let active = true

    const fetchClientes = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`/api/clientes/search?query=${inputValue}`)

        if (active) {
          setOptions(response.data)
        }
      } catch (error) {
        console.error('Error al buscar clientes:', error)
        setOptions([])
      } finally {
        setLoading(false)
      }
    }

    // Solo realizar la búsqueda si hay al menos 2 caracteres
    if (inputValue.length >= 2) {
      fetchClientes()
    } else {
      setOptions([])
    }

    return () => {
      active = false
    }
  }, [inputValue])

  return (
    <Autocomplete
      id='cliente-search'
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, value) => option.clienteId === value.clienteId}
      getOptionLabel={option => `${option.nombreCliente} (${option.rut})`}
      options={options}
      loading={loading}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue)
      }}
      onChange={(_, newValue) => {
        if (newValue) {
          onClientSelect(newValue)
        }
      }}
      noOptionsText={inputValue.length < 2 ? 'Ingrese al menos 2 caracteres para buscar' : 'No se encontraron clientes'}
      renderInput={params => (
        <TextField
          {...params}
          label='Buscar Cliente por RUT o Nombre'
          placeholder='Ingrese RUT o nombre del cliente'
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

export default ClientSearch
