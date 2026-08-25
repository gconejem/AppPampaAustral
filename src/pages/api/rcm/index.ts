import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SubProducto {
  productoId: number
  sku: string
  nombre: string
  norma?: string
  cantidad: number
  observacion?: string
}

interface Ensayo {
  productoId: number
  sku: string
  nombre: string
  norma?: string
  cantidad: number
  observacion?: string
  estadoOperativo?: string
  esPaquete?: boolean
  subProductos?: SubProducto[]
}

interface SubMuestraVenc {
  numero: number
  dias: number
  fechaVencimiento: string
  cantidad: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const {
        rcmType,
        sede,
        areaId,
        familiaId,
        fechaCodificacion,
        fechaServicio,
        fechaMuestreo,
        fechaIngreso,
        fechaEntrega,
        observaciones,
        observacionItem,
        informeEnsayo,
        codigoAgrupadorId,
        numeroTarjeta,
        tipoMaterial,
        item,
        procedencia,
        ubicacionSector,
        grado,
        elemento,
        cantidadMuestras,
        vencimiento,
        fechaConfeccion,
        tomaMuestra,
        codigoProducto,
        cota1,
        cota2,
        ensayos = [],
        submuestrasVencimiento = [],
        clienteId,
        obraId,
        ordenTrabajoId,
        funcionario,
        usuario,
      } = req.body

      // Generar número de RCM único (correlativo numérico)
      const ultimoRCM = await prisma.rCM.findFirst({
        orderBy: { id: 'desc' },
        select: { numeroRcm: true },
      })

      let numeroRcm = '1'
      if (ultimoRCM?.numeroRcm) {
        const ultimoNumero = parseInt(ultimoRCM.numeroRcm)
        if (!isNaN(ultimoNumero)) numeroRcm = (ultimoNumero + 1).toString()
      }

      // Resolver productoIds a partir de skus
      const skus = [
        ...ensayos.map((e: Ensayo) => e.sku),
        ...ensayos.flatMap((e: Ensayo) => (e.subProductos ?? []).map((s: SubProducto) => s.sku)),
      ]

      const productos = await prisma.producto.findMany({
        where: { sku: { in: skus } },
        select: { productoId: true, sku: true },
      })

      const productosMap: Record<string, number> = {}
      for (const p of productos) productosMap[p.sku] = p.productoId

      const estadoInicial = rcmType === 'Control' ? 'ENSAYADO' : rcmType === 'Servicio' ? 'EJECUTADO' : 'CODIFICADO'
      const funcionarioAlta =
        (typeof funcionario === 'string' && funcionario.trim())
          ? funcionario.trim()
          : (typeof usuario === 'string' && usuario.trim())
            ? usuario.trim()
            : null

      const rcm = await prisma.rCM.create({
        data: {
          numeroRcm,
          rcmType: rcmType ?? null,
          sede: sede ?? null,
          areaId: areaId ?? null,
          familiaId: familiaId ?? null,
          fechaCodificacion: new Date(fechaCodificacion),
          fechaServicio: fechaServicio ? new Date(fechaServicio) : null,
          fechaMuestreo: new Date(fechaMuestreo ?? fechaServicio ?? fechaCodificacion),
          fechaIngreso: new Date(fechaIngreso),
          fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
          estadoOperativo: estadoInicial,
          estadoAdministrativo: 'SIN_INICIO',
          observaciones: observaciones ?? null,
          observacionItem: observacionItem ?? null,
          informeEnsayo: informeEnsayo ?? true,
          codigoAgrupadorId: codigoAgrupadorId ?? null,
          numeroTarjeta: numeroTarjeta ?? null,
          tipoMaterial: tipoMaterial ?? null,
          item: item ?? null,
          procedencia: procedencia ?? null,
          ubicacionSector: ubicacionSector ?? null,
          grado: grado ?? null,
          elemento: elemento ?? null,
          cantidadMuestras: cantidadMuestras ? parseInt(cantidadMuestras.toString()) : null,
          vencimiento: vencimiento ?? false,
          fechaConfeccion: fechaConfeccion ? new Date(fechaConfeccion) : null,
          tomaMuestra: tomaMuestra ?? null,
          codigoProducto: codigoProducto ?? null,
          cota1: cota1 ?? null,
          cota2: cota2 ?? null,
          clienteId: clienteId ?? null,
          obraId: obraId ?? null,
          ordenTrabajoId: ordenTrabajoId ?? null,
          // ServicioRCM con sub-productos
          servicios: {
            create: ensayos
              .filter((e: Ensayo) => productosMap[e.sku] !== undefined)
              .map((e: Ensayo, orden: number) => ({
                codigo: e.sku,
                nombre: e.nombre,
                cantidad: e.cantidad,
                estado: e.estadoOperativo ?? estadoInicial,
                norma: e.norma ?? null,
                observacion: e.observacion ?? null,
                estadoOperativo: e.estadoOperativo ?? estadoInicial,
                esPaquete: e.esPaquete ?? false,
                orden,
                producto: { connect: { productoId: productosMap[e.sku] } },
                subProductos: e.esPaquete && (e.subProductos?.length ?? 0) > 0
                  ? {
                    create: (e.subProductos ?? [])
                      .filter((s: SubProducto) => productosMap[s.sku] !== undefined)
                      .map((s: SubProducto) => ({
                        sku: s.sku,
                        nombre: s.nombre,
                        norma: s.norma ?? null,
                        cantidad: s.cantidad,
                        observacion: s.observacion ?? null,
                        producto: { connect: { productoId: productosMap[s.sku] } },
                      })),
                  }
                  : undefined,
              })),
          },
          // Muestra auto-creada para compatibilidad con navegadores
          muestras: {
            create: [
              {
                numeroMuestra: `${numeroRcm}-01`,
                numeroTarjeta: numeroTarjeta ?? null,
                tipoMaterial: tipoMaterial ?? null,
                elemento: elemento ?? null,
                item: item ?? null,
                grado: grado ?? null,
                procedencia: procedencia ?? null,
                cotas: cota1 && cota2 ? `${cota1} - ${cota2}` : cota1 ?? cota2 ?? null,
                ubicacionSector: ubicacionSector ?? null,
                vencimiento: vencimiento ?? false,
                observaciones: observaciones ?? null,
                cantidadMuestras: cantidadMuestras ? parseInt(cantidadMuestras.toString()) : null,
                estadoMuestra: estadoInicial,
                servicios: {
                  create: ensayos
                    .filter((e: Ensayo) => productosMap[e.sku] !== undefined)
                    .map((e: Ensayo, orden: number) => ({
                      codigo: e.sku,
                      nombre: e.nombre,
                      cantidad: e.cantidad,
                      estado: e.estadoOperativo ?? estadoInicial,
                      orden,
                      producto: { connect: { productoId: productosMap[e.sku] } },
                    })),
                },
                probetas: vencimiento && submuestrasVencimiento.length > 0
                  ? {
                    create: submuestrasVencimiento.map((s: SubMuestraVenc, idx: number) => ({
                      numero: s.numero ?? idx + 1,
                      fechaConfeccion: fechaConfeccion ? new Date(fechaConfeccion) : new Date(fechaCodificacion),
                      cantidad: s.cantidad,
                      dias: s.dias,
                      fechaVencimiento: new Date(s.fechaVencimiento),
                      estado: 'CODIFICADO',
                    })),
                  }
                  : undefined,
              },
            ],
          },
        },
        include: {
          servicios: { orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }], include: { subProductos: true, producto: true } },
          muestras: { include: { servicios: { orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }] }, probetas: true } },
          area: true,
          familia: true,
        },
      })

      try {
        const parsedFechaCodificacion = fechaCodificacion ? new Date(fechaCodificacion) : null
        const fechaInicio = parsedFechaCodificacion && !Number.isNaN(parsedFechaCodificacion.getTime())
          ? parsedFechaCodificacion
          : new Date()

        await prisma.rCMHistory.create({
          data: {
            rcm: { connect: { id: rcm.id } },
            tipo: 'Ope',
            tipoEstado: 'CODIFICADO',
            motivo: 'Alta RCM',
            observacion: 'Registro inicial de codificacion',
            funcionario: funcionarioAlta,
            fechaAccion: fechaInicio,
            estAnterior: 'CODIFICADO',
            estNuevo: estadoInicial,
            aplicadoA: 'CP',
          },
        })
      } catch (historyError) {
        console.warn('No se pudo registrar historial inicial de RCM:', historyError)
      }

      res.status(200).json(rcm)
    } catch (error) {
      console.error('Error al crear RCM:', error)
      res.status(500).json({
        error: 'Error al crear el RCM',
        message: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  } else if (req.method === 'GET') {
    try {
      res.setHeader('Cache-Control', 'no-store, max-age=0')

      const { ordenTrabajoId } = req.query

      const whereClause = ordenTrabajoId ? { ordenTrabajoId: ordenTrabajoId as string } : {}

      const rcms = await prisma.rCM.findMany({
        where: whereClause,
        include: {
          ordenTrabajo: {
            select: {
              id: true,
              clave: true,
              correlativ: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },
              agenda: {
                select: {
                  id: true,
                  obra: {
                    select: {
                      obraId: true,
                      numeroObra: true,
                      nombreObra: true,
                      comuna: true,
                      region: true,
                      mandante: true
                    }
                  },
                  cliente: {
                    select: {
                      clienteId: true,
                      nombreCliente: true,
                      razonSocial: true,
                      comuna: true,
                      ciudad: true,
                      region: true,
                      rut: true
                    }
                  }
                }
              }
            }
          },
          servicios: {
            orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
            include: {
              subProductos: {
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              },
              producto: true,
            },
          },
          muestras: {
            include: {
              servicios: {
                orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
                include: {
                  producto: true,
                  history: {
                    orderBy: { registro: 'desc' },
                    take: 1,
                    select: { aplicadoA: true }
                  }
                }
              },
              probetas: true,
            },
          },
          area: true,
          familia: true,
          codigoAgrupador: true,
          obra: true,
          cliente: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      const totalMuestras = rcms.reduce((acc, rcm) => acc + (Array.isArray(rcm.muestras) ? rcm.muestras.length : 0), 0)
      const totalServicios = rcms.reduce((acc, rcm) => acc + (Array.isArray(rcm.servicios) ? rcm.servicios.length : 0), 0)
      const totalProbetas = rcms.reduce(
        (acc, rcm) =>
          acc +
          (Array.isArray(rcm.muestras)
            ? rcm.muestras.reduce((sub, muestra) => sub + (Array.isArray((muestra as any).probetas) ? (muestra as any).probetas.length : 0), 0)
            : 0),
        0
      )

      console.log('[GET /api/rcm] resumen', {
        timestamp: new Date().toISOString(),
        ordenTrabajoId: ordenTrabajoId ?? null,
        totalRcMs: rcms.length,
        totalMuestras,
        totalServicios,
        totalProbetas,
        sampleIds: rcms.slice(0, 5).map(item => item.id)
      })

      res.status(200).json(rcms)
    } catch (error) {
      console.error('Error al listar RCMs:', error)
      res.status(500).json({
        error: 'Error al listar RCMs',
        message: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' })
  }
}
