'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'

// Third-party Imports
import classnames from 'classnames'
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

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Column helper
const columnHelper = createColumnHelper<UsersType>()

// Fuzzy Filter for search functionality
const fuzzyFilter: FilterFn<UsersType> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// Componente que renderiza la tabla con títulos dinámicos y encabezados personalizados
const UserListTable = ({
  tableData,
  headers,
  title,
  actionIcons
}: {
  tableData: UsersType[]
  headers: { [key: string]: string }
  title: string
  actionIcons: JSX.Element[]
}) => {
  const [filteredData, setFilteredData] = useState(tableData || [])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<UsersType>[]>(() => {
    const dynamicColumns: ColumnDef<UsersType>[] = []

    if (headers.fullName) {
      dynamicColumns.push(
        columnHelper.accessor('fullName', {
          header: headers.fullName,
          cell: ({ row }) => (
            <div className='flex items-center gap-4'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.fullName}
              </Typography>
              <Typography variant='body2'>{row.original.username}</Typography>
            </div>
          )
        })
      )
    }

    if (headers.email) {
      dynamicColumns.push(
        columnHelper.accessor('email', {
          header: headers.email,
          cell: ({ row }) => <Typography>{row.original.email}</Typography>
        })
      )
    }

    if (headers.cliente) {
      dynamicColumns.push(
        columnHelper.accessor('cliente', {
          header: headers.cliente,
          cell: ({ row }) => <Typography>{row.original.role}</Typography>
        })
      )
    }

    if (headers.obra) {
      dynamicColumns.push(
        columnHelper.accessor('obra', {
          header: headers.obra,
          cell: ({ row }) => <Typography>{row.original.email}</Typography>
        })
      )
    }

    // Agrega las demás columnas opcionales como 'laboratorista', 'comuna', etc.
    if (headers.laboratorista) {
      dynamicColumns.push(
        columnHelper.accessor('laboratorista', {
          header: headers.laboratorista,
          cell: ({ row }) => <Typography>{row.original.role}</Typography>
        })
      )
    }

    if (headers.servicio) {
      dynamicColumns.push(
        columnHelper.accessor('servicio', {
          header: headers.servicio,
          cell: ({ row }) => <Typography>{row.original.role}</Typography>
        })
      )
    }

    if (headers.comuna) {
      dynamicColumns.push(
        columnHelper.accessor('comuna', {
          header: headers.comuna,
          cell: ({ row }) => <Typography>{row.original.role}</Typography>
        })
      )
    }

    if (headers.inicio) {
      dynamicColumns.push(
        columnHelper.accessor('inicio', {
          header: headers.inicio,
          cell: ({ row }) => <Typography>{row.original.role}</Typography>
        })
      )
    }

    if (headers.termino) {
      dynamicColumns.push(
        columnHelper.accessor('termino', {
          header: headers.termino,
          cell: ({ row }) => <Typography>{row.original.role}</Typography>
        })
      )
    }

    dynamicColumns.push(
      columnHelper.accessor('role', {
        header: headers.role,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography className='capitalize' color='text.primary'>
              {row.original.role}
            </Typography>
          </div>
        )
      })
    )

    dynamicColumns.push(
      columnHelper.accessor('status', {
        header: headers.status,
        cell: ({ row }) => <Chip label={row.original.status} size='small' className='capitalize' />
      })
    )

    dynamicColumns.push({
      id: 'action',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          {actionIcons.map((icon, index) => (
            <IconButton key={index}>{icon}</IconButton>
          ))}
        </div>
      )
    })

    return dynamicColumns
  }, [headers, actionIcons])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { rowSelection, globalFilter },
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter
  })

  return (
    <Card>
      <CardHeader title={title} /> {/* Título dinámico */}
      <Divider />
      {/* Filtros visuales */}
      <Box sx={{ padding: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <TextField select label='Intervalo de Fechas' fullWidth />
          </Grid>
          <Grid item xs={2}>
            <TextField label='Cliente' fullWidth />
          </Grid>
          <Grid item xs={2}>
            <TextField label='Obra' fullWidth />
          </Grid>
          <Grid item xs={2}>
            <TextField select label='Laboratorista' fullWidth />
          </Grid>
          <Grid item xs={2}>
            <TextField select label='Estado' fullWidth />
          </Grid>
          <Grid item xs={2}>
            <Checkbox /> Por Recibir
          </Grid>
        </Grid>
      </Box>
      <Divider />
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    <div
                      className={classnames({
                        'flex items-center': header.column.getIsSorted(),
                        'cursor-pointer select-none': header.column.getCanSort()
                      })}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() ? (
                        header.column.getIsSorted() === 'asc' ? (
                          <i className='ri-arrow-up-s-line text-xl' />
                        ) : (
                          <i className='ri-arrow-down-s-line text-xl' />
                        )
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component='div'
        count={filteredData.length}
        rowsPerPage={10}
        page={0}
        onPageChange={() => {}}
        onRowsPerPageChange={() => {}}
      />
    </Card>
  )
}

// Datos ficticios para las tablas
const dataTable1 = [
  { id: 1, fullName: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
  { id: 2, fullName: 'Jane Doe', email: 'jane@example.com', role: 'editor', status: 'inactive' }
]

const dataTable2 = [
  { id: 1, fullName: 'Alice Smith', email: 'alice@example.com', role: 'maintainer', status: 'active' },
  { id: 2, fullName: 'Bob Johnson', email: 'bob@example.com', role: 'subscriber', status: 'pending' }
]

// Componente principal donde se renderizan las dos tablas con títulos y encabezados diferentes
const TablesPage = () => {
  return (
    <div>
      <UserListTable
        tableData={dataTable1}
        headers={{
          fullName: 'Fecha',
          email: 'Hora',
          role: 'Rol',
          status: 'Estado',
          cliente: 'Cliente',
          obra: 'Obra',
          laboratorista: 'Laboratorista',
          comuna: 'Comuna',
          inicio: 'Inicio',
          termino: 'Término'
        }}
        title='Gestión de Visitas'
        actionIcons={[<i className='ri-edit-box-line' />, <i className='ri-time-line' />]}
      />
      <UserListTable
        tableData={dataTable2}
        headers={{
          fullName: 'N° OT',
          email: 'Fecha',
          cliente: 'Cliente',
          obra: 'N° Obra',
          role: 'Cliente',
          servicio: 'Servicio',
          status: 'Estado',
          laboratorista: 'Laboratorista'
        }}
        title='Órdenes de Trabajo'
        actionIcons={[
          <i className='ri-download-line' />,
          <i className='ri-edit-box-line' />,
          <i className='ri-time-line' />,
          <i className='ri-code-s-slash-line' />
        ]}
      />
    </div>
  )
}

export default TablesPage
