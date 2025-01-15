'use client'

// React Imports
import { useState, useEffect } from 'react'

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

// Actualizar la interfaz de ListaPrecio
interface ListaPrecio {
  id: number
  nombre: string
  precio: number
}

interface EditProductFormProps {
  open: boolean
  onClose: () => void
  product: Producto | null
  onSave: (product: Producto) => Promise<void>
  areas: string[]
  familias: string[]
  listasPrecios: ListaPrecio[]
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

const EditProductForm = ({ open, onClose, product, onSave, areas, familias, listasPrecios }: EditProductFormProps) => {
  const [editingProduct, setEditingProduct] = useState<Producto | null>(product)
  const [selectedListaPrecio, setSelectedListaPrecio] = useState<ListaPrecio | null>(null)

  useEffect(() => {
    if (product) {
      console.log('Producto recibido:', product)
      console.log('Áreas disponibles:', areas)
      console.log('Familias disponibles:', familias)
      console.log('Listas de precios disponibles:', listasPrecios)

      setEditingProduct({
        ...product,
        precio: typeof product.precio === 'string' ? parseFloat(product.precio) : product.precio
      })

      // Buscar la lista de precios correspondiente
      const listaPrecio = listasPrecios?.find(l => l.nombre === product.listaPrecios)

      if (listaPrecio) {
        setSelectedListaPrecio(listaPrecio)
      }
    }
  }, [product, areas, familias, listasPrecios])

  const handleListaPrecioChange = (event: any) => {
    const selectedId = parseInt(event.target.value)
    const selected = listasPrecios.find(l => l.id === selectedId)

    if (selected) {
      setSelectedListaPrecio(selected)
      setEditingProduct(prev => {
        if (!prev) return prev

        return {
          ...prev,
          listaPrecios: selected.nombre,
          precio: selected.precio
        }
      })
    }
  }

  const handleSave = async () => {
    if (!editingProduct) return

    try {
      console.log('Enviando datos para actualizar:', editingProduct)

      // Preparar los datos para enviar
      const dataToSend = {
        ...editingProduct,
        listaPrecioId: selectedListaPrecio?.id,
        precio: Number(editingProduct.precio)
      }

      console.log('Datos preparados para enviar:', dataToSend)

      const response = await fetch(`/api/productos/${editingProduct.productoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const errorData = await response.json()

        throw new Error(errorData.error || 'Error al actualizar el producto')
      }

      const updatedProduct = await response.json()

      console.log('Producto actualizado:', updatedProduct)

      onSave(updatedProduct)
      onClose() // Cerrar el modal después de guardar exitosamente
    } catch (error) {
      console.error('Error al guardar cambios:', error)

      // Aquí podrías mostrar un mensaje de error al usuario, por ejemplo:
      alert(error instanceof Error ? error.message : 'Error al actualizar el producto')
    }
  }

  if (!editingProduct) return null

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ ...style, width: 800, height: 'auto', padding: 4 }}>
        <Typography variant='h5' mb={3}>
          Editar Ensayo
        </Typography>
        <Grid container spacing={3}>
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
              onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
              fullWidth
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
              select
              label='Lista de Precios'
              value={selectedListaPrecio?.id || ''}
              onChange={handleListaPrecioChange}
              fullWidth
            >
              <MenuItem value=''>
                <em>Seleccione una lista de precios</em>
              </MenuItem>
              {listasPrecios.map(lista => (
                <MenuItem key={lista.id} value={lista.id}>
                  {lista.nombre} (${lista.precio})
                </MenuItem>
              ))}
            </TextField>
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
