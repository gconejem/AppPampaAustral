// React Imports
import { useState } from 'react'

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

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Types Imports
import type { UsersType } from '@/types/apps/userTypes'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: UsersType[]
  setData: (data: UsersType[]) => void
}

type FormValidateType = {
  rut: string
  fullName: string
  username: string
  email: string
  role: string
  plan: string
  status: string
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

const AddUserDrawer = (props: Props) => {
  // Props
  const { open, handleClose, userData, setData } = props

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
      rut: '',
      fullName: '',
      username: '',
      email: '',
      role: '',
      plan: '',
      status: ''
    }
  })

  const onSubmit = (data: FormValidateType) => {
    const newUser: UsersType = {
      id: (userData?.length && userData?.length + 1) || 1,
      avatar: `/images/avatars/${Math.floor(Math.random() * 8) + 1}.png`,
      rut: data.rut,
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      role: data.role,
      currentPlan: data.plan,
      status: data.status,
      company: formData.company,
      country: formData.country,
      contact: formData.contact
    }

    setData([...(userData ?? []), newUser])
    handleClose()
    setFormData(initialData)
    resetForm({ fullName: '', username: '', email: '', role: '', plan: '', status: '' })
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
      <div className='flex items-center justify-between pli-5 plb-4'></div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit(data => onSubmit(data))} className='flex flex-col gap-5'>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='rut'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='ID Cliente (RUT)'
                    placeholder=''
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Razón Social'
                    placeholder=''
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Nombre Comercial'
                    placeholder='John Doe'
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Dirección'
                    placeholder='John Doe'
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id='country'>País</InputLabel>
                <Select
                  fullWidth
                  id='country'
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  label='País'
                  labelId='country'
                >
                  <MenuItem value='Chile'>Chile</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id='country'>Región</InputLabel>
                <Select
                  fullWidth
                  id='country'
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  label='País'
                  labelId='country'
                >
                  <MenuItem value='Chile'>Arica y Parinacota</MenuItem>
                  <MenuItem value='Chile'>Tarapacá</MenuItem>
                  <MenuItem value='Chile'>Antofagasta</MenuItem>
                  <MenuItem value='Chile'>Atacama</MenuItem>
                  <MenuItem value='Chile'>Coquimbo</MenuItem>
                  <MenuItem value='Chile'>Vaparaíso</MenuItem>
                  <MenuItem value='Chile'>Metropolitana</MenuItem>
                  <MenuItem value='Chile'>OHiggins</MenuItem>
                  <MenuItem value='Chile'>Maule</MenuItem>
                  <MenuItem value='Chile'>Ñuble</MenuItem>
                  <MenuItem value='Chile'>Biobío</MenuItem>
                  <MenuItem value='Chile'>La Araucanía</MenuItem>
                  <MenuItem value='Chile'>Los Ríos</MenuItem>
                  <MenuItem value='Chile'>Los Lagos</MenuItem>
                  <MenuItem value='Chile'>Aysén</MenuItem>
                  <MenuItem value='Chile'>Magallanes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Ciudad'
                    placeholder=''
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Comuna'
                    placeholder=''
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='username'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Web'
                    placeholder=''
                    {...(errors.username && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='username'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono'
                    placeholder=''
                    {...(errors.username && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='username'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Segmento'
                    placeholder=''
                    {...(errors.username && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='username'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Industria'
                    placeholder=''
                    {...(errors.username && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='username'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Fecha de creación'
                    placeholder=''
                    {...(errors.username && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id='country' error={Boolean(errors.status)}>
                  Estado
                </InputLabel>
                <Controller
                  name='status'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select label='Select Status' {...field} error={Boolean(errors.status)}>
                      <MenuItem value='pending'>Activo</MenuItem>
                      <MenuItem value='active'>Inactivo</MenuItem>
                      <MenuItem value='inactive'>Bloqueado</MenuItem>
                    </Select>
                  )}
                />
                {errors.status && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          {/* Sección de Contactos */}
          <Divider sx={{ my: 4 }} />
          <Grid container justifyContent='space-between' alignItems='center'>
            <Grid item>
              <Typography variant='h6'>Contactos</Typography>
            </Grid>
            <Grid item container alignItems='center' spacing={2} xs={12} sm={12} md={4} justifyContent='flex-end'>
              <Grid item xs>
                <TextField fullWidth label='Buscar contacto' placeholder='' multiline rows={1} />
              </Grid>
              <Grid item>
                <Button variant='contained' size='medium' sx={{ minWidth: '100px' }}>
                  Nuevo contacto
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Cargo</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Acción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Nombre Contacto</TableCell>
                  <TableCell>Cargo Contacto</TableCell>
                  <TableCell>email@email.com</TableCell>
                  <TableCell>+56961630966</TableCell>
                  <TableCell>
                    <IconButton size='small'>
                      <i className='ri-edit-line' />
                    </IconButton>
                    <IconButton size='small'>
                      <i className='ri-star-line' />
                    </IconButton>
                    <IconButton size='small'>
                      <i className='ri-delete-bin-line' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Sección de Condiciones Comerciales */}
          <Divider sx={{ my: 4 }} />
          <Typography variant='h6'>Condiciones Comerciales</Typography>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Vendedor</InputLabel>
                <Select>
                  <MenuItem value='Vendedor 1'>Vendedor 1</MenuItem>
                  <MenuItem value='Vendedor 2'>Vendedor 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='Condiciones de Venta' placeholder='' />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label='Observaciones' placeholder='' multiline rows={4} />
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

export default AddUserDrawer
