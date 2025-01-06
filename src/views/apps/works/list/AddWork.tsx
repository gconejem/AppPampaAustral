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

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: initialFormData
  })

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

  const agregarContacto = () => {
    // Validar campos requeridos
    if (!nuevoContacto.rol || !nuevoContacto.nombre || !nuevoContacto.email || !nuevoContacto.telefono1) {
      toast.error('Todos los campos son requeridos')

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
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
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
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Número Obra *'
                    error={Boolean(errors.numeroObra)}
                    helperText={errors.numeroObra && 'Este campo es obligatorio'}
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
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='RUT *'
                    error={Boolean(errors.rut)}
                    helperText={errors.rut && 'Este campo es obligatorio'}
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
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={nuevoContacto.telefono1 || ''}
                      onChange={e => setNuevoContacto({ ...nuevoContacto, telefono1: e.target.value })}
                      placeholder='Teléfono'
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
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='RUT *'
                    error={Boolean(errors.rut)}
                    helperText={errors.rut && 'Este campo es obligatorio'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name='giro'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Giro *'
                    error={Boolean(errors.giro)}
                    helperText={errors.giro && 'Este campo es obligatorio'}
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
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Teléfono *'
                    error={Boolean(errors.telefonoFacturacion)}
                    helperText={errors.telefonoFacturacion && 'Este campo es obligatorio'}
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
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Mail Recepción Factura *'
                    error={Boolean(errors.mailRecepcionFactura)}
                    helperText={errors.mailRecepcionFactura && 'Este campo es obligatorio'}
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
