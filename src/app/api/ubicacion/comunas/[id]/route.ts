import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Primero obtener el ID de la región basado en el código o nombre
    const region = await prisma.region.findFirst({
      where: {
        OR: [{ codigo: params.id }, { nombre: { contains: params.id, mode: 'insensitive' } }]
      }
    })

    if (!region) {
      return NextResponse.json({ error: 'Región no encontrada' }, { status: 404 })
    }

    // Luego obtener las comunas de esa región
    const comunas = await prisma.comuna.findMany({
      where: {
        regionId: region.id
      },
      select: {
        id: true,
        nombre: true,
        codigo: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(comunas)
  } catch (error) {
    console.error('Error al obtener comunas:', error)

    return NextResponse.json({ error: 'Error al obtener comunas' }, { status: 500 })
  }
}
