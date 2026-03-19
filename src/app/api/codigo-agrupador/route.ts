import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const ordenTrabajoId = searchParams.get('ordenTrabajoId')

        const where = ordenTrabajoId ? { ordenTrabajoId } : {}

        const agrupadores = await prisma.codigoAgrupador.findMany({
            where,
            include: {
                ensayos: { include: { producto: true } },
                rcms: { select: { id: true, numeroRcm: true, rcmType: true, numeroTarjeta: true } },
            },
            orderBy: { createdAt: 'asc' },
        })

        return NextResponse.json(agrupadores)
    } catch (error) {
        console.error('Error al obtener agrupadores:', error)
        return NextResponse.json({ error: 'Error al obtener los agrupadores' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { descripcionServicio, cantidad, unidad, facturacion, ordenTrabajoId, ensayos = [], rcmIds = [] } = body

        // Crear el CodigoAgrupador atómicamente con número PRD único
        const agrupador = await prisma.$transaction(async (tx) => {
            // Buscar el máximo número PRD existente
            const todos = await tx.codigoAgrupador.findMany({
                select: { codigoNombre: true },
            })

            let maxNum = 0
            for (const record of todos) {
                const match = record.codigoNombre.match(/^PRD-(\d+)$/)
                if (match) {
                    const num = parseInt(match[1], 10)
                    if (num > maxNum) maxNum = num
                }
            }

            const proximoNumero = maxNum + 1
            const codigoNombre = `PRD-${String(proximoNumero).padStart(3, '0')}`
            const codigoId = `${codigoNombre}-${Date.now()}`

            // Resolver productoIds para los ensayos
            const skus: string[] = ensayos.map((e: { sku: string }) => e.sku).filter(Boolean)
            const productosMap: Record<string, number> = {}
            if (skus.length > 0) {
                const productos = await tx.producto.findMany({
                    where: { sku: { in: skus } },
                    select: { productoId: true, sku: true },
                })
                for (const p of productos) productosMap[p.sku] = p.productoId
            }

            const created = await tx.codigoAgrupador.create({
                data: {
                    codigoId,
                    codigoNombre,
                    descripcionServicio: descripcionServicio ?? null,
                    cantidad: cantidad ?? 1,
                    unidad: unidad ?? 'unid',
                    facturacion: facturacion ?? 'Unitario',
                    ordenTrabajoId: ordenTrabajoId ?? null,
                    ensayos: {
                        create: ensayos
                            .filter((e: { sku: string }) => productosMap[e.sku] !== undefined)
                            .map((e: { sku: string; nombre: string }) => ({
                                sku: e.sku,
                                nombre: e.nombre,
                                producto: { connect: { productoId: productosMap[e.sku] } },
                            })),
                    },
                    rcms: rcmIds.length > 0
                        ? { connect: (rcmIds as number[]).map(id => ({ id })) }
                        : undefined,
                },
                include: {
                    ensayos: { include: { producto: true } },
                    rcms: { select: { id: true, numeroRcm: true, rcmType: true, numeroTarjeta: true } },
                },
            })

            return created
        })

        return NextResponse.json(agrupador, { status: 201 })
    } catch (error) {
        console.error('Error al crear agrupador:', error)
        return NextResponse.json(
            { error: 'Error al crear el agrupador', message: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        )
    }
}
