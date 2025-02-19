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
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validar que el body no sea null
    if (!body) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // Extraer los datos del cliente y sus contactos
    const { contactos, condicionesComerciales, ...clienteData } = body

    // Crear el cliente y sus relaciones en una transacción
    const cliente = await prisma.$transaction(async tx => {
      // 1. Crear el cliente
      const nuevoCliente = await tx.cliente.create({
        data: {
          ...clienteData,

          // Asegurarse que estos campos existan
          estado: clienteData.estado || 'ACTIVO',
          fechaCreacion: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // 2. Si hay contactos, crearlos o vincularlos
      if (contactos && contactos.length > 0) {
        for (const contacto of contactos) {
          await tx.clienteContacto.create({
            data: {
              clienteId: nuevoCliente.clienteId,
              contactId: contacto.contactId,
              isPrincipal: contacto.isPrincipal || false
            }
          })
        }
      }

      // 3. Si hay condiciones comerciales, crearlas
      if (condicionesComerciales) {
        await tx.condicionComercial.create({
          data: {
            ...condicionesComerciales,
            clienteId: nuevoCliente.clienteId
          }
        })
      }

      return nuevoCliente
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    // Mejorar el manejo de errores
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'

    console.error('Error al crear cliente:', errorMessage)

    return NextResponse.json({ error: 'Error al crear el cliente', details: errorMessage }, { status: 500 })
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
