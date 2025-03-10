// React Imports
import { useState, useEffect, useCallback, useMemo } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import type { SelectChangeEvent } from '@mui/material/Select'
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
import EditIcon from '@mui/icons-material/Edit'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import axios from 'axios'

// Types Imports
import type { Cliente, FormValidateType, FormNonValidateType, Contacto } from '@/types/forms/cliente'
import { initialFormData } from '@/types/forms/cliente'

// Data Imports
import { PAISES, REGIONES_CHILE, SEGMENTOS, ESTADOS_CLIENTE, VENDEDORES } from '@/data/clientData'

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
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)
  const [editingContact, setEditingContact] = useState<Contacto | null>(null)

  const [contacts, setContacts] = useState<Contacto[]>(() => {
    if (currentUser.clientesContactos && currentUser.clientesContactos.length > 0) {
      return currentUser.clientesContactos.map(cc => ({
        nombre: cc.contacto?.nombre || '',
        cargo: cc.contacto?.cargo || '',
        email: cc.contacto?.email || '',
        telefono1: cc.contacto?.telefono1 || '',
        telefono2: cc.contacto?.telefono2 || '',
        isPrincipal: cc.isPrincipal || false
      }))
    }

    return []
  })

  const [searchValue, setSearchValue] = useState<string>('')

  const { regiones, comunas, selectedRegion, setSelectedRegion, selectedComuna, setSelectedComuna } =
    useRegionesYComunas()

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      fechaCreacion: '',
      estado: 'active',
      rut: '',
      razonSocial: '',
      nombreCliente: '',
      pais: 'Chile',
      region: '',
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
  })

  // Efecto para cargar los datos iniciales
  useEffect(() => {
    if (currentUser && open) {
      console.log('Current user data:', currentUser)

      // Obtener la primera condición comercial si existe
      const condicionComercial = Array.isArray(currentUser.condicionesComerciales)
        ? currentUser.condicionesComerciales[0]
        : currentUser.condicionesComerciales

      console.log('Condición comercial:', condicionComercial) // Debug

      reset({
        fechaCreacion: new Date(currentUser.fechaCreacion).toISOString().split('T')[0],
        estado: currentUser.estado,
        rut: currentUser.rut,
        razonSocial: currentUser.razonSocial,
        nombreCliente: currentUser.nombreCliente || '',
        pais: currentUser.pais || 'Chile',
        region: currentUser.region,
        comuna: currentUser.comuna?.toString() || '',
        direccion: currentUser.direccion || '',
        telefono: currentUser.telefono || '',
        sitioWeb: currentUser.sitioWeb || '',
        segmento: currentUser.segmento || '',
        industria: currentUser.industria || '',
        vendedor: condicionComercial?.vendedor || '',
        condicionVenta: condicionComercial?.condicionVenta || '',
        observaciones: condicionComercial?.observaciones || ''
      })
      setSelectedRegion(currentUser.region)
      setSelectedComuna(currentUser.comuna?.toString() || '')

      console.log('Current user contacts:', currentUser.clientesContactos) // Debug

      if (currentUser.clientesContactos && currentUser.clientesContactos.length > 0) {
        const mappedContacts = currentUser.clientesContactos.map(cc => ({
          nombre: cc.contacto?.nombre || '',
          cargo: cc.contacto?.cargo || '',
          email: cc.contacto?.email || '',
          telefono1: cc.contacto?.telefono1 || '',
          telefono2: cc.contacto?.telefono2 || '',
          isPrincipal: cc.isPrincipal || false
        }))

        setContacts(mappedContacts)
      }

      console.log('Condiciones comerciales:', currentUser.condicionesComerciales) // Debug
    }
  }, [currentUser, open, reset, setSelectedRegion, setSelectedComuna])

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)

      // Preparar los datos para la actualización
      const updateData = {
        ...data,
        condicionesComerciales: Array.isArray(currentUser.condicionesComerciales)
          ? [
              {
                id: currentUser.condicionesComerciales[0]?.id,
                vendedor: data.vendedor,
                condicionVenta: data.condicionVenta,
                observaciones: data.observaciones,
                clienteId: currentUser.clienteId
              }
            ]
          : {
              vendedor: data.vendedor,
              condicionVenta: data.condicionVenta,
              observaciones: data.observaciones,
              clienteId: currentUser.clienteId
            }
      }

      const response = await axios.patch(`/api/clientes/${currentUser.clienteId}`, updateData)

      if (response.status === 200) {
        setData((prevData: Cliente[]) =>
          prevData.map(cliente =>
            cliente.clienteId === currentUser.clienteId ? { ...cliente, ...updateData } : cliente
          )
        )

        toast.success('Cliente actualizado exitosamente')
        handleClose()
      }
    } catch (error) {
      console.error('Error al actualizar:', error)
      toast.error('Error al actualizar el cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditContact = (contact: Contacto, index: number) => {
    setEditingContactIndex(index)
    setEditingContact(contact)
  }

  const handleSaveEdit = (index: number) => {
    if (editingContact) {
      const newContacts = [...contacts]

      newContacts[index] = editingContact
      setContacts(newContacts)
      setEditingContactIndex(null)
      setEditingContact(null)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: ['100%', '100%', 1800], // Responsive: móvil -> tablet -> desktop (1800px)
          maxWidth: '100%'
        }
      }}
    >
      <Box sx={{ p: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
          <Typography variant='h5'>Editar Cliente</Typography>
          <IconButton onClick={handleClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Controller
                name='fechaCreacion'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Fecha de Creación' disabled />}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name='estado'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Estado</InputLabel>
                    <Select {...field} label='Estado'>
                      <MenuItem value='active'>Activo</MenuItem>
                      <MenuItem value='inactive'>Inactivo</MenuItem>
                      <MenuItem value='blocked'>Bloqueado</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='rut'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='RUT' placeholder='Ej: 12.345.678-9' />}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='razonSocial'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Razón Social' placeholder='Razón Social' />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='nombreCliente'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Cliente' placeholder='Nombre del Cliente' />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='pais'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>País</InputLabel>
                    <Select {...field} label='País'>
                      <MenuItem value='Chile'>Chile</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='region'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Región</InputLabel>
                    <Select
                      {...field}
                      label='Región'
                      onChange={e => {
                        field.onChange(e)
                        setSelectedRegion(e.target.value)
                      }}
                    >
                      {regiones.map(region => (
                        <MenuItem key={region.id} value={region.nombre}>
                          {region.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='comuna'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Comuna</InputLabel>
                    <Select
                      {...field}
                      label='Comuna'
                      disabled={!selectedRegion}
                      onChange={e => {
                        field.onChange(e)
                        setSelectedComuna(e.target.value)
                      }}
                    >
                      {comunas.map(comuna => (
                        <MenuItem key={comuna.id} value={comuna.nombre}>
                          {comuna.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='direccion'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Dirección' placeholder='Ingrese la dirección' />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='telefono'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Teléfono' placeholder='Ej: +56 9 1234 5678' />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='sitioWeb'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Sitio Web' placeholder='Ej: www.ejemplo.com' />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name='segmento'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Segmento</InputLabel>
                    <Select {...field} label='Segmento'>
                      <MenuItem value='Corporativo Estratégico'>Corporativo Estratégico</MenuItem>
                      <MenuItem value='Consolidado'>Consolidado</MenuItem>
                      <MenuItem value='Expansión'>Expansión</MenuItem>
                      <MenuItem value='Ocasional'>Ocasional</MenuItem>
                      <MenuItem value='Nuevo prospecto'>Nuevo prospecto</MenuItem>
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
                      <MenuItem value='Construcción y Obras Civiles'>Construcción y Obras Civiles</MenuItem>
                      <MenuItem value='Minería'>Minería</MenuItem>
                      <MenuItem value='Energía y Medio Ambiente'>Energía y Medio Ambiente</MenuItem>
                      <MenuItem value='Forestal'>Forestal</MenuItem>
                      <MenuItem value='Infraestructura Vial y Transporte'>Infraestructura Vial y Transporte</MenuItem>
                      <MenuItem value='Industria'>Industria</MenuItem>
                      <MenuItem value='Telecomunicaciones'>Telecomunicaciones</MenuItem>
                      <MenuItem value='Banca y Fianzas'>Banca y Fianzas</MenuItem>
                      <MenuItem value='Turismo y Hotelería'>Turismo y Hotelería</MenuItem>
                      <MenuItem value='Alimentación y Agroindustria'>Alimentación y Agroindustria</MenuItem>
                      <MenuItem value='Logística y Distribución'>Logística y Distribución</MenuItem>
                      <MenuItem value='Educación e Investigación'>Educación e Investigación</MenuItem>
                      <MenuItem value='Consultora y Servicios Profesionales'>
                        Consultora y Servicios Profesionales
                      </MenuItem>
                      <MenuItem value='Servicios Públicos y Gobierno'>Servicios Públicos y Gobierno</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Sección de Contactos */}
            <Grid item xs={12}>
              <Grid container spacing={2} alignItems='center' sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant='h6'>Contactos</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ContactSearch
                    value={searchValue}
                    setValue={setSearchValue}
                    contacts={contacts}
                    setContacts={setContacts}
                  />
                </Grid>
              </Grid>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>NOMBRE</TableCell>
                      <TableCell>CARGO</TableCell>
                      <TableCell>EMAIL</TableCell>
                      <TableCell>TELÉFONO 1</TableCell>
                      <TableCell>TELÉFONO 2</TableCell>
                      <TableCell>ACCIONES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contacts.map((contact, index) => (
                      <TableRow key={index}>
                        {editingContactIndex === index ? (
                          // Modo edición
                          <>
                            <TableCell>
                              <TextField
                                value={editingContact?.nombre}
                                onChange={e => setEditingContact(prev => ({ ...prev!, nombre: e.target.value }))}
                                fullWidth
                                size='small'
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={editingContact?.cargo}
                                onChange={e => setEditingContact(prev => ({ ...prev!, cargo: e.target.value }))}
                                fullWidth
                                size='small'
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={editingContact?.email}
                                onChange={e => setEditingContact(prev => ({ ...prev!, email: e.target.value }))}
                                fullWidth
                                size='small'
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={editingContact?.telefono1}
                                onChange={e => setEditingContact(prev => ({ ...prev!, telefono1: e.target.value }))}
                                fullWidth
                                size='small'
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={editingContact?.telefono2}
                                onChange={e => setEditingContact(prev => ({ ...prev!, telefono2: e.target.value }))}
                                fullWidth
                                size='small'
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size='small' onClick={() => handleSaveEdit(index)} color='primary'>
                                  <i className='ri-save-line' style={{ fontSize: '1.25rem' }} />
                                </IconButton>
                                <IconButton size='small' onClick={() => setEditingContactIndex(null)} color='error'>
                                  <i className='ri-close-line' style={{ fontSize: '1.25rem' }} />
                                </IconButton>
                                <IconButton
                                  color={editingContact?.isPrincipal ? 'warning' : 'default'}
                                  size='small'
                                  onClick={() => {
                                    if (editingContact) {
                                      setEditingContact({
                                        ...editingContact,
                                        isPrincipal: !editingContact.isPrincipal
                                      })
                                    }
                                  }}
                                >
                                  <i className={`ri-star-${editingContact?.isPrincipal ? 'fill' : 'line'}`} />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </>
                        ) : (
                          // Modo visualización
                          <>
                            <TableCell>{contact.nombre}</TableCell>
                            <TableCell>{contact.cargo}</TableCell>
                            <TableCell>{contact.email}</TableCell>
                            <TableCell>{contact.telefono1}</TableCell>
                            <TableCell>{contact.telefono2}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  size='small'
                                  onClick={() => handleEditContact(contact, index)}
                                  color='primary'
                                >
                                  <EditIcon fontSize='small' />
                                </IconButton>
                                <IconButton
                                  size='small'
                                  onClick={() => {
                                    const newContacts = contacts.filter((_, i) => i !== index)

                                    setContacts(newContacts)
                                  }}
                                >
                                  <DeleteIcon fontSize='small' />
                                </IconButton>
                                <IconButton
                                  color={contact.isPrincipal ? 'warning' : 'default'}
                                  size='small'
                                  onClick={() => {
                                    const updatedContacts = contacts.map((c, i) => ({
                                      ...c,
                                      isPrincipal: i === index ? !c.isPrincipal : false
                                    }))

                                    setContacts(updatedContacts)
                                  }}
                                >
                                  <i className={`ri-star-${contact.isPrincipal ? 'fill' : 'line'}`} />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Sección de Condiciones Comerciales */}
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 4 }}>
                Condiciones Comerciales
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='vendedor'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id='vendedor-label'>Vendedor</InputLabel>
                    <Select {...field} labelId='vendedor-label' label='Vendedor' value={field.value || ''}>
                      <MenuItem value=''>Seleccione un vendedor</MenuItem>
                      <MenuItem value='Juan Pérez'>Juan Pérez</MenuItem>
                      <MenuItem value='María González'>María González</MenuItem>
                      <MenuItem value='Pedro Soto'>Pedro Soto</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='condicionVenta'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id='condicion-venta-label'>Condición de Venta</InputLabel>
                    <Select
                      {...field}
                      labelId='condicion-venta-label'
                      label='Condición de Venta'
                      value={field.value || ''}
                    >
                      <MenuItem value=''>Seleccione una condición</MenuItem>
                      <MenuItem value='Contado'>Contado</MenuItem>
                      <MenuItem value='Crédito 30 días'>Crédito 30 días</MenuItem>
                      <MenuItem value='Crédito 60 días'>Crédito 60 días</MenuItem>
                      <MenuItem value='Crédito 90 días'>Crédito 90 días</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='observaciones'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label='Observaciones'
                    placeholder='Ingrese observaciones adicionales'
                  />
                )}
              />
            </Grid>

            {/* Botones de acción */}
            <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
              <Button type='submit' variant='contained' disabled={isSubmitting} sx={{ flex: '1', maxWidth: 150 }}>
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant='outlined' onClick={handleClose} sx={{ flex: '1', maxWidth: 150 }}>
                Cancelar
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Drawer>
  )
}

export default EditClientForm
