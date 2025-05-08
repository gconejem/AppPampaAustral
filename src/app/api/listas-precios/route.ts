import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const listaPrecio = await prisma.listaPrecio.create({
      data: {
        nombre: body.nombre,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(listaPrecio)
  } catch (error) {
    console.error('Error al crear lista de precios:', error)

    return NextResponse.json({ error: 'Error al crear la lista de precios' }, { status: 500 })
  }
}

// Función auxiliar para inicializar las listas de precios
async function initializeListasPrecios() {
  const listasBase = [
    { id: 1, nombre: 'Lista Base' },
    { id: 2, nombre: 'Lista Preferencial' },
    { id: 3, nombre: 'Lista Premium' }
  ]

  for (const lista of listasBase) {
    const existingLista = await prisma.listaPrecio.findFirst({
      where: { id: lista.id }
    })

    if (!existingLista) {
      await prisma.listaPrecio.create({
        data: {
          id: lista.id,
          nombre: lista.nombre,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }
  }
}

export async function GET() {
  try {
    const listasPrecios = await prisma.listaPrecio.findMany({
      where: {
        // Solo listas activas si hay un campo de estado
      },
      select: {
        id: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(listasPrecios)
  } catch (error) {
    console.error('Error al obtener listas de precios:', error)

    return NextResponse.json({ error: 'Error al obtener las listas de precios' }, { status: 500 })
  }
}
