import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { createCliente, getClientes, getClienteById, updateCliente, deleteCliente } from './index'

// GET - Obtener todos los clientes
export async function GET() {
  try {
    console.log('Fetching clientes...')

    const clientes = await prisma.cliente.findMany({
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true
      }
    })

    console.log('Clientes found:', clientes)

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error al obtener clientes:', error)

    return NextResponse.json({ error: 'Error al obtener los clientes' }, { status: 500 })
  }
}

// POST - Crear un nuevo cliente
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('Body recibido en POST:', JSON.stringify(body, null, 2))

    // Validaciones más específicas
    if (!body.rut || !body.razonSocial || !body.nombreCliente) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const cliente = await createCliente(body)

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error('Error completo al crear cliente:', error)

    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message.includes('Ya existe un cliente con el RUT')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict
        )
      }
    }

    return NextResponse.json({ error: 'Error al crear el cliente' }, { status: 500 })
  }
}

// PUT - Actualizar un cliente
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID del cliente es requerido' }, { status: 400 })
    }

    const cliente = await updateCliente(id, data)

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error updating client:', error)

    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 })
  }
}

// DELETE - Eliminar un cliente
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID del cliente es requerido' }, { status: 400 })
    }

    await deleteCliente(Number(id))

    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting client:', error)

    return NextResponse.json({ error: 'Error al eliminar el cliente' }, { status: 500 })
  }
}
