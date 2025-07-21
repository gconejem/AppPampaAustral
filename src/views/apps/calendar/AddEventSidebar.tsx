import { useState, useEffect, useRef } from 'react'

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
  clienteId: number,
  contactos: ContactoObraForm[],
  referencia: string,
  numeroObra: string
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
  const [cantidad, setCantidad] = useState<string>('1')
  const [observacion, setObservacion] = useState<string>('')
  const [esSegundaVisita, setEsSegundaVisita] = useState<boolean>(false)
  const [selectedSectorComercial, setSelectedSectorComercial] = useState<string>('')
  const [selectedReferencia, setSelectedReferencia] = useState<string>('')

  // Estados para laboratoristas
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
  const [laboratoristaSeleccionado, setLaboratoristaSeleccionado] = useState<Laboratorista | null>(null)
  const [laboratoristasAgendados, setLaboratoristasAgendados] = useState<LaboratoristaAgendado[]>([])

  // Estados para equipos
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [equiposAgendados, setEquiposAgendados] = useState<EquipoAgendado[]>([])

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
    console.log('fechaInicio', fechaInicio)
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
        setObras(obrasData)
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

  // efecto para cargar los contactos cuando se selecciona una obra
  useEffect(() => {
    if (formData.obraId) {
      const obraSeleccionada = obras.find(obra => obra.obraId === formData.obraId)
      if (obraSeleccionada) {
        const obraContactos = obraSeleccionada.contactos || []
        // Reemplazar todos los contactos con los de la nueva obra
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

        // Llenar región, comuna y dirección con la información de la obra
        setFormData(prev => ({
          ...prev,
          region: obraSeleccionada.region || '',
          comuna: obraSeleccionada.comuna || '',
          direccion: obraSeleccionada.direccion || ''
        }))

        // Actualizar el estado de región seleccionada para que se carguen las comunas
        if (obraSeleccionada.region) {
          setSelectedRegion(obraSeleccionada.region)
        }
      }
    } else {
      // Si no hay obra seleccionada, limpiar contactos
      setContactos([])
      setSelectedReferencia('')
    }
  }, [formData.obraId, obras])

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

      // Preparar datos para enviar
      const visitaData = {
        ...formData,
        titulo: tituloGenerado,
        estado: estado,
        referencia: selectedReferencia,
        servicios: serviciosAgendados.map(servicio => ({
          ...servicio,
          id: parseInt(servicio.codigo)
        })),
        laboratoristas: laboratoristasAgendados,
        equipos: equiposAgendados,
        contactos: contactos
      }

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

      // Cerrar sidebar y mostrar mensaje de éxito
      handleAddEventSidebarToggle()
      toast.success('Visita agendada exitosamente')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error?.message || 'Error al agendar la visita')
    }
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

  const handleAgregarLaboratorista = () => {
    if (!laboratoristaSeleccionado) return

    const nuevoLaboratorista: LaboratoristaAgendado = {
      id: laboratoristaSeleccionado.id,
      nombre: laboratoristaSeleccionado.name,
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

  const handleEditClick = (index: number) => {
    setEditingContactIndex(index)
    setEditingContact({
      ...contactos[index]
    })
    console.log('contactos[index]', contactos[index])
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
        <Grid container spacing={2} mt={4} alignItems='center'>
          {/* Tipo de visita con radio buttons */}
          <Grid item xs={2}>
            <Typography variant='subtitle1' sx={{ color: 'error.main', mb: 0.5 }}>
              Tipo de Visita *
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
              }}
            >
              <FormControlLabel value='EVENTO' control={<Radio />} label='Evento' />
              <FormControlLabel value='RECURRENTE' control={<Radio />} label='Recurrente' />
            </RadioGroup>
            {!formData.tipoVisita && (
              <Typography variant='caption' color='error' sx={{ mt: 1, display: 'block' }}>
                Debe seleccionar un tipo de visita
              </Typography>
            )}
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
                      ? 'Activar "Recurrente" para seleccionar fecha de fin'
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

                // Actualizar fecha fin si es necesario
                if (!fechaFin || fechaFin <= newDate) {
                  const endDate = new Date(newDate)
                  endDate.setHours(newDate.getHours() + 1)
                  setFechaFin(endDate)
                }
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
                  clienteId: newValue?.clienteId,
                  obraId: undefined, // Limpiar obra cuando cambia el cliente
                  direccion: '' // Limpiar dirección
                }))
                setContactos([]) // Limpiar contactos
                setSelectedReferencia('') // Limpiar referencia
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
              disabled={!formData.clienteId}
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
                    <Typography variant='body1'>{option.numeroObra} - {option.nombreObra.slice(0, 50)}</Typography>
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
        </Grid>
        <Divider sx={{ my: 4 }} />
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
        <Grid container spacing={2} mt={4}>
          <Grid item xs={12}>
            <Typography variant='h5' sx={{ fontWeight: '' }}>
              Detalles
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
                        {servicio.observacion || 'Sin observación'}
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
          {/* Laboratoristas */}
          <Grid item xs={6}>
            <Typography variant='h5' sx={{ mb: 2 }}>
              Laboratoristas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={10}>
                <Autocomplete
                  fullWidth
                  options={laboratoristas}
                  getOptionLabel={option => `${option.name} (${option.rol})`}
                  value={laboratoristaSeleccionado}
                  onChange={(_, newValue) => setLaboratoristaSeleccionado(newValue)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Laboratorista'
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
              <Grid item xs={2}>
                <Button variant='contained' color='primary' fullWidth onClick={handleAgregarLaboratorista}>
                  Agregar
                </Button>
              </Grid>
            </Grid>

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
            <Grid container spacing={2}>
              <Grid item xs={10}>
                <Autocomplete
                  fullWidth
                  options={equipos}
                  getOptionLabel={option => `${option.codigo} - ${option.nombre}`}
                  value={equipoSeleccionado}
                  onChange={(_, newValue) => setEquipoSeleccionado(newValue)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Equipo'
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
              <Grid item xs={2}>
                <Button variant='contained' color='primary' fullWidth onClick={handleAgregarEquipo}>
                  Agregar
                </Button>
              </Grid>
            </Grid>

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
            <Typography variant='h5' sx={{ mb: 2 }}>
              Observaciones
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
            <Box display='flex' justifyContent='flex-start'>
              <Button variant='contained' color='primary' onClick={handleSubmit}>
                Agendar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Drawer para crear contacto */}
      <AddContact
        open={addContactOpen}
        handleClose={() => setAddContactOpen(false)}
        onContactCreated={handleAddContact}
      />
    </Drawer>
  )
}

export default AddEventSidebar
