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
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'

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
  rut?: string
}

interface Obra {
  obraId: number
  nombreObra: string
  clienteId: number
  rut?: string
  direccion?: string
  region?: string
  comuna?: string
  referencia?: string
  cliente?: Cliente
  contactos?: any[]
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
  { value: 'otro', label: 'Otro' }
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
  const [isLoadingEventData, setIsLoadingEventData] = useState(false)

  // Estados para los datos de las listas desplegables
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [obrasFiltradas, setObrasFiltradas] = useState<Obra[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<Solicitud[]>([])
  const [todasLasSolicitudes, setTodasLasSolicitudes] = useState<Solicitud[]>([])

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
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);

  // Función helper para formatear fecha manteniendo zona horaria local
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Actualizar formData cuando cambien las fechas (solo si no estamos cargando datos del evento)
  useEffect(() => {
    if (fechaInicio && editEventSidebarOpen) {
      setFormData(prev => ({
        ...prev,
        fechaInicio: formatDateLocal(fechaInicio)
      }))
    }
  }, [fechaInicio, editEventSidebarOpen])

  useEffect(() => {
    if (fechaFin && editEventSidebarOpen) {
      setFormData(prev => ({
        ...prev,
        fechaFin: formatDateLocal(fechaFin)
      }))
    }
  }, [fechaFin, editEventSidebarOpen])

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
        setObrasFiltradas(obrasData)

        // Cargar solicitudes
        const solicitudesRes = await fetch('/api/requests')
        const solicitudesData = await solicitudesRes.json()

        setSolicitudes(solicitudesData)
        setTodasLasSolicitudes(solicitudesData)
        setSolicitudesFiltradas(solicitudesData)

        // Cargar laboratoristas disponibles (para el dropdown)
        const laboratoristasRes = await fetch('/api/users/laboratoristas')
        const laboratoristasData = await laboratoristasRes.json()

        const formattedLaboratoristas = laboratoristasData.map((lab: any) => ({
          id: lab.id,
          name: lab.name,
          email: lab.email,
          rol: lab.roles?.[0]?.rol?.nombre || 'Sin rol asignado'
        }))

        setLaboratoristas(formattedLaboratoristas)

        // Cargar equipos disponibles (para el dropdown)
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

  // Inicializar fechas cuando se abre el sidebar sin evento seleccionado
  useEffect(() => {
    if (editEventSidebarOpen && !selectedEvent) {
      const now = new Date()
      now.setHours(9, 0, 0, 0) // Hora por defecto 9:00 AM
      setFechaInicio(now)

      const endDate = new Date(now)
      endDate.setHours(10, 0, 0, 0) // Hora por defecto 10:00 AM
      setFechaFin(endDate)
    }

    // Resetear flag de carga cuando se cierre el sidebar
    if (!editEventSidebarOpen) {
      setIsLoadingEventData(false)
    }
  }, [editEventSidebarOpen, selectedEvent])

  // Cargar datos completos del evento desde el backend
  useEffect(() => {
    const fetchEventData = async () => {
      if (selectedEvent && editEventSidebarOpen) {
        setIsLoadingEventData(true)
        console.log('Cargando datos completos del evento desde el backend:', selectedEvent.id)

        try {
          // Hacer llamada al backend para obtener datos completos
          const response = await fetch(`/api/agenda/${selectedEvent.id}`)
          if (!response.ok) {
            throw new Error('Error al cargar los datos del evento')
          }

          const eventData = await response.json()
          console.log('Datos completos del evento desde backend:', eventData)

          // Formatear fecha y hora a formato local para los inputs de tipo datetime-local
          const formatDate = (date: any) => {
            if (!date) return ''
            const d = new Date(date)
            if (isNaN(d.getTime())) return ''

            // Formatear manteniendo la zona horaria local
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            const hours = String(d.getHours()).padStart(2, '0')
            const minutes = String(d.getMinutes()).padStart(2, '0')

            return `${year}-${month}-${day}T${hours}:${minutes}`
          }

          // Establecer estado
          setEstado(eventData.estado || 'AGENDADA')

          // Formatear fechas
          const fechaInicioFormatted = formatDate(eventData.fechaInicio)
          const fechaFinFormatted = formatDate(eventData.fechaFin)

          // Debug: Verificar los IDs extraídos
          console.log('IDs extraídos del backend:', {
            clienteId: eventData.clienteId,
            obraId: eventData.obraId,
            solicitudId: eventData.solicitudId
          })

          // Establecer datos del formulario
          setFormData({
            titulo: eventData.titulo || '',
            tipoVisita: eventData.tipoVisita || 'VISITA',
            esRecurrente: eventData.esRecurrente || false,
            fechaInicio: fechaInicioFormatted,
            fechaFin: fechaFinFormatted,
            clienteId: eventData.clienteId,
            obraId: eventData.obraId,
            solicitudId: eventData.solicitudId,
            sectorComercial: eventData.sectorComercial || '',
            region: eventData.region || '',
            comuna: eventData.comuna || '',
            direccion: eventData.direccion || '',
            referencia: eventData.referencia || '',
            observaciones: eventData.observaciones || '',
            servicios: [],
            laboratoristas: [],
            equipos: []
          })

          // Establecer fechas para DatePicker
          if (fechaInicioFormatted) {
            const fechaInicioDate = new Date(fechaInicioFormatted)
            if (!isNaN(fechaInicioDate.getTime())) {
              setFechaInicio(fechaInicioDate)
            }
          }

          if (fechaFinFormatted) {
            const fechaFinDate = new Date(fechaFinFormatted)
            if (!isNaN(fechaFinDate.getTime())) {
              setFechaFin(fechaFinDate)
            }
          }

          // Establecer región para cargar comunas
          if (eventData.region) {
            setSelectedRegion(eventData.region)
          }

          // Establecer referencia
          setSelectedReferencia(eventData.referencia || '')

          // Procesar servicios
          const formattedServicios = (eventData.servicios || []).map((s: any) => ({
            codigo: s.codigo || s.servicio?.codigo || '',
            servicio: s.servicio?.nombre || s.nombre || '',
            cantidad: s.cantidad || 1,
            observacion: s.observacion || '',
            esSegundaVisita: s.esSegundaVisita || false
          }))
          setServiciosAgendados(formattedServicios)

          // Procesar laboratoristas
          const formattedLaboratoristas = (eventData.asignados || []).map((a: any) => ({
            id: a.userId || a.user?.id || a.id,
            nombre: a.user?.name || a.nombre || 'No especificado',
            email: a.user?.email || a.email || '',
            esPrincipal: a.esPrincipal || false
          }))
          setLaboratoristasAgendados(formattedLaboratoristas)

          // Procesar equipos
          const formattedEquipos = (eventData.equipos || []).map((e: any) => ({
            id: e.equipo?.id || e.equipoId || e.id,
            codigo: e.equipo?.codigo || e.codigo || '',
            nombre: e.equipo?.nombre || e.nombre || '',
            cantidad: e.cantidad || 1,
            observacion: e.observacion || ''
          }))
          setEquiposAgendados(formattedEquipos)

          // Procesar contactos
          const contactosEvento = eventData.contactos || []
          setContactos(contactosEvento)

          // Aplicar filtros después de cargar los datos
          const applyFilters = () => {
            console.log('Aplicando filtros con datos:', {
              clienteId: eventData.clienteId,
              obraId: eventData.obraId,
              obrasDisponibles: obras.length,
              solicitudesDisponibles: todasLasSolicitudes.length
            })

            // Aplicar filtro de obras si hay cliente
            if (eventData.clienteId && obras.length > 0) {
              console.log('Estructura de la primera obra:', obras[0])
              console.log('Buscando obras para clienteId:', eventData.clienteId)

              // Filtrar obras por RUT del cliente (según la estructura del backend)
              const cliente = eventData.cliente || clientes.find(c => c.clienteId === eventData.clienteId)
              console.log('Cliente encontrado:', cliente)

              let obrasFiltradas = []

              if (cliente && cliente.rut) {
                // Filtrar por RUT que es la relación entre cliente y obra
                obrasFiltradas = obras.filter(obra => obra.rut === cliente.rut)
                console.log('Filtrado por RUT del cliente:', cliente.rut, 'obras encontradas:', obrasFiltradas.length)
              } else {
                // Fallback: intentar otros métodos de filtrado
                obrasFiltradas = obras.filter(obra =>
                  obra.clienteId === eventData.clienteId ||
                  obra.cliente?.clienteId === eventData.clienteId
                )
                console.log('Filtrado por clienteId, obras encontradas:', obrasFiltradas.length)
              }

              // Si no encuentra obras, no mostrar ninguna (no todas)
              if (obrasFiltradas.length === 0) {
                console.log('No se encontraron obras para este cliente')
              }

              console.log('Obras filtradas:', obrasFiltradas)
              setObrasFiltradas(obrasFiltradas)
            } else {
              console.log('No se aplicó filtro de obras - clienteId:', eventData.clienteId, 'obras:', obras.length)
              setObrasFiltradas(obras)
            }

            // Aplicar filtro de solicitudes si hay obra o cliente
            if (eventData.obraId && todasLasSolicitudes.length > 0) {
              const solicitudesFiltradas = todasLasSolicitudes.filter(solicitud =>
                solicitud.obra && solicitud.obra.obraId === eventData.obraId
              )
              console.log('Solicitudes filtradas por obra:', solicitudesFiltradas)
              setSolicitudesFiltradas(solicitudesFiltradas)
            } else if (eventData.clienteId && todasLasSolicitudes.length > 0) {
              const solicitudesFiltradas = todasLasSolicitudes.filter(solicitud =>
                solicitud.cliente && solicitud.cliente.clienteId === eventData.clienteId
              )
              console.log('Solicitudes filtradas por cliente:', solicitudesFiltradas)
              setSolicitudesFiltradas(solicitudesFiltradas)
            } else {
              console.log('No se aplicó filtro de solicitudes')
              setSolicitudesFiltradas(todasLasSolicitudes)
            }

            // Cargar contactos de la obra si existe
            if (eventData.obraId) {
              cargarContactosDeObra(eventData.obraId)
            }

            // Finalizar la carga de datos del evento
            setIsLoadingEventData(false)
          }

          // Esperar a que se carguen las obras y solicitudes antes de aplicar filtros
          if (obras.length > 0 && todasLasSolicitudes.length > 0) {
            setTimeout(applyFilters, 200)
          } else {
            // Si no hay datos aún, intentar de nuevo en un momento
            setTimeout(() => {
              if (obras.length > 0 || todasLasSolicitudes.length > 0) {
                applyFilters()
              } else {
                console.log('No se pudieron cargar obras y solicitudes, finalizando carga')
                setIsLoadingEventData(false)
              }
            }, 500)
          }

        } catch (error) {
          console.error('Error al cargar datos del evento:', error)
          setIsLoadingEventData(false)
        }
      }
    }

    fetchEventData()
  }, [selectedEvent, editEventSidebarOpen, obras, todasLasSolicitudes])

  // Estado para contactos
  const [contactos, setContactos] = useState<ContactoAgendaForm[]>([])
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)
  const [editingContact, setEditingContact] = useState<ContactoAgendaForm>({
    rol: '', nombre: '', email: '', telefono1: '', telefono2: '', isPrincipal: false
  })
  const [addContactOpen, setAddContactOpen] = useState(false)



  // Estados para laboratoristas y equipos disponibles y seleccionados
  const [laboratoristas, setLaboratoristas] = useState<any[]>([])
  const [laboratoristaSeleccionado, setLaboratoristaSeleccionado] = useState<any | null>(null)
  const [laboratoristaInputValue, setLaboratoristaInputValue] = useState<string>('')
  const [laboratoristaKey, setLaboratoristaKey] = useState<number>(0)

  const [equipos, setEquipos] = useState<any[]>([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<any | null>(null)
  const [equipoInputValue, setEquipoInputValue] = useState<string>('')
  const [equipoKey, setEquipoKey] = useState<number>(0)

  // Función para cargar contactos de una obra (basada en AddEventSidebar)
  const cargarContactosDeObra = (obraId: number) => {
    const obraSeleccionada = obras.find(obra => obra.obraId === obraId)
    if (obraSeleccionada) {
      const obraContactos = obraSeleccionada.contactos || []
      // Reemplazar todos los contactos con los de la nueva obra (igual que en AddEventSidebar)
      const nuevosContactos = obraContactos.map((c: any) => ({
        nombre: c.nombre,
        rol: c.rol || c.cargo || '',
        email: c.email,
        telefono1: c.telefono1,
        telefono2: c.telefono2,
        isPrincipal: c.isPrincipal === true
      }))
      setContactos(nuevosContactos)
      console.log('Contactos de obra cargados:', nuevosContactos)
    }
  }

  // Cargar laboratoristas y equipos disponibles al montar
  useEffect(() => {
    const fetchLaboratoristas = async () => {
      try {
        const response = await fetch('/api/users/laboratoristas')
        const data = await response.json()
        const formattedLaboratoristas = data.map((lab: any) => ({
          id: lab.id,
          name: lab.name,
          email: lab.email,
          rol: lab.roles?.[0]?.rol?.nombre || 'Sin rol asignado'
        }))
        setLaboratoristas(formattedLaboratoristas)
      } catch (error) {
        console.error('Error cargando laboratoristas:', error)
      }
    }
    const fetchEquipos = async () => {
      try {
        const response = await fetch('/api/agenda/equipos')
        const data = await response.json()
        setEquipos(data)
      } catch (error) {
        console.error('Error cargando equipos:', error)
      }
    }
    fetchLaboratoristas()
    fetchEquipos()
  }, [])

  // Filtrar obras cuando cambia el cliente seleccionado
  useEffect(() => {
    if (formData.clienteId) {
      // Intentar diferentes formas de filtrar según la estructura de datos
      // Filtrar obras por RUT del cliente
      const cliente = clientes.find(c => c.clienteId === formData.clienteId)
      let obrasFiltradas = []

      if (cliente && cliente.rut) {
        // Filtrar por RUT que es la relación entre cliente y obra
        obrasFiltradas = obras.filter(obra => obra.rut === cliente.rut)
      } else {
        // Fallback: intentar otros métodos de filtrado
        obrasFiltradas = obras.filter(obra =>
          obra.clienteId === formData.clienteId ||
          obra.cliente?.clienteId === formData.clienteId
        )
      }

      setObrasFiltradas(obrasFiltradas)

      // Solo limpiar la obra si no estamos cargando datos del evento y la obra no pertenece al cliente
      if (!isLoadingEventData && formData.obraId && !obrasFiltradas.some(obra => obra.obraId === formData.obraId)) {
        setFormData(prev => ({ ...prev, obraId: undefined }))
        // Limpiar contactos cuando se limpia la obra automáticamente
        setContactos([])
        setSelectedReferencia('')
      }
    } else {
      setObrasFiltradas(obras)
      // Si no hay cliente seleccionado, limpiar contactos
      if (!isLoadingEventData) {
        setContactos([])
        setSelectedReferencia('')
      }
    }
  }, [formData.clienteId, obras, isLoadingEventData])

  // Filtrar solicitudes cuando cambia la obra seleccionada
  useEffect(() => {
    if (formData.obraId) {
      const solicitudesFiltradas = todasLasSolicitudes.filter(solicitud =>
        solicitud.obra && solicitud.obra.obraId === formData.obraId
      )
      setSolicitudesFiltradas(solicitudesFiltradas)

      // Solo limpiar la solicitud si no estamos cargando datos del evento y la solicitud no pertenece a la obra
      if (!isLoadingEventData && formData.solicitudId && !solicitudesFiltradas.some(sol => sol.id === formData.solicitudId)) {
        setFormData(prev => ({ ...prev, solicitudId: undefined }))
      }
    } else if (formData.clienteId) {
      // Si hay cliente pero no obra, filtrar por cliente
      const solicitudesFiltradas = todasLasSolicitudes.filter(solicitud =>
        solicitud.cliente && solicitud.cliente.clienteId === formData.clienteId
      )
      setSolicitudesFiltradas(solicitudesFiltradas)
    } else {
      setSolicitudesFiltradas(todasLasSolicitudes)
    }
  }, [formData.obraId, formData.clienteId, todasLasSolicitudes, isLoadingEventData])

  // Efecto para cargar los contactos cuando se selecciona una obra (igual que en AddEventSidebar)
  useEffect(() => {
    if (formData.obraId && !isLoadingEventData) {
      cargarContactosDeObra(formData.obraId)
    } else if (!formData.obraId && !isLoadingEventData) {
      // Limpiar contactos cuando no hay obra seleccionada
      setContactos([])
    }
  }, [formData.obraId, obras, isLoadingEventData])

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
        equipos: equiposAgendados,
        contactos: contactos // Asegurar que se envían los contactos
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

      // Recargar la lista de visitas tras guardar
      if (typeof window !== 'undefined') {
        fetch('/api/agenda')
      }

      // Mostrar mensaje de éxito (se podría implementar un toast o snackbar)
      console.log('Visita actualizada exitosamente')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'Error al actualizar la visita')
    }
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
  const handleAddContact = (contact: any) => {
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

  // Métodos para agregar laboratorista y equipo (similar a AddEventSidebar)
  const handleAgregarLaboratorista = (newValue: any) => {
    if (newValue) {
      // Verificar si el laboratorista ya está agregado
      const yaExiste = laboratoristasAgendados.some(lab => lab.id === newValue.id)
      if (!yaExiste) {
        const nuevoLaboratorista: LaboratoristaAgendado = {
          id: newValue.id,
          nombre: newValue.name,
          email: newValue.email
        }
        setLaboratoristasAgendados(prev => [...prev, nuevoLaboratorista])
      }
      // Limpiar la selección y el campo de búsqueda forzando re-render
      setLaboratoristaSeleccionado(null)
      setLaboratoristaInputValue('')
      setLaboratoristaKey(prev => prev + 1)
    }
  }

  const handleAgregarEquipo = (newValue: any) => {
    if (newValue) {
      // Verificar si el equipo ya está agregado
      const yaExiste = equiposAgendados.some(equipo => equipo.id === newValue.id)
      if (!yaExiste) {
        const nuevoEquipo: EquipoAgendado = {
          id: newValue.id,
          codigo: newValue.codigo,
          nombre: newValue.nombre,
          cantidad: 1,
          observacion: ''
        }
        setEquiposAgendados(prev => [...prev, nuevoEquipo])
      }
      // Limpiar la selección y el campo de búsqueda forzando re-render
      setEquipoSeleccionado(null)
      setEquipoInputValue('')
      setEquipoKey(prev => prev + 1)
    }
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
                  onChange={(_, newValue) => {
                    if (newValue) {
                      // Filtrar obras del cliente seleccionado
                      let obrasDelCliente = []
                      if (newValue.rut) {
                        obrasDelCliente = obras.filter(obra => obra.rut === newValue.rut)
                      } else {
                        obrasDelCliente = obras.filter(obra =>
                          obra.clienteId === newValue.clienteId ||
                          obra.cliente?.clienteId === newValue.clienteId
                        )
                      }

                      // Si solo hay una obra, preseleccionarla
                      let obraPreseleccionada: number | undefined = undefined
                      let solicitudPreseleccionada: number | undefined = undefined

                      if (obrasDelCliente.length === 1) {
                        const obraSeleccionada = obrasDelCliente[0]
                        obraPreseleccionada = obraSeleccionada.obraId

                        // Si hay una obra preseleccionada, buscar su solicitud
                        const solicitudRelacionada = todasLasSolicitudes.find(solicitud =>
                          solicitud.obra && solicitud.obra.obraId === obraPreseleccionada
                        )

                        if (solicitudRelacionada) {
                          solicitudPreseleccionada = solicitudRelacionada.id
                        }

                        // Actualizar región seleccionada para cargar comunas
                        if (obraSeleccionada.region) {
                          setSelectedRegion(obraSeleccionada.region)
                        }

                        console.log('Cliente con una sola obra - Preseleccionando:', {
                          cliente: newValue.clienteId,
                          obra: obraPreseleccionada,
                          solicitud: solicitudPreseleccionada,
                          direccion: obraSeleccionada.direccion,
                          region: obraSeleccionada.region,
                          comuna: obraSeleccionada.comuna
                        })

                        // Cargar contactos de la obra preseleccionada
                        if (obraPreseleccionada) {
                          cargarContactosDeObra(obraPreseleccionada)
                        }
                      } else {
                        // Si hay múltiples obras, limpiar región seleccionada
                        setSelectedRegion('')

                        console.log('Cliente con múltiples obras - Limpiando campos de ubicación:', {
                          cliente: newValue.clienteId,
                          obrasDisponibles: obrasDelCliente.length
                        })
                      }

                      setFormData(prev => ({
                        ...prev,
                        clienteId: newValue.clienteId,
                        obraId: obraPreseleccionada,
                        solicitudId: solicitudPreseleccionada,
                        // Si se preselecciona una obra, llenar datos de ubicación
                        // Si no se preselecciona (múltiples obras), limpiar datos de ubicación
                        ...(obrasDelCliente.length === 1 ? {
                          direccion: obrasDelCliente[0].direccion || prev.direccion,
                          region: obrasDelCliente[0].region || prev.region,
                          comuna: obrasDelCliente[0].comuna || prev.comuna,
                          referencia: obrasDelCliente[0].referencia || prev.referencia
                        } : {
                          direccion: '',
                          region: '',
                          comuna: '',
                          referencia: ''
                        })
                      }))
                    } else {
                      // Limpiar región seleccionada
                      setSelectedRegion('')

                      setFormData(prev => ({
                        ...prev,
                        clienteId: undefined,
                        obraId: undefined,
                        solicitudId: undefined,
                        // Limpiar datos de ubicación cuando se quita el cliente
                        direccion: '',
                        region: '',
                        comuna: '',
                        referencia: ''
                      }))

                      // Limpiar contactos cuando se quita el cliente
                      setContactos([])
                      setSelectedReferencia('')
                    }
                  }}
                  renderInput={params => <TextField {...params} label='Cliente' required />}
                />
              </Grid>

              {/* Obra */}
              <Grid item xs={4}>
                <Autocomplete
                  options={obrasFiltradas}
                  getOptionLabel={option => option.nombreObra}
                  value={(() => {
                    const obraEncontrada = obrasFiltradas.find(o => o.obraId === formData.obraId) ||
                      obras.find(o => o.obraId === formData.obraId) ||
                      null
                    console.log('Obra buscada:', {
                      obraId: formData.obraId,
                      obrasFiltradas: obrasFiltradas.length,
                      obrasTotal: obras.length,
                      obraEncontrada: obraEncontrada
                    })
                    return obraEncontrada
                  })()}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      // Buscar solicitud relacionada a esta obra
                      const solicitudRelacionada = todasLasSolicitudes.find(solicitud =>
                        solicitud.obra && solicitud.obra.obraId === newValue.obraId
                      )

                      console.log('Obra seleccionada:', {
                        obraId: newValue.obraId,
                        solicitud: solicitudRelacionada?.id,
                        direccion: newValue.direccion,
                        region: newValue.region,
                        comuna: newValue.comuna,
                        referencia: newValue.referencia
                      })

                      // Actualizar región seleccionada para cargar comunas
                      if (newValue.region) {
                        setSelectedRegion(newValue.region)
                      }

                      setFormData(prev => ({
                        ...prev,
                        obraId: newValue.obraId,
                        solicitudId: solicitudRelacionada?.id || undefined,
                        // Llenar datos de ubicación desde la obra
                        direccion: newValue.direccion || prev.direccion,
                        region: newValue.region || prev.region,
                        comuna: newValue.comuna || prev.comuna,
                        referencia: newValue.referencia || prev.referencia
                      }))

                      // Cargar contactos de la obra seleccionada
                      cargarContactosDeObra(newValue.obraId)
                    } else {
                      // Limpiar región seleccionada
                      setSelectedRegion('')

                      setFormData(prev => ({
                        ...prev,
                        obraId: undefined,
                        solicitudId: undefined,
                        // Limpiar datos de ubicación cuando se quita la obra
                        direccion: '',
                        region: '',
                        comuna: '',
                        referencia: ''
                      }))

                      // Limpiar contactos cuando se quita la obra
                      setContactos([])
                      setSelectedReferencia('')
                    }
                  }}
                  renderInput={params => <TextField {...params} label='Obra' />}
                  disabled={!formData.clienteId}
                />
              </Grid>

              {/* Solicitud */}
              <Grid item xs={4}>
                <Autocomplete
                  options={solicitudesFiltradas}
                  getOptionLabel={option => {
                    const clienteInfo = option.cliente ? ` - ${option.cliente.razonSocial}` : ''
                    const obraInfo = option.obra ? ` - ${option.obra.nombreObra}` : ''

                    return `Solicitud #${option.numeroSolicitud}${clienteInfo}${obraInfo}`
                  }}
                  value={
                    solicitudesFiltradas.find(s => s.id === formData.solicitudId) ||
                    todasLasSolicitudes.find(s => s.id === formData.solicitudId) ||
                    null
                  }
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
                  disabled={!formData.clienteId}
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
                  <Typography variant='h5' sx={{ mb: 2 }}>
                    Laboratoristas
                  </Typography>
                  <Autocomplete
                    key={laboratoristaKey}
                    fullWidth
                    options={laboratoristas}
                    getOptionLabel={option => `${option.name} (${option.rol})`}
                    value={laboratoristaSeleccionado}
                    inputValue={laboratoristaInputValue}
                    onInputChange={(_, newInputValue) => {
                      setLaboratoristaInputValue(newInputValue)
                    }}
                    onChange={(_, newValue) => handleAgregarLaboratorista(newValue)}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Laboratorista'
                        placeholder='Seleccione un laboratorista para agregarlo automáticamente'
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

                  {/* Lista de laboratoristas agregados */}
                  <TableContainer sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {laboratoristasAgendados.map((laboratorista, index) => (
                          <TableRow key={index}>
                            <TableCell>{laboratorista.nombre}</TableCell>
                            <TableCell>{laboratorista.email}</TableCell>
                            <TableCell>
                              <IconButton
                                color='error'
                                onClick={() => setLaboratoristasAgendados(prev => prev.filter((_, i) => i !== index))}
                              >
                                <i className='ri-delete-bin-line' />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Equipos */}
                <Grid item xs={6}>
                  <Typography variant='h5' sx={{ mb: 2 }}>
                    Equipos
                  </Typography>
                  <Autocomplete
                    key={equipoKey}
                    fullWidth
                    options={equipos}
                    getOptionLabel={option => `${option.codigo} - ${option.nombre}`}
                    value={equipoSeleccionado}
                    inputValue={equipoInputValue}
                    onInputChange={(_, newInputValue) => {
                      setEquipoInputValue(newInputValue)
                    }}
                    onChange={(_, newValue) => handleAgregarEquipo(newValue)}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Equipo'
                        placeholder='Seleccione un equipo para agregarlo automáticamente'
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

                  {/* Lista de equipos agregados */}
                  <TableContainer sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Código</TableCell>
                          <TableCell>Nombre</TableCell>
                          <TableCell>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {equiposAgendados.map((equipo, index) => (
                          <TableRow key={index}>
                            <TableCell>{equipo.codigo}</TableCell>
                            <TableCell>{equipo.nombre}</TableCell>
                            <TableCell>
                              <IconButton
                                color='error'
                                onClick={() => setEquiposAgendados(prev => prev.filter((_, i) => i !== index))}
                              >
                                <i className='ri-delete-bin-line' />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>

              {/* Observaciones */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
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
