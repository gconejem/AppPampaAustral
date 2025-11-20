import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/lib/prisma'

interface Servicio {
    codigo: string
    nombre: string
    cantidad: string | number
    productoId?: number
    estado?: string
}

interface Probeta {
    numero: number
    fechaConfeccion: string
    cantidad: number
    dias: number
    fechaVencimiento: string
    estado?: string
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
    const { id } = req.query

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID inválido' })
    }

    const rcmId = parseInt(id)

    if (isNaN(rcmId)) {
        return res.status(400).json({ error: 'ID debe ser un número' })
    }

    if (req.method === 'GET') {
        try {
            const rcm = await prisma.rCM.findUnique({
                where: {
                    id: rcmId
                },
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
                    },
                    cliente: true,
                    obra: true,
                    ordenTrabajo: true
                }
            })

            if (!rcm) {
                return res.status(404).json({ error: 'RCM no encontrado' })
            }

            res.status(200).json(rcm)
        } catch (error) {
            console.error('Error al obtener RCM:', error)
            res.status(500).json({ error: 'Error al obtener el RCM' })
        }
    } else if (req.method === 'PUT') {
        try {
            const { fechaCodificacion, fechaMuestreo, fechaIngreso, fechaEntrega, servicios, muestras, observaciones } = req.body

            // Obtener el RCM actual
            const rcmActual = await prisma.rCM.findUnique({
                where: { id: rcmId },
                include: {
                    servicios: true,
                    muestras: {
                        include: {
                            servicios: true,
                            probetas: true
                        }
                    }
                }
            })

            if (!rcmActual) {
                return res.status(404).json({ error: 'RCM no encontrado' })
            }

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

            // Eliminar servicios y muestras existentes
            await prisma.servicioRCM.deleteMany({
                where: { rcmId }
            })

            await prisma.probeta.deleteMany({
                where: {
                    muestra: {
                        rcmId
                    }
                }
            })

            await prisma.servicioMuestra.deleteMany({
                where: {
                    muestra: {
                        rcmId
                    }
                }
            })

            await prisma.muestra.deleteMany({
                where: { rcmId }
            })

            // Actualizar el RCM
            const rcmActualizado = await prisma.rCM.update({
                where: { id: rcmId },
                data: {
                    fechaCodificacion: new Date(fechaCodificacion),
                    fechaMuestreo: new Date(fechaMuestreo),
                    fechaIngreso: new Date(fechaIngreso),
                    fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
                    observaciones,
                    servicios: {
                        create: servicios
                            .filter((servicio: Servicio) => productosMap[servicio.codigo])
                            .map((servicio: Servicio) => ({
                                codigo: servicio.codigo,
                                nombre: servicio.nombre,
                                cantidad: parseInt(servicio.cantidad.toString()),
                                estado: servicio.estado || 'CODIFICADO',
                                producto: {
                                    connect: {
                                        productoId: productosMap[servicio.codigo]
                                    }
                                }
                            }))
                    },
                    muestras: {
                        create: muestras.map((muestra: Muestra, index: number) => ({
                            numeroMuestra: muestra.numeroMuestra || `${rcmActual.numeroRcm}-${(index + 1).toString().padStart(2, '0')}`,
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
                                    .filter(servicio => productosMap[servicio.codigo])
                                    .map(servicio => ({
                                        codigo: servicio.codigo,
                                        nombre: servicio.nombre,
                                        cantidad: parseInt(servicio.cantidad.toString()),
                                        estado: servicio.estado || 'CODIFICADO',
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
                                            estado: probeta.estado || 'CODIFICADO'
                                        }))
                                    }
                                    : undefined
                        }))
                    }
                },
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
                }
            })

            res.status(200).json(rcmActualizado)
        } catch (error) {
            console.error('Error al actualizar RCM:', error)
            res.status(500).json({
                error: 'Error al actualizar el RCM',
                message: error instanceof Error ? error.message : 'Error desconocido',
                details: error
            })
        }
    } else if (req.method === 'DELETE') {
        try {
            // Eliminar probetas primero
            await prisma.probeta.deleteMany({
                where: {
                    muestra: {
                        rcmId
                    }
                }
            })

            // Eliminar servicios de muestras
            await prisma.servicioMuestra.deleteMany({
                where: {
                    muestra: {
                        rcmId
                    }
                }
            })

            // Eliminar muestras
            await prisma.muestra.deleteMany({
                where: { rcmId }
            })

            // Eliminar servicios del RCM
            await prisma.servicioRCM.deleteMany({
                where: { rcmId }
            })

            // Eliminar el RCM
            await prisma.rCM.delete({
                where: { id: rcmId }
            })

            res.status(200).json({ message: 'RCM eliminado exitosamente' })
        } catch (error) {
            console.error('Error al eliminar RCM:', error)
            res.status(500).json({ error: 'Error al eliminar el RCM' })
        }
    } else {
        res.status(405).json({ error: 'Método no permitido' })
    }
}
