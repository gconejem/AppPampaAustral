import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productoId = parseInt(params.id)

    const producto = await prisma.producto.findUnique({
      where: { productoId },
      include: {
        listaPrecio: true
      }
    })

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      producto: {
        sku: producto.sku,
        nombre: producto.nombre,
        precio: producto.precio,
        lista: producto.listaPrecio
          ? {
            id: producto.listaPrecio.id,
            nombre: producto.listaPrecio.nombre
          }
          : null
      }
    })
  } catch (error) {
    console.error('Error al obtener producto:', error)

    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 })
  }
}
