'use client'

import { useState, useEffect } from 'react'

import { toast } from 'react-hot-toast'

import {
  Card,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Typography,
  IconButton
} from '@mui/material'

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
  listaAsignada: string
  precioEnLista: number
}

const PriceListTable = () => {
  const [selectedList, setSelectedList] = useState('')
  const [listaPrecios, setListaPrecios] = useState<ListaPrecio[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar listas de precios
  useEffect(() => {
    const fetchListaPrecios = async () => {
      try {
        const response = await fetch('/api/lista-precios')
        const data = await response.json()

        if (!response.ok) throw new Error(data.error || 'Error al cargar listas de precios')

        setListaPrecios(data)

        // Seleccionar la primera lista por defecto si existe
        if (data.length > 0) {
          setSelectedList(data[0].id.toString())
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error('Error al cargar listas de precios')
      }
    }

    fetchListaPrecios()
  }, [])

  // Cargar productos cuando se selecciona una lista
  useEffect(() => {
    const fetchProductos = async () => {
      if (!selectedList) return

      setLoading(true)

      try {
        // Primero, cargar todos los productos
        const response = await fetch('/api/productos')

        if (!response.ok) throw new Error('Error al cargar productos')

        const data = await response.json()

        // Formatear los productos con la información de la lista seleccionada
        const productosFormateados = data.map(producto => ({
          ...producto,
          listaAsignada: producto.ProductoListaPrecio?.find(plp => plp.listaPrecioId === parseInt(selectedList))
            ? 'Asignado'
            : 'Sin asignar',
          precioEnLista:
            producto.ProductoListaPrecio?.find(plp => plp.listaPrecioId === parseInt(selectedList))?.precio ||
            producto.precio
        }))

        setProductos(productosFormateados)
      } catch (error) {
        console.error('Error:', error)
        toast.error('Error al cargar productos')
      } finally {
        setLoading(false)
      }
    }

    fetchProductos()
  }, [selectedList])

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
                <Checkbox />
              </TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>NOMBRE</TableCell>
              <TableCell>ÁREA</TableCell>
              <TableCell>FAMILIA</TableCell>
              <TableCell>TIPO</TableCell>
              <TableCell>PRECIO</TableCell>
              <TableCell>LISTA ASIGNADA</TableCell>
              <TableCell>ACCIONES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align='center'>
                  Cargando productos...
                </TableCell>
              </TableRow>
            ) : productos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align='center'>
                  No hay productos disponibles
                </TableCell>
              </TableRow>
            ) : (
              productos.map(producto => (
                <TableRow key={producto.sku}>
                  <TableCell padding='checkbox'>
                    <Checkbox
                      checked={producto.listaAsignada === 'Asignado'}
                      onChange={() => {
                        /* Manejar cambio de asignación */
                      }}
                    />
                  </TableCell>
                  <TableCell>{producto.sku}</TableCell>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell>{producto.area}</TableCell>
                  <TableCell>{producto.familia}</TableCell>
                  <TableCell>{producto.tipo}</TableCell>
                  <TableCell>${producto.precioEnLista}</TableCell>
                  <TableCell>{producto.listaAsignada}</TableCell>
                  <TableCell>
                    <IconButton
                      size='small'
                      onClick={() => {
                        /* Manejar edición de precio */
                      }}
                    >
                      <i className='ri-pencil-line' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default PriceListTable
