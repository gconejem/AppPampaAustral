'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
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
import PopUp from './popup'

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
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, onChange, debounce])

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

const UserListTable2 = ({ tableData }: { tableData?: UsersType[] }) => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState([...tableData])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isPopUpOpen, setIsPopUpOpen] = useState(false) // State for PopUp

  // Handlers for PopUp
  const handleOpenPopUp = () => setIsPopUpOpen(true)
  const handleClosePopUp = () => setIsPopUpOpen(false)

  // Hooks
  const { lang: locale } = useParams()

  const columns = useMemo<ColumnDef<UsersTypeWithAction, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      },
      columnHelper.accessor('Muestra', {
        header: 'MUESTRA',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaCodificacion || '180280-1'}
          </Typography>
        )
      }),
      columnHelper.accessor('OT', {
        header: 'OT',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaCodificacion || 'N/A'}
          </Typography>
        )
      }),

      columnHelper.accessor('fechaCodificacion', {
        header: 'FECHA COD.',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaCodificacion || 'N/A'}
          </Typography>
        )
      }),
      columnHelper.accessor('fechaMuestreo', {
        header: 'FECHA MUES.',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaMuestreo || 'N/A'}
          </Typography>
        )
      }),
      columnHelper.accessor('numeroTarjeta', {
        header: 'N TAR.',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.numeroTarjeta || 'N/A'}
          </Typography>
        )
      }),
      columnHelper.accessor('area', {
        header: 'ÁREA',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.area || 'N/A'}
          </Typography>
        )
      }),
      columnHelper.accessor('familia', {
        header: 'FAMILIA',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.familia || 'N/A'}
          </Typography>
        )
      }),
      columnHelper.accessor('cantidadMuestra', {
        header: 'CAN. MUES.',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.cantidadMuestra || '0'}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'EST. OP',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Chip
              variant='tonal'
              label={row.original.status}
              size='small'
              color={userStatusObj[row.original.status]}
              className='capitalize'
            />
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'EST. ADM.',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <Chip
              variant='tonal'
              label={row.original.status}
              size='small'
              color={userStatusObj[row.original.status]}
              className='capitalize'
            />
          </div>
        )
      }),
      columnHelper.accessor('action', {
        header: 'ACCIONES',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Link href='http://localhost:3000/en/apps/user/registro3' passHref>
              <IconButton>
                <i className='ri-eye-line text-textSecondary' />
              </IconButton>
            </Link>
            <IconButton>
              <i className='ri-checkbox-circle-line text-textSecondary' />
            </IconButton>
            <IconButton>
              <i className='ri-file-list-line text-textSecondary' />
            </IconButton>
            <OptionMenu
              iconButtonProps={{ size: 'medium', className: 'text-textSecondary' }}
              options={[
                {
                  text: 'Editar',
                  icon: 'ri-pencil-line',
                  menuItemProps: {
                    onClick: () => {
                      console.log(`Editar fila con ID: ${row.original.id}`)
                    }
                  }
                },
                {
                  text: 'Historial',
                  icon: 'ri-history-line',
                  menuItemProps: {
                    onClick: () => {
                      console.log(`Historial de fila con ID: ${row.original.id}`)
                    }
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      })
    ],
    [data, filteredData, handleOpenPopUp]
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
        pageSize: 2
      }
    },
    enableRowSelection: true,
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

  return (
    <>
      <Card>
        <CardHeader title='' />
        <TableFilters setData={setFilteredData} tableData={data} />
        <Divider />
        <div className='p-5'>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={3}>
              <Button
                color='secondary'
                variant='outlined'
                startIcon={<i className='ri-upload-2-line text-xl' />}
                sx={{
                  padding: '6px 16px',
                  minWidth: 'auto'
                }}
              >
                Exportar
              </Button>
            </Grid>
            <Grid item xs={5}></Grid>
            <Grid item xs={4}>
              <TextField
                label='Buscar'
                size='small'
                variant='outlined'
                InputProps={{
                  startAdornment: <i className='ri-search-line text-xl' style={{ marginRight: 8 }} />
                }}
                fullWidth
              />
            </Grid>
          </Grid>
        </div>

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
          rowsPerPageOptions={[10, 25, 50]}
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
      </Card>
      <AddUserDrawer
        open={addUserOpen}
        handleClose={() => setAddUserOpen(!addUserOpen)}
        userData={data}
        setData={setData}
      />
      <PopUp open={isPopUpOpen} handleClose={handleClosePopUp} />
    </>
  )
}

export default UserListTable2
