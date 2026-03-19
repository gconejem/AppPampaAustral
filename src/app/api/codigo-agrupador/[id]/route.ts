import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
    const { id } = await params
    const agrupadorId = parseInt(id)
    if (isNaN(agrupadorId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const agrupador = await prisma.codigoAgrupador.findUnique({
        where: { id: agrupadorId },
        include: {
            ensayos: { include: { producto: true } },
            rcms: { select: { id: true, numeroRcm: true, rcmType: true, numeroTarjeta: true, estadoOperativo: true } },
        },
    })

    if (!agrupador) return NextResponse.json({ error: 'Agrupador no encontrado' }, { status: 404 })
    return NextResponse.json(agrupador)
}

export async function PUT(request: Request, { params }: Params) {
    const { id } = await params
    const agrupadorId = parseInt(id)
    if (isNaN(agrupadorId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    try {
        const body = await request.json()
        const { codigoNombre, descripcionServicio, cantidad, unidad, facturacion, ensayos, rcmIds } = body

        // Recreate ensayos if provided
        if (ensayos !== undefined) {
            await prisma.codigoAgrupadorEnsayo.deleteMany({ where: { codigoAgrupadorId: agrupadorId } })
        }

        const skus: string[] = (ensayos ?? []).map((e: { sku: string }) => e.sku)
        const productosMap: Record<string, number> = {}
        if (skus.length > 0) {
            const productos = await prisma.producto.findMany({
                where: { sku: { in: skus } },
                select: { productoId: true, sku: true },
            })
            for (const p of productos) productosMap[p.sku] = p.productoId
        }

        const agrupador = await prisma.codigoAgrupador.update({
            where: { id: agrupadorId },
            data: {
                ...(codigoNombre !== undefined && { codigoNombre }),
                ...(descripcionServicio !== undefined && { descripcionServicio }),
                ...(cantidad !== undefined && { cantidad }),
                ...(unidad !== undefined && { unidad }),
                ...(facturacion !== undefined && { facturacion }),
                ...(ensayos !== undefined && {
                    ensayos: {
                        create: ensayos
                            .filter((e: { sku: string }) => productosMap[e.sku] !== undefined)
                            .map((e: { sku: string; nombre: string }) => ({
                                sku: e.sku,
                                nombre: e.nombre,
                                producto: { connect: { productoId: productosMap[e.sku] } },
                            })),
                    },
                }),
                ...(rcmIds !== undefined && {
                    rcms: { set: (rcmIds as number[]).map(id => ({ id })) },
                }),
            },
            include: {
                ensayos: { include: { producto: true } },
                rcms: { select: { id: true, numeroRcm: true, rcmType: true, numeroTarjeta: true } },
            },
        })

        return NextResponse.json(agrupador)
    } catch (error) {
        console.error('Error al actualizar agrupador:', error)
        return NextResponse.json(
            { error: 'Error al actualizar el agrupador', message: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        )
    }
}

export async function DELETE(_request: Request, { params }: Params) {
    const { id } = await params
    const agrupadorId = parseInt(id)
    if (isNaN(agrupadorId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    try {
        // Desvincular RCMs antes de eliminar
        await prisma.rCM.updateMany({
            where: { codigoAgrupadorId: agrupadorId },
            data: { codigoAgrupadorId: null },
        })
        await prisma.codigoAgrupadorEnsayo.deleteMany({ where: { codigoAgrupadorId: agrupadorId } })
        await prisma.codigoAgrupador.delete({ where: { id: agrupadorId } })

        return NextResponse.json({ message: 'Agrupador eliminado' })
    } catch (error) {
        console.error('Error al eliminar agrupador:', error)
        return NextResponse.json({ error: 'Error al eliminar el agrupador' }, { status: 500 })
    }
}
