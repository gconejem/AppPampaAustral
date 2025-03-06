import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const obraId = parseInt(params.id)
    const { estadoObra } = await request.json()

    // Validar el estado
    const estadosValidos = ['activa', 'terminada', 'bloqueada', 'inactiva']

    if (!estadosValidos.includes(estadoObra.toLowerCase())) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    // Actualizar el estado de la obra
    const updatedObra = await prisma.obra.update({
      where: {
        obraId: obraId
      },
      data: {
        estadoObra: estadoObra,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedObra)
  } catch (error) {
    console.error('Error al actualizar estado:', error)

    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 })
  }
}
