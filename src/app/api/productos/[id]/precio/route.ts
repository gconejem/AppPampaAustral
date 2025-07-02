import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const productoId = parseInt(params.id)
    const { precio, listaPrecioId } = await request.json()

    // Validar que el precio sea un número válido
    if (isNaN(precio)) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
    }

    // Actualizar el producto
    const productoActualizado = await prisma.producto.update({
      where: {
        productoId
      },
      data: {
        precio,
        listasPrecios: {
          connect: {
            id: listaPrecioId
          }
        }
      }
    })

    return NextResponse.json(productoActualizado)
  } catch (error) {
    console.error('Error al actualizar precio:', error)

    return NextResponse.json({ error: 'Error al actualizar el precio' }, { status: 500 })
  }
}
