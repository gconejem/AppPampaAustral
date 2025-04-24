'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'
import type { SyntheticEvent } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import type { SelectChangeEvent } from '@mui/material/Select'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import FormControl from '@mui/material/FormControl'
import DeleteIcon from '@mui/icons-material/Delete'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import SearchIcon from '@mui/icons-material/Search'
import FormHelperText from '@mui/material/FormHelperText'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import Popover from '@mui/material/Popover'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { toast } from 'react-hot-toast'

// Type Imports
import type { TipoCotizacion, EstadoCotizacion } from '@prisma/client'

import type { FormDataType } from './AddCustomerDrawer'

// Component Imports
import AddCustomerDrawer from './AddCustomerDrawer'
import Logo from '@components/layout/shared/Logo'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

interface ProductoEnPaquete {
  productoId: number
  nombre: string
  area: string
  precio: number
  cantidad: number
  descripcion?: string
}

interface ProductRow {
  id: number
  productoId: string
  cantidad: number
  precioUnitarioUF: number
  totalNetoUF: number
  area: string
  descripcion: string
  subproductos: never[]
  precio?: number
  descuento?: number
  esSubProducto?: boolean
  esPaquete?: boolean
  servicio?: string
}

interface ProductoType {
  id: number
  productoId: number
  sku: string
  nombre: string
  precio: number
  area?: string
  familia?: string
  tipo?: string
  descripcion?: string
  esPaquete?: boolean
  norma?: string
  nombreCompleto?: string
  servicio?: string
  productosEnPaquete?: ProductoEnPaquete[]
}

interface InvoiceType extends ProductoType {
  montoDescuento: number
}

interface ContactoType {
  nombre: string
  cargo: string
  email: string
  telefono1: string
}

interface DetalleType {
  productoId: number
  cantidad: number
  precioUnitario: number
  descuento: number
  subtotal: number
  montoDescuento?: number
}

interface FormData {
  numeroCotizacion: string
  tipoCotizacion: TipoCotizacion
  estado: EstadoCotizacion
  nombreProyecto: string
  ubicacion: string
  empresa: string
  fechaInicio: Date | null
  fechaFin: Date | null
  clienteId: number | null
  obraId: number | null
  contactoId: number | null
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  observaciones: string
  detalles: DetalleType[]
  formaPago: 'CONTADO' | 'CREDITO_30' | 'CREDITO_60' | 'CREDITO_90'
  infoEMS: string
  infoMensual: string
  precioEMSTotal: number
  precioEMSPorProducto: boolean
  productos: ProductoType[]
  contacto?: ContactoType | null
}

interface ValidationErrors {
  tipoCotizacion: boolean
  nombreProyecto: boolean
  ubicacion: boolean
}

const AddCard = ({
  invoiceData,
  onFormDataChange
}: {
  invoiceData?: InvoiceType[]
  onFormDataChange?: (data: any) => void
}) => {
  const router = useRouter()

  // Actualizar el estado inicial
  const initialFormData: FormData = {
    numeroCotizacion: '0001', // Valor inicial por defecto
    tipoCotizacion: 'VALORES_UNITARIOS',
    estado: 'BORRADOR',
    nombreProyecto: '',
    ubicacion: '',
    empresa: '',
    fechaInicio: new Date(),
    fechaFin: new Date(new Date().setDate(new Date().getDate() + 15)), // 15 días desde hoy
    clienteId: null,
    obraId: null,
    contactoId: null,
    subtotal: 0,
    descuento: 0,
    impuesto: 0,
    total: 0,
    observaciones: '',
    detalles: [],
    formaPago: 'CONTADO',
    infoEMS:
      'Superficie: Construcción 1.800 mt2\n\nAntecedentes:\n- Instalaciones de la empresa PONSSE.\n- Galpon Industrial\n- Puente grúa con capacidad de 10 toneladas.\n- Taller de mantención de maquinarias, oficinas',
    infoMensual:
      'Duración: 12 meses\n\nJornada Laboral y Horaria:\n- Lunes a viernes de 8:00 a 18:00\n- Media jornada tarde el día viernes (evaluación, mantención de equipos/vehículo, y trazabilidad de los controles, ensayos y emisión de informes en casa matriz)\n- Sábado de 8:00 a 14:00 (Se considerará pago de jornada extraordinaria)\n\nAntecedentes:\nVolúmenes de trabajo no proporcionados.',
    precioEMSTotal: 0,
    precioEMSPorProducto: true,
    productos: []
  }

  const initialValidationErrors: ValidationErrors = {
    tipoCotizacion: false,
    nombreProyecto: false,
    ubicacion: false
  }

  // Actualizar la declaración del estado
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(initialValidationErrors)
  const [fechaEmision] = useState<Date>(new Date())
  const [fechaVencimiento] = useState<Date>(new Date(new Date().setDate(new Date().getDate() + 15)))

  // Función para actualizar el formulario
  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      contacto: data.contacto === undefined ? prev.contacto : data.contacto
    }))

    if (onFormDataChange) {
      onFormDataChange(data)
    }
  }

  // Función de validación
  const validateForm = () => {
    const errors = {
      tipoCotizacion: !formData.tipoCotizacion,
      ubicacion: !formData.ubicacion,
      nombreProyecto: !formData.nombreProyecto
    }

    setValidationErrors(errors)

    return !Object.values(errors).some(error => error)
  }

  // Función para guardar
  const handleSave = async () => {
    try {
      if (!validateForm()) {
        toast.error('Por favor, complete todos los campos requeridos')

        return
      }

      const dataToSend = {
        numeroCotizacion: formData.numeroCotizacion,
        tipoCotizacion: formData.tipoCotizacion,
        estado: formData.estado,
        fechaEmision: fechaEmision.toISOString(),
        fechaVencimiento: fechaVencimiento.toISOString(),
        fechaInicio: formData.fechaInicio?.toISOString() || '',
        fechaFin: formData.fechaFin?.toISOString() || '',
        nombreProyecto: formData.nombreProyecto,
        empresa: formData.empresa,
        ubicacion: formData.ubicacion,
        subtotal: formData.subtotal,
        descuento: formData.descuento,
        impuesto: formData.impuesto,
        total: formData.total,
        observaciones: formData.observaciones,
        clienteId: formData.clienteId,
        obraId: formData.obraId,
        contactoId: formData.contactoId,
        detalles: formData.detalles.map(detalle => ({
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          descuento: detalle.descuento || 0,
          subtotal: detalle.subtotal
        })),
        formaPago: formData.formaPago
      }

      const response = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const error = await response.json()

        throw new Error(error.message || 'Error al guardar la cotización')
      }

      toast.success('Cotización guardada exitosamente')
      router.push('/apps/invoice/list')
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error(error.message || 'Error al guardar la cotización')
    }
  }

  // States
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [selectData, setSelectData] = useState<InvoiceType | null>(null)
  const [clientes, setClientes] = useState([])
  const [obras, setObras] = useState([])

  const [productos, setProductos] = useState<ProductoType[]>([])

  // Agregar estado para la búsqueda de productos
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProductos, setFilteredProductos] = useState(productos)

  // Agregar un estado para el descuento
  const [descuento, setDescuento] = useState<number>(0)

  // Actualizar el estado de productRows
  const [productRows, setProductRows] = useState<ProductRow[]>([
    {
      id: 1,
      productoId: '0',
      cantidad: 1,
      precioUnitarioUF: 0,
      totalNetoUF: 0,
      area: '',
      descripcion: '',
      subproductos: [],
      precio: 0,
      descuento: 0
    }
  ])

  // Agregar estado para contactos
  const [contactos, setContactos] = useState<
    Array<{
      contactoId: number
      nombre: string
      cargo: string
      email: string
      telefono1: string
    }>
  >([])

  // Agregar nuevo estado para áreas únicas
  const [areas, setAreas] = useState<string[]>([])
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [selectedFamilia, setSelectedFamilia] = useState<string>('')
  const [tipos, setTipos] = useState<string[]>([])
  const [familias, setFamilias] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Agregar estado para las fechas
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  // Cargar clientes y obras al montar el componente
  useEffect(() => {
    // Cargar clientes
    fetch('/api/clientes')
      .then(res => res.json())
      .then(data => {
        console.log('Clientes cargados:', data)
        setClientes(data)
      })
      .catch(error => console.error('Error al cargar clientes:', error))

    // Cargar obras
    fetch('/api/obras')
      .then(res => res.json())
      .then(data => {
        console.log('Obras cargadas:', data)
        setObras(data)
      })
      .catch(error => console.error('Error al cargar obras:', error))
  }, [])

  // Modificar el useEffect de carga de obras
  useEffect(() => {
    if (formData.clienteId) {
      // Cargar obras del cliente seleccionado
      fetch(`/api/obras?clienteId=${formData.clienteId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Obras del cliente cargadas:', data)
          setObras(data)
        })
        .catch(error => {
          console.error('Error al cargar obras del cliente:', error)
          setObras(prev => prev)
        })
    } else {
      // Si no hay cliente seleccionado, cargar todas las obras
      fetch('/api/obras')
        .then(res => res.json())
        .then(data => {
          console.log('Todas las obras cargadas:', data)
          setObras(data)
        })
        .catch(error => console.error('Error al cargar obras:', error))
    }
  }, [formData.clienteId])

  // Modificar el useEffect de carga de productos
  useEffect(() => {
    fetch('/api/productos')
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al cargar productos')
        }

        return res.json()
      })
      .then(response => {
        console.log('Respuesta de productos (raw):', response)
        const data = response.productos || []

        const productosFormateados = data.map((p: any) => ({
          id: p.productoId,
          productoId: p.productoId,
          sku: p.sku,
          nombre: p.nombre,
          precio: p.precio || 0,
          area: p.area || 'Sin área',
          familia: p.familia || 'Sin familia',
          tipo: p.tipo || 'Sin tipo',
          descripcion: p.descripcion || '',
          esPaquete: p.esPaquete || false,
          norma: p.norma || '',
          nombreCompleto: `${p.nombre}${p.norma ? ` - ${p.norma}` : ''}`,
          servicio: p.servicio || '',
          productosEnPaquete: p.productosEnPaquete || []
        }))

        console.log('Productos formateados:', productosFormateados.slice(0, 5))
        console.log('Ejemplo de producto:', productosFormateados[0])
        setProductos(productosFormateados)
        setFilteredProductos(productosFormateados)

        // Obtener todas las áreas, tipos y familias únicas
        const uniqueAreas = Array.from(new Set(data.map((p: any) => p.area || 'Sin área')))
          .filter(area => area)
          .sort()

        const uniqueTipos = Array.from(new Set(data.map((p: any) => p.tipo || 'Sin tipo')))
          .filter(tipo => tipo)
          .sort()

        const uniqueFamilias = Array.from(new Set(data.map((p: any) => p.familia || 'Sin familia')))
          .filter(familia => familia)
          .sort()

        setAreas(uniqueAreas as string[])
        setTipos(uniqueTipos as string[])
        setFamilias(uniqueFamilias as string[])
      })
      .catch(error => {
        console.error('Error al cargar productos:', error)
        toast.error('Error al cargar los productos')
        setProductos([])
        setFilteredProductos([])
      })
  }, [])

  // Agregar useEffect para cargar el número de cotización
  useEffect(() => {
    const cargarNumeroCotizacion = async () => {
      try {
        const response = await fetch('/api/cotizaciones/ultimo-numero')

        if (!response.ok) {
          throw new Error('Error al obtener el número de cotización')
        }

        const data = await response.json()
        const siguienteNumero = data?.siguienteNumero || 1

        setFormData(prev => ({
          ...prev,
          numeroCotizacion: siguienteNumero.toString().padStart(4, '0')
        }))
      } catch (error) {
        console.error('Error al obtener número de cotización:', error)

        // En caso de error, usar 0001 como número por defecto
        setFormData(prev => ({
          ...prev,
          numeroCotizacion: '0001'
        }))
      }
    }

    cargarNumeroCotizacion()
  }, [])

  // Modificar el useEffect para cargar contactos
  useEffect(() => {
    // Cambiar la ruta a /api/contacts que es la correcta
    fetch('/api/contacts')
      .then(res => res.json())
      .then(data => {
        console.log('Contactos cargados:', data)

        // Mapear los datos para asegurar la estructura correcta
        const contactosMapeados = data.map((contacto: any) => ({
          contactoId: contacto.contactId,
          nombre: contacto.nombre,
          cargo: contacto.cargo,
          email: contacto.email,
          telefono1: contacto.telefono1
        }))

        console.log('Contactos mapeados:', contactosMapeados)
        setContactos(contactosMapeados)
      })
      .catch(error => {
        console.error('Error al cargar contactos:', error)
        setContactos([]) // En caso de error, inicializar como array vacío
      })
  }, [])

  const handleClienteChange = (e: SelectChangeEvent<string>) => {
    try {
      const selectedClientId = Number(e.target.value)
      const selectedClient = clientes.find((c: { clienteId: number }) => c.clienteId === selectedClientId)

      if (selectedClient?.clienteId) {
        updateFormData({
          clienteId: selectedClient.clienteId
        })
      }
    } catch (error) {
      handleError(error)
    }
  }

  const deleteForm = (e: SyntheticEvent) => {
    e.preventDefault()

    // @ts-ignore
    e.target.closest('.repeater-item').remove()
  }

  // Actualizar el cálculo de totales para manejar montoDescuento undefined
  const calcularTotales = useCallback(() => {
    const subtotalTotal = formData.detalles.reduce((acc, det) => acc + det.subtotal, 0)
    const descuentoTotal = formData.detalles.reduce((acc, det) => acc + (det.montoDescuento || 0), 0)
    const baseImponible = subtotalTotal - descuentoTotal
    const impuesto = baseImponible * 0.19
    const total = baseImponible + impuesto

    updateFormData({
      subtotal: subtotalTotal,
      descuento: descuentoTotal,
      impuesto: impuesto,
      total: total
    })
  }, [formData.detalles])

  // Asegurarnos de que se recalculen los totales cuando cambian las filas
  useEffect(() => {
    calcularTotales()
  }, [productRows, calcularTotales])

  // Función para manejar el cambio de producto
  const handleProductoChange = async (e: SelectChangeEvent<string>, index: number) => {
    const selectedProductId = e.target.value
    const selectedProduct = productos.find(p => p.productoId?.toString() === selectedProductId)

    if (!selectedProduct) return

    const newRows = [...productRows]

    if (selectedProduct.esPaquete) {
      try {
        const response = await fetch(`/api/productos/${selectedProductId}/productos-paquete`)

        if (!response.ok) throw new Error('Error al obtener productos del paquete')

        const productosEnPaquete = await response.json()

        console.log('Productos en paquete:', productosEnPaquete)

        // Actualizar la fila del paquete
        newRows[index] = {
          ...productRows[index],
          productoId: selectedProductId,
          precio: selectedProduct.precio * productRows[index].cantidad,
          area: selectedProduct.area || '',
          descripcion: selectedProduct.descripcion || '',
          esPaquete: true
        }

        // Agregar los productos del paquete como subfilas
        const subProductos = productosEnPaquete.map((pp: ProductoEnPaquete) => ({
          id: `${productRows[index].id}-${pp.productoId}`,
          productoId: pp.productoId.toString(),
          cantidad: pp.cantidad,
          descuento: 0,
          precio: pp.precio * pp.cantidad,
          area: pp.area,
          descripcion: pp.descripcion,
          esSubProducto: true
        }))

        // Insertar los subproductos después del paquete
        newRows.splice(index + 1, 0, ...subProductos)
        console.log('Nuevas filas después de agregar subproductos:', newRows)
      } catch (error) {
        console.error('Error al obtener productos del paquete:', error)
      }
    } else {
      newRows[index] = {
        ...productRows[index],
        productoId: selectedProductId,
        precio: selectedProduct.precio * productRows[index].cantidad,
        area: selectedProduct.area || '',
        descripcion: selectedProduct.descripcion || ''
      }
      console.log('Producto seleccionado:', selectedProduct)
    }

    setProductRows(newRows)
    calcularTotales()
  }

  // Función para manejar la selección de producto
  const handleSelectProduct = (producto: ProductoType) => {
    setSelectedProduct(producto)

    // Crear el nombre completo del servicio incluyendo la norma
    const nombreCompleto = producto.norma ? `${producto.nombre || ''} - ${producto.norma}` : producto.nombre || ''

    // Actualizar la fila actual con los datos del producto
    const newRows = [...productRows]

    // Buscar la última fila vacía
    const emptyRowIndex = newRows.length - 1
    const emptyRow = newRows[emptyRowIndex]

    if (emptyRow && (emptyRow.productoId === '0' || !emptyRow.productoId)) {
      newRows[emptyRowIndex] = {
        ...emptyRow,
        productoId: producto.productoId?.toString() || '', // Asegurarnos de guardar el productoId
        servicio: nombreCompleto,
        descripcion: producto.descripcion || '',
        cantidad: 1,
        precioUnitarioUF: producto.precio || 0,
        totalNetoUF: (producto.precio || 0) * 1,
        area: producto.area || ''
      }

      setProductRows(newRows)
      calcularTotales()
    }

    handleClosePopover()
  }

  // Función para manejar la visualización
  const handlePreview = () => {
    // Preparar los datos para la previsualización
    const previewData = {
      ...formData,
      numeroCotizacion: formData.numeroCotizacion,
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      tipoCotizacion: formData.tipoCotizacion,
      nombreProyecto: formData.nombreProyecto,
      empresa: formData.empresa,
      ubicacion: formData.ubicacion,
      contacto: formData.contacto,
      detalles: productRows.map(row => ({
        productoId: row.productoId, // Asegurarnos de pasar el productoId
        servicio: row.servicio,
        area: row.area,
        descripcion: row.descripcion,
        cantidad: row.cantidad,
        precioUnitarioUF: row.precioUnitarioUF,
        totalNetoUF: row.totalNetoUF,
        esPaquete: row.esPaquete,
        esSubProducto: row.esSubProducto
      })),
      subtotal: formData.subtotal,
      descuento: formData.descuento,
      impuesto: formData.impuesto,
      total: formData.total,
      observaciones: formData.observaciones
    }

    // Debug para ver qué datos se están enviando
    console.log('Datos de preview:', previewData)
    console.log('Detalles enviados:', previewData.detalles)

    // Guardar en localStorage
    localStorage.setItem('cotizacionPreview', JSON.stringify(previewData))

    // Abrir en nueva pestaña con la ruta correcta de App Router
    window.open('/es/apps/invoice/preview', '_blank')
  }

  const handleAddDetalle = () => {
    if (!selectData || !count) return

    const precio = Number(selectData.precio)
    const cantidad = Number(count)
    const descuentoPorcentaje = Number(descuento)

    // Calcular subtotal y descuento
    const subtotalSinDescuento = precio * cantidad
    const montoDescuento = (subtotalSinDescuento * descuentoPorcentaje) / 100
    const subtotalConDescuento = subtotalSinDescuento - montoDescuento

    const newDetalle = {
      productoId: selectData.productoId,
      producto: selectData,
      cantidad: cantidad,
      precioUnitario: precio,
      descuento: descuentoPorcentaje,
      subtotal: subtotalSinDescuento, // Guardamos el subtotal sin descuento
      montoDescuento: montoDescuento // Guardamos el monto del descuento
    }

    const newDetalles = [...formData.detalles, newDetalle]

    // Calcular totales
    const subtotalTotal = newDetalles.reduce((acc, det) => acc + det.subtotal, 0)
    const descuentoTotal = newDetalles.reduce((acc, det) => acc + det.montoDescuento, 0)
    const baseImponible = subtotalTotal - descuentoTotal
    const impuesto = baseImponible * 0.19
    const total = baseImponible + impuesto

    // Actualizar formData
    updateFormData({
      ...formData,
      detalles: newDetalles,
      subtotal: subtotalTotal,
      descuento: descuentoTotal,
      impuesto: impuesto,
      total: total
    })

    // Limpiar campos
    setSelectData(null)
    setCount(1)
    setDescuento(0)
  }

  // Función para agregar una nueva fila
  const handleAddRow = () => {
    const newRow = {
      id: Date.now(), // Usar timestamp para ID único
      productoId: '0',
      servicio: '',
      cantidad: 1,
      precioUnitarioUF: 0,
      totalNetoUF: 0,
      area: '',
      descripcion: '',
      subproductos: []
    }

    setProductRows([...productRows, newRow])
  }

  // Función para eliminar una fila y sus subproductos si es un paquete
  const handleDeleteRow = (index: number) => {
    const rowToDelete = productRows[index]
    const newRows = [...productRows]

    if (rowToDelete.esPaquete) {
      let nextIndex = index + 1

      while (nextIndex < newRows.length && newRows[nextIndex].esSubProducto) {
        nextIndex++
      }

      newRows.splice(index, nextIndex - index)
    } else {
      newRows.splice(index, 1)
    }

    setProductRows(newRows)
    calcularTotales()
  }

  // Manejar error de tipo unknown
  const handleError = (error: unknown) => {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Ha ocurrido un error desconocido'

    toast.error(errorMessage)
  }

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || '' // Aseguramos que nunca sea null
    }))
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value

    setSearchTerm(value)
    filterProducts(value, selectedArea, selectedTipo, selectedFamilia)
  }

  const handleClearFilters = () => {
    setSelectedArea('')
    setSelectedTipo('')
    setSelectedFamilia('')
    setSearchTerm('')
    setFilteredProductos(productos)
  }

  const filterProducts = (search: string, area: string, tipo: string, familia: string) => {
    let filtered = [...productos]

    if (search) {
      const searchLower = search.toLowerCase()

      filtered = filtered.filter(
        product =>
          (product.nombre || '').toLowerCase().includes(searchLower) ||
          (product.sku || '').toLowerCase().includes(searchLower) ||
          (product.descripcion || '').toLowerCase().includes(searchLower)
      )
    }

    if (area) {
      filtered = filtered.filter(product => product.area === area)
    }

    if (tipo) {
      filtered = filtered.filter(product => product.tipo === tipo)
    }

    if (familia) {
      filtered = filtered.filter(product => product.familia === familia)
    }

    setFilteredProductos(filtered)
  }

  const [selectedProduct, setSelectedProduct] = useState<ProductoType | null>(null)
  const [servicio, setServicio] = useState('')

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setLoadingProductos(true)
    filterProducts(searchTerm, selectedArea, selectedTipo, selectedFamilia)
    setLoadingProductos(false)
  }

  const handleClosePopover = () => {
    setAnchorEl(null)
    setLoadingProductos(false)
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && searchTerm && searchTerm.length > 0) {
      const filteredProducts = productos
        .filter(
          product =>
            (product.servicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!selectedArea || product.area === selectedArea) &&
            (!selectedFamilia || product.familia === selectedFamilia)
        )
        .slice(0, 50)

      setFilteredProductos(filteredProducts)
      setShowResults(true)
    }
  }

  const [showResults, setShowResults] = useState(false)

  return (
    <>
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {/* Header con logo y datos de empresa */}
            <Grid item xs={12}>
              <div className='p-6 bg-actionHover rounded'>
                <div className='flex justify-between gap-4 flex-col sm:flex-row'>
                  <div className='flex flex-col gap-6'>
                    <div className='flex items-center'>
                      <Logo />
                    </div>
                    <div>
                      <Typography color='text.primary'>Calle Santa Blanca 51, Chillán – Chile.</Typography>
                      <Typography color='text.primary'>Email: contacto@pampaustral.cl</Typography>
                      <Typography color='text.primary'>+56 42-223 82 90 </Typography>
                    </div>
                  </div>
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-4'>
                      <Typography variant='h5' className='min-is-[95px]'>
                        N° Cotización
                      </Typography>
                      <TextField
                        name='numeroCotizacion'
                        fullWidth
                        size='small'
                        value={formData.numeroCotizacion}
                        InputProps={{
                          readOnly: true,
                          startAdornment: <InputAdornment position='start'>#</InputAdornment>
                        }}
                      />
                    </div>
                    <div className='flex items-center gap-2 mb-4'>
                      <Typography sx={{ minWidth: '120px', fontWeight: 500 }} color='text.primary'>
                        Fecha Emisión:
                      </Typography>
                      <Typography color='text.primary'>{fechaEmision.toLocaleDateString('es-CL')}</Typography>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Typography sx={{ minWidth: '120px', fontWeight: 500 }} color='text.primary'>
                        Fecha Vencimiento:
                      </Typography>
                      <Typography color='text.primary'>{fechaVencimiento.toLocaleDateString('es-CL')}</Typography>
                    </div>
                  </div>
                </div>
              </div>
            </Grid>

            {/* Campos principales */}
            <Grid item xs={12}>
              <Grid container spacing={3}>
                {/* Contacto con búsqueda y detalles */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    fullWidth
                    size='small'
                    options={contactos}
                    getOptionLabel={option => `${option.nombre} - ${option.cargo}`}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Buscar Contacto'
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
                      <Box component='li' {...props}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant='body1'>
                            {option.nombre}{' '}
                            <Typography component='span' color='text.secondary'>
                              #{option.contactoId}
                            </Typography>
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {option.cargo}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(
                        option =>
                          option.nombre.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.cargo.toLowerCase().includes(inputValue.toLowerCase())
                      )
                    }}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        updateFormData({
                          contacto: {
                            nombre: newValue.nombre,
                            cargo: newValue.cargo,
                            email: newValue.email,
                            telefono1: newValue.telefono1
                          }
                        })
                      } else {
                        updateFormData({
                          contacto: null
                        })
                      }
                    }}
                    value={
                      formData.contacto
                        ? {
                            nombre: formData.contacto.nombre,
                            cargo: formData.contacto.cargo,
                            email: formData.contacto.email,
                            telefono1: formData.contacto.telefono1,
                            contactoId: 0
                          }
                        : null
                    }
                  />

                  {/* Detalles del contacto seleccionado */}
                  {formData.contacto && (
                    <Box sx={{ mt: 2, position: 'relative' }}>
                      <IconButton
                        size='small'
                        onClick={() => updateFormData({ contacto: null })}
                        sx={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          color: 'text.secondary'
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <div className='flex flex-col gap-2'>
                        <Typography>{formData.contacto.nombre}</Typography>
                        <Typography>{formData.contacto.cargo}</Typography>
                        <Typography>{formData.contacto.email}</Typography>
                        <Typography>{formData.contacto.telefono1}</Typography>
                      </div>
                    </Box>
                  )}
                </Grid>

                {/* Espacio para información de facturación fija */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div className='flex flex-col gap-2 text-right'>
                      <Typography sx={{ fontWeight: 'bold' }}>Emisión de Órden de Compra o Transferencia</Typography>
                      <Typography>Nombre: Sociedad Laboratorio Pampa Austral Ltda.</Typography>
                      <Typography>Rut: 77.390.460-K</Typography>
                      <Typography>Dirección: Calle Santa Blanca N° 51, Chillán. Región de Ñuble, Chile</Typography>
                      <Typography>Cuenta Corriente: 220-02813-03, Banco de Chile.</Typography>
                    </div>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Segunda fila: Tipo de Cotización y Forma de Pago */}
            <Grid item xs={12}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={validationErrors.tipoCotizacion}>
                    <InputLabel id='tipo-cotizacion-label' required>
                      Tipo de Cotización
                    </InputLabel>
                    <Select
                      label='Tipo de Cotización'
                      value={formData.tipoCotizacion}
                      onChange={e => {
                        handleChange('tipoCotizacion', e.target.value as 'VALORES_UNITARIOS' | 'EMS' | 'MENSUAL' | '')
                        setValidationErrors({ ...validationErrors, tipoCotizacion: false })
                      }}
                    >
                      <MenuItem value='VALORES_UNITARIOS'>Valores Unitarios</MenuItem>
                      <MenuItem value='EMS'>EMS</MenuItem>
                      <MenuItem value='MENSUAL'>Mensual</MenuItem>
                    </Select>
                    {validationErrors.tipoCotizacion && <FormHelperText>Este campo es requerido</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id='forma-pago-label'>Forma de Pago</InputLabel>
                    <Select
                      labelId='forma-pago-label'
                      label='Forma de Pago'
                      value={formData.formaPago}
                      onChange={e => handleChange('formaPago', e.target.value)}
                    >
                      <MenuItem value='CONTADO'>Contado</MenuItem>
                      <MenuItem value='CREDITO_30'>Crédito 30 días</MenuItem>
                      <MenuItem value='CREDITO_60'>Crédito 60 días</MenuItem>
                      <MenuItem value='CREDITO_90'>Crédito 90 días</MenuItem>
                    </Select>
                    <Typography
                      variant='caption'
                      sx={{
                        mt: 1,
                        color: 'text.secondary',
                        fontStyle: 'italic'
                      }}
                    >
                      Métodos de pago: Transferencia, Tarjetas vía flow.cl, solicitar link
                    </Typography>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            {/* Tercera fila: Nombre del Proyecto, Empresa, Ubicación */}
            <Grid item xs={12}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label='Nombre del Proyecto'
                    value={formData.nombreProyecto}
                    onChange={e => {
                      handleChange('nombreProyecto', e.target.value)
                      setValidationErrors({ ...validationErrors, nombreProyecto: false })
                    }}
                    error={validationErrors.nombreProyecto}
                    helperText={validationErrors.nombreProyecto ? 'Este campo es requerido' : ''}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Empresa'
                    value={formData.empresa}
                    onChange={e => {
                      handleChange('empresa', e.target.value)
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    required
                    label='Ubicación'
                    value={formData.ubicacion}
                    onChange={e => {
                      handleChange('ubicacion', e.target.value)
                      setValidationErrors({ ...validationErrors, ubicacion: false })
                    }}
                    error={validationErrors.ubicacion}
                    helperText={validationErrors.ubicacion ? 'Este campo es requerido' : ''}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Información adicional para EMS */}
            {formData.tipoCotizacion === 'EMS' && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'action.hover', p: 2 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      Información EMS
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={8}
                      value={formData.infoEMS}
                      onChange={e => handleChange('infoEMS', e.target.value)}
                      placeholder='Ejemplo:
Superficie: Construcción 1.800 mt2

Antecedentes:
- Instalaciones de la empresa PONSSE.
- Galpon Industrial
- Puente grúa con capacidad de 10 toneladas.
- Taller de mantención de maquinarias, oficinas'
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'background.paper'
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Información adicional para MENSUAL */}
            {formData.tipoCotizacion === 'MENSUAL' && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'action.hover', p: 2 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      Información Mensual
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      minRows={10}
                      value={formData.infoMensual}
                      onChange={e => handleChange('infoMensual', e.target.value)}
                      placeholder='Ejemplo:
Duración: 12 meses

Jornada Laboral y Horaria:
- Lunes a viernes de 8:00 a 18:00
- Media jornada tarde el día viernes (evaluación, mantención de equipos/vehículo, y trazabilidad de los controles, ensayos y emisión de informes en casa matriz)
- Sábado de 8:00 a 14:00 (Se considerará pago de jornada extraordinaria)

Antecedentes:
Volúmenes de trabajo no proporcionados.'
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'background.paper'
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Detalles de la Cotización */}
            <Grid item xs={12} sx={{ mt: 8 }}>
              <Typography
                variant='h6'
                sx={{
                  mb: 4,
                  fontWeight: 500,
                  color: 'text.secondary',
                  textTransform: 'none',
                  borderBottom: '1px solid',
                  borderColor: 'primary.main',
                  pb: 1
                }}
              >
                Detalle Servicios Solicitados:
              </Typography>

              {formData.tipoCotizacion === 'EMS' && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <FormControl>
                    <RadioGroup
                      row
                      value={formData.precioEMSPorProducto}
                      onChange={e => handleChange('precioEMSPorProducto', e.target.value === 'true')}
                    >
                      <FormControlLabel value={true} control={<Radio size='small' />} label='Precio por producto' />
                      <FormControlLabel value={false} control={<Radio size='small' />} label='Precio total' />
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}
              {!formData.precioEMSPorProducto && formData.tipoCotizacion === 'EMS' && (
                <TextField
                  fullWidth
                  type='number'
                  label='Precio Total EMS'
                  value={formData.precioEMSTotal}
                  onChange={e => handleChange('precioEMSTotal', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>$</InputAdornment>
                  }}
                  sx={{ mb: 2 }}
                />
              )}

              {productRows.map((row, index) => (
                <Grid
                  container
                  spacing={2}
                  key={row.id}
                  sx={{
                    mb: 2,
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size='small'>
                      <TextField
                        label='Servicio / Ensayo'
                        size='small'
                        fullWidth
                        value={row.servicio || ''}
                        onClick={handleOpenPopover}
                        onKeyDown={handleSearchKeyDown}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <SearchIcon />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position='end'>
                              {loadingProductos && <CircularProgress size={20} />}
                              {row.servicio && (
                                <IconButton
                                  size='small'
                                  onClick={e => {
                                    e.stopPropagation()
                                    const newRows = [...productRows]

                                    newRows[index] = {
                                      ...row,
                                      productoId: '0',
                                      servicio: '',
                                      descripcion: '',
                                      area: '',
                                      precioUnitarioUF: 0,
                                      totalNetoUF: 0
                                    }
                                    setProductRows(newRows)
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </InputAdornment>
                          ),
                          readOnly: true
                        }}
                      />
                    </FormControl>
                    <Popover
                      open={Boolean(anchorEl)}
                      anchorEl={anchorEl}
                      onClose={handleClosePopover}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                      }}
                      PaperProps={{
                        sx: {
                          width: '100%',
                          maxWidth: '500px',
                          maxHeight: '400px',
                          overflow: 'auto'
                        }
                      }}
                    >
                      <Box sx={{ p: 2 }}>
                        <TextField
                          fullWidth
                          size='small'
                          placeholder='Buscar por nombre, código o descripción...'
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
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <FormControl size='small' fullWidth>
                            <InputLabel>Área</InputLabel>
                            <Select
                              value={selectedArea}
                              label='Área'
                              onChange={e => {
                                setSelectedArea(e.target.value)
                                filterProducts(searchTerm, e.target.value, selectedTipo, selectedFamilia)
                              }}
                            >
                              <MenuItem value=''>Todas</MenuItem>
                              {areas.map(area => (
                                <MenuItem key={area} value={area}>
                                  {area}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size='small' fullWidth>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                              value={selectedTipo}
                              label='Tipo'
                              onChange={e => {
                                setSelectedTipo(e.target.value)
                                filterProducts(searchTerm, selectedArea, e.target.value, selectedFamilia)
                              }}
                            >
                              <MenuItem value=''>Todos</MenuItem>
                              {tipos.map(tipo => (
                                <MenuItem key={tipo} value={tipo}>
                                  {tipo}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl size='small' fullWidth>
                            <InputLabel>Familia</InputLabel>
                            <Select
                              value={selectedFamilia}
                              label='Familia'
                              onChange={e => {
                                setSelectedFamilia(e.target.value)
                                filterProducts(searchTerm, selectedArea, selectedTipo, e.target.value)
                              }}
                            >
                              <MenuItem value=''>Todas</MenuItem>
                              {familias.map(familia => (
                                <MenuItem key={familia} value={familia}>
                                  {familia}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                        <Button
                          size='small'
                          sx={{ mt: 1 }}
                          onClick={handleClearFilters}
                          startIcon={<i className='ri-filter-off-line' />}
                        >
                          Limpiar filtros
                        </Button>
                      </Box>
                      <List sx={{ pt: 0 }}>
                        {filteredProductos.map(producto => (
                          <ListItem
                            key={producto.id}
                            onClick={() => handleSelectProduct(producto)}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              }
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography variant='body1'>
                                  {producto.nombre}
                                  {producto.norma && (
                                    <Typography component='span' color='text.secondary'>
                                      {' '}
                                      - {producto.norma}
                                    </Typography>
                                  )}
                                </Typography>
                              }
                              secondary={
                                <Typography variant='caption' color='text.secondary'>
                                  {producto.area} - {producto.tipo} - {producto.familia}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Popover>
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size='small'
                      label='Área'
                      value={row.area || ''}
                      disabled
                      InputProps={{
                        readOnly: true
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size='small'
                      label='Descripción'
                      value={row.descripcion || ''}
                      disabled
                      InputProps={{
                        readOnly: true
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={1}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Cantidad'
                      value={row.cantidad}
                      onChange={e => {
                        const cantidad = Number(e.target.value)
                        const newRows = [...productRows]

                        newRows[index] = {
                          ...row,
                          cantidad: cantidad,
                          totalNetoUF: row.precioUnitarioUF * cantidad
                        }
                        setProductRows(newRows)
                        calcularTotales()
                      }}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Precio Unitario UF'
                      value={row.precioUnitarioUF}
                      onChange={e => {
                        const precioUF = Number(e.target.value)
                        const newRows = [...productRows]

                        newRows[index] = {
                          ...row,
                          precioUnitarioUF: precioUF,
                          totalNetoUF: precioUF * row.cantidad
                        }
                        setProductRows(newRows)
                        calcularTotales()
                      }}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>UF</InputAdornment>
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size='small'
                      disabled
                      label='Total Neto UF'
                      value={row.totalNetoUF}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>UF</InputAdornment>,
                        readOnly: true
                      }}
                    />
                  </Grid>
                </Grid>
              ))}

              <Button
                variant='outlined'
                onClick={handleAddRow}
                startIcon={<i className='ri-add-line' />}
                sx={{ mt: 2 }}
              >
                Agregar Producto
              </Button>
            </Grid>

            {/* Totales */}
            <Grid item xs={12}>
              <div className='flex justify-end'>
                <div className='min-w-[300px]'>
                  <div className='flex justify-between mb-2'>
                    <Typography>Subtotal:</Typography>
                    <Typography>UF {formData.subtotal?.toFixed(2) || '0.00'}</Typography>
                  </div>
                  <div className='flex justify-between mb-2'>
                    <Typography>Descuento:</Typography>
                    <Typography>UF {formData.descuento?.toFixed(2) || '0.00'}</Typography>
                  </div>
                  <div className='flex justify-between mb-2'>
                    <Typography>IVA (19%):</Typography>
                    <Typography>UF {formData.impuesto?.toFixed(2) || '0.00'}</Typography>
                  </div>
                  <Divider className='my-2' />
                  <div className='flex justify-between'>
                    <Typography variant='h6'>Total:</Typography>
                    <Typography variant='h6'>UF {formData.total?.toFixed(2) || '0.00'}</Typography>
                  </div>
                </div>
              </div>
            </Grid>
          </Grid>
          <Grid
            container
            spacing={2}
            sx={{
              mt: 4,
              justifyContent: 'center',
              '& .MuiButton-root': {
                minWidth: '120px',
                maxWidth: '150px'
              }
            }}
          >
            <Grid item>
              <Button color='secondary' variant='outlined' onClick={handlePreview}>
                Visualizar
              </Button>
            </Grid>
            <Grid item>
              <Button color='error' variant='outlined' onClick={() => router.back()}>
                Cancelar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <AddCustomerDrawer
        open={open}
        setOpen={setOpen}
        onFormSubmit={data => {
          updateFormData({ contacto: data })
        }}
      />
    </>
  )
}

export default AddCard
