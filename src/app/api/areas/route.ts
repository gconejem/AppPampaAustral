import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const areas = await prisma.area.findMany({
      select: {
        id: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(areas)
  } catch (error) {
    console.error('Error al obtener áreas:', error)
    return NextResponse.json({ error: 'Error al obtener áreas' }, { status: 500 })
  }
}
