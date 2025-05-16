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

    console.log('Datos recibidos en POST:', body)

    const cliente = await prisma.cliente.create({
      data: {
        rut: body.rut,
        estado: body.estado,
        razonSocial: body.razonSocial,
        nombreCliente: body.nombreCliente,
        pais: body.pais,
        region: body.region,
        ciudad: body.ciudad || '',
        comuna: body.comuna || '',
        direccion: body.direccion || '',
        telefono: body.telefono || '',
        sitioWeb: body.sitioWeb || '',
        segmento: body.segmento || '',
        industria: body.industria || '',
        giro: body.giro || '',
        emailFacturacion: body.emailFacturacion || '',
        otroRut: body.otroRut || '',
        representanteLegal: body.representanteLegal || '',
        fechaCreacion: new Date(body.fechaCreacion),
        clientesContactos: {
          create: body.clientesContactos.map((contacto: any) => ({
            contacto: {
              connect: {
                contactId: contacto.contactId
              }
            },
            cargo: contacto.cargo,
            isPrincipal: contacto.isPrincipal
          }))
        },
        condicionesComerciales: {
          create: body.condicionesComerciales.create
        }
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

    console.log('Cliente creado:', cliente)

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
