'use client'

// ...existing code...
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'

// NextAuth
import { usePathname } from 'next/navigation'

import { useSession } from 'next-auth/react'

// Next Imports

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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
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
  informeTexto?: string | null
  informeTextos?: string[]
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

  // Meta para el popup de cierre de evento (se obtiene desde historial)
  const [closeEventoLoading, setCloseEventoLoading] = useState(false)

  const [closeEventoMeta, setCloseEventoMeta] = useState<
    | null
    | {
      tipoLabel: string
      motivoTitulo: string
      descripcion: string | null
      registradoTxt: string | null
      venceTxt: string | null
      tone: 'warning' | 'error' | 'secondary'
    }
  >(null)

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

  const histRowsWithStart = useMemo(() => {
    const rows = Array.isArray(histRows) ? [...histRows] : []

    const normalizeForCompare = (raw?: any) => {
      const key = normalizeStateKey(raw)

      return key ?? normalizeState(raw)
    }

    if (!histRowId) return rows

    const r = data.find(d => d.representativeRcmId === histRowId) ?? data.find(d => d.id === histRowId)

    if (!r) return rows

    const sortedAsc = rows
      .slice()
      .sort((a: any, b: any) => {
        const ta = new Date(a?.fechaAccion ?? a?.createdAt ?? 0).getTime()
        const tb = new Date(b?.fechaAccion ?? b?.createdAt ?? 0).getTime()

        return ta - tb
      })

    const oldest = sortedAsc[0] ?? null
    const initialState = 'CODIFICADO'

    const alreadyHasInitial = rows.some((h: any) => {
      const nuevo = normalizeForCompare(h?.estNuevo)
      const anterior = normalizeForCompare(h?.estAnterior)
      const noAnterior = !anterior || anterior === '-'
      const sameAsInitial = anterior === initialState

      return nuevo === initialState && (noAnterior || sameAsInitial)
    })

    if (alreadyHasInitial) return rows

    const fechaInicioRaw = String((r as any)?.fechaCodificacion ?? oldest?.fechaAccion ?? oldest?.createdAt ?? '').trim()

    if (!fechaInicioRaw) return rows

    const funcionarioInicio = String(oldest?.funcionario ?? oldest?.usuario ?? '').trim() || 'Sin registro'

    const initialEntry = {
      fechaAccion: fechaInicioRaw,
      funcionario: funcionarioInicio,
      aplicadoA: 'CP',
      tipo: 'Inicio',
      estAnterior: 'CODIFICADO',
      estNuevo: initialState,
      motivo: 'Registro inicial',
      observacion: `Estado inicial del CP: ${String(initialState).replace(/_/g, ' ')}`
    }

    return [initialEntry, ...rows]
  }, [histRows, histRowId, data])

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
    { key: 'DENSIDAD', label: 'Control de Compactación — Método Nuclear' },
    { key: 'HORMIGON', label: 'Ensayo Oficial Hormigón a la Compresión' }
  ] as const

  type AutoTemplateKey = (typeof AUTO_TEMPLATES)[number]['key']
  type AutoInformeDraft = {
    numero: string
    anexoPrev: string
    fechaEmision: string
    resultadoAnalisis: string
    observacionGeneral: string
    numeroMuestraLab: string
    numeroMuestraCliente: string
  }

  const getTodayInputDate = () => {
    const now = new Date()
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)

    return local.toISOString().slice(0, 10)
  }

  const normalizeToInputDate = (raw: unknown) => {
    const s = String(raw ?? '').trim()

    if (!s) return ''

    // Formato input date
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

    // dd/mm/yyyy o dd-mm-yyyy
    const dmy = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/)

    if (dmy) {
      const dd = dmy[1]
      const mm = dmy[2]
      const yyyy = dmy[3]

      return `${yyyy}-${mm}-${dd}`
    }

    return ''
  }

  const formatDateToDMY = (raw: unknown) => {
    const iso = normalizeToInputDate(raw)

    if (!iso) return ''
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)

    if (!m) return ''

    return `${m[3]}/${m[2]}/${m[1]}`
  }

  const createEmptyAutoDraft = (): AutoInformeDraft => ({
    numero: '',
    anexoPrev: '',
    fechaEmision: getTodayInputDate(),
    resultadoAnalisis: '',
    observacionGeneral: '',
    numeroMuestraLab: '',
    numeroMuestraCliente: ''
  })

  const emptyAutoDraft: AutoInformeDraft = createEmptyAutoDraft()

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

  const [autoInformeDrafts, setAutoInformeDrafts] = useState<Record<AutoTemplateKey, AutoInformeDraft>>({
    DENSIDAD: createEmptyAutoDraft(),
    HORMIGON: createEmptyAutoDraft()
  })

  const [informeDrafts, setInformeDrafts] = useState<
    Array<{
      id: string
      numero: string
      tipoInforme: string
      fechaEmision: string
      refCliente: string
      observaciones: string
      anexoPrev: string
      rcms: string[]
      saved?: boolean
      isEditing?: boolean
      historyId?: number | null
    }>
  >([])

  const [informeDialogErrors, setInformeDialogErrors] = useState<{ general?: string; numero?: string }>({})
  const [savingInformeDialog, setSavingInformeDialog] = useState(false)
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null)

  // Dialog: Ficha Código Producto (nuevo)
  const [codigoDialogOpen, setCodigoDialogOpen] = useState(false)
  const [codigoDialogLoading, setCodigoDialogLoading] = useState(false)
  const [codigoDialogMeta, setCodigoDialogMeta] = useState<any>(null)
  const [codigoDialogData, setCodigoDialogData] = useState<any>(null)
  const [codigoDialogHistory, setCodigoDialogHistory] = useState<any[]>([])
  const [codigoDialogDigitadoAt, setCodigoDialogDigitadoAt] = useState<string | null>(null)
  const [codigoDialogOpAt, setCodigoDialogOpAt] = useState<string | null>(null)

  // Dialog: Editar CP
  const [editCpOpen, setEditCpOpen] = useState(false)
  const [editCpLoading, setEditCpLoading] = useState(false)
  const [editCpSaving, setEditCpSaving] = useState(false)
  const [editCpError, setEditCpError] = useState<string | null>(null)
  const [editCpCodigoId, setEditCpCodigoId] = useState<number | null>(null)
  const [editCpCodigoNombre, setEditCpCodigoNombre] = useState<string>('')
  const [editCpSubtitle, setEditCpSubtitle] = useState<string>('')
  const [editCpDescripcion, setEditCpDescripcion] = useState<string>('')
  const [editCpNotasInternas, setEditCpNotasInternas] = useState<string>('')

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
    setAutoInformeDrafts({ DENSIDAD: createEmptyAutoDraft(), HORMIGON: createEmptyAutoDraft() })
    setInformeDialogErrors({})
    setHideEnsayosByRcm(true)
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
        historyCache.delete(representativeRcmId)

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
      const norm = (v: any) => {
        try {
          return String(v ?? '')
            .replace(/\u00A0/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase()
        } catch {
          return String(v ?? '').trim().toLowerCase()
        }
      }

      const existing: Record<AutoTemplateKey, number | null> = { DENSIDAD: null, HORMIGON: null }

      for (const t of AUTO_TEMPLATES) {
        const hits = (rows ?? []).filter((h: any) => {
          const tipoEstado = String(h?.tipoEstado ?? '').trim().toUpperCase()

          if (tipoEstado !== 'INFORME_AUTO') return false

          const motivo = norm(h?.motivo)

          if (t.key === 'DENSIDAD') {
            return motivo.includes('densidad') || motivo.includes('compactacion') || motivo.includes('metodo nuclear')
          }

          return motivo.includes('hormigon') || motivo.includes('compresion') || motivo.includes('hf')
        })

        const max = hits
          .map((h: any) => Number(h?.informe))
          .filter((n: any) => Number.isFinite(n) && n > 0)
          .reduce((acc: number | null, n: number) => (acc === null || n > acc ? n : acc), null)

        existing[t.key] = max
      }

      setAutoInformeExisting(existing)

      // Reconstruir informes manuales guardados desde el historial
      const manualEntries = (rows ?? []).filter((h: any) =>
        String(h?.tipoEstado ?? '').trim().toUpperCase() === 'INFORME_MANUAL' &&
        h?.informe != null
      )

      // Deduplicar por número de informe (si se guardó más de una vez, tomar el más reciente)
      const byNumero = new Map<number, any>()

      for (const h of [...manualEntries].reverse()) {
        const n = Number(h.informe)

        if (Number.isFinite(n) && n > 0 && !byNumero.has(n)) {
          byNumero.set(n, h)
        }
      }

      const parseObservacion = (obs: string | null) => {
        const result: { tipoInforme: string; fechaEmision: string; refCliente: string; observaciones: string; anexoPrev: string; rcms: string[]; numeroInforme: string } = {
          tipoInforme: '', fechaEmision: '', refCliente: '', observaciones: '', anexoPrev: '', rcms: [], numeroInforme: extractInformeTextFromObservacion(obs)
        }

        if (!obs) return result
        const parts = obs.split(' | ')

        for (const part of parts) {
          if (part.startsWith('N° Informe: ')) result.numeroInforme = part.slice(12).trim()
          else if (part.startsWith('Tipo: ')) result.tipoInforme = part.slice(6).trim()
          else if (part.startsWith('Fecha: ')) result.fechaEmision = normalizeToInputDate(part.slice(7).trim())
          else if (part.startsWith('Ref. Cliente: ')) result.refCliente = part.slice(14).trim()
          else if (part.startsWith('Obs: ')) result.observaciones = part.slice(5).trim()
          else if (part.startsWith('Anexo Prev: ')) result.anexoPrev = part.slice(12).trim()
          else if (part.startsWith('RCMs: ')) result.rcms = part.slice(6).split(',').map((s: string) => s.trim()).filter(Boolean)
        }


        return result
      }

      const reconstructed = Array.from(byNumero.entries())
        .sort(([a], [b]) => a - b)
        .map(([numero, h], i) => {
          const parsed = parseObservacion(h?.observacion ?? null)


          return {
            id: `saved-${numero}-${i}`,
            numero: parsed.numeroInforme || String(h.informe),
            tipoInforme: parsed.tipoInforme,
            fechaEmision: parsed.fechaEmision,
            refCliente: parsed.refCliente,
            observaciones: parsed.observaciones,
            anexoPrev: parsed.anexoPrev,
            rcms: parsed.rcms,
            saved: true,
            isEditing: false,
            historyId: Number.isFinite(Number(h?.id)) ? Number(h.id) : null
          }
        })

      if (reconstructed.length > 0) {
        setInformeDrafts(reconstructed)
      }
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
    setAutoInformeDrafts({ DENSIDAD: createEmptyAutoDraft(), HORMIGON: createEmptyAutoDraft() })
    setInformeDialogErrors({})
    setHideEnsayosByRcm(true)
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

  const extractInformeTextFromObservacion = (obs: string | null | undefined) => {
    const text = String(obs ?? '').trim()

    if (!text) return ''
    const parts = text.split(' | ')

    for (const part of parts) {
      if (/^(N° Informe|Nº Informe|Nro Informe|Numero Informe):\s*/i.test(part)) {
        return part.replace(/^(N° Informe|Nº Informe|Nro Informe|Numero Informe):\s*/i, '').trim()
      }
    }

    return ''
  }

  const mergeInformeTexts = (existing: Array<string | null | undefined>, incoming: Array<string | null | undefined>) => {
    const out = Array.from(
      new Set(
        [...(existing ?? []), ...(incoming ?? [])]
          .map(v => String(v ?? '').trim())
          .filter(Boolean)
      )
    )

    return out.sort((a, b) => {
      const na = parseInformeNumber(a)
      const nb = parseInformeNumber(b)

      if (na != null && nb != null) return na - nb
      if (na != null) return -1
      if (nb != null) return 1

      return compareText(a, b)
    })
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
    setCodigoDialogHistory([])
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
            const res = await fetch(`/api/rcm/${repRcmId}/history?take=300`)

            if (!res.ok) return []
            const json = await res.json().catch(() => [])
            const arr = Array.isArray(json) ? json : []

            historyCache.set(repRcmId, arr)

            return arr
          })()
          : Promise.resolve([])

      const [detail, rows] = await Promise.all([detailPromise, historyPromise])

      if (detail) setCodigoDialogData(detail)
      setCodigoDialogHistory(Array.isArray(rows) ? rows : [])

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
    setCodigoDialogHistory([])
    setCodigoDialogDigitadoAt(null)
    setCodigoDialogOpAt(null)
  }

  const closeEditCpDialog = () => {
    if (editCpSaving) return
    setEditCpOpen(false)
    setEditCpLoading(false)
    setEditCpSaving(false)
    setEditCpError(null)
    setEditCpCodigoId(null)
    setEditCpCodigoNombre('')
    setEditCpSubtitle('')
    setEditCpDescripcion('')
    setEditCpNotasInternas('')
  }

  const openEditCpDialogFromRepresentativeRcmId = async (representativeRcmId: number | null) => {
    handleCloseRowMenu()
    setEditCpError(null)

    if (!representativeRcmId) return
    const agg = findAggregatedRowByRepresentativeRcmId(representativeRcmId)
    const codigoAgrupadorId = Number((agg as any)?.id)

    if (!Number.isFinite(codigoAgrupadorId) || codigoAgrupadorId <= 0) {
      console.warn('Editar CP: codigoAgrupadorId inválido', codigoAgrupadorId, agg)

      return
    }

    const codigoNombre = String((agg as any)?.codigoNombre ?? '').trim()

    const clienteName =
      String((agg as any)?.cliente?.razonSocial ?? (agg as any)?.cliente?.nombreCliente ?? '').trim() ||
      String((agg as any)?.clienteNombre ?? '').trim()

    const obraNum = String((agg as any)?.obra?.numeroObra ?? '').trim()
    const obraTxt = obraNum ? `Obra ${obraNum}` : ''
    const subtitle = [clienteName, obraTxt].filter(Boolean).join(' - ')

    setEditCpCodigoId(codigoAgrupadorId)
    setEditCpCodigoNombre(codigoNombre)
    setEditCpSubtitle(subtitle)
    setEditCpDescripcion(String((agg as any)?.descripcionServicio ?? '').trim())
    setEditCpNotasInternas('')
    setEditCpOpen(true)

    try {
      setEditCpLoading(true)
      const res = await fetch(`/api/codigo-agrupador/${codigoAgrupadorId}?view=dialog`, { cache: 'no-store' })

      if (!res.ok) return
      const json = await res.json().catch(() => null)

      if (!json) return
      setEditCpCodigoNombre(String(json?.codigoNombre ?? codigoNombre ?? '').trim())
      setEditCpDescripcion(String(json?.descripcionServicio ?? '').trim())
      setEditCpNotasInternas(String(json?.notasInternas ?? '').trim())
    } catch (e) {
      console.error('openEditCpDialog error', e)
    } finally {
      setEditCpLoading(false)
    }
  }

  const saveEditCpDialog = async () => {
    if (editCpSaving) return
    const codigoId = editCpCodigoId

    if (!codigoId) return

    try {
      setEditCpSaving(true)
      setEditCpError(null)

      const payload = {
        descripcionServicio: editCpDescripcion,
        notasInternas: editCpNotasInternas
      }

      const res = await fetch(`/api/codigo-agrupador/${codigoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')

        throw new Error(txt || 'No se pudo guardar el CP')
      }

      // actualizar lista en memoria
      setData(prev =>
        prev.map(r =>
          Number((r as any)?.id) === codigoId
            ? { ...r, descripcionServicio: editCpDescripcion }
            : r
        )
      )
      setFilteredData(prev =>
        prev.map(r =>
          Number((r as any)?.id) === codigoId
            ? { ...r, descripcionServicio: editCpDescripcion }
            : r
        )
      )

      try {
        void refreshSeguimiento()
      } catch {
        /* noop */
      }

      closeEditCpDialog()
    } catch (e: any) {
      console.error('saveEditCpDialog error', e)
      setEditCpError(String(e?.message ?? 'No se pudo guardar el CP.'))
    } finally {
      setEditCpSaving(false)
    }
  }

  const validateInformeDialog = () => {
    const errors: { general?: string; numero?: string } = {}

    if (!informeDialogRcmId) errors.general = 'RCM no seleccionado'

    const totalEnsayos = Number(informeDialogMeta?.ensayos?.total ?? 0)
    const ensayados = Number(informeDialogMeta?.ensayos?.ensayados ?? 0)
    const pendientes = Math.max(0, totalEnsayos - ensayados)

    const applicableAutoKeys = getApplicableAutoTemplateKeys(informeDialogMeta)
    const requiresAutos = applicableAutoKeys.length > 0

    const getAutoDraft = (key: AutoTemplateKey): AutoInformeDraft => {
      const draft = autoInformeDrafts?.[key]


      return draft ? draft : { ...emptyAutoDraft }
    }

    const isAutoDraftComplete = (key: AutoTemplateKey) => {
      const draft = getAutoDraft(key)
      const numero = parseInformeNumber(draft.numero)
      const fechaEmision = String(draft.fechaEmision ?? '').trim()

      if (numero == null) return false
      if (!fechaEmision) return false

      if (key === 'DENSIDAD') {
        return Boolean(String(draft.resultadoAnalisis ?? '').trim())
      }

      return Boolean(String(draft.numeroMuestraLab ?? '').trim())
    }

    const autoCreates = AUTO_TEMPLATES.flatMap(t => {
      const applies = applicableAutoKeys.includes(t.key)

      if (!applies) return []

      const existing = autoInformeExisting?.[t.key]

      if (existing != null) return []

      const draft = getAutoDraft(t.key)
      const n = parseInformeNumber(draft.numero)

      if (n == null) return []
      if (!isAutoDraftComplete(t.key)) return []

      // sólo se puede subir automático si ya finalizaron todos los ensayos
      if (pendientes > 0) return []

      return [
        {
          key: t.key,
          label: t.label,
          numero: n,
          numeroRaw: String(draft.numero ?? '').trim(),
          anexoPrev: String(draft.anexoPrev ?? '').trim(),
          fechaEmision: String(draft.fechaEmision ?? '').trim(),
          resultadoAnalisis: String(draft.resultadoAnalisis ?? '').trim(),
          observacionGeneral: String(draft.observacionGeneral ?? '').trim(),
          numeroMuestraLab: String(draft.numeroMuestraLab ?? '').trim(),
          numeroMuestraCliente: String(draft.numeroMuestraCliente ?? '').trim()
        }
      ]
    })

    const manualCreates = informeDrafts
      .map(d => ({
        id: d.id,
        numero: parseInformeNumber(d.numero),
        numeroRaw: String((d as any).numero ?? '').trim(),
        tipoInforme: String((d as any).tipoInforme ?? '').trim(),
        fechaEmision: String((d as any).fechaEmision ?? '').trim(),
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
        numeroRaw: string
        tipoInforme: string
        fechaEmision: string
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

        if (!isAutoDraftComplete(k)) return true

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

  const handleSaveInformeDraft = async (draftId: string) => {
    const draft = informeDrafts.find(d => d.id === draftId)

    if (!draft) return

    const numero = parseInformeNumber(draft.numero)

    if (numero == null) return

    const rcmId = informeDialogRcmId

    if (!rcmId) return

    const selectedRcms: string[] = Array.isArray((draft as any).rcms)
      ? (draft as any).rcms.map((x: any) => String(x ?? '').trim()).filter(Boolean)
      : []

    if (selectedRcms.length === 0) {
      setInformeDialogErrors(prev => ({ ...prev, general: 'Selecciona al menos 1 RCM antes de guardar.' }))

      return
    }

    try {
      setSavingDraftId(draftId)
      setInformeDialogErrors(prev => ({ ...prev, general: undefined }))

      const historyId = Number((draft as any).historyId)
      const isUpdate = Boolean((draft as any).saved && Number.isFinite(historyId) && historyId > 0)

      const funcionario = getCurrentUserName() ?? 'Usuario'
      const aplicadoA = getAppliedAForRow(rcmId)

      const parts = [
        (draft as any).numero ? `N° Informe: ${(draft as any).numero}` : '',
        (draft as any).tipoInforme ? `Tipo: ${(draft as any).tipoInforme}` : '',
        (draft as any).fechaEmision ? `Fecha: ${(draft as any).fechaEmision}` : '',
        draft.refCliente ? `Ref. Cliente: ${draft.refCliente}` : '',
        draft.observaciones ? `Obs: ${draft.observaciones}` : '',
        draft.anexoPrev ? `Anexo Prev: ${draft.anexoPrev}` : '',
        selectedRcms.length ? `RCMs: ${selectedRcms.join(', ')}` : ''
      ].filter(Boolean)

      const observacion = parts.length ? parts.join(' | ') : null

      const payload: any = {
        tipo: 'Ope',
        tipoEstado: 'INFORME_MANUAL',
        motivo: null,
        observacion,
        funcionario,
        estPrev: null,
        estNuevo: null,
        aplicadoA,
        informe: numero
      }

      if (isUpdate) payload.historyId = historyId

      const res = await fetch(`/api/rcm/${rcmId}/history`, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')

        console.error('Failed to save informe draft:', res.status, txt)
        setInformeDialogErrors(prev => ({ ...prev, general: 'No se pudo guardar el informe.' }))

        return
      }

      const created = await res.json().catch(() => null)

      // Marcar draft como guardado
      setInformeDrafts(prev => prev.map(d => d.id === draftId ? {
        ...d,
        saved: true,
        isEditing: false,
        historyId: isUpdate ? historyId : (Number.isFinite(Number(created?.id)) ? Number(created.id) : d.historyId ?? null)
      } : d))

      // Actualizar caché de historial
      const entry = created ?? {
        id: isUpdate ? historyId : undefined,
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

      const current = historyCache.get(rcmId) ?? []
      const previousEntry = isUpdate ? current.find((x: any) => Number(x?.id) === historyId) : null

      const previousNumeroRaw = String(
        extractInformeTextFromObservacion(previousEntry?.observacion ?? null) ||
        (previousEntry?.informe != null ? previousEntry.informe : '')
      ).trim()

      const nextEntry = { ...previousEntry, ...entry }

      if (isUpdate) {
        const replaced = current.map((x: any) => (Number(x?.id) === historyId ? nextEntry : x))
        const exists = replaced.some((x: any) => Number(x?.id) === historyId)

        historyCache.set(rcmId, exists ? replaced : [nextEntry, ...replaced])
      } else {
        historyCache.set(rcmId, [nextEntry, ...current])
      }

      if (histDialogOpen && histRowId === rcmId) {
        if (isUpdate) {
          setHistRows(prev => {
            const replaced = prev.map((x: any) => (Number(x?.id) === historyId ? nextEntry : x))
            const exists = replaced.some((x: any) => Number(x?.id) === historyId)

            return exists ? replaced : [nextEntry, ...replaced]
          })
        } else {
          setHistRows(prev => [nextEntry, ...prev])
        }
      }

      // Actualizar columna N° Informe de la tabla con el máximo entre todos los guardados
      const allSaved = informeDrafts.map(d => {
        if (d.id === draftId) return numero
        if ((d as any).saved) return parseInformeNumber(d.numero)

        return null
      }).filter((n): n is number => n != null)

      const maxNum = allSaved.length ? Math.max(...allSaved) : numero
      const numeroRaw = String((draft as any).numero ?? '').trim()

      const currentTexts = (row: any) => [
        ...(Array.isArray((row as any).informeTextos) ? (row as any).informeTextos : []),
        (row as any).informeTexto
      ]

      const withoutPrevious = (arr: any[]) => {
        if (!isUpdate || !previousNumeroRaw) return arr

        return arr.filter(v => String(v ?? '').trim() !== previousNumeroRaw)
      }

      setData(prev => prev.map(d =>
        d.id === rcmId || (d as any).representativeRcmId === rcmId
          ? (() => {
            const merged = mergeInformeTexts(
              withoutPrevious(currentTexts(d)),
              [numeroRaw || String(maxNum)]
            )

            return { ...d, informe: maxNum, informeTexto: merged[merged.length - 1] ?? null, informeTextos: merged }
          })()
          : d
      ))
      setFilteredData(prev => prev.map(d =>
        d.id === rcmId || (d as any).representativeRcmId === rcmId
          ? (() => {
            const merged = mergeInformeTexts(
              withoutPrevious(currentTexts(d)),
              [numeroRaw || String(maxNum)]
            )

            return { ...d, informe: maxNum, informeTexto: merged[merged.length - 1] ?? null, informeTextos: merged }
          })()
          : d
      ))
    } catch (e) {
      console.error('handleSaveInformeDraft error', e)
      setInformeDialogErrors(prev => ({ ...prev, general: 'No se pudo guardar el informe.' }))
    } finally {
      setSavingDraftId(null)
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

      const buildManualObservacion = (
        numeroRaw: string,
        tipoInforme: string,
        fechaEmision: string,
        refCliente: string,
        observaciones: string,
        anexoPrev: string,
        rcms?: string[]
      ) => {
        const parts = [
          numeroRaw ? `N° Informe: ${numeroRaw}` : '',
          tipoInforme ? `Tipo: ${tipoInforme}` : '',
          fechaEmision ? `Fecha: ${formatDateToDMY(fechaEmision)}` : '',
          refCliente ? `Ref. Cliente: ${refCliente}` : '',
          observaciones ? `Obs: ${observaciones}` : '',
          anexoPrev ? `Anexo Prev: ${anexoPrev}` : '',
          (rcms ?? []).length ? `RCMs: ${(rcms ?? []).join(', ')}` : ''
        ].filter(Boolean)


        return parts.length ? parts.join(' | ') : null
      }

      const buildAutoObservacion = (
        key: AutoTemplateKey,
        draft: {
          numeroRaw: string
          anexoPrev: string
          fechaEmision: string
          resultadoAnalisis: string
          observacionGeneral: string
          numeroMuestraLab: string
          numeroMuestraCliente: string
        },
        rcms?: string[]
      ) => {
        if (key === 'DENSIDAD') {
          const parts = [
            draft.numeroRaw ? `N° Informe: ${draft.numeroRaw}` : '',
            draft.fechaEmision ? `Fecha Emisión: ${formatDateToDMY(draft.fechaEmision)}` : '',
            draft.resultadoAnalisis ? `Resultado Análisis: ${draft.resultadoAnalisis}` : '',
            draft.observacionGeneral ? `Observación General: ${draft.observacionGeneral}` : '',
            draft.anexoPrev ? `Anexo Prev: ${draft.anexoPrev}` : '',
            (rcms ?? []).length ? `RCMs: ${(rcms ?? []).join(', ')}` : ''
          ].filter(Boolean)

          return parts.length ? parts.join(' | ') : null
        }

        const parts = [
          draft.numeroRaw ? `N° Informe: ${draft.numeroRaw}` : '',
          draft.fechaEmision ? `Fecha Emisión: ${formatDateToDMY(draft.fechaEmision)}` : '',
          draft.numeroMuestraLab ? `N° Muestra Lab: ${draft.numeroMuestraLab}` : '',
          draft.numeroMuestraCliente ? `N° Muestra Cliente: ${draft.numeroMuestraCliente}` : '',
          draft.observacionGeneral ? `Observación General: ${draft.observacionGeneral}` : '',
          draft.anexoPrev ? `Anexo Prev: ${draft.anexoPrev}` : '',
          (rcms ?? []).length ? `RCMs: ${(rcms ?? []).join(', ')}` : ''
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

      const metaRcms: string[] = Array.isArray(informeDialogMeta?.rcmNumeros)
        ? (informeDialogMeta?.rcmNumeros ?? []).map((x: any) => String(x ?? '').trim()).filter(Boolean)
        : []

      // 1) Persistir informes automáticos (si aplica)
      for (const a of autoCreates ?? []) {
        const payload: any = {
          tipo: 'Ope',
          tipoEstado: 'INFORME_AUTO',
          motivo: a.label,
          observacion: buildAutoObservacion(
            a.key,
            {
              anexoPrev: a.anexoPrev,
              numeroRaw: a.numeroRaw,
              fechaEmision: a.fechaEmision,
              resultadoAnalisis: a.resultadoAnalisis,
              observacionGeneral: a.observacionGeneral,
              numeroMuestraLab: a.numeroMuestraLab,
              numeroMuestraCliente: a.numeroMuestraCliente
            },
            metaRcms
          ),
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

      // 2) Persistir informes manuales (solo los que no fueron guardados individualmente)
      const unsavedManuals = (manualCreates ?? []).filter(m => {
        const draft = informeDrafts.find(d => d.id === m.id)


        return !(draft as any)?.saved
      })

      for (const m of unsavedManuals) {
        const payload: any = {
          tipo: 'Ope',
          tipoEstado: 'INFORME_MANUAL',
          motivo: null,
          observacion: buildManualObservacion(m.numeroRaw, m.tipoInforme, m.fechaEmision, m.refCliente, m.observaciones, m.anexoPrev, m.rcms),
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

      const candidates = [
        ...(autoCreates ?? []).map((a: any) => ({ num: Number(a?.numero), text: String(a?.numeroRaw ?? '').trim() })),
        ...(manualCreates ?? []).map((m: any) => ({ num: Number(m?.numero), text: String(m?.numeroRaw ?? '').trim() }))
      ].filter(c => Number.isFinite(c.num) && c.num > 0)

      const topCandidate = candidates.sort((a, b) => b.num - a.num)[0] ?? null
      const informeTextoToPersist = topCandidate?.text || String(informeToPersist)
      const informeTextosToPersist = mergeInformeTexts([], candidates.map(c => c.text || String(c.num)))

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
            ? (() => {
              const merged = mergeInformeTexts(
                [...(Array.isArray((d as any).informeTextos) ? (d as any).informeTextos : []), (d as any).informeTexto],
                informeTextosToPersist
              )

              return {
                ...d,
                estadoOperativo: prevNorm !== 'DIGITADO' ? 'DIGITADO' : (d as any).estadoOperativo,
                informe: informeToPersist,
                informeTexto: merged[merged.length - 1] ?? informeTextoToPersist,
                informeTextos: merged
              }
            })()
            : d
        )
      )
      setFilteredData(prev =>
        prev.map(d =>
          d.id === rcmId || (d as any).representativeRcmId === rcmId
            ? {
              ...d,
              estadoOperativo: prevNorm !== 'DIGITADO' ? 'DIGITADO' : (d as any).estadoOperativo,
              informe: informeToPersist,
              informeTexto: (() => {
                const merged = mergeInformeTexts(
                  [...(Array.isArray((d as any).informeTextos) ? (d as any).informeTextos : []), (d as any).informeTexto],
                  informeTextosToPersist
                )

                return merged[merged.length - 1] ?? informeTextoToPersist
              })(),
              informeTextos: mergeInformeTexts(
                [...(Array.isArray((d as any).informeTextos) ? (d as any).informeTextos : []), (d as any).informeTexto],
                informeTextosToPersist
              )
            }
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
    setCloseEventoLoading(false)
    setCloseEventoMeta(null)

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
    setCloseEventoLoading(false)
    setCloseEventoMeta(null)
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

  const handleGoToCodificacion = (rowId: number | null) => {
    // abrir formulario full de codificación (edición)
    handleEdit(rowId)
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
          informeTexto: (r.informeTexto ?? null) as string | null,
          informeTextos: Array.isArray(r.informeTextos)
            ? r.informeTextos.map((x: any) => String(x ?? '').trim()).filter(Boolean)
            : [],
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
              nombreObra: (r.obra as any).nombreObra ?? undefined,
              mandante: (r.obra as any).mandante ?? undefined
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
    const d = toDateOnly(v)

    if (!d || isNaN(d.getTime())) return '-'
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()


    return `${dd}/${mm}/${yyyy}`
  }

  // helper: formatear fecha a DD-MM-AAAA (sin hora)
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return formatDateDDMMYYYYDateOnlyDash(new Date(t))
    const d = new Date(t)

    if (!isNaN(d.getTime())) return formatDateDDMMYYYYDateOnlyDash(d)

    return t
  }

  const extractDueTxtFromText = (raw: string | null | undefined) => {
    const s = String(raw ?? '')
    const m = s.match(/\bvence(?:\s*fecha)?\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4}|\d{4}[\/-]\d{2}[\/-]\d{2}|\d{2}[\/-]\d{2}[\/-]\d{2})\b/i)

    if (!m) return null

    return formatDateLikeDDMMYYYYDash(String(m[1] ?? '').trim())
  }

  const deriveActiveEventoMetaFromHistory = (rows: any[]) => {
    const isEventoAbierto = (h: any) => {
      const tipo = String(h?.tipo ?? '').trim()
      const tipoEstado = String(h?.tipoEstado ?? '').trim().toUpperCase()


      return tipo === 'Evento Abierto' || tipoEstado === 'EVENTO'
    }

    const isEventoCerrado = (h: any) => {
      const tipo = String(h?.tipo ?? '').trim()
      const tipoEstado = String(h?.tipoEstado ?? '').trim().toUpperCase()


      return tipo === 'Evento Cerrado' || tipoEstado === 'EVENTO_CERRADO'
    }

    for (const h of rows ?? []) {
      if (isEventoCerrado(h)) return null
      if (!isEventoAbierto(h)) continue

      const motivo = String(h?.motivo ?? '').trim()
      const [head, ...rest] = motivo.split(' - ')
      const tipoLabel = (head || 'Evento').trim() || 'Evento'
      const motivoTitulo = (rest.join(' - ') || '').trim()

      const obs = String(h?.observacion ?? '').trim()
      const descripcion = obs ? obs.split(/\r?\n/).find(l => String(l).trim()) ?? null : null

      const fechaIso = String(h?.fechaAccion ?? h?.createdAt ?? h?.date ?? '').trim()
      const registradoDate = fechaIso ? formatDateDDMMYYYYDateOnlyDash(fechaIso) : null
      const funcionario = String(h?.funcionario ?? h?.user ?? '').trim()

      const registradoTxt = [registradoDate ? `Registrado ${registradoDate}` : null, funcionario ? funcionario : null]
        .filter(Boolean)
        .join(' · ') || null

      const venceTxt = extractDueTxtFromText(obs) ?? extractDueTxtFromText(motivo)

      const nt = normalizeText(tipoLabel)

      const tone: 'warning' | 'error' | 'secondary' = nt.includes('error')
        ? 'error'
        : nt.includes('correc')
          ? 'secondary'
          : 'warning'

      return { tipoLabel, motivoTitulo, descripcion, registradoTxt, venceTxt, tone }
    }

    return null
  }

  // Cargar meta del evento activo al abrir el popup de cierre
  useEffect(() => {
    if (!markDialogOpen) return
    if (markDialogAction !== 'CERRAR_EVENTO') return
    if (!markDialogRowId) return

    let alive = true
    const rcmId = markDialogRowId

    setCloseEventoLoading(true)
    setCloseEventoMeta(null)

    void (async () => {
      try {
        let rows = historyCache.get(rcmId)

        if (!rows) {
          const res = await fetch(`/api/rcm/${rcmId}/history?take=200`)

          if (!res.ok) rows = []
          else {
            const json = await res.json().catch(() => [])

            rows = Array.isArray(json) ? json : []
          }

          historyCache.set(rcmId, rows)
        }

        const ordered = (Array.isArray(rows) ? rows : []).slice().sort((a: any, b: any) => {
          const ta = new Date(a?.fechaAccion ?? a?.createdAt ?? a?.date ?? 0).getTime()
          const tb = new Date(b?.fechaAccion ?? b?.createdAt ?? b?.date ?? 0).getTime()


          return tb - ta
        })

        const meta = deriveActiveEventoMetaFromHistory(ordered)

        if (alive) setCloseEventoMeta(meta)
      } catch (e) {
        if (alive) setCloseEventoMeta(null)
      } finally {
        if (alive) setCloseEventoLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [markDialogOpen, markDialogAction, markDialogRowId, historyCache])

  // helper: formatear fecha a DD-MM-YY (sin hora)
  const formatDateDDMMYYDateOnlyDash = (v: any) => {
    if (!v) return '-'
    const d = v instanceof Date ? v : new Date(v)

    if (isNaN(d.getTime())) return '-'
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(-2)


    return `${dd}-${mm}-${yy}`
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

      ; (ADMINISTRATIVE_STATES ?? []).forEach((s: any, idx: number) => {
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
          const descripcion = String(row.original.descripcionServicio ?? '').trim()

          const title = [areaText, servicioText, descripcion].filter(Boolean).join('\n')

          if (!areaText && !servicioText) {
            return <Typography variant='body2'>-</Typography>
          }

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} title={title}>
              <Typography variant='body2' sx={{ fontWeight: 700 }}>
                {areaText} {servicioText ? `- ${servicioText}` : ''}
              </Typography>
              {descripcion ? (
                <Typography variant='caption' color='text.secondary' sx={{ lineHeight: 1.2, maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {descripcion}
                </Typography>
              ) : null}
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
        cell: ({ row }) => {
          const rawList = Array.isArray(row.original.informeTextos)
            ? row.original.informeTextos
            : [row.original.informeTexto ?? row.original.informe]

          const list = (() => {
            const seen = new Set<string>()

            return rawList
              .map(v => String(v ?? '').trim())
              .filter(Boolean)
              .filter(v => {
                if (seen.has(v)) return false
                seen.add(v)

                return true
              })
          })()

          if (!list.length) return <span>-</span>

          if (list.length === 1) {
            return (
              <Typography
                variant='body2'
                title={list[0]}
                sx={{
                  display: 'inline-block',
                  maxWidth: 180,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  verticalAlign: 'middle'
                }}
              >
                {list[0]}
              </Typography>
            )
          }

          const visible = list.slice(0, 1)
          const hidden = Math.max(0, list.length - visible.length)

          return (
            <Box
              title={list.join(', ')}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 0.45,
                maxWidth: 190,
                mx: 'auto'
              }}
            >
              {visible.map(v => (
                <Chip
                  key={v}
                  size='small'
                  label={v}
                  sx={{
                    height: 22,
                    borderRadius: 1.5,
                    fontWeight: 700,
                    maxWidth: 130,
                    '& .MuiChip-label': {
                      px: 0.8,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }
                  }}
                />
              ))}
              {hidden > 0 ? (
                <Chip
                  size='small'
                  label={`+${hidden}`}
                  sx={{
                    height: 22,
                    borderRadius: 1.5,
                    fontWeight: 800,
                    bgcolor: theme => alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                    '& .MuiChip-label': { px: 0.8 }
                  }}
                />
              ) : null}
            </Box>
          )
        }
      },
      {
        id: 'estOp',
        header: 'Est. Op',
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
        header: 'Est. Adm.',
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

      // si el click ocurre dentro de un menú/popover/modal (portal), no limpiar
      if (target.closest('.MuiPopover-root') || target.closest('.MuiMenu-root') || target.closest('.MuiModal-root')) return

      // si el click ocurre dentro del panel de detalle de código producto, no limpiar
      if (target.closest('[data-rcmnav-detail]')) return

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

      const informe = Array.isArray(item.informeTextos) && item.informeTextos.length
        ? item.informeTextos.join(', ')
        : (item.informeTexto ?? item.informe ?? '')

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
          '& table': {
            whiteSpace: 'normal'
          },
          '& th, & td': {
            whiteSpace: 'normal'
          },
          '& td': {
            overflowWrap: 'anywhere'
          },
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
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontWeight: 800, lineHeight: 1.1 }}>
                Código Producto
              </Typography>
              <Typography variant='subtitle1' sx={{ fontWeight: 900, lineHeight: 1.2, color: 'primary.main' }}>
                {String(codigoDialogMeta?.codigoNombre ?? codigoDialogData?.codigoNombre ?? '').trim() || '—'}
              </Typography>
              <Box sx={{ mt: 0.5, minWidth: 0 }}>
                {(() => {
                  const ot = String(codigoDialogMeta?.ot ?? '').trim()

                  const clienteName =
                    String(codigoDialogMeta?.cliente?.razonSocial ?? codigoDialogMeta?.cliente?.nombreCliente ?? '').trim() ||
                    String(codigoDialogMeta?.clienteNombre ?? '').trim()

                  const obraNum = String(codigoDialogMeta?.obra?.numeroObra ?? '').trim()

                  const ciudad = String(
                    codigoDialogMeta?.ciudad ??
                    codigoDialogMeta?.obra?.comuna ??
                    codigoDialogMeta?.cliente?.comuna ??
                    codigoDialogMeta?.cliente?.ciudad ??
                    ''
                  ).trim()

                  const mandante = String((codigoDialogMeta as any)?.mandante ?? codigoDialogMeta?.obra?.mandante ?? '').trim()

                  const row1 = [ot ? `OT ${ot}` : '', clienteName].filter(Boolean).join(' - ') || ' '

                  const row2 = [obraNum ? `Obra ${obraNum}` : '', ciudad, mandante ? `Mandante ${mandante}` : '']
                    .filter(Boolean)
                    .join(' - ') || ' '

                  return (
                    <>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ display: 'block', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {row1}
                      </Typography>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        sx={{ display: 'block', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {row2}
                      </Typography>
                    </>
                  )
                })()}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              {/* Estados (mover a esquina superior derecha) */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 0 }}>
                {(() => {
                  const op = String(codigoDialogMeta?.estadoOperativo ?? '').trim()
                  const adm = String(codigoDialogMeta?.estadoAdministrativo ?? '').trim()

                  if (!op && !adm) return null

                  const opKey = String(op).trim().toUpperCase()
                  const opNormKey = normalizeStateKey(op) ?? opKey
                  const opInfo = op ? getOperationalInfo(op) : null

                  const opLabel = op
                    ? (
                      {
                        ENVIADO_DIGITACION: 'Env. Digitación'
                      } as Record<string, string>
                    )[opNormKey] ?? OPERATIONAL_STATES.find(s => s.value === opKey)?.label ?? op
                    : null

                  const fallbackOpDate = String((codigoDialogMeta as any)?.fechaCodificacion ?? '').trim() || null

                  const dateSrc = op
                    ? (codigoDialogOpAt ?? (opKey === 'DIGITADO' ? codigoDialogDigitadoAt : null) ?? fallbackOpDate)
                    : null

                  const dateTxt = dateSrc ? formatDateDDMMYYYYDateOnly(dateSrc) : '-'

                  const daysSinceDigitado = (() => {
                    if (opKey !== 'DIGITADO') return null
                    const raw = String(dateSrc ?? '').trim()

                    if (!raw) return null
                    const d = new Date(raw)

                    if (isNaN(d.getTime())) return null
                    const from = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
                    const now = new Date()
                    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
                    const diff = Math.floor((to - from) / (24 * 60 * 60 * 1000))


                    return Number.isFinite(diff) && diff >= 0 ? diff : null
                  })()

                  const admInfo = adm ? getAdministrativeInfo(adm) : null

                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 0 }}>
                        {op ? (
                          <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                            Desde {dateTxt}
                          </Typography>
                        ) : null}

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
                              borderRadius: 999,
                              whiteSpace: 'nowrap'
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
                              borderRadius: 999,
                              whiteSpace: 'nowrap'
                            }}
                          />
                        ) : null}
                      </Box>

                      {daysSinceDigitado != null ? (
                        <Typography variant='caption' color='text.secondary' sx={{ mt: 0.15, fontWeight: 700 }}>
                          {daysSinceDigitado === 1 ? 'Hace 1 día' : `Hace ${daysSinceDigitado} días`}
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

              const map = new Map<
                string,
                {
                  sku: string
                  nombre: string
                  cantidad: number
                  esPaquete: boolean
                  subProductos: Array<{ sku: string; nombre: string; cantidad: number }>
                }
              >()

              for (const e of ens) {
                const sku = String(e?.sku ?? e?.producto?.sku ?? '').trim()
                const nombre = String(e?.nombre ?? e?.producto?.nombre ?? '').trim()

                const explicitChildren = Array.isArray(e?.subProductos)
                  ? e.subProductos
                  : []

                const masterChildren = Array.isArray(e?.producto?.productosEnPaquete)
                  ? e.producto.productosEnPaquete
                    .map((sp: any) => {
                      const spSku = String(sp?.producto?.sku ?? '').trim()
                      const spNombre = String(sp?.producto?.nombre ?? '').trim()
                      const spCantidad = Number(sp?.cantidad ?? 1)

                      if (!spSku) return null

                      return {
                        sku: spSku,
                        nombre: spNombre,
                        cantidad: Number.isFinite(spCantidad) && spCantidad > 0 ? spCantidad : 1
                      }
                    })
                    .filter(Boolean) as Array<{ sku: string; nombre: string; cantidad: number }>
                  : []

                // En este popup la etiqueta depende del maestro del producto:
                // si el SKU está marcado como paquete, se muestra la chapa y sus hijos.
                // Los hijos explícitos siguen teniendo prioridad cuando vienen en la codificación.
                const esPaquete = Boolean(e?.producto?.esPaquete) || explicitChildren.length > 0

                const subProductos = explicitChildren.length ? explicitChildren : (esPaquete ? masterChildren : [])

                if (!sku) continue
                const prev = map.get(sku)

                // Importante: el listado SKUs del CP representa la configuración del Código Producto,
                // no la suma de servicios ejecutados por cada RCM.
                const baseCantidad = 1

                map.set(sku, {
                  sku,
                  nombre: prev?.nombre || nombre,
                  cantidad: (prev?.cantidad ?? 0) + baseCantidad,
                  esPaquete: prev?.esPaquete ?? esPaquete,
                  subProductos: prev?.subProductos?.length ? prev.subProductos : subProductos
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
                      {items.slice(0, 24).flatMap(it => {
                        const rows: React.ReactNode[] = []

                        rows.push(
                          <TableRow key={`sku-${it.sku}`} hover>
                            <TableCell sx={{ fontWeight: 900, color: 'primary.main' }}>{it.sku}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <span>{it.nombre || '-'}</span>
                                {it.esPaquete ? (
                                  <Chip
                                    size='small'
                                    label='Paquete'
                                    color='primary'
                                    sx={{ height: 22, fontWeight: 800 }}
                                  />
                                ) : null}
                              </Box>
                            </TableCell>
                            <TableCell align='right' sx={{ fontWeight: 700 }}>{it.cantidad}</TableCell>
                          </TableRow>
                        )

                        if (it.esPaquete && it.subProductos.length) {
                          for (const sp of it.subProductos) {
                            rows.push(
                              <TableRow key={`sku-${it.sku}-sub-${sp.sku}`}>
                                <TableCell sx={{ pl: 3, color: 'text.secondary', fontWeight: 700 }}>{sp.sku}</TableCell>
                                <TableCell sx={{ color: 'text.secondary' }}>
                                  {`↳ ${sp.nombre || '-'}`}
                                </TableCell>
                                <TableCell align='right' sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                  {sp.cantidad * it.cantidad}
                                </TableCell>
                              </TableRow>
                            )
                          }
                        }

                        return rows
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            })()}
          </Box>

          {/* Informes */}
          <Box sx={{ mb: 2 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>
              Informes
            </Typography>

            {(() => {
              const normalize = (v: any) => String(v ?? '').trim().toUpperCase()

              const formatInforme = (n: number) => {
                const s = String(n)

                if (s.length <= 3) return s

                return `${s.slice(0, -3)}-${s.slice(-3)}`
              }

              const extractTipoFromObs = (obs: string) => {
                const raw = String(obs ?? '')
                const m = raw.match(/(?:^|\|\s)\s*Tipo:\s*([^|\n\r]+)/i)


                return String(m?.[1] ?? '').trim() || null
              }

              const extractRcmsFromObs = (obs: string) => {
                const raw = String(obs ?? '')
                const m = raw.match(/RCMs?:\s*([^|\n\r]+)/i)
                const bag = String(m?.[1] ?? '').trim()

                if (!bag) return [] as string[]

                return bag
                  .split(/[,\s]+/)
                  .map(x => String(x ?? '').trim())
                  .filter(Boolean)
              }

              const rows = Array.isArray(codigoDialogHistory) ? codigoDialogHistory : []

              const informes = rows
                .map((r: any) => {
                  const tipoEstado = normalize(r?.tipoEstado)

                  if (tipoEstado !== 'INFORME_AUTO' && tipoEstado !== 'INFORME_MANUAL') return null
                  const informeN = Number(r?.informe)
                  const hasN = Number.isFinite(informeN) && informeN > 0
                  const modo = tipoEstado === 'INFORME_AUTO' ? 'Digital' : 'Manual'
                  const issuedAt = r?.fechaAccion ?? r?.createdAt ?? null
                  const dateTxt = issuedAt ? formatDateDDMMYYYYDateOnly(issuedAt) : '-'

                  const obs = String(r?.observacion ?? '').trim()
                  const motivo = String(r?.motivo ?? '').trim()

                  const nombre =
                    modo === 'Manual'
                      ? extractTipoFromObs(obs) ?? '—'
                      : motivo || String(codigoDialogData?.descripcionServicio ?? codigoDialogMeta?.descripcionServicio ?? '').trim() || '—'

                  const rcmsRaw = extractRcmsFromObs(obs)

                  const repRcmFallback = (() => {
                    const rep = Number(codigoDialogMeta?.representativeRcmId)


                    return Number.isFinite(rep) && rep > 0 ? [String(rep)] : ([] as string[])
                  })()

                  const rcms = rcmsRaw.length ? rcmsRaw : repRcmFallback

                  const slug = (() => {
                    const norm = normalize(motivo)

                    if (norm.includes('DENSIDAD')) return 'densidad'
                    if (norm.includes('HORMIGON') || norm.includes('HORMIGÓN')) return 'hormigon'

                    return null
                  })()

                  return {
                    key: `${tipoEstado}-${String(r?.id ?? '')}-${String(r?.fechaAccion ?? r?.createdAt ?? '')}`,
                    modo,
                    informeN: hasN ? informeN : null,
                    numeroTxt: hasN ? formatInforme(informeN) : '-',
                    dateTxt,
                    nombre,
                    rcms,
                    slug
                  }
                })
                .filter(Boolean) as Array<{
                  key: string
                  modo: 'Digital' | 'Manual'
                  informeN: number | null
                  numeroTxt: string
                  dateTxt: string
                  nombre: string
                  rcms: string[]
                  slug: string | null
                }>

              if (!informes.length) {
                return (
                  <Typography variant='body2' color='text.secondary'>
                    Sin informes generados manuales / digitales
                  </Typography>
                )
              }

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {informes.map(it => {
                    const isManual = it.modo === 'Manual'
                    const canViewPdf = !isManual && !!it.slug

                    return (
                      <Paper
                        key={it.key}
                        variant='outlined'
                        sx={{
                          p: 1.25,
                          borderRadius: 1.75,
                          bgcolor: isManual ? '#F1F1F1' : '#EFF6FF',
                          border: isManual ? '1px solid #595959' : '1px solid #DBEAFE'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <Chip
                              size='small'
                              label={it.numeroTxt}
                              sx={{ fontWeight: 900, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                            />

                            <Chip
                              size='small'
                              label={it.modo}
                              sx={
                                isManual
                                  ? { fontWeight: 900, bgcolor: '#595959', color: '#FFFFFF' }
                                  : theme => ({
                                    fontWeight: 900,
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                                    color: theme.palette.primary.main
                                  })
                              }
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
                            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                              {it.dateTxt}
                            </Typography>

                            {canViewPdf ? (
                              <Button
                                size='small'
                                variant='outlined'
                                onClick={e => {
                                  e.stopPropagation()
                                  const slug = it.slug

                                  if (!slug) return

                                  let url = `/api/informes/${slug}/mock`

                                  if (slug === 'densidad') {
                                    const params = new URLSearchParams()
                                    const codigoId = Number(codigoDialogMeta?.id)
                                    const repRcmId = Number(codigoDialogMeta?.representativeRcmId)

                                    if (Number.isFinite(codigoId) && codigoId > 0) params.set('codigoAgrupadorId', String(codigoId))
                                    if (Number.isFinite(repRcmId) && repRcmId > 0) params.set('rcmId', String(repRcmId))
                                    if (it.informeN != null) params.set('informe', String(it.informeN))
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
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                              >
                                Ver PDF
                              </Button>
                            ) : null}
                          </Box>
                        </Box>

                        <Typography variant='body2' sx={{ fontWeight: 800, mt: 0.75 }}>
                          {it.nombre}
                        </Typography>

                        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.25, fontWeight: 700 }}>
                          RCMs: {it.rcms.length ? it.rcms.join(', ') : '-'}
                        </Typography>
                      </Paper>
                    )
                  })}
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

                const extractDueTxt = (raw: string) => {
                  const s = String(raw ?? '')
                  const m = s.match(/\bvence(?:\s*fecha)?\s*:?\s*(\d{2}[\/-]\d{2}[\/-]\d{4}|\d{4}[\/-]\d{2}[\/-]\d{2})\b/i)

                  if (!m) return null
                  const v = String(m[1] ?? '').trim().replace(/\//g, '-')

                  if (!v) return null
                  if (/^\d{2}-\d{2}-\d{4}$/.test(v)) return v
                  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return formatDateDDMMYYYYDateOnly(v)
                  const d = new Date(v)

                  if (!isNaN(d.getTime())) return formatDateDDMMYYYYDateOnly(d.toISOString())

                  return v
                }

                const dueTxt = extractDueTxt(obs) ?? extractDueTxt(motivo)

                return { r, last, evTipo, evMotivo, obsLine, dueTxt }
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                              <Chip
                                size='small'
                                label={String(ev.evTipo ?? '').trim() || 'Evento'}
                                sx={theme => ({
                                  height: 22,
                                  fontWeight: 900,
                                  bgcolor: alpha(theme.palette.warning.main, 0.16),
                                  border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                                  color: theme.palette.warning.main
                                })}
                              />

                              {ev.evMotivo ? (
                                <Typography
                                  variant='caption'
                                  sx={{ fontWeight: 800, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                >
                                  {ev.evMotivo}
                                </Typography>
                              ) : null}
                            </Box>

                            {ev.obsLine ? (
                              <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                                {ev.obsLine}
                              </Typography>
                            ) : null}
                          </Box>
                        </Box>

                        {ev.dueTxt ? (
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            sx={{ fontWeight: 700, whiteSpace: 'nowrap', mt: 0.35 }}
                          >
                            Vence: {ev.dueTxt}
                          </Typography>
                        ) : null}

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
              const desc = String(informeDialogData?.descripcionServicio ?? informeDialogMeta?.descripcionServicio ?? '').trim()

              const firstEnsayo = (informeDialogData?.ensayos ?? [])?.[0]
              const firstSku = String(firstEnsayo?.sku ?? firstEnsayo?.producto?.sku ?? '').trim()
              const firstNombre = String(firstEnsayo?.nombre ?? firstEnsayo?.producto?.nombre ?? '').trim()
              const chipLabel = [firstSku, firstNombre].filter(Boolean).join(' ').trim()

              return (
                <>
                  <Typography variant='subtitle2' sx={theme => ({ fontWeight: 900, color: theme.palette.primary.main })}>
                    {[area, familia].filter(Boolean).join(' — ') || '—'}
                  </Typography>

                  {desc ? (
                    <Typography variant='caption' sx={{ fontWeight: 700, mt: 0.25, display: 'block', color: 'text.primary' }}>
                      {desc}
                    </Typography>
                  ) : null}

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
                      label={digitales === 0 ? '1 manual' : digitales === 1 ? '1 digital' : `${digitales} digitales`}
                      sx={theme => ({
                        fontWeight: 900,
                        color: digitales === 0 ? theme.palette.success.main : theme.palette.primary.main,
                        borderColor: digitales === 0 ? alpha(theme.palette.success.main, 0.5) : alpha(theme.palette.primary.main, 0.5),
                        bgcolor: digitales === 0 ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.primary.main, 0.08)
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
                      const tipoMaterial = String(r?.tipoMaterial ?? '').trim()
                      const item = String(r?.item ?? '').trim()
                      const tomaMuestra = String(r?.tomaMuestra ?? '').trim()

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

                      const infoItems = [
                        tipoMaterial,
                        item,
                        tomaMuestra
                      ].filter(Boolean)

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
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', minWidth: 0 }}>
                              {numero ? (
                                <Typography variant='caption' sx={{ fontWeight: 900, fontSize: '0.78rem' }}>
                                  {numero}
                                </Typography>
                              ) : null}

                              {numero && (rcmType || tarjeta || infoItems.length > 0) ? (
                                <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 400 }}>·</Typography>
                              ) : null}

                              {rcmType ? (
                                <Typography variant='caption' sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                  {rcmType.toUpperCase()}
                                </Typography>
                              ) : null}

                              {rcmType && (tarjeta || infoItems.length > 0) ? (
                                <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 400 }}>·</Typography>
                              ) : null}

                              {tarjeta ? (
                                <Typography variant='caption' sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                                  T: {tarjeta}
                                </Typography>
                              ) : null}

                              {tarjeta && infoItems.length > 0 ? (
                                <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 400 }}>·</Typography>
                              ) : null}

                              {infoItems.map((item, i) => (
                                <Box key={i} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600, fontSize: '0.73rem' }}>
                                    {item}
                                  </Typography>
                                  {i < infoItems.length - 1 ? (
                                    <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 400 }}>·</Typography>
                                  ) : null}
                                </Box>
                              ))}
                            </Box>

                            {opLabel ? (
                              <Chip
                                size='small'
                                label={opLabel}
                                sx={{
                                  fontWeight: 900,
                                  bgcolor: opInfo.bgcolor,
                                  border: `1px solid ${opInfo.border}`,
                                  color: opInfo.colorText,
                                  flexShrink: 0
                                }}
                              />
                            ) : null}
                          </Box>

                          {!ensayos.length ? null : (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                              {(() => {
                                const grouped = new Map<string, { count: number; estado: string | null }>()

                                for (const e of ensayos) {
                                  const existing = grouped.get(e.nombre)

                                  if (existing) {
                                    existing.count++
                                  } else {
                                    grouped.set(e.nombre, { count: 1, estado: e.estado })
                                  }
                                }

                                return Array.from(grouped.entries()).map(([nombre, { count, estado }]) => {
                                  const k = estado ?? undefined
                                  const info = getOperationalInfo(k)

                                  return (
                                    <Chip
                                      key={nombre}
                                      size='small'
                                      label={count > 1 ? `✓ ${nombre} x${count}` : `✓ ${nombre}`}
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
                                })
                              })()}
                            </Box>
                          )}
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
                    const draft = autoInformeDrafts?.[t.key] ?? emptyAutoDraft

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
                            {/* Fila 1: N° Informe · Anexo · Fecha de Emisión */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                              <TextField
                                label='N° INFORME *'
                                placeholder={t.key === 'DENSIDAD' ? 'Ej: 8990-001' : 'Ej: 7874-001'}
                                value={draft.numero}
                                onChange={e => {
                                  const v = e.target.value

                                  setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyAutoDraft), numero: v } }))
                                  if (informeDialogErrors.numero) setInformeDialogErrors(prev => ({ ...prev, numero: undefined }))
                                }}
                                size='small'
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                              />
                              <TextField
                                label='ANEXO'
                                placeholder='N° versión anterior'
                                value={draft.anexoPrev}
                                onChange={e => {
                                  const v = e.target.value

                                  setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyAutoDraft), anexoPrev: v } }))
                                }}
                                size='small'
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                              />
                              <TextField
                                label='FECHA DE EMISIÓN *'
                                type='date'
                                value={normalizeToInputDate(draft.fechaEmision)}
                                onChange={e => {
                                  const v = e.target.value

                                  setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyAutoDraft), fechaEmision: v } }))
                                }}
                                size='small'
                                fullWidth
                                inputProps={{ lang: 'es-CL' }}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Box>

                            {/* Fila 2 específica por plantilla */}
                            {t.key === 'DENSIDAD' ? (
                              <Box sx={{ mt: 2 }}>
                                <TextField
                                  label='RESULTADO ANÁLISIS *'
                                  placeholder='Ej: D.M.C.S 2160 Según Informe de Ensayo R-L-004-6/N° 0006/2026'
                                  value={draft.resultadoAnalisis}
                                  onChange={e => {
                                    const v = e.target.value

                                    setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyAutoDraft), resultadoAnalisis: v } }))
                                  }}
                                  size='small'
                                  fullWidth
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Box>
                            ) : (
                              <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                <TextField
                                  label='N° MUESTRA LAB. *'
                                  placeholder='Ej: M-01'
                                  value={draft.numeroMuestraLab}
                                  onChange={e => {
                                    const v = e.target.value

                                    setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyAutoDraft), numeroMuestraLab: v } }))
                                  }}
                                  size='small'
                                  fullWidth
                                  InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                  label='N° MUESTRA CLIENTE'
                                  placeholder='---'
                                  value={draft.numeroMuestraCliente}
                                  onChange={e => {
                                    const v = e.target.value

                                    setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyAutoDraft), numeroMuestraCliente: v } }))
                                  }}
                                  size='small'
                                  fullWidth
                                  InputLabelProps={{ shrink: true }}
                                />
                              </Box>
                            )}

                            {/* Fila 3: Observación General */}
                            <Box sx={{ mt: 2 }}>
                              <TextField
                                label='OBSERVACIÓN GENERAL'
                                placeholder=' '
                                value={draft.observacionGeneral}
                                onChange={e => {
                                  const v = e.target.value

                                  setAutoInformeDrafts(prev => ({ ...prev, [t.key]: { ...(prev?.[t.key] ?? emptyAutoDraft), observacionGeneral: v } }))
                                }}
                                size='small'
                                fullWidth
                                InputLabelProps={{ shrink: true }}
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
              Informes manuales
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
                    { id: nextId, numero: '', tipoInforme: '', fechaEmision: getTodayInputDate(), refCliente: '', observaciones: '', anexoPrev: '', rcms: defaultRcms }
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
                Haz click en + Añadir informe para agregar informes manuales.
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
                  const isSaved = Boolean((d as any).saved)
                  const isEditing = Boolean((d as any).isEditing)
                  const isLocked = isSaved && !isEditing


                  return (
                    <Paper
                      key={d.id}
                      variant='outlined'
                      sx={theme => ({
                        p: 1.25,
                        mb: 1.25,
                        borderRadius: 2,
                        borderColor: (d as any).saved
                          ? alpha(theme.palette.success.main, 0.55)
                          : isOk ? alpha(theme.palette.success.main, 0.55) : alpha(theme.palette.text.primary, 0.18),
                        bgcolor: (d as any).saved
                          ? alpha(theme.palette.success.main, 0.045)
                          : 'transparent'
                      })}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                          <CheckBoxOutlinedIcon sx={theme => ({ fontSize: 15, color: (d as any).saved ? theme.palette.success.main : isOk ? theme.palette.success.main : theme.palette.text.disabled })} />
                          <Typography variant='caption' sx={{ fontWeight: 800, whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                            Informe {idx + 1}
                          </Typography>
                          {(d as any).saved && d.numero && (
                            <Typography variant='caption' sx={theme => ({ fontWeight: 900, color: theme.palette.success.dark, ml: 0.5, fontSize: '0.78rem' })}>
                              — {d.numero}
                            </Typography>
                          )}
                          {isSaved && !isEditing && (
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, ml: 0.75 }}>
                              <Typography variant='caption' sx={theme => ({ color: theme.palette.success.main, fontWeight: 800, fontSize: '0.72rem' })}>
                                ✓ Guardado
                              </Typography>
                              <Button
                                size='small'
                                variant='text'
                                onClick={() => {
                                  setInformeDrafts(prev => prev.map(x => (x.id === d.id ? { ...x, isEditing: true } : x)))
                                }}
                                startIcon={<EditOutlinedIcon sx={{ fontSize: '0.9rem !important' }} />}
                                sx={{
                                  textTransform: 'none',
                                  minWidth: 0,
                                  px: 0.6,
                                  py: 0.1,
                                  fontSize: '0.72rem',
                                  lineHeight: 1.2,
                                  fontWeight: 700
                                }}
                              >
                                Editar
                              </Button>
                            </Box>
                          )}
                          {isSaved && isEditing && (
                            <Typography variant='caption' sx={theme => ({ color: theme.palette.warning.main, fontWeight: 800, ml: 0.75, fontSize: '0.72rem' })}>
                              ✎ Editando
                            </Typography>
                          )}
                        </Box>

                        <IconButton
                          size='small'
                          aria-label='Eliminar informe'
                          onClick={() => setInformeDrafts(prev => prev.filter(x => x.id !== d.id))}
                          sx={{ color: 'error.main', p: 0.25 }}
                          disabled={isSaved}
                        >
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700, display: 'block', mb: 0.6, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                          RCMs incluidos
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            <Button
                              size='small'
                              variant='outlined'
                              disabled={isLocked}
                              onClick={() => {
                                setInformeDrafts(prev =>
                                  prev.map(x =>
                                    x.id === d.id
                                      ? { ...x, rcms: Array.from(new Set(allRcms)) }
                                      : x
                                  )
                                )
                              }}
                              sx={{ textTransform: 'none', borderRadius: 1.5, fontSize: '0.72rem', py: 0.4, px: 1.25 }}
                            >
                              Seleccionar todos
                            </Button>
                            <Box
                              sx={theme => ({
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: selectedRcms.length > 0 ? alpha(theme.palette.warning.main, 0.2) : alpha(theme.palette.text.primary, 0.08),
                                border: `1.5px solid ${selectedRcms.length > 0 ? theme.palette.warning.main : alpha(theme.palette.text.primary, 0.12)}`,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                color: selectedRcms.length > 0 ? theme.palette.warning.main : theme.palette.text.secondary,
                              })}
                            >
                              {selectedRcms.length}
                            </Box>
                          </Box>

                          {allRcms.map((rcm: string) => {
                            const selected = selectedRcms.includes(rcm)

                            return (
                              <Box
                                key={rcm}
                                onClick={() => {
                                  if (isLocked) return
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
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.35,
                                  px: 0.75,
                                  py: 0.15,
                                  borderRadius: 1.5,
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.7rem',
                                  userSelect: 'none',
                                  ...(selected
                                    ? {
                                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                                      border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                                      color: theme.palette.primary.main,
                                    }
                                    : {
                                      bgcolor: alpha(theme.palette.text.primary, 0.04),
                                      border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
                                      color: theme.palette.text.secondary,
                                    })
                                })}
                              >
                                {selected
                                  ? <CheckBoxOutlinedIcon sx={{ fontSize: 13, color: 'inherit' }} />
                                  : <CheckBoxOutlineBlankIcon sx={{ fontSize: 13, color: 'inherit' }} />
                                }
                                {rcm}
                              </Box>
                            )
                          })}
                        </Box>

                        {!hasRcmsSelected ? (
                          <Typography variant='caption' sx={{ color: 'error.main', fontWeight: 700, mt: 0.4, display: 'block', fontSize: '0.68rem' }}>
                            Selecciona al menos 1 RCM para este informe
                          </Typography>
                        ) : null}
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1, mt: 2 }}>
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
                          disabled={isLocked}
                          error={!!informeDialogErrors.numero && idx === 0}
                          helperText={
                            idx === 0 && informeDialogErrors.numero
                              ? informeDialogErrors.numero
                              : d.anexoPrev
                                ? `corrección: ${d.anexoPrev}`
                                : undefined
                          }
                          InputProps={{ sx: { fontSize: '0.8rem' } }}
                          InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                        />
                        <TextField
                          label='TIPO DE INFORME'
                          placeholder='Ej: Análisis de Suelo x4'
                          value={(d as any).tipoInforme ?? ''}
                          onChange={e => {
                            const v = e.target.value

                            setInformeDrafts(prev => prev.map(x => (x.id === d.id ? { ...x, tipoInforme: v } : x)))
                          }}
                          size='small'
                          fullWidth
                          disabled={isLocked}
                          InputProps={{ sx: { fontSize: '0.8rem' } }}
                          InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                        />
                        <TextField
                          label='FECHA DE EMISIÓN'
                          type={isLocked ? 'text' : 'date'}
                          value={isLocked ? formatDateToDMY((d as any).fechaEmision) : normalizeToInputDate((d as any).fechaEmision)}
                          onChange={e => {
                            const v = e.target.value

                            setInformeDrafts(prev => prev.map(x => (x.id === d.id ? { ...x, fechaEmision: v } : x)))
                          }}
                          size='small'
                          fullWidth
                          disabled={isLocked}
                          inputProps={{ lang: 'es-CL' }}
                          InputProps={{ sx: { fontSize: '0.8rem' } }}
                          InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                        />
                      </Box>

                      <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
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
                          disabled={isLocked}
                          InputProps={{ sx: { fontSize: '0.8rem' } }}
                          InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
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
                          disabled={isLocked}
                          InputProps={{ sx: { fontSize: '0.8rem' } }}
                          InputLabelProps={{ shrink: true, sx: { fontSize: '0.75rem' } }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        {!isLocked ? (
                          <Button
                            variant='contained'
                            color='primary'
                            size='small'
                            disabled={!isOk || !hasRcmsSelected || savingDraftId === d.id}
                            onClick={() => handleSaveInformeDraft(d.id)}
                            startIcon={<CheckBoxOutlinedIcon sx={{ fontSize: '0.9rem !important' }} />}
                            sx={{ textTransform: 'none', borderRadius: 2, fontSize: '0.75rem', py: 0.4 }}
                          >
                            {savingDraftId === d.id ? 'Guardando…' : (isSaved ? 'Actualizar Informe' : 'Guardar Informe')}
                          </Button>
                        ) : (
                          <Typography variant='caption' sx={theme => ({ color: theme.palette.success.main, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.72rem' })}>
                            <CheckBoxOutlinedIcon sx={{ fontSize: 14 }} /> Guardado
                          </Typography>
                        )}
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
                      { id: nextId, numero: '', tipoInforme: '', fechaEmision: getTodayInputDate(), refCliente: '', observaciones: '', anexoPrev: '', rcms: defaultRcms }
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
                + Añadir informe
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
              <Box sx={{ mt: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 800 }}>
                  {requiresAutos
                    ? autosCompletos === applicableKeys.length
                      ? 'Informes listos para confirmar'
                      : pendientes > 0
                        ? 'Pendiente: faltan ensayos para completar informes'
                        : 'Completa los informes requeridos'
                    : manualAssigned > 0
                      ? 'Informes listos para confirmar'
                      : 'Añade al menos un informe'}
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
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {markDialogAction === 'EVENTO' || markDialogAction === 'CERRAR_EVENTO' ? (
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant='subtitle1' sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                    {markDialogAction === 'EVENTO' ? 'Registrar Evento' : 'Cerrar Evento'}
                  </Typography>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
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

        <DialogContent sx={{ pt: 0.5, overflowX: 'hidden' }}>
          <Divider sx={{ mb: 2 }} />

          {markDialogAction === 'EVENTO' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Box
                sx={theme => {
                  const currentState = markDialogRowId != null ? getCurrentStateForRow(markDialogRowId) : ''
                  const info = getOperationalInfo(currentState)

                  return {
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    whiteSpace: 'nowrap',
                    '& .MuiChip-root': {
                      bgcolor: info.bgcolor,
                      color: info.colorText,
                      border: `1px solid ${info.border}`,
                      fontWeight: 800,
                      borderRadius: 2,
                      textTransform: 'uppercase'
                    }
                  }
                }}
              >
                <Typography variant='overline' color='text.secondary' sx={{ lineHeight: 1, fontWeight: 900 }}>
                  ESTADO ACTUAL
                </Typography>
                <Box
                  sx={theme => ({
                    width: '1px',
                    alignSelf: 'stretch',
                    bgcolor: alpha(theme.palette.warning.main, 0.45)
                  })}
                />
                <Chip
                  size='small'
                  label={(() => {
                    const currentState = markDialogRowId != null ? getCurrentStateForRow(markDialogRowId) : ''


                    return OPERATIONAL_STATES.find(s => s.value === currentState)?.label ?? (currentState || '—')
                  })()}
                />
              </Box>
            </Box>
          )}

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
                  ¿A qué estado debe ir el CP? *
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
                    💡 El declarante envía el CP al estado donde se puede solucionar el problema.
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
                          '& .MuiChip-root': { fontWeight: 800 }
                        })}
                      >
                        {visible.map(opt => {
                          const st = OPERATIONAL_STATES.find(s => s.value === opt.value)
                          const info = getOperationalInfo(opt.value)
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
                                border: `1px solid ${selected ? alpha(String(info.border ?? theme.palette.primary.main), 0.8) : theme.palette.divider}`,
                                bgcolor: selected ? alpha(String(info.bgcolor ?? theme.palette.primary.main), 0.08) : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 0.75,
                                borderRadius: 2,
                                cursor: 'pointer',
                                minWidth: 0,
                                '&:hover': {
                                  bgcolor: selected
                                    ? alpha(String(info.bgcolor ?? theme.palette.primary.main), 0.10)
                                    : alpha(theme.palette.action.hover, 0.7)
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
                                      color: String(info.border ?? theme.palette.primary.main)
                                    }
                                  }
                                }}
                              />
                              <Chip
                                size='small'
                                label={st?.label ?? opt.value}
                                sx={{ bgcolor: info.bgcolor, color: info.colorText, border: `1px solid ${info.border}`, textTransform: 'uppercase' }}
                              />
                              <Typography
                                variant='caption'
                                color='text.secondary'
                                sx={{ fontWeight: 600, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
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
              {/* Tarjeta del evento activo */}
              <Paper
                variant='outlined'
                sx={theme => ({
                  p: 1.5,
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.error.main, 0.45),
                  bgcolor: alpha(theme.palette.error.main, 0.06)
                })}
              >
                {closeEventoLoading ? (
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                    Cargando evento…
                  </Typography>
                ) : closeEventoMeta ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <Chip
                            size='small'
                            label={closeEventoMeta.tipoLabel}
                            sx={theme => {
                              const main = theme.palette[closeEventoMeta.tone].main


                              return {
                                height: 22,
                                fontWeight: 900,
                                bgcolor: alpha(main, 0.16),
                                border: `1px solid ${alpha(main, 0.35)}`,
                                color: main,
                                borderRadius: 2
                              }
                            }}
                          />

                          {closeEventoMeta.motivoTitulo ? (
                            <Typography
                              variant='caption'
                              sx={{ fontWeight: 900, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {closeEventoMeta.motivoTitulo}
                            </Typography>
                          ) : null}
                        </Box>

                        {closeEventoMeta.descripcion ? (
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.35 }}>
                            {closeEventoMeta.descripcion}
                          </Typography>
                        ) : null}

                        {closeEventoMeta.registradoTxt ? (
                          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.6, fontWeight: 700 }}>
                            {closeEventoMeta.registradoTxt}
                          </Typography>
                        ) : null}
                      </Box>

                      {closeEventoMeta.venceTxt ? (
                        <Typography
                          variant='caption'
                          sx={theme => ({ fontWeight: 900, whiteSpace: 'nowrap', color: theme.palette.warning.main, mt: 0.1 })}
                        >
                          Vence: {closeEventoMeta.venceTxt}
                        </Typography>
                      ) : null}
                    </Box>
                  </>
                ) : (
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                    No se encontró información del evento activo.
                  </Typography>
                )}
              </Paper>

              {/* Estado actual del CP */}
              <Box
                sx={theme => {
                  return {
                    p: 1.25,
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.20)}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap'
                  }
                }}
              >
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900 }}>
                  Estado actual del CP:
                </Typography>
                <Chip
                  size='small'
                  label={(() => {
                    const currentState = markDialogRowId != null ? getCurrentStateForRow(markDialogRowId) : ''


                    return OPERATIONAL_STATES.find(s => s.value === currentState)?.label ?? (currentState || '—')
                  })()}
                  sx={() => {
                    const currentState = markDialogRowId != null ? getCurrentStateForRow(markDialogRowId) : ''
                    const info = getOperationalInfo(currentState)


                    return {
                      bgcolor: info.bgcolor,
                      color: info.colorText,
                      border: `1px solid ${info.border}`,
                      fontWeight: 900,
                      borderRadius: 2,
                      textTransform: 'uppercase'
                    }
                  }}
                />
              </Box>

              {/* Observación obligatoria */}
              <Box>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 900, display: 'block', mb: 0.75 }}>
                  ¿QUÉ SE HIZO PARA RESOLVER EL EVENTO? *
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
                  minRows={4}
                  placeholder='Describe la corrección o acción tomada...'
                  error={!!formErrors.observacion}
                  helperText={formErrors.observacion}
                />
              </Box>

              {/* Nota visual */}
              <Paper
                variant='outlined'
                sx={theme => ({
                  p: 1.25,
                  borderRadius: 2,
                  borderColor: theme.palette.divider,
                  bgcolor: alpha(theme.palette.action.hover, 0.75)
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckBoxOutlinedIcon fontSize='small' sx={theme => ({ color: theme.palette.success.main, mt: 0.15 })} />
                  <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 700 }}>
                    Al cerrar: el evento queda resuelto en el historial. El CP permanece en su estado actual — si necesitas avanzarlo, usa el botón de estado en la tabla.
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}

          {markDialogAction !== 'EVENTO' && markDialogAction !== 'CERRAR_EVENTO' &&
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
          {markDialogAction !== 'EVENTO' && markDialogAction !== 'CERRAR_EVENTO' &&
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
            startIcon={markDialogAction === 'CERRAR_EVENTO' ? <CheckCircleOutlineIcon fontSize='small' /> : undefined}
          >
            {savingHistory
              ? 'Guardando...'
              : markDialogAction === 'EVENTO'
                ? 'Confirmar'
                : markDialogAction === 'CERRAR_EVENTO'
                  ? 'Cerrar evento'
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
              <MenuItem onClick={() => openEditCpDialogFromRepresentativeRcmId(menuRowId)}>Editar CP</MenuItem>
              <MenuItem onClick={() => handleHistorial(menuRowId)}>Ver Historial</MenuItem>
              <MenuItem onClick={() => handleGoToCodificacion(menuRowId)}>Ir a codificación</MenuItem>
              <MenuItem
                onClick={() => handleRegistrarEvento(menuRowId)}
                disabled={!canRegistrarEvento}
                title={!canRegistrarEvento ? 'No aplica para estado Codificado' : undefined}
              >
                Registrar evento
              </MenuItem>
              {hasEvento ? <MenuItem onClick={() => handleCerrarEvento(menuRowId)}>Cierre Operativo</MenuItem> : null}
              <MenuItem disabled title='Generar Informe deshabilitado'>
                Generar Informe
              </MenuItem>
            </>
          )
        })()}
      </Menu>

      {/* Dialog: Editar CP */}
      <Dialog open={editCpOpen} onClose={closeEditCpDialog} maxWidth='sm' fullWidth>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                Editar CP — {editCpCodigoNombre || '—'}
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {editCpSubtitle || ' '}
              </Typography>
            </Box>

            <IconButton aria-label='Cerrar' onClick={closeEditCpDialog} size='small' disabled={editCpSaving}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 0.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontWeight: 900, mb: 0.75 }}>
                DESCRIPCIÓN DEL SERVICIO
              </Typography>
              <TextField
                value={editCpDescripcion}
                onChange={e => setEditCpDescripcion(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                disabled={editCpSaving}
              />
            </Box>

            <Box>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontWeight: 900, mb: 0.75 }}>
                NOTAS INTERNAS
              </Typography>
              <TextField
                value={editCpNotasInternas}
                onChange={e => setEditCpNotasInternas(e.target.value)}
                placeholder='Notas del controller o Jefe de Lab...'
                fullWidth
                multiline
                minRows={2}
                disabled={editCpSaving}
              />
            </Box>

            {editCpLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <CircularProgress size={22} />
              </Box>
            ) : null}

            {editCpError ? (
              <Typography variant='caption' sx={{ color: 'error.main', fontWeight: 700 }}>
                {editCpError}
              </Typography>
            ) : null}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEditCpDialog} sx={{ textTransform: 'none' }} disabled={editCpSaving}>
            Cancelar
          </Button>
          <Button variant='contained' onClick={saveEditCpDialog} sx={{ textTransform: 'none' }} disabled={editCpSaving}>
            {editCpSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Historial */}
      <Dialog fullWidth maxWidth='xl' open={histDialogOpen} onClose={handleCloseHistDialog}>
        <DialogTitle sx={{ pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Historial de cambios
              </Typography>
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

            if (!r) return null

            const code = String(histCodigoData?.codigoNombre ?? r?.codigoNombre ?? r?.numeroRcm ?? '').trim()
            const area = String((r as any)?.area ?? '').trim()
            const tipoServicio = String((r as any)?.familia ?? '').trim()

            const cliente =
              String(r?.cliente?.nombreCliente ?? (r as any)?.clienteNombre ?? (r as any)?.nombreCliente ?? '').trim() ||
              (typeof (r as any)?.cliente === 'string' ? String((r as any).cliente).trim() : '')

            const obraNum = String(r?.obra?.numeroObra ?? '').trim()
            const fechaCodTxt = formatDateDDMMYYDateOnlyDash((r as any)?.fechaCodificacion)

            const leftParts = [
              area || null,
              tipoServicio || null,
              cliente || null,
              obraNum ? `Obra ${obraNum}` : null
            ].filter(Boolean)

            return (
              <Paper
                variant='outlined'
                sx={theme => ({
                  mb: 2,
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.18),
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flex: 1 }}>
                    <Typography
                      variant='body2'
                      sx={{ fontWeight: 900, color: 'primary.main', whiteSpace: 'nowrap' }}
                    >
                      {code || '—'}
                    </Typography>
                    {leftParts.length ? (
                      <Typography
                        variant='body2'
                        color='text.primary'
                        sx={{ fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {leftParts.join(' · ')}
                      </Typography>
                    ) : null}
                  </Box>

                  <Box sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', fontWeight: 700 }}>
                      Fecha codificación
                    </Typography>
                    <Typography variant='body2' sx={{ fontWeight: 800 }}>
                      {fechaCodTxt}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )
          })()}

          {(() => {
            if (!histRowId) return null
            const r = data.find(d => d.representativeRcmId === histRowId) ?? data.find(d => d.id === histRowId)
            const currentState = getCurrentStateForRow(histRowId)
            const info = getOperationalInfo(currentState)

            const sinceHit = (histRowsWithStart ?? []).find((h: any) => {
              const est = normalizeStateForCompare(h?.estNuevo)


              return currentState && est === currentState
            })

            const sinceRaw =
              sinceHit?.fechaAccion ??
              sinceHit?.createdAt ??
              (r as any)?.fechaCodificacion ??
              (r as any)?.fechaMuestreo ??
              null

            const since = sinceRaw ? new Date(sinceRaw) : null

            const days = (() => {
              if (!since) return null
              const from = new Date(since.getFullYear(), since.getMonth(), since.getDate()).getTime()
              const now = new Date()
              const to = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
              const diff = Math.floor((to - from) / (24 * 60 * 60 * 1000))


              return Number.isFinite(diff) && diff >= 0 ? diff : null
            })()

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
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      desde {formatDateDDMMYYDateOnlyDash(since.toISOString())}{' '}
                      {typeof days === 'number' ? (
                        days === 0 ? (
                          <Typography component='span' variant='caption' color='text.secondary' sx={{ fontWeight: 800 }}>
                            (hoy)
                          </Typography>
                        ) : (
                          <Typography component='span' variant='caption' sx={{ fontWeight: 900, color: 'error.main' }}>
                            ({days} día{days === 1 ? '' : 's'})
                          </Typography>
                        )
                      ) : null}
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
          ) : !histRowsWithStart.length ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 700 }}>
                Sin registros
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              variant='outlined'
              sx={theme => ({
                overflowX: 'hidden',
                '& .MuiTableCell-root': {
                  fontSize: theme.typography.overline.fontSize,
                  py: 0.75,
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
                    <TableCell align='center' sx={{ width: 86 }}>
                      REGISTRO
                    </TableCell>
                    <TableCell align='center' sx={{ width: 110 }}>
                      FUNCIONARIO
                    </TableCell>
                    <TableCell align='center' sx={{ width: 86 }}>
                      APLICADO A
                    </TableCell>
                    <TableCell align='center' sx={{ width: 140 }}>
                      TIPO
                    </TableCell>
                    <TableCell align='center' sx={{ width: 124 }}>
                      EST. ANTERIOR
                    </TableCell>
                    <TableCell align='center' sx={{ width: 124 }}>
                      EST. NUEVO
                    </TableCell>
                    <TableCell align='center' sx={{ width: 160 }}>
                      MOTIVO
                    </TableCell>
                    <TableCell sx={{ width: 260 }}>OBSERVACIONES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {histRowsWithStart.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell align='center' sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                          <Typography
                            component='div'
                            variant='caption'
                            sx={{ fontWeight: 900, color: 'primary.main', lineHeight: 1.1, whiteSpace: 'nowrap' }}
                          >
                            {formatDateDDMMYYDateOnlyDash(h.fechaAccion)}
                          </Typography>
                          <Typography
                            component='div'
                            variant='caption'
                            color='text.secondary'
                            sx={{ lineHeight: 1.1, whiteSpace: 'nowrap' }}
                          >
                            {formatTimeHHmm(h.fechaAccion)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{h.funcionario ?? 'Usuario'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>CP</TableCell>
                      <TableCell>
                        {(() => {
                          const raw = String(h.tipo ?? '-')
                          const label = raw && raw !== 'null' && raw !== 'undefined' ? raw : '-'


                          return (
                            <Chip
                              label={label}
                              size='small'
                              variant='filled'
                              title={label}
                              sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                            />
                          )
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
                                  fontSize: '0.70rem',
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
                                  fontSize: '0.70rem',
                                  borderRadius: 2,
                                  px: 1,
                                  py: 0.4
                                }}
                              />
                            </Box>
                          )
                        })()}
                      </TableCell>
                      <TableCell>{h.motivo ?? '-'}</TableCell>
                      <TableCell
                        title={typeof h.observacion === 'string' ? h.observacion : h.observacion == null ? '' : String(h.observacion)}
                        sx={{
                          whiteSpace: 'normal',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word'
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


