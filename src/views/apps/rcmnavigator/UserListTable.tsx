'use client'

// ...existing code...
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TablePagination from '@mui/material/TablePagination'
import { styled } from '@mui/material/styles'
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

import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItemMUI from '@mui/material/MenuItem' // avoid name clash if MenuItem used above
import FormHelperText from '@mui/material/FormHelperText'
import { OPERATIONAL_STATES } from '@/constants/operationalStates'

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility'
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DownloadIcon from '@mui/icons-material/Download'

// Third-party Imports
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
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
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

// RCM type (kept)
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
  servicios?: Array<{
    codigo: string
    nombre: string
    cantidad: number
  }>
}

interface Filters {
  dateField?: 'fecha_codificacion' | 'fecha_muestreo'
  start?: string
  end?: string
  estadoOperativo?: string
}

// Component
const columnHelper = createColumnHelper<RCM>()

const UserListTable2 = ({ filters }: { filters?: Filters }) => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [data, setData] = useState<RCM[]>([])
  const [filteredData, setFilteredData] = useState<RCM[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [savingHistory, setSavingHistory] = useState(false)
  const [formErrors, setFormErrors] = useState<{ eventType?: string; motivo?: string; informeNumber?: string; general?: string }>({})


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
    // acciones que requieren diálogo
    if (action === 'DIGITADO' || action === 'EVENTO' || action === 'CERRADO_OP') {
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

    if (markDialogAction === 'EVENTO' || markDialogAction === 'CERRADO_OP') {
      if (!eventType) errors.eventType = 'Seleccione tipo'
      if (!correctionMotivo || !correctionMotivo.trim()) errors.motivo = 'Ingrese motivo'
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

  const handleEdit = (rowId: number | null) => {
    console.log('Editar', rowId)
    handleCloseRowMenu()
    // TODO: abrir drawer/editar con rowId
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

  const handleCloseHistDialog = () => {
    setHistDialogOpen(false)
    setHistRowId(null)
    setHistRows([])
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
              if (!or.ok) return
              obraMap[id] = await or.json()
            } catch (e) {
              console.warn('No se pudo cargar obra', id, e)
            }
          })
        )

        // --- fetch ordenes de trabajo por id (para obtener correlativ) ---
        const ordenIds = Array.from(new Set(raw.map((r: any) => r.ordenTrabajoId ?? r.ordenTrabajo?.id).filter(Boolean)))
        const ordenMap: Record<string | number, any> = {}
        if (ordenIds.length) {
          try {
            const q = ordenIds.map(encodeURIComponent).join(',')
            const br = await fetch(`/api/ordenes?ids=${q}`)
            if (br.ok) {
              const ct = (br.headers.get('content-type') || '').toLowerCase()
              if (ct.includes('application/json')) {
                const list = await br.json()
                if (Array.isArray(list)) {
                  list.forEach((o: any) => {
                    const key = o.id ?? o._id ?? o.key ?? o.ordenTrabajoId ?? o.correlativ ?? o.correlativo
                    if (key) {
                      ordenMap[String(key)] = o
                      if (o.id) ordenMap[String(o.id)] = o
                      const correl = o.correlativ ?? o.correlativo ?? o.numero ?? o.nro
                      if (correl) ordenMap[String(correl)] = o
                    }
                  })
                }
              } else {
                const txt = await br.text().catch(() => '')
                // eslint-disable-next-line no-console
                console.warn('Batch /api/ordenes responded with non-json. sample:', txt.slice(0, 400))
                // fallback a fetch individual
                await Promise.all(
                  ordenIds.map(async id => {
                    try {
                      const or = await fetch(`/api/ordenTrabajo/${id}`)
                      if (!or.ok) return
                      const ct2 = (or.headers.get('content-type') || '').toLowerCase()
                      if (ct2.includes('application/json')) {
                        ordenMap[String(id)] = await or.json()
                      } else {
                        const t = await or.text().catch(() => '')
                        // eslint-disable-next-line no-console
                        console.warn(`ordenTrabajo ${id} returned non-json:`, t.slice(0, 300))
                      }
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.warn('No se pudo cargar ordenTrabajo', id, err)
                    }
                  })
                )
              }
            } else {
              // batch endpoint responded not ok -> fallback individual
              await Promise.all(
                ordenIds.map(async id => {
                  try {
                    const or = await fetch(`/api/ordenTrabajo/${id}`)
                    if (!or.ok) return
                    const ct2 = (or.headers.get('content-type') || '').toLowerCase()
                    if (ct2.includes('application/json')) {
                      ordenMap[String(id)] = await or.json()
                    } else {
                      const t = await or.text().catch(() => '')
                      // eslint-disable-next-line no-console
                      console.warn(`ordenTrabajo ${id} returned non-json:`, t.slice(0, 300))
                    }
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.warn('No se pudo cargar ordenTrabajo', id, err)
                  }
                })
              )
            }
          } catch (err) {
            // en error, fallback a fetch individual
            await Promise.all(
              ordenIds.map(async id => {
                try {
                  const or = await fetch(`/api/ordenTrabajo/${id}`)
                  if (!or.ok) return
                  const ct2 = (or.headers.get('content-type') || '').toLowerCase()
                  if (ct2.includes('application/json')) {
                    ordenMap[String(id)] = await or.json()
                  } else {
                    const t = await or.text().catch(() => '')
                    // eslint-disable-next-line no-console
                    console.warn(`ordenTrabajo ${id} returned non-json (fallback):`, t.slice(0, 300))
                  }
                } catch (e) {
                  // eslint-disable-next-line no-console
                  console.warn('No se pudo cargar ordenTrabajo', id, e)
                }
              })
            )
          }
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

        // DEBUG: mostrar muestra de ordenMap para inspección (temporal)
        try {
          if (Object.keys(ordenMap).length) {
            const sampleKey = Object.keys(ordenMap)[0]
            // eslint-disable-next-line no-console
            console.debug('ordenMap sample key:', sampleKey, 'value:', ordenMap[sampleKey])
            // eslint-disable-next-line no-console
            console.debug('extracted correl (sample):', findOrderCorrel(ordenMap[sampleKey]))
          }
        } catch (e) {
          /* ignore debug errors */
        }

        // normalizar y enriquecer
        const normalized = raw.map((r: any) => {
          const obraObj = r.obra ?? obraMap[r.obraId] ?? obraMap[r.obra?.id] ?? null
          const numeroObra =
            obraObj?.numeroObra ??
            obraObj?.numero_obra ??
            obraObj?.numero ??
            obraObj?.numeroobra ??
            (r.obraId ? String(r.obraId) : undefined)

          // intentar obtener correlativo desde varios posibles campos del objeto orden
          const orderKey = r.ordenTrabajoId ?? (r.ordenTrabajo && (r.ordenTrabajo.id ?? r.ordenTrabajo._id)) ?? ''
          const orderObj = ordenMap[orderKey] ?? ordenMap[String(orderKey)] ?? ordenMap[r.ordenTrabajoId ?? r.ordenTrabajo?.id ?? ''] ?? null
          const orderCorrel = orderObj ? findOrderCorrel(orderObj) : undefined

          // Normalizar ordenTrabajo: incluir correlativo si se encuentra; mantener ordenTrabajoId como fallback
          const ordenTrabajoNormalized = {
            ...(r.ordenTrabajo ?? orderObj ?? {}),
            correlativo: orderCorrel ?? r.ordenTrabajo?.correlativ ?? r.ordenTrabajo?.correlativo ?? undefined,
            id: r.ordenTrabajoId ?? (r.ordenTrabajo && (r.ordenTrabajo.id ?? r.ordenTrabajo._id)) ?? undefined
          }

          // otDisplay: mostrar correlativo real si existe, sino null (para mostrar '-' en UI)
          const otDisplay = ordenTrabajoNormalized.correlativo ?? (r.ot && typeof r.ot === 'string' && !/[a-zA-Z]/.test(r.ot) ? r.ot : null)

          const otCorrel =
            // mantener campo ot original por compatibilidad, pero preferir otDisplay para mostrar
            r.ot ?? ordenTrabajoNormalized.correlativo ?? orderCorrel ?? orderObj?.correlativ ?? orderObj?.correlativo ?? orderObj?.numero ?? r.ordenTrabajoId ?? null

          return {
            ...r,
            // preserve original ot, add normalized ordenTrabajo and otDisplay
            ot: otCorrel,
            ordenTrabajo: ordenTrabajoNormalized,
            otDisplay,
            // Normalizar y asegurar estadoAdministrativo en cada fila (fallbacks comunes)
            estadoAdministrativo:
              r.estadoAdministrativo ??
              r.estado_administrativo ??
              r.estadoAdm ??
              r.estado_adm ??
              r.administrativo ??
              '',
            estadoOperativo:
              r.estadoOperativo ??
              (Array.isArray(r.servicios) && r.servicios.length ? r.servicios[0].estado : '') ??
              '',
            obra: { ...(obraObj ?? {}), numeroObra }
          }
        })

        setData(normalized)
        applyDateFilter(normalized, filters)
      } catch (err) {
        console.error('Error fetching RCMs:', err)
      } finally {
        setLoading(false)
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
        const op = (r.estadoOperativo ?? (Array.isArray(r.servicios) && r.servicios.length ? r.servicios[0].estado : '') ?? '')
        return String(op).toLowerCase().includes(q)
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
                // si no están todos seleccionados => seleccionar todos visibles, si ya lo están => deseleccionar todo
                if (!allSelected) {
                  const next: any = {}
                  visibleIds.forEach(id => (next[id] = true))
                  setRowSelection(next)
                } else {
                  setRowSelection({}) // deselecciona todo
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
        accessorKey: 'numeroRcm',
        cell: ({ row }) => <Typography variant='body2'>{row.original.numeroRcm}</Typography>
      },
      {
        id: 'ot',
        header: 'OT',
        accessorFn: (r: any) => r.otDisplay ?? r.ot ?? r.ordenTrabajo?.correlativo ?? r.ordenTrabajoId ?? null,
        cell: ({ row }: any) => {
          const display = row.original.otDisplay ?? null
          const ordenId = row.original.ordenTrabajo?.id ?? row.original.ordenTrabajoId ?? null
          if (display) {
            return <Typography variant='body2'>{display}</Typography>
          }
          // no correlativo: mostrar '-' pero dejar ordenTrabajoId en tooltip para rastreo
          if (ordenId) {
            // eslint-disable-next-line no-console
            console.debug('No correlativo for row', row.original.id, 'ordenTrabajoId:', ordenId)
            return (
              <Typography variant='body2' title={`ordenTrabajoId: ${ordenId}`}>
                -
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
        cell: ({ row }) => <span>{row.original.fechaMuestreo ? new Date(row.original.fechaMuestreo).toLocaleDateString() : '-'}</span>
      },
      {
        id: 'area',
        header: 'ÁREA',
        accessorFn: (r: any) => {
          const svc = Array.isArray(r.servicios) ? r.servicios.find((s: any) => s?.producto && (s.producto.area || s.producto?.area)) : undefined
          return svc?.producto?.area ?? r.area ?? r.cliente?.nombreCliente ?? '-'
        },
        cell: ({ row }: any) => {
          const svc = Array.isArray(row.original.servicios)
            ? row.original.servicios.find((s: any) => s?.producto && s.producto.area)
            : null
          const areaVal = svc?.producto?.area ?? row.original.area ?? row.original.cliente?.nombreCliente ?? '-'
          return <span>{areaVal}</span>
        }
      },
      {
        id: 'familia',
        header: 'FAMILIA',
        accessorFn: (r: any) => {
          const svc = Array.isArray(r.servicios)
            ? r.servicios.find((s: any) => s?.producto && (s.producto.familia || s.producto?.familia))
            : undefined
          return svc?.producto?.familia ?? r.familia ?? '-'
        },
        cell: ({ row }: any) => {
          const svc = Array.isArray(row.original.servicios)
            ? row.original.servicios.find((s: any) => s?.producto && (s.producto.familia || s.producto?.familia))
            : null
          const fam = svc?.producto?.familia ?? row.original.familia ?? '-'
          return <span>{fam}</span>
        }
      },
      {
        id: 'muestras',
        header: '# MUES.',
        accessorFn: r => (Array.isArray(r.servicios) ? r.servicios.reduce((s, it) => s + (it.cantidad ?? 0), 0) : 0),
        cell: ({ row }) => <span>{Array.isArray(row.original.servicios) ? row.original.servicios.reduce((s, it) => s + (it.cantidad ?? 0), 0) : 0}</span>
      },
      {
        id: 'estOp',
        header: 'Est. Operativo',
        accessorKey: 'estadoOperativo',
        cell: ({ row }) => {
          const op =
            row.original.estadoOperativo ??
            (Array.isArray(row.original.servicios) && row.original.servicios.length
              ? (row.original.servicios[0] as any).estado
              : null)
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
        id: 'estAd',
        header: 'Est. Administrativo',
        accessorKey: 'estadoAdministrativo',
        cell: ({ row }) => <Chip label={row.original.estadoAdministrativo ?? '-'} size='small' color={statusColor(row.original.estadoAdministrativo)} />
      },
      {
        id: 'nobra',
        header: 'N° OBRA',
        accessorFn: r =>
          r.obra?.numeroObra ??
          r.obra?.numero_obra ??
          r.obra?.numero ??
          r.obra?.numeroobra ??
          r.obraId ??
          '-',
        cell: ({ row }) => {
          const val = row.getValue('nobra') as string
          return <span>{val ?? '-'}</span>
        }
      },
      {
        id: 'acciones',
        header: 'ACCIONES',
        cell: ({ row }) => (
          <Stack direction='row' spacing={1}>
            <IconButton size='small' title='Ver'>
              <VisibilityIcon fontSize='small' />
            </IconButton>

            <IconButton
              size='small'
              title='Marcar'
              onClick={(e) => handleOpenMarkMenu(e, row.original.id)}
            >
              <CheckBoxOutlinedIcon fontSize='small' />
            </IconButton>

            <IconButton size='small' title='Más' onClick={e => handleOpenRowMenu(e, row.original.id)}>
              <MoreVertIcon fontSize='small' />
            </IconButton>
          </Stack>
        )
      }
    ]
  }, [rowSelection])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  // <-- añadir: conteo de filas seleccionadas
  const selectedCount = useMemo(() => {
    return Object.values(rowSelection as any).filter(Boolean).length
  }, [rowSelection])

  // EXPORT: exportar sólo filas seleccionadas a CSV (si no hay selección, no hace nada)
  const handleExport = () => {
    try {
      const selectedIds = Object.keys(rowSelection).filter(id => (rowSelection as any)[id])
      if (!selectedIds.length) return

      // columnas visibles (excluir columnas no deseadas como select/acciones)
      const cols = table.getAllLeafColumns().filter(c => !['select', 'acciones'].includes(c.id))
      const headers = cols.map(c => (typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id))

      // construir filas para los ids seleccionados
      const rows = selectedIds.map(id => {
        const row = table.getRowModel().rows.find(r => r.id === id)
        return cols
          .map(c => {
            const v = row ? row.getValue(c.id) : ''
            if (v === null || v === undefined) return '""'
            const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
            // escapar comillas dobles para CSV y envolver en comillas
            return '"' + s.replace(/"/g, '""') + '"'
          })
          .join(',')
      })

      const headerRow = headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(',')
      const csv = [headerRow, ...rows].join('\r\n')

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

  // reemplazado: indicadores ampliados y heurísticos (usar filteredData para contar los visibles)
  const indicators = useMemo(() => {
    const total = filteredData.length
    const lower = (s?: string) => (s ?? '').toString().toLowerCase()

    const countIf = (pred: (op: string, adm: string) => boolean) =>
      filteredData.reduce((acc, d) => {
        const op = lower(d.estadoOperativo ?? (Array.isArray(d.servicios) && d.servicios.length ? d.servicios[0].estado : ''))
        const adm = lower(d.estadoAdministrativo)
        return acc + (pred(op, adm) ? 1 : 0)
      }, 0)

    const porEnsayar = countIf((op, adm) => op.includes('ensayar') || adm.includes('ensayar'))
    const porDigitar = countIf((op, adm) =>
      op.includes('digitar') || adm.includes('digitar') || adm.includes('digitacion') || adm.includes('digitación')
    )
    const porEnviarDigitacion = countIf((op, adm) =>
      adm.includes('enviar') && adm.includes('digit')
    )
    const porRevisar = countIf((op, adm) => op.includes('revisar') || adm.includes('revisar'))
    const porCorregir = countIf((op, adm) => op.includes('corregir') || adm.includes('corregir'))
    const porFirmar = countIf((op, adm) =>
      adm.includes('firmar') || adm.includes('firmado') || op.includes('firmar')
    )
    const porEnviarFirmados = countIf((op, adm) =>
      (adm.includes('firmado') || adm.includes('firmados')) && adm.includes('enviar')
    )
    const firmadosPagados = countIf((op, adm) => {
      const admHasFirmado = adm.includes('firmado') || adm.includes('firmados')
      const admHasPagado = adm.includes('pagado') || adm.includes('pagados') || adm.includes('pag')
      return admHasFirmado && admHasPagado
    })

    return {
      total,
      porEnsayar,
      porDigitar,
      porEnviarDigitacion,
      porRevisar,
      porCorregir,
      porFirmar,
      porEnviarFirmados,
      firmadosPagados
    }
  }, [filteredData])

  if (loading) return <div>Cargando...</div>

  return (
    <Card>
      {/* Card header: only title */}
      <CardHeader
        title={
          <Box display='flex' alignItems='center' justifyContent='space-between' gap={2}>
            <Typography variant='h6'>RCMs</Typography>
          </Box>
        }
      />

      <Divider />

      {/* ROW: Dashboard indicadores (fila superior) */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', p: 2 }}>
        {[
          { label: 'Por Ensayar', value: indicators.porEnsayar },
          { label: 'Por Digitar', value: indicators.porDigitar },
          { label: 'Por Enviar Digitación', value: indicators.porEnviarDigitacion },
          { label: 'Por Revisar', value: indicators.porRevisar },
          { label: 'Por Corregir', value: indicators.porCorregir },
          { label: 'Por Firmar', value: indicators.porFirmar },
          { label: 'Por Enviar(Firmados)', value: indicators.porEnviarFirmados },
          { label: 'Firmados Pagados', value: indicators.firmadosPagados }
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

      {/* New toolbar row: Exportar + contador + Buscar (separate row under title) */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant='outlined'
            startIcon={<DownloadIcon />}
            size='small'
            onClick={handleExport}
            disabled={selectedCount === 0}
            title={selectedCount === 0 ? 'Seleccione filas para exportar' : 'Exportar filas seleccionadas'}
          >
            Exportar
          </Button>

          {/* contador de seleccionados (visible solo si hay al menos 1) */}
          {selectedCount > 0 && (
            <Typography variant='body2' color='text.secondary'>
              {selectedCount} fila{selectedCount > 1 ? 's' : ''} seleccionada{selectedCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Box sx={{ width: 300 }}>
          <DebouncedInput
            value={globalFilter}
            onChange={(v: any) => {
              setGlobalFilter(String(v))
              const q = String(v).toLowerCase()
              if (!q) {
                setFilteredData(data)
                return
              }
              const filtered = data.filter(item =>
                [
                  item.numeroRcm,
                  item.ot,
                  item.area,
                  item.familia,
                  item.obra?.numeroObra,
                  item.cliente?.nombreCliente
                ]
                  .filter(Boolean)
                  .some(s => String(s).toLowerCase().includes(q))
              )
              setFilteredData(filtered)
            }}
            placeholder='Buscar RCM, OT, ÁREA, FAMILIA...'
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
                    <MenuItemMUI value={markDialogAction}>
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
        <MenuItem onClick={() => handleGenerateInforme(menuRowId)}>Generar Informe</MenuItem>
      </Menu>

      {/* Dialog: Historial (mock) */}
      <Dialog fullWidth maxWidth='lg' open={histDialogOpen} onClose={handleCloseHistDialog}>
        <DialogTitle>Historial</DialogTitle>
        <DialogContent>
          {histLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>REGISTRO</TableCell>
                    <TableCell>FUNCIONARIO</TableCell>
                    <TableCell>TIPO</TableCell>
                    <TableCell>EST. ANTERIOR</TableCell>
                    <TableCell>EST. NUEVO</TableCell>
                    <TableCell>INFORME</TableCell>
                    <TableCell>FECHA ACCIÓN</TableCell>
                    <TableCell>OBSERVACIÓN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {histRows.map((h, i) => (
                    <TableRow key={i}>
                      {/* REGISTRO: keep datetime */}
                      <TableCell>{formatDateDDMMYYYY(h.fechaAccion)}</TableCell>
                      <TableCell>{h.funcionario}</TableCell>
                      <TableCell>{h.tipo}</TableCell>
                      <TableCell>
                        <Chip
                          label={h.estAnterior ?? '-'}
                          size='small'
                          variant='filled'
                          sx={{
                            ...getOperationalSx(h.estAnterior),
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            borderRadius: 2,
                            px: 1,
                            py: 0.4
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={h.estNuevo ?? '-'}
                          size='small'
                          variant='filled'
                          sx={{
                            ...getOperationalSx(h.estNuevo),
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            borderRadius: 2,
                            px: 1,
                            py: 0.4
                          }}
                        />
                      </TableCell>
                      <TableCell>{h.informe}</TableCell>
                      {/* FECHA ACCIÓN: only date DD/MM/AAAA */}
                      <TableCell>{formatDateDDMMYYYYDateOnly(h.fechaAccion)}</TableCell>
                      <TableCell>{h.observacion}</TableCell>
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


