'use client'

// React Imports
import { useState, useEffect, useCallback, useRef } from 'react'

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
import Tooltip from '@mui/material/Tooltip'
import RadioGroup from '@mui/material/RadioGroup'
import Radio from '@mui/material/Radio'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { toast } from 'react-hot-toast'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Función para formatear números UF con formato español (coma decimal y 3 decimales)
const formatUF = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0,00';

  // Usar toFixed(2) para asegurar exactamente 2 decimales
  const formatted = Number(value).toFixed(2);

  // Reemplazar punto por coma para formato español
  return formatted.replace('.', ',');
};

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
  { value: 'otro', label: 'Otro' }
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
  paqueteId?: number | null
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
  notas: string
  numeroCotizacion: string
  version: string
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
  textoGeneral?: string
  duracionMensual?: string
  jornadaMensual?: string
  antecedentesMensual?: string
  alcanceServicio?: string
  antecedentesGeneral?: string
  plazoEntregaGeneral?: string
  sinCantidad?: boolean
  precioProducto?: boolean
  precioTotal?: boolean

}

function getNotasDefault(tipoCotizacion: string) {
  if (tipoCotizacion === 'B') {
    return `Relacionado al valor del servicio cotizado:
• Valor Neto (sin IVA incluido)
• El valor cotizado considera movilización, traslado de personal, equipos y muestras.
• El servicio incluye la emisión de informes digitales sin costo adicional.

Costos Adicionales contra evento:
• La solicitud de copia de un Estudio, con firma y timbres en original, tendrá un costo de:
  Para Estudio con Ingeniería: 3 UF + IVA.
  Para Estudio sin Ingeniería: 1,5 UF + IVA.
• Cuando el cliente lo solicita, los estudios podrán ser distribuidos a domicilio indicado, con un costo de envío 0,25 UF neto + IVA.

Consideraciones adicionales y requisitos especiales
• Esta cotización ha sido elaborada en base a los antecedentes proporcionados por el cliente.`
  }
  if (tipoCotizacion === 'C') {
    return `Notas:
* Valor Neto (sin IVA incluido)
* Adicionales contra evento:
  • Copia digital adicional tiene un costo de 0,15 UF neto.
  • Anexo de Informe, tendrá un costo de 0,42 UF neto, salvo que las modificaciones sean de responsabilidad de Laboratorio Pampa Austral Ltda.
  • Informe con firma y timbres físicos tiene un costo de 0,58 UF neto
  • Recargos por jornadas extraordinarias (a todos los ítem de la cotización).
    50% Adicional Lunes a jueves desde 18:00 a 21:00 horas, viernes 17:00 a 21:00 horas.
    100% Adicional Sábado, Domingo o Festivo.
* Cualquier requisito adicional, como certificaciones, acreditaciones de personal, normativas, reglamentos o exigencias de seguridad y medioambiente, debe informarse previamente para su evaluación y nueva cotización si corresponde.`
  }
  else if (tipoCotizacion === 'A') {
    return `(1) Valores unitarios Neto (sin IVA incluido)

(2) Adicionales en Terreno (contra evento):
• Km Adicional: 0,013 UF
• Costo adicional del Laboratorista por hora: 1,7 UF - (Se considera una permanencia máxima de 1 hora en obra)
• Jornada completa de Laboratorista (8 horas): 8,4 UF
• Recargos por jornadas extraordinarias (aplicables a todos los ítems cotizados):
  - 50% Adicional: Lunes a jueves desde 18:00 a 21:00 horas, viernes 17:00 a 21:00 horas.
  - 100% Adicional: Sábado, Domingo o Festivo.

(3) Adicionales relacionados a los Informes de Laboratorio:
• Copia digital adicional: 0,15 UF neto
• Anexo de Informe: 0,42 UF neto - Sin costo si la modificación es responsabilidad del Laboratorio Pampa Austral.
• Informe con firma y timbres físicos: 0,58 UF neto

(4) Requisitos adicionales: Todo requerimiento especial como certificaciones, acreditaciones de personal, normativas, reglamentos o exigencias de seguridad y medioambiente, debe informarse previamente para su evaluación y nueva cotización si corresponde.`
  }
}

const EditCard = ({ id }: { id: string }) => {
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
  const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([])
  const [familias, setFamilias] = useState<Array<{ id: number; nombre: string; areaId: number }>>([])
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null)
  const [tipos, setTipos] = useState<string[]>([])
  const [showOnlyPaquetes, setShowOnlyPaquetes] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [filteredProductos, setFilteredProductos] = useState<ProductoType[]>([])
  const [listasPrecios, setListasPrecios] = useState<Array<{ id: number; nombre: string }>>([])

  // 1. Estado sinCantidad
  const [sinCantidad, setSinCantidad] = useState(false)



  // Estado para la fila activa y referencias para inputs (para abrir el popover en la fila nueva)
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const servicioAnchorRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Agregar nuevo estado para controlar el reseteo
  const [filterResetKey, setFilterResetKey] = useState(0);

  // Estado para recordar el último valor de notas generado automáticamente
  const [lastAutoNotas, setLastAutoNotas] = useState(getNotasDefault(formData?.tipoCotizacion || 'A'))

  // Estado para saber si el usuario modificó manualmente el totalNetoGeneral
  const [totalNetoManual, setTotalNetoManual] = useState(false)

  // Función para calcular totales
  const calcularTotales = useCallback(() => {
    if (!formData) return

    // Para tipos B, C o D con precioTotal = true y sinCantidad = false, 
    // mantener el subtotal del backend y no recalcularlo
    const debeManternerSubtotal =
      ['B', 'C', 'D'].includes(formData.tipoCotizacion) &&
      formData.precioProducto === false &&
      formData.precioTotal === true &&
      formData.sinCantidad === false

    // Para tipos B, C o D con sinCantidad = true y precioTotal = true,
    // también mantener el subtotal del backend (no recalcular)
    const debeManternerSubtotalSinCantidad =
      ['B', 'C', 'D'].includes(formData.tipoCotizacion) &&
      formData.precioProducto === false &&
      formData.precioTotal === true &&
      formData.sinCantidad === true

    let subtotalTotal
    if (debeManternerSubtotal || debeManternerSubtotalSinCantidad) {
      // Mantener el subtotal actual del formData (que viene del backend)
      subtotalTotal = Number(formData.subtotal || 0)
    } else {
      // Calcular el subtotal sumando los totales netos de las filas
      // Esto incluye el caso de sinCantidad: true, precioProducto: true, precioTotal: false
      // donde SÍ queremos recalcular cuando el usuario cambia cantidades/precios
      // Excluir subproductos del cálculo
      subtotalTotal = productRows.reduce((acc, row) => {
        if (row.esSubProducto) {
          return acc // No sumar subproductos al subtotal
        }
        return acc + (Number(row.totalNetoUF) || 0)
      }, 0)
    }



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
        subtotal: Number(subtotalTotal.toFixed(3)),
        descuento: Number(descuentoTotal.toFixed(3)),
        impuesto: Number(impuesto.toFixed(3)),
        total: Number(total.toFixed(3))
      }))
    }
  }, [productRows, formData])

  // Modificar el useEffect de carga de productos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Cargar la cotización
        const cotizacionResponse = await fetch(`/api/cotizaciones/${id}`)
        if (!cotizacionResponse.ok) throw new Error('Error al cargar la cotización')
        const cotizacionData = await cotizacionResponse.json()

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

        // Obtener tipos únicos
        const uniqueTipos = Array.from(new Set(productosFormateados.map((p: ProductoType) => p.tipo)))
          .filter(tipo => tipo && tipo !== 'Sin tipo')
          .sort()

        // Convertir detalles a formato de filas de productos
        const detallesFormateados = cotizacionData.detalles.map((detalle: any) => {
          // Si este detalle tiene paqueteId, buscar el productoId del paquete padre
          let paqueteIdCorregido = null
          if (detalle.paqueteId) {
            const paquetePadre = cotizacionData.detalles.find((d: any) => d.id === detalle.paqueteId)
            if (paquetePadre) {
              paqueteIdCorregido = paquetePadre.productoId
            }
          }

          return {
            id: detalle.id,
            productoId: detalle.productoId.toString(),
            cantidad: detalle.cantidad,
            precioUnitarioUF: detalle.precioUnitario,
            totalNetoUF: detalle.subtotal,
            area: detalle.producto?.area || '',
            descripcion: detalle.descripcionPersonalizada || detalle.producto?.descripcion || '',
            servicio: detalle.producto?.norma
              ? `${detalle.producto?.nombre} - ${detalle.producto?.norma}`
              : detalle.producto?.nombre,
            esPaquete: detalle.esPaquete || false,
            esSubProducto: detalle.esSubProducto || false,
            paqueteId: paqueteIdCorregido,
            subproductos: []
          }
        })

        // Usar el valor sinCantidad del backend si está disponible, sino calcular basado en cantidades
        if (cotizacionData.sinCantidad !== undefined && cotizacionData.sinCantidad !== null) {
          setSinCantidad(cotizacionData.sinCantidad)
        } else {
          // Fallback: verificar si todos los productos tienen cantidad cero
          const todasCero = detallesFormateados.every((detalle: ProductRow) => Number(detalle.cantidad) === 0)
          setSinCantidad(todasCero)
        }



        // Lógica específica para tipos B, C o D con precioTotal = true y sinCantidad = false
        // El campo "Total Neto" debe inicializarse con el valor del subtotal del backend
        if (
          ['B', 'C', 'D'].includes(cotizacionData.tipoCotizacion) &&
          cotizacionData.precioProducto === false &&
          cotizacionData.precioTotal === true &&
          cotizacionData.sinCantidad === false
        ) {
          // Para estos casos, el subtotal del backend ya contiene el valor correcto para "Total Neto"
          // No necesitamos modificarlo, solo asegurar que se mantenga
          console.log('Aplicando lógica de Total Neto para tipo', cotizacionData.tipoCotizacion, 'con subtotal:', cotizacionData.subtotal)
        }

        // Mapear los datos para asegurar la estructura correcta y mostrar el label del cargo
        const contactosMapeados = contactosData.map((contacto: any) => ({
          contactId: contacto.contactId,
          nombre: contacto.nombre,
          cargo: ROLES_CONTACTO.find(c => c.value === contacto.cargo)?.label || contacto.cargo || '',
          email: contacto.email,
          telefono1: contacto.telefono1,
          empresa: contacto.empresa || 'Sin empresa'
        }))
        setContactos(contactosMapeados)
        console.log('Contactos mapeados:', contactosMapeados)

        // Si existe contacto en la cotización, transformar el cargo a label
        if (cotizacionData.contacto) {
          const cargoLabel = ROLES_CONTACTO.find(c => c.value === cotizacionData.contacto.cargo)?.label || cotizacionData.contacto.cargo
          cotizacionData.contacto.cargo = cargoLabel
          cotizacionData.contacto.empresa = cotizacionData.contacto.empresa || 'Sin empresa'
        }
        // Convertir subtotal, descuento, impuesto y total a número si vienen como string
        cotizacionData.subtotal = Number(cotizacionData.subtotal || 0)
        cotizacionData.descuento = Number(cotizacionData.descuento || 0)
        cotizacionData.impuesto = Number(cotizacionData.impuesto || 0)
        cotizacionData.total = Number(cotizacionData.total || 0)
        // Si es tipo D y no viene totalNetoGeneral, inicializarlo con el subtotal
        if (cotizacionData.tipoCotizacion === 'D' && (cotizacionData.totalNetoGeneral === undefined || cotizacionData.totalNetoGeneral === null)) {
          cotizacionData.totalNetoGeneral = cotizacionData.subtotal
        }
        setFormData(cotizacionData)

        // Actualizar estados
        setProductRows(detallesFormateados)
        setProductos(productosFormateados)
        setFilteredProductos(productosFormateados)
        setListasPrecios(listasPreciosData)
        setTipos(uniqueTipos as string[])

        if (cotizacionData && !cotizacionData.notas && cotizacionData.tipoCotizacion === 'B') {
          cotizacionData.notas = getNotasDefault('B')
        }

        setLoading(false)
      } catch (error) {
        console.error('Error al cargar datos:', error)
        setError('Error al cargar los datos')
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Agregar useEffect para cargar áreas
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

  // Manejadores de eventos para filtros
  const handleAreaChange = (e: SelectChangeEvent<string>) => {
    const areaId = e.target.value ? Number(e.target.value) : null;
    setSelectedAreaId(areaId);
    setSelectedArea(areaId ? areas.find(a => a.id === areaId)?.nombre || '' : '');
    setSelectedFamilia('');
    setProductsPage(0);
    filterProducts(searchTerm, areaId ? areas.find(a => a.id === areaId)?.nombre || '' : '', selectedTipo, '');
  };

  const handleTipoChange = (e: SelectChangeEvent<string>) => {
    setSelectedTipo(e.target.value);
    setProductsPage(0);
    filterProducts(searchTerm, selectedArea, e.target.value, selectedFamilia);
  };

  const handleFamiliaChange = (e: SelectChangeEvent<string>) => {
    setSelectedFamilia(e.target.value);
    setProductsPage(0);
    filterProducts(searchTerm, selectedArea, selectedTipo, e.target.value);
  };

  const handleShowOnlyPaquetesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowOnlyPaquetes(event.target.checked)
    setProductsPage(0) // Resetear a la primera página
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedArea('')
    setSelectedAreaId(null)
    setSelectedTipo('')
    setSelectedFamilia('')
    setShowOnlyPaquetes(false)
    setProductsPage(0)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSearchTerm(event.target.value)
    setProductsPage(0) // Resetear a la primera página
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }

  // Efecto para recalcular totales
  useEffect(() => {
    if (formData && productRows.length > 0) {
      calcularTotales()
    }
  }, [productRows]) // Solo depender de productRows, no de calcularTotales ni formData

  // Este useEffect ya no es necesario porque sinCantidad se inicializa correctamente en fetchData

  // 4. Cuando sinCantidad cambie, actualizar cantidades y recalcular totales
  // Nota: Para tipo A, cuando sinCantidad es true, solo deshabilitamos los campos, no ponemos valores a cero
  useEffect(() => {
    setProductRows(prevRows =>
      prevRows.map(row => {
        // Para tipo A: mantener valores originales cuando sinCantidad es true, solo deshabilitar en UI
        if (formData?.tipoCotizacion === 'A') {
          return {
            ...row,
            // Mantener los valores originales cuando sinCantidad es true, solo deshabilitar en UI
            cantidad: sinCantidad ? row.cantidad : (row.cantidad || 1),
            totalNetoUF: sinCantidad ? row.totalNetoUF : Number(row.precioUnitarioUF || 0) * Number(row.cantidad || 1)
          }
        }

        // Para tipos B, C, D: comportamiento específico según configuración
        const debeCalcularConPrecio =
          sinCantidad &&
          formData?.precioProducto === true &&
          formData?.precioTotal === false;

        return {
          ...row,
          cantidad: sinCantidad ? 0 : (row.cantidad === 0 ? 1 : row.cantidad),
          totalNetoUF: debeCalcularConPrecio
            ? Number(row.precioUnitarioUF || 0) // Usar precio unitario directamente
            : sinCantidad
              ? 0
              : Number(row.precioUnitarioUF || 0) * (row.cantidad === 0 ? 1 : row.cantidad)
        }
      })
    )
    // Recalcular totales
    if (formData) calcularTotales()
  }, [sinCantidad, formData?.precioProducto, formData?.precioTotal, formData?.tipoCotizacion])

  // Función para manejar cambios en los productos
  const handleSelectProduct = async (producto: ProductoType) => {
    if (activeRowIndex === null) return;

    const newRows = [...productRows];
    // Obtener el precio de la lista de precios seleccionada si existe
    let precioFinal = producto.precio || 0;
    if (formData?.listaPrecioId && producto.listasPrecios) {
      const listaPrecio = producto.listasPrecios.find(
        (lp: { listaPrecioId: number; precio: number }) => lp.listaPrecioId === formData.listaPrecioId
      );
      if (listaPrecio) {
        precioFinal = listaPrecio.precio;
      }
    }

    // Armar el nombre del servicio: nombre - norma (si existe)
    const nombreServicio = producto.norma ? `${producto.nombre} - ${producto.norma}` : producto.nombre || '';

    if (producto.esPaquete) {
      let productosEnPaquete = producto.productosEnPaquete;

      // Si no vienen los productos, los pedimos al backend
      if (!productosEnPaquete || productosEnPaquete.length === 0) {
        try {
          const response = await fetch(`/api/productos/${producto.productoId}/productos`);
          const data = await response.json();
          productosEnPaquete = data.productos || [];
        } catch (error) {
          console.error('Error al obtener productos del paquete:', error);
          productosEnPaquete = [];
        }
      }

      // Actualizar la fila actual con el paquete
      newRows[activeRowIndex] = {
        ...newRows[activeRowIndex],
        productoId: producto.productoId.toString(),
        servicio: nombreServicio,
        descripcion: producto.descripcion || '',
        cantidad: 1,
        precioUnitarioUF: precioFinal,
        totalNetoUF: precioFinal,
        area: producto.area || '',
        esPaquete: true,
        subproductos: []
      };

      // Agregar los productos del paquete como subfilas
      const productosRows = (productosEnPaquete || []).map((pp: any) => {
        // Armar nombre del subproducto: nombre - norma (si existe)
        const nombreSubServicio = pp.producto?.norma
          ? `${pp.producto?.nombre} - ${pp.producto?.norma}`
          : pp.producto?.nombre || '';
        return {
          id: Date.now() + Math.random(),
          productoId: pp.producto?.productoId?.toString() || '',
          servicio: nombreSubServicio,
          descripcion: pp.producto?.descripcion || '',
          cantidad: pp.cantidad || 1,
          precioUnitarioUF: 0, // Precio unitario siempre 0 para subproductos
          totalNetoUF: 0, // Total neto siempre 0 para subproductos
          area: pp.producto?.area || '',
          esSubProducto: true,
          paqueteId: producto.productoId,
          subproductos: []
        };
      });

      // Insertar los subproductos después del paquete
      newRows.splice(activeRowIndex + 1, 0, ...productosRows);
    } else {
      // Actualizar la fila actual con el producto seleccionado
      const isSubProducto = newRows[activeRowIndex].esSubProducto;
      const precioUnitario = isSubProducto ? 0 : precioFinal;
      const totalNeto = isSubProducto ? 0 : precioFinal;

      newRows[activeRowIndex] = {
        ...newRows[activeRowIndex],
        productoId: producto.productoId.toString(),
        servicio: nombreServicio,
        descripcion: producto.descripcion || '',
        cantidad: 1,
        precioUnitarioUF: precioUnitario,
        totalNetoUF: totalNeto,
        area: producto.area || '',
        esSubProducto: newRows[activeRowIndex].esSubProducto // Mantener el estado de subproducto
      };
    }

    setProductRows(newRows);
    setActiveRowIndex(null);
    handleClosePopover();
  };

  const handleContactChange = (newValue: ContactoType | null) => {
    if (newValue) {
      setFormData(prev => {
        if (!prev) return null

        return {
          ...prev,
          contacto: newValue,
          contactoId: newValue.contactId
        }
      })
    } else {
      setFormData(prev => {
        if (!prev) return null

        return {
          ...prev,
          contacto: undefined,
          contactoId: undefined
        }
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

        // Para el caso de sinCantidad: true, precioProducto: true, precioTotal: false
        // usar el precio directamente como totalNetoUF
        const debeCalcularConPrecio =
          sinCantidad &&
          formData?.precioProducto === true &&
          formData?.precioTotal === false;

        row.totalNetoUF = debeCalcularConPrecio
          ? precio  // Usar precio directamente cuando sinCantidad es true pero se permite modificar precios
          : (row.cantidad || 1) * precio
      }

      return newRows
    })
  }

  const handleDescripcionChange = (index: number, descripcion: string) => {
    setProductRows(prevRows => {
      const newRows = [...prevRows]
      const row = newRows[index]

      if (row) {
        row.descripcion = descripcion
      }

      return newRows
    })
  }

  const handleDeleteRow = (index: number) => {
    console.log('handleDeleteRow', { index, row: productRows[index] })
    const newRows = [...productRows]
    const rowToDelete = newRows[index]

    if (rowToDelete.esPaquete) {
      // Si es un paquete, eliminar el paquete y todos sus subproductos
      let nextIndex = index + 1
      while (nextIndex < newRows.length && newRows[nextIndex].esSubProducto) {
        nextIndex++
      }
      newRows.splice(index, nextIndex - index)
      console.log('Paquete y subproductos eliminados', newRows)
    } else {
      // Si es un producto normal o subproducto, solo eliminar esta fila
      newRows.splice(index, 1)
      console.log('Producto/subproducto eliminado', newRows)
    }
    setProductRows(newRows)
  }

  // Funciones para el manejo del popover
  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    // Resetear todos los estados
    setSearchTerm('');
    setSelectedArea('');
    setSelectedAreaId(null);
    setSelectedTipo('');
    setSelectedFamilia('');
    setShowOnlyPaquetes(false);
    setProductsPage(0);

    // Forzar el reseteo de los filtros
    filterProducts('', '', '', '');

    // Abrir el popover
    setAnchorEl(event.currentTarget);
    setLoadingProductos(true);
    setLoadingProductos(false);
  };

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

  // Función para resetear los filtros del popover de productos
  const resetProductFilters = () => {
    setSearchTerm('');
    setSelectedArea('');
    setSelectedAreaId(null);
    setSelectedTipo('');
    setSelectedFamilia('');
    setShowOnlyPaquetes(false);
    setProductsPage(0);
    filterProducts('', '', '', '');
  };

  // Función para guardar cambios
  const handleSave = async () => {
    try {
      if (!formData) return

      console.log('FormData antes de guardar:', formData)
      console.log('Contacto actual:', formData.contacto)
      console.log('ContactoId actual:', formData.contactoId)

      const detallesValidos = productRows.map(row => ({
        productoId: parseInt(row.productoId),
        cantidad: row.cantidad,
        precioUnitario: row.precioUnitarioUF === null || row.precioUnitarioUF === undefined ? 0 : Number(row.precioUnitarioUF),
        descuento: row.descuento || 0,
        subtotal: row.totalNetoUF === null || row.totalNetoUF === undefined ? 0 : Number(row.totalNetoUF),
        esPaquete: row.esPaquete || false,
        esSubProducto: row.esSubProducto || false,
        paqueteId: row.paqueteId || null,
        descripcionPersonalizada: row.descripcion || null
      }))

      // Asegurarnos de que el contactoId sea el del contacto seleccionado
      const contactoId = formData.contacto ? formData.contacto.contactId : null
      console.log('ContactoId que se enviará:', contactoId)

      const dataToSend = {
        ...formData,
        version: formData.version || '00',
        detalles: detallesValidos,
        listaPrecioId: formData.listaPrecioId ? Number(formData.listaPrecioId) : null,
        contactoId: contactoId,
        // Asegurarnos de incluir los campos EMS solo si el tipo es B
        ...(formData.tipoCotizacion === 'B' && {
          superficieEMS: formData.superficieEMS || '',
          antecedentesEMS: formData.antecedentesEMS || '',
          plazoEntregaEMS: formData.plazoEntregaEMS || ''
        }),
        // Asegurarnos de incluir los campos mensuales solo si el tipo es C
        ...(formData.tipoCotizacion === 'C' && {
          duracionMensual: formData.duracionMensual || '',
          jornadaMensual: formData.jornadaMensual || '',
          antecedentesMensual: formData.antecedentesMensual || '',
          alcanceServicio: formData.alcanceServicio || ''
        }),
        // Si es tipo D, enviar textoGeneral y usar el subtotal directamente
        ...(formData.tipoCotizacion === 'D' && {
          textoGeneral: formData.textoGeneral || '',
          antecedentesGeneral: formData.antecedentesGeneral || '',
          plazoEntregaGeneral: formData.plazoEntregaGeneral || '',
          descuento: 0
        })
      }

      // Eliminar el objeto contacto del payload ya que solo necesitamos el ID
      delete dataToSend.contacto

      console.log('DATA QUE SE ENVÍA AL PUT:', dataToSend)

      const response = await fetch(`/api/cotizaciones/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar la cotización')
      }

      toast.success('Cotización actualizada exitosamente')
      router.push('/es/apps/invoice/list')
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error('Error al actualizar la cotización')
    }
  }

  // Función para manejar la vista previa
  const handlePreview = () => {
    if (!formData) return;

    const detallesPlanos = productRows.map(row => ({
      productoId: parseInt(row.productoId),
      servicio: row.servicio || '',
      area: row.area || '',
      descripcion: row.descripcion || '',
      cantidad: row.cantidad,
      precioUnitarioUF: row.precioUnitarioUF,
      totalNetoUF: row.totalNetoUF,
      esPaquete: row.esPaquete || false,
      esSubProducto: row.esSubProducto || false,
      paqueteId: row.paqueteId || null
    }));

    const previewData = {
      ...formData,
      detalles: detallesPlanos,
      // Usar los valores booleanos unificados
      sinCantidad: sinCantidad,
      subtotal: Number(formData.subtotal || 0),
      descuento: Number(formData.descuento || 0),
      impuesto: Number(formData.impuesto || 0),
      total: Number(formData.total || 0),
      alcanceServicio: formData.alcanceServicio || ''
    };

    localStorage.setItem('cotizacionPreview', JSON.stringify(previewData));
    window.open('/es/apps/invoice/preview', '_blank');
  };

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

  // Agregar funciones para mover filas arriba y abajo
  const handleMoveUp = (index: number) => {
    console.log('handleMoveUp', { index, row: productRows[index] })
    if (index === 0) return
    const newRows = [...productRows]
    const currentRow = newRows[index]

    // Si es un subproducto, solo permitir moverlo dentro de su paquete
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

    // Si es un paquete, mover todo el bloque (paquete + subproductos)
    if (currentRow.esPaquete) {
      // Encontrar el final del paquete (último subproducto)
      let lastSubproductIndex = index + 1
      while (lastSubproductIndex < newRows.length && newRows[lastSubproductIndex].esSubProducto) {
        lastSubproductIndex++
      }
      lastSubproductIndex--; // Ajustar al último subproducto real

      // Calcular cuántos elementos hay en el paquete (incluyendo el paquete mismo)
      const packageSize = lastSubproductIndex - index + 1

      // Si no hay elementos arriba para intercambiar, salir
      if (index - 1 < 0) return;

      // Extraer el paquete completo (paquete + todos sus subproductos)
      const packageItems = newRows.splice(index, packageSize);

      // Caso especial: si el elemento anterior es parte de otro paquete
      if (index > 0 && (newRows[index - 1].esPaquete || newRows[index - 1].esSubProducto)) {
        // Encontrar el inicio del paquete anterior
        let prevPackageStartIndex = index - 1;
        while (prevPackageStartIndex > 0 && !newRows[prevPackageStartIndex].esPaquete) {
          prevPackageStartIndex--;
        }

        // Insertar antes del paquete anterior
        newRows.splice(prevPackageStartIndex, 0, ...packageItems);
      } else {
        // Insertar antes de la posición anterior (caso normal)
        newRows.splice(index - 1, 0, ...packageItems);
      }

      setProductRows(newRows)
      console.log('Paquete completo movido arriba', newRows)
      return
    }

    // Caso especial: el producto está precedido por un paquete
    if (index > 0 && newRows[index - 1].esSubProducto) {
      // Encontrar el inicio del paquete
      let packageStartIndex = index - 1
      while (packageStartIndex >= 0 && !newRows[packageStartIndex].esPaquete) {
        packageStartIndex--
      }

      // Guardar el producto actual
      const productoActual = newRows[index];

      // Eliminar el producto de su posición actual
      newRows.splice(index, 1);

      // Insertar el producto antes del paquete
      newRows.splice(packageStartIndex, 0, productoActual);

      setProductRows(newRows);
      console.log('Producto movido antes del paquete', newRows);
      return;
    }

    // Caso normal: intercambiar directamente con el elemento anterior
    [newRows[index], newRows[index - 1]] = [newRows[index - 1], newRows[index]];
    setProductRows(newRows);
    console.log('Producto movido arriba', newRows);
  }

  const handleMoveDown = (index: number) => {
    console.log('handleMoveDown', { index, row: productRows[index] })
    if (index === productRows.length - 1) return

    const newRows = [...productRows]
    const currentRow = newRows[index]

    // Si es un subproducto, solo permitir moverlo dentro de su paquete
    if (currentRow.esSubProducto) {
      // Verificar que el siguiente elemento también sea un subproducto del mismo paquete
      if (index + 1 < newRows.length && newRows[index + 1].esSubProducto) {
        [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]]
        setProductRows(newRows)
        console.log('Subproducto movido abajo dentro del paquete', newRows)
      }
      return
    }

    // Si es un paquete, mover todo el bloque (paquete + subproductos)
    if (currentRow.esPaquete) {
      // Encontrar el final del paquete (último subproducto)
      let lastSubproductIndex = index + 1
      while (lastSubproductIndex < newRows.length && newRows[lastSubproductIndex].esSubProducto) {
        lastSubproductIndex++
      }
      lastSubproductIndex--; // Ajustar al último subproducto real

      // Si no hay elementos abajo para intercambiar, salir
      if (lastSubproductIndex + 1 >= newRows.length) return;

      // Extraer el paquete completo (paquete + todos sus subproductos)
      const packageSize = lastSubproductIndex - index + 1;
      const packageItems = newRows.splice(index, packageSize);

      // Si el siguiente elemento es otro paquete, manejar especialmente
      if (index < newRows.length && newRows[index].esPaquete) {
        // Encontrar el final del siguiente paquete
        let nextPackageLastIndex = index;
        while (nextPackageLastIndex + 1 < newRows.length && newRows[nextPackageLastIndex + 1].esSubProducto) {
          nextPackageLastIndex++;
        }

        // Insertar después del siguiente paquete completo
        newRows.splice(nextPackageLastIndex + 1, 0, ...packageItems);
      } else {
        // Insertar después del siguiente elemento (intercambio simple)
        newRows.splice(index + 1, 0, ...packageItems);
      }

      setProductRows(newRows)
      console.log('Paquete completo movido abajo', newRows)
      return
    }

    // Caso especial: el producto está seguido inmediatamente por un paquete
    if (index + 1 < newRows.length && newRows[index + 1].esPaquete) {
      // Encontrar el fin del paquete
      let paqueteEndIndex = index + 1;
      while (paqueteEndIndex + 1 < newRows.length && newRows[paqueteEndIndex + 1].esSubProducto) {
        paqueteEndIndex++;
      }

      // Guardar el producto actual
      const productoActual = newRows[index];

      // Eliminar el producto de su posición actual
      newRows.splice(index, 1);

      // Insertar el producto después del paquete
      newRows.splice(paqueteEndIndex, 0, productoActual);

      setProductRows(newRows);
      console.log('Producto movido después del paquete', newRows);
      return;
    }

    // Caso normal: intercambiar directamente con el siguiente elemento
    [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
    setProductRows(newRows);
    console.log('Producto movido abajo', newRows);
  };

  // useEffect para actualizar notas si cambia tipoCotizacion y el usuario no ha editado manualmente
  useEffect(() => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, notas: getNotasDefault(formData.tipoCotizacion) || '' } : prev)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.tipoCotizacion])

  // Al cambiar el tipo a D, no necesitamos prellenar nada, solo usar el subtotal directamente

  // Al cargar la cotización o cambiar a tipo C, si el campo está vacío, poner el valor por defecto
  useEffect(() => {
    if (formData?.tipoCotizacion === 'C' && !formData.alcanceServicio) {
      setFormData(prev => prev ? { ...prev, alcanceServicio: `General:\n\n• xx Laboratoristas clase C en obra.\n• xx Ayudante en obra. Considera alimentación para nuestros técnicos en Obra.\n• Oficina móvil en obra (2 container: oficina y para instalación de equipamiento).\n• Camioneta estándar minero y combustible.\n• Equipamiento completo para ensayos de suelo y hormigón.\n• Envío digital de Órdenes de Trabajo y emisión de Informes Oficiales digitales con firma electrónica bajo sistema de acreditación MINVU-INN (LES40, LES41, LES42 y LES44).\n• Trazabilidad digital y almacenamiento de datos, respaldados por protocolos de calidad y seguridad.\n\nImplementación Laboratorio en Obra:\n• Área Hormigón: prensa prensa ensayo a compresión, probetas cilíndricas, cono de Abrams, piscina portátil con calefactor, vibrador portátil, termómetros.\n• Área Suelo: tamices de 3" a N°200, balanzas (0,1 gr y 1 kg), palas, densímetro nuclear, moldes y pisones Proctor y CBR, horno eléctrico, colinela, lavador de muestras, enrasador, pipetas de 1.000 ml y 250 ml, prensa CBR, piscina portátil para molde de CBR.\n\nCondiciones requeridas por el cliente:\n• Autorizaciones y acreditaciones del personal.\n• Accesos expeditos y seguros, además de protección contra riesgos laborales, actos vandálicos u otros hechos adversos.\n• Provisión de energía eléctrica, iluminación, agua y servicios higiénicos para oficina móvil en obra.\n• Prevencionista de Riesgo.\n• Se considerará Bunker para densímetro nuclear en Casa Matriz, de ser solicitado por el mandante se cotiza construcción y autorización de bunker previa solicitud.\n• Comunicar programación semanal de actividades de laboratorio, de tal manera de asignar al personal de terreno tareas adicionales si correspondiera.` } : prev)
    }
  }, [formData?.tipoCotizacion])

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
                    <div className='flex items-center gap-2'>
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
                      <Typography>-</Typography>
                      <TextField
                        name='version'
                        size='small'
                        value={formData.version || '00'}
                        onChange={e => setFormData({ ...formData, version: e.target.value })}
                        inputProps={{
                          maxLength: 2,
                          pattern: '[0-9]*'
                        }}
                        sx={{ width: '60px' }}
                      />
                    </div>
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
                  const searchableText = `${option.nombre} ${option.cargo} ${option.email} ${option.telefono1} ${option.empresa || ''}`.toLowerCase()
                  return searchTerms.every(term => searchableText.includes(term))
                })
              }}
              onChange={(_, newValue) => {
                if (newValue) {
                  console.log('Nuevo valor recibido:', newValue)
                  const contactoData = {
                    contactId: Number(newValue.contactId),
                    nombre: newValue.nombre,
                    cargo: newValue.cargo || 'Sin cargo',
                    email: newValue.email || '',
                    telefono1: newValue.telefono1 || '',
                    empresa: newValue.empresa || 'Sin empresa'
                  }
                  console.log('Nuevo contacto seleccionado:', contactoData)
                  setFormData(prev => {
                    const newData = prev ? { ...prev, contacto: contactoData, contactoId: contactoData.contactId } : prev
                    console.log('Nuevo formData después de actualizar contacto:', newData)
                    return newData
                  })
                } else {
                  setFormData(prev => {
                    const newData = prev ? { ...prev, contacto: undefined, contactoId: undefined } : prev
                    console.log('FormData después de limpiar contacto:', newData)
                    return newData
                  })
                }
              }}
              isOptionEqualToValue={(option, value) => option.contactId === value?.contactId}
              value={formData.contacto || null}
            />
            {/* Detalles del contacto seleccionado */}
            {formData.contacto && (
              <Box sx={{ mt: 2, position: 'relative' }}>
                <IconButton
                  size='small'
                  onClick={() => setFormData(prev => prev ? { ...prev, contacto: undefined, contactoId: undefined } : prev)}
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
                  <Typography sx={{ fontWeight: 500 }}>
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
                    <MenuItem value='D'>Genérica</MenuItem>
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

          {/* Campos Mensuales cuando el tipo es C */}
          {formData.tipoCotizacion === 'C' && (
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Información Mensual
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Duración Mensual'
                    multiline
                    rows={4}
                    value={formData.duracionMensual || ''}
                    onChange={e => setFormData({ ...formData, duracionMensual: e.target.value })}
                    placeholder='Ingrese la duración mensual...'
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Jornada Mensual'
                    multiline
                    rows={4}
                    value={formData.jornadaMensual || ''}
                    onChange={e => setFormData({ ...formData, jornadaMensual: e.target.value })}
                    placeholder='Ingrese la jornada mensual...'
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label='Antecedentes Mensual'
                    multiline
                    rows={4}
                    value={formData.antecedentesMensual || ''}
                    onChange={e => setFormData({ ...formData, antecedentesMensual: e.target.value })}
                    placeholder='Ingrese los antecedentes mensuales...'
                  />
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Alcance del servicio */}
          {formData.tipoCotizacion === 'C' && (
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Alcance del servicio
              </Typography>
              <TextField
                fullWidth
                label='Alcance del servicio'
                multiline
                rows={10}
                value={formData.alcanceServicio || ''}
                onChange={e => setFormData({ ...formData, alcanceServicio: e.target.value })}
                placeholder='Describa el alcance del servicio...'
              />
            </Grid>
          )}

          {/* Detalles de Servicios */}
          {formData?.tipoCotizacion === 'D' ? (
            <>
              <Grid item xs={12} sx={{ mt: 8 }}>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 500,
                    color: 'text.secondary',
                    textTransform: 'none',
                    borderBottom: '1px solid',
                    borderColor: 'primary.main',
                    pb: 1,
                    mb: 2
                  }}
                >
                  Información de la Cotización:
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Antecedentes'
                  value={formData.antecedentesGeneral || ''}
                  onChange={e => setFormData(prev => prev ? { ...prev, antecedentesGeneral: e.target.value } : prev)}
                  placeholder='Ingrese los antecedentes...'
                  inputProps={{ maxLength: 500 }}
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Plazo de Entrega'
                  value={formData.plazoEntregaGeneral || ''}
                  onChange={e => setFormData(prev => prev ? { ...prev, plazoEntregaGeneral: e.target.value } : prev)}
                  placeholder='Ingrese el plazo de entrega...'
                  inputProps={{ maxLength: 500 }}
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label='Texto General'
                  value={formData.textoGeneral || ''}
                  onChange={e => setFormData(prev => prev ? { ...prev, textoGeneral: e.target.value } : prev)}
                  placeholder='Ingrese el texto general de la cotización'
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'background.paper'
                    }
                  }}
                />
              </Grid>
              <Grid container justifyContent='flex-end'>
                <Grid item xs={12} md={2} sx={{ mt: 4, textAlign: 'right' }}>
                  <TextField
                    fullWidth
                    type='number'
                    label='Total Neto (UF)'
                    value={formData.subtotal ?? ''}
                    onChange={e => {
                      const value = Number(e.target.value)
                      const impuesto = value * 0.19
                      const total = value + impuesto
                      setFormData(prev => prev ? {
                        ...prev,
                        subtotal: isNaN(value) ? 0 : value,
                        impuesto: impuesto,
                        total: total
                      } : prev)
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position='start'>UF</InputAdornment>
                    }}
                    sx={{ textAlign: 'right' }}
                  />
                  {/* Mostrar IVA y Total con IVA */}
                  <Box sx={{ mt: 2, textAlign: 'right' }}>
                    <Typography>
                      <strong>IVA (19%):</strong> UF {formatUF((formData.subtotal || 0) * 0.19)}
                    </Typography>
                    <Typography variant='h6'>
                      <strong>Total con IVA:</strong> UF {formatUF((formData.subtotal || 0) * 1.19)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant='h6'>Detalle de Servicios</Typography>
                  <FormControlLabel
                    control={<Switch checked={sinCantidad} onChange={e => {
                      setSinCantidad(e.target.checked)
                      setFormData(prev => prev ? { ...prev, sinCantidad: e.target.checked } : prev)
                    }} size='small' />}
                    label='Sin cantidad'
                  />
                </Box>

                {/* Selectores de precio por producto y precio total para tipos B y C */}
                {(formData?.tipoCotizacion === 'B' || formData?.tipoCotizacion === 'C') && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <FormControl>
                      <RadioGroup
                        row
                        value={formData.precioProducto}
                        onChange={e => {
                          const porProducto = e.target.value === 'true'
                          setFormData(prev => prev ? {
                            ...prev,
                            precioProducto: porProducto,
                            precioTotal: !porProducto
                          } : prev)
                        }}
                      >
                        <FormControlLabel value={true} control={<Radio size='small' />} label='Precio por producto' />
                        <FormControlLabel value={false} control={<Radio size='small' />} label='Precio total' />
                      </RadioGroup>
                    </FormControl>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
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
                      ...(row.esSubProducto && {
                        ml: 4,
                        width: 'calc(100% - 32px)'
                      })
                    }}
                  >
                    <Grid item xs={12} md={3}>
                      <div ref={el => { servicioAnchorRefs.current[index] = el; }} style={{ width: '100%' }}>
                        <TextField
                          fullWidth
                          label='Servicio'
                          value={row.servicio || ''}
                          onClick={() => {
                            resetProductFilters();
                            setActiveRowIndex(index);
                            setAnchorEl(servicioAnchorRefs.current[index]);
                          }}
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12} md={1}>
                      <TextField fullWidth label='Área' value={row.area || ''} disabled />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label='Descripción'
                        value={row.descripcion || ''}
                        onChange={e => handleDescripcionChange(index, e.target.value)}
                        multiline
                        maxRows={4}
                      />
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
                          startAdornment: <InputAdornment position='start'>UF</InputAdornment>,
                          readOnly:
                            row.esSubProducto === true ||
                            !formData?.precioProducto
                        }}
                        disabled={
                          row.esSubProducto === true ||
                          !formData?.precioProducto
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField
                        fullWidth
                        label='Total Neto UF'
                        value={Number(row.totalNetoUF || 0).toFixed(2)}
                        InputProps={{
                          startAdornment: <InputAdornment position='start'>UF</InputAdornment>,
                          readOnly: true
                        }}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={1} sx={{ display: 'flex', gap: 1, alignItems: 'center', pointerEvents: 'auto', zIndex: 10 }}>
                      <IconButton size="small" onClick={() => handleMoveUp(index)}>
                        <i className="ri-arrow-up-s-line" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleMoveDown(index)}>
                        <i className="ri-arrow-down-s-line" />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteRow(index)} sx={{ color: 'error.main', pointerEvents: 'auto', zIndex: 20 }}>
                        <i className='ri-delete-bin-line' />
                      </IconButton>
                      {row.esPaquete && (
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
                              resetProductFilters();
                              // Encontrar el final de los subproductos del paquete actual
                              let insertIndex = index + 1;
                              while (insertIndex < productRows.length && productRows[insertIndex].esSubProducto) {
                                insertIndex++;
                              }

                              // Agregar una fila vacía como subproducto al final del paquete
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
                                paqueteId: parseInt(row.productoId),
                                subproductos: []
                              };
                              const newRows = [...productRows];
                              newRows.splice(insertIndex, 0, newProductRow);
                              setProductRows(newRows);
                              setTimeout(() => {
                                setActiveRowIndex(insertIndex);
                                // Simular click en el input para abrir el popover
                                const inputElement = servicioAnchorRefs.current[insertIndex]?.querySelector('input');
                                if (inputElement) {
                                  inputElement.click();
                                }
                              }, 100);
                            }}
                          >
                            <i className='ri-add-line' style={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Grid>
                  </Grid>
                ))}
              </Grid>
              <Grid item xs={12}>
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

              {/* Bloque de totales para B, C, D y casos especiales de A */}
              {((['B', 'C', 'D'].includes(formData.tipoCotizacion) && (formData.precioTotal || formData.precioProducto)) ||
                (formData.tipoCotizacion === 'A' && formData.sinCantidad)) && (
                  <Grid item xs={12}>
                    <div className='flex justify-end'>
                      <div className='min-w-[300px]'>
                        <div className='flex justify-between mb-2'>
                          <Typography>Total Neto:</Typography>
                          {formData.tipoCotizacion === 'A' && formData.sinCantidad ? (
                            <Typography>-</Typography>
                          ) : (['B', 'C', 'D'].includes(formData.tipoCotizacion) && formData.precioProducto && !formData.precioTotal) ? (
                            // Para precio por producto (readonly)
                            <Typography>UF {formatUF(formData.subtotal)}</Typography>
                          ) : (
                            // Para precio total (editable)
                            <TextField
                              size='small'
                              type='number'
                              value={formData.subtotal || ''}
                              onChange={e => {
                                const total = parseFloat(e.target.value) || 0
                                const impuesto = total * 0.19
                                setFormData(prev => prev ? { ...prev, subtotal: total, impuesto: impuesto, total: total + impuesto } : null)
                              }}
                              InputProps={{
                                startAdornment: <InputAdornment position='start'>UF</InputAdornment>
                              }}
                              sx={{ width: '150px' }}
                            />
                          )}
                        </div>
                        <div className='flex justify-between mb-2'>
                          <Typography>Descuento:</Typography>
                          <Typography>{formData.tipoCotizacion === 'A' && formData.sinCantidad ? '-' : `UF ${formatUF(formData.descuento)}`}</Typography>
                        </div>
                        <div className='flex justify-between mb-2'>
                          <Typography>IVA (19%):</Typography>
                          <Typography>{formData.tipoCotizacion === 'A' && formData.sinCantidad ? '-' : `UF ${formatUF(formData.impuesto)}`}</Typography>
                        </div>
                        <Divider className='my-2' />
                        <div className='flex justify-between'>
                          <Typography variant='h6'>Total:</Typography>
                          <Typography variant='h6'>{formData.tipoCotizacion === 'A' && formData.sinCantidad ? '-' : `UF ${formatUF(formData.total)}`}</Typography>
                        </div>
                      </div>
                    </div>
                  </Grid>
                )}

              {/* Bloque de totales normal para tipo A con sinCantidad = false */}
              {formData.tipoCotizacion === 'A' && !formData.sinCantidad && (
                <Grid item xs={12}>
                  <div className='flex justify-end'>
                    <div className='min-w-[300px]'>
                      <div className='flex justify-between mb-2'>
                        <Typography>Total Neto:</Typography>
                        <Typography>UF {formatUF(formData.subtotal)}</Typography>
                      </div>
                      <div className='flex justify-between mb-2'>
                        <Typography>Descuento:</Typography>
                        <Typography>UF {formatUF(formData.descuento)}</Typography>
                      </div>
                      <div className='flex justify-between mb-2'>
                        <Typography>IVA (19%):</Typography>
                        <Typography>UF {formatUF(formData.impuesto)}</Typography>
                      </div>
                      <Divider className='my-2' />
                      <div className='flex justify-between'>
                        <Typography variant='h6'>Total:</Typography>
                        <Typography variant='h6'>UF {formatUF(formData.total)}</Typography>
                      </div>
                    </div>
                  </div>
                </Grid>
              )}
            </>
          )}

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
                  <Select
                    key={`area-${filterResetKey}`}
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
                    key={`tipo-${filterResetKey}`}
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
                    key={`familia-${filterResetKey}`}
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

          {/* Notas */}
          <Grid item xs={12}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Notas
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={12}
              value={formData.notas || ''}
              onChange={e => setFormData({ ...formData, notas: e.target.value })}
              placeholder={getNotasDefault(formData.tipoCotizacion)}
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

export default EditCard
