'use client'

// React Imports
import { useState, useEffect } from 'react'

import { toast } from 'react-hot-toast'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import Modal from '@mui/material/Modal'

// Types
interface Producto {
  productoId: number
  sku: string
  nombre: string
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

interface EditProductFormProps {
  open: boolean
  onClose: () => void
  product: Producto | null
  onSave: (updatedProduct: Producto) => void
  areas: string[]
  familias: string[]
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4
}

const EditProductForm = ({ open, onClose, product, onSave, areas, familias }: EditProductFormProps) => {
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (product) {
      setEditingProduct(product)
    }
  }, [product])

  const handleSave = async () => {
    if (!editingProduct) return

    try {
      // Asegurarnos de que el precio sea un número válido
      const precio = editingProduct.precio || 0

      // Preparar los datos para enviar
      const dataToSend = {
        nombre: editingProduct.nombre,
        descripcion: editingProduct.descripcion,
        area: editingProduct.area,
        familia: editingProduct.familia,
        tipo: editingProduct.tipo,
        estado: editingProduct.estado,
        norma: editingProduct.norma,
        aplicaImpuesto: editingProduct.aplicaImpuesto,
        esPaquete: editingProduct.esPaquete,
        precio: precio,
        listasPrecios: {
          deleteMany: {},
          create: {
            listaPrecioId: 1,
            precio: precio,
            activo: true
          }
        }
      }

      console.log('Datos a enviar:', dataToSend)

      const response = await fetch(`/api/productos/${editingProduct.productoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) throw new Error('Error al actualizar producto')

      const updatedProduct = await response.json()

      // Mostrar notificación de éxito
      toast.success('Producto actualizado correctamente')

      // Actualizar el estado en el componente padre y cerrar el modal
      onSave(updatedProduct)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el producto')
    }
  }

  if (!editingProduct) return null

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant='h6' component='h2' sx={{ mb: 4 }}>
          Editar Producto
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <TextField
              label='Nombre del Ensayo'
              value={editingProduct.nombre}
              onChange={e => setEditingProduct({ ...editingProduct, nombre: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='SKU'
              value={editingProduct.sku}
              fullWidth
              InputProps={{
                readOnly: true
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label='Descripción'
              value={editingProduct.descripcion || ''}
              onChange={e => setEditingProduct({ ...editingProduct, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label='Área'
              value={editingProduct.area}
              onChange={e => setEditingProduct({ ...editingProduct, area: e.target.value })}
              fullWidth
            >
              <MenuItem value=''>
                <em>Seleccione un área</em>
              </MenuItem>
              {areas.map((area: string) => (
                <MenuItem key={area} value={area}>
                  {area}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              select
              label='Familia'
              value={editingProduct.familia}
              onChange={e => setEditingProduct({ ...editingProduct, familia: e.target.value })}
              fullWidth
            >
              <MenuItem value=''>
                <em>Seleccione una familia</em>
              </MenuItem>
              {familias.map((familia: string) => (
                <MenuItem key={familia} value={familia}>
                  {familia}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Norma'
              value={editingProduct.norma || ''}
              onChange={e => setEditingProduct({ ...editingProduct, norma: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Precio'
              value={editingProduct.precio || ''}
              onChange={e => {
                const value = e.target.value

                setEditingProduct({
                  ...editingProduct,
                  precio: value === '' ? 0 : parseFloat(value)
                })
              }}
              fullWidth
              type='number'
              InputProps={{
                startAdornment: <Typography>$</Typography>
              }}
            />
          </Grid>
          <Grid item xs={6} display='flex' alignItems='center'>
            <Checkbox
              checked={editingProduct.aplicaImpuesto}
              onChange={e => setEditingProduct({ ...editingProduct, aplicaImpuesto: e.target.checked })}
            />
            <Typography>Aplica Impuesto</Typography>
          </Grid>
        </Grid>
        <Box mt={4} display='flex' justifyContent='flex-end' gap={2}>
          <Button onClick={onClose} color='secondary' variant='outlined'>
            Cancelar
          </Button>
          <Button onClick={handleSave} color='primary' variant='contained'>
            Guardar Cambios
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default EditProductForm
