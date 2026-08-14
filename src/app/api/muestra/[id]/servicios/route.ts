import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const muestraId = parseInt(params.id)

        if (isNaN(muestraId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        // ✅ 1. Cargar la muestra con sus campos
        const muestra = await prisma.muestra.findUnique({
            where: { id: muestraId },
            include: {
                rcm: true
            }
        })

        if (!muestra) {
            return NextResponse.json({ error: 'Muestra no encontrada' }, { status: 404 })
        }

        // ✅ 2. Cargar servicioMuestra relacionados con esta muestra (incluye último historial para obtener ensayador)
        const servicios = await prisma.servicioMuestra.findMany({
            where: {
                muestraId: muestraId
            },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            include: {
                producto: {
                    include: {
                        productosEnPaquete: {
                            include: {
                                producto: {
                                    select: { productoId: true, sku: true, nombre: true, norma: true, tipo: true }
                                }
                            }
                        }
                    }
                },
                history: {
                    orderBy: { registro: 'desc' },
                    take: 1,
                    select: { aplicadoA: true, observacion: true }
                }
            }
        })

        const servicioIds = servicios.map(s => s.id)

        const historialAsignacion = servicioIds.length
            ? await prisma.servicioMuestraHistorial.findMany({
                where: {
                    servicioMuestraId: { in: servicioIds },
                    aplicadoA: {
                        not: null
                    }
                },
                orderBy: {
                    registro: 'desc'
                },
                select: {
                    servicioMuestraId: true,
                    aplicadoA: true,
                    fechaAccion: true,
                    registro: true
                }
            })
            : []

        const ultimaAsignacionByServicio = new Map<number, { aplicadoA: string | null, fechaAsignacionEnsayador: Date | null }>()

        for (const h of historialAsignacion) {
            const hasEnsayador = typeof h.aplicadoA === 'string' && h.aplicadoA.trim().length > 0

            if (!hasEnsayador) continue
            if (ultimaAsignacionByServicio.has(h.servicioMuestraId)) continue

            ultimaAsignacionByServicio.set(h.servicioMuestraId, {
                aplicadoA: h.aplicadoA,
                fechaAsignacionEnsayador: h.fechaAccion ?? h.registro ?? null
            })
        }

        const historialMarcasEnsayo = servicioIds.length
            ? await prisma.servicioMuestraHistorial.findMany({
                where: {
                    servicioMuestraId: { in: servicioIds },
                    OR: [
                        { fechaInicioEnsayo: { not: null } },
                        { fechaFinEnsayo: { not: null } }
                    ]
                },
                orderBy: {
                    registro: 'desc'
                },
                select: {
                    servicioMuestraId: true,
                    fechaInicioEnsayo: true,
                    fechaFinEnsayo: true
                }
            })
            : []

        const marcasEnsayoByServicio = new Map<number, { fechaInicioEnsayo: Date | null, fechaFinEnsayo: Date | null }>()

        for (const h of historialMarcasEnsayo) {
            const current = marcasEnsayoByServicio.get(h.servicioMuestraId) ?? { fechaInicioEnsayo: null, fechaFinEnsayo: null }

            if (!current.fechaInicioEnsayo && h.fechaInicioEnsayo) current.fechaInicioEnsayo = h.fechaInicioEnsayo
            if (!current.fechaFinEnsayo && h.fechaFinEnsayo) current.fechaFinEnsayo = h.fechaFinEnsayo

            marcasEnsayoByServicio.set(h.servicioMuestraId, current)
        }

        // ✅ 3. Mapear servicios - SKU como código + ensayador desde historial (aplicadoA)
        const serviciosEnriquecidos = servicios.map(s => ({
            ...(ultimaAsignacionByServicio.get(s.id) ?? {}),
            id: s.id,
            productoId: s.productoId ?? null,
            codigo: s.producto?.sku ?? (s.producto as any)?.SKU ?? (s.producto as any)?.codigo ?? s.productoId?.toString() ?? s.id.toString(),
            nombre: s.producto?.nombre ?? 'Sin nombre',
            tipo: s.producto?.tipo ?? (s.producto?.familia?.includes('Ensayo') ? 'Ensayo' : 'Análisis'),
            cantidad: s.cantidad ?? 1,
            estado: s.estado ?? 'CODIFICADO',
            ensayador: (ultimaAsignacionByServicio.get(s.id)?.aplicadoA ?? s.history?.[0]?.aplicadoA) ?? null,
            fechaAsignacionEnsayador: ultimaAsignacionByServicio.get(s.id)?.fechaAsignacionEnsayador ?? null,
            fechaInicioEnsayo: marcasEnsayoByServicio.get(s.id)?.fechaInicioEnsayo ?? null,
            fechaFinEnsayo: marcasEnsayoByServicio.get(s.id)?.fechaFinEnsayo ?? null,
            observacion: s.history?.[0]?.observacion ?? null,
            area: s.producto?.area,
            familia: s.producto?.familia,
            esPaquete: s.producto?.esPaquete ?? false,
            productosEnPaquete: (s.producto?.productosEnPaquete ?? []).map((pp: any) => ({
                cantidad: pp.cantidad ?? 1,
                sku: pp.producto?.sku ?? null,
                nombre: pp.producto?.nombre ?? null,
                norma: pp.producto?.norma ?? null,
                tipo: pp.producto?.tipo ?? null,
                id: pp.producto?.productoId ?? null,
            }))
        }))

        // ✅ 4. Retornar muestra + servicios (observaciones incluido)
        return NextResponse.json({
            muestra: {
                id: muestra.id,
                numeroMuestra: muestra.numeroMuestra,
                numeroTarjeta: muestra.numeroTarjeta,
                tipoMaterial: muestra.tipoMaterial,
                elemento: muestra.elemento,
                item: muestra.item,
                grado: muestra.grado,
                procedencia: muestra.procedencia,
                cotas: muestra.cotas,
                ubicacionSector: muestra.ubicacionSector,
                observaciones: muestra.observaciones ?? muestra.observacion ?? '' // ✅ agregar fallback a 'observacion' (sin 'es')
            },
            servicios: serviciosEnriquecidos
        })
    } catch (error) {
        console.error('Error fetching servicios:', error)
        return NextResponse.json({
            error: 'Error al cargar servicios',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
