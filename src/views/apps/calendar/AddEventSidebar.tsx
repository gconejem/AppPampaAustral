import { useState, useEffect } from 'react'

import { useTheme } from '@mui/material/styles'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import AddIcon from '@mui/icons-material/Add'
import StarIcon from '@mui/icons-material/Star'
import DeleteIcon from '@mui/icons-material/Delete'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import Autocomplete from '@mui/material/Autocomplete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

// Types
interface AddEventSidebarProps {
  addEventSidebarOpen: boolean
  handleAddEventSidebarToggle: () => void
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
  estado: string
}

interface Cliente {
  clienteId: number
  razonSocial: string
  rut: string
}

interface Obra {
  obraId: number
  nombreObra: string
  direccion: string
  clienteId: number
}

interface Solicitud {
  id: number
  numeroSolicitud: string
  cliente: {
    clienteId: number
    razonSocial: string
    rut: string
  }
  obra: {
    obraId: number
    nombreObra: string
  }
  estado: string
}

interface Servicio {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
}

interface ServicioAgendado {
  id?: number
  codigo: string
  servicio: string
  cantidad: number
  observacion?: string
  esSegundaVisita: boolean
}

interface Laboratorista {
  id: string
  nombre: string
  email: string
  rol: string
}

interface LaboratoristaAgendado {
  id: string
  nombre: string
  email: string
}

interface Equipo {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
}

interface EquipoAgendado {
  id: number
  codigo: string
  nombre: string
}

const initialData: FormData = {
  titulo: '',
  tipoVisita: '',
  esRecurrente: false,
  fechaInicio: '',
  fechaFin: '',
  sectorComercial: '',
  region: '',
  comuna: '',
  observaciones: '',
  direccion: '',
  referencia: '',
  servicios: [],
  laboratoristas: [],
  equipos: [],
  estado: 'AGENDADA'
}

const AddEventSidebar = ({ addEventSidebarOpen, handleAddEventSidebarToggle }: AddEventSidebarProps) => {
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
      console.log('Iniciando fetchData...')

      try {
        // Cargar clientes
        console.log('Intentando cargar clientes...')
        const clientesRes = await fetch('/api/clientes')

        console.log('Status de la respuesta de clientes:', clientesRes.status)
        const clientesData = await clientesRes.json()

        console.log('Datos de clientes recibidos:', clientesData)

        setClientes(clientesData)
        console.log('Clientes guardados en el estado:', clientesData)

        // Cargar obras
        const obrasRes = await fetch('/api/obras')
        const obrasData = await obrasRes.json()

        setObras(obrasData)

        // Cargar solicitudes
        console.log('Intentando cargar solicitudes...')
        const solicitudesRes = await fetch('/api/requests')

        console.log('Status de la respuesta:', solicitudesRes.status)

        const solicitudesData = await solicitudesRes.json()

        console.log('Datos crudos de solicitudes:', solicitudesData)

        if (Array.isArray(solicitudesData)) {
          console.log('Número de solicitudes:', solicitudesData.length)
          setSolicitudes(solicitudesData)
        } else {
          console.error('Los datos no son un array:', solicitudesData)
        }
      } catch (error) {
        console.error('Error detallado al cargar datos:', error)
      }
    }

    if (addEventSidebarOpen) {
      console.log('Drawer abierto, ejecutando fetchData...')
      fetchData()
    }
  }, [addEventSidebarOpen])

  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const response = await fetch('/api/agenda/servicios')
        const data = await response.json()

        setServicios(data)
      } catch (error) {
        console.error('Error cargando servicios:', error)
      }
    }

    fetchServicios()
  }, [])

  useEffect(() => {
    const fetchLaboratoristas = async () => {
      try {
        const response = await fetch('/api/users/laboratoristas')
        const data = await response.json()

        setLaboratoristas(data)
      } catch (error) {
        console.error('Error cargando laboratoristas:', error)
      }
    }

    fetchLaboratoristas()
  }, [])

  useEffect(() => {
    const fetchEquipos = async () => {
      try {
        console.log('Iniciando carga de equipos...')
        const response = await fetch('/api/agenda/equipos')
        const data = await response.json()

        console.log('Equipos cargados:', data)

        setEquipos(data)
      } catch (error) {
        console.error('Error cargando equipos:', error)
      }
    }

    fetchEquipos()
  }, [])

  console.log('Estado actual de equipos:', equipos)

  // Agregar efecto para cargar comunas cuando cambia la región
  useEffect(() => {
    const fetchComunas = async () => {
      if (!formData.region) {
        setComunas([])

        return
      }

      try {
        const response = await fetch(`/api/comunas/${formData.region}`)
        const data = await response.json()

        setComunas(data)
      } catch (error) {
        console.error('Error cargando comunas:', error)
        setComunas([])
      }
    }

    fetchComunas()
  }, [formData.region])

  const handleSubmit = async () => {
    try {
      // Validación detallada de campos requeridos
      const camposFaltantes = []

      // Remover validación de título ya que se generará automáticamente
      // if (!formData.titulo) camposFaltantes.push('Título')
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
        estado: 'AGENDADA',
        servicios: serviciosAgendados.map(servicio => ({
          ...servicio,
          id: parseInt(servicio.codigo)
        })),
        laboratoristas: laboratoristasAgendados,
        equipos: equiposAgendados
      }

      console.log('Datos completos a enviar:', visitaData)

      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitaData)
      })

      if (!response.ok) {
        const error = await response.json()

        throw new Error(error.message || 'Error al crear la agenda')
      }

      // Limpiar formulario
      handleAddEventSidebarToggle()
      setFormData(initialData)
      setServiciosAgendados([])
      setLaboratoristasAgendados([])
      setEquiposAgendados([])

      // Mostrar mensaje de éxito (puedes usar un toast o snackbar)
      console.log('Visita creada exitosamente')
    } catch (error: any) {
      console.error('Error:', error)

      // Mostrar mensaje de error al usuario
      alert(error?.message || 'Error al crear la visita')
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

  const handleAgregarLaboratorista = () => {
    if (!laboratoristaSeleccionado) return

    const nuevoLaboratorista: LaboratoristaAgendado = {
      id: laboratoristaSeleccionado.id,
      nombre: laboratoristaSeleccionado.nombre,
      email: laboratoristaSeleccionado.email
    }

    setLaboratoristasAgendados(prev => [...prev, nuevoLaboratorista])
    setLaboratoristaSeleccionado(null)
  }

  const handleAgregarEquipo = () => {
    if (!equipoSeleccionado) return

    const nuevoEquipo: EquipoAgendado = {
      id: equipoSeleccionado.id,
      codigo: equipoSeleccionado.codigo,
      nombre: equipoSeleccionado.nombre
    }

    setEquiposAgendados(prev => [...prev, nuevoEquipo])
    setEquipoSeleccionado(null)
  }

  const theme = useTheme()

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleAddEventSidebarToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: '80%',
          maxWidth: '100vw',
          padding: '16px',
          boxSizing: 'border-box'
        }
      }}
    >
      <Box sx={{ width: '100%', padding: '16px', boxSizing: 'border-box' }}>
        {/* Header */}
        <Grid container alignItems='center' justifyContent='space-between' spacing={2}>
          <Grid item xs={9}>
            <Box display='flex' alignItems='center' gap={1}>
              <Typography variant='h5'>Agendar Una Visita</Typography>
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
            <Button variant='outlined' color='error' onClick={handleAddEventSidebarToggle}>
              Cancelar
            </Button>
          </Grid>
        </Grid>

        {/* Primera fila con tipo de visita y fechas */}
        <Grid container spacing={2} mt={4}>
          {/* Tipo de visita with checkboxes */}
          <Grid item xs={3}>
            <Box display='flex' alignItems='center'>
              <Typography sx={{ mr: 2 }}>Tipo de:</Typography>
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.tipoVisita === 'EVENTO'}
                      onChange={e => setFormData({ ...formData, tipoVisita: e.target.checked ? 'EVENTO' : '' })}
                      size='small'
                    />
                  }
                  label='Evento'
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.esRecurrente}
                      onChange={e => setFormData({ ...formData, esRecurrente: e.target.checked })}
                      size='small'
                    />
                  }
                  label='Recurrente'
                />
              </Box>
            </Box>
          </Grid>

          {/* Fecha */}
          <Grid item xs={3}>
            <TextField
              fullWidth
              type='date'
              label='Fecha'
              InputLabelProps={{ shrink: true }}
              value={formData.fechaInicio.split('T')[0]}
              onChange={e => {
                const fecha = e.target.value

                setFormData({
                  ...formData,
                  fechaInicio: `${fecha}T${formData.fechaInicio.split('T')[1] || '00:00'}`
                })
              }}
            />
          </Grid>

          {/* Hora Inicio */}
          <Grid item xs={3}>
            <TextField
              fullWidth
              type='time'
              label='Hora Inicio'
              InputLabelProps={{ shrink: true }}
              value={formData.fechaInicio.split('T')[1]?.slice(0, 5) || ''}
              onChange={e => {
                const hora = e.target.value
                const fecha = formData.fechaInicio.split('T')[0] || new Date().toISOString().split('T')[0]

                setFormData({
                  ...formData,
                  fechaInicio: `${fecha}T${hora}`
                })
              }}
            />
          </Grid>

          {/* Hora Término */}
          <Grid item xs={3}>
            <TextField
              fullWidth
              type='time'
              label='Hora Término'
              InputLabelProps={{ shrink: true }}
              value={formData.fechaFin.split('T')[1]?.slice(0, 5) || ''}
              onChange={e => {
                const hora = e.target.value
                const fecha = formData.fechaFin.split('T')[0] || formData.fechaInicio.split('T')[0]

                setFormData({
                  ...formData,
                  fechaFin: `${fecha}T${hora}`
                })
              }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} mt={2}>
          {/* Cliente */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              fullWidth
              options={clientes}
              getOptionLabel={option => `${option.razonSocial} (${option.rut})`}
              value={clientes.find(c => c.clienteId === formData.clienteId) || null}
              onChange={(_, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  clienteId: newValue?.clienteId
                }))
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Cliente *'
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>

          {/* Obra */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              fullWidth
              options={obras}
              getOptionLabel={option => `${option.nombreObra}`}
              value={obras.find(o => o.obraId === formData.obraId) || null}
              onChange={(_, newValue) => {
                setFormData(prev => ({
                  ...prev,
                  obraId: newValue?.obraId || undefined,
                  direccion: newValue?.direccion || ''
                }))
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Obra'
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant='body1'>{option.nombreObra}</Typography>
                    <Typography variant='caption' color='textSecondary'>
                      Dirección: {option.direccion}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Grid>

          {/* Solicitud */}
          <Grid item xs={12} sm={4}>
            <Autocomplete
              fullWidth
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
              renderInput={params => (
                <TextField
                  {...params}
                  label='Solicitud'
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              )}
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
        </Grid>
        <Grid container spacing={2} mt={2}>
          {/* Sector Comercial */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Sector Comercial *</InputLabel>
              <Select
                value={formData.sectorComercial}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    sectorComercial: e.target.value
                  }))
                }
              >
                <MenuItem value='NORTE'>Norte</MenuItem>
                <MenuItem value='SUR'>Sur</MenuItem>
                <MenuItem value='CENTRO'>Centro</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Región */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Región *</InputLabel>
              <Select
                label='Región *'
                value={formData.region}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    region: e.target.value,
                    comuna: '' // Limpiar comuna al cambiar región
                  }))
                }
              >
                <MenuItem value='Región Metropolitana'>Región Metropolitana</MenuItem>
                <MenuItem value='Región de Valparaíso'>Región de Valparaíso</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Comuna */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Comuna</InputLabel>
              <Select
                label='Comuna'
                value={formData.comuna}
                onChange={e => setFormData(prev => ({ ...prev, comuna: e.target.value }))}
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
        </Grid>
        <Grid container spacing={2} mt={2}>
          {/* Dirección */}
          <Grid item xs={12} sm={6} display='flex' alignItems='center'>
            <TextField
              fullWidth
              label='Dirección *'
              value={formData.direccion}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  direccion: e.target.value
                }))
              }
            />
            <IconButton
              size='small'
              sx={{ marginLeft: '8px' }}
              onClick={() => {
                // Aquí puedes agregar la lógica para copiar la dirección de la obra si existe
                if (formData.obraId && obras.length) {
                  const obraSeleccionada = obras.find(o => o.obraId === formData.obraId)

                  if (obraSeleccionada) {
                    setFormData(prev => ({
                      ...prev,
                      direccion: obraSeleccionada.direccion
                    }))
                  }
                }
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Grid>

          {/* Referencia */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label='Referencia'
              value={formData.referencia}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  referencia: e.target.value
                }))
              }
              placeholder='Ej: Cerca del supermercado, Edificio azul, etc.'
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} mt={4} sx={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
          {/* Cabecera de la tabla */}
          <Grid item xs={4}>
            <Typography variant='subtitle2' align='left'>
              ROL
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant='subtitle2' align='left'>
              NOMBRE
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant='subtitle2' align='left'>
              ACCIÓN
            </Typography>
          </Grid>
        </Grid>
        <Grid container spacing={2} mt={2}>
          {/* Fila de la tabla */}
          <Grid item xs={4}>
            <Typography>Solicitante</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>Nombre Encargado</Typography>
          </Grid>
          <Grid item xs={2} style={{ textAlign: 'left' }}>
            <IconButton size='small'>
              <AddIcon />
            </IconButton>
            <IconButton size='small'>
              <EditIcon />
            </IconButton>
            <IconButton size='small'>
              <StarIcon />
            </IconButton>
            <IconButton size='small'>
              <DeleteIcon />
            </IconButton>
          </Grid>

          {/* Segunda fila con campo de texto para ingresar datos */}
          <Grid item xs={4}>
            <Typography>Solicitante</Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField label='Nombre' fullWidth />
          </Grid>
          <Grid item xs={2} style={{ textAlign: 'left' }}>
            <IconButton size='small'>
              <AddIcon />
            </IconButton>
            <IconButton size='small'>
              <EditIcon />
            </IconButton>
            <IconButton size='small'>
              <StarIcon />
            </IconButton>
            <IconButton size='small'>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Grid container spacing={2} mt={4}>
          <Grid item xs={12}>
            <Typography variant='h5' sx={{ fontWeight: '' }}>
              Detalles
            </Typography>
          </Grid>
        </Grid>
        <Grid container spacing={2} mt={2}>
          {/* Servicio Extra (con Autocomplete) */}
          <Grid item xs={12} sm={3}>
            <Autocomplete
              fullWidth
              options={servicios}
              getOptionLabel={option => `${option.codigo} - ${option.nombre}`}
              value={servicioSeleccionado}
              onChange={(_, newValue) => setServicioSeleccionado(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Servicio Extra'
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>

          {/* Cantidad */}
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              label='Cantidad'
              type='number'
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
            />
          </Grid>

          {/* Observación */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label='Observación'
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
            />
          </Grid>

          {/* 2da Visita (checkbox) */}
          <Grid item xs={12} sm={1}>
            <FormControlLabel
              control={<Checkbox checked={esSegundaVisita} onChange={e => setEsSegundaVisita(e.target.checked)} />}
              label='2a Visita'
            />
          </Grid>

          {/* Botón Agregar */}
          <Grid item xs={12} sm={2}>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              startIcon={<AddIcon />}
              onClick={handleAgregarServicio}
              disabled={!servicioSeleccionado || !cantidad}
            >
              Agregar
            </Button>
          </Grid>
        </Grid>

        {/* Tabla de servicios agregados */}
        <Grid container spacing={2} sx={{ marginTop: 2 }}>
          <Grid item xs={12}>
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

            {serviciosAgendados.map((servicio, index) => (
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
                  <Typography>{servicio.cantidad}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography>{servicio.observacion}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography>{servicio.esSegundaVisita ? 'Sí' : 'No'}</Typography>
                </Grid>
                <Grid item xs={2}>
                  <Box display='flex' gap={1} justifyContent='center'>
                    <IconButton
                      size='small'
                      color='primary'
                      onClick={() => {
                        // Implementar edición
                      }}
                    >
                      <EditIcon fontSize='small' />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => {
                        setServiciosAgendados(prev => prev.filter((_, i) => i !== index))
                      }}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid container spacing={2} mt={2}>
          {/* Título Laboratorista */}
          <Grid item xs={6}>
            <Box display='flex' alignItems='center' justifyContent='flex-start' mb={3}>
              <Typography variant='h6' sx={{ color: 'primary.main' }}>
                Laboratorista
              </Typography>
            </Box>

            {/* Barra de búsqueda de laboratoristas */}
            <Box display='flex' gap={1} alignItems='flex-start'>
              <Autocomplete
                size='small'
                fullWidth
                options={laboratoristas}
                getOptionLabel={option => `${option.nombre} (${option.email})`}
                value={laboratoristaSeleccionado}
                onChange={(_, newValue) => setLaboratoristaSeleccionado(newValue)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Buscar Laboratorista'
                    size='small'
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon fontSize='small' color='action' />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
              <Button
                variant='contained'
                color='primary'
                size='small'
                onClick={handleAgregarLaboratorista}
                disabled={!laboratoristaSeleccionado}
                sx={{
                  minWidth: '40px',
                  width: '40px',
                  height: '40px',
                  p: 0,
                  borderRadius: '8px'
                }}
              >
                <AddIcon fontSize='small' />
              </Button>
            </Box>

            {/* Tabla de laboratoristas agregados */}
            <Box
              mt={2}
              sx={{
                backgroundColor: theme => theme.palette.grey[50],
                padding: '12px',
                borderRadius: '8px',
                border: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <Grid container>
                <Grid item xs={5}>
                  <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
                    NOMBRE
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
                    EMAIL
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant='subtitle2' sx={{ color: 'text.secondary', textAlign: 'center' }}>
                    ACCIÓN
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {laboratoristasAgendados.map((laboratorista, index) => (
              <Grid
                container
                key={index}
                sx={{
                  borderBottom: theme => `1px solid ${theme.palette.divider}`,
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
                      onClick={() => {
                        setLaboratoristasAgendados(prev => prev.filter((_, i) => i !== index))
                      }}
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
            ))}
          </Grid>

          {/* Título Equipo */}
          <Grid item xs={6}>
            <Box display='flex' alignItems='center' justifyContent='flex-start' mb={3}>
              <Typography variant='h6' sx={{ color: 'primary.main' }}>
                Equipo
              </Typography>
            </Box>

            {/* Barra de búsqueda de equipos */}
            <Box display='flex' gap={1} alignItems='flex-start'>
              <Autocomplete
                size='small'
                fullWidth
                options={equipos}
                getOptionLabel={option => `${option.codigo} - ${option.nombre}`}
                value={equipoSeleccionado}
                onChange={(_, newValue) => setEquipoSeleccionado(newValue)}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Buscar Equipo'
                    size='small'
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position='start'>
                          <SearchIcon fontSize='small' color='action' />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
                noOptionsText='No hay equipos'
                loading={equipos.length === 0}
                loadingText='Cargando equipos...'
                renderOption={(props, option) => (
                  <li {...props}>
                    <Typography variant='body2'>
                      {option.codigo} - {option.nombre}
                    </Typography>
                  </li>
                )}
              />
              <Button
                variant='contained'
                color='primary'
                size='small'
                onClick={handleAgregarEquipo}
                disabled={!equipoSeleccionado}
                sx={{
                  minWidth: '40px',
                  width: '40px',
                  height: '40px',
                  p: 0,
                  borderRadius: '8px'
                }}
              >
                <AddIcon fontSize='small' />
              </Button>
            </Box>

            {/* Tabla de equipos agregados */}
            <Box
              mt={2}
              sx={{
                backgroundColor: theme => theme.palette.grey[50],
                padding: '12px',
                borderRadius: '8px',
                border: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <Grid container>
                <Grid item xs={5}>
                  <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
                    CÓDIGO
                  </Typography>
                </Grid>
                <Grid item xs={5}>
                  <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
                    EQUIPO
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant='subtitle2' sx={{ color: 'text.secondary', textAlign: 'center' }}>
                    ACCIÓN
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {equiposAgendados.map((equipo, index) => (
              <Grid
                container
                key={index}
                sx={{
                  borderBottom: theme => `1px solid ${theme.palette.divider}`,
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
                      onClick={() => {
                        setEquiposAgendados(prev => prev.filter((_, i) => i !== index))
                      }}
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
            ))}
          </Grid>
        </Grid>
        <Grid container spacing={2} mt={2}>
          {/* Observaciones */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Observaciones'
              placeholder='Observaciones de la visita'
              multiline
              rows={2}
              size='small'
              value={formData.observaciones}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  observaciones: e.target.value
                }))
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  padding: '8px'
                }
              }}
            />
          </Grid>
        </Grid>

        {/* Botón Agregar */}
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12} display='flex' justifyContent='flex-start'>
            <Button variant='contained' color='primary' onClick={handleSubmit}>
              Agendar
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  )
}

export default AddEventSidebar
