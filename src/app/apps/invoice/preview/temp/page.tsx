'use client'

import { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Logo from '@components/layout/shared/Logo'

const PreviewTempPage = () => {
  const [previewData, setPreviewData] = useState<any>(null)

  useEffect(() => {
    const data = localStorage.getItem('cotizacionPreview')
    if (data) {
      const parsedData = JSON.parse(data)
      console.log('Datos en preview:', parsedData)
      setPreviewData(parsedData)
    }
  }, [])

  if (!previewData) return <Typography>Cargando...</Typography>

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            {/* Header */}
            <div className='flex justify-between items-center mb-6'>
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
              </div>
            </div>

            {/* Cliente */}
            <div className='bg-gray-50 p-4 rounded mb-6'>
              <Typography variant='h6'>Cliente:</Typography>
              <Typography>{previewData.cliente?.nombreCliente}</Typography>
              <Typography>Obra: {previewData.obra?.nombreObra}</Typography>
            </div>

            {/* Tabla de productos */}
            <table className='w-full mb-6'>
              <thead>
                <tr className='bg-gray-50'>
                  <th className='p-2 text-left'>Producto</th>
                  <th className='p-2 text-right'>Cantidad</th>
                  <th className='p-2 text-right'>Precio</th>
                  <th className='p-2 text-right'>Descuento</th>
                  <th className='p-2 text-right'>Total</th>
                </tr>
              </thead>
              <tbody>
                {previewData.detalles?.map((detalle: any, index: number) => (
                  <tr key={index}>
                    <td className='p-2'>{detalle.nombre}</td>
                    <td className='p-2 text-right'>{detalle.cantidad}</td>
                    <td className='p-2 text-right'>${detalle.precio}</td>
                    <td className='p-2 text-right'>{detalle.descuento}%</td>
                    <td className='p-2 text-right'>${detalle.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div className='flex justify-end mb-6'>
              <div className='w-[300px]'>
                <div className='flex justify-between mb-2'>
                  <Typography>Subtotal:</Typography>
                  <Typography>${previewData.subtotal}</Typography>
                </div>
                <div className='flex justify-between mb-2'>
                  <Typography>Descuento:</Typography>
                  <Typography>${previewData.descuentoMonto}</Typography>
                </div>
                <div className='flex justify-between mb-2'>
                  <Typography>Impuesto:</Typography>
                  <Typography>${previewData.impuesto}</Typography>
                </div>
                <Divider className='my-2' />
                <div className='flex justify-between'>
                  <Typography variant='h6'>Total:</Typography>
                  <Typography variant='h6'>${previewData.total}</Typography>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {previewData.observaciones && (
              <div>
                <Typography variant='h6'>Observaciones:</Typography>
                <Typography>{previewData.observaciones}</Typography>
              </div>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default PreviewTempPage
