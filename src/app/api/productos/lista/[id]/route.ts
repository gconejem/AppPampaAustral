import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    let productos

    if (params.id === 'all') {
      // Obtener todos los productos
      productos = await prisma.producto.findMany({
        include: {
          listaPrecio: true
        }
      })
    } else {
      // Obtener productos de la lista específica Y productos sin asignar
      productos = await prisma.producto.findMany({
        where: {
          OR: [
            { listaPrecioId: parseInt(params.id) },
            { listaPrecioId: null } // Incluir productos sin asignar
          ]
        },
        include: {
          listaPrecio: true
        }
      })
    }

    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error al obtener productos:', error)

    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
