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

// Style Imports
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
    try {
      const data = localStorage.getItem('cotizacionPreview')

      if (data) {
        const parsedData = JSON.parse(data)

        console.log('Datos recuperados del localStorage:', parsedData)
        console.log('Contacto recuperado:', parsedData.contacto)
        console.log('Detalles recuperados:', parsedData.detalles)

        // Validar la estructura de los datos
        if (!parsedData.detalles || !Array.isArray(parsedData.detalles)) {
          console.error('Los detalles no tienen el formato esperado:', parsedData.detalles)
          parsedData.detalles = []
        }

        if (!parsedData.contacto || typeof parsedData.contacto !== 'object') {
          console.error('El contacto no tiene el formato esperado:', parsedData.contacto)
          parsedData.contacto = null
        }

        setPreviewData(parsedData)
      } else {
        console.error('No se encontraron datos en localStorage')
      }
    } catch (error) {
      console.error('Error al recuperar datos del localStorage:', error)
    }
  }, [])

  if (!previewData) {
    return <Typography>No hay datos para mostrar</Typography>
  }

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
            <Typography sx={{ mt: 2 }}>N° COTIZACIÓN {previewData.numeroCotizacion}-{previewData.version || '00'}</Typography>
            <Typography>Fecha Emisión: {formatearFecha(previewData.fechaInicio)}</Typography>
            <Typography>Fecha Vencimiento: {formatearFecha(previewData.fechaFin)}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: '#FF0096' }} />

        {/* Información del Cliente y Datos Bancarios */}
        <Grid container spacing={6} sx={{ mb: 4 }}>
          <Grid item xs={6}>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              EN ATENCIÓN A:
            </Typography>
            {previewData.contacto ? (
              <Box sx={{ mb: 3 }}>
                <Typography>
                  <strong>Nombre:</strong> {previewData.contacto.nombre || 'Sin nombre'}
                </Typography>
                <Typography>
                  <strong>Cargo:</strong> {previewData.contacto.cargo || 'Sin cargo'}
                </Typography>
                <Typography>
                  <strong>Empresa:</strong> {previewData.contacto.empresa || 'Sin empresa'}
                </Typography>
                {previewData.contacto.email && (
                  <Typography>
                    <strong>Email:</strong> {previewData.contacto.email}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography color='text.secondary' sx={{ mb: 3 }}>
                Sin contacto asignado
              </Typography>
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
          <Typography>
            <strong>Tipo:</strong>{' '}
            {previewData.tipoCotizacion === 'A'
              ? 'Valores Unitarios'
              : previewData.tipoCotizacion === 'B'
                ? 'EMS'
                : previewData.tipoCotizacion === 'D'
                  ? 'Genérica'
                  : 'Mensual'}
          </Typography>
          <Typography>
            <strong>Proyecto:</strong> {previewData.nombreProyecto || 'No especificado'}
          </Typography>
          <Typography>
            <strong>Empresa:</strong> {previewData.empresa || 'No especificada'}
          </Typography>
          <Typography>
            <strong>Ubicación:</strong> {previewData.ubicacion || 'No especificada'}
          </Typography>
          <Typography>
            <strong>Forma de Pago:</strong>{' '}
            {previewData.formaPago === 'CONTADO'
              ? 'Contado'
              : previewData.formaPago === 'CREDITO_30'
                ? 'Crédito 30 días'
                : previewData.formaPago === 'CREDITO_60'
                  ? 'Crédito 60 días'
                  : previewData.formaPago === 'CREDITO_90'
                    ? 'Crédito 90 días'
                    : 'No especificada'}
          </Typography>
        </Box>

        {/* Información EMS */}
        {previewData.tipoCotizacion === 'B' && (
          <Box sx={{ mb: 4 }}>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              INFORMACIÓN EMS
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant='subtitle2' color='text.secondary'>Superficie EMS</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewData.superficieEMS || 'No especificada'}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='subtitle2' color='text.secondary'>Antecedentes EMS</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewData.antecedentesEMS || 'No especificados'}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant='subtitle2' color='text.secondary'>Plazo de Entrega EMS</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewData.plazoEntregaEMS || 'No especificado'}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tabla de Productos */}
        {previewData.tipoCotizacion === 'D' ? (
          <Box sx={{ mb: 4 }}>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              TEXTO GENERAL DE LA COTIZACIÓN:
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewData.textoGeneral || 'No especificado'}</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                <TableCell>ÁREA</TableCell>
                <TableCell>SERVICIO/ENSAYO</TableCell>
                <TableCell>DESCRIPCIÓN</TableCell>
                {previewData.precioEMSPorProducto && (
                  <>
                    <TableCell align='right'>CANTIDAD</TableCell>
                    <TableCell align='right'>PRECIO UNITARIO UF</TableCell>
                    <TableCell align='right'>TOTAL NETO UF</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const detalles = previewData.detalles || []
                const rows: JSX.Element[] = []

                for (let i = 0; i < detalles.length; i++) {
                  const item = detalles[i]

                  if (item.esPaquete) {
                    // Renderizar la fila del paquete
                    rows.push(
                      <TableRow key={`paquete-${i}`} sx={{ backgroundColor: 'primary.lighter' }}>
                        <TableCell>{item.area || ''}</TableCell>
                        <TableCell>
                          <strong>{item.servicio || ''}</strong>
                          <span style={{ marginLeft: 8, fontSize: '0.75em', color: '#1976d2' }}>[Paquete]</span>
                        </TableCell>
                        <TableCell>{item.descripcion || ''}</TableCell>
                        {previewData.precioEMSPorProducto && (
                          <>
                            <TableCell align='right'>{item.cantidad || 0}</TableCell>
                            <TableCell align='right'>UF {Number(item.precioUnitarioUF || 0).toFixed(2)}</TableCell>
                            <TableCell align='right'>UF {Number(item.totalNetoUF || 0).toFixed(2)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    )

                    // Buscar y mostrar todos los subproductos que pertenecen a este paquete
                    let j = i + 1
                    while (j < detalles.length && detalles[j].esSubProducto) {
                      const sub = detalles[j]
                      rows.push(
                        <TableRow key={`subproducto-${j}`} sx={{ backgroundColor: '#e3f2fd' }}>
                          <TableCell>{sub.area || ''}</TableCell>
                          <TableCell sx={{ pl: 4 }}>{sub.servicio || ''}</TableCell>
                          <TableCell>{sub.descripcion || ''}</TableCell>
                          {previewData.precioEMSPorProducto && (
                            <>
                              <TableCell align='right'>{sub.cantidad || 0}</TableCell>
                              <TableCell align='right'>UF {Number(sub.precioUnitarioUF || 0).toFixed(2)}</TableCell>
                              <TableCell align='right'>UF {Number(sub.totalNetoUF || 0).toFixed(2)}</TableCell>
                            </>
                          )}
                        </TableRow>
                      )
                      j++
                    }
                    // Saltar los subproductos que ya procesamos
                    i = j - 1
                  } else if (!item.esSubProducto) {
                    // Renderizar producto normal
                    rows.push(
                      <TableRow key={`producto-${i}`}>
                        <TableCell>{item.area || ''}</TableCell>
                        <TableCell>{item.servicio || ''}</TableCell>
                        <TableCell>{item.descripcion || ''}</TableCell>
                        {previewData.precioEMSPorProducto && (
                          <>
                            <TableCell align='right'>{item.cantidad || 0}</TableCell>
                            <TableCell align='right'>UF {Number(item.precioUnitarioUF || 0).toFixed(2)}</TableCell>
                            <TableCell align='right'>UF {Number(item.totalNetoUF || 0).toFixed(2)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    )
                  }
                  // Los subproductos sin paquete se ignoran (caso raro)
                }

                return rows
              })()}
            </TableBody>
          </Table>
        )}

        {/* Totales */}
        <Box sx={{ mb: 4, textAlign: 'right' }}>
          {(() => {
            // Asegurarnos de que todos los valores sean números válidos
            let subtotal, descuento, subtotalConDescuento, iva, total;
            if (previewData.tipoCotizacion === 'D') {
              subtotal = Number(previewData.totalNetoGeneral || 0);
              descuento = 0;
              subtotalConDescuento = subtotal;
              iva = subtotal * 0.19;
              total = subtotal + iva;
            } else {
              subtotal = Number(previewData.subtotal || 0);
              descuento = Number(previewData.descuento || 0);
              subtotalConDescuento = Math.max(0, subtotal - descuento);
              iva = subtotalConDescuento * 0.19;
              total = subtotalConDescuento + iva;
            }

            return (
              <>
                <Typography>
                  <strong>Subtotal:</strong> UF {subtotal.toFixed(2)}
                </Typography>
                <Typography>
                  <strong>Descuento:</strong> UF {descuento.toFixed(2)}
                </Typography>
                <Typography>
                  <strong>IVA (19%):</strong> UF {iva.toFixed(2)}
                </Typography>
                <Typography variant='h6'>
                  <strong>Total:</strong> UF {total.toFixed(2)}
                </Typography>
              </>
            )
          })()}
        </Box>

        {/* Observaciones */}
        {previewData.observaciones && (
          <Box sx={{ mb: 4 }}>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              OBSERVACIONES:
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewData.observaciones}</Typography>
          </Box>
        )}

        {/* Notas */}
        {previewData.notas && (
          <Box sx={{ mb: 4 }}>
            <Typography variant='subtitle2' sx={{ mb: 2 }}>
              NOTAS:
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewData.notas}</Typography>
          </Box>
        )}

        {/* Pie de página */}
      </CardContent>
    </Card>
  )
}

export default PreviewCard
