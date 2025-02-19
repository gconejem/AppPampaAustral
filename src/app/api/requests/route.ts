import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

// GET - Obtener todas las solicitudes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const solicitudes = await prisma.Solicitud.findMany({
      where: {
        OR: search ? [
          { numeroSolicitud: { contains: search, mode: 'insensitive' } }
        ] : undefined
      },
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
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    return NextResponse.json(solicitudes)
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)
    return NextResponse.json({ error: 'Error al obtener solicitudes' }, { status: 500 })
  }
}

// POST - Crear una nueva solicitud
export async function POST(req: Request) {
  try {
    const solicitud = await prisma.Solicitud.create({
      data: {
        // Solo los campos mínimos necesarios
        // El resto de campos tienen valores por defecto o son opcionales
      }
    })

    return NextResponse.json(solicitud, { status: 201 })
  } catch (error) {
    console.error('Error al crear solicitud:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error al crear la solicitud', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear la solicitud' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una solicitud
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const solicitud = await prisma.Solicitud.update({
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

    await prisma.Solicitud.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: 'Solicitud eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar solicitud:', error)
    return NextResponse.json({ error: 'Error al eliminar la solicitud' }, { status: 500 })
  }
}
