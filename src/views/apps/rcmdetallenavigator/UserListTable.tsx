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

const UserListTable2 = () => {
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

  const handleHistorial = (rowId: number | null) => {
    // cargar mock y abrir dialog
    setHistRowId(rowId)
    setHistRows(getMockHistEntries(rowId))
    setHistDialogOpen(true)
    handleCloseRowMenu()
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
        cell: ({ row }) => <Chip label={row.original.estadoOperativo ?? '-'} size='small' color={statusColor(row.original.estadoOperativo)} />
      },
      {
        id: 'estAd',
        header: 'EST. AD.',
        accessorKey: 'estadoAdministrativo',
        cell: ({ row }) => <Chip label={row.original.estadoAdministrativo ?? '-'} size='small' color={statusColor(row.original.estadoAdministrativo)} />
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

      {/* Indicadores eliminados (solo en rcmdetallenavigator) */}

      <Divider />

      {/* toolbar / filtros / tabla siguen aquí */}
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
