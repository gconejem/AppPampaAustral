import { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import DeleteIcon from '@mui/icons-material/Delete'
import Autocomplete from '@mui/material/Autocomplete'
import EditIcon from '@mui/icons-material/Edit'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { es } from 'date-fns/locale'
import ContactSearch from '@/views/apps/clients/components/ContactSearch'
import AddContact from '@/views/apps/contacts/list/AddContact'
import Divider from '@mui/material/Divider'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableBody from '@mui/material/TableBody'

// Hooks
import { useRegionesYComunas } from '@/hooks/useRegionesYComunas'

// Types
interface EditEventSidebarProps {
  editEventSidebarOpen: boolean
  handleEditEventSidebarToggle: () => void
  selectedEvent: any // El evento seleccionado para editar
}

interface FormData {
  titulo: string
  tipoVisita: string
  esRecurrente: boolean
  fechaInicio: string
  fechaFin: string
  clienteId?: number
  obraId?: number
  solicitudId?: number
  sectorComercial: string
  region: string
  comuna: string
  observaciones?: string
  direccion: string
  referencia?: string
  servicios: ServicioAgendado[]
  laboratoristas: LaboratoristaAgendado[]
  equipos: EquipoAgendado[]
}

interface ServicioAgendado {
  codigo: string
  servicio: string
  cantidad: number
  observacion?: string
  esSegundaVisita: boolean
  id?: number // ID para servicios ya existentes
}

interface LaboratoristaAgendado {
  id: string
  nombre: string
  email: string
  esPrincipal?: boolean
}

interface EquipoAgendado {
  id: number
  nombre: string
  codigo: string
  cantidad: number
  observacion?: string
}

// Interfaces para datos cargados
interface Cliente {
  clienteId: number
  razonSocial: string
}

interface Obra {
  obraId: number
  nombreObra: string
}

interface Solicitud {
  id: number
  numeroSolicitud: number
  cliente?: Cliente
  obra?: Obra
}

// Definir los roles de contacto igual que en AddEventSidebar
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

// Definir el tipo de contacto
interface ContactoAgendaForm {
  id?: string
  rol: string
  nombre: string
  email: string
  telefono1: string
  telefono2?: string
  isPrincipal: boolean
}

// Datos iniciales vacíos
const initialData: FormData = {
  titulo: '',
  tipoVisita: 'VISITA',
  esRecurrente: false,
  fechaInicio: '',
  fechaFin: '',
  sectorComercial: '',
  region: '',
  comuna: '',
  direccion: '',
  referencia: '',
  observaciones: '',
  servicios: [],
  laboratoristas: [],
  equipos: []
}

const EditEventSidebar = ({
  editEventSidebarOpen,
  handleEditEventSidebarToggle,
  selectedEvent
}: EditEventSidebarProps) => {
  const [formData, setFormData] = useState<FormData>(initialData)
  const [estado, setEstado] = useState('AGENDADA')
  const [editandoEstado, setEditandoEstado] = useState(false)
  const [selectedReferencia, setSelectedReferencia] = useState('')

  // Estados para los datos de las listas desplegables
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])

  // Estados para los servicios
  const [serviciosAgendados, setServiciosAgendados] = useState<ServicioAgendado[]>([])

  // Estados para laboratoristas
  const [laboratoristasAgendados, setLaboratoristasAgendados] = useState<LaboratoristaAgendado[]>([])

  // Estados para equipos
  const [equiposAgendados, setEquiposAgendados] = useState<EquipoAgendado[]>([])

  // Usar el hook de regiones y comunas
  const { regiones, comunas, setSelectedRegion } = useRegionesYComunas()

  // Estados para edición en línea de servicios
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [editingService, setEditingService] = useState<ServicioAgendado | null>(null)

  // Convertir las fechas string a objetos Date para los datepickers
  const [fechaInicio, setFechaInicio] = useState<Date | null>(() => {
    const d = formData.fechaInicio ? new Date(formData.fechaInicio) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [fechaFin, setFechaFin] = useState<Date | null>(() => {
    const d = formData.fechaFin ? new Date(formData.fechaFin) : new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Actualizar formData cuando cambien las fechas
  useEffect(() => {
    if (fechaInicio) {
      setFormData(prev => ({
        ...prev,
        fechaInicio: fechaInicio.toISOString()
      }))
    }
  }, [fechaInicio])

  useEffect(() => {
    if (fechaFin) {
      setFormData(prev => ({
        ...prev,
        fechaFin: fechaFin.toISOString()
      }))
    }
  }, [fechaFin])

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      console.log('Iniciando fetchData para edición...')

      try {
        // Cargar clientes
        const clientesRes = await fetch('/api/clientes')
        const clientesData = await clientesRes.json()

        setClientes(clientesData)

        // Cargar obras
        const obrasRes = await fetch('/api/obras')
        const obrasData = await obrasRes.json()

        setObras(obrasData)

        // Cargar solicitudes
        const solicitudesRes = await fetch('/api/requests')
        const solicitudesData = await solicitudesRes.json()

        setSolicitudes(solicitudesData)

        // Cargar laboratoristas (usuarios con rol específico)
        const laboratoristasRes = await fetch('/api/users?role=laboratorista')
        const laboratoristasData = await laboratoristasRes.json()

        const formattedLaboratoristas = laboratoristasData.map((lab: any) => ({
          id: lab.id,
          nombre: lab.name,
          email: lab.email,
          esPrincipal: false
        }))

        setLaboratoristasAgendados(formattedLaboratoristas)

        // Cargar equipos disponibles
        const equiposRes = await fetch('/api/agenda/equipos')
        const equiposData = await equiposRes.json()

        const formattedEquipos = equiposData.map((eq: any) => ({
          id: eq.id,
          codigo: eq.codigo,
          nombre: eq.nombre,
          cantidad: 1,
          observacion: ''
        }))

        setEquiposAgendados(formattedEquipos)

        console.log('Carga inicial de datos completada')
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error)
      }
    }

    fetchData()
  }, [])

  // Cargar datos del evento cuando esté disponible
  useEffect(() => {
    if (selectedEvent && editEventSidebarOpen) {
      console.log('Cargando datos del evento seleccionado:', selectedEvent)

      // Helper para obtener el valor desde el nivel principal o extendedProps
      const getValue = (field: string) =>
        selectedEvent[field] ?? selectedEvent.extendedProps?.[field] ?? ''

      // Formatear fecha y hora a formato ISO para los inputs de tipo datetime-local
      const formatDate = (date: any) => {
        if (!date) return ''
        const d = new Date(date)
        if (isNaN(d.getTime())) return ''
        return d.toISOString().slice(0, 16)
      }

      // Buscar referencia de la obra si no viene en el evento
      let referenciaFinal = getValue('referencia')
      if (!referenciaFinal && (selectedEvent.obra || selectedEvent.extendedProps?.obra)) {
        const obra = selectedEvent.obra || selectedEvent.extendedProps?.obra
        referenciaFinal = obra.referencia || ''
      }

      // Convertir servicios del formato del evento al formato del formulario
      const formattedServicios =
        (selectedEvent.servicios || selectedEvent.extendedProps?.servicios)?.map((s: any) => ({
          codigo: s.codigo,
          servicio: s.servicio || s.nombre,
          cantidad: s.cantidad,
          observacion: s.observacion || '',
          esSegundaVisita: s.esSegundaVisita || false
        })) || []

      // Convertir laboratoristas del formato del evento al formato del formulario
      const formattedLaboratoristas =
        (selectedEvent.asignados || selectedEvent.extendedProps?.asignados)?.map((a: any) => ({
          id: a?.userId || a?.id || a?.user?.id,
          nombre: a?.user?.name || a?.name || 'No especificado',
          email: a?.user?.email || a?.email || '',
          esPrincipal: a?.esPrincipal || false
        })) || []

      // Convertir equipos del formato del evento al formato del formulario
      const formattedEquipos =
        (selectedEvent.equipos || selectedEvent.extendedProps?.equipos)?.map((e: any) => ({
          id: e.equipo?.id || e.equipoId || e.id,
          codigo: e.equipo?.codigo || e.codigo || '',
          nombre: e.equipo?.nombre || e.nombre || '',
          cantidad: e.cantidad || 1,
          observacion: e.observacion || ''
        })) || []

      // Establecer estado inicial
      setEstado(getValue('estado') || 'AGENDADA')

      // Establecer la referencia seleccionada y en formData
      setSelectedReferencia(referenciaFinal)

      setFormData({
        titulo: getValue('titulo') || getValue('title'),
        tipoVisita: getValue('tipoVisita') || 'VISITA',
        esRecurrente: getValue('esRecurrente') || false,
        fechaInicio: formatDate(getValue('fechaInicio') || getValue('start')),
        fechaFin: formatDate(getValue('fechaFin') || getValue('end')),
        clienteId: getValue('clienteId') || getValue('cliente')?.id,
        obraId: getValue('obraId') || getValue('obra')?.id,
        solicitudId: getValue('solicitudId') || getValue('solicitud')?.id,
        sectorComercial: getValue('sectorComercial'),
        region: getValue('region'),
        comuna: getValue('comuna'),
        direccion: getValue('direccion'),
        referencia: referenciaFinal,
        observaciones: getValue('observaciones'),
        servicios: [],
        laboratoristas: [],
        equipos: []
      })

      // Establecer la región seleccionada para cargar las comunas
      if (getValue('region')) {
        setSelectedRegion(getValue('region'))
      }

      // Para debugging
      console.log('Cliente ID:', getValue('clienteId') || getValue('cliente')?.id)
      console.log('Obra ID:', getValue('obraId') || getValue('obra')?.id)
      console.log('Solicitud ID:', getValue('solicitudId') || getValue('solicitud')?.id)
      console.log('Referencia precargada:', referenciaFinal)

      // Establecer servicios, laboratoristas y equipos agendados
      setServiciosAgendados(formattedServicios)
      setLaboratoristasAgendados(formattedLaboratoristas)
      setEquiposAgendados(formattedEquipos)
    }
  }, [selectedEvent, editEventSidebarOpen])

  // Estado para contactos
  const [contactos, setContactos] = useState<ContactoAgendaForm[]>([])
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)
  const [editingContact, setEditingContact] = useState<ContactoAgendaForm>({
    rol: '', nombre: '', email: '', telefono1: '', telefono2: '', isPrincipal: false
  })
  const [addContactOpen, setAddContactOpen] = useState(false)

  // Cargar contactos del evento al abrir
  useEffect(() => {
    if (selectedEvent && editEventSidebarOpen) {
      const contactosEvento = selectedEvent.contactos || selectedEvent.extendedProps?.contactos || []
      setContactos(contactosEvento)
    }
  }, [selectedEvent, editEventSidebarOpen])

  const handleSubmit = async () => {
    try {
      // Validación detallada de campos requeridos
      const camposFaltantes = []

      if (!formData.fechaInicio) camposFaltantes.push('Fecha y Hora de Inicio')
      if (!formData.fechaFin) camposFaltantes.push('Fecha y Hora de Término')
      if (!formData.clienteId) camposFaltantes.push('Cliente')
      if (!formData.sectorComercial) camposFaltantes.push('Sector Comercial')
      if (!formData.region) camposFaltantes.push('Región')
      if (!formData.comuna) camposFaltantes.push('Comuna')
      if (!formData.direccion) camposFaltantes.push('Dirección')

      // Validar que haya al menos un servicio
      if (serviciosAgendados.length === 0) camposFaltantes.push('Al menos un Servicio')

      // Validar que haya al menos un laboratorista
      if (laboratoristasAgendados.length === 0) camposFaltantes.push('Al menos un Laboratorista')

      if (camposFaltantes.length > 0) {
        throw new Error(`Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`)
      }

      // Generar título automáticamente
      const cliente = clientes.find(c => c.clienteId === formData.clienteId)
      const serviciosPrincipales = serviciosAgendados.map(s => s.servicio).join(', ')
      const fechaFormateada = new Date(formData.fechaInicio).toLocaleDateString('es-ES')

      const tituloGenerado = `Visita ${cliente?.razonSocial} - ${serviciosPrincipales} (${fechaFormateada})`

      const visitaData = {
        ...formData,
        titulo: tituloGenerado, // Usar el título generado
        estado: estado,
        servicios: serviciosAgendados.map(servicio => ({
          ...servicio,
          id: parseInt(servicio.codigo)
        })),
        laboratoristas: laboratoristasAgendados,
        equipos: equiposAgendados
      }

      console.log('Datos completos a enviar para actualización:', visitaData)

      // Enviar la solicitud PUT para actualizar el evento
      const response = await fetch(`/api/agenda/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitaData)
      })

      if (!response.ok) {
        const error = await response.json()

        throw new Error(error.message || 'Error al actualizar la agenda')
      }

      // Cerrar sidebar y mostrar mensaje de éxito
      handleEditEventSidebarToggle()

      // Mostrar mensaje de éxito (se podría implementar un toast o snackbar)
      console.log('Visita actualizada exitosamente')
    } catch (error: any) {
      console.error('Error:', error)

      // Mostrar mensaje de error al usuario
      alert(error?.message || 'Error al actualizar la visita')
    }
  }

  const handleRemoverLaboratorista = (index: number) => {
    setLaboratoristasAgendados(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoverEquipo = (index: number) => {
    setEquiposAgendados(prev => prev.filter((_, i) => i !== index))
  }

  // Manejadores de cambio de datos
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  // Funciones de edición/eliminación de contactos
  const handleEditClick = (index: number) => {
    setEditingContactIndex(index)
    setEditingContact({ ...contactos[index] })
  }
  const handleSaveEdit = () => {
    if (editingContactIndex !== null) {
      const updatedContactos = contactos.map((contacto, index) =>
        index === editingContactIndex ? editingContact : contacto
      )
      setContactos(updatedContactos)
      setEditingContactIndex(null)
    }
  }
  const handleCancelEdit = () => setEditingContactIndex(null)
  const handleDeleteContacto = (index: number) => {
    const updatedContactos = contactos.filter((_, i) => i !== index)
    setContactos(updatedContactos)
  }
  const handleAddContact = (contact) => {
    if (!contact) return
    const newContact = {
      nombre: contact.nombre,
      rol: contact.rol || contact.cargo || '',
      email: contact.email,
      telefono1: contact.telefono1,
      telefono2: contact.telefono2,
      isPrincipal: contactos.length === 0
    }
    setContactos([...contactos, newContact])
  }

  return (
    <>
      <Drawer
        anchor='right'
        open={editEventSidebarOpen}
        onClose={handleEditEventSidebarToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: '80%',
            maxWidth: '100vw',
            padding: '16px',
            boxSizing: 'border-box'
          }
        }}
      >
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Grid container alignItems='center' justifyContent='space-between' spacing={2} sx={{ mb: 6 }}>
            <Grid item xs={9}>
              <Box display='flex' alignItems='center' gap={1}>
                <Typography variant='h5'>Editar Visita</Typography>
                <Typography variant='body2' color='textSecondary'>
                  * Campo obligatorio
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={2}>
              <Box display='flex' alignItems='center' gap={1}>
                <Typography variant='body2'>Estado</Typography>
                {editandoEstado ? (
                  <FormControl size='small'>
                    <Select
                      value={estado}
                      onChange={e => {
                        setEstado(e.target.value)
                        setEditandoEstado(false)
                      }}
                      autoFocus
                      onBlur={() => setEditandoEstado(false)}
                    >
                      <MenuItem value='AGENDADA'>Agendada</MenuItem>
                      <MenuItem value='COMPLETADA'>Completada</MenuItem>
                      <MenuItem value='SUSPENDIDA'>Suspendida</MenuItem>
                      <MenuItem value='CANCELADA'>Cancelada</MenuItem>
                      <MenuItem value='EN_PROCESO'>En Proceso</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <>
                    <Typography variant='body2'>{estado}</Typography>
                    <IconButton size='small' onClick={() => setEditandoEstado(true)}>
                      <EditIcon fontSize='small' />
                    </IconButton>
                  </>
                )}
              </Box>
            </Grid>

            <Grid item xs={1} display='flex' justifyContent='flex-end'>
              <Button variant='outlined' color='error' onClick={handleEditEventSidebarToggle}>
                Cancelar
              </Button>
            </Grid>
          </Grid>

          {/* Contenido del formulario */}
          <Box sx={{ flex: 1, overflowY: 'auto', pt: 2 }}>
            <Grid container spacing={3}>
              {/* Primera fila: Tipo/Recurrente, Fecha, Hora inicio, Hora término */}
              <Grid item xs={3}>
                <Box>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id='tipo-visita-label'>Tipo de Visita</InputLabel>
                    <Select
                      labelId='tipo-visita-label'
                      value={formData.tipoVisita}
                      onChange={e => handleInputChange('tipoVisita', e.target.value)}
                      label='Tipo de Visita'
                    >
                      <MenuItem value='VISITA'>Visita</MenuItem>
                      <MenuItem value='EVENTO'>Evento</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.esRecurrente}
                        onChange={e => handleInputChange('esRecurrente', e.target.checked)}
                      />
                    }
                    label='Es recurrente'
                  />
                </Box>
              </Grid>

              {/* Fecha */}
              <Grid item xs={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label='Fecha Inicio *'
                    value={fechaInicio}
                    onChange={newDate => {
                      if (newDate) {
                        setFechaInicio(newDate)
                        // Si la fecha de término está vacía, usamos la misma fecha
                        if (!fechaFin) {
                          const endDate = new Date(newDate)
                          endDate.setHours(newDate.getHours() + 1)
                          setFechaFin(endDate)
                        }
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Hora inicio */}
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label='Hora inicio'
                  type='time'
                  value={formData.fechaInicio.split('T')[1] || ''}
                  onChange={e => {
                    const date = formData.fechaInicio.split('T')[0] || new Date().toISOString().split('T')[0]
                    handleInputChange('fechaInicio', `${date}T${e.target.value}`)
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  required
                />
              </Grid>

              {/* Hora término */}
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label='Hora término'
                  type='time'
                  value={formData.fechaFin.split('T')[1] || ''}
                  onChange={e => {
                    const date = formData.fechaFin.split('T')[0] || formData.fechaInicio.split('T')[0] || new Date().toISOString().split('T')[0]
                    handleInputChange('fechaFin', `${date}T${e.target.value}`)
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                  required
                />
              </Grid>

              {/* Segunda fila: Cliente, Obra, Solicitud */}
              {/* Cliente */}
              <Grid item xs={4}>
                <Autocomplete
                  options={clientes}
                  getOptionLabel={option => option.razonSocial}
                  value={clientes.find(c => c.clienteId === formData.clienteId) || null}
                  onChange={(_, newValue) => handleInputChange('clienteId', newValue?.clienteId)}
                  renderInput={params => <TextField {...params} label='Cliente' required />}
                />
              </Grid>

              {/* Obra */}
              <Grid item xs={4}>
                <Autocomplete
                  options={obras}
                  getOptionLabel={option => option.nombreObra}
                  value={obras.find(o => o.obraId === formData.obraId) || null}
                  onChange={(_, newValue) => handleInputChange('obraId', newValue?.obraId)}
                  renderInput={params => <TextField {...params} label='Obra' />}
                />
              </Grid>

              {/* Solicitud */}
              <Grid item xs={4}>
                <Autocomplete
                  options={solicitudes}
                  getOptionLabel={option => {
                    const clienteInfo = option.cliente ? ` - ${option.cliente.razonSocial}` : ''
                    const obraInfo = option.obra ? ` - ${option.obra.nombreObra}` : ''

                    return `Solicitud #${option.numeroSolicitud}${clienteInfo}${obraInfo}`
                  }}
                  value={solicitudes.find(s => s.id === formData.solicitudId) || null}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setFormData(prev => ({
                        ...prev,
                        solicitudId: newValue.id,
                        clienteId: prev.clienteId || newValue.cliente?.clienteId,
                        obraId: prev.obraId || newValue.obra?.obraId
                      }))
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        solicitudId: undefined
                      }))
                    }
                  }}
                  renderInput={params => <TextField {...params} label='Solicitud' />}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant='body1'>Solicitud #{option.numeroSolicitud}</Typography>
                        {option.cliente && (
                          <Typography variant='caption' color='textSecondary'>
                            Cliente: {option.cliente.razonSocial}
                          </Typography>
                        )}
                        {option.obra && (
                          <Typography variant='caption' color='textSecondary' display='block'>
                            Obra: {option.obra.nombreObra}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              {/* Sector Comercial, Región y Comuna en la misma fila */}
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label='Sector Comercial'
                  value={formData.sectorComercial}
                  onChange={e => handleInputChange('sectorComercial', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth required>
                  <InputLabel id='region-label'>Región</InputLabel>
                  <Select
                    labelId='region-label'
                    value={formData.region}
                    onChange={e => {
                      handleInputChange('region', e.target.value)
                      setSelectedRegion(e.target.value)

                      // Limpiar comuna al cambiar región
                      handleInputChange('comuna', '')
                    }}
                    label='Región'
                  >
                    {regiones.map(region => (
                      <MenuItem key={region.id} value={region.nombre}>
                        {region.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth required>
                  <InputLabel id='comuna-label'>Comuna</InputLabel>
                  <Select
                    labelId='comuna-label'
                    value={formData.comuna}
                    onChange={e => handleInputChange('comuna', e.target.value)}
                    label='Comuna'
                    disabled={!formData.region}
                  >
                    {comunas.map(comuna => (
                      <MenuItem key={comuna.id} value={comuna.nombre}>
                        {comuna.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Dirección y Referencia en la misma fila 6-6 */}
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label='Dirección'
                    value={formData.direccion}
                    onChange={e => handleInputChange('direccion', e.target.value)}
                    required
                  />
                  <IconButton
                    size='small'
                    sx={{ ml: 1 }}
                    onClick={() => handleInputChange('referencia', formData.direccion)}
                    disabled={!formData.direccion}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label='Referencia'
                  value={selectedReferencia}
                  placeholder='Ej: Cerca del supermercado, Edificio azul, etc.'
                  onChange={e => {
                    setSelectedReferencia(e.target.value)
                    handleInputChange('referencia', e.target.value)
                  }}
                />
              </Grid>

              {/* Sección de Contactos */}
          <Divider sx={{ my: 4 }} />
          <Grid item xs={12}>
          <Grid container alignItems='center' spacing={2}>
            <Grid item xs={6}>
              <Button
                variant='contained'
                color='primary'
                onClick={() => setAddContactOpen(true)}
                startIcon={<i className='ri-add-line' />}
              >
                Nuevo Contacto
              </Button>
            </Grid>
            <Grid item xs={6}>
              <ContactSearch
                onContactSelect={contact => {
                  const newContact = {
                    nombre: contact.nombre,
                    rol: contact.rol || contact.cargo || '',
                    email: contact.email,
                    telefono1: contact.telefono1,
                    telefono2: contact.telefono2,
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
                  <TableCell sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}>CARGO</TableCell>
                  <TableCell sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}>NOMBRE</TableCell>
                  <TableCell sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}>EMAIL</TableCell>
                  <TableCell sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}>TELÉFONO 1</TableCell>
                  <TableCell sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0', width: '200px' }}>TELÉFONO 2</TableCell>
                  <TableCell sx={{ fontWeight: '500', textAlign: 'left', borderRight: '1px solid #E0E0E0' }}>ACCIÓN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contactos.map((contacto, index) => (
                  <TableRow key={index}>
                    {editingContactIndex === index ? (
                      <>
                        <TableCell>
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
                            onChange={e => setEditingContact({ ...editingContact, telefono1: e.target.value })}
                            placeholder='Teléfono 1'
                            fullWidth
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={editingContact.telefono2}
                            onChange={e => setEditingContact({ ...editingContact, telefono2: e.target.value })}
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
                          </Box>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{ROLES_CONTACTO.find(r => r.value === contacto.rol)?.label}</TableCell>
                        <TableCell>{contacto.nombre}</TableCell>
                        <TableCell>{contacto.email}</TableCell>
                        <TableCell>{contacto.telefono1}</TableCell>
                        <TableCell>{contacto.telefono2}</TableCell>
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
          </Grid>

              {/* Sección de Servicios */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                  Servicios
                </Typography>

                {/* Tabla de servicios */}
                <Box sx={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  <Grid container>
                    <Grid item xs={2}>
                      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                        CÓDIGO
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                        SERVICIOS
                      </Typography>
                    </Grid>
                    <Grid item xs={1}>
                      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                        CANT.
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                        DESCRIPCIÓN
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                        2DA VISITA
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant='body2' sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                        ACCIÓN
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {serviciosAgendados.length > 0 ? (
                  serviciosAgendados.map((servicio, index) => {
                    const isEditing = editingIndex === index
                    const tempData = editingService && editingIndex === index ? editingService : servicio

                    return (
                      <Grid
                        container
                        key={index}
                        sx={{ borderBottom: '1px solid #e0e0e0', padding: '8px 0', alignItems: 'center' }}
                      >
                        <Grid item xs={2}>
                          <Typography>{servicio.codigo}</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography>{servicio.servicio}</Typography>
                        </Grid>
                        <Grid item xs={1}>
                          {isEditing ? (
                            <TextField
                              size='small'
                              type='number'
                              value={tempData.cantidad}
                              onChange={e => {
                                const newService = { ...tempData, cantidad: parseInt(e.target.value) }

                                setEditingService(newService)
                              }}
                              inputProps={{ min: 1, style: { padding: '4px 8px' } }}
                              fullWidth
                            />
                          ) : (
                            <Typography>{servicio.cantidad}</Typography>
                          )}
                        </Grid>
                        <Grid item xs={3}>
                          {isEditing ? (
                            <TextField
                              size='small'
                              value={tempData.observacion || ''}
                              onChange={e => {
                                const newService = { ...tempData, observacion: e.target.value }

                                setEditingService(newService)
                              }}
                              fullWidth
                            />
                          ) : (
                            <Typography>{servicio.observacion}</Typography>
                          )}
                        </Grid>
                        <Grid item xs={2}>
                          {isEditing ? (
                            <Checkbox
                              checked={tempData.esSegundaVisita}
                              onChange={e => {
                                const newService = { ...tempData, esSegundaVisita: e.target.checked }

                                setEditingService(newService)
                              }}
                              size='small'
                            />
                          ) : (
                            <Typography>{servicio.esSegundaVisita ? 'Sí' : 'No'}</Typography>
                          )}
                        </Grid>
                        <Grid item xs={2}>
                          <Box display='flex' gap={1} justifyContent='center'>
                            {isEditing ? (
                              <>
                                <IconButton
                                  size='small'
                                  color='primary'
                                  onClick={() => {
                                    const updatedServices = [...serviciosAgendados]

                                    updatedServices[index] = editingService!
                                    setServiciosAgendados(updatedServices)
                                    setEditingIndex(-1)
                                    setEditingService(null)
                                  }}
                                >
                                  <SaveIcon fontSize='small' />
                                </IconButton>
                                <IconButton
                                  size='small'
                                  color='error'
                                  onClick={() => {
                                    setEditingIndex(-1)
                                    setEditingService(null)
                                  }}
                                >
                                  <CloseIcon fontSize='small' />
                                </IconButton>
                              </>
                            ) : (
                              <IconButton
                                size='small'
                                color='primary'
                                onClick={() => {
                                  setEditingIndex(index)
                                  setEditingService({ ...servicio })
                                }}
                              >
                                <EditIcon fontSize='small' />
                              </IconButton>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    )
                  })
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                    <Typography variant='body2'>No hay servicios agregados</Typography>
                  </Box>
                )}
              </Grid>

              {/* Sección de Laboratoristas y Equipos */}
              <Grid container item spacing={2} xs={12}>
                {/* Laboratoristas */}
                <Grid item xs={6}>
                  <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                    Laboratorista
                  </Typography>

                  {/* Tabla de laboratoristas */}
                  <Box sx={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                    <Grid container>
                      <Grid item xs={5}>
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          NOMBRE
                        </Typography>
                      </Grid>
                      <Grid item xs={5}>
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          EMAIL
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant='body2' sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                          ACCIÓN
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {laboratoristasAgendados.length > 0 ? (
                    laboratoristasAgendados.map((laboratorista, index) => (
                      <Grid
                        container
                        key={index}
                        sx={{
                          borderBottom: '1px solid #e0e0e0',
                          padding: '8px 4px',
                          alignItems: 'center',
                          '&:hover': {
                            backgroundColor: theme => theme.palette.action.hover
                          }
                        }}
                      >
                        <Grid item xs={5}>
                          <Typography variant='body2'>{laboratorista.nombre}</Typography>
                        </Grid>
                        <Grid item xs={5}>
                          <Typography variant='body2'>{laboratorista.email}</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Box display='flex' gap={1} justifyContent='center'>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => handleRemoverLaboratorista(index)}
                              sx={{
                                padding: '4px',
                                '&:hover': {
                                  backgroundColor: theme => theme.palette.error.light
                                }
                              }}
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                      <Typography variant='body2'>No hay laboratoristas asignados</Typography>
                    </Box>
                  )}
                </Grid>

                {/* Equipos */}
                <Grid item xs={6}>
                  <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                    Equipo
                  </Typography>

                  {/* Tabla de equipos */}
                  <Box sx={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                    <Grid container>
                      <Grid item xs={5}>
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          CÓDIGO
                        </Typography>
                      </Grid>
                      <Grid item xs={5}>
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          EQUIPO
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant='body2' sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                          ACCIÓN
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {equiposAgendados.length > 0 ? (
                    equiposAgendados.map((equipo, index) => (
                      <Grid
                        container
                        key={index}
                        sx={{
                          borderBottom: '1px solid #e0e0e0',
                          padding: '8px 4px',
                          alignItems: 'center',
                          '&:hover': {
                            backgroundColor: theme => theme.palette.action.hover
                          }
                        }}
                      >
                        <Grid item xs={5}>
                          <Typography variant='body2'>{equipo.codigo}</Typography>
                        </Grid>
                        <Grid item xs={5}>
                          <Typography variant='body2'>{equipo.nombre}</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Box display='flex' gap={1} justifyContent='center'>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => handleRemoverEquipo(index)}
                              sx={{
                                padding: '4px',
                                '&:hover': {
                                  backgroundColor: theme => theme.palette.error.light
                                }
                              }}
                            >
                              <DeleteIcon fontSize='small' />
                            </IconButton>
                          </Box>
                        </Grid>
                      </Grid>
                    ))
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                      <Typography variant='body2'>No hay equipos asignados</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>

              {/* Observaciones */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Observaciones'
                  value={formData.observaciones}
                  onChange={e => handleInputChange('observaciones', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Botón Actualizar */}
          <Grid container spacing={2} mt={2} mb={2}>
            <Grid item xs={12} display='flex' justifyContent='flex-start'>
              <Button variant='contained' color='primary' onClick={handleSubmit}>
                Actualizar Visita
              </Button>
            </Grid>
          </Grid>

          
          <AddContact
            open={addContactOpen}
            handleClose={() => setAddContactOpen(false)}
            onContactCreated={handleAddContact}
          />
        </Box>
      </Drawer>
    </>
  )
}

export default EditEventSidebar
