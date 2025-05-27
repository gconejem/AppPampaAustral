'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Types Imports
import type { ContactType } from '@/types/apps/contactTypes'

interface Props {
  open: boolean
  contact: ContactType | null
  handleClose: () => void
}

const ContactPreview = ({ open, contact, handleClose }: Props) => {
  if (!contact) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6'>Detalles del Contacto</Typography>
          <IconButton onClick={handleClose} size='small'>
            <i className='ri-close-line' />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Card>
          <CardContent>
            <Grid container spacing={3}>
              {/* Información Personal */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                  Información Personal
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Nombre
                    </Typography>
                    <Typography variant='body1'>{contact.nombre}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Cargo
                    </Typography>
                    <Typography variant='body1'>{contact.cargo || 'Sin cargo'}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Información de Contacto */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                  Información de Contacto
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Email
                    </Typography>
                    <Typography variant='body1'>{contact.email}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Teléfono Principal
                    </Typography>
                    <Typography variant='body1'>{contact.telefono1}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Teléfono Secundario
                    </Typography>
                    <Typography variant='body1'>{contact.telefono2 || 'No especificado'}</Typography>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Información de Ubicación */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                  Ubicación
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Comuna
                    </Typography>
                    <Typography variant='body1'>{contact.comuna || 'No especificada'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Dirección
                    </Typography>
                    <Typography variant='body1'>{contact.direccion || 'No especificada'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant='body2' color='text.secondary'>
                      Empresa
                    </Typography>
                    <Typography variant='body1'>{contact.empresa || 'No especificada'}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

export default ContactPreview
