import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      orderBy: {
        fechaCreacion: 'desc'
      },
      include: {
        cliente: {
          select: {
            nombreCliente: true
          }
        }
      }
    })

    // Log para ver los datos crudos
    console.log('Datos crudos de cotizaciones:', JSON.stringify(cotizaciones, null, 2))

    const formattedCotizaciones = cotizaciones.map(cotizacion => {
      // Log para ver cada cotización individual
      console.log('Cotización individual:', {
        id: cotizacion.id,
        total: cotizacion.total,
        totalType: typeof cotizacion.total
      })

      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        cliente: cotizacion.cliente?.nombreCliente || 'Sin cliente',
        fecha: cotizacion.fechaCreacion.toLocaleDateString(),
        estado: cotizacion.estado,
        total: parseFloat(cotizacion.total.toString()) // Convertir el Decimal a número
      }
    })

    console.log('Cotizaciones formateadas:', formattedCotizaciones)
    return NextResponse.json(formattedCotizaciones)
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log('Datos recibidos en API:', data)

    // Los detalles ya vienen con la estructura correcta
    const cotizacion = await prisma.cotizacion.create({
      data: {
        numeroCotizacion: data.numeroCotizacion,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        estado: data.estado,
        tipoCotizacion: data.tipoCotizacion,
        clienteId: data.clienteId,
        obraId: data.obraId,
        contactoId: data.contactoId,
        vendedorId: data.vendedorId,
        observaciones: data.observaciones,
        subtotal: data.subtotal,
        descuento: data.descuento,
        impuesto: data.impuesto,
        total: data.total,
        detalles: {
          create: data.detalles.create.map((detalle: any) => ({
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
    console.error('Error detallado:', error)
    return NextResponse.json(
      { error: 'Error al crear cotización: ' + error.message },
      { status: 500 }
    )
  }
}
