'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'

import Logo from '@components/layout/shared/Logo'

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import './print.css'

// Función auxiliar para formatear fechas
const formatearFecha = (fecha: string) => {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }

  return new Date(fecha).toLocaleDateString('es-CL', options)
}

const PreviewCard = () => {
  const [previewData, setPreviewData] = useState<any>(null)

  useEffect(() => {
    const data = localStorage.getItem('cotizacionPreview')

    if (data) {
      const parsedData = JSON.parse(data)

      console.log('Datos recuperados:', parsedData)
      setPreviewData(parsedData)
    }
  }, [])

  if (!previewData) return null

  return (
    <Card>
      <CardContent id='preview-content'>
        {/* Cabecera */}
        <Grid container spacing={6} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <Logo />
            <Typography
              sx={{
                mt: 2,
                fontStyle: 'italic',
                color: 'text.secondary',
                fontSize: '0.875rem'
              }}
            >
              Laboratorio acreditado de acuerdo con la Norma NCh-ISO/IEC 17025:2017
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography sx={{ mt: 2 }}>N° COTIZACIÓN {previewData.numeroCotizacion}</Typography>
            <Typography>Fecha Emisión: {formatearFecha(previewData.fechaInicio)}</Typography>
            <Typography>Fecha Vencimiento: {formatearFecha(previewData.fechaFin)}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Información del Cliente y Datos Bancarios */}
        <Grid container spacing={6} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              EN ATENCIÓN A:
            </Typography>
            {previewData.contacto && (
              <div>
                <Typography>{previewData.contacto.nombre}</Typography>
                <Typography>{previewData.contacto.email}</Typography>
                <Typography>{previewData.contacto.cargo}</Typography>
                <Typography>{previewData.contacto.telefono1}</Typography>
              </div>
            )}
          </Grid>
          <Grid item xs={6}>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              DATOS BANCARIOS
            </Typography>
            <Typography>Nombre: Sociedad Laboratorio Pampa Austral Ltda.</Typography>
            <Typography>Rut: 77.390.460-K</Typography>
            <Typography>Cuenta Corriente: 220-02813-03, Banco de Chile</Typography>
          </Grid>
        </Grid>

        {/* Datos del Proyecto */}
        <Box sx={{ mb: 4 }}>
          <Typography variant='subtitle2' sx={{ mb: 2 }}>
            DATOS DEL PROYECTO
          </Typography>
          <Typography>Tipo: {previewData.tipoCotizacion}</Typography>
          <Typography>Proyecto: {previewData.nombreProyecto}</Typography>
          <Typography>Empresa: {previewData.empresa}</Typography>
          <Typography>Ubicación: {previewData.ubicacion}</Typography>
        </Box>

        {/* Tabla de Productos */}
        <Table sx={{ mb: 4 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
              <TableCell>ÁREA</TableCell>
              <TableCell>PRODUCTO</TableCell>
              <TableCell>DESCRIPCIÓN</TableCell>
              <TableCell align='right'>CANTIDAD</TableCell>
              <TableCell align='right'>PRECIO UNIT.</TableCell>
              <TableCell align='right'>DESCUENTO</TableCell>
              <TableCell align='right'>TOTAL</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {previewData.detalles.map((item: any, index: number) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: item.esSubProducto ? 'action.hover' : 'inherit',
                  '& > td': {
                    pl: item.esSubProducto ? 6 : 2,
                    fontSize: item.esSubProducto ? '0.875rem' : 'inherit',
                    color: item.esSubProducto ? 'text.secondary' : 'inherit'
                  }
                }}
              >
                <TableCell>{item.area}</TableCell>
                <TableCell>
                  {item.nombre}
                  {item.norma && ` - ${item.norma}`}
                  {item.esPaquete && ' (Paquete)'}
                </TableCell>
                <TableCell>{item.descripcion}</TableCell>
                <TableCell align='right'>{item.cantidad}</TableCell>
                <TableCell align='right'>${Number(item.precio).toLocaleString('es-CL')}</TableCell>
                <TableCell align='right'>{item.descuento}%</TableCell>
                <TableCell align='right'>
                  ${Number(item.precio * item.cantidad * (1 - item.descuento / 100)).toLocaleString('es-CL')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totales */}
        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Typography>
            <strong>Subtotal:</strong> ${Number(previewData.subtotal).toLocaleString('es-CL')}
          </Typography>
          <Typography>
            <strong>Descuento:</strong> ${Number(previewData.descuento).toLocaleString('es-CL')}
          </Typography>
          <Typography>
            <strong>IVA (19%):</strong> ${Number(previewData.impuesto).toLocaleString('es-CL')}
          </Typography>
          <Typography variant='h6'>
            <strong>Total:</strong> ${Number(previewData.total).toLocaleString('es-CL')}
          </Typography>
        </Box>

        {/* Observaciones */}
        {previewData.observaciones && (
          <Box sx={{ mt: 4 }}>
            <Typography variant='subtitle2'>OBSERVACIONES:</Typography>
            <Typography sx={{ mt: 1 }}>{previewData.observaciones}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default PreviewCard
