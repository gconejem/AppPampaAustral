import { NextResponse } from 'next/server'
import { getClienteById, updateCliente, deleteCliente } from '../index'
import prisma from '@/lib/prisma'

// GET - Obtener un cliente por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: {
        id: Number(params.id)
      },
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar un cliente específico
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const updatedClient = await prisma.cliente.update({
      where: { id: Number(params.id) },
      data,
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el cliente' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un cliente específico
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCliente(Number(params.id))
    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el cliente' },
      { status: 500 }
    )
  }
} 
