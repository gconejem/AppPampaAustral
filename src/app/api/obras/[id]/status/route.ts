import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const obraId = parseInt(params.id)
    const body = await request.json()

    // Validar el estado
    const newStatus = body.estado

    if (!['activo', 'inactivo'].includes(newStatus)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    // Actualizar el estado de la obra
    const updatedObra = await prisma.obra.update({
      where: {
        obraId
      },
      data: {
        estado: newStatus,
        updatedAt: new Date()
      },
      include: {
        ContactoObra: true
      }
    })

    return NextResponse.json(updatedObra)
  } catch (error) {
    console.error('Error al actualizar estado:', error)

    return NextResponse.json({ error: 'Error al actualizar el estado de la obra' }, { status: 500 })
  }
}
