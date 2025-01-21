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

    // Formatear la respuesta asegurando que todos los productos estén asignados a la lista actual
    const productosFormateados = productos.map(producto => {
      const listaPrecioActual = producto.listasPrecios.find(lp => lp.listaPrecioId === listaId)

      // Si no existe una relación con la lista actual, creamos una por defecto
      const listaPrecioDefault = {
        id: 0,
        precio: null,
        activo: true, // Por defecto activo
        listaPrecio: {
          id: listaId || 0,
          nombre: `Lista ${listaId}`
        }
      }

      return {
        ...producto,
        listasPrecios: [listaPrecioActual || listaPrecioDefault]
      }
    })

    return NextResponse.json(productosFormateados)
  } catch (error) {
    console.error('Error:', error)

    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
