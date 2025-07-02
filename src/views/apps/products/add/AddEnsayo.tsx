'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Third Party Imports
import { toast } from 'react-hot-toast'

interface Area {
  id: number
  nombre: string
}

interface Familia {
  id: number
  nombre: string
  area: {
    id: number
    nombre: string
  }
}

const AddEnsayo = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [areas, setAreas] = useState<Area[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [tipos, setTipos] = useState<string[]>([])

  // Cargar áreas y tipos cuando se monta el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar áreas
        const areasResponse = await fetch('/api/areas')
        const areasData = await areasResponse.json()

        setAreas(areasData)

        // Cargar tipos
        const debugResponse = await fetch('/api/debug')
        const debugData = await debugResponse.json()

        if (debugData) {
          setTipos(debugData.tipos || [])
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
        toast.error('Error al cargar los datos')
      }
    }

    fetchData()
  }, [])

  // Cargar familias cuando se selecciona un área
  useEffect(() => {
    const fetchFamilias = async () => {
      if (selectedAreaId) {
        try {
          const response = await fetch(`/api/familias?areaId=${selectedAreaId}`)
          const data = await response.json()

          setFamilias(data)
        } catch (error) {
          console.error('Error cargando familias:', error)
          toast.error('Error al cargar las familias')
        }
      } else {
        setFamilias([])
      }
    }

    fetchFamilias()
  }, [selectedAreaId])

  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    descripcion: '',
    area: '',
    familia: '',
    tipo: 'Ensayos',
    norma: '',
    listaPrecio: '1'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          listaPrecio: parseInt(formData.listaPrecio)
        })
      })

      if (!response.ok) {
        const error = await response.json()

        throw new Error(error.message || 'Error al crear el ensayo')
      }

      toast.success('Ensayo creado exitosamente')
      router.push('/home/apps/products')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al crear el ensayo')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title='Añadir Producto' />
            <CardContent>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='SKU' value={formData.sku} onChange={handleChange('sku')} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Nombre'
                    value={formData.nombre}
                    onChange={handleChange('nombre')}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Descripción'
                    value={formData.descripcion}
                    onChange={handleChange('descripcion')}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Área</InputLabel>
                    <Select
                      value={selectedAreaId || ''}
                      label='Área'
                      onChange={e => {
                        const areaId = e.target.value ? Number(e.target.value) : null

                        setSelectedAreaId(areaId)
                        setFormData(prev => ({
                          ...prev,
                          area: areaId ? areas.find(a => a.id === areaId)?.nombre || '' : '',
                          familia: '' // Limpiar familia al cambiar área
                        }))
                      }}
                      required
                    >
                      <MenuItem value=''>
                        <em>Ninguna</em>
                      </MenuItem>
                      {areas.map(area => (
                        <MenuItem key={area.id} value={area.id}>
                          {area.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Familia</InputLabel>
                    <Select
                      value={formData.familia}
                      label='Familia'
                      onChange={e => setFormData(prev => ({ ...prev, familia: e.target.value }))}
                      required
                      disabled={!selectedAreaId}
                    >
                      <MenuItem value=''>
                        <em>Ninguna</em>
                      </MenuItem>
                      {familias.map(familia => (
                        <MenuItem key={familia.id} value={familia.nombre}>
                          {familia.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={formData.tipo}
                      label='Tipo'
                      onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                      required
                    >
                      {tipos.map(tipo => (
                        <MenuItem key={tipo} value={tipo}>
                          {tipo}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Norma' value={formData.norma} onChange={handleChange('norma')} />
                </Grid>
                <Grid item xs={12}>
                  <Button type='submit' variant='contained' disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Ensayo'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </form>
  )
}

export default AddEnsayo
