import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const paqueteId = parseInt(params.id)

    const producto = await prisma.producto.findUnique({
      where: {
        productoId: paqueteId
      },
      include: {
        productosEnPaquete: {
          include: {
            producto: true
          }
        }
      }
    })

    if (!producto) {
      return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 })
    }

    // Formatear la respuesta para devolver los productos del paquete con sus cantidades
    const productosDelPaquete = producto.productosEnPaquete.map(pp => ({
      ...pp.producto,
      cantidad: pp.cantidad,
      descripcion: pp.descripcion,
      precioUnitario: pp.precioUnitario
    }))

    return NextResponse.json({
      productos: productosDelPaquete,
      producto: {
        ...producto,
        productosEnPaquete: productosDelPaquete
      }
    })
  } catch (error) {
    console.error('Error:', error)

    return NextResponse.json({ error: 'Error al obtener productos del paquete' }, { status: 500 })
  }
}
