import { useState, useEffect } from 'react'

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
  Typography
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
}

const PriceListTable = () => {
  const [selectedList, setSelectedList] = useState('')
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
      } catch (error) {
        console.error('Error al cargar listas de precios:', error)
      }
    }

    fetchListaPrecios()
  }, [])

  // Cargar productos cuando se selecciona una lista
  useEffect(() => {
    const fetchProductos = async () => {
      if (!selectedList) return

      try {
        const response = await fetch(`/api/productos/lista/${selectedList}`)
        const data = await response.json()

        setProductos(data)
      } catch (error) {
        console.error('Error al cargar productos:', error)
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
                  {`${lista.nombre} - $${lista.precio}`}
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
            {productos.map(producto => (
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
                <TableCell>{producto.listaAsignada || 'Sin asignar'}</TableCell>
                <TableCell>{/* Aquí irían los botones de acciones */}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant='contained' disabled={selectedProducts.length === 0} sx={{ m: 2 }}>
        {`Guardar ${selectedProducts.length} productos en lista`}
      </Button>
    </Card>
  )
}

export default PriceListTable
