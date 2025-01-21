'use client'

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { toast } from 'react-hot-toast'

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
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'

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
  const [selectedList, setSelectedList] = useState<string>('')
  const [listaPrecios, setListaPrecios] = useState<ListaPrecio[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [editingPrice, setEditingPrice] = useState<{ id: number; price: string } | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>('')

  // Cargar listas de precios
  useEffect(() => {
    const fetchListaPrecios = async () => {
      try {
        const response = await fetch('/api/lista-precios')
        const data = await response.json()

        setListaPrecios(data)

        // Seleccionar la primera lista por defecto si existe
        if (data.length > 0) {
          setSelectedList(data[0].id.toString())
        }
      } catch (error) {
        console.error('Error al cargar listas de precios:', error)
      }
    }

    fetchListaPrecios()
  }, [])

  // Cargar productos cuando se selecciona una lista
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`/api/productos/lista/${selectedList || 'all'}`)
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
      const response = await fetch(`/api/productos/${productoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          precio: parseFloat(newPrice),
          listaPrecioId: parseInt(selectedList)
        })
      })

      if (!response.ok) throw new Error('Error al actualizar precio')

      setSuccessMessage('Precio actualizado correctamente')
      fetchProductos()
      setEditingPrice(null)

      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // Función para actualizar estado activo de forma optimista
  const handleActiveToggle = async (productoId: number, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/productos/${productoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activoEnLista: !currentActive,
          listaPrecioId: parseInt(selectedList)
        })
      })

      if (!response.ok) throw new Error('Error al actualizar estado')

      // Actualizar el estado local inmediatamente
      setProductos(prevProductos =>
        prevProductos.map(producto => {
          if (producto.productoId === productoId) {
            return {
              ...producto,
              listasPrecios: producto.listasPrecios.map(lp => ({
                ...lp,
                activo: !currentActive
              }))
            }
          }

          return producto
        })
      )

      setSuccessMessage('Estado actualizado correctamente')
    } catch (error) {
      console.error('Error:', error)

      // Opcionalmente, revertir el cambio si hubo error
      toast.error('Error al actualizar el estado')
    }
  }

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
        }
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding='checkbox'>
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
              </TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>NOMBRE</TableCell>
              <TableCell>ÁREA</TableCell>
              <TableCell>FAMILIA</TableCell>
              <TableCell>TIPO</TableCell>
              <TableCell>PRECIO</TableCell>
              <TableCell>ACTIVO</TableCell>
              <TableCell>LISTA PRECIO</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productos.length > 0 ? (
              productos.map(producto => (
                <TableRow key={producto.sku}>
                  <TableCell padding='checkbox'>
                    <Checkbox
                      checked={selectedProducts.includes(producto.sku)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, producto.sku])
                        } else {
                          setSelectedProducts(selectedProducts.filter(sku => sku !== producto.sku))
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{producto.sku}</TableCell>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell>{producto.area}</TableCell>
                  <TableCell>{producto.familia}</TableCell>
                  <TableCell>{producto.tipo}</TableCell>
                  <TableCell>
                    {editingPrice?.id === producto.productoId ? (
                      <TextField
                        value={editingPrice.price}
                        onChange={e => {
                          const value = e.target.value

                          if (/^\d*\.?\d*$/.test(value)) {
                            setEditingPrice({ id: producto.productoId, price: value })
                          }
                        }}
                        onBlur={() => handlePriceUpdate(producto.productoId, editingPrice.price)}
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            handlePriceUpdate(producto.productoId, editingPrice.price)
                          }
                        }}
                        size='small'
                        autoFocus
                        InputProps={{
                          startAdornment: <InputAdornment position='start'>$</InputAdornment>
                        }}
                      />
                    ) : (
                      <Box
                        onClick={() =>
                          setEditingPrice({
                            id: producto.productoId,
                            price: producto.listasPrecios[0]?.precio?.toString() || ''
                          })
                        }
                        sx={{ cursor: 'pointer' }}
                      >
                        ${producto.listasPrecios[0]?.precio?.toLocaleString() || 'Sin asignar'}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={producto.listasPrecios[0]?.activo ?? true}
                      onChange={() =>
                        handleActiveToggle(producto.productoId, producto.listasPrecios[0]?.activo ?? true)
                      }
                    />
                  </TableCell>
                  <TableCell>{producto.listasPrecios[0]?.listaPrecio.nombre || 'Sin asignar'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align='center'>
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
