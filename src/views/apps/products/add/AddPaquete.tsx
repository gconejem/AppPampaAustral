'use client'

import { useState, useEffect } from 'react'

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
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'

interface Producto {
  productoId: number
  nombre: string
  sku: string
  descripcion?: string
  area: string
  familia: string
  tipo: string
  precio: number
  estado: string
  esPaquete: boolean
  norma?: string
  listaPrecios?: string
  aplicaImpuesto: boolean
}

interface AutocompleteOption {
  label: string
  id: number
  producto: Producto
}

const AddPaquete = () => {
  const router = useRouter()

  // Estados básicos del paquete
  const [nombre, setNombre] = useState('')
  const [sku, setSku] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [area, setArea] = useState('')
  const [familia, setFamilia] = useState('')
  const [precio, setPrecio] = useState('')
  const [norma, setNorma] = useState('')
  const [aplicaImpuesto, setAplicaImpuesto] = useState(false)
  const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOption[]>([])
  const [selectedOptions, setSelectedOptions] = useState<AutocompleteOption[]>([])
  const [tipo, setTipo] = useState('')

  // Estados para el manejo de errores y éxito
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Cargar productos disponibles
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        console.log('Iniciando fetch de productos...')
        const response = await fetch('/api/productos?esPaquete=false')
        const data = await response.json()

        console.log('Datos recibidos:', data)

        if (data.productos) {
          const options = data.productos.map((p: Producto) => {
            console.log('Procesando producto:', p)

            return {
              label: `${p.nombre} (${p.sku})`,
              id: p.productoId,
              producto: p
            }
          })

          console.log('Opciones procesadas:', options)
          setAutocompleteOptions(options)
        }
      } catch (error) {
        console.error('Error al cargar productos:', error)
      }
    }

    fetchProductos()
  }, [])

  const validateForm = () => {
    console.log('Validando formulario...')
    console.log('Valores actuales:', { nombre, sku, area, familia, precio, selectedOptions })

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

    if (selectedOptions.length === 0) {
      return 'Debe seleccionar al menos un producto para el paquete'
    }

    console.log('Validación exitosa')

    return ''
  }

  const handleSubmit = async () => {
    try {
      console.log('Iniciando submit...')
      const validationError = validateForm()

      if (validationError) {
        console.log('Error de validación:', validationError)
        setError(validationError)

        return
      }

      setLoading(true)
      setError('')

      const precioNum = parseFloat(precio)
      const precioRedondeado = Math.round(precioNum * 100) / 100

      const requestData = {
        nombre,
        sku,
        descripcion,
        area,
        familia,
        tipo,
        precio: precioRedondeado,
        norma,
        aplicaImpuesto,
        esPaquete: true,
        estado: 'ACTIVO',
        productosEnPaquete: selectedOptions.map(opt => opt.id)
      }

      console.log('Datos a enviar:', requestData)

      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const data = await response.json()

        console.log('Respuesta de error:', data)
        throw new Error(data.error || 'Error al crear el paquete')
      }

      const data = await response.json()

      console.log('Respuesta exitosa:', data)

      setSuccess(true)
      setTimeout(() => {
        router.push('/apps/ecommerce/products/list')
      }, 2000)
    } catch (error) {
      console.error('Error en handleSubmit:', error)
      setError(error instanceof Error ? error.message : 'Error al crear el paquete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader title='Crear Paquete de Ensayos' />
        <CardContent>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Nombre del Paquete'
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='SKU' value={sku} onChange={e => setSku(e.target.value)} />
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
              <TextField fullWidth label='Norma' value={norma} onChange={e => setNorma(e.target.value)} />
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

            <Grid item xs={12} sm={6}>
              <TextField select label='Tipo' value={tipo} onChange={e => setTipo(e.target.value)} fullWidth>
                <MenuItem value='Ensayo'>Ensayo</MenuItem>
                <MenuItem value='Paquete'>Paquete</MenuItem>
                <MenuItem value='Terreno'>Terreno</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={autocompleteOptions}
                value={selectedOptions}
                onChange={(_, newValue) => setSelectedOptions(newValue)}
                getOptionLabel={option => option.label}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.label}
                  </li>
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip label={option.label} {...getTagProps({ index })} key={option.id} />
                  ))
                }
                renderInput={params => (
                  <TextField {...params} label='Seleccionar Productos' placeholder='Buscar productos...' />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Button variant='contained' onClick={handleSubmit} disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Paquete'}
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
          Paquete creado exitosamente
        </Alert>
      </Snackbar>
    </>
  )
}

export default AddPaquete
