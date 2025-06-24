import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

interface Producto {
  productoId: number
  sku: string
  nombre: string
  cantidad?: number
  area?: string
  familia?: string
  tipo?: string
  estado?: string
  esPaquete?: boolean
  norma?: string
}

interface Paquete {
  productoId: number
  sku: string
  nombre: string
  cantidad: number
  descripcion?: string
  norma?: string
  area?: string
  familia?: string
  productosEnPaquete: Producto[]
  tipo?: string
}

interface PreviewPackageFormProps {
  open: boolean
  onClose: () => void
  paquete: Paquete | null
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4,
  overflow: 'auto'
}

const PreviewPackageForm = ({ open, onClose, paquete }: PreviewPackageFormProps) => {
  const [previewPaquete, setPreviewPaquete] = useState<Paquete | null>(null)

  useEffect(() => {
    if (paquete) {
      setPreviewPaquete(paquete)
    }
  }, [paquete])

  if (!previewPaquete) return null

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant='h6' component='h2' gutterBottom>
          Detalles del Paquete
        </Typography>
        <Divider sx={{ mb: 4 }} />
        <Grid container spacing={4}>
          <Grid item xs={4}>
            <TextField label='Nombre' value={previewPaquete.nombre} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={4}>
            <TextField label='SKU' value={previewPaquete.sku} fullWidth InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={4}>
            <TextField 
              label='Cantidad' 
              value={previewPaquete.cantidad || 1} 
              fullWidth 
              InputProps={{ readOnly: true }} 
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Norma'
              value={previewPaquete.norma || 'Sin norma'}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Área'
              value={previewPaquete.area || 'Sin área'}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Familia'
              value={previewPaquete.familia || 'Sin familia'}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label='Tipo'
              value={previewPaquete.tipo || 'Sin tipo'}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label='Descripción'
              value={previewPaquete.descripcion || 'Sin descripción'}
              fullWidth
              multiline
              rows={3}
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Typography variant='subtitle1' sx={{ mb: 2 }}>
          Productos incluidos en el paquete:
        </Typography>
        <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
          <List>
            {previewPaquete.productosEnPaquete && previewPaquete.productosEnPaquete.length > 0 ? (
              previewPaquete.productosEnPaquete.map(producto => (
                <ListItem key={producto.productoId}>
                  <ListItemText
                    primary={`${producto.nombre} (SKU: ${producto.sku})`}
                    secondary={`Cantidad: ${producto.cantidad || 1}${producto.tipo ? ' | Tipo: ' + producto.tipo : ''}`}
                  />
                </ListItem>
              ))
            ) : (
              <Typography variant='body2' color='text.secondary'>
                No hay productos en este paquete.
              </Typography>
            )}
          </List>
        </Box>
        <Box mt={4} display='flex' justifyContent='flex-end'>
          <Button onClick={onClose} color='primary' variant='contained'>
            Cerrar
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default PreviewPackageForm
