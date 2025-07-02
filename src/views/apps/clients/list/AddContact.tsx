import { useState } from 'react'

import { useForm, Controller } from 'react-hook-form'

import { toast } from 'react-hot-toast'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'

import type { Contacto } from '@/types/forms/cliente'
import type { ContactType } from '@/types/apps/contactTypes'

type Props = {
  open: boolean
  handleClose: () => void
  onContactCreated?: () => Promise<void>
}

const AddContact = (props: Props) => {
  const { open, handleClose, onContactCreated } = props

  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm<Contacto>({
    defaultValues: {
      nombre: '',
      cargo: '',
      email: '',
      telefono1: '',
      telefono2: ''
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (data: Contacto) => {
    try {
      setIsSubmitting(true)

      const contactData = {
        ...data,
        cargo: data.cargo || 'Sin cargo'
      }

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      })

      if (!response.ok) {
        const errorData = await response.text()

        console.error('Error response:', errorData)
        throw new Error('Error al crear contacto')
      }

      await response.json();

      if (onContactCreated) await onContactCreated();

      toast.success('Contacto creado exitosamente')
      resetForm()
      handleClose()
    } catch (error: any) {
      console.error('Error completo:', error)
      toast.error(error.message || 'Error al crear contacto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': { width: { xs: '75%', sm: '75%' } }
      }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Añadir Nuevo Contacto</Typography>
        <Button onClick={handleClose} color='error'>Cerrar</Button>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Controller
                name='nombre'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    label='Nombre y Apellido'
                    error={Boolean(errors.nombre)}
                    helperText={errors.nombre && 'Este campo es requerido'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='cargo'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    label='Cargo'
                    error={Boolean(errors.cargo)}
                    helperText={errors.cargo && 'Este campo es requerido'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='email'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    label='Email'
                    error={Boolean(errors.email)}
                    helperText={errors.email && 'Este campo es requerido'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='telefono1'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    required
                    label='Teléfono 1'
                    error={Boolean(errors.telefono1)}
                    helperText={errors.telefono1 && 'Este campo es requerido'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='telefono2'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono 2'
                  />
                )}
              />
            </Grid>
          </Grid>
          <div className='flex items-center gap-4 mt-5'>
            <Button
              variant='contained'
              type='submit'
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color='inherit' /> : null}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant='outlined' color='error' disabled={isSubmitting} onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddContact 
