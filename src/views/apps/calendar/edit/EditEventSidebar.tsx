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
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import Autocomplete from '@mui/material/Autocomplete'
import EditIcon from '@mui/icons-material/Edit'

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
}

interface Servicio {
  id: number
  codigo: string
  nombre: string
}

interface Laboratorista {
  id: string
  name: string
}

interface Equipo {
  id: number
  codigo: string
  nombre: string
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

  // Estados para los datos de las listas desplegables
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])

  // Estados para los servicios
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [serviciosAgendados, setServiciosAgendados] = useState<ServicioAgendado[]>([])
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null)
  const [cantidad, setCantidad] = useState<string>('')
  const [observacion, setObservacion] = useState<string>('')
  const [esSegundaVisita, setEsSegundaVisita] = useState<boolean>(false)

  // Estados para laboratoristas
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
  const [laboratoristaSeleccionado, setLaboratoristaSeleccionado] = useState<Laboratorista | null>(null)
  const [laboratoristasAgendados, setLaboratoristasAgendados] = useState<LaboratoristaAgendado[]>([])

  // Estados para equipos
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [equiposAgendados, setEquiposAgendados] = useState<EquipoAgendado[]>([])

  // Agregar estado para comunas
  const [comunas, setComunas] = useState<string[]>([])

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

        // Cargar servicios disponibles
        const serviciosRes = await fetch('/api/agenda/servicios')
        const serviciosData = await serviciosRes.json()

        setServicios(serviciosData)

        // Cargar laboratoristas (usuarios con rol específico)
        const laboratoristasRes = await fetch('/api/users?role=laboratorista')
        const laboratoristasData = await laboratoristasRes.json()

        setLaboratoristas(laboratoristasData)

        // Cargar equipos disponibles
        const equiposRes = await fetch('/api/agenda/equipos')
        const equiposData = await equiposRes.json()

        setEquipos(equiposData)

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

      // Formatear fecha y hora a formato ISO para los inputs de tipo datetime-local
      const formatDate = (date: Date) => {
        return new Date(date).toISOString().slice(0, 16)
      }

      // Convertir servicios del formato del evento al formato del formulario
      const formattedServicios =
        selectedEvent.extendedProps?.servicios?.map((s: any) => ({
          codigo: s.codigo,
          servicio: s.nombre,
          cantidad: s.cantidad,
          observacion: s.observacion || '',
          esSegundaVisita: s.esSegundaVisita || false
        })) || []

      // Convertir laboratoristas del formato del evento al formato del formulario
      const formattedLaboratoristas =
        selectedEvent.extendedProps?.asignados?.map((a: any) => ({
          id: a.user.id,
          nombre: a.user.name,
          esPrincipal: a.esPrincipal
        })) || []

      // Convertir equipos del formato del evento al formato del formulario
      const formattedEquipos =
        selectedEvent.extendedProps?.equipos?.map((e: any) => ({
          id: e.equipo?.id,
          codigo: e.codigo,
          nombre: e.nombre,
          cantidad: e.cantidad,
          observacion: e.observacion || ''
        })) || []

      // Establecer estado inicial
      setEstado(selectedEvent.extendedProps?.estado || 'AGENDADA')

      // Establecer datos del formulario
      setFormData({
        titulo: selectedEvent.title,
        tipoVisita: selectedEvent.extendedProps?.tipoVisita || 'VISITA',
        esRecurrente: selectedEvent.extendedProps?.esRecurrente || false,
        fechaInicio: formatDate(selectedEvent.start),
        fechaFin: formatDate(selectedEvent.end),
        clienteId: selectedEvent.extendedProps?.cliente?.clienteId,
        obraId: selectedEvent.extendedProps?.obra?.obraId,
        solicitudId: selectedEvent.extendedProps?.solicitud?.id,
        sectorComercial: selectedEvent.extendedProps?.sector || '',
        region: selectedEvent.extendedProps?.region || '',
        comuna: selectedEvent.extendedProps?.comuna || '',
        direccion: selectedEvent.extendedProps?.direccion || '',
        referencia: selectedEvent.extendedProps?.referencia || '',
        observaciones: selectedEvent.extendedProps?.observaciones || '',
        servicios: [],
        laboratoristas: [],
        equipos: []
      })

      // Establecer servicios, laboratoristas y equipos agendados
      setServiciosAgendados(formattedServicios)
      setLaboratoristasAgendados(formattedLaboratoristas)
      setEquiposAgendados(formattedEquipos)
    }
  }, [selectedEvent, editEventSidebarOpen])

  // Efecto para cargar comunas cuando se selecciona una región
  useEffect(() => {
    const fetchComunas = async () => {
      if (formData.region) {
        try {
          const response = await fetch(`/api/comunas?region=${formData.region}`)
          const data = await response.json()

          setComunas(data.map((c: any) => c.nombre))
        } catch (error) {
          console.error('Error al cargar comunas:', error)
        }
      } else {
        setComunas([])
      }
    }

    fetchComunas()
  }, [formData.region])

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

  const handleAgregarServicio = () => {
    if (!servicioSeleccionado || !cantidad) return

    const nuevoServicio: ServicioAgendado = {
      codigo: servicioSeleccionado.codigo,
      servicio: servicioSeleccionado.nombre,
      cantidad: parseInt(cantidad),
      observacion: observacion,
      esSegundaVisita: esSegundaVisita
    }

    setServiciosAgendados(prev => [...prev, nuevoServicio])

    // Limpiar campos
    setServicioSeleccionado(null)
    setCantidad('')
    setObservacion('')
    setEsSegundaVisita(false)
  }

  const handleRemoverServicio = (index: number) => {
    setServiciosAgendados(prev => prev.filter((_, i) => i !== index))
  }

  const handleAgregarLaboratorista = () => {
    if (!laboratoristaSeleccionado) return

    // Verificar que no esté ya agregado
    const yaExiste = laboratoristasAgendados.some(lab => lab.id === laboratoristaSeleccionado.id)

    if (yaExiste) {
      alert('Este laboratorista ya ha sido agregado')

      return
    }

    const nuevoLaboratorista: LaboratoristaAgendado = {
      id: laboratoristaSeleccionado.id,
      nombre: laboratoristaSeleccionado.name
    }

    setLaboratoristasAgendados(prev => [...prev, nuevoLaboratorista])

    // Limpiar campo
    setLaboratoristaSeleccionado(null)
  }

  const handleRemoverLaboratorista = (index: number) => {
    setLaboratoristasAgendados(prev => prev.filter((_, i) => i !== index))
  }

  const handleAgregarEquipo = () => {
    if (!equipoSeleccionado) return

    // Verificar que no esté ya agregado
    const yaExiste = equiposAgendados.some(eq => eq.id === equipoSeleccionado.id)

    if (yaExiste) {
      alert('Este equipo ya ha sido agregado')

      return
    }

    const nuevoEquipo: EquipoAgendado = {
      id: equipoSeleccionado.id,
      codigo: equipoSeleccionado.codigo,
      nombre: equipoSeleccionado.nombre,
      cantidad: 1,
      observacion: ''
    }

    setEquiposAgendados(prev => [...prev, nuevoEquipo])

    // Limpiar campo
    setEquipoSeleccionado(null)
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

  return (
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
              <TextField
                fullWidth
                label='Fecha'
                type='date'
                value={formData.fechaInicio.split('T')[0]}
                onChange={e => {
                  const time = formData.fechaInicio.split('T')[1] || '00:00'

                  handleInputChange('fechaInicio', `${e.target.value}T${time}`)

                  // Si la fecha de término está vacía, usamos la misma fecha
                  if (!formData.fechaFin) {
                    handleInputChange('fechaFin', `${e.target.value}T00:00`)
                  }
                }}
                InputLabelProps={{
                  shrink: true
                }}
                required
              />
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
                  const date =
                    formData.fechaFin.split('T')[0] ||
                    formData.fechaInicio.split('T')[0] ||
                    new Date().toISOString().split('T')[0]

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
                getOptionLabel={option => `#${option.numeroSolicitud}`}
                value={solicitudes.find(s => s.id === formData.solicitudId) || null}
                onChange={(_, newValue) => handleInputChange('solicitudId', newValue?.id)}
                renderInput={params => <TextField {...params} label='Solicitud' />}
              />
            </Grid>

            {/* Sector Comercial */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Sector Comercial'
                value={formData.sectorComercial}
                onChange={e => handleInputChange('sectorComercial', e.target.value)}
                required
              />
            </Grid>

            {/* Región */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id='region-label'>Región</InputLabel>
                <Select
                  labelId='region-label'
                  value={formData.region}
                  onChange={e => handleInputChange('region', e.target.value)}
                  label='Región'
                >
                  <MenuItem value='Metropolitana'>Metropolitana</MenuItem>
                  <MenuItem value='Valparaíso'>Valparaíso</MenuItem>
                  <MenuItem value='Biobío'>Biobío</MenuItem>
                  <MenuItem value='Coquimbo'>Coquimbo</MenuItem>
                  <MenuItem value="O'Higgins">O&apos;Higgins</MenuItem>
                  <MenuItem value='Maule'>Maule</MenuItem>
                  <MenuItem value='Araucanía'>Araucanía</MenuItem>
                  <MenuItem value='Los Lagos'>Los Lagos</MenuItem>
                  <MenuItem value='Antofagasta'>Antofagasta</MenuItem>
                  <MenuItem value='Los Ríos'>Los Ríos</MenuItem>
                  <MenuItem value='Atacama'>Atacama</MenuItem>
                  <MenuItem value='Ñuble'>Ñuble</MenuItem>
                  <MenuItem value='Tarapacá'>Tarapacá</MenuItem>
                  <MenuItem value='Arica y Parinacota'>Arica y Parinacota</MenuItem>
                  <MenuItem value='Magallanes'>Magallanes</MenuItem>
                  <MenuItem value='Aysén'>Aysén</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Comuna */}
            <Grid item xs={12}>
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
                    <MenuItem key={comuna} value={comuna}>
                      {comuna}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Dirección */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Dirección'
                value={formData.direccion}
                onChange={e => handleInputChange('direccion', e.target.value)}
                required
              />
            </Grid>

            {/* Referencia */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Referencia'
                value={formData.referencia}
                onChange={e => handleInputChange('referencia', e.target.value)}
              />
            </Grid>

            {/* Sección de Servicios */}
            <Grid item xs={12}>
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                Servicios
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Autocomplete
                      options={servicios}
                      getOptionLabel={option => `${option.codigo} - ${option.nombre}`}
                      value={servicioSeleccionado}
                      onChange={(_, newValue) => setServicioSeleccionado(newValue)}
                      renderInput={params => <TextField {...params} label='Servicio' />}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label='Cant.'
                      type='number'
                      value={cantidad}
                      onChange={e => setCantidad(e.target.value)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant='contained'
                      fullWidth
                      onClick={handleAgregarServicio}
                      disabled={!servicioSeleccionado || !cantidad}
                      sx={{ height: '100%' }}
                    >
                      <AddIcon />
                    </Button>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label='Observación'
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  sx={{ mt: 2 }}
                />

                <FormControlLabel
                  control={<Checkbox checked={esSegundaVisita} onChange={e => setEsSegundaVisita(e.target.checked)} />}
                  label='Es segunda visita'
                />
              </Box>

              {serviciosAgendados.length > 0 ? (
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  {serviciosAgendados.map((servicio, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        mb: 1,
                        borderBottom: index < serviciosAgendados.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <Box>
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          {servicio.servicio}
                        </Typography>
                        <Typography variant='caption' color='textSecondary'>
                          Cant: {servicio.cantidad} {servicio.esSegundaVisita ? '(2da visita)' : ''}
                        </Typography>
                        {servicio.observacion && (
                          <Typography variant='caption' display='block' color='textSecondary'>
                            Obs: {servicio.observacion}
                          </Typography>
                        )}
                      </Box>
                      <IconButton size='small' onClick={() => handleRemoverServicio(index)}>
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                  <Typography variant='body2'>No hay servicios agregados</Typography>
                </Box>
              )}
            </Grid>

            {/* Sección de Laboratoristas */}
            <Grid item xs={12}>
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                Laboratoristas
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={9}>
                    <Autocomplete
                      options={laboratoristas}
                      getOptionLabel={option => option.name}
                      value={laboratoristaSeleccionado}
                      onChange={(_, newValue) => setLaboratoristaSeleccionado(newValue)}
                      renderInput={params => <TextField {...params} label='Laboratorista' />}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant='contained'
                      fullWidth
                      onClick={handleAgregarLaboratorista}
                      disabled={!laboratoristaSeleccionado}
                      sx={{ height: '100%' }}
                    >
                      <AddIcon />
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {laboratoristasAgendados.length > 0 ? (
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  {laboratoristasAgendados.map((laboratorista, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        mb: 1,
                        borderBottom: index < laboratoristasAgendados.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <Typography variant='body2'>{laboratorista.nombre}</Typography>
                      <IconButton size='small' onClick={() => handleRemoverLaboratorista(index)}>
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                  <Typography variant='body2'>No hay laboratoristas asignados</Typography>
                </Box>
              )}
            </Grid>

            {/* Sección de Equipos */}
            <Grid item xs={12}>
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 'bold' }}>
                Equipos
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={9}>
                    <Autocomplete
                      options={equipos}
                      getOptionLabel={option => `${option.codigo} - ${option.nombre}`}
                      value={equipoSeleccionado}
                      onChange={(_, newValue) => setEquipoSeleccionado(newValue)}
                      renderInput={params => <TextField {...params} label='Equipo' />}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant='contained'
                      fullWidth
                      onClick={handleAgregarEquipo}
                      disabled={!equipoSeleccionado}
                      sx={{ height: '100%' }}
                    >
                      <AddIcon />
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {equiposAgendados.length > 0 ? (
                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                  {equiposAgendados.map((equipo, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        mb: 1,
                        borderBottom: index < equiposAgendados.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <Box>
                        <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                          {equipo.nombre}
                        </Typography>
                        <Typography variant='caption' color='textSecondary'>
                          Cant: {equipo.cantidad}
                        </Typography>
                        {equipo.observacion && (
                          <Typography variant='caption' display='block' color='textSecondary'>
                            Obs: {equipo.observacion}
                          </Typography>
                        )}
                      </Box>
                      <IconButton size='small' onClick={() => handleRemoverEquipo(index)}>
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                  <Typography variant='body2'>No hay equipos asignados</Typography>
                </Box>
              )}
            </Grid>

            {/* Observaciones */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Observaciones'
                multiline
                rows={4}
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
      </Box>
    </Drawer>
  )
}

export default EditEventSidebar
