import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const areaId = searchParams.get('areaId')

    const familias = await prisma.familia.findMany({
      where: areaId ? {
        areaId: parseInt(areaId)
      } : undefined,
      select: {
        id: true,
        nombre: true,
        area: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(familias)
  } catch (error) {
    console.error('Error al obtener familias:', error)
    return NextResponse.json({ error: 'Error al obtener familias' }, { status: 500 })
  }
}
