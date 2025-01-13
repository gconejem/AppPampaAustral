'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import Grid from '@mui/material/Grid'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import type { TextFieldProps } from '@mui/material/TextField'
import TableContainer from '@mui/material/TableContainer'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'

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
import type { Locale } from '@configs/i18n'
import type { ProductType } from '@/types/apps/ecommerceTypes'

// Component Imports
import TableFilters from './TableFilters'
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'

// Util Imports
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

type ProductCategoryType = {
  [key: string]: {
    icon: string
    color: ThemeColor
  }
}

type productStatusType = {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({
    itemRank
  })

  return itemRank.passed
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4
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
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Vars

const productCategoryObj: ProductCategoryType = {
  Accessories: { icon: 'ri-headphone-line', color: 'error' },
  'Home Decor': { icon: 'ri-home-6-line', color: 'info' },
  Electronics: { icon: 'ri-computer-line', color: 'primary' },
  Shoes: { icon: 'ri-footprint-line', color: 'success' },
  Office: { icon: 'ri-briefcase-line', color: 'warning' },
  Games: { icon: 'ri-gamepad-line', color: 'secondary' }
}

const productStatusObj: productStatusType = {
  Scheduled: { title: 'Scheduled', color: 'warning' },
  Published: { title: 'Publish', color: 'success' },
  Inactive: { title: 'Inactive', color: 'error' }
}

export interface Producto {
  productoId: number
  sku: string
  nombre: string
  descripcion?: string
  area: string
  familia: string
  tipo: string
  precio: number
  estado: string
  esPaquete: boolean
  norma?: string
  listaPrecios?: string
  aplicaImpuesto: boolean
  category?: string
  status?: string
  stock?: boolean
}

interface ProductoListItem {
  id: string
  nombre: string
}

const columnHelper = createColumnHelper<Producto>()

const ProductListTable = () => {
  // Estados para la tabla
  const [rowSelection, setRowSelection] = useState({})
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalProductos, setTotalProductos] = useState(0)

  // Estados para el modal de paquetes
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [sku, setSku] = useState('')
  const [norma, setNorma] = useState('')
  const [listaPrecios, setListaPrecios] = useState('')
  const [precio, setPrecio] = useState('')
  const [aplicaImpuesto, setAplicaImpuesto] = useState(false)
  const [buscarPaquete, setBuscarPaquete] = useState('')
  const [buscarProductos, setBuscarProductos] = useState('')
  const [paqueteList, setPaqueteList] = useState<ProductoListItem[]>([])
  const [productosList, setProductosList] = useState<ProductoListItem[]>([])
  const [selectedProductos, setSelectedProductos] = useState<string[]>([])
  const [selectedPaquetes, setSelectedPaquetes] = useState<string[]>([])

  const params = useParams()
  const locale = params?.lang || 'es'

  // Función para cargar productos
  const cargarProductos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/productos?page=${page + 1}&limit=${rowsPerPage}`)
      const data = await response.json()

      if (data.productos) {
        setProductos(data.productos)
        setTotalProductos(data.meta.total)
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para buscar productos
  const buscarProducto = async (query: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/productos/search?q=${query}`)
      const data = await response.json()

      if (Array.isArray(data)) {
        setProductos(data)
      }
    } catch (error) {
      console.error('Error al buscar productos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para eliminar producto
  const eliminarProducto = async (id: number) => {
    try {
      const response = await fetch(`/api/productos/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        cargarProductos()
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error)
    }
  }

  // Función para crear paquete
  const crearPaquete = async () => {
    try {
      console.log('Iniciando creación de paquete...')

      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre,
          sku,
          descripcion: '', // Campo requerido
          area: 'Suelos', // Campo requerido
          familia: 'Clasificación', // Campo requerido
          tipo: 'Paquete',
          precio: parseFloat(precio),
          norma,
          listaPrecios,
          aplicaImpuesto,
          esPaquete: true,
          estado: 'ACTIVO',
          productosEnPaquete: paqueteList.map(p => parseInt(p.id))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()

        console.error('Error en la respuesta:', errorData)
        throw new Error(errorData.error || 'Error al crear el paquete')
      }

      const data = await response.json()

      console.log('Paquete creado exitosamente:', data)
      handleClose()
      cargarProductos()
    } catch (error) {
      console.error('Error al crear paquete:', error)

      // Aquí podrías mostrar un mensaje de error al usuario
    }
  }

  const handleOpen = () => setOpen(true)

  const handleClose = () => {
    setOpen(false)

    // Limpiar estados del modal
    setNombre('')
    setSku('')
    setNorma('')
    setListaPrecios('')
    setPrecio('')
    setAplicaImpuesto(false)
    setPaqueteList([])
    setSelectedProductos([])
    setSelectedPaquetes([])
  }

  // Funciones para manejar la selección de productos
  const handleSelectProducto = (item: ProductoListItem) => {
    setSelectedProductos(prev => (prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]))
  }

  const handleSelectPaquete = (item: ProductoListItem) => {
    setSelectedPaquetes(prev => (prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]))
  }

  // Funciones para mover productos entre listas
  const handleMoveToPaquete = () => {
    const productosAMover = productosList.filter(item => selectedProductos.includes(item.id))

    setPaqueteList(prev => [...prev, ...productosAMover])
    setProductosList(prev => prev.filter(item => !selectedProductos.includes(item.id)))
    setSelectedProductos([])
  }

  const handleMoveToProductos = () => {
    const productosAMover = paqueteList.filter(item => selectedPaquetes.includes(item.id))

    setProductosList(prev => [...prev, ...productosAMover])
    setPaqueteList(prev => prev.filter(item => !selectedPaquetes.includes(item.id)))
    setSelectedPaquetes([])
  }

  // Cargar productos disponibles para el paquete
  const cargarProductosDisponibles = async () => {
    try {
      const response = await fetch('/api/productos?esPaquete=false')
      const data = await response.json()

      if (data.productos) {
        const productosFormateados = data.productos.map((p: Producto) => ({
          id: p.productoId.toString(),
          nombre: p.nombre
        }))

        setProductosList(productosFormateados)
      }
    } catch (error) {
      console.error('Error al cargar productos disponibles:', error)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [page, rowsPerPage])

  useEffect(() => {
    if (globalFilter) {
      buscarProducto(globalFilter)
    } else {
      cargarProductos()
    }
  }, [globalFilter])

  useEffect(() => {
    if (open) {
      cargarProductosDisponibles()
    }
  }, [open])

  const handleSave = () => {
    crearPaquete()
  }

  // Asegurarse de que los valores de las celdas sean strings
  const renderCellContent = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'

    if (typeof value === 'object') {
      if (Array.isArray(value)) return value.map(v => renderCellContent(v)).join(', ')

      return JSON.stringify(value)
    }

    return String(value)
  }

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }: any) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }: any) => (
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
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }: any) => <Typography>{row.original.sku}</Typography>
      },
      {
        accessorKey: 'nombre',
        header: 'Ensayos/Servicio',
        cell: ({ row }: any) => (
          <div className='flex flex-col'>
            <Typography className='font-medium' color='text.primary'>
              {row.original.nombre}
            </Typography>
            <Typography variant='body2'>{row.original.descripcion}</Typography>
          </div>
        )
      },
      {
        accessorKey: 'area',
        header: 'ÁREA',
        cell: ({ row }: any) => <Typography>{row.original.area}</Typography>
      },
      {
        accessorKey: 'familia',
        header: 'FAMILIA',
        cell: ({ row }: any) => <Typography>{row.original.familia}</Typography>
      },
      {
        accessorKey: 'esPaquete',
        header: 'PAQUETE',
        cell: ({ row }: any) => <Switch checked={row.original.esPaquete} readOnly />,
        enableSorting: false
      },
      {
        accessorKey: 'tipo',
        header: 'TIPO',
        cell: ({ row }: any) => <Typography>{row.original.tipo}</Typography>
      },
      {
        id: 'actions',
        header: 'Acciones',
        cell: ({ row }: any) => (
          <div className='flex items-center'>
            <IconButton size='small'>
              <i className='ri-edit-box-line text-[22px] text-textSecondary' />
            </IconButton>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary text-[22px]'
              options={[
                {
                  text: 'Eliminar',
                  icon: 'ri-delete-bin-7-line',
                  menuItemProps: {
                    className: 'gap-2',
                    onClick: () => eliminarProducto(row.original.productoId)
                  }
                }
              ]}
            />
          </div>
        ),
        enableSorting: false
      }
    ],
    []
  )

  const table = useReactTable({
    data: productos,
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

  return (
    <>
      <Card>
        <CardHeader title='Productos' className='pbe-4' />
        <TableFilters setData={setProductos} productData={productos} />
        <Divider />
        <div className='flex justify-between flex-col items-start sm:flex-row sm:items-center gap-y-4 p-5'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Buscar Ensayo/Servicio'
            className='max-sm:is-full'
          />
          <div className='flex items-center max-sm:flex-col gap-4 max-sm:is-full is-auto'>
            <Button variant='contained' onClick={handleOpen} className='max-sm:is-full is-auto'>
              Crear Paquete
            </Button>
            <Button
              variant='contained'
              component={Link}
              href={`/${locale}/apps/ecommerce/products/add`}
              startIcon={<i className='ri-add-line' />}
              className='max-sm:is-full is-auto'
            >
              Agregar Ensayo
            </Button>
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
                {table.getRowModel().rows.map(row => (
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
          className='border-bs'
          count={totalProductos}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => setRowsPerPage(Number(e.target.value))}
        />
        <Modal open={open} onClose={handleClose}>
          <Box sx={{ ...style, width: 1100, height: 650, padding: 4 }}>
            <Typography variant='h5' mb={3} fontWeight=''>
              Crear Paquete
            </Typography>
            {/* Sección de campos de entrada */}
            <Grid container spacing={3}>
              <Grid item xs={4}>
                <TextField
                  label='Nombre del Paquete'
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField label='SKU' value={sku} onChange={e => setSku(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={4}>
                <TextField label='Norma' value={norma} onChange={e => setNorma(e.target.value)} fullWidth />
              </Grid>
            </Grid>
            <Grid container spacing={3} mt={2}>
              <Grid item xs={4}>
                <TextField
                  label='Lista de Precios'
                  value={listaPrecios}
                  onChange={e => setListaPrecios(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label='Precio'
                  value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  fullWidth
                  InputProps={{ startAdornment: <Typography>$</Typography> }}
                />
              </Grid>
              <Grid item xs={4} display='flex' alignItems='center'>
                <Checkbox checked={aplicaImpuesto} onChange={e => setAplicaImpuesto(e.target.checked)} />
                <Typography component='span'>Aplicar Impuesto</Typography>
              </Grid>
            </Grid>
            {/* Barra de búsqueda para Paquete y Productos */}
            <Grid container spacing={3} mt={2}>
              <Grid item xs={6}>
                <TextField
                  placeholder='Buscar en Paquete'
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                  onChange={e => setBuscarPaquete(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  placeholder='Buscar en Productos'
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                  onChange={e => setBuscarProductos(e.target.value)}
                />
              </Grid>
            </Grid>

            {/* Contenedor de las tablas */}
            <Grid container spacing={3} mt={4}>
              {/* Tabla de Productos */}
              <Grid item xs={5}>
                <Box sx={{ border: '1px solid #f0efef', borderRadius: 2, height: 300, overflowY: 'auto' }}>
                  <Box sx={{ backgroundColor: '#f8f8f8', p: 1 }}>
                    <Typography variant='subtitle2' fontWeight='bold'>
                      PRODUCTOS
                    </Typography>
                  </Box>
                  {productosList.length > 0 ? (
                    productosList.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
                        <Checkbox
                          checked={selectedProductos.includes(item.id)}
                          onChange={() => handleSelectProducto(item)}
                        />
                        <Typography component='span'>{item.nombre}</Typography>
                      </div>
                    ))
                  ) : (
                    <Typography color='text.secondary' textAlign='center' p={1}>
                      Sin productos
                    </Typography>
                  )}
                </Box>
              </Grid>
              {/* Botones de mover */}
              <Grid item xs={2} container direction='column' justifyContent='center' alignItems='center'>
                <Button variant='contained' onClick={handleMoveToPaquete} sx={{ mb: 1 }}>
                  <ArrowForwardIcon />
                </Button>
                <Button variant='contained' onClick={handleMoveToProductos}>
                  <ArrowBackIcon />{' '}
                </Button>
              </Grid>
              {/* Tabla de Paquete */}
              <Grid item xs={5}>
                <Box sx={{ border: '1px solid #ccc', borderRadius: 2, height: 300, overflowY: 'auto' }}>
                  <Box sx={{ backgroundColor: '#f8f8f8', p: 1 }}>
                    <Typography variant='subtitle2' fontWeight='bold'>
                      PAQUETE
                    </Typography>
                  </Box>
                  {paqueteList.length > 0 ? (
                    paqueteList.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
                        <Checkbox
                          checked={selectedPaquetes.includes(item.id)}
                          onChange={() => handleSelectPaquete(item)}
                        />
                        <Typography component='span'>{item.nombre}</Typography>
                      </div>
                    ))
                  ) : (
                    <Typography color='text.secondary' textAlign='center' p={1}>
                      Sin productos
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
            {/* Botones de acción */}
            <Box mt={4} display='flex' justifyContent='flex-end' gap={2}>
              <Button onClick={handleClose} color='secondary' variant='outlined'>
                Cancelar
              </Button>
              <Button onClick={handleSave} color='primary' variant='contained'>
                Agregar Paquete
              </Button>
            </Box>
          </Box>
        </Modal>
      </Card>
    </>
  )
}

export default ProductListTable
