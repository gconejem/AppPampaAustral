import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const productoId = parseInt(params.id)
    const { estado } = await request.json()

    // Validar que el estado sea válido (ACTIVO o INACTIVO)
    if (estado !== 'ACTIVO' && estado !== 'INACTIVO') {
      return NextResponse.json(
        { error: 'Estado inválido. Debe ser ACTIVO o INACTIVO' },
        { status: 400 }
      )
    }

    // Actualizar el estado del producto
    const productoActualizado = await prisma.producto.update({
      where: {
        productoId
      },
      data: {
        estado,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: `Producto ${productoActualizado.nombre} actualizado a estado ${estado}`,
      producto: productoActualizado
    })
  } catch (error) {
    console.error('Error al actualizar estado del producto:', error)

    return NextResponse.json(
      { error: 'Error al actualizar el estado del producto' },
      { status: 500 }
    )
  }
} 
