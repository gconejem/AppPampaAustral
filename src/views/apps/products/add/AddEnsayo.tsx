'use client'

import { useState } from 'react'

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
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import InputAdornment from '@mui/material/InputAdornment'

// Third Party Imports
import { toast } from 'react-hot-toast'

const AddEnsayo = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    descripcion: '',
    area: '',
    familia: '',
    tipo: 'Ensayos',
    norma: '',
    precio: '',
    aplicaImpuesto: false,
    listaPrecio: '1'
  })

  // Estados para las opciones de los selects
  const [areas] = useState(['Suelos', 'Asfaltos', 'Hormigones', 'Áridos', 'Química', 'Otros'])

  const [familias] = useState(['Clasificación', 'Compactación', 'Densidad', 'Granulometría', 'Límites', 'Resistencia'])

  const [tipos] = useState(['Controles', 'Ensayos', 'Servicios', 'Paquete', 'Terreno'])

  const formatNumber = (value: string) => {
    // Eliminar cualquier caracter que no sea número
    const numbers = value.replace(/[^\d]/g, '')

    // Convertir a número y formatear con puntos
    return numbers ? Number(numbers).toLocaleString('es-CL') : ''
  }

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    // Guardar el valor sin formato en el estado
    const numericValue = value.replace(/[^\d]/g, '')

    setFormData(prev => ({
      ...prev,
      precio: numericValue
    }))
  }

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
          precio: parseFloat(formData.precio),
          listaPrecio: parseInt(formData.listaPrecio)
        })
      })

      if (!response.ok) {
        const error = await response.json()

        throw new Error(error.message || 'Error al crear el ensayo')
      }

      toast.success('Ensayo creado exitosamente')
      router.push('/home/apps/products')
    } catch (error) {
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
                      value={formData.area}
                      label='Área'
                      onChange={e => setFormData({ ...formData, area: e.target.value })}
                      required
                    >
                      {areas.map(area => (
                        <MenuItem key={area} value={area}>
                          {area}
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
                      onChange={e => setFormData({ ...formData, familia: e.target.value })}
                      required
                    >
                      {familias.map(familia => (
                        <MenuItem key={familia} value={familia}>
                          {familia}
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
                      onChange={e => setFormData({ ...formData, tipo: e.target.value })}
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Precio'
                    value={formatNumber(formData.precio)}
                    onChange={handlePriceChange}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>$</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.aplicaImpuesto}
                        onChange={e => setFormData({ ...formData, aplicaImpuesto: e.target.checked })}
                      />
                    }
                    label='Aplica Impuesto'
                  />
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
