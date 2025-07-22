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
  if (!fecha) return 'No especificada'

  try {
    // Si la fecha viene en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ), extraer solo la parte de la fecha
    let fechaStr = fecha
    if (fecha.includes('T')) {
      fechaStr = fecha.split('T')[0] // Obtener solo YYYY-MM-DD
    }

    // Crear fecha usando los componentes individuales para evitar problemas de zona horaria
    const [año, mes, dia] = fechaStr.split('-').map(Number)

    // Verificar que los componentes sean válidos
    if (!año || !mes || !dia || mes < 1 || mes > 12 || dia < 1 || dia > 31) {
      return 'Fecha inválida'
    }

    // Formatear como DD/MM/YYYY
    const diaFormateado = dia.toString().padStart(2, '0')
    const mesFormateado = mes.toString().padStart(2, '0')

    return `${diaFormateado}-${mesFormateado}-${año}`
  } catch (error) {
    console.error('Error al formatear fecha:', error)
    return 'Error en fecha'
  }
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
        console.log('AAAAA', parsedData.fechaEmision, parsedData.fechaVencimiento)

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
              Laboratorio Acreditado INN - Chile ISO/IEC 17025-2017
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography sx={{ mt: 2 }}>N° COTIZACIÓN {previewData.numeroCotizacion}-{previewData.version || '00'}</Typography>
            <Typography>Fecha Emisión: {formatearFecha(previewData.fechaEmision)}</Typography>
            <Typography>Fecha Vencimiento: {formatearFecha(previewData.fechaVencimiento)}</Typography>
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
            <Typography>
              <strong>Métodos de pago:</strong> Transferencia, Tarjetas vía flow.cl, solicitar link.
            </Typography>
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
                : previewData.tipoCotizacion === 'C'
                  ? 'Servicio Mensual'
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

          {previewData.tipoCotizacion === 'C' && (
            <>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                <strong>Duración Mensual:</strong> {previewData.duracionMensual || 'No especificada'}
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                <strong>Jornada Mensual:</strong> {previewData.jornadaMensual || 'No especificada'}
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                <strong>Antecedentes Mensual:</strong> {previewData.antecedentesMensual || 'No especificados'}
              </Typography>
              {previewData.alcanceServicio && (
                <Typography sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                  <strong>Alcance del servicio:</strong> {previewData.alcanceServicio}
                </Typography>
              )}
            </>
          )}
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
              INFORMACIÓN DE LA COTIZACIÓN:
            </Typography>

            {/* Antecedentes */}
            {previewData.antecedentesGeneral && (
              <Box sx={{ mb: 3 }}>
                <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                  Antecedentes:
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewData.antecedentesGeneral}</Typography>
              </Box>
            )}

            {/* Plazo de Entrega */}
            {previewData.plazoEntregaGeneral && (
              <Box sx={{ mb: 3 }}>
                <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                  Plazo de Entrega:
                </Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewData.plazoEntregaGeneral}</Typography>
              </Box>
            )}

            {/* Texto General */}
            <Box sx={{ mb: 3 }}>
              <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
                Texto General:
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{previewData.textoGeneral || 'No especificado'}</Typography>
            </Box>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                <TableCell>ÁREA</TableCell>
                <TableCell>SERVICIO/ENSAYO</TableCell>
                <TableCell>DESCRIPCIÓN</TableCell>
                {(() => {
                  // Mostrar columnas cuando:
                  // 1. No es sinCantidad y es precio por producto (caso normal)
                  // 2. Es sinCantidad y es precio total (mostrar columnas vacías)
                  // 3. NO es sinCantidad y es precio total (mostrar cantidades pero precio/total vacíos)
                  // 4. Es sinCantidad y es precio por producto (mostrar guión en cantidad, precio normal, total igual al precio)
                  // 5. Para tipo D con precioProducto: true
                  const mostrarColumnas =
                    (!previewData.sinCantidad && previewData.precioProducto) ||
                    (previewData.sinCantidad && previewData.precioTotal) ||
                    (!previewData.sinCantidad && previewData.precioTotal) ||
                    (previewData.sinCantidad && previewData.precioProducto) ||
                    previewData.tipoCotizacion === 'A';

                  return mostrarColumnas ? (
                    <>
                      <TableCell align='right'>CANTIDAD</TableCell>
                      <TableCell align='right'>PRECIO UNITARIO UF</TableCell>
                      <TableCell align='right'>TOTAL NETO UF</TableCell>
                    </>
                  ) : null;
                })()}
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const detalles = previewData.detalles || []
                const rows: JSX.Element[] = []

                // Función auxiliar para determinar si mostrar columnas
                const mostrarColumnas = () => {
                  return (!previewData.sinCantidad && previewData.precioProducto) ||
                    (previewData.sinCantidad && previewData.precioTotal) ||
                    (!previewData.sinCantidad && previewData.precioTotal) ||
                    (previewData.sinCantidad && previewData.precioProducto) ||
                    previewData.tipoCotizacion === 'A';
                };

                // Función auxiliar para renderizar las celdas de cantidad/precio/total
                const renderizarCeldasPrecio = (item: any) => {
                  if (!mostrarColumnas()) return null;

                  // Si es tipo A con sinCantidad = true, mostrar guiones en todas las columnas
                  if (previewData.tipoCotizacion === 'A' && previewData.sinCantidad) {
                    return (
                      <>
                        <TableCell align='right'>-</TableCell>
                        <TableCell align='right'>UF {Number(item.precioUnitarioUF || 0).toFixed(3)}</TableCell>
                        <TableCell align='right'>-</TableCell>
                      </>
                    );
                  }

                  // Si es sinCantidad y precio total, mostrar columnas vacías
                  if (previewData.sinCantidad && previewData.precioTotal) {
                    return (
                      <>
                        <TableCell align='right'>-</TableCell>
                        <TableCell align='right'>-</TableCell>
                        <TableCell align='right'>-</TableCell>
                      </>
                    );
                  }

                  // Si es sinCantidad y precio por producto, mostrar guión en cantidad, precio normal y total igual al precio
                  if (previewData.sinCantidad && previewData.precioProducto) {
                    return (
                      <>
                        <TableCell align='right'>-</TableCell>
                        <TableCell align='right'>UF {Number(item.precioUnitarioUF || 0).toFixed(3)}</TableCell>
                        <TableCell align='right'>UF {Number(item.precioUnitarioUF || 0).toFixed(3)}</TableCell>
                      </>
                    );
                  }

                  // Si NO es sinCantidad y precio total, mostrar cantidades pero precio y total vacíos
                  if (!previewData.sinCantidad && previewData.precioTotal) {
                    return (
                      <>
                        <TableCell align='right'>{item.cantidad || 0}</TableCell>
                        <TableCell align='right'>-</TableCell>
                        <TableCell align='right'>-</TableCell>
                      </>
                    );
                  }

                  // Caso normal: mostrar valores
                  return (
                    <>
                      <TableCell align='right'>{item.cantidad || 0}</TableCell>
                      <TableCell align='right'>UF {Number(item.precioUnitarioUF || 0).toFixed(3)}</TableCell>
                      <TableCell align='right'>UF {Number(item.totalNetoUF || 0).toFixed(3)}</TableCell>
                    </>
                  );
                };

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
                        <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{item.descripcion || ''}</TableCell>
                        {renderizarCeldasPrecio(item)}
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
                          <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{sub.descripcion || ''}</TableCell>
                          {renderizarCeldasPrecio(sub)}
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
                        <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{item.descripcion || ''}</TableCell>
                        {renderizarCeldasPrecio(item)}
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
            // Para cotización tipo A con sinCantidad true - mostrar guiones
            if (previewData.tipoCotizacion === 'A' && previewData.sinCantidad) {
              return (
                <>
                  <Typography>
                    <strong>Subtotal:</strong> -
                  </Typography>
                  <Typography>
                    <strong>Descuento:</strong> -
                  </Typography>
                  <Typography>
                    <strong>IVA (19%):</strong> -
                  </Typography>
                  <Typography variant='h6'>
                    <strong>Total:</strong> -
                  </Typography>
                </>
              );
            }

            // Para todos los demás casos, usar los valores que ya vienen calculados del localStorage
            // Si no están disponibles, usar 0 como fallback
            const subtotal = Number(previewData.subtotal || 0);
            const descuento = Number(previewData.descuento || 0);
            const iva = Number(previewData.impuesto || 0);
            const total = Number(previewData.total || 0);

            return (
              <>
                <Typography>
                  <strong>Subtotal:</strong> UF {subtotal.toFixed(3)}
                </Typography>
                <Typography>
                  <strong>Descuento:</strong> UF {descuento.toFixed(3)}
                </Typography>
                <Typography>
                  <strong>IVA (19%):</strong> UF {iva.toFixed(3)}
                </Typography>
                <Typography variant='h6'>
                  <strong>Total:</strong> UF {total.toFixed(3)}
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
