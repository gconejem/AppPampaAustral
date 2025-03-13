'use client'

// React Imports
import { useState, useMemo } from 'react'

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
import Grid from '@mui/material/Grid'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'

// Third-party Imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type Row,
  type FilterFn
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'

// Interfaces
interface OrdenTrabajo {
  id: string
  clave: string
  estado: string
  tipoOT: string
  createdAt: string
  userId: string
  user?: {
    name: string
  }
  aceptacionVisita?: {
    horaSalida: string
    horaLlegada: string
  }
  densidad?: {
    item: string
    marca: string
    modelo: string
  }
}

interface Agenda {
  id: number
  titulo: string
  cliente?: {
    nombreCliente: string
  }
  obra?: {
    nombreObra: string
  }
  ordenesTrabajo: OrdenTrabajo[]
}

// Table Styles
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper<OrdenTrabajo>()

// Función de filtro fuzzy
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const UserListTable2 = ({ selectedVisit }: { selectedVisit: Agenda | null }) => {
  // States
  const [pageSize, setPageSize] = useState(6)
  const [pageIndex, setPageIndex] = useState(0)
  const [rowSelection, setRowSelection] = useState<{ [key: string]: boolean }>({})
  const [filters, setFilters] = useState({ ot: '', servicio: '', estadoOT: '', estadoRetiro: '' })

  // Handler para manejar los cambios en los filtros
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setFilters(prev => ({ ...prev, [field]: e.target.value }))
  }

  // Columns Definition
  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: () => <Checkbox />,
        cell: ({ row }: { row: Row<OrdenTrabajo> }) => (
          <Checkbox
            checked={rowSelection[row.id] || false}
            onChange={() =>
              setRowSelection(prev => ({
                ...prev,
                [row.id]: !prev[row.id]
              }))
            }
          />
        )
      },
      columnHelper.accessor('clave', {
        header: 'OT',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('createdAt', {
        header: 'FECHA',
        cell: info => <Typography>{new Date(info.getValue()).toLocaleDateString()}</Typography>
      }),
      columnHelper.accessor(row => row.user?.name || 'Sin asignar', {
        id: 'laboratorista',
        header: 'LABRST.',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('tipoOT', {
        header: 'SERVICIO',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('estado', {
        header: 'Estado',
        cell: info => (
          <Chip
            label={info.getValue()}
            size='small'
            color={info.getValue() === 'T' ? 'warning' : 'success'}
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('id', {
        header: 'Acciones',
        cell: () => (
          <div className='flex items-center gap-2'>
            <IconButton>
              <i className='ri-download-line' style={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton>
              <i className='ri-code-s-slash-line' style={{ fontSize: '1.2rem' }} />
            </IconButton>
            <IconButton>
              <i className='ri-more-2-fill' style={{ fontSize: '1.2rem' }} />
            </IconButton>
          </div>
        )
      })
    ],
    [rowSelection]
  )

  const table = useReactTable({
    data: selectedVisit?.ordenesTrabajo || [],
    columns,
    state: { pagination: { pageSize, pageIndex } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter
    }
  })

  // Condicional: No mostrar si no hay una visita seleccionada
  if (!selectedVisit) return null

  return (
    <Card>
      <CardHeader title={`Órdenes de Trabajo - ${selectedVisit.cliente?.nombreCliente || ''}`} />
      <Divider />

      {/* Filtros */}
      <Box p={3}>
        <Grid container spacing={2} alignItems='center'>
          {/* Primera Fila */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size='small'
              label='Orden de Trabajo, Nº Tarjeta'
              value={filters.ot}
              onChange={e => handleFilterChange(e, 'ot')}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size='small'
              label='Servicio'
              value={filters.servicio}
              onChange={e => handleFilterChange(e, 'servicio')}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size='small'
              label='Estado OT'
              value={filters.estadoOT}
              onChange={e => handleFilterChange(e, 'estadoOT')}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size='small'
              label='Estado Retiro'
              value={filters.estadoRetiro}
              onChange={e => handleFilterChange(e, 'estadoRetiro')}
            />
          </Grid>

          {/* Segunda Fila */}
          <Grid item xs={12} sm={2}>
            <Button variant='contained' fullWidth>
              Editar
            </Button>
          </Grid>
          <Grid item xs={12} sm={7} />
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              size='small'
              placeholder='Buscar'
              InputProps={{
                startAdornment: <i className='ri-search-line' style={{ marginRight: '8px', color: '#aaa' }} />
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Tabla */}
      <Box className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {/* Paginación */}
      <TablePagination
        component='div'
        count={(selectedVisit?.ordenesTrabajo || []).length}
        rowsPerPage={pageSize}
        page={pageIndex}
        onPageChange={(_, page) => setPageIndex(page)}
        onRowsPerPageChange={e => setPageSize(Number(e.target.value))}
        rowsPerPageOptions={[6, 10, 25, 50]}
      />
    </Card>
  )
}

export default UserListTable2
