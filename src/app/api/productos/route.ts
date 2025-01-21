import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// POST - Crear un nuevo producto
export async function POST(request: Request) {
  try {
    const data = await request.json()

    console.log('Datos recibidos:', data)

    // Extraer los datos de listas de precios
    const { listaPreciosData, ...productoData } = data

    // Crear el producto con sus relaciones
    const producto = await prisma.producto.create({
      data: {
        ...productoData,

        // Si hay datos de listas de precios, crear las relaciones
        ...(listaPreciosData && {
          listasPrecios: {
            create: listaPreciosData.map((lp: any) => ({
              listaPrecioId: lp.listaPrecioId,
              precio: lp.precio,
              activo: lp.activo
            }))
          }
        })
      },
      include: {
        listasPrecios: {
          include: {
            listaPrecio: true
          }
        }
      }
    })

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al crear producto:', error)

    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}

// GET - Obtener todos los productos
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: {
        esPaquete: false,
        estado: 'ACTIVO'
      },
      select: {
        productoId: true,
        sku: true,
        nombre: true
      }
    })

    // Log para debugging
    console.log('Productos a enviar:', productos)

    // Devolver directamente el array de productos
    return new Response(JSON.stringify(productos), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)

    return new Response(JSON.stringify({ error: 'Error al obtener productos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
