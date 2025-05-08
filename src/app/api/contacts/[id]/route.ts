import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET - Obtener un contacto específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const contactId = parseInt(params.id)

    const contact = await prisma.contacto.findUnique({
      where: {
        contactId: contactId
      },
      include: {
        clientesContactos: {
          include: {
            cliente: true
          }
        }
      }
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error al obtener contacto:', error)

    return NextResponse.json({ error: 'Error al obtener contacto' }, { status: 500 })
  }
}

// PUT - Actualizar un contacto
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const contactId = parseInt(params.id)
    const body = await request.json()

    const updatedContact = await prisma.contacto.update({
      where: {
        contactId: contactId
      },
      data: {
        nombre: body.nombre,
        cargo: body.cargo,
        email: body.email,
        telefono1: body.telefono1,
        telefono2: body.telefono2 || null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error al actualizar contacto:', error)

    return NextResponse.json({ error: 'Error al actualizar contacto' }, { status: 500 })
  }
}

// DELETE - Eliminar un contacto
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const contactId = parseInt(params.id)

    // Primero eliminamos todas las relaciones en ClienteContacto
    await prisma.clienteContacto.deleteMany({
      where: {
        contactId: contactId
      }
    })

    // Luego eliminamos el contacto
    await prisma.contacto.delete({
      where: {
        contactId: contactId
      }
    })

    return NextResponse.json({ message: 'Contacto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar contacto:', error)

    return NextResponse.json({ error: 'Error al eliminar contacto' }, { status: 500 })
  }
}

// PATCH - Actualizar estado del contacto
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const contactId = parseInt(params.id)
    const body = await request.json()

    const updatedContact = await prisma.contacto.update({
      where: {
        contactId: contactId
      },
      data: {
        estado: body.estado,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error al actualizar estado del contacto:', error)
    return NextResponse.json({ error: 'Error al actualizar estado del contacto' }, { status: 500 })
  }
}
