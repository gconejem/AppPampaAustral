'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports

import VisibilityIcon from '@mui/icons-material/Visibility'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import TablePagination from '@mui/material/TablePagination'
import Grid from '@mui/material/Grid'
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
import type { InvoiceType } from '@/types/apps/invoiceTypes'
import type { Locale } from '@configs/i18n'

// Component Imports
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

type InvoiceTypeWithAction = InvoiceType & {
  action?: string
}

type InvoiceStatusObj = {
  [key: string]: {
    icon: string
    color: ThemeColor
  }
}

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
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Vars
const invoiceStatusObj: InvoiceStatusObj = {
  Sent: { color: 'secondary', icon: 'ri-send-plane-2-line' },
  Paid: { color: 'success', icon: 'ri-check-line' },
  Draft: { color: 'primary', icon: 'ri-mail-line' },
  'Partial Payment': { color: 'warning', icon: 'ri-pie-chart-2-line' },
  'Past Due': { color: 'error', icon: 'ri-information-line' },
  Downloaded: { color: 'info', icon: 'ri-arrow-down-line' }
}

// Column Definitions
const columnHelper = createColumnHelper<InvoiceTypeWithAction>()

const InvoiceListTable = ({ invoiceData }: { invoiceData?: InvoiceType[] }) => {
  // States
  const [status, setStatus] = useState<InvoiceType['invoiceStatus']>('')
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(...[invoiceData])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [creationDate, setCreationDate] = useState('')
  const [quoteType, setQuoteType] = useState('')

  // Hooks
  const { lang: locale } = useParams()

  const columns = useMemo<ColumnDef<InvoiceTypeWithAction, any>[]>(
    () => [
      columnHelper.accessor('rut', {
        header: 'Rut',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            {/* Texto principal con color negro */}
            <Typography variant='body1' color='text.primary'>
              160671982-3
            </Typography>
          </div>
        )
      }),

      columnHelper.accessor('name', {
        header: 'Nombre Comercial',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            {/* Texto principal con color negro */}
            <Typography variant='body1' color='text.primary'>
              Nombre Comercial
            </Typography>
          </div>
        )
      }),

      columnHelper.accessor('Ciudad', {
        header: 'Ciudad',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            {/* Texto principal con color negro */}
            <Typography variant='body1' color='text.primary'>
              Chillán
            </Typography>
          </div>
        )
      }),

      columnHelper.accessor('issuedDate', {
        header: 'Segmento',
        cell: ({ row }) => <Typography>Segmento</Typography>
      }),

      columnHelper.accessor('Contacto', {
        header: 'Contacto',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            {/* Texto principal con color negro */}
            <Typography variant='body1' color='text.primary'>
              Ver
            </Typography>
          </div>
        )
      }),

      columnHelper.accessor('invoiceStatus', {
        header: 'Estado',
        cell: () => (
          <Chip
            label='Pendiente'
            sx={{
              backgroundColor: '#ffebee', // Fondo rojo claro
              color: '#f44336', // Texto rojo
              fontWeight: 'bold',
              borderRadius: '16px', // Bordes redondeados
              padding: '0 8px', // Espaciado interno
              height: '24px' // Altura del chip
            }}
          />
        )
      }),
      columnHelper.accessor('action', {
        header: 'Acciones',
        cell: () => (
          <div className='flex items-center gap-2'>
            <IconButton color='default' size='small'>
              <VisibilityIcon fontSize='small' />
            </IconButton>

            <IconButton color='default' size='small'>
              <AttachMoneyIcon fontSize='small' />
            </IconButton>

            <IconButton color='default' size='small'>
              <EditIcon fontSize='small' />
            </IconButton>

            <IconButton color='default' size='small'>
              <MoreVertIcon fontSize='small' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    [data, filteredData]
  )

  const table = useReactTable({
    data: filteredData as InvoiceType[],
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
        pageSize: 10
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

  const getAvatar = (params: Pick<InvoiceType, 'avatar' | 'name'>) => {
    const { avatar, name } = params

    if (avatar) {
      return <CustomAvatar src={avatar} skin='light' size={34} />
    } else {
      return (
        <CustomAvatar skin='light' size={34}>
          {getInitials(name as string)}
        </CustomAvatar>
      )
    }
  }

  useEffect(() => {
    const filteredData = data?.filter(invoice => {
      if (status && invoice.invoiceStatus.toLowerCase().replace(/\s+/g, '-') !== status) return false

      return true
    })

    setFilteredData(filteredData)
  }, [status, data, setFilteredData])

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} justifyContent='space-between' alignItems='center'>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Fecha Creación</InputLabel>
              <Select value={creationDate} onChange={e => setCreationDate(e.target.value)}>
                <MenuItem value=''>Todos</MenuItem>
                <MenuItem value='Fecha1'>Fecha1</MenuItem>
                <MenuItem value='Fecha2'>Fecha2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Tipo Cotización</InputLabel>
              <Select value={quoteType} onChange={e => setQuoteType(e.target.value)}>
                <MenuItem value=''>Todos</MenuItem>
                <MenuItem value='Tipo1'>Tipo1</MenuItem>
                <MenuItem value='Tipo2'>Tipo2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size='small'>
              <InputLabel>Estado</InputLabel>
              <Select value={status} onChange={e => setStatus(e.target.value)}>
                <MenuItem value=''>Todos</MenuItem>
                <MenuItem value='Sent'>Sent</MenuItem>
                <MenuItem value='Paid'>Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <div className='flex justify-between items-center mt-4'>
          <Button
            variant='outlined'
            startIcon={<i className='ri-external-link-line' />}
            onClick={() => console.log('Exportando...')}
            style={{
              color: '#6e6e6e',
              borderColor: '#d1d1d1',
              textTransform: 'none',
              borderRadius: '8px'
            }}
          >
            Exportar
          </Button>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Buscar'
            className='min-is-[200px]'
          />
        </div>
      </CardContent>

      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={classnames({
                          'flex items-center': header.column.getIsSorted(),
                          'cursor-pointer select-none': header.column.getCanSort()
                        })}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <i className='ri-arrow-up-s-line text-xl' />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <i className='ri-arrow-down-s-line text-xl' />
                        ) : null}
                      </div>
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
                .map(row => (
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
            </tbody>
          )}
        </table>
      </div>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component='div'
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={table.getState().pagination.pageSize}
        page={table.getState().pagination.pageIndex}
        onPageChange={(_, page) => table.setPageIndex(page)}
        onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
      />
    </Card>
  )
}

export default InvoiceListTable
