import { NextResponse } from 'next/server'

import { getClienteById, updateCliente, deleteCliente } from '../index'
import { prisma } from '@/lib/prisma'

interface ContactoCliente {
  contacto: {
    id?: number
    nombre: string
    cargo: string
    email: string
    telefono1: string
    telefono2?: string
  }
  isPrincipal: boolean
}

// GET - Obtener un cliente por ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: {
        id: parseInt(params.id)
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
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Error al obtener cliente:', error)

    return NextResponse.json({ error: 'Error al obtener el cliente' }, { status: 500 })
  }
}

// PUT - Actualizar un cliente específico
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    console.log('=== API PUT /clientes/[id] ===')
    console.log('Body completo:', body)

    // Extraer los datos que necesitamos actualizar
    const {
      clientesContactos,
      condicionesComerciales,
      fechaCreacion,
      createdAt,
      updatedAt,
      vendedor, // Extraer estos campos que no pertenecen al modelo Cliente
      condicionVenta,
      observaciones,
      ...clienteData
    } = body

    // Preparar la actualización del cliente
    const updateData = {
      ...clienteData,

      // Manejar los contactos
      clientesContactos: {
        deleteMany: {}, // Eliminar todos los contactos existentes
        create: clientesContactos.create // Usar directamente el array create que viene del frontend
      },

      // Manejar las condiciones comerciales
      condicionesComerciales: {
        upsert: {
          where: {
            clienteId: Number(params.id)
          },
          create: {
            vendedor,
            condicionVenta,
            observaciones
          },
          update: {
            vendedor,
            condicionVenta,
            observaciones
          }
        }
      }
    }

    // Actualizar el cliente
    const updatedCliente = await prisma.cliente.update({
      where: {
        clienteId: Number(params.id)
      },
      data: updateData,
      include: {
        clientesContactos: {
          include: {
            contacto: true
          }
        },
        condicionesComerciales: true
      }
    })

    return NextResponse.json(updatedCliente)
  } catch (error) {
    console.error('=== ERROR EN API PUT /clientes/[id] ===')
    console.error('Error completo:', error)

    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 })
  }
}

// DELETE - Eliminar un cliente específico
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)

    // Primero eliminar los contactos asociados
    await prisma.clienteContacto.deleteMany({
      where: {
        clienteId: id
      }
    })

    // Luego eliminar las condiciones comerciales
    await prisma.condicionComercial.deleteMany({
      where: {
        clienteId: id
      }
    })

    // Finalmente eliminar el cliente
    const deletedCliente = await prisma.cliente.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json(deletedCliente)
  } catch (error) {
    console.error('Error deleting cliente:', error)

    // Si el error es por referencias de integridad
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'No se puede eliminar el cliente porque tiene obras asociadas. Elimine primero las obras.'
        },
        {
          status: 400
        }
      )
    }

    return NextResponse.json({ error: 'Error deleting cliente' }, { status: 500 })
  }
}
