import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    const data = await req.json()

    const cotizacion = await prisma.cotizacion.update({
      where: { id },
      data: {
        tipoCotizacion: data.tipoCotizacion,
        estado: data.estado,
        clienteId: data.clienteId,
        obraId: data.obraId,
        contactoId: data.contacto?.id,
        observaciones: data.observaciones,
        detalles: {
          deleteMany: {},
          create: data.detalles.map((detalle: any) => ({
            productoId: detalle.productoId,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            descuento: detalle.descuento,
            subtotal: detalle.subtotal
          }))
        }
      },
      include: {
        cliente: true,
        obra: true,
        contacto: true,
        detalles: {
          include: {
            producto: true
          }
        }
      }
    })

    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error('Error al actualizar cotización:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
            producto: true
          }
        }
      }
    })

    if (!cotizacion) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(cotizacion)
  } catch (error) {
    console.error('Error al obtener cotización:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotización' },
      { status: 500 }
    )
  }
}
