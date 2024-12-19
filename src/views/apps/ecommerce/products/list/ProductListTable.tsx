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

type ProductWithActionsType = ProductType & {
  actions?: string
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

const columnHelper = createColumnHelper<ProductWithActionsType>()

const ProductListTable = ({ productData }: { productData?: ProductType[] }) => {
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(...[productData])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [open, setOpen] = useState(false)

  const [paqueteList, setPaqueteList] = useState<string[]>([]) // Lista de paquetes
  const [productosList, setProductosList] = useState<string[]>(['Producto 1', 'Producto 2', 'Producto 3']) // Lista de productos
  const [selectedProductos, setSelectedProductos] = useState<string[]>([])
  const [selectedPaquetes, setSelectedPaquetes] = useState<string[]>([])

  // Funciones para manejar la selección
  const handleSelectProducto = (item: string) => {
    setSelectedProductos(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]))
  }

  const handleSelectPaquete = (item: string) => {
    setSelectedPaquetes(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]))
  }

  // Funciones para mover los elementos entre las listas
  const handleMoveToPaquete = () => {
    setPaqueteList(prev => [...prev, ...selectedProductos])
    setProductosList(prev => prev.filter(item => !selectedProductos.includes(item)))
    setSelectedProductos([]) // Limpia la selección
  }

  const handleMoveToProductos = () => {
    setProductosList(prev => [...prev, ...selectedPaquetes])
    setPaqueteList(prev => prev.filter(item => !selectedPaquetes.includes(item)))
    setSelectedPaquetes([]) // Limpia la selección
  }

  const handleSave = () => {
    // Lógica para guardar los datos del paquete
    console.log('Datos del paquete guardados:', {
      nombre,
      sku,
      norma,
      listaPrecios,
      precio,
      aplicarImpuesto,
      paqueteList
    })

    // Cierra el modal después de guardar
    handleClose()
  }

  const [nombre, setNombre] = useState('')
  const [sku, setSku] = useState('')
  const [norma, setNorma] = useState('')
  const [listaPrecios, setListaPrecios] = useState('')
  const [precio, setPrecio] = useState('')
  const [aplicarImpuesto, setAplicarImpuesto] = useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const { lang: locale } = useParams()

  const columns = useMemo<ColumnDef<ProductWithActionsType, any>[]>(
    () => [
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
      columnHelper.accessor('sku', {
        header: 'SKU',
        cell: ({ row }) => <Typography>{row.original.sku}</Typography>
      }),
      columnHelper.accessor('productName', {
        header: 'Ensayos/Servicio',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <img src={row.original.image} width={38} height={38} className='rounded bg-actionHover' />
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.productName}
              </Typography>
              <Typography variant='body2'>{row.original.productBrand}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('qty', {
        header: 'ÁREA',
        cell: ({ row }) => <Typography>{row.original.qty}</Typography>
      }),
      columnHelper.accessor('category', {
        header: 'FAMILIA',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <CustomAvatar skin='light' color={productCategoryObj[row.original.category].color} size={30}>
              <i className={classnames(productCategoryObj[row.original.category].icon, 'text-lg')} />
            </CustomAvatar>
            <Typography color='text.primary'>{row.original.category}</Typography>
          </div>
        )
      }),
      columnHelper.accessor('stock', {
        header: 'PAQUETE',
        cell: ({ row }) => <Switch defaultChecked={row.original.stock} />,
        enableSorting: false
      }),
      columnHelper.accessor('sku', {
        header: 'TIPO',
        cell: ({ row }) => <Typography>{row.original.sku}</Typography>
      }),

      columnHelper.accessor('actions', {
        header: 'Acciones',
        cell: ({ row }) => (
          <div className='flex items-center'>
            <IconButton size='small'>
              <i className='ri-edit-box-line text-[22px] text-textSecondary' />
            </IconButton>
            <OptionMenu
              iconButtonProps={{ size: 'medium' }}
              iconClassName='text-textSecondary text-[22px]'
              options={[
                { text: 'Download', icon: 'ri-download-line', menuItemProps: { className: 'gap-2' } },
                {
                  text: 'Delete',
                  icon: 'ri-delete-bin-7-line',
                  menuItemProps: {
                    className: 'gap-2',
                    onClick: () => setData(data?.filter(product => product.id !== row.original.id))
                  }
                },
                { text: 'Duplicate', icon: 'ri-stack-line', menuItemProps: { className: 'gap-2' } }
              ]}
            />
          </div>
        ),
        enableSorting: false
      })
    ],
    [data, filteredData]
  )

  const table = useReactTable({
    data: filteredData as ProductType[],
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
        <TableFilters setData={setFilteredData} productData={data} />
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
              href={getLocalizedUrl('/apps/ecommerce/products/add', locale as Locale)}
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
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
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
                <Checkbox checked={aplicarImpuesto} onChange={e => setAplicarImpuesto(e.target.checked)} />
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
                    productosList.map((item, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
                        <Checkbox
                          checked={selectedProductos.includes(item)}
                          onChange={() => handleSelectProducto(item)}
                        />
                        <Typography component='span'>{item}</Typography>
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
                    paqueteList.map((item, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
                        <Checkbox
                          checked={selectedPaquetes.includes(item)}
                          onChange={() => handleSelectPaquete(item)}
                        />
                        <Typography component='span'>{item}</Typography>
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
