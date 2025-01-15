import React, { useState, useEffect } from 'react'

// MUI Imports
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Grid
} from '@mui/material'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflow: 'auto'
}

interface CreatePackageModalProps {
  open: boolean
  handleClose: () => void
}

interface ListaPrecio {
  id: number
  nombre: string
  precio: number
}

const CreatePackageModal: React.FC<CreatePackageModalProps> = ({ open, handleClose }) => {
  // Estados
  const [nombrePaquete, setNombrePaquete] = useState('')
  const [sku, setSku] = useState('')
  const [norma, setNorma] = useState('')
  const [listaPrecioId, setListaPrecioId] = useState('')
  const [precio, setPrecio] = useState('')
  const [aplicaImpuesto, setAplicaImpuesto] = useState(false)
  const [listaPrecios, setListaPrecios] = useState<ListaPrecio[]>([])
  const [precioError, setPrecioError] = useState('')

  // Cargar listas de precios
  useEffect(() => {
    const fetchListaPrecios = async () => {
      try {
        const response = await fetch('/api/lista-precios')
        const data = await response.json()

        console.log('Listas de precios cargadas:', data) // Para debugging
        setListaPrecios(data)
      } catch (error) {
        console.error('Error al cargar listas de precios:', error)
      }
    }

    if (open) {
      // Solo cargar cuando el modal se abre
      fetchListaPrecios()
    }
  }, [open])

  // Validar precio
  const handlePrecioChange = (value: string) => {
    setPrecio(value)

    if (!value) {
      setPrecioError('El precio es requerido')
    } else if (isNaN(Number(value))) {
      setPrecioError('El precio debe ser un número')
    } else if (Number(value) <= 0) {
      setPrecioError('El precio debe ser mayor a 0')
    } else {
      setPrecioError('')
    }
  }

  // Actualizar el precio cuando se selecciona una lista de precios
  const handleListaPrecioChange = (event: any) => {
    const selectedId = event.target.value

    setListaPrecioId(selectedId)

    // Encontrar la lista de precios seleccionada
    const selectedLista = listaPrecios.find(lista => lista.id === selectedId)

    if (selectedLista) {
      setPrecio(selectedLista.precio.toString())
      setPrecioError('') // Limpiar error si existe
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant='h6' mb={2}>
          Crear Nuevo Paquete
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Nombre del Paquete'
              value={nombrePaquete}
              onChange={e => setNombrePaquete(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label='SKU' value={sku} onChange={e => setSku(e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label='Norma' value={norma} onChange={e => setNorma(e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth error={!listaPrecioId}>
              <InputLabel>Lista de Precios</InputLabel>
              <Select value={listaPrecioId} onChange={handleListaPrecioChange} label='Lista de Precios'>
                <MenuItem value=''>
                  <em>Seleccione una lista de precios</em>
                </MenuItem>
                {listaPrecios.map(lista => (
                  <MenuItem key={lista.id} value={lista.id}>
                    {`${lista.nombre} - $${lista.precio.toLocaleString()}`}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {!listaPrecioId ? 'Seleccione una lista de precios' : 'El precio se actualizará automáticamente'}
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label='Precio'
              value={precio}
              onChange={e => handlePrecioChange(e.target.value)}
              error={Boolean(precioError)}
              helperText={precioError}
              InputProps={{
                startAdornment: <InputAdornment position='start'>$</InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Checkbox checked={aplicaImpuesto} onChange={e => setAplicaImpuesto(e.target.checked)} />}
              label='Aplicar Impuesto'
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button onClick={handleClose} color='secondary'>
            Cancelar
          </Button>
          <Button onClick={handleClose} color='primary' variant='contained' disabled={Boolean(precioError)}>
            Guardar
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default CreatePackageModal
