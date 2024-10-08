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

  // Previene bucles infinitos en la selección de filas
  const handleRowSelectionChange = (newSelection: any) => {
    setRowSelection(prevSelection => {
      if (prevSelection !== newSelection) {
        return newSelection
      }

      return prevSelection
    })
  }

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
    onRowSelectionChange: handleRowSelectionChange, // Modificamos el método de selección
    onGlobalFilterChange: setGlobalFilter
  })

  const handleChangePage = (event: unknown, newPage: number) => {
    if (page !== newPage) {
      setPage(newPage)
    }
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10)

    if (rowsPerPage !== newRowsPerPage) {
      setRowsPerPage(newRowsPerPage)
      setPage(0)
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title={title} />
          <Divider />
          <Box sx={{ padding: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField select label='Intervalo de Fechas' fullWidth />
              </Grid>
              <Grid item xs={3}>
                <TextField label='Cliente' fullWidth />
              </Grid>
              <Grid item xs={3}>
                <TextField label='Buscar' fullWidth />
              </Grid>
              <Grid item xs={3}>
                <TextField select label='Estado' fullWidth />
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

      {/* Tablas debajo */}
      <Grid container spacing={2} mt={4}>
        {/* Tabla Cantidades */}
        <Grid item xs={4}>
          <Card>
            <CardHeader title='' />
            <Divider />
            <Box sx={{ padding: 2 }}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>CANT</th>
                    <th>DÍAS</th>
                    <th>FECHA VENC</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>7</td>
                    <td>10</td>
                    <td>10/10/2024</td>
                    <td>
                      <Chip label='En Revisión' size='small' />
                    </td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>28</td>
                    <td>31/10/2024</td>
                    <td>
                      <Chip label='En Revisión' size='small' />
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Card>
        </Grid>

        {/* Tabla Ensayos/Servicios */}
        <Grid item xs={8}>
          <Card>
            <CardHeader title='' />
            <Divider />
            <Box sx={{ padding: 2 }}>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>SF AM</th>
                    <th>TIPO/FORMA</th>
                    <th>CÓD INT</th>
                    <th>ENSAYO/SERV</th>
                    <th>CANT</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>GEN</td>
                    <td>Genérico</td>
                    <td>200</td>
                    <td>Movilización</td>
                    <td>1.00</td>
                    <td>
                      <Chip label='En Revisión' size='small' />
                    </td>
                  </tr>
                  <tr>
                    <td>PCL</td>
                    <td>Cilindros</td>
                    <td>196</td>
                    <td>Compresión</td>
                    <td>3.00</td>
                    <td>
                      <Chip label='En Revisión' size='small' />
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </Card>
        </Grid>
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

// Componente principal donde se renderiza la tabla de "Gestión de Visitas"
const TablesPage = () => {
  return (
    <div>
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
        title='Control de Muestras'
        actionIcons={[<i className='ri-edit-box-line' />, <i className='ri-time-line' />]}
        showDetailsBox={true}
      />
    </div>
  )
}

export default TablesPage
