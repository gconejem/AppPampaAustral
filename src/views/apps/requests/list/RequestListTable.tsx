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

// Component Imports
import PickersRange from './date'
import TableFilters from './TableFilters'
import OptionMenu from '@core/components/option-menu'

// Type Imports
import type { ThemeColor } from '@core/types'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

type SolicitudType = {
  id: number
  numeroSolicitud: string
  fecha: string
  cliente: string
  obra: string
  comuna: string
  estadoOperacional: string
  estadoAdministrativo: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
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
  }, [value, debounce, onChange])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Column Definitions
const columnHelper = createColumnHelper<SolicitudType>()

function RequestListTable({ tableData }: { tableData?: SolicitudType[] }) {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || [])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<SolicitudType, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      columnHelper.accessor('numeroSolicitud', {
        header: 'N° Solicitud',
        cell: ({ row }) => <Typography>{row.original.numeroSolicitud}</Typography>
      }),
      columnHelper.accessor('fecha', {
        header: 'Fecha',
        cell: ({ row }) => <Typography>{row.original.fecha}</Typography>
      }),
      columnHelper.accessor('cliente', {
        header: 'Cliente',
        cell: ({ row }) => <Typography>{row.original.cliente}</Typography>
      }),
      columnHelper.accessor('obra', {
        header: 'N° Obra',
        cell: ({ row }) => <Typography>{row.original.obra}</Typography>
      }),
      columnHelper.accessor('comuna', {
        header: 'Comuna',
        cell: ({ row }) => <Typography>{row.original.comuna}</Typography>
      }),
      columnHelper.accessor('estadoOperacional', {
        header: 'Estado Operacional',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.estadoOperacional}
            color={getEstadoOperacionalColor(row.original.estadoOperacional)}
            size='small'
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('estadoAdministrativo', {
        header: 'Estado Administrativo',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.estadoAdministrativo}
            color={getEstadoAdministrativoColor(row.original.estadoAdministrativo)}
            size='small'
            className='capitalize'
          />
        )
      })
    ],
    []
  )

  const getEstadoOperacionalColor = (estado: string): ThemeColor => {
    const colors: Record<string, ThemeColor> = {
      'PENDIENTE': 'warning',
      'EN_PROCESO': 'info',
      'FINALIZADO': 'success',
      'CANCELADO': 'error'
    }
    return colors[estado] || 'default'
  }

  const getEstadoAdministrativoColor = (estado: string): ThemeColor => {
    const colors: Record<string, ThemeColor> = {
      'PENDIENTE': 'warning',
      'APROBADO': 'success',
      'RECHAZADO': 'error',
      'EN_REVISION': 'info'
    }
    return colors[estado] || 'default'
  }

  const table = useReactTable({
    data: filteredData,
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
    <Card>
      <CardHeader title='' />
      <TableFilters setData={setFilteredData} tableData={data} />
      <Divider />
      <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
        <Typography variant='h6' color='text.primary' className='max-sm:is-full'>
          Lista de Solicitudes
        </Typography>
        <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
          <PickersRange />
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Buscar RUT o N° Obra'
            className='max-sm:is-full min-is-[200px]'
          />
        </div>
      </div>
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
                        {{
                          asc: <i className='ri-arrow-up-s-line text-xl' />,
                          desc: <i className='ri-arrow-down-s-line text-xl' />
                        }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        rowsPerPageOptions={[]}
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
      />
    </Card>
  )
}

export default RequestListTable
