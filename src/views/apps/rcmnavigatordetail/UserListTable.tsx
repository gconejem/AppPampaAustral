'use client'

// React Imports
import { useState, useMemo, useEffect } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

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

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'

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
  }
  muestra?: {
    id?: number
    numeroMuestra: string
    cantidad: number
    estado?: string
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
    }
  }
  rcmOriginalId?: number
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
    // bg en formato #RRGGBBAA (20 hex = ~12% alpha)
    const bg = `${color}20`
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
    const s = r.estadoOperativo ?? (Array.isArray(r.servicios) && r.servicios.length ? (r.servicios[0] as any).estado : '')
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
      setData(prev => prev.map(d => (d.id === rowId ? { ...d, estadoOperativo: action } : d)))

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
      setData(prev => prev.map(d => (d.id === rowId ? { ...d, estadoOperativo: prevState } : d)))
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
      setData(prev => prev.map(d => (d.id === rcmId ? { ...d, estadoOperativo: payload.estNuevo ?? d.estadoOperativo } : d)))
      setFilteredData(prev => prev.map(d => (d.id === rcmId ? { ...d, estadoOperativo: payload.estNuevo ?? d.estadoOperativo } : d)))

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

    console.log('🔍 handleEdit - Datos para encoder:', {
      rowId,
      rcmId,
      rcmOriginalId: row.rcmOriginalId,
      otId,
      ordenTrabajo: row.ordenTrabajo
    })

    // ✅ CORRECCIÓN: construir URL correcta para encoder
    const params = new URLSearchParams()
    params.set('rcmId', String(rcmId))
    if (otId) params.set('otId', String(otId))
    if (opts?.readonly) params.set('readonly', '1')

    const target = `${window.location.origin}/en/apps/encoder?${params.toString()}`

    console.log('🚀 Redirecting to encoder:', target)

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
      console.groupEnd()
      return
    }

    // ✅ Abrir formulario y cargar datos
    console.log('🔓 Abriendo formulario')
    setSelectedRowId(row.id)
    setServiciosMuestra([])
    setMuestraDetalle(null)
    setLoadingServicios(true)

    try {
      const muestraId = row.muestra.id
      const url = `/api/muestra/${muestraId}/servicios`

      console.log('📡 Fetching:', url)

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

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

      setMuestraDetalle(data.muestra)
      setServiciosMuestra(data.servicios || [])
    } catch (err) {
      console.error('❌ Error loading servicios:', err)
      setServiciosMuestra([])
      setMuestraDetalle(null)
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
        funcionario: (typeof window !== 'undefined' && (window as any).__USER_NAME__)
          ? (window as any).__USER_NAME__
          : 'Usuario',
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
        const res = await fetch('/api/rcm')
        const result = await res.json()
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
              ordenTrabajo: ordenTrabajoNormalized,
              ordenTrabajoId: ordenTrabajoNormalized.id,

              fechaCodificacion: r.fechaCodificacion,
              fechaMuestreo: r.fechaMuestreo,
              estadoOperativo: muestra.estado ?? servicioRCM?.estado ?? r.estadoOperativo ?? '',
              estadoAdministrativo: r.estadoAdministrativo ?? r.estado_administrativo ?? '',
              cliente: {
                nombreCliente: clienteNombre ?? null,
                comuna: clienteComuna ?? null,
                raw: rawCliente ?? null
              },
              area: areaFinal,
              familia: familiaFinal,
              muestra: {
                id: muestra.id,
                numeroMuestra: muestra.numeroMuestra || '-',
                cantidad: muestra.cantidad ?? 1,
                estado: muestra.estado,
                numeroTarjeta: muestra.numeroTarjeta ?? muestra.numero_tarjeta ?? null, // ← agregar aquí también
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
        console.log('Primeros 3 registros completos:', JSON.stringify(normalized.slice(0, 3), null, 2))
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

    // Estado Operativo filtering (if provided) — case-insensitive contains
    if (filters && filters.estadoOperativo) {
      const q = String(filters.estadoOperativo).toLowerCase()
      result = result.filter(r => {
        const op = (r.estadoOperativo ?? (Array.isArray(r.servicios) && r.servicios.length ? (r.servicios[0] as any).estado : '') ?? '')
        return String(op).toLowerCase().includes(q)
      })
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
        id: 'muestra',
        header: 'MUESTRA',
        accessorFn: (r: any) => r.muestra?.numeroMuestra || '-',
        cell: ({ row }: any) => {
          const numeroMuestra = row.original.muestra?.numeroMuestra || '-'
          return (
            <Typography variant='body2' sx={{ fontSize: '0.875rem' }}>
              {numeroMuestra}
            </Typography>
          )
        }
      },
      {
        id: 'rcm',
        header: 'RCM',
        accessorKey: 'numeroRcm',
        cell: ({ row }) => {
          const numeroRcm = row.original.numeroRcm || '-'
          return (
            <Typography variant='body2' sx={{ fontSize: '0.875rem' }}>
              {numeroRcm}
            </Typography>
          )
        }
      },
      {
        id: 'ot',
        header: 'OT',
        accessorKey: 'ot', // ✅ ahora usa 'ot' directamente (que es otDisplay)
        cell: ({ row }: any) => {
          const ot = row.original.ot
          if (ot) {
            return <Typography variant='body2'>{ot}</Typography>
          }
          // Fallback: mostrar ID si existe pero sin correlativo
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
        id: 'fechaCod',
        header: 'Fecha Cod.',
        accessorKey: 'fechaCodificacion',
        cell: ({ row }) => <span>{row.original.fechaCodificacion ? new Date(row.original.fechaCodificacion).toLocaleDateString() : '-'}</span>
      },
      {
        id: 'fechaMues',
        header: 'Fecha Mues.',
        accessorKey: 'fechaMuestreo',
        cell: ({ row }) => {
          const val = row.original.fechaMuestreo ?? row.original.fecha_muestreo
          return <span>{val ? new Date(val).toLocaleDateString('es-CL') : '-'}</span>
        }
      },
      {
        id: 'numeroTarjeta',
        header: 'N° TAR',
        accessorKey: 'numeroTarjeta', // ✅ cambiar a accessorKey simple
        cell: ({ row }) => {
          const val = row.original.numeroTarjeta
          return <span>{val ?? '-'}</span>
        }
      },
      {
        id: 'area',
        header: 'ÁREA',
        accessorKey: 'area',
        cell: ({ row }) => {
          const val = row.original.area
          return <span>{val ?? '-'}</span>
        }
      },
      {
        id: 'familia',
        header: 'FAMILIA',
        accessorKey: 'familia',
        cell: ({ row }) => {
          const val = row.original.familia
          return <span>{val ?? '-'}</span>
        }
      },
      {
        id: 'cantidadMuestras',
        header: '# MUES.',
        accessorFn: r => r.muestra?.cantidad ?? 1,
        cell: ({ row }) => {
          const val = row.original.muestra?.cantidad ?? 1
          return <span>{val}</span>
        }
      },
      {
        id: 'estOp',
        header: 'EST. OPERATIVO',
        accessorKey: 'estadoOperativo',
        cell: ({ row }) => {
          const op = row.original.estadoOperativo ?? row.original.muestra?.estado ?? row.original.muestra?.servicio?.estado
          const info = getOperationalInfo(op)
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Chip

                label={op ?? '-'}
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
        cell: ({ row }) => (
          <Stack direction='row' spacing={1}>
            <IconButton
              size='small'
              title='Ver'
              onClick={(e) => {
                e.stopPropagation()
                console.log('👁️ Ver clicked - row.original:', row.original)

                // ✅ CORRECCIÓN: pasar row.original directamente (no el ID)
                handleView(row.original)
              }}
            >
              <VisibilityIcon fontSize='small' />
            </IconButton>

            <IconButton
              size='small'
              title='Marcar'
              onClick={(e) => {
                e.stopPropagation()
                handleOpenMarkMenu(e, row.original.id)
              }}
            >
              <CheckBoxOutlinedIcon fontSize='small' />
            </IconButton>

            <IconButton
              size='small'
              title='Más'
              onClick={e => {
                e.stopPropagation()
                // ✅ CORRECCIÓN: Pasar row.id (no rcmOriginalId)
                handleOpenRowMenu(e, row.original.id)
              }}
            >
              <MoreVertIcon fontSize='small' />
            </IconButton>
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
        'MUESTRA',
        'RCM',
        'OT',
        'Fecha Cod.',
        'Fecha Mues.',
        'N° TAR',
        'ÁREA',
        'FAMILIA',
        '# MUES.',
        'EST. OPERATIVO'
        // ELIMINADO: 'EST. ADM'
      ]

      const rows = selectedRows.map((row: any) => [
        row.muestra?.numeroMuestra ?? '-',
        row.numeroRcm ?? '-',
        row.ot ?? '-',
        row.fechaCodificacion ? new Date(row.fechaCodificacion).toLocaleDateString('es-CL') : '-',
        row.fechaMuestreo ? new Date(row.fechaMuestreo).toLocaleDateString('es-CL') : '-',
        row.numeroTarjeta ?? '-',
        row.area ?? '-',
        row.familia ?? '-',
        row.muestra?.cantidad ?? 1,
        row.estadoOperativo ?? '-'
        // ELIMINADO: row.estadoAdministrativo ?? '-'
      ].map(v => '"' + String(v).replace(/"/g, '""') + ''))

      const headerRow = headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(',')
      const csv = [headerRow, ...rows.map(r => r.join(','))].join('\r\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'rcms_selected_export.csv'
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

  if (loading) return <div>Cargando...</div>

  return (
    <Card>
      <CardHeader />

      <Divider />

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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
        <Button
          variant='contained'
          startIcon={<i className='ri-download-line' />}
          onClick={handleExport}
          disabled={selectedCount === 0}
        >
          Exportar ({selectedCount})
        </Button>

        <DebouncedInput
          value={globalFilter ?? ''}
          onChange={value => setGlobalFilter(String(value))}
          placeholder='Buscar Muestras...'
          sx={{ width: 300 }}
        />
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

      {/* Tabla de Servicios - Mostrar debajo de la tabla principal */}
      {selectedRowId && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ px: 3, pb: 3 }}>
            {/* Header con título, número de tarjeta y botón cerrar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h6'>
                  Muestra #{findRowById(selectedRowId)?.muestra?.numeroMuestra ?? selectedRowId}
                </Typography>
                {(() => {
                  const row = findRowById(selectedRowId)
                  const numeroTarjeta = row?.numeroTarjeta ?? row?.muestra?.numeroTarjeta

                  if (numeroTarjeta) {
                    return (
                      <Chip
                        label={`N° Tarjeta: ${numeroTarjeta}`}
                        size='small'
                        variant='outlined'
                        color='primary'
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          px: 1
                        }}
                      />
                    )
                  }
                  return null
                })()}
              </Box>
              <IconButton
                size='small'
                onClick={() => {
                  setSelectedRowId(null)
                  setServiciosMuestra([])
                  setMuestraDetalle(null)
                }}
                title='Cerrar'
              >
                <i className='ri-close-line' />
              </IconButton>
            </Box>

            {/* Formulario de información de la muestra - USAR muestraDetalle */}
            {(() => {
              const row = findRowById(selectedRowId)
              const muestra = muestraDetalle ?? row?.muestra ?? {}

              const [cota1, cota2] = (muestra.cotas ?? '').split('-').map(c => c.trim())

              return (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                  {/* Fila 1 */}
                  <TextField
                    label='Tipo Material'
                    value={muestra.tipoMaterial ?? muestra.tipo_material ?? ''}
                    size='small'
                    disabled
                    fullWidth
                  />
                  <TextField
                    label='Elemento'
                    value={muestra.elemento ?? ''}
                    size='small'
                    disabled
                    fullWidth
                  />
                  <TextField
                    label='Item'
                    value={muestra.item ?? ''}
                    size='small'
                    disabled
                    fullWidth
                  />

                  {/* Fila 2 */}
                  <TextField
                    label='Grado'
                    value={muestra.grado ?? ''}
                    size='small'
                    disabled
                    fullWidth
                  />
                  <TextField
                    label='Procedencia'
                    value={muestra.procedencia ?? ''}
                    size='small'
                    disabled
                    fullWidth
                  />
                  <TextField
                    label='Cota 1'
                    value={cota1 ?? ''}
                    size='small'
                    disabled
                    fullWidth
                  />

                  {/* Fila 3 - Cotas y ubicación */}
                  <TextField
                    label='Cota 2'
                    value={cota2 ?? ''}
                    size='small'
                    disabled
                    fullWidth
                  />
                  <TextField
                    label='Ubicación / Sector'
                    value={muestra.ubicacionSector ?? muestra.ubicacion_sector ?? muestra.ubicacion ?? ''}
                    size='small'
                    disabled
                    fullWidth
                    sx={{ gridColumn: 'span 2' }}
                  />
                </Box>
              )
            })()}

            {/* ELIMINADO: Botón Agregar muestra */}

            {/* Tabla de servicios - CON columna ACCIONES */}
            {loadingServicios ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>CÓD. INT.</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>ENSAYO / ANÁLISIS</TableCell>
                      <TableCell align='center' sx={{ fontWeight: 600 }}>CANTIDAD</TableCell>
                      <TableCell align='center' sx={{ fontWeight: 600 }}>ESTADO</TableCell>
                      <TableCell align='center' sx={{ fontWeight: 600 }}>ACCIONES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviciosMuestra.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align='center' sx={{ py: 4 }}>
                          <Typography color='text.secondary'>
                            No hay servicios agregados
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      serviciosMuestra.map((servicio, idx) => {
                        const servicioId = servicio.id ??
                          servicio.servicioMuestraId ??
                          servicio.servicioId ??
                          servicio._id ??
                          null

                        return (
                          <TableRow
                            key={servicioId ?? idx}
                            sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <TableCell>
                              {servicio.codigo ?? servicio.codigoInterno ?? servicio.servicio?.codigo ?? servicioId ?? '-'}
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>
                                {servicio.tipo === 'Ensayo' ? 'Ensayo - ' : 'Análisis - '}
                                {servicio.nombre ?? servicio.servicio?.nombre ?? servicio.descripcion ?? '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align='center'>
                              {servicio.cantidad ?? 1}
                            </TableCell>
                            <TableCell align='center'>
                              {(() => {
                                const estado = servicio.estado ?? servicio.estadoServicio ?? 'Codificado'
                                const info = getOperationalInfo(estado)
                                return (
                                  <Chip
                                    label={estado}
                                    size='small'
                                    variant='filled'
                                    sx={{
                                      bgcolor: info.bgcolor,
                                      color: info.colorText,
                                      border: `1px solid ${info.border}`,
                                      textTransform: 'capitalize',
                                      fontWeight: 600,
                                      fontSize: '0.72rem',
                                      borderRadius: 2,
                                      px: 1,
                                      py: 0.4
                                    }}
                                  />
                                )
                              })()}
                            </TableCell>
                            <TableCell align='center'>
                              <IconButton
                                size='small'
                                title='Cambiar Estado'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (servicioId) {
                                    // Abrir menú para cambiar estado del servicio
                                    handleOpenMarkMenu(e, servicioId)
                                  }
                                }}
                              >
                                <CheckBoxOutlinedIcon fontSize='small' />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Campo de observaciones */}
            <Box sx={{ mt: 3 }}>
              <TextField
                label='Observaciones Muestra'
                value={(() => {
                  const row = findRowById(selectedRowId)
                  const muestra = muestraDetalle ?? row?.muestra ?? {}
                  return muestra.observaciones ?? muestra.observacion ?? ''
                })()}
                multiline
                minRows={3}
                fullWidth
                size='small'
                disabled
              />
            </Box>
          </Box>
        </>
      )}

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


