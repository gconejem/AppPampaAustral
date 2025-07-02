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
  tipoMaterial: string
  elemento: string
  item: string
  grado: string
  procedencia: string
  cotas: string
  ubicacionSector: string
  vencimiento: boolean
  observaciones: string
  servicios: Servicio[]
  probetas: Probeta[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { fechaCodificacion, fechaMuestreo, fechaIngreso, servicios, muestras, observaciones } = req.body

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

      // Generar número de RCM único
      const ultimoRCM = await prisma.rCM.findFirst({
        orderBy: {
          numeroRcm: 'desc'
        }
      })

      const numeroBase = ultimoRCM ? parseInt(ultimoRCM.numeroRcm.split('-')[0]) : 0
      const nuevoNumero = (numeroBase + 1).toString().padStart(6, '0')
      const numeroRcm = `${nuevoNumero}-${new Date().getFullYear()}`

      // Crear el RCM
      const rcm = await prisma.rCM.create({
        data: {
          numeroRcm,
          fechaCodificacion: new Date(fechaCodificacion),
          fechaMuestreo: new Date(fechaMuestreo),
          fechaIngreso: new Date(fechaIngreso),
          observaciones,
          servicios: {
            create: servicios.map((servicio: Servicio) => ({
              codigo: servicio.codigo,
              nombre: servicio.nombre,
              cantidad: parseInt(servicio.cantidad.toString()),
              estado: 'CODIFICADO',
              ...(productosMap[servicio.codigo] && {
                producto: {
                  connect: {
                    productoId: productosMap[servicio.codigo]
                  }
                }
              })
            }))
          },
          muestras: {
            create: muestras.map((muestra: Muestra, index: number) => ({
              numeroMuestra: muestra.numeroMuestra || `${nuevoNumero}-${(index + 1).toString().padStart(2, '0')}`,
              tipoMaterial: muestra.tipoMaterial,
              elemento: muestra.elemento,
              item: muestra.item,
              grado: muestra.grado,
              procedencia: muestra.procedencia,
              cotas: muestra.cotas,
              ubicacionSector: muestra.ubicacionSector,
              vencimiento: muestra.vencimiento,
              observaciones: muestra.observaciones,
              servicios: {
                create: muestra.servicios.map(servicio => ({
                  codigo: servicio.codigo,
                  nombre: servicio.nombre,
                  cantidad: parseInt(servicio.cantidad.toString()),
                  estado: 'CODIFICADO',
                  ...(productosMap[servicio.codigo] && {
                    producto: {
                      connect: {
                        productoId: productosMap[servicio.codigo]
                      }
                    }
                  })
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
      const rcms = await prisma.rCM.findMany({
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
