import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { estado } = body

    const updatedObra = await prisma.obra.update({
      where: {
        obraId: parseInt(params.id)
      },
      data: {
        estado
      }
    })

    return NextResponse.json(updatedObra)
  } catch (error) {
    console.error('Error updating obra status:', error)

    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 })
  }
}
