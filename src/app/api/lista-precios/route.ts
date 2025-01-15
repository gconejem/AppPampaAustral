import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const listaPrecios = await prisma.listaPrecio.findMany({
      select: {
        id: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(listaPrecios)
  } catch (error) {
    console.error('Error al obtener listas de precios:', error)

    return NextResponse.json({ error: 'Error al obtener listas de precios' }, { status: 500 })
  }
}
