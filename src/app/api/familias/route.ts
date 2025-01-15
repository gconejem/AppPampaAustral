import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener familias únicas de productos
    const familias = await prisma.producto.findMany({
      distinct: ['familia'],
      select: {
        familia: true
      }
    })

    // Formatear la respuesta
    const formattedFamilias = familias.map((item, index) => ({
      id: index + 1,
      nombre: item.familia
    }))

    return NextResponse.json(formattedFamilias)
  } catch (error) {
    console.error('Error al obtener familias:', error)

    return NextResponse.json({ error: 'Error al obtener familias' }, { status: 500 })
  }
}
