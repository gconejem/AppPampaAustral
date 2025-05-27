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
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Box from '@mui/material/Box'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import axios from 'axios'

// Types Imports
import type { Cliente, Contacto } from '@/types/forms/cliente'
import type { FormValidateType } from '@/types/forms/cliente'
import type { ContactType } from '@/types/apps/contactTypes'

// Components Imports
import ContactSearch from '../components/ContactSearch'
import { useUbicacion } from '@/hooks/useUbicacion'
import AddContact from '@/views/apps/contacts/list/AddContact'

// Import data
import { VENDEDORES } from '@/data/clientData'

type Props = {
  open: boolean
  handleClose: () => void
  setData: (data: Cliente[] | ((prevData: Cliente[]) => Cliente[])) => void
  currentUser: Cliente
}

// Definir los roles legibles
const ROLES_CONTACTO = [
  { value: 'encargado_obra', label: 'Encargado de Obra' },
    { value: 'dueno', label: 'Dueño' },
    { value: 'representante', label: 'Representante' },
    { value: 'jefe_obra_planta', label: 'Jefe de Obra / Planta' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'administrador_obra', label: 'Administrador de Obra' },
    { value: 'encargado_calidad', label: 'Encargado de Calidad' },
    { value: 'autocontrol', label: 'Autocontrol' },
    { value: 'profesional', label: 'Profesional' },
    { value: 'laboratorista', label: 'Laboratorista' },
    { value: 'ejecutivo_comercial', label: 'Ejecutivo Comercial y Administración' },
    { value: 'otro', label: 'Otro (Especificar)' }
]

const getCargoLabel = (value: string) => {
  return ROLES_CONTACTO.find(r => r.value === value)?.label || value
}

// Función para formatear el RUT mientras se escribe (igual que en AddClient)
const formatRut = (value: string) => {
  try {
    let cleaned = value.replace(/[^0-9kK-]/g, '')
    if (!cleaned) return ''
    if (cleaned.length <= 8) return cleaned
    if (cleaned.includes('-')) {
      const parts = cleaned.split('-')
      cleaned = parts[0] + (parts[1] ? parts[1].charAt(0) : '')
    }
    const body = cleaned.slice(0, -1)
    const dv = cleaned.slice(-1)
    const reversedBody = body.split('').reverse().join('')
    const chunks = reversedBody.match(/.{1,3}/g) || []
    const formattedBody = chunks.join('.').split('').reverse().join('')
    const digitoVerificador = dv.toUpperCase() === 'K' ? 'K' : dv
    return formattedBody + '-' + digitoVerificador
  } catch (error) {
    console.error('Error formateando RUT:', error)
    return value
  }
}

// Agregar función de validación para múltiples emails
const validateMultipleEmails = (value?: string) => {
  if (!value) return true
  const emails = value.split(',').map(email => email.trim()).filter(email => email.length > 0)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emails.every(email => emailRegex.test(email))
}

const EditClientForm = ({ open, handleClose, setData, currentUser }: Props): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)
  const [editingContact, setEditingContact] = useState<Contacto | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedComuna, setSelectedComuna] = useState<string>('')
  const [addContactOpen, setAddContactOpen] = useState(false)
  const [refreshContactSearch, setRefreshContactSearch] = useState(0)

  const { regiones, getComunasByRegionNombre } = useUbicacion()

  const [contacts, setContacts] = useState<Contacto[]>(() => {
    if (currentUser.clientesContactos && currentUser.clientesContactos.length > 0) {
      return currentUser.clientesContactos.map(cc => ({
        contactId: cc.contacto?.contactId,
        nombre: cc.nombre || cc.contacto?.nombre || '',
        cargo: cc.cargo || '',
        email: cc.email || cc.contacto?.email || '',
        telefono1: cc.telefono1 || cc.contacto?.telefono1 || '',
        telefono2: cc.telefono2 || cc.contacto?.telefono2 || '',
        isPrincipal: cc.isPrincipal || false
      }))
    }

    return []
  })

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValidateType>({
    defaultValues: {
      fechaCreacion: '',
      rut: '',
      estado: 'active',
      razonSocial: '',
      nombreCliente: '',
      region: '',
      ciudad: '',
      comuna: '',
      direccion: '',
      telefono: '',
      sitioWeb: '',
      segmento: '',
      industria: '',
      vendedor: '',
      condicionVenta: '',
      observaciones: '',
      giro: '',
      emailFacturacion: '',
      rutRepresentanteLegal: '',
      representanteLegal: ''
    }
  })

  // Efecto para cargar los datos iniciales
  useEffect(() => {
    if (currentUser && open) {
      console.log('Current user data:', currentUser)
      console.log('Region actual:', currentUser.region)
      console.log('Comuna actual:', currentUser.comuna)

      // Obtener la condición comercial
      const condicionComercial = currentUser.condicionesComerciales

      // Asegurarse de que los valores existan antes de asignarlos
      const vendedorValue = VENDEDORES.find(v => v.label === condicionComercial?.vendedor)?.value || condicionComercial?.vendedor || ''
      const condicionVentaValue = condicionComercial?.condicionVenta || ''
      const observacionesValue = condicionComercial?.observaciones || ''

      // Establecer región y comuna
      const regionActual = currentUser.region || ''
      const comunaActual = currentUser.comuna || ''

      console.log('Estableciendo región:', regionActual)
      console.log('Estableciendo comuna:', comunaActual)

      setSelectedRegion(regionActual)
      setSelectedComuna(comunaActual)

      reset({
        fechaCreacion: new Date(currentUser.fechaCreacion).toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-'),
        rut: currentUser.rut,
        estado: currentUser.estado,
        razonSocial: currentUser.razonSocial,
        nombreCliente: currentUser.nombreCliente || '',
        region: regionActual,
        comuna: comunaActual,
        direccion: currentUser.direccion || '',
        telefono: currentUser.telefono || '',
        sitioWeb: currentUser.sitioWeb || '',
        segmento: currentUser.segmento || '',
        industria: currentUser.industria || '',
        vendedor: vendedorValue,
        condicionVenta: condicionVentaValue,
        observaciones: observacionesValue,
        giro: currentUser.giro || '',
        emailFacturacion: Array.isArray(currentUser.emailFacturacion)
          ? currentUser.emailFacturacion.join(', ')
          : (currentUser.emailFacturacion || ''),
        rutRepresentanteLegal: currentUser.rutRepresentanteLegal || '',
        representanteLegal: currentUser.representanteLegal || ''
      })

      if (currentUser.clientesContactos && currentUser.clientesContactos.length > 0) {
        const mappedContacts = currentUser.clientesContactos.map(cc => ({
          contactId: cc.contacto?.contactId,
          nombre: cc.nombre || cc.contacto?.nombre || '',
          cargo: cc.cargo || '',
          email: cc.email || cc.contacto?.email || '',
          telefono1: cc.telefono1 || cc.contacto?.telefono1 || '',
          telefono2: cc.telefono2 || cc.contacto?.telefono2 || '',
          isPrincipal: cc.isPrincipal || false
        }))

        setContacts(mappedContacts)
      }
    }
  }, [currentUser, open, reset, setSelectedRegion, setSelectedComuna])

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)

      // Preparar los datos para la actualización
      const updateData = {
        ...data,
        giro: data.giro || '',
        emailFacturacion: data.emailFacturacion
          ? data.emailFacturacion
              .split(',')
              .map((email: string) => email.trim())
              .filter((email: string) => email.length > 0)
          : [],
        rutRepresentanteLegal: data.rutRepresentanteLegal || '',
        representanteLegal: data.representanteLegal || '',
        condicionesComerciales: {
          vendedor: data.vendedor,
          condicionVenta: data.condicionVenta,
          observaciones: data.observaciones
        },
        clientesContactos: contacts.map(contact => ({
          contactId: contact.contactId,
          isPrincipal: contact.isPrincipal,
          cargo: contact.cargo,
          nombre: contact.nombre,
          email: contact.email,
          telefono1: contact.telefono1,
          telefono2: contact.telefono2
        }))
      }

      console.log('Datos a actualizar:', updateData)

      const response = await axios.patch(`/api/clientes/${currentUser.clienteId}`, updateData)

      if (response.status === 200) {
        // Actualizar el estado local con los datos devueltos por el servidor
        setData((prevData: Cliente[]) =>
          prevData.map(cliente =>
            cliente.clienteId === currentUser.clienteId ? response.data : cliente
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
      newContacts[index] = {
        ...editingContact,
        nombre: editingContact.nombre || '',
        email: editingContact.email || '',
        telefono1: editingContact.telefono1 || '',
        telefono2: editingContact.telefono2 || '',
        cargo: editingContact.cargo || ''
      }
      setContacts(newContacts)
      setEditingContactIndex(null)
      setEditingContact(null)
    }
  }

  // Función para manejar el nuevo contacto creado
  const handleNewContact = (newContact: ContactType) => {
    const contactoNormalizado: Contacto = {
      nombre: newContact.nombre || '',
      cargo: newContact.cargo || '',
      email: newContact.email || '',
      telefono1: newContact.telefono1 || '',
      telefono2: newContact.telefono2 || '',
      contactId: newContact.contactId
    };
    setContacts([
      ...contacts,
      {
        contactId: contactoNormalizado.contactId,
        nombre: contactoNormalizado.nombre,
        cargo: contactoNormalizado.cargo,
        email: contactoNormalizado.email,
        telefono1: contactoNormalizado.telefono1,
        telefono2: contactoNormalizado.telefono2,
        isPrincipal: contacts.length === 0
      }
    ]);
    toast.success('Contacto agregado exitosamente');
    setRefreshContactSearch(prev => prev + 1);
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
                name='region'
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Región</InputLabel>
                    <Select
                      {...field}
                      label='Región'
                      value={selectedRegion}
                      onChange={e => {
                        const newRegion = e.target.value

                        field.onChange(newRegion)
                        setSelectedRegion(newRegion)
                        setSelectedComuna('')
                      }}
                    >
                      <MenuItem value=''>Seleccione una región</MenuItem>
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
                      value={selectedComuna}
                      disabled={!selectedRegion}
                      onChange={e => {
                        const newComuna = e.target.value

                        field.onChange(newComuna)
                        setSelectedComuna(newComuna)
                      }}
                    >
                      <MenuItem value=''>Seleccione una comuna</MenuItem>
                      {selectedRegion &&
                        getComunasByRegionNombre(selectedRegion).map(comuna => (
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

            {/* Campos de Giro y Email Facturación */}
            <Grid item xs={12} sm={6}>
              <Controller
                name='giro'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Giro' placeholder='Ingrese el giro del cliente' />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='emailFacturacion'
                control={control}
                rules={{
                  validate: value => validateMultipleEmails(value) || 'Uno o más correos no son válidos'
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Email de Facturación'
                    placeholder='ejemplo1@empresa.com, ejemplo2@empresa.com'
                    type='text'
                    helperText={errors.emailFacturacion ? errors.emailFacturacion.message : 'Separar múltiples correos con comas'}
                    error={!!errors.emailFacturacion}
                    value={typeof field.value === 'string' ? field.value : ''}
                  />
                )}
              />
            </Grid>

            {/* Nueva fila para rutRepresentanteLegal y representanteLegal */}
            <Grid item xs={12} sm={6}>
              <Controller
                name='rutRepresentanteLegal'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='RUT Representante Legal'
                    placeholder='12.345.678-9'
                    onChange={e => {
                      const formatted = formatRut(e.target.value)
                      field.onChange(formatted)
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name='representanteLegal'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Representante Legal'
                    placeholder='Nombre del representante legal'
                  />
                )}
              />
            </Grid>

            {/* Sección de Contactos */}
            <Grid item xs={12}>
              <Grid container spacing={2} alignItems='center' sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <Typography variant='h5' sx={{ minWidth: 'fit-content', mb: 2 }}>
                    Contactos
                  </Typography>
                  <Grid container spacing={2} alignItems='center'>
                    <Grid item xs={12} sm={'auto'}>
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={() => setAddContactOpen(true)}
                        startIcon={<i className='ri-add-line' />}
                      >
                        Nuevo Contacto
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm>
                      <Box sx={{ maxWidth: '400px', ml: { sm: 'auto' } }}>
                        <ContactSearch
                          onContactSelect={contact => {
                            const exists = contacts.some(c => c.contactId === contact.contactId)
                            if (exists) {
                              toast.error('Este contacto ya está en la lista')
                              return
                            }
                            const newContact = {
                              contactId: contact.contactId,
                              nombre: contact.nombre || '',
                              cargo: contact.cargo || ROLES_CONTACTO[0].label,
                              email: contact.email || '',
                              telefono1: contact.telefono1 || '',
                              telefono2: contact.telefono2 || '',
                              isPrincipal: contacts.length === 0
                            }
                            setContacts([...contacts, newContact])
                            toast.success('Contacto agregado exitosamente')
                          }}
                          refreshKey={refreshContactSearch}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>CARGO</TableCell>
                      <TableCell>NOMBRE</TableCell>
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
                          <>
                            <TableCell>
                              <FormControl fullWidth size='small'>
                                <Select
                                  value={editingContact?.cargo || ''}
                                  onChange={e => setEditingContact(prev => ({ ...prev!, cargo: e.target.value }))}
                                >
                                  {ROLES_CONTACTO.map(rol => (
                                    <MenuItem key={rol.value} value={rol.label}>
                                      {rol.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
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
                          <>
                            <TableCell>{getCargoLabel(contact.cargo)}</TableCell>
                            <TableCell>{contact.nombre}</TableCell>
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
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl fullWidth sx={{ backgroundColor: 'white' }}>
                    <InputLabel id='vendedor-label'>Vendedor</InputLabel>
                    <Select
                      {...field}
                      labelId='vendedor-label'
                      label='Vendedor'
                      error={Boolean(errors.vendedor)}
                      sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(58, 53, 65, 0.22)' } }}
                    >
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
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id='condicion-venta-label'>Condición de Venta</InputLabel>
                    <Select
                      {...field}
                      labelId='condicion-venta-label'
                      label='Condición de Venta'
                      value={field.value || ''}
                      displayEmpty
                    >
                      <MenuItem value=''>Seleccione una condición</MenuItem>
                      <MenuItem value='30 días'>30 días</MenuItem>
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
      <AddContact
        open={addContactOpen}
        handleClose={() => setAddContactOpen(false)}
        onContactCreated={handleNewContact}
      />
    </Drawer>
  )
}

export default EditClientForm
