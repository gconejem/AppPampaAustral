import { NextResponse } from 'next/server'

import { Decimal } from '@prisma/client/runtime/library'

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
    const productoId = parseInt(params.id)
    const data = await request.json()

    console.log('Actualizando producto:', {
      id: productoId,
      data: data
    })

    // Asegurarnos que el precio sea un número válido
    const precio = typeof data.precio === 'string' ? parseFloat(data.precio) : data.precio

    const updatedProduct = await prisma.producto.update({
      where: {
        productoId: productoId
      },
      data: {
        sku: data.sku,
        nombre: data.nombre,
        descripcion: data.descripcion,
        area: data.area,
        familia: data.familia,
        esPaquete: data.esPaquete,
        tipo: data.tipo,
        estado: data.estado,
        norma: data.norma,
        aplicaImpuesto: data.aplicaImpuesto,
        precio: new Decimal(precio),
        updatedAt: new Date(),
        listasPrecios: {
          upsert: {
            where: {
              productoId_listaPrecioId: {
                productoId: productoId,
                listaPrecioId: data.listaPrecioId || 1
              }
            },
            create: {
              listaPrecioId: data.listaPrecioId || 1,
              precio: new Decimal(precio),
              activo: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            update: {
              precio: new Decimal(precio),
              updatedAt: new Date()
            }
          }
        }
      },
      include: {
        listasPrecios: {
          include: {
            listaPrecio: true
          }
        }
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error al actualizar producto:', error)

    return NextResponse.json({ error: 'Error al actualizar producto: ' + error.message }, { status: 500 })
  }
}

// DELETE - Eliminar un producto
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!isValidId(params.id)) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 })
    }

    const productoId = parseInt(params.id)

    // Verificar que el producto existe
    const productoExists = await prisma.producto.findUnique({
      where: { productoId }
    })

    if (!productoExists) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Eliminar en orden para manejar las dependencias
    // 1. Eliminar relaciones con listas de precios
    await prisma.productoListaPrecio.deleteMany({
      where: { productoId }
    })

    // 2. Eliminar relaciones de paquetes
    await prisma.productoPaquete.deleteMany({
      where: {
        OR: [{ productoId }, { paqueteId: productoId }]
      }
    })

    // 3. Finalmente eliminar el producto
    await prisma.producto.delete({
      where: { productoId }
    })

    return NextResponse.json({ message: 'Producto eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar producto:', error)

    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const productoId = parseInt(params.id)
    const { activoEnLista, precio, listaPrecioId } = body

    if (listaPrecioId) {
      // Actualizar o crear la relación producto-lista de precios
      await prisma.productoListaPrecio.upsert({
        where: {
          productoId_listaPrecioId: {
            productoId,
            listaPrecioId
          }
        },
        update: {
          activo: activoEnLista,
          precio: precio ? parseFloat(precio) : null,
          updatedAt: new Date()
        },
        create: {
          productoId,
          listaPrecioId,
          activo: activoEnLista,
          precio: precio ? parseFloat(precio) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Obtener el producto actualizado con sus relaciones
      const productoActualizado = await prisma.producto.findUnique({
        where: { productoId },
        include: {
          listasPrecios: {
            include: {
              listaPrecio: true
            }
          }
        }
      })

      return NextResponse.json(productoActualizado)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)

    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 })
  }
}

function isValidId(id: string): boolean {
  return !isNaN(parseInt(id)) && parseInt(id) > 0
}
