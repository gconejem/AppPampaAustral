import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET - Obtener un servicio específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const servicio = await prisma.servicio.findUnique({
      where: {
        id: parseInt(params.id)
      }
    })

    if (!servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error al obtener servicio:', error)

    return NextResponse.json({ error: 'Error al obtener el servicio' }, { status: 500 })
  }
}

// PUT - Actualizar un servicio
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    const servicio = await prisma.servicio.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        estado: data.estado
      }
    })

    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error al actualizar servicio:', error)

    return NextResponse.json({ error: 'Error al actualizar el servicio' }, { status: 500 })
  }
}

// DELETE - Deshabilitar un servicio (soft delete)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const servicio = await prisma.servicio.update({
      where: {
        id: parseInt(params.id)
      },
      data: {
        estado: false
      }
    })

    return NextResponse.json(servicio)
  } catch (error) {
    console.error('Error al deshabilitar servicio:', error)

    return NextResponse.json({ error: 'Error al deshabilitar el servicio' }, { status: 500 })
  }
}
