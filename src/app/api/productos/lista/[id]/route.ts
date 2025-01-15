import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const listaId = params.id === 'all' ? null : parseInt(params.id)

    const productos = await prisma.producto.findMany({
      include: {
        listasPrecios: {
          include: {
            listaPrecio: true
          },
          where: listaId
            ? {
                listaPrecioId: listaId
              }
            : undefined
        }
      }
    })

    // Formatear la respuesta
    const productosFormateados = productos.map(producto => {
      const listaPrecioActual = producto.listasPrecios.find(lp => lp.listaPrecioId === listaId)

      return {
        ...producto,
        precio: listaPrecioActual?.precio || null,
        activoEnLista: listaPrecioActual?.activo ?? false,
        listaPrecio: listaPrecioActual?.listaPrecio || null
      }
    })

    return NextResponse.json(productosFormateados)
  } catch (error) {
    console.error('Error:', error)

    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
