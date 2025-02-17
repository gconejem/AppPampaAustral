import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET - Obtener todos los contactos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const contactos = await prisma.contacto.findMany({
      where: search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { cargo: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {},
      orderBy: {
        nombre: 'asc'
      }
    })

    console.log('Contactos encontrados:', contactos) // Para debug

    return NextResponse.json(contactos)
  } catch (error) {
    console.error('Error al obtener contactos:', error)

    return NextResponse.json({ error: 'Error al obtener contactos' }, { status: 500 })
  }
}

// POST - Crear un nuevo contacto
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const contacto = await prisma.contacto.create({
      data: {
        nombre: body.nombre,
        cargo: body.cargo,
        email: body.email,
        telefono1: body.telefono1,
        telefono2: body.telefono2 || null,
        updatedAt: new Date(),
        createdAt: new Date()
      }
    })

    return NextResponse.json(contacto, { status: 201 })
  } catch (error) {
    console.error('Error al crear contacto:', error)

    return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 })
  }
}
