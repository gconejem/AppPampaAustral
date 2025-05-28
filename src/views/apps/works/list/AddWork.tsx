// React Imports
import { useState, useEffect } from 'react'

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

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-hot-toast'

// Utils Imports
import { validateRut, formatRut } from '@/utils/rut-utils'

// Types Imports
import type { Obra, FormValidateType } from '@/types/forms/obra'
import { initialFormData } from '@/types/forms/obra'
import type { ContactType } from '@/types/apps/contactTypes'

// Import data
import { ESTADOS_OBRA } from '@/data/obraData'
import ContactSearch from '@/views/apps/clients/components/ContactSearch'
import { useRegionesYComunas } from '@/hooks/useRegionesYComunas'
import ClientSearch from '@/views/apps/clients/components/ClientSearch'
import AddContact from '@/views/apps/contacts/list/AddContact'

// Agregar la constante para los cargos disponibles
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

type Props = {
  open: boolean
  handleClose: () => void
  userData?: Obra[]
  setData: (data: Obra[] | ((prevData: Obra[]) => Obra[])) => void
  setFilteredData: (data: Obra[] | ((prevData: Obra[]) => Obra[])) => void
}

// Agregar la función de formateo de teléfono
const formatPhone = (value: string) => {
  // Permitir solo números y el signo +
  let formatted = value.replace(/[^\d+]/g, '')

  // Asegurar que el + solo esté al inicio
  if (formatted.includes('+')) {
    formatted = '+' + formatted.replace(/\+/g, '')
  }

  return formatted
}

// Función de validación de teléfono
const validatePhone = (phone: string) => {
  const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '')

  return /^\+?[0-9]+$/.test(cleanPhone)
}

// Tipo para contactos de obra
interface ContactoObraForm {
  contacto: {
    nombre: string
    cargo: string
    email: string
    telefono1: string
    telefono2: string
    contactId?: string
  }
  cargo: string
  isPrincipal: boolean
}

const AddObraDrawer = (props: Props) => {
  const { open, handleClose: onClose, setData, setFilteredData } = props

  // Hooks - ahora useForm tiene acceso al schema
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    trigger
  } = useForm<FormValidateType>({
    defaultValues: {
      ...initialFormData,
      estado: 'activa',
      estadoObra: 'activa',
      fechaIngreso: new Date().toISOString().split('T')[0],
      mandante: 'No definido'
    },
    mode: 'onChange'
  })

  // States
  const contactoVacio: ContactoObraForm = {
    contacto: {
      nombre: '',
      cargo: 'encargado_obra',
      email: '',
      telefono1: '',
      telefono2: '',
      contactId: undefined
    },
    cargo: 'encargado_obra',
    isPrincipal: false
  };

  const [contactos, setContactos] = useState<ContactoObraForm[]>([contactoVacio]);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const [lastObraNumber, setLastObraNumber] = useState<string>('')
  const [listasPrecios, setListasPrecios] = useState<Array<{ value: string; label: string }>>([])
  const [addContactOpen, setAddContactOpen] = useState(false)
  const [refreshContactSearch, setRefreshContactSearch] = useState(0)

  const { regiones, comunas, selectedRegion, selectedComuna, setSelectedRegion, setSelectedComuna } =
    useRegionesYComunas()

  // Agregar useEffect para obtener el último número de obra
  useEffect(() => {
    const fetchLastObraNumber = async () => {
      try {
        const response = await axios.get('/api/obras')
        const obras: Obra[] = response.data

        if (obras && obras.length > 0) {
          // Encontrar el número más alto
          const maxNumber = Math.max(...obras.map(obra => parseInt(obra.numeroObra || '0')))
          const nextNumber = (maxNumber + 1).toString()

          setLastObraNumber(nextNumber)
          setValue('numeroObra', nextNumber)
        } else {
          // Si no hay obras, empezar desde 1
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

  // Cargar listas de precios
  useEffect(() => {
    const fetchListasPrecios = async () => {
      try {
        const response = await fetch('/api/listas-precios')
        if (!response.ok) throw new Error('Error al cargar las listas de precios')
        const data = await response.json()
        setListasPrecios(data.map((lista: any) => ({
          value: lista.id.toString(),
          label: lista.nombre
        })))
      } catch (error) {
        console.error('Error:', error)
        toast.error('Error al cargar las listas de precios')
      }
    }

    fetchListasPrecios()
  }, [])

  const onSubmit = async (data: FormValidateType) => {
    try {
      // Validar que el contacto Encargado de Obra esté completo
      const encargadoObra = contactos[0]

      if (!encargadoObra?.contacto.nombre || !encargadoObra?.contacto.email || !encargadoObra?.contacto.telefono1) {
        toast.error('El contacto Encargado de Obra es obligatorio y debe tener nombre, email y teléfono')
        return
      }

      // Validar contactos
      for (const contacto of contactos) {
        if (!validateEmail(contacto.contacto.email)) {
          toast.error('Email inválido')
          return
        }

        if (!validatePhone(contacto.contacto.telefono1)) {
          toast.error('Teléfono inválido')
          return
        }
      }

      // Validar correos si existen
      if (data.correos && Array.isArray(data.correos)) {
        for (const correo of data.correos) {
          if (!validateEmail(correo)) {
            toast.error(`El correo ${correo} no es válido`)
            return
          }
        }
      }

      setIsSubmitting(true)

      const payload = {
        ...data,
        numeroObra: lastObraNumber,
        region: selectedRegion,
        comuna: selectedComuna,
        estado: 'activo',
        estadoObra: data.estadoObra || 'Activa',
        fechaIngreso: new Date(data.fechaIngreso).toISOString(),
        mandante: data.mandante || 'No definido',
        telefonoFacturacion: data.telefono || '',
        rutRepresentanteLegal: data.rutRepresentanteLegal || '',
        representanteLegal: data.representanteLegal || '',
        contactos: contactos.map(contacto => ({
          nombre: contacto.contacto.nombre,
          rol: contacto.cargo,
          email: contacto.contacto.email,
          telefono1: contacto.contacto.telefono1,
          telefono2: contacto.contacto.telefono2,
          isPrincipal: contacto.isPrincipal || false
        })),
        correos: Array.isArray(data.correos) ? data.correos : []
      }

      console.log('Payload enviado:', payload) // Agregar log para debug

      const response = await axios.post('/api/obras', payload)

      if (response.data) {
        // Actualizar ambos estados inmediatamente
        props.setData(prevData => [...prevData, response.data])
        props.setFilteredData(prevData => [...prevData, response.data])

        toast.success('Obra creada exitosamente', {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10B981',
            color: '#fff'
          }
        })

        // Obtener el nuevo número de obra
        const newObraNumber = (parseInt(lastObraNumber) + 1).toString()
        setLastObraNumber(newObraNumber)

        // Limpiar formulario y estados
        resetForm()
        setContactos([contactoVacio])
        setValue('numeroObra', newObraNumber)
        setSelectedRegion('')
        setSelectedComuna('')
        setValue('region', '')
        setValue('comuna', '')
        setValue('georreferencia', '')
        setValue('mandante', 'No definido')
        setValue('textoMandante', '')
        setValue('otrasReferencias', '')
        setValue('otrosRequisitos', '')
        
        // Limpiar campos de facturación
        setValue('telefono', '')
        setValue('giro', '')
        setValue('direccionComercial', '')
        setValue('comunaFacturacion', '')
        setValue('listaPrecios', '')
        setValue('mailRecepcionFactura', '')
        setValue('rutRepresentanteLegal', '')
        setValue('representanteLegal', '')
        
        // Limpiar checkboxes
        setValue('acreditacionPersonal', false)
        setValue('especificacionesTecnicas', false)
        setValue('acreditacionEquipos', false)
        setValue('cartaCompromiso', false)
        setValue('mandatoServiu', false)
        setValue('estadoPago', false)
        setValue('hes', false)
        setValue('oc', false)
        setValue('envioInformes', false)

        props.handleClose()
      }
    } catch (error: any) {
      console.error('Error detallado:', error.response?.data || error)
      toast.error(error.response?.data?.error || 'Error al guardar la obra', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff'
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Limpiar el formulario antes de cerrar
    resetForm()
    setContactos([contactoVacio])
    setValue('numeroObra', lastObraNumber)
    setSelectedRegion('')
    setSelectedComuna('')
    setValue('region', '')
    setValue('comuna', '')
    setValue('georreferencia', '')
    setValue('mandante', 'No definido')
    setValue('textoMandante', '')
    setValue('otrasReferencias', '')
    setValue('otrosRequisitos', '')
    
    // Limpiar campos de facturación
    setValue('telefono', '')
    setValue('giro', '')
    setValue('direccionComercial', '')
    setValue('comunaFacturacion', '')
    setValue('listaPrecios', '')
    setValue('mailRecepcionFactura', '')
    setValue('rutRepresentanteLegal', '')
    setValue('representanteLegal', '')
    
    // Limpiar checkboxes
    setValue('acreditacionPersonal', false)
    setValue('especificacionesTecnicas', false)
    setValue('acreditacionEquipos', false)
    setValue('cartaCompromiso', false)
    setValue('mandatoServiu', false)
    setValue('estadoPago', false)
    setValue('hes', false)
    setValue('oc', false)
    setValue('envioInformes', false)

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

  const agregarContacto = () => {
    if (!editingContact.nombre || !editingContact.email || !editingContact.telefono1) {
      toast.error('Por favor complete los campos requeridos')

      return
    }

    setContactos(prevContactos => [...prevContactos, { ...editingContact, isPrincipal: false }])

    setEditingContact({
      nombre: '',
      cargo: '',
      email: '',
      telefono1: '',
      telefono2: '',
      contactId: undefined
    })

    toast.success('Contacto agregado exitosamente')
  }

  const eliminarContacto = (index: number) => {
    if (index === 0) {
      toast.error('No se puede eliminar el contacto Encargado de Obra')

      return
    }

    setContactos(prevContactos => prevContactos.filter((_, i) => i !== index))
  }

  const editarContacto = (index: number) => {
    if (index === 0) {
      toast.error('No se puede editar el contacto Encargado de Obra')

      return
    }

    setEditingContact({
      nombre: contactos[index].contacto.nombre || '',
      cargo: contactos[index].cargo || '',
      email: contactos[index].contacto.email || '',
      telefono1: contactos[index].contacto.telefono1 || '',
      telefono2: contactos[index].contacto.telefono2 || '',
      contactId: contactos[index].contacto.contactId
    })
  }

  const guardarEdicion = (index: number) => {
    if (!contactos[index].contacto.nombre || !contactos[index].contacto.email || !contactos[index].contacto.telefono1) {
      toast.error('Por favor complete los campos requeridos')

      return
    }

    const nuevosContactos = contactos.map((c, i) => (i === index ? { ...c, isPrincipal: false } : c))

    setContactos(nuevosContactos)
  }

  const marcarComoPrincipal = (index: number) => {
    const nuevosContactos = contactos.map((c, i) => ({
      ...c,
      isPrincipal: i === index
    }))

    setContactos(nuevosContactos)
  }

  const dummyObraData: FormValidateType = {
    // Datos básicos
    numeroObra: '0',
    fechaIngreso: '2024-03-15',
    estado: 'activo',
    estadoObra: 'activa',

    // Cliente
    rut: '23033067-0',
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
    envioInformes: true,
    otrasReferencias: 'Referencia adicional'
  } as const

  // Los contactos se manejan por separado
  const dummyContactos: ContactoObraForm[] = [
    {
      contacto: {
        nombre: 'Juan Pérez',
        cargo: 'encargado_obra',
        email: 'juan.perez@ejemplo.cl',
        telefono1: '+56 9 8765 4321',
        telefono2: '',
        contactId: undefined
      },
      cargo: 'encargado_obra',
      isPrincipal: true
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
      setValue('envioInformes', Boolean(dummyObraData.envioInformes))

      // Actualizar los estados locales
      setValue('numeroObra', dummyObraData.numeroObra)
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
    const value = e.target.value

    setValue('numeroObra', value)
  }

  const handleRegionChange = (event: SelectChangeEvent<string>) => {
    const regionValue = event.target.value

    setSelectedRegion(regionValue)
    setSelectedComuna('') // Resetear comuna cuando cambia la región
    setValue('region', regionValue)
    setValue('comuna', '')
    trigger('region') // Disparar validación
  }

  const handleComunaChange = (event: SelectChangeEvent<string>) => {
    const comunaValue = event.target.value

    setSelectedComuna(comunaValue)
    setValue('comuna', comunaValue)
    trigger('comuna') // Disparar validación
  }

  // Función para cancelar la edición
  const handleCancelEdit = () => {
    setEditingContact({
      nombre: '',
      cargo: '',
      email: '',
      telefono1: '',
      telefono2: '',
      contactId: undefined
    })
  }

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false)
  }

  const handleConfirmClose = () => {
    setOpenConfirmDialog(false)

    // Limpiar el formulario y todos los estados relacionados
    resetForm()
    setContactos([contactoVacio])
    setSelectedRegion('')
    setSelectedComuna('')
    setValue('numeroObra', lastObraNumber)

    // Llamar a la función handleClose proporcionada por las props
    props.handleClose()
  }

  const handleDrawerClose = () => {
    if (isDirty || contactos.some(c => c.contacto.nombre || c.contacto.email || c.contacto.telefono1)) {
      setOpenConfirmDialog(true)
    } else {
      handleClose()
    }
  }

  // Función para manejar el nuevo contacto creado
  const handleNewContact = (contact: ContactType) => {
    if (!contact) {
      toast.error('Error al crear el contacto');
      return;
    }

    if (!contactos[0] || !contactos[0].contacto || contactos[0].contacto.nombre === '') {
      const updatedContactos = [...contactos];
      updatedContactos[0] = {
        contacto: {
          nombre: contact.nombre || '',
          cargo: 'encargado_obra',
          email: contact.email || '',
          telefono1: contact.telefono1 || '',
          telefono2: contact.telefono2 || '',
          contactId: contact.contactId?.toString()
        },
        cargo: 'encargado_obra',
        isPrincipal: true
      };
      setContactos(updatedContactos);
      toast.success('Encargado de Obra asignado exitosamente');
    } else {
      const newContact = {
        contacto: {
          nombre: contact.nombre || '',
          cargo: contact.cargo || '',
          email: contact.email || '',
          telefono1: contact.telefono1 || '',
          telefono2: contact.telefono2 || '',
          contactId: contact.contactId?.toString()
        },
        cargo: contact.cargo || '',
        isPrincipal: false
      };
      setContactos(prevContactos => [...prevContactos, newContact]);
      toast.success('Contacto agregado exitosamente');
    }

    setRefreshContactSearch(prev => prev + 1);
    setAddContactOpen(false);
  }

  return (
    <>
      <Drawer
        open={open}
        anchor='right'
        variant='temporary'
        onClose={handleDrawerClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '75%', sm: '75%' } } }}
      >
        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography variant='h5'>Nueva Obra</Typography>
          <div className='flex gap-2'>
            <Button size='small' variant='outlined' onClick={handleLoadDummyData} sx={{ marginRight: 2 }}>
              Cargar Datos de Prueba
            </Button>
            <IconButton size='small' onClick={handleDrawerClose}>
              <i className='ri-close-line text-2xl' />
            </IconButton>
          </div>
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
                  onClientSelect={cliente => {
                    // Campos básicos del cliente
                    setValue('rut', cliente.rut)
                    setValue('nombreCliente', cliente.nombreCliente)
                    setValue('razonSocial', cliente.razonSocial)

                    // Campos de facturación
                    setValue('giro', cliente.giro || '')
                    setValue('direccionComercial', cliente.direccionComercial || '')
                    const comunaCliente = (cliente.comunaFacturacion || '').trim()

                    // Normaliza y busca si existe en la lista de comunas
                    const existe = comunas.some(c => c.nombre.trim().toLowerCase() === comunaCliente.toLowerCase())

                    if (!existe && comunaCliente) {
                      comunas.push({ id: 'custom', nombre: comunaCliente })
                    }

                    setValue('comunaFacturacion', comunaCliente)
                    setValue('listaPrecios', cliente.listaPrecios || '')
                    setValue('mailRecepcionFactura', cliente.mailRecepcionFactura || '')
                    setValue('telefono', cliente.telefono || '')

                    // Nuevos campos: rutRepresentanteLegal y representanteLegal
                    setValue('rutRepresentanteLegal', cliente.otroRut || '')
                    setValue('representanteLegal', cliente.representanteLegal || '')

                    // Disparar validación de todos los campos actualizados
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
              <Grid item xs={12} sm={12}>
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
                <FormControl fullWidth error={Boolean(errors.region)}>
                  <InputLabel>Región *</InputLabel>
                  <Controller
                    name='region'
                    control={control}
                    rules={{ required: 'La región es obligatoria' }}
                    render={({ field }) => (
                      <Select {...field} label='Región *' onChange={handleRegionChange}>
                        {regiones.map(region => (
                          <MenuItem key={region.id} value={region.nombre}>
                            {region.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.region && <FormHelperText>{errors.region.message}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>

            {/* Comuna, Sector, Georreferencia, Referencia: 3-3-3-3 */}
            <Grid container spacing={5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(errors.comuna)}>
                  <InputLabel>Comuna *</InputLabel>
                  <Controller
                    name='comuna'
                    control={control}
                    rules={{ required: 'La comuna es obligatoria' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label='Comuna *'
                        onChange={handleComunaChange}
                        disabled={!selectedRegion}
                      >
                        {comunas.map(comuna => (
                          <MenuItem key={comuna.id} value={comuna.nombre}>
                            {comuna.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.comuna && <FormHelperText>{errors.comuna.message}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name='sector'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='Sector *'
                      error={Boolean(errors.sector)}
                      helperText={errors.sector && 'Este campo es obligatorio'}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Nueva fila para georreferencia y referencia */}
            <Grid container spacing={5} >
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
            <Grid container spacing={5}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(errors.mandante)}>
                  <InputLabel>Mandante *</InputLabel>
                  <Controller
                    name='mandante'
                    control={control}
                    rules={{ required: true }}
                    defaultValue='No definido'
                    render={({ field }) => (
                      <Select {...field} label='Mandante *'>
                        {MANDANTES.map(mandante => (
                          <MenuItem key={mandante.value} value={mandante.value}>
                            {mandante.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.mandante && <FormHelperText>Este campo es obligatorio</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name='textoMandante'
                  control={control}
                  render={({ field }) => <TextField {...field} fullWidth label='Texto Mandante' />}
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
                          if (!contact) return;
                          // Si es el primer contacto (Encargado de Obra)
                          if (contactos[0].contacto.nombre === '') {
                            const updatedContactos = [...contactos]
                            updatedContactos[0] = {
                              contacto: {
                                nombre: contact.nombre || '',
                                cargo: 'encargado_obra',
                                email: contact.email || '',
                                telefono1: contact.telefono1 || '',
                                telefono2: contact.telefono2 || '',
                                contactId: contact.contactId?.toString()
                              },
                              cargo: 'encargado_obra',
                              isPrincipal: true
                            }
                            setContactos(updatedContactos)
                            toast.success('Encargado de Obra asignado exitosamente')
                          } else {
                            // Para contactos adicionales
                            const newContact = {
                              contacto: {
                                nombre: contact.nombre || '',
                                cargo: contact.cargo || '',
                                email: contact.email || '',
                                telefono1: contact.telefono1 || '',
                                telefono2: contact.telefono2 || '',
                                contactId: contact.contactId?.toString()
                              },
                              cargo: contact.cargo || '',
                              isPrincipal: false
                            }
                            setContactos(prevContactos => [...prevContactos, newContact])
                            toast.success('Contacto agregado exitosamente')
                          }
                        }}
                        refreshKey={refreshContactSearch}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#F5F5F5' }}>
                  <TableRow>
                    <TableCell
                      sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}
                    >
                      CARGO
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}
                    >
                      NOMBRE
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}
                    >
                      EMAIL
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}
                    >
                      TELÉFONO 1
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}
                    >
                      TELÉFONO 2
                    </TableCell>
                    <TableCell sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0' }}>
                      ACCIÓN
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contactos.map((contacto, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <FormControl fullWidth size='small'>
                          <Select
                            value={CARGOS_OBRA.find(cargo => cargo.label === contacto.cargo)?.value || contacto.cargo}
                            onChange={e => {
                              const updatedContactos = [...contactos]
                              updatedContactos[index] = {
                                ...contacto,
                                cargo: e.target.value
                              }
                              setContactos(updatedContactos)
                            }}
                            disabled={index === 0}
                          >
                            {CARGOS_OBRA.map(cargo => (
                              <MenuItem key={cargo.value} value={cargo.value}>
                                {cargo.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
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
                          placeholder='Seleccionar contacto'
                          fullWidth
                          size='small'
                          InputProps={{
                            readOnly: index === 0
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
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
                          placeholder='Email'
                          fullWidth
                          size='small'
                          InputProps={{
                            readOnly: index === 0
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={contacto.contacto.telefono1}
                          onChange={e => {
                            const formatted = formatPhone(e.target.value)
                            const updatedContactos = [...contactos]
                            updatedContactos[index] = {
                              ...contacto,
                              contacto: {
                                ...contacto.contacto,
                                telefono1: formatted
                              }
                            }
                            setContactos(updatedContactos)
                          }}
                          placeholder='Teléfono 1'
                          fullWidth
                          size='small'
                          InputProps={{
                            readOnly: index === 0
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={contacto.contacto.telefono2 || ''}
                          onChange={e => {
                            const formatted = formatPhone(e.target.value)
                            const updatedContactos = [...contactos]
                            updatedContactos[index] = {
                              ...contacto,
                              contacto: {
                                ...contacto.contacto,
                                telefono2: formatted
                              }
                            }
                            setContactos(updatedContactos)
                          }}
                          placeholder='Teléfono 2'
                          fullWidth
                          size='small'
                          InputProps={{
                            readOnly: index === 0
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center'>
                          <IconButton
                            onClick={() => {
                              const updatedContactos = contactos.map((c, i) => ({
                                ...c,
                                isPrincipal: i === index ? !c.isPrincipal : false
                              }))
                              setContactos(updatedContactos)
                            }}
                            color={contacto.isPrincipal ? 'primary' : 'default'}
                            sx={{ mr: 1 }}
                          >
                            <i className={`ri-star-${contacto.isPrincipal ? 'fill' : 'line'}`} />
                          </IconButton>
                          {index === 0 ? (
                            <IconButton
                              color='primary'
                              onClick={() => {
                                setContactos([contactoVacio, ...contactos.slice(1)])
                                toast.success('Puede seleccionar un nuevo Encargado de Obra')
                              }}
                            >
                              <i className='ri-refresh-line' />
                            </IconButton>
                          ) : (
                            <>
                              <IconButton color='info' onClick={() => editarContacto(index)} sx={{ mr: 1 }}>
                                <i className='ri-edit-line' />
                              </IconButton>
                              <IconButton color='error' onClick={() => eliminarContacto(index)}>
                                <i className='ri-delete-bin-line' />
                              </IconButton>
                            </>
                          )}
                        </div>
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
                      <TextField
                        {...field}
                        fullWidth
                        label='Comuna *'
                        error={Boolean(errors.comunaFacturacion)}
                        helperText={errors.comunaFacturacion && 'Este campo es obligatorio'}
                        InputProps={{
                          readOnly: true
                        }}
                      />
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
                        // Permitir solo números, k, K y el guión
                        const value = e.target.value.replace(/[^0-9kK-]/g, '')
                        // Formatear solo si hay suficientes caracteres
                        const formatted = value.length > 1 ? formatRut(value) : value
                        field.onChange(formatted)
                      }}
                      value={field.value || ''}
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
                    <TextField {...field} fullWidth label='Otras Referencias' multiline rows={4} />
                  )}
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

      {/* Agregar el componente AddContact */}
      <AddContact
        open={addContactOpen}
        handleClose={() => setAddContactOpen(false)}
        onContactCreated={handleNewContact}
      />

      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>¿Estás seguro de cerrar?</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Si cierras la ventana perderás todos los datos ingresados. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color='primary'>
            Cancelar
          </Button>
          <Button onClick={handleConfirmClose} color='error' autoFocus>
            Sí, cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AddObraDrawer
