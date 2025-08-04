import { useState, useEffect, useRef, useCallback } from 'react'

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
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import Autocomplete from '@mui/material/Autocomplete'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Divider from '@mui/material/Divider'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import { toast } from 'react-hot-toast'
import Popover from '@mui/material/Popover'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Switch from '@mui/material/Switch'
import Pagination from '@mui/material/Pagination'
import { SelectChangeEvent } from '@mui/material/Select'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { es } from 'date-fns/locale'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'

import { useUbicacion } from '@/hooks/useUbicacion'
import ContactSearch from '@/views/apps/clients/components/ContactSearch'
import AddContact from '@/views/apps/contacts/list/AddContact'
import type { ContactType } from '@/types/apps/contactTypes'
import { SECTORES_COMERCIALES } from '@/constants/sectoresComerciales'
import { formatDateForBackend, formatDateForBackendPreserveTime } from '@/utils/dateUtils'
import RecurringEventModal, { RecurringEventData } from './modals/RecurringEventModal'
import { generateRecurringEventInstances, validateRecurringConfig } from '@/utils/recurringEventUtils'

// Constantes
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
] as const

// Funciones de utilidad
const formatPhone = (value: string) => {
  // Permitir solo números y el signo +
  let formatted = value.replace(/[^\d+]/g, '')

  // Asegurar que el + solo esté al inicio
  if (formatted.includes('+')) {
    formatted = '+' + formatted.replace(/\+/g, '')
  }

  return formatted
}

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
  georreferencia?: string
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
  region: string
  comuna: string
  obraId: number
  nombreObra: string
  direccion: string
  clienteId: number,
  contactos: ContactoObraForm[],
  referencia: string,
  georreferencia?: string,
  numeroObra: string,
  estadoObra: string
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
  sku: string
  nombre: string
  descripcion?: string
  area?: string
  tipo?: string
  familia?: string
  esPaquete?: boolean
  norma?: string
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
  name: string
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

interface ContactoObraForm {
  id?: string
  rol: string
  nombre: string
  email: string
  telefono1: string
  telefono2?: string
  isPrincipal: boolean
}

interface ContactoAgendaForm {
  id?: string
  rol: string
  nombre: string
  email: string
  telefono1: string
  telefono2?: string
  isPrincipal: boolean
}

const initialData: FormData = {
  titulo: '',
  tipoVisita: 'EVENTO',
  esRecurrente: false,
  fechaInicio: '',
  fechaFin: '',
  sectorComercial: '',
  region: '',
  comuna: '',
  observaciones: '',
  direccion: '',
  referencia: '',
  georreferencia: '',
  servicios: [],
  laboratoristas: [],
  equipos: [],
  estado: 'CREADA'
}

const AddEventSidebar = ({ addEventSidebarOpen, handleAddEventSidebarToggle }: AddEventSidebarProps) => {
  const [formData, setFormData] = useState<FormData>(initialData)
  const [estado, setEstado] = useState('CREADA')
  const [editandoEstado, setEditandoEstado] = useState(false)

  // Estados para los datos de las listas desplegables
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [solicitudesFiltradas, setSolicitudesFiltradas] = useState<Solicitud[]>([])
  const [todasLasSolicitudes, setTodasLasSolicitudes] = useState<Solicitud[]>([]) // Para mantener todas las solicitudes

  // Estados para los servicios
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [serviciosAgendados, setServiciosAgendados] = useState<ServicioAgendado[]>([])
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null)
  const [cantidad, setCantidad] = useState<string>('1')
  const [observacion, setObservacion] = useState<string>('')
  const [esSegundaVisita, setEsSegundaVisita] = useState<boolean>(false)
  const [selectedSectorComercial, setSelectedSectorComercial] = useState<string>('')
  const [selectedReferencia, setSelectedReferencia] = useState<string>('')
  const [selectedGeorreferencia, setSelectedGeorreferencia] = useState<string>('')

  // Estados para laboratoristas
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
  const [laboratoristaSeleccionado, setLaboratoristaSeleccionado] = useState<Laboratorista | null>(null)
  const [laboratoristasAgendados, setLaboratoristasAgendados] = useState<LaboratoristaAgendado[]>([])
  const [laboratoristaInputValue, setLaboratoristaInputValue] = useState<string>('')
  const [laboratoristaKey, setLaboratoristaKey] = useState<number>(0) // Para forzar re-render

  // Estados para equipos
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [equiposAgendados, setEquiposAgendados] = useState<EquipoAgendado[]>([])
  const [equipoInputValue, setEquipoInputValue] = useState<string>('')
  const [equipoKey, setEquipoKey] = useState<number>(0) // Para forzar re-render

  // Estados para edición de servicios en la tabla
  const [editingServiceIndex, setEditingServiceIndex] = useState<number | null>(null)
  const [editingServiceData, setEditingServiceData] = useState<{
    cantidad: string
    observacion: string
  }>({ cantidad: '', observacion: '' })

  // Nuevo estado para los contactos de la obra
  const [contactos, setContactos] = useState<ContactoAgendaForm[]>([])

  const [nuevoContacto, setNuevoContacto] = useState<ContactoAgendaForm>({
    rol: '',
    nombre: '',
    email: '',
    telefono1: '',
    isPrincipal: false
  })

  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)

  const [editingContact, setEditingContact] = useState<ContactoAgendaForm>({
    rol: '',
    nombre: '',
    email: '',
    telefono1: '',
    isPrincipal: false
  })



  // Renombrar comunas del hook para evitar conflictos
  const { regiones, comunas: comunasRegion, selectedRegion, setSelectedRegion } = useUbicacion()

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
      const newFormattedDate = formatDateForBackendPreserveTime(fechaInicio)
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
  }, [fechaInicio])

  useEffect(() => {
    if (fechaFin) {
      const newFormattedDate = formatDateForBackendPreserveTime(fechaFin)
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
  }, [fechaFin])

  // Sincronizar fechaFin con fechaInicio cuando el tipo de visita es EVENTO
  useEffect(() => {
    if (formData.tipoVisita === 'EVENTO' && fechaInicio) {
      const endDate = new Date(fechaInicio)
      // Mantener la hora de fin actual si existe, sino usar hora de inicio + 1
      if (fechaFin) {
        endDate.setHours(fechaFin.getHours(), fechaFin.getMinutes())
      } else {
        endDate.setHours(fechaInicio.getHours() + 1)
      }
      // Solo actualizar si la fecha es diferente para evitar loops
      if (!fechaFin || fechaFin.getTime() !== endDate.getTime()) {
        setFechaFin(endDate)
      }
    }
  }, [formData.tipoVisita, fechaInicio])

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

        // Cargar solicitudes
        console.log('Intentando cargar solicitudes...')
        const solicitudesRes = await fetch('/api/requests')

        console.log('Status de la respuesta:', solicitudesRes.status)

        const solicitudesData = await solicitudesRes.json()

        console.log('Datos crudos de solicitudes:', solicitudesData)

        if (Array.isArray(solicitudesData)) {
          console.log('Número de solicitudes:', solicitudesData.length)
          setSolicitudes(solicitudesData)
          setTodasLasSolicitudes(solicitudesData) // Guardar todas las solicitudes
          setSolicitudesFiltradas(solicitudesData) // Inicialmente mostrar todas
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

  // Cargar obras cuando se selecciona un cliente
  useEffect(() => {
    const fetchObras = async () => {
      if (!formData.clienteId) {
        setObras([])
        return
      }

      // Encontrar el RUT del cliente seleccionado
      const clienteSeleccionado = clientes.find(c => c.clienteId === formData.clienteId)
      if (!clienteSeleccionado) {
        setObras([])
        return
      }

      try {
        console.log('Cargando obras para cliente RUT:', clienteSeleccionado.rut)
        const obrasRes = await fetch(`/api/obras?rut=${clienteSeleccionado.rut}`)
        const obrasData = await obrasRes.json()

        console.log('Obras cargadas:', obrasData)

        // Filtrar solo obras activas y ordenar por número de obra descendente
        const obrasActivas = obrasData
          .filter((obra: any) => obra.estadoObra === 'activa')
          .sort((a: any, b: any) => {
            const numeroA = parseInt(a.numeroObra) || 0
            const numeroB = parseInt(b.numeroObra) || 0
            return numeroB - numeroA // Orden descendente (más reciente primero)
          })

        setObras(obrasActivas)
      } catch (error) {
        console.error('Error al cargar obras:', error)
        setObras([])
      }
    }

    fetchObras()
  }, [formData.clienteId, clientes])

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

        // Transformar los datos al formato esperado
        const formattedLaboratoristas = data.map((lab: any) => ({
          id: lab.id,
          name: lab.name,
          email: lab.email,
          rol: lab.roles?.[0]?.rol?.nombre || 'Sin rol asignado'
        }))

        console.log('formattedLaboratoristas', formattedLaboratoristas)

        setLaboratoristas(formattedLaboratoristas)
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

  // efecto para ver los contactos actualizados
  useEffect(() => {
    console.log('contactos actualizados:', contactos)
  }, [contactos])

  // efecto combinado para cargar los contactos y actualizar formData cuando se selecciona una obra
  useEffect(() => {
    if (formData.obraId) {
      const obraSeleccionada = obras.find(obra => obra.obraId === formData.obraId)
      if (obraSeleccionada) {
        // Actualizar contactos
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
        setSelectedReferencia(obraSeleccionada.referencia || '')
        setSelectedGeorreferencia(obraSeleccionada.georreferencia || '')

        // Actualizar formData con los datos de la obra
        setFormData(prev => ({
          ...prev,
          region: obraSeleccionada.region || '',
          comuna: obraSeleccionada.comuna || '',
          direccion: obraSeleccionada.direccion || '',
          referencia: obraSeleccionada.referencia || '',
          georreferencia: obraSeleccionada.georreferencia || ''
        }))

        // Actualizar el estado de región seleccionada para que se carguen las comunas
        if (obraSeleccionada.region) {
          setSelectedRegion(obraSeleccionada.region)
        }

        // Filtrar solicitudes por obra seleccionada
        const solicitudesDeObra = todasLasSolicitudes.filter(solicitud =>
          solicitud.obra && solicitud.obra.obraId === formData.obraId
        )
        setSolicitudesFiltradas(solicitudesDeObra)
        console.log('Solicitudes filtradas para obra:', solicitudesDeObra)
      }
    } else {
      // Si no hay obra seleccionada, limpiar contactos y mostrar todas las solicitudes
      setContactos([])
      setSelectedReferencia('')
      setSelectedGeorreferencia('')
      setSolicitudesFiltradas(todasLasSolicitudes)
    }
  }, [formData.obraId, obras, todasLasSolicitudes])

  // Estados para el buscador de servicios
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('Terreno')
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [tipos, setTipos] = useState<string[]>([])
  const [familias, setFamilias] = useState<Array<{ id: number; nombre: string; areaId: number }>>([])
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [loadingProductos, setLoadingProductos] = useState(false)
  const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
  const [filteredProductos, setFilteredProductos] = useState<Servicio[]>([])
  const [totalProductos, setTotalProductos] = useState(0)
  const [productsPage, setProductsPage] = useState(0)
  const ITEMS_PER_PAGE = 10

  // Refs para el buscador de servicios
  const servicioAnchorRef = useRef<HTMLDivElement>(null)

  // Cargar tipos y familias al montar el componente
  useEffect(() => {
    // Cargar todos los servicios para obtener tipos y familias únicas
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
        const uniqueTipos = Array.from(new Set(data.map((s: Servicio) => s.tipo || 'Sin tipo')))
          .filter(tipo => tipo)
          .sort()

        // Obtener familias únicas
        const uniqueFamilias = Array.from(new Set(data.map((s: Servicio) => s.familia || 'Sin familia')))
          .filter(familia => familia)
          .sort()

        setTipos(uniqueTipos as string[])
        setFamilias(uniqueFamilias.map((f, index) => ({ id: index, nombre: String(f), areaId: 0 })))
        setServicios(data)
      })
      .catch(error => {
        console.error('Error al cargar servicios:', error)
        toast.error('Error al cargar los servicios')
        setServicios([])
      })
  }, [])

  // Cargar áreas al montar el componente
  useEffect(() => {
    fetch('/api/areas')
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al cargar áreas')
        }
        return res.json()
      })
      .then(data => {
        console.log('Áreas cargadas:', data)
        setAreas(data)
      })
      .catch(error => {
        console.error('Error al cargar áreas:', error)
        toast.error('Error al cargar las áreas')
        setAreas([])
      })
  }, [])

  // Cargar familias cuando se selecciona un área
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
          toast.error('Error al cargar las familias')
          setFamilias([])
        })
    } else {
      setFamilias([])
    }
  }, [selectedAreaId])

  const handleAreaChange = (e: SelectChangeEvent<string>) => {
    const areaNombre = e.target.value
    setSelectedArea(areaNombre)
    setSelectedFamilia('') // Resetear familia cuando cambia el área

    // Encontrar el ID del área seleccionada
    const areaSeleccionada = areas.find(a => a.nombre === areaNombre)
    setSelectedAreaId(areaSeleccionada?.id || null)
  }

  const handleFamiliaChange = (e: SelectChangeEvent<string>) => {
    setSelectedFamilia(e.target.value)
  }

  const handleTipoChange = (e: SelectChangeEvent<string>) => {
    setSelectedTipo(e.target.value)
  }

  const handleClearFilters = () => {
    setSelectedArea('')
    setSelectedAreaId(null)
    setSelectedTipo('')
    setSelectedFamilia('')
    setSearchTerm('')
    setShowOnlyPaquetes(false)
    setProductsPage(0)
  }

  // Modificar el useEffect de paginación
  useEffect(() => {
    if (anchorEl) { // Solo ejecutar cuando el popover está abierto
      const params = new URLSearchParams()
      params.append('page', (productsPage + 1).toString())
      params.append('limit', ITEMS_PER_PAGE.toString())
      if (searchTerm) params.append('search', searchTerm)
      if (selectedArea) params.append('area', selectedArea)
      if (selectedTipo) params.append('tipo', selectedTipo)
      if (selectedFamilia) params.append('familia', selectedFamilia)

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
        })
        .catch(error => {
          console.error('Error al cargar servicios paginados:', error)
          toast.error('Error al cargar los servicios')
          setFilteredProductos([])
          setTotalProductos(0)
        })
    }
  }, [productsPage, searchTerm, selectedArea, selectedTipo, selectedFamilia, anchorEl])

  // Resetear la página cuando cambien los filtros
  useEffect(() => {
    if (anchorEl) {
      setProductsPage(0)
    }
  }, [selectedArea, selectedTipo, selectedFamilia, searchTerm])

  // Función para filtrar productos
  const filterProducts = (search: string, area: string, tipo: string, familia: string, onlyPaquetes = showOnlyPaquetes) => {
    const params = new URLSearchParams()
    params.append('page', '1')
    params.append('limit', ITEMS_PER_PAGE.toString())
    if (search) params.append('search', search)
    if (area) params.append('area', area)
    if (tipo) params.append('tipo', tipo)
    if (familia) params.append('familia', familia)
    if (onlyPaquetes) params.append('esPaquete', 'true')

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
      })
      .catch(error => {
        console.error('Error al cargar servicios:', error)
        toast.error('Error al cargar los servicios')
        setFilteredProductos([])
        setTotalProductos(0)
      })
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchTerm(event.target.value)
    filterProducts(event.target.value, selectedArea, selectedTipo, selectedFamilia)
  }

  const handleOpenPopover = (element: HTMLElement | null) => {
    setAnchorEl(element)
    setLoadingProductos(true)
    setProductsPage(0)
    setSearchTerm('')
    setSelectedArea('')
    setSelectedAreaId(null)
    setSelectedTipo('Terreno')
    setSelectedFamilia('')
    setShowOnlyPaquetes(false)
    filterProducts('', '', 'Terreno', '', false)
    setLoadingProductos(false)
  }

  const handleClosePopover = () => {
    setAnchorEl(null)
  }

  const handleSelectProduct = (producto: Servicio) => {
    setServicioSeleccionado(producto)
    handleClosePopover()
  }

  const handleShowOnlyPaquetesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyPaquetes(event.target.checked)
    filterProducts(searchTerm, selectedArea, selectedTipo, selectedFamilia, event.target.checked)
  }

  const handleSubmit = async () => {
    try {
      // Si es evento recurrente, solo abrir el modal de configuración
      if (formData.tipoVisita === 'RECURRENTE') {
        // Solo validar fechas básicas para la configuración de recurrencia
        if (!formData.fechaInicio) {
          toast.error('Por favor seleccione una fecha de inicio')
          return
        }
        if (!formData.fechaFin) {
          toast.error('Por favor seleccione una fecha de fin')
          return
        }
        setRecurringModalOpen(true)
        return
      }

      // Validación detallada de campos requeridos para eventos normales
      const camposFaltantes = []

      // Campos siempre requeridos
      if (!formData.fechaInicio) camposFaltantes.push('Fecha y Hora de Inicio')
      if (!formData.fechaFin) camposFaltantes.push('Fecha y Hora de Término')
      if (!formData.clienteId) camposFaltantes.push('Cliente')
      if (!formData.obraId) camposFaltantes.push('Obra')
      if (!formData.sectorComercial) camposFaltantes.push('Sector Comercial')
      if (!formData.region) camposFaltantes.push('Región')
      if (!formData.comuna) camposFaltantes.push('Comuna')
      if (!formData.direccion) camposFaltantes.push('Dirección')

      // Solicitud es obligatoria solo para estado AGENDADO
      if (estado === 'AGENDADA' && !formData.solicitudId) {
        camposFaltantes.push('Solicitud')
      }

      // Validar que haya al menos un contacto
      if (contactos.length === 0) camposFaltantes.push('Al menos un Contacto')

      // Validar que haya al menos un servicio
      if (serviciosAgendados.length === 0) camposFaltantes.push('Al menos un Servicio')

      if (camposFaltantes.length > 0) {
        throw new Error(`Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`)
      }

      // Generar título automáticamente
      const cliente = clientes.find(c => c.clienteId === formData.clienteId)
      const serviciosPrincipales = serviciosAgendados.map(s => s.servicio).join(', ')
      const fechaFormateada = new Date(formData.fechaInicio).toLocaleDateString('es-ES')

      const tituloGenerado = `Visita ${cliente?.razonSocial} - ${serviciosPrincipales} (${fechaFormateada})`

      // Preparar datos para enviar
      const visitaData = {
        ...formData,
        titulo: tituloGenerado,
        estado: estado,
        referencia: selectedReferencia,
        georreferencia: selectedGeorreferencia,
        servicios: serviciosAgendados.map(servicio => ({
          ...servicio,
          id: parseInt(servicio.codigo)
        })),
        laboratoristas: laboratoristasAgendados,
        equipos: equiposAgendados,
        contactos: contactos
      }

      await createSingleEvent(visitaData)

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error?.message || 'Error al crear la visita')
    }
  }

  const createSingleEvent = async (visitaData: any) => {
    console.log('Datos completos a enviar:', visitaData)

    // Enviar la solicitud POST para crear el evento
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

    // Verificar si algún servicio tiene SKU 2002 para crear evento automático
    const tieneSKU2002 = serviciosAgendados.some(servicio => servicio.codigo === '2002')

    if (tieneSKU2002) {
      try {
        // Buscar el servicio con SKU 2003
        const servicio2003 = servicios.find(s => s.sku === '2003')

        if (servicio2003) {
          // Calcular fecha 7 días en el futuro
          const fechaSeguimiento = new Date(fechaInicio!)
          fechaSeguimiento.setDate(fechaSeguimiento.getDate() + 7)

          const fechaFinSeguimiento = new Date(fechaSeguimiento)
          fechaFinSeguimiento.setHours(fechaSeguimiento.getHours() + 1)

          // Preparar datos para el evento de seguimiento
          const eventoSeguimiento = {
            ...visitaData,
            titulo: `Seguimiento ${clientes.find(c => c.clienteId === formData.clienteId)?.razonSocial} - ${servicio2003.nombre} (${fechaSeguimiento.toLocaleDateString('es-ES')})`,
            fechaInicio: formatDateForBackendPreserveTime(fechaSeguimiento),
            fechaFin: formatDateForBackendPreserveTime(fechaFinSeguimiento),
            servicios: [{
              codigo: servicio2003.sku,
              servicio: servicio2003.norma ? `${servicio2003.nombre} - ${servicio2003.norma}` : servicio2003.nombre,
              cantidad: 1,
              esSegundaVisita: true
            }],
            observaciones: `Evento de seguimiento automático generado por servicio SKU 2002. ${visitaData.observaciones || ''}`.trim()
          }

          // Crear el evento de seguimiento
          const seguimientoResponse = await fetch('/api/agenda', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventoSeguimiento)
          })

          if (seguimientoResponse.ok) {
            toast.success('Visita creada exitosamente. Se ha programado automáticamente una visita de seguimiento para 7 días después.')
          } else {
            toast.success('Visita creada exitosamente. Error al crear la visita de seguimiento automática.')
          }
        } else {
          toast.success('Visita creada exitosamente. No se pudo encontrar el servicio SKU 2003 para el seguimiento automático.')
        }
      } catch (error) {
        console.error('Error al crear evento de seguimiento:', error)
        toast.success('Visita creada exitosamente. Error al crear la visita de seguimiento automática.')
      }
    } else {
      toast.success('Visita creada exitosamente')
    }

    // Cerrar sidebar
    handleCloseSidebar()
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

  // Funciones para editar servicios en la tabla
  const handleEditService = (index: number) => {
    setEditingServiceIndex(index)
    setEditingServiceData({
      cantidad: serviciosAgendados[index].cantidad.toString(),
      observacion: serviciosAgendados[index].observacion || ''
    })
  }

  const handleSaveService = () => {
    if (editingServiceIndex !== null && editingServiceData.cantidad) {
      const nuevaCantidad = parseInt(editingServiceData.cantidad)
      if (nuevaCantidad > 0) {
        const updatedServicios = serviciosAgendados.map((servicio, index) =>
          index === editingServiceIndex ? {
            ...servicio,
            cantidad: nuevaCantidad,
            observacion: editingServiceData.observacion || undefined
          } : servicio
        )
        setServiciosAgendados(updatedServicios)
      }
    }
    setEditingServiceIndex(null)
    setEditingServiceData({ cantidad: '', observacion: '' })
  }

  const handleCancelServiceEdit = () => {
    setEditingServiceIndex(null)
    setEditingServiceData({ cantidad: '', observacion: '' })
  }





  const handleEditClick = (index: number) => {
    setEditingContactIndex(index)
    setEditingContact({
      ...contactos[index]
    })
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

  const handleCancelEdit = () => {
    setEditingContactIndex(null)
  }

  const handleDeleteContacto = (index: number) => {
    const updatedContactos = contactos.filter((_, i) => i !== index)

    setContactos(updatedContactos)
  }

  const agregarContacto = () => {
    if (!nuevoContacto.rol || !nuevoContacto.nombre || !nuevoContacto.email || !nuevoContacto.telefono1) return

    const newContact: ContactoAgendaForm = {
      ...nuevoContacto,
      isPrincipal: contactos.length === 0
    }

    setContactos([...contactos, newContact])
    setNuevoContacto({
      rol: '',
      nombre: '',
      email: '',
      telefono1: '',
      isPrincipal: false
    })
  }

  // Estado para el drawer de nuevo contacto
  const [addContactOpen, setAddContactOpen] = useState(false)

  // Estados para eventos recurrentes
  const [recurringModalOpen, setRecurringModalOpen] = useState(false)
  const [recurringData, setRecurringData] = useState<RecurringEventData | null>(null)

  // Función para manejar la confirmación de eventos recurrentes
  const handleRecurringConfirm = async (recurringConfig: RecurringEventData) => {
    try {
      // Validar la configuración de recurrencia
      const validationErrors = validateRecurringConfig(recurringConfig)
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '))
      }

      // Cerrar el modal de configuración
      setRecurringModalOpen(false)

      // Guardar la configuración de recurrencia
      setRecurringData(recurringConfig)

      // Mostrar mensaje de que la configuración fue guardada
      toast.success('Configuración de recurrencia guardada. Complete los datos del evento y presione "Crear Eventos Recurrentes"')

    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error?.message || 'Error al configurar la recurrencia')
    }
  }

  // Nueva función para crear eventos recurrentes después de configurar
  const handleCreateRecurringEvents = async () => {
    try {
      if (!recurringData) {
        toast.error('Primero debe configurar la recurrencia')
        return
      }

      // Validar campos requeridos del formulario
      const camposFaltantes = []
      if (!formData.clienteId) camposFaltantes.push('Cliente')
      if (!formData.obraId) camposFaltantes.push('Obra')
      if (!formData.sectorComercial) camposFaltantes.push('Sector Comercial')
      if (!formData.region) camposFaltantes.push('Región')
      if (!formData.comuna) camposFaltantes.push('Comuna')
      if (!formData.direccion) camposFaltantes.push('Dirección')
      if (contactos.length === 0) camposFaltantes.push('Al menos un Contacto')
      if (serviciosAgendados.length === 0) camposFaltantes.push('Al menos un Servicio')

      if (camposFaltantes.length > 0) {
        throw new Error(`Por favor complete los siguientes campos antes de crear los eventos recurrentes: ${camposFaltantes.join(', ')}`)
      }

      // Generar todas las instancias del evento recurrente
      const instancias = generateRecurringEventInstances(recurringData)

      if (instancias.length === 0) {
        throw new Error('No se pudieron generar eventos con la configuración especificada')
      }

      // Preparar datos base del evento
      const cliente = clientes.find(c => c.clienteId === formData.clienteId)
      const serviciosPrincipales = serviciosAgendados.map(s => s.servicio).join(', ')

      const baseEventData = {
        ...formData,
        estado: 'CREADA', // Los eventos recurrentes siempre se crean con estado CREADA
        referencia: selectedReferencia,
        georreferencia: selectedGeorreferencia,
        servicios: serviciosAgendados.map(servicio => ({
          ...servicio,
          id: parseInt(servicio.codigo)
        })),
        laboratoristas: laboratoristasAgendados,
        equipos: equiposAgendados,
        contactos: contactos
      }

      // Crear cada instancia del evento
      const eventosCreados = []
      const errores = []

      for (const instancia of instancias) {
        try {
          const fechaFormateada = instancia.fecha.toLocaleDateString('es-ES')
          const tituloGenerado = `Visita ${cliente?.razonSocial} - ${serviciosPrincipales} (${fechaFormateada})`

          const eventoData = {
            ...baseEventData,
            titulo: tituloGenerado,
            fechaInicio: instancia.fechaInicio,
            fechaFin: instancia.fechaFin,
            tipoVisita: 'EVENTO', // Cada instancia es un evento individual
            esRecurrente: false
          }

          const response = await fetch('/api/agenda', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventoData)
          })

          if (response.ok) {
            eventosCreados.push(instancia.fecha)
          } else {
            const error = await response.json()
            errores.push(`${fechaFormateada}: ${error.message || 'Error desconocido'}`)
          }
        } catch (error: any) {
          const fechaFormateada = instancia.fecha.toLocaleDateString('es-ES')
          errores.push(`${fechaFormateada}: ${error.message || 'Error desconocido'}`)
        }
      }

      // Mostrar resultado
      if (eventosCreados.length > 0) {
        if (errores.length === 0) {
          toast.success(`Se crearon exitosamente ${eventosCreados.length} eventos recurrentes`)
        } else {
          toast.success(`Se crearon ${eventosCreados.length} eventos. ${errores.length} eventos fallaron`)
          console.warn('Errores en eventos recurrentes:', errores)
        }
      } else {
        throw new Error('No se pudo crear ningún evento recurrente')
      }

      // Cerrar sidebar
      handleCloseSidebar()

    } catch (error: any) {
      console.error('Error creando eventos recurrentes:', error)
      toast.error(error?.message || 'Error al crear los eventos recurrentes')
    }
  }

  // Función para agregar el contacto creado
  const handleAddContact = (contact: ContactType) => {
    if (!contact) return
    const newContact: ContactoAgendaForm = {
      nombre: contact.nombre,
      rol: (contact.rol || contact.cargo || ''),
      email: contact.email,
      telefono1: contact.telefono1,
      telefono2: contact.telefono2,
      isPrincipal: contactos.length === 0
    }
    setContactos([...contactos, newContact])
  }

  // Función para resetear todos los datos del formulario
  const resetFormData = useCallback(() => {
    setFormData(initialData)
    setEstado('CREADA')
    setEditandoEstado(false)

    // Resetear fechas
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    setFechaInicio(now)
    setFechaFin(now)

    // Resetear servicios
    setServiciosAgendados([])
    setServicioSeleccionado(null)
    setCantidad('1')
    setObservacion('')
    setEsSegundaVisita(false)

    // Resetear laboratoristas
    setLaboratoristasAgendados([])
    setLaboratoristaSeleccionado(null)
    setLaboratoristaInputValue('')
    setLaboratoristaKey(prev => prev + 1)

    // Resetear equipos
    setEquiposAgendados([])
    setEquipoSeleccionado(null)
    setEquipoInputValue('')
    setEquipoKey(prev => prev + 1)

    // Resetear contactos
    setContactos([])
    setNuevoContacto({
      rol: '',
      nombre: '',
      email: '',
      telefono1: '',
      isPrincipal: false
    })
    setEditingContactIndex(null)
    setEditingContact({
      rol: '',
      nombre: '',
      email: '',
      telefono1: '',
      isPrincipal: false
    })

    // Resetear ubicación
    setSelectedRegion('')
    setSelectedSectorComercial('')
    setSelectedReferencia('')
    setSelectedGeorreferencia('')

    // Resetear solicitudes filtradas - mostrar todas
    setSolicitudesFiltradas(todasLasSolicitudes)

    // Resetear filtros de servicios
    setSelectedArea('')
    setSelectedAreaId(null)
    setSelectedTipo('Terreno')
    setSelectedFamilia('')
    setSearchTerm('')
    setShowOnlyPaquetes(false)
    setProductsPage(0)

    // Cerrar popovers
    setAnchorEl(null)
    setAddContactOpen(false)

    // Resetear estados de eventos recurrentes
    setRecurringModalOpen(false)
    setRecurringData(null)
  }, [todasLasSolicitudes])

  // Función personalizada para cerrar el sidebar
  const handleCloseSidebar = useCallback(() => {
    resetFormData()
    handleAddEventSidebarToggle()
  }, [resetFormData, handleAddEventSidebarToggle])



  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleCloseSidebar}
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
              <Typography variant='h5'>Crear Una Visita</Typography>
              <Typography variant='body2' color='textSecondary'>
                * Campo obligatorio
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={2}>
            <Box display='flex' alignItems='center' gap={1}>
              <Typography variant='body2'>Estado</Typography>
              {/* {editandoEstado ? (
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
                    <MenuItem value='CREADA'>Creada</MenuItem>
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
              )} */}
              <>
                <Typography variant='body2'>{estado}</Typography>
              </>
            </Box>
          </Grid>

          <Grid item xs={1} display='flex' justifyContent='flex-end'>
            <Button variant='outlined' color='error' onClick={handleCloseSidebar}>
              Cancelar
            </Button>
          </Grid>
        </Grid>

        {/* Selección de tipo de visita - PRIMERA SECCIÓN */}
        <Grid container spacing={2} mt={3} justifyContent='center'>
          <Grid item xs={12}>
            <Box
              sx={{
                p: 3,
                border: '2px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: '#fafafa',
                textAlign: 'center'
              }}
            >
              <Typography variant='h6' sx={{ color: 'primary.main', mb: 2 }}>
                Seleccione el Tipo de Visita
              </Typography>
              <RadioGroup
                row
                value={formData.tipoVisita}
                onChange={e => {
                  const value = e.target.value
                  setFormData(prev => ({
                    ...prev,
                    tipoVisita: value,
                    esRecurrente: value === 'RECURRENTE'
                  }))

                  // Abrir modal automáticamente cuando se selecciona RECURRENTE
                  if (value === 'RECURRENTE') {
                    setRecurringModalOpen(true)
                  } else {
                    // Cerrar modal si se cambia a EVENTO
                    setRecurringModalOpen(false)
                  }
                }}
                sx={{ justifyContent: 'center' }}
              >
                <FormControlLabel
                  value='EVENTO'
                  control={<Radio />}
                  label='Evento Único'
                  sx={{ mr: 4 }}
                />
                <FormControlLabel
                  value='RECURRENTE'
                  control={<Radio />}
                  label='Evento Recurrente'
                />
              </RadioGroup>
              {!formData.tipoVisita && (
                <Typography variant='caption' color='error' sx={{ mt: 1, display: 'block' }}>
                  Debe seleccionar un tipo de visita
                </Typography>
              )}
              {formData.tipoVisita === 'RECURRENTE' && (
                <Typography variant='caption' color='info.main' sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                  Configure primero las fechas de recurrencia en el modal, luego complete los demás datos del evento
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Formulario principal - Solo se muestra si se ha seleccionado un tipo */}
        {formData.tipoVisita && (
          <>
            {/* Sección de fechas y horarios */}
            <Grid container spacing={2} mt={4} alignItems='center'>
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Fechas y Horarios
                </Typography>
              </Grid>

              {/* Fecha Inicio */}
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
                        // Si el tipo de visita es EVENTO, sincronizar fechaFin con fechaInicio
                        else if (formData.tipoVisita === 'EVENTO') {
                          const endDate = new Date(newDate)
                          // Mantener la hora de fin actual si existe
                          if (fechaFin) {
                            endDate.setHours(fechaFin.getHours(), fechaFin.getMinutes())
                          } else {
                            endDate.setHours(newDate.getHours() + 1)
                          }
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

              {/* Fecha Fin */}
              <Grid item xs={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label='Fecha Fin'
                    value={fechaFin}
                    onChange={newDate => {
                      if (newDate) {
                        setFechaFin(newDate)
                      }
                    }}
                    minDate={fechaInicio || undefined}
                    disabled={formData.tipoVisita !== 'RECURRENTE'}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!(formData.tipoVisita === 'RECURRENTE' && fechaFin && fechaInicio && fechaFin < fechaInicio),
                        helperText: formData.tipoVisita !== 'RECURRENTE'
                          ? ''
                          : fechaFin && fechaInicio && fechaFin < fechaInicio
                            ? 'La fecha de fin no puede ser anterior a la de inicio'
                            : ''
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              {/* Hora inicio */}
              <Grid item xs={2}>
                <TextField
                  fullWidth
                  label='Hora inicio *'
                  type='time'
                  value={
                    fechaInicio
                      ? `${fechaInicio.getHours().toString().padStart(2, '0')}:${fechaInicio.getMinutes().toString().padStart(2, '0')}`
                      : ''
                  }
                  onChange={e => {
                    const [hours, minutes] = e.target.value.split(':').map(Number)
                    const newDate = fechaInicio ? new Date(fechaInicio) : new Date()
                    newDate.setHours(hours, minutes)
                    setFechaInicio(newDate)

                    // Siempre actualizar fecha fin para mantener al menos 1 hora de diferencia
                    const endDate = new Date(newDate)
                    endDate.setHours(newDate.getHours() + 1)
                    setFechaFin(endDate)
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>

              {/* Hora término */}
              <Grid item xs={2}>
                <TextField
                  fullWidth
                  label='Hora término *'
                  type='time'
                  value={
                    fechaFin
                      ? `${fechaFin.getHours().toString().padStart(2, '0')}:${fechaFin.getMinutes().toString().padStart(2, '0')}`
                      : ''
                  }
                  onChange={e => {
                    const [hours, minutes] = e.target.value.split(':').map(Number)
                    const newDate = fechaFin ? new Date(fechaFin) : new Date(fechaInicio || new Date())
                    newDate.setHours(hours, minutes)
                    setFechaFin(newDate)
                  }}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
            </Grid>

            {/* Sección de información del cliente y obra */}
            <Grid container spacing={2} mt={4}>
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Información del Cliente y Obra
                </Typography>
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
                    if (newValue) {
                      // Si se selecciona un cliente, solo actualizar clienteId y limpiar obra
                      setFormData(prev => ({
                        ...prev,
                        clienteId: newValue.clienteId,
                        obraId: undefined,
                        solicitudId: undefined,
                        sectorComercial: '',
                        region: '',
                        comuna: '',
                        direccion: '',
                        referencia: '',
                        georreferencia: ''
                      }))
                    } else {
                      // Si se limpia el cliente, limpiar todos los campos relacionados
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
                    // Limpiar estados relacionados
                    setContactos([])
                    setSelectedSectorComercial('')
                    setSelectedReferencia('')
                    setSelectedGeorreferencia('')
                    setSelectedRegion('')
                    setSolicitudesFiltradas(todasLasSolicitudes)
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
                  options={obras
                    .filter(obra => obra.estadoObra === 'activa')
                    .sort((a, b) => {
                      const numeroA = parseInt(a.numeroObra) || 0
                      const numeroB = parseInt(b.numeroObra) || 0
                      return numeroB - numeroA // Orden descendente (más reciente primero)
                    })
                  }
                  getOptionLabel={option => {
                    const numeroObra = option.numeroObra || option.obraId || 'S/N'
                    const comuna = option.comuna || 'Sin comuna'
                    const nombreTruncado = option.nombreObra && option.nombreObra.length > 50
                      ? `${option.nombreObra.substring(0, 50)}...`
                      : option.nombreObra || 'Sin nombre'
                    return `${numeroObra} - ${comuna} - ${nombreTruncado}`
                  }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options

                    const searchTerm = inputValue.toLowerCase()
                    return options.filter(option =>
                      option.nombreObra.toLowerCase().includes(searchTerm) ||
                      option.direccion?.toLowerCase().includes(searchTerm) ||
                      option.numeroObra?.toLowerCase().includes(searchTerm)
                    )
                  }}
                  value={obras.find(o => o.obraId === formData.obraId) || null}
                  disabled={!formData.clienteId}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      // Si se selecciona una obra, llenar los campos con su información
                      setFormData(prev => ({
                        ...prev,
                        obraId: newValue.obraId,
                        direccion: newValue.direccion || ''
                      }))
                    } else {
                      // Si se limpia la obra, limpiar todos los campos relacionados
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
                      // Limpiar estados relacionados
                      setContactos([])
                      setSelectedSectorComercial('')
                      setSelectedReferencia('')
                      setSelectedGeorreferencia('')
                      setSelectedRegion('')
                      setSolicitudesFiltradas(todasLasSolicitudes)
                    }
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Obra'
                      helperText={!formData.clienteId ? 'Seleccione un cliente primero' : ''}
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
                    <li {...props} key={option.obraId}>
                      <Box>
                        <Typography variant='body1'>
                          {option.numeroObra || option.obraId || 'S/N'} - {option.comuna || 'Sin comuna'} - {
                            option.nombreObra && option.nombreObra.length > 50
                              ? `${option.nombreObra.substring(0, 50)}...`
                              : option.nombreObra || 'Sin nombre'
                          }
                        </Typography>
                        <Typography variant='caption' color='textSecondary'>
                          {option.direccion}
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
                  options={solicitudesFiltradas}
                  getOptionLabel={option => {
                    const clienteInfo = option.cliente ? ` - ${option.cliente.razonSocial}` : ''
                    const obraInfo = option.obra ? ` - ${option.obra.nombreObra}` : ''

                    return `Solicitud #${option.numeroSolicitud}${clienteInfo}${obraInfo}`
                  }}
                  value={solicitudesFiltradas.find(s => s.id === formData.solicitudId) || null}
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
                      helperText={
                        estado === 'AGENDADA' && !formData.solicitudId
                          ? 'Campo obligatorio para eventos agendados'
                          : formData.obraId
                            ? `Mostrando ${solicitudesFiltradas.length} solicitudes de la obra seleccionada`
                            : `Seleccione una obra primero`
                      }
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
                    <li {...props} key={option.id}>
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

            {/* Sección de ubicación */}
            <Grid container spacing={2} mt={4}>
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Ubicación y Dirección
                </Typography>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={2}>
              {/* Sector Comercial */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Sector Comercial *</InputLabel>
                  <Select
                    label='Sector Comercial *'
                    value={selectedSectorComercial}
                    onChange={e => {
                      setSelectedSectorComercial(e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        sectorComercial: e.target.value
                      }))
                    }}
                  >
                    {SECTORES_COMERCIALES.map(s =>
                      <MenuItem key={s.value} value={s.label}>
                        {s.label}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Región */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Región *</InputLabel>
                  <Select
                    label='Región *'
                    value={selectedRegion}
                    onChange={e => {
                      setSelectedRegion(e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        region: e.target.value,
                        comuna: ''
                      }))
                    }}
                  >
                    {regiones.map(region => (
                      <MenuItem key={region.id} value={region.nombre}>
                        {region.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Comuna */}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Comuna *</InputLabel>
                  <Select
                    label='Comuna *'
                    value={formData.comuna}
                    onChange={e => setFormData(prev => ({ ...prev, comuna: e.target.value }))}
                    disabled={!selectedRegion}
                  >
                    {comunasRegion.map(comuna => (
                      <MenuItem key={comuna.id} value={comuna.nombre}>
                        {comuna.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={2}>
              {/* Dirección */}
              <Grid item xs={12} sm={4} display='flex' alignItems='center'>
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
              </Grid>

              {/* Referencia */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label='Referencia'
                  value={selectedReferencia}
                  placeholder='Ej: Cerca del supermercado, Edificio azul, etc.'
                  onChange={e => {
                    setSelectedReferencia(e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      referencia: e.target.value
                    }))
                  }}
                />
              </Grid>

              {/* Georreferencia */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label='Georreferencia'
                  value={selectedGeorreferencia}
                  placeholder='Ej: -33.4489, -70.6693'
                  onChange={e => {
                    setSelectedGeorreferencia(e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      georreferencia: e.target.value
                    }))
                  }}
                />
              </Grid>
            </Grid>

            {/* Sección de contactos */}
            <Divider sx={{ my: 4 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Contactos de la Obra
                </Typography>
              </Grid>
            </Grid>
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
                            </Box>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{ROLES_CONTACTO.find(r => r.value === contacto.rol)?.label || contacto.rol || 'Sin rol'}</TableCell>
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
            <Grid container spacing={2} mt={4}>
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Servicios y Detalles de la Visita
                </Typography>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={2}>
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

              {/* Botón Agregar Servicio */}
              <Grid item xs={12} sm={2}>
                <Button
                  variant='contained'
                  color='primary'
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={handleAgregarServicio}
                >
                  Agregar Servicio
                </Button>
              </Grid>
            </Grid>

            {/* Lista de servicios agregados */}
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
                  {serviciosAgendados.map((servicio, index) => (
                    <TableRow key={index}>
                      <TableCell>{servicio.codigo}</TableCell>
                      <TableCell>{servicio.servicio}</TableCell>
                      <TableCell>
                        {editingServiceIndex === index ? (
                          <TextField
                            size='small'
                            type='number'
                            value={editingServiceData.cantidad}
                            onChange={(e) => setEditingServiceData(prev => ({ ...prev, cantidad: e.target.value }))}
                            inputProps={{ min: 1 }}
                            sx={{ width: '80px' }}
                          />
                        ) : (
                          <span>{servicio.cantidad}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingServiceIndex === index ? (
                          <TextField
                            size='small'
                            multiline
                            maxRows={3}
                            value={editingServiceData.observacion}
                            onChange={(e) => setEditingServiceData(prev => ({ ...prev, observacion: e.target.value }))}
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
                        {editingServiceIndex === index ? (
                          <Box display='flex' alignItems='center' gap={1}>
                            <IconButton
                              size='small'
                              color='primary'
                              onClick={handleSaveService}
                            >
                              <i className='ri-check-line' />
                            </IconButton>
                            <IconButton
                              size='small'
                              color='secondary'
                              onClick={handleCancelServiceEdit}
                            >
                              <i className='ri-close-line' />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box display='flex' alignItems='center' gap={1}>
                            <IconButton
                              size='small'
                              onClick={() => handleEditService(index)}
                            >
                              <EditIcon fontSize='small' />
                            </IconButton>
                            <IconButton
                              color='error'
                              onClick={() => setServiciosAgendados(prev => prev.filter((_, i) => i !== index))}
                            >
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Sección de laboratoristas y equipos */}
            <Grid container spacing={2} mt={4}>
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Recursos Asignados
                </Typography>
              </Grid>
            </Grid>
            <Grid container spacing={2} mt={2}>
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
                  onChange={(_, newValue) => {
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
                      setLaboratoristaKey(prev => prev + 1) // Forzar re-render del componente
                    }
                  }}
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
                  onChange={(_, newValue) => {
                    if (newValue) {
                      // Verificar si el equipo ya está agregado
                      const yaExiste = equiposAgendados.some(equipo => equipo.id === newValue.id)
                      if (!yaExiste) {
                        const nuevoEquipo: EquipoAgendado = {
                          id: newValue.id,
                          codigo: newValue.codigo,
                          nombre: newValue.nombre
                        }
                        setEquiposAgendados(prev => [...prev, nuevoEquipo])
                      }
                      // Limpiar la selección y el campo de búsqueda forzando re-render
                      setEquipoSeleccionado(null)
                      setEquipoInputValue('')
                      setEquipoKey(prev => prev + 1) // Forzar re-render del componente
                    }
                  }}
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

            {/* Campo de Observaciones */}
            <Grid container spacing={2} mt={4}>
              <Grid item xs={12}>
                <Typography variant='h6' sx={{ mb: 2 }}>
                  Observaciones Adicionales
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder='Ingrese cualquier observación o nota adicional sobre la visita'
                  value={formData.observaciones}
                  onChange={e => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                />
              </Grid>
            </Grid>

            {/* Botón Agendar */}
            <Grid container spacing={2} mt={4}>
              <Grid item xs={12}>
                <Box display='flex' justifyContent='flex-start' gap={2}>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={formData.tipoVisita === 'RECURRENTE' && recurringData ? handleCreateRecurringEvents : handleSubmit}
                  >
                    {formData.tipoVisita === 'RECURRENTE'
                      ? (recurringData ? 'Crear Eventos Recurrentes' : 'Configurar Recurrencia')
                      : 'Crear'
                    }
                  </Button>

                  {formData.tipoVisita === 'RECURRENTE' && recurringData && (
                    <Button
                      variant='outlined'
                      onClick={() => setRecurringModalOpen(true)}
                    >
                      Reconfigurar Recurrencia
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      {/* Drawer para crear contacto */}
      <AddContact
        open={addContactOpen}
        handleClose={() => setAddContactOpen(false)}
        onContactCreated={handleAddContact}
      />

      {/* Modal para configurar eventos recurrentes */}
      <RecurringEventModal
        open={recurringModalOpen}
        onClose={() => {
          setRecurringModalOpen(false)
          // Solo revertir a EVENTO si no hay configuración guardada
          if (!recurringData) {
            setFormData(prev => ({
              ...prev,
              tipoVisita: 'EVENTO',
              esRecurrente: false
            }))
          }
        }}
        onConfirm={handleRecurringConfirm}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
      />
    </Drawer>
  )
}

export default AddEventSidebar
