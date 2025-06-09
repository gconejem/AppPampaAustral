'use client'

// React Imports
import { useEffect, useState, useCallback, useRef } from 'react'
import type { SyntheticEvent } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CardContent from '@mui/material/CardContent'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import type { SelectChangeEvent } from '@mui/material/Select'
import Select from '@mui/material/Select'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import type { Theme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Autocomplete from '@mui/material/Autocomplete'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Popover from '@mui/material/Popover'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import CircularProgress from '@mui/material/CircularProgress'
import FormHelperText from '@mui/material/FormHelperText'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'

// Third Party Imports
import { toast } from 'react-hot-toast'

// Type Imports
import type { TipoCotizacion, EstadoCotizacion } from '@prisma/client'

import type { ContactoType } from '@/types/apps/contactTypes'
import { ROLES_CONTACTO } from '@/constants/roles'

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
    numeroCotizacion: '0001',
    tipoCotizacion: 'A',
    estado: 'BORRADOR',
    nombreProyecto: '',
    ubicacion: '',
    empresa: '',
    fechaInicio: new Date(),
    fechaFin: new Date(new Date().setDate(new Date().getDate() + 15)),
    clienteId: null,
    obraId: null,
    contactId: null,
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
    precioEMSPorProducto: true,
    precioEMSTotal: 0,
    precioMensualPorProducto: true,
    precioMensualTotal: 0,
    productos: [],
    superficieEMS: '',
    antecedentesEMS: '',
    duracionMensual: '',
    jornadaMensual: '',
    antecedentesMensual: ''
  }

  const initialValidationErrors: ValidationErrors = {
    tipoCotizacion: false,
    nombreProyecto: false,
    ubicacion: false
  }

  // Actualizar la declaración del estado
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(initialValidationErrors)
  const [fechaEmision, setFechaEmision] = useState<Date>(new Date())

  const [fechaVencimiento, setFechaVencimiento] = useState<Date>(
    new Date(new Date().setDate(new Date().getDate() + 15))
  )

  // Función para actualizar el formulario
  const updateFormData = (newData: any) => {
    setFormData(prevData => {
      const updatedData = {
        ...prevData,
        ...newData,
        detalles: productRows.map(row => ({
          productoId: parseInt(row.productoId),
          servicio: row.servicio || '',
          area: row.area || '',
          descripcion: row.descripcion || '',
          cantidad: row.cantidad,
          precioUnitarioUF: parseFloat(row.precioUnitarioUF?.toString() || '0'),
          totalNetoUF: parseFloat(row.totalNetoUF?.toString() || '0'),
          esPaquete: row.esPaquete || false,
          esSubProducto: row.esSubProducto || false
        }))
      }

      // Debug para ver qué datos se están pasando a AddActions
      console.log('Datos actualizados en AddCard:', updatedData)
      console.log('Contacto en AddCard:', updatedData.contacto)
      console.log('Detalles en AddCard:', updatedData.detalles)

      // Actualizar el estado en AddActions
      if (typeof onFormDataChange === 'function') {
        onFormDataChange(updatedData)
      }

      return updatedData
    })
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

      // Filtrar solo las filas que tienen un producto seleccionado y no son subproductos
      const detallesValidos = productRows
        .filter(row => row.productoId && row.productoId !== '0' && !row.esSubProducto)
        .map(row => ({
          productoId: parseInt(row.productoId),
          cantidad: row.cantidad,
          precioUnitario: row.precioUnitarioUF,
          descuento: row.descuento || 0,
          subtotal: row.totalNetoUF
        }))

      if (detallesValidos.length === 0) {
        toast.error('Debe agregar al menos un producto a la cotización')

        return
      }

      console.log('Detalles a enviar:', detallesValidos)

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
        contacto: formData.contacto,
        listaPrecioId: formData.listaPrecioId,
        contactId:
          typeof formData.contactId === 'number' && !isNaN(formData.contactId) ? formData.contactId : undefined,
        detalles: detallesValidos,
        formaPago: formData.formaPago
      }

      console.log('Datos completos a enviar:', dataToSend)

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

      const result = await response.json()

      console.log('Respuesta del servidor:', result)

      toast.success('Cotización guardada exitosamente')
      router.push('/apps/invoice/list')
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error(error.message || 'Error al guardar la cotización')
    }
  }

  // States
  // const [open, setOpen] = useState(false)
  const [count, setCount] = useState(1)
  const [selectData, setSelectData] = useState<InvoiceType | null>(null)
  const [clientes, setClientes] = useState<ClienteType[]>([])
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
      contactId: number
      nombre: string
      cargo: string
      email: string
      telefono1: string
      empresa?: string
    }>
  >([])

  // Agregar nuevo estado para áreas únicas
  const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([])
  const [familias, setFamilias] = useState<Array<{ id: number; nombre: string; areaId: number }>>([])
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedTipo, setSelectedTipo] = useState<string>('')
  const [selectedFamilia, setSelectedFamilia] = useState<string>('')
  const [tipos, setTipos] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Agregar estado para las fechas
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Agregar estado para filtro de paquetes
  const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
  const [sinCantidad, setSinCantidad] = useState(false)

  // Agregar después de los otros estados
  const [listasPrecios, setListasPrecios] = useState<Array<{ id: number; nombre: string }>>([])
  const [selectedListaPrecio, setSelectedListaPrecio] = useState<number | null>(null)

  // Guardar los últimos totales para evitar bucles infinitos
  const lastTotals = useRef({ subtotal: 0, descuento: 0, impuesto: 0, total: 0 })

  // Hooks
  // const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  // Estados para paginación del buscador de productos
  const [productsPage, setProductsPage] = useState(0)
  const [totalProductos, setTotalProductos] = useState(0)
  const ITEMS_PER_PAGE = 10

  // Justo después de los estados principales:
  const [subtotal, setSubtotal] = useState(0)
  const [descuentoTotal, setDescuentoTotal] = useState(0)
  const [impuesto, setImpuesto] = useState(0)
  const [total, setTotal] = useState(0)

  // Estado para abrir automáticamente el popover en una fila nueva
  const [autoOpenRowId, setAutoOpenRowId] = useState<number | null>(null)

  // Agregar estado para guardar el índice de la fila activa
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null)

  // Crear un array de refs para los inputs de Servicio/Ensayo
  const servicioRefs = useRef<(HTMLInputElement | null)[]>([])
  // Crear un array de refs para los divs contenedores
  const servicioAnchorRefs = useRef<(HTMLDivElement | null)[]>([])

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
    // Primero cargar todos los productos sin paginación para obtener las áreas, tipos y familias
    fetch('/api/productos?limit=1000') // Usar un límite alto para obtener todos los productos
      .then(res => {
        if (!res.ok) {
          throw new Error('Error al cargar productos')
        }
        return res.json()
      })
      .then(response => {
        const data = response.productos || []

        // Obtener todas las áreas, tipos y familias únicas de todos los productos
        const uniqueTipos = Array.from(new Set(data.map((p: any) => p.tipo || 'Sin tipo')))
          .filter(tipo => tipo)
          .sort()

        const uniqueFamilias = Array.from(new Set(data.map((p: any) => p.familia || 'Sin familia')))
          .filter(familia => familia)
          .sort()

        setTipos(uniqueTipos as string[])
        setFamilias(uniqueFamilias as string[])
        setProductos(data)
      })
      .catch(error => {
        console.error('Error al cargar productos:', error)
        toast.error('Error al cargar los productos')
        setProductos([])
      })
  }, []) // Solo se ejecuta al montar el componente

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

  // Agregar useEffect para resetear la página cuando cambien los filtros
  useEffect(() => {
    if (anchorEl) {
      setProductsPage(0)
    }
  }, [selectedArea, selectedTipo, selectedFamilia, searchTerm])

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

        // Mapear los datos para asegurar la estructura correcta y mostrar el label del cargo
        const contactosMapeados = data.map((contacto: any) => ({
          contactId: contacto.contactId, // Usar contactId
          nombre: contacto.nombre,
          cargo: ROLES_CONTACTO.find(c => c.value === contacto.cargo)?.label || contacto.cargo || '',
          email: contacto.email,
          telefono1: contacto.telefono1,
          empresa: contacto.empresa || 'Sin empresa'
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
      const selectedClient = clientes.find(c => c.clienteId === selectedClientId)

      if (selectedClient?.clienteId) {
        updateFormData({
          clienteId: selectedClient.clienteId
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error al cambiar cliente:', error.message)
      } else {
        console.error('Error desconocido al cambiar cliente')
      }
    }
  }

  const deleteForm = (e: SyntheticEvent) => {
    e.preventDefault()

    // @ts-ignore
    e.target.closest('.repeater-item').remove()
  }

  // Reemplazar calcularTotales por un useEffect puro:
  useEffect(() => {
    if (sinCantidad) {
      if (subtotal !== 0) setSubtotal(0)
      if (descuentoTotal !== 0) setDescuentoTotal(0)
      if (impuesto !== 0) setImpuesto(0)
      if (total !== 0) setTotal(0)
      return
    }
    // Calcular el subtotal sumando todos los totales netos
    const subtotalTotal = productRows.reduce((acc, row) => acc + Number(row.totalNetoUF || 0), 0)
    const descuento = Number(formData.descuento || 0)
    const baseImponible = subtotalTotal - descuento
    const iva = baseImponible * 0.19
    const totalFinal = baseImponible + iva
    if (subtotal !== subtotalTotal) setSubtotal(parseFloat(subtotalTotal.toFixed(2)))
    if (descuentoTotal !== descuento) setDescuentoTotal(parseFloat(descuento.toFixed(2)))
    if (impuesto !== iva) setImpuesto(parseFloat(iva.toFixed(2)))
    if (total !== totalFinal) setTotal(parseFloat(totalFinal.toFixed(2)))
  }, [productRows, sinCantidad, formData.descuento])

  // Asegurarnos de que se recalculen los totales cuando cambian las filas
  /* useEffect(() => {
    calcularTotales()
  }, [productRows, calcularTotales]) */

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

        // Agregar los productos del paquete como subfilas, asegurando que los campos estén completos
        const productosRows = productosEnPaquete.map((pp: any, i: number) => ({
          id: Date.now() + i + 1,
          productoId: (pp.productoId || pp.producto?.productoId || '').toString(),
          servicio: pp.nombre || pp.producto?.nombre || '',
          descripcion: pp.descripcion || pp.producto?.descripcion || '',
          cantidad: pp.cantidad || 1,
          precioUnitarioUF: pp.precio || pp.producto?.precio || 0,
          totalNetoUF: sinCantidad ? 0 : (pp.precio || pp.producto?.precio || 0) * (pp.cantidad || 1),
          area: pp.area || pp.producto?.area || '',
          esSubProducto: true,
          subproductos: []
        }))

        // Actualizar la fila del paquete
        newRows[index] = {
          ...productRows[index],
          productoId: selectedProductId,
          precio: selectedProduct.precio * productRows[index].cantidad,
          area: selectedProduct.area || '',
          descripcion: selectedProduct.descripcion || '',
          esPaquete: true,
          precioEditado: false // Resetea bandera
        }

        // Insertar los subproductos después del paquete
        newRows.splice(index + 1, 0, ...productosRows)
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
        descripcion: selectedProduct.descripcion || '',
        precioEditado: false // Resetea bandera
      }
      console.log('Producto seleccionado:', selectedProduct)
    }

    setProductRows(newRows)
    // calcularTotales()
  }

  // Modificar el handleSelectProduct para incluir el cálculo inicial
  const handleSelectProduct = async (producto: ProductoType) => {
    console.log('Producto seleccionado:', producto)
    console.log('Lista de precios seleccionada:', selectedListaPrecio)

    // Obtener el precio según la lista de precios seleccionada
    const precioEnLista = producto.listasPrecios?.find(
      (lp: ProductoListaPrecio) => lp.listaPrecioId === selectedListaPrecio
    )

    const precioFinal = precioEnLista?.precio || producto.precio || 0

    if (activeRowIndex !== null) {
      const newRows = [...productRows]

      if (producto.esPaquete) {
        let productosEnPaquete = producto.productosEnPaquete

        // Si no vienen los productos, los pedimos al backend
        if (!productosEnPaquete || productosEnPaquete.length === 0) {
          try {
            const response = await fetch(`/api/productos/${producto.productoId}/productos`)
            const data = await response.json()
            productosEnPaquete = data.productos || []
          } catch (error) {
            console.error('Error al obtener productos del paquete:', error)
            productosEnPaquete = []
          }
        }

        console.log('productosEnPaquete', productosEnPaquete)

        // Crear el nombre completo del servicio incluyendo la norma
        const nombreCompleto = producto.norma ? `${producto.nombre || ''} - ${producto.norma}` : producto.nombre || ''

        // Agregar el paquete como fila principal
        const paqueteRow = {
          id: Date.now(),
          productoId: producto.productoId.toString(),
          servicio: nombreCompleto,
          descripcion: producto.descripcion || '',
          cantidad: 1,
          precioUnitarioUF: precioFinal,
          totalNetoUF: precioFinal,
          area: producto.area || '',
          esPaquete: true,
          subproductos: []
        }

        // Agregar los productos del paquete como subfilas
        const productosRows = productosEnPaquete.map((pp: any, i: number) => ({
          id: Date.now() + i + 1,
          productoId: (pp.productoId || pp.producto?.productoId || '').toString(),
          servicio: pp.producto.nombre + ' - ' + pp.producto.norma,
          descripcion: pp.producto?.descripcion || '',
          cantidad: pp.cantidad || 1,
          precioUnitarioUF: pp.precio || pp.producto?.precio || 0,
          totalNetoUF: sinCantidad ? 0 : (pp.precio || pp.producto?.precio || 0) * (pp.cantidad || 1),
          area: pp.area || pp.producto?.area || '',
          esSubProducto: true,
          subproductos: []
        }))

        // Reemplazar la fila actual con el paquete y sus productos
        newRows.splice(activeRowIndex, 1, paqueteRow, ...productosRows)
      } else {
        // Si no es un paquete, actualizar la fila normal o subproducto
        const nombreCompleto = producto.norma ? `${producto.nombre} - ${producto.norma}` : producto.nombre
        newRows[activeRowIndex] = {
          ...newRows[activeRowIndex],
          productoId: producto.productoId.toString(),
          servicio: nombreCompleto,
          descripcion: producto.descripcion || '',
          area: producto.area || '',
          precioUnitarioUF: precioFinal,
          totalNetoUF: precioFinal * (newRows[activeRowIndex].cantidad || 1)
        }
      }

      setProductRows(newRows)
      setActiveRowIndex(null) // Resetear el índice activo
    }

    handleClosePopover()
  }

  // Modificar los manejadores de cambio de precio y cantidad
  const handlePrecioChange = (index: number, precioUF: number) => {
    const newRows = [...productRows]
    const cantidad = Number(newRows[index].cantidad || 1)
    const precio = Number(precioUF)

    newRows[index] = {
      ...newRows[index],
      precioUnitarioUF: precio,
      totalNetoUF: sinCantidad ? 0 : precio * cantidad,
      precioEditado: true // Marca como editado manualmente
    }

    setProductRows(newRows)
  }

  const handleCantidadChange = (index: number, cantidad: number) => {
    const newRows = [...productRows]
    const precioUF = Number(newRows[index].precioUnitarioUF || 0)
    const cantidadNum = sinCantidad ? 1 : Number(cantidad)

    newRows[index] = {
      ...newRows[index],
      cantidad: cantidadNum,
      totalNetoUF: sinCantidad ? 0 : precioUF * cantidadNum
    }

    setProductRows(newRows)
  }

  // Función para manejar la visualización
  const handlePreview = () => {
    // Validar que haya al menos un producto
    const productosValidos = productRows.filter(row => row.productoId && row.productoId !== '0' && !row.esSubProducto)

    if (productosValidos.length === 0) {
      toast.error('Debe agregar al menos un producto a la cotización')

      return
    }

    console.log('productRows', productRows)

    // Preparar los datos para la previsualización
    const previewData = {
      ...formData,
      detalles: productRows.map(row => ({
        productoId: parseInt(row.productoId),
        servicio: row.servicio || '',
        norma: row.norma || '',
        area: row.area || '',
        descripcion: row.descripcion || '',
        cantidad: row.cantidad,
        precioUnitarioUF: parseFloat(row.precioUnitarioUF?.toString() || '0'),
        totalNetoUF: parseFloat(row.totalNetoUF?.toString() || '0'),
        esPaquete: row.esPaquete || false,
        esSubProducto: row.esSubProducto || false
      })),
      subtotal: subtotal,
      descuento: descuentoTotal,
      impuesto: impuesto,
      total: total,
      observaciones: formData.observaciones || '',
      listaPrecioId: selectedListaPrecio
    }

    // Debug para ver qué datos se están enviando
    console.log('Datos de preview:', previewData)
    console.log('Detalles a enviar:', previewData.detalles)

    // Guardar en localStorage
    localStorage.setItem('cotizacionPreview', JSON.stringify(previewData))

    // Abrir en nueva pestaña
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
      cantidad: sinCantidad ? 1 : 1,
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
    console.log('handleDeleteRow', { index, row: productRows[index] })
    const newRows = [...productRows]
    const rowToDelete = newRows[index]

    if (rowToDelete.esPaquete) {
      let nextIndex = index + 1
      while (nextIndex < newRows.length && newRows[nextIndex].esSubProducto) {
        nextIndex++
      }
      newRows.splice(index, nextIndex - index)
      console.log('Paquete y subproductos eliminados', newRows)
    } else {
      newRows.splice(index, 1)
      console.log('Producto/subproducto eliminado', newRows)
    }
    setProductRows(newRows)
  }

  // Manejar error de tipo unknown
  const handleError = (error: unknown) => {
    if (error instanceof Error) {
      console.error('Error:', error.message)
      toast.error(error.message)
    } else {
      console.error('Error desconocido:', error)
      toast.error('Error desconocido')
    }
  }

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || '' // Aseguramos que nunca sea null
    }))
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleClearFilters = () => {
    setSelectedArea('')
    setSelectedTipo('') // Solo limpiar el select de tipo
    setSelectedFamilia('')
    setSearchTerm('')
    setShowOnlyPaquetes(false) // Solo limpiar el switch
    setProductsPage(0)
  }

  const filterProducts = (search: string, area: string, tipo: string, familia: string) => {
    console.log('Iniciando filtrado de productos')
    console.log('Estado actual de showOnlyPaquetes:', showOnlyPaquetes)
    console.log('Total de productos antes de filtrar:', productos.length)

    // Log detallado de cada producto
    console.log(
      'Detalle de productos antes de filtrar:',
      productos.map(p => ({
        id: p.productoId,
        nombre: p.nombre,
        esPaquete: p.esPaquete,
        tipo: p.tipo
      }))
    )

    let filtered = [...productos]

    // Filtrar por paquetes si está activado
    if (showOnlyPaquetes) {
      console.log('Aplicando filtro de solo paquetes')
      filtered = filtered.filter(product => {
        const isPaquete = product.esPaquete === true

        console.log(`Producto "${product.nombre}" (ID: ${product.productoId}) - esPaquete:`, isPaquete)

        return isPaquete
      })
      console.log(
        'Productos después de filtrar por paquetes:',
        filtered.map(p => ({
          id: p.productoId,
          nombre: p.nombre,
          esPaquete: p.esPaquete
        }))
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()

      filtered = filtered.filter(
        product =>
          (product.nombre || '').toLowerCase().includes(searchLower) ||
          (product.sku || '').toLowerCase().includes(searchLower) ||
          (product.descripcion || '').toLowerCase().includes(searchLower) ||
          (product.norma || '').toLowerCase().includes(searchLower)
      )
    }

    if (area) {
      filtered = filtered.filter(product => (product.area || '').toLowerCase().trim() === area.toLowerCase().trim())
    }

    if (tipo) {
      filtered = filtered.filter(product => (product.tipo || '').toLowerCase().trim() === tipo.toLowerCase().trim())
    }

    if (familia) {
      filtered = filtered.filter(
        product => (product.familia || '').toLowerCase().trim() === familia.toLowerCase().trim()
      )
    }

    console.log(
      'Productos filtrados finales:',
      filtered.map(p => ({
        id: p.productoId,
        nombre: p.nombre,
        esPaquete: p.esPaquete,
        tipo: p.tipo
      }))
    )

    setFilteredProductos(filtered)
  }

  const [selectedProduct, setSelectedProduct] = useState<ProductoType | null>(null)
  const [servicio, setServicio] = useState('')

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setLoadingProductos(true)
    setProductsPage(0) // Resetear a la primera página
    // Limpiar todos los filtros de forma independiente
    setSearchTerm('')
    setSelectedArea('')
    setSelectedAreaId(null)
    setSelectedTipo('') // El select de tipo debe mostrar 'Todos'
    setSelectedFamilia('')
    setShowOnlyPaquetes(false) // El switch debe estar apagado
    filterProducts('', '', '', '')
    setLoadingProductos(false)
    // Forzar el reseteo visual y funcional en el siguiente ciclo de render
    setTimeout(() => {
      setSelectedTipo('')
      setShowOnlyPaquetes(false)
    }, 0)
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

  // Agregar un useEffect para manejar el cambio de showOnlyPaquetes
  useEffect(() => {
    filterProducts(searchTerm, selectedArea, selectedTipo, selectedFamilia)
  }, [showOnlyPaquetes]) // Agregar showOnlyPaquetes como dependencia

  const handleShowOnlyPaquetesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyPaquetes(event.target.checked)
    // No modificar selectedTipo aquí
  }

  const handleMoveUp = (index: number) => {
    console.log('handleMoveUp', { index, row: productRows[index] })
    if (index === 0) return
    const newRows = [...productRows]
    const currentRow = newRows[index]

    if (currentRow.esSubProducto) {
      let parentIndex = index - 1
      while (parentIndex >= 0 && !newRows[parentIndex].esPaquete) {
        parentIndex--
      }
      if (parentIndex >= 0 && index > parentIndex + 1) {
        [newRows[index], newRows[index - 1]] = [newRows[index - 1], newRows[index]]
        setProductRows(newRows)
        console.log('Subproducto movido arriba', newRows)
      }
      return
    }
    [newRows[index], newRows[index - 1]] = [newRows[index - 1], newRows[index]]
    setProductRows(newRows)
    console.log('Producto/paquete movido arriba', newRows)
  }

  const handleMoveDown = (index: number) => {
    console.log('handleMoveDown', { index, row: productRows[index] })
    if (index === productRows.length - 1) return
    const newRows = [...productRows]
    const currentRow = newRows[index]

    if (currentRow.esSubProducto) {
      let nextPackageIndex = index + 1
      while (nextPackageIndex < newRows.length && !newRows[nextPackageIndex].esPaquete) {
        nextPackageIndex++
      }
      if (index < nextPackageIndex - 1) {
        [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]]
        setProductRows(newRows)
        console.log('Subproducto movido abajo', newRows)
      }
      return
    }
    [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]]
    setProductRows(newRows)
    console.log('Producto/paquete movido abajo', newRows)
  }

  const canMoveUp = (index: number): boolean => {
    if (index === 0) return false
    const currentRow = productRows[index]
    const prevRow = productRows[index - 1]
    
    // Si es un subproducto, solo puede moverse dentro de su paquete
    if (currentRow.esSubProducto) {
      // Buscar el índice del paquete padre
      let parentIndex = index - 1
      while (parentIndex >= 0 && !productRows[parentIndex].esPaquete) {
        parentIndex--
      }
      return parentIndex >= 0 && index > parentIndex + 1
    }
    
    return true
  }

  const canMoveDown = (index: number): boolean => {
    if (index === productRows.length - 1) return false
    const currentRow = productRows[index]
    const nextRow = productRows[index + 1]
    
    // Si es un subproducto, solo puede moverse dentro de su paquete
    if (currentRow.esSubProducto) {
      // Buscar el siguiente paquete o el final de la lista
      let nextPackageIndex = index + 1
      while (nextPackageIndex < productRows.length && !productRows[nextPackageIndex].esPaquete) {
        nextPackageIndex++
      }
      return index < nextPackageIndex - 1
    }
    
    return true
  }

  // Agregar después de los otros useEffect
  useEffect(() => {
    // Cargar listas de precios
    fetch('/api/listas-precios')
      .then(res => res.json())
      .then(data => {
        console.log('Listas de precios cargadas:', data)
        setListasPrecios(data)

        if (data.length > 0) {
          setSelectedListaPrecio(data[0].id)
        }
      })
      .catch(error => {
        console.error('Error al cargar listas de precios:', error)
        toast.error('Error al cargar las listas de precios')
      })
  }, [])

  // Actualizar precios de productos en el formulario al cambiar la lista de precios seleccionada
  useEffect(() => {
    setProductRows(prevRows =>
      prevRows.map(row => {
        const producto = productos.find(p => p.productoId.toString() === row.productoId)

        if (!producto) return row

        const precioEnLista = producto.listasPrecios?.find(
          (lp: ProductoListaPrecio) => lp.listaPrecioId === selectedListaPrecio
        )

        const precioFinal = precioEnLista?.precio || producto.precio || 0

        // Solo actualiza si el precio NO ha sido editado manualmente
        if (!row.precioEditado && row.precioUnitarioUF !== precioFinal) {
          return {
            ...row,
            precioUnitarioUF: precioFinal,
            totalNetoUF: precioFinal * (row.cantidad || 1)
          }
        }

        return row
      })
    )
  }, [selectedListaPrecio, productos])

  useEffect(() => {
    // Forzar refresco de filas para que se apliquen los nuevos disabled/readOnly
    setProductRows(rows => [...rows])
  }, [formData.tipoCotizacion, formData.precioEMSPorProducto, formData.precioMensualPorProducto])

  const handleAreaChange = (e: SelectChangeEvent<string>) => {
    const areaId = e.target.value ? Number(e.target.value) : null
    setSelectedAreaId(areaId)
    setSelectedArea(areaId ? areas.find(a => a.id === areaId)?.nombre || '' : '')
    setSelectedFamilia('') // Resetear familia cuando cambia el área
  }

  const handleTipoChange = (e: SelectChangeEvent<string>) => {
    setSelectedTipo(e.target.value)
  }

  const handleFamiliaChange = (e: SelectChangeEvent<string>) => {
    setSelectedFamilia(e.target.value)
  }

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        const url = new URL('/api/productos', window.location.origin)
        url.searchParams.append('page', (productsPage + 1).toString()) // Aseguramos que page sea al menos 1
        url.searchParams.append('limit', '10')
        if (selectedArea) url.searchParams.append('area', selectedArea)
        if (selectedTipo) url.searchParams.append('tipo', selectedTipo)
        if (selectedFamilia) url.searchParams.append('familia', selectedFamilia)
        if (searchTerm) url.searchParams.append('search', searchTerm)

        const response = await fetch(url.toString())
        const data = await response.json()

        setFilteredProductos(data.productos)
        setTotalProductos(data.total)
      } catch (error) {
        console.error('Error al cargar productos filtrados:', error)
        toast.error('Error al cargar los productos')
      }
    }

    if (anchorEl) {
      fetchFilteredProducts()
    }
  }, [anchorEl, productsPage, selectedArea, selectedTipo, selectedFamilia, searchTerm])

  // useEffect para actualizar cantidades cuando cambia sinCantidad
  useEffect(() => {
    setProductRows(prevRows =>
      prevRows.map(row => ({
        ...row,
        cantidad: sinCantidad ? 0 : 1,
        totalNetoUF: sinCantidad ? 0 : Number(row.precioUnitarioUF || 0) * (sinCantidad ? 0 : 1)
      }))
    )
  }, [sinCantidad])

  // Agregar después de los otros useEffect
  useEffect(() => {
    // Cargar áreas
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

  // useEffect para abrir el popover automáticamente en la fila nueva
  useEffect(() => {
    if (autoOpenRowId) {
      // Esperar a que la fila esté en el DOM
      setTimeout(() => {
        const targetElement = document.querySelector(`[data-row-id="${autoOpenRowId}"] input`)
        if (targetElement) {
          (targetElement as HTMLElement).focus()
          // Simular click para abrir el popover
          (targetElement as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))
          setAutoOpenRowId(null)
        }
      }, 100)
    }
  }, [autoOpenRowId, productRows])

  return (
    <>
      <Card
        sx={{
          height: 'auto',
          maxHeight: '100%',
          overflow: 'visible'
        }}
      >
        <CardContent
          sx={{
            height: 'auto',
            overflow: 'visible',
            '&:last-child': { pb: 6 }
          }}
        >
          <Grid container spacing={3} sx={{ overflow: 'visible' }}>
            {/* Header con logo y datos de empresa */}
            <Grid item xs={12}>
              <div className='p-6 bg-actionHover rounded'>
                <div className='flex justify-between gap-4 flex-col sm:flex-row'>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* <Logo style={{ height: 48, width: 'auto' }} /> */}
                    <div>
                      <Typography variant='h6' sx={{ fontWeight: 700, mb: 1 }}>
                        PAMPAUSTRAL
                      </Typography>
                      <Typography color='text.primary'>Calle Santa Blanca 51, Chillán – Chile.</Typography>
                      <Typography color='text.primary'>Email: contacto@pampaustral.cl</Typography>
                      <Typography color='text.primary'>+56 42-223 82 90</Typography>
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
                      <TextField
                        label='Fecha Emisión'
                        type='date'
                        value={fechaEmision.toISOString().slice(0, 10)}
                        onChange={e => setFechaEmision(new Date(e.target.value))}
                        InputLabelProps={{ shrink: true }}
                        size='small'
                        sx={{ minWidth: 150 }}
                      />
                    </div>
                    <div className='flex items-center gap-2'>
                      <Typography sx={{ minWidth: '120px', fontWeight: 500 }} color='text.primary'>
                        Fecha Vencimiento:
                      </Typography>
                      <TextField
                        label='Fecha Vencimiento'
                        type='date'
                        value={fechaVencimiento.toISOString().slice(0, 10)}
                        onChange={e => setFechaVencimiento(new Date(e.target.value))}
                        InputLabelProps={{ shrink: true }}
                        size='small'
                        sx={{ minWidth: 150 }}
                      />
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
                      if (newValue && newValue.contactId) {
                        const contactoData = {
                          contactId: Number(newValue.contactId),
                          nombre: newValue.nombre,
                          cargo: newValue.cargo || 'Sin cargo',
                          email: newValue.email || '',
                          telefono1: newValue.telefono1 || '',
                          empresa: newValue.empresa || 'Sin empresa'
                        }

                        updateFormData({
                          contacto: contactoData,
                          contactId: contactoData.contactId
                        })
                      } else {
                        updateFormData({
                          contacto: null,
                          contactId: null
                        })
                      }
                    }}
                    isOptionEqualToValue={(option, value) => option.contactId === value.contactId}
                    value={
                      formData.contacto && formData.contactId
                        ? {
                            contactId: formData.contactId,
                            nombre: formData.contacto.nombre,
                            cargo: formData.contacto.cargo || 'Sin cargo',
                            email: formData.contacto.email || '',
                            telefono1: formData.contacto.telefono1 || '',
                            empresa: formData.contacto.empresa || 'Sin empresa'
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
                        <Typography  sx={{ fontWeight: 500 }}>
                          {formData.contacto.nombre}
                        </Typography>
                        <Typography>
                        {formData.contacto.cargo} - {formData.contacto.empresa || 'Sin empresa'}
                        </Typography>
                        <Typography>
                          {formData.contacto.email}
                        </Typography>
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

            {/* Segunda fila: Tipo de Cotización, Lista de Precios y Forma de Pago */}
            <Grid item xs={12}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth error={validationErrors.tipoCotizacion}>
                    <InputLabel id='tipo-cotizacion-label' required>
                      Tipo de Cotización
                    </InputLabel>
                    <Select
                      label='Tipo de Cotización'
                      value={formData.tipoCotizacion}
                      onChange={e => {
                        handleChange('tipoCotizacion', e.target.value as TipoCotizacion)
                        setValidationErrors({ ...validationErrors, tipoCotizacion: false })
                      }}
                    >
                      <MenuItem value='A'>Valores Unitarios</MenuItem>
                      <MenuItem value='B'>EMS</MenuItem>
                      <MenuItem value='C'>Mensual</MenuItem>
                    </Select>
                    {validationErrors.tipoCotizacion && <FormHelperText>Este campo es requerido</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id='lista-precios-label'>Lista de Precios</InputLabel>
                    <Select
                      labelId='lista-precios-label'
                      label='Lista de Precios'
                      value={selectedListaPrecio || ''}
                      onChange={e => {
                        const value = e.target.value

                        setSelectedListaPrecio(value ? Number(value) : null)
                      }}
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
            {formData.tipoCotizacion === 'B' && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'action.hover', p: 2 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      Información EMS
                    </Typography>
                    <TextField
                      fullWidth
                      label='Superficie'
                      value={formData.superficieEMS}
                      onChange={e => handleChange('superficieEMS', e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label='Antecedentes'
                      value={formData.antecedentesEMS}
                      onChange={e => handleChange('antecedentesEMS', e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Información adicional para MENSUAL */}
            {formData.tipoCotizacion === 'C' && (
              <Grid item xs={12}>
                <Card sx={{ bgcolor: 'action.hover', p: 2 }}>
                  <CardContent>
                    <Typography variant='h6' gutterBottom>
                      Información Mensual
                    </Typography>
                    <TextField
                      fullWidth
                      label='Duración'
                      value={formData.duracionMensual}
                      onChange={e => handleChange('duracionMensual', e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
                    />
                    <TextField
                      fullWidth
                      label='Jornada Laboral y Horario'
                      value={formData.jornadaMensual}
                      onChange={e => handleChange('jornadaMensual', e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label='Antecedentes'
                      value={formData.antecedentesMensual}
                      onChange={e => handleChange('antecedentesMensual', e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Detalles de la Cotización */}
            <Grid item xs={12} sx={{ mt: 8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography
                  variant='h6'
                  sx={{
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
                <FormControlLabel
                  control={
                    <Switch
                      checked={sinCantidad}
                      onChange={(e) => setSinCantidad(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Sin cantidad"
                />
              </Box>

              {(formData.tipoCotizacion === 'B' || formData.tipoCotizacion === 'C') && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <FormControl>
                    <RadioGroup
                      row
                      value={
                        formData.tipoCotizacion === 'B'
                          ? formData.precioEMSPorProducto
                          : formData.precioMensualPorProducto
                      }
                      onChange={e => {
                        const porProducto = e.target.value === 'true'
                        const isEMS = formData.tipoCotizacion === 'B'

                        updateFormData({
                          ...(isEMS
                            ? {
                                precioEMSPorProducto: porProducto,
                                precioEMSTotal: !porProducto ? formData.subtotal : 0
                              }
                            : {
                                precioMensualPorProducto: porProducto,
                                precioMensualTotal: !porProducto ? formData.subtotal : 0
                              })
                        })
                      }}
                    >
                      <FormControlLabel value={true} control={<Radio size='small' />} label='Precio por producto' />
                      <FormControlLabel value={false} control={<Radio size='small' />} label='Precio total' />
                    </RadioGroup>
                  </FormControl>
                </Box>
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
                    borderColor: 'divider',
                    position: 'relative',
                    ...(row.esSubProducto && {
                      ml: 4,
                      width: 'calc(100% - 32px)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: -16,
                        top: '50%',
                        width: 16,
                        height: 1,
                        backgroundColor: '#000',
                        opacity: 0
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: -16,
                        top: -24,
                        width: 1,
                        height: 'calc(100% + 48px)',
                        backgroundColor: '#000',
                        opacity: 0,
                        display:
                          index < productRows.length - 1 && productRows[index + 1]?.esSubProducto ? 'block' : 'none'
                      }
                    })
                  }}
                >
                  <Grid item xs={12} md={3}>
                    <div ref={el => servicioAnchorRefs.current[index] = el} style={{ width: '100%' }}>
                      <TextField
                        label='Servicio / Ensayo'
                        size='small'
                        fullWidth
                        value={row.servicio}
                        InputLabelProps={{ shrink: !!row.servicio }}
                        onClick={() => {
                          setActiveRowIndex(index)
                          setAnchorEl(servicioAnchorRefs.current[index])
                          setLoadingProductos(true)
                          setProductsPage(0)
                          setSearchTerm('')
                          setSelectedArea('')
                          setSelectedTipo('')
                          setSelectedFamilia('')
                          setShowOnlyPaquetes(false)
                          filterProducts('', '', '', '')
                          setLoadingProductos(false)
                        }}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton size='small' onClick={e => {
                                e.stopPropagation()
                                setActiveRowIndex(index)
                                setAnchorEl(servicioAnchorRefs.current[index])
                                setLoadingProductos(true)
                                setProductsPage(0)
                                setSearchTerm('')
                                setSelectedArea('')
                                setSelectedTipo('')
                                setSelectedFamilia('')
                                setShowOnlyPaquetes(false)
                                filterProducts('', '', '', '')
                                setLoadingProductos(false)
                              }}>
                                <i className='ri-search-line' />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </div>
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
                      onChange={e => {
                        const newRows = [...productRows]

                        newRows[index] = {
                          ...row,
                          descripcion: e.target.value
                        }
                        setProductRows(newRows)
                      }}
                      multiline
                      maxRows={4}
                      placeholder='Ingrese una descripción...'
                    />
                  </Grid>

                  <Grid item xs={12} md={1}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Cantidad'
                      value={row.cantidad}
                      onChange={e => handleCantidadChange(index, Number(e.target.value))}
                      inputProps={{ min: 0 }}
                      disabled={sinCantidad}
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size='small'
                      type='number'
                      label='Precio Unitario UF'
                      value={row.precioUnitarioUF}
                      onChange={e => handlePrecioChange(index, Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>UF</InputAdornment>,
                        readOnly:
                          row.esSubProducto === true ||
                          (formData.tipoCotizacion === 'B' && !formData.precioEMSPorProducto) ||
                          (formData.tipoCotizacion === 'C' && !formData.precioMensualPorProducto)
                      }}
                      disabled={
                        row.esSubProducto === true ||
                        (formData.tipoCotizacion === 'B' && !formData.precioEMSPorProducto) ||
                        (formData.tipoCotizacion === 'C' && !formData.precioMensualPorProducto)
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <TextField
                      fullWidth
                      size='small'
                      disabled
                      label='Total Neto UF'
                      value={row.totalNetoUF || 0}
                      InputProps={{
                        startAdornment: <InputAdornment position='start'>UF</InputAdornment>,
                        readOnly: true
                      }}
                    />
                  </Grid>

                  {/* Botones de acción */}
                  <Grid item xs={12} md={1} sx={{ display: 'flex', gap: 1, alignItems: 'center', pointerEvents: 'auto', zIndex: 10 }}>
                    {/* Botones de acción para productos normales y subproductos */}
                    {!row.esPaquete && (
                      <>
                        <IconButton
                          size='small'
                          onClick={() => handleMoveUp(index)}
                          sx={{ pointerEvents: 'auto', zIndex: 20 }}
                        >
                          <i className='ri-arrow-up-s-line' />
                        </IconButton>
                        <IconButton
                          size='small'
                          onClick={() => handleMoveDown(index)}
                          sx={{ pointerEvents: 'auto', zIndex: 20 }}
                        >
                          <i className='ri-arrow-down-s-line' />
                        </IconButton>
                        <IconButton
                          size='small'
                          onClick={() => handleDeleteRow(index)}
                          sx={{ color: 'error.main', pointerEvents: 'auto', zIndex: 20 }}
                        >
                          <i className='ri-delete-bin-line' />
                        </IconButton>
                      </>
                    )}
                    {/* Botón especial solo para paquetes */}
                    {row.esPaquete && (
                      <>
                        <IconButton
                          size='small'
                          onClick={() => handleMoveUp(index)}
                          sx={{ pointerEvents: 'auto', zIndex: 20 }}
                        >
                          <i className='ri-arrow-up-s-line' />
                        </IconButton>
                        <IconButton
                          size='small'
                          onClick={() => handleMoveDown(index)}
                          sx={{ pointerEvents: 'auto', zIndex: 20 }}
                        >
                          <i className='ri-arrow-down-s-line' />
                        </IconButton>
                        <IconButton
                          size='small'
                          onClick={() => handleDeleteRow(index)}
                          sx={{ color: 'error.main', pointerEvents: 'auto', zIndex: 20 }}
                        >
                          <i className='ri-delete-bin-line' />
                        </IconButton>
                        <Tooltip title="Agregar producto a paquete">
                          <IconButton
                            sx={{
                              backgroundColor: 'primary.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 40,
                              height: 40,
                              ml: 1,
                              '&:hover': { backgroundColor: 'primary.dark' },
                              pointerEvents: 'auto',
                              zIndex: 20
                            }}
                            onClick={() => {
                              // Limpiar todos los filtros antes de abrir el popover
                              setSelectedTipo('');
                              setShowOnlyPaquetes(false);
                              setSearchTerm('');
                              setSelectedArea('');
                              setSelectedAreaId(null);
                              setSelectedFamilia('');
                              setProductsPage(0); // Resetear el paginador
                              filterProducts('', '', '', '');
                              // Agregar una fila vacía como subproducto después del paquete
                              const newProductRow = {
                                id: Date.now(),
                                productoId: '0',
                                servicio: '',
                                descripcion: '',
                                cantidad: 1,
                                precioUnitarioUF: 0,
                                totalNetoUF: 0,
                                area: '',
                                esSubProducto: true,
                                subproductos: []
                              }
                              const newRows = [...productRows]
                              newRows.splice(index + 1, 0, newProductRow)
                              setProductRows(newRows)
                              setTimeout(() => {
                                setActiveRowIndex(index + 1)
                                setAnchorEl(servicioAnchorRefs.current[index + 1])
                              }, 100)
                            }}
                          >
                            <i className='ri-add-line' style={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
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
                  {(formData.tipoCotizacion === 'B' && !formData.precioEMSPorProducto) ||
                  (formData.tipoCotizacion === 'C' && !formData.precioMensualPorProducto) ? (
                    <>
                      <div className='flex justify-between mb-2'>
                        <Typography>Total Neto:</Typography>
                        <TextField
                          size='small'
                          type='number'
                          value={
                            formData.tipoCotizacion === 'B' ? formData.precioEMSTotal : formData.precioMensualTotal
                          }
                          onChange={e => {
                            const total = parseFloat(e.target.value) || 0
                            const impuesto = total * 0.19

                            updateFormData({
                              ...(formData.tipoCotizacion === 'B'
                                ? { precioEMSTotal: total }
                                : { precioMensualTotal: total }),
                              subtotal: total,
                              impuesto: impuesto,
                              total: total + impuesto
                            })
                          }}
                          InputProps={{
                            startAdornment: <InputAdornment position='start'>UF</InputAdornment>
                          }}
                          sx={{ width: '150px' }}
                        />
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
                    </>
                  ) : (
                    <>
                      <div className='flex justify-between mb-2'>
                        <Typography>Subtotal:</Typography>
                        <Typography>UF {subtotal?.toFixed(2) || '0.00'}</Typography>
                      </div>
                      <div className='flex justify-between mb-2'>
                        <Typography>Descuento:</Typography>
                        <Typography>UF {descuentoTotal?.toFixed(2) || '0.00'}</Typography>
                      </div>
                      <div className='flex justify-between mb-2'>
                        <Typography>IVA (19%):</Typography>
                        <Typography>UF {impuesto?.toFixed(2) || '0.00'}</Typography>
                      </div>
                      <Divider className='my-2' />
                      <div className='flex justify-between'>
                        <Typography variant='h6'>Total:</Typography>
                        <Typography variant='h6'>UF {total?.toFixed(2) || '0.00'}</Typography>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Grid>

            {/* Campo de Plazo de Entrega solo para EMS */}
            {formData.tipoCotizacion === 'B' && (
              <Grid item xs={12} sx={{ mt: 4 }}>
                <Typography
                  variant='h6'
                  sx={{
                    mb: 1,
                    fontWeight: 500,
                    color: 'text.secondary',
                    textTransform: 'none',
                    borderBottom: '1px solid',
                    borderColor: 'primary.main',
                    pb: 1
                  }}
                >
                  Plazo de Entrega:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder='Ingrese el plazo de entrega...'
                  value={formData.plazoEntregaEMS || ''}
                  onChange={e => handleChange('plazoEntregaEMS', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper'
                    }
                  }}
                />
              </Grid>
            )}

            {/* Campo de Observaciones */}
            <Grid item xs={12} sx={{ mt: 6 }}>
              <Typography
                variant='h6'
                sx={{
                  mb: 2,
                  fontWeight: 500,
                  color: 'text.secondary',
                  textTransform: 'none',
                  borderBottom: '1px solid',
                  borderColor: 'primary.main',
                  pb: 1
                }}
              >
                Observaciones:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder='Ingrese aquí cualquier observación o nota adicional para la cotización...'
                value={formData.observaciones}
                onChange={e => handleChange('observaciones', e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper'
                  }
                }}
              />
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
              <Button variant='contained' color='primary' onClick={handlePreview} sx={{ mr: 2 }}>
                Guardar y Visualizar
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

      {/* Popover fuera del map */}
      <Popover
        open={Boolean(anchorEl) && activeRowIndex !== null}
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
              <Select 
                value={selectedAreaId?.toString() || ''} 
                label='Área' 
                onChange={handleAreaChange} 
                displayEmpty 
                renderValue={selected => selected === '' ? 'Todas' : areas.find(a => a.id.toString() === selected)?.nombre || ''}
              >
                <MenuItem value=''>Todas</MenuItem>
                {areas.map(area => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' fullWidth>
              <InputLabel shrink>Tipo</InputLabel>
              <Select
                key={anchorEl ? 'open' : 'closed'}
                value={selectedTipo}
                label='Tipo'
                onChange={handleTipoChange}
                displayEmpty
                renderValue={selected => selected === '' ? 'Todos' : selected}
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
        <Box
          sx={{ p: 1, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', gap: 1 }}
        >
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
    </>
  )
}

export default AddCard
