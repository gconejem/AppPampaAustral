import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Obtener un contacto específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
    }
    const contact = await prisma.contacto.findUnique({
      where: {
        contactId: parseInt(params.id)
      }
    })
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    return NextResponse.json(contact)
  } catch (error: any) {
    console.error('Error getting contact:', error)
    return NextResponse.json({ error: 'Error getting contact' }, { status: 500 })
  }
}

// PUT - Actualizar un contacto
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
    }
    const body = await req.json()
    const { contactId, createdAt, updatedAt, ...updateData } = body
    
    const contact = await prisma.contacto.update({
      where: { 
        contactId: parseInt(params.id)
      },
      data: updateData
    })
    return NextResponse.json(contact)
  } catch (error: any) {
    console.error('Error updating contact:', error)
    return NextResponse.json({ error: 'Error updating contact' }, { status: 500 })
  }
}

// DELETE - Eliminar un contacto
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
    }
    // Verificar que el ID existe
    const contactExists = await prisma.contacto.findUnique({
      where: { 
        contactId: parseInt(params.id)
      }
    })

    if (!contactExists) {
      return NextResponse.json(
        { error: 'Contacto no encontrado' },
        { status: 404 }
      )
    }

    await prisma.clienteContacto.deleteMany({
      where: {
        contactId: parseInt(params.id)
      }
    })

    const deletedContact = await prisma.contacto.delete({
      where: {
        contactId: parseInt(params.id)
      }
    })

    return NextResponse.json({ message: 'Contacto eliminado correctamente' })
  } catch (error: any) {
    console.error('Error deleting contact:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Error al eliminar el contacto' },
      { status: 500 }
    )
  }
} 

function isValidId(id: string): boolean {
  return !isNaN(parseInt(id)) && parseInt(id) > 0
} 
