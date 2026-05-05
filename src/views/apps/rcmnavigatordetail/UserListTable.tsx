'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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
import MenuItem from '@mui/material/MenuItem'  // ✅ UNA SOLA IMPORTACIÓN
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
import type { ColumnDef, FilterFn } from '@tanstack/react-table'

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
    raw?: any
  }
  area?: string
  familia?: string
  obra?: {
    numeroObra?: string
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
}

// Component
const columnHelper = createColumnHelper<RCM>()

// ✅ AGREGAR esta función antes del componente UserListTable2
/**
 * Obtiene los estados disponibles para un SERVICIO/ENSAYO
 * Lógica independiente de la tabla principal
 */
const getStatesForServicio = (servicioId: number | null, serviciosMuestra: any[]) => {
  if (!servicioId) return ENSAYO_STATES.map(s => ({ ...s, disabled: false }))

  // Buscar el servicio en serviciosMuestra
  const servicio = serviciosMuestra.find(
    s => (s.id ?? s.servicioMuestraId ?? s.servicioId) === servicioId
  )

  const estadoActual = servicio?.estado ?? servicio?.estadoServicio ?? 'CODIFICADO'

  console.log('📊 getStatesForServicio:', {
    servicioId,
    estadoActual,
    servicio
  })

  // Encontrar índice del estado actual
  const currentIndex = ENSAYO_STATES.findIndex(s => s.value === estadoActual)

  if (currentIndex === -1) {
    // Si no se encuentra el estado actual, mostrar todos habilitados
    return ENSAYO_STATES.map(s => ({ ...s, disabled: false }))
  }

  // Mostrar: estado actual (disabled) + siguiente (si existe)
  return ENSAYO_STATES.map((state, idx) => ({
    ...state,
    disabled: idx === currentIndex, // Solo el actual está disabled
    hidden: idx < currentIndex || idx > currentIndex + 1 // Ocultar anteriores y >siguiente
  })).filter(s => !s.hidden) // Filtrar los ocultos
}

const UserListTable2 = ({ filters }: { filters?: Filters }) => {
  const { data: session } = useSession()
  const router = useRouter()

  const getCurrentUserName = () => {
    const name = session?.user?.name
    if (typeof name === 'string' && name.trim()) return name.trim()

    const email = session?.user?.email
    if (typeof email === 'string' && email.trim()) return email.trim()

    return null
  }
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [data, setData] = useState<RCM[]>([])
  const [filteredData, setFilteredData] = useState<RCM[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [savingHistory, setSavingHistory] = useState(false)
  const [formErrors, setFormErrors] = useState<{ eventType?: string; motivo?: string; informeNumber?: string; general?: string }>({})

  // Reemplazar estados del dialog (línea ~224)
  // ...existing code...

  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)
  const [serviciosMuestra, setServiciosMuestra] = useState<any[]>([])
  const [muestraDetalle, setMuestraDetalle] = useState<any>(null)
  const [rcmDetalleModal, setRcmDetalleModal] = useState<any>(null)
  const [loadingServicios, setLoadingServicios] = useState(false)

  // ✅ AGREGAR: Estados para historial de servicioMuestra
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

  // devuelve información visual para un estado operativo
  const getOperationalInfo = (s?: string) => {
    if (!s) return { hex: undefined as string | undefined, bgcolor: 'rgba(0,0,0,0.06)', colorText: '#000', border: 'transparent' }
    const key = String(s).toUpperCase().trim()
    const st = OPERATIONAL_STATES.find(item => item.value === key || item.label.toUpperCase() === key)
    const hex = st?.color ?? '#9E9E9E'
    const bgcolor = hexToRgba(hex, 0.32) // fondo con más presencia
    const border = hexToRgba(hex, 0.42) // borde sutil más visible
    const colorText = '#7c7778' // texto siempre negro para mayor nitidez
    return { hex, bgcolor, colorText, border }
  }

  // devuelve información visual para un estado administrativo (usa ADMINISTRATIVE_STATES)
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

  // Dialog para acciones de "Marcar" (ej. Digitado / En Corrección)
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
  //    y además EVENTO (sin duplicados)
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

    // añadir EVENTO si existe y no está ya en la lista
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

  // ── Gestionar Ensayos dialog ──────────────────────────────────────────────
  const [gestionarOpen, setGestionarOpen] = useState(false)
  const [gestionarRow, setGestionarRow] = useState<RCM | null>(null)
  const [gestionarLoading, setGestionarLoading] = useState(false)
  const [gestionarServicios, setGestionarServicios] = useState<any[]>([])
  const [gestionarProbetas, setGestionarProbetas] = useState<any[]>([])
  const [gestionarMuestra, setGestionarMuestra] = useState<any>(null)
  const [gestionarRcmData, setGestionarRcmData] = useState<any>(null)
  const [gestionarEnsayadorGlobal, setGestionarEnsayadorGlobal] = useState('')
  const [gestionarEnsayadores, setGestionarEnsayadores] = useState<Record<number, string>>({})
  const [gestionarEstados, setGestionarEstados] = useState<Record<number, string>>({})
  const [gestionarSaving, setGestionarSaving] = useState(false)
  const [ensayadorOptions, setEnsayadorOptions] = useState<string[]>([])

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
    setGestionarEstados({})
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
      const combined = (Array.isArray(dataServ.servicios) ? dataServ.servicios : []).map((s: any) => {
        const match = serviciosDetalle.find((sd: any) => Number(sd?.id) === Number(s?.id))
        return {
          ...s,
          norma: s?.norma ?? match?.produto?.norma ?? match?.producto?.norma ?? null,
          estado: s?.estado ?? match?.estado ?? 'CODIFICADO'
        }
      })
      const probetas = Array.isArray(muestraFromRcm?.probetas) ? muestraFromRcm.probetas : []
      setGestionarServicios(combined)
      setGestionarProbetas(probetas)
      setGestionarMuestra({ ...(dataServ.muestra ?? {}), probetas })
      setGestionarRcmData(detalleRcm)
      // inicializar estado y ensayador local con los valores actuales de cada servicio
      const estadosInit: Record<number, string> = {}
      const ensayadoresInit: Record<number, string> = {}
      combined.forEach((s: any) => {
        estadosInit[s.id] = s.estado ?? 'CODIFICADO'
        if (s.ensayador) ensayadoresInit[s.id] = s.ensayador
      })
      setGestionarEstados(estadosInit)
      setGestionarEnsayadores(ensayadoresInit)
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
      await Promise.all(
        gestionarServicios.map(async (s: any) => {
          const estadoNuevo = gestionarEstados[s.id] ?? s.estado ?? 'CODIFICADO'
          const estadoPrev = s.estado ?? 'CODIFICADO'
          const ensayadorNuevo = gestionarEnsayadores[s.id] ?? ''
          const ensayadorPrev = s.ensayador ?? ''

          // Guardar si cambió estado o cambió ensayador
          if (estadoNuevo === estadoPrev && ensayadorNuevo === ensayadorPrev) return

          await fetch(`/api/servicioMuestra/${s.id}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tipo: 'Ens',
              estAnterior: estadoPrev,
              estNuevo: estadoNuevo,
              funcionario: user,
              aplicadoA: ensayadorNuevo || null,
              ensayoServicio: s.nombre
            })
          })
        })
      )

      // Actualizar tabla principal: recalcular estado operativo del RCM
      const todosEstados = gestionarServicios.map((s: any) => gestionarEstados[s.id] ?? s.estado ?? 'CODIFICADO')
      const estadoFinal = todosEstados.every(e => String(e).toUpperCase().includes('ENSAYADO'))
        ? 'ENSAYADO'
        : todosEstados.some(e => String(e).toUpperCase().includes('PROCESO'))
          ? 'EN_PROCESO'
          : 'CODIFICADO'

      // Ensayador predominante (del primer servicio con ensayador asignado)
      const ensayadorFinal =
        gestionarServicios
          .map((s: any) => gestionarEnsayadores[s.id] ?? s.ensayador ?? '')
          .find((e: string) => Boolean(e.trim())) ?? (gestionarRow?.ensayador ?? '')

      setData(prev => prev.map(row => {
        if (row.id === gestionarRow?.id) {
          return { ...row, estadoMuestra: estadoFinal, estadoOperativo: estadoFinal, ensayador: ensayadorFinal || row.ensayador }
        }
        return row
      }))

      setGestionarOpen(false)
    } catch (e) {
      console.error('Error guardando gestionar ensayos:', e)
    } finally {
      setGestionarSaving(false)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

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
    setMarkDialogRowId(rowId ?? null) // importante: setear el id aquí
    // reset campos del diálogo
    setInformeNumber('')
    setCorrectionMotivo('')
    setCorrectionObservaciones('')
    setEventType('')
    handleCloseMarkMenu()
    setMarkDialogOpen(true)
  }

  const handleMarkAction = async (action: string, rowId?: number | null) => {
    // acciones que requieren diálogo (ELIMINADO CERRADO_OP)
    const ACTIONS_REQUIRING_DIALOG = new Set([
      'DIGITADO',
      'EVENTO',
      'ENVIADO_DIGITACION',
      'REVISADO',
      'FIRMADO',
      'ENVIADO'
    ])
    if (ACTIONS_REQUIRING_DIALOG.has(action)) {
      // si no se pasó rowId, intenta usar el state existente (evita error)
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
          // si el dialogo de historial está abierto para la misma fila, actualizarlo también
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

    // ELIMINADO: validación para CERRADO_OP
    if (markDialogAction === 'EVENTO') {
      if (!eventType) errors.eventType = 'Seleccione tipo'
      if (!correctionMotivo || !correctionMotivo.trim()) errors.motivo = 'Ingrese motivo'
    }

    // Para estos estados la observación es obligatoria
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
        // mostrar feedback rápido en consola / UI
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

      // actualizar sólo el registro afectado en el estado local (optimista / definitivo)
      setData(prev => prev.map(d => (d.id === rcmId ? { ...d, estadoMuestra: payload.estNuevo ?? d.estadoMuestra, estadoOperativo: payload.estNuevo ?? d.estadoOperativo } : d)))
      setFilteredData(prev => prev.map(d => (d.id === rcmId ? { ...d, estadoMuestra: payload.estNuevo ?? d.estadoMuestra, estadoOperativo: payload.estNuevo ?? d.estadoOperativo } : d)))

      // actualizar caché de historial y vistas abiertas
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

      // cerrar diálogo y limpiar formulario (sin recargar toda la tabla)
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
      // Opcional: si el host expone una función para refrescar solo una fila, llámala
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
    // 2) buscar en filteredData (por si data no está sincronizada)
    r = filteredData.find(d => String((d as any).id ?? '') === sid || String((d as any)._id ?? '') === sid)
    if (r) return r
    // 3) intentar comparación numérica (si rowId convertible a número) contra id/_id
    const n = Number(rowId)
    if (!Number.isNaN(n)) {
      r = data.find(d => !Number.isNaN(Number((d as any).id)) && Number((d as any).id) === n)
      if (r) return r
      r = filteredData.find(d => !Number.isNaN(Number((d as any).id)) && Number((d as any).id) === n)
      if (r) return r
    }
    // 4) Fallback: si rowId es el índice interno de react-table (ej '0','1',...), devolver filteredData[idx]
    if (!Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n < filteredData.length) {
      // eslint-disable-next-line no-console
      console.debug('findRowById: using index-fallback for react-table row id ->', n)
      return filteredData[n]
    }
    return null
  }

  const handleEdit = (rowId: number | null, opts?: { readonly?: boolean }) => {
    if (!rowId && rowId !== 0) {
      console.warn('handleEdit: missing rowId')
      handleCloseRowMenu()
      return
    }

    // ✅ CORRECCIÓN: buscar por rcmOriginalId si menuRowId viene del menú contextual
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

    // ✅ Usar rcmOriginalId para construir la URL
    const rcmId = row.rcmOriginalId ?? row.id
    const otId = row.ordenTrabajo?.id ?? row.ordenTrabajoId ?? row.ot ?? ''

    // Si readonly, abrir encoder en nueva pestaña (comportamiento original)
    if (opts?.readonly) {
      const params = new URLSearchParams()
      params.set('rcmId', String(rcmId))
      if (otId) params.set('otId', String(otId))
      params.set('readonly', '1')
      window.open(`${window.location.origin}/en/apps/encoder?${params.toString()}`, '_blank')
      handleCloseRowMenu()
      return
    }

    // Navegación a la página de edición en la misma pestaña
    const currentLang = (locale as string) || 'es'
    router.push(`/${currentLang}/apps/rcm-edit/${rcmId}`)
    handleCloseRowMenu()
  }

  // Igual que handleEdit pero abre en modo solo lectura (readonly=1)
  const handleView = async (row: RCM | null) => {
    console.group('🔍 handleView called')
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

    // ✅ Si ya está abierto, cerrar
    if (selectedRowId === row.id) {
      console.log('🔒 Cerrando formulario')
      setSelectedRowId(null)
      setServiciosMuestra([])
      setMuestraDetalle(null)
      setRcmDetalleModal(null)
      console.groupEnd()
      return
    }

    // ✅ Abrir formulario y cargar datos
    console.log('🔓 Abriendo formulario')
    setSelectedRowId(row.id)
    setServiciosMuestra([])
    setMuestraDetalle(null)
    setRcmDetalleModal(null)
    setLoadingServicios(true)

    try {
      const muestraId = row.muestra.id
      const rcmId = row.rcmOriginalId ?? null
      const urlServicios = `/api/muestra/${muestraId}/servicios`

      console.log('📡 Fetching servicios:', urlServicios)

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
      const serviciosCombinados = (Array.isArray(data.servicios) ? data.servicios : []).map((servicio: any) => {
        const match = serviciosDetalle.find((sd: any) => Number(sd?.id) === Number(servicio?.id))
        return {
          ...servicio,
          norma: servicio?.norma ?? match?.producto?.norma ?? match?.norma ?? null,
          codigo: servicio?.codigo ?? match?.producto?.sku ?? match?.codigo ?? null,
          cantidad: servicio?.cantidad ?? match?.cantidad ?? 1,
          estado: servicio?.estado ?? match?.estado ?? 'CODIFICADO'
        }
      })

      console.log('✅ Datos cargados:', data)

      // ✅ AGREGAR: Log detallado de servicios
      console.group('🔍 DEBUG servicios cargados')
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
      console.error('❌ Error loading servicios:', err)
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

  // mock helper para historial (añadir aquí)
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

    // UX: abrir diálogo de inmediato y mostrar spinner mientras carga
    setHistRowId(rowId)
    setHistRows([])
    setHistDialogOpen(true)

    // revisar caché primero
    const cached = historyCache.get(rowId)
    if (cached) {
      setHistRows(cached)
      setHistLoading(false)
      return
    }

    setHistLoading(true)
    try {
      // si tu API soporta limitar campos/registros, añade query params (?limit=20)
      const res = await fetch(`/api/rcm/${rowId}/history`)
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('History API returned not ok:', res.status, txt)
        throw new Error('Error loading history')
      }
      const json = await res.json()
      const rows = Array.isArray(json) ? json : []
      // guardar en caché para evitar refetchs posteriores
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

  // ✅ AGREGAR: Función para manejar historial de servicioMuestra
  const handleHistorialServicio = async (servicioMuestraId: number | null) => {
    if (!servicioMuestraId) {
      console.warn('handleHistorialServicio: no servicioMuestraId provided')
      return
    }

    console.group('📋 handleHistorialServicio')
    console.log('servicioMuestraId:', servicioMuestraId)

    setHistServicioId(servicioMuestraId)
    setHistServicioRows([])
    setHistServicioDialogOpen(true)

    // Revisar caché
    const cached = servicioHistoryCache.get(servicioMuestraId)
    if (cached) {
      console.log('✅ Using cached data:', cached)
      setHistServicioRows(cached)
      setHistServicioLoading(false)
      console.groupEnd()
      return
    }

    setHistServicioLoading(true)
    try {
      const url = `/api/servicioMuestra/${servicioMuestraId}/history`
      console.log('📡 Fetching:', url)

      const res = await fetch(url)

      console.log('📥 Response status:', res.status)
      console.log('📥 Response headers:', Object.fromEntries(res.headers.entries()))

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('❌ API error:', res.status, txt)
        throw new Error(`HTTP ${res.status}: ${txt}`)
      }

      const json = await res.json()
      console.log('✅ Response JSON:', json)

      const rows = Array.isArray(json) ? json : []
      console.log('📊 Rows count:', rows.length)

      // Guardar en caché
      servicioHistoryCache.set(servicioMuestraId, rows)
      setHistServicioRows(rows)
    } catch (err) {
      console.error('❌ Error loading servicio history:', err)
      setHistServicioRows([])
    } finally {
      setHistServicioLoading(false)
      console.groupEnd()
    }
  }


  // En handleMarkAs, después de invalidar servicioHistoryCache.delete(markRowId)
  const handleMarkAs = async (nuevoEstado: string) => {
    if (!markRowId) {
      console.warn('handleMarkAs: no markRowId')
      return
    }

    console.group('🔄 handleMarkAs')
    console.log('servicioMuestraId:', markRowId)
    console.log('nuevo estado:', nuevoEstado)

    // Buscar el servicio para obtener estado actual
    const servicio = serviciosMuestra.find(
      s => (s.id ?? s.servicioMuestraId ?? s.servicioId) === markRowId
    )

    const estadoActual = servicio?.estado ?? servicio?.estadoServicio ?? 'CODIFICADO'

    try {
      // ✅ CORRECCIÓN: Asegurar que servicioMuestraId se envíe correctamente
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
      console.log('📡 POST:', url, payload)

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('📥 Response status:', res.status)

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('❌ API error:', res.status, txt)
        throw new Error(`HTTP ${res.status}: ${txt}`)
      }

      const result = await res.json()
      console.log('✅ Estado actualizado:', result)

      // Actualizar UI localmente
      setServiciosMuestra(prev => prev.map(s => {
        const id = s.id ?? s.servicioMuestraId ?? s.servicioId
        return id === markRowId
          ? { ...s, estado: nuevoEstado }
          : s
      }))

      // ✅ INVALIDAR caché del servicio individual
      servicioHistoryCache.delete(markRowId)

      // ✅ AGREGAR: Invalidar caché combinada de la muestra
      const row = findRowById(selectedRowId)
      if (row?.muestra?.id) {
        const cacheKey = `muestra-${row.muestra.id}`
        console.log('🗑️ Invalidando caché combinada:', cacheKey)
        servicioHistoryCache.delete(cacheKey)
      }

      handleCloseMarkMenu()
    } catch (err) {
      console.error('❌ Error updating servicio estado:', err)
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

        // ✅ AGREGAR: fetch clientes
        const clienteIds = Array.from(new Set(raw.map((r: any) => r.clienteId ?? r.cliente?.id).filter(Boolean)))
        const clienteMap: Record<string, any> = {}
        if (clienteIds.length > 0) {
          console.log('🔍 Fetching clientes:', clienteIds)
          await Promise.all(
            clienteIds.map(async id => {
              try {
                const res = await fetch(`/api/cliente/${id}`)
                if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                  const data = await res.json()
                  clienteMap[String(id)] = data
                  console.log(`✅ Loaded cliente ${id}:`, data)
                }
              } catch (e) {
                console.warn('No se pudo cargar cliente', id, e)
              }
            })
          )
          console.log('📦 clienteMap final:', clienteMap)
        }

        // DEBUG: mostrar muestra de clienteMap
        if (Object.keys(clienteMap).length) {
          console.debug('clienteMap sample:', Object.keys(clienteMap)[0], clienteMap[Object.keys(clienteMap)[0]])
        }

        // --- fetch ordenes de trabajo ---
        const ordenIds = Array.from(new Set(raw.map((r: any) => r.ordenTrabajoId ?? r.ordenTrabajo?.id).filter(Boolean)))
        const ordenMap: Record<string | number, any> = {}
        if (ordenIds.length) {
          console.log('🔍 Fetching ordenes de trabajo:', ordenIds)
          await Promise.all(
            ordenIds.map(async id => {
              try {
                // ✅ CAMBIAR el endpoint si es incorrecto
                const or = await fetch(`/api/ot/${id}`) // ← cambiar de /api/orden-trabajo/ a /api/ot/

                if (!or.ok) {
                  console.warn(`❌ ordenTrabajo ${id} responded ${or.status}`)
                  return
                }

                const ct = (or.headers.get('content-type') || '').toLowerCase()

                if (!ct.includes('application/json')) {
                  const txt = await or.text().catch(() => '')
                  console.warn(`⚠️ ordenTrabajo ${id} returned non-json (${ct}):`, txt.slice(0, 200))
                  return
                }

                const data = await or.json()
                ordenMap[String(id)] = data
                console.log(`✅ Loaded ordenTrabajo ${id}:`, data)

              } catch (err) {
                console.warn(`❌ Error loading ordenTrabajo ${id}:`, err)
              }
            })
          )
          console.log('📦 ordenMap final:', ordenMap)
        }

        // DEBUG: mostrar muestra de ordenMap
        if (Object.keys(ordenMap).length) {
          console.group('🔍 DEBUG ordenMap')
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

        // DEBUG: mostrar muestra de ordenMap para inspección
        if (Object.keys(ordenMap).length) {
          console.group('🔍 DEBUG ordenMap')
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

        // CORRECCIÓN: buscar servicioId, NO servicioRCMId
        const missingServiceIds = allMuestras
          .filter((m: any) => !m.servicioRCM && (m.servicioRCMId || m.servicioId))
          .map((m: any) => m.servicioRCMId || m.servicioId)
          .filter(Boolean)

        const servicioRCMMap: Record<string, any> = {}
        if (missingServiceIds.length > 0) {
          console.log('🔍 Fetching servicioRCM for IDs:', missingServiceIds)
          await Promise.all(
            missingServiceIds.map(async (id: any) => {
              try {
                const res = await fetch(`/api/servicioRCM/${id}`)
                if (res.ok) {
                  const data = await res.json()
                  servicioRCMMap[String(id)] = data
                  console.log(`✅ Loaded servicioRCM ${id}:`, data)
                } else {
                  console.warn(`❌ servicioRCM ${id} responded ${res.status}`)
                }
              } catch (e) {
                console.warn('No se pudo cargar servicioRCM', id, e)
              }
            })
          )
          console.log('📦 servicioRCMMap final:', servicioRCMMap)
        }

        // normalizar y enriquecer - EXPANDIR POR MUESTRAS
        const normalized = raw.flatMap((r: any) => {
          const obraObj = r.obra ?? obraMap[r.obraId] ?? obraMap[r.obra?.id] ?? null
          const numeroObra =
            obraObj?.numeroObra ??
            obraObj?.numero_obra ??
            obraObj?.numero ??
            obraObj?.numeroobra ??
            (r.obraId ? String(r.obraId) : undefined)

          // normalizar cliente: puede venir como string, objeto con keys distintas o en raíz
          let rawCliente = r.cliente ?? r.clienteData ?? r.clienteInfo ?? null
          // si no hay objeto cliente, intentar resolver desde clienteMap usando clienteId
          if (!rawCliente) {
            const cid = r.clienteId ?? r.clienteid ?? r.cliente_id ?? r.cliente?.id ?? null
            if (cid != null) {
              rawCliente = clienteMap[String(cid)] ?? rawCliente
            }
          }
          let clienteNombre: string | undefined = undefined
          let clienteComuna: string | undefined = undefined
          if (rawCliente) {
            if (typeof rawCliente === 'string') {
              clienteNombre = rawCliente
            } else if (typeof rawCliente === 'object') {
              clienteNombre = rawCliente.nombreCliente ?? rawCliente.nombre ?? rawCliente.name ?? rawCliente.razonSocial ?? rawCliente.razon_social ?? rawCliente.nombre_cliente
              clienteComuna = rawCliente.comuna ?? rawCliente.comunaName ?? rawCliente.comuna_nombre ?? rawCliente.city ?? rawCliente.localidad
            }
          }
          // fallback a campos en raíz si existen
          clienteNombre = clienteNombre ?? r.clienteNombre ?? r.nombreCliente ?? r.cliente_name ?? r.cliente_nombre ?? r.nombre
          clienteComuna = clienteComuna ?? r.clienteComuna ?? r.comuna ?? r.comunaCliente ?? null

          // DEBUG: logear información para investigar por qué cliente/comuna quedan vacíos
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

          // --- CORRECCIÓN: NORMALIZAR ORDEN DE TRABAJO ---
          const orderKey = r.ordenTrabajoId ?? r.ordenTrabajo?.id ?? r.ordenTrabajo?._id ?? ''
          const orderObj = orderKey ? (ordenMap[String(orderKey)] ?? null) : null

          // ✅ CORRECCIÓN: priorizar 'correlativ' (sin 'o')
          const orderCorrel =
            orderObj?.correlativ ??           // ← PRIMERO: campo exacto de la BD
            r.ordenTrabajo?.correlativ ??     // ← backup desde objeto anidado
            orderObj?.correlativo ??          // ← fallback con 'o'
            orderObj?.numero ??               // ← agregar correlativo como último recurso
            r.ordenTrabajo?.correlativo ??    // ← también desde r.ordenTrabajo
            r.ot ??                           // ← último recurso: r.ot
            null

          // LOG DETALLADO para debugging - MOSTRAR TODOS LOS CAMPOS del orderObj
          if (r.id <= 3) {
            console.group(`🔧 DEBUG OT - RCM ${r.id}`)
            console.log('orderKey:', orderKey)
            console.log('📦 orderObj COMPLETO (todos los campos):', orderObj)
            console.log('🔍 Object.keys(orderObj):', orderObj ? Object.keys(orderObj) : [])
            console.log('✅ orderObj.correlativ (SIN o):', orderObj?.correlativ)
            console.log('⚠️ orderObj.correlativo (CON o):', orderObj?.correlativo)
            console.log('📋 orderCorrel final extraído:', orderCorrel)
            console.log('---')
            console.log('r.ordenTrabajo original:', r.ordenTrabajo)
            console.log('r.ot original:', r.ot)
            console.groupEnd()
          }

          // Normalizar objeto ordenTrabajo
          const ordenTrabajoNormalized = {
            ...(orderObj ?? r.ordenTrabajo ?? {}),
            id: r.ordenTrabajoId ?? orderObj?.id ?? r.ordenTrabajo?.id ?? undefined,
            correlativ: orderCorrel,  // ✅ usar 'correlativ' como campo principal
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
            // ✅ DEBUG: Verificar TODOS los campos de muestra
            if (r.id <= 3) { // solo primeros 3 RCMs
              console.group(`🔍 DEBUG MUESTRA COMPLETA - RCM ${r.id}-${idx}`)
              console.log('📦 muestra RAW (todos los campos):', muestra)
              console.log('📋 Keys disponibles en muestra:', Object.keys(muestra))
              console.log('🔢 numeroTarjeta directo:', muestra.numeroTarjeta)
              console.log('🔢 numero_tarjeta:', muestra.numero_tarjeta)
              console.log('🔢 tarjeta.numero:', muestra.tarjeta?.numero)
              console.log('🔢 tarjeta.numeroTarjeta:', muestra.tarjeta?.numeroTarjeta)
              console.log('🔢 nroTarjeta:', muestra.nroTarjeta)
              console.log('🔢 nro_tarjeta:', muestra.nro_tarjeta)
              console.log('🔢 cardNumber:', muestra.cardNumber)
              console.log('🔢 card_number:', muestra.card_number)
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

            // 3) Fallback: array servicios en RCM raíz
            if (!producto && Array.isArray(r.servicios) && r.servicios.length > 0) {
              const svc = r.servicios[0]
              producto = svc.producto ?? svc.servicio?.producto ?? null
            }

            // 4) Fallback: servicio directo en RCM raíz
            if (!producto) {
              producto = r.servicio?.producto ?? r.servicioData?.producto ?? r.producto ?? null
            }

            // Extraer área y familia del producto con múltiples fallbacks
            const areaProducto = producto?.area?.nombre ??
              producto?.area?.name ??
              producto?.areaNombre ??  // ← CORREGIDO
              (typeof producto?.area === 'string' ? producto.area : null)

            const familiaProducto = producto?.familia?.nombre ??
              producto?.familia?.name ??
              producto?.familiaNombre ??  // ← CORREGIDO
              (typeof producto?.familia === 'string' ? producto.familia : null)

            // Fallbacks finales desde RCM raíz
            const areaFinal = areaProducto ?? r.area ?? null
            const familiaFinal = familiaProducto ?? r.familia ?? null
            const serviciosMuestra = Array.isArray(muestra.servicios) ? muestra.servicios : []
            const totalEnsayos = serviciosMuestra.reduce((acc: number, servicioItem: any) => acc + Number(servicioItem?.cantidad ?? 1), 0)
            const ensayados = serviciosMuestra.reduce((acc: number, servicioItem: any) => {
              const estadoServicio = String(servicioItem?.estado ?? '').toUpperCase().trim()
              return acc + (estadoServicio === 'ENSAYADO' ? Number(servicioItem?.cantidad ?? 1) : 0)
            }, 0)
            const estadosServicios = serviciosMuestra
              .map((servicioItem: any) => String(servicioItem?.estado ?? '').toUpperCase().trim())
              .filter((estado: string) => Boolean(estado))
            const estadoDesdeEnsayo = estadosServicios.includes('EN_PROCESO')
              ? 'EN_PROCESO'
              : estadosServicios.includes('CODIFICADO')
                ? 'CODIFICADO'
                : estadosServicios.includes('ENSAYADO')
                  ? 'ENSAYADO'
                  : (estadosServicios[0] ?? '')
            const probetas = Array.isArray(muestra.probetas) ? muestra.probetas : []
            const nextProbeta = probetas
              .map((probeta: any) => ({
                ...probeta,
                fechaVencimiento: probeta?.fechaVencimiento ?? null
              }))
              .filter((probeta: any) => probeta.fechaVencimiento)
              .sort((left: any, right: any) => compareDateOnly(left.fechaVencimiento, right.fechaVencimiento))[0] ?? null
            const tipoServicio =
              servicio?.nombre ??
              servicioRCM?.nombre ??
              serviciosMuestra[0]?.nombre ??
              r.tipoServicio ??
              null
            const ss = r.ss ?? orderObj?.clave ?? r.ordenTrabajo?.clave ?? null
            // Ensayador de laboratorio: viene del historial de servicios (aplicadoA), fallback al usuario de OT
            const ensayadorDesdeServicio = serviciosMuestra
              .map((sm: any) => sm?.history?.[0]?.aplicadoA ?? sm?.aplicadoA ?? null)
              .find((e: string | null) => Boolean(e)) ?? null
            const ensayador = ensayadorDesdeServicio ?? null
            const estadoMuestraResuelto =
              String(muestra.estado ?? '').trim() ||
              String(servicioRCM?.estado ?? '').trim() ||
              estadoDesdeEnsayo ||
              String(r.estadoOperativo ?? '').trim() ||
              ''

            // LOG (mantener solo para debug)
            console.group(`🔍 DEBUG Muestra ${r.id}-${idx}`)
            console.log('📦 Muestra:', muestra)
            console.log('🔗 servicioRCM:', servicioRCM)
            console.log('⚙️ servicio:', servicio)
            console.log('📋 producto final:', producto)
            console.log('✅ area:', areaFinal)
            console.log('✅ familia:', familiaFinal)
            console.groupEnd()

            return {
              id: Number(`${r.id}${String(idx).padStart(3, '0')}`),
              rcmOriginalId: r.id,
              numeroRcm: r.numeroRcm,

              // ✅ Agregar numeroTarjeta al objeto retornado
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
              estadoMuestra: estadoMuestraResuelto,
              estadoOperativo: estadoMuestraResuelto,
              estadoAdministrativo: r.estadoAdministrativo ?? r.estado_administrativo ?? '',
              tipoServicio,
              proximoVencimiento: nextProbeta?.fechaVencimiento ?? null,
              diasVencimiento: nextProbeta?.fechaVencimiento ? diffDaysFromToday(nextProbeta.fechaVencimiento) : null,
              cantidadProbetas: probetas.length,
              ensayador,
              ensayos: {
                total: totalEnsayos,
                ensayados,
                pendientes: Math.max(0, totalEnsayos - ensayados)
              },
              cliente: {
                nombreCliente: clienteNombre ?? null,
                comuna: clienteComuna ?? null,
                raw: rawCliente ?? null
              },
              obra: {
                numeroObra: numeroObra ?? undefined
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
        console.group('📊 VERIFICACIÓN FINAL DE DATOS')
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

  // aplicar filtro cuando cambian filters
  useEffect(() => {
    console.log('UserListTable - filters changed:', filters)
    applyDateFilter(data, filters)
  }, [filters, data])

  const toDateOnly = (input: any): Date | null => {
    if (!input) return null
    // Si ya es Date
    if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), input.getDate())
    const s = String(input)

    // Si viene en formato YYYY-MM-DD (o empieza así), parsearlo directamente para evitar shift por timezone
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    }

    // Fallback: crear Date y tomar sólo la parte fecha local
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

  // helper: formatear sólo fecha a DD/MM/AAAA (sin hora)
  const formatDateDDMMYYYYDateOnly = (v: any) => {
    if (!v) return '-'
    const d = v instanceof Date ? v : new Date(v)
    if (isNaN(d.getTime())) return '-'
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  const formatDateDDMMYYYYDateOnlyDash = (v: any) => {
    if (!v) return '-'
    const d = v instanceof Date ? v : new Date(v)
    if (isNaN(d.getTime())) return '-'
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return formatDateDDMMYYYYDateOnlyDash(new Date(t))

    const d = new Date(t)
    if (isNaN(d.getTime())) return null
    return formatDateDDMMYYYYDateOnlyDash(d)
  }

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

  const getVencimientoMeta = (raw?: string | null, cantidadProbetas = 0) => {
    const formatted = formatDateLikeDDMMYYYYDash(raw)
    const days = diffDaysFromToday(raw)
    const unit = cantidadProbetas === 1 ? 'probeta' : 'probetas'

    let suffix = ''
    let colors = {
      color: '#b26a00',
      borderColor: 'rgba(237, 168, 32, 0.65)',
      backgroundColor: 'rgba(255, 196, 84, 0.14)'
    }

    if (days !== null) {
      if (days <= 0) {
        suffix = '(HOY)'
        colors = {
          color: '#d84f2a',
          borderColor: 'rgba(255, 112, 67, 0.7)',
          backgroundColor: 'rgba(255, 138, 101, 0.12)'
        }
      } else if (days === 1) {
        suffix = '(MAÑANA)'
      } else {
        suffix = `(${days}d)`
      }
    }

    return {
      label: formatted ? `${formatted} ${suffix}`.trim() : '-',
      helper: cantidadProbetas > 0 ? `${cantidadProbetas} ${unit}` : 'Sin probetas',
      colors
    }
  }

  const getEnsayosMeta = (ensayos?: RCM['ensayos']) => {
    const total = Number(ensayos?.total ?? 0)
    const ensayados = Number(ensayos?.ensayados ?? 0)
    const pendientes = Math.max(0, Number(ensayos?.pendientes ?? total - ensayados))

    return { total, ensayados, pendientes }
  }

  const applyDateFilter = (rows: RCM[], filters?: Filters) => {
    console.log('applyDateFilter called, rows:', rows.length, 'filters:', filters)

    // start with all rows
    let result = rows.slice()

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

    // Estado Operativo filtering (if provided) — case-insensitive contains
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

    // Estado Administrativo filtering (if provided) — case-insensitive contains
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
    // Compara por nombre normalizado (quita acentos, case-insensitive). Si se envía id numérico, lo acepta.
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

    // Familia filtering: comparar por nombre (normalizado). Si se envía id numérico lo acepta como fallback.
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
        // (mantener sólo mientras debuggeas)
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

    console.log('applyDateFilter result count:', result.length)
    setFilteredData(result)
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
        cell: ({ row }) => <Checkbox size='small' checked={Boolean((rowSelection as any)[row.id])} onChange={e => setRowSelection(prev => ({ ...prev, [row.id]: e.target.checked }))} />
      },
      {
        id: 'rcm',
        header: 'RCM',
        accessorFn: row => [
          row.numeroRcm,
          row.ss,
          row.ot,
          row.obra?.numeroObra,
          row.area,
          row.tipoServicio,
          row.ensayador
        ].filter(Boolean).join(' '),
        cell: ({ row }: any) => {
          const numeroRcm = row.original.numeroRcm || '-'
          const ss = String(row.original.ss ?? '').trim()

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
              <Typography variant='body2' sx={{ fontSize: '0.95rem', fontWeight: 800, color: 'primary.main' }}>
                {numeroRcm}
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500 }}>
                {ss ? `SS: ${ss}` : '-'}
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
        id: 'areaTipoServicio',
        header: 'Área / Tipo Servicio',
        accessorFn: row => `${row.area ?? ''} ${row.tipoServicio ?? ''}`.trim(),
        cell: ({ row }) => {
          const area = row.original.area
          const tipoServicio = row.original.tipoServicio

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
                  maxWidth: 220,
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
        header: 'F. Codificación',
        accessorKey: 'fechaCodificacion',
        cell: ({ row }) => <span>{row.original.fechaCodificacion ? formatDateDDMMYYYYDateOnlyDash(row.original.fechaCodificacion) : '-'}</span>
      },
      {
        id: 'proximoVencimiento',
        header: 'Próx. Vencimiento',
        accessorKey: 'proximoVencimiento',
        cell: ({ row }) => {
          if (!row.original.proximoVencimiento) {
            return (
              <Typography variant='body2' color='text.disabled' sx={{ fontWeight: 500, textAlign: 'center', width: '100%' }}>
                FIFO
              </Typography>
            )
          }

          const meta = getVencimientoMeta(row.original.proximoVencimiento, row.original.cantidadProbetas ?? 0)

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.35, width: '100%' }}>
              <Chip
                size='small'
                label={meta.label}
                variant='outlined'
                sx={{
                  fontWeight: 800,
                  color: meta.colors.color,
                  borderColor: meta.colors.borderColor,
                  bgcolor: meta.colors.backgroundColor
                }}
              />
              <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center' }}>
                {meta.helper}
              </Typography>
            </Box>
          )
        }
      },
      {
        id: 'ensayos',
        header: 'Ensayos',
        accessorFn: row => row.ensayos?.total ?? 0,
        cell: ({ row }) => {
          const ensayos = getEnsayosMeta(row.original.ensayos)

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0.75 }}>
              <Typography variant='body2' sx={{ fontWeight: 800 }}>
                {ensayos.total}
              </Typography>
              {ensayos.total > 0 && (ensayos.ensayados > 0 || ensayos.pendientes > 0) ? (
                <Typography variant='caption' sx={{ color: 'primary.main', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  ✓{ensayos.ensayados} • {ensayos.pendientes}
                </Typography>
              ) : null}
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
        id: 'ensayador',
        header: 'Ensayador',
        accessorFn: row => row.ensayador ?? '',
        cell: ({ row }) => {
          const ensayador = String(row.original.ensayador ?? '').trim()
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0.75 }}>
              <i className='ri-user-3-line' style={{ fontSize: 16, color: ensayador ? '#424242' : '#ef6c00' }} />
              {ensayador ? (
                <Typography variant='body2'>{ensayador}</Typography>
              ) : (
                <Typography variant='body2' sx={{ color: '#ef6c00' }}>Sin asignar</Typography>
              )}
            </Box>
          )
        }
      },
      {
        id: 'acciones',
        header: 'ACCIONES',
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

            <Tooltip title='Gestionar Ensayos' placement='top'>
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
  }, []) // ✅ QUITAR 'rowSelection' de las dependencias

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFromLeafRows: true, // ← AGREGAR esto
    maxLeafRowFilterDepth: 0 // ← AGREGAR esto
  })

  // <-- añadir: conteo de filas seleccionadas
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
        row.tipoServicio ?? '-',
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

  // reemplazado: indicadores usando OPERATIONAL_STATES.value para comparaciones
  /*
  const indicators = useMemo(() => {
    const total = filteredData.length

    // helper: normalizar estado operativo a valor comparable (por ejemplo "CODIFICADO" / "EN_PROCESO")

    }
      CODIFICADO: 'CODIFICADO',
      EN_PROCESO: 'EN_PROCESO',
      ENSAYADO: 'ENSAYADO',
      ENVIADO_DIGITACION: 'ENVIADO_DIGITACION',
      DIGITADO: 'DIGITADO',
      REVISADO: 'REVISADO',
      FIRMADO: 'FIRMADO',
      ENVIADO: 'ENVIADO',
      EVENTO: 'EVENTO',
      CERRADO_OP: 'CERRADO_OP'
    } as const

    const countIf = (pred: (opVal: string, adm: string) => boolean) =>
      filteredData.reduce((acc, d) => {
        const opRaw = d.estadoOperativo ?? (Array.isArray(d.servicios) && d.servicios.length ? (d.servicios[0] as any).estado : '') ?? ''
        const admRaw = d.estadoAdministrativo ?? ''
        const opVal = normOp(opRaw)
        const adm = normAdmText(admRaw)
        return acc + (pred(opVal, adm) ? 1 : 0)
      }, 0)

    // Por Ensayar: estados CODIFICADO o EN_PROCESO (o admin menciona 'ensayar'/'codificado'/'en proceso')
    const porEnsayar = countIf((op, adm) => {
      if ([S.CODIFICADO, S.EN_PROCESO].includes(op as any)) return true
      return adm.includes('ensayar') || adm.includes('codificad') || adm.includes('en proceso')
    })

    // Por Digitar: estado ENSAYADO o ENVIADO_DIGITACION (pendiente digitación) y NO estar ya DIGITADO
    const porDigitar = countIf((op, adm) => {
      if (op === S.ENSAYADO || op === S.ENVIADO_DIGITACION) return true
      // fallback por administrativa que indique digitación pendiente (no digitado aún)
      if (adm.includes('digit') && !adm.includes('digitad')) return true
      return false
    })

    // Por Revisar: REVISADO o admin menciona revisar/revisado
    const porRevisar = countIf((op, adm) => op === S.DIGITADO)

    // Por Corregir: estado EVENTO
    const porCorregir = countIf((op, adm) => op === S.EVENTO)

    // Por Firmar: estado FIRMADO (o admin menciona 'firmado' pero no enviado)
    const porFirmar = countIf((op, adm) => op === S.REVISADO)

    // Por Enviar (Firmados): estado ENVIADO o admin contiene 'enviar' + 'firmad'
    const porEnviarFirmados = countIf((op, adm) => op === S.FIRMADO)

    // Firmados Pagados: operativo FIRMADO y administrativo PAGADO (usando ADMINISTRATIVE_STATES)
    const firmadosPagados = countIf((op, adm) => {
      // requiere operativo exactamente FIRMADO (valor de OPERATIONAL_STATES)
      if (op !== S.FIRMADO) return false

      // adm viene normalizado (lowercase, sin tildes) por normalizeText
      // 1) comprobar por label mapeando ADMINISTRATIVE_STATES
      const admMatch = ADMINISTRATIVE_STATES.find(a => normalizeText(a.label) === adm)
      if (admMatch) return admMatch.value === 'PAGADO'

      // 2) fallback textual (acepta 'pag', 'pagad', 'pagado')
      return adm.includes('pag') || adm.includes('pagad') || adm.includes('pagado')
    })

    return {
      total,
      porEnsayar,
      porDigitar,
      porRevisar,
      porCorregir,
      porFirmar,
      porEnviarFirmados,
      firmadosPagados
    }
  }, [filteredData])
  */

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

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} style={{ textAlign: 'center' }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ verticalAlign: 'middle', textAlign: cell.column.id === 'acciones' || cell.column.id === 'select' || cell.column.id === 'proximoVencimiento' ? 'center' : 'left' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component='div'
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
        onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
      />

      <Dialog
        open={Boolean(selectedRowId)}
        onClose={() => {
          setSelectedRowId(null)
          setServiciosMuestra([])
          setMuestraDetalle(null)
          setRcmDetalleModal(null)
        }}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            maxWidth: 720
          }
        }}
      >
        <DialogContent sx={{ p: 0, bgcolor: '#f4f5f7' }}>
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
            const estadoActual = row?.estadoMuestra ?? row?.estadoOperativo ?? 'CODIFICADO'

            const estadoPillSx = (raw?: string) => {
              const key = String(raw ?? '').toUpperCase().trim()
              if (key.includes('ENSAYADO')) {
                return {
                  color: '#08794c',
                  borderColor: 'rgba(16, 185, 129, 0.55)',
                  bgcolor: 'rgba(16, 185, 129, 0.16)'
                }
              }
              if (key.includes('PROCESO')) {
                return {
                  color: '#2557d6',
                  borderColor: 'rgba(59, 130, 246, 0.55)',
                  bgcolor: 'rgba(59, 130, 246, 0.14)'
                }
              }
              if (key.includes('CODIFIC')) {
                return {
                  color: '#4b5563',
                  borderColor: 'rgba(107, 114, 128, 0.45)',
                  bgcolor: 'rgba(156, 163, 175, 0.16)'
                }
              }
              return {
                color: '#334155',
                borderColor: 'rgba(148, 163, 184, 0.5)',
                bgcolor: 'rgba(148, 163, 184, 0.18)'
              }
            }

            const belongsTag = rcmData?.codigoAgrupador?.codigo ?? row?.ss ?? '---'
            const belongsParts = [
              rcmData?.obra?.numeroObra ?? row?.obra?.numeroObra ?? row?.otDisplay ?? '-',
              rcmData?.cliente?.nombreCliente ?? row?.cliente?.nombreCliente ?? '-',
              rcmData?.obra?.nombreObra ?? rcmData?.obra?.nombre ?? ''
            ].filter(Boolean)
            const belongsText = belongsParts.join(' · ')

            const ensayador = row?.ensayador ?? rcmData?.ordenTrabajo?.user?.name ?? '-'
            const ensayosCount = serviciosMuestra.length
            const submuestrasCount = probetas.length

            const detailLeft = [
              { label: 'ÁREA', value: rcmData?.area?.nombre ?? row?.area ?? '-' },
              { label: 'TIPO SERVICIO', value: row?.tipoServicio ?? serviciosMuestra?.[0]?.nombre ?? '-' },
              { label: 'SEDE', value: rcmData?.sede ?? '-' },
              { label: 'F. MUESTREO', value: formatDateDDMMYYYYDateOnlyDash(rcmData?.fechaMuestreo ?? row?.fechaMuestreo) },
              { label: 'F. INGRESO', value: formatDateDDMMYYYYDateOnlyDash(rcmData?.fechaIngreso ?? row?.fechaIngreso) },
              { label: 'MATERIAL', value: muestra?.tipoMaterial ?? rcmData?.tipoMaterial ?? '-' }
            ]

            const detailRight = [
              { label: 'ÍTEM', value: muestra?.item ?? rcmData?.item ?? '-' },
              { label: 'ELEMENTO', value: muestra?.elemento ?? rcmData?.elemento ?? '-' },
              { label: 'GRADO', value: muestra?.grado ?? rcmData?.grado ?? '-' },
              { label: 'TARJETA', value: muestra?.numeroTarjeta ?? row?.numeroTarjeta ?? rcmData?.numeroTarjeta ?? '-' },
              { label: '# TOMA', value: rcmData?.tomaMuestra ?? '-' },
              { label: 'PROCEDENCIA', value: muestra?.procedencia ?? rcmData?.procedencia ?? '-' }
            ]

            return (
              <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1.05 }}>
                      {row?.numeroRcm ?? '-'}
                    </Typography>
                    <Chip
                      label={estadoTipo}
                      size='small'
                      sx={{
                        height: 24,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#1f3fb8',
                        borderColor: 'rgba(77, 121, 255, 0.45)',
                        bgcolor: 'rgba(77, 121, 255, 0.16)'
                      }}
                      variant='outlined'
                    />
                    <Chip
                      label={getOperationalLabel(estadoActual)}
                      size='small'
                      sx={{
                        height: 24,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        ...estadoPillSx(String(estadoActual))
                      }}
                      variant='outlined'
                    />
                  </Box>

                  <Button
                    size='small'
                    variant='outlined'
                    color='inherit'
                    onClick={() => {
                      setSelectedRowId(null)
                      setServiciosMuestra([])
                      setMuestraDetalle(null)
                      setRcmDetalleModal(null)
                    }}
                    sx={{ minWidth: 0, px: 1.25 }}
                  >
                    <i className='ri-close-line' style={{ marginRight: 4 }} /> Cerrar
                  </Button>
                </Box>

                <Box
                  sx={{
                    mb: 2.1,
                    p: 1.35,
                    borderRadius: 1,
                    border: '1px solid #d7dcee',
                    bgcolor: '#eceffd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    flexWrap: 'wrap'
                  }}
                >
                  <Typography sx={{ fontSize: '0.83rem', fontWeight: 700, color: '#7a8498', letterSpacing: 0.5 }}>
                    PERTENECE A
                  </Typography>
                  <Chip
                    label={belongsTag}
                    size='small'
                    sx={{
                      height: 24,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#1f3fb8',
                      borderColor: 'rgba(77, 121, 255, 0.5)',
                      bgcolor: 'rgba(77, 121, 255, 0.14)'
                    }}
                    variant='outlined'
                  />
                  <Typography sx={{ fontSize: '0.95rem', color: '#374151' }}>
                    {belongsText}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 2.5 }}>
                  {[detailLeft, detailRight].map((list, colIndex) => (
                    <Box key={colIndex}>
                      {list.map(item => (
                        <Box
                          key={item.label}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '136px minmax(0, 1fr)',
                            alignItems: 'center',
                            py: 0.95,
                            borderBottom: '1px solid #d7dde9',
                            columnGap: 1.5
                          }}
                        >
                          <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: '#6b7280', letterSpacing: 0.35 }}>
                            {item.label}
                          </Typography>

                          {item.label === 'ÁREA' ? (
                            <Chip
                              label={item.value}
                              size='small'
                              sx={{
                                height: 24,
                                width: 'fit-content',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#6f39cf',
                                borderColor: 'rgba(140, 94, 255, 0.45)',
                                bgcolor: 'rgba(140, 94, 255, 0.14)'
                              }}
                              variant='outlined'
                            />
                          ) : item.label === 'TARJETA' ? (
                            <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#1d4ed8' }}>
                              {item.value || '-'}
                            </Typography>
                          ) : (
                            <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#111827' }}>
                              {item.value || '-'}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>

                <Typography sx={{ mb: 1.05, fontSize: '1rem', fontWeight: 800, color: '#374151', letterSpacing: 0.35 }}>
                  ENSAYOS ({ensayosCount})
                </Typography>

                {loadingServicios ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant='outlined' sx={{ mb: 2.5, borderColor: '#d7dde9', borderRadius: 1.25 }}>
                    <Table size='small'>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#eef1f6' }}>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.78rem' }}>SKU</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.78rem' }}>Ensayo / Servicio</TableCell>
                          <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.78rem' }}>Cant.</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.78rem' }}>Ensayador</TableCell>
                          <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', fontSize: '0.78rem' }}>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {serviciosMuestra.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align='center' sx={{ py: 3 }}>
                              <Typography color='text.secondary'>No hay ensayos cargados</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          serviciosMuestra.map((servicio: any, idx: number) => {
                            const servicioId = servicio.id ?? servicio.servicioMuestraId ?? servicio.servicioId ?? servicio._id ?? null
                            const estadoRaw = servicio.estado ?? servicio.estadoServicio ?? 'CODIFICADO'

                            return (
                              <TableRow key={servicioId ?? idx}>
                                <TableCell>
                                  <Typography
                                    sx={{
                                      display: 'inline-flex',
                                      px: 1,
                                      py: 0.2,
                                      borderRadius: 1,
                                      bgcolor: '#eceff3',
                                      border: '1px solid #d0d7e2',
                                      fontSize: '0.86rem',
                                      fontWeight: 700,
                                      color: '#313845'
                                    }}
                                  >
                                    {servicio.codigo ?? '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827', lineHeight: 1.15 }}>
                                    {servicio.nombre ?? servicio.servicio?.nombre ?? '-'}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.82rem', color: '#818b9a' }}>
                                    {servicio.norma ?? '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                  <Typography sx={{ fontSize: '1rem', color: '#111827' }}>{servicio.cantidad ?? 1}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: '1rem', color: '#374151' }}>{ensayador}</Typography>
                                </TableCell>
                                <TableCell align='center'>
                                  <Chip
                                    label={getOperationalLabel(estadoRaw)}
                                    size='small'
                                    variant='outlined'
                                    sx={{
                                      fontWeight: 700,
                                      fontSize: '0.78rem',
                                      ...estadoPillSx(String(estadoRaw))
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {submuestrasCount > 0 && (
                  <>
                    <Typography sx={{ mb: 1.05, fontSize: '1rem', fontWeight: 800, color: '#374151', letterSpacing: 0.35 }}>
                      SUBMUESTRAS / PROBETAS ({submuestrasCount})
                    </Typography>

                    <TableContainer component={Paper} variant='outlined' sx={{ borderColor: '#d7dde9', borderRadius: 1.25 }}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#eef1f6' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6' }}>#</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6' }}>Días</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6' }}>Fecha Ensayo</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6' }}>Cant.</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6' }}>Estado</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6' }}>Vencimiento</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {probetas.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align='center' sx={{ py: 3 }}>
                                <Typography color='text.secondary'>No hay submuestras disponibles</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            probetas
                              .slice()
                              .sort((a: any, b: any) => Number(a?.numero ?? 0) - Number(b?.numero ?? 0))
                              .map((probeta: any, idx: number) => {
                                const meta = getVencimientoMeta(probeta?.fechaVencimiento, probeta?.cantidad ?? 0)
                                const estadoRaw = probeta?.estado ?? 'CODIFICADO'
                                const isUrgent = String(meta.label).includes('(HOY)') || String(meta.label).includes('(MAÑANA)')

                                return (
                                  <TableRow key={probeta?.id ?? idx} sx={{ bgcolor: isUrgent ? 'rgba(245, 158, 11, 0.08)' : 'inherit' }}>
                                    <TableCell>
                                      <Box
                                        sx={{
                                          width: 24,
                                          height: 24,
                                          borderRadius: '999px',
                                          bgcolor: '#0b2acc',
                                          color: '#fff',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '0.78rem',
                                          fontWeight: 700
                                        }}
                                      >
                                        {probeta?.numero ?? idx + 1}
                                      </Box>
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontSize: '1rem', color: '#111827' }}>{probeta?.dias ?? '-'}d</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontSize: '1rem', color: '#111827' }}>
                                        {formatDateDDMMYYYYDateOnlyDash(probeta?.fechaVencimiento)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Typography sx={{ fontSize: '1rem', color: '#111827' }}>{probeta?.cantidad ?? '-'}</Typography>
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Chip
                                        label={getOperationalLabel(estadoRaw)}
                                        size='small'
                                        variant='outlined'
                                        sx={{
                                          fontWeight: 700,
                                          fontSize: '0.78rem',
                                          ...estadoPillSx(String(estadoRaw))
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell align='center'>
                                      <Chip
                                        label={meta.label}
                                        size='small'
                                        variant='outlined'
                                        sx={{
                                          fontWeight: 700,
                                          color: meta.colors.color,
                                          borderColor: meta.colors.borderColor,
                                          bgcolor: meta.colors.backgroundColor
                                        }}
                                      />
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
              </Box>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Gestionar Ensayos ──────────────────────────────────────── */}
      <Dialog
        open={gestionarOpen}
        onClose={() => setGestionarOpen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden', maxWidth: 720 } }}
      >
        {(() => {
          const row = gestionarRow
          const rcmData = gestionarRcmData
          const estadoTipo = String(rcmData?.rcmType ?? 'MUESTRA').toUpperCase()
          const estadoActual = row?.estadoMuestra ?? row?.estadoOperativo ?? 'CODIFICADO'
          const { bgcolor: estadoBg, colorText: estadoColor, border: estadoBorder } = getOperationalInfo(estadoActual)
          const tipoChipSx = estadoTipo === 'MUESTRA'
            ? { bgcolor: '#ede9fe', color: '#5b21b6', borderColor: '#c4b5fd' }
            : estadoTipo === 'CONTROL'
              ? { bgcolor: '#fef9c3', color: '#92400e', borderColor: '#fde68a' }
              : { bgcolor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }

          const areaLabel = rcmData?.area?.nombre ?? row?.area ?? '-'
          const tipoServicioLabel = row?.tipoServicio ?? gestionarServicios?.[0]?.nombre ?? '-'
          const materialLabel = gestionarMuestra?.tipoMaterial ?? '-'
          const itemLabel = gestionarMuestra?.item ?? '-'
          const tarjetaLabel = gestionarMuestra?.numeroTarjeta ?? row?.numeroTarjeta ?? '-'
          const otLabel = rcmData?.ordenTrabajo?.correlativo ?? rcmData?.ordenTrabajo?.correlativ ?? row?.otDisplay ?? '-'

          const estadoPillSx = (raw?: string) => {
            const k = String(raw ?? '').toUpperCase()
            if (k.includes('ENSAYADO')) return { color: '#08794c', borderColor: 'rgba(16,185,129,.55)', bgcolor: 'rgba(16,185,129,.16)' }
            if (k.includes('PROCESO')) return { color: '#2557d6', borderColor: 'rgba(59,130,246,.55)', bgcolor: 'rgba(59,130,246,.14)' }
            if (k.includes('CODIFIC')) return { color: '#4b5563', borderColor: 'rgba(107,114,128,.45)', bgcolor: 'rgba(156,163,175,.16)' }
            return { color: '#475569', borderColor: 'rgba(100,116,139,.4)', bgcolor: 'rgba(148,163,184,.14)' }
          }

          const tienesProbetasServicio = (s: any) => {
            const n = String(s?.nombre ?? '').toLowerCase()
            return n.includes('probeta') || n.includes('compresión') || n.includes('compresion') || n.includes('cilíndrica') || n.includes('cilindrica')
          }

          return (
            <>
              {/* Header */}
              <Box sx={{ px: 3, py: 2, bgcolor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: '#111827' }}>{row?.numeroRcm ?? '-'}</Typography>
                  <Chip label={estadoTipo} size='small' variant='outlined' sx={{ fontWeight: 700, fontSize: '0.75rem', ...tipoChipSx }} />
                  <Chip
                    label={getOperationalLabel(estadoActual)}
                    size='small'
                    variant='outlined'
                    sx={{ fontWeight: 700, fontSize: '0.75rem', color: estadoColor, borderColor: estadoBorder, bgcolor: estadoBg }}
                  />
                </Box>
                <IconButton size='small' onClick={() => setGestionarOpen(false)} sx={{ color: '#6b7280' }}>
                  <i className='ri-close-line' style={{ fontSize: 18 }} />
                </IconButton>
              </Box>

              {/* Info bar */}
              <Box sx={{ px: 3, py: 1.5, bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, mb: 0.4 }}>ÁREA / TIPO SERVICIO</Typography>
                  <Chip label={areaLabel} size='small' variant='outlined' sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: '#f3f0ff', color: '#6d28d9', borderColor: '#c4b5fd', mr: 0.5 }} />
                  <Typography component='span' sx={{ fontSize: '0.82rem', color: '#374151' }}>{tipoServicioLabel}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, mb: 0.4 }}>MATERIAL / ÍTEM</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{materialLabel}{itemLabel !== '-' ? ` — ${itemLabel}` : ''}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, mb: 0.4 }}>TARJETA</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#1d4ed8' }}>{tarjetaLabel}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 0.5, mb: 0.4 }}>OT</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{otLabel}</Typography>
                </Box>
              </Box>

              <DialogContent sx={{ p: 3, bgcolor: '#fff' }}>
                {gestionarLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress size={36} />
                  </Box>
                ) : (
                  <>
                    {/* Asignación de ensayador global */}
                    <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 1.5, p: 2, mb: 2.5 }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', letterSpacing: 0.5, mb: 1.2 }}>ASIGNACIÓN DE ENSAYADOR</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Select
                          size='small'
                          displayEmpty
                          value={gestionarEnsayadorGlobal}
                          onChange={e => setGestionarEnsayadorGlobal(String(e.target.value))}
                          sx={{ flex: 1, fontSize: '0.88rem' }}
                        >
                          <MenuItem value=''><em style={{ color: '#9ca3af' }}>Seleccionar ensayador...</em></MenuItem>
                          {ensayadorOptions.map(name => (
                            <MenuItem key={name} value={name}>{name}</MenuItem>
                          ))}
                        </Select>
                        <Button
                          variant='contained'
                          size='small'
                          disabled={!gestionarEnsayadorGlobal}
                          onClick={() => {
                            const map: Record<number, string> = {}
                            gestionarServicios.forEach((s: any) => { map[s.id] = gestionarEnsayadorGlobal })
                            setGestionarEnsayadores(map)
                          }}
                          sx={{ whiteSpace: 'nowrap', fontWeight: 700, textTransform: 'none', bgcolor: '#1e40af', '&:hover': { bgcolor: '#1d3a9b' } }}
                        >
                          Aplicar a todos
                        </Button>
                      </Box>
                      <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mt: 0.8 }}>
                        También puedes asignar individualmente por ensayo en la tabla inferior.
                      </Typography>
                    </Box>

                    {/* Tabla de ensayos */}
                    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#374151', mb: 1, letterSpacing: 0.35 }}>
                      ENSAYOS / SERVICIOS ({gestionarServicios.length})
                    </Typography>
                    <TableContainer component={Paper} variant='outlined' sx={{ borderColor: '#d7dde9', borderRadius: 1.25, mb: 2.5 }}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f9fafb' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6', width: 60 }}>SKU</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6' }}>Ensayo / Servicio</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#8a94a6', width: 170 }}>Ensayador</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', width: 110 }}>Estado</TableCell>
                            <TableCell align='center' sx={{ fontWeight: 700, color: '#8a94a6', width: 100 }}>Acción</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {gestionarServicios.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align='center' sx={{ py: 3, color: '#9ca3af' }}>Sin ensayos registrados</TableCell>
                            </TableRow>
                          ) : (
                            gestionarServicios.map((s: any) => {
                              const estadoActualServicio = gestionarEstados[s.id] ?? s.estado ?? 'CODIFICADO'
                              const ensayadorActual = gestionarEnsayadores[s.id] ?? ''
                              const esEnsayado = String(estadoActualServicio).toUpperCase().includes('ENSAYADO')
                              const esProbeta = tienesProbetasServicio(s)
                              return (
                                <TableRow key={s.id}>
                                  <TableCell>
                                    <Box sx={{ display: 'inline-flex', px: 1, py: 0.2, borderRadius: 1, bgcolor: '#eceff3', fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>
                                      {s.codigo ?? s.id}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>{s.nombre}</Typography>
                                    {s.norma && <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>{s.norma}</Typography>}
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      size='small'
                                      displayEmpty
                                      value={ensayadorActual}
                                      onChange={e => setGestionarEnsayadores(prev => ({ ...prev, [s.id]: String(e.target.value) }))}
                                      sx={{ width: '100%', fontSize: '0.82rem' }}
                                    >
                                      <MenuItem value=''><em style={{ color: '#9ca3af' }}>—</em></MenuItem>
                                      {ensayadorOptions.map(name => (
                                        <MenuItem key={name} value={name}>{name}</MenuItem>
                                      ))}
                                    </Select>
                                  </TableCell>
                                  <TableCell align='center'>
                                    <Chip
                                      label={getOperationalLabel(estadoActualServicio)}
                                      size='small'
                                      variant='outlined'
                                      sx={{ fontWeight: 700, fontSize: '0.75rem', ...estadoPillSx(estadoActualServicio) }}
                                    />
                                  </TableCell>
                                  <TableCell align='center'>
                                    {(() => {
                                      const estadoKey = String(estadoActualServicio).toUpperCase()
                                      const esCodificado = estadoKey.includes('CODIFIC')
                                      const esEnProceso = estadoKey.includes('PROCESO')

                                      if (esEnsayado) {
                                        return (
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, justifyContent: 'center', color: '#16a34a', fontWeight: 700, fontSize: '0.82rem' }}>
                                            <i className='ri-checkbox-circle-fill' style={{ fontSize: 15 }} />
                                            Listo
                                          </Box>
                                        )
                                      }

                                      if (esProbeta && gestionarProbetas.length > 0) {
                                        return (
                                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                                            {gestionarProbetas.slice().sort((a: any, b: any) => a.dias - b.dias).map((p: any, i: number) => (
                                              <Button
                                                key={p.id ?? i}
                                                size='small'
                                                variant='outlined'
                                                sx={{ fontSize: '0.72rem', fontWeight: 700, py: 0.1, px: 0.8, textTransform: 'none', borderColor: '#bfdbfe', color: '#1d4ed8', bgcolor: '#eff6ff', minWidth: 0 }}
                                              >
                                                Ficha {p.dias}d
                                              </Button>
                                            ))}
                                          </Box>
                                        )
                                      }

                                      if (esCodificado) {
                                        return (
                                          <Button
                                            size='small'
                                            variant='outlined'
                                            onClick={() => setGestionarEstados(prev => ({ ...prev, [s.id]: 'EN_PROCESO' }))}
                                            startIcon={<i className='ri-play-fill' style={{ fontSize: 13 }} />}
                                            sx={{ fontSize: '0.75rem', fontWeight: 700, py: 0.3, px: 1.2, textTransform: 'none', borderColor: '#bfdbfe', color: '#1d4ed8', bgcolor: '#eff6ff', minWidth: 0 }}
                                          >
                                            Iniciar
                                          </Button>
                                        )
                                      }

                                      if (esEnProceso) {
                                        return (
                                          <Button
                                            size='small'
                                            variant='outlined'
                                            onClick={() => setGestionarEstados(prev => ({ ...prev, [s.id]: 'ENSAYADO' }))}
                                            startIcon={<i className='ri-check-line' style={{ fontSize: 13 }} />}
                                            sx={{ fontSize: '0.75rem', fontWeight: 700, py: 0.3, px: 1.2, textTransform: 'none', borderColor: '#bbf7d0', color: '#16a34a', bgcolor: '#f0fdf4', minWidth: 0 }}
                                          >
                                            Finalizar
                                          </Button>
                                        )
                                      }

                                      return null
                                    })()}
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Probetas / submuestras */}
                    {gestionarProbetas.length > 0 && (
                      <>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#374151', mb: 1, letterSpacing: 0.35 }}>
                          SUBMUESTRAS / PROBETAS
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                          {gestionarProbetas.slice().sort((a: any, b: any) => Number(a.numero ?? 0) - Number(b.numero ?? 0)).map((p: any, i: number) => {
                            const meta = getVencimientoMeta(p?.fechaVencimiento, p?.cantidad ?? 0)
                            const isHoy = String(meta.label).includes('HOY')
                            const esMañana = String(meta.label).includes('MAÑANA')
                            const isUrgent = isHoy || esMañana
                            return (
                              <Box
                                key={p.id ?? i}
                                sx={{
                                  border: `1px solid ${isUrgent ? '#fca5a5' : '#e5e7eb'}`,
                                  borderRadius: 1.5,
                                  p: 1.5,
                                  minWidth: 160,
                                  bgcolor: isUrgent ? 'rgba(254,226,226,.45)' : '#fff',
                                  flex: '1 1 160px',
                                  maxWidth: 220
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                  <Box sx={{ width: 26, height: 26, borderRadius: '999px', bgcolor: '#0b2acc', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}>
                                    #{p.numero ?? i + 1}
                                  </Box>
                                  {isUrgent ? (
                                    <Chip label={meta.label} size='small' sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: '#fee2e2', color: '#b91c1c', border: 'none' }} />
                                  ) : (
                                    <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>{p.dias}d</Typography>
                                  )}
                                </Box>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{p.dias} días · {formatDateDDMMYYYYDateOnlyDash(p.fechaVencimiento)}</Typography>
                                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', mb: 0.5 }}>{p.cantidad} probeta{p.cantidad !== 1 ? 's' : ''}</Typography>
                                <Chip
                                  label={getOperationalLabel(p.estado ?? 'CODIFICADO')}
                                  size='small'
                                  variant='outlined'
                                  sx={{ fontWeight: 700, fontSize: '0.72rem', ...estadoPillSx(p.estado ?? 'CODIFICADO') }}
                                />
                              </Box>
                            )
                          })}
                        </Box>
                      </>
                    )}
                  </>
                )}
              </DialogContent>

              {/* Footer */}
              <Box sx={{ px: 3, py: 2, bgcolor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button variant='outlined' onClick={() => setGestionarOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, color: '#374151', borderColor: '#d1d5db' }}>
                  Cancelar
                </Button>
                <Button
                  variant='contained'
                  disabled={gestionarSaving}
                  onClick={handleGuardarGestionar}
                  startIcon={gestionarSaving ? <CircularProgress size={14} color='inherit' /> : <i className='ri-save-line' />}
                  sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1e40af', '&:hover': { bgcolor: '#1d3a9b' } }}
                >
                  {gestionarSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </Box>
            </>
          )
        })()}
      </Dialog>

      {/* Menu cambio de estado - TABLA PRINCIPAL (DISABLED) */}
      <Menu
        anchorEl={markAnchorEl}
        open={Boolean(markAnchorEl) && !selectedRowId} // ← solo si NO hay muestra abierta
        onClose={handleCloseMarkMenu}
      >
        {getStatesForRow(markRowId).map(state => (
          <MenuItem
            key={state.value}
            disabled // ← SIEMPRE DESHABILITADO en tabla principal
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
        open={Boolean(markAnchorEl) && Boolean(selectedRowId)} // ← solo si HAY muestra abierta
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

          {/* ELIMINADO: condición || markDialogAction === 'CERRADO_OP' */}
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

          {/* Otros actions pueden añadirse aquí con condiciones similares */}
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
          console.log('📍 Editar clicked - menuRowId:', menuRowId)
          handleEdit(menuRowId)
        }}>
          Editar
        </MenuItem>

        {/* ✅ CORRECCIÓN COMPLETA: Restaurar TODO el código del historial */}
        <MenuItem onClick={async () => {
          handleCloseRowMenu()

          const row = data.find(r => r.id === menuRowId) ??
            filteredData.find(r => r.id === menuRowId)

          console.group('📋 Historial desde menú 3 puntos')
          console.log('menuRowId (fila ID):', menuRowId)
          console.log('row encontrado:', row)

          if (!row || !row.muestra?.id) {
            console.warn('❌ No se encontró la muestra')
            console.groupEnd()
            alert('No se encontró la muestra')
            return
          }

          const muestraId = row.muestra.id
          const cacheKey = `muestra-${muestraId}`

          console.log(`🔑 Cache key:`, cacheKey)
          console.log(`📦 Muestra ID:`, muestraId)
          console.log(`📋 Número de muestra:`, row.muestra.numeroMuestra)

          try {
            // ✅ Verificar caché ANTES de hacer fetch
            const cached = servicioHistoryCache.get(cacheKey)
            if (cached) {
              console.log('✅ Usando historial cacheado para muestra', muestraId)
              console.log('📊 Registros en caché:', cached.length)
              setHistServicioRows(cached)
              setHistServicioDialogOpen(true)
              console.groupEnd()
              return
            }

            console.log(`⏳ Cargando servicios de muestra ${muestraId}...`)

            const response = await fetch(`/api/muestra/${muestraId}/servicios`)

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()

            console.log('✅ Servicios cargados:', data)

            if (!data.servicios || data.servicios.length === 0) {
              console.warn('❌ No hay servicios')
              console.groupEnd()

              // ✅ Guardar array vacío en caché para evitar refetchs
              servicioHistoryCache.set(cacheKey, [])

              setHistServicioRows([])
              setHistServicioDialogOpen(true)
              return
            }

            // ✅ Extraer IDs de TODOS los servicios
            const servicioIds = data.servicios
              .map((s: any) => s.id ?? s.servicioMuestraId ?? s.servicioId ?? null)
              .filter(Boolean)

            console.log(`📊 IDs de servicios a consultar:`, servicioIds)

            if (servicioIds.length === 0) {
              console.warn('❌ No se pudieron extraer IDs')
              console.groupEnd()

              // ✅ Guardar array vacío en caché
              servicioHistoryCache.set(cacheKey, [])

              setHistServicioRows([])
              setHistServicioDialogOpen(true)
              return
            }

            // ✅ Cargar historial de TODOS los servicios en paralelo
            const historialPromises = servicioIds.map(async (servicioId: number) => {
              try {
                console.log(`📡 Fetching history for servicioId ${servicioId}`)
                const res = await fetch(`/api/servicioMuestra/${servicioId}/history`)

                if (!res.ok) {
                  console.warn(`⚠️ Error al cargar historial del servicio ${servicioId}:`, res.status)
                  return []
                }

                const historial = await res.json()
                console.log(`✅ Historial cargado para servicio ${servicioId}:`, historial.length, 'registros')

                // Agregar información del servicio a cada registro
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
                console.error(`❌ Error loading historial for servicio ${servicioId}:`, err)
                return []
              }
            })

            // ✅ Esperar a que se carguen todos los historiales
            const historialArrays = await Promise.all(historialPromises)

            // ✅ Combinar todos los historiales en un solo array
            const historialCombinado = historialArrays.flat()

            // ✅ Ordenar por fecha descendente
            historialCombinado.sort((a, b) => {
              const dateA = new Date(a.registro || a.fechaAccion).getTime()
              const dateB = new Date(b.registro || b.fechaAccion).getTime()
              return dateB - dateA
            })

            console.log(`📊 Total registros de historial combinado:`, historialCombinado.length)
            console.log(`📋 Desglose por servicio:`)
            servicioIds.forEach(id => {
              const count = historialCombinado.filter(h => h.servicioMuestraId === id).length
              const nombre = data.servicios.find((s: any) =>
                (s.id ?? s.servicioMuestraId ?? s.servicioId) === id
              )?.nombre
              console.log(`  - Servicio ${id} (${nombre}): ${count} registros`)
            })

            // ✅ Guardar en caché usando clave única por muestra
            servicioHistoryCache.set(cacheKey, historialCombinado)

            // ✅ Abrir diálogo con el historial combinado
            setHistServicioRows(historialCombinado)
            setHistServicioDialogOpen(true)

          } catch (err) {
            console.error('❌ Error loading historial:', err)
            alert('Error al cargar el historial')
          } finally {
            console.groupEnd()
          }
        }}>
          Historial
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
                    <TableCell sx={{ fontWeight: 600 }}>SERVICIO</TableCell> {/* ← NUEVA COLUMNA */}
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

                        {/* ✅ NUEVA CELDA: Mostrar nombre del servicio */}
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


