import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'

// POST - Crear un nuevo producto
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('Datos recibidos:', body) // Para debug

    const { nombre, sku, descripcion, area, familia, tipo, precio, norma, listaPrecios, aplicaImpuesto = true } = body

    // Validar campos requeridos
    const camposRequeridos = ['sku', 'nombre', 'area', 'familia', 'tipo', 'precio']

    const camposFaltantes = camposRequeridos.filter(campo => {
      if (campo === 'precio') {
        return !precio || isNaN(parseFloat(precio))
      }

      return !body[campo]
    })

    if (camposFaltantes.length > 0) {
      return NextResponse.json({ error: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}` }, { status: 400 })
    }

    // Crear el producto
    const producto = await prisma.producto.create({
      data: {
        nombre,
        sku,
        descripcion: descripcion || null,
        area,
        familia,
        tipo,
        precio: parseFloat(precio),
        norma: norma || null,
        aplicaImpuesto,
        estado: 'ACTIVO',
        listaPrecioId: body.listaPrecioId || null
      }
    })

    console.log('Producto creado:', producto) // Para debug

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error detallado al crear producto:', error)

    // Mejorar el mensaje de error
    let errorMessage = 'Error al crear producto'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// GET - Obtener todos los productos con sus precios
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        skip,
        take: limit,
        include: {
          listaPrecio: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.producto.count()
    ])

    // Transformar los datos para el formato que espera el frontend
    const productosFormateados = productos.map(producto => ({
      ...producto,
      listaPrecio: producto.listaPrecio
        ? {
            id: producto.listaPrecio.id,
            nombre: producto.listaPrecio.nombre
          }
        : null
    }))

    return NextResponse.json({
      productos: productosFormateados,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error al obtener productos:', error)

    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
