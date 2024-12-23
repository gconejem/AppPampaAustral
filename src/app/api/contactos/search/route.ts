import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    console.log('Search query:', query)

    if (!query) {
      return NextResponse.json([])
    }

    const contacts = await prisma.contacto.findMany({
      where: {
        OR: [
          { nombre: { contains: query } },
          { email: { contains: query } },
          { cargo: { contains: query } }
        ]
      },
      select: {
        id: true,
        nombre: true,
        cargo: true,
        email: true,
        telefono1: true,
        telefono2: true
      },
      take: 5
    })

    console.log('Found contacts:', contacts)

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error searching contacts:', error)
    return NextResponse.json({ error: 'Error searching contacts' }, { status: 500 })
  }
} 
