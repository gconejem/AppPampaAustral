'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Box from '@mui/material/Box'
import SearchIcon from '@mui/icons-material/Search'
import Popover from '@mui/material/Popover'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import Autocomplete from '@mui/material/Autocomplete'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import type { SelectChangeEvent } from '@mui/material/Select'

// Third-party Imports
import { toast } from 'react-hot-toast'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Agregar ROLES_CONTACTO para mapeo de cargos
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
  productosEnPaquete?: any[]
  listasPrecios?: any[]
}

interface ContactoType {
  contactId: number
  nombre: string
  cargo: string
  email: string
  telefono1: string
  empresa?: string
}

interface FormDataType {
  subtotal: number
  descuento: number
  impuesto: number
  total: number
  tipoCotizacion: string
  nombreProyecto: string
  ubicacion: string
  observaciones: string
  numeroCotizacion: string
  fechaCreacion: string
  fechaFin: string
  contacto?: ContactoType
  contactoId?: number
  listaPrecioId?: number | null
  formaPago?: string
  empresa?: string
  superficieEMS?: string
  antecedentesEMS?: string
  plazoEntregaEMS?: string
}

const DuplicateCard = ({ id }: { id: string }) => {
  const router = useRouter()

  // Estados principales
  const [formData, setFormData] = useState<FormDataType | null>(null)
  const [productRows, setProductRows] = useState<ProductRow[]>([])
  const [productos, setProductos] = useState<ProductoType[]>([])
  const [contactos, setContactos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [selectedFamilia, setSelectedFamilia] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [tipos, setTipos] = useState<string[]>([])
  const [familias, setFamilias] = useState<string[]>([])
  const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [filteredProductos, setFilteredProductos] = useState<ProductoType[]>([])
  const [listasPrecios, setListasPrecios] = useState<Array<{ id: number; nombre: string }>>([])

  // 1. Estado sinCantidad
  const [sinCantidad, setSinCantidad] = useState(false)

  // Función para calcular totales
  const calcularTotales = useCallback(() => {
    if (!formData) return

    const subtotalTotal = productRows.reduce((acc, row) => acc + (Number(row.totalNetoUF) || 0), 0)
    const descuentoTotal = Number(formData.descuento || 0)
    const baseImponible = Number(subtotalTotal - descuentoTotal)
    const impuesto = Number(baseImponible * 0.19)
    const total = Number(baseImponible + impuesto)

    // Solo actualizar si los valores han cambiado
    if (
      formData.subtotal !== subtotalTotal ||
      formData.descuento !== descuentoTotal ||
      formData.impuesto !== impuesto ||
      formData.total !== total
    ) {
      setFormData(prev => ({
        ...prev!,
        subtotal: Number(subtotalTotal.toFixed(2)),
        descuento: Number(descuentoTotal.toFixed(2)),
        impuesto: Number(impuesto.toFixed(2)),
        total: Number(total.toFixed(2))
      }))
    }
  }, [productRows, formData])

  // Modificar el useEffect de carga de productos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener el nuevo número de cotización
        const numeroResponse = await fetch('/api/cotizaciones/ultimo-numero')
        if (!numeroResponse.ok) throw new Error('Error al obtener el número de cotización')
        const { siguienteNumero } = await numeroResponse.json()

        // Cargar la cotización
        const cotizacionResponse = await fetch(`/api/cotizaciones/${id}`)
        if (!cotizacionResponse.ok) throw new Error('Error al cargar la cotización')
        const cotizacionData = await cotizacionResponse.json()

        // Actualizar el número de cotización y limpiar campos que deben iniciar vacíos
        cotizacionData.numeroCotizacion = siguienteNumero.toString().padStart(4, '0')
        cotizacionData.contacto = undefined
        cotizacionData.contactId = undefined
        cotizacionData.tipoCotizacion = 'A' // Valor por defecto
        // Mantener la lista de precios de la cotización original
        // cotizacionData.listaPrecioId = null <- Eliminamos esta línea
        cotizacionData.formaPago = 'CONTADO' // Valor por defecto
        cotizacionData.nombreProyecto = '' // Limpiar nombre del proyecto
        cotizacionData.empresa = '' // Limpiar empresa
        cotizacionData.ubicacion = '' // Limpiar ubicación
        cotizacionData.observaciones = '' // Limpiar observaciones
        
        // Actualizar fechas
        const hoy = new Date()
        const fechaVencimiento = new Date()
        fechaVencimiento.setDate(hoy.getDate() + 15) // 15 días después de la fecha actual
        
        cotizacionData.fechaCreacion = hoy.toISOString().split('T')[0] // Formato YYYY-MM-DD
        cotizacionData.fechaFin = fechaVencimiento.toISOString().split('T')[0] // Formato YYYY-MM-DD

        console.log('Datos de la cotización original:', cotizacionData)

        // Cargar productos con límite alto para obtener todas las áreas, tipos y familias
        const productosResponse = await fetch('/api/productos?limit=1000')
        if (!productosResponse.ok) throw new Error('Error al cargar productos')
        const productosData = await productosResponse.json()

        // Cargar contactos
        const contactosResponse = await fetch('/api/contacts')
        if (!contactosResponse.ok) throw new Error('Error al cargar contactos')
        const contactosData = await contactosResponse.json()

        // Cargar listas de precios
        const listasPreciosResponse = await fetch('/api/listas-precios')
        if (!listasPreciosResponse.ok) throw new Error('Error al cargar listas de precios')
        const listasPreciosData = await listasPreciosResponse.json()

        // Formatear productos
        const productosFormateados = productosData.productos.map((p: any) => ({
          id: p.productoId,
          productoId: p.productoId,
          sku: p.sku,
          nombre: p.nombre,
          precio: p.precio || 0,
          area: p.area || 'Sin área',
          familia: p.familia || 'Sin familia',
          tipo: p.tipo || 'Sin tipo',
          descripcion: p.descripcion || '',
          esPaquete: p.esPaquete,
          norma: p.norma || '',
          nombreCompleto: `${p.nombre}${p.norma ? ` - ${p.norma}` : ''}`,
          servicio: p.servicio || '',
          productosEnPaquete: p.productosEnPaquete || [],
          listasPrecios: p.listasPrecios || []
        }))

        // Obtener áreas, tipos y familias únicas
        const uniqueAreas = Array.from(new Set(productosFormateados.map((p: ProductoType) => p.area)))
          .filter(area => area && area !== 'Sin área')
          .sort()

        const uniqueTipos = Array.from(new Set(productosFormateados.map((p: ProductoType) => p.tipo)))
          .filter(tipo => tipo && tipo !== 'Sin tipo')
          .sort()

        const uniqueFamilias = Array.from(new Set(productosFormateados.map((p: ProductoType) => p.familia)))
          .filter(familia => familia && familia !== 'Sin familia')
          .sort()

        // Convertir detalles a formato de filas de productos
        const detallesFormateados = cotizacionData.detalles.map((detalle: any) => ({
          id: detalle.id,
          productoId: detalle.productoId.toString(),
          cantidad: detalle.cantidad,
          precioUnitarioUF: detalle.precioUnitario,
          totalNetoUF: detalle.subtotal,
          area: detalle.producto?.area || '',
          descripcion: detalle.producto?.descripcion || '',
          servicio: detalle.producto?.nombre,
          esPaquete: detalle.esPaquete || false,
          esSubProducto: detalle.esSubProducto || false,
          subproductos: []
        }))

        // Actualizar estados
        setFormData(cotizacionData)
        setProductRows(detallesFormateados)
        setProductos(productosFormateados)
        setFilteredProductos(productosFormateados)

        // Mapear los datos para asegurar la estructura correcta y mostrar el label del cargo
        const contactosMapeados = contactosData.map((contacto: any) => ({
          contactId: contacto.contactId,
          nombre: contacto.nombre,
          cargo: ROLES_CONTACTO.find(c => c.value === contacto.cargo)?.label || contacto.cargo || '',
          email: contacto.email,
          telefono1: contacto.telefono1,
          empresa: contacto.empresa || ''
        }))
        setContactos(contactosMapeados)
        console.log('Contactos mapeados:', contactosMapeados)

        setListasPrecios(listasPreciosData)
        setAreas(uniqueAreas as string[])
        setTipos(uniqueTipos as string[])
        setFamilias(uniqueFamilias as string[])

        setLoading(false)
      } catch (error) {
        console.error('Error al cargar datos:', error)
        setError('Error al cargar los datos')
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Efecto para recalcular totales
  useEffect(() => {
    if (formData && productRows.length > 0) {
      calcularTotales()
    }
  }, [productRows]) // Solo depender de productRows, no de calcularTotales ni formData

  // 2. Al cargar la cotización, si todas las cantidades son 0, setear sinCantidad en true
  useEffect(() => {
    if (productRows.length > 0) {
      const todasCero = productRows.every(row => Number(row.cantidad) === 0)
      setSinCantidad(todasCero)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 4. Cuando sinCantidad cambie, actualizar cantidades y recalcular totales
  useEffect(() => {
    setProductRows(prevRows =>
      prevRows.map(row => ({
        ...row,
        cantidad: sinCantidad ? 0 : (row.cantidad === 0 ? 1 : row.cantidad),
        totalNetoUF: sinCantidad ? 0 : Number(row.precioUnitarioUF || 0) * (sinCantidad ? 0 : (row.cantidad === 0 ? 1 : row.cantidad))
      }))
    )
    // Recalcular totales
    if (formData) calcularTotales()
  }, [sinCantidad])

  // Función para manejar cambios en los productos
  const handleSelectProduct = (producto: ProductoType) => {
    console.log('Producto seleccionado:', producto)
    console.log('Lista de precios seleccionada:', formData?.listaPrecioId)
    
    const newRows = [...productRows]
    // Obtener el precio de la lista de precios seleccionada si existe
    let precioFinal = Number(producto.precio || 0)
    console.log('Precio base del producto:', precioFinal)

    if (formData?.listaPrecioId && producto.listasPrecios) {
      console.log('Listas de precios del producto:', producto.listasPrecios)
      const listaPrecio = producto.listasPrecios.find((lp: { listaPrecioId: number; precio: number }) => {
        console.log('Comparando listaPrecioId:', lp.listaPrecioId, 'con', formData.listaPrecioId)
        return lp.listaPrecioId === formData.listaPrecioId
      })
      
      if (listaPrecio) {
        console.log('Lista de precios encontrada:', listaPrecio)
        precioFinal = Number(listaPrecio.precio)
        console.log('Precio final después de lista de precios:', precioFinal)
      }
    }

    // Eliminar la fila vacía si existe
    const filteredRows = newRows.filter(row => row.productoId !== '0')

    // Armar el nombre del servicio: nombre - norma (si existe)
    const nombreServicio = producto.norma ? `${producto.nombre} - ${producto.norma}` : producto.nombre || ''

    if (producto.esPaquete && producto.productosEnPaquete && producto.productosEnPaquete.length > 0) {
      console.log('Procesando paquete con productos:', producto.productosEnPaquete)
      // Agregar paquete y sus productos
      const paqueteRow = {
        id: Date.now(),
        productoId: producto.productoId.toString(),
        servicio: nombreServicio,
        descripcion: producto.descripcion || '',
        cantidad: 1,
        precioUnitarioUF: precioFinal,
        totalNetoUF: precioFinal,
        area: producto.area || '',
        esPaquete: true,
        subproductos: []
      }
      console.log('Fila de paquete creada:', paqueteRow)

      const productosRows = (producto.productosEnPaquete || []).map((pp: any) => {
        console.log('Procesando subproducto:', pp)
        let precioProducto = Number(pp.producto?.precio || 0)
        console.log('Precio base del subproducto:', precioProducto)

        if (formData?.listaPrecioId && pp.producto?.listasPrecios) {
          console.log('Listas de precios del subproducto:', pp.producto.listasPrecios)
          const listaPrecio = pp.producto.listasPrecios.find((lp: { listaPrecioId: number; precio: number }) => {
            console.log('Comparando listaPrecioId del subproducto:', lp.listaPrecioId, 'con', formData.listaPrecioId)
            return lp.listaPrecioId === formData.listaPrecioId
          })
          
          if (listaPrecio) {
            console.log('Lista de precios encontrada para subproducto:', listaPrecio)
            precioProducto = Number(listaPrecio.precio)
            console.log('Precio final del subproducto:', precioProducto)
          }
        }

        // Armar nombre del subproducto: nombre - norma (si existe)
        const nombreSubServicio = pp.producto?.norma ? `${pp.producto?.nombre} - ${pp.producto?.norma}` : pp.producto?.nombre || ''
        const subRow = {
          id: Date.now() + Math.random(),
          productoId: pp.producto?.productoId?.toString() || '',
          servicio: nombreSubServicio,
          descripcion: pp.producto?.descripcion || '',
          cantidad: pp.cantidad || 1,
          precioUnitarioUF: precioProducto,
          totalNetoUF: precioProducto * (pp.cantidad || 1),
          area: pp.producto?.area || '',
          esSubProducto: true,
          subproductos: []
        }
        console.log('Fila de subproducto creada:', subRow)
        return subRow
      })

      console.log('Filas finales a agregar:', [...filteredRows, paqueteRow, ...productosRows])
      setProductRows([...filteredRows, paqueteRow, ...productosRows])
    } else {
      // Agregar producto individual
      const newRow = {
        id: Date.now(),
        productoId: producto.productoId.toString(),
        servicio: nombreServicio,
        descripcion: producto.descripcion || '',
        cantidad: 1,
        precioUnitarioUF: precioFinal,
        totalNetoUF: precioFinal,
        area: producto.area || '',
        subproductos: []
      }
      console.log('Fila de producto individual creada:', newRow)
      console.log('Filas finales a agregar:', [...filteredRows, newRow])
      setProductRows([...filteredRows, newRow])
    }

    handleClosePopover()
  }

  const handleContactChange = (newValue: ContactoType | null) => {
    if (newValue) {
      console.log('Nuevo contacto seleccionado:', newValue)
      setFormData(prev => {
        if (!prev) return null
        const newData = {
          ...prev,
          contacto: {
            contactId: Number(newValue.contactId),
            nombre: newValue.nombre,
            cargo: newValue.cargo || 'Sin cargo',
            email: newValue.email || '',
            telefono1: newValue.telefono1 || '',
            empresa: newValue.empresa || ''
          },
          contactoId: Number(newValue.contactId)
        }
        console.log('Nuevo formData después de actualizar contacto:', newData)
        return newData
      })
    } else {
      console.log('Limpiando contacto')
      setFormData(prev => {
        if (!prev) return null
        const newData = {
          ...prev,
          contacto: undefined,
          contactoId: undefined
        }
        console.log('FormData después de limpiar contacto:', newData)
        return newData
      })
    }
  }

  // Handlers para la tabla de productos
  const handleCantidadChange = (index: number, cantidad: number) => {
    setProductRows(prevRows => {
      const newRows = [...prevRows]
      const row = newRows[index]

      if (row) {
        row.cantidad = cantidad
        row.totalNetoUF = cantidad * (row.precioUnitarioUF || 0)
      }

      return newRows
    })
  }

  const handlePrecioChange = (index: number, precio: number) => {
    setProductRows(prevRows => {
      const newRows = [...prevRows]
      const row = newRows[index]

      if (row) {
        row.precioUnitarioUF = precio
        row.totalNetoUF = (row.cantidad || 1) * precio
      }

      return newRows
    })
  }

  const handleDeleteRow = (index: number) => {
    setProductRows(prevRows => {
      const newRows = [...prevRows]
      const rowToDelete = newRows[index]

      if (rowToDelete && rowToDelete.esSubProducto) {
        // Si es un subproducto, solo eliminar esta fila
        newRows.splice(index, 1)
      } else {
        // Si es un producto principal, eliminar también sus subproductos
        const subproductosCount = rowToDelete?.subproductos?.length || 0

        newRows.splice(index, 1 + subproductosCount)
      }

      return newRows
    })
  }

  // Funciones para el manejo del popover
  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setLoadingProductos(true)
    setProductsPage(0) // Resetear a la primera página
    // Limpiar todos los filtros
    setSearchTerm('')
    setSelectedArea('')
    setSelectedTipo('')
    setSelectedFamilia('')
    setShowOnlyPaquetes(false)
    filterProducts('', '', '', '')
    setLoadingProductos(false)
  }

  const handleClosePopover = () => {
    setAnchorEl(null)
    setLoadingProductos(false)
  }

  // Función para filtrar productos
  const filterProducts = (search: string, area: string, tipo: string, familia: string) => {
    let filtered = [...productos]

    if (showOnlyPaquetes) {
      filtered = filtered.filter(product => product.esPaquete === true)
    }

    if (search) {
      const searchLower = search.toLowerCase()

      filtered = filtered.filter(
        product =>
          product.nombre.toLowerCase().includes(searchLower) ||
          product.sku.toLowerCase().includes(searchLower) ||
          (product.descripcion || '').toLowerCase().includes(searchLower)
      )
    }

    if (area) filtered = filtered.filter(product => product.area === area)
    if (tipo) filtered = filtered.filter(product => product.tipo === tipo)
    if (familia) filtered = filtered.filter(product => product.familia === familia)

    setFilteredProductos(filtered)
  }

  // Función para guardar cambios
  const handleSave = async () => {
    try {
      if (!formData) return

      // Obtener el siguiente número de cotización
      const numeroResponse = await fetch('/api/cotizaciones/ultimo-numero')
      if (!numeroResponse.ok) {
        throw new Error('Error al obtener el número de cotización')
      }
      const { siguienteNumero } = await numeroResponse.json()

      const detallesValidos = productRows.map(row => ({
        productoId: parseInt(row.productoId),
        cantidad: row.cantidad,
        precioUnitario: Number(row.precioUnitarioUF),
        descuento: 0,
        subtotal: Number(row.totalNetoUF)
      }))

      // Crear el objeto con solo los campos necesarios
      const dataToSend = {
        numeroCotizacion: siguienteNumero.toString().padStart(4, '0'),
        tipoCotizacion: formData.tipoCotizacion,
        estado: 'BORRADOR',
        clienteId: null,
        obraId: null,
        contactId: formData.contacto ? Number(formData.contacto.contactId) : null,
        listaPrecioId: formData.listaPrecioId ? Number(formData.listaPrecioId) : null,
        fechaInicio: new Date().toISOString(),
        fechaFin: formData.fechaFin,
        nombreProyecto: formData.nombreProyecto || '',
        empresa: formData.empresa || '',
        ubicacion: formData.ubicacion || '',
        formaPago: formData.formaPago || 'CONTADO',
        subtotal: Number(formData.subtotal),
        descuento: Number(formData.descuento),
        impuesto: Number(formData.impuesto),
        total: Number(formData.total),
        observaciones: formData.observaciones || '',
        superficieEMS: formData.superficieEMS || '',
        antecedentesEMS: formData.antecedentesEMS || '',
        plazoEntregaEMS: formData.plazoEntregaEMS || '',
        detalles: {
          create: detallesValidos
        }
      }

      console.log('DATA QUE SE ENVÍA AL POST:', dataToSend)

      const response = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.message || 'Error al crear la copia de la cotización')
      }

      const responseData = await response.json()
      console.log('Respuesta del servidor:', responseData)

      toast.success('Copia de cotización creada exitosamente')
      router.push('/es/apps/invoice/list')
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear la copia de la cotización')
    }
  }

  // Función para manejar la vista previa
  const handlePreview = () => {
    if (!formData) return

    // Obtener las fechas actuales
    const hoy = new Date()
    const fechaVencimiento = new Date()
    fechaVencimiento.setDate(hoy.getDate() + 15) // 15 días después de la fecha actual

    const previewData = {
      ...formData,
      numeroCotizacion: formData.numeroCotizacion.padStart(4, '0'), // Formatear número con ceros a la izquierda
      fechaInicio: hoy.toISOString(), // Formato que espera PreviewCard
      fechaFin: fechaVencimiento.toISOString().split('T')[0], // Formato YYYY-MM-DD
      detalles: productRows.map(row => ({
        productoId: parseInt(row.productoId),
        servicio: row.servicio || '',
        area: row.area || '',
        descripcion: row.descripcion || '',
        cantidad: row.cantidad,
        precioUnitarioUF: row.precioUnitarioUF,
        totalNetoUF: row.totalNetoUF,
        esPaquete: row.esPaquete || false,
        esSubProducto: row.esSubProducto || false
      }))
    }

    localStorage.setItem('cotizacionPreview', JSON.stringify(previewData))
    window.open('/es/apps/invoice/preview', '_blank')
  }

  // Agregar estados necesarios
  const [loadingProductos, setLoadingProductos] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [productsPage, setProductsPage] = useState(0)
  const [totalProductos, setTotalProductos] = useState(0)
  const ITEMS_PER_PAGE = 10

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
            throw new Error('Error al cargar productos')
          }
          return res.json()
        })
        .then(response => {
          const data = response.productos || []
          // Filtrar los productos por nombre, descripción o norma
          const filteredData = searchTerm
            ? data.filter(
                (producto: any) =>
                  producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  producto.norma?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : data
          setFilteredProductos(filteredData)
          setTotalProductos(Number.isFinite(response.total) ? Number(response.total) : 0)
        })
        .catch(error => {
          console.error('Error al cargar productos paginados:', error)
          toast.error('Error al cargar los productos')
          setFilteredProductos([])
          setTotalProductos(0)
        })
    }
  }, [productsPage, searchTerm, selectedArea, selectedTipo, selectedFamilia, anchorEl])

  // Agregar un useEffect para manejar el cambio de showOnlyPaquetes
  useEffect(() => {
    filterProducts(searchTerm, selectedArea, selectedTipo, selectedFamilia)
  }, [showOnlyPaquetes]) // Agregar showOnlyPaquetes como dependencia

  const handleShowOnlyPaquetesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyPaquetes(event.target.checked)
  }

  const handleClearFilters = () => {
    setSelectedArea('')
    setSelectedTipo('')
    setSelectedFamilia('')
    setSearchTerm('')
    setShowOnlyPaquetes(false)
    setProductsPage(0)
  }

  const handleAreaChange = (e: SelectChangeEvent<string>) => {
    setSelectedArea(e.target.value)
  }

  const handleTipoChange = (e: SelectChangeEvent<string>) => {
    setSelectedTipo(e.target.value)
  }

  const handleFamiliaChange = (e: SelectChangeEvent<string>) => {
    setSelectedFamilia(e.target.value)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchTerm(event.target.value)
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

  // Resetear la página del paginador al cambiar filtros
  useEffect(() => {
    if (anchorEl) {
      setProductsPage(0)
    }
  }, [selectedArea, selectedTipo, selectedFamilia, searchTerm])

  if (loading) return <Typography>Cargando...</Typography>
  if (error) return <Typography color='error'>{error}</Typography>
  if (!formData) return <Typography>No se encontró la cotización</Typography>

  return (
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
                </div>
              </div>
            </div>
          </Grid>

          {/* Información de Emisión de Orden de Compra */}
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'right', mb: 4 }}>
              <Typography variant='h6'>Emisión de Orden de Compra o Transferencia</Typography>
              <Typography>Nombre: Sociedad Laboratorio Pampa Austral Ltda.</Typography>
              <Typography>Rut: 77.390.460-K</Typography>
              <Typography>Dirección: Calle Santa Blanca N° 51, Chillán, Región de Ñuble, Chile</Typography>
              <Typography>Cuenta Corriente: 220-02813-03, Banco de Chile.</Typography>
            </Box>
          </Grid>

          {/* Contacto */}
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
                      {option.nombre}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {option.empresa || 'Sin empresa'} - {option.cargo}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {option.email}
                    </Typography>
                  </Box>
                </Box>
              )}
              filterOptions={(options, { inputValue }) => {
                const searchTerms = inputValue.toLowerCase().split(' ')

                return options.filter(option => {
                  const searchableText =
                    `${option.nombre} ${option.cargo} ${option.email} ${option.telefono1} ${option.empresa || ''}`.toLowerCase()

                  return searchTerms.every(term => searchableText.includes(term))
                })
              }}
              onChange={(_, newValue) => {
                handleContactChange(newValue)
              }}
              value={formData.contacto}
            />
            {/* Detalles del contacto seleccionado */}
            {formData.contacto && (
              <Box sx={{ mt: 2, position: 'relative' }}>
                <IconButton
                  size='small'
                  onClick={() => handleContactChange(null)}
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
                  <Typography>{formData.contacto.cargo} - {formData.contacto.empresa || 'Sin empresa'}</Typography>
                  <Typography>{formData.contacto.email}</Typography>
                </div>
              </Box>
            )}
          </Grid>

          {/* Primera fila 4-4-4 */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Cotización</InputLabel>
                  <Select
                    value={formData.tipoCotizacion}
                    label='Tipo de Cotización'
                    onChange={e => setFormData({ ...formData, tipoCotizacion: e.target.value })}
                  >
                    <MenuItem value='A'>Valores Unitarios</MenuItem>
                    <MenuItem value='B'>EMS</MenuItem>
                    <MenuItem value='C'>Mensual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Lista de Precios</InputLabel>
                  <Select
                    value={formData.listaPrecioId || ''}
                    label='Lista de Precios'
                    onChange={e => setFormData({ ...formData, listaPrecioId: e.target.value ? Number(e.target.value) : null })}
                  >
                    {listasPrecios.map(lista => (
                      <MenuItem key={lista.id} value={lista.id}>
                        {lista.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Forma de Pago</InputLabel>
                  <Select
                    value={formData.formaPago || 'CONTADO'}
                    label='Forma de Pago'
                    onChange={e => setFormData({ ...formData, formaPago: e.target.value })}
                  >
                    <MenuItem value='CONTADO'>Contado</MenuItem>
                    <MenuItem value='CREDITO_30'>Crédito 30 días</MenuItem>
                    <MenuItem value='CREDITO_60'>Crédito 60 días</MenuItem>
                    <MenuItem value='CREDITO_90'>Crédito 90 días</MenuItem>
                  </Select>
                  <Typography variant='caption' sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                    Métodos de pago: Transferencia, Tarjetas vía flow.cl, solicitar link
                  </Typography>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Segunda fila 4-4-4 */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Nombre del Proyecto'
                  value={formData.nombreProyecto || ''}
                  onChange={e => setFormData({ ...formData, nombreProyecto: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Empresa'
                  value={formData.empresa || ''}
                  onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Ubicación'
                  value={formData.ubicacion || ''}
                  onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Campos EMS cuando el tipo es B */}
          {formData.tipoCotizacion === 'B' && (
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Información EMS
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Superficie EMS'
                    multiline
                    rows={4}
                    value={formData.superficieEMS || ''}
                    onChange={e => setFormData({ ...formData, superficieEMS: e.target.value })}
                    placeholder='Ingrese la superficie EMS...'
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Antecedentes EMS'
                    multiline
                    rows={4}
                    value={formData.antecedentesEMS || ''}
                    onChange={e => setFormData({ ...formData, antecedentesEMS: e.target.value })}
                    placeholder='Ingrese los antecedentes EMS...'
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Plazo de Entrega EMS'
                    multiline
                    rows={4}
                    value={formData.plazoEntregaEMS || ''}
                    onChange={e => setFormData({ ...formData, plazoEntregaEMS: e.target.value })}
                    placeholder='Ingrese el plazo de entrega EMS...'
                  />
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Detalles de Servicios */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant='h6'>Detalle de Servicios</Typography>
              <FormControlLabel
                control={<Switch checked={sinCantidad} onChange={e => setSinCantidad(e.target.checked)} size='small' />}
                label='Sin cantidad'
              />
            </Box>

            {productRows.map((row, index) => (
              <Grid container spacing={2} key={row.id}>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label='Servicio' value={row.servicio || ''} onClick={handleOpenPopover} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField fullWidth label='Área' value={row.area || ''} disabled />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField fullWidth label='Descripción' value={row.descripcion || ''} multiline maxRows={4} />
                </Grid>
                <Grid item xs={12} md={1}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Cantidad'
                    value={row.cantidad}
                    onChange={e => handleCantidadChange(index, Number(e.target.value))}
                    inputProps={{ min: 1 }}
                    disabled={sinCantidad}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Precio Unitario UF'
                    value={row.precioUnitarioUF}
                    onChange={e => handlePrecioChange(index, Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>UF</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label='Total Neto UF'
                    value={row.totalNetoUF || 0}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>UF</InputAdornment>,
                      readOnly: true
                    }}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <IconButton onClick={() => handleDeleteRow(index)} color='error'>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Button
              variant='outlined'
              onClick={() => {
                setProductRows([
                  ...productRows,
                  {
                    id: Date.now(),
                    productoId: '0',
                    cantidad: 1,
                    precioUnitarioUF: 0,
                    totalNetoUF: 0,
                    area: '',
                    descripcion: '',
                    subproductos: []
                  }
                ])
              }}
              startIcon={<i className='ri-add-line' />}
            >
              Agregar Producto
            </Button>
          </Grid>

          {/* Popover de selección de productos */}
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
                overflow: 'auto',
                zIndex: 1
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size='small'
                placeholder='Buscar por nombre, descripción o norma...'
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
                  <InputLabel shrink>Área</InputLabel>
                  <Select value={selectedArea} label='Área' onChange={handleAreaChange} displayEmpty renderValue={selected => selected === '' ? 'Todas' : selected}>
                    <MenuItem value=''>Todas</MenuItem>
                    {areas.map(area => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size='small' fullWidth>
                  <InputLabel shrink>Tipo</InputLabel>
                  <Select value={selectedTipo} label='Tipo' onChange={handleTipoChange} displayEmpty renderValue={selected => selected === '' ? 'Todos' : selected}>
                    <MenuItem value=''>Todos</MenuItem>
                    {tipos.map(tipo => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size='small' fullWidth>
                  <InputLabel shrink>Familia</InputLabel>
                  <Select value={selectedFamilia} label='Familia' onChange={handleFamiliaChange} displayEmpty renderValue={selected => selected === '' ? 'Todas' : selected}>
                    <MenuItem value=''>Todas</MenuItem>
                    {familias.map(familia => (
                      <MenuItem key={familia} value={familia}>
                        {familia}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch checked={showOnlyPaquetes} onChange={handleShowOnlyPaquetesChange} size='small' />
                  }
                  label='Solo Paquetes'
                />
                <Button
                  size='small'
                  onClick={() => {
                    handleClearFilters()
                    setShowOnlyPaquetes(false)
                  }}
                  startIcon={<i className='ri-filter-off-line' />}
                >
                  Limpiar filtros
                </Button>
              </Box>
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
                              {' '}
                              - {producto.norma}
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
                        {/* {producto.esPaquete &&
                          producto.productosEnPaquete &&
                          producto.productosEnPaquete.length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant='caption' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                                Incluye:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: 1 }}>
                                {producto.productosEnPaquete.map((pp: any, i: number) => (
                                  <Typography
                                    key={i}
                                    variant='caption'
                                    color='text.secondary'
                                    sx={{
                                      display: 'inline-block',
                                      '&:not(:last-child):after': {
                                        content: '","',
                                        marginRight: '4px'
                                      }
                                    }}
                                  >
                                    {pp.nombre}
                                  </Typography>
                                ))}
                              </Box>
                            </Box>
                          )} */}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
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
          </Popover>

          {/* Observaciones */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Observaciones
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={formData.observaciones || ''}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder='Ingrese aquí cualquier observación o nota adicional para la cotización...'
            />
          </Grid>

          {/* Botones de acción */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant='outlined' color='secondary' onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button variant='contained' onClick={handleSave}>
                Guardar Cambios
              </Button>
              <Button variant='outlined' onClick={handlePreview}>
                Vista Previa
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default DuplicateCard
