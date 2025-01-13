import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const productoId = parseInt(params.id)
    const { precio, listaPrecioId } = await request.json()

    const precioProducto = await prisma.precioProducto.upsert({
      where: {
        productoId_listaPrecioId: {
          productoId,
          listaPrecioId
        }
      },
      update: {
        precio
      },
      create: {
        precio,
        productoId,
        listaPrecioId
      }
    })

    return NextResponse.json(precioProducto)
  } catch (error) {
    console.error('Error al actualizar el precio:', error)

    return NextResponse.json({ error: 'Error al actualizar el precio' }, { status: 500 })
  }
}
