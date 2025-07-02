'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'

import Logo from '@components/layout/shared/Logo'

const PreviewTemp = () => {
  const [previewData, setPreviewData] = useState<any>(null)

  useEffect(() => {
    try {
      const data = localStorage.getItem('cotizacionPreview')

      if (data) {
        const parsedData = JSON.parse(data)

        console.log('=== DATOS EN PREVIEW ===')
        console.log('Datos completos:', parsedData)
        console.log('Cliente:', parsedData.cliente)
        console.log('Obra:', parsedData.obra)
        console.log('Detalles:', parsedData.detalles)
        setPreviewData(parsedData)
      }
    } catch (error) {
      console.error('Error al cargar datos del preview:', error)
    }
  }, [])

  if (!previewData) return <Typography>Cargando...</Typography>

  return (
    <Card>
      <CardContent>
        <Grid container spacing={4}>
          {/* Header */}
          <Grid item xs={12}>
            <div className='flex justify-between items-center'>
              <div>
                <Logo />
                <Typography>Calle Santa Blanca 51, Chillán – Chile.</Typography>
                <Typography>Email: contacto@pampaustral.cl</Typography>
                <Typography>+56 42-223 82 90</Typography>
              </div>
              <div>
                <Typography variant='h6'>Cotización #{previewData.numeroCotizacion}</Typography>
                <Typography>Tipo: {previewData.tipoCotizacion}</Typography>
                <Typography>Estado: {previewData.estado}</Typography>
                <Typography>Desde: {previewData.fechaInicio}</Typography>
                <Typography>Hasta: {previewData.fechaFin}</Typography>
              </div>
            </div>
          </Grid>

          {/* Cliente y Obra */}
          <Grid item xs={12}>
            <div className='bg-gray-50 p-4 rounded'>
              <Typography>Cliente: {previewData.cliente?.nombreCliente || 'Sin cliente'}</Typography>
              <Typography>Obra: {previewData.obra?.nombreObra || 'Sin obra'}</Typography>
            </div>
          </Grid>

          {/* Tabla de productos */}
          <Grid item xs={12}>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='border p-2 text-left'>Producto</th>
                  <th className='border p-2 text-right'>Cantidad</th>
                  <th className='border p-2 text-right'>Precio</th>
                  <th className='border p-2 text-right'>Descuento</th>
                  <th className='border p-2 text-right'>Total</th>
                </tr>
              </thead>
              <tbody>
                {previewData.detalles?.map((detalle: any, index: number) => (
                  <tr key={index}>
                    <td className='border p-2'>{detalle.nombre}</td>
                    <td className='border p-2 text-right'>{detalle.cantidad}</td>
                    <td className='border p-2 text-right'>${parseInt(detalle.precio).toLocaleString('es-CL')}</td>
                    <td className='border p-2 text-right'>{detalle.descuento}%</td>
                    <td className='border p-2 text-right'>${parseInt(detalle.subtotal).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Grid>

          {/* Totales */}
          <Grid item xs={12}>
            <div className='flex justify-end'>
              <div className='w-[300px]'>
                <div className='flex justify-between mb-2'>
                  <Typography>Subtotal:</Typography>
                  <Typography>${parseInt(previewData.subtotal).toLocaleString('es-CL')}</Typography>
                </div>
                <div className='flex justify-between mb-2'>
                  <Typography>Descuento:</Typography>
                  <Typography>${parseInt(previewData.descuentoMonto).toLocaleString('es-CL')}</Typography>
                </div>
                <div className='flex justify-between mb-2'>
                  <Typography>Impuesto:</Typography>
                  <Typography>${parseInt(previewData.impuesto).toLocaleString('es-CL')}</Typography>
                </div>
                <Divider className='my-2' />
                <div className='flex justify-between'>
                  <Typography variant='h6'>Total:</Typography>
                  <Typography variant='h6'>${parseInt(previewData.total).toLocaleString('es-CL')}</Typography>
                </div>
              </div>
            </div>
          </Grid>

          {/* Observaciones */}
          {previewData.observaciones && (
            <Grid item xs={12}>
              <Typography variant='h6'>Observaciones:</Typography>
              <Typography>{previewData.observaciones}</Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PreviewTemp
