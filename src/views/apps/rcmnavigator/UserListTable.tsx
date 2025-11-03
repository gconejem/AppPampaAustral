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

interface Filters {
  dateField?: 'fecha_codificacion' | 'fecha_muestreo'
  start?: string
  end?: string
  estadoOperativo?: string
}

// Component
const columnHelper = createColumnHelper<RCM>()

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

  // Historial dialog
  const [histDialogOpen, setHistDialogOpen] = useState(false)
  const [histRowId, setHistRowId] = useState<number | null>(null)
  const [histRows, setHistRows] = useState<any[]>([])

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
    try {
      if (markDialogRowId == null) return

      // ejemplo: actualizar estado en RCM (si tu API tiene endpoint para marcar, llama aquí)
      // await fetch(`/api/rcm/${markDialogRowId}/marcar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: markDialogAction, informe: informeNumber, motivo: correctionMotivo, observaciones: correctionObservaciones }) })

      // Crear entrada en historial
      const payload: any = {
        tipo: markDialogAction === 'DIGITADO' ? 'Ope' : 'Adm',
        funcionario: (typeof window !== 'undefined' && (window as any).__USER_NAME__) ? (window as any).__USER_NAME__ : 'Usuario',
        estAnterior: undefined,
        estNuevo: markDialogAction === 'DIGITADO' ? 'DIGITADO' : markDialogAction,
        informe: markDialogAction === 'DIGITADO' ? (Number(informeNumber) || null) : null,
        fechaAccion: new Date().toISOString(),
        observacion: markDialogAction === 'EN_CORRECCION' ? correctionObservaciones ?? '' : ''
      }

      const res = await fetch(`/api/rcm/${markDialogRowId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Error saving history')

      // refrescar historial si está abierto para la misma fila
      if (histDialogOpen && histRowId === markDialogRowId) {
        const r = await fetch(`/api/rcm/${markDialogRowId}/history`)
        if (r.ok) setHistRows(await r.json())
      }

      // opcional: refrescar listado principal (re-fetch)
    } catch (err) {
      console.error('Error saving mark & history', err)
    } finally {
      setMarkDialogOpen(false)
      setMarkDialogAction(null)
      setMarkDialogRowId(null)
      setInformeNumber('')
      setCorrectionMotivo('')
      setCorrectionObservaciones('')
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
    console.log('handleHistorial called, rowId=', rowId)
    if (!rowId) {
      console.warn('handleHistorial: no rowId provided')
      return
    }

    try {
      const res = await fetch(`/api/rcm/${rowId}/history`)
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('History API returned not ok:', res.status, txt)
        throw new Error('Error loading history')
      }
      const json = await res.json()
      console.log('History API success, rows:', Array.isArray(json) ? json.length : json)
      setHistRowId(rowId)
      setHistRows(Array.isArray(json) ? json : [])
      setHistDialogOpen(true)
    } catch (err) {
      console.error('Error loading history (fallback to mock):', err)
      // fallback a mock para que puedas ver el dialog mientras arreglas la API
      setHistRowId(rowId)
      setHistRows(getMockHistEntries(rowId))
      setHistDialogOpen(true)
    } finally {
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
        console.log('API /api/rcm result sample:', Array.isArray(result) ? result.slice(0, 5) : result)

        const normalized = (Array.isArray(result) ? result : []).map((r: any) => ({
          ...r,
          ot: r.ot ?? r.ordenTrabajo?.correlativ ?? r.orden_trabajo?.correlativ ?? null,
          estadoOperativo: r.estadoOperativo ?? (Array.isArray(r.servicios) && r.servicios.length ? r.servicios[0].estado : '') ?? ''
        }))

        setData(normalized)
        // aplicar filtro inicial si vienen filters
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
        accessorFn: (r: any) => r.ot ?? r.ordenTrabajo?.correlativ ?? null,
        cell: ({ row }: any) => (
          <Typography variant='body2'>
            {row.original.ot ?? row.original.ordenTrabajo?.correlativ ?? '-'}
          </Typography>
        )
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
          return <Chip label={op ?? '-'} size='small' color={statusColor(op)} />
        }
      },
      {
        id: 'estAd',
        header: 'EST. AD.',
        accessorKey: 'estadoAdministrativo',
        cell: ({ row }) => <Chip label={row.original.estadoAdministrativo ?? '-'} size='small' color={statusColor(row.original.estadoAdministrativo)} />
      },
      {
        id: 'nobra',
        header: 'N° OBRA',
        accessorFn: r => r.obra?.numeroObra ?? '-',
        cell: ({ row }) => <span>{row.original.obra?.numeroObra ?? '-'}</span>
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
      < CardHeader
        title={
          < Box display='flex' alignItems='center' justifyContent='space-between' gap={2} >
            <Typography variant='h6'>RCMs</Typography>
          </Box >
        }
      />

      < Divider />

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
        onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
      />

      {/* Menu "Marcar" con opciones (popup) */}
      <Menu
        anchorEl={markAnchorEl}
        open={Boolean(markAnchorEl)}
        onClose={handleCloseMarkMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleMarkAction('ENVIADO_DIGITACION', markRowId)}>Enviado a Digitación</MenuItem>
        <MenuItem onClick={() => handleMarkAction('DIGITADO', markRowId)}>Digitado</MenuItem>
        <MenuItem onClick={() => handleMarkAction('INFORME_OK', markRowId)}>Informe OK</MenuItem>
        <MenuItem onClick={() => handleMarkAction('EN_CORRECCION', markRowId)}>En Corrección</MenuItem>
        <MenuItem onClick={() => handleMarkAction('FIRMADO', markRowId)}>Firmado</MenuItem>
        <MenuItem onClick={() => handleMarkAction('ENVIADO_CLIENTE', markRowId)}>Enviado a Cliente</MenuItem>
      </Menu>

      {/* Dialog: Form "Estado Muestra" para acciones (Digitado, En Corrección, ...) */}
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
              />
            </Box>
          )}

          {markDialogAction === 'EN_CORRECCION' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='correction-action-label'>Estado</InputLabel>
                  <Select
                    labelId='correction-action-label'
                    value={'EN_CORRECCION'}
                    label='Estado'
                    disabled
                  >
                    <MenuItemMUI value='EN_CORRECCION'>En Corrección</MenuItemMUI>
                  </Select>
                </FormControl>

                <TextField
                  label='Motivo'
                  value={correctionMotivo}
                  onChange={e => setCorrectionMotivo(e.target.value)}
                  size='small'
                  fullWidth
                />
              </Box>

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
          <Button variant='contained' onClick={handleSaveMarkDialog}>Guardar</Button>
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
                    <TableCell>{h.registro}</TableCell>
                    <TableCell>{h.funcionario}</TableCell>
                    <TableCell>{h.tipo}</TableCell>
                    <TableCell>
                      <Chip label={h.estAnterior} size='small' color={statusColor(h.estAnterior)} />
                    </TableCell>
                    <TableCell>
                      <Chip label={h.estNuevo} size='small' color={statusColor(h.estNuevo)} />
                    </TableCell>
                    <TableCell>{h.informe}</TableCell>
                    <TableCell>{h.fechaAccion}</TableCell>
                    <TableCell>{h.observacion}</TableCell>
                  </TableRow>
                ))}
                {histRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align='center' sx={{ py: 4 }}>
                      No hay registros
                    </TableCell>
                  </TableRow>
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
