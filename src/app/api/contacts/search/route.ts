import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const contacts = await prisma.contacto.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { telefono1: { contains: query } }
        ]
      },
      select: {
        contactId: true,
        nombre: true,
        cargo: true,
        email: true,
        telefono1: true,
        telefono2: true
      },
      take: 10
    })

    console.log('Contactos encontrados:', contacts.length)

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error buscando contactos:', error)

    return NextResponse.json({ error: 'Error al buscar contactos' }, { status: 500 })
  }
}
