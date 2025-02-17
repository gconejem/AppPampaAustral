import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { createCliente, getClientes, getClienteById, updateCliente, deleteCliente } from './index'

// GET - Obtener todos los clientes
export async function GET() {
  try {
    // Consulta correcta a la tabla Cliente
    const clientes = await prisma.cliente.findMany({
      include: {
        ClienteContacto: {
          include: {
            Contacto: true
          }
        }
      }
    })

    // Para debug
    console.log('Query de clientes ejecutada')
    console.log('Total de clientes encontrados:', clientes.length)

    // Log para ver si los contactos se están incluyendo
    console.log('Ejemplo de ClienteContacto:', clientes[0]?.ClienteContacto)

    // Mapear los campos exactamente como están en la BD
    const clientesResponse = clientes.map(cliente => ({
      clienteId: cliente.clienteId,
      rut: cliente.rut,
      nombreCliente: cliente.nombreCliente,
      comuna: cliente.comuna,
      segmento: cliente.segmento || 'Sin segmento',
      estado: cliente.estado || 'active',
      razonSocial: cliente.razonSocial,
      pais: cliente.pais,
      region: cliente.region,
      ciudad: cliente.ciudad,
      direccion: cliente.direccion,
      fechaCreacion: cliente.fechaCreacion,
      ClienteContacto: cliente.ClienteContacto
    }))

    console.log('Clientes mapeados:', JSON.stringify(clientesResponse, null, 2))

    return NextResponse.json(clientesResponse)
  } catch (error) {
    console.error('Error detallado al obtener clientes:', error)

    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
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
