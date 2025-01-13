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
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-hot-toast' // Para notificaciones

// Types Imports
import type { Cliente, FormValidateType, FormNonValidateType, Contacto } from '@/types/forms/cliente'
import { initialFormData } from '@/types/forms/cliente'

// Import data
import { PAISES, REGIONES_CHILE, SEGMENTOS, INDUSTRIAS, ESTADOS_CLIENTE, VENDEDORES } from '@/data/clientData'

// Import components
import ContactSearch from '../components/ContactSearch'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: Cliente[]
  setData: (data: Cliente[] | ((prevData: Cliente[]) => Cliente[])) => void
}

const AddClienteDrawer = (props: Props) => {
  // Props
  const { open, handleClose, userData, setData } = props

  // States
  const [formData, setFormData] = useState<FormNonValidateType>(initialFormData)
  const [contactos, setContactos] = useState<Array<{ contacto: Contacto; isPrincipal: boolean }>>([])

  const [nuevoContacto, setNuevoContacto] = useState<Contacto>({
    nombre: '',
    cargo: '',
    email: '',
    telefono1: '',
    telefono2: ''
  })

  const [selectedRegion, setSelectedRegion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchContactValue, setSearchContactValue] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [comunas, setComunas] = useState<any[]>([])
  const [regiones, setRegiones] = useState<any[]>([])

  // Al inicio del componente, definir defaultValues
  const defaultValues: FormValidateType = {
    rut: '',
    estado: 'active', // Valor por defecto
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
    condicionVenta: '',
    observaciones: ''
  }

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<FormValidateType>({
    defaultValues,
    mode: 'onChange'
  })

  // Obtener la fecha actual en formato YYYY-MM-DD
  const fechaActual = new Date().toISOString().split('T')[0]

  // Función para crear cliente
  const crearCliente = async (data: FormValidateType) => {
    try {
      setIsSubmitting(true)

      const clienteData = {
        rut: data.rut,
        estado: data.estado,
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
        clientesContactos: {
          create: contactos.map(contacto => ({
            contacto: {
              create: {
                nombre: contacto.contacto.nombre,
                cargo: contacto.contacto.cargo,
                email: contacto.contacto.email,
                telefono1: contacto.contacto.telefono1,
                telefono2: contacto.contacto.telefono2
              }
            },
            isPrincipal: false
          }))
        },
        condicionesComerciales: {
          create: {
            vendedor: data.vendedor,
            condicionVenta: data.condicionVenta,
            observaciones: data.observaciones
          }
        }
      }

      console.log('Datos a crear:', clienteData)
      const response = await axios.post('/api/clientes', clienteData)

      console.log('Respuesta:', response.data)

      if (response.status === 201) {
        toast.success('Cliente creado exitosamente')
        handleClose()
        resetForm()
        setContactos([])

        if (props.setData) {
          props.setData((prevData: Cliente[]): Cliente[] => [...prevData, response.data])
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear el cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Actualizar onSubmit para usar la nueva función
  const onSubmit = (data: FormValidateType) => {
    crearCliente(data)
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialFormData)
  }

  const agregarContacto = () => {
    setContactos([...contactos, { contacto: nuevoContacto, isPrincipal: contactos.length === 0 }])
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

  // Función para buscar contactos
  const searchContacts = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])

      return
    }

    setIsSearching(true)

    try {
      const response = await axios.get(`/api/contactos/search`, {
        params: { q: query }
      })

      const data = response.data

      console.log('Resultados de búsqueda:', data)
      setSearchResults(data)
    } catch (error) {
      console.error('Error buscando contactos:', error)
      toast.error('Error al buscar contactos')
    } finally {
      setIsSearching(false)
    }
  }

  // Manejar cambios en la búsqueda con debounce
  const handleSearchChange = (value: string) => {
    setSearchContactValue(value)
    console.log('Valor de búsqueda:', value)

    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      searchContacts(value)
    }, 500)

    setSearchTimeout(timeout)
  }

  // Agregar contacto desde los resultados de búsqueda
  const handleAddContact = (contact: Contacto) => {
    const newContact: { contacto: Contacto; isPrincipal: boolean } = {
      contacto: contact,
      isPrincipal: contactos.length === 0
    }

    setContactos([...contactos, newContact])
    setSearchContactValue('')
    setSearchResults([])
  }

  // Datos de prueba
  const datosEjemplo: FormValidateType = {
    rut: '76.543.210-9',
    estado: 'active',
    razonSocial: 'Empresa de Prueba S.A.',
    nombreCliente: 'Empresa de Prueba',
    ciudad: 'Santiago',
    comuna: 'Las Condes',
    direccion: 'Av. Apoquindo 4800, Of. 1501',
    telefono: '+56 2 2345 6789',
    sitioWeb: 'www.empresaprueba.cl',
    segmento: 'corporativo',
    industria: 'construccion',
    vendedor: 'vendedor1',
    condicionVenta: '30 días',
    observaciones: 'Cliente de prueba para testing'
  }

  const cargarDatosPrueba = () => {
    // Cargar datos principales
    Object.keys(datosEjemplo).forEach(key => {
      setValue(key as keyof FormValidateType, datosEjemplo[key])
    })

    // Cargar datos no controlados por react-hook-form
    setFormData({
      ...formData,
      pais: 'CL',
      region: 'Metropolitana'
    })
    setSelectedRegion('Metropolitana')

    // Cargar contactos
    setContactos(contactosEjemplo)

    toast.success('Datos de prueba cargados')
  }

  // Contactos de prueba
  const contactosEjemplo = [
    {
      contacto: {
        nombre: 'Juan Pérez',
        cargo: 'Gerente General',
        email: 'jperez@empresaprueba.cl',
        telefono1: '+56 9 8765 4321',
        telefono2: ''
      },
      isPrincipal: true
    },
    {
      contacto: {
        nombre: 'María González',
        cargo: 'Jefe de Compras',
        email: 'mgonzalez@empresaprueba.cl',
        telefono1: '+56 9 8765 4322',
        telefono2: ''
      },
      isPrincipal: false
    }
  ]

  // Cargar regiones al montar el componente
  useEffect(() => {
    const fetchRegiones = async () => {
      try {
        const response = await axios.get('/api/ubicacion')

        console.log('Regiones cargadas:', response.data)
        setRegiones(response.data)
      } catch (error) {
        console.error('Error al cargar regiones:', error)
        toast.error('Error al cargar regiones')
      }
    }

    fetchRegiones()
  }, [])

  // Modificar handleRegionChange
  const handleRegionChange = async (value: string) => {
    setSelectedRegion(value)
    setFormData({ ...formData, region: value })
    setValue('comuna', '')

    if (value) {
      try {
        const response = await axios.get('/api/ubicacion', {
          params: { regionId: value }
        })

        console.log('Comunas recibidas:', response.data)

        if (Array.isArray(response.data)) {
          setComunas(response.data)
        }
      } catch (error) {
        console.error('Error al cargar comunas:', error)
        toast.error('Error al cargar comunas')
        setComunas([])
      }
    } else {
      setComunas([])
    }
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
        <Typography variant='h5' className='text-xl'>
          Añadir Nuevo Cliente
        </Typography>
        <div className='flex gap-2'>
          <Button
            variant='outlined'
            color='primary'
            onClick={cargarDatosPrueba}
            startIcon={<i className='ri-database-2-line' />}
          >
            Cargar Datos de Prueba
          </Button>
          <IconButton size='small' onClick={handleReset}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
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
                      readOnly: true // Hace el campo de solo lectura
                    }}
                    value={fechaActual} // Fuerza el valor a la fecha actual
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='estado-label'>Estado</InputLabel>
                <Controller
                  name='estado'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='estado-label'
                      label='Estado'
                      value={field.value ?? 'active'}
                      onChange={field.onChange}
                      error={Boolean(errors.estado)}
                    >
                      {ESTADOS_CLIENTE.map(estado => (
                        <MenuItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
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
                  value={formData.pais}
                  onChange={e => setFormData({ ...formData, pais: e.target.value })}
                  label='País'
                  labelId='country'
                >
                  {PAISES.map(pais => (
                    <MenuItem key={pais.value} value={pais.value}>
                      {pais.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Región</InputLabel>
                <Select value={selectedRegion} onChange={e => handleRegionChange(e.target.value)} label='Región'>
                  <MenuItem value=''>Seleccionar Región</MenuItem>
                  {regiones.map(region => (
                    <MenuItem key={region.id} value={region.id.toString()}>
                      {region.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='comuna'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Comuna</InputLabel>
                    <Select {...field} label='Comuna' error={Boolean(errors.comuna)} disabled={!selectedRegion}>
                      <MenuItem value=''>Seleccionar Comuna</MenuItem>
                      {Array.isArray(comunas) && comunas.length > 0 ? (
                        comunas.map(comuna => (
                          <MenuItem key={comuna.id} value={comuna.id.toString()}>
                            {comuna.nombre}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No hay comunas disponibles</MenuItem>
                      )}
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
              <FormControl fullWidth>
                <InputLabel id='segmento-label'>Segmento</InputLabel>
                <Controller
                  name='segmento'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='segmento-label'
                      label='Segmento'
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      error={Boolean(errors.segmento)}
                    >
                      {SEGMENTOS.map(segmento => (
                        <MenuItem key={segmento.value} value={segmento.value}>
                          {segmento.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='industria-label'>Industria</InputLabel>
                <Controller
                  name='industria'
                  control={control}
                  render={({ field }) => (
                    <Select
                      labelId='industria-label'
                      label='Industria'
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      error={Boolean(errors.industria)}
                    >
                      {INDUSTRIAS.map(industria => (
                        <MenuItem key={industria.value} value={industria.value}>
                          {industria.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>

          {/* Sección de Contactos */}
          <Divider sx={{ my: 4 }} />
          <Grid container alignItems='center' spacing={2}>
            <Grid item xs={6}>
              <Typography variant='h5'>Contactos</Typography>
            </Grid>
            <Grid item xs={6}>
              <ContactSearch
                onContactSelect={contact => {
                  const newContact = {
                    contacto: contact,
                    isPrincipal: contactos.length === 0
                  }

                  setContactos([...contactos, newContact])
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
                      onChange={e => setNuevoContacto({ ...nuevoContacto, nombre: e.target.value })}
                      placeholder='Nombre'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.cargo}
                      onChange={e => setNuevoContacto({ ...nuevoContacto, cargo: e.target.value })}
                      placeholder='Cargo'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.email}
                      onChange={e => setNuevoContacto({ ...nuevoContacto, email: e.target.value })}
                      placeholder='Email'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.telefono1}
                      onChange={e => setNuevoContacto({ ...nuevoContacto, telefono1: e.target.value })}
                      placeholder='Teléfono 1'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.telefono2}
                      onChange={e => setNuevoContacto({ ...nuevoContacto, telefono2: e.target.value })}
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
                    <TableCell>{contacto.contacto.nombre}</TableCell>
                    <TableCell>
                      <TextField
                        value={contacto.contacto.cargo}
                        onChange={e => {
                          const updatedContactos = contactos.map((c, i) =>
                            i === index ? { ...c, contacto: { ...c.contacto, cargo: e.target.value } } : c
                          )

                          setContactos(updatedContactos)
                        }}
                        placeholder='Cargo'
                        fullWidth
                        size='small'
                      />
                    </TableCell>
                    <TableCell>{contacto.contacto.email}</TableCell>
                    <TableCell>{contacto.contacto.telefono1}</TableCell>
                    <TableCell>{contacto.contacto.telefono2}</TableCell>
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
              <Controller
                name='vendedor'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Vendedor</InputLabel>
                    <Select {...field} error={Boolean(errors.vendedor)}>
                      {VENDEDORES.map(vendedor => (
                        <MenuItem key={vendedor.value} value={vendedor.value}>
                          {vendedor.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='condicionVenta'
                control={control}
                rules={{ required: true }}
                render={({ field }) => <TextField {...field} fullWidth label='Condiciones de Venta' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='observaciones'
                control={control}
                rules={{ required: true }}
                render={({ field }) => <TextField {...field} fullWidth label='Observaciones' />}
              />
            </Grid>
          </Grid>

          <div className='flex items-center gap-4 mt-5'>
            <Button
              variant='contained'
              type='submit'
              disabled={Object.keys(errors).length > 0 || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color='inherit' /> : null}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant='outlined' color='error' disabled={isSubmitting} onClick={handleReset}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddClienteDrawer
