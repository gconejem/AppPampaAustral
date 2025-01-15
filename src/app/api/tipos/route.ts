import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener tipos únicos de productos
    const tipos = await prisma.producto.findMany({
      distinct: ['tipo'],
      select: {
        tipo: true
      }
    })

    // Formatear la respuesta
    const formattedTipos = tipos.map((item, index) => ({
      id: index + 1,
      nombre: item.tipo
    }))

    return NextResponse.json(formattedTipos)
  } catch (error) {
    console.error('Error al obtener tipos:', error)

    return NextResponse.json({ error: 'Error al obtener tipos' }, { status: 500 })
  }
}
