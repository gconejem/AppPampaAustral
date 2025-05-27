import { useState, useEffect } from 'react'
import { Typography, Grid, Card, CardContent, Divider } from '@mui/material'
import axios from 'axios'

import type { Obra, ContactoObra } from '@/types/forms/obra'

interface WorkPreviewProps {
  obra: Obra | null
}

const WorkPreview = ({ obra }: WorkPreviewProps) => {
  const [listasPrecios, setListasPrecios] = useState<Array<{ id: string; nombre: string }>>([])

  useEffect(() => {
    const fetchListasPrecios = async () => {
      try {
        const response = await axios.get('/api/listas-precios')
        setListasPrecios(response.data)
      } catch (error) {
        console.error('Error al cargar las listas de precios:', error)
      }
    }

    fetchListasPrecios()
  }, [])

  if (!obra) return null

  const getListaPrecioNombre = (id: string | number) => {
    const lista = listasPrecios.find(l => String(l.id) === String(id))
    return lista ? lista.nombre : id
  }

  return (
    <div className='space-y-6'>
      {/* Datos Principales */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Datos Principales
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Número Obra
              </Typography>
              <Typography>{obra.numeroObra}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Fecha Ingreso
              </Typography>
              <Typography>{obra.fechaIngreso ? new Date(obra.fechaIngreso).toLocaleDateString() : '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Estado Obra
              </Typography>
              <Typography>{obra.estadoObra}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                RUT Cliente
              </Typography>
              <Typography>{obra.rut}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Nombre Cliente
              </Typography>
              <Typography>{obra.nombreCliente}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Antecedentes */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Antecedentes
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                Nombre Obra
              </Typography>
              <Typography>{obra.nombreObra}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                Dirección
              </Typography>
              <Typography>{obra.direccion}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Región
              </Typography>
              <Typography>{obra.region}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Comuna
              </Typography>
              <Typography>{obra.comuna}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Sector
              </Typography>
              <Typography>{obra.sector || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Georreferencia
              </Typography>
              <Typography>{obra.georreferencia || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Referencia
              </Typography>
              <Typography>{obra.referencia || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Mandante
              </Typography>
              <Typography>{obra.mandante || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Informe a Mandante
              </Typography>
              <Typography>{obra.informeMandante ? 'Sí' : 'No'}</Typography>
            </Grid>
            {obra.informeMandante && (
              <Grid item xs={12}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Texto Mandante
                </Typography>
                <Typography>{obra.textoMandante || '-'}</Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                Correos
              </Typography>
              <Typography>{Array.isArray((obra as any).correos) ? (obra as any).correos.join(', ') : '-'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Requisitos */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Requisitos
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Acreditación Personal
              </Typography>
              <Typography>{obra.acreditacionPersonal ? 'Sí' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Especificaciones Técnicas
              </Typography>
              <Typography>{obra.especificacionesTecnicas ? 'Sí' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Acreditación Equipos
              </Typography>
              <Typography>{obra.acreditacionEquipos ? 'Sí' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Carta Compromiso
              </Typography>
              <Typography>{obra.cartaCompromiso ? 'Sí' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Mandato y Envío de Informes a SERVIU
              </Typography>
              <Typography>{obra.mandatoServiu ? 'Sí' : 'No'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                Otros Requisitos
              </Typography>
              <Typography>{obra.otrosRequisitos || '-'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Facturación */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Facturación
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Razón Social
              </Typography>
              <Typography>{obra.razonSocial}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                RUT
              </Typography>
              <Typography>{obra.rut}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Giro
              </Typography>
              <Typography>{obra.giro || '-'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' color='text.secondary'>
                Dirección Comercial
              </Typography>
              <Typography>{obra.direccionComercial}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Comuna
              </Typography>
              <Typography>{obra.comunaFacturacion || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Teléfono
              </Typography>
              <Typography>{obra.telefonoFacturacion || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Lista de Precios
              </Typography>
              <Typography>{obra.listaPrecios ? getListaPrecioNombre(obra.listaPrecios) : '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Mail Recepción Factura
              </Typography>
              <Typography>{obra.mailRecepcionFactura || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                RUT Representante Legal
              </Typography>
              <Typography>{obra.rutRepresentanteLegal || '-'}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' color='text.secondary'>
                Representante Legal
              </Typography>
              <Typography>{obra.representanteLegal || '-'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Contactos */}
      <Card>
        <CardContent>
          <Typography variant='h6' className='mb-4'>
            Contactos
          </Typography>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead>
              <tr>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>NOMBRE</th>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>CARGO</th>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>EMAIL</th>
                <th className='py-3 px-4 text-left text-xs font-normal text-gray-500'>TELÉFONO</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200'>
              {obra.contactos
                ?.sort((a: ContactoObra, b: ContactoObra) => {
                  // Primero el contacto principal
                  if (a.isPrincipal && !b.isPrincipal) return -1
                  if (!a.isPrincipal && b.isPrincipal) return 1
                  return 0
                })
                .map((contact: ContactoObra) => (
                  <tr key={contact.id}>
                    <td className='py-3 px-4'>
                      {contact.nombre}
                      {contact.isPrincipal && (
                        <span className='ml-2 text-xs text-primary'>Principal</span>
                      )}
                    </td>
                    <td className='py-3 px-4'>{contact.rol}</td>
                    <td className='py-3 px-4'>{contact.email}</td>
                    <td className='py-3 px-4'>{contact.telefono1}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

export default WorkPreview
