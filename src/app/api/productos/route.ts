import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// POST - Crear un nuevo producto
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('Datos recibidos:', body)

    const {
      nombre,
      sku,
      descripcion,
      area = 'Suelos', // Valor por defecto para paquetes
      familia = 'Clasificación', // Valor por defecto para paquetes
      tipo,
      precio,
      norma,
      listaPrecioId, // Cambiamos listaPrecios por listaPrecioId
      aplicaImpuesto = true,
      esPaquete = false
    } = body

    // Validar campos requeridos
    const camposRequeridos = ['sku', 'nombre', 'tipo', 'precio', 'listaPrecioId'] // Agregamos listaPrecioId como requerido

    const camposFaltantes = camposRequeridos.filter(campo => {
      if (campo === 'precio') {
        return !precio || isNaN(parseFloat(precio))
      }

      if (campo === 'listaPrecioId') {
        return !listaPrecioId || isNaN(parseInt(listaPrecioId))
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
        esPaquete,
        listaPrecioId: parseInt(listaPrecioId) // Asegurarnos de que se guarde como número
      },
      include: {
        listaPrecio: true // Incluir la lista de precios en la respuesta
      }
    })

    console.log('Producto creado:', producto)

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error detallado al crear producto:', error)

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
    const esPaquete = searchParams.get('esPaquete')

    const skip = (page - 1) * limit

    const where: any = {}

    if (esPaquete !== null) {
      where.esPaquete = esPaquete === 'true'
    }

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        skip,
        take: limit,
        where,
        include: {
          listaPrecio: true // Incluir la relación con lista de precios
        },
        orderBy: {
          productoId: 'desc'
        }
      }),
      prisma.producto.count({ where })
    ])

    // Formatear los productos para incluir la información de la lista de precios
    const productosFormateados = productos.map(producto => ({
      ...producto,
      tipo: producto.esPaquete ? 'Paquete' : 'Ensayo',
      listaPrecio: producto.listaPrecio
        ? {
            id: producto.listaPrecio.id,
            nombre: producto.listaPrecio.nombre,
            precio: producto.listaPrecio.precio
          }
        : null
    }))

    return NextResponse.json({
      productos: productosFormateados,
      meta: {
        total,
        page,
        limit
      }
    })
  } catch (error) {
    console.error('Error:', error)

    return new NextResponse(JSON.stringify({ error: 'Error al obtener productos' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
