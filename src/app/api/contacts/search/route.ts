import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    const textFilter =
      query.length >= 2
        ? {
          OR: [
            { nombre: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
            { telefono1: { contains: query } },
            { cargo: { contains: query, mode: 'insensitive' as const } },
            { empresa: { contains: query, mode: 'insensitive' as const } }
          ]
        }
        : {}

    const where = { estado: 'ACTIVO', ...textFilter }

    const [contacts, total] = await prisma.$transaction([
      prisma.contacto.findMany({
        where,
        select: {
          contactId: true,
          nombre: true,
          cargo: true,
          email: true,
          telefono1: true,
          telefono2: true,
          empresa: true
        },
        orderBy: { nombre: 'asc' },
        skip,
        take: limit
      }),
      prisma.contacto.count({ where })
    ])

    console.log(`Contactos encontrados: ${contacts.length} / ${total} (página ${page})`)

    return NextResponse.json({ contacts, total })
  } catch (error) {
    console.error('Error buscando contactos:', error)

    return NextResponse.json({ error: 'Error al buscar contactos' }, { status: 500 })
  }
}
