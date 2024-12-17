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

const UserListTable = ({
  tableData,
  onVisitSelect,
  selectedVisit
}: {
  tableData?: UsersType[]
  onVisitSelect: (visit: UsersType | null) => void
  selectedVisit: UsersType | null
}) => {
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

  const handleRowSelection = (row: UsersType) => {
    onVisitSelect(selectedVisit?.id === row.id ? null : row) // Actualiza el estado de la visita seleccionada
  }

  const columns = useMemo<ColumnDef<UsersTypeWithAction, any>[]>(
    () => [
      {
        id: 'select',
        header: () => <div></div>, // Espacio vacío, ya que no se requiere seleccionar todas las filas
        cell: ({ row }) => (
          <Checkbox
            checked={selectedVisit?.id === row.original.id} // Compara si la fila actual está seleccionada
            onChange={() => handleRowSelection(row.original)} // Llama a la función para actualizar la selección
            inputProps={{ 'aria-label': 'select row' }}
          />
        )
      },
      columnHelper.accessor('role', {
        header: 'Fecha',
        cell: () => (
          <Typography className='capitalize' color='text.primary'>
            00/00/00
          </Typography>
        )
      }),
      columnHelper.accessor('role', {
        header: 'Hora',
        cell: () => (
          <Typography className='capitalize' color='text.primary'>
            00:00
          </Typography>
        )
      }),
      columnHelper.accessor('role', {
        header: 'Cliente',
        cell: () => (
          <Typography className='capitalize' color='text.primary'>
            Nombre Cliente
          </Typography>
        )
      }),
      columnHelper.accessor('role', {
        header: 'Obra',
        cell: () => (
          <Typography className='capitalize' color='text.primary'>
            Obra
          </Typography>
        )
      }),

      columnHelper.accessor('status', {
        header: 'Estado',
        cell: () => (
          <Chip
            variant='tonal'
            label='Recepción OK'
            size='small'
            color='success' // El color verde en Material UI
          />
        )
      }),

      columnHelper.accessor('action', {
        header: 'Acc',
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
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Gestión de Visitas' />
          <Divider />

          {/* Filtros y Botón Editar */}
          <Box className='p-4'>
            <Grid container spacing={2} alignItems='center'>
              {/* Primera Fila: 3-3-3-3 */}
              <Grid item xs={12} sm={3}>
                <TextField type='date' fullWidth size='small' label='Fecha Inicio' InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Select value={selectedLaboratorista} onChange={handleSelectChange} displayEmpty fullWidth size='small'>
                  <MenuItem value=''>Laboratorista</MenuItem>
                  <MenuItem value={'lab1'}>Laboratorista 1</MenuItem>
                  <MenuItem value={'lab2'}>Laboratorista 2</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Select value={selectedEstado} onChange={handleEstadoChange} displayEmpty fullWidth size='small'>
                  <MenuItem value=''>Estado</MenuItem>
                  <MenuItem value={'activo'}>Activo</MenuItem>
                  <MenuItem value={'inactivo'}>Inactivo</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControlLabel
                  control={<Checkbox checked={porRecibir} onChange={handlePorRecibirChange} />}
                  label='Por Recibir'
                />
              </Grid>

              {/* Segunda Fila: 2-8-2 */}
              <Grid item xs={12} sm={2}>
                <Button variant='contained' fullWidth>
                  Editar
                </Button>
              </Grid>
              <Grid item xs={12} sm={8} />
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  size='small'
                  placeholder='Buscar'
                  InputProps={{
                    startAdornment: <i className='ri-search-line' style={{ marginRight: '8px', color: '#aaa' }}></i>
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Contenedor Principal con Flexbox */}
          <Box display='flex' sx={{ height: '500px' }}>
            {/* Tabla */}
            <Box sx={{ width: '65%', borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
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
                      <tr key={row.id} style={{ cursor: 'pointer' }}>
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
                count={table.getFilteredRowModel().rows.length}
                rowsPerPage={table.getState().pagination.pageSize}
                page={table.getState().pagination.pageIndex}
                onPageChange={(_, page) => table.setPageIndex(page)}
                onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
              />
            </Box>

            {/* Detalles de la Visita */}
            <Box
              sx={{
                flexGrow: 1,
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%'
              }}
            >
              {/* Encabezado con Espacio Invisible, Editar e Icono de Basura */}
              <Grid container spacing={2} alignItems='center' justifyContent='space-between'>
                <Grid item xs={8} />
                <Grid item xs={2} textAlign='right'>
                  <Button variant='contained' color='primary' size='small'>
                    Editar
                  </Button>
                </Grid>
                <Grid item xs={2} textAlign='right'>
                  <IconButton color='error'>
                    <i className='ri-delete-bin-line' />
                  </IconButton>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Información Principal: Hora Llegada y Salida */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography>
                    Hora Llegada: <strong>16:35</strong>
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>
                    Hora Salida: <strong>17:35</strong>
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>
                    Movilización: <strong>---</strong>
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography>
                    Km Adicionales: <strong>15 Km</strong>
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Servicios Agendado y Extras */}
              <Box mb={2}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Servicios Agendado vs Completado
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Extras Agendados:
                </Typography>
              </Box>

              {/* Botones: Comprobante, En Revisión, Recepción OK */}
              <Grid container spacing={2} justifyContent='space-between'>
                <Grid item xs={4}>
                  <Button variant='outlined' color='primary' fullWidth>
                    Comprobante
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button variant='outlined' color='warning' fullWidth>
                    En Revisión
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button variant='outlined' color='success' fullWidth>
                    Recepción OK
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Card>
      </Grid>
    </Grid>
  )
}

export default UserListTable
