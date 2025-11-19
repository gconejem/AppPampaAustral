import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/lib/prisma'

interface Servicio {
  codigo: string
  nombre: string
  cantidad: string | number
}

interface Probeta {
  numero: number
  fechaConfeccion: string
  cantidad: number
  dias: number
  fechaVencimiento: string
}

interface Muestra {
  numeroMuestra?: string
  numeroTarjeta?: string
  tipoMaterial: string
  elemento: string
  item: string
  grado: string
  procedencia: string
  cotas: string
  ubicacionSector: string
  vencimiento: boolean
  observaciones: string
  estadoMuestra?: string
  servicios: Servicio[]
  probetas: Probeta[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { fechaCodificacion, fechaMuestreo, fechaIngreso, fechaEntrega, servicios, muestras, observaciones, clienteId, obraId, ordenTrabajoId } = req.body

      // Obtener los productos por su código
      const codigosServicios = [
        ...servicios.map((s: Servicio) => s.codigo),
        ...muestras.flatMap((m: Muestra) => m.servicios.map(s => s.codigo))
      ]

      const productos = await prisma.producto.findMany({
        where: {
          sku: {
            in: codigosServicios
          }
        }
      })

      const productosMap = productos.reduce((acc: Record<string, number>, prod) => {
        acc[prod.sku] = prod.productoId

        return acc
      }, {})

      // Generar número de RCM único (correlativo numérico)
      const ultimoRCM = await prisma.rCM.findFirst({
        orderBy: {
          id: 'desc'
        },
        select: {
          numeroRcm: true
        }
      })

      let numeroRcm = '1'
      if (ultimoRCM && ultimoRCM.numeroRcm) {
        const ultimoNumero = parseInt(ultimoRCM.numeroRcm)
        numeroRcm = (ultimoNumero + 1).toString()
      }

      // Crear el RCM
      const rcm = await prisma.rCM.create({
        data: {
          numeroRcm,
          fechaCodificacion: new Date(fechaCodificacion),
          fechaMuestreo: new Date(fechaMuestreo),
          fechaIngreso: new Date(fechaIngreso),
          fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
          estadoOperativo: 'CODIFICADO',
          estadoAdministrativo: 'SIN_INICIO',
          observaciones,
          clienteId: clienteId || null,
          obraId: obraId || null,
          ordenTrabajoId: ordenTrabajoId || null,
          servicios: {
            create: servicios
              .filter((servicio: Servicio) => productosMap[servicio.codigo]) // Only create services that have a matching product
              .map((servicio: Servicio) => ({
                codigo: servicio.codigo,
                nombre: servicio.nombre,
                cantidad: parseInt(servicio.cantidad.toString()),
                estado: 'CODIFICADO',
                producto: {
                  connect: {
                    productoId: productosMap[servicio.codigo]
                  }
                }
              }))
          },
          muestras: {
            create: muestras.map((muestra: Muestra, index: number) => ({
              numeroMuestra: muestra.numeroMuestra || `${numeroRcm}-${(index + 1).toString().padStart(2, '0')}`,
              numeroTarjeta: muestra.numeroTarjeta || null,
              tipoMaterial: muestra.tipoMaterial,
              elemento: muestra.elemento,
              item: muestra.item,
              grado: muestra.grado,
              procedencia: muestra.procedencia,
              cotas: muestra.cotas,
              ubicacionSector: muestra.ubicacionSector,
              vencimiento: muestra.vencimiento,
              observaciones: muestra.observaciones,
              estadoMuestra: muestra.estadoMuestra || 'CODIFICADO',
              servicios: {
                create: muestra.servicios
                  .filter(servicio => productosMap[servicio.codigo]) // Only create services that have a matching product
                  .map(servicio => ({
                    codigo: servicio.codigo,
                    nombre: servicio.nombre,
                    cantidad: parseInt(servicio.cantidad.toString()),
                    estado: 'CODIFICADO',
                    producto: {
                      connect: {
                        productoId: productosMap[servicio.codigo]
                      }
                    }
                  }))
              },
              probetas:
                muestra.vencimiento && muestra.probetas?.length > 0
                  ? {
                    create: muestra.probetas.map((probeta: Probeta) => ({
                      numero: probeta.numero,
                      fechaConfeccion: new Date(probeta.fechaConfeccion),
                      cantidad: probeta.cantidad,
                      dias: probeta.dias,
                      fechaVencimiento: new Date(probeta.fechaVencimiento),
                      estado: 'CODIFICADO'
                    }))
                  }
                  : undefined
            }))
          }
        }
      })

      res.status(200).json(rcm)
    } catch (error) {
      console.error('Error al crear RCM:', error)
      res.status(500).json({
        error: 'Error al crear el RCM',
        message: error instanceof Error ? error.message : 'Error desconocido',
        details: error
      })
    }
  } else if (req.method === 'GET') {
    try {
      const { ordenTrabajoId } = req.query

      const whereClause = ordenTrabajoId
        ? { ordenTrabajoId: ordenTrabajoId as string }
        : {}

      const rcms = await prisma.rCM.findMany({
        where: whereClause,
        include: {
          servicios: {
            include: {
              producto: true
            }
          },
          muestras: {
            include: {
              servicios: {
                include: {
                  producto: true
                }
              },
              probetas: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      res.status(200).json(rcms)
    } catch (error) {
      console.error('Error al obtener RCMs:', error)
      res.status(500).json({ error: 'Error al obtener los RCMs' })
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' })
  }
}
