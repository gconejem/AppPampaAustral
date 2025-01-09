import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { estado } = body

    const updatedCliente = await prisma.cliente.update({
      where: {
        clienteId: parseInt(params.id)
      },
      data: {
        estado
      }
    })

    return NextResponse.json(updatedCliente)
  } catch (error) {
    console.error('Error updating cliente status:', error)

    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 })
  }
}
