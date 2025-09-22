import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET - Obtener todas las solicitudes
export async function GET() {
  try {
    console.log('Iniciando GET de requests...') // Log para debugging

    const requests = await prisma.solicitud.findMany({
      include: {
        cliente: {
          select: {
            clienteId: true,
            razonSocial: true,
            rut: true
          }
        },
        obra: {
          select: {
            obraId: true,
            nombreObra: true,
            direccion: true
          }
        }
      },
      orderBy: {
        numeroSolicitud: 'desc'
      }
    })

    console.log('Solicitudes encontradas:', requests) // Log para ver qué datos se obtienen

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error en GET /api/requests:', error)

    return NextResponse.json({ error: 'Error al obtener las solicitudes' }, { status: 500 })
  }
}

// POST - Crear una nueva solicitud
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { clienteId, obraId } = body

    const solicitud = await prisma.solicitud.create({
      data: {
        clienteId: clienteId || null,
        obraId: obraId || null,
        // Solo los campos mínimos necesarios
        // El resto de campos tienen valores por defecto o son opcionales
      },
      include: {
        cliente: {
          select: {
            clienteId: true,
            nombreCliente: true,
            rut: true,
            razonSocial: true
          }
        },
        obra: {
          select: {
            obraId: true,
            nombreObra: true,
            numeroObra: true
          }
        }
      }
    })

    return NextResponse.json(solicitud, { status: 201 })
  } catch (error) {
    console.error('Error al crear solicitud:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: 'Error al crear la solicitud', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: 'Error al crear la solicitud' }, { status: 500 })
  }
}

// PUT - Actualizar una solicitud
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const solicitud = await prisma.solicitud.update({
      where: { id },
      data,
      include: {
        cliente: {
          select: {
            nombreCliente: true,
            rut: true
          }
        },
        obra: {
          select: {
            nombreObra: true,
            numeroObra: true
          }
        }
      }
    })

    return NextResponse.json(solicitud)
  } catch (error) {
    console.error('Error al actualizar solicitud:', error)

    return NextResponse.json({ error: 'Error al actualizar la solicitud' }, { status: 500 })
  }
}

// DELETE - Eliminar una solicitud
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de la solicitud es requerido' }, { status: 400 })
    }

    await prisma.solicitud.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: 'Solicitud eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar solicitud:', error)

    return NextResponse.json({ error: 'Error al eliminar la solicitud' }, { status: 500 })
  }
}
