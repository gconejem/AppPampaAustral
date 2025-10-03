import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/tipos-orden-trabajo - Obtener todos los tipos de orden de trabajo
export async function GET() {
    try {
        const tiposOrdenTrabajo = await prisma.tipoOrdenTrabajo.findMany({
            orderBy: {
                id: 'asc'
            }
        })

        return NextResponse.json(tiposOrdenTrabajo)
    } catch (error) {
        console.error('Error al obtener tipos de orden de trabajo:', error)
        return NextResponse.json(
            { error: 'Error al obtener los tipos de orden de trabajo' },
            { status: 500 }
        )
    }
}
