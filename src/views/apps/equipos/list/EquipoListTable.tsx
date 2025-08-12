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
import DeleteIcon from '@mui/icons-material/Delete'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Box from '@mui/material/Box'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'

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
import type { Equipo, TipoEquipo, Laboratorista } from '@/types/apps/equipoTypes'

// Component Imports
import AddEquipo from './AddEquipo'
import EditEquipo from '../edit/EditEquipo'
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

const DebouncedInput = ({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) => {
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

const EquipoListTable = ({ equipoData, setData }: Props) => {
    // States
    const [addEquipoOpen, setAddEquipoOpen] = useState(false)
    const [editEquipoOpen, setEditEquipoOpen] = useState(false)
    const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null)
    const [deleteEquipoOpen, setDeleteEquipoOpen] = useState(false)
    const [equipoToDelete, setEquipoToDelete] = useState<Equipo | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState<SortingState>([{ id: 'tipoEquipo', desc: false }])
    const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([])
    const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])

    // Hooks
    const { lang: locale } = useParams()

    // Fetch data on component mount
    useEffect(() => {
        fetchEquipos()
        fetchTiposEquipo()
        fetchLaboratoristas()
    }, [])

    const fetchEquipos = async () => {
        try {
            setIsLoading(true)
            const response = await axios.get('/api/equipos?limit=100')
            setData(response.data.equipos || [])
        } catch (error) {
            console.error('Error fetching equipos:', error)
            toast.error('Error al cargar los equipos')
        } finally {
            setIsLoading(false)
        }
    }

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

    const handleDeleteEquipo = async () => {
        if (!equipoToDelete) return

        try {
            await axios.delete(`/api/equipos/${equipoToDelete.id}`)
            setData(prevData => prevData.filter(equipo => equipo.id !== equipoToDelete.id))
            toast.success('Equipo eliminado correctamente')
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Error al eliminar el equipo'
            toast.error(errorMessage)
        } finally {
            setDeleteEquipoOpen(false)
            setEquipoToDelete(null)
        }
    }

    const handleEditEquipo = (equipo: Equipo) => {
        setSelectedEquipo(equipo)
        setEditEquipoOpen(true)
    }

    const handleDeleteClick = (equipo: Equipo) => {
        setEquipoToDelete(equipo)
        setDeleteEquipoOpen(true)
    }

    // Columns definition
    const columns = useMemo(
        () => [
            columnHelper.accessor('codigo', {
                header: 'Código',
                cell: ({ row }) => (
                    <Typography color='text.primary' className='font-medium'>
                        {row.original.codigo}
                    </Typography>
                )
            }),
            columnHelper.accessor('nombre', {
                header: 'Nombre',
                cell: ({ row }) => (
                    <Typography color='text.primary'>
                        {row.original.nombre}
                    </Typography>
                )
            }),
            columnHelper.accessor('tipoEquipo', {
                header: 'Tipo',
                cell: ({ row }) => (
                    <Chip
                        variant='tonal'
                        label={row.original.tipoEquipo.tipo}
                        size='small'
                        color='info'
                    />
                ),
                sortingFn: (rowA, rowB) => {
                    const tipoA = rowA.original.tipoEquipo.tipo
                    const tipoB = rowB.original.tipoEquipo.tipo
                    return tipoA.localeCompare(tipoB)
                }
            }),
            columnHelper.accessor('funcionarioAsignado', {
                header: 'Asignado a',
                cell: ({ row }) => {
                    const funcionario = row.original.funcionarioAsignado
                    return funcionario ? (
                        <Typography color='text.primary'>
                            {funcionario.name}
                        </Typography>
                    ) : (
                        <Chip
                            variant='tonal'
                            label='Sin asignar'
                            size='small'
                            color='default'
                        />
                    )
                }
            }),
            columnHelper.accessor('estado', {
                header: 'Estado',
                cell: ({ row }) => (
                    <Chip
                        variant='tonal'
                        label={row.original.estado}
                        size='small'
                        color={row.original.estado === 'Activo' ? 'success' : 'default'}
                    />
                )
            }),
            columnHelper.accessor('serie', {
                header: 'Serie',
                cell: ({ row }) => (
                    <Typography color='text.primary'>
                        {row.original.serie || '-'}
                    </Typography>
                )
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Acciones',
                cell: ({ row }) => (
                    <div className='flex items-center'>
                        <IconButton size='small' onClick={() => handleEditEquipo(row.original)}>
                            <i className='ri-edit-box-line text-[22px] text-textSecondary' />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDeleteClick(row.original)}>
                            <i className='ri-delete-bin-7-line text-[22px] text-textSecondary' />
                        </IconButton>
                    </div>
                ),
                enableSorting: false
            })
        ],
        [locale]
    )

    const table = useReactTable({
        data: equipoData || [],
        columns,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        state: {
            globalFilter,
            sorting
        },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        globalFilterFn: fuzzyFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues()
    })

    return (
        <>
            <Card>
                <CardHeader title='Listado de Equipos' className='pbe-4' />
                <div className='flex justify-between gap-4 p-5 flex-col items-start sm:flex-row sm:items-center'>
                    <DebouncedInput
                        value={globalFilter ?? ''}
                        onChange={value => setGlobalFilter(String(value))}
                        placeholder='Buscar equipos...'
                        className='is-full sm:is-auto'
                    />
                    <div className='flex gap-4'>
                        <Button
                            variant='contained'
                            onClick={() => setAddEquipoOpen(!addEquipoOpen)}
                            className='is-full sm:is-auto'
                        >
                            Agregar Equipo
                        </Button>
                    </div>
                </div>
                <div className='overflow-x-auto'>
                    <MuiTable className={tableStyles.table}>
                        <MuiTableHead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <MuiTableRow key={headerGroup.id}>
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
                                    <MuiTableCell colSpan={table.getVisibleFlatColumns().length} className='text-center'>
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

            {/* Add Equipo Dialog */}
            <AddEquipo
                open={addEquipoOpen}
                handleClose={() => setAddEquipoOpen(false)}
                setData={setData}
                tiposEquipo={tiposEquipo}
                laboratoristas={laboratoristas}
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
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteEquipoOpen} onClose={() => setDeleteEquipoOpen(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que quieres eliminar el equipo "{equipoToDelete?.nombre}"?
                        Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteEquipoOpen(false)}>Cancelar</Button>
                    <Button onClick={handleDeleteEquipo} color='error' variant='contained'>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default EquipoListTable
