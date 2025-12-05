'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

import axios from 'axios'

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
import InputAdornment from '@mui/material/InputAdornment'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Tooltip from '@mui/material/Tooltip'
import EditIcon from '@mui/icons-material/Edit'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Box from '@mui/material/Box'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'

// Importar los componentes de tabla con alias
import {
    Table as MuiTable,
    TableBody as MuiTableBody,
    TableCell as MuiTableCell,
    TableContainer as MuiTableContainer,
    TableHead as MuiTableHead,
    TableRow as MuiTableRow
} from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import { toast } from 'react-hot-toast'
import type { Table, Row } from '@tanstack/react-table'
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
    getSortedRowModel,
    SortingState
} from '@tanstack/react-table'

// Type Imports
import type { Equipo, TipoEquipo, Laboratorista, Area } from '@/types/apps/equipoTypes'

// Component Imports
import AddEquipo from './AddEquipo'
import EditEquipo from '../edit/EditEquipo'
import TableFilters from './TableFilters'
import OptionMenu from '@core/components/option-menu'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Interface Props
interface Props {
    equipoData: Equipo[]
    setData: (data: Equipo[] | ((prevData: Equipo[]) => Equipo[])) => void
}

// Column Helper
const columnHelper = createColumnHelper<Equipo>()

const fuzzyFilter = (row: any, columnId: string, value: string, addMeta: any) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({ itemRank })
    return itemRank.passed
}

const EquipoListTable = ({ equipoData, setData }: Props) => {
    // States
    const [addEquipoOpen, setAddEquipoOpen] = useState(false)
    const [editEquipoOpen, setEditEquipoOpen] = useState(false)
    const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)
    const [detailsEquipoOpen, setDetailsEquipoOpen] = useState(false)
    const [equipoToView, setEquipoToView] = useState<Equipo | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [sorting, setSorting] = useState<SortingState>([{ id: 'id', desc: false }])
    const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([])
    const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
    const [areas, setAreas] = useState<Area[]>([])

    // Filter states
    const [filters, setFilters] = useState<{
        tipoEquipoId: string | string[]
        estado: string | string[]
        areaId: string | string[]
        funcionarioAsignadoId: string | string[]
        search: string
    }>({
        tipoEquipoId: '',
        estado: '',
        areaId: '',
        funcionarioAsignadoId: '',
        search: ''
    })

    // Hooks
    const params = useParams()
    const locale = params?.lang as string | undefined

    // Fetch data on component mount
    useEffect(() => {
        fetchTiposEquipo()
        fetchLaboratoristas()
        fetchAreas()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fetch equipos when filters change
    useEffect(() => {
        fetchEquipos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters])

    const fetchEquipos = useCallback(async () => {
        try {
            setIsLoading(true)
            const params = new URLSearchParams({ limit: '1000' })

            // Agregar búsqueda de texto libre
            if (filters.search) {
                params.append('search', filters.search)
            }

            // Manejar filtros que pueden ser arrays
            if (filters.tipoEquipoId) {
                if (Array.isArray(filters.tipoEquipoId)) {
                    filters.tipoEquipoId.forEach(id => params.append('tipoEquipoId', id))
                } else {
                    params.append('tipoEquipoId', filters.tipoEquipoId)
                }
            }

            if (filters.estado) {
                if (Array.isArray(filters.estado)) {
                    filters.estado.forEach(estado => params.append('estado', estado))
                } else {
                    params.append('estado', filters.estado)
                }
            }

            if (filters.areaId) {
                if (Array.isArray(filters.areaId)) {
                    filters.areaId.forEach(id => params.append('areaId', id))
                } else {
                    params.append('areaId', filters.areaId)
                }
            }

            if (filters.funcionarioAsignadoId) {
                if (Array.isArray(filters.funcionarioAsignadoId)) {
                    filters.funcionarioAsignadoId.forEach(id => params.append('funcionarioAsignadoId', id))
                } else {
                    params.append('funcionarioAsignadoId', filters.funcionarioAsignadoId)
                }
            }

            const response = await axios.get(`/api/equipos?${params.toString()}`)
            setData(response.data.equipos || [])
        } catch (error) {
            console.error('Error fetching equipos:', error)
            toast.error('Error al cargar los equipos')
        } finally {
            setIsLoading(false)
        }
    }, [filters, setData])

    const fetchTiposEquipo = async () => {
        try {
            const response = await axios.get('/api/equipos/tipos')
            setTiposEquipo(response.data)
        } catch (error) {
            console.error('Error fetching tipos de equipo:', error)
        }
    }

    const fetchLaboratoristas = async () => {
        try {
            const response = await axios.get('/api/equipos/laboratoristas')
            setLaboratoristas(response.data)
        } catch (error) {
            console.error('Error fetching laboratoristas:', error)
        }
    }

    const fetchAreas = async () => {
        try {
            const response = await axios.get('/api/equipos/areas')
            setAreas(response.data)
        } catch (error) {
            console.error('Error fetching areas:', error)
        }
    }

    const handleEditEquipo = (equipo: Equipo) => {
        setSelectedEquipo(equipo)
        setEditEquipoOpen(true)
    }

    const handleViewDetails = (equipo: Equipo) => {
        setEquipoToView(equipo)
        setDetailsEquipoOpen(true)
    }

    const handleFilterChange = useCallback((newFilters: typeof filters) => {
        setFilters(newFilters)
    }, [])

    const handleExport = useCallback(async () => {
        try {
            setIsLoading(true)
            const params = new URLSearchParams()

            // Agregar búsqueda de texto libre
            if (filters.search) {
                params.append('search', filters.search)
            }

            // Manejar filtros que pueden ser arrays
            if (filters.tipoEquipoId) {
                if (Array.isArray(filters.tipoEquipoId)) {
                    filters.tipoEquipoId.forEach(id => params.append('tipoEquipoId', id))
                } else {
                    params.append('tipoEquipoId', filters.tipoEquipoId)
                }
            }

            if (filters.estado) {
                if (Array.isArray(filters.estado)) {
                    filters.estado.forEach(estado => params.append('estado', estado))
                } else {
                    params.append('estado', filters.estado)
                }
            }

            if (filters.areaId) {
                if (Array.isArray(filters.areaId)) {
                    filters.areaId.forEach(id => params.append('areaId', id))
                } else {
                    params.append('areaId', filters.areaId)
                }
            }

            if (filters.funcionarioAsignadoId) {
                if (Array.isArray(filters.funcionarioAsignadoId)) {
                    filters.funcionarioAsignadoId.forEach(id => params.append('funcionarioAsignadoId', id))
                } else {
                    params.append('funcionarioAsignadoId', filters.funcionarioAsignadoId)
                }
            }

            const response = await axios.get(`/api/equipos/export?${params.toString()}`, {
                responseType: 'blob'
            })

            // Crear un enlace de descarga
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `equipos_${new Date().toISOString().split('T')[0]}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            toast.success('Equipos exportados correctamente')
        } catch (error) {
            console.error('Error exporting equipos:', error)
            toast.error('Error al exportar los equipos')
        } finally {
            setIsLoading(false)
        }
    }, [filters])

    // Columns definition
    const columns = useMemo(
        () => [
            columnHelper.accessor('id', {
                header: '# CORRELATIVO',
                cell: ({ row }) => (
                    <Typography color='text.primary' className='font-medium'>
                        {String(row.original.id).padStart(3, '0')}
                    </Typography>
                ),
                size: 120
            }),
            columnHelper.accessor('codigo', {
                header: 'CÓDIGO',
                cell: ({ row }) => (
                    <Typography color='text.primary' className='font-medium'>
                        {row.original.codigo}
                    </Typography>
                ),
                size: 120
            }),
            columnHelper.accessor('tipoEquipo', {
                header: 'TIPO',
                cell: ({ row }) => (
                    <Typography color='text.primary'>
                        {row.original.tipoEquipo.tipo}
                    </Typography>
                ),
                sortingFn: (rowA, rowB) => {
                    const tipoA = rowA.original.tipoEquipo.tipo
                    const tipoB = rowB.original.tipoEquipo.tipo
                    return tipoA.localeCompare(tipoB)
                },
                size: 150
            }),
            columnHelper.accessor('nombre', {
                header: 'DESCRIPCIÓN',
                cell: ({ row }) => (
                    <Typography color='text.primary'>
                        {row.original.nombre}
                    </Typography>
                ),
                size: 250
            }),
            columnHelper.accessor('serie', {
                header: 'N° SERIE',
                cell: ({ row }) => (
                    <Typography color='text.primary'>
                        {row.original.serie || '-'}
                    </Typography>
                ),
                size: 150
            }),
            columnHelper.accessor('area', {
                header: 'ÁREA DE USO',
                cell: ({ row }) => {
                    const area = row.original.area
                    return area ? (
                        <Typography color='text.primary'>
                            {area.nombre}
                        </Typography>
                    ) : (
                        <Typography color='text.secondary'>
                            -
                        </Typography>
                    )
                },
                sortingFn: (rowA, rowB) => {
                    const areaA = rowA.original.area?.nombre || ''
                    const areaB = rowB.original.area?.nombre || ''
                    return areaA.localeCompare(areaB)
                },
                size: 150
            }),
            columnHelper.accessor('funcionarioAsignado', {
                header: 'FUNCIONARIO',
                cell: ({ row }) => {
                    const funcionario = row.original.funcionarioAsignado
                    return funcionario ? (
                        <Typography color='text.primary'>
                            {funcionario.name}
                        </Typography>
                    ) : (
                        <Typography color='text.secondary'>
                            -
                        </Typography>
                    )
                },
                size: 200
            }),
            columnHelper.accessor('estado', {
                header: 'ESTADO',
                cell: ({ row }) => (
                    <Chip
                        variant='tonal'
                        label={row.original.estado}
                        size='small'
                        color={row.original.estado === 'Activo' ? 'success' : 'default'}
                    />
                ),
                size: 120
            }),
            columnHelper.display({
                id: 'actions',
                header: 'ACCIONES',
                cell: ({ row }) => (
                    <div className='flex items-center gap-1'>
                        <Tooltip title='Ver detalles'>
                            <IconButton size='small' onClick={() => handleViewDetails(row.original)}>
                                <i className='ri-eye-line text-[22px] text-textSecondary' />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Editar'>
                            <IconButton size='small' onClick={() => handleEditEquipo(row.original)}>
                                <i className='ri-edit-box-line text-[22px] text-textSecondary' />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title='Activar/Desactivar'>
                            <IconButton size='small'>
                                <i className='ri-power-line text-[22px] text-textSecondary' />
                            </IconButton>
                        </Tooltip>
                    </div>
                ),
                enableSorting: false,
                size: 150
            })
        ],
        [locale]
    )

    const table = useReactTable({
        data: equipoData || [],
        columns,
        state: {
            sorting
        },
        initialState: {
            pagination: {
                pageSize: 10
            }
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues()
    } as any)

    return (
        <>
            <Grid container spacing={6}>
                {/* Filters Card */}
                <Grid item xs={12}>
                    <TableFilters
                        onFilterChange={handleFilterChange}
                        onExport={handleExport}
                        tiposEquipo={tiposEquipo}
                        laboratoristas={laboratoristas}
                        areas={areas}
                    />
                </Grid>

                {/* Main Table Card */}
                <Grid item xs={12}>
                    <Card>
                        <div className='flex justify-between items-center p-5'>
                            <Typography variant='body2' color='text.secondary'>
                                Mostrando 1 a {table.getRowModel().rows.length} de {equipoData.length} resultados
                            </Typography>
                            <Button
                                variant='contained'
                                onClick={() => setAddEquipoOpen(!addEquipoOpen)}
                                startIcon={<i className='ri-add-line' />}
                            >
                                Nuevo equipo
                            </Button>
                        </div>
                        <Divider />
                        <div className='overflow-x-auto'>
                            <MuiTable className={tableStyles.table}>
                                <MuiTableHead>
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <MuiTableRow key={headerGroup.id}>
                                            <MuiTableCell padding='checkbox'>
                                                <Checkbox />
                                            </MuiTableCell>
                                            {headerGroup.headers.map(header => (
                                                <MuiTableCell key={header.id}>
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
                                                </MuiTableCell>
                                            ))}
                                        </MuiTableRow>
                                    ))}
                                </MuiTableHead>
                                {table.getFilteredRowModel().rows.length === 0 ? (
                                    <MuiTableBody>
                                        <MuiTableRow>
                                            <MuiTableCell colSpan={table.getVisibleFlatColumns().length + 1} className='text-center'>
                                                {isLoading ? (
                                                    <CircularProgress size={24} />
                                                ) : (
                                                    'No se encontraron equipos'
                                                )}
                                            </MuiTableCell>
                                        </MuiTableRow>
                                    </MuiTableBody>
                                ) : (
                                    <MuiTableBody>
                                        {table.getRowModel().rows.slice(0, table.getState().pagination.pageSize).map(row => {
                                            return (
                                                <MuiTableRow key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                                    <MuiTableCell padding='checkbox'>
                                                        <Checkbox />
                                                    </MuiTableCell>
                                                    {row.getVisibleCells().map(cell => (
                                                        <MuiTableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </MuiTableCell>
                                                    ))}
                                                </MuiTableRow>
                                            )
                                        })}
                                    </MuiTableBody>
                                )}
                            </MuiTable>
                        </div>
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
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
            </Grid>

            {/* Add Equipo Dialog */}
            <AddEquipo
                open={addEquipoOpen}
                handleClose={() => setAddEquipoOpen(false)}
                setData={setData}
                tiposEquipo={tiposEquipo}
                laboratoristas={laboratoristas}
                areas={areas}
            />

            {/* Edit Equipo Dialog */}
            {selectedEquipo && (
                <EditEquipo
                    open={editEquipoOpen}
                    handleClose={() => {
                        setEditEquipoOpen(false)
                        setSelectedEquipo(null)
                    }}
                    setData={setData}
                    equipo={selectedEquipo}
                    tiposEquipo={tiposEquipo}
                    laboratoristas={laboratoristas}
                    areas={areas}
                />
            )}

            {/* Details Dialog */}
            <Dialog
                open={detailsEquipoOpen}
                onClose={() => setDetailsEquipoOpen(false)}
                maxWidth='md'
                fullWidth
            >
                <DialogTitle className='flex items-center justify-between'>
                    <Typography variant='h5'>Detalles del Equipo</Typography>
                    <IconButton
                        onClick={() => setDetailsEquipoOpen(false)}
                        size='small'
                    >
                        <i className='ri-close-line' />
                    </IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    {equipoToView && (
                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    # Correlativo
                                </Typography>
                                <Typography variant='body1' className='font-medium'>
                                    {String(equipoToView.id).padStart(3, '0')}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Código
                                </Typography>
                                <Typography variant='body1' className='font-medium'>
                                    {equipoToView.codigo}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Tipo de Equipo
                                </Typography>
                                <Typography variant='body1'>
                                    {equipoToView.tipoEquipo.tipo}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Estado
                                </Typography>
                                <Chip
                                    variant='tonal'
                                    label={equipoToView.estado}
                                    size='small'
                                    color={equipoToView.estado === 'Activo' ? 'success' : 'default'}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Descripción
                                </Typography>
                                <Typography variant='body1'>
                                    {equipoToView.nombre}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    N° Serie
                                </Typography>
                                <Typography variant='body1'>
                                    {equipoToView.serie || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Marca
                                </Typography>
                                <Typography variant='body1'>
                                    {equipoToView.marca || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Modelo
                                </Typography>
                                <Typography variant='body1'>
                                    {equipoToView.modelo || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Área de Uso
                                </Typography>
                                <Typography variant='body1'>
                                    {equipoToView.area?.nombre || '-'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Funcionario Asignado
                                </Typography>
                                <Typography variant='body1'>
                                    {equipoToView.funcionarioAsignado?.name || '-'}
                                </Typography>
                            </Grid>
                            {equipoToView.observaciones && (
                                <Grid item xs={12}>
                                    <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                        Observaciones
                                    </Typography>
                                    <Typography variant='body1'>
                                        {equipoToView.observaciones}
                                    </Typography>
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Fecha de Creación
                                </Typography>
                                <Typography variant='body1'>
                                    {new Date(equipoToView.createdAt).toLocaleDateString('es-CL', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                                    Última Actualización
                                </Typography>
                                <Typography variant='body1'>
                                    {new Date(equipoToView.updatedAt).toLocaleDateString('es-CL', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <Divider />
                <DialogActions className='p-4'>
                    <Button onClick={() => setDetailsEquipoOpen(false)} variant='outlined'>
                        Cerrar
                    </Button>
                    <Button
                        onClick={() => {
                            setDetailsEquipoOpen(false)
                            if (equipoToView) {
                                handleEditEquipo(equipoToView)
                            }
                        }}
                        variant='contained'
                        startIcon={<i className='ri-edit-box-line' />}
                    >
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default EquipoListTable
