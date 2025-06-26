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

    console.log('Datos recibidos en PUT:', body)

    // Validar que el estado sea uno válido
    if (body.estado && !Object.values(EstadoCotizacion).includes(body.estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    // Actualizar la cotización con todos los campos editables
    const cotizacionActualizada = await prisma.cotizacion.update({
      where: { id },
      data: {
        estado: body.estado,
        nombreProyecto: body.nombreProyecto,
        empresa: body.empresa,
        ubicacion: body.ubicacion,
        tipoCotizacion: body.tipoCotizacion,
        version: body.version,
        subtotal: body.subtotal,
        descuento: body.descuento,
        impuesto: body.impuesto,
        total: body.total,
        observaciones: body.observaciones,
        notas: body.notas,
        formaPago: body.formaPago,
        observacionGestion: body.gestionText || undefined,
        contacto: body.contactoId ? { connect: { contactId: body.contactoId } } : undefined,
        listaPrecio: body.listaPrecioId ? { connect: { id: body.listaPrecioId } } : undefined,
        sinCantidad: body.sinCantidad || false,
        // Incluir campos EMS solo si el tipo es B
        ...(body.tipoCotizacion === 'B' && {
          superficieEMS: body.superficieEMS || '',
          antecedentesEMS: body.antecedentesEMS || '',
          plazoEntregaEMS: body.plazoEntregaEMS || ''
        }),
        // Incluir campos mensuales solo si el tipo es C
        ...(body.tipoCotizacion === 'C' && {
          duracionMensual: body.duracionMensual || '',
          jornadaMensual: body.jornadaMensual || '',
          antecedentesMensual: body.antecedentesMensual || '',
          alcanceServicio: body.alcanceServicio || ''
        }),
        // Incluir campos de tipo D
        ...(body.tipoCotizacion === 'D' && {
          textoGeneral: body.textoGeneral || '',
          subtotal: body.totalNetoGeneral || 0
        }),
        updatedAt: new Date()
      }
    })

    console.log('Cotización actualizada:', cotizacionActualizada)

    // Procesar detalles: eliminar los anteriores y crear los nuevos
    const detallesArray = Array.isArray(body.detalles)
      ? body.detalles
      : body.detalles && Array.isArray(body.detalles.create)
        ? body.detalles.create
        : []

    console.log('Detalles a insertar:', detallesArray)

    // Eliminar detalles anteriores
    await prisma.detalleCotizacion.deleteMany({ where: { cotizacionId: id } })

    // Insertar nuevos detalles si existen
    if (detallesArray.length > 0) {
      const detallesCreados = await prisma.detalleCotizacion.createMany({
        data: detallesArray.map((detalle: any) => ({
          cotizacionId: id,
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          descuento: detalle.descuento || 0,
          subtotal: detalle.subtotal,
          esPaquete: detalle.esPaquete || false,
          esSubProducto: detalle.esSubProducto || false,
          paqueteId: detalle.paqueteId || null
        }))
      })

      console.log('Detalles creados:', detallesCreados)
    }

    // Traer la cotización actualizada con detalles y relaciones
    const cotizacionConDetalles = await prisma.cotizacion.findUnique({
      where: { id },
      include: {
        cliente: true,
        obra: true,
        contacto: true,
        listaPrecio: true,
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

    console.log('Cotización final con detalles:', cotizacionConDetalles)

    return NextResponse.json(cotizacionConDetalles)
  } catch (error) {
    console.error('Error al actualizar la cotización:', error)

    return NextResponse.json({ error: 'Error al actualizar la cotización' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    console.log('Datos recibidos en PATCH:', body)

    // Validar que el estado sea uno válido si se está actualizando
    if (body.estado && !Object.values(EstadoCotizacion).includes(body.estado)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }

    // Actualizar solo los campos proporcionados
    const cotizacionActualizada = await prisma.cotizacion.update({
      where: { id },
      data: {
        ...(body.estado && { estado: body.estado }),
        ...(body.gestionText && { observacionGestion: body.gestionText }),
        updatedAt: new Date()
      }
    })

    // Traer la cotización actualizada con todos sus detalles y relaciones
    const cotizacionConDetalles = await prisma.cotizacion.findUnique({
      where: { id },
      include: {
        cliente: true,
        obra: true,
        contacto: true,
        listaPrecio: true,
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

    return NextResponse.json(cotizacionConDetalles)
  } catch (error) {
    console.error('Error al actualizar parcialmente la cotización:', error)
    return NextResponse.json({ error: 'Error al actualizar parcialmente la cotización' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const cotizacion = await prisma.cotizacion.findUnique({ where: { id } })

    if (!cotizacion) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    if (cotizacion.estado !== 'BORRADOR') {
      return NextResponse.json({ error: 'Solo se pueden eliminar cotizaciones en estado BORRADOR' }, { status: 400 })
    }

    await prisma.detalleCotizacion.deleteMany({ where: { cotizacionId: id } })
    await prisma.cotizacion.delete({ where: { id } })

    return NextResponse.json({ message: 'Cotización eliminada correctamente' })
  } catch (error) {
    console.error('Error al eliminar la cotización:', error)

    return NextResponse.json({ error: 'Error al eliminar la cotización' }, { status: 500 })
  }
}
