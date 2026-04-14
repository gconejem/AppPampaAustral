import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        const parametros = await prisma.parametroArea.findMany({
            select: {
                id: true,
                areaId: true,
                tipo: true,
                descripcion: true,
            },
            orderBy: { id: 'asc' },
        })

        return NextResponse.json(parametros)
    } catch (error) {
        console.error('Error al obtener parámetros de área:', error)
        return NextResponse.json({ error: 'Error al obtener parámetros' }, { status: 500 })
    }
}
