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
import Box from '@mui/material/Box'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'
import { toast } from 'react-hot-toast' // Para notificaciones

// Types Imports
import type { Cliente, FormValidateType, FormNonValidateType, Contacto } from '@/types/forms/cliente'

// Import data
import { PAISES, REGIONES_CHILE, SEGMENTOS, INDUSTRIAS, ESTADOS_CLIENTE, VENDEDORES } from '@/data/clientData'

// Import components
import ContactSearch from '../components/ContactSearch'
import { useUbicacion } from '@/hooks/useUbicacion'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: Cliente[]
  setData: (data: Cliente[] | ((prevData: Cliente[]) => Cliente[])) => void
}

// Modificar el initialFormData
export const initialFormData: FormNonValidateType = {
  region: '',
  city: '',
  commune: '',
  address: '',
  phone: '',
  website: '',
  segment: '',
  industry: '',
  pais: 'Chile', // Establecer Chile como valor por defecto
  vendedor: '',
  condicionVenta: '',
  observaciones: ''
}

// Agregar el enum de condiciones de venta junto a los otros enums
const CONDICIONES_VENTA = [
  { value: 'Contado', label: 'Contado' },
  { value: 'Credito30', label: 'Crédito 30 días' },
  { value: 'Credito60', label: 'Crédito 60 días' },
  { value: 'Otro', label: 'Otro' }
] as const

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

const AddClienteDrawer = (props: Props) => {
  // Props
  const { open, handleClose, userData, setData } = props

  // States
  const [formData, setFormData] = useState<FormNonValidateType>({
    ...initialFormData,
    pais: 'Chile', // Asegurar que Chile sea el valor por defecto
    condicionesVenta: 'Contado' // Valor por defecto
  })

  const [contactos, setContactos] = useState<Array<{ contacto: Contacto; isPrincipal: boolean }>>([])

  const [nuevoContacto, setNuevoContacto] = useState<Contacto>({
    nombre: '',
    cargo: '',
    email: '',
    telefono1: '',
    telefono2: ''
  })

  const { regiones, comunas, selectedRegion, setSelectedRegion } = useUbicacion()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchContactValue, setSearchContactValue] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Agregar estado para el modo edición
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)

  const [editingContact, setEditingContact] = useState<Contacto>({
    nombre: '',
    cargo: '',
    email: '',
    telefono1: '',
    telefono2: ''
  })

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

  // Función para formatear el RUT mientras se escribe
  const formatRut = (value: string) => {
    try {
      // Eliminar todo excepto números, k/K y guión
      let cleaned = value.replace(/[^0-9kK-]/g, '')

      // Si no hay caracteres válidos, retornar vacío
      if (!cleaned) return ''

      // Permitir escribir libremente hasta tener suficientes caracteres
      if (cleaned.length <= 8) return cleaned

      // Si ya tiene guión, separar cuerpo y dígito verificador
      if (cleaned.includes('-')) {
        const parts = cleaned.split('-')

        cleaned = parts[0] + (parts[1] ? parts[1].charAt(0) : '')
      }

      // Separar el cuerpo y el dígito verificador
      const body = cleaned.slice(0, -1)
      const dv = cleaned.slice(-1)

      // Formatear el cuerpo con puntos
      const reversedBody = body.split('').reverse().join('')
      const chunks = reversedBody.match(/.{1,3}/g) || []
      const formattedBody = chunks.join('.').split('').reverse().join('')

      // Convertir 'k' a 'K' si es el dígito verificador
      const digitoVerificador = dv.toUpperCase() === 'K' ? 'K' : dv

      return formattedBody + '-' + digitoVerificador
    } catch (error) {
      console.error('Error formateando RUT:', error)

      return value
    }
  }

  // Función para validar el RUT
  const validateRut = (rut: string) => {
    try {
      if (!rut) return false

      // Si está escribiendo, no validar aún
      if (rut.length < 3) return true

      // Limpiar el RUT de puntos y guión
      const cleaned = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase()

      // Validar que tenga el formato correcto (7-9 dígitos + dígito verificador)
      if (!/^[0-9]{7,9}[0-9K]$/.test(cleaned)) {
        return false
      }

      // Obtener dígito verificador y cuerpo del RUT
      const dv = cleaned.charAt(cleaned.length - 1)
      const rutBody = cleaned.slice(0, -1)
      const rutNumber = parseInt(rutBody)

      // Validar que el número del RUT esté en un rango válido
      if (rutNumber < 1000000) {
        return false
      }

      // Calcular dígito verificador
      let suma = 0
      let multiplicador = 2

      // Calcular suma ponderada
      for (let i = rutBody.length - 1; i >= 0; i--) {
        suma += parseInt(rutBody.charAt(i)) * multiplicador
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
      }

      // Calcular dígito verificador esperado
      const dvEsperado = 11 - (suma % 11)
      let dvCalculado = ''

      if (dvEsperado === 11) dvCalculado = '0'
      else if (dvEsperado === 10) dvCalculado = 'K'
      else dvCalculado = dvEsperado.toString()

      return dv === dvCalculado
    } catch (error) {
      console.error('Error validando RUT:', error)

      return false
    }
  }

  // Modificar la función validatePhone para ser más flexible
  const validatePhone = (phone: string) => {
    // Limpiar el teléfono de espacios y caracteres especiales
    const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '')

    // Validar que solo contenga números y el signo + al inicio (opcional)
    return /^\+?[0-9]+$/.test(cleanPhone)
  }

  // Modificar la función validateEmail para ser más flexible
  const validateEmail = (email: string) => {
    // Validación básica de email
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Agregar la función formatPhone después de validatePhone
  const formatPhone = (value: string) => {
    // Eliminar todo excepto números y el signo +
    return value.replace(/[^\d+]/g, '')
  }

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormValidateType>({
    defaultValues,
    mode: 'onChange',
    resolver: async values => {
      const errors: any = {}

      if (!values.rut || !validateRut(values.rut)) {
        errors.rut = {
          type: 'manual',
          message: 'RUT inválido. Formato: XX.XXX.XXX-X'
        }
      }

      // Validar teléfono si existe
      if (values.telefono) {
        console.log('Validando teléfono:', values.telefono)

        if (!validatePhone(values.telefono)) {
          errors.telefono = {
            type: 'manual',
            message: 'Solo se permiten números y el signo + al inicio'
          }
        }
      }

      return {
        values,
        errors
      }
    }
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
    } catch (error: any) {
      console.error('Error:', error)

      // Mostrar mensaje específico para RUT duplicado
      if (error.response?.data?.message?.includes('Ya existe un cliente con el RUT')) {
        toast.error('Ya existe un cliente registrado con este RUT')
      } else {
        toast.error('Error al crear el cliente')
      }
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

  // En el agregarContacto, validar antes de agregar
  const agregarContacto = () => {
    console.log('Validando contacto antes de agregar:', nuevoContacto)

    if (!nuevoContacto.nombre) {
      toast.error('El nombre es requerido')

      return
    }

    if (!validateEmail(nuevoContacto.email)) {
      toast.error('Email inválido')

      return
    }

    if (nuevoContacto.telefono1 && !validatePhone(nuevoContacto.telefono1)) {
      toast.error('Formato de teléfono 1 inválido')

      return
    }

    if (nuevoContacto.telefono2 && !validatePhone(nuevoContacto.telefono2)) {
      toast.error('Formato de teléfono 2 inválido')

      return
    }

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

  // Modificar handleRegionChange
  const handleRegionChange = (value: string) => {
    console.log('Cambiando región a:', value)
    console.log('REGIONES_CHILE[value]:', REGIONES_CHILE[value])

    setSelectedRegion(value) // Esto actualizará el estado en useUbicacion
    setValue('region', value)
    setValue('comuna', '')
  }

  // Modificar la función handleEditClick
  const handleEditClick = (index: number) => {
    setEditingContactIndex(index)

    // Corregir el acceso a las propiedades del contacto
    setEditingContact({
      nombre: contactos[index].contacto.nombre,
      cargo: contactos[index].contacto.cargo,
      email: contactos[index].contacto.email,
      telefono1: contactos[index].contacto.telefono1,
      telefono2: contactos[index].contacto.telefono2
    })
  }

  const handleCancelEdit = () => {
    setEditingContactIndex(null)
    setEditingContact({
      nombre: '',
      cargo: '',
      email: '',
      telefono1: '',
      telefono2: ''
    })
  }

  const handleSaveEdit = () => {
    if (editingContactIndex === null) return

    // Validar campos antes de guardar
    if (!editingContact.nombre || !editingContact.email || !validateEmail(editingContact.email)) {
      toast.error('Por favor complete los campos requeridos correctamente')

      return
    }

    const updatedContactos = [...contactos]

    // Actualizar manteniendo la estructura correcta
    updatedContactos[editingContactIndex] = {
      contacto: {
        nombre: editingContact.nombre,
        cargo: editingContact.cargo,
        email: editingContact.email,
        telefono1: editingContact.telefono1,
        telefono2: editingContact.telefono2
      },
      isPrincipal: contactos[editingContactIndex].isPrincipal
    }

    setContactos(updatedContactos)
    setEditingContactIndex(null)
    setEditingContact({
      nombre: '',
      cargo: '',
      email: '',
      telefono1: '',
      telefono2: ''
    })
  }

  const handleDeleteContacto = (index: number) => {
    const updatedContactos = contactos.filter((_, i) => i !== index)

    setContactos(updatedContactos)
  }

  // Función para manejar el copiado de razón social
  const handleCopyRazonSocial = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked

    if (isChecked) {
      // Obtener el valor actual de razón social
      const razonSocialValue = watch('razonSocial')

      // Establecer el valor en el campo cliente
      setValue('nombreCliente', razonSocialValue)
    }
  }

  // Modificar el handleChange para incluir condicionesVenta
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
                rules={{
                  required: true,
                  validate: {
                    validRut: value => validateRut(value) || 'RUT inválido. Formato: XX.XXX.XXX-X'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='RUT *'
                    onChange={e => {
                      const formatted = formatRut(e.target.value)

                      field.onChange(formatted)
                    }}
                    error={Boolean(errors.rut)}
                    helperText={errors.rut ? errors.rut.message : ''}
                    placeholder='12.345.678-9'
                    inputProps={{
                      maxLength: 15
                    }}
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
                    label='Razón Social *'
                    placeholder='...'
                    onChange={e => {
                      field.onChange(e)

                      if (document.querySelector<HTMLInputElement>('input[name="copySocialReason"]')?.checked) {
                        setValue('nombreCliente', e.target.value)
                      }
                    }}
                    {...(errors.razonSocial && { error: true, helperText: 'Este campo es requerido.' })}
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
                    label='Cliente *'
                    placeholder='...'
                    {...(errors.nombreCliente && { error: true, helperText: 'Este campo es requerido.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={<Checkbox name='copySocialReason' onChange={handleCopyRazonSocial} />}
                label='Copiar Razón Social'
              />
            </Grid>
          </Grid>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel id='country'>País *</InputLabel>
                <Select
                  fullWidth
                  id='country'
                  value={formData.pais}
                  onChange={e => setFormData({ ...formData, pais: e.target.value })}
                  label='País *'
                  labelId='country'
                  defaultValue='Chile'
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
                <InputLabel>Región *</InputLabel>
                <Select value={selectedRegion} onChange={e => handleRegionChange(e.target.value)} label='Región *'>
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
                <InputLabel>Comuna *</InputLabel>
                <Controller
                  name='comuna'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select {...field} label='Comuna *' disabled={!selectedRegion}>
                      <MenuItem value=''>Seleccione una comuna</MenuItem>
                      {comunas.map(comuna => (
                        <MenuItem key={comuna.id} value={comuna.nombre}>
                          {comuna.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
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
                    {...(errors.razonSocial && { error: true, helperText: 'This field is required.' })}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name='telefono'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono'
                    placeholder='+56912345678'
                    error={Boolean(errors.telefono)}
                    helperText={errors.telefono ? errors.telefono.message : ''}
                    onChange={e => {
                      const formatted = formatPhone(e.target.value)

                      field.onChange(formatted)
                    }}
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
                <InputLabel>Segmento</InputLabel>
                <Controller
                  name='segmento'
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label='Segmento'>
                      <MenuItem value='Corporativo Estratégico'>Corporativo Estratégico</MenuItem>
                      <MenuItem value='Consolidado'>Consolidado</MenuItem>
                      <MenuItem value='Expansión'>Expansión</MenuItem>
                      <MenuItem value='Ocasional'>Ocasional</MenuItem>
                      <MenuItem value='Nuevo prospecto'>Nuevo prospecto</MenuItem>
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
                  render={({ field }) => (
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
                    CARGO
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid  #E0E0E0', width: '200px' }}
                  >
                    NOMBRE
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
                    <FormControl fullWidth size='small'>
                      <Select
                        value={nuevoContacto.cargo}
                        onChange={e => setNuevoContacto({ ...nuevoContacto, cargo: e.target.value })}
                      >
                        {ROLES_CONTACTO.map(rol => (
                          <MenuItem key={rol.value} value={rol.value}>
                            {rol.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
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
                      onChange={e => {
                        const formatted = formatPhone(e.target.value)

                        setNuevoContacto({ ...nuevoContacto, telefono1: formatted })
                      }}
                      placeholder='Teléfono 1'
                      fullWidth
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.telefono2}
                      onChange={e => {
                        const formatted = formatPhone(e.target.value)

                        setNuevoContacto({ ...nuevoContacto, telefono2: formatted })
                      }}
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
                    {editingContactIndex === index ? (
                      // Modo edición
                      <>
                        <TableCell>
                          <FormControl fullWidth size='small'>
                            <Select
                              value={editingContact.cargo}
                              onChange={e => setEditingContact({ ...editingContact, cargo: e.target.value })}
                            >
                              {ROLES_CONTACTO.map(rol => (
                                <MenuItem key={rol.value} value={rol.value}>
                                  {rol.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={editingContact.nombre}
                            onChange={e => setEditingContact({ ...editingContact, nombre: e.target.value })}
                            placeholder='Nombre'
                            fullWidth
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={editingContact.email}
                            onChange={e => setEditingContact({ ...editingContact, email: e.target.value })}
                            placeholder='Email'
                            fullWidth
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={editingContact.telefono1}
                            onChange={e => {
                              const formatted = formatPhone(e.target.value)

                              setEditingContact({ ...editingContact, telefono1: formatted })
                            }}
                            placeholder='Teléfono 1'
                            fullWidth
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={editingContact.telefono2}
                            onChange={e => {
                              const formatted = formatPhone(e.target.value)

                              setEditingContact({ ...editingContact, telefono2: formatted })
                            }}
                            placeholder='Teléfono 2'
                            fullWidth
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton color='success' onClick={handleSaveEdit}>
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
                        <TableCell>
                          {ROLES_CONTACTO.find(r => r.value === contacto.contacto.cargo)?.label ||
                            contacto.contacto.cargo}
                        </TableCell>
                        <TableCell>{contacto.contacto.nombre}</TableCell>
                        <TableCell>{contacto.contacto.email}</TableCell>
                        <TableCell>{contacto.contacto.telefono1}</TableCell>
                        <TableCell>{contacto.contacto.telefono2}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton color='info' onClick={() => handleEditClick(index)}>
                              <i className='ri-edit-line' />
                            </IconButton>
                            <IconButton color='error' onClick={() => handleDeleteContacto(index)}>
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                            <IconButton
                              color={contacto.isPrincipal ? 'warning' : 'default'}
                              onClick={() => {
                                const updatedContactos = contactos.map((c, i) => ({
                                  ...c,
                                  isPrincipal: i === index ? !c.isPrincipal : false
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
              <FormControl fullWidth>
                <InputLabel id='condicionesVenta-label'>Condiciones de Venta</InputLabel>
                <Select
                  label='Condiciones de Venta'
                  value={formData.condicionVenta}
                  onChange={e => handleChange('condicionVenta', e.target.value)}
                  labelId='condicionesVenta-label'
                >
                  {CONDICIONES_VENTA.map(condicion => (
                    <MenuItem key={condicion.value} value={condicion.value}>
                      {condicion.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
