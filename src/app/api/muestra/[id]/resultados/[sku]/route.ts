import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SUPPORTED_SKUS = new Set(['1005', '1006'])

const parsePositiveNumber = (value: unknown) => {
    const parsed = Number(value)

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export async function GET(_request: NextRequest, { params }: { params: { id: string; sku: string } }) {
    const muestraId = Number(params.id)
    const sku = String(params.sku ?? '').trim()

    if (!Number.isFinite(muestraId) || !SUPPORTED_SKUS.has(sku)) {
        return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const producto = await prisma.producto.findUnique({ where: { sku }, select: { productoId: true } })

    if (!producto) return NextResponse.json({ error: 'SKU no encontrado' }, { status: 404 })

    const resultado = await prisma.resultadoEnsayoMuestra.findUnique({
        where: { muestraId_productoId: { muestraId, productoId: producto.productoId } }
    })

    return NextResponse.json(resultado)
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; sku: string } }) {
    const muestraId = Number(params.id)
    const sku = String(params.sku ?? '').trim()

    if (!Number.isFinite(muestraId) || !SUPPORTED_SKUS.has(sku)) {
        return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const body = await request.json()
    const dmcs = sku === '1005' ? parsePositiveNumber(body?.dmcs) : null
    const drMinima = sku === '1006' ? parsePositiveNumber(body?.drMinima) : null
    const drMaxima = sku === '1006' ? parsePositiveNumber(body?.drMaxima) : null

    if ((sku === '1005' && dmcs === null) || (sku === '1006' && (drMinima === null || drMaxima === null))) {
        return NextResponse.json({ error: 'Complete los resultados numéricos obligatorios' }, { status: 400 })
    }

    const muestra = await prisma.muestra.findUnique({ where: { id: muestraId }, select: { rcmId: true } })
    const producto = await prisma.producto.findUnique({ where: { sku }, select: { productoId: true } })

    if (!muestra || !producto) return NextResponse.json({ error: 'Muestra o SKU no encontrado' }, { status: 404 })

    const resultado = await prisma.$transaction(async tx => {
        const saved = await tx.resultadoEnsayoMuestra.upsert({
            where: { muestraId_productoId: { muestraId, productoId: producto.productoId } },
            create: { muestraId, productoId: producto.productoId, sku, dmcs, drMinima, drMaxima, notas: String(body?.notas ?? '').trim() || null },
            update: { dmcs, drMinima, drMaxima, notas: String(body?.notas ?? '').trim() || null }
        })

        const servicios = await tx.servicioMuestra.findMany({
            where: { muestraId, productoId: producto.productoId },
            select: { id: true, nombre: true, estado: true }
        })

        const now = new Date()

        await Promise.all(servicios.map(servicio => tx.servicioMuestraHistorial.create({
            data: {
                servicioMuestraId: servicio.id,
                registro: now,
                funcionario: String(body?.funcionario ?? 'Laboratorio'),
                ensayoServicio: servicio.nombre,
                tipo: 'Ens',
                estAnterior: servicio.estado,
                estNuevo: 'ENSAYADO',
                fechaAccion: now,
                fechaInicioEnsayo: now,
                fechaFinEnsayo: now,
                observacion: 'Resultado técnico registrado'
            }
        })))

        await tx.servicioMuestra.updateMany({ where: { muestraId, productoId: producto.productoId }, data: { estado: 'ENSAYADO' } })
        await tx.servicioRCM.updateMany({ where: { rcmId: muestra.rcmId, productoId: producto.productoId }, data: { estado: 'ENSAYADO', estadoOperativo: 'ENSAYADO' } })

        return saved
    })

    return NextResponse.json(resultado)
}
