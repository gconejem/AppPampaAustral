import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener áreas únicas de productos
    const areas = await prisma.producto.findMany({
      distinct: ['area'],
      select: {
        area: true
      }
    })

    // Formatear la respuesta
    const formattedAreas = areas.map((item, index) => ({
      id: index + 1,
      nombre: item.area
    }))

    return NextResponse.json(formattedAreas)
  } catch (error) {
    console.error('Error al obtener áreas:', error)

    return NextResponse.json({ error: 'Error al obtener áreas' }, { status: 500 })
  }
}
