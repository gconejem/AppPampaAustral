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
import Box from '@mui/material/Box'
import CloseIcon from '@mui/icons-material/Close'
import { styled } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import axios from 'axios'

// Types Imports
import type { Cliente, FormValidateType, FormNonValidateType, Contacto } from '@/types/forms/cliente'
import { initialFormData } from '@/types/forms/cliente'

// Data Imports
import { PAISES, REGIONES_CHILE, SEGMENTOS, INDUSTRIAS, ESTADOS_CLIENTE, VENDEDORES } from '@/data/clientData'

// Components Imports
import ContactSearch from '../components/ContactSearch'
import { useRegionesYComunas } from '@/hooks/useRegionesYComunas'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: Cliente[]
  setData: (data: Cliente[] | ((prevData: Cliente[]) => Cliente[])) => void
  currentUser: Cliente
}

const EditClientForm = ({ open, handleClose, userData, setData, currentUser }: Props): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { regiones, comunas, selectedRegion, setSelectedRegion } = useRegionesYComunas()

  // Inicializar el formulario con valores por defecto
  const defaultValues = {
    rut: currentUser?.rut || '',
    estado: currentUser?.estado || 'active',
    razonSocial: currentUser?.razonSocial || '',
    nombreCliente: currentUser?.nombreCliente || '',
    ciudad: currentUser?.ciudad || '',
    comuna: currentUser?.comuna || '',
    direccion: currentUser?.direccion || '',
    telefono: currentUser?.telefono || '',
    sitioWeb: currentUser?.sitioWeb || '',
    segmento: currentUser?.segmento || '',
    industria: currentUser?.industria || '',
    vendedor: currentUser?.condicionesComerciales?.vendedor || '',
    condicionVenta: currentUser?.condicionesComerciales?.condicionVenta || '',
    observaciones: currentUser?.condicionesComerciales?.observaciones || ''
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    getValues
  } = useForm({
    defaultValues,
    mode: 'onChange'
  })

  // Inicializar formData
  const [formData, setFormData] = useState({
    pais: currentUser?.pais || 'Chile'
  })

  // Al inicio del componente, después de los otros estados
  const [contactos, setContactos] = useState<Contacto[]>(
    currentUser?.clientesContactos?.map(cc => ({
      contactId: cc.contacto.contactId,
      nombre: cc.contacto.nombre,
      cargo: cc.contacto.cargo,
      email: cc.contacto.email,
      telefono1: cc.contacto.telefono1,
      telefono2: cc.contacto.telefono2 || ''
    })) || []
  )

  const [nuevoContacto, setNuevoContacto] = useState<Contacto>({
    nombre: '',
    cargo: '',
    email: '',
    telefono1: '',
    telefono2: ''
  })

  // Función para agregar contacto
  const handleAddContacto = () => {
    if (nuevoContacto.nombre && nuevoContacto.email) {
      setContactos([...contactos, nuevoContacto])
      setNuevoContacto({
        nombre: '',
        cargo: '',
        email: '',
        telefono1: '',
        telefono2: ''
      })
    }
  }

  // Función para eliminar contacto
  const handleDeleteContacto = (index: number) => {
    setContactos(contactos.filter((_, i) => i !== index))
  }

  // Efecto para establecer la región inicial
  useEffect(() => {
    if (currentUser && regiones.length > 0) {
      console.log('Current User:', currentUser)
      console.log('Regiones:', regiones)

      // Primero establecemos la región
      const regionActual = regiones.find(r => r.nombre === currentUser.region)

      console.log('Región encontrada:', regionActual)

      if (regionActual) {
        // Establecer la región seleccionada para que se carguen las comunas
        setSelectedRegion(regionActual.codigo)

        // Esperar al siguiente ciclo para asegurarnos que las comunas estén cargadas
        setTimeout(() => {
          // Encontrar la comuna por nombre
          const comunaActual = comunas.find(c => c.nombre === currentUser.comuna)

          console.log('Comuna encontrada:', comunaActual)

          // Reiniciar el formulario con los valores del cliente
          reset({
            ...defaultValues,
            ...currentUser,
            region: regionActual.codigo, // Usamos el código de la región
            comuna: comunaActual?.id.toString() || ''
          })

          // También establecemos el valor de región directamente
          setValue('region', regionActual.codigo)
        }, 100)
      }
    }
  }, [currentUser, regiones, comunas, setSelectedRegion, reset, defaultValues, setValue])

  // Manejador para cambio de región
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value)
    setValue('comuna', '') // Limpiar la comuna cuando cambia la región
  }

  // Agregar la función onSubmit
  const onSubmit = async (data: FormValidateType) => {
    setIsSubmitting(true)

    try {
      const regionSeleccionada = regiones.find(r => r.codigo === selectedRegion)
      const comunaSeleccionada = comunas.find(c => c.id === parseInt(data.comuna))

      const clienteActualizado = {
        ...data,
        clienteId: currentUser.clienteId,
        pais: formData.pais,
        region: regionSeleccionada?.nombre || '',
        comuna: comunaSeleccionada?.nombre || '',
        clientesContactos: {
          deleteMany: {},
          create: contactos.map(contacto => ({
            isPrincipal: false,
            contacto: {
              create: {
                nombre: contacto.nombre,
                cargo: contacto.cargo,
                email: contacto.email,
                telefono1: contacto.telefono1,
                telefono2: contacto.telefono2 || ''
              }
            }
          }))
        },
        condicionesComerciales: {
          upsert: {
            create: {
              vendedor: data.vendedor,
              condicionVenta: data.condicionVenta,
              observaciones: data.observaciones
            },
            update: {
              vendedor: data.vendedor,
              condicionVenta: data.condicionVenta,
              observaciones: data.observaciones
            }
          }
        }
      }

      delete clienteActualizado.fechaCreacion
      delete clienteActualizado.createdAt
      delete clienteActualizado.updatedAt

      const response = await axios.put(`/api/clientes/${currentUser.clienteId}`, clienteActualizado)

      if (response.data) {
        setData(prevData =>
          prevData.map(cliente => (cliente.clienteId === currentUser.clienteId ? response.data : cliente))
        )
        toast.success('Cliente actualizado exitosamente')
        handleClose()
      }
    } catch (error) {
      console.error('Error al actualizar cliente:', error)
      toast.error('Error al actualizar cliente')
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
        '& .MuiDrawer-paper': {
          width: {
            xs: '100%',
            sm: '100%',
            md: '100%',
            lg: '50%'
          },
          maxWidth: '1200px'
        }
      }}
    >
      <Box
        sx={{
          p: 5,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Título */}
        <Typography variant='h5' component='h1' sx={{ mb: 6 }}>
          Editar Cliente
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={5}>
            {/* Fecha de Creación y Estado */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Fecha de Creación'
                value={currentUser?.fechaCreacion ? new Date(currentUser.fechaCreacion).toLocaleDateString() : ''}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='estado'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select {...field} label='Estado' error={Boolean(errors.estado)}>
                      {ESTADOS_CLIENTE.map(estado => (
                        <MenuItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.estado && <FormHelperText error>Este campo es requerido</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>

            {/* RUT, Razón Social, Cliente y Copiar */}
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
                    error={Boolean(errors.rut)}
                    helperText={errors.rut && 'Este campo es requerido'}
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
                    error={Boolean(errors.razonSocial)}
                    helperText={errors.razonSocial && 'Este campo es requerido'}
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
                    error={Boolean(errors.nombreCliente)}
                    helperText={errors.nombreCliente && 'Este campo es requerido'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={e => {
                      if (e.target.checked) {
                        setValue('nombreCliente', getValues('razonSocial'))
                      }
                    }}
                  />
                }
                label='Copiar Razón Social'
              />
            </Grid>

            {/* País, Región y Comuna */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>País</InputLabel>
                <Select
                  value={formData.pais}
                  onChange={e => setFormData({ ...formData, pais: e.target.value })}
                  label='País'
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
                <Controller
                  name='region'
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label='Región'
                      value={field.value || ''} // Aseguramos que siempre haya un valor
                      onChange={e => {
                        field.onChange(e)
                        handleRegionChange(e.target.value)
                      }}
                    >
                      {regiones.map(region => (
                        <MenuItem key={region.codigo} value={region.codigo}>
                          {region.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Comuna</InputLabel>
                <Controller
                  name='comuna'
                  control={control}
                  defaultValue={currentUser?.comuna || ''}
                  render={({ field }) => (
                    <Select {...field} label='Comuna'>
                      {comunas.map(comuna => (
                        <MenuItem key={comuna.id} value={comuna.id.toString()}>
                          {comuna.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Dirección, Teléfono y Web */}
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
                    error={Boolean(errors.direccion)}
                    helperText={errors.direccion && 'Este campo es requerido'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='telefono'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Teléfono' />}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='sitioWeb'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Web' />}
              />
            </Grid>

            {/* Segmento e Industria */}
            <Grid item xs={12} sm={6}>
              <Controller
                name='segmento'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Segmento</InputLabel>
                    <Select {...field} label='Segmento'>
                      {SEGMENTOS.map(segmento => (
                        <MenuItem key={segmento.value} value={segmento.value}>
                          {segmento.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='industria'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Industria</InputLabel>
                    <Select {...field} label='Industria'>
                      {INDUSTRIAS.map(industria => (
                        <MenuItem key={industria.value} value={industria.value}>
                          {industria.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Sección de Contactos */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 4 }}>
                Contactos
              </Typography>
              <Box sx={{ mb: 4 }}>
                <TextField
                  fullWidth
                  placeholder='Buscar contacto existente...'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>NOMBRE</TableCell>
                      <TableCell>CARGO</TableCell>
                      <TableCell>EMAIL</TableCell>
                      <TableCell>TELÉFONO 1</TableCell>
                      <TableCell>TELÉFONO 2</TableCell>
                      <TableCell>ACCIÓN</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <TextField
                          placeholder='Nombre'
                          size='small'
                          fullWidth
                          value={nuevoContacto.nombre}
                          onChange={e => setNuevoContacto({ ...nuevoContacto, nombre: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          placeholder='Cargo'
                          size='small'
                          fullWidth
                          value={nuevoContacto.cargo}
                          onChange={e => setNuevoContacto({ ...nuevoContacto, cargo: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          placeholder='Email'
                          size='small'
                          fullWidth
                          value={nuevoContacto.email}
                          onChange={e => setNuevoContacto({ ...nuevoContacto, email: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          placeholder='Teléfono 1'
                          size='small'
                          fullWidth
                          value={nuevoContacto.telefono1}
                          onChange={e => setNuevoContacto({ ...nuevoContacto, telefono1: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          placeholder='Teléfono 2'
                          size='small'
                          fullWidth
                          value={nuevoContacto.telefono2}
                          onChange={e => setNuevoContacto({ ...nuevoContacto, telefono2: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton color='primary' onClick={handleAddContacto}>
                          <AddIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {/* Contactos existentes */}
                    {contactos.map((contacto, index) => (
                      <TableRow key={contacto.contactId || index}>
                        <TableCell>{contacto.nombre}</TableCell>
                        <TableCell>{contacto.cargo}</TableCell>
                        <TableCell>{contacto.email}</TableCell>
                        <TableCell>{contacto.telefono1}</TableCell>
                        <TableCell>{contacto.telefono2}</TableCell>
                        <TableCell>
                          <IconButton color='error' onClick={() => handleDeleteContacto(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Condiciones Comerciales */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 4 }}>
                Condiciones Comerciales
              </Typography>
            </Grid>
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
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Condiciones de Venta'
                    error={Boolean(errors.condicionVenta)}
                    helperText={errors.condicionVenta && 'Este campo es requerido'}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='observaciones'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Observaciones' />}
              />
            </Grid>

            {/* Botones */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button variant='outlined' color='secondary' onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  variant='contained'
                  type='submit'
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Drawer>
  )
}

export default EditClientForm
