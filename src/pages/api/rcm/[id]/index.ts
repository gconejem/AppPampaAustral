import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SubProducto {
    productoId: number
    sku: string
    nombre: string
    norma?: string
    cantidad: number
    observacion?: string
}

interface Ensayo {
    productoId: number
    sku: string
    nombre: string
    norma?: string
    cantidad: number
    observacion?: string
    estadoOperativo?: string
    esPaquete?: boolean
    subProductos?: SubProducto[]
}

interface SubMuestraVenc {
    numero: number
    dias: number
    fechaVencimiento: string
    cantidad: number
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
            let rcm: any = null

            try {
                rcm = await prisma.rCM.findUnique({
                    where: { id: rcmId },
                    include: {
                        servicios: {
                            include: {
                                subProductos: true,
                                producto: {
                                    include: {
                                        productosEnPaquete: {
                                            include: {
                                                producto: {
                                                    select: {
                                                        productoId: true,
                                                        sku: true,
                                                        nombre: true,
                                                        norma: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        muestras: {
                            include: {
                                servicios: { include: { producto: true } },
                                probetas: true,
                            },
                        },
                        cliente: true,
                        obra: true,
                        ordenTrabajo: {
                            include: {
                                agenda: {
                                    include: {
                                        cliente: true,
                                        obra: true,
                                    },
                                },
                            },
                        },
                        area: true,
                        familia: true,
                        codigoAgrupador: true,
                    },
                })
            } catch (e) {
                console.warn('GET /api/rcm/[id]: full include failed, using fallback include', e)

                // Fallback defensivo para entornos con drift parcial de esquema/datos.
                rcm = await prisma.rCM.findUnique({
                    where: { id: rcmId },
                    include: {
                        servicios: {
                            include: {
                                producto: true,
                            }
                        },
                        muestras: {
                            include: {
                                servicios: { include: { producto: true } },
                                probetas: true,
                            },
                        },
                        cliente: true,
                        obra: true,
                        ordenTrabajo: {
                            include: {
                                agenda: {
                                    include: {
                                        cliente: true,
                                        obra: true,
                                    },
                                },
                            },
                        },
                        area: true,
                        familia: true,
                        codigoAgrupador: true,
                    },
                })
            }

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
            const {
                rcmType,
                sede,
                areaId,
                familiaId,
                fechaCodificacion,
                fechaServicio,
                fechaMuestreo,
                fechaIngreso,
                fechaEntrega,
                observaciones,
                observacionItem,
                informeEnsayo,
                codigoAgrupadorId,
                numeroTarjeta,
                tipoMaterial,
                item,
                procedencia,
                ubicacionSector,
                grado,
                elemento,
                cantidadMuestras,
                vencimiento,
                fechaConfeccion,
                tomaMuestra,
                codigoProducto,
                cota1,
                cota2,
                ensayos = [],
                submuestrasVencimiento = [],
                estadoOperativo,
            } = req.body

            const rcmActual = await prisma.rCM.findUnique({
                where: { id: rcmId },
                select: { id: true, numeroRcm: true },
            })

            if (!rcmActual) {
                return res.status(404).json({ error: 'RCM no encontrado' })
            }

            // Resolver productoIds
            const skus = [
                ...ensayos.map((e: Ensayo) => e.sku),
                ...ensayos.flatMap((e: Ensayo) => (e.subProductos ?? []).map((s: SubProducto) => s.sku)),
            ]

            const productos = await prisma.producto.findMany({
                where: { sku: { in: skus } },
                select: { productoId: true, sku: true },
            })

            const productosMap: Record<string, number> = {}
            for (const p of productos) productosMap[p.sku] = p.productoId

            // Cascading delete: subProductos → serviciosRCM → probetas → serviciosMuestra → muestras
            await prisma.subProductoServicioRCM.deleteMany({
                where: { servicioRcm: { rcmId } },
            })
            await prisma.servicioRCM.deleteMany({ where: { rcmId } })
            await prisma.probeta.deleteMany({ where: { muestra: { rcmId } } })
            await prisma.servicioMuestra.deleteMany({ where: { muestra: { rcmId } } })
            await prisma.muestra.deleteMany({ where: { rcmId } })

            const estadoInicial = rcmType === 'Control' ? 'ENSAYADO' : rcmType === 'Servicio' ? 'EJECUTADO' : estadoOperativo ?? 'CODIFICADO'

            const rcmActualizado = await prisma.rCM.update({
                where: { id: rcmId },
                data: {
                    rcmType: rcmType ?? undefined,
                    sede: sede ?? null,
                    areaId: areaId ?? null,
                    familiaId: familiaId ?? null,
                    fechaCodificacion: new Date(fechaCodificacion),
                    fechaServicio: fechaServicio ? new Date(fechaServicio) : null,
                    fechaMuestreo: new Date(fechaMuestreo ?? fechaServicio ?? fechaCodificacion),
                    fechaIngreso: new Date(fechaIngreso),
                    fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
                    observaciones: observaciones ?? null,
                    observacionItem: observacionItem ?? null,
                    informeEnsayo: informeEnsayo ?? true,
                    codigoAgrupadorId: codigoAgrupadorId ?? null,
                    numeroTarjeta: numeroTarjeta ?? null,
                    tipoMaterial: tipoMaterial ?? null,
                    item: item ?? null,
                    procedencia: procedencia ?? null,
                    ubicacionSector: ubicacionSector ?? null,
                    grado: grado ?? null,
                    elemento: elemento ?? null,
                    cantidadMuestras: cantidadMuestras ? parseInt(cantidadMuestras.toString()) : null,
                    vencimiento: vencimiento ?? false,
                    fechaConfeccion: fechaConfeccion ? new Date(fechaConfeccion) : null,
                    tomaMuestra: tomaMuestra ?? null,
                    codigoProducto: codigoProducto ?? null,
                    cota1: cota1 ?? null,
                    cota2: cota2 ?? null,
                    estadoOperativo: estadoInicial,
                    servicios: {
                        create: ensayos
                            .filter((e: Ensayo) => productosMap[e.sku] !== undefined)
                            .map((e: Ensayo) => ({
                                codigo: e.sku,
                                nombre: e.nombre,
                                cantidad: e.cantidad,
                                estado: e.estadoOperativo ?? estadoInicial,
                                norma: e.norma ?? null,
                                observacion: e.observacion ?? null,
                                estadoOperativo: e.estadoOperativo ?? estadoInicial,
                                esPaquete: e.esPaquete ?? false,
                                producto: { connect: { productoId: productosMap[e.sku] } },
                                subProductos: e.esPaquete && (e.subProductos?.length ?? 0) > 0
                                    ? {
                                        create: (e.subProductos ?? [])
                                            .filter((s: SubProducto) => productosMap[s.sku] !== undefined)
                                            .map((s: SubProducto) => ({
                                                sku: s.sku,
                                                nombre: s.nombre,
                                                norma: s.norma ?? null,
                                                cantidad: s.cantidad,
                                                observacion: s.observacion ?? null,
                                                producto: { connect: { productoId: productosMap[s.sku] } },
                                            })),
                                    }
                                    : undefined,
                            })),
                    },
                    muestras: {
                        create: [
                            {
                                numeroMuestra: `${rcmActual.numeroRcm}-01`,
                                numeroTarjeta: numeroTarjeta ?? null,
                                tipoMaterial: tipoMaterial ?? null,
                                elemento: elemento ?? null,
                                item: item ?? null,
                                grado: grado ?? null,
                                procedencia: procedencia ?? null,
                                cotas: cota1 && cota2 ? `${cota1} - ${cota2}` : cota1 ?? cota2 ?? null,
                                ubicacionSector: ubicacionSector ?? null,
                                vencimiento: vencimiento ?? false,
                                observaciones: observaciones ?? null,
                                cantidadMuestras: cantidadMuestras ? parseInt(cantidadMuestras.toString()) : null,
                                estadoMuestra: estadoInicial,
                                servicios: {
                                    create: ensayos
                                        .filter((e: Ensayo) => productosMap[e.sku] !== undefined)
                                        .map((e: Ensayo) => ({
                                            codigo: e.sku,
                                            nombre: e.nombre,
                                            cantidad: e.cantidad,
                                            estado: e.estadoOperativo ?? estadoInicial,
                                            producto: { connect: { productoId: productosMap[e.sku] } },
                                        })),
                                },
                                probetas: vencimiento && submuestrasVencimiento.length > 0
                                    ? {
                                        create: submuestrasVencimiento.map((s: SubMuestraVenc, idx: number) => ({
                                            numero: s.numero ?? idx + 1,
                                            fechaConfeccion: fechaConfeccion ? new Date(fechaConfeccion) : new Date(fechaCodificacion),
                                            cantidad: s.cantidad,
                                            dias: s.dias,
                                            fechaVencimiento: new Date(s.fechaVencimiento),
                                            estado: 'CODIFICADO',
                                        })),
                                    }
                                    : undefined,
                            },
                        ],
                    },
                },
                include: {
                    servicios: { include: { subProductos: true, producto: true } },
                    muestras: { include: { servicios: true, probetas: true } },
                    area: true,
                    familia: true,
                },
            })

            res.status(200).json(rcmActualizado)
        } catch (error) {
            console.error('Error al actualizar RCM:', error)
            res.status(500).json({
                error: 'Error al actualizar el RCM',
                message: error instanceof Error ? error.message : 'Error desconocido',
            })
        }
    } else if (req.method === 'DELETE') {
        try {
            await prisma.subProductoServicioRCM.deleteMany({ where: { servicioRcm: { rcmId } } })
            await prisma.servicioRCM.deleteMany({ where: { rcmId } })
            await prisma.probeta.deleteMany({ where: { muestra: { rcmId } } })
            await prisma.servicioMuestra.deleteMany({ where: { muestra: { rcmId } } })
            await prisma.muestra.deleteMany({ where: { rcmId } })
            await prisma.rCM.delete({ where: { id: rcmId } })

            res.status(200).json({ message: 'RCM eliminado exitosamente' })
        } catch (error) {
            console.error('Error al eliminar RCM:', error)
            res.status(500).json({ error: 'Error al eliminar el RCM' })
        }
    } else {
        res.status(405).json({ error: 'Método no permitido' })
    }
}

