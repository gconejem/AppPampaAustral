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
      listasPrecios,
      listaPrecioId,
      precio,
      productosEnPaquete,
      ...productoData
    } = data

    // Actualizar el producto
    const updatedProduct = await prisma.producto.update({
      where: {
        productoId: id
      },
      data: {
        ...productoData,

        // Actualizar lista de precios si se proporciona
        ...(listaPrecioId && precio
          ? {
              listasPrecios: {
                upsert: {
                  where: {
                    productoId_listaPrecioId: {
                      productoId: id,
                      listaPrecioId
                    }
                  },
                  create: {
                    listaPrecioId,
                    precio,
                    activo: true
                  },
                  update: {
                    precio,
                    activo: true
                  }
                }
              }
            }
          : {}),

        // Actualizar productos en el paquete
        ...(productosEnPaquete
          ? {
              productosEnPaquete: {
                deleteMany: {}, // Primero eliminar todas las relaciones existentes
                createMany: {
                  // Luego crear las nuevas relaciones
                  data: productosEnPaquete.map((p: { productoId: number }) => ({
                    productoId: p.productoId
                  }))
                }
              }
            }
          : {})
      },
      include: {
        listasPrecios: {
          include: {
            listaPrecio: true
          }
        },
        productosEnPaquete: {
          include: {
            producto: true
          }
        }
      }
    })

    return NextResponse.json(updatedProduct)
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
          precio: precio ? parseFloat(precio) : null
        },
        create: {
          productoId,
          listaPrecioId,
          activo: activoEnLista,
          precio: precio ? parseFloat(precio) : null
        }
      })
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
