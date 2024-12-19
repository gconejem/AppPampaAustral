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
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'

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
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Nueva Obra</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit(data => onSubmit(data))} className='flex flex-col gap-5'>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='numeroObra'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Número Obra *'
                    placeholder=''
                    {...(errors.numeroObra && { error: true, helperText: 'Este campo es obligatorio.' })}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name='fechaIngreso'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Fecha Ingreso *'
                    type='date'
                    InputLabelProps={{ shrink: true }}
                    {...(errors.fechaIngreso && { error: true, helperText: 'Este campo es obligatorio.' })}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <Controller
                  name='estado'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => <TextField {...field} label='Estado' fullWidth disabled />}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id='estadoObra' error={Boolean(errors.estadoObra)}>
                  Estado Obra
                </InputLabel>
                <Controller
                  name='estadoObra'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select label='Estado Obra' {...field} error={Boolean(errors.estadoObra)}>
                      <MenuItem value='activo'>Activo</MenuItem>
                      <MenuItem value='inactivo'>Inactivo</MenuItem>
                      <MenuItem value='finalizado'>Finalizado</MenuItem>
                    </Select>
                  )}
                />
                {errors.estadoObra && <FormHelperText error>Este campo es obligatorio.</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='RUT'
                    placeholder='...'
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Nombre del Cliente'
                    placeholder='...'
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant='h5' component='div'>
                Antecedentes
              </Typography>
            </Grid>

            <Grid item xs={12} sm={3}></Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={12}>
              <Controller
                name='fullName'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Nombre Obra'
                    placeholder=''
                    {...(errors.fullName && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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

            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={3}>
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

            <Grid item xs={12} sm={3}>
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
            <Grid item xs={12} sm={5}>
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

            <Grid item xs={12} sm={2} style={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel control={<Checkbox />} label='Informe a Mandante' />
            </Grid>

            <Grid item xs={12} sm={5}>
              <Controller
                name='username'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Texto Mandante'
                    placeholder=''
                    {...(errors.username && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/*  Contactos */}
          <Divider sx={{ my: 4 }} />
          <Grid container alignItems='center' spacing={2}>
            <Grid item xs={6}>
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
                  width: '400px',
                  height: '40px',
                  '& .MuiInputBase-root': {
                    height: '100%'
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

          {/*  Condiciones Comerciales */}
          <Divider sx={{ my: 4 }} />
          <Typography variant='h5'>Requisitos</Typography>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Checkbox />} label='Acreditación de Personal' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Checkbox />} label='Especificaciones Técnicas (EETT)' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Checkbox />} label='Acreditación de Equipos' />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Checkbox />} label='Carta de Compromiso' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel control={<Checkbox />} label='Mandato y Envío de Informes a SERVIU' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='Otros' placeholder='' />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Typography variant='h5'>Facturación</Typography>
            </Grid>
            <Grid item xs={12} sm={6} display='flex' justifyContent='flex-end'>
              <FormControlLabel control={<Checkbox />} label='Copiar Cliente' />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='Razón Social' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='RUT' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='Giro' />
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField fullWidth label='Dirección Comercial' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='Comuna' />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='Teléfono' />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Lista de Precios</InputLabel>
                <Select>
                  <MenuItem value='Lista 1'>Lista 1</MenuItem>
                  <MenuItem value='Lista 2'>Lista 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='Mail Recepción Factura' />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            {/* "Referencias" */}
            <Grid item xs={12}>
              <Typography variant='h5'>Referencias</Typography>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControlLabel control={<Checkbox />} label='Estado de Pago' />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel control={<Checkbox />} label='HES' />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel control={<Checkbox />} label='OC' />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='Otro' />
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
