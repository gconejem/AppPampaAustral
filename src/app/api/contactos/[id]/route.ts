import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Obtener un contacto específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const contact = await prisma.contacto.findUnique({
      where: { id: Number(params.id) }
    })
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    return NextResponse.json(contact)
  } catch (error) {
    return NextResponse.json({ error: 'Error getting contact' }, { status: 500 })
  }
}

// PUT - Actualizar un contacto
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const contact = await prisma.contacto.update({
      where: { id: parseInt(params.id) },
      data: body
    })
    return NextResponse.json(contact)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating contact' }, { status: 500 })
  }
}

// DELETE - Eliminar un contacto
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Primero eliminamos todas las relaciones en ClienteContacto
    await prisma.clienteContacto.deleteMany({
      where: {
        contactoId: parseInt(params.id)
      }
    })

    // Luego eliminamos el contacto
    await prisma.contacto.delete({
      where: { id: parseInt(params.id) }
    })
    
    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json({ error: 'Error deleting contact' }, { status: 500 })
  }
} 
