'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import TablePagination from '@mui/material/TablePagination'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel
} from '@tanstack/react-table'
import TextField from '@mui/material/TextField'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

interface Producto {
  productoId: number
  sku: string
  nombre: string
  descripcion?: string
  area: string
  familia: string
  tipo: string
  precio: number
  listaPrecioId?: number
  listaPrecio?: {
    id: number
    nombre: string
  }
}

const columnHelper = createColumnHelper<Producto>()

const LISTAS_PRECIO = [
  { id: 1, nombre: 'Lista 1' },
  { id: 2, nombre: 'Lista 2' },
  { id: 3, nombre: 'Lista 3' }
]

const ProductListTable = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalProductos, setTotalProductos] = useState(0)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [selectedLista, setSelectedLista] = useState<number>(1)

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  })

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

  useEffect(() => {
    cargarProductos()
  }, [page, rowsPerPage])

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  const actualizarPrecio = async (productoId: number, nuevoPrecio: number, listaPrecioId: number) => {
    try {
      const response = await fetch(`/api/productos/${productoId}/precio`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          precio: nuevoPrecio,
          listaPrecioId
        })
      })

      if (response.ok) {
        setProductos(prevProductos =>
          prevProductos.map(producto =>
            producto.productoId === productoId
              ? {
                  ...producto,
                  precio: nuevoPrecio,
                  listaPrecioId
                }
              : producto
          )
        )

        setSnackbar({
          open: true,
          message: 'Precio actualizado correctamente',
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: 'Error al actualizar el precio',
          severity: 'error'
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setSnackbar({
        open: true,
        message: 'Error al actualizar el precio',
        severity: 'error'
      })
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(productos.map(p => p.productoId))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectOne = (productoId: number) => {
    setSelectedProducts(prev => {
      if (prev.includes(productoId)) {
        return prev.filter(id => id !== productoId)
      }

      return [...prev, productoId]
    })
  }

  const handleSaveToList = async (listaId: number) => {
    try {
      const response = await fetch('/api/productos/precios/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productosIds: selectedProducts,
          listaPrecioId: listaId
        })
      })

      if (!response.ok) throw new Error('Error al actualizar precios')

      // Recargar datos
      cargarProductos()
      setSelectedProducts([])

      // Mostrar mensaje de éxito
      setSnackbar({
        open: true,
        message: 'Precios actualizados correctamente',
        severity: 'success'
      })
    } catch (error) {
      console.error('Error:', error)
      setSnackbar({
        open: true,
        message: 'Error al actualizar los precios',
        severity: 'error'
      })
    }
  }

  const verificarPrecios = async (productoId: number) => {
    try {
      const response = await fetch(`/api/productos/${productoId}/precios`)
      const data = await response.json()

      console.log('Datos del producto:', data)

      // Actualizar el mensaje para mostrar la lista asignada
      setSnackbar({
        open: true,
        message: data.producto.lista
          ? `Producto asignado a: ${data.producto.lista.nombre}`
          : 'Producto sin lista asignada',
        severity: 'info'
      })
    } catch (error) {
      console.error('Error al verificar precios:', error)
    }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('sku', {
        header: 'SKU',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('nombre', {
        header: 'NOMBRE',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('area', {
        header: 'ÁREA',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('familia', {
        header: 'FAMILIA',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('tipo', {
        header: 'TIPO',
        cell: info => <Typography>{info.getValue()}</Typography>
      }),
      columnHelper.accessor('precio', {
        id: 'precio',
        header: 'PRECIO',
        cell: info => (
          <TextField
            type='number'
            defaultValue={info.row.original.precio}
            size='small'
            sx={{ width: '100px' }}
            onBlur={e => {
              const nuevoPrecio = parseFloat(e.target.value)

              if (!isNaN(nuevoPrecio) && nuevoPrecio !== info.row.original.precio) {
                actualizarPrecio(info.row.original.productoId, nuevoPrecio, selectedLista)
              }
            }}
          />
        )
      }),
      columnHelper.accessor('listaPrecio', {
        header: 'LISTA ASIGNADA',
        cell: info => <Typography>{info.row.original.listaPrecio?.nombre || 'Sin asignar'}</Typography>
      }),
      columnHelper.accessor('action', {
        header: 'ACCIONES',
        cell: ({ row }) => (
          <div>
            <IconButton onClick={() => verificarPrecios(row.original.productoId)}>
              <i className='ri-price-tag-3-line' />
            </IconButton>
          </div>
        )
      })
    ],
    [selectedLista]
  )

  const table = useReactTable({
    data: productos,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <div className='flex justify-between items-center p-6'>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Lista de Precios</InputLabel>
            <Select
              value={selectedLista}
              label='Lista de Precios'
              onChange={e => setSelectedLista(Number(e.target.value))}
            >
              {LISTAS_PRECIO.map(lista => (
                <MenuItem key={lista.id} value={lista.id}>
                  {lista.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant='contained'
            onClick={() => handleSaveToList(selectedLista)}
            disabled={selectedProducts.length === 0}
          >
            {`Guardar ${selectedProducts.length} productos en lista`}
          </Button>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>
                  <Checkbox
                    checked={selectedProducts.length === productos.length}
                    indeterminate={selectedProducts.length > 0 && selectedProducts.length < productos.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                </th>
                {columns.map(column => (
                  <th key={column.id}>
                    {column.header ? (typeof column.header === 'string' ? column.header : column.header()) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className='text-center py-4'>
                    Cargando...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className='text-center py-4'>
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    <td>
                      <Checkbox
                        checked={selectedProducts.includes(row.original.productoId)}
                        onChange={() => handleSelectOne(row.original.productoId)}
                      />
                    </td>
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
          count={totalProductos}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default ProductListTable
