import { useState, useEffect } from 'react'
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
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Star from '@mui/icons-material/Star'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { validateRut } from '@/utils/rut-utils'
import type { Obra, FormValidateType } from '@/types/forms/obra'
import { initialFormData } from '@/types/forms/obra'
import { ESTADOS_OBRA } from '@/data/obraData'
import ContactSearch from '@/views/apps/clients/components/ContactSearch'
import { useRegionesYComunas } from '@/hooks/useRegionesYComunas'
import ClientSearch from '@/views/apps/clients/components/ClientSearch'

const CARGOS_OBRA = [
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

type Props = {
  open: boolean
  handleClose: () => void
  setData: (data: Obra[] | ((prevData: Obra[]) => Obra[])) => void
  setFilteredData: (data: Obra[] | ((prevData: Obra[]) => Obra[])) => void
  initialData: Partial<Obra>
}

interface ContactoObraForm {
  rol: string
  nombre: string
  email: string
  telefono1: string
  telefono2: string
  isEditing: boolean
  contactId?: string
  isPrincipal: boolean
  rolEspecifico?: string
}

// Función de validación de email
const validateEmail = (email: string) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

// Función de validación de teléfono
const validatePhone = (phone: string) => {
  const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
  return /^\+?[0-9]+$/.test(cleanPhone);
};

const DuplicateWork = (props: Props) => {
  const { open, handleClose: onClose, setData, setFilteredData, initialData } = props

  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    trigger,
    watch
  } = useForm<FormValidateType>({
    defaultValues: {
      ...initialFormData,
      ...initialData,
      estado: initialData?.estado || 'activa',
      estadoObra: initialData?.estadoObra || 'activa',
      fechaIngreso: initialData?.fechaIngreso || new Date().toISOString().split('T')[0]
    },
    mode: 'onChange'
  })

  const [lastObraNumber, setLastObraNumber] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const [listasPrecios, setListasPrecios] = useState<Array<{ id: string; nombre: string }>>([])

  const contactosPrincipales: ContactoObraForm[] = initialData?.contactos?.map(contacto => ({
    rol: contacto.rol,
    nombre: contacto.nombre,
    email: contacto.email ? String(contacto.email) : '',
    telefono1: contacto.telefono1 ? String(contacto.telefono1) : '',
    telefono2: contacto.telefono2 ? String(contacto.telefono2) : '',
    isEditing: false,
    contactId: contacto.id ? String(contacto.id) : undefined,
    isPrincipal: contacto.isPrincipal
  })) || [
    {
      rol: 'Encargado de Obra',
      nombre: '',
      email: '',
      telefono1: '',
      telefono2: '',
      isEditing: false,
      contactId: undefined,
      isPrincipal: false
    }
  ]

  const [contactos, setContactos] = useState<ContactoObraForm[]>(contactosPrincipales)
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)
  const [editingContact, setEditingContact] = useState<ContactoObraForm>({
    rol: '',
    nombre: '',
    email: '',
    telefono1: '',
    telefono2: '',
    isEditing: true,
    isPrincipal: false
  })
  const { regiones, comunas, selectedRegion, selectedComuna, setSelectedRegion, setSelectedComuna } = useRegionesYComunas()

  // Definir el cliente seleccionado a partir de initialData
  const selectedClient = initialData && initialData.rut && initialData.nombreCliente
    ? {
        clienteId: 0, // No tenemos el ID real, pero es necesario para el Autocomplete
        rut: initialData.rut,
        nombreCliente: initialData.nombreCliente,
        razonSocial: initialData.razonSocial || '',
        giro: initialData.giro || '',
        direccionComercial: initialData.direccionComercial || '',
        comunaFacturacion: initialData.comunaFacturacion || '',
        telefono: initialData.telefono || initialData.telefonoFacturacion || '',
        telefonoFacturacion: initialData.telefonoFacturacion || '',
        mailRecepcionFactura: initialData.mailRecepcionFactura || '',
        listaPrecios: initialData.listaPrecios || '',
        otroRut: initialData.rutRepresentanteLegal || '',
        representanteLegal: initialData.representanteLegal || ''
      }
    : null;

  useEffect(() => {
    const fetchLastObraNumber = async () => {
      try {
        const response = await axios.get('/api/obras')
        const obras: Obra[] = response.data
        if (obras && obras.length > 0) {
          const maxNumber = Math.max(...obras.map(obra => parseInt(obra.numeroObra || '0')))
          const nextNumber = (maxNumber + 1).toString()
          setLastObraNumber(nextNumber)
          setValue('numeroObra', nextNumber)
        } else {
          setLastObraNumber('1')
          setValue('numeroObra', '1')
        }
      } catch (error) {
        console.error('Error al obtener el último número de obra:', error)
        toast.error('Error al obtener el número de obra')
      }
    }
    fetchLastObraNumber()
  }, [setValue])

  useEffect(() => {
    const fetchListasPrecios = async () => {
      try {
        const response = await axios.get('/api/listas-precios')
        setListasPrecios(response.data)
      } catch (error) {
        console.error('Error al cargar las listas de precios:', error)
        toast.error('Error al cargar las listas de precios')
      }
    }

    if (open) {
      fetchListasPrecios()
    }
  }, [open])

  useEffect(() => {
    if (open && initialData) {
      console.log('initialData recibido:', initialData)
      
      // Preparar los datos del formulario
      const formData = {
        ...initialFormData,
        ...initialData,
        nombreObra: '',
        direccion: '',
        estado: initialData.estado || 'activa',
        estadoObra: initialData.estadoObra || 'activa',
        fechaIngreso: initialData.fechaIngreso instanceof Date 
          ? initialData.fechaIngreso.toISOString().split('T')[0]
          : typeof initialData.fechaIngreso === 'string' 
            ? initialData.fechaIngreso.split('T')[0]
            : new Date().toISOString().split('T')[0],
        rut: initialData.rut || '',
        nombreCliente: initialData.nombreCliente || '',
        razonSocial: initialData.razonSocial || '',
        giro: initialData.giro || '',
        direccionComercial: initialData.direccionComercial || '',
        comunaFacturacion: initialData.comunaFacturacion || '',
        listaPrecios: initialData.listaPrecios || '',
        mailRecepcionFactura: initialData.mailRecepcionFactura || '',
        rutRepresentanteLegal: initialData.rutRepresentanteLegal || '',
        representanteLegal: initialData.representanteLegal || '',
        telefono: initialData.telefono || initialData.telefonoFacturacion || '',
        otrasReferencias: typeof initialData.otrasReferencias === 'string' ? initialData.otrasReferencias : '',
        correos: typeof initialData.correos === 'string' 
          ? initialData.correos.split(',').map(correo => correo.trim()).filter(correo => correo !== '')
          : Array.isArray(initialData.correos) 
            ? initialData.correos 
            : []
      }

      console.log('formData preparado:', formData)

      // Resetear el formulario con los datos preparados
      resetForm(formData)

      // Establecer los valores individualmente para asegurar que se actualicen
      Object.entries(formData).forEach(([key, value]) => {
        setValue(key as keyof FormValidateType, value)
      })

      // Actualizar los estados locales
      if (initialData.region) {
        setSelectedRegion(initialData.region)
      }
      if (initialData.comuna) {
        setSelectedComuna(initialData.comuna)
      }
      if (initialData.comunaFacturacion) {
        const existe = comunas.some(c => c.nombre.trim().toLowerCase() === initialData.comunaFacturacion!.trim().toLowerCase())
        if (!existe) {
          comunas.push({ id: 'custom', nombre: initialData.comunaFacturacion! })
        }
      }

      // Actualizar los contactos
      if (initialData.contactos && initialData.contactos.length > 0) {
        setContactos(
          initialData.contactos.map(contacto => ({
            rol: contacto.rol,
            nombre: contacto.nombre || '',
            email: contacto.email ? String(contacto.email) : '',
            telefono1: contacto.telefono1 ? String(contacto.telefono1) : '',
            telefono2: contacto.telefono2 ? String(contacto.telefono2) : '',
            isEditing: false,
            contactId: contacto.contactId ? String(contacto.contactId) : (contacto.id ? String(contacto.id) : undefined),
            isPrincipal: contacto.isPrincipal || false
          }))
        )
      } else {
        setContactos(contactosPrincipales)
      }

      // Forzar la actualización del formulario
      trigger()
    }
  }, [open, initialData, resetForm, setValue, trigger, comunas])

  const onSubmit = async (data: FormValidateType) => {
    try {
      const encargadoObra = contactos[0];
      if (!encargadoObra?.nombre || !encargadoObra?.email || !encargadoObra?.telefono1) {
        toast.error('El contacto Encargado de Obra es obligatorio y debe tener nombre, email y teléfono');
        return;
      }
      for (const contacto of contactos) {
        if (!validateEmail(contacto.email)) {
          toast.error('Email inválido');
          return;
        }
        if (!validatePhone(contacto.telefono1)) {
          toast.error('Teléfono inválido');
          return;
        }
      }

      // Validar correos si existen
      if (data.correos && Array.isArray(data.correos)) {
        for (const correo of data.correos) {
          if (!validateEmail(correo)) {
            toast.error(`El correo ${correo} no es válido`);
            return;
          }
        }
      }

      if (!data.numeroObra) {
        data.numeroObra = lastObraNumber;
      }
      setIsSubmitting(true);
      const payload = {
        ...data,
        obraId: lastObraNumber,
        numeroObra: lastObraNumber,
        region: selectedRegion,
        comuna: selectedComuna,
        estado: 'activo',
        estadoObra: data.estadoObra || 'Activo',
        fechaIngreso: new Date(data.fechaIngreso).toISOString(),
        contactos: contactos.map(contacto => ({
          nombre: contacto.nombre,
          rol: contacto.rol,
          email: contacto.email,
          telefono1: contacto.telefono1,
          telefono2: contacto.telefono2,
          isPrincipal: contacto.isPrincipal || false
        })),
        correos: Array.isArray(data.correos) ? data.correos : []
      };
      const response = await axios.post('/api/obras', payload);
      if (response.data) {
        setData(prevData => [...prevData, response.data]);
        setFilteredData(prevData => [...prevData, response.data]);
        toast.success('Obra duplicada exitosamente', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff'
          }
        });
        resetForm();
        setContactos(contactosPrincipales);
        setValue('numeroObra', lastObraNumber);
        onClose();
      }
    } catch (error: any) {
      console.error('Error detallado:', error.response?.data || error);
      toast.error(error.response?.data?.error || 'Error al duplicar la obra', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegionChange = (event: SelectChangeEvent) => {
    setSelectedRegion(event.target.value);
    setValue('region', event.target.value);
    setSelectedComuna('');
  };

  const editarContacto = (index: number) => {
    setEditingContactIndex(index)
    const contacto = contactos[index]

    console.log('contacto', contacto)

    // Encontrar el rol correspondiente en CARGOS_OBRA
    const rolEncontrado = CARGOS_OBRA.find(r => r.value === contacto.rol)

    setEditingContact({
      rol: rolEncontrado?.value || contacto.rol || '',
      nombre: contacto.nombre || '',
      email: contacto.email || '',
      telefono1: contacto.telefono1 || '',
      telefono2: contacto.telefono2 || '',
      isEditing: true,
      contactId: contacto.contactId,
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
      rol: '',
      nombre: '',
      email: '',
      telefono1: '',
      telefono2: '',
      isEditing: true,
      isPrincipal: false
    })

    toast.success('Contacto actualizado exitosamente')
  }

  const handleCancelEdit = () => {
    setEditingContactIndex(null)
    setEditingContact({
      rol: '',
      nombre: '',
      email: '',
      telefono1: '',
      telefono2: '',
      isEditing: true,
      isPrincipal: false
    })
  }

  const eliminarContacto = (index: number) => {
    const updatedContactos = contactos.filter((_, i) => i !== index)
    setContactos(updatedContactos)
    toast.success('Contacto eliminado exitosamente')
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={() => {
        resetForm()
        setContactos(contactosPrincipales)
        setValue('numeroObra', lastObraNumber)
        onClose()
      }}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '75%', sm: '75%' } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Duplicar Obra</Typography>
        <IconButton size='small' onClick={() => {
          resetForm()
          setContactos(contactosPrincipales)
          setValue('numeroObra', lastObraNumber)
          onClose()
        }}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
          {/* Primera sección: 4-4-4 */}
          <Grid container spacing={5}>
              <Grid item xs={12} sm={4}>
                <Controller
                  name='numeroObra'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label='Número Obra' disabled value={lastObraNumber} />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
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

              <Grid item xs={12} sm={4}>
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

            {/* Segunda sección: 12 (Búsqueda de cliente) */}
            <Grid container spacing={5}>
              <Grid item xs={12}>
                <ClientSearch
                  value={selectedClient}
                  onClientSelect={cliente => {
                    // Campos básicos del cliente
                    setValue('rut', cliente.rut)
                    setValue('nombreCliente', cliente.nombreCliente)
                    setValue('razonSocial', cliente.razonSocial)
                    // Campos de facturación
                    setValue('giro', cliente.giro || '')
                    setValue('direccionComercial', cliente.direccionComercial || '')
                    const comunaCliente = (cliente.comunaFacturacion || '').trim()
                    const existe = comunas.some(c => c.nombre.trim().toLowerCase() === comunaCliente.toLowerCase())
                    if (!existe && comunaCliente) {
                      comunas.push({ id: 'custom', nombre: comunaCliente })
                    }
                    setValue('comunaFacturacion', comunaCliente)
                    setValue('listaPrecios', cliente.listaPrecios || '')
                    setValue('mailRecepcionFactura', cliente.mailRecepcionFactura || '')
                    setValue('telefono', cliente.telefono || '')
                    setValue('rutRepresentanteLegal', cliente.otroRut || '')
                    setValue('representanteLegal', cliente.representanteLegal || '')
                    trigger([
                      'rut',
                      'nombreCliente',
                      'razonSocial',
                      'giro',
                      'direccionComercial',
                      'comunaFacturacion',
                      'listaPrecios',
                      'mailRecepcionFactura',
                      'rutRepresentanteLegal',
                      'representanteLegal'
                    ])
                  }}
                />
              </Grid>
            </Grid>

            {/* Campos de cliente (solo lectura) */}
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
                      error={Boolean(errors.rut)}
                      helperText={errors.rut?.message}
                      InputProps={{
                        readOnly: true
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
                      InputProps={{
                        readOnly: true
                      }}
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
            </Grid>

            {/* Comuna, Sector, Georreferencia, Referencia: 3-3-3-3 */}
            <Grid container spacing={5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Comuna</InputLabel>
                  <Select
                    value={selectedComuna}
                    label='Comuna'
                    onChange={e => setSelectedComuna(e.target.value)}
                    disabled={!selectedRegion}
                  >
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
                  render={({ field }) => <TextField {...field} fullWidth label='Sector' />}
                />
              </Grid>
            </Grid>

            {/* Nueva fila para georreferencia y referencia */}
            <Grid container spacing={5} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='georreferencia'
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label='Georreferencia' />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name='referencia'
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label='Referencia' />}
                />
              </Grid>
            </Grid>

            {/* Mandante section */}
            <Grid container spacing={5} sx={{ mt: 2 }}>
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
                  render={({ field }) => <TextField {...field} fullWidth label='Texto Mandante' InputLabelProps={{ shrink: true }} />}
                />
              </Grid>
            </Grid>

            {/* Correos */}
            <Grid container spacing={5}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='correos'
                  control={control}
                  defaultValue={[]}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Enviar informes a:'
                      placeholder='correo1@ejemplo.com, correo2@ejemplo.com'
                      helperText='Separar múltiples correos con comas'
                      value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                      onChange={e => {
                        const correos = e.target.value
                          .split(',')
                          .map(correo => correo.trim())
                          .filter(correo => correo !== '')
                        field.onChange(correos)
                      }}
                      error={Boolean(errors.correos)}
                      helperText={errors.correos?.message || 'Separar múltiples correos con comas'}
                    />
                  )}
                />
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
                    // Verificar si el contacto ya existe
                    const exists = contactos.some(c => c.contactId === contact.contactId)

                    if (exists) {
                      toast.error('Este contacto ya está en la lista')

                      return
                    }

                    // Si es el primer contacto (Encargado de Obra)
                    if (contactos[0].nombre === '') {
                      const updatedContactos = [...contactos]

                      updatedContactos[0] = {
                        contactId: contact.contactId?.toString(),
                        rol: 'Encargado de Obra',
                        nombre: contact.nombre,
                        email: contact.email,
                        telefono1: contact.telefono1,
                        telefono2: contact.telefono2 || '',
                        isPrincipal: true,
                        isEditing: false
                      }
                      setContactos(updatedContactos)
                      toast.success('Encargado de Obra asignado exitosamente')
                    } else {
                      // Para contactos adicionales
                      const newContact: ContactoObraForm = {
                        contactId: contact.contactId?.toString(),
                        rol: contact.cargo || '',
                        nombre: contact.nombre,
                        email: contact.email,
                        telefono1: contact.telefono1,
                        telefono2: contact.telefono2 || '',
                        isPrincipal: false,
                        isEditing: false
                      }

                      setContactos([...contactos, newContact])
                      toast.success('Contacto agregado exitosamente')
                    }
                  }}
                />
              </Grid>
            </Grid>

            <TableContainer sx={{ mt: 2 }}>
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
                            {index === 0 && contacto.rol === 'encargado_obra' ? (
                              <TextField value='Encargado de Obra' fullWidth size='small' disabled />
                            ) : (
                              <FormControl fullWidth size='small'>
                                <Select
                                  value={editingContact.rol}
                                  onChange={e => setEditingContact({ ...editingContact, rol: e.target.value })}
                                >
                                  {CARGOS_OBRA.map(rol => (
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
                                const formatted = e.target.value.replace(/[^0-9+]/g, '')
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
                          <TableCell>{CARGOS_OBRA.find(r => r.value === contacto.rol)?.label || contacto.rol}</TableCell>
                          <TableCell>{contacto.nombre}</TableCell>
                          <TableCell>{contacto.email}</TableCell>
                          <TableCell>{contacto.telefono1}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton color='info' onClick={() => editarContacto(index)}>
                                <i className='ri-edit-line' />
                              </IconButton>
                              <IconButton color='error' onClick={() => eliminarContacto(index)}>
                                <i className='ri-delete-bin-line' />
                              </IconButton>
                              <IconButton
                                color={contacto.isPrincipal ? 'warning' : 'default'}
                                onClick={() => {
                                  const updatedContactos = contactos.map(c => ({
                                    ...c,
                                    isPrincipal: c.contactId === contacto.contactId ? !c.isPrincipal : false
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
              <Grid item xs={12}>
                <Typography variant='h5'>Facturación</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
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

              <Grid item xs={12} sm={6}>
                <Controller
                  name='giro'
                  control={control}
                  rules={{
                    required: 'El giro es requerido'
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
              <Grid item xs={12} sm={6}>
                <Controller
                  name='mailRecepcionFactura'
                  control={control}
                  rules={{
                    required: 'El email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Ingrese un correo electrónico válido'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Mail Recepción Factura *'
                      error={Boolean(errors.mailRecepcionFactura)}
                      helperText={errors.mailRecepcionFactura?.message}
                      placeholder='ejemplo@dominio.com'
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth error={Boolean(errors.comunaFacturacion)}>
                  <InputLabel>Comuna *</InputLabel>
                  <Controller
                    name='comunaFacturacion'
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select {...field} label='Comuna'>
                        {comunas.map(comuna => (
                          <MenuItem key={comuna.id} value={comuna.nombre}>
                            {comuna.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.comunaFacturacion && <FormHelperText>Este campo es obligatorio</FormHelperText>}
                </FormControl>
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
                        {listasPrecios.map(lista => (
                          <MenuItem key={lista.id} value={lista.id}>
                            {lista.nombre}
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
                  name='telefono'
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
                      error={Boolean(errors.telefono)}
                      helperText={errors.telefono?.message}
                      onChange={e => {
                        const formatted = formatPhone(e.target.value)

                        field.onChange(formatted)
                      }}
                      inputProps={{
                        inputMode: 'text'
                      }}
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Nueva fila para otroRut y representanteLegal */}
            <Grid container spacing={5}>
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
                <FormControlLabel
                  control={
                    <Controller
                      name='oc'
                      control={control}
                      render={({ field }) => <Checkbox {...field} checked={field.value || false} />}
                    />
                  }
                  label='OC'
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <FormControlLabel
                  control={
                    <Controller
                      name='envioInformes'
                      control={control}
                      render={({ field }) => <Checkbox {...field} checked={field.value || false} />}
                    />
                  }
                  label='Envío de Informes'
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name='otrasReferencias'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} fullWidth label='Otras Referencias' multiline rows={4} InputLabelProps={{ shrink: true }} value={field.value || ''} />
                  )}
                />
              </Grid>
            </Grid>
          {/* Botones de acción */}
          <div className='flex items-center gap-4 mt-5'>
            <Button variant='contained' type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Duplicando...' : 'Duplicar'}
            </Button>
            <Button variant='outlined' color='error' onClick={() => {
              resetForm()
              setContactos(contactosPrincipales)
              setValue('numeroObra', lastObraNumber)
              onClose()
            }} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default DuplicateWork 
