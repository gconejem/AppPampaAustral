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
  id: string
  codigo: string
  fechaCodificacion: string
  fechaMuestreo: string
  area: string
  familia: string
  servicio: string
  estado: string
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
    if (otId) {
      const fetchServicios = async () => {
        try {
          setLoadingServicios(true)

          // En un caso real, esta API devolvería los servicios asociados a la OT
          // Por ahora, simulamos datos para la demostración

          // Esperar un poco para simular carga
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Datos simulados basados en el tipo de OT
          const serviciosSample: ServicioOT[] = []

          if (otData) {
            // Generar servicios según el tipo de OT
            if (otData.tipoOT === 'DENSIDADES') {
              serviciosSample.push({
                id: '1',
                codigo: 'S-D001',
                fechaCodificacion: new Date().toLocaleDateString(),
                fechaMuestreo: otData.createdAt ? new Date(otData.createdAt).toLocaleDateString() : '-',
                area: 'Suelos',
                familia: 'Densidad',
                servicio: 'Densidad Terreno',
                estado: 'Pendiente'
              })
              serviciosSample.push({
                id: '2',
                codigo: 'S-D002',
                fechaCodificacion: new Date().toLocaleDateString(),
                fechaMuestreo: otData.createdAt ? new Date(otData.createdAt).toLocaleDateString() : '-',
                area: 'Suelos',
                familia: 'Compactación',
                servicio: 'Proctor Modificado',
                estado: 'Pendiente'
              })
            } else if (otData.tipoOT === 'HORMIGON_FRESCO') {
              serviciosSample.push({
                id: '3',
                codigo: 'H-F001',
                fechaCodificacion: new Date().toLocaleDateString(),
                fechaMuestreo: otData.createdAt ? new Date(otData.createdAt).toLocaleDateString() : '-',
                area: 'Hormigones',
                familia: 'Muestreo',
                servicio: 'Toma de muestra hormigón fresco',
                estado: 'Pendiente'
              })
              serviciosSample.push({
                id: '4',
                codigo: 'H-F002',
                fechaCodificacion: new Date().toLocaleDateString(),
                fechaMuestreo: otData.createdAt ? new Date(otData.createdAt).toLocaleDateString() : '-',
                area: 'Hormigones',
                familia: 'Ensayo',
                servicio: 'Cono de Abrams',
                estado: 'Pendiente'
              })
            } else if (otData.tipoOT === 'RETIRO_PROBETA') {
              serviciosSample.push({
                id: '5',
                codigo: 'R-P001',
                fechaCodificacion: new Date().toLocaleDateString(),
                fechaMuestreo: otData.createdAt ? new Date(otData.createdAt).toLocaleDateString() : '-',
                area: 'Hormigones',
                familia: 'Retiro',
                servicio: 'Retiro Probeta',
                estado: 'Pendiente'
              })
            } else {
              // Servicio genérico para otros tipos de OT
              serviciosSample.push({
                id: '6',
                codigo: `${otData.tipoOT.substring(0, 1)}-001`,
                fechaCodificacion: new Date().toLocaleDateString(),
                fechaMuestreo: otData.createdAt ? new Date(otData.createdAt).toLocaleDateString() : '-',
                area: 'General',
                familia: 'General',
                servicio: `Servicio ${otData.tipoOT}`,
                estado: 'Pendiente'
              })
            }
          }

          setServiciosData(serviciosSample)
        } catch (error) {
          console.error('Error al cargar servicios:', error)
        } finally {
          setLoadingServicios(false)
        }
      }

      fetchServicios()
    } else {
      // Si no hay OT seleccionada, limpiar los servicios
      setServiciosData([])
    }
  }, [otId, otData])

  const columns = useMemo<ColumnDef<ServicioOT, any>[]>(
    () => [
      columnHelper.accessor('codigo', {
        header: 'CÓDIGO',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.codigo}</Typography>
      }),
      columnHelper.accessor('fechaCodificacion', {
        header: 'FECHA DE CODIFICACIÓN',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.fechaCodificacion}</Typography>
      }),
      columnHelper.accessor('fechaMuestreo', {
        header: 'FECHA DE MUESTREO',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.fechaMuestreo}</Typography>
      }),
      columnHelper.accessor('area', {
        header: 'ÁREA',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.area}</Typography>
      }),
      columnHelper.accessor('familia', {
        header: 'FAMILIA',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.familia}</Typography>
      }),
      columnHelper.accessor('servicio', {
        header: 'SERVICIO',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.servicio}</Typography>
      }),
      columnHelper.accessor('estado', {
        header: 'ESTADO OP',
        cell: ({ row }) => (
          <Chip
            label={row.original.estado}
            size='small'
            color={row.original.estado === 'Pendiente' ? 'warning' : 'success'}
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
      fuzzy: fuzzyFilter
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
                `http://localhost:3001/en/apps/encoder?otId=${otId}&tipo=${otData?.tipoOT || ''}&servicioId=${serviciosData.length > 0 ? serviciosData[0].id : ''}`,
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
              <TextField fullWidth placeholder='Área' />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth placeholder='Familia' />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth placeholder='Fecha de Codificación' type='date' InputLabelProps={{ shrink: true }} />
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
