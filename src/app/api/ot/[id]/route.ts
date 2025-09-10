import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET /api/ot/[id] - Obtener una OT específica
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const ordenTrabajo = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id },
      include: {
        aceptacionVisita: true,
        densidad: true,
        hormigonFresco: true,
        testigos: true,
        extraccionAsfaltica: true,
        muestreoMaterial: true,
        retiroProbeta: true,
        tipoOT: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!ordenTrabajo) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    return NextResponse.json(ordenTrabajo)
  } catch (error) {
    console.error('Error al obtener OT:', error)

    return NextResponse.json({ error: 'Error al obtener la orden de trabajo' }, { status: 500 })
  }
}

// PUT /api/ot/[id] - Actualizar una OT específica
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    // Verificar que la OT existe
    const existingOT = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id }
    })

    if (!existingOT) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    const ordenTrabajo = await prisma.ordenTrabajo.update({
      where: { id: params.id },
      data,
      include: {
        aceptacionVisita: true,
        densidad: true,
        hormigonFresco: true,
        testigos: true,
        extraccionAsfaltica: true,
        muestreoMaterial: true,
        retiroProbeta: true,
        tipoOT: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(ordenTrabajo)
  } catch (error) {
    console.error('Error al actualizar OT:', error)

    return NextResponse.json({ error: 'Error al actualizar la orden de trabajo' }, { status: 500 })
  }
}

// PATCH /api/ot/[id] - Actualizar parcialmente una OT específica (para jsonOT)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    // Verificar que la OT existe
    const existingOT = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id }
    })

    if (!existingOT) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    // Solo actualizar los campos que se envían
    const ordenTrabajo = await prisma.ordenTrabajo.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(ordenTrabajo)
  } catch (error) {
    console.error('Error al actualizar OT:', error)

    return NextResponse.json({ error: 'Error al actualizar la orden de trabajo' }, { status: 500 })
  }
}

// DELETE /api/ot/[id] - Eliminar una OT específica
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar que la OT existe
    const existingOT = await prisma.ordenTrabajo.findUnique({
      where: { id: params.id }
    })

    if (!existingOT) {
      return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    }

    await prisma.ordenTrabajo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Orden de trabajo eliminada' })
  } catch (error) {
    console.error('Error al eliminar OT:', error)

    return NextResponse.json({ error: 'Error al eliminar la orden de trabajo' }, { status: 500 })
  }
}
