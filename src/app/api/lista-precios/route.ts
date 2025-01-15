import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const listaPrecios = await prisma.listaPrecio.findMany({
      select: {
        id: true,
        nombre: true,
        precio: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    console.log('Listas de precios disponibles:', listaPrecios)

    return NextResponse.json(listaPrecios)
  } catch (error) {
    console.error('Error al cargar listas de precios:', error)

    return new NextResponse(JSON.stringify({ error: 'Error al cargar listas de precios' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
