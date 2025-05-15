// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import type { SelectChangeEvent } from '@mui/material/Select'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
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
import Box from '@mui/material/Box'
import FormHelperText from '@mui/material/FormHelperText'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

import { useRegionesYComunas } from '@/hooks/useRegionesYComunas'
import ClientSearch from '@/views/apps/clients/components/ClientSearch'
import ContactSearch from '@/views/apps/clients/components/ContactSearch'

// Types
import type { Obra, FormValidateType, ContactoObra } from '@/types/forms/obra'
import { initialFormData } from '@/types/forms/obra'

// Data
import { formatRut, validateRut } from '@/utils/rut-utils'
import { LISTAS_PRECIOS } from '@/data/obraData'

// Agregar el enum o constante para los roles
const ROLES_CONTACTO = [
  { value: 'encargado_obra', label: 'Encargado de Obra' },
  { value: 'envio_informes', label: 'Envío de Informes' },
  { value: 'dueno_representante', label: 'Dueño Representante' },
  { value: 'jefe_obra_planta', label: 'Jefe de Obra / Planta' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'administrador_obra', label: 'Administrador de Obra' },
  { value: 'encargado_calidad', label: 'Encargado de Calidad' },
  { value: 'autocontrol', label: 'Autocontrol' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'laboratorista', label: 'Laboratorista' },
  { value: 'otro', label: 'Otro (Especificar)' }
]

// Agregar la constante para los mandantes
const MANDANTES = [
  { value: 'Dirección de Obras Hidráulicas', label: 'Dirección de Obras Hidráulicas' },
  { value: 'ESSBIO', label: 'ESSBIO' },
  { value: 'JUNJI', label: 'JUNJI' },
  { value: 'Ministerio Obras Públicas', label: 'Ministerio Obras Públicas' },
  { value: 'Municipalidad', label: 'Municipalidad' },
  { value: 'No definido', label: 'No definido' },
  { value: 'Particular', label: 'Particular' },
  { value: 'SERVIU', label: 'SERVIU' }
]

interface EditWorksFormProps {
  open: boolean
  handleClose: () => void
  obraData: Obra | null
  setData: (data: Obra[] | ((prevData: Obra[]) => Obra[])) => void
}

const EditWorksForm = ({ open, handleClose, obraData, setData }: EditWorksFormProps) => {
  // States
  const [contactos, setContactos] = useState<ContactoObra[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [nuevoContacto, setNuevoContacto] = useState<Omit<ContactoObra, 'isPrincipal'>>({
    obraId: 0,
    rol: '',
    nombre: '',
    email: '',
    telefono1: '',
    telefono2: ''
  })

  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)

  const [editingContact, setEditingContact] = useState<ContactoObra>({
    obraId: 0,
    rol: '',
    nombre: '',
    email: '',
    telefono1: '',
    telefono2: '',
    isPrincipal: false
  })

  const { regiones, comunas, selectedRegion, selectedComuna, setSelectedRegion, setSelectedComuna } =
    useRegionesYComunas()

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<FormValidateType>({
    defaultValues: {
      ...initialFormData,
      estado: 'activa',
      estadoObra: 'activa',
      fechaIngreso: new Date().toISOString().split('T')[0]
    },
    mode: 'onChange',
    rules: {
      numeroObra: {
        required: 'El número de obra es requerido',
        pattern: {
          value: /^\d+$/,
          message: 'Solo se permiten números'
        }
      },
      fechaIngreso: {
        required: 'La fecha es requerida',
        validate: value => {
          const date = new Date(value)

          return date <= new Date() || 'La fecha no puede ser futura'
        }
      },
      rut: {
        required: 'El RUT es requerido',
        validate: value => validateRut(value) || 'RUT inválido'
      },
      giro: {
        required: 'El giro es requerido',
        pattern: {
          value: /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s]+$/,
          message: 'Solo se permiten letras y números'
        }
      },
      telefonoFacturacion: {
        required: 'El teléfono es requerido'
      },
      mailRecepcionFactura: {
        required: 'El email es requerido',
        validate: value => validateEmail(value) || 'Email inválido'
      }
    }
  })

  // Efecto para cargar los datos cuando se abre el drawer
  useEffect(() => {
    if (obraData) {
      // Formatear la fecha
      const formattedDate = obraData.fechaIngreso ? format(new Date(obraData.fechaIngreso), 'yyyy-MM-dd') : ''
      const formattedRut = obraData.rut ? formatRut(obraData.rut) : ''

      // Asegurarnos de que los booleanos se inicialicen correctamente
      const formattedData = {
        ...obraData,
        fechaIngreso: formattedDate,
        rut: formattedRut,

        // Convertir explícitamente a booleanos
        informeMandante: Boolean(obraData.informeMandante ?? false),
        acreditacionPersonal: Boolean(obraData.acreditacionPersonal ?? false),
        especificacionesTecnicas: Boolean(obraData.especificacionesTecnicas ?? false),
        acreditacionEquipos: Boolean(obraData.acreditacionEquipos ?? false),
        cartaCompromiso: Boolean(obraData.cartaCompromiso ?? false),
        mandatoServiu: Boolean(obraData.mandatoServiu ?? false),
        estadoPago: Boolean(obraData.estadoPago ?? false),
        hes: Boolean(obraData.hes ?? false),
        oc: Boolean(obraData.oc ?? false)
      }

      // Forzar la actualización de los valores del formulario
      reset(formattedData)

      // Actualizar estados
      setContactos(obraData.contactos || [])
      setSelectedRegion(obraData.region || '')
      setSelectedComuna(obraData.comuna || '')
    }
  }, [obraData, reset])

  // Manejador para el cambio de región
  const handleRegionChange = (event: SelectChangeEvent<string>) => {
    const regionValue = event.target.value

    setSelectedRegion(regionValue)
    setSelectedComuna('')
    setValue('region', regionValue)
    setValue('comuna', '')
  }

  // Manejador para el cambio de comuna
  const handleComunaChange = (event: SelectChangeEvent<string>) => {
    const comunaValue = event.target.value

    setSelectedComuna(comunaValue)
    setValue('comuna', comunaValue)
  }

  // Validación de email
  const validateEmail = (email: string | undefined) => {
    if (!email) return false
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

    return emailRegex.test(email)
  }

  // Validación de teléfono
  const validatePhone = (phone: string | undefined) => {
    if (!phone) return false
    const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '')

    return /^\+?[0-9]+$/.test(cleanPhone)
  }

  // Modificar la función de formateo de teléfono
  const formatPhone = (value: string) => {
    // Permitir solo números y el signo +
    let formatted = value.replace(/[^\d+]/g, '')

    // Asegurar que el + solo esté al inicio
    if (formatted.includes('+')) {
      formatted = '+' + formatted.replace(/\+/g, '')
    }

    return formatted
  }

  // Manejadores para campos específicos
  const handleNumeroObraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')

    setValue('numeroObra', value)
  }

  const handleFacturacionRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedRut = formatRut(e.target.value)

    setValue('rut', formattedRut)
  }

  const handleFacturacionPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value)

    setValue('telefonoFacturacion', formattedPhone)
  }

  const onSubmit = async (formData: FormValidateType) => {
    try {
      setIsSubmitting(true)

      // Asegurarnos de que los booleanos se envíen correctamente
      const dataToSubmit = {
        ...formData,
        fechaIngreso: formData.fechaIngreso ? new Date(formData.fechaIngreso).toISOString() : null,

        // Asegurar que los booleanos sean true/false y no undefined
        informeMandante: Boolean(formData.informeMandante),
        acreditacionPersonal: Boolean(formData.acreditacionPersonal),
        especificacionesTecnicas: Boolean(formData.especificacionesTecnicas),
        acreditacionEquipos: Boolean(formData.acreditacionEquipos),
        cartaCompromiso: Boolean(formData.cartaCompromiso),
        mandatoServiu: Boolean(formData.mandatoServiu),
        estadoPago: Boolean(formData.estadoPago),
        hes: Boolean(formData.hes),
        oc: Boolean(formData.oc)
      }

      const response = await axios.put(`/api/obras/${obraData?.obraId}`, dataToSubmit)

      if (response.status === 200) {
        // Actualizar los datos en la tabla asegurando que los booleanos se mantengan
        setData(prevData =>
          prevData.map(obra => {
            if (obra.obraId === obraData?.obraId) {
              return {
                ...obra,
                ...response.data,
                informeMandante: Boolean(response.data.informeMandante),
                acreditacionPersonal: Boolean(response.data.acreditacionPersonal),
                especificacionesTecnicas: Boolean(response.data.especificacionesTecnicas),
                acreditacionEquipos: Boolean(response.data.acreditacionEquipos),
                cartaCompromiso: Boolean(response.data.cartaCompromiso),
                mandatoServiu: Boolean(response.data.mandatoServiu),
                estadoPago: Boolean(response.data.estadoPago),
                hes: Boolean(response.data.hes),
                oc: Boolean(response.data.oc)
              }
            }

            return obra
          })
        )

        toast.success('Obra actualizada exitosamente')
        handleClose()
      }
    } catch (error) {
      console.error('Error al actualizar obra:', error)
      toast.error('Error al actualizar la obra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddContact = (contact: ContactoObra) => {
    setContactos(prev => [...prev, contact])
  }

  const handleDeleteContact = (contactId: number) => {
    setContactos(prev => prev.filter(c => c.id !== contactId))
  }

  const editarContacto = (index: number) => {
    setEditingContactIndex(index)
    const contacto = contactos[index]

    setEditingContact({
      obraId: contacto.obraId,
      rol: contacto.rol || '',
      nombre: contacto.nombre || '',
      email: contacto.email || '',
      telefono1: contacto.telefono1 || '',
      telefono2: contacto.telefono2 || '',
      isPrincipal: contacto.isPrincipal
    })
  }

  const guardarEdicion = () => {
    if (editingContactIndex === null) return

    // Validaciones
    if (!editingContact.nombre || !editingContact.email || !validateEmail(editingContact.email)) {
      toast.error('Por favor complete los campos requeridos correctamente')

      return
    }

    const updatedContactos = [...contactos]

    updatedContactos[editingContactIndex] = {
      ...contactos[editingContactIndex],
      ...editingContact
    }

    setContactos(updatedContactos)
    setEditingContactIndex(null)
    setEditingContact({
      obraId: 0,
      rol: '',
      nombre: '',
      email: '',
      telefono1: '',
      telefono2: '',
      isPrincipal: false
    })

    toast.success('Contacto actualizado exitosamente')
  }

  const handleCancelEdit = () => {
    setEditingContactIndex(null)
    setEditingContact({
      obraId: 0,
      rol: '',
      nombre: '',
      email: '',
      telefono1: '',
      telefono2: '',
      isPrincipal: false
    })
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '90%', sm: '90%' } } }}
    >
      <div className='flex items-center justify-between p-5'>
        <Typography variant='h5'>Editar Obra</Typography>
        <IconButton onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </div>
      <Divider />

      <form onSubmit={handleSubmit(onSubmit)} className='p-5 space-y-4'>
        {/* Datos Principales */}
        <Grid container spacing={5}>
          <Grid item xs={12}>
            <Typography variant='h6'>Datos Principales</Typography>
          </Grid>

          {/* Primera fila: Número Obra, Fecha Ingreso y Estado */}
          <Grid item xs={12} sm={4}>
            <Controller
              name='numeroObra'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Número Obra'
                  InputProps={{
                    readOnly: true
                  }}
                  disabled
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name='fechaIngreso'
              control={control}
              rules={{ required: 'La fecha es requerida' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type='date'
                  fullWidth
                  label='Fecha Ingreso'
                  InputLabelProps={{ shrink: true }}
                  onChange={e => {
                    field.onChange(e)
                    setValue('fechaIngreso', e.target.value)
                  }}
                  error={Boolean(errors.fechaIngreso)}
                  helperText={errors.fechaIngreso?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name='estadoObra'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    {...field}
                    label='Estado'
                    onChange={e => {
                      field.onChange(e)
                      setValue('estadoObra', e.target.value)
                    }}
                  >
                    <MenuItem value='activa'>Activa</MenuItem>
                    <MenuItem value='terminada'>Terminada</MenuItem>
                    <MenuItem value='bloqueada'>Bloqueada</MenuItem>
                    <MenuItem value='inactiva'>Inactiva</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          {/* Barra de búsqueda de clientes */}
          <Grid item xs={12}>
            <ClientSearch
              onClientSelect={cliente => {
                setValue('rut', cliente.rut)
                setValue('nombreCliente', cliente.nombreCliente)
                setValue('razonSocial', cliente.razonSocial)
                trigger(['rut', 'nombreCliente', 'razonSocial'])
              }}
            />
          </Grid>

          {/* Segunda fila: RUT y Nombre Cliente */}
          <Grid item xs={12} sm={6}>
            <Controller
              name='rut'
              control={control}
              rules={{
                required: 'El RUT es requerido',
                validate: value => validateRut(value) || 'RUT inválido'
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='RUT *'
                  onChange={handleFacturacionRutChange}
                  error={Boolean(errors.rut)}
                  helperText={errors.rut?.message}
                  inputProps={{
                    maxLength: 12
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='nombreCliente'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Nombre Cliente' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
        </Grid>

        {/* Antecedentes */}
        <Divider sx={{ my: 4 }} />
        <Grid container spacing={5}>
          <Grid item xs={12}>
            <Typography variant='h6'>Antecedentes</Typography>
          </Grid>

          {/* Nombre Obra y Dirección */}
          <Grid item xs={12} sm={6}>
            <Controller
              name='nombreObra'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Nombre Obra *'
                  error={Boolean(errors.nombreObra)}
                  helperText={errors.nombreObra && 'Este campo es obligatorio'}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name='direccion'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Dirección *'
                  error={Boolean(errors.direccion)}
                  helperText={errors.direccion && 'Este campo es obligatorio'}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Región</InputLabel>
              <Select value={selectedRegion} label='Región' onChange={handleRegionChange}>
                {regiones.map(region => (
                  <MenuItem key={region.id} value={region.nombre}>
                    {region.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Comuna</InputLabel>
              <Select value={selectedComuna} label='Comuna' onChange={handleComunaChange} disabled={!selectedRegion}>
                {comunas.map(comuna => (
                  <MenuItem key={comuna.id} value={comuna.nombre}>
                    {comuna.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='sector'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Sector' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='georreferencia'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Georreferencia' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='referencia'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Referencia' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Mandante</InputLabel>
              <Controller
                name='mandante'
                control={control}
                render={({ field }) => (
                  <Select {...field} label='Mandante'>
                    {MANDANTES.map(mandante => (
                      <MenuItem key={mandante.value} value={mandante.value}>
                        {mandante.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='textoMandante'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Texto Mandante' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='correos'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Correos'
                  placeholder='correo1@ejemplo.com, correo2@ejemplo.com'
                  helperText='Separar múltiples correos con comas'
                  InputLabelProps={{ shrink: true }}
                  onChange={e => {
                    const correos = e.target.value.split(',').map(correo => correo.trim())

                    field.onChange(correos)
                  }}
                  value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                />
              )}
            />
          </Grid>
          {/* <Grid item xs={12}>
            <FormControlLabel
              control={
                <Controller
                  name='informeMandante'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Informe a Mandante'
            />
          </Grid> */}
        </Grid>

        {/* Sección de Contactos */}
        <Divider sx={{ my: 4 }} />
        <Grid container alignItems='center' spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant='h6'>Contactos</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <ContactSearch
              onContactSelect={contact => {
                const newContact: ContactoObra = {
                  obraId: obraData?.obraId || 0,
                  nombre: contact.nombre,
                  rol: contact.cargo || '',
                  email: contact.email,
                  telefono1: contact.telefono1,
                  telefono2: contact.telefono2 || '',
                  isPrincipal: contactos.length === 0
                }

                handleAddContact(newContact)
              }}
            />
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>CARGO</TableCell>
                <TableCell>NOMBRE</TableCell>
                <TableCell>EMAIL</TableCell>
                <TableCell>TELÉFONO</TableCell>
                <TableCell>ACCIÓN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contactos.map((contacto, index) => (
                <TableRow key={index}>
                  {editingContactIndex === index ? (
                    // Modo edición
                    <>
                      <TableCell>
                        {index === 0 && editingContact.rol === 'encargado_obra' ? (
                          <TextField value='Encargado de Obra' fullWidth size='small' disabled />
                        ) : (
                          <FormControl fullWidth size='small'>
                            <Select
                              value={editingContact.rol}
                              onChange={e => setEditingContact({ ...editingContact, rol: e.target.value })}
                            >
                              {ROLES_CONTACTO.map(rol => (
                                <MenuItem key={rol.value} value={rol.value}>
                                  {rol.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size='small'
                          value={editingContact.nombre}
                          onChange={e => setEditingContact({ ...editingContact, nombre: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size='small'
                          value={editingContact.email}
                          onChange={e => setEditingContact({ ...editingContact, email: e.target.value })}
                          error={!validateEmail(editingContact.email)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size='small'
                          value={editingContact.telefono1}
                          onChange={e => {
                            const formatted = formatPhone(e.target.value)

                            setEditingContact({ ...editingContact, telefono1: formatted })
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton color='success' onClick={guardarEdicion}>
                            <i className='ri-check-line' />
                          </IconButton>
                          <IconButton color='error' onClick={handleCancelEdit}>
                            <i className='ri-close-line' />
                          </IconButton>
                          <IconButton
                            color={editingContact.isPrincipal ? 'warning' : 'default'}
                            onClick={() =>
                              setEditingContact({ ...editingContact, isPrincipal: !editingContact.isPrincipal })
                            }
                          >
                            <i className={`ri-star-${editingContact.isPrincipal ? 'fill' : 'line'}`} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </>
                  ) : (
                    // Modo visualización
                    <>
                      <TableCell>{ROLES_CONTACTO.find(r => r.value === contacto.rol)?.label || contacto.rol}</TableCell>
                      <TableCell>{contacto.nombre}</TableCell>
                      <TableCell>{contacto.email}</TableCell>
                      <TableCell>{contacto.telefono1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton color='info' onClick={() => editarContacto(index)}>
                            <i className='ri-edit-line' />
                          </IconButton>
                          <IconButton color='error' onClick={() => handleDeleteContact(contacto.id)}>
                            <i className='ri-delete-bin-line' />
                          </IconButton>
                          <IconButton
                            color={contacto.isPrincipal ? 'warning' : 'default'}
                            onClick={() => {
                              const updatedContactos = contactos.map(c => ({
                                ...c,
                                isPrincipal: c.id === contacto.id ? !c.isPrincipal : false
                              }))

                              setContactos(updatedContactos)
                            }}
                          >
                            <i className={`ri-star-${contacto.isPrincipal ? 'fill' : 'line'}`} />
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

        {/* Sección de Requisitos */}
        <Divider sx={{ my: 4 }} />
        <Grid container spacing={5}>
          <Grid item xs={12}>
            <Typography variant='h6'>Requisitos</Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name='acreditacionPersonal'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label='Acreditación de Personal'
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name='especificacionesTecnicas'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label='Especificaciones Técnicas (EETT)'
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name='acreditacionEquipos'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label='Acreditación de Equipos'
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name='cartaCompromiso'
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label='Carta de Compromiso' />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name='mandatoServiu'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label='Mandato y Envío de Informes a SERVIU'
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name='otrosRequisitos'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Otros Requisitos' />}
            />
          </Grid>
        </Grid>

        {/* Sección de Facturación */}
        <Divider sx={{ my: 4 }} />
        <Typography variant='h6'>Facturación</Typography>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={6}>
            <Controller
              name='razonSocial'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Razón Social' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='giro'
              control={control}
              rules={{
                required: 'El giro es requerido',
                pattern: {
                  value: /^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ\s]+$/,
                  message: 'Solo se permiten letras y números'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Giro *'
                  error={Boolean(errors.giro)}
                  helperText={errors.giro?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='direccionComercial'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Dirección Comercial' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='comunaFacturacion'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Comuna Facturación' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='telefonoFacturacion'
              control={control}
              rules={{
                required: 'El teléfono es requerido'
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Teléfono *'
                  placeholder='+56 9 XXXX XXXX'
                  error={Boolean(errors.telefonoFacturacion)}
                  helperText={errors.telefonoFacturacion?.message}
                  value={field.value || ''}
                  onChange={e => {
                    const formatted = e.target.value.replace(/[^a-zA-Z0-9+\s]/g, '')

                    field.onChange(formatted)
                  }}
                  inputProps={{
                    inputMode: 'text'
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={Boolean(errors.listaPrecios)}>
              <InputLabel>Lista de Precios</InputLabel>
              <Controller
                name='listaPrecios'
                control={control}
                render={({ field }) => (
                  <Select {...field} label='Lista de Precios'>
                    {LISTAS_PRECIOS.map(lista => (
                      <MenuItem key={lista.value} value={lista.value}>
                        {lista.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.listaPrecios && <FormHelperText>Este campo es obligatorio</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name='mailRecepcionFactura'
              control={control}
              rules={{
                required: 'El email es requerido',
                validate: value => validateEmail(value) || 'Email inválido'
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Mail Recepción Factura *'
                  error={Boolean(errors.mailRecepcionFactura)}
                  helperText={errors.mailRecepcionFactura?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        {/* Sección de Referencias */}
        <Divider sx={{ my: 4 }} />
        <Grid container spacing={5}>
          <Grid item xs={12}>
            <Typography variant='h6'>Referencias</Typography>
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Controller
                  name='estadoPago'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Estado Pago'
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Controller
                  name='hes'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='HES'
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Controller
                  name='oc'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='OC'
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <Controller
              name='otrasReferencias'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Otras Referencias' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
        </Grid>

        {/* Botones */}
        <div className='flex justify-end gap-4 mt-4'>
          <Button variant='outlined' color='secondary' onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant='contained' type='submit'>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

export default EditWorksForm
