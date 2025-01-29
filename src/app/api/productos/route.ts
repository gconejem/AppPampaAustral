import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'

import { prisma } from '@/lib/prisma'

// POST - Crear un nuevo producto
export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log('Datos recibidos en API:', data)
    console.log('Precio recibido:', data.precio)

    // Verificar si el SKU ya existe
    const existingProduct = await prisma.producto.findUnique({
      where: { sku: data.sku }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Ya existe un producto con este SKU' },
        { status: 400 }
      )
    }

    // Asegurarnos que el precio sea un número válido
    const precio = typeof data.precio === 'number' ? data.precio : 0

    // Crear el producto
    const producto = await prisma.producto.create({
      data: {
        sku: data.sku,
        nombre: data.nombre,
        descripcion: data.descripcion || '',
        area: data.area || '',
        familia: data.familia || '',
        tipo: data.tipo || 'Ensayo',
        esPaquete: data.esPaquete || false,
        estado: 'ACTIVO',
        norma: data.norma || '',
        aplicaImpuesto: data.aplicaImpuesto || false,
        precio: new Decimal(precio), // Usar el precio validado
        listasPrecios: {
          create: data.listaPrecio ? {
            listaPrecioId: data.listaPrecio,
            precio: new Decimal(precio), // Usar el mismo precio validado
            activo: true
          } : undefined
        }
      }
    })

    console.log('Producto creado:', producto)
    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error detallado:', error)
    return NextResponse.json(
      { error: 'Error al crear producto: ' + error.message },
      { status: 500 }
    )
  }
}

// GET - Obtener todos los productos
export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      where: {
        estado: 'ACTIVO'  // Solo productos activos
      },
      select: {
        productoId: true,
        sku: true,
        nombre: true,
        precio: true,
        tipo: true,
        estado: true
      }
    })

    // Transformar los precios Decimal a números
    const productosFormateados = productos.map(producto => ({
      ...producto,
      precio: Number(producto.precio)
    }))

    console.log('Productos enviados:', productosFormateados)
    return NextResponse.json(productosFormateados)
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}
