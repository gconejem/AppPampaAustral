import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 })
    }

    const body = await req.json()
    const { productoId, createdAt, updatedAt, productosEnPaquete, paquetesQueLoIncluyen, ...updateData } = body

    const producto = await prisma.producto.update({
      where: {
        productoId: parseInt(params.id)
      },
      data: updateData
    })

    return NextResponse.json(producto)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
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
        OR: [
          { productoId: parseInt(params.id) },
          { paqueteId: parseInt(params.id) }
        ]
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
