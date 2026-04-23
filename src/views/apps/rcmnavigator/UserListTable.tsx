'use client'

// ...existing code...
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'

// NextAuth
import { useSession } from 'next-auth/react'

// Next Imports
import { usePathname } from 'next/navigation'

// TanStack React Table
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState
} from '@tanstack/react-table'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TablePagination from '@mui/material/TablePagination'
import { styled, alpha, lighten } from '@mui/material/styles'
import type { TextFieldProps } from '@mui/material/TextField'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import CloseIcon from '@mui/icons-material/Close'
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import Popover from '@mui/material/Popover'
import Radio from '@mui/material/Radio'

import * as XLSX from 'xlsx'

import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItemMUI from '@mui/material/MenuItem' // avoid name clash if MenuItem used above
import FormHelperText from '@mui/material/FormHelperText'
import { OPERATIONAL_STATES } from '@/constants/operationalStates'
import ADMINISTRATIVE_STATES from '../../../constants/administrativeStates'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

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

    return s
  } catch {
    return ''
  }
}

const esCollator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' })

const toSortableText = (v: any) => normalizeText(v).toLowerCase()

const compareText = (a: any, b: any) => {
  const aa = toSortableText(a)
  const bb = toSortableText(b)
  if (!aa && !bb) return 0
  if (!aa) return 1
  if (!bb) return -1
  return esCollator.compare(aa, bb)
}

const toSortableNumber = (v: any): number | null => {
  if (v === null || typeof v === 'undefined') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).trim()
  if (!s || s === '-') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const compareNumber = (a: any, b: any) => {
  const na = toSortableNumber(a)
  const nb = toSortableNumber(b)
  if (na == null && nb == null) return 0
  if (na == null) return 1
  if (nb == null) return -1
  return na === nb ? 0 : na > nb ? 1 : -1
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 400,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'value' | 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return (
    <TextField
      {...props}
      value={value}
      onChange={e => setValue(e.target.value)}
      size={props.size ?? 'small'}
    />
  )
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

// RCM type (kept)
interface RCM {
  id: number
  // Tabla principal ahora muestra Códigos Producto (agrupadores)
  codigoNombre?: string | null
  descripcionServicio?: string | null
  ss?: string | null
  ordenTrabajoId?: number | string | null
  totalRcms?: number | null
  conEvento?: boolean
  informe?: number | null
  ensayos?: { ensayados: number; total: number } | null
  estadoOperativoCounts?: Record<string, number>
  estadoAdministrativoCounts?: Record<string, number>
  ciudad?: string | null
  representativeRcmId?: number | null

  // sedes (puede venir mixto por Código Producto)
  sedes?: string[]

  // campos comunes usados por filtros/tabla
  numeroRcm: string
  ot?: string
  fechaCodificacion: string
  fechaMuestreo: string
  estadoOperativo?: string
  estadoAdministrativo?: string
  cliente?: {
    nombreCliente?: string
    comuna?: string
  }
  area?: string
  familia?: string
  obra?: {
    numeroObra?: string
    nombreObra?: string
  } | null
  servicios?: Array<{
    codigo: string
    nombre: string
    cantidad: number
  }>

  // Compatibilidad con lógica legacy (menús/diálogos que quedan deshabilitados)
  [key: string]: any
}

interface Filters {
  dateField?: 'fecha_codificacion' | 'fecha_muestreo'
  start?: string
  end?: string
  estadoOperativo?: string | string[]
  estadoAdministrativo?: string | string[]
  conEvento?: boolean
  areaId?: number | null
  areaName?: string | null
  familia?: string | null
  sede?: string | string[]
}

const fuzzyFilter: FilterFn<RCM> = (row, columnId, value) => {
  const raw = row.getValue(columnId)
  const haystack = normalizeText(raw).toLowerCase()
  const needle = normalizeText(value).toLowerCase()
  if (!needle) return true
  return haystack.includes(needle)
}

// Component
const columnHelper = createColumnHelper<RCM>()

const UserListTable2 = ({
  filters,
  onFiltersChange,
  onSelectCodigo
}: {
  filters?: Filters
  onFiltersChange?: (filters?: Filters) => void
  onSelectCodigo?: (codigoAgrupadorId: number | null) => void
}) => {
  const { data: session } = useSession()

  const getCurrentUserName = () => {
    const name = session?.user?.name
    if (typeof name === 'string' && name.trim()) return name.trim()

    const email = session?.user?.email
    if (typeof email === 'string' && email.trim()) return email.trim()

    return null
  }

  const [data, setData] = useState<RCM[]>([])
  const [filteredData, setFilteredData] = useState<RCM[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedCodigoId, setSelectedCodigoId] = useState<number | null>(null)
  const tableKeyboardRef = useRef<HTMLDivElement | null>(null)
  const [savingHistory, setSavingHistory] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    eventType?: string
    motivo?: string
    returnState?: string
    informeNumber?: string
    observacion?: string
    general?: string
  }>({})


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

  const normalizeStateKey = (raw?: string | null) => {
    const s = String(raw ?? '').trim()
    if (!s) return null
    if (s.includes('_')) return s.toUpperCase()
    return s.toUpperCase().replace(/\s+/g, '_')
  }

  const pickStateFromCounts = (counts: Record<string, number> | undefined, priority: string[]) => {
    if (!counts) return null
    for (const p of priority) {
      if ((counts[p] ?? 0) > 0) return p
    }
    const keys = Object.keys(counts)
    if (!keys.length) return null
    let best: string | null = null
    let bestN = -1
    for (const k of keys) {
      const n = Number(counts[k] ?? 0)
      if (n > bestN) {
        bestN = n
        best = k
      }
    }
    return best
  }

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
  const [eventReturnState, setEventReturnState] = useState<string>('')

  // ---- Helpers que dependen de `data` (dentro del componente) ----
  const normalizeState = (s?: string) => (s ?? '').toString().toUpperCase().trim()

  const normalizeStateForCompare = (raw?: any) => {
    const key = normalizeStateKey(raw)
    return key ?? normalizeState(raw)
  }

  const formatStateForChip = (raw?: any) => {
    const key = normalizeStateForCompare(raw)
    if (!key) return '-'
    return String(key).replace(/_/g, ' ')
  }

  const getCurrentStateForRow = (rowId?: number | null) => {
    if (rowId == null) return ''
    const target = Number(rowId)
    const r = data.find(d => {
      const dId = Number((d as any).id)
      const rep = (d as any).representativeRcmId
      const repId = rep == null ? null : Number(rep)
      return dId === target || (repId != null && repId === target)
    })
    if (!r) return ''

    // 1) prefer explicit estadoOperativo
    const s1 = r.estadoOperativo ?? (Array.isArray(r.servicios) && r.servicios.length ? (r.servicios[0] as any).estado : '')
    const key1 = normalizeStateKey(s1) ?? normalizeState(s1)
    if (key1) return key1

    // 2) fallback: infer from aggregated counts (if available)
    const counts = (r as any).estadoOperativoCounts as Record<string, number> | undefined
    if (counts && typeof counts === 'object') {
      const inferred = pickStateFromCounts(counts, [
        'EVENTO',
        'EN_PROCESO',
        'CODIFICADO',
        'ENSAYADO',
        'ENVIADO_DIGITACION',
        'DIGITADO',
        'REVISADO',
        'FIRMADO',
        'ENVIADO'
      ])
      const key2 = normalizeStateKey(inferred) ?? normalizeState(inferred ?? '')
      if (key2) return key2
    }

    return ''
  }

  const getAppliedAForRow = (rowId?: number | null) => {
    // Por ahora el historial se aplica a "CP" (Código Producto)
    return 'CP'
  }

  // Devuelve los estados para el popup "marcar"
  // Reglas:
  // 1) Si el estado actual es EVENTO o CERRADO_OP -> mostrar todos los estados (el actual disabled)
  // 2) En cualquier otro caso -> mostrar: estado actual (disabled), el siguiente inmediato (si existe),
  //    y además EVENTO y CERRADO_OP (sin duplicados)
  const getStatesForRow = (rowId?: number | null) => {
    const current = getCurrentStateForRow(rowId)

    // helper para buscar item por value
    const findState = (v?: string) => OPERATIONAL_STATES.find(s => s.value === v)

    // Caso 1: si estamos en EVENTO o CERRADO_OP, mostrar todos (marcar el actual como disabled)
    if (current === 'EVENTO' || current === 'CERRADO_OP') {
      return OPERATIONAL_STATES.map(st => ({ ...st, disabled: st.value === current }))
    }

    // Caso 2: mostrar current (disabled), siguiente inmediato (si existe), y EVENTO + CERRADO_OP
    const idx = OPERATIONAL_STATES.findIndex(st => st.value === current)
    const currentItem = findState(current)
    const nextItem = OPERATIONAL_STATES[idx + 1]

    const evento = findState('EVENTO')
    const cerrado = findState('CERRADO_OP')

    const items: Array<typeof OPERATIONAL_STATES[number] & { disabled?: boolean }> = []

    if (currentItem) items.push({ ...currentItem, disabled: true })
    if (nextItem) items.push({ ...nextItem, disabled: false })

    // añadir EVENTO y CERRADO_OP si existen y no están ya en la lista
    if (evento && !items.some(i => i.value === evento.value)) items.push({ ...evento, disabled: false })
    if (cerrado && !items.some(i => i.value === cerrado.value)) items.push({ ...cerrado, disabled: false })

    return items
  }
  // ---------------------------------------------------

  // Historial dialog
  const [histDialogOpen, setHistDialogOpen] = useState(false)
  const [histRowId, setHistRowId] = useState<number | null>(null)
  const [histRows, setHistRows] = useState<any[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [histCodigoData, setHistCodigoData] = useState<any>(null)

  // Popover de ayuda para estados operativos (según imágenes)
  const [opHelpAnchorEl, setOpHelpAnchorEl] = useState<HTMLElement | null>(null)
  const [opHelpState, setOpHelpState] = useState<string | null>(null)
  const [opHelpDate, setOpHelpDate] = useState<any>(null)

  // Dialog: Gestionar Informe (nuevo)
  const [informeDialogOpen, setInformeDialogOpen] = useState(false)
  const [informeDialogLoading, setInformeDialogLoading] = useState(false)
  const [informeDialogCodigoId, setInformeDialogCodigoId] = useState<number | null>(null)
  const [informeDialogRcmId, setInformeDialogRcmId] = useState<number | null>(null)
  const [informeDialogMeta, setInformeDialogMeta] = useState<any>(null)
  const [informeDialogData, setInformeDialogData] = useState<any>(null)
  const [informeDialogHistory, setInformeDialogHistory] = useState<any[]>([])
  const [hideEnsayosByRcm, setHideEnsayosByRcm] = useState(false)

  const AUTO_TEMPLATES = [
    { key: 'DENSIDAD', label: 'Informe Densidad' },
    { key: 'HORMIGON', label: 'Informe Hormigón' }
  ] as const

  type AutoTemplateKey = (typeof AUTO_TEMPLATES)[number]['key']
  const emptyDraft = { numero: '', refCliente: '', observaciones: '', anexoPrev: '' }

  const getApplicableAutoTemplateKeys = (meta: any): AutoTemplateKey[] => {
    const flags = meta?.autoTemplates
    if (flags && typeof flags === 'object') {
      return AUTO_TEMPLATES.filter(t => flags?.[t.key] === true).map(t => t.key)
    }

    // fallback (si el backend no envía autoTemplates por alguna razón)
    const bag = `${meta?.area ?? ''} ${meta?.familia ?? ''} ${meta?.codigoNombre ?? ''}`
    const norm = normalizeText(bag).toLowerCase()
    const out: AutoTemplateKey[] = []
    if (norm.includes('densidad')) out.push('DENSIDAD')
    if (norm.includes('hormigon') || norm.includes('compresion')) out.push('HORMIGON')
    return out
  }

  const [autoInformeExisting, setAutoInformeExisting] = useState<Record<AutoTemplateKey, number | null>>({
    DENSIDAD: null,
    HORMIGON: null
  })

  const [autoInformeDrafts, setAutoInformeDrafts] = useState<Record<AutoTemplateKey, typeof emptyDraft>>({
    DENSIDAD: { ...emptyDraft },
    HORMIGON: { ...emptyDraft }
  })
  const [informeDrafts, setInformeDrafts] = useState<
    Array<{
      id: string
      numero: string
      tipoInforme: string
      refCliente: string
      observaciones: string
      anexoPrev: string
      rcms: string[]
    }>
  >([])
  const [informeDialogErrors, setInformeDialogErrors] = useState<{ general?: string; numero?: string }>({})
  const [savingInformeDialog, setSavingInformeDialog] = useState(false)

  // Dialog: Ficha Código Producto (nuevo)
  const [codigoDialogOpen, setCodigoDialogOpen] = useState(false)
  const [codigoDialogLoading, setCodigoDialogLoading] = useState(false)
  const [codigoDialogMeta, setCodigoDialogMeta] = useState<any>(null)
  const [codigoDialogData, setCodigoDialogData] = useState<any>(null)
  const [codigoDialogDigitadoAt, setCodigoDialogDigitadoAt] = useState<string | null>(null)
  const [codigoDialogOpAt, setCodigoDialogOpAt] = useState<string | null>(null)

  // simple cache en memoria para historial por RCM (evita refetchs)
  const historyCache: Map<number, any[]> = (global as any).__RCM_HISTORY_CACHE__ || new Map()
    ; (global as any).__RCM_HISTORY_CACHE__ = historyCache

  // cache liviana para título de Historial (codigoAgrupadorId -> {codigoNombre, descripcionServicio})
  const codigoLiteCache: Map<number, any> = (global as any).__RCM_CODIGO_LITE_CACHE__ || new Map()
    ; (global as any).__RCM_CODIGO_LITE_CACHE__ = codigoLiteCache

  const handleOpenMarkMenu = (e: React.MouseEvent<HTMLElement>, rowId: number) => {
    setMarkAnchorEl(e.currentTarget)
    setMarkRowId(rowId)
  }
  const handleCloseMarkMenu = () => {
    setMarkAnchorEl(null)
    setMarkRowId(null)
  }

  const openInformeDialog = async (codigoAgrupadorId: number | null, representativeRcmId: number, meta?: any) => {
    setInformeDialogCodigoId(codigoAgrupadorId)
    setInformeDialogRcmId(representativeRcmId)
    setInformeDialogMeta(meta ?? null)
    setInformeDialogData(null)
    setInformeDialogHistory([])
    setInformeDrafts([])
    setAutoInformeExisting({ DENSIDAD: null, HORMIGON: null })
    setAutoInformeDrafts({ DENSIDAD: { ...emptyDraft }, HORMIGON: { ...emptyDraft } })
    setInformeDialogErrors({})
    setHideEnsayosByRcm(false)
    setInformeDialogOpen(true)

    if (!codigoAgrupadorId) return

    try {
      setInformeDialogLoading(true)

      const detailPromise = codigoAgrupadorId
        ? fetch(`/api/codigo-agrupador/${codigoAgrupadorId}`, { cache: 'no-store' }).then(async res => {
            if (!res.ok) {
              const txt = await res.text().catch(() => '')
              throw new Error(txt || 'No se pudo cargar el detalle del código')
            }
            return await res.json().catch(() => null)
          })
        : Promise.resolve(null)

      const historyPromise = (async () => {
        const cached = historyCache.get(representativeRcmId)
        if (cached) return cached
        const res = await fetch(`/api/rcm/${representativeRcmId}/history?take=200`)
        if (!res.ok) return []
        const json = await res.json().catch(() => [])
        const arr = Array.isArray(json) ? json : []
        historyCache.set(representativeRcmId, arr)
        return arr
      })()

      const [detail, rows] = await Promise.all([detailPromise, historyPromise])
      if (detail) setInformeDialogData(detail)
      setInformeDialogHistory(Array.isArray(rows) ? rows : [])

      // detectar informes automáticos existentes (guardados en historial)
      const norm = (v: any) => String(v ?? '').trim().toLowerCase()
      const existing: Record<AutoTemplateKey, number | null> = { DENSIDAD: null, HORMIGON: null }
      for (const t of AUTO_TEMPLATES) {
        const hits = (rows ?? []).filter((h: any) => {
          const tipoEstado = String(h?.tipoEstado ?? '').trim().toUpperCase()
          if (tipoEstado !== 'INFORME_AUTO') return false
          return norm(h?.motivo).includes(norm(t.label))
        })
        const max = hits
          .map((h: any) => Number(h?.informe))
          .filter((n: any) => Number.isFinite(n) && n > 0)
          .reduce((acc: number | null, n: number) => (acc === null || n > acc ? n : acc), null)
        existing[t.key] = max
      }
      setAutoInformeExisting(existing)
    } catch (e) {
      console.error('openInformeDialog error', e)
      setInformeDialogErrors(prev => ({ ...prev, general: 'No se pudo cargar la información del código.' }))
    } finally {
      setInformeDialogLoading(false)
    }
  }

  const closeInformeDialog = () => {
    if (savingInformeDialog) return
    setInformeDialogOpen(false)
    setInformeDialogLoading(false)
    setInformeDialogCodigoId(null)
    setInformeDialogRcmId(null)
    setInformeDialogMeta(null)
    setInformeDialogData(null)
    setInformeDialogHistory([])
    setInformeDrafts([])
    setAutoInformeExisting({ DENSIDAD: null, HORMIGON: null })
    setAutoInformeDrafts({ DENSIDAD: { ...emptyDraft }, HORMIGON: { ...emptyDraft } })
    setInformeDialogErrors({})
    setHideEnsayosByRcm(false)
  }

  const parseInformeNumber = (raw: any) => {
    const s = String(raw ?? '').trim()
    if (!s) return null
    const direct = Number(s)
    if (Number.isFinite(direct) && direct > 0) return direct
    const m = s.match(/(\d+)\s*$/)
    if (m) {
      const n = Number(m[1])
      if (Number.isFinite(n) && n > 0) return n
    }
    return null
  }

  const computeEnsayosFromServicios = (servicios?: Array<{ cantidad?: number | null; estadoOperativo?: string | null }>) => {
    let total = 0
    let ensayados = 0
    for (const s of servicios ?? []) {
      const qty = Number(s?.cantidad ?? 0)
      total += qty
      if (String(s?.estadoOperativo ?? '').trim().toUpperCase() === 'ENSAYADO') ensayados += qty
    }
    return { total, ensayados }
  }

  const openCodigoProductoDialog = async (row: any) => {
    setCodigoDialogMeta(row)
    setCodigoDialogData(null)
    setCodigoDialogDigitadoAt(null)
    setCodigoDialogOpAt(null)
    setCodigoDialogOpen(true)

    const codigoId = Number(row?.id)
    const repRcmId = Number(row?.representativeRcmId)

    try {
      setCodigoDialogLoading(true)

      const detailPromise =
        Number.isFinite(codigoId) && codigoId > 0
          ? fetch(`/api/codigo-agrupador/${codigoId}?view=dialog`)
              .then(async res => {
                if (!res.ok) return null
                return (await res.json().catch(() => null)) as any
              })
          : Promise.resolve(null)

      const historyPromise =
        Number.isFinite(repRcmId) && repRcmId > 0
          ? (async () => {
              const cached = historyCache.get(repRcmId)
              if (cached) return cached

              // Sólo necesitamos entradas recientes para fechas (DIGITADO / estado actual)
              const res = await fetch(`/api/rcm/${repRcmId}/history?take=120`)
              if (!res.ok) return []
              const json = await res.json().catch(() => [])
              const arr = Array.isArray(json) ? json : []
              historyCache.set(repRcmId, arr)
              return arr
            })()
          : Promise.resolve([])

      const [detail, rows] = await Promise.all([detailPromise, historyPromise])
      if (detail) setCodigoDialogData(detail)

      // fechas desde historial del representative RCM
      if (rows && Array.isArray(rows) && rows.length) {
        const hit = (rows ?? []).find((h: any) => {
          const est = String(h?.estNuevo ?? h?.tipoEstado ?? '').trim().toUpperCase()
          return est === 'DIGITADO'
        })
        const when = hit?.fechaAccion ?? hit?.createdAt ?? null
        if (when) setCodigoDialogDigitadoAt(String(when))

        const currentOpKey = normalizeStateForCompare(row?.estadoOperativo)
        if (currentOpKey) {
          const opHit = (rows ?? []).find((h: any) => {
            const est = normalizeStateForCompare(h?.estNuevo ?? h?.tipoEstado)
            return est === currentOpKey
          })
          const opWhen = opHit?.fechaAccion ?? opHit?.createdAt ?? null
          if (opWhen) setCodigoDialogOpAt(String(opWhen))
        }
      }
    } catch (e) {
      console.error('openCodigoProductoDialog error', e)
    } finally {
      setCodigoDialogLoading(false)
    }
  }

  const closeCodigoProductoDialog = () => {
    setCodigoDialogOpen(false)
    setCodigoDialogLoading(false)
    setCodigoDialogMeta(null)
    setCodigoDialogData(null)
    setCodigoDialogDigitadoAt(null)
    setCodigoDialogOpAt(null)
  }

  const validateInformeDialog = () => {
    const errors: { general?: string; numero?: string } = {}

    if (!informeDialogRcmId) errors.general = 'RCM no seleccionado'

    const totalEnsayos = Number(informeDialogMeta?.ensayos?.total ?? 0)
    const ensayados = Number(informeDialogMeta?.ensayos?.ensayados ?? 0)
    const pendientes = Math.max(0, totalEnsayos - ensayados)

    const applicableAutoKeys = getApplicableAutoTemplateKeys(informeDialogMeta)
    const requiresAutos = applicableAutoKeys.length > 0

    const autoCreates = AUTO_TEMPLATES.flatMap(t => {
      const applies = applicableAutoKeys.includes(t.key)
      if (!applies) return []

      const existing = autoInformeExisting?.[t.key]
      if (existing != null) return []

      const n = parseInformeNumber(autoInformeDrafts?.[t.key]?.numero)
      if (n == null) return []

      // sólo se puede subir automático si ya finalizaron todos los ensayos
      if (pendientes > 0) return []

      return [
        {
          key: t.key,
          label: t.label,
          numero: n,
          refCliente: String(autoInformeDrafts?.[t.key]?.refCliente ?? '').trim(),
          observaciones: String(autoInformeDrafts?.[t.key]?.observaciones ?? '').trim(),
          anexoPrev: String(autoInformeDrafts?.[t.key]?.anexoPrev ?? '').trim()
        }
      ]
    })

    const manualCreates = informeDrafts
      .map(d => ({
        id: d.id,
        numero: parseInformeNumber(d.numero),
        tipoInforme: String((d as any).tipoInforme ?? '').trim(),
        refCliente: String(d.refCliente ?? '').trim(),
        observaciones: String(d.observaciones ?? '').trim(),
        anexoPrev: String(d.anexoPrev ?? '').trim(),
        rcms: Array.isArray((d as any).rcms)
          ? (d as any).rcms.map((x: any) => String(x ?? '').trim()).filter(Boolean)
          : []
      }))
      .filter(d => d.numero != null) as Array<{
      id: string
      numero: number
      tipoInforme: string
      refCliente: string
      observaciones: string
      anexoPrev: string
      rcms: string[]
    }>

    // Si un informe manual tiene N°, debe seleccionar al menos 1 RCM.
    const manualMissingRcms = manualCreates.filter(m => (m.rcms ?? []).length === 0)
    if (manualMissingRcms.length) {
      const msg = 'Selecciona al menos 1 RCM para cada informe manual con N°.'
      errors.general = [errors.general, msg].filter(Boolean).join(' · ')
    }

    const allNums = [
      ...AUTO_TEMPLATES.map(t => autoInformeExisting?.[t.key]),
      ...AUTO_TEMPLATES.map(t => parseInformeNumber(autoInformeDrafts?.[t.key]?.numero)),
      ...manualCreates.map(m => m.numero)
    ]
      .map(n => Number(n))
      .filter(n => Number.isFinite(n) && n > 0)

    const primaryCandidate = allNums.length ? Math.max(...allNums) : null

    if (requiresAutos) {
      const missingAutos = applicableAutoKeys.filter(k => {
        const existing = autoInformeExisting?.[k]
        if (existing != null) return false

        const n = parseInformeNumber(autoInformeDrafts?.[k]?.numero)
        if (n == null) return true

        // aunque esté el número, no se considera completo si aún hay ensayos pendientes (no se puede subir)
        return pendientes > 0
      })

      if (missingAutos.length) {
        const labels = AUTO_TEMPLATES.filter(t => missingAutos.includes(t.key)).map(t => t.label).join(', ')
        errors.numero = `Complete informes automáticos requeridos: ${labels}`
        if (pendientes > 0) errors.general = `Pendiente: ${pendientes} ensayo${pendientes === 1 ? '' : 's'} sin finalizar.`
      }
    } else {
      if (manualCreates.length === 0) errors.numero = 'Ingrese al menos un N° de informe manual'
    }

    if (primaryCandidate == null && !errors.numero) errors.numero = 'Ingrese al menos un N° de informe'

    setInformeDialogErrors(errors)
    return {
      ok: Object.keys(errors).length === 0,
      pendientes,
      requiresAutos,
      applicableAutoKeys,
      primary: primaryCandidate as number | null,
      autoCreates,
      manualCreates
    }
  }

  const handleConfirmInformeDialog = async () => {
    const { ok, primary, autoCreates, manualCreates } = validateInformeDialog()
    if (!ok) return

    const rcmId = informeDialogRcmId
    if (!rcmId) return

    const informeToPersist = primary
    if (informeToPersist == null) return

    try {
      setSavingInformeDialog(true)
      const prevState = getCurrentStateForRow(rcmId)

      const funcionario = getCurrentUserName() ?? 'Usuario'
      const aplicadoA = getAppliedAForRow(rcmId)

      const buildObservacion = (tipoInforme: string, refCliente: string, observaciones: string, anexoPrev: string) => {
        const parts = [
          tipoInforme ? `Tipo: ${tipoInforme}` : '',
          refCliente ? `Ref. Cliente: ${refCliente}` : '',
          observaciones ? `Obs: ${observaciones}` : '',
          anexoPrev ? `Anexo Prev: ${anexoPrev}` : ''
        ].filter(Boolean)
        return parts.length ? parts.join(' | ') : null
      }

      const postHistory = async (payload: any) => {
        const res = await fetch(`/api/rcm/${rcmId}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          console.error('Failed to save history:', res.status, txt)
          throw new Error('Error al guardar historial')
        }
        return await res.json().catch(() => null)
      }

      const createdEntries: any[] = []

      // 1) Persistir informes automáticos (si aplica)
      for (const a of autoCreates ?? []) {
        const payload: any = {
          tipo: 'Ope',
          tipoEstado: 'INFORME_AUTO',
          motivo: a.label,
          observacion: buildObservacion('', a.refCliente, a.observaciones, a.anexoPrev),
          funcionario,
          estPrev: null,
          estNuevo: null,
          aplicadoA,
          informe: a.numero
        }
        const created = await postHistory(payload)
        createdEntries.push(
          created ?? {
            tipo: payload.tipo,
            funcionario,
            estAnterior: null,
            estNuevo: null,
            informe: payload.informe,
            fechaAccion: new Date().toISOString(),
            observacion: payload.observacion,
            motivo: payload.motivo,
            tipoEstado: payload.tipoEstado
          }
        )
      }

      // 2) Persistir informes manuales
      for (const m of manualCreates ?? []) {
        const payload: any = {
          tipo: 'Ope',
          tipoEstado: 'INFORME_MANUAL',
          motivo: null,
          observacion: buildObservacion(m.tipoInforme, m.refCliente, m.observaciones, m.anexoPrev),
          funcionario,
          estPrev: null,
          estNuevo: null,
          aplicadoA,
          informe: m.numero
        }
        const created = await postHistory(payload)
        createdEntries.push(
          created ?? {
            tipo: payload.tipo,
            funcionario,
            estAnterior: null,
            estNuevo: null,
            informe: payload.informe,
            fechaAccion: new Date().toISOString(),
            observacion: payload.observacion,
            motivo: payload.motivo,
            tipoEstado: payload.tipoEstado
          }
        )
      }

      // 3) Marcar como DIGITADO (si corresponde)
      const prevNorm = normalizeStateForCompare(prevState)
      let digitadoEntry: any = null
      if (prevNorm !== 'DIGITADO') {
        const payload: any = {
          tipo: 'Ope',
          tipoEstado: 'DIGITADO',
          motivo: null,
          observacion: null,
          funcionario,
          estPrev: prevState ?? null,
          estNuevo: 'DIGITADO',
          aplicadoA,
          informe: informeToPersist
        }
        const created = await postHistory(payload)
        digitadoEntry =
          created ?? {
            tipo: payload.tipo,
            funcionario,
            estAnterior: payload.estPrev ?? null,
            estNuevo: payload.estNuevo ?? null,
            informe: payload.informe ?? null,
            fechaAccion: new Date().toISOString(),
            observacion: payload.observacion ?? null,
            motivo: payload.motivo,
            tipoEstado: payload.tipoEstado
          }
        createdEntries.push(digitadoEntry)
      }

      // actualizar fila en UI (estado + N° informe)
      setData(prev =>
        prev.map(d =>
          d.id === rcmId || (d as any).representativeRcmId === rcmId
            ? { ...d, estadoOperativo: prevNorm !== 'DIGITADO' ? 'DIGITADO' : (d as any).estadoOperativo, informe: informeToPersist }
            : d
        )
      )
      setFilteredData(prev =>
        prev.map(d =>
          d.id === rcmId || (d as any).representativeRcmId === rcmId
            ? { ...d, estadoOperativo: prevNorm !== 'DIGITADO' ? 'DIGITADO' : (d as any).estadoOperativo, informe: informeToPersist }
            : d
        )
      )

      // cache historial
      if (createdEntries.length) {
        const current = historyCache.get(rcmId) ?? []
        const newestFirst = [...createdEntries].reverse()
        historyCache.set(rcmId, [...newestFirst, ...current])
        if (histDialogOpen && histRowId === rcmId) {
          setHistRows(prev => [...newestFirst, ...prev])
        }
      }

      closeInformeDialog()
    } catch (e) {
      console.error('handleConfirmInformeDialog error', e)
      setInformeDialogErrors(prev => ({ ...prev, general: 'No se pudo confirmar el informe.' }))
    } finally {
      setSavingInformeDialog(false)
    }
  }

  const openMarkDialogForRow = (action: string, rowId?: number | null) => {
    setMarkDialogAction(action)
    setMarkDialogRowId(rowId ?? null) // importante: setear el id aquí
    // reset campos del diálogo
    setInformeNumber('')
    setCorrectionMotivo('')
    setCorrectionObservaciones('')
    // Para EVENTO, el tipo debe venir seleccionado por defecto
    setEventType(action === 'EVENTO' ? 'INFO_PENDIENTE' : '')
    if (action === 'EVENTO' && rowId != null) {
      // Por regla de negocio: el estado actual debe venir preseleccionado
      setEventReturnState(getCurrentStateForRow(rowId) || '')
    } else {
      setEventReturnState('')
    }
    handleCloseMarkMenu()
    setMarkDialogOpen(true)
  }

  // Permite que el panel de detalle dispare el flujo de "Cerrar evento".
  useEffect(() => {
    const onResolve = (ev: Event) => {
      try {
        const anyEv = ev as any
        const rcmId = Number(anyEv?.detail?.rcmId)
        if (!Number.isFinite(rcmId) || rcmId <= 0) return

        openMarkDialogForRow('CERRAR_EVENTO', rcmId)
      } catch (e) {
        // noop
      }
    }

    window.addEventListener('rcmnavigator:cerrar-evento', onResolve as any)
    return () => window.removeEventListener('rcmnavigator:cerrar-evento', onResolve as any)
  }, [openMarkDialogForRow])

  const findAggregatedRowByRepresentativeRcmId = (rcmId: number) => {
    const fromData = data.find(d => Number((d as any).representativeRcmId) === rcmId)
    if (fromData) return fromData
    return filteredData.find(d => Number((d as any).representativeRcmId) === rcmId) ?? null
  }

  const openInformeDialogFromMark = async (rcmId: number) => {
    const agg = findAggregatedRowByRepresentativeRcmId(rcmId)
    if (!agg) {
      // abrir de todas formas, pero sin detalle (no debería pasar si se ejecuta desde una fila visible)
      await openInformeDialog(null, rcmId, null)
      setInformeDialogErrors(prev => ({ ...prev, general: 'No se pudo asociar el RCM a un Código Producto.' }))
      handleCloseMarkMenu()
      return
    }

    await openInformeDialog((agg as any).id, rcmId, {
      codigoNombre: (agg as any).codigoNombre,
      ss: (agg as any).ss,
      ot: (agg as any).ot,
      cliente: (agg as any).cliente,
      obra: (agg as any).obra,
      area: (agg as any).area,
      familia: (agg as any).familia,
      ensayos: (agg as any).ensayos,
      autoTemplates: (agg as any).autoTemplates,
      rcmNumeros: (agg as any).rcmNumeros,
      estadoOperativo: (agg as any).estadoOperativo
    })
    handleCloseMarkMenu()
  }

  const handleMarkAction = async (action: string, rowId?: number | null) => {
    // DIGITADO ahora usa el nuevo popup "Gestionar Informe"
    if (action === 'DIGITADO') {
      const rcmId = rowId ?? markRowId ?? null
      if (!rcmId) {
        console.warn('handleMarkAction: missing rowId for DIGITADO')
        handleCloseMarkMenu()
        return
      }
      await openInformeDialogFromMark(rcmId)
      return
    }

    // acciones que requieren diálogo (incluye las que ahora exigen observación obligatoria)
    const ACTIONS_REQUIRING_DIALOG = new Set([
      'EVENTO',
      'CERRAR_EVENTO',
      'CERRADO_OP',
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
      aplicadoA: getAppliedAForRow(rowId),
      informe: null
    }

    try {
      // optimista: actualizar UI localmente
      setData(prev => prev.map(d => (d.id === rowId || d.representativeRcmId === rowId ? { ...d, estadoOperativo: action } : d)))

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
      setData(prev => prev.map(d => (d.id === rowId || d.representativeRcmId === rowId ? { ...d, estadoOperativo: prevState } : d)))
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

    if (markDialogAction === 'EVENTO' || markDialogAction === 'CERRADO_OP') {
      if (!eventType) errors.eventType = 'Seleccione tipo'
      if (!correctionMotivo || !correctionMotivo.trim()) errors.motivo = 'Seleccione motivo'
    }

    if (markDialogAction === 'EVENTO') {
      if (!correctionObservaciones || !String(correctionObservaciones).trim()) {
        errors.observacion = 'Ingrese observación'
      }
      if (!eventReturnState || !String(eventReturnState).trim()) {
        errors.returnState = 'Seleccione estado destino'
      }
    }

    if (markDialogAction === 'CERRAR_EVENTO') {
      if (!correctionObservaciones || !String(correctionObservaciones).trim()) {
        errors.observacion = 'Ingrese observación'
      }
    }

    // Para estos estados la observación es obligatoria
    if (['ENVIADO_DIGITACION', 'FIRMADO', 'ENVIADO'].includes(String(markDialogAction ?? ''))) {
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
      if (rcmId == null) return
      if (!validateMarkDialog()) {
        // mostrar feedback rápido en consola / UI
        console.warn('Validation failed', formErrors)
        return
      }

      setSavingHistory(true)

      const isEvento = markDialogAction === 'EVENTO'
      const isCerrarEvento = markDialogAction === 'CERRAR_EVENTO'
      const eventTypeLabel =
        eventType === 'INFO_PENDIENTE'
          ? 'Info Pendiente'
          : eventType === 'ERROR_INTERNO'
            ? 'Error Interno'
            : eventType === 'CORRECCION'
              ? 'Corrección'
              : (eventType || 'Evento')

      const currentStateForClose = isCerrarEvento ? (getCurrentStateForRow(rcmId) ?? null) : null

      const buildEventoObservacion = () => {
        const obs = String(correctionObservaciones ?? '').trim()
        const dest = String(eventReturnState ?? '').trim()
        if (!dest) return obs || null
        if (!obs) return `Estado destino: ${dest}`
        return `${obs}\n\nEstado destino: ${dest}`
      }

      const payload: any = {
        tipo: isEvento ? 'Evento Abierto' : isCerrarEvento ? 'Evento Cerrado' : 'Ope',
        tipoEstado:
          isEvento
            ? 'EVENTO'
            : isCerrarEvento
              ? 'EVENTO_CERRADO'
              : (markDialogAction === 'CERRADO_OP' ? (eventType || markDialogAction) : markDialogAction),
        motivo: isEvento
          ? `${eventTypeLabel}${correctionMotivo && String(correctionMotivo).trim() ? ` - ${String(correctionMotivo).trim()}` : ''}`
          : isCerrarEvento
            ? 'Cierre de evento'
            : (correctionMotivo ?? null),
        observacion: isEvento ? buildEventoObservacion() : (correctionObservaciones ?? null),
        funcionario: getCurrentUserName() ?? 'Usuario',
        estPrev: getCurrentStateForRow(markDialogRowId) ?? null,
        estNuevo: isEvento ? (eventReturnState ?? null) : isCerrarEvento ? currentStateForClose : (markDialogAction ?? null),
        aplicadoA: getAppliedAForRow(rcmId),
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
      setData(prev =>
        prev.map(d =>
          d.id === rcmId || d.representativeRcmId === rcmId ? { ...d, estadoOperativo: payload.estNuevo ?? d.estadoOperativo } : d
        )
      )
      setFilteredData(prev =>
        prev.map(d =>
          d.id === rcmId || d.representativeRcmId === rcmId ? { ...d, estadoOperativo: payload.estNuevo ?? d.estadoOperativo } : d
        )
      )

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
      setEventReturnState('')
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

      // Sincronizar con backend (conEvento, contadores, etc.)
      try {
        void refreshSeguimiento()
      } catch {
        /* noop */
      }

      // Notificar al panel de detalle (tabs RCMs/Eventos) que debe recargar.
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('rcmnavigator:codigo-detalle-refresh'))
        }
      } catch {
        /* noop */
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
    setEventReturnState('')
  }

  const handleOpenRowMenu = (e: React.MouseEvent<HTMLElement>, rowId: number) => {
    setMenuAnchorEl(e.currentTarget)
    setMenuRowId(rowId)
  }
  const handleCloseRowMenu = () => {
    setMenuAnchorEl(null)
    setMenuRowId(null)
  }

  const handleRegistrarEvento = (rowId: number | null) => {
    handleCloseRowMenu()
    if (!rowId) return
    const current = normalizeStateKey(getCurrentStateForRow(rowId))
    if (current === 'CODIFICADO') return
    openMarkDialogForRow('EVENTO', rowId)
  }

  const handleCerrarEvento = (rowId: number | null) => {
    handleCloseRowMenu()
    if (!rowId) return
    openMarkDialogForRow('CERRAR_EVENTO', rowId)
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

    // Si es modo edición (no readonly), podemos ir directo por id sin necesitar lookup de fila.
    // En esta pantalla (Códigos Producto) el menú usa un RCM representativo.
    if (!opts?.readonly) {
      const parts = (typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean) : [])
      const lang = parts[0] || 'en'
      const target = `${window.location.origin}/${lang}/apps/rcm-edit/${rowId}`
      try {
        const newWin = window.open(target, '_blank')
        if (newWin) {
          try {
            newWin.opener = null
          } catch (e) {
            /* noop */
          }
          try {
            newWin.focus()
          } catch (e) {
            /* noop */
          }
        } else {
          window.location.href = target
        }
      } catch (e) {
        window.location.href = target
      }
      handleCloseRowMenu()
      return
    }

    const row = findRowById(rowId)
    if (!row) {
      console.warn('handleEdit: row not found', rowId, {
        dataIds: data.map(d => (d as any).id ?? (d as any)._id),
        filteredIds: filteredData.map(d => (d as any).id ?? (d as any)._id)
      })
      handleCloseRowMenu()
      return
    }

    // Modo readonly (ver): mantener comportamiento original
    const otId = row.ordenTrabajo?.id ?? row.ordenTrabajoId ?? row.ot ?? ''
    const tipo = row.ordenTrabajo?.tipo ?? row.tipo ?? row.tipoOT ?? ''
    let servicioId = ''
    if (Array.isArray(row.servicios) && row.servicios.length) {
      const s0: any = row.servicios[0]
      servicioId = s0.id ?? s0.servicioId ?? s0._id ?? ''
    }

    const params = new URLSearchParams()
    if (otId) params.set('otId', String(otId))
    if (tipo) params.set('tipo', String(tipo))
    params.set('servicioId', String(servicioId ?? ''))
    params.set('readonly', '1')

    const target = `${window.location.origin}/en/apps/encoder?${params.toString()}`
    try {
      const newWin = window.open(target, '_blank')
      if (newWin) {
        try {
          newWin.opener = null
        } catch (e) {
          /* noop */
        }
        try {
          newWin.focus()
        } catch (e) {
          /* noop */
        }
      } else {
        window.location.href = target
      }
    } catch (e) {
      window.location.href = target
    }
    handleCloseRowMenu()
  }

  // Igual que handleEdit pero abre en modo solo lectura (readonly=1)
  const handleView = (rowId: number | null) => {
    // reutilizar handleEdit en modo readonly para comportamiento idéntico
    handleEdit(rowId, { readonly: true })
  }

  const handleGenerateInforme = (rowId: number | null) => {
    console.log('Generar Informe', rowId)
    handleCloseRowMenu()
    if (typeof window !== 'undefined' && rowId != null) window.open(`/informes/generar/${rowId}`, '_blank')
  }

  const handleHistorial = async (rowId: number | null) => {
    // Asegurar que el menú contextual se cierre SIEMPRE
    handleCloseRowMenu()

    if (!rowId) {
      console.warn('handleHistorial: no rowId provided')
      return
    }

    // UX: abrir diálogo de inmediato y mostrar spinner mientras carga
    setHistRowId(rowId)
    setHistDialogOpen(true)
    setHistCodigoData(null)

    // Para armar el subtítulo: buscar el Código Producto (agrupador) asociado y cargar su descripción
    try {
      const agg = data.find(d => d.representativeRcmId === rowId) ?? filteredData.find(d => d.representativeRcmId === rowId)
      const codigoAgrupadorId = Number((agg as any)?.id)
      if (Number.isFinite(codigoAgrupadorId) && codigoAgrupadorId > 0) {
        const cachedLite = codigoLiteCache.get(codigoAgrupadorId)
        if (cachedLite) {
          setHistCodigoData(cachedLite)
        } else {
          // Vista liviana: sólo necesitamos descripcionServicio + codigoNombre
          fetch(`/api/codigo-agrupador/${codigoAgrupadorId}?view=dialog`, { cache: 'no-store' })
            .then(r => (r.ok ? r.json() : null))
            .then(json => {
              if (!json) return
              codigoLiteCache.set(codigoAgrupadorId, json)
              setHistCodigoData(json)
            })
            .catch(() => {
              /* noop */
            })
        }
      }
    } catch {
      /* noop */
    }

    // revisar caché primero
    const cached = historyCache.get(rowId)
    if (cached) {
      setHistRows(cached)
      setHistLoading(false)
      return
    }

    setHistRows([])
    setHistLoading(true)
    try {
      const res = await fetch(`/api/rcm/${rowId}/history`)
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('History API returned not ok:', res.status, txt)
        throw new Error('Error loading history')
      }
      const json = await res.json()
      const rows = (Array.isArray(json) ? json : []).slice().sort((a: any, b: any) => {
        const ta = new Date(a?.fechaAccion ?? 0).getTime()
        const tb = new Date(b?.fechaAccion ?? 0).getTime()
        return tb - ta
      })

      // guardar en caché para evitar refetchs posteriores
      historyCache.set(rowId, rows)
      setHistRows(rows)
    } catch (err) {
      console.error('Error loading history:', err)
      setHistRows([])
    } finally {
      setHistLoading(false)
    }
  }

  const handleCloseHistDialog = () => {
    setHistDialogOpen(false)
    setHistRowId(null)
    setHistRows([])
    setHistLoading(false)
    setHistCodigoData(null)
  }

  const refreshSeguimiento = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/codigo-agrupador/seguimiento?ts=${Date.now()}`, { cache: 'no-store' })
      const result = await res.json()
      const raw = Array.isArray(result) ? result : []

      const normalized: RCM[] = raw.map((r: any) => {
        const opCounts = (r?.estadoOperativoCounts ?? {}) as Record<string, number>
        const adCounts = (r?.estadoAdministrativoCounts ?? {}) as Record<string, number>

        const opMain = pickStateFromCounts(opCounts, [
          'EVENTO',
          'EN_PROCESO',
          'CODIFICADO',
          'ENSAYADO',
          'ENVIADO_DIGITACION',
          'DIGITADO',
          'REVISADO',
          'FIRMADO',
          'ENVIADO'
        ])

        const adMain = pickStateFromCounts(adCounts, ['SIN_INICIO', 'PAGADO', 'PENDIENTE', 'FACTURADO', 'ENVIADO'])

        const clienteNombre = r?.cliente?.razonSocial ?? r?.cliente?.nombreCliente ?? null
        const comuna = r?.ciudad ?? r?.obra?.comuna ?? r?.cliente?.comuna ?? r?.cliente?.ciudad ?? null

        return {
          id: Number(r.id),
          numeroRcm: String(r.codigoNombre ?? ''),
          codigoNombre: r.codigoNombre ?? null,
          descripcionServicio: (r as any).descripcionServicio ?? null,
          representativeRcmId: (r?.representativeRcmId ?? null) as number | null,
          rcmNumeros: r.rcmNumeros ?? [],
          sedes: Array.isArray(r?.sedes)
            ? (r.sedes as any[]).map(v => String(v ?? '').trim()).filter(Boolean)
            : [],
          ss: r.ss ?? null,
          ot: r.ot ?? null,
          ordenTrabajoId: (r?.ordenTrabajoId ?? null) as any,
          totalRcms: r.totalRcms ?? 0,
          conEvento: Boolean(r.conEvento),
          informe: (r.informe ?? null) as number | null,
          ensayos: r.ensayos ?? null,
          autoTemplates: r.autoTemplates ?? null,
          estadoOperativoCounts: opCounts,
          estadoAdministrativoCounts: adCounts,

          ciudad: comuna ?? null,

          fechaCodificacion: r.fechaCodificacionMin ?? '',
          fechaMuestreo: r.fechaMuestreoMin ?? '',
          estadoOperativo: opMain ?? undefined,
          estadoAdministrativo: adMain ?? undefined,

          area: r.areaNombre ?? null,
          familia: r.familiaNombre ?? null,
          cliente: { nombreCliente: clienteNombre ?? undefined, comuna: comuna ?? undefined },
          obra: r?.obra
            ? {
                numeroObra: r.obra.numeroObra ?? undefined,
                nombreObra: (r.obra as any).nombreObra ?? undefined
              }
            : null
        } as RCM
      })

      setData(normalized)
      applyDateFilter(normalized, filters)
    } catch (err) {
      console.error('Error fetching Códigos Producto:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Fetch Códigos Producto (seguimiento)
  const pathname = usePathname()
  useEffect(() => {
    refreshSeguimiento()
  }, [refreshSeguimiento, pathname])

  // Refrescar cuando el usuario vuelve a la app / pestaña
  useEffect(() => {
    const onFocus = () => refreshSeguimiento()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshSeguimiento()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refreshSeguimiento])

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

  const compareDateOnly = (aRaw: any, bRaw: any) => {
    const a = toDateOnly(aRaw)
    const b = toDateOnly(bRaw)
    const at = a ? a.getTime() : null
    const bt = b ? b.getTime() : null
    if (at == null && bt == null) return 0
    if (at == null) return 1
    if (bt == null) return -1
    return at === bt ? 0 : at > bt ? 1 : -1
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

  // helper: formatear fecha a DD-MM-AAAA (sin hora)
  const formatDateDDMMYYYYDateOnlyDash = (v: any) => {
    if (!v) return '-'
    const d = v instanceof Date ? v : new Date(v)
    if (isNaN(d.getTime())) return '-'
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }

  const openOperationalHelp = (e: React.MouseEvent<HTMLElement>, rawState: any, row: any) => {
    const key = normalizeStateKey(rawState) ?? String(rawState ?? '').trim().toUpperCase()

    // Sólo para los 4 estados requeridos
    const allowed = new Set(['EN_PROCESO', 'CODIFICADO', 'ENVIADO_DIGITACION', 'ENVIADO'])
    if (!allowed.has(key)) return

    e.stopPropagation()
    setOpHelpAnchorEl(e.currentTarget)
    setOpHelpState(key)
    // en imágenes se ve fecha; usamos fecha de codificación como referencia
    setOpHelpDate((row as any)?.fechaCodificacion ?? null)
  }

  const closeOperationalHelp = () => {
    setOpHelpAnchorEl(null)
    setOpHelpState(null)
    setOpHelpDate(null)
  }

  const getOperationalHelpCopy = (state: string | null) => {
    switch (state) {
      case 'EN_PROCESO':
        return {
          title: 'En Proceso',
          tone: 'info' as const,
          lines: [
            'En Proceso se gestiona desde el Navegador RCM (Sala).',
            'Este estado se actualiza automáticamente cuando los ensayos avanzan.',
            'Desde aquí es solo visual.'
          ]
        }
      case 'CODIFICADO':
        return {
          title: 'Codificado',
          tone: 'info' as const,
          lines: [
            'Codificado se gestiona desde el Navegador RCM (Sala).',
            'Este estado se actualiza automáticamente cuando los ensayos avanzan.',
            'Desde aquí es solo visual.'
          ]
        }
      case 'ENVIADO_DIGITACION':
        return {
          title: 'Enviado a Digitación',
          tone: 'warning' as const,
          lines: [
            'Para avanzar a Digitado, usar el botón “Gestionar Informe”',
            'en la columna Acciones. Allí se ingresan los N° de',
            'informe y se confirma.'
          ]
        }
      case 'ENVIADO':
        return {
          title: 'Enviado',
          tone: 'success' as const,
          lines: ['Estado final del flujo operativo']
        }
      default:
        return null
    }
  }

  const formatTimeHHmm = (v: any) => {
    if (!v) return '-'
    const d = v instanceof Date ? v : new Date(v)
    if (isNaN(d.getTime())) return '-'
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${min}`
  }

  const daysBetween = (from: any, to: any) => {
    const d1 = toDateOnly(from)
    const d2 = toDateOnly(to)
    if (!d1 || !d2) return null
    const diff = d2.getTime() - d1.getTime()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  }

  const filterRowsForNavigator = (
    rows: RCM[],
    filters?: Filters,
    opts?: { ignoreOperational?: boolean; ignoreAdministrative?: boolean }
  ) => {
    // start with all rows
    let result = rows.slice()

    // determine which property to use for date filtering
    const dfRaw = filters?.dateField ? String(filters.dateField).toLowerCase() : ''
    let fieldName: 'fechaCodificacion' | 'fechaMuestreo' | null = null
    if (dfRaw === 'fecha_codificacion' || dfRaw === 'fechacodificacion' || dfRaw === 'fecha-codificacion') {
      fieldName = 'fechaCodificacion'
    } else if (dfRaw === 'fecha_muestreo' || dfRaw === 'fechamuestreo' || dfRaw === 'fecha-muestreo') {
      fieldName = 'fechaMuestreo'
    }

    // Date filtering (only if fieldName + start+end provided)
    if (fieldName && filters && filters.start && filters.end) {
      const start = toDateOnly(filters.start)
      const end = toDateOnly(filters.end)
      if (start && end) {
        result = result.filter(r => {
          const raw = (r as any)[fieldName]
          const dOnly = toDateOnly(raw)
          if (!dOnly) return false
          return dOnly.getTime() >= start.getTime() && dOnly.getTime() <= end.getTime()
        })
      }
    }

    // Area filtering: comparar por nombre (Header entrega areaName)
    const areaValue = (filters as any)?.areaName ?? null
    if (areaValue !== null && typeof areaValue !== 'undefined' && String(areaValue).trim() !== '') {
      const rawNorm = normalizeText(areaValue)
      result = result.filter(r => normalizeText(r.area ?? '').includes(rawNorm))
    }

    // Familia/Tipo de Servicio filtering: comparar por nombre
    const familiaValue = (filters as any)?.familia ?? null
    if (familiaValue !== null && typeof familiaValue !== 'undefined' && String(familiaValue).trim() !== '') {
      const rawNorm = normalizeText(familiaValue)
      result = result.filter(r => normalizeText(r.familia ?? '').includes(rawNorm))
    }

    // Sede filtering: el Código Producto calza si contiene esa sede en su lista
    const sedeValue = (filters as any)?.sede ?? null
    const sedeSelected = Array.isArray(sedeValue) ? sedeValue : sedeValue ? [sedeValue] : []
    const sedeWanted = sedeSelected.map(v => normalizeText(v)).filter(Boolean)
    if (sedeWanted.length) {
      result = result.filter(r => {
        const sedes = Array.isArray((r as any).sedes) ? ((r as any).sedes as any[]) : []
        if (!sedes.length) return false
        return sedes.some(s => {
          const norm = normalizeText(s)
          return sedeWanted.some(w => norm.includes(w))
        })
      })
    }

    // Con Evento filtering
    if (filters?.conEvento) {
      result = result.filter(r => Boolean((r as any).conEvento))
    }

    // Estado Operativo filtering (multi-select)
    if (!opts?.ignoreOperational && filters && (filters.estadoOperativo as any)) {
      const rawList = Array.isArray(filters.estadoOperativo) ? filters.estadoOperativo : [filters.estadoOperativo]
      const selected = rawList.map(v => String(v ?? '').trim()).filter(Boolean)

      if (selected.length) {
        const keys = selected.map(v => normalizeStateKey(v)).filter(Boolean) as string[]
        const norms = selected.map(v => normalizeText(v))

        result = result.filter(r => {
          const counts = r.estadoOperativoCounts
          if (keys.length && counts && typeof counts === 'object') {
            if (keys.some(k => (counts as any)[k] && Number((counts as any)[k]) > 0)) return true
          }
          const opNorm = normalizeText(r.estadoOperativo ?? '')
          return norms.some(n => opNorm.includes(n))
        })
      }
    }

    // Estado Administrativo filtering (multi-select)
    if (!opts?.ignoreAdministrative && filters && (filters.estadoAdministrativo as any)) {
      const rawList = Array.isArray(filters.estadoAdministrativo) ? filters.estadoAdministrativo : [filters.estadoAdministrativo]
      const selected = rawList.map(v => String(v ?? '').trim()).filter(Boolean)

      if (selected.length) {
        const keys = selected.map(v => normalizeStateKey(v)).filter(Boolean) as string[]
        const norms = selected.map(v => normalizeText(v))

        result = result.filter(r => {
          const counts = r.estadoAdministrativoCounts
          if (keys.length && counts && typeof counts === 'object') {
            if (keys.some(k => (counts as any)[k] && Number((counts as any)[k]) > 0)) return true
          }
          const adNorm = normalizeText(r.estadoAdministrativo ?? '')
          return norms.some(n => adNorm.includes(n))
        })
      }
    }

    return result
  }

  const applyDateFilter = (rows: RCM[], filters?: Filters) => {
    console.log('applyDateFilter called, rows:', rows.length, 'filters:', filters)
    const result = filterRowsForNavigator(rows, filters)
    console.log('applyDateFilter result count:', result.length)
    setFilteredData(result)
  }

  const opStateOrder = useMemo(() => {
    const map = new Map<string, number>()
    OPERATIONAL_STATES.forEach((s, idx) => {
      if (s?.value) map.set(String(s.value).trim().toUpperCase(), idx)
    })
    return map
  }, [])

  const adminStateOrder = useMemo(() => {
    const map = new Map<string, number>()
    ;(ADMINISTRATIVE_STATES ?? []).forEach((s: any, idx: number) => {
      const key = String(s?.value ?? '').trim().toUpperCase()
      if (key) map.set(key, idx)
    })
    return map
  }, [])

  const columns = useMemo((): ColumnDef<RCM>[] => {
    return [
      {
        id: 'codigo',
        header: 'CÓDIGO',
        accessorFn: r => r.codigoNombre ?? r.numeroRcm,
        sortingFn: (rowA, rowB, columnId) => compareText(rowA.getValue(columnId), rowB.getValue(columnId)),
        cell: ({ row }) => <Typography variant='body2' sx={{ fontWeight: 700 }}>{row.original.codigoNombre ?? row.original.numeroRcm}</Typography>
      },
      {
        id: 'ot',
        header: 'OT',
        accessorKey: 'ot',
        sortingFn: (rowA, rowB, columnId) => compareText(rowA.getValue(columnId), rowB.getValue(columnId)),
        cell: ({ row }) => <Typography variant='body2'>{row.original.ot ?? '-'}</Typography>
      },
      {
        id: 'fechaCod',
        header: 'FECHA COD.',
        accessorKey: 'fechaCodificacion',
        sortingFn: (rowA, rowB, columnId) => {
          return compareDateOnly(rowA.getValue(columnId) as any, rowB.getValue(columnId) as any)
        },
        sortDescFirst: true,
        cell: ({ row }) => <span>{formatDateDDMMYYYYDateOnly(row.original.fechaCodificacion)}</span>
      },
      {
        id: 'clienteObra',
        header: 'CLIENTE - OBRA',
        accessorFn: r => {
          const cliente =
            r.cliente?.nombreCliente ??
            (r as any).clienteNombre ??
            (r as any).nombreCliente ??
            (typeof (r as any).cliente === 'string' ? (r as any).cliente : null)
          const obra = r.obra?.nombreObra ?? r.obra?.numeroObra ?? null
          const parts = [cliente, obra].map(v => String(v ?? '').trim()).filter(Boolean)
          return parts.length ? parts.join(' - ') : '-'
        },
        sortingFn: (rowA, rowB, columnId) => compareText(rowA.getValue(columnId), rowB.getValue(columnId)),
        cell: ({ row }) => {
          const cliente =
            row.original.cliente?.nombreCliente ??
            (row.original as any).clienteNombre ??
            (row.original as any).nombreCliente ??
            (typeof (row.original as any).cliente === 'string' ? (row.original as any).cliente : null) ??
            null
          const obraNombre = row.original.obra?.nombreObra ?? null
          const obraNumero = row.original.obra?.numeroObra ?? null
          const ciudad = row.original.ciudad ?? null

          const clienteText = String(cliente ?? '').trim()

          // Mantener el diseño del ejemplo: cliente arriba, obra abajo.
          // En la segunda línea priorizamos el número de obra (más "tipo ejemplo"),
          // y dejamos el nombre disponible como tooltip si existe.
          const obraMain = String(obraNumero ?? obraNombre ?? '').trim()
          const obraLabel = obraMain ? `Obra ${obraMain}` : ''
          const ciudadText = String(ciudad ?? '').trim()
          const secondLine = [obraLabel, ciudadText].filter(Boolean).join('  ')

          const title = [clienteText, obraNombre ? `Obra: ${obraNombre}` : null, ciudadText ? `Ciudad: ${ciudadText}` : null]
            .filter(Boolean)
            .join('\n')

          if (!clienteText && !secondLine) {
            return <Typography variant='body2'>-</Typography>
          }

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} title={title}>
              <Typography variant='body2' sx={{ fontWeight: 700 }}>
                {clienteText || '-'}
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ lineHeight: 1.2 }}>
                {secondLine || '-'}
              </Typography>
            </Box>
          )
        }
      },
      {
        id: 'areaServicio',
        header: 'ÁREA - SERVICIO',
        accessorFn: r => {
          const area = String(r.area ?? '').trim()
          const servicio = String(r.familia ?? '').trim()
          const parts = [area, servicio].filter(Boolean)
          return parts.length ? parts.join(' - ') : '-'
        },
        sortingFn: (rowA, rowB, columnId) => compareText(rowA.getValue(columnId), rowB.getValue(columnId)),
        cell: ({ row }) => {
          const areaText = String(row.original.area ?? '').trim()
          const servicioText = String(row.original.familia ?? '').trim()

          const title = [areaText, servicioText].filter(Boolean).join('\n')

          if (!areaText && !servicioText) {
            return <Typography variant='body2'>-</Typography>
          }

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} title={title}>
              <Typography variant='body2' sx={{ fontWeight: 700 }}>
                {areaText || '-'}
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ lineHeight: 1.2 }}>
                {servicioText || '-'}
              </Typography>
            </Box>
          )
        }
      },
      {
        id: 'totalRcms',
        header: '# RCMS',
        accessorFn: r => Number(r.totalRcms ?? 0),
        sortingFn: (rowA, rowB, columnId) => compareNumber(rowA.getValue(columnId), rowB.getValue(columnId)),
        sortDescFirst: true,
        cell: ({ row }) => <span>{row.original.totalRcms ?? 0}</span>
      },
      {
        id: 'informe',
        header: 'N° INFORME',
        accessorFn: r => (r.informe == null ? null : Number(r.informe)),
        sortingFn: (rowA, rowB, columnId) => compareNumber(rowA.getValue(columnId), rowB.getValue(columnId)),
        sortDescFirst: true,
        cell: ({ row }) => <span>{row.original.informe ?? '-'}</span>
      },
      {
        id: 'estOp',
        header: 'EST. OPERATIVO',
        accessorKey: 'estadoOperativo',
        sortingFn: (rowA, rowB, columnId) => {
          const aRaw = rowA.getValue(columnId) as any
          const bRaw = rowB.getValue(columnId) as any
          const aKey = normalizeStateKey(aRaw) ?? String(aRaw ?? '').trim().toUpperCase()
          const bKey = normalizeStateKey(bRaw) ?? String(bRaw ?? '').trim().toUpperCase()
          const ai = aKey ? opStateOrder.get(aKey) : null
          const bi = bKey ? opStateOrder.get(bKey) : null
          if (ai == null && bi == null) return compareText(aKey, bKey)
          if (ai == null) return 1
          if (bi == null) return -1
          return ai === bi ? 0 : ai > bi ? 1 : -1
        },
        cell: ({ row }) => {
          const opRaw = row.original.estadoOperativo ?? null
          const opLabel = (() => {
            if (!opRaw) return '-'
            const opKey = normalizeStateKey(opRaw) ?? String(opRaw ?? '').trim().toUpperCase()
            if (opKey === 'ENVIADO_DIGITACION') return 'Env. Digitación'
            return OPERATIONAL_STATES.find(s => s.value === opKey)?.label ?? opRaw
          })()
          const info = getOperationalInfo(opRaw ?? undefined)

          const hasEvento = Boolean((row.original as any).conEvento)

          const opKey = normalizeStateKey(opRaw) ?? String(opRaw ?? '').trim().toUpperCase()
          const isHelpEnabled = ['EN_PROCESO', 'CODIFICADO', 'ENVIADO_DIGITACION', 'ENVIADO'].includes(opKey)

          const repIdRaw = (row.original as any).representativeRcmId
          const repId = repIdRaw == null ? null : Number(repIdRaw)
          const canAdvanceToEnviadoDigitacion = opKey === 'ENSAYADO' && Number.isFinite(repId) && (repId as number) > 0

          const canAdvanceToRevisado = opKey === 'DIGITADO' && Number.isFinite(repId) && (repId as number) > 0

          const canAdvanceToFirmado = opKey === 'REVISADO' && Number.isFinite(repId) && (repId as number) > 0

          const canAdvanceToEnviado = opKey === 'FIRMADO' && Number.isFinite(repId) && (repId as number) > 0

          const isClickable = isHelpEnabled || canAdvanceToEnviadoDigitacion || canAdvanceToRevisado || canAdvanceToFirmado || canAdvanceToEnviado

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Chip
                label={opLabel}
                title={info.hex ?? ''}
                size='small'
                variant='filled'
                icon={
                  hasEvento ? (
                    <ReportProblemOutlinedIcon
                      fontSize='small'
                      titleAccess='Con evento'
                      sx={{ color: theme => `${theme.palette.error.main} !important` }}
                    />
                  ) : undefined
                }
                clickable={isClickable}
                onClick={e => {
                  if (canAdvanceToEnviadoDigitacion) {
                    e.stopPropagation()
                    openMarkDialogForRow('ENVIADO_DIGITACION', repId as number)
                    return
                  }
                  if (canAdvanceToRevisado) {
                    e.stopPropagation()
                    openMarkDialogForRow('REVISADO', repId as number)
                    return
                  }
                  if (canAdvanceToFirmado) {
                    e.stopPropagation()
                    openMarkDialogForRow('FIRMADO', repId as number)
                    return
                  }
                  if (canAdvanceToEnviado) {
                    e.stopPropagation()
                    openMarkDialogForRow('ENVIADO', repId as number)
                    return
                  }
                  if (isHelpEnabled) {
                    openOperationalHelp(e as any, opRaw, row.original)
                  }
                }}
                sx={{
                  bgcolor: info.bgcolor,
                  color: info.colorText,
                  border: `1px solid ${info.border}`,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  borderRadius: 2,
                  px: 1,
                  py: 0.4,
                  minWidth: 84,
                  justifyContent: 'center'
                }}
              />
            </Box>
          )
        }
      },
      {
        id: 'estAd',
        header: 'EST. ADMINISTRATIVO',
        accessorKey: 'estadoAdministrativo',
        sortingFn: (rowA, rowB, columnId) => {
          const aRaw = rowA.getValue(columnId) as any
          const bRaw = rowB.getValue(columnId) as any
          const aKey = normalizeStateKey(aRaw) ?? String(aRaw ?? '').trim().toUpperCase()
          const bKey = normalizeStateKey(bRaw) ?? String(bRaw ?? '').trim().toUpperCase()
          const ai = aKey ? adminStateOrder.get(aKey) : null
          const bi = bKey ? adminStateOrder.get(bKey) : null
          if (ai == null && bi == null) return compareText(aKey, bKey)
          if (ai == null) return 1
          if (bi == null) return -1
          return ai === bi ? 0 : ai > bi ? 1 : -1
        },
        cell: ({ row }) => {
          const adRaw = row.original.estadoAdministrativo ?? null
          if (!adRaw) {
            return (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Chip
                  label='-'
                  size='small'
                  variant='filled'
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.06)',
                    color: 'rgba(0,0,0,0.65)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    borderRadius: 2,
                    px: 1,
                    py: 0.4,
                    minWidth: 84,
                    justifyContent: 'center'
                  }}
                />
              </Box>
            )
          }

          const adKey = normalizeStateKey(adRaw) ?? String(adRaw ?? '').trim().toUpperCase()
          const adLabel =
            (ADMINISTRATIVE_STATES ?? []).find((s: any) => String(s?.value ?? '').trim().toUpperCase() === adKey)?.label ??
            String(adRaw)

          const info = getAdministrativeInfo(adRaw ?? undefined)

          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Chip
                label={adLabel}
                title={info.hex ?? ''}
                size='small'
                variant='filled'
                sx={{
                  bgcolor: info.bgcolor,
                  color: info.colorText,
                  border: `1px solid ${info.border}`,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  borderRadius: 2,
                  px: 1,
                  py: 0.4,
                  minWidth: 84,
                  justifyContent: 'center'
                }}
              />
            </Box>
          )
        }
      },
      {
        id: 'acciones',
        header: 'ACCIONES',
        enableSorting: false,
        cell: ({ row }) => (
          <Box onClick={e => e.stopPropagation()} sx={{ display: 'inline-flex', justifyContent: 'center' }}>
            <IconButton
              size='small'
              title='Ver detalle'
              onClick={e => {
                e.stopPropagation()
                openCodigoProductoDialog(row.original)
              }}
            >
              <VisibilityIcon fontSize='small' />
            </IconButton>

            <IconButton
              size='small'
              title='Informes'
              disabled={(() => {
                if (!row.original.representativeRcmId) return true
                const op = normalizeStateKey(row.original.estadoOperativo)

                // Habilitado solo en:
                // - EN_PROCESO: cuando hay al menos 1 RCM ENSAYADO
                // - ENSAYADO
                // - ENVIADO_DIGITACION
                // - DIGITADO
                if (!op) return true

                if (op === 'EN_PROCESO') {
                  const counts = (row.original as any).estadoOperativoCounts as Record<string, number> | undefined
                  const ensayadoCount = Number(counts?.ENSAYADO ?? 0)
                  return !(Number.isFinite(ensayadoCount) && ensayadoCount > 0)
                }

                return !['ENSAYADO', 'ENVIADO_DIGITACION', 'DIGITADO'].includes(op)
              })()}
              onClick={e => {
                e.stopPropagation()
                if (!row.original.representativeRcmId) return
                openInformeDialog(row.original.id, row.original.representativeRcmId, {
                  codigoNombre: row.original.codigoNombre,
                  ss: row.original.ss,
                  ot: row.original.ot,
                  cliente: row.original.cliente,
                  obra: row.original.obra,
                  area: row.original.area,
                  familia: row.original.familia,
                  ensayos: row.original.ensayos,
                  autoTemplates: (row.original as any).autoTemplates,
                  rcmNumeros: (row.original as any).rcmNumeros,
                  estadoOperativo: row.original.estadoOperativo
                })
              }}
            >
              <DescriptionOutlinedIcon fontSize='small' />
            </IconButton>

            <IconButton
              size='small'
              title='Más acciones'
              disabled={!row.original.representativeRcmId}
              onClick={e => {
                e.stopPropagation()
                if (!row.original.representativeRcmId) return
                handleOpenRowMenu(e as any, row.original.representativeRcmId)
              }}
            >
              <MoreVertIcon fontSize='small' />
            </IconButton>
          </Box>
        )
      }
    ]
  }, [adminStateOrder, opStateOrder, onSelectCodigo])

  const [sorting, setSorting] = useState<SortingState>([{ id: 'fechaCod', desc: true }])

  const searchedData = useMemo(() => {
    const q = String(globalFilter ?? '').toLowerCase().trim()
    if (!q) return filteredData
    return filteredData.filter(item =>
      [
        item.codigoNombre,
        item.numeroRcm,
        item.ss,
        item.ot,
        item.ciudad,
        item.area,
        item.familia,
        item.obra?.numeroObra,
        item.cliente?.nombreCliente,
        item.estadoOperativo,
        item.estadoAdministrativo,
        item.informe
      ]
        .filter(v => v !== null && typeof v !== 'undefined')
        .some(v => String(v).toLowerCase().includes(q))
    )
  }, [filteredData, globalFilter])

  // click fuera de la tabla => limpiar selección
  useEffect(() => {
    const onMouseDown = (ev: MouseEvent) => {
      if (selectedCodigoId == null) return

      const target = ev.target as HTMLElement | null
      if (!target) return

      // si el click ocurre dentro del panel de detalle inferior, no limpiar
      if (target.closest('[data-rcmnav-detail]')) return

      // si el click ocurre dentro de un menú/popover/modal (portal), no limpiar
      if (target.closest('.MuiPopover-root') || target.closest('.MuiMenu-root') || target.closest('.MuiModal-root')) return

      const root = tableKeyboardRef.current
      if (!root) return
      if (root.contains(target)) return

      setSelectedCodigoId(null)
      onSelectCodigo?.(null)
    }

    window.addEventListener('mousedown', onMouseDown, true)
    return () => window.removeEventListener('mousedown', onMouseDown, true)
  }, [selectedCodigoId, onSelectCodigo])

  // si el elemento seleccionado ya no está en la data visible (por filtros/búsqueda), limpiar selección
  useEffect(() => {
    if (selectedCodigoId == null) return
    const exists = searchedData.some(it => Number((it as any).id) === selectedCodigoId)
    if (!exists) setSelectedCodigoId(null)
  }, [searchedData, selectedCodigoId])

  const table = useReactTable({
    data: searchedData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
      global: fuzzyFilter
    } as any,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const exportFilteredToExcel = useCallback(() => {
    const rows = table.getPrePaginationRowModel().rows

    const dataToExport = rows.map(r => {
      const item = r.original as RCM

      const codigo = (item.codigoNombre ?? item.numeroRcm ?? '').toString().trim()
      const ot = (item.ot ?? '').toString().trim()
      const fechaCod = formatDateDDMMYYYYDateOnly(item.fechaCodificacion)

      const cliente =
        item.cliente?.nombreCliente ??
        (item as any).clienteNombre ??
        (item as any).nombreCliente ??
        (typeof (item as any).cliente === 'string' ? (item as any).cliente : null) ??
        ''

      const obra = item.obra?.numeroObra ?? item.obra?.nombreObra ?? ''

      const clienteObraParts = [String(cliente ?? '').trim(), obra ? `Obra ${String(obra).trim()}` : ''].filter(Boolean)
      const clienteObra = clienteObraParts.length ? clienteObraParts.join(' - ') : ''

      const ciudad = (item.ciudad ?? item.cliente?.comuna ?? (item as any).comuna ?? '').toString().trim()

      const area = String(item.area ?? '').trim()
      const servicio = String(item.familia ?? '').trim()
      const areaServicio = [area, servicio].filter(Boolean).join(' - ')

      const totalRcms = item.totalRcms ?? 0
      const informe = item.informe ?? ''

      const opRaw = item.estadoOperativo ?? ''
      const opLabel = opRaw ? (OPERATIONAL_STATES.find(s => s.value === opRaw)?.label ?? opRaw) : ''

      return {
        'CÓDIGO': codigo,
        OT: ot,
        'FECHA COD.': fechaCod,
        'CLIENTE - OBRA': clienteObra,
        CIUDAD: ciudad,
        'ÁREA - SERVICIO': areaServicio,
        '# RCMS': totalRcms,
        'N° INFORME': informe,
        'EST. OPERATIVO': opLabel,
        'CON EVENTO': (item as any).conEvento ? 'Sí' : 'No'
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Navegador')

    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 10 },
      { wch: 14 },
      { wch: 55 },
      { wch: 18 },
      { wch: 28 },
      { wch: 8 },
      { wch: 12 },
      { wch: 18 },
      { wch: 10 }
    ]

    const today = new Date().toISOString().split('T')[0]
    XLSX.writeFile(workbook, `Navegador_RCM_${today}.xlsx`)
  }, [table])


  // Indicadores del dashboard: NO deben verse afectados por filtros de estado.
  // Respetan fecha/area/familia/conEvento, pero ignoran estadoOperativo/estadoAdministrativo.
  const indicators = useMemo(() => {
    // helper: normalizar estado operativo a value comparable (por ejemplo "CODIFICADO" / "EN_PROCESO")
    const normOp = (raw?: string) => {
      if (!raw) return ''
      const u = normalizeState(raw)
      const byValue = OPERATIONAL_STATES.find(s => s.value === u)
      if (byValue) return byValue.value

      const rawNorm =
        (raw ?? '')
          .toString()
          .normalize?.('NFD')
          ?.replace(/[\u0300-\u036f]/g, '')
          ?.toLowerCase() ?? String(raw ?? '').toLowerCase()
      const byLabel = OPERATIONAL_STATES.find(
        s =>
          (s.label ?? '')
            .toString()
            .normalize?.('NFD')
            ?.replace(/[\u0300-\u036f]/g, '')
            .toLowerCase() === rawNorm
      )
      if (byLabel) return byLabel.value

      return u
    }

    const isConEvento = (d: RCM) => {
      if (Boolean((d as any).conEvento)) return true
      const counts = d.estadoOperativoCounts
      if (counts && typeof counts === 'object' && Number(counts.EVENTO ?? 0) > 0) return true
      return false
    }

    const isPagado = (d: RCM) => {
      const counts = d.estadoAdministrativoCounts
      if (counts && typeof counts === 'object') {
        return Number(counts.PAGADO ?? 0) > 0
      }

      const raw = String((d as any).estadoAdministrativo ?? '').trim()
      if (!raw) return false
      const key = normalizeStateKey(raw)
      if (key === 'PAGADO') return true
      return normalizeText(raw).includes('pag')
    }

    const isPendPago = (d: RCM) => {
      // Interpretación simple: si NO está pagado y hay alguna señal de facturación/pendiente.
      if (isPagado(d)) return false

      const counts = d.estadoAdministrativoCounts
      if (counts && typeof counts === 'object') {
        if (Number(counts.FACTURADO ?? 0) > 0) return true
        if (Number((counts as any).PENDIENTE ?? 0) > 0) return true
      }

      const raw = String((d as any).estadoAdministrativo ?? '').trim()
      const norm = normalizeText(raw)
      return norm.includes('factur') || norm.includes('pend')
    }

    const byState: Record<string, number> = {
      CODIFICADO: 0,
      EN_PROCESO: 0,
      ENSAYADO: 0,
      ENVIADO_DIGITACION: 0,
      DIGITADO: 0,
      REVISADO: 0,
      FIRMADO: 0,
      ENVIADO: 0
    }

    let conEventoTotal = 0
    let conEventoEnProceso = 0
    let pendPagoFirmado = 0
    let pendPagoEnviado = 0

    const indicatorRows = filterRowsForNavigator(data, filters, { ignoreOperational: true, ignoreAdministrative: true })

    for (const d of indicatorRows) {
      const opRaw = d.estadoOperativo ?? (Array.isArray(d.servicios) && d.servicios.length ? ((d.servicios[0] as any).estado ?? '') : '')
      const opVal = normOp(opRaw)

      if (Object.prototype.hasOwnProperty.call(byState, opVal)) {
        byState[opVal] += 1
      }

      const hasEvento = isConEvento(d)
      if (hasEvento) {
        conEventoTotal += 1
        if (opVal === 'EN_PROCESO') conEventoEnProceso += 1
      }

      if (opVal === 'FIRMADO' && isPendPago(d)) pendPagoFirmado += 1
      if (opVal === 'ENVIADO' && isPendPago(d)) pendPagoEnviado += 1
    }

    return {
      byState,
      conEventoTotal,
      conEventoEnProceso,
      pendPagoFirmado,
      pendPagoEnviado
    }
  }, [data, filters])

  if (loading) return <div>Cargando...</div>

  const isDashboardCardActive = (key: string) => {
    if (key === 'CON_EVENTO') return Boolean(filters?.conEvento)
    const raw = (filters as any)?.estadoOperativo
    if (Array.isArray(raw)) return raw.map(v => normalizeStateKey(v)).includes(key)
    const current = normalizeStateKey(raw ?? null)
    return Boolean(current) && current === key
  }

  const emitDashboardFilterToggle = (key: string) => {
    if (!onFiltersChange) return

    const prev = (filters ?? {}) as Filters
    const next: Filters = { ...prev }

    if (key === 'CON_EVENTO') {
      next.conEvento = prev.conEvento ? undefined : true
    } else {
      const raw = (prev as any).estadoOperativo
      const list = Array.isArray(raw) ? raw.slice() : raw ? [raw] : []
      const normalized = list.map(v => normalizeStateKey(v)).filter(Boolean) as string[]
      const has = normalized.includes(key)
      const nextList = has ? normalized.filter(k => k !== key) : [...normalized, key]
      next.estadoOperativo = nextList.length ? nextList : undefined
    }

    const isEmpty = (v: any) => {
      if (v === null || typeof v === 'undefined') return true
      if (typeof v === 'string') return v.trim() === ''
      if (Array.isArray(v)) return v.length === 0
      if (typeof v === 'boolean') return v === false
      return false
    }
    const nextIsEmpty =
      isEmpty(next.dateField) &&
      isEmpty(next.start) &&
      isEmpty(next.end) &&
      isEmpty(next.estadoOperativo) &&
      isEmpty(next.estadoAdministrativo) &&
      isEmpty(next.conEvento) &&
      isEmpty(next.areaId) &&
      isEmpty(next.areaName) &&
      isEmpty(next.familia)

    onFiltersChange(nextIsEmpty ? undefined : next)
  }

  return (
    <Card>
      {/* Card header: only title */}
      <CardHeader
        title={
          <Box display='flex' alignItems='center' justifyContent='space-between' gap={2}>
            <Typography variant='h6'>Códigos Producto</Typography>
          </Box>
        }
      />

      <Divider />

      {/* ROW: Dashboard indicadores (fila superior) */}
      <Box sx={{ px: 2, pt: 1.25, pb: 0.75 }}>
        <Typography variant='overline' sx={{ fontWeight: 800, letterSpacing: 0.9, color: 'text.secondary' }}>
          INDICADORES DE AVANCE — CÓDIGOS PRODUCTO
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', px: 2, pb: 2 }}>
        {[
          {
            key: 'CODIFICADO',
            label: 'Codificado',
            value: indicators.byState.CODIFICADO
          },
          {
            key: 'EN_PROCESO',
            label: 'En Proceso',
            value: indicators.byState.EN_PROCESO,
            delta: indicators.conEventoEnProceso > 0 ? `Δ ${indicators.conEventoEnProceso} con evento` : null
          },
          {
            key: 'ENSAYADO',
            label: 'Ensayado',
            value: indicators.byState.ENSAYADO
          },
          {
            key: 'ENVIADO_DIGITACION',
            label: 'Env. Digitación',
            value: indicators.byState.ENVIADO_DIGITACION
          },
          {
            key: 'DIGITADO',
            label: 'Digitado',
            value: indicators.byState.DIGITADO
          },
          {
            key: 'REVISADO',
            label: 'Revisado',
            value: indicators.byState.REVISADO
          },
          {
            key: 'FIRMADO',
            label: 'Firmado',
            value: indicators.byState.FIRMADO,
            delta: indicators.pendPagoFirmado > 0 ? `Δ ${indicators.pendPagoFirmado} pend. pago` : null
          },
          {
            key: 'ENVIADO',
            label: 'Enviado',
            value: indicators.byState.ENVIADO,
            delta: indicators.pendPagoEnviado > 0 ? `Δ ${indicators.pendPagoEnviado} pend. pago` : null
          },
          {
            key: 'CON_EVENTO',
            label: 'Con Evento',
            value: indicators.conEventoTotal
          }
        ].map(item => (
          <Box
            key={item.key}
            role='button'
            tabIndex={0}
            onClick={() => emitDashboardFilterToggle(item.key)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                emitDashboardFilterToggle(item.key)
              }
            }}
            sx={{
              minWidth: 140,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              boxShadow: isDashboardCardActive(item.key) ? 2 : 1,
              p: 1.25,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              cursor: 'pointer',
              border: theme =>
                isDashboardCardActive(item.key)
                  ? `1px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.divider}`,
              outline: 'none',
              '&:hover': {
                boxShadow: 2
              },
              '&:focus-visible': theme => ({
                border: `1px solid ${theme.palette.primary.main}`
              })
            }}
          >
            <Typography variant='caption' color={item.key === 'CON_EVENTO' ? 'error.main' : 'text.secondary'}>
              {item.label}
            </Typography>
            <Typography variant='h6' sx={{ fontWeight: 700 }}>
              {item.value}
            </Typography>

            {item.delta ? (
              <Typography variant='caption' sx={{ color: 'error.main', fontWeight: 700, lineHeight: 1.1 }}>
                {item.delta}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>

      <Divider />

      {/* Toolbar row: Buscar + Exportar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant='outlined'
          size='small'
          startIcon={<FileDownloadOutlinedIcon />}
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          onClick={exportFilteredToExcel}
        >
          Exportar Excel
        </Button>

        <Box sx={{ width: 300 }}>
          <DebouncedInput
            value={globalFilter}
            onChange={(v: any) => {
              setGlobalFilter(String(v))
            }}
            placeholder='Buscar CÓDIGO, OT, ÁREA, SERVICIO...'
            fullWidth
            size='small'
          />
        </Box>
      </Box>

      <Divider />

      <Box
        ref={tableKeyboardRef}
        className='overflow-x-auto'
        tabIndex={0}
        onKeyDown={e => {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

          const rows = table.getRowModel().rows
          if (!rows.length) return

          const currentIndex = selectedCodigoId == null ? -1 : rows.findIndex(r => Number((r.original as any).id) === selectedCodigoId)
          const nextIndex =
            e.key === 'ArrowDown'
              ? Math.min((currentIndex < 0 ? 0 : currentIndex + 1), rows.length - 1)
              : Math.max((currentIndex < 0 ? 0 : currentIndex - 1), 0)

          const next = rows[nextIndex]
          const nextId = next ? Number((next.original as any).id) : null
          if (!next || !Number.isFinite(nextId) || (nextId as number) <= 0) return

          e.preventDefault()
          e.stopPropagation()

          setSelectedCodigoId(nextId as number)
          onSelectCodigo?.(nextId as number)
        }}
        sx={theme => ({
          '--rcmnav-selected-row-bg': alpha(theme.palette.primary.main, 0.08) as any,
          outline: 'none',
          borderRadius: 1,
          '&:focus-visible': {
            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
          }
        })}
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
                      userSelect: 'none'
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
                onClick={() => {
                  const id = Number((row.original as any).id)
                  if (Number.isFinite(id) && id > 0) {
                    setSelectedCodigoId(id)
                    onSelectCodigo?.(id)
                  }
                  // dar foco al contenedor para permitir navegación con teclado inmediatamente
                  tableKeyboardRef.current?.focus()
                }}
                style={{
                  cursor: onSelectCodigo ? 'pointer' : 'default',
                  backgroundColor:
                    selectedCodigoId != null && Number((row.original as any).id) === selectedCodigoId
                      ? ('var(--rcmnav-selected-row-bg)' as any)
                      : undefined
                }}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ verticalAlign: 'middle', textAlign: 'center' }}>
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

      {/* Popover: Ayuda Estado Operativo */}
      <Popover
        open={Boolean(opHelpAnchorEl)}
        anchorEl={opHelpAnchorEl}
        onClose={closeOperationalHelp}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            width: 440,
            maxWidth: 'calc(100vw - 32px)',
            borderRadius: 2
          }
        }}
      >
        {(() => {
          const copy = getOperationalHelpCopy(opHelpState)
          if (!copy) return null

          const st = OPERATIONAL_STATES.find(s => s.value === opHelpState)
          const hex = st?.color ?? '#9E9E9E'
          const bg = hexToRgba(hex, 0.12)
          const border = hexToRgba(hex, 0.28)
          const dateTxt = opHelpDate ? formatDateDDMMYYYYDateOnlyDash(opHelpDate) : ''
          const title = st?.label ?? copy.title

          const IconTone = copy.tone === 'success' ? CheckCircleOutlineIcon : InfoOutlinedIcon
          const iconColor = copy.tone === 'success' ? 'success.main' : copy.tone === 'warning' ? 'warning.main' : 'info.main'

          return (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <Chip
                    size='small'
                    label={title}
                    sx={{
                      bgcolor: bg,
                      border: `1px solid ${border}`,
                      color: 'text.primary',
                      fontWeight: 800
                    }}
                  />
                  {dateTxt ? (
                    <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                      {dateTxt}
                    </Typography>
                  ) : null}
                </Box>

                <IconButton size='small' onClick={closeOperationalHelp} aria-label='Cerrar'>
                  <CloseIcon fontSize='small' />
                </IconButton>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: bg,
                  border: `1px solid ${border}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <IconTone sx={{ mt: 0.25, color: iconColor }} fontSize='small' />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='body2' sx={{ fontWeight: 800, mb: 0.5 }}>
                      {title}
                    </Typography>
                    {copy.lines.map((t, idx) => (
                      <Typography key={idx} variant='body2' color='text.secondary' sx={{ lineHeight: 1.35 }}>
                        {t}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.25 }}>
                <ReplayOutlinedIcon sx={{ color: 'text.secondary' }} fontSize='small' />
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                  Retroceder: Registrar Evento → el declarante indica el estado destino.
                </Typography>
              </Box>
            </Box>
          )
        })()}
      </Popover>

      {/* Menu "Marcar" dinámico: sólo el siguiente estado permitido */}
      <Menu
        anchorEl={markAnchorEl}
        open={Boolean(markAnchorEl)}
        onClose={handleCloseMarkMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {(() => {
          const opts = getStatesForRow(markRowId)
          if (!opts || opts.length === 0) return <MenuItem disabled>No hay acciones disponibles</MenuItem>
          return opts.map(opt => (
            <MenuItem
              key={opt.value}
              disabled={Boolean((opt as any).disabled)}
              onClick={() => {
                // no ejecutar acción si es el estado actual (disabled)
                if ((opt as any).disabled) return
                // usar el id de la fila donde se abrió el menu (markRowId), no markDialogRowId
                handleMarkAction(opt.value, markRowId)
              }}
            >
              {opt.label}
            </MenuItem>
          ))
        })()}
      </Menu>

      {/* Dialog: Código Producto (nuevo) */}
      <Dialog open={codigoDialogOpen} onClose={closeCodigoProductoDialog} maxWidth='md' fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {`Código Producto — ${String(codigoDialogMeta?.codigoNombre ?? codigoDialogData?.codigoNombre ?? '').trim() || '—'}`}
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {(() => {
                  const ot = String(codigoDialogMeta?.ot ?? '').trim()
                  const clienteName =
                    String(codigoDialogMeta?.cliente?.razonSocial ?? codigoDialogMeta?.cliente?.nombreCliente ?? '').trim() ||
                    String(codigoDialogMeta?.clienteNombre ?? '').trim()
                  const obraNum = String(codigoDialogMeta?.obra?.numeroObra ?? '').trim()
                  const obraTxt = obraNum ? `Obra ${obraNum}` : ''
                  return [ot ? `OT ${ot}` : '', clienteName, obraTxt].filter(Boolean).join(' · ') || ' '
                })()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              {/* Estados (mover a esquina superior derecha) */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 170 }}>
                {(() => {
                  const op = String(codigoDialogMeta?.estadoOperativo ?? '').trim()
                  const adm = String(codigoDialogMeta?.estadoAdministrativo ?? '').trim()
                  if (!op && !adm) return null

                  const opKey = String(op).trim().toUpperCase()
                  const opInfo = op ? getOperationalInfo(op) : null
                  const opLabel = op
                    ? OPERATIONAL_STATES.find(s => s.value === opKey)?.label ?? op
                    : null

                  const dateSrc = op ? (codigoDialogOpAt ?? (opKey === 'DIGITADO' ? codigoDialogDigitadoAt : null)) : null
                  const dateTxt = dateSrc ? formatDateDDMMYYYYDateOnly(dateSrc) : '-'

                  const admInfo = adm ? getAdministrativeInfo(adm) : null

                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {op && opInfo ? (
                          <Chip
                            size='small'
                            label={opLabel}
                            sx={{
                              bgcolor: opInfo.bgcolor,
                              color: opInfo.colorText,
                              border: `1px solid ${opInfo.border}`,
                              textTransform: 'capitalize',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              borderRadius: 999
                            }}
                          />
                        ) : null}

                        {adm && admInfo ? (
                          <Chip
                            size='small'
                            label={formatStateForChip(adm)}
                            sx={{
                              bgcolor: admInfo.bgcolor,
                              color: admInfo.colorText,
                              border: `1px solid ${admInfo.border}`,
                              textTransform: 'capitalize',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              borderRadius: 999
                            }}
                          />
                        ) : null}
                      </Box>

                      {op ? (
                        <Typography variant='caption' color='text.secondary' sx={{ mt: 0.25, fontWeight: 700 }}>
                          Desde {dateTxt}
                        </Typography>
                      ) : null}
                    </Box>
                  )
                })()}
              </Box>

              <IconButton aria-label='Cerrar' onClick={closeCodigoProductoDialog} size='small'>
                <CloseIcon fontSize='small' />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 0.5 }}>
          <Divider sx={{ mb: 2 }} />

          {/* Resumen (formato captura) */}
          <Paper
            variant='outlined'
            sx={theme => ({
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderColor: alpha(theme.palette.primary.main, 0.18)
            })}
          >
            {/* Formato requerido: título arriba / valor abajo */}
            {(() => {
              const sedes = Array.isArray(codigoDialogMeta?.sedes)
                ? (codigoDialogMeta.sedes as any[]).map(v => String(v ?? '').trim()).filter(Boolean)
                : []
              const sedeTxt = sedes.length ? sedes.join(', ') : String(codigoDialogMeta?.ciudad ?? '').trim() || '-'

              const areaTxt = String(codigoDialogMeta?.area ?? '').trim() || '-'
              const tipoServTxt = String(codigoDialogMeta?.familia ?? '').trim() || '-'
              const fechaCodTxt = formatDateDDMMYYYYDateOnly(codigoDialogMeta?.fechaCodificacion) || '-'

              const ssTxt = String(codigoDialogMeta?.ss ?? '').trim() || '-'
              const otIdRaw = codigoDialogMeta?.ordenTrabajoId ?? null
              const otId = Number(otIdRaw)
              const canLink = ssTxt !== '-' && Number.isFinite(otId) && otId > 0

              const openSolicitudServicio = () => {
                if (!canLink) return
                if (typeof window === 'undefined') return
                const parts = window.location.pathname.split('/').filter(Boolean)
                const lang = parts[0] || 'en'
                const params = new URLSearchParams()
                params.set('otId', String(otId))
                params.set('readonly', '1')
                const target = `${window.location.origin}/${lang}/apps/encoder?${params.toString()}`
                window.open(target, '_blank')
              }

              return (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(5, minmax(0, 1fr))' }, gap: 1.25 }}>
                  {[
                    { k: 'SEDE(S)', v: sedeTxt },
                    { k: 'ÁREA', v: areaTxt },
                    { k: 'TIPO SERVICIO', v: tipoServTxt },
                    {
                      k: 'SS',
                      v: ssTxt,
                      isLink: canLink,
                      onClick: openSolicitudServicio
                    },
                    { k: 'FECHA COD.', v: fechaCodTxt }
                  ].map(item => (
                    <Box key={item.k} sx={{ minWidth: 0 }}>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ fontWeight: 800, display: 'block', lineHeight: 1.2 }}
                      >
                        {item.k}
                      </Typography>
                      <Typography variant='body2' sx={{ lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(item as any).isLink ? (
                          <Typography
                            component='span'
                            sx={{
                              color: 'primary.main',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontWeight: 800
                            }}
                            onClick={(item as any).onClick}
                          >
                            {item.v}
                          </Typography>
                        ) : (
                          item.v
                        )}
                      </Typography>
                    </Box>
                  ))}

                  {(() => {
                    const desc = String(codigoDialogData?.descripcionServicio ?? codigoDialogMeta?.descripcionServicio ?? '').trim()
                    const value = desc || '-'
                    return (
                      <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' }, minWidth: 0 }}>
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ fontWeight: 800, display: 'block', lineHeight: 1.2, mt: { xs: 0.5, sm: 0 } }}
                        >
                          DESCRIPCIÓN
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{
                            lineHeight: 1.25,
                            color: value === '-' ? 'text.secondary' : 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {value}
                        </Typography>
                      </Box>
                    )
                  })()}
                </Box>
              )
            })()}
          </Paper>

          {/* SKUs */}
          <Box sx={{ mb: 2 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
              SKUs
            </Typography>

            {(() => {
              const ens = Array.isArray(codigoDialogData?.ensayos) ? codigoDialogData.ensayos : []
              const map = new Map<string, { sku: string; nombre: string; cantidad: number }>()

              for (const e of ens) {
                const sku = String(e?.sku ?? e?.producto?.sku ?? '').trim()
                const nombre = String(e?.nombre ?? e?.producto?.nombre ?? '').trim()
                if (!sku) continue
                const prev = map.get(sku)
                map.set(sku, {
                  sku,
                  nombre: prev?.nombre || nombre,
                  cantidad: (prev?.cantidad ?? 0) + 1
                })
              }

              const items = Array.from(map.values())
              if (!items.length) {
                return (
                  <Typography variant='body2' color='text.secondary'>
                    Sin SKUs asociados. Este producto se factura según los ensayos y servicios efectivamente realizados a las muestras.
                  </Typography>
                )
              }

              return (
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, color: 'text.secondary' }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 900, color: 'text.secondary' }}>NOMBRE</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 900, color: 'text.secondary', width: 80 }}>
                          CANT.
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.slice(0, 24).map(it => (
                        <TableRow key={it.sku} hover>
                          <TableCell sx={{ fontWeight: 900, color: 'primary.main' }}>{it.sku}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{it.nombre || '-'}</TableCell>
                          <TableCell align='right' sx={{ fontWeight: 700 }}>{it.cantidad}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            })()}
          </Box>

          {/* Informes (generados) — derivado de SKUs (mientras no exista fuente explícita) */}
          <Box sx={{ mb: 2 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
              Informes (generados)
            </Typography>

            {(() => {
              const hasGenerated = Number(codigoDialogMeta?.informe ?? 0) > 0
              if (!hasGenerated) {
                return (
                  <Typography variant='body2' color='text.secondary'>
                    Sin informes generados manuales / digitales
                  </Typography>
                )
              }

              const ens = Array.isArray(codigoDialogData?.ensayos) ? codigoDialogData.ensayos : []
              const uniq = new Map<string, { sku: string; nombre: string }>()
              for (const e of ens) {
                const sku = String(e?.sku ?? e?.producto?.sku ?? '').trim()
                const nombre = String(e?.nombre ?? e?.producto?.nombre ?? '').trim()
                if (!sku) continue
                if (!uniq.has(sku)) uniq.set(sku, { sku, nombre })
              }
              const items = Array.from(uniq.values())
              if (items.length === 0) {
                return (
                  <Typography variant='body2' color='text.secondary'>
                    Sin informes generados manuales / digitales
                  </Typography>
                )
              }

              const totalEns = Number(codigoDialogMeta?.ensayos?.total ?? 0)
              const ensayados = Number(codigoDialogMeta?.ensayos?.ensayados ?? 0)
              const pend = Math.max(0, totalEns - ensayados)

              const totalRcms = Array.isArray(codigoDialogData?.rcms) ? codigoDialogData.rcms.length : 0
              const rcmTxt = totalRcms > 0 ? `${totalRcms} RCM${totalRcms === 1 ? '' : 's'}` : null

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {items.slice(0, 10).map((it, idx) => (
                    <Paper
                      key={it.sku}
                      variant='outlined'
                      sx={theme => ({
                        p: 1.25,
                        borderRadius: 1.75,
                        borderColor: alpha(theme.palette.divider, 0.9)
                      })}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                          <EmojiEventsOutlinedIcon fontSize='small' sx={{ color: 'warning.main' }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant='body2' sx={{ fontWeight: 800 }}>
                              {it.nombre || it.sku}
                            </Typography>
                            <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                              {`R-L-${String(idx + 1).padStart(3, '0')}`}{rcmTxt ? ` · ${rcmTxt}` : ''} · Manual
                            </Typography>
                          </Box>
                        </Box>

                        {pend > 0 ? (
                          <Typography variant='caption' sx={{ fontWeight: 800, color: 'warning.main', whiteSpace: 'nowrap' }}>
                            {pend} ens. pend.
                          </Typography>
                        ) : null}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )
            })()}
          </Box>

          {/* (sin secciones extra: no mostrar tabla de RCMs ni "Informes a generar") */}

          {/* Eventos activos */}
          {(() => {
            const rcms = Array.isArray(codigoDialogData?.rcms) ? codigoDialogData.rcms : []
            const activos = rcms
              .map((r: any) => {
                const last = Array.isArray(r?.RCMHistory) ? r.RCMHistory[0] : null
                if (!last) return null
                const tipo = String(last?.tipo ?? '').trim()
                const tipoEstado = String(last?.tipoEstado ?? '').trim().toUpperCase()
                const isOpen = tipo === 'Evento Abierto' || tipoEstado === 'EVENTO'
                if (!isOpen) return null

                const motivo = String(last?.motivo ?? '').trim()
                const [head, ...rest] = motivo.split(' - ')
                const evTipo = (head || 'Evento').trim()
                const evMotivo = (rest.join(' - ') || '').trim()

                const obs = String(last?.observacion ?? '').trim()
                const obsLine = obs ? obs.split(/\r?\n/).find(l => String(l).trim()) ?? '' : ''

                return { r, last, evTipo, evMotivo, obsLine }
              })
              .filter(Boolean) as Array<any>

            if (activos.length === 0) return null

            return (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                  <ReportProblemOutlinedIcon fontSize='small' sx={{ color: 'error.main' }} />
                  <Typography variant='subtitle2' sx={{ fontWeight: 800, color: 'error.main' }}>
                    Eventos activos ({activos.length})
                  </Typography>
                </Box>

                <Paper
                  variant='outlined'
                  sx={theme => ({
                    p: 1.5,
                    borderRadius: 2,
                    borderColor: alpha(theme.palette.error.main, 0.45),
                    bgcolor: alpha(theme.palette.error.main, 0.06)
                  })}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {activos.slice(0, 6).map((ev, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, minWidth: 0 }}>
                          <ReportProblemOutlinedIcon fontSize='small' sx={{ color: 'error.main', mt: 0.2 }} />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant='caption' sx={{ fontWeight: 900, color: 'error.main', display: 'block' }}>
                              {ev.evTipo}
                            </Typography>
                            {ev.evMotivo ? (
                              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontWeight: 700 }}>
                                {ev.evMotivo}
                              </Typography>
                            ) : null}
                            {ev.obsLine ? (
                              <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                                {ev.obsLine}
                              </Typography>
                            ) : null}
                          </Box>
                        </Box>

                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Box>
            )
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCodigoProductoDialog} sx={{ textTransform: 'none' }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Gestionar Informe (nuevo) */}
      <Dialog open={informeDialogOpen} onClose={closeInformeDialog} maxWidth='md' fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                Gestionar Informe
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(() => {
                  const code = String(informeDialogMeta?.codigoNombre ?? informeDialogData?.codigoNombre ?? '').trim()
                  const clienteName =
                    String(informeDialogMeta?.cliente?.razonSocial ?? informeDialogMeta?.cliente?.nombreCliente ?? '').trim() ||
                    String(informeDialogData?.cliente?.razonSocial ?? informeDialogData?.cliente?.nombreCliente ?? '').trim()
                  const obraNum = String(informeDialogMeta?.obra?.numeroObra ?? '').trim()
                  const obraName = String(informeDialogMeta?.obra?.nombreObra ?? '').trim()
                  const obraTxt = obraNum || obraName ? `Obra ${obraNum || obraName}` : ''
                  return [code, clienteName, obraTxt].filter(Boolean).join(' - ') || ' '
                })()}
              </Typography>
            </Box>

            <IconButton aria-label='Cerrar' onClick={closeInformeDialog} size='small'>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 0.5 }}>
          <Divider sx={{ mb: 2 }} />

          {informeDialogErrors.general && (
            <Typography variant='body2' color='error' sx={{ mb: 2 }}>
              {informeDialogErrors.general}
            </Typography>
          )}

          <Paper
            variant='outlined'
            sx={theme => ({
              p: 2,
              mb: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderColor: alpha(theme.palette.primary.main, 0.22)
            })}
          >
            {(() => {
              const area = String(informeDialogMeta?.area ?? '').trim()
              const familia = String(informeDialogMeta?.familia ?? '').trim()
              const ss = String(informeDialogMeta?.ss ?? '').trim()

              const totalEnsayos = Number(informeDialogMeta?.ensayos?.total ?? 0)
              const desc = String(informeDialogData?.descripcionServicio ?? '').trim()

              const norm = `${familia} ${desc}`.toLowerCase()
              const unidad = norm.includes('control') ? 'controles' : 'ensayos'

              const firstEnsayo = (informeDialogData?.ensayos ?? [])?.[0]
              const firstSku = String(firstEnsayo?.sku ?? firstEnsayo?.producto?.sku ?? '').trim()
              const firstNombre = String(firstEnsayo?.nombre ?? firstEnsayo?.producto?.nombre ?? '').trim()
              const chipLabel = [firstSku, firstNombre].filter(Boolean).join(' ').trim()

              return (
                <>
                  <Typography variant='subtitle2' sx={theme => ({ fontWeight: 900, color: theme.palette.primary.main })}>
                    {[area, familia].filter(Boolean).join(' — ') || '—'}
                  </Typography>

                  <Typography variant='caption' sx={{ fontWeight: 700, mt: 0.25, display: 'block', color: 'text.primary' }}>
                    {desc || '—'}
                    {totalEnsayos > 0 ? ` — ${totalEnsayos} ${unidad}` : ''}
                    {ss ? ` ${ss}` : ''}
                  </Typography>

                  {chipLabel ? (
                    <Chip
                      size='small'
                      variant='outlined'
                      label={chipLabel}
                      sx={theme => ({
                        mt: 1,
                        fontWeight: 900,
                        borderColor: alpha(theme.palette.primary.main, 0.6),
                        color: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.06)
                      })}
                    />
                  ) : null}
                </>
              )
            })()}
          </Paper>

          {(() => {
            const detailRcms = Array.isArray(informeDialogData?.rcms) ? (informeDialogData?.rcms ?? []) : []
            const metaRcms: string[] = Array.isArray(informeDialogMeta?.rcmNumeros)
              ? (informeDialogMeta?.rcmNumeros ?? []).map((x: any) => String(x ?? '').trim()).filter(Boolean)
              : []

            const digitales = detailRcms.length || metaRcms.length
            if (!digitales) return null

            const rcms = detailRcms.length ? detailRcms : metaRcms.map(n => ({ numeroRcm: n }))

            return (
              <Paper
                variant='outlined'
                sx={theme => ({
                  p: 2,
                  mb: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.22),
                  bgcolor: alpha(theme.palette.primary.main, 0.03)
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 900 }}>
                      Este CP generará:
                    </Typography>
                    <Chip
                      size='small'
                      variant='outlined'
                      label={`${digitales} digitales`}
                      sx={theme => ({
                        fontWeight: 900,
                        color: theme.palette.primary.main,
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                        bgcolor: alpha(theme.palette.primary.main, 0.08)
                      })}
                    />
                  </Box>

                  <Button
                    size='small'
                    variant='outlined'
                    onClick={() => setHideEnsayosByRcm(v => !v)}
                    sx={{ textTransform: 'none', borderRadius: 2, whiteSpace: 'nowrap' }}
                  >
                    {hideEnsayosByRcm ? 'Ver ensayos por RCM' : 'Ocultar ensayos por RCM'}
                  </Button>
                </Box>

                {informeDialogLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={22} />
                  </Box>
                ) : hideEnsayosByRcm ? null : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
                    {rcms.map((r: any, idx: number) => {
                      const numero = String(r?.numeroRcm ?? '').trim()
                      const rcmType = String(r?.rcmType ?? '').trim()
                      const tarjeta = String(r?.numeroTarjeta ?? '').trim()

                      const details = [r?.tipoMaterial, r?.tomaMuestra ?? r?.procedencia ?? r?.item, r?.ubicacionSector]
                        .map(v => String(v ?? '').trim())
                        .filter(Boolean)
                        .join(' ')

                      const opKey = normalizeStateKey(r?.estadoOperativo) ?? null
                      const opLabel = (() => {
                        if (!opKey) return ''
                        const hit = OPERATIONAL_STATES.find(s => s.value === opKey)
                        return hit?.label ?? formatStateForChip(opKey)
                      })()
                      const opInfo = getOperationalInfo(opKey ?? undefined)

                      const servicios = Array.isArray(r?.servicios) ? (r.servicios as any[]) : []
                      const ensayos = servicios
                        .map(s => ({
                          nombre: String(s?.nombre ?? '').trim(),
                          estado: normalizeStateKey(s?.estadoOperativo ?? s?.estado) ?? null
                        }))
                        .filter(e => e.nombre)

                      return (
                        <Box
                          key={String(r?.id != null ? r.id : numero ? numero : idx)}
                          sx={theme => ({
                            p: 1.25,
                            borderRadius: 1.5,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                            bgcolor: alpha(theme.palette.common.white, 0.55)
                          })}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant='subtitle2' sx={{ fontWeight: 900 }}>
                                  {numero || '-'}
                                </Typography>

                                {rcmType ? <Chip size='small' label={rcmType.toUpperCase()} sx={{ fontWeight: 800 }} /> : null}

                                {tarjeta ? (
                                  <Chip size='small' variant='outlined' label={`T: ${tarjeta}`} sx={{ fontWeight: 900 }} />
                                ) : null}
                              </Box>

                              {details ? (
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                  sx={{ fontWeight: 700, display: 'block', mt: 0.25 }}
                                >
                                  {details}
                                </Typography>
                              ) : null}

                              {hideEnsayosByRcm || !ensayos.length ? null : (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                                  {ensayos.map((e, i) => {
                                    const k = e.estado ?? undefined
                                    const info = getOperationalInfo(k)
                                    return (
                                      <Chip
                                        key={`${e.nombre}-${i}`}
                                        size='small'
                                        label={e.nombre}
                                        sx={theme => {
                                          const isEnsayado = String(k ?? '').toUpperCase() === 'ENSAYADO'
                                          const bg = isEnsayado ? alpha(theme.palette.success.main, 0.12) : info.bgcolor
                                          const bd = isEnsayado ? alpha(theme.palette.success.main, 0.28) : info.border

                                          return {
                                            fontWeight: 800,
                                            bgcolor: bg,
                                            border: `1px solid ${bd}`,
                                            color: 'text.primary'
                                          }
                                        }}
                                      />
                                    )
                                  })}
                                </Box>
                              )}
                            </Box>

                            {opLabel ? (
                              <Chip
                                size='small'
                                label={opLabel}
                                sx={{
                                  fontWeight: 900,
                                  bgcolor: opInfo.bgcolor,
                                  border: `1px solid ${opInfo.border}`,
                                  color: opInfo.colorText
                                }}
                              />
                            ) : null}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                )}
              </Paper>
            )
          })()}

          {(() => {
            const applicableKeys = getApplicableAutoTemplateKeys(informeDialogMeta)
            if (!applicableKeys.length) return null

            const totalEnsayos = Number(informeDialogMeta?.ensayos?.total ?? 0)
            const ensayados = Number(informeDialogMeta?.ensayos?.ensayados ?? 0)
            const pendientes = Math.max(0, totalEnsayos - ensayados)

            const allRcms: string[] = Array.isArray(informeDialogMeta?.rcmNumeros)
              ? (informeDialogMeta?.rcmNumeros ?? []).map((x: any) => String(x ?? '').trim()).filter(Boolean)
              : []

            return (
              <Box sx={{ mb: 2 }}>
                {pendientes > 0 ? (
                  <Paper
                    variant='outlined'
                    sx={theme => ({
                      p: 1.5,
                      mb: 1.25,
                      borderColor: alpha(theme.palette.warning.main, 0.45),
                      bgcolor: alpha(theme.palette.warning.main, 0.08)
                    })}
                  >
                    <Typography variant='caption' sx={{ fontWeight: 700, color: 'text.primary', display: 'block' }}>
                      ⏳ Algunos RCMs aún están siendo ensayados. La digitación del CP completo requiere que todos los ensayos estén finalizados.
                      Puedes revisar la estructura de informes aquí, pero la confirmación se habilitará cuando el CP esté 100% ensayado.
                    </Typography>
                  </Paper>
                ) : null}

                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                  <Typography variant='subtitle2' sx={{ fontWeight: 800 }}>
                    Informes por plantilla ({AUTO_TEMPLATES.filter(t => applicableKeys.includes(t.key)).length})
                  </Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                    — agrupados según formato del Maestro de Productos
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  {AUTO_TEMPLATES.filter(t => applicableKeys.includes(t.key)).map(t => {
                    const existing = autoInformeExisting?.[t.key]
                    const blocked = existing == null && pendientes > 0
                    const draft = autoInformeDrafts?.[t.key] ?? emptyDraft

                    return (
                      <Paper
                        key={t.key}
                        variant='outlined'
                        sx={theme => ({
                          p: 2,
                          borderRadius: 2,
                          borderColor: alpha(theme.palette.warning.main, 0.45),
                          bgcolor: alpha(theme.palette.warning.main, 0.06)
                        })}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant='subtitle2' sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box component='span' sx={{ color: 'text.secondary' }}>
                                🧪
                              </Box>
                              {t.label}
                            </Typography>

                            {allRcms.length ? (
                              <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, display: 'block', mt: 0.25 }}>
                                {allRcms.join(', ')}
                              </Typography>
                            ) : null}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, whiteSpace: 'nowrap' }}>
                            {existing != null ? (
                              <>
                                <CheckCircleOutlineIcon fontSize='small' sx={theme => ({ color: theme.palette.success.main })} />
                                <Typography variant='caption' sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                  N° {existing}
                                </Typography>
                                <IconButton
                                  size='small'
                                  aria-label='Ver informe'
                                  title='Ver informe'
                                  onClick={e => {
                                    e.stopPropagation()
                                    const slug = t.key === 'DENSIDAD' ? 'densidad' : t.key === 'HORMIGON' ? 'hormigon' : null
                                    if (!slug) return

                                    let url = `/api/informes/${slug}/mock`

                                    if (slug === 'densidad') {
                                      const params = new URLSearchParams()
                                      if (informeDialogCodigoId) params.set('codigoAgrupadorId', String(informeDialogCodigoId))
                                      if (informeDialogRcmId) params.set('rcmId', String(informeDialogRcmId))
                                      if (existing != null) params.set('informe', String(existing))
                                      const qs = params.toString()
                                      if (qs) url = `/api/informes/densidad/generate?${qs}`
                                    }

                                    const w = window.open(url, '_blank')
                                    if (w) {
                                      try {
                                        w.opener = null
                                      } catch {
                                        // noop
                                      }
                                    }
                                  }}
                                  sx={{ ml: 0.25 }}
                                >
                                  <VisibilityIcon fontSize='small' />
                                </IconButton>
                              </>
                            ) : blocked ? (
                              <>
                                <Box component='span' sx={{ color: 'text.secondary' }}>
                                  ⏳
                                </Box>
                                <Typography variant='caption' sx={{ fontWeight: 800, color: 'text.secondary' }}>
                                  {pendientes} ens. {pendientes === 1 ? 'pendiente' : 'pendientes'}
                                </Typography>
                              </>
                            ) : null}
                          </Box>
                        </Box>

                        {existing != null || blocked ? null : (
                          <>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                              <TextField
                                label='N° INFORME *'
                                placeholder='Ej: INF-2026-045'
                                value={draft.numero}
                                onChange={e => {
                                  const v = e.target.value
                                  setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyDraft), numero: v } }))
                                  if (informeDialogErrors.numero) setInformeDialogErrors(prev => ({ ...prev, numero: undefined }))
                                }}
                                size='small'
                                fullWidth
                              />
                              <TextField
                                label='REF. CLIENTE'
                                placeholder='Ej: SOL-1234'
                                value={draft.refCliente}
                                onChange={e => {
                                  const v = e.target.value
                                  setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyDraft), refCliente: v } }))
                                }}
                                size='small'
                                fullWidth
                              />
                            </Box>

                            <Box sx={{ mt: 2 }}>
                              <TextField
                                label='OBSERVACIONES'
                                placeholder='Ej: Informe de suelo — Calicata Cal-1'
                                value={draft.observaciones}
                                onChange={e => {
                                  const v = e.target.value
                                  setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyDraft), observaciones: v } }))
                                }}
                                size='small'
                                fullWidth
                              />
                            </Box>

                            <Box sx={{ mt: 2 }}>
                              <TextField
                                label='ANEXO — N° DE VERSIÓN ANTERIOR (OPCIONAL)'
                                placeholder='Si este informe reemplaza a otro, indica el N° anterior (ej: INF-2026-040)'
                                value={draft.anexoPrev}
                                onChange={e => {
                                  const v = e.target.value
                                  setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyDraft), anexoPrev: v } }))
                                }}
                                size='small'
                                fullWidth
                              />
                            </Box>
                          </>
                        )}
                      </Paper>
                    )
                  })}
                </Box>
              </Box>
            )
          })()}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 800 }}>
              📋 Informes manuales— un RCM puede estar en más de un informe
            </Typography>

            <Button
              variant='contained'
              size='small'
              onClick={() => {
                setInformeDialogErrors(prev => ({ ...prev, numero: undefined }))
                const allRcms: string[] = Array.isArray(informeDialogMeta?.rcmNumeros)
                  ? (informeDialogMeta?.rcmNumeros ?? []).map((x: any) => String(x ?? '').trim()).filter(Boolean)
                  : []
                const defaultRcms = allRcms.length === 1 ? [allRcms[0]] : ([] as string[])
                setInformeDrafts(prev => {
                  if (prev.length >= 10) return prev
                  const nextId = `${Date.now()}-${prev.length + 1}`
                  return [
                    ...prev,
                    { id: nextId, numero: '', tipoInforme: '', refCliente: '', observaciones: '', anexoPrev: '', rcms: defaultRcms }
                  ]
                })
              }}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              + Añadir informe
            </Button>
          </Box>

          {informeDialogLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : informeDrafts.length === 0 ? (
            <Paper
              variant='outlined'
              sx={theme => ({
                p: 3,
                mb: 2,
                borderStyle: 'dashed',
                borderColor: alpha(theme.palette.text.primary, 0.2),
                bgcolor: alpha(theme.palette.text.primary, 0.02),
                textAlign: 'center'
              })}
            >
              <Typography variant='body2' color='text.secondary'>
                Haz click en <strong>+ Añadir informe</strong> para agregar informes manuales.
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Por cada informe: indica qué RCMs incluye y su N° de informe.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ mb: 2 }}>
              {informeDrafts.map((d, idx) => (
                (() => {
                  const isOk = parseInformeNumber(d.numero) != null
                  const allRcms: string[] = Array.isArray(informeDialogMeta?.rcmNumeros)
                    ? (informeDialogMeta?.rcmNumeros ?? []).map((x: any) => String(x ?? '').trim()).filter(Boolean)
                    : []

                  const selectedRcms = Array.isArray((d as any).rcms)
                    ? (d as any).rcms.map((x: any) => String(x ?? '').trim()).filter(Boolean)
                    : []

                  const hasRcmsSelected = selectedRcms.length > 0
                  return (
                <Paper
                  key={d.id}
                  variant='outlined'
                  sx={theme => ({
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    borderColor: isOk ? alpha(theme.palette.success.main, 0.55) : alpha(theme.palette.text.primary, 0.18),
                    bgcolor: isOk ? alpha(theme.palette.success.main, 0.08) : 'transparent'
                  })}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <CheckBoxOutlinedIcon fontSize='small' sx={theme => ({ color: isOk ? theme.palette.success.main : theme.palette.text.disabled })} />
                      <Typography variant='subtitle2' sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                        Informe {idx + 1}
                      </Typography>
                    </Box>

                    <IconButton
                      size='small'
                      aria-label='Eliminar informe'
                      onClick={() => setInformeDrafts(prev => prev.filter(x => x.id !== d.id))}
                      sx={{ color: 'error.main' }}
                    >
                      <CloseIcon fontSize='small' />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, display: 'block', mb: 0.75 }}>
                      RCMS INCLUIDOS{' '}
                      <Typography component='span' variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                        — (el mismo RCM puede estar en más de un informe)
                      </Typography>
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                      <Button
                        size='small'
                        variant='outlined'
                        onClick={() => {
                          setInformeDrafts(prev =>
                            prev.map(x =>
                              x.id === d.id
                                ? {
                                    ...x,
                                    rcms: Array.from(new Set(allRcms))
                                  }
                                : x
                            )
                          )
                        }}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        Seleccionar todos
                      </Button>

                      {allRcms.map((rcm: string) => {
                        const selected = selectedRcms.includes(rcm)
                        return (
                          <Chip
                            key={rcm}
                            size='small'
                            label={rcm}
                            onClick={() => {
                              setInformeDrafts(prev =>
                                prev.map(x => {
                                  if (x.id !== d.id) return x
                                  const cur = Array.isArray((x as any).rcms) ? (x as any).rcms : []
                                  const next = selected
                                    ? cur.filter((n: any) => String(n) !== rcm)
                                    : Array.from(new Set([...cur, rcm]))
                                  return { ...x, rcms: next }
                                })
                              )
                            }}
                            sx={theme => ({
                              fontWeight: 800,
                              cursor: 'pointer',
                              ...(selected
                                ? {
                                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`
                                  }
                                : {
                                    bgcolor: alpha(theme.palette.text.primary, 0.04),
                                    border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`
                                  })
                            })}
                          />
                        )
                      })}
                    </Box>

                    {isOk && !hasRcmsSelected ? (
                      <Typography variant='caption' sx={{ color: 'error.main', fontWeight: 700, mt: 0.75, display: 'block' }}>
                        Selecciona al menos 1 RCM para este informe
                      </Typography>
                    ) : null}
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label='N° INFORME *'
                      placeholder='Ej: INF-2026-045'
                      value={d.numero}
                      onChange={e => {
                        const v = e.target.value
                        setInformeDrafts(prev => prev.map(x => (x.id === d.id ? { ...x, numero: v } : x)))
                        if (informeDialogErrors.numero) setInformeDialogErrors(prev => ({ ...prev, numero: undefined }))
                      }}
                      size='small'
                      fullWidth
                      error={!!informeDialogErrors.numero && idx === 0}
                      helperText={idx === 0 ? informeDialogErrors.numero : undefined}
                    />

                    <TextField
                      label='TIPO DE INFORME'
                      placeholder='Ej: EMS Prospección, Corte Directo…'
                      value={(d as any).tipoInforme ?? ''}
                      onChange={e => {
                        const v = e.target.value
                        setInformeDrafts(prev => prev.map(x => (x.id === d.id ? { ...x, tipoInforme: v } : x)))
                      }}
                      size='small'
                      fullWidth
                    />
                  </Box>

                  <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label='REF. CLIENTE'
                      placeholder='N° OC del cliente'
                      value={d.refCliente}
                      onChange={e => {
                        const v = e.target.value
                        setInformeDrafts(prev => prev.map(x => (x.id === d.id ? { ...x, refCliente: v } : x)))
                      }}
                      size='small'
                      fullWidth
                    />

                    <TextField
                      label='OBSERVACIONES'
                      placeholder='Ej: Calicata Cal-1, 2 estratos'
                      value={d.observaciones}
                      onChange={e => {
                        const v = e.target.value
                        setInformeDrafts(prev => prev.map(x => (x.id === d.id ? { ...x, observaciones: v } : x)))
                      }}
                      size='small'
                      fullWidth
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <TextField
                      label='ANEXO — N° DE VERSIÓN ANTERIOR (OPCIONAL)'
                      placeholder='Si este informe reemplaza a otro, indica el N° anterior (ej: INF-2026-040)'
                      value={d.anexoPrev}
                      onChange={e => {
                        const v = e.target.value
                        setInformeDrafts(prev => prev.map(x => (x.id === d.id ? { ...x, anexoPrev: v } : x)))
                      }}
                      size='small'
                      fullWidth
                    />
                  </Box>
                </Paper>
                  )
                })()
              ))}

              <Button
                variant='outlined'
                fullWidth
                onClick={() => {
                  setInformeDialogErrors(prev => ({ ...prev, numero: undefined }))
                  const allRcms: string[] = Array.isArray(informeDialogMeta?.rcmNumeros)
                    ? (informeDialogMeta?.rcmNumeros ?? []).map((x: any) => String(x ?? '').trim()).filter(Boolean)
                    : []
                  const defaultRcms = allRcms.length === 1 ? [allRcms[0]] : ([] as string[])
                  setInformeDrafts(prev => {
                    if (prev.length >= 10) return prev
                    const nextId = `${Date.now()}-${prev.length + 1}`
                    return [
                      ...prev,
                      { id: nextId, numero: '', tipoInforme: '', refCliente: '', observaciones: '', anexoPrev: '', rcms: defaultRcms }
                    ]
                  })
                }}
                sx={theme => ({
                  textTransform: 'none',
                  borderRadius: 2,
                  borderStyle: 'dashed',
                  borderColor: alpha(theme.palette.primary.main, 0.55)
                })}
              >
                + Añadir otro informe
              </Button>
            </Box>
          )}

          {(() => {
            const applicableKeys = getApplicableAutoTemplateKeys(informeDialogMeta)
            const requiresAutos = applicableKeys.length > 0
            if (requiresAutos) return null

            const allRcms: string[] = Array.isArray(informeDialogMeta?.rcmNumeros)
              ? (informeDialogMeta?.rcmNumeros ?? []).map((x: any) => String(x ?? '').trim()).filter(Boolean)
              : []

            const covered = new Set<string>()
            for (const d of informeDrafts ?? []) {
              const hasNumero = parseInformeNumber((d as any).numero) != null
              if (!hasNumero) continue
              const selected = Array.isArray((d as any).rcms)
                ? (d as any).rcms.map((x: any) => String(x ?? '').trim()).filter(Boolean)
                : []
              for (const r of selected) covered.add(String(r))
            }
            const missing = allRcms.filter((r: string) => !covered.has(String(r)))
            if (!missing.length) return null

            return (
              <Paper
                variant='outlined'
                sx={theme => ({
                  p: 2,
                  mb: 2,
                  borderColor: alpha(theme.palette.warning.main, 0.45),
                  bgcolor: alpha(theme.palette.warning.main, 0.08)
                })}
              >
                <Typography variant='subtitle2' sx={{ fontWeight: 900, mb: 0.5 }}>
                  {missing.length} RCM{missing.length === 1 ? '' : 's'} sin asociar a ningún informe:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {missing.map((rcm: string) => (
                    <Chip key={rcm} size='small' label={rcm} sx={{ fontWeight: 900 }} />
                  ))}
                </Box>
              </Paper>
            )
          })()}

          {(() => {
            const totalEnsayos = Number(informeDialogMeta?.ensayos?.total ?? 0)
            const ensayados = Number(informeDialogMeta?.ensayos?.ensayados ?? 0)
            const pendientes = Math.max(0, totalEnsayos - ensayados)

            const applicableKeys = getApplicableAutoTemplateKeys(informeDialogMeta)
            const requiresAutos = applicableKeys.length > 0
            const autosCompletos = applicableKeys.filter(k => {
              const existing = autoInformeExisting?.[k]
              if (existing != null) return true
              const n = parseInformeNumber(autoInformeDrafts?.[k]?.numero)
              if (n == null) return false
              return pendientes === 0
            }).length

            const manualTotal = informeDrafts.length
            const manualAssigned = informeDrafts.filter(d => parseInformeNumber(d.numero) != null).length

            return (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mt: 1 }}>
                <Box>
                  <Typography variant='subtitle2' sx={{ fontWeight: 800 }}>
                    {requiresAutos
                      ? `Automáticos requeridos: ${autosCompletos}/${applicableKeys.length} completos · Manuales: ${manualAssigned}/${manualTotal} con N°`
                      : `Manuales: ${manualAssigned}/${manualTotal} con N°`}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {requiresAutos
                      ? autosCompletos === applicableKeys.length
                        ? 'Al confirmar, el CP pasa a Digitado y el N° queda visible en la tabla.'
                        : pendientes > 0
                          ? 'Pendiente: faltan ensayos para completar automáticos.'
                          : 'Complete los informes automáticos requeridos para confirmar.'
                      : manualAssigned > 0
                        ? 'Al confirmar, el CP pasa a Digitado y el N° queda visible en la tabla.'
                        : 'Ingrese al menos un informe manual para confirmar.'}
                  </Typography>
                </Box>
                <Typography variant='h4' color='text.disabled' sx={{ fontWeight: 800 }}>
                  {autosCompletos + manualAssigned}
                </Typography>
              </Box>
            )
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeInformeDialog} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>

          {(() => {
            const opMeta = normalizeStateForCompare(informeDialogMeta?.estadoOperativo)
            const opRow = normalizeStateForCompare(getCurrentStateForRow(informeDialogRcmId))

            const digitadoByHistory = (informeDialogHistory ?? []).some((h: any) => {
              const k1 = normalizeStateForCompare(h?.tipoEstado)
              const k2 = normalizeStateForCompare(h?.estNuevo)
              return k1 === 'DIGITADO' || k2 === 'DIGITADO'
            })

            const isDigitado = opMeta === 'DIGITADO' || opRow === 'DIGITADO' || digitadoByHistory

            if (isDigitado) return null

            return (
              <Button
                variant='contained'
                onClick={handleConfirmInformeDialog}
                disabled={(() => {
                  if (savingInformeDialog) return true

                  const totalEnsayos = Number(informeDialogMeta?.ensayos?.total ?? 0)
                  const ensayados = Number(informeDialogMeta?.ensayos?.ensayados ?? 0)
                  const pendientes = Math.max(0, totalEnsayos - ensayados)

                  const applicableKeys = getApplicableAutoTemplateKeys(informeDialogMeta)
                  const requiresAutos = applicableKeys.length > 0

                  const manualsWithNumero = (informeDrafts ?? []).filter(d => parseInformeNumber((d as any).numero) != null)
                  const hasManual = manualsWithNumero.length > 0

                  // Si hay un N° de informe manual, debe seleccionar al menos 1 RCM.
                  const hasManualMissingRcmSelection = manualsWithNumero.some(d => {
                    const selected = Array.isArray((d as any).rcms)
                      ? (d as any).rcms.map((x: any) => String(x ?? '').trim()).filter(Boolean)
                      : []
                    return selected.length === 0
                  })

                  if (hasManualMissingRcmSelection) return true

                  if (!requiresAutos) {
                    // si no hay automáticos aplicables, el manual es obligatorio
                    return !hasManual
                  }

                  // si hay automáticos aplicables, deben estar completos
                  const missingAuto = applicableKeys.some(k => {
                    if (autoInformeExisting?.[k] != null) return false
                    const n = parseInformeNumber(autoInformeDrafts?.[k]?.numero)
                    if (n == null) return true
                    return pendientes > 0
                  })

                  return missingAuto
                })()}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                {savingInformeDialog ? 'Confirmando…' : 'Confirmar'}
              </Button>
            )
          })()}
        </DialogActions>
      </Dialog>

      {/* Dialog: Form "Estado Muestra" para acciones (Digitado, EVENTO, CERRADO_OP, ...) */}
      <Dialog open={markDialogOpen} onClose={handleCancelMarkDialog} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              {markDialogAction === 'EVENTO' || markDialogAction === 'CERRAR_EVENTO' ? (
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                    {markDialogAction === 'EVENTO' ? 'Registrar Evento' : 'Cerrar Evento'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {(() => {
                      const rcmId = markDialogRowId
                      if (!rcmId) return ''
                      const agg = findAggregatedRowByRepresentativeRcmId(rcmId)
                      const code = String((agg as any)?.codigoNombre ?? '').trim()
                      const cliente = String((agg as any)?.cliente?.razonSocial ?? (agg as any)?.cliente?.nombreCliente ?? '').trim()
                      const obraNum = String((agg as any)?.obra?.numeroObra ?? '').trim()
                      const parts = [code, cliente, obraNum ? `Obra ${obraNum}` : ''].filter(Boolean)
                      return parts.join(' - ')
                    })()}
                  </Typography>
                </Box>
              ) : (
                (() => {
                  const currentState = markDialogRowId != null ? getCurrentStateForRow(markDialogRowId) : ''
                  const currentInfo = getOperationalInfo(currentState)
                  const currentLabel = OPERATIONAL_STATES.find(s => s.value === currentState)?.label ?? (currentState || 'Estado')
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Chip
                        size='small'
                        label={currentLabel}
                        sx={{
                          bgcolor: currentInfo.bgcolor,
                          color: currentInfo.colorText,
                          border: `1px solid ${currentInfo.border}`,
                          fontWeight: 700,
                          borderRadius: 2
                        }}
                      />
                      <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatDateDDMMYYYYDateOnlyDash(new Date())}
                      </Typography>
                    </Box>
                  )
                })()
              )}
            </Box>

            <IconButton aria-label='Cerrar' onClick={handleCancelMarkDialog} size='small'>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 0.5 }}>
          <Divider sx={{ mb: 2 }} />

          {markDialogAction === 'EVENTO' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Tipo de Evento */}
              <Box>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, display: 'block', mb: 0.75 }}>
                  TIPO DE EVENTO
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {(
                    [
                      { value: 'INFO_PENDIENTE', label: 'Info Pendiente', tone: 'warning' as const },
                      { value: 'ERROR_INTERNO', label: 'Error Interno', tone: 'error' as const },
                      { value: 'CORRECCION', label: 'Corrección', tone: 'secondary' as const }
                    ] as const
                  ).map(opt => {
                    const selected = eventType === opt.value

                    return (
                      <Button
                        key={opt.value}
                        onClick={() => {
                          setEventType(opt.value)
                          setCorrectionMotivo('')
                        }}
                        variant='outlined'
                        size='small'
                        sx={theme => ({
                          ...(true && (() => {
                            const mainColor = theme.palette[opt.tone].main
                            return {
                              borderColor: selected ? mainColor : theme.palette.divider,
                              bgcolor: selected ? alpha(mainColor, 0.12) : 'transparent',
                              color: selected ? mainColor : theme.palette.text.secondary
                            }
                          })()),
                          textTransform: 'none',
                          borderRadius: 999,
                          fontWeight: 800,
                          '&:hover': {
                            bgcolor: selected ? undefined : alpha(theme.palette.action.hover, 0.7)
                          }
                        })}
                      >
                        {opt.label}
                      </Button>
                    )
                  })}
                </Box>

                <Box
                  sx={theme => ({
                    mt: 1.25,
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.action.hover, 0.8)
                  })}
                >
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                    {eventType === 'ERROR_INTERNO'
                      ? 'Error detectado en revisión interna. Requiere corrección — el CP debe retroceder al estado donde se puede corregir.'
                      : eventType === 'CORRECCION'
                        ? 'Corrección solicitada por el cliente post-envío. El CP debe volver a un estado anterior para ser revisado y reenviado.'
                        : 'Falta información del cliente para completar el informe. El CP permanece en su estado actual hasta que llegue la info.'}
                  </Typography>
                </Box>

                {formErrors.eventType ? (
                  <Typography variant='caption' sx={{ color: 'error.main', fontWeight: 700, mt: 0.75, display: 'block' }}>
                    {formErrors.eventType}
                  </Typography>
                ) : null}
              </Box>

              {/* Motivo */}
              <Box>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, display: 'block', mb: 0.75 }}>
                  MOTIVO *
                </Typography>
                <FormControl fullWidth size='small' error={!!formErrors.motivo}>
                  <Select
                    value={correctionMotivo}
                    displayEmpty
                    onChange={e => setCorrectionMotivo(String(e.target.value))}
                    disabled={!eventType}
                  >
                    <MenuItemMUI value=''>— Seleccionar motivo —</MenuItemMUI>
                    {(eventType === 'INFO_PENDIENTE'
                      ? ['Falta datos del cliente', 'Especificación incompleta', 'Parámetro de diseño no entregado', 'Otro']
                      : eventType === 'ERROR_INTERNO'
                        ? ['Tipo en informe', 'Cálculo incorrecto', 'Norma incorrecta', 'Resultado fuera de rango', 'Error de identificación de muestra', 'Otro']
                        : eventType === 'CORRECCION'
                          ? ['Corrección solicitada por cliente', 'Dato adicional requerido post-envío', 'Cambio de especificación', 'Otro']
                          : [])
                      .map(m => (
                        <MenuItemMUI key={m} value={m}>
                          {m}
                        </MenuItemMUI>
                      ))}
                  </Select>
                  {formErrors.motivo ? <FormHelperText>{formErrors.motivo}</FormHelperText> : null}
                </FormControl>
              </Box>

              {/* Observación */}
              <Box>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, display: 'block', mb: 0.75 }}>
                  OBSERVACIÓN *
                </Typography>
                <TextField
                  value={correctionObservaciones}
                  onChange={e => {
                    setCorrectionObservaciones(e.target.value)
                    if (formErrors.observacion) setFormErrors(prev => ({ ...prev, observacion: undefined }))
                  }}
                  size='small'
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder='Describe el problema con detalle suficiente para que quien lo resuelva entienda qué debe hacer...'
                  error={!!formErrors.observacion}
                  helperText={formErrors.observacion}
                />
              </Box>

              {/* Estado destino */}
              <Box>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, display: 'block', mb: 0.75 }}>
                  ¿A QUÉ ESTADO DEBE IR EL CP PARA RESOLVER ESTE EVENTO? *
                </Typography>

                <Box
                  sx={theme => ({
                    p: 1.25,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    mb: 1.25
                  })}
                >
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                    El declarante envía el CP al estado donde se puede solucionar el problema. Ej: un error en el Digitado (para que lo corrijan y vuelvan a revisar).
                  </Typography>
                </Box>

                {(() => {
                  const all = [
                    { value: 'CODIFICADO', desc: 'RCMs creados, sin ensayos iniciados' },
                    { value: 'EN_PROCESO', desc: 'Al menos 1 ensayo iniciado en Sala' },
                    { value: 'ENSAYADO', desc: 'Todos los ensayos completados' },
                    { value: 'ENVIADO_DIGITACION', desc: 'Listo para que el digitador arme el paquete de informes' },
                    { value: 'DIGITADO', desc: 'Informes emitidos, disponibles para revisión' },
                    { value: 'REVISADO', desc: 'Revisado por Jefe de Laboratorio' },
                    { value: 'FIRMADO', desc: 'Firmado (software externo)' },
                    { value: 'ENVIADO', desc: 'Entregado al cliente' }
                  ] as const

                  const current = markDialogRowId != null ? getCurrentStateForRow(markDialogRowId) : ''
                  const currentIndex = all.findIndex(s => s.value === current)
                  // Regla de negocio: mostrar el estado actual y los estados hacia atrás.
                  // NO se muestran estados hacia adelante.
                  const visible = currentIndex >= 0 ? all.slice(0, currentIndex + 1) : all

                  const selectedOpt = eventReturnState ? visible.find(v => v.value === eventReturnState) : undefined

                  return (
                    <>
                      <Box
                        sx={theme => ({
                          display: 'grid',
                          gridTemplateColumns: '1fr',
                          gap: 1,
                          '& .MuiChip-root': {
                            fontWeight: 800,
                            ...(true && (() => {
                              const celeste = lighten(theme.palette.primary.main, 0.35)
                              return {
                                bgcolor: celeste,
                                border: `1px solid ${celeste}`,
                                color: theme.palette.common.white
                              }
                            })())
                          }
                        })}
                      >
                        {visible.map(opt => {
                          const st = OPERATIONAL_STATES.find(s => s.value === opt.value)
                          const selected = eventReturnState === opt.value

                          return (
                            <Box
                              key={opt.value}
                              role='button'
                              tabIndex={0}
                              onClick={() => {
                                setEventReturnState(opt.value)
                                if (formErrors.returnState) setFormErrors(prev => ({ ...prev, returnState: undefined }))
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  setEventReturnState(opt.value)
                                }
                              }}
                              sx={theme => ({
                                border: `1px solid ${selected ? alpha(theme.palette.primary.main, 0.55) : theme.palette.divider}`,
                                bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 0.75,
                                borderRadius: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.action.hover, 0.7)
                                }
                              })}
                            >
                              <Radio
                                checked={selected}
                                value={opt.value}
                                size='small'
                                sx={theme => {
                                  return {
                                    '&.Mui-checked': {
                                      color: theme.palette.primary.main
                                    }
                                  }
                                }}
                              />
                              <Chip size='small' label={st?.label ?? opt.value} />
                              <Typography
                                variant='caption'
                                color='text.secondary'
                                sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {opt.desc}
                              </Typography>
                            </Box>
                          )
                        })}
                      </Box>

                      {selectedOpt ? (
                        <Box
                          sx={theme => ({
                            mt: 1.25,
                            p: 1.1,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.action.hover, 0.8)
                          })}
                        >
                          <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, display: 'block', mb: 0.4 }}>
                            Descripción del estado seleccionado
                          </Typography>
                          <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                            {selectedOpt.desc}
                          </Typography>
                        </Box>
                      ) : null}
                    </>
                  )
                })()}

                {formErrors.returnState ? (
                  <Typography variant='caption' sx={{ color: 'error.main', fontWeight: 700, mt: 0.5, display: 'block' }}>
                    {formErrors.returnState}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          )}

          {markDialogAction === 'CERRAR_EVENTO' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={theme => ({
                  p: 1.25,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
                  bgcolor: alpha(theme.palette.error.main, 0.06)
                })}
              >
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                  Al confirmar, se registra el cierre del evento y el indicador “Con evento” desaparece.
                </Typography>
              </Box>

              <Box>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 800, display: 'block', mb: 0.75 }}>
                  OBSERVACIÓN *
                </Typography>
                <TextField
                  value={correctionObservaciones}
                  onChange={e => {
                    setCorrectionObservaciones(e.target.value)
                    if (formErrors.observacion) setFormErrors(prev => ({ ...prev, observacion: undefined }))
                  }}
                  size='small'
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder='Indica cómo se resolvió el evento o por qué se cierra...'
                  error={!!formErrors.observacion}
                  helperText={formErrors.observacion}
                />
              </Box>
            </Box>
          )}

          {markDialogAction !== 'EVENTO' &&
            (() => {
              const targetLabel = OPERATIONAL_STATES.find(s => s.value === markDialogAction)?.label ?? (markDialogAction || '')
              if (!targetLabel) return null
              return (
                <Box sx={{ mb: 2 }}>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>
                    Avanzar a:
                  </Typography>
                  <Box
                    sx={theme => ({
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.55)}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      borderRadius: 2,
                      px: 2,
                      py: 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2
                    })}
                  >
                    <Typography variant='subtitle2' sx={{ fontWeight: 800 }}>
                      {targetLabel}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
                      {markDialogAction === 'ENSAYADO'
                        ? 'Todos los ensayos completados'
                        : markDialogAction === 'REVISADO'
                          ? 'Revisado por Jefe de Laboratorio'
                          : ' '}
                    </Typography>
                  </Box>
                </Box>
              )
            })()}

          {markDialogAction === 'DIGITADO' && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
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

          {markDialogAction === 'CERRADO_OP' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth size='small' error={!!formErrors.eventType}>
                <InputLabel id='event-type-label'>Tipo</InputLabel>
                <Select
                  labelId='event-type-label'
                  value={eventType}
                  label='Tipo'
                  onChange={e => setEventType(String(e.target.value))}
                  size='small'
                >
                  <MenuItemMUI value='INFO_PENDIENTE'>Información Pendiente</MenuItemMUI>
                  <MenuItemMUI value='ERROR_INTERNO'>Error Interno</MenuItemMUI>
                  <MenuItemMUI value='CORRECCION'>Corrección</MenuItemMUI>
                </Select>
                {formErrors.eventType && <FormHelperText>{formErrors.eventType}</FormHelperText>}
              </FormControl>

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
                label='Observación (opcional)'
                value={correctionObservaciones}
                onChange={e => setCorrectionObservaciones(e.target.value)}
                size='small'
                fullWidth
                multiline
                minRows={3}
              />
            </Box>
          )}

          {markDialogAction === 'REVISADO' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label='Observación (opcional)'
                value={correctionObservaciones}
                onChange={e => {
                  setCorrectionObservaciones(e.target.value)
                  if (formErrors.observacion) setFormErrors(prev => ({ ...prev, observacion: undefined }))
                }}
                size='small'
                fullWidth
                multiline
                minRows={2}
                error={!!formErrors.observacion}
                helperText={formErrors.observacion}
              />
            </Box>
          )}

          {/* Estados que requieren observación obligatoria */}
          {['ENVIADO_DIGITACION', 'FIRMADO', 'ENVIADO'].includes(String(markDialogAction ?? '')) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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

              <Typography variant='caption' color='text.secondary'>
                Retroceder: Registrar Evento → al resolver, el declarante indica el estado de retorno.
              </Typography>
            </Box>
          )}

          {/* Nota visual (no afecta lógica) */}
          {markDialogAction !== 'EVENTO' &&
            !['ENVIADO_DIGITACION', 'REVISADO', 'FIRMADO', 'ENVIADO'].includes(String(markDialogAction ?? '')) && (
            <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
              Retroceder: Registrar Evento → al resolver, el declarante indica el estado de retorno.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelMarkDialog} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={handleSaveMarkDialog}
            disabled={savingHistory || !validateMarkDialog(false)}
            sx={{ textTransform: 'none' }}
          >
            {savingHistory
              ? 'Guardando...'
              : markDialogAction === 'EVENTO'
                ? 'Confirmar'
                : markDialogAction === 'CERRAR_EVENTO'
                  ? 'Confirmar cierre'
                : `Confirmar → ${OPERATIONAL_STATES.find(s => s.value === markDialogAction)?.label ?? (markDialogAction || '')}`}
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
        {(() => {
          const rcmId = menuRowId
          if (!rcmId) return null
          const agg = findAggregatedRowByRepresentativeRcmId(rcmId)
          const hasEvento = Boolean((agg as any)?.conEvento)
          const current = normalizeStateKey(getCurrentStateForRow(rcmId))
          const canRegistrarEvento = current !== 'CODIFICADO'

          return (
            <>
              <MenuItem onClick={() => handleHistorial(menuRowId)}>Ver Historial</MenuItem>
              <MenuItem
                onClick={() => handleRegistrarEvento(menuRowId)}
                disabled={!canRegistrarEvento}
                title={!canRegistrarEvento ? 'No aplica para estado Codificado' : undefined}
              >
                Registrar evento
              </MenuItem>
              {hasEvento ? <MenuItem onClick={() => handleCerrarEvento(menuRowId)}>Cerrar evento</MenuItem> : null}
              <MenuItem disabled title='Generar Informe deshabilitado'>
                Generar Informe
              </MenuItem>
            </>
          )
        })()}
      </Menu>

      {/* Dialog: Historial */}
      <Dialog fullWidth maxWidth='lg' open={histDialogOpen} onClose={handleCloseHistDialog}>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Historial de cambios
              </Typography>
              {(() => {
                if (!histRowId) return null
                const r = data.find(d => d.representativeRcmId === histRowId) ?? data.find(d => d.id === histRowId)
                const code = (
                  String(histCodigoData?.codigoNombre ?? r?.codigoNombre ?? r?.numeroRcm ?? '').trim()
                )
                const cliente =
                  String(r?.cliente?.nombreCliente ?? (r as any)?.clienteNombre ?? (r as any)?.nombreCliente ?? '').trim() ||
                  (typeof (r as any)?.cliente === 'string' ? String((r as any).cliente).trim() : '')
                const obra = String(r?.obra?.nombreObra ?? r?.obra?.numeroObra ?? '').trim()
                const descripcion = String(
                  histCodigoData?.descripcionServicio ?? (r as any)?.descripcionServicio ?? ''
                ).trim()

                if (!code && !cliente && !obra && !descripcion) return null

                const right = [cliente, obra, descripcion].filter(v => String(v ?? '').trim()).join(' - ')
                const title = [code ? code : '', right ? `${code ? ', ' : ''}${right}` : ''].join('')
                if (!title.trim()) return null
                return (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {title}
                  </Typography>
                )
              })()}
            </Box>

            <IconButton aria-label='Cerrar' onClick={handleCloseHistDialog} size='small'>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>

          {(() => {
            if (!histRowId) return null
            const r = data.find(d => d.representativeRcmId === histRowId) ?? data.find(d => d.id === histRowId)
            const currentState = getCurrentStateForRow(histRowId)
            const info = getOperationalInfo(currentState)
            const sinceHit = (histRows ?? []).find((h: any) => {
              const est = normalizeStateForCompare(h?.estNuevo)
              return currentState && est === currentState
            })
            const since = sinceHit?.fechaAccion ? new Date(sinceHit.fechaAccion) : null
            const days = since ? Math.max(0, Math.floor((Date.now() - since.getTime()) / (1000 * 60 * 60 * 24))) : null
            const hasEvento = Boolean((r as any)?.conEvento)

            if (!currentState && !hasEvento) return null

            return (
              <Box
                sx={theme => ({
                  mb: 2,
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`,
                  bgcolor: alpha(theme.palette.warning.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Estado actual:
                  </Typography>
                  <Chip
                    label={formatStateForChip(currentState)}
                    size='small'
                    variant='filled'
                    sx={{
                      bgcolor: info.bgcolor,
                      color: info.colorText,
                      border: `1px solid ${info.border}`,
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      borderRadius: 2
                    }}
                  />
                  {since && (
                    <Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      desde {formatDateDDMMYYYYDateOnlyDash(since.toISOString())}
                      {typeof days === 'number' ? ` (${days} día${days === 1 ? '' : 's'})` : ''}
                    </Typography>
                  )}
                </Box>

                {hasEvento && (
                  <Chip
                    size='small'
                    color='error'
                    variant='outlined'
                    label='1 evento activo'
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  />
                )}
              </Box>
            )
          })()}

          {histLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              variant='outlined'
              sx={theme => ({
                '& .MuiTableCell-root': {
                  fontSize: theme.typography.caption.fontSize,
                  py: 1,
                  verticalAlign: 'top'
                }
              })}
            >
              <Table size='small' sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead
                  sx={{
                    '& .MuiTableCell-root': {
                      whiteSpace: 'nowrap',
                      textAlign: 'center'
                    }
                  }}
                >
                  <TableRow>
                    <TableCell align='center' sx={{ width: 84 }}>REGISTRO</TableCell>
                    <TableCell align='center' sx={{ width: 120 }}>FUNCIONARIO</TableCell>
                    <TableCell align='center' sx={{ width: 140 }}>APLICADO A</TableCell>
                    <TableCell align='center' sx={{ width: 160 }}>TIPO</TableCell>
                    <TableCell align='center' sx={{ width: 156 }}>EST. ANTERIOR</TableCell>
                    <TableCell align='center' sx={{ width: 156 }}>EST. NUEVO</TableCell>
                    <TableCell align='center' sx={{ width: 120 }}>NR</TableCell>
                    <TableCell align='center' sx={{ width: 170 }}>MOTIVO</TableCell>
                    <TableCell sx={{ width: 240 }}>OBSERVACIONES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {histRows.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography
                          variant='body2'
                          sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.1, whiteSpace: 'nowrap' }}
                        >
                          {formatDateDDMMYYYYDateOnlyDash(h.fechaAccion)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
                          {formatTimeHHmm(h.fechaAccion)}
                        </Typography>
                      </TableCell>
                      <TableCell>{h.funcionario ?? 'Usuario'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>CP</TableCell>
                      <TableCell>
                        {(() => {
                          const raw = String(h.tipo ?? '-')
                          const label = raw && raw !== 'null' && raw !== 'undefined' ? raw : '-'
                          return <Chip label={label} size='small' variant='filled' />
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const info = getOperationalInfo(h.estAnterior)
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={formatStateForChip(h.estAnterior)}
                                size='small'
                                variant='filled'
                                sx={{
                                  bgcolor: info.bgcolor,
                                  color: info.colorText,
                                  border: `1px solid ${info.border}`,
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  borderRadius: 2,
                                  px: 1,
                                  py: 0.4
                                }}
                              />
                            </Box>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const info = getOperationalInfo(h.estNuevo)
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip
                                label={formatStateForChip(h.estNuevo)}
                                size='small'
                                variant='filled'
                                sx={{
                                  bgcolor: info.bgcolor,
                                  color: info.colorText,
                                  border: `1px solid ${info.border}`,
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  borderRadius: 2,
                                  px: 1,
                                  py: 0.4
                                }}
                              />
                            </Box>
                          )
                        })()}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{''}</TableCell>
                      <TableCell>{h.motivo ?? '-'}</TableCell>
                      <TableCell
                        title={typeof h.observacion === 'string' ? h.observacion : h.observacion == null ? '' : String(h.observacion)}
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {h.observacion ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default UserListTable2


