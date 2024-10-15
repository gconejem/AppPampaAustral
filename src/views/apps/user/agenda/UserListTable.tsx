'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
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
import Grid from '@mui/material/Grid'
import { styled } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControlLabel from '@mui/material/FormControlLabel'

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

const UserListTable = ({ tableData }: { tableData?: UsersType[] }) => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null) // Solo permite una selección de fila
  const [data, setData] = useState(tableData || [])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedLaboratorista, setSelectedLaboratorista] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [porRecibir, setPorRecibir] = useState(false)

  // Hooks
  const { lang: locale } = useParams()

  const handleSelectChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedLaboratorista(event.target.value as string)
  }

  const handleEstadoChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedEstado(event.target.value as string)
  }

  const handlePorRecibirChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPorRecibir(event.target.checked)
  }

  const handleRowSelection = (rowId: string) => {
    setSelectedRowId(prevSelectedRowId => (prevSelectedRowId === rowId ? null : rowId))
  }

  const columns = useMemo<ColumnDef<UsersTypeWithAction, any>[]>(
    () => [
      {
        id: 'select',
        header: () => <div></div>, // Espacio vacío, ya que no se requiere seleccionar todas las filas
        cell: ({ row }) => (
          <Checkbox
            checked={selectedRowId === row.id}
            onChange={() => handleRowSelection(row.id)} // Solo se maneja selección desde el Checkbox
            inputProps={{ 'aria-label': 'select row' }}
          />
        )
      },
      columnHelper.accessor('fullName', {
        header: 'User',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: row.original.avatar, fullName: row.original.fullName })}
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.fullName}
              </Typography>
              <Typography variant='body2'>{row.original.username}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: ({ row }) => <Typography>{row.original.email}</Typography>
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Icon className={userRoleObj[row.original.role].icon} />
            <Typography className='capitalize' color='text.primary'>
              {row.original.role}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <Chip variant='tonal' label={row.original.status} size='small' color={userStatusObj[row.original.status]} />
        )
      }),

      columnHelper.accessor('action', {
        header: 'Action',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary'
              options={[
                {
                  text: 'Download',
                  icon: 'ri-download-line',
                  menuItemProps: { className: 'flex items-center gap-2 text-textSecondary' }
                },
                {
                  text: 'Edit',
                  icon: 'ri-edit-box-line',
                  menuItemProps: { className: 'flex items-center gap-2 text-textSecondary' }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      })
    ],
    [selectedRowId]
  )

  const table = useReactTable({
    data: filteredData as UsersType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 6
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
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
    <Grid container spacing={3}>
      <Grid item xs={8}>
        <Card>
          <CardHeader title='Gestión de Visitas' />
          <Divider />
          <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Select value={selectedLaboratorista} onChange={handleSelectChange} displayEmpty fullWidth size='small'>
                  <MenuItem value=''>
                    <em>Laboratorista</em>
                  </MenuItem>
                  <MenuItem value={'lab1'}>Laboratorista 1</MenuItem>
                  <MenuItem value={'lab2'}>Laboratorista 2</MenuItem>
                  <MenuItem value={'lab3'}>Laboratorista 3</MenuItem>
                </Select>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Select value={selectedEstado} onChange={handleEstadoChange} displayEmpty fullWidth size='small'>
                  <MenuItem value=''>
                    <em>Estado</em>
                  </MenuItem>
                  <MenuItem value={'activo'}>Activo</MenuItem>
                  <MenuItem value={'inactivo'}>Inactivo</MenuItem>
                  <MenuItem value={'pendiente'}>Pendiente</MenuItem>
                </Select>
              </Grid>

              <Grid item xs={12} sm={2}>
                <FormControlLabel
                  control={<Checkbox checked={porRecibir} onChange={handlePorRecibirChange} />}
                  label='Por Recibir'
                />
              </Grid>

              <Grid item xs={12} sm={2}>
                <Button variant='contained' onClick={() => setAddUserOpen(!addUserOpen)} fullWidth>
                  Editar
                </Button>
              </Grid>
            </Grid>
          </div>

          {/* Aquí va tu tabla */}
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div className='cursor-pointer select-none'>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className={classnames({ selected: selectedRowId === row.id })}
                    style={{ cursor: 'pointer' }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            rowsPerPageOptions={[6, 10, 25, 50]}
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
      </Grid>

      {/* Caja de detalles a la derecha */}
      <Grid item xs={4}>
        {' '}
        {/* Mantenemos xs={4} */}
        <Card sx={{ width: '100%', minHeight: '385px' }}>
          {' '}
          {/* Ajustamos la altura */}
          <CardHeader title='Detalles de la Visita' />
          <Divider />
          <Box p={2} sx={{ position: 'relative', height: '100%' }}>
            {/* Botones en la esquina superior derecha */}
            <Box sx={{ position: 'absolute', top: '10px', right: '10px' }}>
              <Button variant='outlined' color='primary' style={{ marginRight: '10px' }}>
                Editar
              </Button>
              <Button variant='outlined' color='secondary'>
                Anular
              </Button>
            </Box>

            {/* Información de la visita */}
            <Typography>Hora Llegada:</Typography>
            <Typography>Movilización:</Typography>
            <Typography>Observaciones:</Typography>

            <Divider sx={{ my: 2 }} />
            <Typography>Servicios Agendado vs Completado</Typography>
            <Typography>Extras Agendados:</Typography>

            <Box mt={2}>
              <Button variant='outlined' color='primary' style={{ marginRight: '10px' }}>
                Comprobante
              </Button>
              <Button variant='outlined' color='warning' style={{ marginRight: '10px' }}>
                En Revisión
              </Button>
              <Button variant='outlined' color='success'>
                Recepción OK
              </Button>
            </Box>
          </Box>
        </Card>
      </Grid>
    </Grid>
  )
}

export default UserListTable
