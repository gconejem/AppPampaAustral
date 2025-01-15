import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET - Obtener un producto específico
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 })
    }

    const producto = await prisma.producto.findUnique({
      where: {
        productoId: parseInt(params.id)
      },
      include: {
        productosEnPaquete: {
          include: {
            producto: true
          }
        },
        paquetesQueLoIncluyen: {
          include: {
            paquete: true
          }
        }
      }
    })

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al obtener producto:', error)

    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 })
  }
}

// PUT - Actualizar un producto
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const data = await request.json()

    console.log('Actualizando producto:', { id, data })

    // Limpiar los datos antes de actualizar
    const {
      productoId,
      createdAt,
      updatedAt,
      listaPrecio,
      listaPrecios,
      productosEnPaquete,
      paquetesQueLoIncluyen,
      ...updateData
    } = data

    const producto = await prisma.producto.update({
      where: {
        productoId: id
      },
      data: {
        nombre: updateData.nombre,
        sku: updateData.sku,
        descripcion: updateData.descripcion,
        area: updateData.area,
        familia: updateData.familia,
        tipo: updateData.tipo,
        precio: typeof updateData.precio === 'string' ? parseFloat(updateData.precio) : updateData.precio,
        norma: updateData.norma,
        aplicaImpuesto: updateData.aplicaImpuesto,
        listaPrecioId: updateData.listaPrecioId ? parseInt(updateData.listaPrecioId) : null
      },
      include: {
        listaPrecio: true // Incluir la relación con listaPrecio
      }
    })

    console.log('Producto actualizado:', producto)

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al actualizar producto:', error)

    return new NextResponse(JSON.stringify({ error: 'Error al actualizar el producto' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

// DELETE - Eliminar un producto
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 })
    }

    // Verificar que el producto existe
    const productoExists = await prisma.producto.findUnique({
      where: {
        productoId: parseInt(params.id)
      }
    })

    if (!productoExists) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Eliminar las relaciones de paquetes
    await prisma.productoPaquete.deleteMany({
      where: {
        OR: [{ productoId: parseInt(params.id) }, { paqueteId: parseInt(params.id) }]
      }
    })

    // Eliminar el producto
    await prisma.producto.delete({
      where: {
        productoId: parseInt(params.id)
      }
    })

    return NextResponse.json({ message: 'Producto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar producto:', error)

    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}

function isValidId(id: string): boolean {
  return !isNaN(parseInt(id)) && parseInt(id) > 0
}
