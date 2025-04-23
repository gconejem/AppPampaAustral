import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      orderBy: {
        fechaCreacion: 'desc'
      },
      include: {
        cliente: {
          select: {
            nombreCliente: true,
            comuna: true
          }
        },
        contacto: {
          include: {
            contacto: true
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
        totalType: typeof cotizacion.total,
        contactoId: cotizacion.contactoId,
        contactoDatos: cotizacion.contacto?.contacto?.nombre
      })

      // Mapear los valores de tipoCotizacion
      let tipoMapeado: string

      switch (cotizacion.tipoCotizacion) {
        case 'A':
          tipoMapeado = 'VALORES_UNITARIOS'
          break
        case 'B':
          tipoMapeado = 'EMS'
          break
        case 'C':
          tipoMapeado = 'MENSUAL'
          break
        default:
          tipoMapeado = cotizacion.tipoCotizacion || 'VALORES_UNITARIOS'
      }

      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        cliente: cotizacion.cliente?.nombreCliente || 'Sin cliente',
        fecha: cotizacion.fechaCreacion.toLocaleDateString(),
        estado: cotizacion.estado,
        tipo: tipoMapeado,
        contacto: cotizacion.contacto?.contacto?.nombre || 'Sin contacto',
        comuna: cotizacion.cliente?.comuna || cotizacion.ubicacion?.split(',').pop()?.trim() || 'No especificada',
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
    const body = await req.json()

    console.log('Datos recibidos en API:', body)
    console.log('Detalles recibidos:', JSON.stringify(body.detalles, null, 2))

    // Validar que los datos necesarios existan
    if (!body.detalles || !Array.isArray(body.detalles)) {
      throw new Error('Los detalles de la cotización son inválidos')
    }

    // Mapear los valores de tipoCotizacion a los aceptados por el enum en la base de datos
    let tipoCotizacionMapeado: string

    switch (body.tipoCotizacion) {
      case 'VALORES_UNITARIOS':
        tipoCotizacionMapeado = 'A'
        break
      case 'EMS':
        tipoCotizacionMapeado = 'B'
        break
      case 'MENSUAL':
        tipoCotizacionMapeado = 'C'
        break
      default:
        tipoCotizacionMapeado = 'A' // Valor por defecto
    }

    const result = await prisma.cotizacion.create({
      data: {
        numeroCotizacion: body.numeroCotizacion,
        tipoCotizacion: tipoCotizacionMapeado as any,
        estado: body.estado,
        fechaInicio: new Date(body.fechaInicio),
        fechaFin: new Date(body.fechaFin),
        nombreProyecto: body.nombreProyecto,
        empresa: body.empresa,
        ubicacion: body.ubicacion,
        formaPago: body.formaPago,
        clienteId: body.clienteId,
        obraId: body.obraId,
        subtotal: body.subtotal,
        descuento: body.descuento,
        impuesto: body.impuesto,
        total: body.total,
        observaciones: body.observaciones,
        detalles: {
          create: body.detalles.map((detalle: any) => {
            // Calcular el subtotal si es null
            const subtotal =
              detalle.subtotal ?? detalle.cantidad * detalle.precioUnitario * (1 - (detalle.descuento || 0) / 100)

            return {
              productoId: parseInt(detalle.productoId),
              cantidad: parseInt(detalle.cantidad),
              precioUnitario: parseFloat(detalle.precioUnitario),
              descuento: parseFloat(detalle.descuento || '0'),
              subtotal: parseFloat(subtotal.toString())
            }
          })
        }
      },
      include: {
        detalles: true
      }
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Error al crear cotización:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al crear la cotización'
      },
      {
        status: 500
      }
    )
  }
}
