import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
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
import AddIcon from '@mui/icons-material/Add'
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
import Popover from '@mui/material/Popover'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Switch from '@mui/material/Switch'
import { toast } from 'react-hot-toast'

// Hooks
import { useRegionesYComunas } from '@/hooks/useRegionesYComunas'
import { formatDateForBackend, formatBackendDateForInput, parseDateFromBackend } from '@/utils/dateUtils'

// Types
interface DuplicateEventSidebarProps {
  duplicateEventSidebarOpen: boolean
  handleDuplicateEventSidebarToggle: () => void
  selectedEvent: any // El evento seleccionado para duplicar
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
  georreferencia?: string
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

interface Equipo {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  serie?: string
  estado: string
  tipoEquipo?: {
    id: number
    tipo: string
  }
  funcionarioAsignado?: {
    id: string
    name: string
    email: string
  }
  esAsignadoAlLaboratorista?: boolean
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
  georreferencia?: string
  cliente?: Cliente
  contactos?: any[]
  numeroObra?: string
  estadoObra?: string
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
  tipoVisita: 'EVENTO', // Las duplicaciones siempre son eventos únicos
  esRecurrente: false,
  fechaInicio: '',
  fechaFin: '',
  sectorComercial: '',
  region: '',
  comuna: '',
  direccion: '',
  referencia: '',
  georreferencia: '',
  observaciones: '',
  servicios: [],
  laboratoristas: [],
  equipos: []
}

const DuplicateEventSidebar = ({
  duplicateEventSidebarOpen,
  handleDuplicateEventSidebarToggle,
  selectedEvent
}: DuplicateEventSidebarProps) => {
  const [formData, setFormData] = useState<FormData>(initialData)
  const [estado, setEstado] = useState('CREADA')
  const [editandoEstado, setEditandoEstado] = useState(false)
  const [selectedReferencia, setSelectedReferencia] = useState('')
  const [selectedGeorreferencia, setSelectedGeorreferencia] = useState('')
  const [isLoadingEventData, setIsLoadingEventData] = useState(false)

  // Estados para los datos de las listas desplegables
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
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

  // Debug: Monitorear cambios en serviciosAgendados
  useEffect(() => {
    console.log('serviciosAgendados cambió:', serviciosAgendados)
  }, [serviciosAgendados.length])

  // Estados para el buscador de servicios (igual que en AddEventSidebar)
  const [servicios, setServicios] = useState<any[]>([])
  const [servicioSeleccionado, setServicioSeleccionado] = useState<any | null>(null)
  const [cantidad, setCantidad] = useState('1')
  const [observacion, setObservacion] = useState('')
  const [esSegundaVisita, setEsSegundaVisita] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
  const [productsPage, setProductsPage] = useState(0)
  const [areas, setAreas] = useState<any[]>([])
  const [tipos, setTipos] = useState<string[]>([])
  const [familias, setFamilias] = useState<Array<{ id: number; nombre: string; areaId: number }>>([])
  const [filteredProductos, setFilteredProductos] = useState<any[]>([])
  const [totalProductos, setTotalProductos] = useState(0)
  const servicioAnchorRef = useRef<HTMLDivElement>(null)

  // Convertir las fechas string a objetos Date para los datepickers
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);

  // Estados separados para las horas para evitar conflictos con useEffect
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFin, setHoraFin] = useState<string>('');

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
    if (fechaInicio && duplicateEventSidebarOpen && !isLoadingEventData) {
      const newFormattedDate = formatDateForBackend(fechaInicio)
      setFormData(prev => {
        // Solo actualizar si es diferente para evitar loops
        if (prev.fechaInicio !== newFormattedDate) {
          return {
            ...prev,
            fechaInicio: newFormattedDate
          }
        }
        return prev
      })
    }
  }, [fechaInicio, duplicateEventSidebarOpen, isLoadingEventData])

  useEffect(() => {
    if (fechaFin && duplicateEventSidebarOpen && !isLoadingEventData) {
      const newFormattedDate = formatDateForBackend(fechaFin)
      setFormData(prev => {
        // Solo actualizar si es diferente para evitar loops
        if (prev.fechaFin !== newFormattedDate) {
          return {
            ...prev,
            fechaFin: newFormattedDate
          }
        }
        return prev
      })
    }
  }, [fechaFin, duplicateEventSidebarOpen, isLoadingEventData])



  // Sincronizar horaInicio con fechaInicio
  useEffect(() => {
    if (fechaInicio) {
      const newHoraInicio = `${fechaInicio.getHours().toString().padStart(2, '0')}:${fechaInicio.getMinutes().toString().padStart(2, '0')}`
      if (horaInicio !== newHoraInicio) {
        setHoraInicio(newHoraInicio)
      }
    }
  }, [fechaInicio]) // Removido horaInicio de las dependencias

  // Sincronizar horaFin con fechaFin
  useEffect(() => {
    if (fechaFin) {
      const newHoraFin = `${fechaFin.getHours().toString().padStart(2, '0')}:${fechaFin.getMinutes().toString().padStart(2, '0')}`
      if (horaFin !== newHoraFin) {
        setHoraFin(newHoraFin)
      }
    }
  }, [fechaFin]) // Removido horaFin de las dependencias



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

        // Filtrar solo obras activas y ordenar por número de obra descendente
        const obrasActivas = obrasData
          .filter((obra: any) => obra.estadoObra === 'activa')
          .sort((a: any, b: any) => {
            const numeroA = parseInt(a.numeroObra) || 0
            const numeroB = parseInt(b.numeroObra) || 0
            return numeroB - numeroA // Orden descendente (más reciente primero)
          })

        setObras(obrasActivas)

        // Cargar solicitudes
        const solicitudesRes = await fetch('/api/requests')
        const solicitudesData = await solicitudesRes.json()

        setSolicitudes(solicitudesData)
        setTodasLasSolicitudes(solicitudesData)

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

        // Los equipos se cargarán dinámicamente basados en laboratoristas

        // Los servicios se cargan dinámicamente en el popover, no aquí

        console.log('Carga inicial de datos completada')
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error)
      }
    }

    fetchData()
  }, [])

  // Cargar tipos y familias al montar el componente
  useEffect(() => {
    // Cargar todos los servicios para obtener tipos únicos
    fetch('/api/productos?limit=1000')
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al cargar servicios')
        }
        return res.json()
      })
      .then(response => {
        const data = response.productos || []

        // Obtener tipos únicos
        const uniqueTipos = Array.from(new Set(data.map((s: any) => s.tipo || 'Sin tipo')))
          .filter(tipo => tipo)
          .sort()

        setTipos(uniqueTipos as string[])
        setServicios(data)
      })
      .catch(error => {
        console.error('Error al cargar servicios:', error)
        setServicios([])
      })
  }, [])

  // Función para cargar equipos (reutilizable)
  const fetchEquipos = useCallback(async (laboratoristaId?: string) => {
    try {
      console.log('Iniciando carga de equipos...', laboratoristaId ? `para laboratorista: ${laboratoristaId}` : 'todos los equipos')
      const url = laboratoristaId
        ? `/api/agenda/equipos?laboratoristaId=${encodeURIComponent(laboratoristaId)}`
        : '/api/agenda/equipos'

      const response = await fetch(url)
      const data = await response.json()

      console.log('Equipos cargados:', data)

      setEquipos(data)
    } catch (error) {
      console.error('Error cargando equipos:', error)
    }
  }, [])

  // No cargar equipos inicialmente en duplicar - solo cuando hay laboratoristas
  // useEffect(() => {
  //   if (duplicateEventSidebarOpen) {
  //     fetchEquipos()
  //   }
  // }, [duplicateEventSidebarOpen, fetchEquipos])

  // Recargar equipos cuando cambien los laboratoristas asignados
  useEffect(() => {
    console.log('Laboratoristas agendados cambió:', laboratoristasAgendados)

    if (laboratoristasAgendados.length > 0) {
      // Si hay laboratoristas asignados, priorizar el último seleccionado
      const ultimoLaboratorista = laboratoristasAgendados[laboratoristasAgendados.length - 1]
      fetchEquipos(ultimoLaboratorista.id)
    } else {
      // Si no hay laboratoristas, limpiar la lista de equipos
      setEquipos([])
    }
  }, [laboratoristasAgendados, fetchEquipos])

  // Resetear estado cuando se abre/cierra el sidebar
  useEffect(() => {
    if (duplicateEventSidebarOpen && !selectedEvent) {
      // Si se abre sin evento seleccionado, NO inicializar fechas - dejar vacías
      // Para duplicación, las fechas siempre deben ser establecidas manualmente por el usuario
      setFechaInicio(null)
      setFechaFin(null)
      // También asegurar que no hay equipos disponibles hasta que se agreguen laboratoristas
      setEquipos([])
    }

    // Resetear flag de carga cuando se cierre el sidebar
    if (!duplicateEventSidebarOpen) {
      setIsLoadingEventData(false)
      // Limpiar datos cuando se cierra el sidebar
      setFormData(initialData)
      setEstado('CREADA')
      setFechaInicio(null)
      setFechaFin(null)
      setHoraInicio('')
      setHoraFin('')
      setServiciosAgendados([])
      setLaboratoristasAgendados([])
      setEquiposAgendados([])
      setContactos([])
      setSelectedReferencia('')
      setSelectedGeorreferencia('')
      // Limpiar también la lista de equipos disponibles
      setEquipos([])
    }
  }, [duplicateEventSidebarOpen, selectedEvent])

  // Cargar datos completos del evento desde el backend
  useEffect(() => {
    const fetchEventData = async () => {
      if (selectedEvent && duplicateEventSidebarOpen) {
        setIsLoadingEventData(true)

        // Limpiar datos anteriores inmediatamente cuando cambia el evento seleccionado
        // Para duplicación, mantener fechas, horas y laboratoristas vacíos
        setFormData(initialData)
        setEstado('CREADA')
        setFechaInicio(null)
        setFechaFin(null)
        setHoraInicio('')
        setHoraFin('')
        setServiciosAgendados([])
        setLaboratoristasAgendados([]) // Mantener vacío para duplicación
        setEquiposAgendados([])
        setContactos([])
        setSelectedReferencia('')
        setSelectedGeorreferencia('')
        setSelectedRegion('')

        console.log('Cargando datos completos del evento desde el backend:', selectedEvent.id)

        try {
          // Hacer llamada al backend para obtener datos completos
          const response = await fetch(`/api/agenda/${selectedEvent.id}`)
          if (!response.ok) {
            throw new Error('Error al cargar los datos del evento')
          }

          const eventData = await response.json()
          console.log('Datos completos del evento desde backend:', eventData)
          console.log('Campos específicos de ubicación:', {
            direccion: eventData.direccion,
            referencia: eventData.referencia,
            georreferencia: eventData.georreferencia,
            region: eventData.region,
            comuna: eventData.comuna
          })

          // Usar la función de utilidades para formatear fechas

          // Establecer estado
          setEstado(eventData.estado || 'CREADA')

          // Para duplicación, NO precargar fechas en formData
          const fechaInicioFormatted = ''
          const fechaFinFormatted = ''

          // Debug: Verificar los IDs extraídos
          console.log('IDs extraídos del backend:', {
            clienteId: eventData.clienteId,
            obraId: eventData.obraId,
            solicitudId: eventData.solicitudId
          })

          // Establecer datos del formulario
          setFormData({
            titulo: eventData.titulo || '',
            tipoVisita: 'EVENTO', // Las duplicaciones siempre son eventos únicos
            esRecurrente: false, // Las duplicaciones nunca son recurrentes
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
            georreferencia: eventData.georreferencia || '',
            observaciones: eventData.observaciones || '',
            servicios: [],
            laboratoristas: [],
            equipos: []
          })

          // Para duplicación, NO precargar fechas - dejar vacías para que el usuario las establezca
          // setFechaInicio y setFechaFin se mantienen null

          // Establecer región para cargar comunas
          if (eventData.region) {
            setSelectedRegion(eventData.region)
          }

          // Establecer referencia y georreferencia
          console.log('Estableciendo referencia y georreferencia:', {
            referencia: eventData.referencia,
            georreferencia: eventData.georreferencia
          })
          setSelectedReferencia(eventData.referencia || '')
          setSelectedGeorreferencia(eventData.georreferencia || '')

          // Procesar servicios
          console.log('Servicios recibidos del backend:', eventData.servicios)
          const formattedServicios = (eventData.servicios || []).map((s: any) => {
            console.log('Procesando servicio:', s)
            return {
              codigo: s.codigo || '',
              servicio: s.servicio || '', // El campo servicio ya es un string, no un objeto
              cantidad: s.cantidad || 1,
              observacion: s.observacion || '',
              esSegundaVisita: s.esSegundaVisita || false
            }
          })
          console.log('Servicios formateados:', formattedServicios)
          setServiciosAgendados(formattedServicios)
          console.log('Estado serviciosAgendados después de setServiciosAgendados:', formattedServicios)

          // Para duplicación, NO precargar laboratoristas - dejar vacío para que el usuario los asigne
          console.log('Laboratoristas del evento original (no se precargan en duplicación):', eventData.asignados)
          setLaboratoristasAgendados([])

          // No procesar equipos en duplicación - deben agregarse manualmente después de asignar laboratoristas
          // console.log('Equipos recibidos del backend:', eventData.equipos)
          // const formattedEquipos = (eventData.equipos || []).map((e: any) => {
          //   console.log('Procesando equipo:', e)
          //   return {
          //     id: e.equipo?.id || e.equipoId || e.id,
          //     codigo: e.equipo?.codigo || e.codigo || '',
          //     nombre: e.equipo?.nombre || e.nombre || '',
          //     cantidad: e.cantidad || 1,
          //     observacion: e.observacion || ''
          //   }
          // })
          // console.log('Equipos formateados:', formattedEquipos)
          // setEquiposAgendados(formattedEquipos)
          setEquiposAgendados([]) // Limpiar equipos agendados en duplicación

          // Procesar contactos del evento (no de la obra)
          console.log('Contactos recibidos del backend:', eventData.contactos)
          const contactosEvento = (eventData.contactos || []).map((c: any) => ({
            id: c.id,
            rol: c.rol || c.cargo || '',
            nombre: c.nombre || '',
            email: c.email || '',
            telefono1: c.telefono1 || '',
            telefono2: c.telefono2 || '',
            isPrincipal: c.isPrincipal || false
          }))
          console.log('Contactos formateados del evento:', contactosEvento)
          setContactos(contactosEvento)

          // NO cargar contactos de la obra automáticamente al editar
          // Los contactos del evento ya están cargados arriba

          // Finalizar la carga de datos del evento
          setIsLoadingEventData(false)

        } catch (error) {
          console.error('Error al cargar datos del evento:', error)
          setIsLoadingEventData(false)
        }
      }
    }

    fetchEventData()
  }, [selectedEvent, duplicateEventSidebarOpen])

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

  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [equipoInputValue, setEquipoInputValue] = useState<string>('')
  const [equipoKey, setEquipoKey] = useState<number>(0)

  // Función para cargar contactos de una obra (solo para casos automáticos, no cambios manuales)
  const cargarContactosDeObra = (obraId: number) => {
    const obraSeleccionada = obras.find(obra => obra.obraId === obraId)
    if (obraSeleccionada) {
      const obraContactos = obraSeleccionada.contactos || []

      // Solo reemplazar contactos si no estamos editando un evento existente
      if (!selectedEvent) {
        const nuevosContactos = obraContactos.map((c: any) => ({
          nombre: c.nombre,
          rol: c.rol || c.cargo || '',
          email: c.email,
          telefono1: c.telefono1,
          telefono2: c.telefono2,
          isPrincipal: c.isPrincipal === true
        }))
        setContactos(nuevosContactos)
        console.log('Contactos de obra cargados (nuevo evento automático):', nuevosContactos)
      } else {
        console.log('No se cargan contactos de obra automáticamente porque estamos editando un evento existente')
      }

      // También actualizar referencia y georreferencia cuando se selecciona una obra
      if (!isLoadingEventData) {
        setSelectedReferencia(obraSeleccionada.referencia || '')
        setSelectedGeorreferencia(obraSeleccionada.georreferencia || '')

        // Actualizar formData también
        setFormData(prev => ({
          ...prev,
          referencia: obraSeleccionada.referencia || '',
          georreferencia: obraSeleccionada.georreferencia || '',
          direccion: obraSeleccionada.direccion || prev.direccion,
          region: obraSeleccionada.region || prev.region,
          comuna: obraSeleccionada.comuna || prev.comuna
        }))

        console.log('Datos de obra actualizados:', {
          referencia: obraSeleccionada.referencia,
          georreferencia: obraSeleccionada.georreferencia,
          direccion: obraSeleccionada.direccion
        })
      }
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
    // No cargar equipos inicialmente en duplicar - solo cuando hay laboratoristas
    // const fetchEquipos = async () => {
    //   try {
    //     const response = await fetch('/api/agenda/equipos')
    //     const data = await response.json()
    //     setEquipos(data)
    //   } catch (error) {
    //     console.error('Error cargando equipos:', error)
    //   }
    // }
    fetchLaboratoristas()
    // No cargar equipos inicialmente en duplicar - solo cuando hay laboratoristas
    // fetchEquipos()
  }, [])

  // Filtrar obras cuando cambia el cliente seleccionado usando useMemo
  const obrasFiltradas = useMemo(() => {
    let filtered = []

    if (formData.clienteId) {
      // Intentar diferentes formas de filtrar según la estructura de datos
      // Filtrar obras por RUT del cliente
      const cliente = clientes.find(c => c.clienteId === formData.clienteId)

      if (cliente && cliente.rut) {
        // Filtrar por RUT que es la relación entre cliente y obra
        filtered = obras.filter(obra => obra.rut === cliente.rut)
      } else {
        // Fallback: intentar otros métodos de filtrado
        filtered = obras.filter(obra =>
          obra.clienteId === formData.clienteId ||
          obra.cliente?.clienteId === formData.clienteId
        )
      }
    } else {
      filtered = obras
    }

    // Filtrar solo obras activas y ordenar por número de obra descendente
    return filtered
      .filter(obra => obra.estadoObra === 'activa')
      .sort((a, b) => {
        const numeroA = parseInt(a.numeroObra || '0') || 0
        const numeroB = parseInt(b.numeroObra || '0') || 0
        return numeroB - numeroA // Orden descendente (más reciente primero)
      })
  }, [formData.clienteId, obras, clientes])



  // Filtrar solicitudes usando useMemo
  const solicitudesFiltradas = useMemo(() => {
    if (formData.obraId) {
      return todasLasSolicitudes.filter(solicitud =>
        solicitud.obra && solicitud.obra.obraId === formData.obraId
      )
    } else if (formData.clienteId) {
      return todasLasSolicitudes.filter(solicitud =>
        solicitud.cliente && solicitud.cliente.clienteId === formData.clienteId
      )
    } else {
      return todasLasSolicitudes
    }
  }, [formData.obraId, formData.clienteId, todasLasSolicitudes])



  // Efecto para cargar los contactos cuando se selecciona una obra (solo si no estamos cargando datos del evento)
  useEffect(() => {
    // Solo cargar contactos de obra si no estamos cargando datos del evento y no hay evento seleccionado
    if (formData.obraId && !isLoadingEventData && !selectedEvent) {
      cargarContactosDeObra(formData.obraId)
    } else if (!formData.obraId && !isLoadingEventData && !selectedEvent) {
      // Limpiar contactos cuando no hay obra seleccionada (solo si no hay evento seleccionado)
      setContactos([])
    }
  }, [formData.obraId, obras.length, isLoadingEventData, selectedEvent])

  // Función para validar si el formulario está completo
  const isFormValid = useMemo(() => {
    return (
      formData.clienteId &&
      formData.obraId &&
      formData.solicitudId &&
      formData.sectorComercial &&
      formData.region &&
      formData.comuna &&
      formData.direccion &&
      fechaInicio &&
      fechaFin &&
      horaInicio &&
      horaFin &&
      laboratoristasAgendados.length > 0 &&
      contactos.length > 0 &&
      serviciosAgendados.length > 0
    )
  }, [
    formData.clienteId,
    formData.obraId,
    formData.solicitudId,
    formData.sectorComercial,
    formData.region,
    formData.comuna,
    formData.direccion,
    fechaInicio,
    fechaFin,
    horaInicio,
    horaFin,
    laboratoristasAgendados.length,
    contactos.length,
    serviciosAgendados.length
  ])

  const handleSubmit = async () => {
    try {
      // Validación detallada de campos requeridos
      const camposFaltantes = []

      // Campos requeridos básicos
      if (!formData.clienteId) camposFaltantes.push('Cliente')
      if (!formData.obraId) camposFaltantes.push('Obra')

      // Solicitud es obligatoria solo para estado AGENDADO
      if (estado === 'AGENDADA' && !formData.solicitudId) {
        camposFaltantes.push('Solicitud')
      }
      if (!formData.sectorComercial) camposFaltantes.push('Sector Comercial')
      if (!formData.region) camposFaltantes.push('Región')
      if (!formData.comuna) camposFaltantes.push('Comuna')
      if (!formData.direccion) camposFaltantes.push('Dirección')

      // Validaciones obligatorias para fechas y horas
      if (!fechaInicio) camposFaltantes.push('Fecha de Inicio')
      if (!fechaFin) camposFaltantes.push('Fecha de Término')
      if (!horaInicio || horaInicio === '') camposFaltantes.push('Hora de Inicio')
      if (!horaFin || horaFin === '') camposFaltantes.push('Hora de Término')

      // Validar que haya al menos un laboratorista asignado
      if (laboratoristasAgendados.length === 0) camposFaltantes.push('Al menos un Laboratorista')

      // Validar que haya al menos un contacto
      if (contactos.length === 0) camposFaltantes.push('Al menos un Contacto')

      // Validar que haya al menos un servicio
      if (serviciosAgendados.length === 0) camposFaltantes.push('Al menos un Servicio')

      if (camposFaltantes.length > 0) {
        throw new Error(`Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`)
      }

      // Para duplicación, SIEMPRE crear con estado CREADA (sin importar las condiciones)
      console.log('Creando evento duplicado con estado CREADA (fijo para duplicaciones)')

      // Generar título automáticamente
      const cliente = clientes.find(c => c.clienteId === formData.clienteId)
      const serviciosPrincipales = serviciosAgendados.map(s => s.servicio).join(', ')

      // Manejar el caso cuando no hay fecha de inicio
      let fechaFormateada = 'Sin fecha'
      if (formData.fechaInicio) {
        fechaFormateada = new Date(formData.fechaInicio).toLocaleDateString('es-ES')
      }

      const tituloGenerado = `Visita ${cliente?.razonSocial} - ${serviciosPrincipales} (${fechaFormateada}) - DUPLICADA`

      const visitaData = {
        ...formData,
        titulo: tituloGenerado, // Usar el título generado con indicador de duplicación
        tipoVisita: 'EVENTO', // Las duplicaciones siempre son eventos únicos
        esRecurrente: false, // Las duplicaciones nunca son recurrentes
        estado: 'CREADA', // Las duplicaciones siempre se guardan con estado CREADA
        referencia: selectedReferencia,
        georreferencia: selectedGeorreferencia,
        servicios: serviciosAgendados.map(servicio => ({
          ...servicio,
          id: parseInt(servicio.codigo)
        })),
        laboratoristas: laboratoristasAgendados,
        equipos: equiposAgendados,
        contactos: contactos // Asegurar que se envían los contactos
      }

      console.log('Datos completos a enviar para duplicación:', visitaData)

      // Enviar la solicitud POST para crear el nuevo evento duplicado
      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitaData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al duplicar la visita')
      }

      // Cerrar sidebar y mostrar mensaje de éxito
      handleDuplicateEventSidebarToggle()

      // Recargar la lista de visitas tras guardar
      if (typeof window !== 'undefined') {
        fetch('/api/agenda')
      }

      // Mostrar mensaje de éxito (se podría implementar un toast o snackbar)
      console.log('Visita duplicada exitosamente con estado CREADA')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error?.message || 'Error al duplicar la visita')
    }
  }



  // Manejadores de cambio de datos
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
      const yaExiste = laboratoristasAgendados.some(lab => lab.id === newValue.id)
      if (yaExiste) {
        toast.error('El laboratorista ya fue agregado')
        // Aun así, cargar equipos asignados a este laboratorista seleccionado
        fetchEquipos(newValue.id)
      } else {
        const nuevoLaboratorista: LaboratoristaAgendado = {
          id: newValue.id,
          nombre: newValue.name,
          email: newValue.email
        }
        setLaboratoristasAgendados(prev => [...prev, nuevoLaboratorista])
      }
      setLaboratoristaSeleccionado(null)
      setLaboratoristaInputValue('')
      setLaboratoristaKey(prev => prev + 1)
    }
  }

  const handleAgregarEquipo = (newValue: any) => {
    if (newValue) {
      // Bloquear selección si el equipo está asignado a otro laboratorista distinto a los agendados
      const asignadoAId = newValue.funcionarioAsignado?.id
      if (asignadoAId && !laboratoristasAgendados.some(l => l.id === asignadoAId)) {
        toast.error('El equipo está asignado a otro laboratorista')
        setEquipoSeleccionado(null)
        setEquipoInputValue('')
        setEquipoKey(prev => prev + 1)
        return
      }

      const yaExiste = equiposAgendados.some(equipo => equipo.id === newValue.id)
      if (yaExiste) {
        toast.error('El equipo ya fue agregado')
      } else {
        const nuevoEquipo: EquipoAgendado = {
          id: newValue.id,
          codigo: newValue.codigo,
          nombre: newValue.nombre,
          cantidad: 1,
          observacion: ''
        }
        setEquiposAgendados(prev => [...prev, nuevoEquipo])
      }
      setEquipoSeleccionado(null)
      setEquipoInputValue('')
      setEquipoKey(prev => prev + 1)
    }
  }

  // Funciones para el buscador de servicios
  const handleOpenPopover = (anchor: HTMLElement | null) => {
    setAnchorEl(anchor)
  }

  const handleClosePopover = () => {
    setAnchorEl(null)
    setSearchTerm('')
    setSelectedArea('')
    setSelectedTipo('')
    setSelectedFamilia('')
    setSelectedAreaId(null)
    setShowOnlyPaquetes(false)
    setProductsPage(0)
  }

  const handleSelectProduct = (producto: any) => {
    setServicioSeleccionado(producto)
    handleClosePopover()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleAreaChange = (e: any) => {
    const areaNombre = e.target.value
    setSelectedArea(areaNombre)
    setSelectedFamilia('') // Resetear familia cuando cambia el área

    // Encontrar el ID del área seleccionada
    const areaSeleccionada = areas.find(a => a.nombre === areaNombre)
    setSelectedAreaId(areaSeleccionada?.id || null)
  }

  const handleFamiliaChange = (e: any) => {
    setSelectedFamilia(e.target.value)
  }

  const handleTipoChange = (e: any) => {
    setSelectedTipo(e.target.value)
  }

  const handleShowOnlyPaquetesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyPaquetes(e.target.checked)
  }

  const handleAgregarServicio = () => {
    if (!servicioSeleccionado || !cantidad) return

    const nuevoServicio: ServicioAgendado = {
      codigo: servicioSeleccionado.sku,
      servicio: servicioSeleccionado.norma ? `${servicioSeleccionado.nombre} - ${servicioSeleccionado.norma}` : servicioSeleccionado.nombre,
      cantidad: parseInt(cantidad),
      observacion: observacion || undefined,
      esSegundaVisita
    }

    setServiciosAgendados(prev => [...prev, nuevoServicio])
    setServicioSeleccionado(null)
    setCantidad('1')
    setObservacion('')
    setEsSegundaVisita(false)
  }

  // Lógica de filtrado de servicios (igual que AddEventSidebar)
  const ITEMS_PER_PAGE = 10

  // Cargar áreas al montar el componente
  useEffect(() => {
    fetch('/api/areas')
      .then(res => res.json())
      .then(data => {
        setAreas(data)
      })
      .catch(error => {
        console.error('Error al cargar áreas:', error)
      })
  }, [])

  // Cargar familias cuando cambia el área seleccionada
  useEffect(() => {
    if (selectedAreaId) {
      fetch(`/api/familias?areaId=${selectedAreaId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Error al cargar familias')
          }
          return res.json()
        })
        .then(data => {
          console.log('Familias cargadas:', data)
          setFamilias(data)
        })
        .catch(error => {
          console.error('Error al cargar familias:', error)
          setFamilias([])
        })
    } else {
      setFamilias([])
    }
  }, [selectedAreaId])

  // Carga dinámica de productos cuando cambian los filtros
  useEffect(() => {
    if (anchorEl) { // Solo ejecutar cuando el popover está abierto
      const params = new URLSearchParams()
      params.append('page', (productsPage + 1).toString())
      params.append('limit', ITEMS_PER_PAGE.toString())
      if (searchTerm) params.append('search', searchTerm)
      if (selectedArea) params.append('area', selectedArea)
      if (selectedTipo) params.append('tipo', selectedTipo)
      if (selectedFamilia) params.append('familia', selectedFamilia)
      if (showOnlyPaquetes) params.append('esPaquete', 'true')

      fetch(`/api/productos?${params.toString()}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Error al cargar servicios')
          }
          return res.json()
        })
        .then(response => {
          const data = response.productos || []
          setFilteredProductos(data)
          setTotalProductos(Number.isFinite(response.total) ? Number(response.total) : 0)
          console.log('Productos cargados:', data.length, 'de', response.total)
        })
        .catch(error => {
          console.error('Error al cargar servicios paginados:', error)
          setFilteredProductos([])
          setTotalProductos(0)
        })
    }
  }, [productsPage, searchTerm, selectedArea, selectedTipo, selectedFamilia, showOnlyPaquetes, anchorEl])

  // Resetear la página cuando cambien los filtros
  useEffect(() => {
    if (anchorEl) {
      setProductsPage(0)
    }
  }, [selectedArea, selectedTipo, selectedFamilia, searchTerm, showOnlyPaquetes])

  // Lógica de filtrado de servicios local (para cuando no se usa la API)
  const filteredProductosLocal = servicios.filter(producto => {
    const matchesSearch = !searchTerm ||
      producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.sku?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesArea = !selectedArea || producto.area === selectedArea
    const matchesTipo = !selectedTipo || producto.tipo === selectedTipo
    const matchesFamilia = !selectedFamilia || producto.familia === selectedFamilia
    const matchesPaquete = !showOnlyPaquetes || producto.esPaquete

    return matchesSearch && matchesArea && matchesTipo && matchesFamilia && matchesPaquete
  }).slice(productsPage * ITEMS_PER_PAGE, (productsPage + 1) * ITEMS_PER_PAGE)

  const totalProductosLocal = servicios.filter(producto => {
    const matchesSearch = !searchTerm ||
      producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.sku?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesArea = !selectedArea || producto.area === selectedArea
    const matchesTipo = !selectedTipo || producto.tipo === selectedTipo
    const matchesFamilia = !selectedFamilia || producto.familia === selectedFamilia
    const matchesPaquete = !showOnlyPaquetes || producto.esPaquete

    return matchesSearch && matchesArea && matchesTipo && matchesFamilia && matchesPaquete
  }).length

  console.log('Servicios totales:', servicios.length)
  console.log('Servicios filtrados:', filteredProductosLocal.length)
  console.log('Filtros activos:', { searchTerm, selectedArea, selectedTipo, selectedFamilia, showOnlyPaquetes })

  // Extraer áreas y tipos únicos de los servicios
  useEffect(() => {
    if (servicios.length > 0) {
      console.log('Procesando áreas y tipos de servicios:', servicios[0])
      const uniqueAreas = Array.from(new Set(servicios.map(s => s.area))).map(area => {
        const serviciosDeArea = servicios.filter(s => s.area === area)
        const familias = Array.from(new Set(serviciosDeArea.map(s => s.familia))).map(familia => ({
          id: familia,
          nombre: familia
        }))
        return {
          id: area,
          nombre: area,
          familias
        }
      })
      setAreas(uniqueAreas)

      const uniqueTipos = Array.from(new Set(servicios.map(s => s.tipo)))
      setTipos(uniqueTipos)

      console.log('Áreas procesadas:', uniqueAreas)
      console.log('Tipos procesados:', uniqueTipos)
    }
  }, [servicios.length])



  return (
    <>
      <Drawer
        anchor='right'
        open={duplicateEventSidebarOpen}
        onClose={handleDuplicateEventSidebarToggle}
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
                <Typography variant='h5'>Duplicar Visita</Typography>
                <Typography variant='body2' color='textSecondary'>
                  * Campo obligatorio - Debe completar fechas, horas y asignar laboratoristas
                </Typography>
              </Box>
            </Grid>



            <Grid item xs={1} display='flex' justifyContent='flex-end'>
              <Button variant='outlined' color='error' onClick={handleDuplicateEventSidebarToggle}>
                Cancelar
              </Button>
            </Grid>
          </Grid>

          {/* Contenido del formulario */}
          <Box sx={{ flex: 1, overflowY: 'auto', pt: 2 }}>
            <Grid container spacing={3}>
              {/* Primera fila: Tipo/Recurrente, Fecha, Hora inicio, Hora término */}

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
                        fullWidth: true,
                        error: !fechaInicio,
                        helperText: !fechaInicio ? 'Campo obligatorio' : ''
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Hora inicio */}
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label='Hora inicio *'
                  type='time'
                  value={horaInicio}
                  error={!horaInicio}
                  helperText={!horaInicio ? 'Campo obligatorio' : ''}
                  onChange={e => {
                    const newHoraInicio = e.target.value
                    setHoraInicio(newHoraInicio)

                    if (!newHoraInicio) return

                    const [hours, minutes] = newHoraInicio.split(':').map(Number)
                    if (isNaN(hours) || isNaN(minutes)) return

                    const newDate = fechaInicio ? new Date(fechaInicio) : new Date()
                    newDate.setHours(hours, minutes, 0, 0)

                    console.log('Cambiando hora inicio:', newHoraInicio, 'Nueva fecha:', newDate)
                    setFechaInicio(newDate)

                    // Siempre actualizar fecha fin para mantener al menos 1 hora de diferencia
                    const endDate = new Date(newDate)
                    endDate.setHours(newDate.getHours() + 1, newDate.getMinutes(), 0, 0)
                    setFechaFin(endDate)
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
                  label='Hora término *'
                  type='time'
                  value={horaFin}
                  error={!horaFin}
                  helperText={!horaFin ? 'Campo obligatorio' : ''}
                  onChange={e => {
                    const newHoraFin = e.target.value
                    setHoraFin(newHoraFin)

                    if (!newHoraFin) return

                    const [hours, minutes] = newHoraFin.split(':').map(Number)
                    if (isNaN(hours) || isNaN(minutes)) return

                    const newDate = fechaFin ? new Date(fechaFin) : new Date(fechaInicio || new Date())
                    newDate.setHours(hours, minutes, 0, 0)

                    console.log('Cambiando hora fin:', newHoraFin, 'Nueva fecha:', newDate)
                    setFechaFin(newDate)
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

                        // Cargar contactos de la obra preseleccionada y actualizar estados
                        if (obraPreseleccionada) {
                          // Cargar contactos de la obra directamente (forzar carga durante cambio manual)
                          const obraContactos = obraSeleccionada.contactos || []
                          const nuevosContactos = obraContactos.map((c: any) => ({
                            nombre: c.nombre,
                            rol: c.rol || c.cargo || '',
                            email: c.email,
                            telefono1: c.telefono1,
                            telefono2: c.telefono2,
                            isPrincipal: c.isPrincipal === true
                          }))
                          setContactos(nuevosContactos)
                          console.log('Contactos de obra cargados (cambio de cliente):', nuevosContactos)

                          // También actualizar los estados separados
                          setSelectedReferencia(obraSeleccionada.referencia || '')
                          setSelectedGeorreferencia(obraSeleccionada.georreferencia || '')
                        }
                      } else {
                        // Si hay múltiples obras, limpiar región seleccionada y contactos
                        setSelectedRegion('')
                        setContactos([])
                        setSelectedReferencia('')
                        setSelectedGeorreferencia('')

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
                        sectorComercial: obrasDelCliente.length === 1 ? prev.sectorComercial : '',
                        // Si se preselecciona una obra, llenar datos de ubicación
                        // Si no se preselecciona (múltiples obras), limpiar datos de ubicación
                        ...(obrasDelCliente.length === 1 ? {
                          direccion: obrasDelCliente[0].direccion || prev.direccion,
                          region: obrasDelCliente[0].region || prev.region,
                          comuna: obrasDelCliente[0].comuna || prev.comuna,
                          referencia: obrasDelCliente[0].referencia || prev.referencia,
                          georreferencia: obrasDelCliente[0].georreferencia || prev.georreferencia
                        } : {
                          direccion: '',
                          region: '',
                          comuna: '',
                          referencia: '',
                          georreferencia: ''
                        })
                      }))
                    } else {
                      // Si se limpia el cliente, limpiar todos los campos relacionados
                      setSelectedRegion('')
                      setContactos([])
                      setSelectedReferencia('')
                      setSelectedGeorreferencia('')

                      setFormData(prev => ({
                        ...prev,
                        clienteId: undefined,
                        obraId: undefined,
                        solicitudId: undefined,
                        sectorComercial: '',
                        region: '',
                        comuna: '',
                        direccion: '',
                        referencia: '',
                        georreferencia: ''
                      }))
                    }
                  }}
                  renderInput={params => <TextField {...params} label='Cliente' required />}
                />
              </Grid>

              {/* Obra */}
              <Grid item xs={4}>
                <Autocomplete
                  options={obrasFiltradas}
                  getOptionLabel={option => {
                    const numeroObra = option.numeroObra || option.obraId || 'S/N'
                    const comuna = option.comuna || 'Sin comuna'
                    const nombreTruncado = option.nombreObra && option.nombreObra.length > 50
                      ? `${option.nombreObra.substring(0, 50)}...`
                      : option.nombreObra || 'Sin nombre'
                    return `${numeroObra} - ${comuna} - ${nombreTruncado}`
                  }}
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
                        referencia: newValue.referencia,
                        georreferencia: newValue.georreferencia
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
                        referencia: newValue.referencia || prev.referencia,
                        georreferencia: newValue.georreferencia || prev.georreferencia
                      }))

                      // Actualizar estados de referencia y georreferencia
                      setSelectedReferencia(newValue.referencia || '')
                      setSelectedGeorreferencia(newValue.georreferencia || '')

                      // Cargar contactos de la obra seleccionada (forzar carga durante cambio manual)
                      const obraContactos = newValue.contactos || []
                      const nuevosContactos = obraContactos.map((c: any) => ({
                        nombre: c.nombre,
                        rol: c.rol || c.cargo || '',
                        email: c.email,
                        telefono1: c.telefono1,
                        telefono2: c.telefono2,
                        isPrincipal: c.isPrincipal === true
                      }))
                      setContactos(nuevosContactos)
                      console.log('Contactos de obra cargados (cambio de obra):', nuevosContactos)
                    } else {
                      // Si se limpia la obra, limpiar todos los campos relacionados
                      setSelectedRegion('')
                      setContactos([])
                      setSelectedReferencia('')
                      setSelectedGeorreferencia('')

                      setFormData(prev => ({
                        ...prev,
                        obraId: undefined,
                        solicitudId: undefined,
                        sectorComercial: '',
                        region: '',
                        comuna: '',
                        direccion: '',
                        referencia: '',
                        georreferencia: ''
                      }))
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
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={estado === 'AGENDADA' ? 'Solicitud *' : 'Solicitud'}
                      error={estado === 'AGENDADA' && !formData.solicitudId}
                      helperText={estado === 'AGENDADA' && !formData.solicitudId ? 'Campo obligatorio para eventos agendados' : ''}
                    />
                  )}
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

              {/* Dirección, Referencia y Georreferencia en la misma fila 4-4-4 */}
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label='Dirección *'
                    value={formData.direccion}
                    onChange={e => handleInputChange('direccion', e.target.value)}
                    required
                  />
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
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

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label='Georreferencia'
                  value={selectedGeorreferencia}
                  placeholder='Ej: -33.4489, -70.6693'
                  onChange={e => {
                    setSelectedGeorreferencia(e.target.value)
                    handleInputChange('georreferencia', e.target.value)
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
                <Typography variant='h5' sx={{ mb: 2 }}>
                  Detalles
                </Typography>

                {/* Buscador de servicios */}
                <Grid container spacing={2}>
                  {/* Servicio (con Autocomplete) */}
                  <Grid item xs={12} sm={3}>
                    <div ref={servicioAnchorRef} style={{ width: '100%' }}>
                      <TextField
                        fullWidth
                        size='small'
                        label='Servicio Terreno'
                        value={servicioSeleccionado ? `${servicioSeleccionado.nombre}${servicioSeleccionado.norma ? ` - ${servicioSeleccionado.norma}` : ''}` : ''}
                        onClick={() => handleOpenPopover(servicioAnchorRef.current)}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton
                                size='small'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenPopover(servicioAnchorRef.current)
                                }}
                              >
                                <i className='ri-search-line' />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </div>
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

                  {/* Segunda visita */}
                  <Grid item xs={12} sm={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={esSegundaVisita}
                          onChange={e => setEsSegundaVisita(e.target.checked)}
                        />
                      }
                      label='2da visita'
                    />
                  </Grid>

                  {/* Botón agregar */}
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant='contained'
                      color='primary'
                      onClick={handleAgregarServicio}
                      disabled={!servicioSeleccionado}
                      fullWidth
                      startIcon={<AddIcon />}
                    >
                      Agregar Servicio
                    </Button>
                  </Grid>
                </Grid>

                <Popover
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={handleClosePopover}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  PaperProps={{
                    sx: {
                      width: '100%',
                      maxWidth: '500px',
                      maxHeight: '400px',
                      overflow: 'auto',
                      zIndex: 1
                    }
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <TextField
                      fullWidth
                      size='small'
                      placeholder='Buscar por nombre, descripción o código...'
                      value={searchTerm}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position='start'>
                            <SearchIcon />
                          </InputAdornment>
                        )
                      }}
                    />

                    <Grid container spacing={2} sx={{ mt: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size='small'>
                          <InputLabel>Área</InputLabel>
                          <Select
                            value={selectedArea}
                            label='Área'
                            onChange={handleAreaChange}
                          >
                            <MenuItem value=''>Todas</MenuItem>
                            {areas.map(area => (
                              <MenuItem key={area.id} value={area.nombre}>
                                {area.nombre}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size='small'>
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            value={selectedTipo}
                            label='Tipo'
                            onChange={handleTipoChange}
                          >
                            <MenuItem value=''>Todos</MenuItem>
                            {tipos.map(tipo => (
                              <MenuItem key={tipo} value={tipo}>
                                {tipo}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <FormControl size='small' fullWidth>
                          <InputLabel shrink>Familia</InputLabel>
                          <Select
                            value={selectedFamilia}
                            label='Familia'
                            onChange={handleFamiliaChange}
                            displayEmpty
                            renderValue={selected => selected === '' ? 'Todas' : selected}
                            disabled={!selectedAreaId}
                          >
                            <MenuItem value=''>Todas</MenuItem>
                            {familias.map(familia => (
                              <MenuItem key={familia.id} value={familia.nombre}>
                                {familia.nombre}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={showOnlyPaquetes}
                          onChange={handleShowOnlyPaquetesChange}
                          size='small'
                        />
                      }
                      label='Solo paquetes'
                      sx={{ mt: 2 }}
                    />

                    <List sx={{ pt: 2 }}>
                      {filteredProductos.map(producto => (
                        <ListItem
                          key={producto.id}
                          onClick={() => handleSelectProduct(producto)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            },
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant='body1'>
                                  {producto.nombre}
                                  {producto.norma && (
                                    <Typography component='span' color='text.secondary'>
                                      {' '}- {producto.norma}
                                    </Typography>
                                  )}
                                </Typography>
                                {producto.esPaquete && (
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      backgroundColor: 'primary.main',
                                      color: 'white',
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      ml: 1
                                    }}
                                  >
                                    Paquete
                                  </Typography>
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant='caption' color='text.secondary'>
                                  {producto.area} - {producto.tipo} - {producto.familia}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    {totalProductos > ITEMS_PER_PAGE && (
                      <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                          size='small'
                          onClick={() => setProductsPage(prev => Math.max(0, prev - 1))}
                          disabled={productsPage === 0}
                        >
                          Anterior
                        </Button>
                        <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                          Página {productsPage + 1} de {Math.max(1, Math.ceil(totalProductos / ITEMS_PER_PAGE))}
                        </Typography>
                        <Button
                          size='small'
                          onClick={() =>
                            setProductsPage(prev => Math.min(Math.ceil(totalProductos / ITEMS_PER_PAGE) - 1, prev + 1))
                          }
                          disabled={productsPage >= Math.ceil(totalProductos / ITEMS_PER_PAGE) - 1}
                        >
                          Siguiente
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Popover>



                {/* Tabla de servicios agregados */}
                <TableContainer sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Servicio</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>Observación</TableCell>
                        <TableCell>2a Visita</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {serviciosAgendados.map((servicio, index) => {
                        return (
                          <TableRow key={index}>
                            <TableCell>{servicio.codigo}</TableCell>
                            <TableCell>{servicio.servicio}</TableCell>
                            <TableCell>
                              {editingIndex === index ? (
                                <TextField
                                  size='small'
                                  type='number'
                                  value={editingService?.cantidad || servicio.cantidad}
                                  onChange={e => {
                                    const newService = { ...editingService!, cantidad: parseInt(e.target.value) }
                                    setEditingService(newService)
                                  }}
                                  inputProps={{ min: 1 }}
                                  sx={{ width: '80px' }}
                                />
                              ) : (
                                <span>{servicio.cantidad}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingIndex === index ? (
                                <TextField
                                  size='small'
                                  multiline
                                  maxRows={3}
                                  value={editingService?.observacion || servicio.observacion || ''}
                                  onChange={e => {
                                    const newService = { ...editingService!, observacion: e.target.value }
                                    setEditingService(newService)
                                  }}
                                  placeholder='Agregar observación...'
                                  sx={{ minWidth: '200px' }}
                                />
                              ) : (
                                <span style={{
                                  wordBreak: 'break-word',
                                  maxWidth: '200px',
                                  whiteSpace: 'pre-wrap'
                                }}>
                                  {servicio.observacion || ''}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{servicio.esSegundaVisita ? 'Sí' : 'No'}</TableCell>
                            <TableCell>
                              {editingIndex === index ? (
                                <Box display='flex' alignItems='center' gap={1}>
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
                                </Box>
                              ) : (
                                <Box display='flex' alignItems='center' gap={1}>
                                  <IconButton
                                    size='small'
                                    onClick={() => {
                                      setEditingIndex(index)
                                      setEditingService({ ...servicio })
                                    }}
                                  >
                                    <EditIcon fontSize='small' />
                                  </IconButton>
                                  <IconButton
                                    color='error'
                                    onClick={() => {
                                      const updatedServices = serviciosAgendados.filter((_, i) => i !== index)
                                      setServiciosAgendados(updatedServices)
                                    }}
                                  >
                                    <i className='ri-delete-bin-line' />
                                  </IconButton>
                                </Box>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Sección de Laboratoristas y Equipos */}
              <Grid container item spacing={2} xs={12}>
                {/* Laboratoristas */}
                <Grid item xs={6}>
                  <Typography variant='h5' sx={{ mb: 2 }}>
                    Laboratoristas *
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
                        label='Laboratorista *'
                        placeholder='Seleccione un laboratorista para agregarlo automáticamente'
                        error={laboratoristasAgendados.length === 0}
                        helperText={laboratoristasAgendados.length === 0 ? 'Debe asignar al menos un laboratorista' : ''}
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
                        {laboratoristasAgendados.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="error">
                                Debe asignar al menos un laboratorista
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          laboratoristasAgendados.map((laboratorista, index) => (
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
                          ))
                        )}
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
                    options={[...equipos].sort((a, b) => Number(!!b.esAsignadoAlLaboratorista) - Number(!!a.esAsignadoAlLaboratorista))}
                    getOptionLabel={option => `${option.codigo} - ${option.nombre}${option.tipoEquipo ? ` (${option.tipoEquipo.tipo})` : ''}`}
                    value={equipoSeleccionado}
                    inputValue={equipoInputValue}
                    onInputChange={(_, newInputValue) => {
                      setEquipoInputValue(newInputValue)
                    }}
                    onChange={(_, newValue) => handleAgregarEquipo(newValue)}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} key={option.id}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ fontWeight: option.esAsignadoAlLaboratorista ? 'bold' : 'normal' }}>
                              {option.codigo} - {option.nombre}
                            </Typography>
                            {option.esAsignadoAlLaboratorista && (
                              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                ASIGNADO
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {option.tipoEquipo && (
                              <Typography variant="caption" color="text.secondary">
                                Tipo: {option.tipoEquipo.tipo}
                              </Typography>
                            )}
                            {option.serie && (
                              <Typography variant="caption" color="text.secondary">
                                • Serie: {option.serie}
                              </Typography>
                            )}
                            {option.funcionarioAsignado && !option.esAsignadoAlLaboratorista && (
                              <Typography variant="caption" color="warning.main">
                                • Asignado a: {option.funcionarioAsignado.name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Equipo'
                        placeholder='Seleccione un equipo para agregarlo automáticamente'
                        helperText={laboratoristasAgendados.length > 0 ? 'Mostrando equipos del último laboratorista seleccionado primero' : 'Todos los equipos disponibles'}
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
                  rows={4}
                  label='Observaciones'
                  value={formData.observaciones}
                  onChange={e => handleInputChange('observaciones', e.target.value)}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Botón Duplicar */}
          <Grid container spacing={2} mt={2} mb={2}>
            <Grid item xs={12} display='flex' justifyContent='flex-start'>
              <Tooltip
                title={!isFormValid ? 'Complete todos los campos obligatorios: fechas, horas y laboratoristas' : ''}
                arrow
              >
                <span>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                  >
                    <ContentCopyIcon sx={{ mr: 1 }} />
                    Duplicar Visita
                  </Button>
                </span>
              </Tooltip>
            </Grid>
          </Grid>


          <AddContact
            open={addContactOpen}
            handleClose={() => setAddContactOpen(false)}
            onContactCreated={handleAddContact}
          />
        </Box>
      </Drawer >
    </>
  )
}

export default DuplicateEventSidebar
