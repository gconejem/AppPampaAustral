import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET - Obtener todos los contactos
export async function GET() {
  try {
    const contactos = await prisma.contacto.findMany({
      orderBy: {
        nombre: 'asc'
      }
    })

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
        telefono2: body.telefono2 || null
      }
    })

    return NextResponse.json(contacto, { status: 201 })
  } catch (error) {
    console.error('Error al crear contacto:', error)

    return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 })
  }
}
