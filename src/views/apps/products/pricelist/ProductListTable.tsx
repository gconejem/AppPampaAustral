'use client'

import { useState, useEffect, useMemo } from 'react'

import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { toast } from 'react-hot-toast'
import classnames from 'classnames'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import { permisos } from '@/permisos/permisos'
import { usePermissions } from '@/hooks/usePermissions'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState
} from '@tanstack/react-table'

interface ListaPrecio {
  id: number
  nombre: string
}

interface ProductoListaPrecio {
  id: number
  precio: number | null
  activo: boolean
  listaPrecio: ListaPrecio
}

interface Producto {
  productoId: number
  sku: string
  nombre: string
  area: string
  familia: string
  tipo: string
  listasPrecios: ProductoListaPrecio[]
}

const ProductListTable = () => {
  const [selectedList, setSelectedList] = useState<string>('1')
  const [listaPrecios, setListaPrecios] = useState<ListaPrecio[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [editingPrice, setEditingPrice] = useState<{ id: number; price: string } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])


  const { hasPermission } = usePermissions()
  const soloLectura =
    hasPermission(permisos.productos.ver) &&
    !hasPermission(permisos.productos.crear) &&
    !hasPermission(permisos.productos.editar) &&
    !hasPermission(permisos.productos.eliminar)

  // Cargar productos cuando se selecciona una lista
  useEffect(() => {
    const fetchProductos = async () => {
      if (!selectedList) return

      try {
        const response = await fetch(`/api/productos/lista/${selectedList}`)
        const data = await response.json()

        // Asegurarnos que todos los productos tengan el estado activo por defecto
        const productosConActivo = data.map(producto => ({
          ...producto,
          listasPrecios: producto.listasPrecios.map(lp => ({
            ...lp,
            activo: lp.activo ?? true // Si activo es null o undefined, será true
          }))
        }))

        setProductos(productosConActivo)
      } catch (error) {
        console.error('Error al cargar productos:', error)
      }
    }

    fetchProductos()
  }, [selectedList])

  // Cargar listas de precios
  useEffect(() => {
    const fetchListaPrecios = async () => {
      try {
        const response = await fetch('/api/lista-precios')
        const data = await response.json()
        setListaPrecios(data)
      } catch (error) {
        console.error('Error al cargar listas de precios:', error)
      }
    }

    fetchListaPrecios()
  }, [])

  // Función para guardar productos en la lista
  const handleSaveToList = async () => {
    if (!selectedList || selectedProducts.length === 0) return

    try {
      const response = await fetch('/api/productos/asignar-lista', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listaPrecioId: parseInt(selectedList),
          productoIds: selectedProducts
        })
      })

      if (response.ok) {
        // Recargar productos
        fetchProductos()

        // Limpiar selección
        setSelectedProducts([])
      }
    } catch (error) {
      console.error('Error al asignar productos a la lista:', error)
    }
  }

  // Función para actualizar precio
  const handlePriceUpdate = async (productoId: number, newPrice: string) => {
    try {
      const precioNumerico = newPrice === '' ? null : Number(newPrice)

      const response = await fetch(`/api/productos/${productoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          precio: precioNumerico,
          listaPrecioId: parseInt(selectedList)
        })
      })

      if (!response.ok) throw new Error('Error al actualizar precio')

      setSuccessMessage('Precio actualizado correctamente')
      setProductos(prevProductos =>
        prevProductos.map(producto => {
          if (producto.productoId === productoId) {
            return {
              ...producto,
              listasPrecios: producto.listasPrecios.map(lp => ({
                ...lp,
                precio: lp.listaPrecio.id === parseInt(selectedList) ? precioNumerico : lp.precio
              }))
            }
          }
          return producto
        })
      )
      setEditingPrice(null)

      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar el precio')
    }
  }

  // Función para actualizar estado activo de forma optimista
  const handleActiveToggle = async (productoId: number, currentActive: boolean) => {
    try {
      // Actualizar el estado local inmediatamente para UI responsiva
      setProductos(prevProductos =>
        prevProductos.map(producto => {
          if (producto.productoId === productoId) {
            const listaPrecioExistente = producto.listasPrecios.find(lp => lp.listaPrecio.id === parseInt(selectedList))

            if (!listaPrecioExistente) {
              // Si no existe la lista, agregamos una nueva entrada
              return {
                ...producto,
                listasPrecios: [
                  ...producto.listasPrecios,
                  {
                    id: 0,
                    precio: null,
                    activo: true,
                    listaPrecio: { id: parseInt(selectedList), nombre: '' }
                  }
                ]
              }
            }

            // Si existe, actualizamos el estado activo
            return {
              ...producto,
              listasPrecios: producto.listasPrecios.map(lp => ({
                ...lp,
                activo: lp.listaPrecio.id === parseInt(selectedList) ? !currentActive : lp.activo,
                precio: lp.listaPrecio.id === parseInt(selectedList) && !currentActive ? null : lp.precio
              }))
            }
          }
          return producto
        })
      )

      // Hacer la llamada a la API
      const response = await fetch(`/api/productos/${productoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activoEnLista: !currentActive,
          listaPrecioId: parseInt(selectedList),
          precio: null
        })
      })

      if (!response.ok) throw new Error('Error al actualizar estado')

      setSuccessMessage('Estado actualizado correctamente')
    } catch (error) {
      console.error('Error:', error)

      // Revertir el cambio si hubo error
      setProductos(prevProductos =>
        prevProductos.map(producto => {
          if (producto.productoId === productoId) {
            return {
              ...producto,
              listasPrecios: producto.listasPrecios.map(lp => ({
                ...lp,
                activo: lp.listaPrecio.id === parseInt(selectedList) ? currentActive : lp.activo
              }))
            }
          }
          return producto
        })
      )
      toast.error('Error al actualizar el estado')
    }
  }

  // Modificar la renderización de la celda de precio
  const renderPrecio = (producto: Producto) => {
    const listaPrecio = producto.listasPrecios.find(lp => lp.listaPrecio.id === parseInt(selectedList))
    const estaActivo = listaPrecio?.activo

    if (!estaActivo) {
      return 'Sin asignar'
    }

    if (editingPrice?.id === producto.productoId) {
      return (
        <TextField
          value={editingPrice.price}
          onChange={e => {
            const value = e.target.value
            if (/^\d*\.?\d*$/.test(value)) {
              setEditingPrice({ id: producto.productoId, price: value })
            }
          }}
          onBlur={() => {
            if (editingPrice.price !== '') {
              handlePriceUpdate(producto.productoId, editingPrice.price)
            } else {
              setEditingPrice(null)
            }
          }}
          onKeyPress={e => {
            if (e.key === 'Enter' && editingPrice.price !== '') {
              handlePriceUpdate(producto.productoId, editingPrice.price)
            }
          }}
          size='small'
          autoFocus
          InputProps={{
            startAdornment: <InputAdornment position='start'>$</InputAdornment>
          }}
        />
      )
    }

    return (
      <Box
        onClick={() =>
          setEditingPrice({
            id: producto.productoId,
            price: listaPrecio?.precio?.toString() || ''
          })
        }
        sx={{ cursor: 'pointer' }}
      >
        {listaPrecio?.precio !== null && listaPrecio?.precio !== undefined ? `$${listaPrecio.precio.toLocaleString()}` : 'Sin asignar'}
      </Box>
    )
  }

  // Definir el columnHelper
  const columnHelper = createColumnHelper<Producto>()

  // Definir las columnas
  const columns = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          onChange={e => {
            if (e.target.checked) {
              setSelectedProducts(productos.map(p => p.sku))
            } else {
              setSelectedProducts([])
            }
          }}
          checked={selectedProducts.length === productos.length && productos.length > 0}
          indeterminate={selectedProducts.length > 0 && selectedProducts.length < productos.length}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedProducts.includes(row.original.sku)}
          onChange={e => {
            if (e.target.checked) {
              setSelectedProducts([...selectedProducts, row.original.sku])
            } else {
              setSelectedProducts(selectedProducts.filter(sku => sku !== row.original.sku))
            }
          }}
        />
      )
    },
    columnHelper.accessor('sku', {
      header: 'SKU',
      cell: info => info.getValue(),
      enableSorting: true
    }),
    columnHelper.accessor('nombre', {
      header: 'NOMBRE',
      cell: info => info.getValue(),
      enableSorting: true
    }),
    columnHelper.accessor('area', {
      header: 'ÁREA',
      cell: info => info.getValue(),
      enableSorting: true
    }),
    columnHelper.accessor('familia', {
      header: 'FAMILIA',
      cell: info => info.getValue(),
      enableSorting: true
    }),
    columnHelper.accessor('tipo', {
      header: 'TIPO',
      cell: info => info.getValue(),
      enableSorting: true
    }),
    {
      id: 'precio',
      header: 'PRECIO',
      cell: ({ row }) => renderPrecio(row.original),
      enableSorting: true
    },
    {
      id: 'activo',
      header: 'ACTIVO',
      cell: ({ row }) => {
        const listaPrecio = row.original.listasPrecios.find(lp => lp.listaPrecio.id === parseInt(selectedList))
        const estaActivo = listaPrecio?.activo ?? false

        return (
          <Switch disabled={soloLectura}
            checked={estaActivo}
            onChange={() => {
              // Si el producto no tiene entrada en listasPrecios, creamos una nueva
              if (!listaPrecio) {
                const nuevoProducto = {
                  ...row.original,
                  listasPrecios: [
                    ...row.original.listasPrecios,
                    {
                      id: 0,
                      precio: null,
                      activo: true,
                      listaPrecio: { id: parseInt(selectedList), nombre: '' }
                    }
                  ]
                }
                handleActiveToggle(nuevoProducto.productoId, false)
              } else {
                handleActiveToggle(row.original.productoId, estaActivo)
              }
            }}
          />
        )
      },
      enableSorting: true
    }
  ]

  // Configurar la tabla
  const table = useReactTable({
    data: productos,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  return (
    <Card>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity='success' sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <CardHeader
        title='Lista de Precios'
        action={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar..."
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-search-line" />
                  </InputAdornment>
                )
              }}
              style={{ width: '500px' }}
              className='max-sm:is-full min-is-[200px]'
              sx={{
                padding: '11px',
                borderRadius: '8px',
                border: '1px solid #E0E0E0'
              }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Lista de Precios</InputLabel>
              <Select value={selectedList} label='Lista de Precios' onChange={e => setSelectedList(e.target.value)}>
                {listaPrecios.map(lista => (
                  <MenuItem key={lista.id} value={lista.id}>
                    {lista.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button disabled={soloLectura}>Agregar Producto</Button>
            <IconButton disabled={soloLectura}><EditIcon /></IconButton>
            <IconButton disabled={soloLectura}><DeleteIcon /></IconButton>
            <Switch disabled={soloLectura} />
            {/* <OptionMenu iconButtonProps={{ disabled: soloLectura }} ... /> */}
          </Box>
        }
      />
      <TableContainer>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableCell key={header.id}>
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
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {productos.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align='center'>
                  <Typography>No hay productos asignados a esta lista</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default ProductListTable
