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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre } = body

    const listaPrecio = await prisma.listaPrecio.create({
      data: {
        nombre
      }
    })

    return NextResponse.json(listaPrecio)
  } catch (error) {
    console.error('Error:', error)

    return NextResponse.json({ error: 'Error al crear lista de precios' }, { status: 500 })
  }
}
