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
          select: {
            id: true,
            cotizacionId: true,
            productoId: true,
            cantidad: true,
            precioUnitario: true,
            descuento: true,
            subtotal: true,
            esPaquete: true,
            esSubProducto: true,
            paqueteId: true,
            descripcionPersonalizada: true,
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

    // Procesar detalles para asociar subproductos con sus paquetes
    const detallesConSubproductos = cotizacion.detalles.map(detalle => {
      if (detalle.esPaquete) {
        // Buscar los subproductos que pertenecen a este paquete
        const subproductos = cotizacion.detalles.filter(d => d.paqueteId === detalle.id)
        return {
          ...detalle,
          subproductos: subproductos
        }
      }
      return detalle
    })

    // Crear la respuesta con los detalles procesados
    const cotizacionProcesada = {
      ...cotizacion,
      detalles: detallesConSubproductos
    }

    // Agregar logs detallados
    console.log('Cotización completa:', JSON.stringify(cotizacionProcesada, null, 2))
    console.log('Detalles de la cotización:', JSON.stringify(cotizacionProcesada.detalles, null, 2))

    if (cotizacionProcesada.detalles?.length > 0) {
      cotizacionProcesada.detalles.forEach((detalle, index) => {
        console.log(`Detalle ${index + 1}:`, {
          productoId: detalle.productoId,
          paqueteId: detalle.paqueteId,
          esPaquete: detalle.esPaquete,
          esSubProducto: detalle.esSubProducto,
          producto: detalle.producto,
          productosEnPaquete: detalle.producto?.productosEnPaquete,
          subproductos: (detalle as any).subproductos?.length || 0
        })
      })
    }

    return NextResponse.json(cotizacionProcesada)
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
        subtotal: body.subtotal || 0,
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
        precioProducto: body.precioProducto || false,
        precioTotal: body.precioTotal || false,
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
          antecedentesGeneral: body.antecedentesGeneral || '',
          plazoEntregaGeneral: body.plazoEntregaGeneral || ''
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
      console.log('Insertando detalles en la BD (orden original):', detallesArray)
      // Mapeo temporal para traducir productoId del paquete a id real del detalle del paquete
      const mapProductoIdToDetalleId: Record<number, number> = {}

      console.log('Detalles a procesar:', detallesArray.map((d: any) => ({
        productoId: d.productoId,
        esPaquete: d.esPaquete,
        esSubProducto: d.esSubProducto,
        paqueteId: d.paqueteId
      })))

      for (const detalle of detallesArray) {
        console.log('Procesando detalle:', {
          productoId: detalle.productoId,
          esPaquete: detalle.esPaquete,
          esSubProducto: detalle.esSubProducto,
          paqueteId: detalle.paqueteId,
          mapeoActual: mapProductoIdToDetalleId
        })

        let paqueteIdReal = null
        if (detalle.paqueteId) {
          paqueteIdReal = mapProductoIdToDetalleId[detalle.paqueteId] || null
          console.log(`Buscando paqueteId ${detalle.paqueteId} en mapeo: ${paqueteIdReal}`)
        }

        const detalleCreado = await prisma.detalleCotizacion.create({
          data: {
            cotizacionId: id,
            productoId: detalle.productoId,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuento: detalle.descuento || 0,
            subtotal: detalle.subtotal,
            esPaquete: detalle.esPaquete || false,
            esSubProducto: detalle.esSubProducto || false,
            paqueteId: paqueteIdReal,
            descripcionPersonalizada: detalle.descripcionPersonalizada || null
          }
        })

        console.log('Detalle creado:', {
          id: detalleCreado.id,
          productoId: detalleCreado.productoId,
          esPaquete: detalleCreado.esPaquete,
          esSubProducto: detalleCreado.esSubProducto,
          paqueteId: detalleCreado.paqueteId
        })

        // Si es paquete, guardar el id generado para los subproductos siguientes
        if (detalle.esPaquete) {
          mapProductoIdToDetalleId[detalle.productoId] = detalleCreado.id
          console.log(`Guardando en mapeo: productoId ${detalle.productoId} -> detalleId ${detalleCreado.id}`)
          console.log('Mapeo actual:', mapProductoIdToDetalleId)
        }

        // Si es subproducto, mostrar el paqueteId asignado
        if (detalle.esSubProducto) {
          console.log(`Subproducto creado: productoId ${detalle.productoId} -> paqueteId ${paqueteIdReal}`)
        }
      }
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
