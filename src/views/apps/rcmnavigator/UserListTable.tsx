'use client'

// ...existing code...
import { useEffect, useState, useMemo } from 'react'

// Next Imports

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
import { styled, alpha } from '@mui/material/styles'
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

import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItemMUI from '@mui/material/MenuItem' // avoid name clash if MenuItem used above
import FormHelperText from '@mui/material/FormHelperText'
import { OPERATIONAL_STATES } from '@/constants/operationalStates'
import ADMINISTRATIVE_STATES from '../../../constants/administrativeStates'

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/table-core'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// ...existing code...
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

// RCM type (kept)
interface RCM {
  id: number
  // Tabla principal ahora muestra Códigos Producto (agrupadores)
  codigoNombre?: string | null
  ss?: string | null
  totalRcms?: number | null
  conEvento?: boolean
  informe?: number | null
  ensayos?: { ensayados: number; total: number } | null
  estadoOperativoCounts?: Record<string, number>
  estadoAdministrativoCounts?: Record<string, number>
  ciudad?: string | null
  representativeRcmId?: number | null

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
  estadoOperativo?: string
  estadoAdministrativo?: string
  areaId?: number | null
  areaName?: string | null
  familia?: string | null
}

// Component
const columnHelper = createColumnHelper<RCM>()

const UserListTable2 = ({
  filters,
  onSelectCodigo,
  forceShowSs,
  onForceShowSsChange
}: {
  filters?: Filters
  onSelectCodigo?: (codigoAgrupadorId: number) => void
  forceShowSs?: boolean
  onForceShowSsChange?: (next: boolean) => void
}) => {
  const [data, setData] = useState<RCM[]>([])
  const [filteredData, setFilteredData] = useState<RCM[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [savingHistory, setSavingHistory] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    eventType?: string
    motivo?: string
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
    // bg en formato #RRGGBBAA (20 hex = ~12% alpha)
    const bg = `${color}20`
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

  // simple cache en memoria para historial por RCM (evita refetchs)
  const historyCache: Map<number, any[]> = (global as any).__RCM_HISTORY_CACHE__ || new Map()
    ; (global as any).__RCM_HISTORY_CACHE__ = historyCache

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
    // acciones que requieren diálogo (incluye las que ahora exigen observación obligatoria)
    const ACTIONS_REQUIRING_DIALOG = new Set([
      'DIGITADO',
      'EVENTO',
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
    const finalFuncionario = (typeof window !== 'undefined' && (window as any).__USER_NAME__) ? (window as any).__USER_NAME__ : 'Usuario'

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
      if (rcmId == null) return
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
        funcionario: (typeof window !== 'undefined' && (window as any).__USER_NAME__) ? (window as any).__USER_NAME__ : null,
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
  }

  // Fetch Códigos Producto (seguimiento)
  useEffect(() => {
    const fetchCodigos = async () => {
      try {
        const res = await fetch('/api/codigo-agrupador/seguimiento')
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

          const adMain = pickStateFromCounts(adCounts, ['PAGADO', 'PENDIENTE', 'FACTURADO', 'ENVIADO'])

          const clienteNombre = r?.cliente?.razonSocial ?? r?.cliente?.nombreCliente ?? null
          const comuna = r?.ciudad ?? r?.obra?.comuna ?? r?.cliente?.comuna ?? r?.cliente?.ciudad ?? null

          return {
            id: Number(r.id),
            numeroRcm: String(r.codigoNombre ?? ''),
            codigoNombre: r.codigoNombre ?? null,
            representativeRcmId: (r?.representativeRcmId ?? null) as number | null,
            ss: r.ss ?? null,
            ot: r.ot ?? null,
            totalRcms: r.totalRcms ?? 0,
            conEvento: Boolean(r.conEvento),
            informe: (r.informe ?? null) as number | null,
            ensayos: r.ensayos ?? null,
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
    }

    fetchCodigos()
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

  const applyDateFilter = (rows: RCM[], filters?: Filters) => {
    console.log('applyDateFilter called, rows:', rows.length, 'filters:', filters)

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

    console.log('applyDateFilter -> using date field:', fieldName)

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

    // Estado Operativo filtering (if provided)
    if (filters && filters.estadoOperativo) {
      const qKey = normalizeStateKey(filters.estadoOperativo)
      const qNorm = normalizeText(filters.estadoOperativo)
      result = result.filter(r => {
        const counts = r.estadoOperativoCounts
        if (qKey && counts && (counts[qKey] ?? 0) > 0) return true
        return normalizeText(r.estadoOperativo ?? '').includes(qNorm)
      })
    }

    // Estado Administrativo filtering (if provided)
    if (filters && filters.estadoAdministrativo) {
      const qKey = normalizeStateKey(filters.estadoAdministrativo)
      const qNorm = normalizeText(filters.estadoAdministrativo)
      result = result.filter(r => {
        const counts = r.estadoAdministrativoCounts
        if (qKey && counts && (counts[qKey] ?? 0) > 0) return true
        return normalizeText(r.estadoAdministrativo ?? '').includes(qNorm)
      })
    }

    // Area filtering: comparar por nombre (Header entrega areaName)
    const areaValue = (filters as any)?.areaName ?? null
    if (areaValue !== null && typeof areaValue !== 'undefined' && String(areaValue).trim() !== '') {
      const rawNorm = normalizeText(areaValue)
      result = result.filter(r => normalizeText(r.area ?? '').includes(rawNorm))
    }

    // Familia filtering: comparar por nombre
    const familiaValue = (filters as any)?.familia ?? null
    if (familiaValue !== null && typeof familiaValue !== 'undefined' && String(familiaValue).trim() !== '') {
      const rawNorm = normalizeText(familiaValue)
      result = result.filter(r => normalizeText(r.familia ?? '').includes(rawNorm))
    }

    console.log('applyDateFilter result count:', result.length)
    setFilteredData(result)
  }

  // SS se repite mucho: mostrar columna solo cuando aporte contexto.
  // Regla: mostrar si hay >1 SS distinto, o si hay mezcla de (un SS + vacíos).
  const showSsColumnAuto = useMemo(() => {
    const rawValues = filteredData.map(r => String(r.ss ?? '').trim())
    const nonEmpty = rawValues.filter(Boolean)

    // No hay SS en el dataset actual -> no mostrar
    if (nonEmpty.length === 0) return false

    const distinct = new Set(nonEmpty)
    if (distinct.size > 1) return true

    // Un solo SS pero hay filas sin SS -> mostrar para detectar la diferencia
    const hasEmpty = rawValues.some(v => !v)
    return hasEmpty
  }, [filteredData])

  const showSsColumn = Boolean(forceShowSs) || showSsColumnAuto

  const columns = useMemo((): ColumnDef<RCM>[] => {
    const ssColumn: ColumnDef<RCM> = {
      id: 'ss',
      header: 'SS',
      accessorKey: 'ss',
      cell: ({ row }) => <Typography variant='body2'>{row.original.ss ?? '-'}</Typography>
    }

    return [
      {
        id: 'codigo',
        header: 'CÓDIGO',
        accessorFn: r => r.codigoNombre ?? r.numeroRcm,
        cell: ({ row }) => <Typography variant='body2' sx={{ fontWeight: 700 }}>{row.original.codigoNombre ?? row.original.numeroRcm}</Typography>
      },
      ...(showSsColumn ? [ssColumn] : []),
      {
        id: 'ot',
        header: 'OT',
        accessorKey: 'ot',
        cell: ({ row }) => <Typography variant='body2'>{row.original.ot ?? '-'}</Typography>
      },
      {
        id: 'fechaCod',
        header: 'FECHA COD.',
        accessorKey: 'fechaCodificacion',
        sortingFn: (rowA, rowB, columnId) => {
          const aRaw = rowA.getValue(columnId) as any
          const bRaw = rowB.getValue(columnId) as any
          const aTime = aRaw ? new Date(aRaw).getTime() : 0
          const bTime = bRaw ? new Date(bRaw).getTime() : 0
          return aTime === bTime ? 0 : aTime > bTime ? 1 : -1
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
        id: 'ciudad',
        header: 'CIUDAD',
        accessorFn: r => r.ciudad ?? r.cliente?.comuna ?? (r as any).comuna ?? '-',
        cell: ({ row }) => <Typography variant='body2'>{(row.getValue('ciudad') as string) ?? '-'}</Typography>
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
        accessorKey: 'totalRcms',
        cell: ({ row }) => <span>{row.original.totalRcms ?? 0}</span>
      },
      {
        id: 'estOp',
        header: 'EST. OPERATIVO',
        accessorKey: 'estadoOperativo',
        cell: ({ row }) => {
          const opRaw = row.original.estadoOperativo ?? null
          const opLabel = opRaw ? (OPERATIONAL_STATES.find(s => s.value === opRaw)?.label ?? opRaw) : '-'
          const info = getOperationalInfo(opRaw ?? undefined)
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Chip
                label={opLabel}
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
        id: 'estadoAdministrativo',
        header: 'EST. ADM.',
        accessorKey: 'estadoAdministrativo',
        cell: ({ row }) => {
          const raw = row.original.estadoAdministrativo ?? row.original.estado_administrativo ?? ''
          const label = (typeof raw === 'string' && raw.trim()) ? raw : String(raw)
          const info = getAdministrativeInfo(label)
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Chip
                label={label || '-'}
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
        id: 'informe',
        header: 'N° INFORME',
        accessorKey: 'informe',
        cell: ({ row }) => <span>{row.original.informe ?? '-'}</span>
      },
      {
        id: 'acciones',
        header: 'ACCIONES',
        cell: ({ row }) => (
          <Box onClick={e => e.stopPropagation()} sx={{ display: 'inline-flex', justifyContent: 'center' }}>
            <IconButton
              size='small'
              title='Ver detalle'
              onClick={e => {
                e.stopPropagation()
                onSelectCodigo?.(row.original.id)
              }}
            >
              <VisibilityIcon fontSize='small' />
            </IconButton>

            <IconButton
              size='small'
              title='Marcar'
              disabled={!row.original.representativeRcmId}
              onClick={e => {
                e.stopPropagation()
                if (!row.original.representativeRcmId) return
                handleOpenMarkMenu(e as any, row.original.representativeRcmId)
              }}
            >
              <CheckBoxOutlinedIcon fontSize='small' />
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
  }, [onSelectCodigo, showSsColumn])

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

  const table = useReactTable({
    data: searchedData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
      global: fuzzyFilter
    } as any,
    initialState: {
      sorting: [{ id: 'fechaCod', desc: true }]
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })


  // reemplazado: indicadores usando OPERATIONAL_STATES.value para comparaciones
  const indicators = useMemo(() => {
    const total = searchedData.length

    // helper: normalizar estado operativo a valor comparable (por ejemplo "CODIFICADO" / "EN_PROCESO")
    const normOp = (raw?: string) => {
      if (!raw) return ''
      // usamos la función existente para normalizar (genera UPPERCASE)
      const u = normalizeState(raw)
      // si el usuario pasó una label en texto (g. ej. "Codificado"), intentar mapear a value
      const byValue = OPERATIONAL_STATES.find(s => s.value === u)
      if (byValue) return byValue.value
      // intentar mapear por label (sin tildes / case)
      const rawNorm = (raw ?? '').toString().normalize?.('NFD')?.replace(/[\u0300-\u036f]/g, '').toLowerCase() ?? String(raw).toLowerCase()
      const byLabel = OPERATIONAL_STATES.find(s => (s.label ?? '').toString().normalize?.('NFD')?.replace(/[\u0300-\u036f]/g, '').toLowerCase() === rawNorm)
      if (byLabel) return byLabel.value
      // fallback: devolver UPPERCASE original para comparaciones textuales
      return u
    }

    const normAdmText = (s?: string) => normalizeText(s ?? '')

    // sets para cada tarjeta basadas en OPERATIONAL_STATES.value
    const S = {
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
      searchedData.reduce((acc, d) => {
        const opRaw = d.estadoOperativo ?? (Array.isArray(d.servicios) && d.servicios.length ? (d.servicios[0] as any).estado : '') ?? ''
        const admRaw = d.estadoAdministrativo ?? ''
        const opVal = normOp(opRaw)
        const adm = normAdmText(admRaw)
        return acc + (pred(opVal, adm) ? 1 : 0)
      }, 0)

    // Por Ensayar: estados CODIFICADO o EN_PROCESO (o admin menciona 'ensayar'/'codificado')
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
    const porRevisar = countIf(op => op === S.DIGITADO)

    // Por Corregir: estado EVENTO 
    const porCorregir = countIf(op => op === S.EVENTO)

    // Por Firmar: estado FIRMADO (o admin menciona 'firmado' pero no enviado)
    const porFirmar = countIf(op => op === S.REVISADO)

    // Por Enviar (Firmados): estado ENVIADO o admin contiene 'enviar' + 'firmad'
    const porEnviarFirmados = countIf(op => op === S.FIRMADO)

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
  }, [searchedData])

  if (loading) return <div>Cargando...</div>

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
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 2 }}>
        {[
          { label: 'Por Ensayar', value: indicators.porEnsayar },
          { label: 'Por Digitar', value: indicators.porDigitar },
          { label: 'Por Revisar', value: indicators.porRevisar },
          { label: 'Por Corregir', value: indicators.porCorregir },
          { label: 'Por Firmar', value: indicators.porFirmar },
          { label: 'Por Enviar Cliente', value: indicators.porEnviarFirmados },
          { label: 'Pagados Pendiente de Envío', value: indicators.firmadosPagados }
        ].map(item => (
          <Box
            key={item.label}
            sx={{
              minWidth: 140,
              backgroundColor: '#fff',
              borderRadius: 1,
              boxShadow: 1,
              p: 1.25,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
          >
            <Typography variant='caption' color='text.secondary'>
              {item.label}
            </Typography>
            <Typography variant='h6' sx={{ fontWeight: 700 }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider />

      {/* Toolbar row: Mostrar/Ocultar SS + Buscar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, gap: 2 }}>
        <Button
          variant='text'
          size='small'
          onClick={() => onForceShowSsChange?.(!Boolean(forceShowSs))}
          disabled={!onForceShowSsChange}
          title='Mostrar/ocultar columna SS'
          sx={{ whiteSpace: 'nowrap' }}
        >
          {forceShowSs ? 'Ocultar' : 'Mostrar'}
        </Button>

        <Box sx={{ width: 300 }}>
          <DebouncedInput
            value={globalFilter}
            onChange={(v: any) => {
              setGlobalFilter(String(v))
            }}
            placeholder='Buscar CÓDIGO, SS, OT, ÁREA, SERVICIO...'
            fullWidth
            size='small'
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
              <tr
                key={row.id}
                onClick={() => {
                  onSelectCodigo?.(row.original.id)
                }}
                style={{ cursor: onSelectCodigo ? 'pointer' : 'default' }}
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

      {/* Dialog: Form "Estado Muestra" para acciones (Digitado, EVENTO, CERRADO_OP, ...) */}
      <Dialog open={markDialogOpen} onClose={handleCancelMarkDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Estado Muestra</DialogTitle>
        <DialogContent>
          {markDialogAction === 'DIGITADO' && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <FormControl fullWidth size='small'>
                <InputLabel id='mark-action-label'>Acción</InputLabel>
                <Select labelId='mark-action-label' value={markDialogAction ?? ''} label='Acción' disabled>
                  <MenuItemMUI value='DIGITADO'>Digitado</MenuItemMUI>
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

          {(markDialogAction === 'EVENTO' || markDialogAction === 'CERRADO_OP') && (
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
                    <MenuItemMUI value={markDialogAction ?? ''}>

                      {OPERATIONAL_STATES.find(s => s.value === markDialogAction)?.label ?? markDialogAction}
                    </MenuItemMUI>
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
                    <MenuItemMUI value='INFO_PENDIENTE'>Información Pendiente</MenuItemMUI>
                    <MenuItemMUI value='ERROR_INTERNO'>Error Interno</MenuItemMUI>
                    <MenuItemMUI value='CORRECCION'>Corrección</MenuItemMUI>
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
                  <MenuItemMUI value={markDialogAction ?? ''}>
                    {OPERATIONAL_STATES.find(s => s.value === markDialogAction)?.label ?? markDialogAction}
                  </MenuItemMUI>
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
        <MenuItem onClick={() => handleEdit(menuRowId)}>Editar</MenuItem>
        <MenuItem onClick={() => handleHistorial(menuRowId)}>Ver Historial</MenuItem>
        <MenuItem disabled title="Generar Informe deshabilitado">Generar Informe</MenuItem>
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
                const r = data.find(d => d.representativeRcmId === histRowId)
                const code = (r?.codigoNombre ?? r?.numeroRcm ?? '').toString().trim()
                const obraName = (r?.obra?.nombreObra ?? '').toString().trim()
                const obraNum = (r?.obra?.numeroObra ?? '').toString().trim()
                const obraTxt = obraName || obraNum ? `${obraName || obraNum}` : ''
                const parts = [code, obraTxt].filter(Boolean)
                if (!parts.length) return null
                return (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {parts.join(' - ')}
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
            const stateFromRow = getCurrentStateForRow(histRowId)
            const stateFromHistory = normalizeStateForCompare((histRows ?? [])[0]?.estNuevo)
            const currentState = stateFromRow || stateFromHistory || ''
            const currentInfo = getOperationalInfo(currentState)
            // histRows está ordenado desc; primer match es el último cambio hacia el estado actual
            const sinceEntry = (histRows ?? []).find(h => normalizeStateForCompare(h?.estNuevo) === normalizeStateForCompare(currentState))
            const sinceDate = sinceEntry?.fechaAccion ?? null
            const days = sinceDate ? daysBetween(sinceDate, new Date()) : null
            const desdeTxt = sinceDate ? formatDateDDMMYYYYDateOnlyDash(sinceDate) : null

            const metaRow = data.find(d => d.representativeRcmId === histRowId)
            const eventoActivo = Boolean(metaRow?.conEvento) || normalizeState(currentState) === 'EVENTO'

            return (
              <Paper
                variant='outlined'
                sx={theme => ({
                  p: 2,
                  mt: 1,
                  mb: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.16),
                  borderColor: alpha(theme.palette.warning.main, 0.35)
                })}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
                    <Typography variant='caption' sx={{ fontWeight: 600 }}>
                      Estado actual:
                    </Typography>
                    <Chip
                      label={currentState || '-'}
                      size='small'
                      variant='filled'
                      sx={{
                        bgcolor: currentInfo.bgcolor,
                        color: currentInfo.colorText,
                        border: `1px solid ${currentInfo.border}`,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        borderRadius: 2
                      }}
                    />
                    {desdeTxt && (
                      <Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
                        desde {desdeTxt}{days != null ? ` (${days} días)` : ''}
                      </Typography>
                    )}
                  </Box>

                  {eventoActivo && <Chip size='small' color='error' label='1 evento activo' />}
                </Box>
              </Paper>
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
                    <TableCell align='center' sx={{ width: 112 }}>REGISTRO</TableCell>
                    <TableCell align='center' sx={{ width: 120 }}>FUNCIONARIO</TableCell>
                    <TableCell align='center' sx={{ width: 176 }}>TIPO</TableCell>
                    <TableCell align='center' sx={{ width: 176 }}>EST. ANTERIOR</TableCell>
                    <TableCell align='center' sx={{ width: 176 }}>EST. NUEVO</TableCell>
                    <TableCell align='center' sx={{ width: 140 }}>MOTIVO</TableCell>
                    <TableCell align='center' sx={{ width: 90 }}>INFORME</TableCell>
                    <TableCell align='center' sx={{ width: 112 }}>FEC. ACCIÓN</TableCell>
                    <TableCell sx={{ width: 260 }}>OBSERVACIONES</TableCell>
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
                      <TableCell>{h.funcionario}</TableCell>
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
                      <TableCell>{h.motivo ?? '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.informe ?? '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateDDMMYYYYDateOnlyDash(h.fechaAccion)}</TableCell>
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


