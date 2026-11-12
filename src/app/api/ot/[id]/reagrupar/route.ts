import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const rcmSelect = {
  id: true,
  numeroRcm: true,
  rcmType: true,
  sede: true,
  estadoOperativo: true,
  numeroTarjeta: true,
  tomaMuestra: true,
  tipoMaterial: true,
  item: true,
  grado: true,
  procedencia: true,
  ubicacionSector: true,
  elemento: true,
  cota1: true,
  cota2: true,
  observacionItem: true,
  observaciones: true,
  informeEnsayo: true,
  cantidadMuestras: true,
  vencimiento: true,
  fechaServicio: true,
  fechaMuestreo: true,
  fechaCodificacion: true,
  fechaIngreso: true,
  fechaEntrega: true,
  fechaConfeccion: true,
  area: { select: { nombre: true } },
  familia: { select: { nombre: true } },
  servicios: {
    orderBy: [{ orden: 'asc' as const }, { createdAt: 'asc' as const }, { id: 'asc' as const }],
    select: {
      id: true,
      codigo: true,
      nombre: true,
      norma: true,
      cantidad: true,
      observacion: true,
      estadoOperativo: true,
      esPaquete: true,
      producto: { select: { productoId: true, sku: true, nombre: true, norma: true } },
      subProductos: {
        orderBy: [{ orden: 'asc' as const }, { createdAt: 'asc' as const }, { id: 'asc' as const }],
        select: {
          id: true,
          sku: true,
          nombre: true,
          norma: true,
          cantidad: true,
          observacion: true,
          producto: { select: { productoId: true, sku: true, nombre: true, norma: true } }
        }
      }
    }
  },
  muestras: { select: { probetas: { orderBy: { numero: 'asc' as const } } } }
}

const isoToDate = (value?: Date | string | null) => (value ? new Date(value).toISOString().split('T')[0] : '')

// Mismo mapeo que mapApiToRcmData (src/views/apps/rcm-edit/index.tsx), en formato RCMData del workbench
const mapRcmToRcmData = (data: any) => {
  const ensayos = (data.servicios ?? []).map((s: any, idx: number) => ({
    id: s.id ?? idx + 1,
    productoId: s.producto?.productoId ?? 0,
    sku: s.producto?.sku ?? s.codigo ?? '',
    nombre: s.producto?.nombre ?? s.nombre ?? '',
    norma: s.producto?.norma ?? s.norma ?? '',
    cantidad: s.cantidad ?? 1,
    observacion: s.observacion ?? '',
    estadoOperativo: s.estadoOperativo ?? 'CODIFICADO',
    esPaquete: s.esPaquete ?? false,
    subProductos: (s.subProductos ?? []).map((sp: any, spIdx: number) => ({
      id: sp.id ?? spIdx + 1,
      productoId: sp.producto?.productoId ?? 0,
      sku: sp.producto?.sku ?? sp.sku ?? '',
      nombre: sp.producto?.nombre ?? sp.nombre ?? '',
      norma: sp.producto?.norma ?? sp.norma ?? '',
      cantidad: sp.cantidad ?? 1,
      observacion: sp.observacion ?? ''
    }))
  }))
  const probetas = (data.muestras ?? []).flatMap((m: any) => m.probetas ?? [])
  const submuestrasVencimiento = probetas.map((p: any, idx: number) => ({
    id: p.id ?? idx + 1,
    submuestra: `RCM - ${p.numero ?? idx + 1}`,
    numero: p.numero ?? idx + 1,
    dias: p.dias ?? 0,
    fechaVencimiento: isoToDate(p.fechaVencimiento),
    cantidad: p.cantidad ?? 1
  }))

  return {
    id: data.id,
    dbId: data.id,
    numeroRcm: data.numeroRcm,
    rcmType: data.rcmType ?? 'Muestra',
    sede: data.sede ?? '',
    area: data.area?.nombre ?? '',
    tipoServicio: data.familia?.nombre ?? '',
    numeroTarjeta: data.numeroTarjeta ?? '',
    tomaMuestra: data.tomaMuestra ?? '',
    tipoMaterial: data.tipoMaterial ?? '',
    item: data.item ?? '',
    grado: data.grado ?? '',
    procedencia: data.procedencia ?? '',
    ubicacionSector: data.ubicacionSector ?? '',
    elemento: data.elemento ?? '',
    cota1: data.cota1 ?? '',
    cota2: data.cota2 ?? '',
    observacionItem: data.observacionItem ?? '',
    observaciones: data.observaciones ?? '',
    informeEnsayo: data.informeEnsayo ?? true,
    cantidadMuestras: data.cantidadMuestras != null ? String(data.cantidadMuestras) : '',
    fechaServicio: isoToDate(data.fechaServicio ?? data.fechaMuestreo),
    fechaMuestreo: isoToDate(data.fechaMuestreo),
    fechaCodificacion: isoToDate(data.fechaCodificacion),
    fechaIngreso: isoToDate(data.fechaIngreso),
    fechaEntrega: isoToDate(data.fechaEntrega),
    fechaConfeccion: isoToDate(data.fechaConfeccion),
    estado: data.estadoOperativo ?? 'CODIFICADO',
    estadoOperativo: data.estadoOperativo ?? 'CODIFICADO',
    tieneVencimiento: data.vencimiento ?? probetas.length > 0,
    ensayos,
    submuestrasVencimiento
  }
}

const sortByNumeroRcm = (a: any, b: any) => {
  const aNum = Number(a.numeroRcm)
  const bNum = Number(b.numeroRcm)
  if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum
  return a.id - b.id
}

// GET /api/ot/[id]/reagrupar - CP y RCM confirmados de la OT en formato del workbench, para reagrupar
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ot = await prisma.ordenTrabajo.findUnique({ where: { id: params.id }, select: { estado: true } })

    if (!ot) return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    if (ot.estado !== 'CODIFICADA') {
      return NextResponse.json({ error: 'Solo se puede reagrupar una OT en estado CODIFICADA' }, { status: 409 })
    }

    const agrupadores = await prisma.codigoAgrupador.findMany({
      where: { ordenTrabajoId: params.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        codigoId: true,
        codigoNombre: true,
        descripcionServicio: true,
        cantidad: true,
        unidad: true,
        facturacion: true,
        ensayos: { select: { productoId: true, sku: true, nombre: true } },
        rcms: { select: rcmSelect },
        rcmLinks: { select: { rcm: { select: rcmSelect } } }
      }
    })

    const rcmsById = new Map<number, any>()

    const codigos = agrupadores
      .map(ag => {
        const linked = new Map<number, any>()
        for (const link of ag.rcmLinks) if (link.rcm) linked.set(link.rcm.id, link.rcm)
        for (const rcm of ag.rcms) if (!linked.has(rcm.id)) linked.set(rcm.id, rcm)
        const rcms = Array.from(linked.values()).sort(sortByNumeroRcm)
        rcms.forEach(rcm => { if (!rcmsById.has(rcm.id)) rcmsById.set(rcm.id, rcm) })

        return {
          id: `db-${ag.id}`,
          dbId: ag.id,
          codigoId: ag.codigoId,
          codigoNombre: ag.codigoNombre,
          descripcionServicio: ag.descripcionServicio ?? '',
          cantidad: ag.cantidad ?? 1,
          unidad: ag.unidad ?? 'unid',
          facturacion: ag.facturacion === 'Fijo' ? 'Fijo' : 'Unitario',
          ensayos: ag.ensayos.map(e => ({ productoId: e.productoId, sku: e.sku, nombre: e.nombre, cantidad: 1 })),
          rcmsVinculados: rcms.map(rcm => ({
            id: rcm.id,
            numeroTarjeta: rcm.numeroTarjeta || rcm.numeroRcm || `T-${rcm.id}`,
            rcmType: rcm.rcmType ?? 'Muestra',
            numeroRcm: rcm.numeroRcm
          }))
        }
      })
      .filter(cp => cp.rcmsVinculados.length > 0)

    const rcms = Array.from(rcmsById.values()).sort(sortByNumeroRcm).map(mapRcmToRcmData)

    return NextResponse.json({ rcms, codigos })
  } catch (error) {
    console.error('Error al obtener datos para reagrupar:', error)

    return NextResponse.json({ error: 'Error al obtener la codificación para reagrupar' }, { status: 500 })
  }
}
