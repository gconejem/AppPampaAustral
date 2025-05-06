'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import Divider from '@mui/material/Divider'

// Types
interface Producto {
  productoId: number
  sku: string
  nombre: string
  descripcion?: string
  area: string
  familia: string
  tipo: string
  estado: string
  esPaquete: boolean
  norma?: string
  aplicaImpuesto: boolean
  listasPrecios: {
    precio: number
    listaPrecio: {
      id: number
      nombre: string
    }
  }[]
}

interface PreviewProductFormProps {
  open: boolean
  onClose: () => void
  product: Producto | null
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

const PreviewProductForm = ({ open, onClose, product }: PreviewProductFormProps) => {
  const [previewProduct, setPreviewProduct] = useState<Producto | null>(null)

  useEffect(() => {
    if (product) {
      setPreviewProduct(product)
    }
  }, [product])

  if (!previewProduct) return null

  // Obtener el primer precio de la lista si existe
  const firstPrice = previewProduct.listasPrecios?.[0]?.precio

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant='h6' component='h2' gutterBottom>
          Detalles del Producto
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          <Grid item xs={6}>
            <TextField
              label='Nombre del Ensayo'
              value={previewProduct.nombre}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField label='SKU' value={previewProduct.sku} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label='Descripción'
              value={previewProduct.descripcion || 'Sin descripción'}
              fullWidth
              multiline
              rows={3}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField label='Área' value={previewProduct.area} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label='Familia' value={previewProduct.familia} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField label='Tipo' value={previewProduct.tipo} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Norma'
              value={previewProduct.norma || 'Sin norma'}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Precio'
              value={
                firstPrice
                  ? new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP'
                    }).format(firstPrice)
                  : 'Sin precio'
              }
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Aplica Impuesto'
              value={previewProduct.aplicaImpuesto ? 'Sí' : 'No'}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField label='Estado' value={previewProduct.estado} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
        </Grid>

        <Box mt={4} display='flex' justifyContent='flex-end'>
          <Button onClick={onClose} color='primary' variant='contained'>
            Cerrar
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default PreviewProductForm
