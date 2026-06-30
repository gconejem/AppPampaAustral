import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const probetaId = Number(params.id)

        if (!Number.isFinite(probetaId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const body = await request.json()
        const estado = String(body?.estado ?? '').trim().toUpperCase()

        if (!estado) {
            return NextResponse.json({ error: 'Estado requerido' }, { status: 400 })
        }

        const probeta = await prisma.probeta.update({
            where: { id: probetaId },
            data: { estado },
            select: {
                id: true,
                estado: true,
                updatedAt: true
            }
        })

        return NextResponse.json(probeta)
    } catch (error) {
        console.error('Error actualizando probeta:', error)

        return NextResponse.json(
            {
                error: 'Error al actualizar probeta',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}
