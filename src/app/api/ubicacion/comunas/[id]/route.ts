import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Asegurarnos de que params.id esté disponible
    const id = await params.id

    const region = await prisma.region.findFirst({
      where: {
        OR: [
          { codigo: id },
          { nombre: { contains: id, mode: 'insensitive' } }
        ]
      }
    })

    if (!region) {
      return NextResponse.json({ error: 'Región no encontrada' }, { status: 404 })
    }

    const comunas = await prisma.comuna.findMany({
      where: {
        regionId: region.id
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(comunas)
  } catch (error) {
    console.error('Error al obtener comunas:', error)
    return NextResponse.json({ error: 'Error al obtener las comunas' }, { status: 500 })
  }
}
