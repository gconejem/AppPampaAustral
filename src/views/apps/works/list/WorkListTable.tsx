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
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

// Third-party Imports
import axios from 'axios'
import { toast } from 'react-hot-toast'
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
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { UsersType } from '@/types/apps/userTypes'
import type { Locale } from '@configs/i18n'
import type { Obra, WorkTypeWithAction } from '@/types/forms/obra'

// Component Imports
import TableFilters from './TableFilters'
import AddWork from './AddWork'
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import EditWorksForm from '../edit/EditWorksForm'

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
const columnHelper = createColumnHelper<WorkTypeWithAction>()

const WorkListTable = ({ tableData }: { tableData?: UsersType[] }) => {
  // States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<WorkTypeWithAction[]>([])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null)
  const [editObraOpen, setEditObraOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [obraToDelete, setObraToDelete] = useState<number | null>(null)
  const [selectedObraId, setSelectedObraId] = useState<number | null>(null)
  const [addObraOpen, setAddObraOpen] = useState<boolean>(false)

  // Hooks
  const params = useParams()
  const locale = (params?.lang as string) || 'es'

  // Agregar este useEffect para cargar los datos
  useEffect(() => {
    const fetchObras = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get('/api/obras')

        setData(response.data)
      } catch (error) {
        console.error('Error fetching obras:', error)
        toast.error('Error al cargar las obras')
      } finally {
        setIsLoading(false)
      }
    }

    fetchObras()
  }, [])

  const handleDeleteClick = async (id: number) => {
    try {
      const response = await axios.delete(`/api/obras/${id}`)

      if (response.status === 200) {
        toast.success('Obra eliminada exitosamente')
        setData(prevData => prevData.filter(obra => obra.obraId !== id))
      }
    } catch (error) {
      console.error('Error deleting obra:', error)
      toast.error('Error al eliminar la obra')
    } finally {
      setDeleteDialogOpen(false)
      setSelectedObraId(null)
    }
  }

  const handleEdit = async (obra: Obra) => {
    try {
      const response = await axios.get(`/api/obras/${obra.obraId}`)

      setSelectedObra(response.data)
      setEditObraOpen(true)
    } catch (error) {
      console.error('Error al obtener datos:', error)
      toast.error('Error al cargar los datos de la obra')
    }
  }

  const handleExport = () => {
    const doc = new jsPDF()

    // Obtener las obras seleccionadas
    const selectedRows = table.getSelectedRowModel().rows

    const dataToExport = selectedRows.length > 0 ? selectedRows.map(row => row.original) : data // Si no hay selección, exportar todos

    // Configurar el título
    doc.setFontSize(15)
    doc.text('Reporte de Obras', 14, 15)
    doc.setFontSize(10)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 25)

    // Configurar las columnas para la tabla
    const columns = [
      { header: 'OBRA', dataKey: 'numeroObra' },
      { header: 'NOMBRE OBRA', dataKey: 'nombreObra' },
      { header: 'COMUNA', dataKey: 'comuna' },
      { header: 'RUT CLIENTE', dataKey: 'rut' },
      { header: 'CLIENTE', dataKey: 'nombreCliente' },
      { header: 'ESTADO', dataKey: 'estado' }
    ]

    // Preparar los datos para la tabla
    const rows = dataToExport.map(obra => ({
      numeroObra: obra.numeroObra,
      nombreObra: obra.nombreObra,
      comuna: obra.comuna,
      rut: obra.rut,
      nombreCliente: obra.nombreCliente,
      estado: obra.estado
    }))

    // Generar la tabla
    doc.autoTable({
      startY: 35,
      head: [columns.map(col => col.header)],
      body: rows.map(row => columns.map(col => row[col.dataKey as keyof typeof row])),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })

    // Guardar el PDF
    doc.save('reporte-obras.pdf')
  }

  const columns = useMemo(
    () => [
      // Columna de selección
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
      columnHelper.accessor('numeroObra', {
        header: 'OBRA',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.numeroObra}
          </Typography>
        )
      }),
      columnHelper.accessor('nombreObra', {
        header: 'NOMBRE OBRA',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.nombreObra}
          </Typography>
        )
      }),
      columnHelper.accessor('comuna', {
        header: 'COMUNA',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.comuna}
          </Typography>
        )
      }),
      columnHelper.accessor('rut', {
        header: 'RUT CLIENTE',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.rut}
          </Typography>
        )
      }),
      columnHelper.accessor('nombreCliente', {
        header: 'CLIENTE',
        cell: ({ row }) => (
          <Typography variant='body2' className='text-[13px]'>
            {row.original.nombreCliente}
          </Typography>
        )
      }),
      columnHelper.accessor('contactos', {
        header: 'ENCARGADO',
        cell: ({ row }) => {
          const encargado = row.original.contactos?.find(c => c.rol === 'encargado_obra')

          return (
            <Typography variant='body2' className='text-[13px]'>
              {encargado?.nombre || '-'}
            </Typography>
          )
        }
      }),
      columnHelper.accessor('estado', {
        header: 'ESTADO',
        cell: ({ row }) => (
          <Chip
            label={row.original.estado === 'activo' ? 'Activo' : 'Inactivo'}
            color={row.original.estado === 'activo' ? 'success' : 'error'}
            sx={{ height: 24, fontSize: '0.75rem' }}
          />
        )
      }),
      columnHelper.accessor('action', {
        header: 'ACCIONES',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton onClick={() => handleEdit(row.original)} sx={{ color: 'primary.main' }}>
              <i className='ri-pencil-line' />
            </IconButton>
            <IconButton
              onClick={() => {
                setSelectedObraId(row.original.obraId)
                setDeleteDialogOpen(true)
              }}
              sx={{ color: 'error.main' }}
            >
              <i className='ri-delete-bin-line' />
            </IconButton>
          </div>
        )
      })
    ],
    [handleEdit, setSelectedObraId, setDeleteDialogOpen]
  )

  const table = useReactTable({
    data: filteredData as WorkTypeWithAction[],
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
    enableRowSelection: true, //enable row selection for all rows
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

  const renderClient = (row: WorkType) => {
    return (
      <div className='flex items-center'>
        {row.nombreCliente ? getInitials(row.nombreCliente) : ''}
        <div className='flex flex-col'>
          <Typography className='font-medium' color='text.primary'>
            {row.nombreCliente}
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title={<Typography variant='h6'>Obras</Typography>}
          action={
            <Button
              variant='contained'
              onClick={() => setAddUserOpen(true)}
              startIcon={<i className='ri-add-line' />}
              sx={{ borderRadius: '5px' }}
            >
              Nueva Obra
            </Button>
          }
        />

        <TableFilters setData={setFilteredData} tableData={data} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button
            color='secondary'
            variant='outlined'
            startIcon={<i className='ri-upload-2-line text-xl' />}
            onClick={handleExport}
            disabled={isLoading}
            className='max-sm:is-full'
          >
            Exportar
          </Button>
          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Buscar' // Ajusté el texto a "Buscar" como en la imagen
              style={{ width: '500px' }}
              className='max-sm:is-full min-is-[200px]'
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' /> {/* Icono de búsqueda */}
                  </InputAdornment>
                ),
                sx: {
                  padding: '8px', // Ajustamos el relleno para hacerlo más amplio
                  borderRadius: '8px', // Borde redondeado similar a la imagen
                  border: '1px solid #E0E0E0' // Color suave para el borde
                }
              }}
            />
          </div>
        </div>
        {isLoading ? (
          <div className='flex justify-center p-5'>
            <CircularProgress />
          </div>
        ) : (
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
                      No hay datos disponibles
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
        )}
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
      <AddWork open={addObraOpen} handleClose={() => setAddObraOpen(false)} setData={setData} />
      <EditWorksForm
        open={editObraOpen}
        handleClose={() => {
          setEditObraOpen(false)
          setSelectedObra(null)
        }}
        obraData={selectedObra}
        setData={setData}
      />
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>¿Está seguro que desea eliminar esta obra?</DialogContent>
        <DialogActions>
          <Button variant='outlined' color='secondary' onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant='contained' color='error' onClick={() => selectedObraId && handleDeleteClick(selectedObraId)}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default WorkListTable
