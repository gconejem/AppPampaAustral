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
  comuna?: string
  direccion?: string
  empresa?: string
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
      telefono2: '',
      comuna: '',
      direccion: '',
      empresa: ''
    }
  })

  useEffect(() => {
    if (contact) {
      reset({
        nombre: contact.nombre,
        cargo: contact.cargo,
        email: contact.email,
        telefono1: contact.telefono1,
        telefono2: contact.telefono2,
        comuna: contact.comuna,
        direccion: contact.direccion,
        empresa: contact.empresa
      })
    }
  }, [contact, reset])

  const onSubmit = async (data: FormValidateType) => {
    try {
      if (!contact) return

      const updatedContact = {
        ...contact,
        ...data,
        updatedAt: new Date()
      }

      const response = await fetch(`/api/contacts/${contact.contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedContact)
      })

      if (!response.ok) {
        const errorData = await response.text()

        console.error('Error response:', errorData)
        throw new Error('Error al actualizar contacto')
      }

      const responseData = await response.json()

      setData(prev => {
        const newData = prev.map(item => (item.contactId === contact.contactId ? responseData : item))

        setFilteredData(newData)

        return newData
      })

      toast.success('Contacto actualizado exitosamente')
      handleClose()
    } catch (error: any) {
      console.error('Error completo:', error)
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
                rules={{
                  required: 'Este campo es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type='email'
                    label='Email'
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='telefono1'
                control={control}
                rules={{
                  required: 'Este campo es requerido',
                  pattern: {
                    value: /^(\+569\d{8}|\d{9})$/,
                    message: 'Debe ser un número válido (ej: 979990042 o +56979990042)'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono 1'
                    error={Boolean(errors.telefono1)}
                    helperText={errors.telefono1?.message}
                    placeholder='979990042'
                    onKeyPress={e => {
                      const isNumber = /[0-9]/.test(e.key)
                      const isPlus = e.key === '+'

                      if (!isNumber && !isPlus) {
                        e.preventDefault()
                      }
                    }}
                    onChange={e => {
                      let value = e.target.value.replace(/[^\d+]/g, '')
                      field.onChange(value)
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='telefono2'
                control={control}
                rules={{
                  pattern: {
                    value: /^(\+569\d{8}|\d{9})$/,
                    message: 'Debe ser un número válido (ej: 979990042 o +56979990042)'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono 2'
                    error={Boolean(errors.telefono2)}
                    helperText={errors.telefono2?.message}
                    placeholder='979990042'
                    onKeyPress={e => {
                      const isNumber = /[0-9]/.test(e.key)
                      const isPlus = e.key === '+'

                      if (!isNumber && !isPlus) {
                        e.preventDefault()
                      }
                    }}
                    onChange={e => {
                      let value = e.target.value.replace(/[^\d+]/g, '')
                      field.onChange(value)
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='empresa'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Empresa' error={Boolean(errors.empresa)} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='direccion'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Dirección' error={Boolean(errors.direccion)} />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='comuna'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Comuna' error={Boolean(errors.comuna)} />
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
