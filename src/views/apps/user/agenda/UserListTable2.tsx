'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Link from 'next/link'

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
  getPaginationRowModel
} from '@tanstack/react-table'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'

// Table Styles
import tableStyles from '@core/styles/table.module.css'

type UsersTypeWithAction = UsersType & {
  action?: string
}

const columnHelper = createColumnHelper<UsersTypeWithAction>()

const UserListTable2 = ({ tableData, selectedVisit }: { tableData?: UsersType[]; selectedVisit: UsersType | null }) => {
  // States
  const [data] = useState(tableData || [])
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
        cell: ({ row }) => (
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
      columnHelper.accessor('fullName', {
        header: 'OT',
        cell: ({ row }) => <Typography>0123456789 </Typography>
      }),
      columnHelper.accessor('fullName', {
        header: 'FECHA',
        cell: ({ row }) => <Typography>00/00/0000</Typography>
      }),
      columnHelper.accessor('fullName', {
        header: 'CLIENTE',
        cell: ({ row }) => <Typography>Nombre Cliente</Typography>
      }),
      columnHelper.accessor('fullName', {
        header: 'OBRA',
        cell: ({ row }) => <Typography>Nombre Obra</Typography>
      }),
      columnHelper.accessor('fullName', {
        header: 'SERVICIO',
        cell: ({ row }) => <Typography>Servicio</Typography>
      }),
      columnHelper.accessor('fullName', {
        header: 'LABRST.',
        cell: ({ row }) => <Typography>Laboratorista</Typography>
      }),
      columnHelper.accessor('fullName', {
        header: 'MUESTREADO',
        cell: ({ row }) => <Typography>Laboratorio</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Estado',
        cell: ({ row }) => (
          <Chip label={row.original.status || 'Activo'} size='small' color='primary' className='capitalize' />
        )
      }),
      columnHelper.accessor('action', {
        header: 'Acciones',
        cell: () => (
          <div className='flex items-center gap-2'>
            <IconButton>
              <i className='ri-download-line' style={{ fontSize: '1.2rem' }} /> {/* Ícono de descarga */}
            </IconButton>
            <Link href='http://localhost:3000/en/apps/user/rcm' passHref>
              <IconButton>
                <i className='ri-code-s-slash-line' style={{ fontSize: '1.2rem' }} /> {/* Ícono de código */}
              </IconButton>
            </Link>

            <IconButton>
              <i className='ri-more-2-fill' style={{ fontSize: '1.2rem' }} /> {/* Ícono de opciones */}
            </IconButton>
          </div>
        )
      })
    ],
    [rowSelection]
  )

  const table = useReactTable({
    data,
    columns,
    state: { pagination: { pageSize, pageIndex } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  // Condicional: No mostrar si no hay una visita seleccionada
  if (!selectedVisit) return null

  return (
    <Card>
      <CardHeader title={`Órdenes de Trabajo - ${selectedVisit.cliente || ''}`} />
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
        count={data.length}
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
