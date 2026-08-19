'use client'

// React Imports
import { useState, useMemo, useEffect, useRef } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'


// NextAuth Imports
import { useSession } from 'next-auth/react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'  // UNA SOLA IMPORTACIÓN
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import { styled } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { es } from 'date-fns/locale'

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn, SortingState } from '@tanstack/react-table'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Custom imports
import { OPERATIONAL_STATES } from '@/constants/operationalStates'
import ADMINISTRATIVE_STATES from '../../../constants/administrativeStates'
import ENSAYO_STATES from '@/constants/ensayoStates'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => setValue(initialValue), [initialValue])
  useEffect(() => {
    const timeout = setTimeout(() => onChange(value), debounce)


    return () => clearTimeout(timeout)
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Small helpers for status color mapping
const statusColor = (s?: string) => {
  if (!s) return 'default'
  const key = s.toString().toLowerCase()

  if (['codificado', 'activo', 'a', 'ok', 'firmado'].some(k => key.includes(k))) return 'success'
  if (['pendiente', 'p', 'pend'].some(k => key.includes(k))) return 'warning'
  if (['rechazado', 'cancelado', 'inactivo'].some(k => key.includes(k))) return 'error'

  return 'default'
}

// normalizar texto: quitar diacríticos, pasar a minúsculas y trim
function normalizeText(v: any) {
  if (v === null || v === undefined) return ''

  try {
    let s = String(v)

    // reemplazar entidades HTML comunes
    s = s.replace(/&amp;+/g, 'y')

    // normalizar NBSP y otros espacios raros a espacio normal
    s = s.replace(/\u00A0/g, ' ')

    // aplicar NFD para separar diacríticos y eliminarlos
    s = s.normalize?.('NFD').replace(/[\u0300-\u036f]/g, '') ?? s

    // eliminar caracteres que no sean letras/números/espacios (puntuación, símbolos)
    s = s.replace(/[^\p{L}\p{N}\s]+/gu, ' ')

    // colapsar múltiples espacios y trim
    s = s.replace(/\s+/g, ' ').trim()

    return s.toLowerCase()
  } catch (e) {
    return String(v).toLowerCase().replace(/\s+/g, ' ').trim()
  }
}

const countDetailedEnsayos = (services: any[] = []) => {
  return services.reduce((total, service) => {
    const rawChildren = Array.isArray(service?.subProductos) && service.subProductos.length > 0
      ? service.subProductos
      : Array.isArray(service?.subProductosCodificados) && service.subProductosCodificados.length > 0
        ? service.subProductosCodificados
        : Array.isArray(service?.productosEnPaquete) && service.productosEnPaquete.length > 0
          ? service.productosEnPaquete
          : (Array.isArray(service?.producto?.productosEnPaquete) ? service.producto.productosEnPaquete : [])

    const children = rawChildren

    if (children.length > 0) {
      return total + children.reduce((count: number, child: any) => {
        const type = normalizeText(child?.tipo ?? child?.producto?.tipo)

        return count + (type.includes('ensayo') ? getSkuQuantity(child) : 0)
      }, 0)
    }

    const tipo = normalizeText(service?.tipo ?? service?.producto?.tipo)

    return total + (tipo.includes('ensayo') ? getSkuQuantity(service) : 0)
  }, 0)
}

const getSkuTypeLabel = (raw?: any) => {
  const type = normalizeText(raw)

  if (type.includes('ensayo')) return 'Ensayo'
  if (type.includes('terreno')) return 'Terreno'
  if (type.includes('servicio')) return 'Servicio'

  return null
}

const getSkuQuantity = (service: any) => {
  const quantity = Number(service?.cantidad ?? 1)

  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

const normalizeSkuState = (raw?: any) => {
  const state = String(raw ?? 'CODIFICADO').toUpperCase()

  if (state.includes('ENSAYADO')) return 'ENSAYADO'
  if (state.includes('PROCESO')) return 'EN_PROCESO'

  return 'CODIFICADO'
}

const consolidateSkuServices = (services: any[] = []) => {
  const sources: any[] = []

  services.forEach(service => {
    if (service?._isPaqueteHeader) return

    const children = Array.isArray(service?.subProductosCodificados) && service.subProductosCodificados.length > 0
      ? service.subProductosCodificados
      : Array.isArray(service?.subProductos) && service.subProductos.length > 0
        ? service.subProductos
        : service?._isPaqueteSubItem
          ? []
          : []

    if (service?.esPaquete && children.length > 0) {
      children.forEach((child: any, index: number) => {
        sources.push({
          ...child,
          _source: child,
          _sourceKey: String(child?._syntheticKey ?? child?.id ?? `${service.id}-sub-${index}`),
          tipo: child?.tipo ?? child?.producto?.tipo ?? null
        })
      })

      return
    }

    if (service?._isPaqueteSubItem || !service?.esPaquete) {
      sources.push({
        ...service,
        _source: service,
        _sourceKey: String(service?._syntheticKey ?? service?.id ?? sources.length),
        tipo: service?.tipo ?? service?.producto?.tipo ?? null
      })
    }
  })

  const groups = new Map<string, any>()

  sources.forEach(source => {
    const sku = String(source?.codigo ?? source?.sku ?? source?.producto?.sku ?? '').trim()
    const type = getSkuTypeLabel(source?.tipo ?? source?.producto?.tipo)

    if (!sku || !type) return

    const existing = groups.get(sku)
    const sourceState = normalizeSkuState(source?.estado ?? source?.estadoOperativo ?? 'CODIFICADO')

    if (existing) {
      existing.entries.push(source)
      existing.cantidad += getSkuQuantity(source)
      existing.completedQuantity += sourceState === 'ENSAYADO' ? getSkuQuantity(source) : 0
      existing.nombre = existing.nombre || source?.nombre || source?.producto?.nombre || '-'
      existing.ensayadores = Array.from(new Set([...existing.ensayadores, String(source?.ensayador ?? '').trim()].filter(Boolean)))
      existing.estado = existing.completedQuantity >= existing.cantidad
        ? 'ENSAYADO'
        : existing.entries.some((entry: any) => normalizeSkuState(entry?.estado ?? entry?.estadoOperativo) === 'EN_PROCESO')
          ? 'EN_PROCESO'
          : 'CODIFICADO'

      return
    }

    groups.set(sku, {
      key: sku,
      sku,
      nombre: source?.nombre ?? source?.producto?.nombre ?? '-',
      norma: source?.norma ?? source?.producto?.norma ?? null,
      tipo: type,
      cantidad: getSkuQuantity(source),
      completedQuantity: sourceState === 'ENSAYADO' ? getSkuQuantity(source) : 0,
      estado: sourceState,
      codigo: sku,
      ensayador: String(source?.ensayador ?? '').trim() || null,
      entries: [source],
      ensayadores: String(source?.ensayador ?? '').trim() ? [String(source.ensayador).trim()] : []
    })
  })

  return Array.from(groups.values())
}

// helper: obtener color de estado administrativo (acepta value o label)
const getAdministrativeStateColor = (raw?: string) => {
  if (!raw) return '#cccccc'
  const s = normalizeText(raw)

  // buscar por value exacto (value es mayúsculas)
  const byValue = ADMINISTRATIVE_STATES.find(a => String(a.value).toLowerCase() === String(raw).toLowerCase())

  if (byValue) return byValue.color ?? '#cccccc'

  // buscar por label normalizado
  const byLabel = ADMINISTRATIVE_STATES.find(a => normalizeText(a.label) === s)

  if (byLabel) return byLabel.color ?? '#cccccc'

  // fallback: si raw contiene 'pag' devolver verde
  if (s.includes('pag')) return '#2E7D32ff'

  return '#cccccc'
}

// RCM type - actualizar para reflejar estructura de muestras
interface RCM {
  id: number
  numeroRcm: string
  rcmType?: string | null
  sede?: string | null
  ot?: string
  otDisplay?: string | null
  ss?: string | null
  numeroTarjeta?: string | null
  fechaCodificacion: string
  fechaMuestreo: string
  fechaIngreso?: string | null
  estadoMuestra?: string
  estadoOperativo?: string
  estadoAdministrativo?: string
  tipoServicio?: string | null
  ensayoServicioNombres?: string[]
  proximoVencimiento?: string | null
  diasVencimiento?: number | null
  cantidadProbetas?: number
  ensayador?: string | null
  ensayos?: {
    total: number
    ensayados: number
    pendientes: number
  } | null
  ordenTrabajo?: {
    id?: string | number
    correlativ?: string | number | null
    correlativo?: string | number | null
    clave?: string | null
    user?: {
      id?: string | number
      name?: string | null
      email?: string | null
    } | null
  } | null
  ordenTrabajoId?: string | number | null
  cliente?: {
    nombreCliente?: string
    comuna?: string
    ciudad?: string
    region?: string
    rut?: string
    raw?: any
  }
  area?: string
  familia?: string
  obra?: {
    numeroObra?: string
    nombreObra?: string
    comuna?: string
    region?: string
    mandante?: string
  }
  muestra?: {
    id?: number
    numeroMuestra: string
    cantidad: number
    estado?: string
    numeroTarjeta?: string | null
    servicioRCM?: {
      id?: number
      estado?: string
      servicio?: {
        id?: number
        codigo: string
        nombre: string
        producto?: {
          area?: string
          familia?: string
        }
      }
    } | null
  }
  rcmOriginalId?: number
}

interface Filters {
  dateField?: 'fecha_codificacion' | 'fecha_muestreo' | 'fecha_ingreso' | 'fecha_vencimiento'
  start?: string
  end?: string
  estadoOperativo?: string
  estadoAdministrativo?: string
  areaId?: number | null
  areaName?: string | null
  familia?: string | null
  ensayador?: string | null
  servicioEnsayo?: string | null
}

// Component
const columnHelper = createColumnHelper<RCM>()

// Ô£à AGREGAR esta funci├│n antes del componente UserListTable2
/**
 * Obtiene los estados disponibles para un SERVICIO/ENSAYO
 * L├│gica independiente de la tabla principal
 */
const getStatesForServicio = (servicioId: number | null, serviciosMuestra: any[]) => {
  if (!servicioId) return ENSAYO_STATES.map(s => ({ ...s, disabled: false }))

  // Buscar el servicio en serviciosMuestra
  const servicio = serviciosMuestra.find(
    s => (s.id ?? s.servicioMuestraId ?? s.servicioId) === servicioId
  )

  const estadoActual = servicio?.estado ?? servicio?.estadoServicio ?? 'CODIFICADO'

  console.log('­ƒôè getStatesForServicio:', {
    servicioId,
    estadoActual,
    servicio
  })

  // Encontrar ├¡ndice del estado actual
  const currentIndex = ENSAYO_STATES.findIndex(s => s.value === estadoActual)

  if (currentIndex === -1) {
    // Si no se encuentra el estado actual, mostrar todos habilitados
    return ENSAYO_STATES.map(s => ({ ...s, disabled: false }))
  }

  // Mostrar: estado actual (disabled) + siguiente (si existe)
  return ENSAYO_STATES.map((state, idx) => ({
    ...state,
    disabled: idx === currentIndex, // Solo el actual est├í disabled
    hidden: idx < currentIndex || idx > currentIndex + 1 // Ocultar anteriores y >siguiente
  })).filter(s => !s.hidden) // Filtrar los ocultos
}

const UserListTable2 = ({ filters }: { filters?: Filters }) => {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRcmIdParam = searchParams ? Number(searchParams.get('rcmId') ?? '') || null : null

  const getCurrentUserName = () => {
    const name = session?.user?.name

    if (typeof name === 'string' && name.trim()) return name.trim()

    const email = session?.user?.email

    if (typeof email === 'string' && email.trim()) return email.trim()

    return null
  }

  const getServicioIdentity = (s: any) => {
    // Importante: NO usar ids de entidad (servicioMuestra/servicioRCM),
    // porque pertenecen a tablas distintas y pueden colisionar.
    const ids = [s?.productoId, s?.producto?.productoId, s?.servicio?.productoId]
      .map((v: any) => Number(v))
      .filter((v: number) => Number.isFinite(v) && v > 0)

    const codigoRaw = String(s?.codigo ?? s?.sku ?? s?.producto?.sku ?? s?.servicio?.codigo ?? '').trim()
    const nombreRaw = String(s?.nombre ?? s?.producto?.nombre ?? s?.servicio?.nombre ?? '').trim()

    // Normalizar para evitar fallos de match por tildes, mayúsculas o puntuación.
    const codigo = normalizeText(codigoRaw).toUpperCase()
    const nombre = normalizeText(nombreRaw).toUpperCase()

    return {
      ids,
      codigo,
      nombre,
      key: `${codigo}|${nombre}`,
      keyCodigo: codigo
    }
  }

  const findDetalleServicioMatch = (servicio: any, serviciosDetalle: any[]) => {
    if (!Array.isArray(serviciosDetalle) || serviciosDetalle.length === 0) return null

    const src = getServicioIdentity(servicio)

    if (src.ids.length > 0) {
      const byId = serviciosDetalle.find((sd: any) => {
        const dst = getServicioIdentity(sd)

        return dst.ids.some((id: number) => src.ids.includes(id))
      })

      if (byId) return byId
    }

    if (src.keyCodigo) {
      const byCodigo = serviciosDetalle.find((sd: any) => getServicioIdentity(sd).keyCodigo === src.keyCodigo)

      if (byCodigo) return byCodigo
    }

    if (src.key !== '|') {
      const byKey = serviciosDetalle.find((sd: any) => getServicioIdentity(sd).key === src.key)

      if (byKey) return byKey
    }

    return null
  }

  const sortServiciosByDetalleOrder = (servicios: any[], serviciosDetalle: any[]) => {
    if (!Array.isArray(servicios) || servicios.length <= 1) return servicios
    if (!Array.isArray(serviciosDetalle) || serviciosDetalle.length === 0) return servicios

    const idOrder = new Map<number, number>()
    const keyOrder = new Map<string, number>()
    const codigoOrder = new Map<string, number>()

    serviciosDetalle.forEach((s: any, idx: number) => {
      const identity = getServicioIdentity(s)

      identity.ids.forEach((id: number) => {
        if (!idOrder.has(id)) idOrder.set(id, idx)
      })

      if (identity.key !== '|' && !keyOrder.has(identity.key)) keyOrder.set(identity.key, idx)

      if (identity.keyCodigo && !codigoOrder.has(identity.keyCodigo)) codigoOrder.set(identity.keyCodigo, idx)
    })

    return servicios
      .map((s: any, idx: number) => ({ s, idx }))
      .sort((a: any, b: any) => {
        const aIdentity = getServicioIdentity(a.s)
        const bIdentity = getServicioIdentity(b.s)

        const aById = aIdentity.ids.length > 0
          ? aIdentity.ids.map((id: number) => idOrder.get(id)).find((v: any) => v != null) ?? null
          : null

        const bById = bIdentity.ids.length > 0
          ? bIdentity.ids.map((id: number) => idOrder.get(id)).find((v: any) => v != null) ?? null
          : null

        const aByKey = aById == null && keyOrder.has(aIdentity.key) ? (keyOrder.get(aIdentity.key) as number) : null
        const bByKey = bById == null && keyOrder.has(bIdentity.key) ? (keyOrder.get(bIdentity.key) as number) : null

        const aByCodigo = aById == null && aByKey == null && codigoOrder.has(aIdentity.keyCodigo)
          ? (codigoOrder.get(aIdentity.keyCodigo) as number)
          : null

        const bByCodigo = bById == null && bByKey == null && codigoOrder.has(bIdentity.keyCodigo)
          ? (codigoOrder.get(bIdentity.keyCodigo) as number)
          : null

        const ao = aById ?? aByKey ?? aByCodigo
        const bo = bById ?? bByKey ?? bByCodigo

        if (ao != null && bo != null) return ao - bo
        if (ao != null) return -1
        if (bo != null) return 1

        return a.idx - b.idx
      })
      .map((x: any) => x.s)
  }

  const getCodifiedSubProductos = (servicio: any, serviciosOrdenOriginal: any[]) => {
    const matchOrden = findDetalleServicioMatch(servicio, serviciosOrdenOriginal)
    const rawSub = Array.isArray(matchOrden?.subProductos) ? matchOrden.subProductos : []

    return rawSub.map((sp: any) => ({
      sku: sp?.sku ?? sp?.producto?.sku ?? null,
      nombre: sp?.nombre ?? sp?.producto?.nombre ?? null,
      norma: sp?.norma ?? sp?.producto?.norma ?? null,
      tipo: sp?.tipo ?? sp?.producto?.tipo ?? null,
      cantidad: sp?.cantidad ?? 1
    }))
  }

  const isLikelyInvalidPersonName = (raw: any) => {
    const value = String(raw ?? '').trim()

    if (!value || value === '-') return true

    // Evitar mostrar IDs numéricos como nombre (ej: "1").
    return /^\d+$/.test(value)
  }

  const resolveDisplayPersonName = (...candidates: any[]) => {
    for (const c of candidates) {
      if (isLikelyInvalidPersonName(c)) continue

      return String(c).trim()
    }

    return '-'
  }

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [data, setData] = useState<RCM[]>([])
  const [filteredData, setFilteredData] = useState<RCM[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [hideControlServicio, setHideControlServicio] = useState(true)
  const [savingHistory, setSavingHistory] = useState(false)
  const [formErrors, setFormErrors] = useState<{ eventType?: string; motivo?: string; informeNumber?: string; general?: string }>({})

  // Reemplazar estados del dialog (l├¡nea ~224)
  // ...existing code...

  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [serviciosMuestra, setServiciosMuestra] = useState<any[]>([])
  const [muestraDetalle, setMuestraDetalle] = useState<any>(null)
  const [rcmDetalleModal, setRcmDetalleModal] = useState<any>(null)
  const [loadingServicios, setLoadingServicios] = useState(false)
  const [selectedInlineRowId, setSelectedInlineRowId] = useState<number | null>(null)
  const [inlineServicios, setInlineServicios] = useState<any[]>([])
  const [inlineMuestraDetalle, setInlineMuestraDetalle] = useState<any>(null)
  const [inlineRcmDetalle, setInlineRcmDetalle] = useState<any>(null)
  const [loadingInlineDetalle, setLoadingInlineDetalle] = useState(false)
  const [inlineActiveTab, setInlineActiveTab] = useState<'detalle' | 'ensayos'>('detalle')
  const inlineDetailRef = useRef<HTMLDivElement | null>(null)
  const tableContainerRef = useRef<HTMLDivElement | null>(null)

  // Ô£à AGREGAR: Estados para historial de servicioMuestra
  const [histServicioDialogOpen, setHistServicioDialogOpen] = useState(false)
  const [histServicioId, setHistServicioId] = useState<number | null>(null)
  const [histServicioRows, setHistServicioRows] = useState<any[]>([])
  const [histServicioLoading, setHistServicioLoading] = useState(false)

  // Cache para historial de servicios
  const servicioHistoryCache: Map<number, any[]> = (global as any).__SERVICIO_HISTORY_CACHE__ || new Map()

    ; (global as any).__SERVICIO_HISTORY_CACHE__ = servicioHistoryCache

  // ...existing code...

  // helper: convertir hex -> rgba
  const hexToRgba = (hex: string, alpha = 0.36) => {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)


    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // devuelve informaci├│n visual para un estado operativo
  const getOperationalInfo = (s?: string) => {
    if (!s) return { hex: undefined as string | undefined, bgcolor: 'rgba(0,0,0,0.06)', colorText: '#000', border: 'transparent' }
    const key = String(s).toUpperCase().trim()
    const st = OPERATIONAL_STATES.find(item => item.value === key || item.label.toUpperCase() === key)
    const hex = st?.color ?? '#9E9E9E'
    const bgcolor = hexToRgba(hex, 0.32) // fondo con m├ís presencia
    const border = hexToRgba(hex, 0.42) // borde sutil m├ís visible
    const colorText = '#7c7778' // texto siempre negro para mayor nitidez


    return { hex, bgcolor, colorText, border }
  }

  const resolveServiceStateFromRcm = (rawState?: string | null, rcmType?: string | null, rcmState?: string | null) => {
    const type = String(rcmType ?? '').trim().toUpperCase()
    const rcm = String(rcmState ?? '').trim().toUpperCase()
    const current = String(rawState ?? '').trim().toUpperCase()

    // Regla de auto-completado para Control/Servicio
    if (type === 'CONTROL' && rcm === 'ENSAYADO') return 'ENSAYADO'
    if (type === 'SERVICIO' && (rcm === 'EJECUTADO' || rcm === 'ENSAYADO')) return rcm

    return current || 'CODIFICADO'
  }

  // devuelve informaci├│n visual para un estado administrativo (usa ADMINISTRATIVE_STATES)
  const getAdministrativeInfo = (raw?: string) => {
    if (!raw) return { hex: undefined as string | undefined, bgcolor: 'rgba(0,0,0,0.06)', colorText: '#000', border: 'transparent' }
    const sVal = String(raw).trim()

    // intentar mapear por value o por label
    const byValue = ADMINISTRATIVE_STATES.find(a => String(a.value).toLowerCase() === sVal.toLowerCase())
    const byLabel = ADMINISTRATIVE_STATES.find(a => normalizeText(a.label) === normalizeText(sVal))
    const st = byValue ?? byLabel
    const hex = st?.color ?? '#9E9E9E'
    const bgcolor = hexToRgba(hex, 0.32)
    const border = hexToRgba(hex, 0.42)
    const colorText = '#7c7778'


    return { hex, bgcolor, colorText, border }
  }

  // ...existing code...


  // helper para usar color de OPERATIONAL_STATES en sx
  const getOperationalSx = (s?: string) => {
    if (!s) return { bgcolor: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.75)' }
    const key = String(s).toUpperCase().trim()
    const st = OPERATIONAL_STATES.find(item => item.value === key || item.label.toUpperCase() === key)
    const color = st?.color ?? '#9E9E9E'
    const bg = hexToRgba(color, 0.12)


    return { bgcolor: bg, color }
  }

  // menu contextual por fila
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [menuRowId, setMenuRowId] = useState<number | null>(null)

  // Menu "Marcar" state (falta declararlo)
  const [markAnchorEl, setMarkAnchorEl] = useState<null | HTMLElement>(null)
  const [markRowId, setMarkRowId] = useState<number | null>(null)

  // Dialog para acciones de "Marcar" (ej. Digitado / En Correcci├│n)
  const [markDialogOpen, setMarkDialogOpen] = useState(false)
  const [markDialogAction, setMarkDialogAction] = useState<string | null>(null)
  const [markDialogRowId, setMarkDialogRowId] = useState<number | null>(null)
  const [informeNumber, setInformeNumber] = useState<string>('')

  // campos para "En Corrección" / EVENTO
  const [correctionMotivo, setCorrectionMotivo] = useState<string>('')
  const [correctionObservaciones, setCorrectionObservaciones] = useState<string>('')

  // Tipo de Evento: 'INFO_PENDIENTE' | 'ERROR_INTERNO' | 'CORRECCION'
  const [eventType, setEventType] = useState<string>('')

  // ---- Helpers que dependen de `data` (dentro del componente) ----
  const normalizeState = (s?: string) => (s ?? '').toString().toUpperCase().trim()

  const getCurrentStateForRow = (rowId?: number | null) => {
    if (rowId == null) return ''
    const r = data.find(d => d.id === rowId)

    if (!r) return ''
    const s = r.estadoMuestra ?? r.estadoOperativo ?? (Array.isArray(r.servicios) && r.servicios.length ? (r.servicios[0] as any).estado : '')


    return normalizeState(s)
  }

  // Devuelve los estados para el popup "marcar"
  // Reglas:
  // 1) Si el estado actual es EVENTO -> mostrar todos los estados (el actual disabled)
  // 2) En cualquier otro caso -> mostrar: estado actual (disabled), el siguiente inmediato (si existe),
  //    y adem├ís EVENTO (sin duplicados)
  const getStatesForRow = (rowId?: number | null) => {
    const current = getCurrentStateForRow(rowId)

    // helper para buscar item por value
    const findState = (v?: string) => OPERATIONAL_STATES.find(s => s.value === v)

    // Caso 1: si estamos en EVENTO, mostrar todos (marcar el actual como disabled)
    if (current === 'EVENTO') {
      return OPERATIONAL_STATES.map(st => ({ ...st, disabled: st.value === current }))
    }

    // Caso 2: mostrar current (disabled), siguiente inmediato (si existe), y EVENTO
    const idx = OPERATIONAL_STATES.findIndex(st => st.value === current)
    const currentItem = findState(current)
    const nextItem = OPERATIONAL_STATES[idx + 1]

    const evento = findState('EVENTO')

    const items: Array<typeof OPERATIONAL_STATES[number] & { disabled?: boolean }> = []

    if (currentItem) items.push({ ...currentItem, disabled: true })
    if (nextItem) items.push({ ...nextItem, disabled: false })

    // a├▒adir EVENTO si existe y no est├í ya en la lista
    if (evento && !items.some(i => i.value === evento.value)) items.push({ ...evento, disabled: false })

    return items
  }

  // ---------------------------------------------------

  // Historial dialog
  const [histDialogOpen, setHistDialogOpen] = useState(false)
  const [histRowId, setHistRowId] = useState<number | null>(null)
  const [histRows, setHistRows] = useState<any[]>([])
  const [histLoading, setHistLoading] = useState(false)

  // simple cache en memoria para historial por RCM (evita refetchs)
  const historyCache: Map<number, any> = (global as any).__RCM_HISTORY_CACHE__ || new Map()

    ; (global as any).__RCM_HISTORY_CACHE__ = historyCache

  // ÔöÇÔöÇ Gestionar Ensayos dialog ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const [gestionarOpen, setGestionarOpen] = useState(false)
  const [gestionarRow, setGestionarRow] = useState<RCM | null>(null)
  const [gestionarLoading, setGestionarLoading] = useState(false)
  const [gestionarServicios, setGestionarServicios] = useState<any[]>([])
  const [gestionarProbetas, setGestionarProbetas] = useState<any[]>([])
  const [gestionarMuestra, setGestionarMuestra] = useState<any>(null)
  const [gestionarRcmData, setGestionarRcmData] = useState<any>(null)
  const [gestionarEnsayadorGlobal, setGestionarEnsayadorGlobal] = useState('')
  const [gestionarEnsayadores, setGestionarEnsayadores] = useState<Record<string, string>>({})
  const [gestionarFechasAsignacionEnsayador, setGestionarFechasAsignacionEnsayador] = useState<Record<string, string>>({})
  const [gestionarFechasInicioEnsayo, setGestionarFechasInicioEnsayo] = useState<Record<string, string>>({})
  const [gestionarFechasFinEnsayo, setGestionarFechasFinEnsayo] = useState<Record<string, string>>({})
  const [gestionarFechasInicioSubmuestra, setGestionarFechasInicioSubmuestra] = useState<Record<string, string>>({})
  const [gestionarFechasFinSubmuestra, setGestionarFechasFinSubmuestra] = useState<Record<string, string>>({})
  const [gestionarFechasEnsayoOpen, setGestionarFechasEnsayoOpen] = useState<Record<string, boolean>>({})
  const [gestionarEstados, setGestionarEstados] = useState<Record<string, string>>({})
  const [gestionarSaving, setGestionarSaving] = useState(false)
  const [gestionarObservaciones, setGestionarObservaciones] = useState<Record<string, string>>({})
  const [gestionarEstadoMasivoInfo, setGestionarEstadoMasivoInfo] = useState<string>('')
  const [ensayadorOptions, setEnsayadorOptions] = useState<string[]>([])
  const [gestionarSubmuestraDialogOpen, setGestionarSubmuestraDialogOpen] = useState(false)
  const [gestionarSubmuestraServicio, setGestionarSubmuestraServicio] = useState<any>(null)
  const [gestionarSubmuestraActiva, setGestionarSubmuestraActiva] = useState<any>(null)
  const [gestionarSubmuestraFormData, setGestionarSubmuestraFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    fetch('/api/users/laboratoristas')
      .then(r => r.json())
      .then((d: any[]) => {
        const names = Array.isArray(d)
          ? Array.from(new Set(d.map((u: any) => String(u?.name ?? '').trim()).filter(Boolean)))
          : []

        setEnsayadorOptions(names)
      })
      .catch(() => setEnsayadorOptions([]))
  }, [])

  const handleOpenGestionarEnsayos = async (row: RCM) => {
    if (!row.muestra?.id) return
    setGestionarRow(row)
    setGestionarServicios([])
    setGestionarProbetas([])
    setGestionarMuestra(null)
    setGestionarRcmData(null)
    setGestionarEnsayadorGlobal('')
    setGestionarEnsayadores({})
    setGestionarFechasAsignacionEnsayador({})
    setGestionarFechasInicioEnsayo({})
    setGestionarFechasFinEnsayo({})
    setGestionarFechasInicioSubmuestra({})
    setGestionarFechasFinSubmuestra({})
    setGestionarFechasEnsayoOpen({})
    setGestionarEstados({})
    setGestionarObservaciones({})
    setGestionarEstadoMasivoInfo('')
    setGestionarSubmuestraDialogOpen(false)
    setGestionarSubmuestraServicio(null)
    setGestionarSubmuestraActiva(null)
    setGestionarSubmuestraFormData({})
    setGestionarOpen(true)
    setGestionarLoading(true)

    try {
      const muestraId = row.muestra.id
      const rcmId = row.rcmOriginalId ?? null

      const [resServicios, resRcm] = await Promise.all([
        fetch(`/api/muestra/${muestraId}/servicios?ts=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        rcmId ? fetch(`/api/rcm/${rcmId}?ts=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }) : Promise.resolve(null)
      ])

      const dataServ = resServicios.ok ? await resServicios.json() : { servicios: [], muestra: {} }
      const detalleRcm = resRcm?.ok ? await resRcm.json() : null

      const muestraFromRcm = Array.isArray(detalleRcm?.muestras)
        ? detalleRcm.muestras.find((m: any) => Number(m?.id) === Number(muestraId))
        : null

      const serviciosDetalle = Array.isArray(muestraFromRcm?.servicios) ? muestraFromRcm.servicios : []

      const serviciosOrdenOriginal = Array.isArray(detalleRcm?.servicios) && detalleRcm.servicios.length > 0
        ? detalleRcm.servicios
        : serviciosDetalle

      const combinedRaw = (Array.isArray(dataServ.servicios) ? dataServ.servicios : []).map((s: any) => {
        const match = findDetalleServicioMatch(s, serviciosDetalle)
        const subProductosCodificados = getCodifiedSubProductos(s, serviciosOrdenOriginal)

        const estadoResuelto = resolveServiceStateFromRcm(
          s?.estado ?? match?.estado ?? 'CODIFICADO',
          detalleRcm?.rcmType,
          detalleRcm?.estadoOperativo
        )


        return {
          ...s,
          norma: s?.norma ?? match?.produto?.norma ?? match?.producto?.norma ?? null,
          ensayador: s?.ensayador ?? match?.ensayador ?? null,
          estado: estadoResuelto,
          subProductosCodificados
        }
      })

      const combined = sortServiciosByDetalleOrder(combinedRaw, serviciosOrdenOriginal)

      // Expand package services into individual sub-item rows for independent execution
      const expandedCombined: any[] = []

      for (const svc of combined) {
        const subItems = Array.isArray(svc.subProductosCodificados) && svc.subProductosCodificados.length > 0
          ? svc.subProductosCodificados
          : (Array.isArray(svc.productosEnPaquete) ? svc.productosEnPaquete : [])

        if (svc.esPaquete && subItems.length > 0) {
          expandedCombined.push({ ...svc, _isPaqueteHeader: true })
          subItems.forEach((sub: any, idx: number) => {
            expandedCombined.push({
              _syntheticKey: `paq_${svc.id}_${idx}`,
              _paqueteParentId: svc.id,
              _isPaqueteSubItem: true,
              id: `paq_${svc.id}_${idx}`,
              codigo: sub.sku ?? String(sub.id ?? idx),
              nombre: sub.nombre ?? '-',
              norma: sub.norma ?? null,
              tipo: sub.tipo ?? null,
              estado: svc.estado,

              // No heredar ensayador del padre: cada sub-ensayo se asigna de forma independiente.
              ensayador: null,
              fechaAsignacionEnsayador: null,
              fechaInicioEnsayo: null,
              fechaFinEnsayo: null,
              observacion: null,
              cantidad: sub.cantidad ?? 1
            })
          })
        } else {
          expandedCombined.push(svc)
        }
      }

      const packageServices = combined.filter((svc: any) => svc.esPaquete && Array.isArray(svc.productosEnPaquete) && svc.productosEnPaquete.length > 0)

      const packageHistoryRows = await Promise.all(
        packageServices.map(async (svc: any) => {
          try {
            const response = await fetch(`/api/servicioMuestra/${svc.id}/history?ts=${Date.now()}`, {
              cache: 'no-store',
              headers: { 'Cache-Control': 'no-cache' }
            })

            const rows = response.ok ? await response.json() : []

            return [svc.id, Array.isArray(rows) ? rows : []] as const
          } catch {
            return [svc.id, []] as const
          }
        })
      )

      const packageHistoryMap = new Map<number, any[]>(packageHistoryRows)

      const hydratedExpandedCombined = expandedCombined.map((item: any) => {
        if (!item._isPaqueteSubItem) return item

        const historyRows = packageHistoryMap.get(item._paqueteParentId) ?? []
        const historyMatch = historyRows.find((historyRow: any) => normalizeText(historyRow?.ensayoServicio) === normalizeText(item.nombre))

        if (!historyMatch) return item

        return {
          ...item,
          estado: historyMatch.estNuevo ?? item.estado,
          ensayador: historyMatch.aplicadoA ?? item.ensayador,
          fechaAsignacionEnsayador: historyMatch.fechaAccion ?? historyMatch.registro ?? item.fechaAsignacionEnsayador ?? null,
          fechaInicioEnsayo: historyMatch.fechaInicioEnsayo ?? item.fechaInicioEnsayo ?? null,
          fechaFinEnsayo: historyMatch.fechaFinEnsayo ?? item.fechaFinEnsayo ?? null,
          observacion: historyMatch.observacion ?? item.observacion
        }
      })

      const servicioSubmuestras = combined.find((service: any) => serviceUsesSubmuestras(service) && service.id)
      const fechasInicioSubmuestraInit: Record<string, string> = {}
      const fechasFinSubmuestraInit: Record<string, string> = {}

      if (servicioSubmuestras) {
        try {
          const response = await fetch(`/api/servicioMuestra/${servicioSubmuestras.id}/history?ts=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          })

          const historyRows = response.ok ? await response.json() : []

          if (Array.isArray(historyRows)) {
            historyRows.forEach((historyRow: any) => {
              const match = String(historyRow?.ensayoServicio ?? '').match(/Submuestra\s+(\d+)/i)

              if (!match) return

              const subKey = match[1]

              if (historyRow?.fechaInicioEnsayo) fechasInicioSubmuestraInit[subKey] = toDateTimeInputValue(historyRow.fechaInicioEnsayo)
              if (historyRow?.fechaFinEnsayo) fechasFinSubmuestraInit[subKey] = toDateTimeInputValue(historyRow.fechaFinEnsayo)
            })
          }
        } catch {
          // La ausencia de historial no impide abrir el modal.
        }
      }

      const probetas = Array.isArray(muestraFromRcm?.probetas) ? muestraFromRcm.probetas : []

      setGestionarServicios(hydratedExpandedCombined)
      setGestionarProbetas(probetas)
      setGestionarMuestra({ ...(dataServ.muestra ?? {}), probetas })
      setGestionarRcmData(detalleRcm)

      // inicializar estado y ensayador local con los valores actuales de cada servicio
      const estadosInit: Record<string, string> = {}
      const ensayadoresInit: Record<string, string> = {}
      const fechasAsignacionInit: Record<string, string> = {}
      const fechasInicioEnsayoInit: Record<string, string> = {}
      const fechasFinEnsayoInit: Record<string, string> = {}
      const observacionesInit: Record<string, string> = {}

      hydratedExpandedCombined.forEach((s: any) => {
        const key = String(s._syntheticKey ?? s.id)

        estadosInit[key] = s.estado ?? 'CODIFICADO'
        if (s.ensayador) ensayadoresInit[key] = s.ensayador
        if (s.fechaAsignacionEnsayador) fechasAsignacionInit[key] = toDateInputValue(s.fechaAsignacionEnsayador)
        if (s.fechaInicioEnsayo) fechasInicioEnsayoInit[key] = toDateTimeInputValue(s.fechaInicioEnsayo)
        if (s.fechaFinEnsayo) fechasFinEnsayoInit[key] = toDateTimeInputValue(s.fechaFinEnsayo)

        if (typeof s.observacion === 'string' && s.observacion.trim()) {
          observacionesInit[key] = s.observacion
        }
      })
      setGestionarEstados(estadosInit)
      setGestionarEnsayadores(ensayadoresInit)
      setGestionarFechasAsignacionEnsayador(fechasAsignacionInit)
      setGestionarFechasInicioEnsayo(fechasInicioEnsayoInit)
      setGestionarFechasFinEnsayo(fechasFinEnsayoInit)
      setGestionarFechasInicioSubmuestra(fechasInicioSubmuestraInit)
      setGestionarFechasFinSubmuestra(fechasFinSubmuestraInit)
      setGestionarObservaciones(observacionesInit)
    } catch (e) {
      console.error('Error loading gestionar ensayos:', e)
    } finally {
      setGestionarLoading(false)
    }
  }

  const handleGuardarGestionar = async () => {
    if (!gestionarRow) return
    setGestionarSaving(true)

    try {
      const user = getCurrentUserName() ?? 'Usuario'
      const probetasOriginales = Array.isArray(gestionarMuestra?.probetas) ? gestionarMuestra.probetas : []
      const servicioSubmuestras = gestionarServicios.find((service: any) => serviceUsesSubmuestras(service) && service.id)

      const getEstadoDerivedFromSubs = (parentId: number): string => {
        const subItems = gestionarServicios.filter((sub: any) => sub._paqueteParentId === parentId)

        if (subItems.length === 0) return gestionarEstados[String(parentId)] ?? 'CODIFICADO'

        const subStates = subItems.map((sub: any) => gestionarEstados[String(sub._syntheticKey ?? sub.id)] ?? 'CODIFICADO')

        const normalizedSubStates = subStates.map((state: string) => normalizeEnsayoState(state))

        if (normalizedSubStates.length > 0 && normalizedSubStates.every((state: string) => state === 'ENSAYADO')) return 'ENSAYADO'
        if (normalizedSubStates.some((state: string) => state !== 'CODIFICADO')) return 'EN_PROCESO'

        return 'CODIFICADO'
      }

      const subItemsParaGuardar = gestionarServicios.filter((s: any) => s._isPaqueteSubItem)
      const serviciosParaGuardar = gestionarServicios.filter((s: any) => !s._isPaqueteSubItem)

      await Promise.all(
        [
          ...(servicioSubmuestras
            ? gestionarProbetas.map(async (probeta: any) => {
              const subKey = String(probeta?.id ?? probeta?.numero ?? '')
              const fechaInicio = String(gestionarFechasInicioSubmuestra[subKey] ?? '').trim()
              const fechaFin = String(gestionarFechasFinSubmuestra[subKey] ?? '').trim()

              if (!fechaInicio && !fechaFin) return

              const response = await fetch(`/api/servicioMuestra/${servicioSubmuestras.id}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tipo: 'Ens',
                  estAnterior: probeta?.estado ?? 'CODIFICADO',
                  estNuevo: probeta?.estado ?? 'CODIFICADO',
                  funcionario: user,
                  ensayoServicio: `${servicioSubmuestras.nombre} · Submuestra ${probeta?.numero ?? subKey}`,
                  fechaInicioEnsayo: fechaInicio || null,
                  fechaFinEnsayo: fechaFin || null,
                  skipServicioEstadoUpdate: true
                })
              })

              if (!response.ok) {
                throw new Error(`No se pudo guardar la fecha de la submuestra ${subKey}`)
              }
            })
            : []),
          ...gestionarProbetas.map(async (probeta: any) => {
            const probetaId = Number(probeta?.id)
            const estadoNuevo = probeta?.estado ?? 'CODIFICADO'
            const original = probetasOriginales.find((item: any) => Number(item?.id) === probetaId)
            const estadoPrev = original?.estado ?? 'CODIFICADO'

            if (!probetaId || estadoNuevo === estadoPrev) return

            await fetch(`/api/probeta/${probetaId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ estado: estadoNuevo })
            })
          }),
          ...subItemsParaGuardar.map(async (s: any) => {
            const sKey = String(s._syntheticKey ?? s.id)
            const parentId = Number(s._paqueteParentId)

            if (!parentId) return

            const estadoNuevo = gestionarEstados[sKey] ?? s.estado ?? 'CODIFICADO'
            const estadoPrev = s.estado ?? 'CODIFICADO'
            const ensayadorNuevo = gestionarEnsayadores[sKey] ?? ''
            const ensayadorPrev = s.ensayador ?? ''
            const observacionNueva = (gestionarObservaciones[sKey] ?? '').trim()
            const observacionPrev = String(s.observacion ?? '').trim()
            const fechaAsignacionNueva = String(gestionarFechasAsignacionEnsayador[sKey] ?? '').trim()
            const fechaAsignacionPrev = toDateInputValue(s.fechaAsignacionEnsayador)
            const fechaInicioEnsayoNueva = String(gestionarFechasInicioEnsayo[sKey] ?? '').trim()
            const fechaInicioEnsayoPrev = toDateTimeInputValue(s.fechaInicioEnsayo)
            const fechaFinEnsayoNueva = String(gestionarFechasFinEnsayo[sKey] ?? '').trim()
            const fechaFinEnsayoPrev = toDateTimeInputValue(s.fechaFinEnsayo)

            if (
              estadoNuevo === estadoPrev &&
              ensayadorNuevo === ensayadorPrev &&
              observacionNueva === observacionPrev &&
              fechaAsignacionNueva === fechaAsignacionPrev &&
              fechaInicioEnsayoNueva === fechaInicioEnsayoPrev &&
              fechaFinEnsayoNueva === fechaFinEnsayoPrev
            ) return

            await fetch(`/api/servicioMuestra/${parentId}/history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tipo: 'Ens',
                estAnterior: estadoPrev,
                estNuevo: estadoNuevo,
                funcionario: user,
                aplicadoA: ensayadorNuevo || null,
                ensayoServicio: s.nombre,
                observacion: observacionNueva || null,
                fechaAccion: fechaAsignacionNueva || null,
                fechaInicioEnsayo: fechaInicioEnsayoNueva || null,
                fechaFinEnsayo: fechaFinEnsayoNueva || null,
                skipServicioEstadoUpdate: true
              })
            })
          }),
          ...serviciosParaGuardar.map(async (s: any) => {
            const sKey = String(s._syntheticKey ?? s.id)

            const estadoNuevoBase = s._isPaqueteHeader
              ? getEstadoDerivedFromSubs(s.id)
              : (gestionarEstados[sKey] ?? s.estado ?? 'CODIFICADO')

            const estadoNuevo = getEstadoServicioConProbetas(s, estadoNuevoBase)
            const estadoPrev = s.estado ?? 'CODIFICADO'
            const ensayadorNuevo = gestionarEnsayadores[sKey] ?? ''
            const ensayadorPrev = s.ensayador ?? ''
            const observacionNueva = (gestionarObservaciones[sKey] ?? '').trim()
            const observacionPrev = String(s.observacion ?? '').trim()
            const fechaAsignacionNueva = String(gestionarFechasAsignacionEnsayador[sKey] ?? '').trim()
            const fechaAsignacionPrev = toDateInputValue(s.fechaAsignacionEnsayador)
            const fechaInicioEnsayoNueva = String(gestionarFechasInicioEnsayo[sKey] ?? '').trim()
            const fechaInicioEnsayoPrev = toDateTimeInputValue(s.fechaInicioEnsayo)
            const fechaFinEnsayoNueva = String(gestionarFechasFinEnsayo[sKey] ?? '').trim()
            const fechaFinEnsayoPrev = toDateTimeInputValue(s.fechaFinEnsayo)

            // Guardar si cambió estado, ensayador u observación
            if (
              estadoNuevo === estadoPrev &&
              ensayadorNuevo === ensayadorPrev &&
              observacionNueva === observacionPrev &&
              fechaAsignacionNueva === fechaAsignacionPrev &&
              fechaInicioEnsayoNueva === fechaInicioEnsayoPrev &&
              fechaFinEnsayoNueva === fechaFinEnsayoPrev
            ) return

            await fetch(`/api/servicioMuestra/${s.id}/history`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tipo: 'Ens',
                estAnterior: estadoPrev,
                estNuevo: estadoNuevo,
                funcionario: user,
                aplicadoA: ensayadorNuevo || null,
                ensayoServicio: s.nombre,
                observacion: observacionNueva || null,
                fechaAccion: fechaAsignacionNueva || null,
                fechaInicioEnsayo: fechaInicioEnsayoNueva || null,
                fechaFinEnsayo: fechaFinEnsayoNueva || null
              })
            })
          })
        ]
      )

      // Actualizar tabla principal: recalcular estado operativo del RCM
      const subItemsYRegulares = gestionarServicios.filter((s: any) => !s._isPaqueteHeader)

      const serviciosSinSubmuestras = subItemsYRegulares.filter((service: any) => !serviceUsesSubmuestras(service))

      const todosEstadosServicios = serviciosSinSubmuestras.map((s: any) => {
        const key = String(s._syntheticKey ?? s.id)

        return getEstadoServicioConProbetas(s, gestionarEstados[key] ?? s.estado ?? 'CODIFICADO')
      })

      const todosEstadosProbetas = gestionarProbetas.map((probeta: any) => probeta?.estado ?? 'CODIFICADO')
      const todosEstados = [...todosEstadosServicios, ...todosEstadosProbetas]

      const normalizedEstados = todosEstados.map((estado: string) => normalizeEnsayoState(estado))

      const estadoFinal = normalizedEstados.length > 0 && normalizedEstados.every((estado: string) => estado === 'ENSAYADO')
        ? 'ENSAYADO'
        : normalizedEstados.some((estado: string) => estado !== 'CODIFICADO')
          ? 'EN_PROCESO'
          : 'CODIFICADO'

      const rcmId = gestionarRow?.rcmOriginalId ?? null

      if (rcmId) {
        try {
          await fetch(`/api/rcm/${rcmId}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: 'Ens',
              tipoEstado: 'ENSAYOS',
              funcionario: user,
              estPrev: gestionarRow?.estadoOperativo ?? gestionarRow?.estadoMuestra ?? null,
              estNuevo: estadoFinal,
              observacion: `Estado actualizado desde gestión de ensayos a ${estadoFinal}`
            })
          })
        } catch (error) {
          console.warn('No se pudo persistir el estado del RCM padre:', error)
        }
      }

      // Ensayador predominante (del primer servicio con ensayador asignado)
      const ensayadorFinal =
        subItemsYRegulares
          .map((s: any) => gestionarEnsayadores[String(s._syntheticKey ?? s.id)] ?? s.ensayador ?? '')
          .find((e: string) => Boolean(e.trim())) ?? (gestionarRow?.ensayador ?? '')

      setData(prev => prev.map(row => {
        if (row.id === gestionarRow?.id) {
          return { ...row, estadoMuestra: estadoFinal, estadoOperativo: estadoFinal, ensayador: ensayadorFinal || row.ensayador }
        }


        return row
      }))

      setFilteredData(prev => prev.map(row => {
        if (row.id === gestionarRow?.id) {
          return { ...row, estadoMuestra: estadoFinal, estadoOperativo: estadoFinal, ensayador: ensayadorFinal || row.ensayador }
        }

        return row
      }))

      if (selectedInlineRowId && gestionarRow?.id === selectedInlineRowId) {
        setInlineServicios(prev => prev.map((servicio: any) => {
          const servicioId = servicio.id ?? servicio.servicioMuestraId ?? servicio.servicioId ?? servicio._id
          const nuevoEstado = getEstadoServicioConProbetas(servicio, gestionarEstados[String(servicioId)] ?? servicio.estado ?? 'CODIFICADO')

          return { ...servicio, estado: nuevoEstado }
        }))

        setInlineRcmDetalle(prev => prev ? { ...prev, estadoOperativo: estadoFinal, estadoMuestra: estadoFinal } : prev)
        setInlineMuestraDetalle(prev => prev ? { ...prev, probetas: gestionarProbetas } : prev)
      }

      if (typeof (window as any).__REFRESH_RCM_ROW__ === 'function' && rcmId) {
        try {
          ; (window as any).__REFRESH_RCM_ROW__(rcmId, { estadoOperativo: estadoFinal })
        } catch (error) {
          /* noop */
        }
      }

      setGestionarOpen(false)
    } catch (e) {
      console.error('Error guardando gestionar ensayos:', e)
    } finally {
      setGestionarSaving(false)
    }
  }

  // ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ

  const handleOpenMarkMenu = (e: React.MouseEvent<HTMLElement>, rowId: number) => {
    setMarkAnchorEl(e.currentTarget)
    setMarkRowId(rowId)
  }

  const handleCloseMarkMenu = () => {
    setMarkAnchorEl(null)
    setMarkRowId(null)
  }

  const openMarkDialogForRow = (action: string, rowId?: number | null) => {
    setMarkDialogAction(action)
    setMarkDialogRowId(rowId ?? null) // importante: setear el id aqu├¡
    // reset campos del di├ílogo
    setInformeNumber('')
    setCorrectionMotivo('')
    setCorrectionObservaciones('')
    setEventType('')
    handleCloseMarkMenu()
    setMarkDialogOpen(true)
  }

  const handleMarkAction = async (action: string, rowId?: number | null) => {
    // acciones que requieren di├ílogo (ELIMINADO CERRADO_OP)
    const ACTIONS_REQUIRING_DIALOG = new Set([
      'DIGITADO',
      'EVENTO',
      'ENVIADO_DIGITACION',
      'REVISADO',
      'FIRMADO',
      'ENVIADO'
    ])

    if (ACTIONS_REQUIRING_DIALOG.has(action)) {
      // si no se pas├│ rowId, intenta usar el state existente (evita error)
      openMarkDialogForRow(action, rowId ?? markDialogRowId ?? null)

      return
    }

    // acciones que se ejecutan inmediatamente: crear historial y actualizar estado
    if (!rowId) {
      console.warn('handleMarkAction: missing rowId for immediate action', action)
      handleCloseMarkMenu()

      return
    }

    const prevState = getCurrentStateForRow(rowId)
    const finalFuncionario = getCurrentUserName() ?? 'Usuario'

    const payload: any = {
      tipo: 'Ope',
      tipoEstado: action,
      motivo: null,
      observacion: null,
      funcionario: finalFuncionario,
      estPrev: prevState ?? null,
      estNuevo: action,
      informe: null
    }

    try {
      // optimista: actualizar UI localmente
      setData(prev => prev.map(d => (d.id === rowId ? { ...d, estadoMuestra: action, estadoOperativo: action } : d)))

      const res = await fetch(`/api/rcm/${rowId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')

        console.error('Failed to create history for immediate action:', res.status, txt)
        throw new Error('Error creating history')
      }

      const created = await res.json().catch(() => null)

      // mantener cache local de historial
      try {
        const existing = historyCache.get(rowId) ?? []

        if (created) {
          historyCache.set(rowId, [created, ...existing])


          // si el dialogo de historial est├í abierto para la misma fila, actualizarlo tambi├®n
          if (histDialogOpen && histRowId === rowId) {
            setHistRows(prev => [created, ...prev])
          }
        }
      } catch (e) {
        // noop
      }
    } catch (err) {
      // revertir optimista en caso de error
      console.error('Error marcar (inmediato):', err)
      setData(prev => prev.map(d => (d.id === rowId ? { ...d, estadoMuestra: prevState, estadoOperativo: prevState } : d)))

      // opcional: mostrar aviso al usuario
      alert('No se pudo actualizar el estado. Ver consola para detalles.')
    } finally {
      handleCloseMarkMenu()
    }
  }

  const validateMarkDialog = (setErrors = true) => {
    const errors: Record<string, string> = {}

    if (!markDialogRowId) {
      errors.general = 'RCM no seleccionado'
    }

    if (markDialogAction === 'DIGITADO') {
      if (!informeNumber || String(informeNumber).trim() === '') errors.informeNumber = 'Ingrese N° de informe'
      else if (Number.isNaN(Number(informeNumber))) errors.informeNumber = 'Debe ser un número'
    }

    // ELIMINADO: validaci├│n para CERRADO_OP
    if (markDialogAction === 'EVENTO') {
      if (!eventType) errors.eventType = 'Seleccione tipo'
      if (!correctionMotivo || !correctionMotivo.trim()) errors.motivo = 'Ingrese motivo'
    }

    // Para estos estados la observaci├│n es obligatoria
    if (['ENVIADO_DIGITACION', 'REVISADO', 'FIRMADO', 'ENVIADO'].includes(String(markDialogAction ?? ''))) {
      if (!correctionObservaciones || !String(correctionObservaciones).trim()) {
        errors.observacion = 'Ingrese observación obligatoria'
      }
    }

    if (setErrors) setFormErrors(errors)

    return Object.keys(errors).length === 0
  }

  const handleSaveMarkDialog = async () => {
    try {
      const rcmId = markDialogRowId

      if (!validateMarkDialog()) {
        // mostrar feedback r├ípido en consola / UI
        console.warn('Validation failed', formErrors)

        return
      }

      setSavingHistory(true)

      const payload: any = {
        tipo: 'Ope', // <- forzar 'Ope' por defecto desde esta pantalla
        tipoEstado: markDialogAction === 'EVENTO' || markDialogAction === 'CERRADO_OP' ? eventType || markDialogAction : markDialogAction,
        motivo: correctionMotivo ?? null,
        observacion: correctionObservaciones ?? null,
        funcionario: getCurrentUserName() ?? 'Usuario',
        estPrev: getCurrentStateForRow(markDialogRowId) ?? null,
        estNuevo: markDialogAction ?? null,
        informe: markDialogAction === 'DIGITADO' ? (Number(informeNumber) || null) : null
      }

      const res = await fetch(`/api/rcm/${rcmId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')

        // eslint-disable-next-line no-console
        console.error('Failed to save RCMHistory:', res.status, txt)
        throw new Error('Error saving history')
      }

      // success: obtener registro creado (si API lo devuelve)
      const created = await res.json().catch(() => null)

      // actualizar s├│lo el registro afectado en el estado local (optimista / definitivo)
      setData(prev => prev.map(d => (d.id === rcmId ? { ...d, estadoMuestra: payload.estNuevo ?? d.estadoMuestra, estadoOperativo: payload.estNuevo ?? d.estadoOperativo } : d)))
      setFilteredData(prev => prev.map(d => (d.id === rcmId ? { ...d, estadoMuestra: payload.estNuevo ?? d.estadoMuestra, estadoOperativo: payload.estNuevo ?? d.estadoOperativo } : d)))

      // actualizar cach├® de historial y vistas abiertas
      const newHistEntry = created ?? {
        tipo: payload.tipo,
        funcionario: payload.funcionario ?? 'Usuario',
        estAnterior: payload.estPrev ?? null,
        estNuevo: payload.estNuevo ?? null,
        informe: payload.informe ?? null,
        fechaAccion: new Date().toISOString(),
        observacion: payload.observacion ?? null
      }

      historyCache.set(rcmId, [newHistEntry, ...(historyCache.get(rcmId) ?? [])])

      if (histDialogOpen && histRowId === rcmId) {
        setHistRows(prev => [newHistEntry, ...prev])
      }

      // cerrar di├ílogo y limpiar formulario (sin recargar toda la tabla)
      setMarkDialogOpen(false)
      setFormErrors({})
      setMarkDialogAction(null)
      setMarkDialogRowId(null)
      setInformeNumber('')
      setCorrectionMotivo('')
      setCorrectionObservaciones('')
      setEventType('')
      setSavingHistory(false)


      // ya actualizamos localmente setData/setFilteredData.
      // Opcional: si el host expone una funci├│n para refrescar solo una fila, ll├ímala
      if (typeof (window as any).__REFRESH_RCM_ROW__ === 'function') {
        try {
          ; (window as any).__REFRESH_RCM_ROW__(rcmId, { estadoOperativo: payload.estNuevo ?? null })
        } catch (e) {
          /* noop */
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('handleSaveMarkDialog error', err)
      setSavingHistory(false)
    }
  }

  const handleCancelMarkDialog = () => {
    setMarkDialogOpen(false)
    setMarkDialogAction(null)
    setMarkDialogRowId(null)
    setInformeNumber('')
    setCorrectionMotivo('')
    setCorrectionObservaciones('')
    setEventType('')
  }

  const handleOpenRowMenu = (e: React.MouseEvent<HTMLElement>, rowId: number) => {
    setMenuAnchorEl(e.currentTarget)
    setMenuRowId(rowId)
  }

  const handleCloseRowMenu = () => {
    setMenuAnchorEl(null)
    setMenuRowId(null)
  }

  // helper robusto para localizar una fila por id (acepta number/string y _id)
  const findRowById = (rowId: any) => {
    if (rowId === null || typeof rowId === 'undefined') return null
    const sid = String(rowId).trim()

    // 1) buscar en data por id o _id (string/number)
    let r = data.find(d => String((d as any).id ?? '') === sid || String((d as any)._id ?? '') === sid)

    if (r) return r

    // 2) buscar en filteredData (por si data no est├í sincronizada)
    r = filteredData.find(d => String((d as any).id ?? '') === sid || String((d as any)._id ?? '') === sid)
    if (r) return r

    // 3) intentar comparaci├│n num├®rica (si rowId convertible a n├║mero) contra id/_id
    const n = Number(rowId)

    if (!Number.isNaN(n)) {
      r = data.find(d => !Number.isNaN(Number((d as any).id)) && Number((d as any).id) === n)
      if (r) return r
      r = filteredData.find(d => !Number.isNaN(Number((d as any).id)) && Number((d as any).id) === n)
      if (r) return r
    }


    // 4) Fallback: si rowId es el ├¡ndice interno de react-table (ej '0','1',...), devolver filteredData[idx]
    if (!Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n < filteredData.length) {
      // eslint-disable-next-line no-console
      console.debug('findRowById: using index-fallback for react-table row id ->', n)

      return filteredData[n]
    }


    return null
  }

  const handleEdit = (rowId: number | null, opts?: { readonly?: boolean; newTab?: boolean }) => {
    if (!rowId && rowId !== 0) {
      console.warn('handleEdit: missing rowId')
      handleCloseRowMenu()

      return
    }

    // Ô£à CORRECCI├ôN: buscar por rcmOriginalId si menuRowId viene del men├║ contextual
    let row = findRowById(rowId)

    // Si no se encuentra, puede ser que rowId sea un rcmOriginalId
    if (!row) {
      row = data.find(r => r.rcmOriginalId === rowId) ?? filteredData.find(r => r.rcmOriginalId === rowId)
    }

    if (!row) {
      console.warn('handleEdit: row not found', rowId, {
        dataIds: data.map(d => (d as any).id ?? (d as any)._id),
        filteredIds: filteredData.map(d => (d as any).id ?? (d as any)._id)
      })
      handleCloseRowMenu()

      return
    }

    // Ô£à Usar rcmOriginalId para construir la URL
    const rcmId = row.rcmOriginalId ?? row.id
    const otId = row.ordenTrabajo?.id ?? row.ordenTrabajoId ?? row.ot ?? ''

    // Si readonly, abrir encoder en nueva pesta├▒a (comportamiento original)
    if (opts?.readonly) {
      const params = new URLSearchParams()

      params.set('rcmId', String(rcmId))
      if (otId) params.set('otId', String(otId))
      params.set('readonly', '1')
      window.open(`${window.location.origin}/en/apps/encoder?${params.toString()}`, '_blank')
      handleCloseRowMenu()

      return
    }

    // Navegación a la página de edición (misma pestaña o nueva pestaña)
    const currentLang = (locale as string) || 'es'
    const editUrl = `/${currentLang}/apps/rcm-edit/${rcmId}`

    if (opts?.newTab) {
      window.open(`${window.location.origin}${editUrl}`, '_blank')
      handleCloseRowMenu()

      return
    }

    router.push(editUrl)
    handleCloseRowMenu()
  }

  const resetSelectedDetail = () => {
    setSelectedRowId(null)
    setServiciosMuestra([])
    setMuestraDetalle(null)
    setRcmDetalleModal(null)
  }

  const resetInlineDetail = () => {
    setSelectedInlineRowId(null)
    setInlineServicios([])
    setInlineMuestraDetalle(null)
    setInlineRcmDetalle(null)
    setInlineActiveTab('detalle')
  }

  const handleSelectInlineDetail = async (row: RCM | null) => {
    if (!row) return

    if (selectedInlineRowId === row.id) {
      resetInlineDetail()

      return
    }

    setSelectedInlineRowId(row.id)
    setInlineServicios([])
    setInlineMuestraDetalle(null)
    setInlineRcmDetalle(null)
    setInlineActiveTab('detalle')
    setLoadingInlineDetalle(true)

    try {
      const muestraId = row.muestra.id
      const rcmId = row.rcmOriginalId ?? null

      if (!rcmId) throw new Error('RCM sin id para cargar detalle')

      if (!muestraId) {
        const responseRcm = await fetch(`/api/rcm/${rcmId}?ts=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })

        if (!responseRcm.ok) throw new Error(`HTTP ${responseRcm.status}`)

        const detalleRcm = await responseRcm.json()
        const serviciosRcm = Array.isArray(detalleRcm?.servicios) ? detalleRcm.servicios : []

        const serviciosCombinados = serviciosRcm.map((servicio: any) => {
          const estadoResuelto = resolveServiceStateFromRcm(
            servicio?.estadoOperativo ?? servicio?.estado ?? 'CODIFICADO',
            detalleRcm?.rcmType,
            detalleRcm?.estadoOperativo
          )

          const subProductosCodificados = Array.isArray(servicio?.subProductos)
            ? servicio.subProductos.map((sp: any) => ({
              sku: sp?.sku ?? sp?.producto?.sku ?? null,
              nombre: sp?.nombre ?? sp?.producto?.nombre ?? null,
              norma: sp?.norma ?? sp?.producto?.norma ?? null,
              cantidad: sp?.cantidad ?? 1
            }))
            : []

          return {
            ...servicio,
            norma: servicio?.norma ?? servicio?.producto?.norma ?? null,
            codigo: servicio?.codigo ?? servicio?.producto?.sku ?? null,
            cantidad: servicio?.cantidad ?? 1,
            estado: estadoResuelto,
            subProductosCodificados
          }
        })

        setInlineMuestraDetalle({ ...(row.muestra ?? {}), probetas: [] })
        setInlineServicios(serviciosCombinados)
        setInlineRcmDetalle(detalleRcm)

        return
      }

      const [responseServicios, responseRcm] = await Promise.all([
        fetch(`/api/muestra/${muestraId}/servicios`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        rcmId
          ? fetch(`/api/rcm/${rcmId}?ts=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          })
          : Promise.resolve(null)
      ])

      if (!responseServicios.ok) throw new Error(`HTTP ${responseServicios.status}`)

      const data = await responseServicios.json()
      const detalleRcm = responseRcm && responseRcm.ok ? await responseRcm.json() : null

      const muestraRcm = Array.isArray(detalleRcm?.muestras)
        ? detalleRcm.muestras.find((m: any) => Number(m?.id) === Number(muestraId))
        : null

      const serviciosDetalle = Array.isArray(muestraRcm?.servicios) ? muestraRcm.servicios : []

      const serviciosOrdenOriginal = Array.isArray(detalleRcm?.servicios) && detalleRcm.servicios.length > 0
        ? detalleRcm.servicios
        : serviciosDetalle

      const serviciosCombinadosRaw = (Array.isArray(data.servicios) ? data.servicios : []).map((servicio: any) => {
        const match = findDetalleServicioMatch(servicio, serviciosDetalle)
        const subProductosCodificados = getCodifiedSubProductos(servicio, serviciosOrdenOriginal)

        const estadoResuelto = resolveServiceStateFromRcm(
          servicio?.estado ?? match?.estado ?? 'CODIFICADO',
          detalleRcm?.rcmType,
          detalleRcm?.estadoOperativo
        )

        return {
          ...servicio,
          norma: servicio?.norma ?? match?.producto?.norma ?? match?.norma ?? null,
          codigo: servicio?.codigo ?? match?.producto?.sku ?? match?.codigo ?? null,
          cantidad: servicio?.cantidad ?? match?.cantidad ?? 1,
          estado: estadoResuelto,
          subProductosCodificados
        }
      })

      const serviciosCombinadosBase = sortServiciosByDetalleOrder(serviciosCombinadosRaw, serviciosOrdenOriginal)

      const packageHistoryRows = await Promise.all(
        serviciosCombinadosBase
          .filter((servicio: any) => servicio.esPaquete && servicio.id)
          .map(async (servicio: any) => {
            try {
              const response = await fetch(`/api/servicioMuestra/${servicio.id}/history?ts=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
              })

              return [servicio.id, response.ok ? await response.json() : []] as const
            } catch {
              return [servicio.id, []] as const
            }
          })
      )

      const packageHistoryMap = new Map<number, any[]>(packageHistoryRows)

      const serviciosCombinados = serviciosCombinadosBase.map((servicio: any) => {
        if (!servicio.esPaquete) return servicio

        const historyRows = packageHistoryMap.get(servicio.id) ?? []
        const subProductos = Array.isArray(servicio.subProductosCodificados) ? servicio.subProductosCodificados : []

        return {
          ...servicio,
          subProductosCodificados: subProductos.map((subProducto: any) => {
            const historyMatch = historyRows.find((historyRow: any) => normalizeText(historyRow?.ensayoServicio) === normalizeText(subProducto.nombre))

            return historyMatch
              ? {
                ...subProducto,
                ensayador: historyMatch.aplicadoA ?? null,
                estado: historyMatch.estNuevo ?? servicio.estado,
                observacion: historyMatch.observacion ?? null
              }
              : subProducto
          })
        }
      })

      setInlineMuestraDetalle({
        ...(data.muestra ?? {}),
        probetas: Array.isArray(muestraRcm?.probetas) ? muestraRcm.probetas : []
      })
      setInlineServicios(serviciosCombinados)
      setInlineRcmDetalle(detalleRcm)
    } catch {
      resetInlineDetail()
    } finally {
      setLoadingInlineDetalle(false)
    }
  }

  // Igual que handleEdit pero abre en modo solo lectura (readonly=1)
  const handleView = async (row: RCM | null) => {
    console.group('­ƒöì handleView called')
    console.log('row recibido:', row)

    if (!row) {
      console.warn('handleView: no row provided')
      console.groupEnd()

      return
    }

    console.log('row.id:', row.id)
    console.log('row.muestra:', row.muestra)
    console.log('row.muestra.id:', row.muestra?.id)

    if (!row.muestra?.id) {
      console.warn('handleView: muestra sin ID', row.muestra)
      console.groupEnd()

      return
    }

    // Si ya está abierto, cerrar
    if (selectedRowId === row.id) {
      console.log('­ƒöÆ Cerrando formulario')
      resetSelectedDetail()
      console.groupEnd()

      return
    }

    // Ô£à Abrir formulario y cargar datos
    console.log('­ƒöô Abriendo formulario')
    setSelectedRowId(row.id)
    setServiciosMuestra([])
    setMuestraDetalle(null)
    setRcmDetalleModal(null)
    setLoadingServicios(true)

    try {
      const muestraId = row.muestra.id
      const rcmId = row.rcmOriginalId ?? null
      const urlServicios = `/api/muestra/${muestraId}/servicios`

      console.log('­ƒôí Fetching servicios:', urlServicios)

      const [responseServicios, responseRcm] = await Promise.all([
        fetch(urlServicios, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        rcmId
          ? fetch(`/api/rcm/${rcmId}?ts=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          })
          : Promise.resolve(null)
      ])

      if (!responseServicios.ok) {
        throw new Error(`HTTP ${responseServicios.status}`)
      }

      const data = await responseServicios.json()
      const detalleRcm = responseRcm && responseRcm.ok ? await responseRcm.json() : null

      const muestraRcm = Array.isArray(detalleRcm?.muestras)
        ? detalleRcm.muestras.find((m: any) => Number(m?.id) === Number(muestraId))
        : null

      const serviciosDetalle = Array.isArray(muestraRcm?.servicios) ? muestraRcm.servicios : []

      const serviciosOrdenOriginal = Array.isArray(detalleRcm?.servicios) && detalleRcm.servicios.length > 0
        ? detalleRcm.servicios
        : serviciosDetalle

      const serviciosCombinadosRaw = (Array.isArray(data.servicios) ? data.servicios : []).map((servicio: any) => {
        const match = findDetalleServicioMatch(servicio, serviciosDetalle)
        const subProductosCodificados = getCodifiedSubProductos(servicio, serviciosOrdenOriginal)

        const estadoResuelto = resolveServiceStateFromRcm(
          servicio?.estado ?? match?.estado ?? 'CODIFICADO',
          detalleRcm?.rcmType,
          detalleRcm?.estadoOperativo
        )


        return {
          ...servicio,
          norma: servicio?.norma ?? match?.producto?.norma ?? match?.norma ?? null,
          codigo: servicio?.codigo ?? match?.producto?.sku ?? match?.codigo ?? null,
          cantidad: servicio?.cantidad ?? match?.cantidad ?? 1,
          estado: estadoResuelto,
          subProductosCodificados
        }
      })

      const serviciosCombinadosBase = sortServiciosByDetalleOrder(serviciosCombinadosRaw, serviciosOrdenOriginal)

      const packageHistoryRows = await Promise.all(
        serviciosCombinadosBase
          .filter((servicio: any) => servicio.esPaquete && servicio.id)
          .map(async (servicio: any) => {
            try {
              const response = await fetch(`/api/servicioMuestra/${servicio.id}/history?ts=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
              })

              return [servicio.id, response.ok ? await response.json() : []] as const
            } catch {
              return [servicio.id, []] as const
            }
          })
      )

      const packageHistoryMap = new Map<number, any[]>(packageHistoryRows)

      const serviciosCombinados = serviciosCombinadosBase.map((servicio: any) => {
        if (!servicio.esPaquete) return servicio

        const historyRows = packageHistoryMap.get(servicio.id) ?? []
        const subProductos = Array.isArray(servicio.subProductosCodificados) ? servicio.subProductosCodificados : []

        return {
          ...servicio,
          subProductosCodificados: subProductos.map((subProducto: any) => {
            const historyMatch = historyRows.find((historyRow: any) => normalizeText(historyRow?.ensayoServicio) === normalizeText(subProducto.nombre))

            return historyMatch
              ? {
                ...subProducto,
                ensayador: historyMatch.aplicadoA ?? null,
                estado: historyMatch.estNuevo ?? servicio.estado,
                observacion: historyMatch.observacion ?? null
              }
              : subProducto
          })
        }
      })

      console.log('Ô£à Datos cargados:', data)

      // Ô£à AGREGAR: Log detallado de servicios
      console.group('­ƒöì DEBUG servicios cargados')
      console.log('Total servicios:', data.servicios?.length ?? 0)

      if (data.servicios && data.servicios.length > 0) {
        console.log('Primer servicio completo:', data.servicios[0])
        console.log('IDs de servicios:', data.servicios.map((s: any) => ({
          id: s.id,
          servicioMuestraId: s.servicioMuestraId,
          servicioId: s.servicioId,
          _id: s._id,
          nombre: s.nombre,
          codigo: s.codigo
        })))
      }

      console.groupEnd()

      setMuestraDetalle({
        ...(data.muestra ?? {}),
        probetas: Array.isArray(muestraRcm?.probetas) ? muestraRcm.probetas : []
      })
      setServiciosMuestra(serviciosCombinados)
      setRcmDetalleModal(detalleRcm)
    } catch (err) {
      console.error('ÔØî Error loading servicios:', err)
      setServiciosMuestra([])
      setMuestraDetalle(null)
      setRcmDetalleModal(null)
    } finally {
      setLoadingServicios(false)
      console.groupEnd()
    }
  }

  const handleGenerateInforme = (rowId: number | null) => {
    console.log('Generar Informe', rowId)
    handleCloseRowMenu()
    if (typeof window !== 'undefined' && rowId != null) window.open(`/informes/generar/${rowId}`, '_blank')
  }

  // mock helper para historial (a├▒adir aqu├¡)
  const getMockHistEntries = (rowId: number | null) => {
    return [
      {
        registro: '04/03/2024-17:07',
        funcionario: 'Paola Mena',
        tipo: 'Ope',
        estAnterior: 'Firmado',
        estNuevo: 'Env-Cliente',
        informe: 1,
        fechaAccion: '04/03/2024',
        observacion: 'Codificar, automático'
      },
      {
        registro: '04/03/2024-18:10',
        funcionario: 'Cristian Salinas',
        tipo: 'Adm',
        estAnterior: 'Facturado',
        estNuevo: 'Pagado',
        informe: '---',
        fechaAccion: '04/03/2024',
        observacion: 'Procesar Abonos, automático'
      }
    ]
  }

  const handleHistorial = async (rowId: number | null) => {
    if (!rowId) {
      console.warn('handleHistorial: no rowId provided')

      return
    }

    // UX: abrir di├ílogo de inmediato y mostrar spinner mientras carga
    setHistRowId(rowId)
    setHistRows([])
    setHistDialogOpen(true)

    // revisar cach├® primero
    const cached = historyCache.get(rowId)

    if (cached) {
      setHistRows(cached)
      setHistLoading(false)

      return
    }

    setHistLoading(true)

    try {
      // si tu API soporta limitar campos/registros, a├▒ade query params (?limit=20)
      const res = await fetch(`/api/rcm/${rowId}/history`)

      if (!res.ok) {
        const txt = await res.text().catch(() => '')

        console.error('History API returned not ok:', res.status, txt)
        throw new Error('Error loading history')
      }

      const json = await res.json()
      const rows = Array.isArray(json) ? json : []


      // guardar en cach├® para evitar refetchs posteriores
      historyCache.set(rowId, rows)
      setHistRows(rows)
    } catch (err) {
      console.error('Error loading history (fallback to mock):', err)
      setHistRows(getMockHistEntries(rowId))
    } finally {
      setHistLoading(false)
      handleCloseRowMenu()
    }
  }

  // Ô£à AGREGAR: Funci├│n para manejar historial de servicioMuestra
  const handleHistorialServicio = async (servicioMuestraId: number | null) => {
    if (!servicioMuestraId) {
      console.warn('handleHistorialServicio: no servicioMuestraId provided')

      return
    }

    console.group('­ƒôï handleHistorialServicio')
    console.log('servicioMuestraId:', servicioMuestraId)

    setHistServicioId(servicioMuestraId)
    setHistServicioRows([])
    setHistServicioDialogOpen(true)

    // Revisar cach├®
    const cached = servicioHistoryCache.get(servicioMuestraId)

    if (cached) {
      console.log('Ô£à Using cached data:', cached)
      setHistServicioRows(cached)
      setHistServicioLoading(false)
      console.groupEnd()

      return
    }

    setHistServicioLoading(true)

    try {
      const url = `/api/servicioMuestra/${servicioMuestraId}/history`

      console.log('­ƒôí Fetching:', url)

      const res = await fetch(url)

      console.log('­ƒôÑ Response status:', res.status)
      console.log('­ƒôÑ Response headers:', Object.fromEntries(res.headers.entries()))

      if (!res.ok) {
        const txt = await res.text().catch(() => '')

        console.error('ÔØî API error:', res.status, txt)
        throw new Error(`HTTP ${res.status}: ${txt}`)
      }

      const json = await res.json()

      console.log('Ô£à Response JSON:', json)

      const rows = Array.isArray(json) ? json : []

      console.log('­ƒôè Rows count:', rows.length)

      // Guardar en cach├®
      servicioHistoryCache.set(servicioMuestraId, rows)
      setHistServicioRows(rows)
    } catch (err) {
      console.error('ÔØî Error loading servicio history:', err)
      setHistServicioRows([])
    } finally {
      setHistServicioLoading(false)
      console.groupEnd()
    }
  }


  // En handleMarkAs, despu├®s de invalidar servicioHistoryCache.delete(markRowId)
  const handleMarkAs = async (nuevoEstado: string) => {
    if (!markRowId) {
      console.warn('handleMarkAs: no markRowId')

      return
    }

    console.group('­ƒöä handleMarkAs')
    console.log('servicioMuestraId:', markRowId)
    console.log('nuevo estado:', nuevoEstado)

    // Buscar el servicio para obtener estado actual
    const servicio = serviciosMuestra.find(
      s => (s.id ?? s.servicioMuestraId ?? s.servicioId) === markRowId
    )

    const estadoActual = servicio?.estado ?? servicio?.estadoServicio ?? 'CODIFICADO'

    try {
      // Ô£à CORRECCI├ôN: Asegurar que servicioMuestraId se env├¡e correctamente
      const payload = {
        servicioMuestraId: markRowId,
        tipo: 'CAMBIO_ESTADO',
        estAnterior: estadoActual,
        estNuevo: nuevoEstado,
        funcionario: getCurrentUserName() ?? 'Usuario',
        aplicadoA: 'SERVICIO',
        ensayoServicio: servicio?.nombre ?? servicio?.servicio?.nombre ?? null,
        observacion: `Cambio de estado de ${estadoActual} a ${nuevoEstado}`,
        motivo: null,
        informe: null
      }

      const url = `/api/servicioMuestra/${markRowId}/history`

      console.log('­ƒôí POST:', url, payload)

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('­ƒôÑ Response status:', res.status)

      if (!res.ok) {
        const txt = await res.text().catch(() => '')

        console.error('ÔØî API error:', res.status, txt)
        throw new Error(`HTTP ${res.status}: ${txt}`)
      }

      const result = await res.json()

      console.log('Ô£à Estado actualizado:', result)

      // Actualizar UI localmente
      setServiciosMuestra(prev => prev.map(s => {
        const id = s.id ?? s.servicioMuestraId ?? s.servicioId


        return id === markRowId
          ? { ...s, estado: nuevoEstado }
          : s
      }))

      // Ô£à INVALIDAR cach├® del servicio individual
      servicioHistoryCache.delete(markRowId)

      // Ô£à AGREGAR: Invalidar cach├® combinada de la muestra
      const row = findRowById(selectedRowId)

      if (row?.muestra?.id) {
        const cacheKey = `muestra-${row.muestra.id}`

        console.log('Invalidando caché combinada:', cacheKey)
        servicioHistoryCache.delete(cacheKey)
      }

      handleCloseMarkMenu()
    } catch (err) {
      console.error('ÔØî Error updating servicio estado:', err)
      alert('No se pudo actualizar el estado del servicio')
    } finally {
      console.groupEnd()
    }
  }


  const handleCloseHistDialog = () => {
    setHistDialogOpen(false)
    setHistRowId(null)
    setHistRows([])
  }

  const handleCloseHistServicioDialog = () => {
    setHistServicioDialogOpen(false)
    setHistServicioId(null)
    setHistServicioRows([])
  }

  // Fetch RCMs
  useEffect(() => {
    const fetchRCMs = async () => {
      try {
        const res = await fetch(`/api/rcm?ts=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })

        if (!res.ok) {
          throw new Error(`GET /api/rcm failed: ${res.status}`)
        }

        const result = await res.json().catch(() => [])
        const raw = Array.isArray(result) ? result : []

        // --- fetch obras (igual que ya tienes) ---
        const obraIds = Array.from(new Set(raw.map((r: any) => (r.obraId ?? r.obra?.id) as number).filter(Boolean))) as number[]
        const obraMap: Record<number, any> = {}

        await Promise.all(
          obraIds.map(async id => {
            try {
              const or = await fetch(`/api/obra/${id}`)

              if (!or.ok) {
                console.warn(`obra ${id} responded not ok:`, or.status)

                return
              }

              const ct = (or.headers.get('content-type') || '').toLowerCase()

              if (ct.includes('application/json')) {
                obraMap[id] = await or.json()
              } else {
                console.warn(`obra ${id} returned non-json`)
              }
            } catch (e) {
              console.warn('No se pudo cargar obra', id, e)
            }
          })
        )

        // Ô£à AGREGAR: fetch clientes
        const clienteIds = Array.from(new Set(raw.map((r: any) => r.clienteId ?? r.cliente?.id).filter(Boolean)))
        const clienteMap: Record<string, any> = {}

        if (clienteIds.length > 0) {
          console.log('­ƒöì Fetching clientes:', clienteIds)
          await Promise.all(
            clienteIds.map(async id => {
              try {
                const res = await fetch(`/api/cliente/${id}`)

                if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                  const data = await res.json()

                  clienteMap[String(id)] = data
                  console.log(`Ô£à Loaded cliente ${id}:`, data)
                }
              } catch (e) {
                console.warn('No se pudo cargar cliente', id, e)
              }
            })
          )
          console.log('­ƒôª clienteMap final:', clienteMap)
        }

        // DEBUG: mostrar muestra de clienteMap
        if (Object.keys(clienteMap).length) {
          console.debug('clienteMap sample:', Object.keys(clienteMap)[0], clienteMap[Object.keys(clienteMap)[0]])
        }

        // --- fetch ordenes de trabajo ---
        const hasOrderDataInRaw = raw.some((r: any) => {
          const ot = r?.ordenTrabajo


          return Boolean(ot?.id || ot?.correlativ || ot?.correlativo || ot?.agenda?.obra || ot?.agenda?.cliente)
        })

        const ordenIds = hasOrderDataInRaw
          ? []
          : Array.from(new Set(raw.map((r: any) => r.ordenTrabajoId ?? r.ordenTrabajo?.id).filter(Boolean)))

        const ordenMap: Record<string | number, any> = {}

        if (ordenIds.length) {
          console.log('­ƒöì Fetching ordenes de trabajo:', ordenIds)
          await Promise.all(
            ordenIds.map(async id => {
              try {
                // Ô£à CAMBIAR el endpoint si es incorrecto
                const or = await fetch(`/api/ot/${id}`) // ÔåÉ cambiar de /api/orden-trabajo/ a /api/ot/

                if (!or.ok) {
                  console.warn(`ÔØî ordenTrabajo ${id} responded ${or.status}`)

                  return
                }

                const ct = (or.headers.get('content-type') || '').toLowerCase()

                if (!ct.includes('application/json')) {
                  const txt = await or.text().catch(() => '')

                  console.warn(`ÔÜá´©Å ordenTrabajo ${id} returned non-json (${ct}):`, txt.slice(0, 200))

                  return
                }

                const data = await or.json()

                ordenMap[String(id)] = data
                console.log(`Ô£à Loaded ordenTrabajo ${id}:`, data)

              } catch (err) {
                console.warn(`ÔØî Error loading ordenTrabajo ${id}:`, err)
              }
            })
          )
          console.log('­ƒôª ordenMap final:', ordenMap)
        }

        // DEBUG: mostrar muestra de ordenMap
        if (Object.keys(ordenMap).length) {
          console.group('­ƒöì DEBUG ordenMap')
          const sampleKeys = Object.keys(ordenMap).slice(0, 3)

          sampleKeys.forEach(key => {
            console.log(`Key: ${key}`, ordenMap[key])
            console.log('  -> correlativo:', ordenMap[key]?.correlativo)
            console.log('  -> correlativ:', ordenMap[key]?.correlativ)
            console.log('  -> numero:', ordenMap[key]?.numero)
          })
          console.groupEnd()
        }

        // --- helper para extraer correlativo de un objeto orden (busca keys comunes y en nested 1 nivel) ---
        const findOrderCorrel = (o: any) => {
          if (!o || typeof o !== 'object') return undefined
          const keys = Object.keys(o)

          // prioridad por nombres comunes
          const prefer = ['correlativ', 'correlativo', 'correlacion', 'correl', 'correlativoNumero', 'numero', 'nro', 'nroOrden', 'correl_id']

          for (const p of prefer) {
            if (p in o && (o[p] || o[p] === 0)) return o[p]
          }


          // buscar cualquier key que contenga 'correl' o 'numero'
          for (const k of keys) {
            if (/correl|numero|nro/i.test(k) && (o[k] || o[k] === 0)) return o[k]
          }


          // buscar 1 nivel nested
          for (const k of keys) {
            const v = o[k]

            if (v && typeof v === 'object') {
              const nested = findOrderCorrel(v)

              if (nested) return nested
            }
          }


          return undefined
        }

        // DEBUG: mostrar muestra de ordenMap para inspecci├│n
        if (Object.keys(ordenMap).length) {
          console.group('­ƒöì DEBUG ordenMap')
          const sampleKeys = Object.keys(ordenMap).slice(0, 3)

          sampleKeys.forEach(key => {
            console.log(`Key: ${key}`, ordenMap[key])
            console.log('  -> correlativo:', ordenMap[key]?.correlativo)
            console.log('  -> correlativ:', ordenMap[key]?.correlativ)
            console.log('  -> numero:', ordenMap[key]?.numero)
          })
          console.groupEnd()
        }

        // --- PRE-FETCH todos los servicioRCM faltantes ---
        const allMuestras = raw.flatMap((r: any) => Array.isArray(r.muestras) ? r.muestras : [])

        // CORRECCI├ôN: buscar servicioId, NO servicioRCMId
        const missingServiceIds = allMuestras
          .filter((m: any) => !m.servicioRCM && (m.servicioRCMId || m.servicioId))
          .map((m: any) => m.servicioRCMId || m.servicioId)
          .filter(Boolean)

        const servicioRCMMap: Record<string, any> = {}

        if (missingServiceIds.length > 0) {
          console.log('­ƒöì Fetching servicioRCM for IDs:', missingServiceIds)
          await Promise.all(
            missingServiceIds.map(async (id: any) => {
              try {
                const res = await fetch(`/api/servicioRCM/${id}`)

                if (res.ok) {
                  const data = await res.json()

                  servicioRCMMap[String(id)] = data
                  console.log(`Ô£à Loaded servicioRCM ${id}:`, data)
                } else {
                  console.warn(`ÔØî servicioRCM ${id} responded ${res.status}`)
                }
              } catch (e) {
                console.warn('No se pudo cargar servicioRCM', id, e)
              }
            })
          )
          console.log('­ƒôª servicioRCMMap final:', servicioRCMMap)
        }

        // normalizar y enriquecer - EXPANDIR POR MUESTRAS
        const normalized = raw.flatMap((r: any) => {
          let obraObj = r.obra ?? obraMap[r.obraId] ?? obraMap[r.obra?.obraId] ?? null

          let numeroObra =
            obraObj?.numeroObra ??
            obraObj?.numero_obra ??
            obraObj?.numero ??
            obraObj?.numeroobra ??
            (r.obraId ? String(r.obraId) : undefined)

          // normalizar cliente: puede venir como string, objeto con keys distintas o en ra├¡z
          let rawCliente = r.cliente ?? r.clienteData ?? r.clienteInfo ?? null


          // si no hay objeto cliente, intentar resolver desde clienteMap usando clienteId
          if (!rawCliente) {
            const cid = r.clienteId ?? r.clienteid ?? r.cliente_id ?? r.cliente?.clienteId ?? null

            if (cid != null) {
              rawCliente = clienteMap[String(cid)] ?? rawCliente
            }
          }

          let clienteNombre: string | undefined = undefined
          let clienteComuna: string | undefined = undefined
          let clienteCiudad: string | undefined = undefined
          let clienteRegion: string | undefined = undefined
          let clienteRut: string | undefined = undefined

          if (rawCliente) {
            if (typeof rawCliente === 'string') {
              clienteNombre = rawCliente
            } else if (typeof rawCliente === 'object') {
              clienteNombre = rawCliente.nombreCliente ?? rawCliente.nombre ?? rawCliente.name ?? rawCliente.razonSocial ?? rawCliente.razon_social ?? rawCliente.nombre_cliente
              clienteComuna = rawCliente.comuna ?? rawCliente.comunaName ?? rawCliente.comuna_nombre ?? rawCliente.city ?? rawCliente.localidad
              clienteCiudad = rawCliente.ciudad ?? rawCliente.city ?? rawCliente.localidad ?? undefined
              clienteRegion = rawCliente.region ?? rawCliente.regionNombre ?? undefined
              clienteRut = rawCliente.rut ?? rawCliente.rutCliente ?? rawCliente.rut_cliente ?? undefined
            }
          }


          // fallback a campos en ra├¡z si existen
          clienteNombre = clienteNombre ?? r.clienteNombre ?? r.nombreCliente ?? r.cliente_name ?? r.cliente_nombre ?? r.nombre
          clienteComuna = clienteComuna ?? r.clienteComuna ?? r.comuna ?? r.comunaCliente ?? null
          clienteCiudad = clienteCiudad ?? r.ciudadCliente ?? r.ciudad ?? null
          clienteRegion = clienteRegion ?? r.regionCliente ?? r.region ?? null
          clienteRut = clienteRut ?? r.rutCliente ?? r.rut ?? null

          // DEBUG: logear informaci├│n para investigar por qu├® cliente/comuna quedan vac├¡os
          // eslint-disable-next-line no-console
          console.debug('normalizeCliente:', {
            rowId: r.id ?? r._id ?? null,
            rawCliente,
            resolvedNombre: clienteNombre,
            resolvedComuna: clienteComuna,
            fallbacks: {
              r_cliente: r.cliente,
              r_clienteNombre: r.clienteNombre,
              r_comuna: r.comuna,
              r_clienteComuna: r.clienteComuna
            }
          })

          // --- CORRECCI├ôN: NORMALIZAR ORDEN DE TRABAJO ---
          const orderKey = r.ordenTrabajoId ?? r.ordenTrabajo?.id ?? r.ordenTrabajo?._id ?? ''
          const orderObj = orderKey ? (ordenMap[String(orderKey)] ?? null) : null
          const orderFromRow = r.ordenTrabajo ?? null

          const obraFromOrder =
            orderObj?.agenda?.obra ??
            orderObj?.obra ??
            orderFromRow?.agenda?.obra ??
            orderFromRow?.obra ??
            null

          const clienteFromOrder =
            orderObj?.agenda?.cliente ??
            orderObj?.cliente ??
            orderFromRow?.agenda?.cliente ??
            orderFromRow?.cliente ??
            null

          if (!obraObj && obraFromOrder) {
            obraObj = obraFromOrder
          }

          if (!numeroObra) {
            numeroObra =
              obraFromOrder?.numeroObra ??
              obraFromOrder?.numero_obra ??
              obraFromOrder?.numero ??
              obraFromOrder?.numeroobra ??
              obraFromOrder?.nombreObra ??
              undefined
          }

          if (!rawCliente && clienteFromOrder) {
            rawCliente = clienteFromOrder
          }

          clienteNombre =
            clienteNombre ??
            clienteFromOrder?.nombreCliente ??
            clienteFromOrder?.nombre ??
            clienteFromOrder?.razonSocial ??
            obraObj?.nombreCliente ??
            undefined

          clienteComuna =
            clienteComuna ??
            clienteFromOrder?.comuna ??
            obraObj?.comuna ??
            null

          clienteCiudad =
            clienteCiudad ??
            clienteFromOrder?.ciudad ??
            obraObj?.comuna ??
            null

          clienteRegion =
            clienteRegion ??
            clienteFromOrder?.region ??
            obraObj?.region ??
            null

          clienteRut =
            clienteRut ??
            clienteFromOrder?.rut ??
            obraObj?.rut ??
            null

          // Ô£à CORRECCI├ôN: priorizar 'correlativ' (sin 'o')
          const orderCorrel =
            orderObj?.correlativ ??           // ÔåÉ PRIMERO: campo exacto de la BD
            r.ordenTrabajo?.correlativ ??     // ÔåÉ backup desde objeto anidado
            orderObj?.correlativo ??          // ÔåÉ fallback con 'o'
            orderObj?.numero ??               // ÔåÉ agregar correlativo como ├║ltimo recurso
            r.ordenTrabajo?.correlativo ??    // ÔåÉ tambi├®n desde r.ordenTrabajo
            r.ot ??                           // ÔåÉ ├║ltimo recurso: r.ot
            null

          // LOG DETALLADO para debugging - MOSTRAR TODOS LOS CAMPOS del orderObj
          if (r.id <= 3) {
            console.group(`­ƒöº DEBUG OT - RCM ${r.id}`)
            console.log('orderKey:', orderKey)
            console.log('­ƒôª orderObj COMPLETO (todos los campos):', orderObj)
            console.log('­ƒöì Object.keys(orderObj):', orderObj ? Object.keys(orderObj) : [])
            console.log('Ô£à orderObj.correlativ (SIN o):', orderObj?.correlativ)
            console.log('ÔÜá´©Å orderObj.correlativo (CON o):', orderObj?.correlativo)
            console.log('orderCorrel final extraído:', orderCorrel)
            console.log('---')
            console.log('r.ordenTrabajo original:', r.ordenTrabajo)
            console.log('r.ot original:', r.ot)
            console.groupEnd()
          }

          // Normalizar objeto ordenTrabajo
          const ordenTrabajoNormalized = {
            ...(orderObj ?? r.ordenTrabajo ?? {}),
            id: r.ordenTrabajoId ?? orderObj?.id ?? r.ordenTrabajo?.id ?? undefined,
            correlativ: orderCorrel,  // Ô£à usar 'correlativ' como campo principal
            correlativo: orderCorrel  // mantener ambas versiones por compatibilidad
          }

          // otDisplay: usar correlativo si existe
          const otDisplay = orderCorrel ? String(orderCorrel) : null

          console.debug('OT Normalization:', {
            rcmId: r.id,
            orderKey,
            orderObj: orderObj ? { id: orderObj.id, correlativo: orderObj.correlativo } : null,
            orderCorrel,
            otDisplay,
            raw_ot: r.ot,
            raw_ordenTrabajoId: r.ordenTrabajoId
          })

          // EXPANDIR POR MUESTRAS
          const muestras = Array.isArray(r.muestras) && r.muestras.length > 0
            ? r.muestras
            : [{ id: null, numeroMuestra: '-', servicio: null, cantidad: 0, estado: null }]

          return muestras.map((muestra: any, idx: number) => {
            // Ô£à DEBUG: Verificar TODOS los campos de muestra
            if (r.id <= 3) { // solo primeros 3 RCMs
              console.group(`­ƒöì DEBUG MUESTRA COMPLETA - RCM ${r.id}-${idx}`)
              console.log('­ƒôª muestra RAW (todos los campos):', muestra)
              console.log('­ƒôï Keys disponibles en muestra:', Object.keys(muestra))
              console.log('­ƒöó numeroTarjeta directo:', muestra.numeroTarjeta)
              console.log('­ƒöó numero_tarjeta:', muestra.numero_tarjeta)
              console.log('­ƒöó tarjeta.numero:', muestra.tarjeta?.numero)
              console.log('­ƒöó tarjeta.numeroTarjeta:', muestra.tarjeta?.numeroTarjeta)
              console.log('­ƒöó nroTarjeta:', muestra.nroTarjeta)
              console.log('­ƒöó nro_tarjeta:', muestra.nro_tarjeta)
              console.log('­ƒöó cardNumber:', muestra.cardNumber)
              console.log('­ƒöó card_number:', muestra.card_number)
              console.groupEnd()
            }

            // CASCADA DE FALLBACKS PARA PRODUCTO
            let producto = null

            // 1) Desde servicioRCM (si existe)
            let servicioRCM = muestra.servicioRCM ?? muestra.servicio_rcm ?? null

            if (!servicioRCM && (muestra.servicioRCMId || muestra.servicioId)) {
              const serviceKey = muestra.servicioRCMId || muestra.servicioId

              servicioRCM = servicioRCMMap[String(serviceKey)] ?? null
            }

            const servicio = servicioRCM?.servicio ?? null

            producto = servicio?.producto ?? null

            // 2) Fallback: servicio directo en muestra (sin pasar por servicioRCM)
            if (!producto) {
              const directServicio = muestra.servicio ?? muestra.servicioData ?? null

              producto = directServicio?.producto ?? null
            }

            // 3) Fallback: array servicios en RCM ra├¡z
            if (!producto && Array.isArray(r.servicios) && r.servicios.length > 0) {
              const svc = r.servicios[0]

              producto = svc.producto ?? svc.servicio?.producto ?? null
            }

            // 4) Fallback: servicio directo en RCM ra├¡z
            if (!producto) {
              producto = r.servicio?.producto ?? r.servicioData?.producto ?? r.producto ?? null
            }

            // Extraer ├írea y familia del producto con m├║ltiples fallbacks
            const areaProducto = producto?.area?.nombre ??
              producto?.area?.name ??
              producto?.areaNombre ??  // ÔåÉ CORREGIDO
              (typeof producto?.area === 'string' ? producto.area : null)

            const familiaProducto = producto?.familia?.nombre ??
              producto?.familia?.name ??
              producto?.familiaNombre ??  // ÔåÉ CORREGIDO
              (typeof producto?.familia === 'string' ? producto.familia : null)

            const toLabel = (value: any): string | null => {
              if (typeof value === 'string') {
                const v = value.trim()

                return v || null
              }

              if (value && typeof value === 'object') {
                const fromObj = String(value?.nombre ?? value?.name ?? '').trim()

                return fromObj || null
              }

              return null
            }

            const areaRcm = toLabel(r.area)
            const familiaRcm = toLabel(r.familia)
            const tipoServicioRcm = toLabel((r as any).tipoServicio)
            const tipoServicioMuestra = toLabel(muestra?.tipoServicio)

            // Fallbacks finales desde RCM ra├¡z
            const areaFinal = areaRcm ?? areaProducto ?? null
            const familiaFinal = familiaRcm ?? familiaProducto ?? null
            const serviciosMuestra = Array.isArray(muestra.servicios) ? muestra.servicios : []
            const serviciosParaConteo = Array.isArray(r.servicios) && r.servicios.length > 0 ? r.servicios : serviciosMuestra
            const totalEnsayos = countDetailedEnsayos(serviciosParaConteo)

            const rcmTypeNorm = String((r as any)?.rcmType ?? '').toUpperCase().trim()
            const rcmEstadoNorm = String(r.estadoOperativo ?? '').toUpperCase().trim()

            const rcmAutoCompletado =
              (rcmTypeNorm === 'CONTROL' && rcmEstadoNorm === 'ENSAYADO') ||
              (rcmTypeNorm === 'SERVICIO' && (rcmEstadoNorm === 'EJECUTADO' || rcmEstadoNorm === 'ENSAYADO'))

            const ensayados = serviciosMuestra.reduce((acc: number, servicioItem: any) => {
              const estadoServicio = String(servicioItem?.estado ?? '').toUpperCase().trim()

              return acc + ((estadoServicio === 'ENSAYADO' || estadoServicio === 'EJECUTADO') ? Number(servicioItem?.cantidad ?? 1) : 0)
            }, 0)

            const ensayadosResueltos = rcmAutoCompletado ? totalEnsayos : ensayados

            const estadosServicios = serviciosMuestra
              .map((servicioItem: any) => String(servicioItem?.estado ?? '').toUpperCase().trim())
              .filter((estado: string) => Boolean(estado))

            const estadoDesdeEnsayo = estadosServicios.includes('EN_PROCESO')
              ? 'EN_PROCESO'
              : estadosServicios.includes('CODIFICADO')
                ? 'CODIFICADO'
                : estadosServicios.includes('ENSAYADO')
                  ? 'ENSAYADO'
                  : estadosServicios.includes('EJECUTADO')
                    ? 'EJECUTADO'
                    : (estadosServicios[0] ?? '')

            const probetas = Array.isArray(muestra.probetas) ? muestra.probetas : []

            const nextProbeta = probetas
              .map((probeta: any) => ({
                ...probeta,
                fechaVencimiento: probeta?.fechaVencimiento ?? null
              }))
              .filter((probeta: any) => {
                if (!probeta.fechaVencimiento) return false

                const estado = String(probeta?.estado ?? 'CODIFICADO').toUpperCase().trim()

                return estado === 'CODIFICADO'
              })
              .sort((left: any, right: any) => compareDateOnly(left.fechaVencimiento, right.fechaVencimiento))[0] ?? null

            const tipoServicio =
              tipoServicioMuestra ??
              familiaFinal ??
              tipoServicioRcm ??
              servicio?.nombre ??
              servicioRCM?.nombre ??
              serviciosMuestra[0]?.nombre ??
              null

            const ensayoServicioNombres = Array.from(
              new Set(
                [
                  ...(Array.isArray(serviciosMuestra)
                    ? serviciosMuestra.map((sm: any) => String(sm?.nombre ?? '').trim())
                    : []),
                  String(tipoServicio ?? '').trim(),
                  String(familiaFinal ?? '').trim()
                ].filter(Boolean)
              )
            )

            const ss = r.ss ?? orderObj?.clave ?? r.ordenTrabajo?.clave ?? null


            // Ensayador de laboratorio: viene del historial de servicios (aplicadoA), fallback al usuario de OT
            const ensayadorDesdeServicio = serviciosMuestra
              .map((sm: any) => sm?.history?.[0]?.aplicadoA ?? sm?.aplicadoA ?? null)
              .find((e: string | null) => Boolean(e)) ?? null

            const ensayador = ensayadorDesdeServicio ?? null

            const estadoMuestraResuelto = rcmAutoCompletado
              ? (rcmEstadoNorm ||
                String(muestra.estado ?? '').trim() ||
                String(servicioRCM?.estado ?? '').trim() ||
                estadoDesdeEnsayo ||
                '')
              : (String(r.estadoOperativo ?? '').trim() ||
                String(muestra.estado ?? '').trim() ||
                String(servicioRCM?.estado ?? '').trim() ||
                estadoDesdeEnsayo ||
                '')

            // LOG (mantener solo para debug)
            console.group(`­ƒöì DEBUG Muestra ${r.id}-${idx}`)
            console.log('­ƒôª Muestra:', muestra)
            console.log('­ƒöù servicioRCM:', servicioRCM)
            console.log('ÔÜÖ´©Å servicio:', servicio)
            console.log('­ƒôï producto final:', producto)
            console.log('Ô£à area:', areaFinal)
            console.log('Ô£à familia:', familiaFinal)
            console.groupEnd()

            return {
              id: Number(`${r.id}${String(idx).padStart(3, '0')}`),
              rcmOriginalId: r.id,
              numeroRcm: r.numeroRcm,
              rcmType: (r as any)?.rcmType ?? null,
              sede: r.sede ?? null,

              // Ô£à Agregar numeroTarjeta al objeto retornado
              numeroTarjeta: muestra.numeroTarjeta ??
                muestra.numero_tarjeta ??
                muestra.nroTarjeta ??
                muestra.nro_tarjeta ??
                muestra.tarjeta?.numero ??
                muestra.tarjeta?.numeroTarjeta ??
                muestra.cardNumber ??
                muestra.card_number ??
                null,

              ot: otDisplay,
              otDisplay: otDisplay,
              ss,
              ordenTrabajo: ordenTrabajoNormalized,
              ordenTrabajoId: ordenTrabajoNormalized.id,

              fechaCodificacion: r.fechaCodificacion,
              fechaMuestreo: r.fechaMuestreo,
              fechaIngreso: r.fechaIngreso ?? null,
              tipoMaterial: muestra.tipoMaterial ?? r.tipoMaterial ?? null,
              estadoMuestra: estadoMuestraResuelto,
              estadoOperativo: estadoMuestraResuelto,
              estadoAdministrativo: r.estadoAdministrativo ?? r.estado_administrativo ?? '',
              tipoServicio,
              ensayoServicioNombres,
              proximoVencimiento: nextProbeta?.fechaVencimiento ?? null,
              diasVencimiento: nextProbeta?.fechaVencimiento ? diffDaysFromToday(nextProbeta.fechaVencimiento) : null,
              cantidadProbetas: probetas.length,
              ensayador,
              ensayos: {
                total: totalEnsayos,
                ensayados: ensayadosResueltos,
                pendientes: Math.max(0, totalEnsayos - ensayadosResueltos)
              },
              cliente: {
                nombreCliente: clienteNombre ?? null,
                comuna: clienteComuna ?? null,
                ciudad: clienteCiudad ?? null,
                region: clienteRegion ?? null,
                rut: clienteRut ?? null,
                raw: rawCliente ?? null
              },
              obra: {
                numeroObra: numeroObra ?? undefined,
                nombreObra: obraObj?.nombreObra ?? obraFromOrder?.nombreObra ?? undefined,
                comuna: obraObj?.comuna ?? obraFromOrder?.comuna ?? undefined,
                region: obraObj?.region ?? obraFromOrder?.region ?? undefined,
                mandante: obraObj?.mandante ?? obraFromOrder?.mandante ?? undefined
              },
              area: areaFinal,
              familia: familiaFinal,
              muestra: {
                id: muestra.id,
                numeroMuestra: muestra.numeroMuestra || '-',
                cantidad: muestra.cantidad ?? muestra.cantidadMuestras ?? 1,
                estado: muestra.estado,
                numeroTarjeta: muestra.numeroTarjeta ?? muestra.numero_tarjeta ?? null,
                servicioRCM: servicioRCM ? {
                  id: servicioRCM.id,
                  estado: servicioRCM.estado,
                  servicio: servicio
                } : null
              }
            }
          })
        })

        console.log('Normalized data sample with area/familia:', normalized.slice(0, 3))

        // LOG ADICIONAL: Verificar estructura final
        console.group('VERIFICACIÓN FINAL DE DATOS')
        console.log('Total registros normalizados:', normalized.length)
        console.log('Primeros 3 registros completos:', normalized.slice(0, 3))
        console.log('---')
        console.log('Áreas encontradas:', normalized.slice(0, 10).map((n, i) => ({
          index: i,
          id: n.id,
          area: n.area,
          areaEnMuestra: n.muestra?.servicioRCM?.servicio?.producto?.area
        })))
        console.log('---')
        console.log('Familias encontradas:', normalized.slice(0, 10).map((n, i) => ({
          index: i,
          id: n.id,
          familia: n.familia,
          familiaEnMuestra: n.muestra?.servicioRCM?.servicio?.producto?.familia
        })))
        console.groupEnd()

        setData(normalized)
        applyDateFilter(normalized, filters)
      } catch (err) {
        console.error('Error fetching RCMs:', err)
      } finally {
        setLoading(false
        )
      }
    }

    fetchRCMs()
  }, [])

  // Auto-seleccionar fila si llega rcmId como query param
  const initialRcmSelected = useRef(false)

  useEffect(() => {
    if (!initialRcmIdParam || initialRcmSelected.current || data.length === 0) return
    const matchRow = data.find(d => d.rcmOriginalId === initialRcmIdParam)

    if (matchRow) {
      initialRcmSelected.current = true
      handleView(matchRow)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // aplicar filtro cuando cambian filters
  useEffect(() => {
    console.log('UserListTable - filters changed:', filters)
    applyDateFilter(data, filters)
  }, [filters, data, hideControlServicio])

  const toDateOnly = (input: any): Date | null => {
    if (!input) return null

    // Si ya es Date
    if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), input.getDate())
    const s = String(input).trim()

    // Fecha pura YYYY-MM-DD: respetar día exacto sin shift por timezone.
    const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)

    if (ymd) {
      return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    }

    // Fecha pura DD-MM-YYYY o DD/MM/YYYY.
    const dmy = s.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/)

    if (dmy) {
      return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]))
    }

    // Fallback: crear Date y tomar s├│lo la parte fecha local
    const d = new Date(s)

    if (isNaN(d.getTime())) return null

    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }

  const compareDateOnly = (a: any, b: any): number => {
    const da = toDateOnly(a)
    const db = toDateOnly(b)

    if (!da && !db) return 0
    if (!da) return 1
    if (!db) return -1

    return da.getTime() - db.getTime()
  }

  const parseLeadingNumber = (value: any): number | null => {
    const raw = String(value ?? '').trim()

    if (!raw) return null

    const direct = Number(raw)

    if (Number.isFinite(direct)) return direct

    const match = raw.match(/(\d+)/)

    if (!match) return null

    const parsed = Number(match[1])


    return Number.isFinite(parsed) ? parsed : null
  }

  const sortRowsByDefault = (rows: RCM[]) => {
    return rows.slice().sort((a, b) => {
      const aNum = parseLeadingNumber(a.numeroRcm)
      const bNum = parseLeadingNumber(b.numeroRcm)

      if (aNum != null && bNum != null && aNum !== bNum) return bNum - aNum
      if (aNum == null && bNum != null) return 1
      if (aNum != null && bNum == null) return -1

      const byIngreso = compareDateOnly(a.fechaIngreso, b.fechaIngreso)

      if (byIngreso !== 0) return -byIngreso

      const byCod = compareDateOnly(a.fechaCodificacion, b.fechaCodificacion)

      if (byCod !== 0) return -byCod

      return Number(b.id ?? 0) - Number(a.id ?? 0)
    })
  }

  // helper: formatear fecha a DD/MM/AAAA (ahora incluye HH:MM:SS)
  const formatDateDDMMYYYY = (v: any) => {
    if (!v) return '-'
    const d = v instanceof Date ? v : new Date(v)

    if (isNaN(d.getTime())) return '-'
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')


    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`
  }

  // helper: formatear s├│lo fecha a DD/MM/AAAA (sin hora)
  const formatDateDDMMYYYYDateOnly = (v: any) => {
    if (!v) return '-'
    const d = toDateOnly(v)

    if (!d || isNaN(d.getTime())) return '-'
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()


    return `${dd}/${mm}/${yyyy}`
  }

  const formatDateDDMMYYYYDateOnlyDash = (v: any) => {
    if (!v) return '-'
    const d = toDateOnly(v)

    if (!d || isNaN(d.getTime())) return '-'
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()


    return `${dd}-${mm}-${yyyy}`
  }

  const formatDateLikeDDMMYYYYDash = (raw: string | null | undefined) => {
    const s = String(raw ?? '').trim()

    if (!s) return null
    const t = s.replace(/\//g, '-').trim()

    if (/^\d{2}-\d{2}-\d{4}$/.test(t)) return t
    if (/^\d{2}-\d{2}-\d{2}$/.test(t)) return t
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return formatDateDDMMYYYYDateOnlyDash(t)

    const d = new Date(t)

    if (isNaN(d.getTime())) return null

    return formatDateDDMMYYYYDateOnlyDash(d)
  }

  const toDateInputValue = (raw: any) => {
    const d = toDateOnly(raw)

    if (!d) return ''

    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return `${y}-${m}-${day}`
  }

  const toDateTimeInputValue = (raw: any) => {
    if (!raw) return ''

    const date = new Date(raw)

    if (Number.isNaN(date.getTime())) return ''

    const pad = (value: number) => String(value).padStart(2, '0')

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const getNowDateTimeInputValue = () => toDateTimeInputValue(new Date())

  const getTodayDateInputValue = () => toDateInputValue(new Date())

  const getOperationalLabel = (raw?: string | null) => {
    if (!raw) return '-'
    const key = String(raw).toUpperCase().trim()
    const match = OPERATIONAL_STATES.find(item => item.value === key || item.label.toUpperCase() === key)


    return match?.label ?? raw
  }

  const diffDaysFromToday = (raw?: string | null) => {
    if (!raw) return null
    const date = toDateOnly(raw)
    const today = toDateOnly(new Date())

    if (!date || !today) return null
    const diff = date.getTime() - today.getTime()


    return Math.round(diff / (1000 * 60 * 60 * 24))
  }

  const getEnsayoStatusFlags = (raw?: string | null) => {
    const normalized = String(raw ?? 'CODIFICADO').toUpperCase()

    return {
      esEnsayado: normalized.includes('ENSAYADO'),
      esEnProceso: normalized.includes('PROCESO'),
      esCodificado: !normalized.includes('ENSAYADO') && !normalized.includes('PROCESO')
    }
  }

  const normalizeEnsayoState = (raw?: string | null) => {
    const state = String(raw ?? 'CODIFICADO').toUpperCase()

    if (state.includes('ENSAYADO')) return 'ENSAYADO'
    if (state.includes('PROCESO')) return 'EN_PROCESO'

    return 'CODIFICADO'
  }

  const canTransitionEnsayoState = (fromRaw: string | null | undefined, toRaw: string) => {
    const from = normalizeEnsayoState(fromRaw)
    const to = normalizeEnsayoState(toRaw)

    if (from === 'ENSAYADO') return to === 'ENSAYADO'
    if (from === 'EN_PROCESO') return to === 'EN_PROCESO' || to === 'ENSAYADO'

    // CODIFICADO
    return to === 'CODIFICADO' || to === 'EN_PROCESO'
  }

  const hasAssignedEnsayador = (service: any, currentEnsayador?: string | null) => {
    const resolved = String(currentEnsayador ?? service?.ensayador ?? '').trim()

    return Boolean(resolved)
  }

  const applyEstadoMasivo = (targetState: 'EN_PROCESO' | 'ENSAYADO') => {
    setGestionarEstados(prev => {
      const next = { ...prev }
      let aplicados = 0
      let omitidosTransition = 0
      let omitidosSinEnsayador = 0

      gestionarServicios
        .filter((s: any) => !s._isPaqueteHeader)
        .forEach((s: any) => {
          const key = String(s._syntheticKey ?? s.id)
          const currentState = getEstadoServicioConProbetas(s, prev[key] ?? s.estado ?? 'CODIFICADO')
          const ensayadorActual = gestionarEnsayadores[key] ?? s.ensayador ?? ''

          if (targetState === 'EN_PROCESO' && !hasAssignedEnsayador(s, ensayadorActual)) {
            omitidosSinEnsayador += 1

            return
          }

          if (!canTransitionEnsayoState(currentState, targetState)) {
            omitidosTransition += 1

            return
          }

          const normalizedCurrent = normalizeEnsayoState(currentState)

          if (normalizedCurrent !== targetState) aplicados += 1
          next[key] = targetState
        })

      const omitidos = omitidosTransition + omitidosSinEnsayador

      if (omitidos > 0) {
        const detalle: string[] = []

        if (omitidosTransition > 0) detalle.push(`${omitidosTransition} por transición no permitida`)
        if (omitidosSinEnsayador > 0) detalle.push(`${omitidosSinEnsayador} sin ensayador`)

        setGestionarEstadoMasivoInfo(`${aplicados} actualizados · ${omitidos} omitidos (${detalle.join(' · ')})`)
      } else {
        setGestionarEstadoMasivoInfo(aplicados > 0 ? `${aplicados} actualizados` : 'Sin cambios')
      }

      return next
    })
  }

  const canMarkProbetaAsReady = (probeta?: any) => {
    const daysToDue = diffDaysFromToday(probeta?.fechaVencimiento)

    return daysToDue === null || daysToDue <= 0
  }

  const canProcessProbetaInOrder = (probeta?: any) => {
    if (!probeta || !canMarkProbetaAsReady(probeta)) return false

    const pending = gestionarProbetas
      .filter((item: any) => !String(item?.estado ?? '').toUpperCase().includes('ENSAYADO'))
      .sort((left: any, right: any) => compareDateOnly(left?.fechaVencimiento, right?.fechaVencimiento))

    return pending.length === 0 || Number(pending[0]?.id) === Number(probeta?.id)
  }

  const createEmptySubmuestraFicha = () => ({
    codigoBalanza: '',
    codigoPrensa: '',
    codigoPieMetro: '',
    tipoMuestra: '',
    cargaKn: '',
    masaKg: '',
    alturaMm: '',
    diametroMm: '',
    largoMm: '',
    anchoMm: '',
    tipoFalla: 'A1',
    condicionHumedad: 'HUMEDA',
    observaciones: ''
  })

  const serviceUsesSubmuestras = (service?: any) => {
    if (!service || service._isPaqueteHeader || service._isPaqueteSubItem) return false
    const normalizedName = normalizeText(service?.nombre)

    return normalizedName.includes('probeta') || normalizedName.includes('compresion')
  }

  const getSubmuestrasForService = (service?: any) => {
    if (!serviceUsesSubmuestras(service)) return []

    return gestionarProbetas.slice().sort((a: any, b: any) => Number(a.numero ?? 0) - Number(b.numero ?? 0))
  }

  const getEstadoServicioConProbetas = (service?: any, fallback?: string | null) => {
    if (!serviceUsesSubmuestras(service)) return fallback ?? service?.estado ?? 'CODIFICADO'

    const probetasServicio = getSubmuestrasForService(service)
    const estados = probetasServicio.map((probeta: any) => normalizeEnsayoState(probeta?.estado ?? 'CODIFICADO'))

    if (estados.length > 0 && estados.every((estado: string) => estado === 'ENSAYADO')) return 'ENSAYADO'
    if (estados.some((estado: string) => estado !== 'CODIFICADO')) return 'EN_PROCESO'

    return fallback ?? service?.estado ?? 'CODIFICADO'
  }

  const getSubmuestraFichaKey = (service?: any, probeta?: any) => `${String(service?._syntheticKey ?? service?.id ?? 'svc')}_${String(probeta?.id ?? probeta?.numero ?? 'prob')}`

  const handleOpenGestionarSubmuestra = (service: any, probeta: any) => {
    if (!canProcessProbetaInOrder(probeta)) return

    const fichaKey = getSubmuestraFichaKey(service, probeta)

    setGestionarSubmuestraServicio(service)
    setGestionarSubmuestraActiva(probeta)
    setGestionarSubmuestraFormData(prev => ({
      ...prev,
      [fichaKey]: prev[fichaKey] ?? createEmptySubmuestraFicha()
    }))
    setGestionarSubmuestraDialogOpen(true)
  }

  const handleCloseGestionarSubmuestra = () => {
    setGestionarSubmuestraDialogOpen(false)
    setGestionarSubmuestraServicio(null)
    setGestionarSubmuestraActiva(null)
  }

  const handleSaveGestionarSubmuestra = () => {
    if (!gestionarSubmuestraServicio || !gestionarSubmuestraActiva) return
    if (!canProcessProbetaInOrder(gestionarSubmuestraActiva)) return

    const serviceKey = String(gestionarSubmuestraServicio._syntheticKey ?? gestionarSubmuestraServicio.id)

    setGestionarProbetas(prev => prev.map((probeta: any) => Number(probeta?.id) === Number(gestionarSubmuestraActiva?.id)
      ? { ...probeta, estado: 'ENSAYADO' }
      : probeta))
    setGestionarEstados(prev => ({ ...prev, [serviceKey]: 'ENSAYADO' }))
    handleCloseGestionarSubmuestra()
  }

  const proximaProbetaPendiente = useMemo(() => {
    return gestionarProbetas
      .filter((probeta: any) => {
        if (!probeta?.fechaVencimiento) return false
        const estado = String(probeta?.estado ?? '').toUpperCase()

        return !estado.includes('ENSAYADO')
      })
      .slice()
      .sort((left: any, right: any) => compareDateOnly(left?.fechaVencimiento, right?.fechaVencimiento))[0] ?? null
  }, [gestionarProbetas])

  const diasParaHabilitarEnsayo = proximaProbetaPendiente?.fechaVencimiento
    ? diffDaysFromToday(proximaProbetaPendiente.fechaVencimiento)
    : null

  const puedeIniciarEnsayos = diasParaHabilitarEnsayo === null || diasParaHabilitarEnsayo <= 0

  const mensajeBloqueoEnsayo = !puedeIniciarEnsayos && proximaProbetaPendiente?.fechaVencimiento
    ? `Disponible desde ${formatDateDDMMYYYYDateOnlyDash(proximaProbetaPendiente.fechaVencimiento)}`
    : null

  const getVencimientoMeta = (raw?: string | null, cantidadProbetas = 0) => {
    const formatted = formatDateLikeDDMMYYYYDash(raw)
    const days = diffDaysFromToday(raw)
    const unit = cantidadProbetas === 1 ? 'submuestra' : 'submuestras'

    let status = ''
    let colors = {
      color: '#b26a00',
      borderColor: 'rgba(237, 168, 32, 0.65)',
      backgroundColor: 'rgba(255, 196, 84, 0.14)'
    }

    if (days !== null) {
      if (days < 0) {
        status = `Vencido ${Math.abs(days)}d`
        colors = {
          color: '#d84f2a',
          borderColor: 'rgba(255, 112, 67, 0.7)',
          backgroundColor: 'rgba(255, 138, 101, 0.12)'
        }
      } else if (days === 0) {
        status = 'Hoy'
        colors = {
          color: '#d84f2a',
          borderColor: 'rgba(255, 112, 67, 0.7)',
          backgroundColor: 'rgba(255, 138, 101, 0.12)'
        }
      } else if (days === 1) {
        status = 'Mañana'
      } else {
        status = `En ${days}d`
      }
    }

    return {
      formatted,
      status,
      helper: cantidadProbetas > 0 ? `${cantidadProbetas} ${unit}` : '-',
      colors
    }
  }

  const getEnsayosMeta = (ensayos?: RCM['ensayos']) => {
    const total = Number(ensayos?.total ?? 0)
    const ensayados = Number(ensayos?.ensayados ?? 0)
    const pendientes = Math.max(0, Number(ensayos?.pendientes ?? total - ensayados))

    return { total, ensayados, pendientes }
  }

  const isControlOrServicioRcm = (row: RCM) => {
    const type = String(row?.rcmType ?? '').trim().toUpperCase()

    return type === 'CONTROL' || type === 'SERVICIO'
  }

  const applyDateFilter = (rows: RCM[], filters?: Filters) => {
    console.log('applyDateFilter called, rows:', rows.length, 'filters:', filters)

    // start with all rows
    let result = rows.slice()

    if (hideControlServicio) {
      result = result.filter(row => !isControlOrServicioRcm(row))
    }

    // determine which property to use for date filtering
    const dfRaw = filters?.dateField ? String(filters.dateField).toLowerCase() : ''
    let fieldName: 'fechaCodificacion' | 'fechaMuestreo' | 'fechaIngreso' | 'proximoVencimiento' | null = null

    if (dfRaw === 'fecha_codificacion' || dfRaw === 'fechacodificacion' || dfRaw === 'fecha-codificacion') {
      fieldName = 'fechaCodificacion'
    } else if (dfRaw === 'fecha_muestreo' || dfRaw === 'fechamuestreo' || dfRaw === 'fecha-muestreo') {
      fieldName = 'fechaMuestreo'
    } else if (dfRaw === 'fecha_ingreso' || dfRaw === 'fechaingreso' || dfRaw === 'fecha-ingreso' || dfRaw === 'ingreso') {
      fieldName = 'fechaIngreso'
    } else if (dfRaw === 'fecha_vencimiento' || dfRaw === 'fechavencimiento' || dfRaw === 'fecha-vencimiento' || dfRaw === 'vencimiento') {
      fieldName = 'proximoVencimiento'
    }

    console.log('applyDateFilter -> using date field:', fieldName)

    // Date filtering (permite DESDE y/o HASTA)
    if (fieldName && filters && (filters.start || filters.end)) {
      const start = filters.start ? toDateOnly(filters.start) : null
      const end = filters.end ? toDateOnly(filters.end) : null

      if (start || end) {
        result = result.filter(r => {
          const raw = (r as any)[fieldName]
          const dOnly = toDateOnly(raw)

          if (!dOnly) return false
          if (start && dOnly.getTime() < start.getTime()) return false
          if (end && dOnly.getTime() > end.getTime()) return false

          return true
        })
      }
    }

    // Estado Operativo filtering (if provided) ÔÇö case-insensitive contains
    if (filters && filters.estadoOperativo) {
      const q = String(filters.estadoOperativo).toLowerCase()

      result = result.filter(r => {
        const op = (r.estadoMuestra ?? r.estadoOperativo ?? (Array.isArray(r.servicios) && r.servicios.length ? (r.servicios[0] as any).estado : '') ?? '')


        return String(op).toLowerCase().includes(q)
      })
    }

    if (filters && filters.ensayador) {
      const qEns = normalizeText(filters.ensayador)

      result = result.filter(r => normalizeText(r.ensayador ?? '').includes(qEns))
    }

    // Estado Administrativo filtering (if provided) ÔÇö case-insensitive contains
    if (filters && filters.estadoAdministrativo) {
      const qAdm = String(filters.estadoAdministrativo).toLowerCase()

      result = result.filter(r => {
        const adm =
          r.estadoAdministrativo ??
          r.estado_administrativo ??
          r.estadoAdm ??
          r.estado_adm ??
          r.administrativo ??
          (Array.isArray(r.servicios) && r.servicios.length ? (r.servicios[0] as any).estadoAdministrativo ?? '' : '') ??
          ''


        return String(adm).toLowerCase().includes(qAdm)
      })
    }

    // Area filtering: prefer header.areaName, fallback to header.area or areaId.
    // Compara por nombre normalizado (quita acentos, case-insensitive). Si se env├¡a id num├®rico, lo acepta.
    const areaValue = (filters as any)?.areaName ?? (filters as any)?.area ?? (filters as any)?.areaId ?? null

    if (areaValue !== null && typeof areaValue !== 'undefined' && String(areaValue).toString().trim() !== '') {
      const raw = areaValue
      const rawNorm = normalizeText(raw)
      const isNumeric = /^[0-9]+$/.test(String(raw).trim())
      const targetNum = isNumeric ? Number(raw) : null

      result = result.filter((r: any) => {
        // quick arrays if present
        const areaNamesArr = Array.isArray(r._areaNames) ? r._areaNames.map((x: any) => normalizeText(x)) : []
        const areaIdsArr = Array.isArray(r._areaIds) ? r._areaIds.map((x: any) => Number(x)) : []

        if (isNumeric) {
          if (areaIdsArr.some((id: number) => Number(id) === targetNum)) return true
        } else {
          if (areaNamesArr.some((nm: string) => nm.includes(rawNorm))) return true
        }

        // check common top-level fields
        try {
          // r.area puede ser string o objeto { nombre | name }
          const topAreaName = r.area?.nombre ?? r.area?.name ?? r.area

          if (!isNumeric && topAreaName && normalizeText(topAreaName).includes(rawNorm)) return true

          if (isNumeric) {
            if (r.area && !isNaN(Number(r.area)) && Number(r.area) === targetNum) return true
            if (r.areaId && Number(r.areaId) === targetNum) return true
          }
        } catch (e) {
          // noop
        }

        // check servicios.producto.area fields (robusto)
        if (Array.isArray(r.servicios)) {
          for (const s of r.servicios) {
            const p: any = s?.producto ?? s?.product ?? null

            if (!p) continue


            // textual candidates
            const candNames = [
              p.area?.nombre ?? p.area?.name ?? p.area ?? p.productoArea ?? p.producto_area ?? null
            ]

            for (const cn of candNames) {
              if (!cn) continue
              if (!isNumeric && normalizeText(cn).includes(rawNorm)) return true
            }


            // numeric candidates
            const candIds = [p.area?.id ?? p.areaId ?? p.area_id ?? p.productoArea?.id ?? null]

            for (const cid of candIds) {
              if (cid === null || typeof cid === 'undefined') continue
              if (isNumeric && Number(cid) === targetNum) return true
            }
          }
        }

        return false
      })
    }

    // Familia filtering: comparar por nombre (normalizado). Si se env├¡a id num├®rico lo acepta como fallback.
    const familiaValue = (filters as any)?.familia ?? null

    if (familiaValue !== null && typeof familiaValue !== 'undefined' && String(familiaValue).toString().trim() !== '') {
      const rawF = familiaValue
      const rawFNorm = normalizeText(rawF)
      const rawFTokens = rawFNorm.split(' ').filter(Boolean)
      const isNumF = /^[0-9]+$/.test(String(familiaValue).trim())
      const targetF = isNumF ? Number(familiaValue) : null

      const tokenMatch = (candidateNorm: string) => {
        if (!candidateNorm) return false
        if (candidateNorm.includes(rawFNorm)) return true

        // require that every token in rawF is present in candidate (order-insensitive)
        const candTokens = candidateNorm.split(' ').filter(Boolean)


        return rawFTokens.every(t => candTokens.includes(t))
      }

      result = result.filter((r: any) => {
        // gather textual and numeric candidates
        const famNames = Array.isArray(r._familiaNames) ? r._familiaNames.map((x: any) => normalizeText(x)) : []
        const famIds = Array.isArray(r._familiaIds) ? r._familiaIds.map((x: any) => Number(x)) : []

        // 1) numeric match
        if (isNumF) {
          if (famIds.some(id => Number(id) === targetF)) return true
        }

        // 2) names in cached arrays
        if (!isNumF && famNames.some(nm => tokenMatch(nm))) return true

        // 3) top-level familia (string or object)
        try {
          const topFamRaw = r.familia?.nombre ?? r.familia?.name ?? r.familia ?? ''
          const topFam = normalizeText(topFamRaw)

          if (!isNumF && tokenMatch(topFam)) return true
          if (isNumF && topFamRaw && !isNaN(Number(topFamRaw)) && Number(topFamRaw) === targetF) return true
        } catch (e) {
          /* noop */
        }

        // 4) servicios.producto.familia candidates
        if (Array.isArray(r.servicios)) {
          for (const s of r.servicios) {
            const p: any = s?.producto ?? s?.product ?? null

            if (!p) continue

            const famCandidates = [
              p.familia ?? p.familia?.nombre ?? p.familia?.name ?? p.productoFamilia ?? p.producto_familia ?? null
            ]

            for (const fc of famCandidates) {
              if (!fc) continue
              const fcNorm = normalizeText(fc)

              if (!isNumF && tokenMatch(fcNorm)) return true
              if (isNumF && !isNaN(Number(fc)) && Number(fc) === targetF) return true
              if (isNumF && String(fc) === String(familiaValue)) return true
            }
          }
        }

        // DEBUG: no match for this row -> print diagnostic for investigation
        // (mantener s├│lo mientras debuggeas)
        // eslint-disable-next-line no-console
        console.debug('Familia filter: row excluded', {
          id: r.id,
          requested: rawF,
          requestedNorm: rawFNorm,
          famNames,
          famIds,
          topFamilia: r.familia,
          serviciosSample: Array.isArray(r.servicios) ? r.servicios.slice(0, 3).map((s: any) => ({ producto: s.producto ?? s.product })) : []
        })

        return false
      })
    }

    // Servicio / Ensayo filtering: coincidencia parcial sobre los nombres de ensayo/servicio de la fila.
    const servicioEnsayoValue = (filters as any)?.servicioEnsayo ?? null

    if (servicioEnsayoValue !== null && typeof servicioEnsayoValue !== 'undefined' && String(servicioEnsayoValue).trim() !== '') {
      const qServ = normalizeText(servicioEnsayoValue)

      result = result.filter((r: any) => {
        const fromArray = Array.isArray(r.ensayoServicioNombres)
          ? r.ensayoServicioNombres.map((x: any) => normalizeText(x))
          : []

        const topCandidates = [
          normalizeText(r.tipoServicio ?? ''),
          normalizeText(r.familia ?? ''),
          normalizeText(r.muestra?.servicioRCM?.servicio?.nombre ?? '')
        ].filter(Boolean)

        const allCandidates = [...fromArray, ...topCandidates]

        return allCandidates.some((cand: string) => cand.includes(qServ))
      })
    }

    const ordered = sortRowsByDefault(result)

    console.log('applyDateFilter result count:', ordered.length)
    setFilteredData(ordered)
  }

  const { lang: locale } = useParams()

  const columns = useMemo((): ColumnDef<RCM>[] => {
    return [
      {
        id: 'select',
        header: ({ table }) => {
          const visibleIds = table.getRowModel().rows.map(r => r.id)
          const allSelected = visibleIds.length > 0 && visibleIds.every(id => Boolean((rowSelection as any)[id]))
          const someSelected = visibleIds.some(id => Boolean((rowSelection as any)[id]))

          return (
            <Checkbox
              size='small'
              checked={allSelected}
              indeterminate={!allSelected && someSelected}

              onChange={() => {
                if (!allSelected) {
                  const next: any = {}

                  visibleIds.forEach(id => (next[id] = true))
                  setRowSelection(next)
                } else {
                  setRowSelection({})
                }
              }}
            />
          )
        },
        cell: ({ row }) => (
          <Checkbox
            size='small'
            checked={Boolean((rowSelection as any)[row.id])}
            onChange={e => {
              const checked = e.target.checked

              setRowSelection(prev => ({ ...prev, [row.id]: checked }))

              if (checked) {
                void handleSelectInlineDetail(row.original)

                return
              }

              if (selectedInlineRowId === row.original.id) {
                resetInlineDetail()
              }
            }}
          />
        )
      },
      {
        id: 'rcm',
        header: 'RCM / Sede',
        accessorFn: row => [
          row.numeroRcm,
          row.sede,
          row.ot,
          row.obra?.numeroObra,
          row.area,
          row.familia,
          row.tipoServicio,
          row.cliente?.nombreCliente
        ].filter(Boolean).join(' '),
        cell: ({ row }: any) => {
          const numeroRcm = row.original.numeroRcm || '-'
          const sede = String(row.original.sede ?? '').trim()

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
              <Typography variant='body2' sx={{ fontSize: '0.95rem', fontWeight: 800, color: 'primary.main' }}>
                {numeroRcm}
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500 }}>
                {sede || '-'}
              </Typography>
            </Box>
          )
        }
      },
      {
        id: 'numeroTarjeta',
        header: 'Tarjeta',
        accessorKey: 'numeroTarjeta',
        cell: ({ row }) => {
          const numeroTarjeta = row.original.numeroTarjeta || '-'


          return (
            <Typography variant='body2' sx={{ fontSize: '0.95rem', fontWeight: 800, color: 'primary.main' }}>
              {numeroTarjeta}
            </Typography>
          )
        }
      },
      {
        id: 'ot',
        header: 'OT',
        accessorKey: 'ot',
        cell: ({ row }: any) => {
          const ot = row.original.ot

          if (ot) {
            return <Typography variant='body2'>{ot}</Typography>
          }

          const ordenId = row.original.ordenTrabajoId

          if (ordenId) {
            return (
              <Typography variant='body2' color='text.secondary' title={`ID: ${ordenId}`}>
                #{ordenId}
              </Typography>
            )
          }


          return <Typography variant='body2'>-</Typography>
        }
      },
      {
        id: 'obraCliente',
        header: 'Obra / Cliente',
        accessorFn: row => `${row.obra?.numeroObra ?? row.obra?.nombreObra ?? ''} ${row.cliente?.nombreCliente ?? ''}`.trim(),
        cell: ({ row }) => {
          const obra = row.original.obra?.numeroObra ?? row.original.obra?.nombreObra ?? '-'
          const cliente = row.original.cliente?.nombreCliente ?? '-'

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.2 }}>
              <Typography
                variant='body2'
                sx={{
                  fontWeight: 700,
                  maxWidth: 130,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={obra}
              >
                {obra}
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{
                  fontSize: '0.82rem',
                  maxWidth: 130,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={cliente}
              >
                {cliente}
              </Typography>
            </Box>
          )
        }
      },
      {
        id: 'areaTipoServicio',
        header: 'Área / Servicio',
        accessorFn: row => `${row.area ?? ''} ${row.familia ?? row.tipoServicio ?? ''}`.trim(),
        cell: ({ row }) => {
          const area = row.original.area
          const tipoServicio = row.original.familia ?? row.original.tipoServicio

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.4 }}>
              {area ? (
                <Chip
                  size='small'
                  label={area}
                  variant='outlined'
                  sx={{
                    fontWeight: 800,
                    color: area === 'Suelo' ? '#b26a00' : '#7c4dff',
                    borderColor: area === 'Suelo' ? 'rgba(237, 168, 32, 0.55)' : 'rgba(124, 77, 255, 0.38)',
                    bgcolor: area === 'Suelo' ? 'rgba(255, 196, 84, 0.14)' : 'rgba(124, 77, 255, 0.08)'
                  }}
                />
              ) : (
                <Typography variant='body2'>-</Typography>
              )}
              <Typography
                variant='caption'
                color='text.secondary'
                title={tipoServicio ?? '-'}
                sx={{
                  textAlign: 'left',
                  maxWidth: 170,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {tipoServicio ?? '-'}
              </Typography>
            </Box>
          )
        }
      },
      {
        id: 'fechaCod',
        header: 'F. Ingreso',
        accessorKey: 'fechaIngreso',
        cell: ({ row }) => <span>{row.original.fechaIngreso ? formatDateDDMMYYYYDateOnlyDash(row.original.fechaIngreso) : '-'}</span>
      },
      {
        id: 'proximoVencimiento',
        header: 'Próx. Venc.',
        accessorKey: 'proximoVencimiento',
        cell: ({ row }) => {
          const meta = getVencimientoMeta(row.original.proximoVencimiento, row.original.cantidadProbetas ?? 0)

          if (!row.original.proximoVencimiento) {
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.35, width: '100%' }}>
                <Typography variant='body2' color='text.disabled' sx={{ fontWeight: 500 }}>
                  -
                </Typography>
                {meta.helper !== '-' ? (
                  <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center' }}>
                    {meta.helper}
                  </Typography>
                ) : null}
              </Box>
            )
          }

          return (
            <Tooltip title={`${meta.formatted} · ${meta.status || 'Sin estado'} · ${meta.helper}`} placement='top' arrow>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.35, width: '100%' }}>
                <Typography variant='body2' sx={{ fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                  {meta.formatted}
                </Typography>
                {meta.status ? (
                  <Chip
                    size='small'
                    label={meta.status}
                    variant='outlined'
                    sx={{
                      height: 22,
                      fontWeight: 800,
                      color: meta.colors.color,
                      borderColor: meta.colors.borderColor,
                      bgcolor: meta.colors.backgroundColor,
                      '& .MuiChip-label': { px: 0.8 }
                    }}
                  />
                ) : null}
                <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center' }}>
                  {meta.helper}
                </Typography>
              </Box>
            </Tooltip>
          )
        }
      },
      {
        id: 'material',
        header: 'Material',
        accessorFn: row => row.tipoMaterial ?? '',
        cell: ({ row }) => {
          const material = row.original.tipoMaterial ?? '-'

          return (
            <Typography
              variant='body2'
              sx={{
                maxWidth: 130,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={material}
            >
              {material}
            </Typography>
          )
        }
      },
      {
        id: 'ensayos',
        header: 'Ens.',
        accessorFn: row => row.ensayos?.total ?? 0,
        cell: ({ row }) => {
          const ensayos = getEnsayosMeta(row.original.ensayos)

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
              <Typography variant='body2' sx={{ fontWeight: 800 }}>
                {`${ensayos.ensayados}/${ensayos.total}`}
              </Typography>
            </Box>
          )
        }
      },
      {
        id: 'estOp',
        header: 'Estado',
        accessorKey: 'estadoOperativo',
        cell: ({ row }) => {
          const op = row.original.estadoMuestra ?? ''
          const info = getOperationalInfo(op)
          const label = getOperationalLabel(op)


          return (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <Chip
                label={label}
                title={info.hex ?? ''}
                size='small'
                variant='filled'
                sx={{
                  bgcolor: info.bgcolor,
                  color: info.colorText,
                  border: `1px solid ${info.border}`,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  borderRadius: 999,
                  px: 1,
                  py: 0.4
                }}
              />
            </Box>
          )
        }
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <Stack direction='row' spacing={0.5}>
            <Tooltip title='Ver RCM' placement='top'>
              <IconButton
                size='small'
                onClick={(e) => {
                  e.stopPropagation()
                  handleView(row.original)
                }}
                sx={{
                  color: 'primary.main',
                  bgcolor: 'rgba(105, 108, 255, 0.08)',
                  '&:hover': { bgcolor: 'rgba(105, 108, 255, 0.18)' }
                }}
              >
                <VisibilityIcon fontSize='small' />
              </IconButton>
            </Tooltip>

            <Tooltip title='Ensayar' placement='top'>
              <IconButton
                size='small'
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenGestionarEnsayos(row.original)
                }}
                sx={{
                  color: 'success.main',
                  bgcolor: 'rgba(113, 221, 55, 0.08)',
                  '&:hover': { bgcolor: 'rgba(113, 221, 55, 0.18)' }
                }}
              >
                <AssignmentOutlinedIcon fontSize='small' />
              </IconButton>
            </Tooltip>

            <Tooltip title='Más opciones' placement='top'>
              <IconButton
                size='small'
                onClick={e => {
                  e.stopPropagation()
                  handleOpenRowMenu(e, row.original.id)
                }}
                sx={{
                  color: 'text.secondary',
                  bgcolor: 'rgba(75, 70, 92, 0.08)',
                  '&:hover': { bgcolor: 'rgba(75, 70, 92, 0.18)' }
                }}
              >
                <MoreVertIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      }
    ]
  }, [rowSelection, selectedRowId])

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFromLeafRows: true, // ÔåÉ AGREGAR esto
    maxLeafRowFilterDepth: 0 // ÔåÉ AGREGAR esto
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

      // No navegar mientras hay diálogos secundarios abiertos.
      if (markDialogOpen || histDialogOpen || gestionarOpen || histServicioDialogOpen) return

      const target = event.target as HTMLElement | null
      const tag = String(target?.tagName ?? '').toLowerCase()

      const isTypingTarget = Boolean(
        target?.isContentEditable ||
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select'
      )

      if (isTypingTarget) return

      const visibleRows = table.getRowModel().rows
        .map(r => r.original)
        .filter((r: RCM | null | undefined) => Boolean(r)) as RCM[]

      if (!visibleRows.length) return

      event.preventDefault()

      const isModalDetailOpen = Boolean(selectedRowId)

      const navigableRows = isModalDetailOpen
        ? visibleRows.filter((r: RCM | null | undefined) => Boolean(r?.muestra?.id))
        : visibleRows

      if (!navigableRows.length) return

      const activeRowId = isModalDetailOpen ? selectedRowId : selectedInlineRowId
      const currentIndex = navigableRows.findIndex(r => Number(r.id) === Number(activeRowId))
      const isDown = event.key === 'ArrowDown'

      let nextIndex = currentIndex

      if (currentIndex === -1) {
        nextIndex = isDown ? 0 : navigableRows.length - 1
      } else {
        nextIndex = isDown
          ? Math.min(currentIndex + 1, navigableRows.length - 1)
          : Math.max(currentIndex - 1, 0)
      }

      const nextRow = navigableRows[nextIndex]

      if (!nextRow) return

      if (isModalDetailOpen) {
        if (Number(nextRow.id) === Number(selectedRowId)) return

        void handleView(nextRow)

        return
      }

      if (Number(nextRow.id) === Number(selectedInlineRowId)) return

      void handleSelectInlineDetail(nextRow)
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    table,
    selectedInlineRowId,
    selectedRowId,
    markDialogOpen,
    histDialogOpen,
    gestionarOpen,
    histServicioDialogOpen,
    handleView,
    handleSelectInlineDetail
  ])

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (selectedInlineRowId == null) return
      if (selectedRowId != null) return

      const target = event.target as HTMLElement | null

      if (!target) return

      if (target.closest('.MuiPopover-root') || target.closest('.MuiMenu-root') || target.closest('.MuiModal-root')) return

      const tableRoot = tableContainerRef.current
      const detailRoot = inlineDetailRef.current

      if (!tableRoot) return
      if (tableRoot.contains(target)) return
      if (detailRoot && detailRoot.contains(target)) return

      resetInlineDetail()
    }

    window.addEventListener('mousedown', onMouseDown, true)

    return () => window.removeEventListener('mousedown', onMouseDown, true)
  }, [selectedInlineRowId, selectedRowId])

  // <-- a├▒adir: conteo de filas seleccionadas
  const selectedCount = useMemo(() => {
    return Object.values(rowSelection as any).filter(Boolean).length
  }, [rowSelection])

  const handleExport = () => {
    try {
      const selectedRows = Object.keys(rowSelection)
        .filter(id => (rowSelection as any)[id])
        .map(id => findRowById(id))
        .filter(Boolean)

      if (selectedRows.length === 0) {
        console.warn('No rows selected for export')

        return
      }

      const headers = [
        'RCM',
        'TARJETA',
        'OT',
        'ÁREA',
        'TIPO SERVICIO',
        'F. CODIFICACIÓN',
        'PRÓX. VENCIMIENTO',
        'ENSAYOS',
        'ESTADO',
        'ENSAYADOR'
      ]

      const rows = selectedRows.map((row: any) => [
        row.numeroRcm ?? '-',
        row.numeroTarjeta ?? '-',
        row.ot ?? '-',
        row.area ?? '-',
        row.familia ?? row.tipoServicio ?? '-',
        row.fechaCodificacion ? formatDateDDMMYYYYDateOnlyDash(row.fechaCodificacion) : '-',
        row.proximoVencimiento ? formatDateDDMMYYYYDateOnlyDash(row.proximoVencimiento) : '-',
        getEnsayosMeta(row.ensayos).total,
        getOperationalLabel(row.estadoOperativo),
        row.ensayador ?? 'Sin asignar'
      ].map(v => '"' + String(v).replace(/"/g, '""') + ''))

      const headerRow = headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(',')
      const csv = [headerRow, ...rows.map(r => r.join(','))].join('\r\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = 'rcm-detalle-export.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error', err)
    }
  }

  const dashboardStats = useMemo(() => {
    const totalActivos = filteredData.length

    const vencenHoy = filteredData.reduce((acc, row) => {
      if (!row.proximoVencimiento) return acc

      return acc + (diffDaysFromToday(row.proximoVencimiento) === 0 ? 1 : 0)
    }, 0)

    const vencenManana = filteredData.reduce((acc, row) => {
      if (!row.proximoVencimiento) return acc

      return acc + (diffDaysFromToday(row.proximoVencimiento) === 1 ? 1 : 0)
    }, 0)

    const enProceso = filteredData.reduce((acc, row) => {
      const op = String(row.estadoMuestra ?? row.estadoOperativo ?? '').toUpperCase().trim().replace(/\s+/g, '_')


      return acc + (op === 'EN_PROCESO' ? 1 : 0)
    }, 0)

    const sinEnsayador = filteredData.reduce((acc, row) => {
      return acc + (!String(row.ensayador ?? '').trim() ? 1 : 0)
    }, 0)

    return {
      vencenHoy,
      vencenManana,
      enProceso,
      sinEnsayador,
      totalActivos
    }
  }, [filteredData])

  if (loading) return <div>Cargando...</div>

  return (
    <Card>
      <CardHeader />

      <Divider />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', px: 2, py: 1.25, justifyContent: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 148, px: 1.5, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <FiberManualRecordIcon sx={{ color: 'error.main', fontSize: 18 }} />
          <Box>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1.1, fontWeight: 700, color: 'text.primary' }}>{dashboardStats.vencenHoy}</Typography>
            <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.1, fontWeight: 500, color: 'text.secondary' }}>Vencen hoy</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 158, px: 1.5, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <FiberManualRecordIcon sx={{ color: 'warning.main', fontSize: 18 }} />
          <Box>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1.1, fontWeight: 700, color: 'text.primary' }}>{dashboardStats.vencenManana}</Typography>
            <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.1, fontWeight: 500, color: 'text.secondary' }}>Vencen mañana</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 148, px: 1.5, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <SettingsOutlinedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
          <Box>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1.1, fontWeight: 700, color: 'text.primary' }}>{dashboardStats.enProceso}</Typography>
            <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.1, fontWeight: 500, color: 'text.secondary' }}>En proceso</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 158, px: 1.5, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <PersonOutlineIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
          <Box>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1.1, fontWeight: 700, color: 'text.primary' }}>{dashboardStats.sinEnsayador}</Typography>
            <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.1, fontWeight: 500, color: 'text.secondary' }}>Sin ensayador</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 148, px: 1.5, py: 0.75, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <AssignmentOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Box>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1.1, fontWeight: 700, color: 'text.primary' }}>{dashboardStats.totalActivos}</Typography>
            <Typography sx={{ fontSize: '0.76rem', lineHeight: 1.1, fontWeight: 500, color: 'text.secondary' }}>Total activos</Typography>
          </Box>
        </Box>
      </Box>

      {/* ELIMINADO: ROW de Dashboard indicadores */}
      {/*
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 2 }}>
        <Card sx={{ flex: 1, minWidth: 120 }}>
          <CardContent>
            <Typography variant='subtitle2'>Por Ensayar</Typography>
            <Typography variant='h6'>{indicators.porEnsayar}</Typography>
          </CardContent>
        </Card>
        // ... resto de tarjetas
      </Box>
      <Divider />
      */}

      {/* New toolbar row: Exportar + contador + Buscar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant='outlined'
          startIcon={<i className='ri-download-line' />}
          onClick={handleExport}
          disabled={selectedCount === 0}
        >
          Exportar CSV
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Checkbox
              size='small'
              checked={hideControlServicio}
              onChange={e => setHideControlServicio(e.target.checked)}
            />
            <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
              Ocultar tipo Control/Servicio
            </Typography>
          </Box>

          <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
            {filteredData.length} registros mostrados
          </Typography>

          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Buscar RCM, OT, obra, material...'
            sx={{ width: 320 }}
          />
        </Box>
      </Box>

      <Divider />

      <Box
        ref={tableContainerRef}
        className='overflow-x-auto'
        sx={{
          '& table': {
            tableLayout: 'fixed',
            width: '100%',
            whiteSpace: 'normal'
          },
          '& th, & td': {
            whiteSpace: 'normal'
          },
          '& td': {
            overflowWrap: 'normal'
          }
        }}
      >
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={{
                      textAlign: 'center',
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      userSelect: 'none',
                      ...(header.column.id === 'select' ? { width: 44 } : {}),
                      ...(header.column.id === 'rcm' ? { width: 110 } : {}),
                      ...(header.column.id === 'numeroTarjeta' ? { width: 90 } : {}),
                      ...(header.column.id === 'ot' ? { width: 70 } : {}),
                      ...(header.column.id === 'obraCliente' ? { width: 180 } : {}),
                      ...(header.column.id === 'areaTipoServicio' ? { width: 195 } : {}),
                      ...(header.column.id === 'fechaCod' ? { width: 100 } : {}),
                      ...(header.column.id === 'proximoVencimiento' ? { width: 125 } : {}),
                      ...(header.column.id === 'material' ? { width: 140 } : {}),
                      ...(header.column.id === 'ensayos' ? { width: 70 } : {}),
                      ...(header.column.id === 'estOp' ? { width: 130 } : {}),
                      ...(header.column.id === 'acciones' ? { width: 120 } : {})
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {(() => {
                          const s = header.column.getIsSorted()

                          if (!s) return null

                          return (
                            <Typography component='span' variant='caption' sx={{ fontWeight: 900, lineHeight: 1 }}>
                              {s === 'asc' ? '▲' : '▼'}
                            </Typography>
                          )
                        })()}
                      </Box>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                onClick={e => {
                  const target = e.target as HTMLElement

                  if (target.closest('button, a, input, textarea, select, [role="button"], [role="menuitem"], label')) return
                  void handleSelectInlineDetail(row.original)
                }}
                style={{
                  cursor: 'pointer',
                  backgroundColor: Number(selectedInlineRowId) === Number(row.original.id) ? 'rgba(59, 130, 246, 0.08)' : undefined
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    style={{
                      verticalAlign: 'middle',
                      textAlign: cell.column.id === 'acciones' || cell.column.id === 'select' || cell.column.id === 'proximoVencimiento' ? 'center' : 'left',
                      ...(cell.column.id === 'select' ? { width: 44 } : {}),
                      ...(cell.column.id === 'rcm' ? { width: 110 } : {}),
                      ...(cell.column.id === 'numeroTarjeta' ? { width: 90, whiteSpace: 'nowrap' } : {}),
                      ...(cell.column.id === 'ot' ? { width: 70, whiteSpace: 'nowrap' } : {}),
                      ...(cell.column.id === 'obraCliente' ? { width: 180 } : {}),
                      ...(cell.column.id === 'areaTipoServicio' ? { width: 195 } : {}),
                      ...(cell.column.id === 'fechaCod' ? { width: 100, whiteSpace: 'nowrap' } : {}),
                      ...(cell.column.id === 'proximoVencimiento' ? { width: 125 } : {}),
                      ...(cell.column.id === 'material' ? { width: 140 } : {}),
                      ...(cell.column.id === 'ensayos' ? { width: 70, whiteSpace: 'nowrap' } : {}),
                      ...(cell.column.id === 'estOp' ? { width: 130, whiteSpace: 'nowrap' } : {}),
                      ...(cell.column.id === 'acciones' ? { width: 120, whiteSpace: 'nowrap' } : {})
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component='div'
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
        onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
      />

      {(() => {
        const inlinePanelFixedHeight = 336
        const row = findRowById(selectedInlineRowId)

        if (!row) {
          return (
            <Paper
              ref={inlineDetailRef}
              variant='outlined'
              sx={{
                mt: 2,
                borderRadius: 1.5,
                borderColor: '#d9deea',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
                height: inlinePanelFixedHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                textAlign: 'center',
                bgcolor: '#f8f9fc'
              }}
            >
              <Typography sx={{ color: '#6b7280', fontWeight: 700 }}>
                Selecciona un RCM para ver el detalle
              </Typography>
            </Paper>
          )
        }

        const rcmData = inlineRcmDetalle ?? null

        const muestraFromRcm = Array.isArray(rcmData?.muestras)
          ? rcmData.muestras.find((m: any) => Number(m?.id) === Number(inlineMuestraDetalle?.id ?? row?.muestra?.id))
          : null

        const muestra = inlineMuestraDetalle ?? muestraFromRcm ?? row?.muestra ?? {}

        const probetas = Array.isArray(muestra?.probetas)
          ? muestra.probetas
          : (Array.isArray(muestraFromRcm?.probetas) ? muestraFromRcm.probetas : [])

        const estadoActual = row?.estadoMuestra ?? row?.estadoOperativo ?? 'CODIFICADO'
        const area = rcmData?.area?.nombre ?? row?.area ?? '-'
        const tarjeta = muestra?.numeroTarjeta || row?.numeroTarjeta || rcmData?.numeroTarjeta || '-'
        const numeroMuestra = muestra?.numeroMuestra || '-'
        const ensayosCount = countDetailedEnsayos(inlineServicios)

        const cp = (() => {
          const candidates = [
            (rcmData?.codigoAgrupador as any)?.codigoId,
            (rcmData as any)?.codigoProducto,
            (row as any)?.codigoProducto,
            (rcmData?.codigoAgrupador as any)?.codigo
          ]

          for (const raw of candidates) {
            const value = String(raw ?? '').trim()

            if (!value) continue
            const prdMatch = value.match(/(PRD-\d+)/i)

            if (prdMatch?.[1]) return String(prdMatch[1]).toUpperCase()
            if (/^PRD-/i.test(value)) return value.toUpperCase()
          }

          return '-'
        })()

        const muestreadoPorInline = resolveDisplayPersonName(
          rcmData?.ordenTrabajo?.user?.name,
          rcmData?.ordenTrabajo?.user?.email,
          row?.muestreadoPor
        )

        const material = muestra?.tipoMaterial || rcmData?.tipoMaterial || row?.tipoMaterial || '-'
        const item = muestra?.item || rcmData?.item || '-'
        const cantidad = muestra?.cantidadMuestras ?? rcmData?.cantidadMuestras ?? muestra?.cantidad ?? '-'
        const vencimiento = muestra?.vencimiento ?? rcmData?.vencimiento ?? false
        const informeEnsayo = rcmData?.informeEnsayo ?? true
        const areaNorm = normalizeText(area)
        const esHormigon = areaNorm === 'hormigon'
        const esElementosComponentes = areaNorm === 'elementos y componentes'
        const esAsfalto = areaNorm === 'asfalto'
        const esSuelo = areaNorm === 'suelo'
        const esOtros = areaNorm === 'otros'
        const mostrarFechaConfeccion = esHormigon || esElementosComponentes || esAsfalto || esOtros
        const mostrarElemento = esHormigon || esElementosComponentes
        const mostrarGrado = esHormigon || esElementosComponentes
        const mostrarCotas = esSuelo

        const fechaConfeccionRaw = muestra?.fechaConfeccion ?? rcmData?.fechaConfeccion ?? null
        const elementoDinamico = muestra?.elemento ?? rcmData?.elemento ?? '-'
        const gradoDinamico = muestra?.grado ?? rcmData?.grado ?? '-'
        const cotasRaw = typeof muestra?.cotas === 'string' ? muestra.cotas : ''
        const cota1DesdeCotas = cotasRaw ? String(cotasRaw).split('-')?.[0]?.trim() : null
        const cota2DesdeCotas = cotasRaw ? String(cotasRaw).split('-')?.[1]?.trim() : null
        const cota1Dinamica = rcmData?.cota1 ?? cota1DesdeCotas ?? '-'
        const cota2Dinamica = rcmData?.cota2 ?? cota2DesdeCotas ?? '-'

        const inlineEstadoPillSx = (raw?: string) => {
          const key = String(raw ?? '').toUpperCase().trim()

          if (key.includes('ENSAYADO')) return { color: '#08794c', borderColor: 'rgba(16, 185, 129, 0.55)', bgcolor: 'rgba(16, 185, 129, 0.16)' }
          if (key.includes('PROCESO')) return { color: '#2557d6', borderColor: 'rgba(59, 130, 246, 0.55)', bgcolor: 'rgba(59, 130, 246, 0.14)' }
          if (key.includes('CODIFIC')) return { color: '#4b5563', borderColor: 'rgba(107, 114, 128, 0.45)', bgcolor: 'rgba(156, 163, 175, 0.16)' }

          return { color: '#334155', borderColor: 'rgba(148, 163, 184, 0.5)', bgcolor: 'rgba(148, 163, 184, 0.18)' }
        }

        return (
          <Paper
            ref={inlineDetailRef}
            variant='outlined'
            sx={{
              mt: 2,
              borderRadius: 1.5,
              overflow: 'hidden',
              borderColor: '#d9deea',
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
              height: inlinePanelFixedHeight,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ px: 2, py: 1.15, bgcolor: '#f8f9fc', borderBottom: '1px solid #d9deea', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ color: '#0f1fb0', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1 }}>{row?.numeroRcm ?? '-'}</Typography>
                <Typography sx={{ color: '#9aa3b4', fontSize: '0.78rem' }}>{String(tarjeta).startsWith('T-') ? tarjeta : `T-${tarjeta}`}</Typography>
                <Chip size='small' label={area} variant='outlined' sx={{ height: 22, fontWeight: 700 }} />
                <Typography sx={{ color: '#374151', fontSize: '0.9rem' }}>{row?.tipoServicio ?? row?.familia ?? '-'}</Typography>
                <Chip size='small' label={getOperationalLabel(estadoActual)} variant='outlined' sx={{ height: 22, fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  size='small'
                  variant='text'
                  onClick={() => setInlineActiveTab('detalle')}
                  sx={{
                    minWidth: 0,
                    px: 0,
                    py: 0,
                    borderRadius: 0,
                    textTransform: 'none',
                    fontSize: '0.83rem',
                    fontWeight: 700,
                    color: inlineActiveTab === 'detalle' ? '#0f1fb0' : '#6b7280',
                    borderBottom: inlineActiveTab === 'detalle' ? '2px solid #0f1fb0' : '2px solid transparent'
                  }}
                >
                  Detalle
                </Button>
                <Button
                  size='small'
                  variant='text'
                  onClick={() => setInlineActiveTab('ensayos')}
                  sx={{
                    minWidth: 0,
                    px: 0,
                    py: 0,
                    borderRadius: 0,
                    textTransform: 'none',
                    fontSize: '0.83rem',
                    fontWeight: 700,
                    color: inlineActiveTab === 'ensayos' ? '#0f1fb0' : '#6b7280',
                    borderBottom: inlineActiveTab === 'ensayos' ? '2px solid #0f1fb0' : '2px solid transparent'
                  }}
                >
                  {`Ensayos (${ensayosCount})`}
                </Button>
                <Button
                  size='small'
                  variant='contained'
                  onClick={() => {
                    if (row) void handleOpenGestionarEnsayos(row)
                  }}
                  sx={{ textTransform: 'none', minWidth: 0, px: 1.1, py: 0.2, borderRadius: 1 }}
                >
                  <i className='ri-flask-line' style={{ marginRight: 4 }} />Ensayar
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#f5f6f8', flex: 1, overflowY: 'auto' }}>
              {loadingInlineDetalle ? (
                <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
              ) : (
                inlineActiveTab === 'detalle' ? (
                  <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(7, 1fr)' }, gap: 1.5, mb: 1.6 }}>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>N° OT</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{rcmData?.ordenTrabajo?.correlativo || row?.ot || '-'}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>MUESTREADO POR</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{muestreadoPorInline}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>F. CODIFICACIÓN</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{formatDateDDMMYYYYDateOnlyDash(rcmData?.fechaCodificacion ?? row?.fechaCodificacion)}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>F. MUESTREO</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{formatDateDDMMYYYYDateOnlyDash(rcmData?.fechaMuestreo ?? row?.fechaMuestreo)}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>F. INGRESO</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{formatDateDDMMYYYYDateOnlyDash(rcmData?.fechaIngreso ?? row?.fechaIngreso)}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>SEDE</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{rcmData?.sede ?? row?.sede ?? '-'}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>CP</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{cp}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>MATERIAL</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{material}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>ÍTEM</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{item}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>N° TARJETA</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{String(tarjeta).startsWith('T-') ? tarjeta : `T-${tarjeta}`}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>N° MUESTRA</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{String(numeroMuestra).startsWith('#') ? numeroMuestra : `#${numeroMuestra}`}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>CANTIDAD</Typography><Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{cantidad}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>VENCIMIENTO</Typography><Typography sx={{ fontSize: '0.9rem', color: vencimiento ? '#047857' : '#9ca3af', fontWeight: 700 }}>{vencimiento ? '✓ Sí' : 'No'}</Typography></Box>
                      <Box><Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b95a7' }}>INF. ENSAYO</Typography><Typography sx={{ fontSize: '0.9rem', color: informeEnsayo ? '#047857' : '#9ca3af', fontWeight: 700 }}>{informeEnsayo ? '✓ Sí' : 'No'}</Typography></Box>
                    </Box>

                    <Box sx={{ mb: 1.7, border: '1px solid #f2b93c', borderRadius: 1.1, bgcolor: '#fdf8e8', px: 1.4, py: 1.05, display: 'flex', gap: 2.25, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: '0.73rem', fontWeight: 800, color: '#8a5a00' }}>{String(area).toUpperCase()}</Typography>
                      {mostrarFechaConfeccion && (
                        <Box>
                          <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>FECHA CONFECCIÓN</Typography>
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151' }}>{formatDateDDMMYYYYDateOnlyDash(fechaConfeccionRaw)}</Typography>
                        </Box>
                      )}
                      {mostrarElemento && (
                        <Box>
                          <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>ELEMENTO</Typography>
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151' }}>{elementoDinamico}</Typography>
                        </Box>
                      )}
                      {mostrarGrado && (
                        <Box>
                          <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>GRADO</Typography>
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151' }}>{gradoDinamico}</Typography>
                        </Box>
                      )}
                      {mostrarCotas && (
                        <Box>
                          <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>COTA 1</Typography>
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151' }}>{cota1Dinamica}</Typography>
                        </Box>
                      )}
                      {mostrarCotas && (
                        <Box>
                          <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>COTA 2</Typography>
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#374151' }}>{cota2Dinamica}</Typography>
                        </Box>
                      )}
                    </Box>

                    {probetas.length > 0 && (
                      <>
                        <Typography sx={{ mb: 0.9, fontSize: '0.82rem', fontWeight: 800, color: '#7b8498', letterSpacing: 0.3 }}>{`SUBMUESTRAS (${probetas.length})`}</Typography>
                        <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', pt: 0.15 }}>
                          {probetas
                            .slice()
                            .sort((a: any, b: any) => Number(a?.numero ?? 0) - Number(b?.numero ?? 0))
                            .map((p: any, i: number) => {
                              const daysToDue = diffDaysFromToday(p?.fechaVencimiento)
                              const safeDays = daysToDue ?? 0
                              const isToday = safeDays === 0
                              const isTomorrow = safeDays === 1
                              const estadoSubmuestra = p?.estado ?? 'CODIFICADO'

                              const restantesLabel = isToday
                                ? 'en 0d'
                                : isTomorrow
                                  ? 'en 1d'
                                  : safeDays < 0
                                    ? `vencido ${Math.abs(safeDays)}d`
                                    : `en ${safeDays}d`

                              return (
                                <Box key={p?.id ?? i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.8, py: 0.45, borderRadius: 1, border: '1px solid #d0d7e2', bgcolor: '#fff' }}>
                                  <Box sx={{ width: 16, height: 16, borderRadius: '999px', bgcolor: '#0b2acc', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700 }}>{p?.numero ?? i + 1}</Box>
                                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#111827' }}>{p?.dias ?? '-'}d</Typography>
                                  <Typography sx={{ fontSize: '0.75rem', color: '#8b95a7' }}>{formatDateDDMMYYYYDateOnlyDash(p?.fechaVencimiento)}</Typography>
                                  <Typography sx={{ fontSize: '0.75rem', color: '#374151' }}>{`cant. ${p?.cantidad ?? '-'}`}</Typography>
                                  <Chip label={getOperationalLabel(estadoSubmuestra)} size='small' variant='outlined' sx={{ height: 20, fontWeight: 700, fontSize: '0.7rem', ...inlineEstadoPillSx(String(estadoSubmuestra)) }} />
                                  <Typography sx={{ fontSize: '0.75rem', color: '#374151', fontWeight: 700 }}>{restantesLabel}</Typography>
                                </Box>
                              )
                            })}
                        </Box>
                      </>
                    )}
                  </>
                ) : (
                  <TableContainer component={Paper} variant='outlined' sx={{ borderColor: '#d7dde9', borderRadius: 1.1, bgcolor: '#fff' }}>
                    <Table size='small'>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#eef1f6' }}>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>SKU</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>ENSAYO / SERVICIO</TableCell>
                          <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>CANT</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>ENSAYADOR</TableCell>
                          <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>ESTADO</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>OBS.</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inlineServicios.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align='center' sx={{ py: 3 }}>
                              <Typography sx={{ color: '#9ca3af' }}>No hay ensayos cargados</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          inlineServicios.map((servicio: any, idx: number) => {
                            const servicioId = servicio.id ?? servicio.servicioMuestraId ?? servicio.servicioId ?? servicio._id ?? idx

                            const estadoRaw = resolveServiceStateFromRcm(
                              servicio.estado ?? servicio.estadoServicio ?? 'CODIFICADO',
                              rcmData?.rcmType,
                              row?.estadoOperativo ?? rcmData?.estadoOperativo
                            )

                            return (
                              <TableRow key={servicioId}>
                                <TableCell>
                                  <Typography sx={{ display: 'inline-flex', px: 0.9, py: 0.18, borderRadius: 0.8, bgcolor: '#f1f5f9', border: '1px solid #d0d7e2', fontSize: '0.76rem', fontWeight: 700, color: '#374151' }}>
                                    {servicio.codigo ?? '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
                                    {servicio.nombre ?? servicio.servicio?.nombre ?? '-'}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.75rem', color: '#8b95a7' }}>
                                    {servicio.norma ?? '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                  <Typography sx={{ fontSize: '0.84rem', color: '#374151' }}>
                                    {servicio.cantidad ?? 1}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: '0.84rem', color: '#374151' }}>
                                    {servicio.ensayador ?? '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                  <Chip label={getOperationalLabel(estadoRaw)} size='small' variant='outlined' sx={{ fontWeight: 700, fontSize: '0.72rem', ...inlineEstadoPillSx(String(estadoRaw)) }} />
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: '0.82rem', color: '#9ca3af' }}>{servicio.observacion ?? '—'}</Typography>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              )}
            </Box>
          </Paper>
        )
      })()}

      <Dialog
        open={Boolean(selectedRowId)}
        onClose={resetSelectedDetail}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            maxWidth: 760,
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {(() => {
          const row = findRowById(selectedRowId)
          const rcmData = rcmDetalleModal ?? null

          const muestraFromRcm = Array.isArray(rcmData?.muestras)
            ? rcmData.muestras.find((m: any) => Number(m?.id) === Number(muestraDetalle?.id ?? row?.muestra?.id))
            : null

          const muestra = muestraDetalle ?? muestraFromRcm ?? row?.muestra ?? {}

          const probetas = Array.isArray(muestra?.probetas)
            ? muestra.probetas
            : (Array.isArray(muestraFromRcm?.probetas) ? muestraFromRcm.probetas : [])

          const estadoTipo = String(rcmData?.rcmType ?? 'MUESTRA').toUpperCase()
          let estadoActual = row?.estadoMuestra ?? row?.estadoOperativo ?? 'CODIFICADO'

          const closeModal = () => {
            resetSelectedDetail()
          }

          const estadoPillSx = (raw?: string) => {
            const key = String(raw ?? '').toUpperCase().trim()

            if (key.includes('ENSAYADO')) return { color: '#08794c', borderColor: 'rgba(16, 185, 129, 0.55)', bgcolor: 'rgba(16, 185, 129, 0.16)' }
            if (key.includes('PROCESO')) return { color: '#2557d6', borderColor: 'rgba(59, 130, 246, 0.55)', bgcolor: 'rgba(59, 130, 246, 0.14)' }
            if (key.includes('CODIFIC')) return { color: '#4b5563', borderColor: 'rgba(107, 114, 128, 0.45)', bgcolor: 'rgba(156, 163, 175, 0.16)' }

            return { color: '#334155', borderColor: 'rgba(148, 163, 184, 0.5)', bgcolor: 'rgba(148, 163, 184, 0.18)' }
          }

          const toLabel = (value: any): string | null => {
            if (typeof value === 'string') {
              const v = value.trim()

              return v || null
            }

            if (value && typeof value === 'object') {
              const fromObj = String(value?.nombre ?? value?.name ?? '').trim()

              return fromObj || null
            }

            return null
          }

          const area = toLabel((rcmData as any)?.area) ?? toLabel(row?.area) ?? '-'
          const familia = toLabel((rcmData as any)?.familia) ?? toLabel(row?.familia) ?? '-'

          const tipoServicio =
            toLabel(row?.familia) ??
            toLabel((rcmData as any)?.familia) ??
            toLabel(row?.tipoServicio) ??
            toLabel((rcmData as any)?.tipoServicio) ??
            '-'

          const agendaObra = (rcmData as any)?.ordenTrabajo?.agenda?.obra ?? null
          const agendaCliente = (rcmData as any)?.ordenTrabajo?.agenda?.cliente ?? null

          const normalizeCodigoProductoId = (raw: any) => {
            const value = String(raw ?? '').trim()

            if (!value) return null

            const match = value.match(/(PRD-\d+)/i)

            if (match?.[1]) return String(match[1]).toUpperCase()

            return value
          }

          const codigoProductoCodigo = normalizeCodigoProductoId(
            (rcmData?.codigoAgrupador as any)?.codigoId ?? rcmData?.codigoProducto ?? (row as any)?.codigoProducto ?? null
          )

          const descripcionRaw = (rcmData?.codigoAgrupador as any)?.descripcionServicio ?? null

          const descripcionCP = (() => {
            const desc = String(descripcionRaw ?? '').trim()

            if (!desc) return null

            const cpId = String(codigoProductoCodigo ?? '').trim()

            return cpId && desc.toUpperCase() === cpId.toUpperCase() ? null : desc
          })()

          const nombreObra =
            rcmData?.obra?.nombreObra ??
            rcmData?.obra?.nombre ??
            agendaObra?.nombreObra ??
            agendaObra?.nombre ??
            row?.obra?.nombreObra ??
            '-'

          const clienteNombre =
            rcmData?.cliente?.nombreCliente ??
            agendaCliente?.nombreCliente ??
            row?.cliente?.nombreCliente ??
            '-'

          const clienteRut =
            rcmData?.cliente?.rut ??
            agendaCliente?.rut ??
            row?.cliente?.rut ??
            '-'

          const obraNumero =
            rcmData?.obra?.numeroObra ??
            agendaObra?.numeroObra ??
            row?.obra?.numeroObra ??
            '-'

          const ciudad =
            rcmData?.obra?.comuna ??
            agendaObra?.comuna ??
            rcmData?.cliente?.ciudad ??
            agendaCliente?.ciudad ??
            row?.obra?.comuna ??
            row?.cliente?.ciudad ??
            '-'

          const region =
            rcmData?.obra?.region ??
            agendaObra?.region ??
            rcmData?.cliente?.region ??
            agendaCliente?.region ??
            row?.obra?.region ??
            row?.cliente?.region ??
            '-'

          const mandante =
            rcmData?.obra?.mandante ??
            agendaObra?.mandante ??
            row?.obra?.mandante ??
            '-'

          const nroOt = rcmData?.ordenTrabajo?.correlativo || rcmData?.ordenTrabajo?.correlativ || row?.ot || '-'

          const muestreadoPor = resolveDisplayPersonName(
            rcmData?.ordenTrabajo?.user?.name,
            rcmData?.ordenTrabajo?.user?.email,
            row?.muestreadoPor
          )

          const tipoMaterial = muestra?.tipoMaterial || rcmData?.tipoMaterial || row?.tipoMaterial || '-'
          const item = muestra?.item || rcmData?.item || '-'
          const tarjeta = muestra?.numeroTarjeta || row?.numeroTarjeta || rcmData?.numeroTarjeta || '-'
          const numeroMuestra = muestra?.numeroMuestra || '-'
          const procedencia = muestra?.procedencia || rcmData?.procedencia || '-'
          const ubicacionSector = muestra?.ubicacionSector || rcmData?.ubicacionSector || '-'
          const cantidad = muestra?.cantidadMuestras ?? rcmData?.cantidadMuestras ?? '-'
          const vencimiento = muestra?.vencimiento ?? rcmData?.vencimiento ?? false
          const informeEnsayo = rcmData?.informeEnsayo ?? true
          const elemento = muestra?.elemento || rcmData?.elemento || '-'
          const grado = muestra?.grado || rcmData?.grado || '-'
          const displayServices = consolidateSkuServices(serviciosMuestra)
          const ensayosCount = displayServices.length
          const ensayosPendientes = displayServices.some((service: any) => service.tipo === 'Ensayo' && service.completedQuantity < service.cantidad)

          if (displayServices.some((service: any) => service.tipo === 'Ensayo')) {
            estadoActual = ensayosPendientes ? 'EN_PROCESO' : 'ENSAYADO'
          }

          const submuestrasCount = probetas.length
          const observaciones = muestra?.observaciones ?? rcmData?.observaciones ?? '-'
          const areaNorm = normalizeText(area)
          const esHormigon = areaNorm === 'hormigon'
          const esElementosComponentes = areaNorm === 'elementos y componentes'
          const esAsfalto = areaNorm === 'asfalto'
          const esSuelo = areaNorm === 'suelo'
          const esOtros = areaNorm === 'otros'
          const mostrarFechaConfeccion = esHormigon || esElementosComponentes || esAsfalto || esOtros
          const mostrarElemento = esHormigon || esElementosComponentes
          const mostrarGrado = esHormigon || esElementosComponentes
          const mostrarCotas = esSuelo

          const areaChipSx = esHormigon
            ? { color: '#065f46', borderColor: 'rgba(4,120,87,0.38)', bgcolor: 'rgba(4,120,87,0.08)' }
            : esSuelo
              ? { color: '#b26a00', borderColor: 'rgba(237,168,32,0.55)', bgcolor: 'rgba(255,196,84,0.14)' }
              : esAsfalto
                ? { color: '#4b5563', borderColor: 'rgba(75,85,99,0.35)', bgcolor: 'rgba(75,85,99,0.07)' }
                : esElementosComponentes
                  ? { color: '#1e40af', borderColor: 'rgba(30,64,175,0.35)', bgcolor: 'rgba(219,234,254,0.5)' }
                  : { color: '#7c4dff', borderColor: 'rgba(124,77,255,0.38)', bgcolor: 'rgba(124,77,255,0.08)' }

          const fechaConfeccionRaw = muestra?.fechaConfeccion ?? rcmData?.fechaConfeccion ?? null
          const cotasRaw = typeof muestra?.cotas === 'string' ? muestra.cotas : ''
          const cota1DesdeCotas = cotasRaw ? String(cotasRaw).split('-')?.[0]?.trim() : null
          const cota2DesdeCotas = cotasRaw ? String(cotasRaw).split('-')?.[1]?.trim() : null
          const cota1Dinamica = rcmData?.cota1 ?? cota1DesdeCotas ?? '-'
          const cota2Dinamica = rcmData?.cota2 ?? cota2DesdeCotas ?? '-'

          return (
            <>
              <Box sx={{ px: 3, py: 2.2, bgcolor: '#f3f4f8', borderBottom: '1px solid #d9deea', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ color: '#0f1fb0', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1 }}>{`RCM-${row?.numeroRcm ?? '-'}`}</Typography>
                  <Chip label={estadoTipo} size='small' variant='outlined' sx={{ fontWeight: 700, color: '#273ab6', borderColor: '#aab7ff', bgcolor: 'rgba(99,102,241,.08)', height: 22 }} />
                  <Chip label={getOperationalLabel(estadoActual)} size='small' variant='outlined' sx={{ fontWeight: 700, height: 22, ...estadoPillSx(String(estadoActual)) }} />
                </Box>

                <Button size='small' variant='outlined' color='inherit' onClick={closeModal} sx={{ color: '#4b5563', borderColor: '#c8cfda', textTransform: 'none', minWidth: 0, px: 1.1 }}>
                  <i className='ri-close-line' style={{ marginRight: 4 }} /> Cerrar
                </Button>
              </Box>

              <Box sx={{ p: 2.5, bgcolor: '#f4f5f7', overflowY: 'auto' }}>
                <Box sx={{ border: '1px solid #d7dcee', borderRadius: 1.2, bgcolor: '#eef0f8', p: 1.4, mb: 1.6 }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#7b8498', letterSpacing: 0.6, mb: 0.8 }}>PERTENECE A</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.9rem' }}>{rcmData?.sede ?? row?.sede ?? '-'}</Typography>
                    {area && area !== '-' && (
                      <Chip label={area} size='small' variant='outlined' sx={{ height: 22, fontSize: '0.78rem', fontWeight: 700, ...areaChipSx }} />
                    )}
                    {tipoServicio && tipoServicio !== '-' && (
                      <Typography sx={{ color: '#374151', fontSize: '0.9rem' }}>{tipoServicio}</Typography>
                    )}
                    {codigoProductoCodigo && (
                      <Chip label={codigoProductoCodigo} size='small' variant='outlined' sx={{ height: 22, fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', borderColor: '#93c5fd', bgcolor: '#eff6ff' }} />
                    )}
                    {descripcionCP && (
                      <Typography
                        title={descripcionCP}
                        sx={{
                          color: '#9ca3af',
                          fontSize: '0.9rem',
                          fontStyle: 'italic',
                          maxWidth: 380,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {descripcionCP}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7', letterSpacing: 0.4 }}>CLIENTE</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>{clienteNombre}</Typography>
                      <Typography sx={{ fontSize: '0.74rem', color: '#9ca3af' }}>{clienteRut}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7', letterSpacing: 0.4 }}>OBRA</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>{obraNumero}</Typography>
                      <Typography
                        title={nombreObra}
                        sx={{
                          fontSize: '0.74rem',
                          color: '#9ca3af',
                          display: 'block',
                          maxWidth: 220,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {nombreObra}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7', letterSpacing: 0.4 }}>CIUDAD / REGION</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>{`${ciudad} / ${region}`}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7', letterSpacing: 0.4 }}>MANDANTE</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>{mandante}</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ border: '1px solid #dfe3ed', borderRadius: 1.2, bgcolor: '#eef0f3', p: 1.3, mb: 1.5, display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.2 }}>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>N° OT</Typography><Typography sx={{ fontWeight: 700, color: '#374151' }}>{nroOt}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>MUESTREADO POR</Typography><Typography sx={{ fontWeight: 700, color: '#374151' }}>{muestreadoPor}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>F. CODIFICACION</Typography><Typography sx={{ color: '#374151' }}>{formatDateDDMMYYYYDateOnlyDash(rcmData?.fechaCodificacion ?? row?.fechaCodificacion)}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>F. MUESTREO</Typography><Typography sx={{ color: '#374151' }}>{formatDateDDMMYYYYDateOnlyDash(rcmData?.fechaMuestreo ?? row?.fechaMuestreo)}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>F. INGRESO</Typography><Typography sx={{ color: '#374151' }}>{formatDateDDMMYYYYDateOnlyDash(rcmData?.fechaIngreso ?? row?.fechaIngreso)}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>F. ENTREGA</Typography><Typography sx={{ color: '#374151' }}>{formatDateDDMMYYYYDateOnlyDash(rcmData?.fechaEntrega)}</Typography></Box>
                </Box>

                <Box sx={{ mb: 1.5, display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1.2 }}>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>TIPO DE MATERIAL</Typography><Typography sx={{ color: '#374151', fontWeight: 600 }}>{tipoMaterial}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>ITEM</Typography><Typography sx={{ color: '#374151', fontWeight: 600 }}>{item}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>N° TARJETA</Typography><Typography sx={{ color: '#1d4ed8', fontWeight: 800 }}>{String(tarjeta).startsWith('T-') ? tarjeta : `T-${tarjeta}`}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>N° DE MUESTRA</Typography><Typography sx={{ color: '#374151', fontWeight: 600 }}>{String(numeroMuestra).startsWith('#') ? numeroMuestra : `#${numeroMuestra}`}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>PROCEDENCIA</Typography><Typography sx={{ color: '#374151', fontWeight: 600 }}>{procedencia}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>UBICACION / SECTOR</Typography><Typography sx={{ color: '#374151', fontWeight: 600 }}>{ubicacionSector}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>CANTIDAD</Typography><Typography sx={{ color: '#374151', fontWeight: 600 }}>{cantidad}</Typography></Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>VENCIMIENTO</Typography>
                    <Typography sx={{ color: vencimiento ? '#047857' : '#9ca3af', fontWeight: 700 }}>{vencimiento ? '✓ Si' : 'No'}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#8b95a7' }}>INF. ENSAYO</Typography>
                    <Typography sx={{ color: informeEnsayo ? '#047857' : '#9ca3af', fontWeight: 700 }}>{informeEnsayo ? '✓ Si' : 'No'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 1.6, border: '1px solid #f2b93c', borderRadius: 1.1, bgcolor: '#fdf8e8', px: 1.3, py: 1.05, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#8a5a00' }}>{String(area).toUpperCase()}</Typography>
                  {mostrarFechaConfeccion && (
                    <Box>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>FECHA CONFECCIÓN</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>{formatDateDDMMYYYYDateOnlyDash(fechaConfeccionRaw)}</Typography>
                    </Box>
                  )}
                  {mostrarElemento && (
                    <Box>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>ELEMENTO</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>{elemento}</Typography>
                    </Box>
                  )}
                  {mostrarGrado && (
                    <Box>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>GRADO</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>{grado}</Typography>
                    </Box>
                  )}
                  {mostrarCotas && (
                    <Box>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>COTA 1</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>{cota1Dinamica}</Typography>
                    </Box>
                  )}
                  {mostrarCotas && (
                    <Box>
                      <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#b7791f' }}>COTA 2</Typography>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151' }}>{cota2Dinamica}</Typography>
                    </Box>
                  )}
                </Box>

                <Typography sx={{ mb: 0.8, fontSize: '0.95rem', fontWeight: 800, color: '#374151', letterSpacing: 0.35 }}>{`ENSAYOS (${ensayosCount})`}</Typography>

                {loadingServicios ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant='outlined' sx={{ mb: 1.7, borderColor: '#d7dde9', borderRadius: 1.1 }}>
                    <Table size='small'>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#eef1f6' }}>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>SKU</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>ENSAYO / SERVICIO</TableCell>
                          <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>CANT.</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>ENSAYADOR</TableCell>
                          <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>ESTADO</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>OBSERVACIONES</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayServices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align='center' sx={{ py: 3 }}>
                              <Typography color='text.secondary'>No hay ensayos cargados</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayServices.map((servicio: any, idx: number) => {
                            const servicioId = servicio.id ?? servicio.servicioMuestraId ?? servicio.servicioId ?? servicio._id ?? null

                            const estadoRaw = resolveServiceStateFromRcm(
                              servicio.estado ?? servicio.estadoServicio ?? 'CODIFICADO',
                              rcmData?.rcmType,
                              row?.estadoOperativo ?? rcmData?.estadoOperativo
                            )

                            const esPaquete = servicio.esPaquete === true

                            const subProductos: any[] = esPaquete
                              ? (
                                Array.isArray(servicio.subProductosCodificados) && servicio.subProductosCodificados.length > 0
                                  ? servicio.subProductosCodificados
                                  : (Array.isArray(servicio.productosEnPaquete) ? servicio.productosEnPaquete : [])
                              )
                              : []

                            return (
                              <>
                                <TableRow key={servicioId ?? idx}>
                                  <TableCell>
                                    <Typography sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: 1, bgcolor: '#eceff3', border: '1px solid #d0d7e2', fontSize: '0.82rem', fontWeight: 700, color: '#313845' }}>
                                      {servicio.codigo ?? '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                      <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#111827', lineHeight: 1.15 }}>
                                        {servicio.nombre ?? servicio.servicio?.nombre ?? '-'}
                                      </Typography>
                                      <Chip label={servicio.tipo} size='small' variant='outlined' sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#818b9a' }}>
                                      {servicio.norma ?? '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Typography sx={{ fontSize: '0.95rem', color: '#111827' }}>{servicio.cantidad ?? 1}</Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontSize: '0.92rem', color: servicio.esPaquete ? '#9ca3af' : '#374151' }}>
                                      {servicio.ensayadores?.length ? servicio.ensayadores.join(' / ') : servicio.ensayador ?? '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.35 }}>
                                      <Chip label={getOperationalLabel(servicio.estado ?? estadoRaw)} size='small' variant='outlined' sx={{ fontWeight: 700, fontSize: '0.74rem', ...estadoPillSx(String(servicio.estado ?? estadoRaw)) }} />
                                      {servicio.completedQuantity < servicio.cantidad ? (
                                        <Typography variant='caption' color='text.secondary'>{`${servicio.completedQuantity}/${servicio.cantidad} completados`}</Typography>
                                      ) : null}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontSize: '0.9rem', color: '#9ca3af' }}>{servicio.observacion ?? '—'}</Typography>
                                  </TableCell>
                                </TableRow>
                                {subProductos.map((sp: any, spIdx: number) => (
                                  <TableRow key={`${servicioId ?? idx}-sub-${spIdx}`} sx={{ bgcolor: 'rgba(59,130,246,0.04)' }}>
                                    <TableCell sx={{ pl: 3 }}>
                                      <Typography sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: 1, bgcolor: '#f0f4ff', border: '1px solid #c7d4f0', fontSize: '0.78rem', fontWeight: 600, color: '#3b5bdb' }}>
                                        {sp.sku ?? '-'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ pl: 2 }}>
                                      <Typography sx={{ fontSize: '0.85rem', color: '#374151', pl: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <span style={{ color: '#9ca3af', marginRight: 2 }}>↳</span>
                                        {sp.nombre ?? '-'}
                                      </Typography>
                                      {sp.norma && (
                                        <Typography sx={{ fontSize: '0.75rem', color: '#818b9a', pl: 3 }}>{sp.norma}</Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Typography sx={{ fontSize: '0.88rem', color: '#6b7280' }}>{sp.cantidad ?? 1}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>{sp.ensayador ?? '-'}</Typography>
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Chip
                                        label={getOperationalLabel(sp.estado ?? estadoRaw)}
                                        size='small'
                                        variant='outlined'
                                        sx={{ fontWeight: 700, fontSize: '0.72rem', ...estadoPillSx(String(sp.estado ?? estadoRaw)) }}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontSize: '0.82rem', color: '#9ca3af' }}>{sp.observacion ?? '—'}</Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {probetas.length > 0 && (
                  <>
                    <Typography sx={{ mb: 0.8, fontSize: '0.95rem', fontWeight: 800, color: '#374151', letterSpacing: 0.35 }}>{`SUBMUESTRAS (${submuestrasCount})`}</Typography>

                    <TableContainer component={Paper} variant='outlined' sx={{ mb: 1.6, borderColor: '#d7dde9', borderRadius: 1.1 }}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#eef1f6' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>DIAS</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>FECHA ENSAYO</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>CANT.</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>ESTADO</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.74rem' }}>ALERTA</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(
                            probetas
                              .slice()
                              .sort((a: any, b: any) => Number(a?.numero ?? 0) - Number(b?.numero ?? 0))
                              .map((probeta: any, idx: number) => {
                                const estadoRaw = probeta?.estado ?? 'CODIFICADO'
                                const daysToDue = diffDaysFromToday(probeta?.fechaVencimiento)
                                const isToday = daysToDue === 0
                                const isTomorrow = daysToDue === 1
                                const isUrgent = isToday || isTomorrow
                                const alertLabel = isToday ? 'Hoy' : isTomorrow ? 'Mañana' : `en ${Math.max(daysToDue, 0)}d`

                                return (
                                  <TableRow key={probeta?.id ?? idx} sx={{ bgcolor: isUrgent ? 'rgba(245, 158, 11, 0.12)' : 'inherit' }}>
                                    <TableCell>
                                      <Box sx={{ width: 22, height: 22, borderRadius: '999px', bgcolor: '#0b2acc', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                                        {probeta?.numero ?? idx + 1}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontSize: '0.9rem', color: '#111827', fontWeight: 700 }}>{probeta?.dias ?? '-'}d</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{formatDateDDMMYYYYDateOnlyDash(probeta?.fechaVencimiento)}</Typography>
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Typography sx={{ fontSize: '0.9rem', color: '#111827' }}>{probeta?.cantidad ?? '-'}</Typography>
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Chip label={getOperationalLabel(estadoRaw)} size='small' variant='outlined' sx={{ fontWeight: 700, fontSize: '0.74rem', ...estadoPillSx(String(estadoRaw)) }} />
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: isUrgent ? '#dc2626' : '#4b5563' }}>{alertLabel}</Typography>
                                    </TableCell>
                                  </TableRow>
                                )
                              })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                <Typography sx={{ mb: 0.7, fontSize: '0.92rem', fontWeight: 800, color: '#374151', letterSpacing: 0.35 }}>OBSERVACIONES</Typography>
                <Box sx={{ border: '1px solid #d7dde9', borderRadius: 1.1, bgcolor: '#eceff3', p: 1.15, mb: 1.7 }}>
                  <Typography sx={{ fontSize: '0.9rem', color: '#374151' }}>{observaciones || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant='outlined' color='inherit' onClick={closeModal} sx={{ textTransform: 'none', borderColor: '#c8cfda', color: '#4b5563' }}>
                    Cerrar
                  </Button>
                </Box>
              </Box>
            </>
          )
        })()}
      </Dialog>

      {/* ─── Dialog: Gestionar Ensayos ─────────────────────────────────────── */}
      <Dialog
        open={gestionarOpen}
        onClose={() => setGestionarOpen(false)}
        maxWidth='xl'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            width: { xs: 'calc(100vw - 24px)', lg: 'min(96vw, 1320px)' },
            maxWidth: { xs: 'calc(100vw - 24px)', lg: '1320px' },
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {(() => {
          const row = gestionarRow
          const rcmData = gestionarRcmData
          const estadoTipo = String(rcmData?.rcmType ?? 'MUESTRA').toUpperCase()
          let estadoActual = row?.estadoMuestra ?? row?.estadoOperativo ?? 'CODIFICADO'

          const tipoChipSx = estadoTipo === 'MUESTRA'
            ? { bgcolor: '#ede9fe', color: '#5b21b6', borderColor: '#c4b5fd' }
            : estadoTipo === 'CONTROL'
              ? { bgcolor: '#fef9c3', color: '#92400e', borderColor: '#fde68a' }
              : { bgcolor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }

          const toLabel = (value: any): string | null => {
            if (typeof value === 'string') {
              const v = value.trim()

              return v || null
            }

            if (value && typeof value === 'object') {
              const fromObj = String(value?.nombre ?? value?.name ?? '').trim()

              return fromObj || null
            }

            return null
          }

          const areaLabel = toLabel((rcmData as any)?.area) ?? toLabel(row?.area) ?? '-'

          const tipoServicioLabel =
            toLabel(row?.familia) ??
            toLabel((rcmData as any)?.familia) ??
            toLabel(row?.tipoServicio) ??
            toLabel((rcmData as any)?.tipoServicio) ??
            '-'

          const materialLabel = gestionarMuestra?.tipoMaterial || gestionarMuestra?.item
            ? [gestionarMuestra?.tipoMaterial, gestionarMuestra?.item].filter(Boolean).join(' · ')
            : '-'

          const tarjetaLabel = gestionarMuestra?.numeroTarjeta || row?.numeroTarjeta || '-'
          const otLabel = rcmData?.ordenTrabajo?.correlativo ?? rcmData?.ordenTrabajo?.correlativ ?? row?.otDisplay ?? '-'

          const estadoPillSx = (raw?: string) => {
            const k = String(raw ?? '').toUpperCase()

            if (k.includes('ENSAYADO')) return { color: '#08794c', borderColor: 'rgba(16,185,129,.55)', bgcolor: 'rgba(16,185,129,.16)' }
            if (k.includes('PROCESO')) return { color: '#2557d6', borderColor: 'rgba(59,130,246,.55)', bgcolor: 'rgba(59,130,246,.14)' }
            if (k.includes('CODIFIC')) return { color: '#4b5563', borderColor: 'rgba(107,114,128,.45)', bgcolor: 'rgba(156,163,175,.16)' }

            return { color: '#475569', borderColor: 'rgba(100,116,139,.4)', bgcolor: 'rgba(148,163,184,.14)' }
          }

          const displayServices = consolidateSkuServices(gestionarServicios).map((group: any) => {
            const entries = group.entries

            const completedQuantity = entries.reduce((total: number, entry: any) => {
              const key = String(entry._syntheticKey ?? entry.id)
              const state = getEstadoServicioConProbetas(entry, gestionarEstados[key] ?? entry.estado ?? 'CODIFICADO')

              return total + (String(state).toUpperCase().includes('ENSAYADO') ? getSkuQuantity(entry) : 0)
            }, 0)

            const liveState = completedQuantity >= group.cantidad
              ? 'ENSAYADO'
              : entries.some((entry: any) => {
                const key = String(entry._syntheticKey ?? entry.id)

                return String(getEstadoServicioConProbetas(entry, gestionarEstados[key] ?? entry.estado ?? 'CODIFICADO')).toUpperCase().includes('PROCESO')
              })
                ? 'EN_PROCESO'
                : 'CODIFICADO'

            const liveEnsayadores = Array.from(new Set(entries.map((entry: any) => {
              const key = String(entry._syntheticKey ?? entry.id)

              return String(gestionarEnsayadores[key] ?? entry.ensayador ?? '').trim()
            }).filter(Boolean)))

            return { ...group, estado: liveState, completedQuantity, ensayadores: liveEnsayadores }
          })

          const countableServices = displayServices.filter((service: any) => service.tipo === 'Ensayo')
          const totalServicios = displayServices.reduce((total: number, service: any) => total + service.cantidad, 0)
          const completados = displayServices.reduce((total: number, service: any) => total + service.completedQuantity, 0)

          if (countableServices.length > 0) {
            estadoActual = completados < totalServicios ? 'EN_PROCESO' : 'ENSAYADO'
          }

          const submuestraEnsayador = displayServices
            .flatMap((service: any) => service.ensayadores ?? [])
            .find((name: string) => Boolean(name)) ?? ''

          const submuestraPermiteResultados = displayServices.some((service: any) => ['1005', '1006'].includes(String(service.sku)))
          const submuestraService = gestionarServicios.find((service: any) => serviceUsesSubmuestras(service) && service.id) ?? null

          return (
            <>
              {/* Header */}
              <Box sx={{ px: 3, py: 2, bgcolor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '1.55rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{row?.numeroRcm ?? '-'}</Typography>
                  <Chip label={estadoTipo} size='small' variant='outlined' sx={{ fontWeight: 700, fontSize: '0.75rem', ...tipoChipSx }} />
                  <Chip label={getOperationalLabel(estadoActual)} size='small' variant='outlined' sx={{ fontWeight: 700, fontSize: '0.75rem', ...estadoPillSx(estadoActual) }} />
                </Box>
                <Button size='small' variant='outlined' color='inherit' onClick={() => setGestionarOpen(false)} sx={{ color: '#4b5563', borderColor: '#c8cfda', textTransform: 'none', minWidth: 0, px: 1.4 }}>
                  <i className='ri-close-line' style={{ marginRight: 4 }} /> Cerrar
                </Button>
              </Box>

              {/* Info bar */}
              <Box sx={{ px: 3, py: 1.4, bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start', flexShrink: 0 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: '#9ca3af', letterSpacing: 0.6, mb: 0.5 }}>ÁREA / TIPO SERVICIO</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <Chip label={areaLabel} size='small' variant='outlined' sx={{ fontWeight: 700, fontSize: '0.75rem', bgcolor: '#f3f0ff', color: '#6d28d9', borderColor: '#c4b5fd' }} />
                    <Typography sx={{ fontSize: '0.82rem', color: '#374151' }}>{tipoServicioLabel}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: '#9ca3af', letterSpacing: 0.6, mb: 0.5 }}>N° TARJETA</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#1d4ed8' }}>{tarjetaLabel}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: '#9ca3af', letterSpacing: 0.6, mb: 0.5 }}>OT</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{otLabel}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, color: '#9ca3af', letterSpacing: 0.6, mb: 0.5 }}>MATERIAL / ÍTEM</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{materialLabel}</Typography>
                </Box>
              </Box>

              <DialogContent sx={{ p: 2.5, bgcolor: '#fff', overflowY: 'auto', flex: 1 }}>
                {gestionarLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress size={36} />
                  </Box>
                ) : (
                  <>
                    {/* COORDINADOR DE SALA */}
                    <Box sx={{ border: '1.5px solid #bfdbfe', borderRadius: 1.5, p: 2, mb: 2.5, bgcolor: '#f0f7ff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 1.6 }}>
                        <i className='ri-add-circle-line' style={{ color: '#1d4ed8', fontSize: 15 }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.4 }}>COORDINADOR DE SALA</Typography>
                      </Box>

                      {/* Fila única: Ensayador global + Aplicar + Estado masivo */}
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'nowrap' }}>
                        <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#6b7280', letterSpacing: 0.3, mb: 0.4 }}>ASIGNAR ENSAYADOR A TODOS</Typography>
                          <Select
                            size='small'
                            displayEmpty
                            value={gestionarEnsayadorGlobal}
                            onChange={e => setGestionarEnsayadorGlobal(String(e.target.value))}
                            sx={{ width: '100%', fontSize: '0.82rem', bgcolor: '#fff' }}
                          >
                            <MenuItem value=''><em style={{ color: '#9ca3af' }}>Seleccionar...</em></MenuItem>
                            {ensayadorOptions.map(name => (
                              <MenuItem key={name} value={name}>{name}</MenuItem>
                            ))}
                          </Select>
                        </Box>
                        <Button
                          variant='contained'
                          size='small'
                          disabled={!gestionarEnsayadorGlobal}
                          onClick={() => {
                            setGestionarEnsayadores(prev => {
                              const next = { ...prev }

                              gestionarServicios
                                .filter((s: any) => !s._isPaqueteHeader)
                                .forEach((s: any) => {
                                  const key = String(s._syntheticKey ?? s.id)
                                  const actual = String(next[key] ?? s.ensayador ?? '').trim()

                                  // Solo completar cuando no hay ensayador asignado previamente.
                                  if (!actual) next[key] = gestionarEnsayadorGlobal
                                })

                              return next
                            })

                            const todayInput = getTodayDateInputValue()

                            setGestionarFechasAsignacionEnsayador(prev => {
                              const next = { ...prev }

                              gestionarServicios
                                .filter((s: any) => !s._isPaqueteHeader)
                                .forEach((s: any) => {
                                  const key = String(s._syntheticKey ?? s.id)
                                  const actual = String((gestionarEnsayadores[key] ?? s.ensayador ?? '')).trim()

                                  if (!actual) next[key] = todayInput
                                })

                              return next
                            })
                          }}
                          sx={{ whiteSpace: 'nowrap', fontWeight: 700, textTransform: 'none', bgcolor: '#1e40af', '&:hover': { bgcolor: '#1d3a9b' }, height: 36, mt: '20px', flexShrink: 0 }}
                        >
                          Aplicar a todos
                        </Button>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.4, flexShrink: 0, mt: '2px' }}>
                          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#6b7280', letterSpacing: 0.3 }}>ESTADO MASIVO</Typography>
                          <Box sx={{ display: 'flex', gap: 0.6 }}>
                            <Button
                              size='small'
                              variant='outlined'
                              disabled={!puedeIniciarEnsayos}
                              startIcon={<i className='ri-play-fill' style={{ fontSize: 11 }} />}
                              onClick={() => applyEstadoMasivo('EN_PROCESO')}
                              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderColor: '#93c5fd', color: '#1d4ed8', bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' }, px: 1 }}
                            >
                              En Proceso
                            </Button>
                            <Button
                              size='small'
                              variant='outlined'
                              disabled={!puedeIniciarEnsayos}
                              startIcon={<i className='ri-check-line' style={{ fontSize: 11 }} />}
                              onClick={() => applyEstadoMasivo('ENSAYADO')}
                              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderColor: '#6ee7b7', color: '#065f46', bgcolor: '#ecfdf5', '&:hover': { bgcolor: '#d1fae5' }, px: 1 }}
                            >
                              Ensayado
                            </Button>
                          </Box>
                          {gestionarEstadoMasivoInfo && (
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#4b5563' }}>
                              {gestionarEstadoMasivoInfo}
                            </Typography>
                          )}
                          {mensajeBloqueoEnsayo && (
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#b45309' }}>
                              {mensajeBloqueoEnsayo}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Tabla ensayos */}
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#374151', mb: 1, letterSpacing: 0.3 }}>
                      {`ENSAYOS / SERVICIOS — ${completados}/${totalServicios} COMPLETADOS`}
                    </Typography>
                    <TableContainer component={Paper} variant='outlined' sx={{ borderColor: '#e5e7eb', borderRadius: 1.5, mb: 2.5 }}>
                      <Table size='small'>
                        <colgroup>
                          <col style={{ width: 72 }} />
                          <col style={{ width: 86 }} />
                          <col />
                          <col style={{ width: 74 }} />
                          <col style={{ width: 230 }} />
                          <col style={{ width: 122 }} />
                          <col style={{ width: 108 }} />
                          <col style={{ width: 128 }} />
                          <col style={{ width: 112 }} />
                          <col style={{ width: 72 }} />
                          <col style={{ width: 120 }} />
                        </colgroup>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f9fafb' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 72 }}>SKU</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 86 }}>TIPO</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>ENSAYO / SERVICIO</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 74 }}>CANT</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 230 }}>ENSAYADOR</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 122 }}>F. ASIGN.</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 108 }}>ESTADO</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 120 }}>ACCIÓN</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 220 }}>FECHA ENSAYO</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 72 }}>RES.</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 120 }}>OBS.</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {displayServices.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={11} align='center' sx={{ py: 3, color: '#9ca3af' }}>Sin ensayos registrados</TableCell>
                            </TableRow>
                          ) : (
                            displayServices.map((group: any) => {
                              const sourceEntries = group.entries
                              const s = { ...sourceEntries[0], ...group, _isPaqueteHeader: false, _isPaqueteSubItem: false }
                              const sKey = group.key
                              const sourceDateKeys = sourceEntries.map((entry: any) => String(entry._syntheticKey ?? entry.id))

                              if (s._isPaqueteHeader) {
                                const subCount = gestionarServicios.filter((sub: any) => sub._paqueteParentId === s.id).length

                                return (
                                  <TableRow key={`paq_header_${s.id}`} sx={{ bgcolor: '#eff6ff' }}>
                                    <TableCell>
                                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 0.9, py: 0.2, borderRadius: 0.8, bgcolor: '#dbeafe', fontSize: '0.76rem', fontWeight: 700, color: '#1e40af' }}>
                                        <i className='ri-stack-line' style={{ fontSize: 11 }} />
                                        {s.codigo ?? s.id}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e40af', lineHeight: 1.3 }}>{s.nombre}</Typography>
                                        <Chip label={`PAQUETE · ${subCount} ensayos`} size='small' sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#dbeafe', color: '#1e40af' }} />
                                      </Box>
                                      {s.norma && <Typography sx={{ fontSize: '0.71rem', color: '#9ca3af' }}>{s.norma}</Typography>}
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e3a8a' }}>
                                        {s.cantidad ?? 1}
                                      </Typography>
                                    </TableCell>
                                    <TableCell colSpan={7} />
                                  </TableRow>
                                )
                              }

                              const estadoActualServicio = group.estado

                              const ensayadorActual = group.ensayadores.join(' / ') || s.ensayador || ''

                              const fechaAsignacionActual =
                                sourceDateKeys.map(key => gestionarFechasAsignacionEnsayador[key]).find(Boolean) ??
                                toDateInputValue(s.fechaAsignacionEnsayador) ??
                                ''

                              const fechaInicioEnsayoActual = sourceDateKeys.map(key => gestionarFechasInicioEnsayo[key]).find(Boolean) ?? toDateTimeInputValue(s.fechaInicioEnsayo)
                              const fechaFinEnsayoActual = sourceDateKeys.map(key => gestionarFechasFinEnsayo[key]).find(Boolean) ?? toDateTimeInputValue(s.fechaFinEnsayo)

                              const tieneEnsayadorAsignado = hasAssignedEnsayador(s, ensayadorActual)
                              const puedeIniciarServicio = puedeIniciarEnsayos && tieneEnsayadorAsignado
                              const esEnsayado = String(estadoActualServicio).toUpperCase().includes('ENSAYADO')
                              const esEnProceso = String(estadoActualServicio).toUpperCase().includes('PROCESO')
                              const esCodificado = !esEnsayado && !esEnProceso
                              const calendarioFechaHabilitado = String(ensayadorActual ?? '').trim().length > 0 && esCodificado
                              const submuestrasServicio = getSubmuestrasForService(s)


                              return (
                                <TableRow key={sKey} sx={{ bgcolor: s._isPaqueteSubItem ? '#f8faff' : 'inherit' }}>
                                  <TableCell>
                                    <Box sx={{ display: 'inline-flex', px: 0.9, py: 0.2, borderRadius: 0.8, bgcolor: s._isPaqueteSubItem ? '#f0f4ff' : '#f1f5f9', fontSize: '0.76rem', fontWeight: 700, color: s._isPaqueteSubItem ? '#3730a3' : '#374151', ml: s._isPaqueteSubItem ? 1.5 : 0 }}>
                                      {s.codigo ?? s.id}
                                    </Box>
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Chip label={group.tipo} size='small' variant='outlined' sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                                  </TableCell>
                                  <TableCell sx={{ pl: s._isPaqueteSubItem ? 3 : undefined }}>
                                    <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{s.nombre}</Typography>
                                    {s.norma && <Typography sx={{ fontSize: '0.71rem', color: '#9ca3af' }}>{s.norma}</Typography>}
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Typography sx={{ fontSize: '0.84rem', color: '#374151' }}>
                                      {s.cantidad ?? 1}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      size='small'
                                      displayEmpty
                                      value={ensayadorActual}
                                      onChange={e => {
                                        const nextEnsayador = String(e.target.value)

                                        setGestionarEnsayadores(prev => {
                                          const next = { ...prev }

                                          sourceEntries.forEach((entry: any) => {
                                            next[String(entry._syntheticKey ?? entry.id)] = nextEnsayador
                                          })

                                          return next
                                        })
                                        setGestionarFechasAsignacionEnsayador(prev => {
                                          const next = { ...prev }

                                          sourceEntries.forEach((entry: any) => {
                                            const key = String(entry._syntheticKey ?? entry.id)

                                            if (!nextEnsayador.trim()) delete next[key]
                                            else next[key] = getTodayDateInputValue()
                                          })

                                          return next
                                        })
                                      }}
                                      sx={{
                                        width: '100%',
                                        minWidth: 220,
                                        fontSize: '0.82rem',
                                        '& .MuiSelect-select': {
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }
                                      }}
                                    >
                                      <MenuItem value=''><em style={{ color: '#9ca3af' }}>—</em></MenuItem>
                                      {ensayadorOptions.map(name => (
                                        <MenuItem key={name} value={name}>{name}</MenuItem>
                                      ))}
                                    </Select>
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Box
                                      sx={{
                                        width: 118,
                                        minHeight: 30,
                                        px: 0.8,
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: '#d1d5db',
                                        bgcolor: calendarioFechaHabilitado ? '#fff' : '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 0.4
                                      }}
                                    >
                                      <Typography sx={{ fontSize: '0.73rem', color: fechaAsignacionActual ? '#374151' : '#9ca3af' }}>
                                        {fechaAsignacionActual ? formatDateDDMMYYYYDateOnly(fechaAsignacionActual) : 'dd/mm/yyyy'}
                                      </Typography>
                                      <IconButton
                                        size='small'
                                        disabled={!calendarioFechaHabilitado}
                                        onClick={() => {
                                          const input = document.getElementById(`fecha-asign-${sKey}`) as HTMLInputElement | null

                                          if (!input) return
                                          if (typeof input.showPicker === 'function') input.showPicker()
                                          else input.click()
                                        }}
                                        sx={{ p: 0.2, color: calendarioFechaHabilitado ? '#4b5563' : '#9ca3af' }}
                                      >
                                        <i className='ri-calendar-line' style={{ fontSize: 13 }} />
                                      </IconButton>
                                      <input
                                        id={`fecha-asign-${sKey}`}
                                        type='date'
                                        value={String(fechaAsignacionActual ?? '')}
                                        disabled={!calendarioFechaHabilitado}
                                        onChange={e => {
                                          const nextFecha = String(e.target.value ?? '').trim()

                                          setGestionarFechasAsignacionEnsayador(prev => {
                                            const next = { ...prev }

                                            sourceDateKeys.forEach(key => {
                                              if (!nextFecha) delete next[key]
                                              else next[key] = nextFecha
                                            })

                                            return next
                                          })
                                        }}
                                        style={{
                                          position: 'absolute',
                                          opacity: 0,
                                          width: 1,
                                          height: 1,
                                          pointerEvents: 'none'
                                        }}
                                        aria-label='Fecha de asignacion'
                                      />
                                    </Box>
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Chip
                                      label={getOperationalLabel(estadoActualServicio)}
                                      size='small'
                                      variant='outlined'
                                      sx={{ fontWeight: 700, fontSize: '0.74rem', ...estadoPillSx(estadoActualServicio) }}
                                    />
                                    {group.completedQuantity < group.cantidad ? (
                                      <Typography variant='caption' color='text.secondary'>{`${group.completedQuantity}/${group.cantidad} completados`}</Typography>
                                    ) : null}
                                  </TableCell>
                                  <TableCell align='center'>
                                    {submuestrasServicio.length > 0 ? (
                                      <Button
                                        size='small'
                                        variant='text'
                                        onClick={() => document.getElementById('gestionar-submuestras-table')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                                        sx={{ minWidth: 0, px: 0.7, py: 0.2, fontSize: '0.75rem', fontWeight: 800, textTransform: 'none', color: '#334e9b' }}
                                      >
                                        ↓ subs
                                      </Button>
                                    ) : esEnsayado ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, justifyContent: 'center', color: '#16a34a', fontWeight: 700, fontSize: '0.82rem' }}>
                                        <i className='ri-checkbox-circle-fill' style={{ fontSize: 14 }} />
                                        Completado
                                      </Box>
                                    ) : esCodificado ? (
                                      <Tooltip title={!tieneEnsayadorAsignado ? 'Asigna ensayador para iniciar' : (!puedeIniciarEnsayos ? (mensajeBloqueoEnsayo ?? '') : '')}>
                                        <Box component='span'>
                                          <Button
                                            size='small'
                                            variant='outlined'
                                            disabled={!puedeIniciarServicio}
                                            onClick={() => {
                                              const today = getNowDateTimeInputValue()

                                              setGestionarEstados(prev => {
                                                const next = { ...prev }

                                                sourceEntries.forEach((entry: any) => { next[String(entry._syntheticKey ?? entry.id)] = 'EN_PROCESO' })

                                                return next
                                              })
                                              setGestionarFechasInicioEnsayo(prev => {
                                                const next = { ...prev }

                                                sourceDateKeys.forEach(key => {
                                                  if (!next[key]) next[key] = today
                                                })

                                                return next
                                              })
                                            }}
                                            sx={{ fontSize: '0.75rem', fontWeight: 700, py: 0.3, px: 1, textTransform: 'none', borderColor: '#bfdbfe', color: '#1d4ed8', bgcolor: '#eff6ff', minWidth: 0 }}
                                          >
                                            <i className='ri-play-fill' style={{ fontSize: 12, marginRight: 3 }} />Iniciar
                                          </Button>
                                        </Box>
                                      </Tooltip>
                                    ) : esEnProceso ? (
                                      <Button
                                        size='small'
                                        variant='outlined'
                                        onClick={() => {
                                          const now = getNowDateTimeInputValue()

                                          setGestionarEstados(prev => {
                                            const next = { ...prev }

                                            sourceEntries.forEach((entry: any) => { next[String(entry._syntheticKey ?? entry.id)] = 'ENSAYADO' })

                                            return next
                                          })
                                          setGestionarFechasFinEnsayo(prev => {
                                            const next = { ...prev }

                                            sourceDateKeys.forEach(key => {
                                              if (!next[key]) next[key] = now
                                            })

                                            return next
                                          })
                                        }}
                                        sx={{ fontSize: '0.75rem', fontWeight: 700, py: 0.3, px: 1, textTransform: 'none', borderColor: '#bbf7d0', color: '#16a34a', bgcolor: '#f0fdf4', minWidth: 0 }}
                                      >
                                        <i className='ri-check-line' style={{ fontSize: 12, marginRight: 3 }} />Finalizar
                                      </Button>
                                    ) : (
                                      <Typography sx={{ fontSize: '0.82rem', color: '#9ca3af' }}>-</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align='center'>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45, minWidth: 205 }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '42px 1fr', alignItems: 'center', gap: 0.5 }}>
                                          <Typography variant='caption' sx={{ fontWeight: 700, color: '#64748b', textAlign: 'left' }}>Inicio</Typography>
                                          <DateTimePicker
                                            value={fechaInicioEnsayoActual ? new Date(fechaInicioEnsayoActual) : null}
                                            onChange={value => {
                                              const nextValue = value ? toDateTimeInputValue(value) : ''

                                              setGestionarFechasInicioEnsayo(prev => {
                                                const next = { ...prev }

                                                sourceDateKeys.forEach(key => {
                                                  if (nextValue) next[key] = nextValue
                                                  else delete next[key]
                                                })

                                                return next
                                              })
                                            }}
                                            format='dd-MM-yy HH:mm'
                                            ampm={false}
                                            slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiInputBase-input': { py: 0.5, fontSize: '0.72rem' } } } }}
                                          />
                                        </Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '42px 1fr', alignItems: 'center', gap: 0.5 }}>
                                          <Typography variant='caption' sx={{ fontWeight: 700, color: '#64748b', textAlign: 'left' }}>Fin</Typography>
                                          <DateTimePicker
                                            value={fechaFinEnsayoActual ? new Date(fechaFinEnsayoActual) : null}
                                            onChange={value => {
                                              const nextValue = value ? toDateTimeInputValue(value) : ''

                                              setGestionarFechasFinEnsayo(prev => {
                                                const next = { ...prev }

                                                sourceDateKeys.forEach(key => {
                                                  if (nextValue) next[key] = nextValue
                                                  else delete next[key]
                                                })

                                                return next
                                              })
                                            }}
                                            format='dd-MM-yy HH:mm'
                                            ampm={false}
                                            slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiInputBase-input': { py: 0.5, fontSize: '0.72rem' } } } }}
                                          />
                                        </Box>
                                      </Box>
                                    </LocalizationProvider>
                                  </TableCell>
                                  <TableCell align='center'>
                                    {['1005', '1006'].includes(String(group.sku)) ? (
                                      <IconButton size='small' color='primary' aria-label={`Ingresar resultados para SKU ${group.sku}`} title='Ingresar resultados'>
                                        <i className='ri-add-line' style={{ fontSize: 17 }} />
                                      </IconButton>
                                    ) : (
                                      <Typography variant='body2' color='text.disabled'>-</Typography>
                                    )}
                                  </TableCell>
                                  <TableCell align='center'>
                                    <TextField
                                      size='small'
                                      placeholder='Obs...'
                                      value={gestionarObservaciones[sKey] ?? s.observacion ?? ''}
                                      onChange={e => setGestionarObservaciones(prev => ({ ...prev, [sKey]: e.target.value }))}
                                      inputProps={{ maxLength: 120 }}
                                      sx={{ width: 110, '& .MuiInputBase-input': { py: 0.55, fontSize: '0.74rem' } }}
                                    />
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Submuestras */}
                    {gestionarProbetas.length > 0 && (
                      <>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#374151', mb: 1, letterSpacing: 0.3 }}>
                          {`SUBMUESTRAS (${gestionarProbetas.length})`}
                        </Typography>
                        <TableContainer id='gestionar-submuestras-table' component={Paper} variant='outlined' sx={{ borderColor: '#e5e7eb', borderRadius: 1.5 }}>
                          <Table size='small'>
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 40 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>DÍAS</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>FECHA PROGRAMADA</TableCell>
                                <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>CANT.</TableCell>
                                <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>ENSAYADOR</TableCell>
                                <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 108 }}>ESTADO</TableCell>
                                <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem', width: 110 }}>ACCIÓN</TableCell>
                                <TableCell align='center' sx={{ width: 250, py: 0.85 }}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
                                    <Typography sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.72rem', lineHeight: 1.1 }}>
                                      FECHA ENSAYO
                                    </Typography>
                                    <Typography sx={{ color: '#94a3b8', fontSize: '0.62rem', fontWeight: 600, lineHeight: 1.1 }}>
                                      INICIO · FIN
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>RES.</TableCell>
                                <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.72rem' }}>DÍAS RESTANTES</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {gestionarProbetas.slice().sort((a: any, b: any) => Number(a.numero ?? 0) - Number(b.numero ?? 0)).map((p: any, i: number) => {
                                const daysToDue = diffDaysFromToday(p?.fechaVencimiento)
                                const isToday = daysToDue === 0
                                const isTomorrow = daysToDue === 1
                                const isUrgent = isToday || isTomorrow || daysToDue < 0
                                const restantesLabel = isToday ? 'Hoy' : isTomorrow ? 'Mañana' : daysToDue < 0 ? `Vencido ${Math.abs(daysToDue)}d` : `En ${daysToDue} días`


                                return (
                                  <TableRow key={p.id ?? i} sx={{ bgcolor: isUrgent ? 'rgba(254,226,226,.35)' : 'inherit' }}>
                                    <TableCell>
                                      <Box sx={{ width: 24, height: 24, borderRadius: '999px', bgcolor: '#0b2acc', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700 }}>
                                        {p.numero ?? i + 1}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#111827' }}>{p.dias ?? '-'}d</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontSize: '0.88rem', color: '#374151' }}>{formatDateDDMMYYYYDateOnlyDash(p.fechaVencimiento)}</Typography>
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Typography sx={{ fontSize: '0.88rem', color: '#374151' }}>{p.cantidad ?? '-'}</Typography>
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Typography sx={{ fontSize: '0.78rem', color: submuestraEnsayador ? '#374151' : '#9ca3af' }}>
                                        {submuestraEnsayador || '-'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Chip label={getOperationalLabel(p.estado ?? 'CODIFICADO')} size='small' variant='outlined' sx={{ fontWeight: 700, fontSize: '0.73rem', ...estadoPillSx(p.estado ?? 'CODIFICADO') }} />
                                    </TableCell>
                                    <TableCell align='center'>
                                      {String(p.estado ?? 'CODIFICADO').toUpperCase().includes('ENSAYADO') ? (
                                        <Typography sx={{ color: '#16a34a', fontSize: '0.76rem', fontWeight: 700 }}>Completado</Typography>
                                      ) : (
                                        <Tooltip title={!submuestraEnsayador ? 'Asigna ensayador para iniciar' : !canProcessProbetaInOrder(p) ? `Disponible desde ${formatDateDDMMYYYYDateOnlyDash(p.fechaVencimiento)}` : ''}>
                                          <Box component='span'>
                                            <Button
                                              size='small'
                                              variant='outlined'
                                              disabled={!submuestraEnsayador || !canProcessProbetaInOrder(p)}
                                              onClick={() => submuestraService && handleOpenGestionarSubmuestra(submuestraService, p)}
                                              sx={{ minWidth: 0, px: 0.8, py: 0.25, fontSize: '0.72rem', textTransform: 'none' }}
                                            >
                                              <i className='ri-flask-line' style={{ fontSize: 11, marginRight: 3 }} />Ensayar
                                            </Button>
                                          </Box>
                                        </Tooltip>
                                      )}
                                    </TableCell>
                                    <TableCell align='center'>
                                      {(() => {
                                        const subKey = String(p.id ?? p.numero ?? i)
                                        const fechaInicio = gestionarFechasInicioSubmuestra[subKey] ?? ''
                                        const fechaFin = gestionarFechasFinSubmuestra[subKey] ?? ''

                                        return (
                                          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, minWidth: 220 }}>
                                              <Box sx={{ display: 'grid', gridTemplateColumns: '42px 1fr', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant='caption' sx={{ fontWeight: 700, color: '#64748b', textAlign: 'left' }}>Inicio</Typography>
                                                <DateTimePicker
                                                  value={fechaInicio ? new Date(fechaInicio) : null}
                                                  onChange={value => setGestionarFechasInicioSubmuestra(prev => ({ ...prev, [subKey]: value ? toDateTimeInputValue(value) : '' }))}
                                                  format='dd-MM-yy HH:mm'
                                                  ampm={false}
                                                  slotProps={{ textField: { size: 'small', sx: { '& .MuiInputBase-input': { py: 0.35, fontSize: '0.68rem' } } } }}
                                                />
                                              </Box>
                                              <Box sx={{ display: 'grid', gridTemplateColumns: '42px 1fr', alignItems: 'center', gap: 0.5 }}>
                                                <Typography variant='caption' sx={{ fontWeight: 700, color: '#64748b', textAlign: 'left' }}>Fin</Typography>
                                                <DateTimePicker
                                                  value={fechaFin ? new Date(fechaFin) : null}
                                                  onChange={value => setGestionarFechasFinSubmuestra(prev => ({ ...prev, [subKey]: value ? toDateTimeInputValue(value) : '' }))}
                                                  format='dd-MM-yy HH:mm'
                                                  ampm={false}
                                                  slotProps={{ textField: { size: 'small', sx: { '& .MuiInputBase-input': { py: 0.35, fontSize: '0.68rem' } } } }}
                                                />
                                              </Box>
                                            </Box>
                                          </LocalizationProvider>
                                        )
                                      })()}
                                    </TableCell>
                                    <TableCell align='center'>
                                      {submuestraPermiteResultados ? (
                                        <IconButton
                                          size='small'
                                          color='primary'
                                          aria-label={`Ingresar resultados de submuestra ${p.numero ?? i + 1}`}
                                          title='Ingresar resultados'
                                          onClick={() => submuestraService && handleOpenGestionarSubmuestra(submuestraService, p)}
                                        >
                                          <i className='ri-add-line' style={{ fontSize: 17 }} />
                                        </IconButton>
                                      ) : (
                                        <Typography variant='body2' color='text.disabled'>-</Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: isUrgent ? '#dc2626' : '#4b5563' }}>
                                        {restantesLabel}{isUrgent && ' ⚠'}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </>
                )}
              </DialogContent>

              {/* Footer */}
              <Box sx={{ px: 3, py: 2, bgcolor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexShrink: 0 }}>
                <Button variant='outlined' onClick={() => setGestionarOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#374151', borderColor: '#d1d5db' }}>
                  Cancelar
                </Button>
                <Button
                  variant='contained'
                  disabled={gestionarSaving}
                  onClick={handleGuardarGestionar}
                  startIcon={gestionarSaving ? <CircularProgress size={14} color='inherit' /> : <i className='ri-save-3-line' />}
                  sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1e40af', '&:hover': { bgcolor: '#1d3a9b' } }}
                >
                  {gestionarSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </>
          )
        })()}
      </Dialog>

      <Dialog
        open={gestionarSubmuestraDialogOpen}
        onClose={handleCloseGestionarSubmuestra}
        maxWidth='lg'
        fullWidth
      >
        {(() => {
          const service = gestionarSubmuestraServicio
          const probeta = gestionarSubmuestraActiva

          if (!service || !probeta) return null

          const fichaKey = getSubmuestraFichaKey(service, probeta)
          const ficha = gestionarSubmuestraFormData[fichaKey] ?? createEmptySubmuestraFicha()
          const fichaEnsayada = String(probeta?.estado ?? '').toUpperCase().includes('ENSAYADO')

          const updateFicha = (field: string, value: any) => {
            setGestionarSubmuestraFormData(prev => ({
              ...prev,
              [fichaKey]: {
                ...(prev[fichaKey] ?? createEmptySubmuestraFicha()),
                [field]: value
              }
            }))
          }

          return (
            <>
              <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#1609c8', color: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.25 }}>
                      {`Ficha de ${service?.nombre ?? 'Ensayo'}${service?.norma ? ` — ${service.norma}` : ''}`}
                    </Typography>
                    <Typography sx={{ fontSize: '0.88rem', opacity: 0.92 }}>
                      {`${gestionarRow?.numeroRcm ?? '-'} · ${probeta?.cantidad ?? '-'} prob. a ${probeta?.dias ?? '-'}d · ${formatDateDDMMYYYYDateOnlyDash(probeta?.fechaVencimiento)}`}
                    </Typography>
                  </Box>
                  <IconButton size='small' onClick={handleCloseGestionarSubmuestra} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.24)' }}>
                    <i className='ri-close-line' />
                  </IconButton>
                </Box>
              </Box>

              <DialogContent sx={{ p: 2.2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 1.5, p: 1.6, mb: 1.8, bgcolor: '#f8fafc', borderRadius: 1.6, border: '1px solid #e5e7eb' }}>
                  <Box><Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af', mb: 0.35 }}>RCM</Typography><Typography sx={{ fontWeight: 700 }}>{gestionarRow?.numeroRcm ?? '-'}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af', mb: 0.35 }}>TARJETA</Typography><Typography sx={{ fontWeight: 700 }}>{gestionarMuestra?.numeroTarjeta ?? gestionarRow?.numeroTarjeta ?? '-'}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af', mb: 0.35 }}>GRADO</Typography><Typography sx={{ fontWeight: 700 }}>{gestionarMuestra?.grado ?? gestionarRcmData?.grado ?? '-'}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af', mb: 0.35 }}>MATERIAL</Typography><Typography sx={{ fontWeight: 700 }}>{gestionarMuestra?.tipoMaterial ?? gestionarRcmData?.tipoMaterial ?? gestionarRow?.tipoMaterial ?? '-'}</Typography></Box>
                  <Box><Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#9ca3af', mb: 0.35 }}>PROBETA</Typography><Typography sx={{ fontWeight: 700 }}>{`${probeta?.cantidad ?? '-'} prob. a ${probeta?.dias ?? '-'}d — ${formatDateDDMMYYYYDateOnlyDash(probeta?.fechaVencimiento)}`}</Typography></Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1.3, mb: 1.5 }}>
                  <TextField select label='CÓD. BALANZA' value={ficha.codigoBalanza} onChange={e => updateFicha('codigoBalanza', e.target.value)}>
                    <MenuItem value=''>Seleccionar...</MenuItem>
                    <MenuItem value='M-1-01'>M-1-01</MenuItem>
                    <MenuItem value='M-1-02'>M-1-02</MenuItem>
                  </TextField>
                  <TextField select label='CÓD. PRENSA' value={ficha.codigoPrensa} onChange={e => updateFicha('codigoPrensa', e.target.value)}>
                    <MenuItem value=''>Seleccionar...</MenuItem>
                    <MenuItem value='F-1-16'>F-1-16</MenuItem>
                    <MenuItem value='F-1-20'>F-1-20</MenuItem>
                  </TextField>
                  <TextField select label='CÓD. PIÉ METRO' value={ficha.codigoPieMetro} onChange={e => updateFicha('codigoPieMetro', e.target.value)}>
                    <MenuItem value=''>Seleccionar...</MenuItem>
                    <MenuItem value='L-0-40'>L-0-40</MenuItem>
                    <MenuItem value='L-0-41'>L-0-41</MenuItem>
                  </TextField>
                  <TextField select label='TIPO MUESTRA' value={ficha.tipoMuestra} onChange={e => updateFicha('tipoMuestra', e.target.value)}>
                    <MenuItem value=''>Seleccionar...</MenuItem>
                    <MenuItem value='Cilindro G'>Cilindro G</MenuItem>
                    <MenuItem value='Cilindro H'>Cilindro H</MenuItem>
                  </TextField>
                </Box>

                <Box sx={{ border: '1px solid #dbe4ff', borderRadius: 1.6, overflow: 'hidden' }}>
                  <Box sx={{ px: 1.6, py: 1, bgcolor: '#eef2ff' }}>
                    <Typography sx={{ fontWeight: 800, color: '#1d4ed8' }}>{`Probeta N° ${probeta?.numero ?? '-'}`}</Typography>
                  </Box>
                  <Box sx={{ p: 1.8 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 1.2, mb: 1.3 }}>
                      <TextField label='CARGA (KN)' value={ficha.cargaKn} onChange={e => updateFicha('cargaKn', e.target.value)} />
                      <TextField label='MASA (KG)' value={ficha.masaKg} onChange={e => updateFicha('masaKg', e.target.value)} />
                      <TextField label='ALTURA (MM)' value={ficha.alturaMm} onChange={e => updateFicha('alturaMm', e.target.value)} />
                      <TextField label='DIÁMETRO (MM)' value={ficha.diametroMm} onChange={e => updateFicha('diametroMm', e.target.value)} />
                      <TextField label='LARGO (MM)' value={ficha.largoMm} onChange={e => updateFicha('largoMm', e.target.value)} />
                      <TextField label='ANCHO (MM)' value={ficha.anchoMm} onChange={e => updateFicha('anchoMm', e.target.value)} />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '180px 160px minmax(0, 1fr)', gap: 1.2 }}>
                      <TextField select label='TIPO FALLA' value={ficha.tipoFalla} onChange={e => updateFicha('tipoFalla', e.target.value)}>
                        <MenuItem value='A1'>A1</MenuItem>
                        <MenuItem value='A2'>A2</MenuItem>
                        <MenuItem value='B1'>B1</MenuItem>
                        <MenuItem value='B2'>B2</MenuItem>
                      </TextField>
                      <TextField select label='COND. HUMEDAD' value={ficha.condicionHumedad} onChange={e => updateFicha('condicionHumedad', e.target.value)}>
                        <MenuItem value='HUMEDA'>Húmeda</MenuItem>
                        <MenuItem value='SECA'>Seca</MenuItem>
                      </TextField>
                      <TextField label='OBSERVACIONES PROBETA' value={ficha.observaciones} onChange={e => updateFicha('observaciones', e.target.value)} />
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ px: 2.5, py: 1.8 }}>
                <Button variant='outlined' onClick={handleCloseGestionarSubmuestra} sx={{ textTransform: 'none' }}>Cancelar</Button>
                <Button variant='contained' onClick={handleSaveGestionarSubmuestra} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1e40af', '&:hover': { bgcolor: '#1d3a9b' } }}>
                  {fichaEnsayada ? 'Guardar Ficha' : 'Guardar y Marcar Submuestra Ensayada'}
                </Button>
              </DialogActions>
            </>
          )
        })()}
      </Dialog>


      {/* Menu cambio de estado - TABLA PRINCIPAL (DISABLED) */}
      <Menu
        anchorEl={markAnchorEl}
        open={Boolean(markAnchorEl) && !selectedRowId} // ÔåÉ solo si NO hay muestra abierta
        onClose={handleCloseMarkMenu}
      >
        {getStatesForRow(markRowId).map(state => (
          <MenuItem
            key={state.value}
            disabled // ÔåÉ SIEMPRE DESHABILITADO en tabla principal
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              opacity: 0.5
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: state.color,
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
            {state.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Menu cambio de estado - TABLA SERVICIOS (FUNCIONAL) */}
      <Menu
        anchorEl={markAnchorEl}
        open={Boolean(markAnchorEl) && Boolean(selectedRowId)} // ÔåÉ solo si HAY muestra abierta
        onClose={handleCloseMarkMenu}
      >
        {getStatesForServicio(markRowId, serviciosMuestra).map(state => (
          <MenuItem
            key={state.value}
            onClick={() => {
              if (!state.disabled) {
                handleMarkAs(state.value)
              }
            }}
            disabled={state.disabled}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              opacity: state.disabled ? 0.5 : 1
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                bgcolor: state.color,
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
            {state.label}
            {state.disabled && (
              <Typography variant='caption' color='text.secondary' sx={{ ml: 'auto' }}>
                (actual)
              </Typography>
            )}
          </MenuItem>
        ))}
      </Menu>

      {/* Dialog: Form "Estado Muestra" para acciones (Digitado, EVENTO, ...) */}
      <Dialog open={markDialogOpen} onClose={handleCancelMarkDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Estado Muestra</DialogTitle>
        <DialogContent>
          {markDialogAction === 'DIGITADO' && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <FormControl fullWidth size='small'>
                <InputLabel id='mark-action-label'>Acción</InputLabel>
                <Select labelId='mark-action-label' value={markDialogAction ?? ''} label='Acción' disabled>
                  <MenuItem value='DIGITADO'>Digitado</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label='N° de Informe'
                value={informeNumber}
                onChange={e => setInformeNumber(e.target.value)}
                size='small'
                fullWidth
                error={!!formErrors.informeNumber}
                helperText={formErrors.informeNumber}
              />
            </Box>
          )}

          {/* ELIMINADO: condici├│n || markDialogAction === 'CERRADO_OP' */}
          {markDialogAction === 'EVENTO' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='mark-action-state-label'>Estado</InputLabel>
                  <Select
                    labelId='mark-action-state-label'
                    value={markDialogAction ?? ''}
                    label='Estado'
                    disabled
                  >
                    <MenuItem value={markDialogAction}>
                      {OPERATIONAL_STATES.find(s => s.value === markDialogAction)?.label ?? markDialogAction}
                    </MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size='small' error={!!formErrors.eventType}>
                  <InputLabel id='event-type-label'>Tipo</InputLabel>
                  <Select
                    labelId='event-type-label'
                    value={eventType}
                    label='Tipo'
                    onChange={e => setEventType(String(e.target.value))}
                    size='small'
                  >
                    <MenuItem value='INFO_PENDIENTE'>Información Pendiente</MenuItem>
                    <MenuItem value='ERROR_INTERNO'>Error Interno</MenuItem>
                    <MenuItem value='CORRECCION'>Corrección</MenuItem>
                  </Select>
                  {formErrors.eventType && <FormHelperText>{formErrors.eventType}</FormHelperText>}
                </FormControl>
              </Box>

              <TextField
                label='Motivo'
                value={correctionMotivo}
                onChange={e => setCorrectionMotivo(e.target.value)}
                size='small'
                fullWidth
                error={!!formErrors.motivo}
                helperText={formErrors.motivo}
              />

              <TextField
                label='Observaciones'
                value={correctionObservaciones}
                onChange={e => setCorrectionObservaciones(e.target.value)}
                size='small'
                fullWidth
                multiline
                minRows={3}
              />
            </Box>
          )}

          {/* Estados que requieren observación obligatoria */}
          {['ENVIADO_DIGITACION', 'REVISADO', 'FIRMADO', 'ENVIADO'].includes(String(markDialogAction ?? '')) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth size='small'>
                <InputLabel id='mark-action-label-obs'>Acción</InputLabel>
                <Select labelId='mark-action-label-obs' value={markDialogAction ?? ''} label='Acción' disabled>
                  <MenuItem value={markDialogAction}>
                    {OPERATIONAL_STATES.find(s => s.value === markDialogAction)?.label ?? markDialogAction}
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                label='Observación (obligatoria)'
                value={correctionObservaciones}
                onChange={e => {
                  setCorrectionObservaciones(e.target.value)
                  if (formErrors.observacion) setFormErrors(prev => ({ ...prev, observacion: undefined }))
                }}
                size='small'
                fullWidth
                multiline
                minRows={3}
                error={!!formErrors.observacion}
                helperText={formErrors.observacion || 'Ingrese una observación antes de confirmar el cambio de estado.'}
              />
            </Box>
          )}

          {/* Otros actions pueden a├▒adirse aqu├¡ con condiciones similares */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelMarkDialog}>Cerrar</Button>
          <Button variant='contained' onClick={handleSaveMarkDialog} disabled={savingHistory || !validateMarkDialog(false)}>
            {savingHistory ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu contextual (por fila) - 3 puntos */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseRowMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => {
          console.log('­ƒôì Editar clicked - menuRowId:', menuRowId)
          handleEdit(menuRowId, { newTab: true })
        }}>
          <i className='ri-pencil-line' style={{ marginRight: 8, fontSize: 16, color: '#7c5c00' }} />
          Editar (Codificación)
        </MenuItem>

        {/* Ô£à CORRECCI├ôN COMPLETA: Restaurar TODO el c├│digo del historial */}
        <MenuItem onClick={async () => {
          handleCloseRowMenu()

          const row = data.find(r => r.id === menuRowId) ??
            filteredData.find(r => r.id === menuRowId)

          console.group('Historial desde menú 3 puntos')
          console.log('menuRowId (fila ID):', menuRowId)
          console.log('row encontrado:', row)

          if (!row || !row.muestra?.id) {
            console.warn('No se encontró la muestra')
            console.groupEnd()
            alert('No se encontró la muestra')

            return
          }

          const muestraId = row.muestra.id
          const cacheKey = `muestra-${muestraId}`

          console.log(`­ƒöæ Cache key:`, cacheKey)
          console.log(`­ƒôª Muestra ID:`, muestraId)
          console.log(`­ƒôï N├║mero de muestra:`, row.muestra.numeroMuestra)

          try {
            // Ô£à Verificar cach├® ANTES de hacer fetch
            const cached = servicioHistoryCache.get(cacheKey)

            if (cached) {
              console.log('Ô£à Usando historial cacheado para muestra', muestraId)
              console.log('Registros en caché:', cached.length)
              setHistServicioRows(cached)
              setHistServicioDialogOpen(true)
              console.groupEnd()

              return
            }

            console.log(`ÔÅ│ Cargando servicios de muestra ${muestraId}...`)

            const response = await fetch(`/api/muestra/${muestraId}/servicios`)

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()

            console.log('Ô£à Servicios cargados:', data)

            if (!data.servicios || data.servicios.length === 0) {
              console.warn('ÔØî No hay servicios')
              console.groupEnd()

              // Ô£à Guardar array vac├¡o en cach├® para evitar refetchs
              servicioHistoryCache.set(cacheKey, [])

              setHistServicioRows([])
              setHistServicioDialogOpen(true)

              return
            }

            // Ô£à Extraer IDs de TODOS los servicios
            const servicioIds = data.servicios
              .map((s: any) => s.id ?? s.servicioMuestraId ?? s.servicioId ?? null)
              .filter(Boolean)

            console.log(`­ƒôè IDs de servicios a consultar:`, servicioIds)

            if (servicioIds.length === 0) {
              console.warn('ÔØî No se pudieron extraer IDs')
              console.groupEnd()

              // Ô£à Guardar array vac├¡o en cach├®
              servicioHistoryCache.set(cacheKey, [])

              setHistServicioRows([])
              setHistServicioDialogOpen(true)

              return
            }

            // Ô£à Cargar historial de TODOS los servicios en paralelo
            const historialPromises = servicioIds.map(async (servicioId: number) => {
              try {
                console.log(`­ƒôí Fetching history for servicioId ${servicioId}`)
                const res = await fetch(`/api/servicioMuestra/${servicioId}/history`)

                if (!res.ok) {
                  console.warn(`ÔÜá´©Å Error al cargar historial del servicio ${servicioId}:`, res.status)

                  return []
                }

                const historial = await res.json()

                console.log(`Ô£à Historial cargado para servicio ${servicioId}:`, historial.length, 'registros')

                // Agregar informaci├│n del servicio a cada registro
                const servicio = data.servicios.find((s: any) =>
                  (s.id ?? s.servicioMuestraId ?? s.servicioId) === servicioId
                )

                return historial.map((h: any) => ({
                  ...h,
                  servicioMuestraId: servicioId,
                  servicioNombre: servicio?.nombre ?? h.ensayoServicio ?? 'N/A',
                  servicioTipo: servicio?.tipo ?? 'N/A',
                  servicioEstado: servicio?.estado ?? servicio?.estadoServicio ?? null
                }))
              } catch (err) {
                console.error(`ÔØî Error loading historial for servicio ${servicioId}:`, err)

                return []
              }
            })

            // Ô£à Esperar a que se carguen todos los historiales
            const historialArrays = await Promise.all(historialPromises)

            // Ô£à Combinar todos los historiales en un solo array
            const historialCombinado = historialArrays.flat()

            // Ô£à Ordenar por fecha descendente
            historialCombinado.sort((a, b) => {
              const dateA = new Date(a.registro || a.fechaAccion).getTime()
              const dateB = new Date(b.registro || b.fechaAccion).getTime()


              return dateB - dateA
            })

            console.log(`­ƒôè Total registros de historial combinado:`, historialCombinado.length)
            console.log(`­ƒôï Desglose por servicio:`)
            servicioIds.forEach(id => {
              const count = historialCombinado.filter(h => h.servicioMuestraId === id).length

              const nombre = data.servicios.find((s: any) =>
                (s.id ?? s.servicioMuestraId ?? s.servicioId) === id
              )?.nombre

              console.log(`  - Servicio ${id} (${nombre}): ${count} registros`)
            })

            // Ô£à Guardar en cach├® usando clave ├║nica por muestra
            servicioHistoryCache.set(cacheKey, historialCombinado)

            // Ô£à Abrir di├ílogo con el historial combinado
            setHistServicioRows(historialCombinado)
            setHistServicioDialogOpen(true)

          } catch (err) {
            console.error('ÔØî Error loading historial:', err)
            alert('Error al cargar el historial')
          } finally {
            console.groupEnd()
          }
        }}>
          <i className='ri-file-history-line' style={{ marginRight: 8, fontSize: 16, color: '#6b7280' }} />
          Historial de cambios
        </MenuItem>
      </Menu>



      {/* Dialog: Historial (mock) */}
      <Dialog
        maxWidth='lg'
        open={histDialogOpen}
        onClose={handleCloseHistDialog}
      >
        <DialogTitle>Historial de Cambios</DialogTitle>
        <DialogContent>
          {histLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>REGISTRO</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>FUNCIONARIO</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>APLICADO A</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ENSAYO/SERVICIO</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>TIPO</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>EST. ANTERIOR</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>EST. NUEVO</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>FECHA ACCIÓN</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>OBSERVACIÓN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {histRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align='center' sx={{ py: 4 }}>
                        <Typography color='text.secondary'>
                          No hay historial disponible
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    histRows.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>
                            {h.registro ? new Date(h.registro).toLocaleString('es-CL') : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{h.funcionario ?? '-'}</TableCell>
                        <TableCell>{h.aplicadoA ?? '-'}</TableCell>
                        <TableCell>{h.ensayoServicio ?? '-'}</TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={h.tipo ?? '-'}
                            size='small'
                            color={h.tipo === 'Ope' ? 'primary' : 'secondary'}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          {h.estAnterior ? (
                            (() => {
                              const info = getOperationalInfo(h.estAnterior)


                              return (
                                <Chip
                                  label={h.estAnterior}
                                  size='small'
                                  variant='filled'
                                  sx={{
                                    bgcolor: info.bgcolor,
                                    color: info.colorText,
                                    border: `1px solid ${info.border}`,
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    fontSize: '0.72rem'
                                  }}
                                />
                              )
                            })()
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          {h.estNuevo ? (
                            (() => {
                              const info = getOperationalInfo(h.estNuevo)


                              return (
                                <Chip
                                  label={h.estNuevo}
                                  size='small'
                                  variant='filled'
                                  sx={{
                                    bgcolor: info.bgcolor,
                                    color: info.colorText,
                                    border: `1px solid ${info.border}`,
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    fontSize: '0.72rem'
                                  }}
                                />
                              )
                            })()
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>
                            {h.fechaAccion ? new Date(h.fechaAccion).toLocaleDateString('es-CL') : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {h.observacion ?? '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Historial de ServicioMuestra */}
      <Dialog
        maxWidth='lg'
        fullWidth
        open={histServicioDialogOpen}
        onClose={handleCloseHistServicioDialog}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6'>Historial del Servicio</Typography>
            <IconButton size='small' onClick={handleCloseHistServicioDialog}>
              <i className='ri-close-line' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {histServicioLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>REGISTRO</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>SERVICIO</TableCell> {/* ÔåÉ NUEVA COLUMNA */}
                    <TableCell sx={{ fontWeight: 600 }}>FUNCIONARIO</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>APLICADO A</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>TIPO</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>EST. ANTERIOR</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>EST. NUEVO</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 600 }}>FECHA ACCIÓN</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>OBSERVACIÓN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {histServicioRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align='center' sx={{ py: 4 }}>
                        <Typography color='text.secondary'>
                          No hay historial disponible
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    histServicioRows.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>
                            {h.registro ? new Date(h.registro).toLocaleString('es-CL') : '-'}
                          </Typography>
                        </TableCell>

                        {/* Ô£à NUEVA CELDA: Mostrar nombre del servicio */}
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {h.servicioNombre ?? '-'}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            ID: {h.servicioMuestraId ?? '-'}
                          </Typography>
                        </TableCell>

                        <TableCell>{h.funcionario ?? '-'}</TableCell>
                        <TableCell>{h.aplicadoA ?? '-'}</TableCell>
                        <TableCell align='center'>
                          <Chip
                            label={h.tipo ?? '-'}
                            size='small'
                            color={h.tipo === 'Ope' ? 'primary' : 'secondary'}
                            variant='outlined'
                          />
                        </TableCell>
                        <TableCell align='center'>
                          {h.estAnterior ? (
                            (() => {
                              const info = getOperationalInfo(h.estAnterior)


                              return (
                                <Chip
                                  label={h.estAnterior}
                                  size='small'
                                  variant='filled'
                                  sx={{
                                    bgcolor: info.bgcolor,
                                    color: info.colorText,
                                    border: `1px solid ${info.border}`,
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    fontSize: '0.72rem'
                                  }}
                                />
                              )
                            })()
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          {h.estNuevo ? (
                            (() => {
                              const info = getOperationalInfo(h.estNuevo)


                              return (
                                <Chip
                                  label={h.estNuevo}
                                  size='small'
                                  variant='filled'
                                  sx={{
                                    bgcolor: info.bgcolor,
                                    color: info.colorText,
                                    border: `1px solid ${info.border}`,
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    fontSize: '0.72rem'
                                  }}
                                />
                              )
                            })()
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align='center'>
                          <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>
                            {h.fechaAccion ? new Date(h.fechaAccion).toLocaleDateString('es-CL') : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {h.observacion ?? '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistServicioDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

    </Card >
  )
}

export default UserListTable2


