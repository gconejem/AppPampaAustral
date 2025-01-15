'use client'

import { useState, useEffect } from 'react'

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

interface ListaPrecio {
  id: number
  nombre: string
  precio: number
}

interface Producto {
  sku: string
  nombre: string
  area: string
  familia: string
  tipo: string
  precio: number
  listaPrecioId: number | null
  listaPrecio?: ListaPrecio | null
}

const ProductListTable = () => {
  const [selectedList, setSelectedList] = useState<string>('')
  const [listaPrecios, setListaPrecios] = useState<ListaPrecio[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

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

        // Ya no necesitamos filtrar aquí porque la API nos da los datos correctos
        setProductos(data)
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

  return (
    <Card>
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
                  <TableCell>${producto.precio}</TableCell>
                  <TableCell>{producto.listaPrecio ? `$${producto.listaPrecio.precio}` : 'Sin asignar'}</TableCell>
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
