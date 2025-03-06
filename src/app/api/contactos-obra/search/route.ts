import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json([])
    }

    const contactos = await prisma.contacto.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { telefono1: { contains: query } }
        ]
      },
      take: 10
    })

    return NextResponse.json(contactos)
  } catch (error) {
    console.error('Error buscando contactos:', error)

    return NextResponse.json({ error: 'Error al buscar contactos' }, { status: 500 })
  }
}
