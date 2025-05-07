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
        industria: data.industria,
        giro: data.giro,
        emailFacturacion: data.emailFacturacion
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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const clientId = parseInt(params.id)

    const client = await prisma.cliente.findUnique({
      where: {
        clienteId: clientId
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

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Transformar los datos para que coincidan con la interfaz del frontend
    const clienteFormateado = {
      ...client,
      clientesContactos: client.clientesContactos.map(cc => ({
        contacto: cc.contacto,
        isPrincipal: cc.isPrincipal
      })),
      condicionesComerciales: client.condicionesComerciales
    }

    console.log('Condiciones comerciales:', client.condicionesComerciales)
    console.log('Cliente formateado:', clienteFormateado)

    return NextResponse.json(clienteFormateado)
  } catch (error) {
    console.error('Error al obtener cliente:', error)

    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const clientId = parseInt(params.id)
    const data = await request.json()

    // Primero actualizamos el cliente
    await prisma.cliente.update({
      where: {
        clienteId: clientId
      },
      data: {
        estado: data.estado,
        razonSocial: data.razonSocial,
        nombreCliente: data.nombreCliente,
        pais: data.pais,
        region: data.region,
        ciudad: data.ciudad,
        comuna: data.comuna,
        direccion: data.direccion,
        telefono: data.telefono,
        sitioWeb: data.sitioWeb,
        segmento: data.segmento,
        industria: data.industria,
        giro: data.giro || '',
        emailFacturacion: data.emailFacturacion || ''
      }
    })

    // Actualizar condiciones comerciales
    if (data.condicionesComerciales) {
      await prisma.condicionComercial.upsert({
        where: {
          clienteId: clientId
        },
        update: {
          vendedor: data.condicionesComerciales.vendedor,
          condicionVenta: data.condicionesComerciales.condicionVenta,
          observaciones: data.condicionesComerciales.observaciones
        },
        create: {
          clienteId: clientId,
          vendedor: data.condicionesComerciales.vendedor,
          condicionVenta: data.condicionesComerciales.condicionVenta,
          observaciones: data.condicionesComerciales.observaciones
        }
      })
    }

    // Actualizar contactos si se proporcionaron
    if (data.clientesContactos) {
      // Primero eliminamos todas las relaciones existentes
      await prisma.clienteContacto.deleteMany({
        where: {
          clienteId: clientId
        }
      })

      // Luego creamos las nuevas relaciones
      for (const contacto of data.clientesContactos) {
        await prisma.clienteContacto.create({
          data: {
            clienteId: clientId,
            contactId: contacto.contactId,
            isPrincipal: contacto.isPrincipal,
            cargo: contacto.cargo || ''
          }
        })
      }
    }

    // Obtener el cliente actualizado con todas sus relaciones
    const clienteActualizado = await prisma.cliente.findUnique({
      where: {
        clienteId: clientId
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
