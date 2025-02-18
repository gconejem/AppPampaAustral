'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { SyntheticEvent } from 'react'
import { useRouter } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import InputLabel from '@mui/material/InputLabel'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import FormControl from '@mui/material/FormControl'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

const EditCard = ({ id }: { id: string }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cotizacion, setCotizacion] = useState<any>(null)
  const [clientes, setClientes] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Cargar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch('/api/clientes')
        if (!response.ok) throw new Error('Error al cargar clientes')
        const data = await response.json()
        setClientes(data)
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchClientes()
  }, [])

  // Cargar productos
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch('/api/productos')
        if (!response.ok) throw new Error('Error al cargar productos')
        const data = await response.json()
        console.log('Productos cargados:', data)
        setProductos(data)
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchProductos()
  }, [])

  // Cargar obras cuando cambia el cliente
  useEffect(() => {
    const fetchObras = async () => {
      if (!cotizacion?.clienteId) return

      try {
        const response = await fetch(`/api/obras?clienteId=${cotizacion.clienteId}`)
        if (!response.ok) throw new Error('Error al cargar obras')
        const data = await response.json()
        setObras(data)
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchObras()
  }, [cotizacion?.clienteId])

  useEffect(() => {
    const fetchCotizacion = async () => {
      try {
        const response = await fetch(`/api/cotizaciones/${id}`)
        if (!response.ok) throw new Error('Error al cargar la cotización')
        const data = await response.json()
        console.log('Cotización cargada:', data)
        setCotizacion(data)
      } catch (error) {
        console.error('Error:', error)
        setError('Error al cargar la cotización')
      } finally {
        setLoading(false)
      }
    }

    fetchCotizacion()
  }, [id])

  // Función para calcular totales
  const calcularTotales = (detalles: any[]) => {
    const subtotal = detalles.reduce((acc, detalle) => acc + detalle.subtotal, 0)
    const descuentoTotal = detalles.reduce((acc, detalle) => acc + (detalle.subtotal * (detalle.descuento || 0) / 100), 0)
    const impuesto = (subtotal - descuentoTotal) * 0.19 // 19% IVA
    const total = subtotal - descuentoTotal + impuesto

    return {
      subtotal,
      descuento: descuentoTotal,
      impuesto,
      total
    }
  }

  // Función para actualizar un detalle
  const handleUpdateDetalle = (detalleId: number, field: string, value: any) => {
    setCotizacion(prev => {
      const newDetalles = prev.detalles.map((detalle: any) => {
        if (detalle.id === detalleId) {
          const updatedDetalle = { ...detalle, [field]: value }

          if (field === 'productoId') {
            const producto = productos.find(p => p.productoId === value)
            console.log('Producto encontrado:', producto)

            if (producto) {
              updatedDetalle.producto = producto
              updatedDetalle.precioUnitario = Number(producto.precio)
              updatedDetalle.cantidad = updatedDetalle.cantidad || 1

              console.log('Detalle actualizado con producto:', {
                productoId: updatedDetalle.productoId,
                precio: updatedDetalle.precioUnitario,
                cantidad: updatedDetalle.cantidad
              })
            }
          }

          // Asegurar que los valores sean números
          updatedDetalle.cantidad = Number(updatedDetalle.cantidad) || 0
          updatedDetalle.precioUnitario = Number(updatedDetalle.precioUnitario) || 0
          updatedDetalle.descuento = Number(updatedDetalle.descuento) || 0

          // Recalcular subtotal
          updatedDetalle.subtotal =
            updatedDetalle.cantidad *
            updatedDetalle.precioUnitario *
            (1 - (updatedDetalle.descuento / 100))

          console.log('Cálculos finales:', {
            cantidad: updatedDetalle.cantidad,
            precio: updatedDetalle.precioUnitario,
            descuento: updatedDetalle.descuento,
            subtotal: updatedDetalle.subtotal
          })

          return updatedDetalle
        }
        return detalle
      })

      return {
        ...prev,
        detalles: newDetalles,
        subtotal: newDetalles.reduce((acc, det) => acc + det.subtotal, 0)
      }
    })
  }

  if (loading) return <Typography>Cargando...</Typography>
  if (error) return <Typography color="error">{error}</Typography>
  if (!cotizacion) return <Typography>No se encontró la cotización</Typography>

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 4 }}>
          Editar Cotización #{cotizacion.numeroCotizacion}
        </Typography>

        <Grid container spacing={4}>
          {/* Cliente */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={cotizacion.clienteId}
                label="Cliente"
                onChange={(e) => {
                  const selectedClient = clientes.find(c => c.clienteId === e.target.value)
                  setCotizacion({
                    ...cotizacion,
                    clienteId: e.target.value,
                    cliente: selectedClient,
                    obraId: '', // Resetear obra al cambiar cliente
                    obra: null
                  })
                }}
              >
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.clienteId} value={cliente.clienteId}>
                    {cliente.nombreCliente}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Obra */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Obra</InputLabel>
              <Select
                value={cotizacion.obraId || ''}
                label="Obra"
                onChange={(e) => {
                  const selectedObra = obras.find(o => o.obraId === e.target.value)
                  setCotizacion({
                    ...cotizacion,
                    obraId: e.target.value,
                    obra: selectedObra
                  })
                }}
              >
                {obras.map((obra) => (
                  <MenuItem key={obra.obraId} value={obra.obraId}>
                    {obra.nombreObra}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Estado */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={cotizacion.estado}
                label="Estado"
                onChange={(e) => setCotizacion({ ...cotizacion, estado: e.target.value })}
              >
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="APROBADA">Aprobada</MenuItem>
                <MenuItem value="RECHAZADA">Rechazada</MenuItem>
                <MenuItem value="VENCIDA">Vencida</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Fecha */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Fecha"
              value={new Date(cotizacion.fechaCreacion).toLocaleDateString()}
              disabled
            />
          </Grid>

          {/* Detalles */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Detalles de la Cotización
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Cantidad</TableCell>
                    <TableCell>Precio Unitario</TableCell>
                    <TableCell>Descuento (%)</TableCell>
                    <TableCell>Subtotal</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(cotizacion.detalles) && cotizacion.detalles.map((detalle: any) => (
                    <TableRow key={detalle.id}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={detalle.productoId || ''}
                            onChange={(e) => {
                              console.log('Producto seleccionado ID:', e.target.value)
                              handleUpdateDetalle(detalle.id, 'productoId', e.target.value)
                            }}
                          >
                            {productos.map((producto) => (
                              <MenuItem key={producto.productoId} value={producto.productoId}>
                                {producto.nombre} - ${producto.precio}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={detalle.cantidad || ''}
                          onChange={(e) => handleUpdateDetalle(detalle.id, 'cantidad', e.target.value)}
                          inputProps={{ min: 1 }}
                        />
                      </TableCell>
                      <TableCell>
                        ${detalle.precioUnitario?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={detalle.descuento || 0}
                          onChange={(e) => handleUpdateDetalle(detalle.id, 'descuento', e.target.value)}
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </TableCell>
                      <TableCell>${detalle.subtotal || 0}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            const newDetalles = cotizacion.detalles.filter((d: any) => d.id !== detalle.id)
                            const totales = calcularTotales(newDetalles)
                            setCotizacion({
                              ...cotizacion,
                              detalles: newDetalles,
                              subtotal: totales.subtotal,
                              descuento: totales.descuento,
                              impuesto: totales.impuesto,
                              total: totales.total
                            })
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Totales */}
          <Grid item xs={12}>
            <div className='flex justify-end'>
              <div className='min-w-[300px]'>
                <div className='flex justify-between mb-2'>
                  <Typography>Subtotal:</Typography>
                  <Typography>${cotizacion?.subtotal?.toLocaleString('es-CL') || '0'}</Typography>
                </div>
                <div className='flex justify-between mb-2'>
                  <Typography>Descuento:</Typography>
                  <Typography>${cotizacion?.descuento?.toLocaleString('es-CL') || '0'}</Typography>
                </div>
                <div className='flex justify-between mb-2'>
                  <Typography>IVA (19%):</Typography>
                  <Typography>${cotizacion?.impuesto?.toLocaleString('es-CL') || '0'}</Typography>
                </div>
                <Divider className='my-2' />
                <div className='flex justify-between'>
                  <Typography variant='h6'>Total:</Typography>
                  <Typography variant='h6'>${cotizacion?.total?.toLocaleString('es-CL') || '0'}</Typography>
                </div>
              </div>
            </div>
          </Grid>

          {/* Observaciones */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Observaciones"
              value={cotizacion.observaciones || ''}
              onChange={(e) => setCotizacion({ ...cotizacion, observaciones: e.target.value })}
            />
          </Grid>
        </Grid>

        <div className='flex justify-end gap-4 mt-4'>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              try {
                const response = await fetch(`/api/cotizaciones/${id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(cotizacion)
                })

                if (!response.ok) throw new Error('Error al actualizar la cotización')
                router.push('/apps/invoice/list')
              } catch (error) {
                console.error('Error:', error)
                setError('Error al actualizar la cotización')
              }
            }}
          >
            Guardar Cambios
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default EditCard
