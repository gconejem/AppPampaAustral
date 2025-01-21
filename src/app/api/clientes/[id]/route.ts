import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const clienteId = parseInt(params.id)

    // Primero eliminar los contactos asociados
    await prisma.clienteContacto.deleteMany({
      where: {
        clienteId: clienteId
      }
    })

    // Eliminar las condiciones comerciales
    await prisma.condicionComercial.deleteMany({
      where: {
        clienteId: clienteId
      }
    })

    // Finalmente eliminar el cliente
    const deletedClient = await prisma.cliente.delete({
      where: {
        clienteId: clienteId
      }
    })

    return NextResponse.json(deletedClient)
  } catch (error) {
    console.error('Error al eliminar cliente:', error)

    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const clienteId = parseInt(params.id)

    // Extraer todos los campos que no deben ir en la actualización directa
    const {
      clientesContactos,
      condicionesComerciales,
      clienteId: id,
      createdAt,
      updatedAt,
      fechaCreacion,
      vendedor, // Extraer estos campos
      condicionVenta, // ya que van en condicionesComerciales
      observaciones,
      ...clienteData
    } = body

    // Actualizar el cliente y sus relaciones
    const updatedCliente = await prisma.cliente.update({
      where: {
        clienteId
      },
      data: {
        ...clienteData,
        comuna: String(clienteData.comuna),

        // Actualizar o crear contactos
        clientesContactos: {
          deleteMany: {}, // Eliminar contactos existentes
          create: clientesContactos.map((contacto: any) => ({
            isPrincipal: false,
            contacto: {
              create: {
                nombre: contacto.nombre,
                cargo: contacto.cargo,
                email: contacto.email,
                telefono1: contacto.telefono1,
                telefono2: contacto.telefono2 || ''
              }
            }
          }))
        },

        // Actualizar condiciones comerciales
        condicionesComerciales: {
          update: {
            vendedor: condicionesComerciales.vendedor,
            condicionVenta: condicionesComerciales.condicionVenta,
            observaciones: condicionesComerciales.observaciones
          }
        }
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

    return NextResponse.json(updatedCliente)
  } catch (error) {
    console.error('Error al actualizar cliente:', error)

    return NextResponse.json({ error: 'Error al actualizar el cliente' }, { status: 500 })
  }
}
