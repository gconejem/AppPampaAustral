import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    console.log('Listas de precios encontradas:', listaPrecios)

    return NextResponse.json(listaPrecios || [])
  } catch (error) {
    console.error('Error al obtener listas de precios:', error)

    return NextResponse.json({ error: 'Error al obtener listas de precios' }, { status: 500 })
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
