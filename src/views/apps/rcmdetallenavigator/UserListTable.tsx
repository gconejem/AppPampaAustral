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

// Component
const columnHelper = createColumnHelper<RCM>()

interface Filters {
  dateField?: 'fecha_codificacion' | 'fecha_muestreo'
  start?: string
  end?: string
  estadoOperativo?: string
}

const UserListTable2 = ({ filters }: { filters?: Filters }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<RCM[]>([])
  const [filteredData, setFilteredData] = useState<RCM[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')

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
  // campos para "En Corrección"
  const [correctionMotivo, setCorrectionMotivo] = useState<string>('')
  const [correctionObservaciones, setCorrectionObservaciones] = useState<string>('')

  // --- Estado y helpers para Historial (añadir dentro del componente) ---
  const [histDialogOpen, setHistDialogOpen] = useState(false)
  const [histRowId, setHistRowId] = useState<number | null>(null)
  const [histRows, setHistRows] = useState<any[]>([])

  const statusColorHistorial = (status: string) => {
    const s = String(status).toLowerCase()
    if (s.includes('codific')) return 'info'
    if (s.includes('ensay')) return 'success'
    if (s.includes('pend')) return 'warning'
    if (s.includes('pag')) return 'default'
    return 'default'
  }

  // estilo "pill" para usar en el popup de Historial
  const statusPillStyle = (s?: string) => {
    if (!s) return { bgcolor: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.75)' }
    const k = String(s).toLowerCase()
    if (k.includes('codific')) return { bgcolor: '#E3F2FD', color: '#0D47A1' }
    if (k.includes('ensay') || k.includes('ensayo')) return { bgcolor: '#E8F5E9', color: '#1B5E20' }
    if (k.includes('pend')) return { bgcolor: '#FFF3E0', color: '#EF6C00' }
    if (k.includes('firm') || k.includes('firmado')) return { bgcolor: '#E8F5E9', color: '#2E7D32' }
    if (k.includes('factur') || k.includes('pag')) return { bgcolor: '#E8F5E9', color: '#2E7D32' }
    if (k.includes('rechaz') || k.includes('cancel')) return { bgcolor: '#FFEBEE', color: '#C62828' }
    return { bgcolor: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.75)' }
  }

  const getMockHistEntries = (rowId: number | null) => {
    // mock data: adapta campos a tu modelo real cuando uses la API
    return [
      {
        registro: '04/03/2024-17:07',
        funcionario: 'Paola Mena',
        aplicadoA: 'N° Tarjeta - 1/7 Días',
        ensayo: 'Ensayo 1',
        tipo: 'Op',
        estAnterior: 'Codificado',
        estNuevo: 'Ensayado',
        fechaAccion: '04/03/2024',
        observacion: 'Codificar, automático'
      },
      {
        registro: '04/03/2024-18:10',
        funcionario: 'Cristian Salinas',
        aplicadoA: 'N° Tarjeta - 1/28 Días',
        ensayo: 'Ensayo 1',
        tipo: 'Op',
        estAnterior: 'Codificado',
        estNuevo: 'Ensayado',
        fechaAccion: '04/03/2024',
        observacion: 'Procesar Abonos, automático'
      }
    ]
  }

  const handleOpenMarkMenu = (e: React.MouseEvent<HTMLElement>, rowId: number) => {
    setMarkAnchorEl(e.currentTarget)
    setMarkRowId(rowId)
  }
  const handleCloseMarkMenu = () => {
    setMarkAnchorEl(null)
    setMarkRowId(null)
  }

  const handleMarkAction = async (action: string, rowId: number | null) => {
    // acciones que requieren diálogo: DIGITADO y EN_CORRECCION
    if (action === 'DIGITADO' || action === 'EN_CORRECCION') {
      setMarkDialogAction(action)
      setMarkDialogRowId(rowId)
      // reset campos del diálogo según acción
      setInformeNumber('')
      setCorrectionMotivo('')
      setCorrectionObservaciones('')
      handleCloseMarkMenu()
      setMarkDialogOpen(true)
      return
    }

    // Acciones que se ejecutan inmediatamente (placeholder - ajustar API)
    try {
      console.log('Marcar acción inmediata', action, 'fila', rowId)
      // ejemplo de llamada:
      // await fetch(`/api/rcm/${rowId}/marcar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    } catch (err) {
      console.error('Error marcar', err)
    } finally {
      handleCloseMarkMenu()
      // opcional: refrescar datos
    }
  }

  const handleSaveMarkDialog = async () => {
    // Guardar la acción según el tipo de diálogo
    try {
      if (markDialogAction === 'DIGITADO') {
        console.log('Guardar DIGITADO', { rowId: markDialogRowId, informe: informeNumber })
        // POST a API: { action: 'DIGITADO', informe: informeNumber }
      } else if (markDialogAction === 'EN_CORRECCION') {
        console.log('Guardar EN_CORRECCION', {
          rowId: markDialogRowId,
          motivo: correctionMotivo,
          observaciones: correctionObservaciones
        })
        // POST a API: { action: 'EN_CORRECCION', motivo: correctionMotivo, observaciones: correctionObservaciones }
      } else {
        console.log('Guardar acción', markDialogAction)
      }
    } catch (err) {
      console.error('Error guardar marcación', err)
    } finally {
      setMarkDialogOpen(false)
      setMarkDialogAction(null)
      setMarkDialogRowId(null)
      setInformeNumber('')
      setCorrectionMotivo('')
      setCorrectionObservaciones('')
      // opcional: refrescar tabla
    }
  }

  const handleCancelMarkDialog = () => {
    setMarkDialogOpen(false)
    setMarkDialogAction(null)
    setMarkDialogRowId(null)
    setInformeNumber('')
    setCorrectionMotivo('')
    setCorrectionObservaciones('')
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



  const handleHistorial = async (rowId: number | null) => {
    if (!rowId) return
    try {
      // intenta cargar historial real desde la API
      const res = await fetch(`/api/rcm/${rowId}/history`)
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`History API error ${res.status}: ${txt}`)
      }
      const json = await res.json()

      // mapear respuesta API a la forma que usa el diálogo (aplicadoA / ensayo pueden venir vacíos)
      const mapped = Array.isArray(json)
        ? json.map((r: any) => ({
          registro: r.registro ?? '',
          funcionario: r.funcionario ?? '',
          // usar aplicadoA desde la entidad RCMHistory si viene, si no fallback a informe
          aplicadoA: r.aplicadoA ?? (r.informe && r.informe !== '---' ? `Informe ${r.informe}` : ''),
          ensayo: r.ensayo ?? '',
          tipo: r.tipo ?? '',
          estAnterior: r.estAnterior ?? '',
          estNuevo: r.estNuevo ?? '',
          fechaAccion: r.fechaAccion ?? '',
          observacion: r.observacion ?? ''
        }))
        : []

      setHistRowId(rowId)
      setHistRows(mapped)
      setHistDialogOpen(true)
    } catch (err) {
      console.error('Error loading history from API, falling back to mock:', err)
      // fallback al mock para no bloquear la experiencia
      setHistRowId(rowId)
      setHistRows(getMockHistEntries(rowId))
      setHistDialogOpen(true)
    } finally {
      try { handleCloseRowMenu?.() } catch { }
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
        const response = await fetch('/api/rcm')
        const result = await response.json()
        setData(result)
        setFilteredData(result)
      } catch (error) {
        console.error('Error fetching RCMs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRCMs()
  }, [])

  // normalizar string/Date a date-only (local) para comparar sin zone shifts
  const toDateOnly = (input: any): Date | null => {
    if (!input) return null

    // Si ya es Date => mantener parte fecha local
    if (input instanceof Date) return new Date(input.getFullYear(), input.getMonth(), input.getDate())

    const s = String(input).trim()

    // 1) YYYY-MM-DD (posible prefijo ISO) -> parsear como LOCAL sin timezone shift
    const isoMatch = s.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      const y = Number(isoMatch[1]), m = Number(isoMatch[2]) - 1, d = Number(isoMatch[3])
      return new Date(y, m, d)
    }

    // 2) DD/MM/YYYY o DD-MM-YYYY
    const ddmmyMatch = s.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/)
    if (ddmmyMatch) {
      const d = Number(ddmmyMatch[1]), m = Number(ddmmyMatch[2]) - 1, y = Number(ddmmyMatch[3])
      return new Date(y, m, d)
    }

    // 3) Fallback: crear Date y tomar parte local (si es válido)
    const fallback = new Date(s)
    if (!isNaN(fallback.getTime())) {
      return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate())
    }

    return null
  }

  // aplicar filtros de fecha/estado sobre data (no sobre filteredData)
  const applyFilters = (rows: RCM[], filters?: Filters) => {
    if (!filters) {
      setFilteredData(rows)
      return
    }

    const pad = (n: number) => String(n).padStart(2, '0')
    const formatLocalYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    if (process.env.NODE_ENV === 'development') {
      console.log('applyFilters called', { rowsCount: rows.length, filters })
    }

    let result = rows.slice()

    // date filtering (usar startOfDay / endOfDay para incluir mismo día)
    if (filters.dateField && filters.start && filters.end) {
      const startRaw = toDateOnly(filters.start)
      const endRaw = toDateOnly(filters.end)

      if (!startRaw || !endRaw) {
        if (process.env.NODE_ENV === 'development')
          console.warn('applyFilters: start/end parse failed', { startRaw: filters.start, endRaw: filters.end })
      } else {
        // start at 00:00 local
        const startDt = new Date(startRaw.getFullYear(), startRaw.getMonth(), startRaw.getDate(), 0, 0, 0, 0)
        // end at 23:59:59.999 local
        const endDt = new Date(endRaw.getFullYear(), endRaw.getMonth(), endRaw.getDate(), 23, 59, 59, 999)

        if (process.env.NODE_ENV === 'development')
          console.log('applyFilters -> date range (ms)', { start: startDt.toISOString(), end: endDt.toISOString() })

        const field = filters.dateField === 'fecha_codificacion' ? 'fechaCodificacion' : 'fechaMuestreo'

        result = result.filter(r => {
          const raw = (r as any)[field]
          const d = toDateOnly(raw)
          if (!d) return false
          const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0).getTime() // use midday to be safe
          const matched = dTime >= startDt.getTime() && dTime <= endDt.getTime()

          if (!matched && process.env.NODE_ENV === 'development') {
            console.log('applyFilters -> row NOT matched by date', {
              rowId: r.id,
              field,
              raw,
              parsedYMD: formatLocalYMD(d),
              startYMD: formatLocalYMD(startRaw),
              endYMD: formatLocalYMD(endRaw)
            })
          }

          return matched
        })
      }
    }

    // estadoOperativo filter (if present)
    if (filters.estadoOperativo) {
      const q = String(filters.estadoOperativo).toLowerCase().trim()

      const getRowOperativeState = (r: RCM) => {
        const s1 = (r.estadoOperativo ?? '')
        if (s1 && String(s1).trim().length > 0) return String(s1).toLowerCase().trim()
        // fallback to servicios[0].estado like the cell renderer does
        if (Array.isArray((r as any).servicios) && (r as any).servicios.length) {
          const svcState = (r as any).servicios[0]?.estado
          if (svcState) return String(svcState).toLowerCase().trim()
        }
        return ''
      }

      if (process.env.NODE_ENV === 'development') {
        const sample = Array.from(new Set(rows.map(r => getRowOperativeState(r)).filter(Boolean))).slice(0, 20)
        console.log('applyFilters -> operative state sample', sample, 'filterQ=', q)
      }

      result = result.filter(r => {
        const rowState = getRowOperativeState(r)
        return rowState.includes(q)
      })
    }

    if (process.env.NODE_ENV === 'development') console.log('applyFilters -> result count', result.length)
    setFilteredData(result)
  }

  // re-aplicar cuando cambian filters o data (el filtro de estado viene desde Header)
  useEffect(() => {
    applyFilters(data, filters)
  }, [data, filters])

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
        header: 'MUESTRA',
        accessorKey: 'numeroRcm',
        cell: ({ row }) => <Typography variant='body2'>{row.original.numeroRcm}</Typography>
      },
      {
        id: 'ot',
        header: 'OT',
        accessorFn: r => r.ot ?? r['ordenTrabajo'] ?? r['ot'],
        cell: ({ row }) => <Typography variant='body2'>{row.original.ot ?? row.original['ordenTrabajo'] ?? '-'}</Typography>
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
        id: 'n_tar', // cambiado para evitar key duplicado
        header: 'N° TAR',
        accessorFn: r => r.ot ?? r['ordenTrabajo'] ?? r['ot'],
        cell: ({ row }) => <Typography variant='body2'>{row.original.ot ?? row.original['ordenTrabajo'] ?? '-'}</Typography>
      },
      {
        id: 'area',
        header: 'ÁREA',
        accessorFn: r => r.area ?? r.cliente?.nombreCliente ?? '-',
        cell: ({ row }) => <span>{row.original.area ?? row.original.cliente?.nombreCliente ?? '-'}</span>
      },
      {
        id: 'familia',
        header: 'FAMILIA',
        accessorKey: 'familia',
        cell: ({ row }) => <span>{row.original.familia ?? '-'}</span>
      },
      {
        id: 'muestras',
        header: '# MUES.',
        accessorFn: r => (Array.isArray(r.servicios) ? r.servicios.reduce((s, it) => s + (it.cantidad ?? 0), 0) : 0),
        cell: ({ row }) => <span>{Array.isArray(row.original.servicios) ? row.original.servicios.reduce((s, it) => s + (it.cantidad ?? 0), 0) : 0}</span>
      },
      {
        id: 'estOp',
        header: 'EST. OP',
        accessorKey: 'estadoOperativo',
        cell: ({ row }) => {
          const op = row.original.estadoOperativo ?? (Array.isArray(row.original.servicios) && row.original.servicios.length ? row.original.servicios[0].estado : null)
          return (
            <Chip
              label={op ?? '-'}
              size='small'
              color={statusColor(op)}
              variant='filled'
              sx={{
                textTransform: 'uppercase',
                fontWeight: 700,
                fontSize: '0.72rem',
                borderRadius: 2,
                px: 1,
                py: 0.4
              }}
            />
          )
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
            >
              <CheckBoxOutlinedIcon fontSize='small' />
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

  // reemplazado: indicadores ampliados y heurísticos
  const indicators = useMemo(() => {
    const total = data.length
    const lower = (s?: string) => (s ?? '').toString().toLowerCase()

    const porEnsayar = data.filter(d =>
      lower(d.estadoOperativo).includes('ensayar') ||
      lower(d.estadoAdministrativo).includes('ensayar')
    ).length

    const porDigitar = data.filter(d =>
      lower(d.estadoOperativo).includes('digitar') ||
      lower(d.estadoAdministrativo).includes('digitar') ||
      lower(d.estadoAdministrativo).includes('digitacion') ||
      lower(d.estadoAdministrativo).includes('digitación')
    ).length

    const porEnviarDigitacion = data.filter(d =>
      lower(d.estadoAdministrativo).includes('enviar') && lower(d.estadoAdministrativo).includes('digit')
    ).length

    const porRevisar = data.filter(d =>
      lower(d.estadoOperativo).includes('revisar') ||
      lower(d.estadoAdministrativo).includes('revisar')
    ).length

    const porCorregir = data.filter(d =>
      lower(d.estadoOperativo).includes('corregir') ||
      lower(d.estadoAdministrativo).includes('corregir')
    ).length

    const porFirmar = data.filter(d =>
      lower(d.estadoAdministrativo).includes('firmar') ||
      lower(d.estadoAdministrativo).includes('firmado') ||
      lower(d.estadoOperativo).includes('firmar')
    ).length

    const porEnviarFirmados = data.filter(d =>
      (lower(d.estadoAdministrativo).includes('firmado') || lower(d.estadoAdministrativo).includes('firmados')) &&
      lower(d.estadoAdministrativo).includes('enviar')
    ).length

    const firmadosPagados = data.filter(d => {
      const adm = lower(d.estadoAdministrativo)
      return (adm.includes('firmado') || adm.includes('firmados')) &&
        (adm.includes('pagado') || adm.includes('pagados') || adm.includes('pag'))
    }).length

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
  }, [data])

  if (loading) return <div>Cargando...</div>

  return (
    <Card>
      <Divider />

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

          {selectedCount > 0 && (
            <Typography variant='body2' color='text.secondary'>
              {selectedCount} fila{selectedCount > 1 ? 's' : ''} seleccionada{selectedCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
              placeholder='Buscar Muestra, OT, ÁREA, FAMILIA...'
              fullWidth
              size='small'
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
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
                  <td key={cell.id} style={{ verticalAlign: 'middle' }}>
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
        onRowsPerPageChange={e => table.setPageSize(Number((e.target as HTMLInputElement).value))}
      />

      {/* Menu contextual por fila */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseRowMenu}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MenuItem onClick={() => { handleEdit(menuRowId); handleCloseRowMenu(); }}>Editar</MenuItem>
        <MenuItem onClick={() => { handleHistorial(menuRowId); handleCloseRowMenu(); }}>Historial</MenuItem>
      </Menu>

      {/* Dialog Historial */}
      <Dialog fullWidth maxWidth='lg' open={histDialogOpen} onClose={handleCloseHistDialog}>
        <DialogTitle>Historial</DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} variant='outlined'>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>REGISTRO</TableCell>
                  <TableCell>FUNCIONARIO</TableCell>
                  <TableCell>APLICADO A</TableCell>
                  <TableCell>ENSAYO/SERVICIO</TableCell>
                  <TableCell>TIPO</TableCell>
                  <TableCell>EST. ANTERIOR</TableCell>
                  <TableCell>EST. NUEVO</TableCell>
                  <TableCell>FECHA ACCIÓN</TableCell>
                  <TableCell>OBSERVACIÓN</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {histRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align='center' sx={{ py: 4 }}>
                      No hay registros
                    </TableCell>
                  </TableRow>
                ) : (
                  histRows.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell>{h.registro}</TableCell>
                      <TableCell>{h.funcionario}</TableCell>
                      <TableCell>{h.aplicadoA}</TableCell>
                      <TableCell>{h.ensayo}</TableCell>
                      <TableCell>{h.tipo}</TableCell>
                      <TableCell>
                        <Chip
                          label={h.estAnterior ?? '-'}
                          size='small'
                          variant='filled'
                          sx={{
                            ...statusPillStyle(h.estAnterior),
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
                            ...statusPillStyle(h.estNuevo),
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            borderRadius: 2,
                            px: 1,
                            py: 0.4
                          }}
                        />
                      </TableCell>
                      <TableCell>{h.fechaAccion}</TableCell>
                      <TableCell>{h.observacion}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistDialog}>Cerrar</Button>
          <Button variant='contained' onClick={handleCloseHistDialog}>Aceptar</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
export default UserListTable2
