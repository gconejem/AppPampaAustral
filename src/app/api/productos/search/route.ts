import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json([])
    }

    console.log('Buscando productos con query:', query)

    const productos = await prisma.producto.findMany({
      where: {
        OR: [
          {
            nombre: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            sku: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            descripcion: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        productoId: true,
        sku: true,
        nombre: true,
        descripcion: true,
        area: true,
        familia: true,
        tipo: true,
        precio: true,
        estado: true,
        esPaquete: true,
        norma: true,
        aplicaImpuesto: true,
        listasPrecios: {
          select: {
            precio: true,
            listaPrecio: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    })

    console.log('Productos encontrados:', productos)

    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error searching productos:', error)

    return new NextResponse(JSON.stringify({ error: 'Error searching productos' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
