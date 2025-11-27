import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { estado } = body
    const clienteId = parseInt(params.id)

    if (!estado) {
      return NextResponse.json({ error: 'Estado no proporcionado' }, { status: 400 })
    }

    const updatedCliente = await prisma.cliente.update({
      where: {
        clienteId
      },
      data: {
        estado
      }
    })

    return NextResponse.json(updatedCliente)
  } catch (error) {
    console.error('Error al actualizar el estado:', error)

    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 })
  }
}
