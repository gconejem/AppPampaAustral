import { NextResponse } from 'next/server'

import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// POST - Crear un nuevo producto
export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log('Datos recibidos en API:', body)

    // Verificar si el SKU ya existe
    const existingProduct = await prisma.producto.findUnique({
      where: { sku: body.sku }
    })

    if (existingProduct) {
      return NextResponse.json({ error: 'Ya existe un producto con este SKU' }, { status: 400 })
    }

    // Verificar si existe la lista de precios
    if (body.listaPrecio) {
      const listaPrecio = await prisma.listaPrecio.findFirst({
        where: { id: body.listaPrecio }
      })

      if (!listaPrecio) {
        return NextResponse.json(
          { error: `No existe una lista de precios con ID ${body.listaPrecio}` },
          { status: 400 }
        )
      }
    }

    // Si es un paquete, verificar que los productos existan
    if (body.esPaquete && body.productos) {
      const productIds = body.productos.map((p: { productoId: number }) => p.productoId)

      const existingProducts = await prisma.producto.findMany({
        where: {
          productoId: {
            in: productIds
          }
        }
      })

      if (existingProducts.length !== productIds.length) {
        return NextResponse.json({ error: 'Uno o más productos no existen' }, { status: 400 })
      }
    }

    // Crear el producto
    const producto = await prisma.producto.create({
      data: {
        sku: body.sku,
        nombre: body.nombre,
        descripcion: body.descripcion || '',
        area: body.area || '',
        familia: body.familia || '',
        tipo: body.tipo || 'Ensayo',
        esPaquete: body.esPaquete || false,
        estado: 'ACTIVO',
        norma: body.norma || '',
        aplicaImpuesto: body.aplicaImpuesto || false,
        precio: body.precio ? new Prisma.Decimal(body.precio) : new Prisma.Decimal(0),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Si se especificó una lista de precios, crear la relación
    if (body.listaPrecio) {
      await prisma.productoListaPrecio.create({
        data: {
          listaPrecio: {
            connect: { id: Number(body.listaPrecio) }
          },
          producto: {
            connect: { productoId: producto.productoId }
          },
          precio: body.precio ? new Prisma.Decimal(body.precio) : new Prisma.Decimal(0),
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    // Si es un paquete, crear las relaciones con los productos
    if (body.esPaquete && body.productos) {
      await prisma.productoPaquete.createMany({
        data: body.productos.map((p: { productoId: number; cantidad: number }) => ({
          paqueteId: producto.productoId,
          productoId: p.productoId,
          cantidad: p.cantidad || 1
        }))
      })
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error detallado:', error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'Ya existe un producto con este SKU' }, { status: 400 })
      }

      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'La lista de precios especificada no existe' }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Error al crear el producto', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET - Obtener productos paginados y el total
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const skip = (page - 1) * limit
    const area = searchParams.get('area') || undefined
    const tipo = searchParams.get('tipo') || undefined
    const familia = searchParams.get('familia') || undefined

    // Construir el objeto where para filtrar
    const where: any = { estado: 'ACTIVO' }

    if (area) where.area = area
    if (tipo) where.tipo = tipo
    if (familia) where.familia = familia

    // Total de productos activos con filtros
    const total = await prisma.producto.count({ where })

    // Productos paginados con filtros
    const productos = await prisma.producto.findMany({
      where,
      skip,
      take: limit,
      include: {
        productosEnPaquete: {
          include: { producto: true }
        },
        listasPrecios: {
          select: { listaPrecioId: true, precio: true }
        }
      }
    })

    return NextResponse.json({ productos, total })
  } catch (error) {
    console.error('Error al obtener productos:', error)

    return NextResponse.json({ error: 'Error al obtener los productos' }, { status: 500 })
  }
}
