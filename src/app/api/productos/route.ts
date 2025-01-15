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
    const search = searchParams.get('search') || ''
    const tipo = searchParams.get('tipo') || ''
    const familia = searchParams.get('familia') || ''
    const area = searchParams.get('area') || ''

    const skip = (page - 1) * limit

    // Construir el where dinámicamente
    const where = {
      AND: [
        {
          OR: [
            { nombre: { contains: search, mode: 'insensitive' } },
            { codigo: { contains: search, mode: 'insensitive' } }
          ]
        },
        tipo ? { tipoId: parseInt(tipo) } : {},
        familia ? { familiaId: parseInt(familia) } : {},
        area ? { areaId: parseInt(area) } : {}
      ]
    }

    // Obtener total de registros
    const total = await prisma.producto.count({ where })

    // Obtener productos con paginación
    const productos = await prisma.producto.findMany({
      where,
      include: {
        tipo: true,
        familia: true,
        area: true,
        precios: {
          orderBy: {
            fechaVigencia: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        nombre: 'asc'
      },
      skip,
      take: limit
    })

    // Formatear la respuesta
    const formattedProductos = productos.map(producto => ({
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      tipo: producto.tipo?.nombre || '',
      familia: producto.familia?.nombre || '',
      area: producto.area?.nombre || '',
      precioActual: producto.precios[0]?.valor || 0,
      estado: producto.estado
    }))

    return NextResponse.json({
      productos: formattedProductos,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error al obtener productos:', error)

    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
