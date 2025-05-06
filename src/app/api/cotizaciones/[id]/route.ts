import { NextResponse } from 'next/server'

import { EstadoCotizacion } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id },
      include: {
        cliente: true,
        obra: true,
        contacto: true,
        detalles: {
          include: {
            producto: {
              select: {
                productoId: true,
                nombre: true,
                descripcion: true,
                area: true,
                norma: true,
                precio: true,
                esPaquete: true,
                productosEnPaquete: {
                  include: {
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
            }
          }
        }
      }
    })

    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Agregar logs detallados
    console.log('Cotización completa:', JSON.stringify(cotizacion, null, 2))
    console.log('Detalles de la cotización:', JSON.stringify(cotizacion.detalles, null, 2))

    if (cotizacion.detalles?.length > 0) {
      cotizacion.detalles.forEach((detalle, index) => {
        console.log(`Detalle ${index + 1}:`, {
          productoId: detalle.productoId,
          producto: detalle.producto,
          productosEnPaquete: detalle.producto?.productosEnPaquete
        })
      })
    }

    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error('Error al obtener la cotización:', error)

    return NextResponse.json({ error: 'Error al obtener la cotización' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    // Validar que el estado sea uno válido
    if (body.estado && !Object.values(EstadoCotizacion).includes(body.estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    const cotizacion = await prisma.cotizacion.update({
      where: { id },
      data: {
        estado: body.estado,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error('Error al actualizar la cotización:', error)

    return NextResponse.json({ error: 'Error al actualizar la cotización' }, { status: 500 })
  }
}
