import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  try {
    const contacts = await prisma.contacto.findMany({
      where: {
        OR: [
          { nombre: { contains: query || '', mode: 'insensitive' } },
          { email: { contains: query || '', mode: 'insensitive' } }
        ]
      },
      select: {
        contactId: true,
        nombre: true,
        cargo: true,
        email: true,
        telefono1: true,
        telefono2: true
      }
    })
    return NextResponse.json(contacts)
  } catch (error) {
    return NextResponse.json({ error: 'Error searching contacts' }, { status: 500 })
  }
} 
