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
        header: ({ table }) => (
          <Checkbox
            size='small'
            onChange={e => {
              const checked = e.target.checked
              const ids = table.getRowModel().rows.map(r => r.id)
              setRowSelection(prev => {
                const next: any = {}
                ids.forEach(id => (next[id] = checked))
                return next
              })
            }}
          />
        ),
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
            <IconButton size='small' title='Marcar'>
              <CheckBoxOutlinedIcon fontSize='small' />
            </IconButton>
            <IconButton size='small' title='Más'>
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



      {/* New toolbar row: Exportar + Buscar (separate row under title) */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
        <Box>
          <Button variant='outlined' startIcon={<DownloadIcon />} size='small'>
            Exportar
          </Button>
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
    </Card>
  )
}

export default UserListTable2
