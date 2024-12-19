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
import axios from 'axios'
import { toast } from 'react-hot-toast' // Para notificaciones

// Types Imports
import type { Cliente } from '@/types/cliente'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: Cliente[]
  setData: (data: Cliente[]) => void
}

type FormValidateType = {
  rut: string
  status: string
  razonSocial: string
  nombreCliente: string
  ciudad: string
  comuna: string
  direccion: string
  telefono: string
  sitioWeb: string
  segmento: string
  industria: string
  vendedor: string
  condicionesVenta: string
  observaciones: string
  fechaCreacion: string
}

type FormNonValidateType = {
  company: string
  country: string
  contact: string
  pais: string
  region: string
}

type Contacto = {
  nombre: string
  cargo: string
  email: string
  telefono1: string
  telefono2: string
}

// Vars
const initialData = {
  company: '',
  country: '',
  contact: '',
  pais: '',
  region: ''
}

type RegionData = {
  [key in 'Metropolitana' | 'Valparaíso' | 'Biobío']: {
    ciudades: string[]
    comunas: string[]
  }
}

// Datos dummy para los selects
const DUMMY_DATA = {
  segmentos: ['Corporativo', 'Pyme', 'Retail', 'Gobierno'],
  industrias: ['Tecnología', 'Manufactura', 'Retail', 'Servicios', 'Construcción'],
  paises: ['Chile'],
  regiones: {
    'Metropolitana': {
      ciudades: ['Santiago', 'Puente Alto', 'Maipú'],
      comunas: ['Las Condes', 'Providencia', 'Santiago Centro', 'Ñuñoa']
    },
    'Valparaíso': {
      ciudades: ['Valparaíso', 'Viña del Mar', 'Quilpué'],
      comunas: ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana']
    },
    'Biobío': {
      ciudades: ['Concepción', 'Talcahuano', 'Chillán'],
      comunas: ['Concepción', 'Talcahuano', 'San Pedro de la Paz']
    }
  } as RegionData
}

const AddUserDrawer = (props: Props) => {
  // Props
  const { open, handleClose, userData, setData } = props

  // States
  const [formData, setFormData] = useState<FormNonValidateType>(initialData)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [nuevoContacto, setNuevoContacto] = useState<Contacto>({
    nombre: '',
    cargo: '',
    email: '',
    telefono1: '',
    telefono2: ''
  })
  const [selectedRegion, setSelectedRegion] = useState('')

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      rut: '',
      status: '',
      razonSocial: '',
      nombreCliente: '',
      ciudad: '',
      comuna: '',
      direccion: '',
      telefono: '',
      sitioWeb: '',
      segmento: '',
      industria: '',
      vendedor: '',
      condicionesVenta: '',
      observaciones: '',
      fechaCreacion: new Date().toISOString().split('T')[0]
    }
  })

  // Obtener la fecha actual en formato YYYY-MM-DD
  const fechaActual = new Date().toISOString().split('T')[0]

  // Función para crear cliente
  const crearCliente = async (data: FormValidateType) => {
    try {
      const clienteData = {
        rut: data.rut,
        estado: data.status,
        razonSocial: data.razonSocial,
        nombreCliente: data.nombreCliente,
        pais: formData.pais,
        region: formData.region,
        ciudad: data.ciudad,
        comuna: data.comuna,
        direccion: data.direccion,
        telefono: data.telefono,
        sitioWeb: data.sitioWeb,
        segmento: data.segmento,
        industria: data.industria,
        contactos: {
          create: contactos.map(contacto => ({
            nombre: contacto.nombre,
            cargo: contacto.cargo,
            email: contacto.email,
            telefono1: contacto.telefono1,
            telefono2: contacto.telefono2
          }))
        },
        condicionesComerciales: {
          create: {
            vendedor: data.vendedor,
            condicionVenta: data.condicionesVenta,
            observaciones: data.observaciones
          }
        }
      }

      const response = await axios.post('/api/clientes', clienteData)

      if (response.status === 201) {
        toast.success('Cliente creado exitosamente')
        handleClose()
        resetForm()
        setContactos([])
        // Actualizar la lista de clientes
        if (props.setData && props.userData) {
          props.setData([...props.userData, response.data])
        }
      }
    } catch (error) {
      console.error('Error al crear cliente:', error)
      toast.error('Error al crear el cliente')
    }
  }

  // Actualizar onSubmit para usar la nueva función
  const onSubmit = (data: FormValidateType) => {
    crearCliente(data)
  }

  // Función para obtener clientes
  const obtenerClientes = async () => {
    try {
      const response = await axios.get('/en/api/clientes')
      if (response.status === 200 && props.setData) {
        props.setData(response.data)
      }
    } catch (error) {
      console.error('Error al obtener clientes:', error)
      toast.error('Error al cargar los clientes')
    }
  }

  // Cargar clientes al montar el componente
  useEffect(() => {
    obtenerClientes()
  }, [])

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
  }

  const agregarContacto = () => {
    setContactos([...contactos, nuevoContacto])
    setNuevoContacto({
      nombre: '',
      cargo: '',
      email: '',
      telefono1: '',
      telefono2: ''
    })
  }

  const eliminarContacto = (index: number) => {
    setContactos(contactos.filter((_, i) => i !== index))
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
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                name='fechaCreacion'
                control={control}
                defaultValue={fechaActual}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Fecha de Creación'
                    InputProps={{
                      readOnly: true, // Hace el campo de solo lectura
                    }}
                    value={fechaActual} // Fuerza el valor a la fecha actual
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
                name='rut'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='ID Cliente (RUT)'
                    placeholder='...'
                    {...(errors.razonSocial && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name='razonSocial'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Razón Social'
                    placeholder='...'
                    {...(errors.razonSocial && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name='nombreCliente'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Cliente'
                    placeholder='...'
                    {...(errors.razonSocial && { error: true, helperText: 'This field is required.' })}
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
                <InputLabel>Región</InputLabel>
                <Select
                  value={selectedRegion}
                  onChange={e => {
                    setSelectedRegion(e.target.value)
                    setFormData({ ...formData, region: e.target.value })
                  }}
                  label='Región'
                >
                  {Object.keys(DUMMY_DATA.regiones).map(region => (
                    <MenuItem key={region} value={region}>{region}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name='ciudad'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Ciudad</InputLabel>
                    <Select
                      {...field}
                      label='Ciudad'
                      error={Boolean(errors.ciudad)}
                    >
                      {selectedRegion && DUMMY_DATA.regiones[selectedRegion as keyof RegionData].ciudades.map(ciudad => (
                        <MenuItem key={ciudad} value={ciudad}>{ciudad}</MenuItem>
                      ))}
                    </Select>
                    {errors.ciudad && <FormHelperText error>Este campo es requerido</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Controller
                name='comuna'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Comuna</InputLabel>
                    <Select
                      {...field}
                      label='Comuna'
                      error={Boolean(errors.comuna)}
                    >
                      {selectedRegion && DUMMY_DATA.regiones[selectedRegion as keyof RegionData].comunas.map(comuna => (
                        <MenuItem key={comuna} value={comuna}>{comuna}</MenuItem>
                      ))}
                    </Select>
                    {errors.comuna && <FormHelperText error>Este campo es requerido</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='direccion'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Dirección'
                    placeholder=''
                    {...(errors.razonSocial && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='telefono'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono'
                    placeholder=''
                    {...(errors.razonSocial && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='sitioWeb'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Web'
                    placeholder=''
                    {...(errors.razonSocial && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                name='segmento'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Segmento</InputLabel>
                    <Select
                      {...field}
                      label='Segmento'
                      error={Boolean(errors.segmento)}
                    >
                      {DUMMY_DATA.segmentos.map(segmento => (
                        <MenuItem key={segmento} value={segmento}>{segmento}</MenuItem>
                      ))}
                    </Select>
                    {errors.segmento && <FormHelperText error>Este campo es requerido</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='industria'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Industria</InputLabel>
                    <Select
                      {...field}
                      label='Industria'
                      error={Boolean(errors.industria)}
                    >
                      {DUMMY_DATA.industrias.map(industria => (
                        <MenuItem key={industria} value={industria}>{industria}</MenuItem>
                      ))}
                    </Select>
                    {errors.industria && <FormHelperText error>Este campo es requerido</FormHelperText>}
                  </FormControl>
                )}
              />
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
                {/* Fila para nuevo contacto */}
                <TableRow>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.nombre}
                      onChange={(e) => setNuevoContacto({...nuevoContacto, nombre: e.target.value})}
                      placeholder='Nombre'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.cargo}
                      onChange={(e) => setNuevoContacto({...nuevoContacto, cargo: e.target.value})}
                      placeholder='Cargo'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.email}
                      onChange={(e) => setNuevoContacto({...nuevoContacto, email: e.target.value})}
                      placeholder='Email'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.telefono1}
                      onChange={(e) => setNuevoContacto({...nuevoContacto, telefono1: e.target.value})}
                      placeholder='Teléfono 1'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.telefono2}
                      onChange={(e) => setNuevoContacto({...nuevoContacto, telefono2: e.target.value})}
                      placeholder='Teléfono 2'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={agregarContacto}>
                      <i className='ri-add-line' />
                    </IconButton>
                  </TableCell>
                </TableRow>

                {/* Lista de contactos agregados */}
                {contactos.map((contacto, index) => (
                  <TableRow key={index}>
                    <TableCell>{contacto.nombre}</TableCell>
                    <TableCell>{contacto.cargo}</TableCell>
                    <TableCell>{contacto.email}</TableCell>
                    <TableCell>{contacto.telefono1}</TableCell>
                    <TableCell>{contacto.telefono2}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => eliminarContacto(index)}>
                        <i className='ri-delete-bin-line' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
            <Button 
              variant='contained' 
              type='submit'
              disabled={Object.keys(errors).length > 0}
            >
              Guardar
            </Button>
            <Button 
              variant='outlined' 
              color='error' 
              onClick={handleReset}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddUserDrawer
