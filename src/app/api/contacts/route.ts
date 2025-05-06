import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET - Obtener todos los contactos
export async function GET() {
  try {
    const contacts = await prisma.contacto.findMany({
      include: {
        clientesContactos: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    // Transformar los datos para mantener la estructura anterior
    const transformedContacts = contacts.map(contact => {
      const clienteContacto = contact.clientesContactos[0]

      return {
        contactId: contact.contactId,
        nombre: contact.nombre,
        email: contact.email,
        telefono1: contact.telefono1,
        telefono2: contact.telefono2,
        empresa: contact.empresa
      }
    })

    console.log('Total de contactos encontrados:', contacts.length)

    return NextResponse.json(transformedContacts)
  } catch (error) {
    console.error('Error al obtener contactos:', error)

    return NextResponse.json({ error: 'Error al obtener contactos' }, { status: 500 })
  }
}

// POST - Crear un nuevo contacto
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const contacto = await prisma.contacto.create({
      data: {
        nombre: body.nombre,
        cargo: body.cargo || 'Sin cargo',
        email: body.email,
        telefono1: body.telefono1,
        telefono2: body.telefono2 || '',
        empresa: body.empresa || null
      }
    })

    return NextResponse.json(contacto)
  } catch (error) {
    console.error('Error al crear contacto:', error)

    return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 })
  }
}
