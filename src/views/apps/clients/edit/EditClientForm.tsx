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

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'

// Types Imports
import type { Cliente, FormValidateType, FormNonValidateType, Contacto } from '@/types/forms/cliente'
import { initialFormData } from '@/types/forms/cliente'

// Data Imports
import { PAISES, REGIONES_CHILE, SEGMENTOS, INDUSTRIAS, ESTADOS_CLIENTE, VENDEDORES } from '@/data/clientData'

// Components Imports
import ContactSearch from '../components/ContactSearch'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: Cliente[]
  setData: (data: Cliente[] | ((prevData: Cliente[]) => Cliente[])) => void
  currentUser: Cliente
}

const defaultValues: FormValidateType = {
  rut: '',
  estado: 'active',
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

const EditClientForm = ({ open, handleClose, userData, setData, currentUser }: Props): JSX.Element => {
  console.log('EditClientForm Props:', { open, currentUser, userData })

  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues,
    mode: 'onChange'
  })

  console.log('Form defaultValues:', {
    rut: currentUser?.rut,
    razonSocial: currentUser?.razonSocial,
    segmento: currentUser?.segmento
  })

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

  useEffect(() => {
    if (currentUser) {
      const formValues = {
        rut: currentUser.rut || '',
        estado: currentUser.estado || 'active',
        razonSocial: currentUser.razonSocial || '',
        nombreCliente: currentUser.nombreCliente || '',
        ciudad: currentUser.ciudad || '',
        comuna: currentUser.comuna || '',
        direccion: currentUser.direccion || '',
        telefono: currentUser.telefono || '',
        sitioWeb: currentUser.sitioWeb || '',
        segmento: currentUser.segmento || '',
        industria: currentUser.industria || '',
        vendedor: currentUser.condicionesComerciales?.vendedor || '',
        condicionVenta: currentUser.condicionesComerciales?.condicionVenta || '',
        observaciones: currentUser.condicionesComerciales?.observaciones || ''
      }

      console.log('Resetting form with values:', formValues)
      resetForm(formValues)

      // Inicializar formData
      setFormData({
        region: currentUser.region || '',
        city: currentUser.ciudad || '',
        commune: currentUser.comuna || '',
        address: currentUser.direccion || '',
        phone: currentUser.telefono || '',
        website: currentUser.sitioWeb || '',
        segment: currentUser.segmento || '',
        industry: currentUser.industria || '',
        pais: currentUser.pais || '',
        vendedor: currentUser.condicionesComerciales?.vendedor || '',
        condicionVenta: currentUser.condicionesComerciales?.condicionVenta || '',
        observaciones: currentUser.condicionesComerciales?.observaciones || ''
      })

      if (currentUser.clientesContactos) {
        const contactosExistentes = currentUser.clientesContactos?.map(cc => ({
          contacto: {
            contactId: cc.contacto?.contactId || undefined,
            nombre: cc.contacto?.nombre || '',
            cargo: cc.contacto?.cargo || '',
            email: cc.contacto?.email || '',
            telefono1: cc.contacto?.telefono1 || '',
            telefono2: cc.contacto?.telefono2 || ''
          },
          isPrincipal: cc.isPrincipal || false
        }))

        setContactos(contactosExistentes)
      }

      setSelectedRegion(currentUser.region || '')
    }
  }, [currentUser, resetForm])

  const onSubmit = async (data: FormValidateType) => {
    try {
      setIsSubmitting(true)

      const dataToSend = {
        ...data,
        clientesContactos: contactos.map(c => ({
          contacto: {
            ...(c.contacto.contactId && { contactId: Number(c.contacto.contactId) }),
            nombre: c.contacto.nombre,
            cargo: c.contacto.cargo,
            email: c.contacto.email,
            telefono1: c.contacto.telefono1,
            telefono2: c.contacto.telefono2
          },
          isPrincipal: c.isPrincipal
        })),
        vendedor: formData.vendedor,
        condicionVenta: formData.condicionVenta,
        observaciones: formData.observaciones
      }

      // Primero crear/actualizar los contactos
      const updatedContactos = await Promise.all(
        contactos.map(async c => {
          if (c.contacto.contactId) {
            // Actualizar contacto existente
            const response = await fetch(`/api/contactos/${c.contacto.contactId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...c.contacto,
                contactId: parseInt(String(c.contacto.contactId))
              })
            })

            if (!response.ok) {
              const errorData = await response.json()

              console.error('Error updating contact:', errorData)
              throw new Error('Error actualizando contacto existente')
            }

            return response.json()
          } else {
            // Crear nuevo contacto
            delete c.contacto.contactId // Eliminar el contactId para nuevos contactos

            const response = await fetch('/api/contactos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(c.contacto)
            })

            if (!response.ok) {
              const errorData = await response.json()

              console.error('Error creating contact:', errorData)
              throw new Error('Error creando nuevo contacto')
            }

            return response.json()
          }
        })
      )

      // Luego actualizar el cliente con los contactos actualizados
      const response = await fetch(`/api/clientes/${currentUser.clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clienteId: currentUser.clienteId,
          ...dataToSend,
          clientesContactos: updatedContactos.map((contacto, index) => ({
            contacto: {
              contactId: parseInt(String(contacto.contactId)),
              nombre: contacto.nombre,
              cargo: contacto.cargo,
              email: contacto.email,
              telefono1: contacto.telefono1,
              telefono2: contacto.telefono2
            },
            isPrincipal: contactos[index].isPrincipal
          }))
        })
      })

      if (response.ok) {
        const updatedClient = await response.json()

        console.log('Updated Client:', updatedClient)

        setData((prevData: Cliente[]) => {
          const newData: Cliente[] = prevData.map(client =>
            client.clienteId === currentUser.clienteId ? updatedClient : client
          )

          return newData
        })
        toast.success('Cliente actualizado exitosamente')
        handleClose()
      }
    } catch (error) {
      console.error('Error in onSubmit:', error)
      toast.error('Error al actualizar cliente')
    } finally {
      setIsSubmitting(false)
    }
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

  const marcarContactoPrincipal = (index: number) => {
    setContactos(
      contactos.map((c, i) => ({
        ...c,
        isPrincipal: i === index
      }))
    )
  }

  const handleContactSelect = (contact: Contacto) => {
    setContactos([
      ...contactos,
      {
        contacto: {
          contactId: contact.contactId || undefined,
          nombre: contact.nombre,
          cargo: contact.cargo,
          email: contact.email,
          telefono1: contact.telefono1,
          telefono2: contact.telefono2
        },
        isPrincipal: contactos.length === 0
      }
    ])
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
          Editar Cliente
        </Typography>
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
                    {...(errors.rut && { error: true, helperText: 'Este campo es requerido' })}
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
                  defaultValue='active'
                  render={({ field }) => (
                    <Select labelId='estado-label' label='Estado' {...field} error={Boolean(errors.estado)}>
                      {ESTADOS_CLIENTE.map(estado => (
                        <MenuItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.estado && <FormHelperText error>Este campo es requerido</FormHelperText>}
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
                    {...(errors.rut && { error: true, helperText: 'Este campo es requerido' })}
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
                    {...(errors.razonSocial && { error: true, helperText: 'Este campo es requerido' })}
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
                    {...(errors.nombreCliente && { error: true, helperText: 'Este campo es requerido' })}
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
                <InputLabel>País</InputLabel>
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
                <Select
                  value={formData.region}
                  onChange={e => {
                    setSelectedRegion(e.target.value)
                    setFormData({ ...formData, region: e.target.value })
                  }}
                  label='Región'
                >
                  {Object.keys(REGIONES_CHILE).map(region => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Ciudad</InputLabel>
                <Select
                  value={formData.city}
                  onChange={e => {
                    setFormData({ ...formData, city: e.target.value })
                  }}
                  label='Ciudad'
                  disabled={!selectedRegion}
                >
                  {selectedRegion &&
                    REGIONES_CHILE[selectedRegion as keyof typeof REGIONES_CHILE].ciudades.map(ciudad => (
                      <MenuItem key={ciudad} value={ciudad}>
                        {ciudad}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Comuna</InputLabel>
                <Select
                  value={formData.commune}
                  onChange={e => setFormData({ ...formData, commune: e.target.value })}
                  label='Comuna'
                  disabled={!selectedRegion}
                >
                  {selectedRegion &&
                    REGIONES_CHILE[selectedRegion as keyof typeof REGIONES_CHILE].comunas.map(comuna => (
                      <MenuItem key={comuna} value={comuna}>
                        {comuna}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
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
                    {...(errors.direccion && { error: true, helperText: 'Este campo es requerido' })}
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
                    {...(errors.telefono && { error: true, helperText: 'Este campo es requerido' })}
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
                    {...(errors.sitioWeb && { error: true, helperText: 'Este campo es requerido' })}
                  />
                )}
              />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Segmento</InputLabel>
                <Controller
                  name='segmento'
                  control={control}
                  render={({ field }) => (
                    <Select label='Segmento' {...field} error={Boolean(errors.segmento)}>
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
                <InputLabel>Industria</InputLabel>
                <Controller
                  name='industria'
                  control={control}
                  rules={{ required: true }}
                  defaultValue={currentUser?.industria || ''}
                  render={({ field }) => (
                    <Select {...field} error={Boolean(errors.industria)}>
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
              <Typography
                variant='h5'
                sx={{
                  textAlign: 'left'
                }}
              >
                Contactos
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <ContactSearch onContactSelect={handleContactSelect} />
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

                {contactos.map((contacto, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        value={contacto.contacto.nombre}
                        onChange={e => {
                          const updatedContactos = [...contactos]

                          updatedContactos[index] = {
                            ...contacto,
                            contacto: {
                              ...contacto.contacto,
                              nombre: e.target.value
                            }
                          }
                          setContactos(updatedContactos)
                        }}
                        placeholder='Nombre'
                        fullWidth
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={contacto.contacto.cargo}
                        onChange={e => {
                          const updatedContactos = [...contactos]

                          updatedContactos[index] = {
                            ...contacto,
                            contacto: {
                              ...contacto.contacto,
                              cargo: e.target.value
                            }
                          }
                          setContactos(updatedContactos)
                        }}
                        placeholder='Cargo'
                        fullWidth
                        size='small'
                      />
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
                        value={contacto.contacto.email}
                        onChange={e => {
                          const updatedContactos = [...contactos]

                          updatedContactos[index] = {
                            ...contacto,
                            contacto: {
                              ...contacto.contacto,
                              email: e.target.value
                            }
                          }
                          setContactos(updatedContactos)
                        }}
                      />
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
                        value={contacto.contacto.telefono1}
                        onChange={e => {
                          const updatedContactos = [...contactos]

                          updatedContactos[index] = {
                            ...contacto,
                            contacto: {
                              ...contacto.contacto,
                              telefono1: e.target.value
                            }
                          }
                          setContactos(updatedContactos)
                        }}
                      />
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
                        value={contacto.contacto.telefono2}
                        onChange={e => {
                          const updatedContactos = [...contactos]

                          updatedContactos[index] = {
                            ...contacto,
                            contacto: {
                              ...contacto.contacto,
                              telefono2: e.target.value
                            }
                          }
                          setContactos(updatedContactos)
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <IconButton size='small' onClick={() => marcarContactoPrincipal(index)}>
                        <i className={`ri-star-${contacto.isPrincipal ? 'fill' : 'line'}`} />
                      </IconButton>
                      <IconButton size='small' onClick={() => eliminarContacto(index)}>
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
                <Select
                  value={formData.vendedor}
                  onChange={e => setFormData({ ...formData, vendedor: e.target.value })}
                >
                  {VENDEDORES.map(vendedor => (
                    <MenuItem key={vendedor.value} value={vendedor.value}>
                      {vendedor.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Condiciones de Venta'
                value={formData.condicionVenta}
                onChange={e => setFormData({ ...formData, condicionVenta: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label='Observaciones'
                value={formData.observaciones}
                onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
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

export default EditClientForm
