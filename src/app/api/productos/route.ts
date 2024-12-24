import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST - Crear un nuevo producto
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productosEnPaquete, ...productoData } = body

    // Validar campos requeridos
    const camposRequeridos = ['sku', 'nombre', 'area', 'familia', 'tipo', 'precio']
    const camposFaltantes = camposRequeridos.filter(campo => !productoData[campo])

    if (camposFaltantes.length > 0) {
      return NextResponse.json(
        { error: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar que el precio sea un número válido
    if (isNaN(productoData.precio) || productoData.precio <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser un número válido mayor a 0' },
        { status: 400 }
      )
    }

    // Validar límite del precio
    if (productoData.precio >= 100000000) {
      return NextResponse.json(
        { error: 'El precio no puede ser mayor a 99,999,999.99' },
        { status: 400 }
      )
    }

    // Redondear el precio a 2 decimales
    productoData.precio = Math.round(productoData.precio * 100) / 100

    // Validar que el SKU sea único
    const existingSku = await prisma.producto.findUnique({
      where: { sku: productoData.sku }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: 'El SKU ya existe' },
        { status: 400 }
      )
    }

    // Si es un paquete, validar que los productos existan
    if (productoData.esPaquete && Array.isArray(productosEnPaquete)) {
      if (productosEnPaquete.length === 0) {
        return NextResponse.json(
          { error: 'Un paquete debe contener al menos un producto' },
          { status: 400 }
        )
      }

      // Verificar que todos los productos existen
      const productos = await prisma.producto.findMany({
        where: {
          productoId: {
            in: productosEnPaquete
          }
        }
      })

      if (productos.length !== productosEnPaquete.length) {
        return NextResponse.json(
          { error: 'Algunos productos seleccionados no existen' },
          { status: 400 }
        )
      }

      // Verificar que ninguno sea un paquete
      const hayPaquetes = productos.some((p: { esPaquete: boolean }) => p.esPaquete)
      if (hayPaquetes) {
        return NextResponse.json(
          { error: 'No se pueden incluir paquetes dentro de un paquete' },
          { status: 400 }
        )
      }
    }

    // Crear el producto
    const producto = await prisma.producto.create({
      data: productoData
    })

    // Si es un paquete y tiene productos asociados, crear las relaciones
    if (producto.esPaquete && Array.isArray(productosEnPaquete) && productosEnPaquete.length > 0) {
      await prisma.productoPaquete.createMany({
        data: productosEnPaquete.map(productoId => ({
          paqueteId: producto.productoId,
          productoId
        }))
      })

      // Retornar el producto con sus relaciones
      const productoConRelaciones = await prisma.producto.findUnique({
        where: { productoId: producto.productoId },
        include: {
          productosEnPaquete: {
            include: {
              producto: true
            }
          }
        }
      })

      return NextResponse.json(productoConRelaciones)
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}

// GET - Obtener todos los productos con paginación
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const esPaquete = searchParams.get('esPaquete')

    const whereClause: any = {}
    if (esPaquete !== null) {
      whereClause.esPaquete = esPaquete === 'true'
    }

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.producto.count({
        where: whereClause
      })
    ])

    return NextResponse.json({
      productos,
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
