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
            <Typography sx={{ mt: 2 }}>N° COTIZACIÓN {previewData.numeroCotizacion}</Typography>
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
                {previewData.contacto.email && (
                  <Typography>
                    <strong>Email:</strong> {previewData.contacto.email}
                  </Typography>
                )}
                {previewData.contacto.telefono1 && (
                  <Typography>
                    <strong>Teléfono:</strong> {previewData.contacto.telefono1}
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

        {/* Tabla de Productos */}
        <Table sx={{ mb: 4 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
              <TableCell>ÁREA</TableCell>
              <TableCell>SERVICIO/ENSAYO</TableCell>
              <TableCell>DESCRIPCIÓN</TableCell>
              <TableCell align='right'>CANTIDAD</TableCell>
              <TableCell align='right'>PRECIO UNITARIO UF</TableCell>
              <TableCell align='right'>TOTAL NETO UF</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(() => {
              // Agrupar detalles por área
              type Detalle = {
                area?: string
                esPaquete?: boolean
                esSubProducto?: boolean
                [key: string]: any
              }
              const detalles: Detalle[] = previewData.detalles || []
              const areasMap = new Map<string, Detalle[]>()

              detalles.forEach((det: Detalle) => {
                const area = det.area || 'Sin área'

                if (!areasMap.has(area)) areasMap.set(area, [])
                areasMap.get(area)?.push(det)
              })
              const rows: JSX.Element[] = []

              Array.from(areasMap.entries()).forEach(([area, detallesArea], areaIdx) => {
                // Opcional: Título de área
                rows.push(
                  <TableRow key={`area-title-${areaIdx}`}>
                    <TableCell colSpan={6} style={{ background: '#f5f5f5', fontWeight: 700 }}>
                      {area}
                    </TableCell>
                  </TableRow>
                )
                let i = 0

                while (i < detallesArea.length) {
                  const item = detallesArea[i]

                  if (item.esPaquete) {
                    // Renderizar la fila del paquete
                    rows.push(
                      <TableRow key={`paquete-${areaIdx}-${i}`} sx={{ backgroundColor: 'primary.lighter' }}>
                        <TableCell>{item.area || ''}</TableCell>
                        <TableCell>
                          <strong>{item.servicio || ''}</strong>
                          <span style={{ marginLeft: 8, fontSize: '0.75em', color: '#1976d2' }}>[Paquete]</span>
                        </TableCell>
                        <TableCell>{item.descripcion || ''}</TableCell>
                        <TableCell align='right'>{item.cantidad || 0}</TableCell>
                        <TableCell align='right'>UF {Number(item.precioUnitarioUF || 0).toFixed(2)}</TableCell>
                        <TableCell align='right'>UF {Number(item.totalNetoUF || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    )

                    // Subproductos
                    let j = i + 1

                    while (j < detallesArea.length && detallesArea[j].esSubProducto) {
                      const sub = detallesArea[j]

                      rows.push(
                        <TableRow key={`subproducto-${areaIdx}-${j}`} sx={{ backgroundColor: '#e3f2fd' }}>
                          <TableCell>{sub.area || ''}</TableCell>
                          <TableCell sx={{ pl: 4 }}>{sub.servicio || ''}</TableCell>
                          <TableCell>{sub.descripcion || ''}</TableCell>
                          <TableCell align='right'>{sub.cantidad || 0}</TableCell>
                          <TableCell align='right'>UF {Number(sub.precioUnitarioUF || 0).toFixed(2)}</TableCell>
                          <TableCell align='right'>UF {Number(sub.totalNetoUF || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      )
                      j++
                    }

                    i = j
                  } else {
                    // Producto normal
                    rows.push(
                      <TableRow key={`producto-${areaIdx}-${i}`}>
                        <TableCell>{item.area || ''}</TableCell>
                        <TableCell>{item.servicio || ''}</TableCell>
                        <TableCell>{item.descripcion || ''}</TableCell>
                        <TableCell align='right'>{item.cantidad || 0}</TableCell>
                        <TableCell align='right'>UF {Number(item.precioUnitarioUF || 0).toFixed(2)}</TableCell>
                        <TableCell align='right'>UF {Number(item.totalNetoUF || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    )
                    i++
                  }
                }
              })

              return rows
            })()}
          </TableBody>
        </Table>

        {/* Totales */}
        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Typography>
            <strong>Subtotal:</strong> UF {Number(previewData.subtotal).toFixed(2)}
          </Typography>
          <Typography>
            <strong>Descuento:</strong> UF {Number(previewData.descuento).toFixed(2)}
          </Typography>
          <Typography>
            <strong>IVA (19%):</strong> UF {Number(previewData.impuesto).toFixed(2)}
          </Typography>
          <Typography variant='h6'>
            <strong>Total:</strong> UF {Number(previewData.total).toFixed(2)}
          </Typography>
        </Box>

        {/* Observaciones */}
        {previewData.observaciones && (
          <Box sx={{ mt: 4 }}>
            <Typography variant='subtitle2' sx={{ mb: 2, color: 'text.secondary' }}>
              OBSERVACIONES:
            </Typography>
            <Typography sx={{ mt: 1 }}>{previewData.observaciones}</Typography>
          </Box>
        )}

        {/* Notas específicas para tipo A */}
        {previewData.tipoCotizacion === 'A' && (
          <Box sx={{ mt: 4, px: 4 }}>
            <Typography variant='h6' sx={{ mb: 2, color: 'text.secondary' }}>
              Notas:
            </Typography>
            <Typography
              component='div'
              variant='body2'
              sx={{
                fontSize: '0.85rem',
                '& > p': { mb: 2 },
                '& > ul': {
                  listStyle: 'none',
                  pl: 0,
                  '& > li': {
                    mb: 1,
                    position: 'relative',
                    pl: 2,
                    '&::before': {
                      content: '"•"',
                      position: 'absolute',
                      left: 0
                    }
                  }
                }
              }}
            >
              <p>Valores unitarios Neto (sin IVA incluido)</p>
              <p>Adicionales contra evento:</p>
              <ul>
                <li>Copia digital adicional tiene un costo de 0.15 UF neto.</li>
                <li>
                  Anexo de Informe, tendrá un costo de 0.42 UF neto, salvo que las modificaciones sean de
                  responsabilidad de Laboratorio Pampa Austral Ltda.
                </li>
                <li>Informe con firma y timbres físicos tiene un costo de 0.58 UF neto</li>
              </ul>
              <p>Recargos por jornadas extraordinarias (a todos los ítem de la cotización):</p>
              <ul>
                <li>50% Adicional Lunes a jueves desde 18:00 a 21:00 horas, viernes 17:00 a 21:00 horas.</li>
                <li>100% Adicional Sábado, Domingo o Festivo.</li>
              </ul>
              <p>
                Cualquier requisito adicional, como certificaciones, acreditaciones de personal, normativas, reglamentos
                o exigencias de seguridad y medioambiente, debe informarse previamente para su evaluación y nueva
                cotización si corresponde.
              </p>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default PreviewCard
