'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { UsersType } from '@/types/apps/userTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
import TableFilters from './TableFilters'
import AddUserDrawer from './AddUserDrawer'
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'
import { getLocalizedUrl } from '@/utils/i18n'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type UsersTypeWithAction = UsersType & {
  action?: string
}

type UserRoleType = {
  [key: string]: { icon: string; color: string }
}

type UserStatusType = {
  [key: string]: ThemeColor
}

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
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
  // States
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Vars
const userRoleObj: UserRoleType = {
  admin: { icon: 'ri-vip-crown-line', color: 'error' },
  author: { icon: 'ri-computer-line', color: 'warning' },
  editor: { icon: 'ri-edit-box-line', color: 'info' },
  maintainer: { icon: 'ri-pie-chart-2-line', color: 'success' },
  subscriber: { icon: 'ri-user-3-line', color: 'primary' }
}

const userStatusObj: UserStatusType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary'
}

// Column Definitions
const columnHelper = createColumnHelper<UsersTypeWithAction>()

const UserListTable3 = ({ tableData }: { tableData?: UsersType[] }) => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(...[tableData])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Hooks
  const { lang: locale } = useParams()

  const columns = useMemo<ColumnDef<UsersTypeWithAction, any>[]>(
    () => [
      columnHelper.accessor('codigo', {
        header: 'Código',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.codigo}</Typography>
      }),
      columnHelper.accessor('fechaCodificacion', {
        header: 'Fecha de Codificación',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.fechaCodificacion}</Typography>
      }),
      columnHelper.accessor('fechaMuestreo', {
        header: 'Fecha de Muestreo',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.fechaMuestreo}</Typography>
      }),
      columnHelper.accessor('area', {
        header: 'Área',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.area}</Typography>
      }),
      columnHelper.accessor('familia', {
        header: 'Familia',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.familia}</Typography>
      }),
      columnHelper.accessor('servicio', {
        header: 'Servicio',
        cell: ({ row }) => <Typography color='error'>{row.original.servicio}</Typography>
      }),
      columnHelper.accessor('estado', {
        header: 'Estado Op',
        cell: ({ row }) => <Typography color='error'>{row.original.servicio}</Typography>
      }),
      columnHelper.accessor('acciones', {
        header: 'Acciones',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton size='small' color='secondary' onClick={() => console.log('Editar', row.original)}>
              <i className='ri-edit-line' /> {/* Ícono de edición */}
            </IconButton>
            <IconButton size='small' color='secondary' onClick={() => console.log('Duplicar', row.original)}>
              <i className='ri-file-copy-line' /> {/* Ícono de duplicar */}
            </IconButton>
            <IconButton size='small' color='secondary' onClick={() => console.log('Eliminar', row.original)}>
              <i className='ri-delete-bin-line' /> {/* Ícono de eliminar */}
            </IconButton>
          </div>
        )
      })
    ],
    [data, filteredData]
  )

  const table = useReactTable({
    data: filteredData as UsersType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 3
      }
    },
    enableRowSelection: true, //enable row selection for all rows
    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const getAvatar = (params: Pick<UsersType, 'avatar' | 'fullName'>) => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} skin='light' size={34} />
    } else {
      return (
        <CustomAvatar skin='light' size={34}>
          {getInitials(fullName as string)}
        </CustomAvatar>
      )
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Servicios'
          action={
            <IconButton onClick={toggleCollapse}>{isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}</IconButton>
          }
        />
        {!isCollapsed && ( // Si no está colapsado, renderizar el contenido
          <>
            <TableFilters setData={setFilteredData} tableData={data} />
            <Divider />
            <Grid container spacing={3} alignItems='center' sx={{ p: 3 }}>
              {/* Campo para escribir Área */}
              <Grid item xs={3}>
                <TextField size='small' label='Área' placeholder='Escribe el área' fullWidth />
              </Grid>

              {/* Campo para escribir Familia */}
              <Grid item xs={3}>
                <TextField size='small' label='Familia' placeholder='Escribe la familia' fullWidth />
              </Grid>

              {/* Campo para Fecha */}
              <Grid item xs={3}>
                <TextField
                  size='small'
                  label='Fecha de Codificación'
                  type='date'
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>

              {/* Botón Crear */}
              <Grid item xs={3}>
                <Link href='http://localhost:3000/en/apps/user/interno' passHref>
                  <Button
                    variant='contained'
                    color='primary'
                    startIcon={<i className='ri-add-line' />}
                    fullWidth
                    sx={{ minHeight: '40px' }}
                  >
                    Crear
                  </Button>
                </Link>
              </Grid>
            </Grid>

            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id}>
                          {header.isPlaceholder ? null : (
                            <>
                              <div
                                className={classnames({
                                  'flex items-center': header.column.getIsSorted(),
                                  'cursor-pointer select-none': header.column.getCanSort()
                                })}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {{
                                  asc: <i className='ri-arrow-up-s-line text-xl' />,
                                  desc: <i className='ri-arrow-down-s-line text-xl' />
                                }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                              </div>
                            </>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                {table.getFilteredRowModel().rows.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                        No data available
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {table
                      .getRowModel()
                      .rows.slice(0, table.getState().pagination.pageSize)
                      .map(row => {
                        return (
                          <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                            ))}
                          </tr>
                        )
                      })}
                  </tbody>
                )}
              </table>
            </div>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component='div'
              className='border-bs'
              count={table.getFilteredRowModel().rows.length}
              rowsPerPage={table.getState().pagination.pageSize}
              page={table.getState().pagination.pageIndex}
              SelectProps={{
                inputProps: { 'aria-label': 'rows per page' }
              }}
              onPageChange={(_, page) => {
                table.setPageIndex(page)
              }}
              onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
            />
          </>
        )}
      </Card>

      <AddUserDrawer
        open={addUserOpen}
        handleClose={() => setAddUserOpen(!addUserOpen)}
        userData={data}
        setData={setData}
      />
    </>
  )
}

export default UserListTable3
