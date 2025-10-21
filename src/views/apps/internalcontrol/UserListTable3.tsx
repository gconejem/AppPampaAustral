'use client'

// React Imports
import { useEffect, useState, useMemo, useRef } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

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
  agendaId?: number
  codigo?: string
  servicio?: string
  cantidad?: number
  area?: string
  familia?: string
  nombreProducto?: string
  fechaCodificacion?: string
  fechaMuestreo?: string
  observacion?: string
  estadoOP?: string
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
  const [loadingServicios, setLoadingServicios] = useState(false)
  const [areaFilter, setAreaFilter] = useState('')
  const [familiaFilter, setFamiliaFilter] = useState('')
  const [areas, setAreas] = useState<Array<{ id: number, nombre: string }>>([])
  const [familias, setFamilias] = useState<Array<{ id: number, nombre: string, areaId: number }>>([])
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [loadingFamilias, setLoadingFamilias] = useState(false)

  // Efecto para cargar las áreas desde la API
  useEffect(() => {
    const fetchAreas = async () => {
      setLoadingAreas(true)
      try {
        const response = await fetch('/api/areas')
        if (response.ok) {
          const areasData = await response.json()
          setAreas(areasData)
        }
      } catch (error) {
        console.error('Error al cargar áreas:', error)
      } finally {
        setLoadingAreas(false)
      }
    }

    fetchAreas()
  }, [])

  // Efecto para cargar las familias cuando cambia el área seleccionada
  useEffect(() => {
    const fetchFamilias = async () => {
      if (!areaFilter) {
        setFamilias([])
        return
      }

      setLoadingFamilias(true)
      try {
        const areaSeleccionada = areas.find(area => area.nombre === areaFilter)
        if (areaSeleccionada) {
          const response = await fetch(`/api/familias?areaId=${areaSeleccionada.id}`)
          if (response.ok) {
            const familiasData = await response.json()
            setFamilias(familiasData)
          }
        }
      } catch (error) {
        console.error('Error al cargar familias:', error)
      } finally {
        setLoadingFamilias(false)
      }
    }

    fetchFamilias()
    // Limpiar el filtro de familia cuando cambia el área
    setFamiliaFilter('')
  }, [areaFilter, areas])

  // Efecto para cargar los servicios asociados a la OT
  useEffect(() => {
    if (otData?.agenda?.servicios) {
      console.log('Frontend - Datos de servicios recibidos:', otData.agenda.servicios)
      console.log('Frontend - Primer servicio:', otData.agenda.servicios[0])

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
      {
        id: 'select',
        header: ({ table }) => {
          const checkboxRef = useRef<HTMLInputElement>(null)

          useEffect(() => {
            if (checkboxRef.current) {
              checkboxRef.current.indeterminate = table.getIsSomeRowsSelected()
            }
          }, [table.getIsSomeRowsSelected()])

          return (
            <input
              ref={checkboxRef}
              type='checkbox'
              checked={table.getIsAllRowsSelected()}
              onChange={table.getToggleAllRowsSelectedHandler()}
            />
          )
        },
        cell: ({ row }) => (
          <input
            type='checkbox'
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      columnHelper.accessor('codigo', {
        header: 'CÓDIGO',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.codigo || '-'}</Typography>
      }),
      columnHelper.accessor('fechaCodificacion', {
        header: 'FECHA CODIFICACIÓN',
        cell: ({ row }) => {
          // Mostrar la fecha de hoy en formato dd-mm-aaaa
          const today = new Date()
          const fechaHoy = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
          return <Typography color='text.primary'>{fechaHoy}</Typography>
        }
      }),
      columnHelper.accessor('fechaMuestreo', {
        header: 'FECHA MUESTREO',
        cell: ({ row }) => {
          // Mostrar la fecha de hoy en formato dd-mm-aaaa
          const today = new Date()
          const fechaHoy = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`
          return <Typography color='text.primary'>{fechaHoy}</Typography>
        }
      }),
      columnHelper.accessor('area', {
        header: 'ÁREA',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.area || '-'}</Typography>
      }),
      columnHelper.accessor('familia', {
        header: 'FAMILIA',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.familia || '-'}</Typography>
      }),
      columnHelper.accessor('observacion', {
        header: 'OBSERVACIÓN',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.observacion || '-'}</Typography>
      }),
      columnHelper.accessor('estadoOP', {
        header: 'ESTADO OP',
        cell: ({ row }) => (
          <Chip
            label={row.original.estadoOP || 'Pendiente'}
            size='small'
            color={row.original.estadoOP === 'Completado' ? 'success' : 'default'}
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
        <Typography p={4} textAlign='center'>
          Cargando...
        </Typography>
      </Card>
    )
  }

  // Si no hay OT seleccionada
  if (!otId || !otData) {
    return (
      <Card>
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
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Filtrar por Área</InputLabel>
                <Select
                  value={areaFilter}
                  label='Filtrar por Área'
                  disabled={loadingAreas}
                  onChange={(e) => {
                    setAreaFilter(e.target.value)
                    table.getColumn('area')?.setFilterValue(e.target.value === '' ? undefined : e.target.value)
                  }}
                >
                  <MenuItem value=''>Todas las áreas</MenuItem>
                  {areas.map((area) => (
                    <MenuItem key={area.id} value={area.nombre}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Filtrar por Familia</InputLabel>
                <Select
                  value={familiaFilter}
                  label='Filtrar por Familia'
                  disabled={loadingFamilias || !areaFilter}
                  onChange={(e) => {
                    setFamiliaFilter(e.target.value)
                    table.getColumn('familia')?.setFilterValue(e.target.value === '' ? undefined : e.target.value)
                  }}
                >
                  <MenuItem value=''>Todas las familias</MenuItem>
                  {familias.map((familia) => (
                    <MenuItem key={familia.id} value={familia.nombre}>
                      {familia.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4} display='flex' justifyContent='flex-end'>
              <Button
                variant='contained'
                size='small'
                startIcon={<i className='ri-add-line' />}
                onClick={() =>
                  window.open(
                    `/en/apps/encoder?otId=${otId}&tipo=${otData?.tipoOT?.codigo || ''}&servicioId=${serviciosData.length > 0 ? serviciosData[0].id : ''}`,
                    '_blank'
                  )
                }
              >
                Crear Código
              </Button>
            </Grid>
          </Grid>
        }
      />
      <Divider />

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
    </Card>
  )
}

export default UserListTable3
