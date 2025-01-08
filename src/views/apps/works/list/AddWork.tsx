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
import axios from 'axios'
import { toast } from 'react-hot-toast'

import { formatRut, validateRut } from '@/utils/rut-utils'

// Types Imports
import type { Obra, FormValidateType, ContactoObra } from '@/types/forms/obra'
import { initialFormData } from '@/types/forms/obra'

// Import data
import { ESTADOS_OBRA, LISTAS_PRECIOS, REGIONES_CHILE, COMUNAS } from '@/data/obraData'
import ContactSearchObra from '../components/ContactSearchObra'

// Agregar el enum o constante para los roles
const ROLES_OBRA = [
  { value: 'encargado_obra', label: 'Encargado de Obra' },
  { value: 'envio_informes', label: 'Envío de Informes' }
]

type Props = {
  open: boolean
  handleClose: () => void
  userData?: Obra[]
  setData: (data: Obra[] | ((prevData: Obra[]) => Obra[])) => void
}

const AddObraDrawer = (props: Props) => {
  // States
  const [formData, setFormData] = useState(initialFormData)
  const [contactos, setContactos] = useState<ContactoObra[]>([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [nuevoContacto, setNuevoContacto] = useState<Omit<ContactoObra, 'isPrincipal'>>({
    rol: '',
    nombre: '',
    email: '',
    telefono1: ''
  })

  const [editingContactId, setEditingContactId] = useState<number | null>(null)

  // Hooks - ahora useForm tiene acceso al schema
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger
  } = useForm<FormValidateType>({
    defaultValues: initialFormData,
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
      nombreCliente: {
        required: 'El nombre es requerido',
        minLength: {
          value: 3,
          message: 'Mínimo 3 caracteres'
        },
        pattern: {
          value: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
          message: 'Solo se permiten letras'
        }
      },
      telefonoFacturacion: {
        required: 'El teléfono es requerido',
        validate: value => validatePhone(value) || 'Debe ser un número chileno válido'
      },
      mailRecepcionFactura: {
        required: 'El email es requerido',
        validate: value => validateEmail(value) || 'Email inválido'
      },
      giro: {
        required: 'El giro es requerido',
        pattern: {
          value: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
          message: 'Solo se permiten letras'
        }
      }
    }
  })

  // Manejador para el campo RUT
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedRut = formatRut(e.target.value)

    setValue('rut', formattedRut)
  }

  // Agregar manejador para teléfono de facturación
  const handleFacturacionPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhone(e.target.value)

    setValue('telefonoFacturacion', formattedPhone)
  }

  // Agregar manejador para RUT de facturación
  const handleFacturacionRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedRut = formatRut(e.target.value)

    setValue('rut', formattedRut)
  }

  const onSubmit = async (data: FormValidateType) => {
    try {
      console.log('Enviando datos:', data)
      setIsSubmitting(true)

      // Incluir los contactos en el payload
      const payload = {
        ...data,
        contactos: contactos.map(contacto => ({
          nombre: contacto.nombre,
          rol: contacto.rol,
          email: contacto.email,
          telefono1: contacto.telefono1,
          isPrincipal: contacto.isPrincipal
        }))
      }

      const response = await axios.post('/api/obras', payload)

      if (response.status === 201) {
        toast.success('Obra creada exitosamente')
        props.handleClose()

        if (props.setData) {
          props.setData(prevData => [...prevData, response.data])
        }
      }
    } catch (error) {
      console.error('Error creating obra:', error)
      toast.error('Error al crear la obra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Limpiar el formulario antes de cerrar
    resetForm()
    setContactos([])
    setFormData(initialFormData)
    setNuevoContacto({
      rol: '',
      nombre: '',
      email: '',
      telefono1: ''
    })

    // Llamar a la función handleClose proporcionada por las props
    props.handleClose()
  }

  const handleReset = () => {
    handleClose()
  }

  // Validación de email
  const validateEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

    return emailRegex.test(email)
  }

  // Validación de teléfono chileno
  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?56?\d{9}$/

    return phoneRegex.test(phone)
  }

  // Formatear teléfono mientras se escribe
  const formatPhone = (phone: string) => {
    // Eliminar todo excepto números
    let cleaned = phone.replace(/\D/g, '')

    // Agregar +56 si no lo tiene
    if (!cleaned.startsWith('56')) {
      cleaned = '56' + cleaned
    }

    // Limitar a 11 caracteres (56 + 9 dígitos)
    cleaned = cleaned.slice(0, 11)

    return '+' + cleaned
  }

  const agregarContacto = () => {
    // Validar campos requeridos y formato
    if (!nuevoContacto.rol || !nuevoContacto.nombre) {
      toast.error('Rol y nombre son requeridos')

      return
    }

    if (!validateEmail(nuevoContacto.email)) {
      toast.error('Email inválido')

      return
    }

    if (!validatePhone(nuevoContacto.telefono1)) {
      toast.error('Teléfono inválido. Debe ser un número chileno válido')

      return
    }

    // Agregar el nuevo contacto a la lista
    setContactos(prevContactos => [...prevContactos, { ...nuevoContacto, isPrincipal: prevContactos.length === 0 }])

    // Limpiar el formulario
    setNuevoContacto({
      rol: '',
      nombre: '',
      email: '',
      telefono1: ''
    })
  }

  const eliminarContacto = (index: number) => {
    setContactos(prevContactos => prevContactos.filter((_, i) => i !== index))
  }

  const editarContacto = (index: number) => {
    setEditingContactId(index)
    const contacto = contactos[index]

    setNuevoContacto({
      cargo: contacto.cargo,
      nombre: contacto.nombre,
      email: contacto.email,
      telefono1: contacto.telefono1,
      telefono2: contacto.telefono2
    })
  }

  const guardarEdicion = () => {
    if (editingContactId === null) return

    setContactos(prev =>
      prev.map((contacto, index) =>
        index === editingContactId ? { ...nuevoContacto, isPrincipal: contacto.isPrincipal } : contacto
      )
    )
    setEditingContactId(null)
    setNuevoContacto({ cargo: '', nombre: '', email: '', telefono1: '', telefono2: '' })
  }

  const marcarComoPrincipal = (index: number) => {
    setContactos(prev =>
      prev.map((contacto, i) => ({
        ...contacto,
        isPrincipal: i === index
      }))
    )
  }

  const dummyObraData: FormValidateType = {
    // Datos básicos
    numeroObra: 'OB002',
    fechaIngreso: '2024-03-15',
    estado: 'activo',
    estadoObra: 'activo',

    // Cliente
    rut: '76.543.210-K',
    nombreCliente: 'Constructora Ejemplo S.A.',
    razonSocial: 'Constructora Ejemplo S.A.',

    // Antecedentes
    nombreObra: 'Construcción Edificio Central',
    direccion: 'Av. Principal 123',
    region: 'metropolitana',
    comuna: 'santiago',
    sector: 'Centro',
    georreferencia: '-33.4489, -70.6693',
    referencia: 'Frente al parque',

    // Mandante
    mandante: 'Inmobiliaria Principal',
    informeMandante: true,
    textoMandante: 'Informes semanales requeridos',

    // Facturación
    giro: 'Construcción y Desarrollo Inmobiliario',
    direccionComercial: 'Calle Comercial 456',
    comunaFacturacion: 'santiago',
    telefonoFacturacion: '+56 2 2345 6789',
    listaPrecios: 'lista1',
    mailRecepcionFactura: 'facturas@constructoraejemplo.cl',

    // Requisitos
    acreditacionPersonal: true,
    especificacionesTecnicas: true,
    acreditacionEquipos: true,
    cartaCompromiso: true,
    mandatoServiu: true,
    otrosRequisitos: 'Certificación ISO 9001',

    // Referencias
    estadoPago: true,
    hes: true,
    oc: true,
    otrasReferencias: 'Referencia adicional'
  } as const

  // Los contactos se manejan por separado
  const dummyContactos: ContactoObra[] = [
    {
      nombre: 'Juan Pérez',
      rol: 'encargado_obra',
      email: 'juan.perez@ejemplo.cl',
      telefono1: '+56 9 8765 4321',
      isPrincipal: true
    },
    {
      nombre: 'María González',
      rol: 'envio_informes',
      email: 'maria.gonzalez@ejemplo.cl',
      telefono1: '+56 9 9876 5432',
      isPrincipal: false
    }
  ]

  const handleLoadDummyData = () => {
    try {
      // Formatear la fecha correctamente
      const formattedData = {
        ...dummyObraData,
        fechaIngreso: new Date(dummyObraData.fechaIngreso).toISOString().split('T')[0]
      }

      // Actualizar el formulario usando setValue para cada campo
      Object.keys(formattedData).forEach(key => {
        setValue(key as keyof FormValidateType, formattedData[key as keyof FormValidateType])
      })

      // Actualizar los checkboxes
      setValue('informeMandante', Boolean(dummyObraData.informeMandante))
      setValue('acreditacionPersonal', Boolean(dummyObraData.acreditacionPersonal))
      setValue('especificacionesTecnicas', Boolean(dummyObraData.especificacionesTecnicas))
      setValue('acreditacionEquipos', Boolean(dummyObraData.acreditacionEquipos))
      setValue('cartaCompromiso', Boolean(dummyObraData.cartaCompromiso))
      setValue('mandatoServiu', Boolean(dummyObraData.mandatoServiu))
      setValue('estadoPago', Boolean(dummyObraData.estadoPago))
      setValue('hes', Boolean(dummyObraData.hes))
      setValue('oc', Boolean(dummyObraData.oc))

      // Actualizar los estados locales
      setFormData(formattedData)
      setContactos(dummyContactos)
      setSelectedRegion(dummyObraData.region)

      // Forzar la actualización del formulario
      trigger()

      // Mostrar mensaje de éxito
      toast.success('Datos de prueba cargados correctamente')
    } catch (error) {
      console.error('Error al cargar datos de prueba:', error)
      toast.error('Error al cargar los datos de prueba')
    }
  }

  // Manejador para el número de obra
  const handleNumeroObraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Elimina cualquier caracter que no sea número

    setValue('numeroObra', value)
  }

  return (
    <Drawer
      open={props.open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '75%', sm: '75%' } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Nueva Obra</Typography>
        <div className='flex gap-2'>
          {/* Agregar botón para cargar datos dummy */}
          <Button size='small' variant='outlined' onClick={handleLoadDummyData} sx={{ marginRight: 2 }}>
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
          {/* Primera sección: 4-3-2-3 */}
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='numeroObra'
                control={control}
                rules={{
                  required: 'El número de obra es requerido',
                  pattern: {
                    value: /^\d+$/,
                    message: 'Solo se permiten números'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Número Obra *'
                    onChange={handleNumeroObraChange}
                    error={Boolean(errors.numeroObra)}
                    helperText={errors.numeroObra?.message}
                    inputProps={{
                      inputMode: 'numeric',
                      pattern: '[0-9]*'
                    }}
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
                    error={Boolean(errors.fechaIngreso)}
                    helperText={errors.fechaIngreso && 'Este campo es obligatorio'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={2}>
              <Controller
                name='estado'
                control={control}
                render={({ field }) => (
                  <TextField {...field} fullWidth label='Estado' disabled value={field.value || 'activo'} />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth error={Boolean(errors.estadoObra)}>
                <InputLabel>Estado Obra *</InputLabel>
                <Controller
                  name='estadoObra'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select {...field} label='Estado Obra'>
                      {ESTADOS_OBRA.map(estado => (
                        <MenuItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.estadoObra && <FormHelperText>Este campo es obligatorio</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          {/* Segunda sección: 6-6 */}
          <Grid container spacing={5}>
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
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Nombre Cliente *'
                    error={Boolean(errors.nombreCliente)}
                    helperText={errors.nombreCliente && 'Este campo es obligatorio'}
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Antecedentes */}
          <Divider sx={{ my: 4 }} />
          <Typography variant='h6'>Antecedentes</Typography>

          {/* Nombre Obra: 12 */}
          <Grid container spacing={5}>
            <Grid item xs={12}>
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
          </Grid>

          {/* Dirección y Región: 6-6 */}
          <Grid container spacing={5}>
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
                <InputLabel>Región *</InputLabel>
                <Controller
                  name='region'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select {...field} label='Región *'>
                      {REGIONES_CHILE.map(region => (
                        <MenuItem key={region.value} value={region.value}>
                          {region.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
          </Grid>

          {/* Comuna, Sector, Georreferencia, Referencia: 3-3-3-3 */}
          <Grid container spacing={5}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Comuna *</InputLabel>
                <Controller
                  name='comuna'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select {...field} label='Comuna *'>
                      {COMUNAS.map(comuna => (
                        <MenuItem key={comuna.value} value={comuna.value}>
                          {comuna.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name='sector'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Sector' />}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name='georreferencia'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Georreferencia' />}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name='referencia'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Referencia' />}
              />
            </Grid>
          </Grid>

          {/* Mandante, Informe Mandante, Texto Mandante: 4-4-4 */}
          <Grid container spacing={5}>
            <Grid item xs={12} sm={4}>
              <Controller
                name='mandante'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Mandante' />}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
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
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='textoMandante'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Texto Mandante' multiline rows={2} />}
              />
            </Grid>
          </Grid>

          {/* Contactos */}
          <Divider sx={{ my: 4 }} />
          <Typography variant='h6'>Contactos</Typography>

          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#F5F5F5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: '500', width: '200px' }}>ROL</TableCell>
                  <TableCell sx={{ fontWeight: '500', width: '250px' }}>NOMBRE</TableCell>
                  <TableCell sx={{ fontWeight: '500', width: '250px' }}>EMAIL</TableCell>
                  <TableCell sx={{ fontWeight: '500', width: '200px' }}>TELÉFONO</TableCell>
                  <TableCell sx={{ fontWeight: '500', width: '120px' }}>ACCIÓN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Fila para nuevo contacto */}
                <TableRow>
                  <TableCell>
                    <FormControl fullWidth size='small'>
                      <Select
                        value={nuevoContacto.rol || ''}
                        onChange={e => setNuevoContacto({ ...nuevoContacto, rol: e.target.value })}
                      >
                        {ROLES_OBRA.map(rol => (
                          <MenuItem key={rol.value} value={rol.value}>
                            {rol.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.nombre || ''}
                      onChange={e => setNuevoContacto({ ...nuevoContacto, nombre: e.target.value })}
                      placeholder='Nombre'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.email || ''}
                      onChange={e => setNuevoContacto({ ...nuevoContacto, email: e.target.value })}
                      placeholder='Email'
                      fullWidth
                      size='small'
                      error={nuevoContacto.email && !validateEmail(nuevoContacto.email)}
                      helperText={nuevoContacto.email && !validateEmail(nuevoContacto.email) ? 'Email inválido' : ''}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.telefono1 || ''}
                      onChange={e => {
                        const formattedPhone = formatPhone(e.target.value)

                        setNuevoContacto({ ...nuevoContacto, telefono1: formattedPhone })
                      }}
                      placeholder='Teléfono (+56912345678)'
                      fullWidth
                      size='small'
                      error={nuevoContacto.telefono1 && !validatePhone(nuevoContacto.telefono1)}
                      helperText={
                        nuevoContacto.telefono1 && !validatePhone(nuevoContacto.telefono1)
                          ? 'Debe ser un número chileno válido'
                          : ''
                      }
                      inputProps={{
                        maxLength: 12 // +56912345678
                      }}
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
                    <TableCell>
                      <Typography>{ROLES_OBRA.find(r => r.value === contacto.rol)?.label}</Typography>
                    </TableCell>
                    <TableCell>{contacto.nombre}</TableCell>
                    <TableCell>{contacto.email}</TableCell>
                    <TableCell>{contacto.telefono1}</TableCell>
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

          {/* Requisitos */}
          <Divider sx={{ my: 4 }} />
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Typography variant='h5'>Requisitos</Typography>
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
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label='Carta de Compromiso'
                  />
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

          {/* Facturación */}
          <Divider sx={{ my: 4 }} />
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Typography variant='h5'>Facturación</Typography>
            </Grid>
            <Grid item xs={12} sm={6} display='flex' justifyContent='flex-end'>
              <FormControlLabel control={<Checkbox />} label='Copiar Cliente' />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='razonSocial'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Razón Social *'
                    error={Boolean(errors.razonSocial)}
                    helperText={errors.razonSocial && 'Este campo es obligatorio'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
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

            <Grid item xs={12} sm={4}>
              <Controller
                name='giro'
                control={control}
                rules={{
                  required: 'El giro es requerido',
                  pattern: {
                    value: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
                    message: 'Solo se permiten letras'
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

            <Grid item xs={12} sm={8}>
              <Controller
                name='direccionComercial'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Dirección Comercial *'
                    error={Boolean(errors.direccionComercial)}
                    helperText={errors.direccionComercial && 'Este campo es obligatorio'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='comunaFacturacion'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Comuna *'
                    error={Boolean(errors.comunaFacturacion)}
                    helperText={errors.comunaFacturacion && 'Este campo es obligatorio'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='telefonoFacturacion'
                control={control}
                rules={{
                  required: 'El teléfono es requerido',
                  validate: value => validatePhone(value) || 'Debe ser un número chileno válido'
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono *'
                    onChange={handleFacturacionPhoneChange}
                    error={Boolean(errors.telefonoFacturacion)}
                    helperText={errors.telefonoFacturacion?.message}
                    inputProps={{
                      maxLength: 12
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={Boolean(errors.listaPrecios)}>
                <InputLabel>Lista de Precios *</InputLabel>
                <Controller
                  name='listaPrecios'
                  control={control}
                  rules={{ required: true }}
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

            <Grid item xs={12} sm={4}>
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

          {/* Referencias */}
          <Divider sx={{ my: 4 }} />
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Typography variant='h5'>Referencias</Typography>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name='estadoPago'
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label='Estado de Pago' />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name='hes'
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label='HES' />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name='oc'
                control={control}
                render={({ field }) => (
                  <FormControlLabel control={<Checkbox {...field} checked={field.value} />} label='OC' />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <Controller
                name='otrasReferencias'
                control={control}
                render={({ field }) => <TextField {...field} fullWidth label='Otras Referencias' />}
              />
            </Grid>
          </Grid>

          {/* Botones de acción */}
          <div className='flex items-center gap-4 mt-5'>
            <Button variant='contained' type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant='outlined' color='error' onClick={handleReset} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddObraDrawer
