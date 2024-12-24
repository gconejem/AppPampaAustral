'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

interface RequestData {
  nombre: string
  sku: string
  descripcion: string
  area: string
  familia: string
  tipo: string
  precio: number
  norma: string
  listaPrecios: string
  aplicaImpuesto: boolean
  esPaquete: boolean
  estado: string
}

const AddEnsayo = () => {
  const router = useRouter()
  
  // Estados básicos del ensayo
  const [nombre, setNombre] = useState('')
  const [sku, setSku] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [area, setArea] = useState('')
  const [familia, setFamilia] = useState('')
  const [precio, setPrecio] = useState('')
  const [norma, setNorma] = useState('')
  const [listaPrecios, setListaPrecios] = useState('')
  const [aplicaImpuesto, setAplicaImpuesto] = useState(false)

  // Estados para el manejo de errores y éxito
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    if (!nombre.trim()) return 'El nombre es requerido'
    if (!sku.trim()) return 'El SKU es requerido'
    if (!area.trim()) return 'El área es requerida'
    if (!familia.trim()) return 'La familia es requerida'
    
    const precioNum = parseFloat(precio)
    if (!precio || isNaN(precioNum) || precioNum <= 0) {
      return 'El precio debe ser un número válido mayor a 0'
    }
    if (precioNum >= 100000000) {
      return 'El precio no puede ser mayor a 99,999,999.99'
    }

    return ''
  }

  const handleSubmit = async () => {
    try {
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        return
      }

      setLoading(true)
      setError('')

      const precioNum = parseFloat(precio)
      const precioRedondeado = Math.round(precioNum * 100) / 100

      const requestData: RequestData = {
        nombre,
        sku,
        descripcion,
        area,
        familia,
        tipo: 'Ensayo',
        precio: precioRedondeado,
        norma,
        listaPrecios,
        aplicaImpuesto,
        esPaquete: false,
        estado: 'ACTIVO'
      }

      console.log('Enviando datos:', requestData)

      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al crear el ensayo')
      }

      const data = await response.json()
      console.log('Respuesta:', data)

      setSuccess(true)
      setTimeout(() => {
        router.push('/apps/ecommerce/products/list')
      }, 2000)
    } catch (error) {
      console.error('Error al crear el ensayo:', error)
      setError(error instanceof Error ? error.message : 'Error al crear el ensayo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader title='Crear Ensayo' />
        <CardContent>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Nombre del Ensayo'
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='SKU'
                value={sku}
                onChange={e => setSku(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label='Descripción'
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select value={area} onChange={e => setArea(e.target.value)} label='Área'>
                  <MenuItem value='Suelos'>Suelos</MenuItem>
                  <MenuItem value='Hormigones'>Hormigones</MenuItem>
                  <MenuItem value='Asfaltos'>Asfaltos</MenuItem>
                  <MenuItem value='Agregados'>Agregados</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Familia</InputLabel>
                <Select value={familia} onChange={e => setFamilia(e.target.value)} label='Familia'>
                  <MenuItem value='Clasificación'>Clasificación</MenuItem>
                  <MenuItem value='Compactación'>Compactación</MenuItem>
                  <MenuItem value='Densidad'>Densidad</MenuItem>
                  <MenuItem value='Resistencia'>Resistencia</MenuItem>
                  <MenuItem value='Deformación'>Deformación</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Norma'
                value={norma}
                onChange={e => setNorma(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Lista de Precios'
                value={listaPrecios}
                onChange={e => setListaPrecios(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Precio'
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>$</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={aplicaImpuesto} onChange={e => setAplicaImpuesto(e.target.checked)} />}
                label='Aplica Impuesto'
              />
            </Grid>

            <Grid item xs={12}>
              <Button 
                variant='contained' 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Crear Ensayo'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity='error' sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert onClose={() => setSuccess(false)} severity='success' sx={{ width: '100%' }}>
          Ensayo creado exitosamente
        </Alert>
      </Snackbar>
    </>
  )
}

export default AddEnsayo 
