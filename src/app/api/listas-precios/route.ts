import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

// GET - Obtener todas las listas de precios
export async function GET() {
  try {
    const listaPrecios = await prisma.listaPrecio.findMany({
      include: {
        precios: true
      }
    })

    return NextResponse.json(listaPrecios)
  } catch (error) {
    console.error('Error al obtener listas de precios:', error)

    return NextResponse.json({ error: 'Error al obtener listas de precios' }, { status: 500 })
  }
}

// POST - Crear una nueva lista de precios
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre } = body

    const listaPrecio = await prisma.listaPrecio.create({
      data: {
        nombre
      }
    })

    return NextResponse.json(listaPrecio, { status: 201 })
  } catch (error) {
    console.error('Error al crear lista de precios:', error)

    return NextResponse.json({ error: 'Error al crear lista de precios' }, { status: 500 })
  }
}
