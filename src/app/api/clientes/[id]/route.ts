import { NextResponse } from 'next/server'
import { getClienteById, updateCliente, deleteCliente } from '../index'
import prisma from '@/lib/prisma'

interface ContactoCliente {
  contacto: {
    id?: number;
    nombre: string;
    cargo: string;
    email: string;
    telefono1: string;
    telefono2?: string;
  };
  isPrincipal: boolean;
}

// GET - Obtener un cliente por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: {
        clienteId: Number(params.id)
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
    console.log('=== API PUT /clientes/[id] ===')
    console.log('Body completo:', JSON.stringify(body, null, 2))
    const { 
      clienteId, 
      clientesContactos, 
      condicionesComerciales,
      vendedor,
      condicionVenta, 
      observaciones,
      ...clienteData 
    } = body

    console.log('Contactos a procesar:', JSON.stringify(clientesContactos, null, 2))

    const updatedClient = await prisma.cliente.update({
      where: { clienteId: parseInt(params.id) },
      data: {
        ...clienteData,
        clientesContactos: {
          deleteMany: {},
          create: clientesContactos?.map((cc: ContactoCliente) => {
            process.stdout.write(`\nProcesando contacto: ${JSON.stringify(cc, null, 2)}`)
            const contactData = cc.contacto.id 
              ? { connect: { contactId: cc.contacto.id } }
              : { 
                  create: {
                    nombre: cc.contacto.nombre,
                    cargo: cc.contacto.cargo,
                    email: cc.contacto.email,
                    telefono1: cc.contacto.telefono1,
                    telefono2: cc.contacto.telefono2 || ''
                  }
                }
            process.stdout.write(`\nDatos preparados: ${JSON.stringify(contactData, null, 2)}\n`)
            return {
              contacto: contactData,
              isPrincipal: cc.isPrincipal
            }
          })
        },
        condicionesComerciales: {
          upsert: {
            create: {
              vendedor: vendedor || '',
              condicionVenta: condicionVenta || '',
              observaciones: observaciones || ''
            },
            update: {
              vendedor: vendedor || '',
              condicionVenta: condicionVenta || '',
              observaciones: observaciones || ''
            }
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

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('=== ERROR EN API PUT /clientes/[id] ===')
    console.error('Error completo:', error)
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
    const deletedClient = await prisma.cliente.delete({
      where: { clienteId: Number(params.id) }
    })
    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el cliente' },
      { status: 500 }
    )
  }
} 
