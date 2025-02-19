import { NextResponse } from 'next/server'

import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// POST - Crear un nuevo producto
export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log('Datos recibidos en API:', body)
    console.log('Precio recibido:', body.precio)

    // Verificar si el SKU ya existe
    const existingProduct = await prisma.producto.findUnique({
      where: { sku: body.sku }
    })

    if (existingProduct) {
      return NextResponse.json({ error: 'Ya existe un producto con este SKU' }, { status: 400 })
    }

    // Verificar si existe la lista de precios antes de crear el producto
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
        precio: new Prisma.Decimal(body.precio),
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
          precio: new Prisma.Decimal(body.precio),
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
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

// GET - Obtener todos los productos
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: {
        estado: 'ACTIVO' // Solo productos activos
      },
      select: {
        productoId: true,
        sku: true,
        nombre: true,
        descripcion: true,
        area: true,
        familia: true,
        tipo: true,
        norma: true,
        precio: true,
        esPaquete: true,
        estado: true,
        aplicaImpuesto: true,

        // Incluir los productos que forman parte del paquete
        productosEnPaquete: {
          select: {
            cantidad: true,
            producto: {
              select: {
                productoId: true,
                nombre: true,
                descripcion: true,
                area: true,
                norma: true,
                precio: true
              }
            }
          }
        }
      }
    })

    // Transformar los precios Decimal a números
    const productosFormateados = productos.map(producto => ({
      ...producto,
      precio: Number(producto.precio),
      productosEnPaquete: producto.productosEnPaquete.map(pp => ({
        ...pp,
        producto: {
          ...pp.producto,
          precio: Number(pp.producto.precio)
        }
      }))
    }))

    console.log('Productos enviados:', productosFormateados)

    return NextResponse.json(productosFormateados)
  } catch (error) {
    console.error('Error al obtener productos:', error)

    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
