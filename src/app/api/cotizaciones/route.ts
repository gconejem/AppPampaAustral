import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { TipoCotizacion } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// Función auxiliar para normalizar el tipo de cotización
const normalizeTipoCotizacion = (tipo: string): TipoCotizacion => {
  if (!tipo) return 'A'

  const normalizedTipo = tipo.toUpperCase().trim()

  switch (normalizedTipo) {
    case 'A':
    case 'VALORES_UNITARIOS':
      return 'A'
    case 'B':
    case 'EMS':
      return 'B'
    case 'C':
    case 'MENSUAL':
      return 'C'
    case 'D':
    case 'GENERICA':
      return 'D'
    default:
      return 'A'
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    const parseYmdToUtc = (ymd: string, endOfDay: boolean) => {
      const value = String(ymd || '').trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null

      const [y, m, d] = value.split('-').map(Number)
      const hour = endOfDay ? 23 : 0
      const min = endOfDay ? 59 : 0
      const sec = endOfDay ? 59 : 0
      const ms = endOfDay ? 999 : 0
      const date = new Date(Date.UTC(y, m - 1, d, hour, min, sec, ms))
      return Number.isFinite(date.getTime()) ? date : null
    }

    const whereClause: any = {}

    if (fechaInicio || fechaFin) {
      whereClause.fechaCreacion = {}
      if (fechaInicio) {
        const inicioDate = parseYmdToUtc(fechaInicio, false)
        if (inicioDate) {
          whereClause.fechaCreacion.gte = inicioDate
        }
      }
      if (fechaFin) {
        const finDate = parseYmdToUtc(fechaFin, true)
        if (finDate) {
          whereClause.fechaCreacion.lte = finDate
        }
      }

      if (Object.keys(whereClause.fechaCreacion).length === 0) {
        delete whereClause.fechaCreacion
      }
    }

    console.log('=== FILTROS DE FECHA ===')
    console.log('Parámetros recibidos:', { fechaInicio, fechaFin })
    console.log('Rango UTC aplicado:', {
      desde: whereClause.fechaCreacion?.gte ? whereClause.fechaCreacion.gte.toISOString() : null,
      hasta: whereClause.fechaCreacion?.lte ? whereClause.fechaCreacion.lte.toISOString() : null
    })

    const cotizaciones = await prisma.cotizacion.findMany({
      where: whereClause,
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
        contacto: true
      }
    })

    console.log('=== RESULTADOS ===')
    console.log('Total cotizaciones encontradas:', cotizaciones.length)

    // Log detallado de todas las cotizaciones para debug
    if (cotizaciones.length > 0) {
      console.log('Cotizaciones encontradas:')
      cotizaciones.forEach(c => {
        console.log(`  - ${c.numeroCotizacion}: ${c.fechaCreacion.toISOString()} (${c.fechaCreacion.toLocaleDateString('es-CL')})`)
      })
    }

    const formattedCotizaciones = cotizaciones.map(cotizacion => {
      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        cliente: cotizacion.cliente?.nombreCliente || 'Sin cliente',
        fecha: cotizacion.fechaCreacion.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-'),
        estado: cotizacion.estado,
        tipo: normalizeTipoCotizacion(cotizacion.tipoCotizacion as string),
        contacto: cotizacion.contacto
          ? {
            contactId: cotizacion.contacto.contactId,
            nombre: cotizacion.contacto.nombre,
            cargo: cotizacion.contacto.cargo,
            email: cotizacion.contacto.email,
            telefono1: cotizacion.contacto.telefono1
          }
          : null,
        comuna: cotizacion.cliente?.comuna || cotizacion.ubicacion?.split(',').pop()?.trim() || 'No especificada',
        empresa: cotizacion.empresa || 'No especificada',
        observacionGestion: cotizacion.observacionGestion,
        subtotal: parseFloat(cotizacion.subtotal.toString()),
        total: parseFloat(cotizacion.total.toString())
      }
    })

    return NextResponse.json(formattedCotizaciones)
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)

    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('Body recibido:', body)

    const fechaInicio = body.fechaEmision ? new Date(body.fechaEmision) : new Date()
    const fechaFin = body.fechaVencimiento ? new Date(body.fechaVencimiento) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return NextResponse.json({ error: 'Fechas inválidas proporcionadas' }, { status: 400 })
    }

    // Manejar el contacto
    let contactId = body.contactId

    // Si no hay contactId pero hay datos de contacto, buscar o crear el contacto
    if (!contactId && body.contacto) {
      const contactoExistente = await prisma.contacto.findFirst({
        where: {
          OR: [
            {
              AND: [{ nombre: body.contacto.nombre }, { email: body.contacto.email }]
            },
            {
              AND: [{ nombre: body.contacto.nombre }, { telefono1: body.contacto.telefono1 }]
            }
          ]
        }
      })

      if (contactoExistente) {
        contactId = contactoExistente.contactId
      } else {
        const nuevoContacto = await prisma.contacto.create({
          data: {
            nombre: body.contacto.nombre,
            cargo: body.contacto.cargo || '',
            email: body.contacto.email || '',
            telefono1: body.contacto.telefono1 || ''
          }
        })

        contactId = nuevoContacto.contactId
      }
    }

    console.log('Detalles recibidos en el backend:', body.detalles)

    const result = await prisma.$transaction(async prisma => {
      const cotizacion = await prisma.cotizacion.create({
        data: {
          numeroCotizacion: body.numeroCotizacion,
          version: body.version || '00',
          tipoCotizacion: normalizeTipoCotizacion(body.tipoCotizacion),
          fechaInicio,
          fechaFin,
          estado: body.estado || 'BORRADOR',
          nombreProyecto: body.nombreProyecto || '',
          empresa: body.empresa || '',
          ubicacion: body.ubicacion || '',
          cliente: body.clienteId ? { connect: { clienteId: body.clienteId } } : undefined,
          obra: body.obraId ? { connect: { obraId: body.obraId } } : undefined,
          vendedorId: body.vendedorId,
          observaciones: body.observaciones || '',
          notas: body.notas || '',
          subtotal: body.subtotal || 0,
          descuento: body.descuento || 0,
          impuesto: body.impuesto || 0,
          total: body.total || 0,
          contacto: contactId ? { connect: { contactId } } : undefined,
          formaPago: body.formaPago || '',
          listaPrecio: body.listaPrecioId ? { connect: { id: body.listaPrecioId } } : undefined,
          sinCantidad: body.sinCantidad || false,
          precioProducto: body.precioProducto || false,
          precioTotal: body.precioTotal || false,
          ...(normalizeTipoCotizacion(body.tipoCotizacion) === 'B' && {
            superficieEMS: body.superficieEMS || '',
            antecedentesEMS: body.antecedentesEMS || '',
            plazoEntregaEMS: body.plazoEntregaEMS || ''
          }),
          ...(normalizeTipoCotizacion(body.tipoCotizacion) === 'C' && {
            duracionMensual: body.duracionMensual || '',
            jornadaMensual: body.jornadaMensual || '',
            antecedentesMensual: body.antecedentesMensual || '',
            alcanceServicio: body.alcanceServicio || ''
          }),
          ...(body.tipoCotizacion === 'D' && {
            textoGeneral: body.textoGeneral || '',
            antecedentesGeneral: body.antecedentesGeneral || '',
            plazoEntregaGeneral: body.plazoEntregaGeneral || ''
          })
        }
      })

      // Extraer el array de detalles, sea plano o anidado en { create: [...] }
      const detallesArray = Array.isArray(body.detalles)
        ? body.detalles
        : body.detalles && Array.isArray(body.detalles.create)
          ? body.detalles.create
          : []

      if (detallesArray.length > 0) {
        console.log('Insertando detalles en la BD (orden original):', detallesArray)
        // Mapeo temporal para traducir productoId a id real del paquete
        const mapProductoIdToDetalleId: Record<number, number> = {}
        console.log('Detalles a procesar:', detallesArray.map((d: any) => ({
          productoId: d.productoId,
          esPaquete: d.esPaquete,
          esSubProducto: d.esSubProducto,
          paqueteId: d.paqueteId
        })))

        for (const detalle of detallesArray) {
          let paqueteIdReal = null
          if (detalle.paqueteId) {
            paqueteIdReal = mapProductoIdToDetalleId[detalle.paqueteId] || null
            console.log(`Buscando paqueteId ${detalle.paqueteId} en mapeo: ${paqueteIdReal}`)
          }

          const detalleCreado = await prisma.detalleCotizacion.create({
            data: {
              cotizacionId: cotizacion.id,
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
      } else {
        console.log('No se insertaron detalles: condición no cumplida o array vacío')
      }

      // Traer la cotización recién creada con el contacto incluido
      const cotizacionConContacto = await prisma.cotizacion.findUnique({
        where: { id: cotizacion.id },
        include: {
          cliente: true,
          contacto: true,
          detalles: { include: { producto: true } }
        }
      })

      return cotizacionConContacto
    })

    return NextResponse.json({ message: 'Cotización creada correctamente', cotizacion: result })
  } catch (error) {
    console.error('Error al crear cotización:', error)

    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 })
  }
}
