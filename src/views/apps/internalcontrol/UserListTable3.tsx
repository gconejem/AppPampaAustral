'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

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
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'

// Third-party Imports
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

// Interface para servicios de OT
interface ServicioOT {
  id: number
  codigo: string
  servicio: string
  cantidad: number
  observacion?: string
  esSegundaVisita: boolean
}

// Definición básica para UsersType
interface UsersType {
  id: string
  [key: string]: any
}

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

// Column Definitions
const columnHelper = createColumnHelper<ServicioOT>()

const UserListTable3 = ({
  otId,
  otData,
  loading
}: {
  tableData?: UsersType[]
  otId?: string | null
  otData?: any
  loading?: boolean
}) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [serviciosData, setServiciosData] = useState<ServicioOT[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [loadingServicios, setLoadingServicios] = useState(false)

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Efecto para cargar los servicios asociados a la OT
  useEffect(() => {
    if (otData?.agenda?.servicios) {
      // Usar los servicios reales de la agenda asociada a la OT
      setServiciosData(otData.agenda.servicios)
      setLoadingServicios(false)
    } else {
      // Si no hay servicios, limpiar el array
      setServiciosData([])
      setLoadingServicios(false)
    }
  }, [otData])

  const columns = useMemo<ColumnDef<ServicioOT, any>[]>(
    () => [
      columnHelper.accessor('codigo', {
        header: 'CÓDIGO',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.codigo}</Typography>
      }),
      columnHelper.accessor('servicio', {
        header: 'SERVICIO',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.servicio}</Typography>
      }),
      columnHelper.accessor('cantidad', {
        header: 'CANTIDAD',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.cantidad}</Typography>
      }),
      columnHelper.accessor('observacion', {
        header: 'OBSERVACIÓN',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.observacion || '-'}</Typography>
      }),
      columnHelper.accessor('esSegundaVisita', {
        header: 'SEGUNDA VISITA',
        cell: ({ row }) => (
          <Chip
            label={row.original.esSegundaVisita ? 'Sí' : 'No'}
            size='small'
            color={row.original.esSegundaVisita ? 'info' : 'default'}
          />
        )
      }),
      columnHelper.accessor('id', {
        header: 'ACCIONES',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton size='small' color='secondary' onClick={() => console.log('Editar', row.original)}>
              <i className='ri-edit-line' />
            </IconButton>
            <IconButton size='small' color='info' onClick={() => console.log('Clonar', row.original)}>
              <i className='ri-file-copy-line' />
            </IconButton>
            <IconButton size='small' color='error' onClick={() => console.log('Eliminar', row.original)}>
              <i className='ri-delete-bin-line' />
            </IconButton>
          </div>
        )
      })
    ],
    []
  )

  const table = useReactTable({
    data: serviciosData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
      global: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // Si está cargando
  if (loading || loadingServicios) {
    return (
      <Card>
        <CardHeader
          title={
            <div className='flex items-center gap-2'>
              <span>Servicios</span>
              <IconButton onClick={toggleCollapse} size='small'>
                {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            </div>
          }
        />
        <Divider />
        <Typography p={4} textAlign='center'>
          Cargando servicios...
        </Typography>
      </Card>
    )
  }

  // Si no hay OT seleccionada
  if (!otId || !otData) {
    return (
      <Card>
        <CardHeader
          title={
            <div className='flex items-center gap-2'>
              <span>Servicios</span>
              <IconButton onClick={toggleCollapse} size='small'>
                {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            </div>
          }
        />
        <Divider />
        <Typography p={4} textAlign='center'>
          Seleccione una orden de trabajo para ver sus servicios asociados
        </Typography>
      </Card>
    )
  }

  // Renderizado normal con datos
  return (
    <Card>
      <CardHeader
        title={
          <div className='flex items-center gap-2'>
            <span>Servicios</span>
            <IconButton onClick={toggleCollapse} size='small'>
              {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          </div>
        }
        action={
          <Button
            variant='contained'
            size='small'
            startIcon={<i className='ri-add-line' />}
            onClick={() =>
              window.open(
                `/en/apps/encoder?otId=${otId}&tipo=${otData?.tipoOT || ''}&servicioId=${serviciosData.length > 0 ? serviciosData[0].id : ''}`,
                '_blank'
              )
            }
          >
            Crear Código
          </Button>
        }
      />
      <Divider />

      {!isCollapsed && (
        <>
          <Grid container spacing={2} sx={{ p: 5, pb: 3 }}>
            <Grid item xs={4}>
              <TextField
                fullWidth
                placeholder='Buscar servicio'
                value={globalFilter ?? ''}
                onChange={e => setGlobalFilter(e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                placeholder='Código'
                onChange={e => {
                  table.getColumn('codigo')?.setFilterValue(e.target.value)
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                placeholder='Cantidad'
                type='number'
                onChange={e => {
                  table.getColumn('cantidad')?.setFilterValue(e.target.value)
                }}
              />
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
                          <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className='text-center'>
                      No se encontraron servicios para esta OT
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
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
            component='div'
            count={serviciosData.length}
            rowsPerPage={table.getState().pagination.pageSize}
            page={table.getState().pagination.pageIndex}
            onPageChange={(_, page) => table.setPageIndex(page)}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </>
      )}
    </Card>
  )
}

export default UserListTable3
