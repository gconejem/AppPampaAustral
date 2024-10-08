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
import Button from '@mui/material/Button'
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
  actionIcons,
  showDetailsBox = false // Añadimos esta opción para habilitar o deshabilitar la caja de detalles
}: {
  tableData: UsersType[]
  headers: { [key: string]: string }
  title: string
  actionIcons: JSX.Element[]
  showDetailsBox?: boolean // Añadido por defecto como false
}) => {
  const [filteredData, setFilteredData] = useState(tableData || [])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const columns = useMemo<ColumnDef<UsersType>[]>(() => {
    const dynamicColumns: ColumnDef<UsersType>[] = [
      {
        id: 'checkbox',
        header: ({ table }) => (
          <Checkbox
            indeterminate={table.getIsSomeRowsSelected()}
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
      }
    ]

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
    data: filteredData.slice(page * rowsPerPage, (page + 1) * rowsPerPage), // Controlar la paginación aquí
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={title} />
          <Divider />
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
            rowsPerPageOptions={[5, 10, 25, 50]}
            component='div'
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Grid>
    </Grid>
  )
}

// Datos ficticios actualizados para la tabla de "Gestión de Visitas"
const dataTable1 = [
  {
    id: 1,
    fullName: '22/12/24',
    email: '00:00',
    cliente: 'Nombre Cliente',
    obra: 'Obra',
    laboratorista: 'Laboratorista',
    comuna: 'Segmento',
    inicio: '00:00',
    termino: '23:59',
    role: '',
    status: 'En Revisión'
  },
  {
    id: 2,
    fullName: '22/12/24',
    email: '00:00',
    cliente: 'Nombre Cliente',
    obra: 'Obra',
    laboratorista: 'Laboratorista',
    comuna: 'Segmento',
    inicio: '00:00',
    termino: '23:59',
    role: '',
    status: 'Completada'
  },
  {
    id: 3,
    fullName: '22/12/24',
    email: '00:00',
    cliente: 'Nombre Cliente',
    obra: 'Obra',
    laboratorista: 'Laboratorista',
    comuna: 'Segmento',
    inicio: '00:00',
    termino: '23:59',
    role: '',
    status: 'Anulada'
  },
  {
    id: 4,
    fullName: '22/12/24',
    email: '00:00',
    cliente: 'Nombre Cliente',
    obra: 'Obra',
    laboratorista: 'Laboratorista',
    comuna: 'Segmento',
    inicio: '00:00',
    termino: '23:59',
    role: '',
    status: 'Suspendida'
  },
  {
    id: 5,
    fullName: '22/12/24',
    email: '00:00',
    cliente: 'Nombre Cliente',
    obra: 'Obra',
    laboratorista: 'Laboratorista',
    comuna: 'Segmento',
    inicio: '00:00',
    termino: '23:59',
    role: '',
    status: 'Recibida'
  },
  {
    id: 6,
    fullName: '22/12/24',
    email: '00:00',
    cliente: 'Nombre Cliente',
    obra: 'Obra',
    laboratorista: 'Laboratorista',
    comuna: 'Segmento',
    inicio: '00:00',
    termino: '23:59',
    role: '',
    status: 'Codificada'
  }
]

const dataTable2 = [
  { id: 1, fullName: 'Alice Smith', email: 'alice@example.com', role: 'maintainer', status: 'active' },
  { id: 2, fullName: 'Bob Johnson', email: 'bob@example.com', role: 'subscriber', status: 'pending' }
]

// Componente principal donde se renderizan las dos tablas con títulos y encabezados diferentes
const TablesPage = () => {
  return (
    <div>
      {/* La tabla de "Gestión de Visitas" muestra la caja de detalles */}
      <UserListTable
        tableData={dataTable1}
        headers={{
          fullName: 'Fecha',
          email: 'Hora',
          cliente: 'Cliente',
          obra: 'Obra',
          laboratorista: 'Laboratorista',
          comuna: 'Segmento',
          inicio: 'Inicio',
          termino: 'Término',
          role: 'Rol',
          status: 'Estado'
        }}
        title='Gestión de Visitas'
        actionIcons={[<i className='ri-edit-box-line' />, <i className='ri-time-line' />]}
        showDetailsBox={true} // Habilitamos la caja de detalles solo en esta tabla
      />

      {/* Separación entre las dos tablas */}
      <Box mt={4}>
        {' '}
        {/* Ajusta el valor '4' según lo que necesites */}
        {/* La tabla de "Órdenes de Trabajo" no tiene la caja de detalles */}
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
          showDetailsBox={false} // No mostramos la caja de detalles
        />
      </Box>
    </div>
  )
}

export default TablesPage
