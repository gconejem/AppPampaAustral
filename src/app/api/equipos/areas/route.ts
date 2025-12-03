import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        const areas = await prisma.area.findMany({
            orderBy: {
                nombre: 'asc'
            },
            select: {
                id: true,
                nombre: true
            }
        })

        return NextResponse.json(areas)
    } catch (error) {
        console.error('Error al obtener áreas:', error)
        return NextResponse.json({ error: 'Error al obtener las áreas' }, { status: 500 })
    }
}
