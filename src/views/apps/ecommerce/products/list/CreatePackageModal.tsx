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
  FormHelperText
} from '@mui/material'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4
}

interface CreatePackageModalProps {
  open: boolean
  handleClose: () => void
}

interface ListaPrecio {
  id: number
  nombre: string
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

        setListaPrecios(data)
      } catch (error) {
        console.error('Error al cargar listas de precios:', error)
      }
    }

    fetchListaPrecios()
  }, [])

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

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant='h6' mb={2}>
          Crear Nuevo Paquete
        </Typography>
        <TextField
          fullWidth
          label='Nombre del Paquete'
          value={nombrePaquete}
          onChange={e => setNombrePaquete(e.target.value)}
          margin='normal'
        />
        <TextField fullWidth label='SKU' value={sku} onChange={e => setSku(e.target.value)} margin='normal' />
        <TextField fullWidth label='Norma' value={norma} onChange={e => setNorma(e.target.value)} margin='normal' />
        <FormControl fullWidth margin='normal'>
          <InputLabel id='lista-precios-label'>Lista de Precios</InputLabel>
          <Select
            labelId='lista-precios-label'
            value={listaPrecioId}
            onChange={e => setListaPrecioId(e.target.value)}
            label='Lista de Precios'
          >
            {listaPrecios.map(lista => (
              <MenuItem key={lista.id} value={lista.id}>
                {lista.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label='Precio'
          value={precio}
          onChange={e => handlePrecioChange(e.target.value)}
          margin='normal'
          error={Boolean(precioError)}
          helperText={precioError}
          InputProps={{
            startAdornment: <InputAdornment position='start'>$</InputAdornment>
          }}
        />
        <FormControlLabel
          control={<Checkbox checked={aplicaImpuesto} onChange={e => setAplicaImpuesto(e.target.checked)} />}
          label='Aplicar Impuesto'
          sx={{ mt: 1 }}
        />
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
