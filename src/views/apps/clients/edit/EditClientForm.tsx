// React Imports
import { useState, useEffect, useCallback } from 'react'

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
import { useUbicacion } from '@/hooks/useUbicacion'

type Props = {
  open: boolean
  handleClose: () => void
  userData?: Cliente[]
  setData: (data: Cliente[] | ((prevData: Cliente[]) => Cliente[])) => void
  currentUser: Cliente
}

const EditClientForm = ({ open, handleClose, userData, setData, currentUser }: Props): JSX.Element => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { regiones, comunas, selectedRegion, setSelectedRegion, loading } = useRegionesYComunas()
  const {
    regiones: ubicacionRegiones,
    comunas: ubicacionComunas,
    selectedRegion: ubicacionSelectedRegion,
    setSelectedRegion: setUbicacionSelectedRegion
  } = useUbicacion()

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

  // Agregar las funciones de validación al inicio del componente
  const formatRut = (value: string) => {
    // Eliminar todo excepto números y k
    let cleaned = value.replace(/[^0-9kK]/g, '')

    // Convertir 'k' minúscula a mayúscula
    cleaned = cleaned.toUpperCase()

    // Limitar el largo
    if (cleaned.length > 9) cleaned = cleaned.slice(0, 9)

    // Si no hay caracteres, retornar string vacío
    if (cleaned.length === 0) return ''

    // Separar dígito verificador
    const dv = cleaned.slice(-1)
    let digits = cleaned.slice(0, -1)

    // Agregar puntos
    if (digits.length > 3) {
      digits = digits.slice(0, -3) + '.' + digits.slice(-3)
    }

    if (digits.length > 7) {
      digits = digits.slice(0, -7) + '.' + digits.slice(-7)
    }

    // Retornar RUT formateado
    return `${digits}-${dv}`
  }

  const validateRut = (rut: string) => {
    try {
      if (!rut) return false

      let cleaned = rut.replace(/\./g, '').replace(/-/g, '')

      if (!/^[0-9]{7,9}[0-9Kk]$/.test(cleaned)) {
        return false
      }

      cleaned = cleaned.toUpperCase()
      const dv = cleaned.slice(-1)
      const rutBody = cleaned.slice(0, -1)

      if (isNaN(parseInt(rutBody))) {
        return false
      }

      let suma = 0
      let multiplicador = 2
      const rutReverso = rutBody.split('').reverse()

      for (let i = 0; i < rutReverso.length; i++) {
        suma += parseInt(rutReverso[i]) * multiplicador
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
      }

      const dvEsperado = 11 - (suma % 11)
      const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString()

      return dv === dvCalculado
    } catch (error) {
      console.error('Error validando RUT:', error)

      return false
    }
  }

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\s+/g, '').replace(/-/g, '')

    return /^\+?[0-9]+$/.test(cleanPhone)
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Agregar esta función al inicio del componente, junto con las otras funciones de validación
  const formatPhone = (value: string) => {
    // Eliminar todo excepto números y +
    let formatted = value.replace(/[^\d+]/g, '')

    // Asegurar que solo haya un + al inicio
    if (formatted.startsWith('+')) {
      formatted = '+' + formatted.substring(1).replace(/\+/g, '')
    }

    return formatted
  }

  // Modificar el useForm para incluir las validaciones
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    getValues
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: async values => {
      const errors: any = {}

      if (!validateRut(values.rut)) {
        errors.rut = {
          type: 'manual',
          message: 'RUT inválido. Formato: XX.XXX.XXX-X'
        }
      }

      if (values.telefono && !validatePhone(values.telefono)) {
        errors.telefono = {
          type: 'manual',
          message: 'Solo se permiten números y el signo + al inicio'
        }
      }

      return {
        values,
        errors
      }
    }
  })

  // Inicializar formData
  const [formData, setFormData] = useState({
    pais: currentUser?.pais || 'Chile'
  })

  // Modificar el estado inicial de contactos para que coincida con la estructura
  const [contactos, setContactos] = useState<Array<{ contacto: Contacto; isPrincipal: boolean; id?: string }>>(
    currentUser?.clientesContactos?.map(cc => ({
      contacto: {
        contactId: cc.contacto.contactId,
        nombre: cc.contacto.nombre,
        cargo: cc.contacto.cargo,
        email: cc.contacto.email,
        telefono1: cc.contacto.telefono1,
        telefono2: cc.contacto.telefono2 || ''
      },
      isPrincipal: cc.isPrincipal,
      id: cc.id
    })) || []
  )

  const [nuevoContacto, setNuevoContacto] = useState<Contacto>({
    nombre: '',
    cargo: '',
    email: '',
    telefono1: '',
    telefono2: ''
  })

  // Agregar estados para el manejo de contactos
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)

  const [editingContact, setEditingContact] = useState<Contacto>({
    nombre: '',
    cargo: '',
    email: '',
    telefono1: '',
    telefono2: ''
  })

  // Modificar la función handleEditClick
  const handleEditClick = (index: number) => {
    setEditingContactIndex(index)

    // Acceder correctamente a las propiedades del contacto
    const contactoActual = contactos[index].contacto

    setEditingContact({
      nombre: contactoActual.nombre,
      cargo: contactoActual.cargo,
      email: contactoActual.email,
      telefono1: contactoActual.telefono1,
      telefono2: contactoActual.telefono2
    })
  }

  // Modificar la función handleAddContacto
  const handleAddContacto = () => {
    if (nuevoContacto.nombre && nuevoContacto.email) {
      setContactos([
        ...contactos,
        {
          contacto: { ...nuevoContacto },
          isPrincipal: contactos.length === 0
        }
      ])
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

  const handleSaveEdit = async () => {
    if (!editingContact.nombre || !editingContact.email || !validateEmail(editingContact.email)) {
      toast.error('Por favor complete los campos requeridos correctamente')

      return
    }

    try {
      // Actualizar el contacto usando el nuevo endpoint PATCH
      const response = await axios.patch(`/api/clientes/${currentUser?.clienteId}/contactos`, {
        id: contactos[editingContactIndex].id,
        isPrincipal: contactos[editingContactIndex].isPrincipal,
        contacto: {
          contactId: contactos[editingContactIndex].contacto.contactId,
          nombre: editingContact.nombre,
          cargo: editingContact.cargo || '',
          email: editingContact.email,
          telefono1: editingContact.telefono1 || '',
          telefono2: editingContact.telefono2 || ''
        }
      })

      if (response.data) {
        // Actualizar el estado local
        const updatedContactos = [...contactos]

        updatedContactos[editingContactIndex] = {
          ...contactos[editingContactIndex],
          contacto: response.data
        }
        setContactos(updatedContactos)

        // Actualizar la UI
        setData(prevData =>
          prevData.map(cliente => {
            if (cliente.clienteId === currentUser?.clienteId) {
              return {
                ...cliente,
                clientesContactos: updatedContactos
              }
            }

            return cliente
          })
        )

        toast.success('Contacto actualizado exitosamente')
        setEditingContactIndex(null)
      }
    } catch (error) {
      console.error('Error al actualizar contacto:', error)
      toast.error('Error al actualizar contacto')
    }
  }

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const initializeForm = () => {
      if (!currentUser || !regiones.length || loading) return

      console.log('Datos actuales:', {
        currentUser,
        regiones,
        currentRegion: currentUser.region
      })

      // Buscar la región por código o nombre
      const regionActual = regiones.find(r => {
        // Intentar coincidir por código primero
        if (currentUser.region === r.codigo) return true

        // Si no coincide el código, intentar por nombre
        const regionNombre = r.nombre.toLowerCase().trim()
        const currentRegion = currentUser.region?.toLowerCase().trim()

        console.log('Comparando regiones:', {
          regionNombre,
          currentRegion,
          codigo: r.codigo
        })

        return regionNombre === currentRegion || r.codigo === currentRegion
      })

      console.log('Región encontrada:', regionActual)

      if (regionActual) {
        // Establecer la región seleccionada
        setSelectedRegion(regionActual.codigo)

        // Preparar los valores iniciales del formulario
        const formValues = {
          ...currentUser,
          region: regionActual.codigo
        }

        console.log('Estableciendo valores del formulario:', formValues)
        reset(formValues)
      }
    }

    initializeForm()
  }, [currentUser, regiones, loading])

  // Efecto separado para manejar la comuna
  useEffect(() => {
    if (!currentUser?.comuna || !selectedRegion || !comunas.length) return

    console.log('Buscando comuna:', {
      comunaActual: currentUser.comuna,
      comunasDisponibles: comunas.map(c => ({ id: c.id, nombre: c.nombre }))
    })

    // Buscar la comuna por ID o nombre
    const comunaActual = comunas.find(c => {
      // Intentar coincidir por ID primero
      if (currentUser.comuna === c.id.toString()) return true

      // Si no coincide el ID, intentar por nombre
      const comunaNombre = c.nombre.toLowerCase().trim()
      const currentComuna = currentUser.comuna?.toLowerCase().trim()

      console.log('Comparando comunas:', {
        comunaNombre,
        currentComuna,
        id: c.id
      })

      return comunaNombre === currentComuna || c.id.toString() === currentComuna
    })

    console.log('Comuna encontrada:', comunaActual)

    if (comunaActual) {
      setValue('comuna', comunaActual.id.toString())
    }
  }, [selectedRegion, comunas, currentUser?.comuna])

  // Manejador para cambios de región
  const handleRegionChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const newRegion = event.target.value

      console.log('Cambiando región a:', newRegion)

      setSelectedRegion(newRegion)
      setValue('region', newRegion)
      setValue('comuna', '') // Resetear comuna cuando cambia la región
    },
    [setSelectedRegion, setValue]
  )

  // Agregar la función onSubmit
  const onSubmit = async (data: FormValidateType) => {
    setIsSubmitting(true)

    try {
      const regionSeleccionada = regiones.find(r => r.codigo === selectedRegion)
      const comunaSeleccionada = comunas.find(c => c.id === parseInt(data.comuna))

      if (!comunaSeleccionada) {
        toast.error('Por favor seleccione una comuna válida')

        return
      }

      // Preparar solo los datos básicos del cliente
      const clienteData = {
        estado: data.estado,
        rut: data.rut,
        razonSocial: data.razonSocial,
        nombreCliente: data.nombreCliente,
        pais: formData.pais,
        region: regionSeleccionada?.codigo || '',
        ciudad: data.ciudad,
        comuna: comunaSeleccionada.id,
        direccion: data.direccion,
        telefono: data.telefono,
        sitioWeb: data.sitioWeb,
        segmento: data.segmento,
        industria: data.industria
      }

      // Primero actualizar los datos básicos del cliente
      const response = await axios.put(`/api/clientes/${currentUser?.clienteId}`, clienteData)

      if (response.data) {
        // Luego actualizar las condiciones comerciales
        await axios.put(`/api/clientes/${currentUser?.clienteId}/condiciones`, {
          vendedor: data.vendedor,
          condicionVenta: data.condicionVenta,
          observaciones: data.observaciones
        })

        // Actualizar la UI
        setData(prevData =>
          prevData.map(cliente => (cliente.clienteId === currentUser?.clienteId ? response.data : cliente))
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

  useEffect(() => {
    if (currentUser?.region) {
      setUbicacionSelectedRegion(currentUser.region)
    }
  }, [currentUser])

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
            xs: '90%', // En móviles
            sm: '80%', // En tablets
            md: '1000px' // En desktop, ancho fijo más grande
          }
        }
      }}
    >
      <Box sx={{ p: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
          <Typography variant='h5'>Editar Cliente</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
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
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label='ID Cliente (RUT)'
                      placeholder='12.345.678-9'
                      error={Boolean(errors.rut)}
                      helperText={errors.rut ? errors.rut.message : ''}
                      onChange={e => {
                        const formatted = formatRut(e.target.value)

                        field.onChange(formatted)
                      }}
                      inputProps={{
                        maxLength: 12
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
                    defaultValue=''
                    render={({ field }) => (
                      <Select {...field} label='Región' onChange={handleRegionChange} value={field.value || ''}>
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
                    defaultValue=''
                    render={({ field }) => (
                      <Select {...field} label='Comuna' value={field.value || ''} disabled={!selectedRegion}>
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
                        <TableCell sx={{ width: '20%' }}>NOMBRE</TableCell>
                        <TableCell sx={{ width: '15%' }}>CARGO</TableCell>
                        <TableCell sx={{ width: '25%' }}>EMAIL</TableCell>
                        <TableCell sx={{ width: '15%' }}>TELÉFONO 1</TableCell>
                        <TableCell sx={{ width: '15%' }}>TELÉFONO 2</TableCell>
                        <TableCell sx={{ width: '10%', minWidth: '120px' }}>ACCIÓN</TableCell>
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
                            error={nuevoContacto.email !== '' && !validateEmail(nuevoContacto.email)}
                            helperText={
                              nuevoContacto.email !== '' && !validateEmail(nuevoContacto.email) ? 'Email inválido' : ''
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            placeholder='Teléfono 1'
                            size='small'
                            fullWidth
                            value={nuevoContacto.telefono1}
                            onChange={e => {
                              const formatted = formatPhone(e.target.value)

                              setNuevoContacto({ ...nuevoContacto, telefono1: formatted })
                            }}
                            error={nuevoContacto.telefono1 !== '' && !validatePhone(nuevoContacto.telefono1)}
                            helperText={
                              nuevoContacto.telefono1 !== '' && !validatePhone(nuevoContacto.telefono1)
                                ? 'Solo números y + al inicio'
                                : ''
                            }
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
                        <TableRow key={contacto.id || index}>
                          {editingContactIndex === index ? (
                            // Modo edición
                            <>
                              <TableCell>
                                <TextField
                                  value={editingContact.nombre}
                                  onChange={e => setEditingContact({ ...editingContact, nombre: e.target.value })}
                                  placeholder='Nombre'
                                  fullWidth
                                  size='small'
                                  required
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  value={editingContact.cargo}
                                  onChange={e => setEditingContact({ ...editingContact, cargo: e.target.value })}
                                  placeholder='Cargo'
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
                                  required
                                  error={!validateEmail(editingContact.email)}
                                  helperText={!validateEmail(editingContact.email) ? 'Email inválido' : ''}
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
                                  error={editingContact.telefono1 !== '' && !validatePhone(editingContact.telefono1)}
                                  helperText={
                                    editingContact.telefono1 !== '' && !validatePhone(editingContact.telefono1)
                                      ? 'Solo números y + al inicio'
                                      : ''
                                  }
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
                              <TableCell sx={{ minWidth: '120px' }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton color='success' onClick={handleSaveEdit}>
                                    <i className='ri-check-line' />
                                  </IconButton>
                                  <IconButton color='error' onClick={handleCancelEdit}>
                                    <i className='ri-close-line' />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </>
                          ) : (
                            // Modo visualización
                            <>
                              <TableCell>{contacto.contacto.nombre}</TableCell>
                              <TableCell>{contacto.contacto.cargo}</TableCell>
                              <TableCell>{contacto.contacto.email}</TableCell>
                              <TableCell>{contacto.contacto.telefono1}</TableCell>
                              <TableCell>{contacto.contacto.telefono2}</TableCell>
                              <TableCell sx={{ minWidth: '120px' }}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton color='info' onClick={() => handleEditClick(index)}>
                                    <i className='ri-edit-line' />
                                  </IconButton>
                                  <IconButton color='error' onClick={() => handleDeleteContacto(index)}>
                                    <i className='ri-delete-bin-line' />
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
        )}
      </Box>
    </Drawer>
  )
}

export default EditClientForm
