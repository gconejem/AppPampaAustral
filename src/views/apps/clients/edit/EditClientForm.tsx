// React Imports
import { useState, useEffect } from 'react'

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
import type { Cliente } from '@/types/cliente'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: Cliente[]
  setData: (data: Cliente[]) => void
  currentUser: Cliente // Cliente a editar
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
  region: string
  city: string
  commune: string
  address: string
  phone: string
  website: string
  segment: string
  industry: string
}

// Vars
const initialData = {
  company: '',
  country: '',
  contact: '',
  region: '',
  city: '',
  commune: '',
  address: '',
  phone: '',
  website: '',
  segment: '',
  industry: ''
}

const EditClientForm = (props: Props) => {
  const { open, handleClose, userData, setData, currentUser } = props

  const [formData, setFormData] = useState<FormNonValidateType>(initialData)

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

  // Cargar datos actuales del cliente
  useEffect(() => {
    if (currentUser) {
      resetForm({
        rut: currentUser.rut,
        fullName: currentUser.fullName,
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
        plan: currentUser.currentPlan,
        status: currentUser.status
      })
      setFormData({
        company: currentUser.company || '',
        country: currentUser.country || '',
        contact: currentUser.contact || '',
        region: '',
        city: '',
        commune: '',
        address: '',
        phone: '',
        website: '',
        segment: '',
        industry: ''
      })
    }
  }, [currentUser, resetForm])

  // Guardar cambios en el cliente
  const onSubmit = (data: FormValidateType) => {
    const updatedData = userData?.map(user => (user.id === currentUser.id ? { ...user, ...data, ...formData } : user))

    setData(updatedData || [])
    handleClose()
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
        <Typography variant='h5'>Añadir Nuevo Cliente</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit(data => onSubmit(data))} className='flex flex-col gap-5'>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                name='rut'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Fecha de Creación'
                    placeholder=''
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
          <Grid container spacing={5}>
            <Grid item xs={12} sm={3}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='ID Cliente (RUT)'
                    placeholder='...'
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Razón Social'
                    placeholder='...'
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Cliente'
                    placeholder='...'
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={<Checkbox name='copySocialReason' />}
                label='Copiar Razón Social'
                sx={{ margin: '10px' }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
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

            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
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
                    label='Dirección'
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
                    label='Web'
                    placeholder=''
                    {...(errors.username && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='country' error={Boolean(errors.status)}>
                  Segmento
                </InputLabel>
                <Controller
                  name='status'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select label='Select Status' {...field} error={Boolean(errors.status)}>
                      <MenuItem value='pending'>...</MenuItem>
                      <MenuItem value='active'></MenuItem>
                      <MenuItem value='inactive'></MenuItem>
                    </Select>
                  )}
                />
                {errors.status && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='country' error={Boolean(errors.status)}>
                  Industria
                </InputLabel>
                <Controller
                  name='status'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select label='Select Status' {...field} error={Boolean(errors.status)}>
                      <MenuItem value='pending'>...</MenuItem>
                      <MenuItem value='active'></MenuItem>
                      <MenuItem value='inactive'></MenuItem>
                    </Select>
                  )}
                />
                {errors.status && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          {/* Sección de Contactos */}
          <Divider sx={{ my: 4 }} />
          <Grid container alignItems='center' spacing={2}>
            <Grid item xs={6}>
              {/* Aquí centramos el texto dentro del grid que ocupa el 50% del espacio */}
              <Typography
                variant='h5'
                sx={{
                  textAlign: 'left'
                }}
              >
                Contactos
              </Typography>
            </Grid>

            <Grid item xs={6} container justifyContent='flex-end'>
              {/* Alineamos la barra de búsqueda a la derecha dentro del grid que ocupa el 50% del espacio */}
              <TextField
                placeholder='Buscar Contacto'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{
                  width: '400px', // Ajusta el ancho si es necesario
                  height: '40px', // Ajusta la altura si es necesario
                  '& .MuiInputBase-root': {
                    height: '100%' // Asegura que el input tenga la altura correcta
                  }
                }}
              />
            </Grid>
          </Grid>

          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#F5F5F5' }}>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid  #E0E0E0', width: '200px' }}
                  >
                    NOMBRE
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid  #E0E0E0', width: '200px' }}
                  >
                    CARGO
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid  #E0E0E0', width: '200px' }}
                  >
                    EMAIL
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid  #E0E0E0', width: '200px' }}
                  >
                    TELÉFONO 1
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid  #E0E0E0', width: '200px' }}
                  >
                    TELÉFONO 2
                  </TableCell>
                  <TableCell sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid  #E0E0E0' }}>
                    ACCIÓN
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <TextField
                      placeholder='Nombre'
                      fullWidth
                      variant='outlined'
                      size='small'
                      sx={{
                        width: '200px',
                        height: '40px'
                      }}
                    ></TextField>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Cargo</InputLabel>
                      <Select
                        defaultValue=''
                        label='Cargo'
                        sx={{
                          width: '200px',
                          height: '40px'
                        }}
                      >
                        <MenuItem value='Gerente'>Cargo</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {' '}
                    <TextField
                      placeholder='Email'
                      fullWidth
                      variant='outlined'
                      size='small'
                      sx={{
                        width: '200px',
                        height: '40px'
                      }}
                    ></TextField>
                  </TableCell>
                  <TableCell>
                    {' '}
                    <TextField
                      placeholder='Teléfono 1'
                      fullWidth
                      variant='outlined'
                      size='small'
                      sx={{
                        width: '200px',
                        height: '40px'
                      }}
                    ></TextField>
                  </TableCell>
                  <TableCell>
                    {' '}
                    <TextField
                      placeholder='Teléfono 2'
                      fullWidth
                      variant='outlined'
                      size='small'
                      sx={{
                        width: '200px',
                        height: '40px'
                      }}
                    ></TextField>
                  </TableCell>

                  <TableCell>
                    <IconButton size='small'>
                      <i className='ri-add-line' />
                    </IconButton>
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
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Vendedor</InputLabel>
                <Select>
                  <MenuItem value='Vendedor 1'>Vendedor 1</MenuItem>
                  <MenuItem value='Vendedor 2'>Vendedor 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='Condiciones de Venta' placeholder='' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='Observaciones' placeholder='' />
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

export default EditClientForm
