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

    // Transformar los datos para incluir los cargos de la relación
    const transformedContacts = contacts.map(contact => {
      return {
        contactId: contact.contactId,
        nombre: contact.nombre,
        cargo: contact.cargo,
        email: contact.email,
        telefono1: contact.telefono1,
        telefono2: contact.telefono2,
        empresa: contact.empresa,
        comuna: contact.comuna,
        direccion: contact.direccion,
        estado: contact.estado,
        clientesContactos:
          contact.clientesContactos?.map(cc => ({
            clienteId: cc.clienteId,
            cargo: cc.cargo,
            isPrincipal: cc.isPrincipal
          })) || []
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
        empresa: body.empresa || null,
        comuna: body.comuna || null,
        direccion: body.direccion || null
      }
    })

    return NextResponse.json(contacto)
  } catch (error) {
    console.error('Error al crear contacto:', error)

    return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 })
  }
}
