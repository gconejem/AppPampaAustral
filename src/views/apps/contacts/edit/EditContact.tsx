// React Imports
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Types Imports
import type { ContactType } from '@/types/apps/contactTypes'

type Props = {
  open: boolean
  contact: ContactType | null
  handleClose: () => void
  setData: (data: ContactType[] | ((prevData: ContactType[]) => ContactType[])) => void
  setFilteredData: (data: ContactType[] | ((prevData: ContactType[]) => ContactType[])) => void
}

type FormValidateType = {
  nombre: string
  cargo: string
  email: string
  telefono1: string
  telefono2?: string
}

const EditContact = ({ open, contact, handleClose, setData, setFilteredData }: Props) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      nombre: '',
      cargo: '',
      email: '',
      telefono1: '',
      telefono2: ''
    }
  })

  useEffect(() => {
    if (contact) {
      reset({
        nombre: contact.nombre,
        cargo: contact.cargo,
        email: contact.email,
        telefono1: contact.telefono1,
        telefono2: contact.telefono2
      })
    }
  }, [contact, reset])

  const onSubmit = async (data: FormValidateType) => {
    try {
      if (!contact) return

      const updatedContact = {
        ...contact,
        ...data
      }

      const response = await fetch(`/api/contactos/${contact.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(updatedContact)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al actualizar contacto')
      }

      setData(prev => {
        const newData = prev.map(item => (item.id === contact.id ? updatedContact : item))
        setFilteredData(newData)
        return newData
      })
      
      toast.success('Contacto actualizado exitosamente')
      handleClose()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar contacto')
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '75%', sm: '75%' } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Editar Contacto</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
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
                    label='Nombre'
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
                    type='email'
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
                  <TextField {...field} fullWidth label='Teléfono 2' />
                )}
              />
            </Grid>
          </Grid>
          <div className='flex items-center gap-4 mt-5'>
            <Button variant='contained' type='submit'>
              Guardar
            </Button>
            <Button variant='outlined' color='error' onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default EditContact 
