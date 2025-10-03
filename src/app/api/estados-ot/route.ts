import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/estados-ot - Obtener todos los estados de OT
export async function GET() {
    try {
        const estadosOT = await prisma.estadoOT.findMany({
            orderBy: {
                id: 'asc'
            }
        })

        return NextResponse.json(estadosOT)
    } catch (error) {
        console.error('Error al obtener estados de OT:', error)
        return NextResponse.json(
            { error: 'Error al obtener los estados de orden de trabajo' },
            { status: 500 }
        )
    }
}
