import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Obtener todos los contactos
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const incluirInactivos = searchParams.get('incluirInactivos') === 'true'

    // Por defecto, solo retornar contactos activos a menos que se especifique incluirInactivos=true
    const whereClause = incluirInactivos ? {} : { estado: 'ACTIVO' }

    const contacts = await prisma.contacto.findMany({
      where: whereClause,
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

    // Verificar si ya existe un contacto con el mismo email
    const existingContact = await prisma.contacto.findFirst({
      where: {
        email: body.email
      }
    })

    if (existingContact) {
      return NextResponse.json(
        { error: 'Ya existe un contacto registrado con este email' },
        { status: 400 }
      )
    }

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
