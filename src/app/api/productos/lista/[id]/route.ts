import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productos = await prisma.producto.findMany({
      include: {
        ProductoListaPrecio: {
          include: {
            ListaPrecio: true
          },
          where: params.id !== 'all' ? { listaPrecioId: parseInt(params.id) } : undefined
        }
      }
    })

    // Formatear la respuesta
    const productosFormateados = productos.map(producto => ({
      productoId: producto.productoId,
      sku: producto.sku,
      nombre: producto.nombre,
      area: producto.area,
      familia: producto.familia,
      tipo: producto.tipo,
      precio: producto.precio,
      listasPrecios: producto.ProductoListaPrecio.map(plp => ({
        id: plp.id,
        precio: plp.precio,
        activo: plp.activo,
        listaPrecio: plp.ListaPrecio
      }))
    }))

    return NextResponse.json(productosFormateados)
  } catch (error) {
    console.error('Error al obtener productos:', error)

    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
