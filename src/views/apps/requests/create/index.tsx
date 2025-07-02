'use client'

// React Imports
import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import debounce from 'lodash/debounce'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import RequestQuotation from './RequestQuotation'
import RequestInternalControl from './RequestInternalControl'
import RequestVisits from './RequestVisits'

// Types
type Cliente = {
  clienteId: number
  nombreCliente: string
  rut: string
  razonSocial: string
}

type Obra = {
  obraId: number
  nombreObra: string
  numeroObra: string
  clienteId: number
}

function CreateRequest() {
  const router = useRouter()

  // States
  const [clienteSearch, setClienteSearch] = useState('')
  const [obraSearch, setObraSearch] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null)

  const [loading, setLoading] = useState({
    clientes: false,
    obras: false
  })

  // Cargar clientes al montar el componente y cuando se busca
  useEffect(() => {
    const loadClientes = async () => {
      try {
        setLoading(prev => ({ ...prev, clientes: true }))

        const url = clienteSearch
          ? `/api/clientes?search=${encodeURIComponent(clienteSearch)}`
          : '/api/clientes'

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Error al cargar clientes')
        }

        const data = await response.json()

        setClientes(data)
      } catch (error) {
        console.error('Error al cargar clientes:', error)
      } finally {
        setLoading(prev => ({ ...prev, clientes: false }))
      }
    }

    const timeoutId = setTimeout(loadClientes, clienteSearch ? 300 : 0)

    
return () => clearTimeout(timeoutId)
  }, [clienteSearch]) // Se ejecuta al montar y cuando cambia la búsqueda

  // Cargar obras al montar el componente y cuando se busca
  useEffect(() => {
    const loadObras = async () => {
      try {
        setLoading(prev => ({ ...prev, obras: true }))

        const url = obraSearch
          ? `/api/obras?search=${encodeURIComponent(obraSearch)}`
          : '/api/obras'

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Error al cargar obras')
        }

        const data = await response.json()

        setObras(data)
      } catch (error) {
        console.error('Error al cargar obras:', error)
      } finally {
        setLoading(prev => ({ ...prev, obras: false }))
      }
    }

    const timeoutId = setTimeout(loadObras, obraSearch ? 300 : 0)

    
return () => clearTimeout(timeoutId)
  }, [obraSearch]) // Se ejecuta al montar y cuando cambia la búsqueda

  const handleSave = async () => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al crear la solicitud')
      }

      const data = await response.json()

      console.log('Solicitud creada:', data)

      router.push('/en/apps/requests') // Redirigir a la lista de solicitudes
    } catch (error) {
      console.error('Error:', error)

      // Aquí podrías agregar un toast o notificación de error
    }
  }

  return (
    <>
      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            {/* Header */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h5'>Solicitud ID 00000</Typography>
                <Chip label='Estado Operativo' color='info' size='small' />
                <Chip label='Estado Administrativo' color='success' size='small' />
              </Box>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {new Date().toLocaleString()}
              </Typography>
            </Grid>

            {/* Búsqueda */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                {/* Buscador de Cliente */}
                <Autocomplete
                  size='small'
                  options={clientes}
                  getOptionLabel={(option) => `${option.nombreCliente} (${option.rut})`}
                  value={selectedCliente}
                  onChange={(_, newValue) => {
                    setSelectedCliente(newValue)
                  }}
                  onInputChange={(_, value) => setClienteSearch(value)}
                  loading={loading.clientes}
                  sx={{ width: 300 }}
                  noOptionsText="No hay clientes"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Cliente'
                      placeholder='Buscar por nombre o RUT'
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading.clientes ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />

                {/* Buscador de Obra */}
                <Autocomplete
                  size='small'
                  options={obras}
                  getOptionLabel={(option) => `${option.numeroObra} - ${option.nombreObra}`}
                  value={selectedObra}
                  onChange={(_, newValue) => setSelectedObra(newValue)}
                  onInputChange={(_, value) => setObraSearch(value)}
                  loading={loading.obras}
                  sx={{ width: 300 }}
                  noOptionsText="No hay obras"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Obra'
                      placeholder='Buscar obra'
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading.obras ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />

                {/* Botones */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleSave}
                    startIcon={<i className='ri-save-line' />}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant='outlined'
                    color='error'
                    onClick={() => router.back()}
                    startIcon={<i className='ri-close-line' />}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Grid para organizar los componentes */}
      <Grid container spacing={4} sx={{ mt: 1 }}>
        {/* Control Interno - 8 columnas */}
        <Grid item xs={12} md={8}>
          <RequestInternalControl />
        </Grid>

        {/* Contenedor para Cotización y Visitas - 4 columnas */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <RequestQuotation />
            </Grid>
            <Grid item xs={12}>
              <RequestVisits />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default CreateRequest
