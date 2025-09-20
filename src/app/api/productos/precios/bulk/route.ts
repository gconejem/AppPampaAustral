import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { productosIds, listaPrecioId } = await request.json()

    // Actualizar todos los productos seleccionados con la nueva lista de precios
    await prisma.producto.updateMany({
      where: {
        productoId: {
          in: productosIds
        }
      },
      data: {
        listaPrecioId: listaPrecioId
      }
    })

    return NextResponse.json({ message: 'Productos actualizados correctamente' })
  } catch (error) {
    console.error('Error:', error)

    return NextResponse.json({ error: 'Error al actualizar productos' }, { status: 500 })
  }
}
