import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const paqueteId = parseInt(params.id)

    const productos = await prisma.producto.findUnique({
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

    if (!productos) {
      return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 })
    }

    // Formatear la respuesta para devolver los productos con sus cantidades
    const productosDelPaquete = productos.productosEnPaquete.map(pp => ({
      producto: pp.producto,
      cantidad: pp.cantidad
    }))

    return NextResponse.json({
      productos: productosDelPaquete
    })
  } catch (error) {
    console.error('Error:', error)

    return NextResponse.json({ error: 'Error al obtener productos del paquete' }, { status: 500 })
  }
}
