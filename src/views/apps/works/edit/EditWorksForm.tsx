// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
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

import ContactSearchObra from '../components/ContactSearchObra'
import { useRegionesYComunas } from '@/hooks/useRegionesYComunas'

// Types
import type { Obra, FormValidateType, ContactoObra } from '@/types/forms/obra'
import { initialFormData } from '@/types/forms/obra'

// Data
import { ESTADOS_OBRA, REGIONES_CHILE, COMUNAS } from '@/data/obraData'
import { formatRut, validateRut } from '@/utils/rut-utils'

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
  const [nuevoContacto, setNuevoContacto] = useState<Omit<ContactoObra, 'isPrincipal'>>({})
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedComuna, setSelectedComuna] = useState<string>('')
  const [comunasList, setComunasList] = useState<any[]>([])

  const { regiones, comunas } = useRegionesYComunas()

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormValidateType>({
    defaultValues: {
      numeroObra: '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      estado: 'activo',
      estadoObra: 'activo',
      nombreObra: '',
      direccion: '',
      region: '',
      comuna: '',
      telefono: '',
      sitioWeb: '',
      nombreCliente: '',
      rut: '',
      razonSocial: '',
      giro: '',
      direccionComercial: '',
      comunaFacturacion: '',
      telefonoFacturacion: '',
      listaPrecios: '',
      mailRecepcionFactura: ''
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
      }
    }
  })

  // Cargar datos iniciales
  useEffect(() => {
    if (obraData) {
      // Prellenar el formulario con los datos de la obra
      Object.keys(obraData).forEach(key => {
        setValue(key as any, obraData[key as keyof Obra])
      })

      // Establecer región y comuna
      setSelectedRegion(obraData.region || '')
      setSelectedComuna(obraData.comuna || '')
      setContactos(obraData.contactos || [])

      // Cargar las comunas de la región seleccionada
      if (obraData.region) {
        fetchComunas(obraData.region)
      }
    }
  }, [obraData])

  // Función para cargar comunas
  const fetchComunas = async (regionValue: string) => {
    try {
      const response = await fetch(`/api/ubicacion/comunas/${encodeURIComponent(regionValue)}`)

      if (!response.ok) {
        throw new Error('Error al cargar comunas')
      }

      const data = await response.json()

      setComunasList(data)
    } catch (error) {
      console.error('Error al cargar comunas:', error)
      toast.error('Error al cargar las comunas')
    }
  }

  // Manejador para el cambio de región
  const handleRegionChange = async (event: SelectChangeEvent<string>) => {
    const regionValue = event.target.value

    setSelectedRegion(regionValue)
    setSelectedComuna('')
    setValue('region', regionValue)
    setValue('comuna', '')

    if (regionValue) {
      await fetchComunas(regionValue)
    } else {
      setComunasList([])
    }
  }

  // Manejador para el cambio de comuna
  const handleComunaChange = (event: SelectChangeEvent<string>) => {
    const comunaValue = event.target.value

    setSelectedComuna(comunaValue)
    setValue('comuna', comunaValue)
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
    let cleaned = phone.replace(/\D/g, '')

    if (!cleaned.startsWith('56')) {
      cleaned = '56' + cleaned
    }

    cleaned = cleaned.slice(0, 11)

    return '+' + cleaned
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

  const onSubmit = async (data: FormValidateType) => {
    try {
      setIsSubmitting(true)
      const response = await axios.put(`/api/obras/${obraData?.obraId}`, data)

      if (response.status === 200) {
        toast.success('Obra actualizada exitosamente')
        handleClose()

        // Actualizar la lista
        setData(prevData => prevData.map(obra => (obra.obraId === obraData?.obraId ? response.data : obra)))
      }
    } catch (error) {
      console.error('Error updating obra:', error)
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

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '75%', sm: '75%' } } }}
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
            <Controller
              name='estado'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Estado' disabled value={field.value || 'activo'} />
              )}
            />
          </Grid>

          {/* Segunda fila: Nombre Obra y Dirección */}
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
        </Grid>

        {/* Antecedentes */}
        <Divider sx={{ my: 4 }} />
        <Grid container spacing={5}>
          <Grid item xs={12}>
            <Typography variant='h6'>Antecedentes</Typography>
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
                {comunasList.map(comuna => (
                  <MenuItem key={comuna.id} value={comuna.nombre}>
                    {comuna.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
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
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={Boolean(errors.estado)}>
              <InputLabel>Estado</InputLabel>
              <Controller
                name='estado'
                control={control}
                defaultValue={obraData?.estado}
                rules={{ required: true }}
                render={({ field: { value, ...field } }) => (
                  <Select label='Estado' value={value || ''} {...field}>
                    {ESTADOS_OBRA.map(estado => (
                      <MenuItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.estado && <FormHelperText>Este campo es requerido</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}></Grid>
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
            <Controller
              name='mandante'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Mandante' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
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
          <Grid item xs={12} sm={6}>
            <Controller
              name='textoMandante'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Texto Mandante' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
        </Grid>

        {/* Sección de Contactos */}
        <Divider sx={{ my: 4 }} />
        <Grid container alignItems='center' spacing={2}>
          <Grid item xs={6}>
            <Typography variant='h6'>Contactos</Typography>
          </Grid>
          <Grid item xs={6} container justifyContent='flex-end'>
            <ContactSearchObra onContactSelect={handleAddContact} />
          </Grid>
        </Grid>

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
              {contactos.length > 0 ? (
                contactos.map(contacto => (
                  <TableRow key={contacto.id}>
                    <TableCell>{contacto.nombre}</TableCell>
                    <TableCell>{contacto.cargo}</TableCell>
                    <TableCell>{contacto.email}</TableCell>
                    <TableCell>{contacto.telefono1}</TableCell>
                    <TableCell>{contacto.telefono2}</TableCell>
                    <TableCell>
                      <IconButton size='small' onClick={() => handleDeleteContact(contacto.id)}>
                        <i className='ri-delete-bin-line' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    No hay contactos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Sección de Requisitos */}
        <Divider sx={{ my: 4 }} />
        <Typography variant='h6'>Requisitos</Typography>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={4}>
            <Controller
              name='acreditacionPersonal'
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label='Acreditación de Personal'
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='especificacionesTecnicas'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Especificaciones Técnicas'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='acreditacionEquipos'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Acreditación Equipos'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='cartaCompromiso'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Carta Compromiso'
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name='mandatoServiu'
                  control={control}
                  render={({ field }) => <Checkbox {...field} checked={field.value} />}
                />
              }
              label='Mandato SERVIU'
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name='otrosRequisitos'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label='Otros Requisitos'
                  InputLabelProps={{ shrink: true }}
                />
              )}
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
                  value: /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/,
                  message: 'Solo se permiten letras'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Giro *'
                  onChange={handleFacturacionRutChange}
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
          <Grid item xs={12} sm={6}>
            <Controller
              name='listaPrecios'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='Lista de Precios' InputLabelProps={{ shrink: true }} />
              )}
            />
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
        <Typography variant='h6'>Referencias</Typography>
        <Grid container spacing={5}>
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12}>
            <Controller
              name='otrasReferencias'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label='Otras Referencias'
                  InputLabelProps={{ shrink: true }}
                />
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
