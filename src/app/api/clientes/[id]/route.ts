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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const clienteId = parseInt(params.id)
    const data = await req.json()

    // Actualizar solo los datos básicos del cliente
    const clienteActualizado = await prisma.cliente.update({
      where: {
        clienteId: clienteId
      },
      data: {
        estado: data.estado,
        rut: data.rut,
        razonSocial: data.razonSocial,
        nombreCliente: data.nombreCliente,
        pais: data.pais,
        region: data.region,
        ciudad: data.ciudad,
        comuna: String(data.comuna),
        direccion: data.direccion,
        telefono: data.telefono,
        sitioWeb: data.sitioWeb,
        segmento: data.segmento,
        industria: data.industria
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

    return NextResponse.json(clienteActualizado)
  } catch (error) {
    console.error('Error al actualizar cliente:', error)

    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}
