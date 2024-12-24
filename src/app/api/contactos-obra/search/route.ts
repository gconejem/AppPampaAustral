import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json([])
    }

    const contactos = await prisma.contactoObra.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { cargo: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json(contactos)
  } catch (error) {
    console.error('Error en búsqueda de contactos:', error)

    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 })
  }
}
