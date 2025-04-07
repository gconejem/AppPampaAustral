'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

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

// Agregar el tipo RCM
interface RCM {
  id: number
  numeroRcm: string
  fechaCodificacion: string
  fechaMuestreo: string
  fechaIngreso: string
  estado: string
  cliente?: {
    nombreCliente: string
    comuna: string
  }
  obra?: {
    numeroObra: string
  }
  servicios: Array<{
    codigo: string
    nombre: string
    cantidad: number
  }>
}

const UserListTable2 = () => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<RCM[]>([])
  const [filteredData, setFilteredData] = useState<RCM[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [openHistorial, setOpenHistorial] = useState(false)

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
  ])

  const [rcms, setRcms] = useState<RCM[]>([])

  // Fetch RCMs only once when component mounts
  useEffect(() => {
    const fetchRCMs = async () => {
      try {
        const response = await fetch('/api/rcm')
        const result = await response.json()

        setData(result)
        setFilteredData(result)
      } catch (error) {
        console.error('Error fetching RCMs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRCMs()
  }, [])

  const handleFilterChange = useCallback((newFilteredData: RCM[]) => {
    setFilteredData(newFilteredData)
  }, [])

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

  const columns = useMemo<ColumnDef<RCM>[]>(
    () => [
      {
        id: 'numeroRcm',
        header: 'RCM',
        accessorKey: 'numeroRcm',
        cell: ({ row }) => <span>{row.original.numeroRcm}</span>
      },
      {
        id: 'obra',
        header: 'N° Obra',
        accessorKey: 'obra.numeroObra',
        cell: ({ row }) => <span>{row.original.obra?.numeroObra || '-'}</span>
      },
      {
        id: 'fechaCodificacion',
        header: 'Fecha Cod.',
        accessorKey: 'fechaCodificacion',
        cell: ({ row }) => <span>{new Date(row.original.fechaCodificacion).toLocaleDateString()}</span>
      },
      {
        id: 'fechaMuestreo',
        header: 'Fecha Mues.',
        accessorKey: 'fechaMuestreo',
        cell: ({ row }) => <span>{new Date(row.original.fechaMuestreo).toLocaleDateString()}</span>
      }
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const getAvatar = (params: Pick<RCM, 'avatar' | 'fullName'>) => {
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

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <Card>
      <CardHeader title='RCMs' />
      <TableFilters onFilterChange={handleFilterChange} initialData={data} />
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
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

export default UserListTable2
