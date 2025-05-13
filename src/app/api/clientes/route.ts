import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { createCliente, getClientes, getClienteById, updateCliente, deleteCliente } from './index'

// GET - Obtener todos los clientes
export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true,
        cotizaciones: true,
        solicitudes: true
      },
      orderBy: {
        fechaCreacion: 'desc'
      }
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error detallado al obtener clientes:', error)

    return NextResponse.json({ error: 'Error al obtener los clientes' }, { status: 500 })
  }
}

// POST - Crear un nuevo cliente
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('Datos recibidos en POST:', body) // Agregar log para ver los datos recibidos

    const cliente = await prisma.cliente.create({
      data: {
        ...body,
        otroRut: body.otroRut || '',
        representanteLegal: body.representanteLegal || '',
        fechaCreacion: new Date(),
        giro: body.giro || null,
        emailFacturacion: body.emailFacturacion || null,
        clientesContactos: body.clientesContactos,
        condicionesComerciales: body.condicionesComerciales
      },
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true,
        cotizaciones: true,
        solicitudes: true
      }
    })

    console.log('Cliente creado:', cliente) // Agregar log para ver el cliente creado

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error('Error al crear cliente:', error)

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
