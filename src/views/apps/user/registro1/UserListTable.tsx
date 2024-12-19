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

import HistorialPopup from './HistorialPopup'

import TableFilters from './TableFilters'
import AddUserDrawer from './AddUserDrawer'
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import InfoCards from './InfoCards'

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

const UserListTable2 = ({ tableData }: { tableData?: UsersType[] }) => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(...[tableData])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')

  const [openHistorial, setOpenHistorial] = useState(false) // Mueve esto aquí

  const [historialData, setHistorialData] = useState([
    {
      registro: '04/03/2024 - 17:07',
      funcionario: 'Paola Mena',
      aplicadoA: 'Ensayo/Serv 2',
      tipo: 'Ope',
      estadoAnterior: 'Firmado',
      estadoNuevo: 'Env-Cliente',
      informe: '1',
      fechaAccion: '04/03/2024',
      observacion: 'Codificar, automático'
    },
    {
      registro: '04/03/2024 - 18:10',
      funcionario: 'Cristian Salinas',
      aplicadoA: 'Ensayo/Serv 1',
      tipo: 'Adm',
      estadoAnterior: 'Facturado',
      estadoNuevo: 'Pagado',
      informe: '---',
      fechaAccion: '04/03/2024',
      observacion: 'Procesar Abonos, automático'
    }
  ]) // Mueve esto aquí

  // Función para abrir el historial
  const handleOpenHistorial = () => {
    setOpenHistorial(true)
  }

  // Función para cerrar el historial
  const handleCloseHistorial = () => {
    setOpenHistorial(false)
  }

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

      columnHelper.accessor('currentPlan', {
        header: 'RCM',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.currentPlan}
          </Typography>
        )
      }),
      columnHelper.accessor('currentPlan', {
        header: 'OT',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.currentPlan}
          </Typography>
        )
      }),

      columnHelper.accessor('fechaMuestreo', {
        header: 'FECHA COD.',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaMuestreo || '00/00/00'}
          </Typography>
        )
      }),
      columnHelper.accessor('fechaMuestreo', {
        header: 'FECHA MUES.',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaMuestreo || '00/00/00'}
          </Typography>
        )
      }),

      columnHelper.accessor('currentPlan', {
        header: 'ÁREA',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.currentPlan}
          </Typography>
        )
      }),
      columnHelper.accessor('currentPlan', {
        header: 'FAMILIA',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.currentPlan}
          </Typography>
        )
      }),
      columnHelper.accessor('fechaMuestreo', {
        header: 'C. MUES',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaMuestreo || '1'}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'EST. OP.',
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
        header: 'EST. AD.',
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
      columnHelper.accessor('fechaMuestreo', {
        header: 'N OBRA',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaMuestreo || '1'}
          </Typography>
        )
      }),
      columnHelper.accessor('fechaMuestreo', {
        header: 'CLIENTE',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaMuestreo || 'Nombre Cliente'}
          </Typography>
        )
      }),
      columnHelper.accessor('fechaMuestreo', {
        header: 'COMUNA',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.fechaMuestreo || 'Comuna'}
          </Typography>
        )
      }),

      columnHelper.accessor('action', {
        header: 'ACCIONES',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            {/* Ícono de Ojo */}
            <IconButton>
              <i className='ri-eye-line text-textSecondary' />
            </IconButton>

            {/* Ícono de Check */}
            <IconButton>
              <i className='ri-checkbox-circle-line text-textSecondary' />
            </IconButton>

            {/* Menú de opciones (tres puntos) */}
            <OptionMenu
              iconButtonProps={{ size: 'medium', className: 'text-textSecondary' }}
              options={[
                {
                  text: 'Documento',
                  icon: 'ri-file-list-line',
                  menuItemProps: {
                    onClick: () => {
                      // Acción de documento
                      console.log(`Documento de fila con ID: ${row.original.id}`)
                    }
                  }
                },
                {
                  text: 'Editar',
                  icon: 'ri-pencil-line',
                  menuItemProps: {
                    onClick: () => {
                      // Acción de editar
                      console.log(`Editar fila con ID: ${row.original.id}`)
                    }
                  }
                },
                {
                  text: 'Historial',
                  icon: 'ri-history-line',
                  menuItemProps: {
                    onClick: () => {
                      // Abrir el PopUp de historial
                      handleOpenHistorial(row.original.id) // Pasa el ID de la fila para cargar su historial
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        pageSize: 8
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
        <CardHeader title='' />
        <div className='p-5'>
          <Grid container spacing={2} alignItems='center'>
            {[
              { title: 'Por Ensayar', value: 347, color: '#9e9e9e', flex: 1 }, // Gris
              { title: 'Por Digitar', value: 125, color: '#2196f3', flex: 1 }, // Azul
              { title: 'Por Enviar Digitación', value: 136, color: '#00bcd4', flex: 2 }, // Celeste
              { title: 'Por Revisar', value: 77, color: '#9c27b0', flex: 1 }, // Morado
              { title: 'Por Corregir', value: 0, color: '#f44336', flex: 1 }, // Rojo
              { title: 'Por Firmar', value: 200, color: '#ff9800', flex: 1 }, // Amarillo
              { title: 'Por Enviar (Firmados)', value: 629, color: '#4caf50', flex: 2 }, // Verde
              { title: 'Firmados Pagados', value: '18/2,9%', color: '#388e3c', flex: 3 } // Verde
            ].map((card, index) => (
              <Grid item xs={card.flex} key={index}>
                <Card
                  sx={{
                    backgroundColor: '#ffffff', // Fondo blanco
                    textAlign: 'center',
                    borderRadius: 2,
                    boxShadow: '0px 3px 5px rgba(0,0,0,0.1)', // Sombra suave
                    borderBottom: `2px solid ${card.color}`, // Línea inferior de color
                    padding: 2
                  }}
                >
                  <Typography
                    variant='subtitle2'
                    sx={{
                      color: '#424242', // Texto en gris oscuro
                      fontWeight: 'bold'
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant='h5'
                    sx={{
                      fontWeight: 'bold',
                      color: '#000' // Texto negro
                    }}
                  >
                    {card.value}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>

        <TableFilters setData={setFilteredData} tableData={data} />
        <Divider />
        <div className='p-5'>
          <Grid container spacing={2} alignItems='center'>
            {/* Botón Exportar */}
            <Grid item xs={3}>
              <Button
                color='secondary'
                variant='outlined'
                startIcon={<i className='ri-upload-2-line text-xl' />}
                sx={{
                  padding: '6px 16px', // Ajusta el relleno interno
                  minWidth: 'auto' // Ajusta el ancho mínimo al contenido
                }}
              >
                Exportar
              </Button>
            </Grid>

            {/* Espacio Invisible */}
            <Grid item xs={5}></Grid>

            {/* Barra de Búsqueda */}
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

      <HistorialPopup open={openHistorial} onClose={handleCloseHistorial} data={historialData} />

      <AddUserDrawer
        open={addUserOpen}
        handleClose={() => setAddUserOpen(!addUserOpen)}
        userData={data}
        setData={setData}
      />
    </>
  )
}

export default UserListTable2
