import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const productoId = parseInt(params.id)

    const producto = await prisma.producto.findUnique({
      where: { productoId },
      include: {
        listasPrecios: true
      }
    })

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Obtener la primera lista de precios si existe
    const primerListaPrecio = producto.listasPrecios && producto.listasPrecios.length > 0 
      ? producto.listasPrecios[0] 
      : null;

    return NextResponse.json({
      producto: {
        sku: producto.sku,
        nombre: producto.nombre,
        precio: producto.precio,
        lista: primerListaPrecio
          ? {
              id: primerListaPrecio.id,
              nombre: "Lista de precios" // El nombre de la lista está en otra relación
            }
          : null
      }
    })
  } catch (error) {
    console.error('Error al obtener producto:', error)

    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 })
  }
}
