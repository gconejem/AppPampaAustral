// React Imports
import { useState } from 'react'

import { toast } from 'react-hot-toast'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import FormHelperText from '@mui/material/FormHelperText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Types Imports
import type { ContactType } from '@/types/apps/contactTypes'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: ContactType[]
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

type FormNonValidateType = {
  company: string
  country: string
  contact: string
}

// Vars
const initialData = {
  company: '',
  country: '',
  contact: ''
}

const AddContactDrawer = (props: Props) => {
  // Props
  const { open, handleClose, userData, setData, setFilteredData } = props

  // States
  const [formData, setFormData] = useState<FormNonValidateType>(initialData)

  // Hooks
  const {
    control,
    reset: resetForm,
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

  const onSubmit = async (data: FormValidateType) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.text()

        console.error('Error response:', errorData)
        throw new Error('Error al crear contacto')
      }

      const newContact = await response.json()

      setData(prev => {
        const newData = [...prev, newContact]

        setFilteredData(newData)

        return newData
      })

      toast.success('Contacto creado exitosamente')
      resetForm()
      handleClose()
    } catch (error: any) {
      console.error('Error completo:', error)
      toast.error(error.message || 'Error al crear contacto')
    }
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '75%', sm: '75%' } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Añadir Nuevo Contacto</Typography>
        <IconButton size='small' onClick={handleReset}>
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
                    value: /^\+?56\s?9?\s?\d{8}$/,
                    message: 'Debe ser un número válido (ej: +56912345678)'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono 1'
                    error={Boolean(errors.telefono1)}
                    helperText={errors.telefono1?.message}
                    placeholder='+56912345678'
                    onKeyPress={e => {
                      const isNumber = /[0-9]/.test(e.key)
                      const isPlus = e.key === '+' && field.value === ''

                      if (!isNumber && !isPlus) {
                        e.preventDefault()
                      }
                    }}
                    onChange={e => {
                      const value = e.target.value.replace(/[^\d+]/g, '')

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
                    value: /^\+?56\s?9?\s?\d{8}$/,
                    message: 'Debe ser un número válido (ej: +56912345678)'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono 2'
                    error={Boolean(errors.telefono2)}
                    helperText={errors.telefono2?.message}
                    placeholder='+56912345678'
                    onKeyPress={e => {
                      const isNumber = /[0-9]/.test(e.key)
                      const isPlus = e.key === '+' && field.value === ''

                      if (!isNumber && !isPlus) {
                        e.preventDefault()
                      }
                    }}
                    onChange={e => {
                      const value = e.target.value.replace(/[^\d+]/g, '')

                      field.onChange(value)
                    }}
                  />
                )}
              />
            </Grid>
          </Grid>
          <div className='flex items-center gap-4 mt-5'>
            <Button variant='contained' type='submit'>
              Guardar
            </Button>
            <Button variant='outlined' color='error' type='reset' onClick={() => handleReset()}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddContactDrawer
