import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// DELETE para eliminar todos los contactos de un cliente
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.clienteContacto.deleteMany({
      where: {
        clienteId: parseInt(params.id)
      }
    })

    return NextResponse.json({ message: 'Contactos eliminados' })
  } catch (error) {
    console.error('Error al eliminar contactos:', error)

    return NextResponse.json({ error: 'Error al eliminar contactos' }, { status: 500 })
  }
}

// POST para crear un nuevo contacto
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json()
    const clienteId = parseInt(params.id)

    const nuevoContacto = await prisma.clienteContacto.create({
      data: {
        clienteId,
        isPrincipal: data.isPrincipal,
        contacto: {
          create: data.contacto
        }
      },
      include: {
        contacto: true
      }
    })

    return NextResponse.json(nuevoContacto)
  } catch (error) {
    console.error('Error al crear contacto:', error)

    return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 })
  }
}

// Agregar este nuevo endpoint para actualizar un contacto específico
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json()
    const clienteId = parseInt(params.id)

    // Actualizar el contacto existente
    const updatedContacto = await prisma.contacto.update({
      where: {
        contactId: data.contacto.contactId
      },
      data: {
        nombre: data.contacto.nombre,
        cargo: data.contacto.cargo || '',
        email: data.contacto.email,
        telefono1: data.contacto.telefono1 || '',
        telefono2: data.contacto.telefono2 || ''
      }
    })

    // Actualizar la relación si es necesario
    if (data.id) {
      await prisma.clienteContacto.update({
        where: {
          id: data.id
        },
        data: {
          isPrincipal: data.isPrincipal
        }
      })
    }

    return NextResponse.json(updatedContacto)
  } catch (error) {
    console.error('Error al actualizar contacto:', error)

    return NextResponse.json({ error: 'Error al actualizar contacto' }, { status: 500 })
  }
}
