import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const rcmSelect = {
  id: true,
  numeroRcm: true,
  rcmType: true,
  estadoOperativo: true,
  fechaCodificacion: true,
  fechaMuestreo: true,
  fechaServicio: true,
  fechaConfeccion: true,
  numeroTarjeta: true,
  tomaMuestra: true,
  tipoMaterial: true,
  item: true,
  observacionItem: true,
  cota1: true,
  cota2: true,
  elemento: true,
  grado: true,
  area: { select: { nombre: true } },
  familia: { select: { nombre: true } },
  servicios: {
    select: {
      codigo: true,
      esPaquete: true,
      subProductos: { select: { sku: true } },
      producto: { select: { productosEnPaquete: { select: { producto: { select: { sku: true } } } } } }
    }
  }
} as const

const TIPOS_RCM = ['Muestra', 'Control', 'Servicio'] as const

const emptyTotales = () => ({ codigos: 0, rcms: 0, porTipo: { Muestra: 0, Control: 0, Servicio: 0 } })

// Cantidad de actividades técnicas: SKUs distintos. El paquete no cuenta, sí sus subproductos.
const contarActividades = (servicios: any[]) => {
  const skus = new Set<string>()
  for (const s of servicios ?? []) {
    if (s.esPaquete) {
      const subSkus: string[] = (s.subProductos ?? []).length > 0
        ? s.subProductos.map((sp: any) => sp.sku)
        : (s.producto?.productosEnPaquete ?? []).map((pp: any) => pp.producto?.sku)
      subSkus.filter(Boolean).forEach(sku => skus.add(sku))
    } else if (s.codigo) {
      skus.add(s.codigo)
    }
  }
  return skus.size
}

const toResumen = (rcm: any) => ({
  id: rcm.id,
  numeroRcm: rcm.numeroRcm,
  rcmType: rcm.rcmType ?? 'Muestra',
  estadoOperativo: rcm.estadoOperativo,
  fechaCodificacion: rcm.fechaCodificacion,
  fechaMuestreo: rcm.fechaMuestreo,
  fechaServicio: rcm.fechaServicio,
  fechaConfeccion: rcm.fechaConfeccion,
  numeroTarjeta: rcm.numeroTarjeta,
  tomaMuestra: rcm.tomaMuestra,
  tipoMaterial: rcm.tipoMaterial,
  item: rcm.item,
  observacionItem: rcm.observacionItem,
  cota1: rcm.cota1,
  cota2: rcm.cota2,
  elemento: rcm.elemento,
  grado: rcm.grado,
  area: rcm.area?.nombre ?? null,
  tipoServicio: rcm.familia?.nombre ?? null,
  actividades: contarActividades(rcm.servicios)
})

// GET /api/ot/[id]/codificacion-existente - CP y RCM ya confirmados de una OT codificada
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const ot = await prisma.ordenTrabajo.findUnique({ where: { id: params.id }, select: { estado: true } })

    if (!ot) return NextResponse.json({ error: 'Orden de trabajo no encontrada' }, { status: 404 })
    if (ot.estado !== 'CODIFICADA') return NextResponse.json({ estadoOT: ot.estado, codigos: [], totales: emptyTotales() })

    const agrupadores = await prisma.codigoAgrupador.findMany({
      where: { ordenTrabajoId: params.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        codigoNombre: true,
        descripcionServicio: true,
        rcms: { select: rcmSelect },
        rcmLinks: { select: { rcm: { select: rcmSelect } } }
      }
    })

    const rcmsUnicos = new Map<number, string>()

    const codigos = agrupadores
      .map(ag => {
        const rcmsById = new Map<number, any>()
        for (const link of ag.rcmLinks) if (link.rcm) rcmsById.set(link.rcm.id, link.rcm)
        for (const rcm of ag.rcms) if (!rcmsById.has(rcm.id)) rcmsById.set(rcm.id, rcm)

        const rcms = Array.from(rcmsById.values())
          .sort((a, b) => {
            const aNum = Number(a.numeroRcm)
            const bNum = Number(b.numeroRcm)
            if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum
            return a.id - b.id
          })
          .map(toResumen)

        rcms.forEach(r => rcmsUnicos.set(r.id, r.rcmType))

        return {
          id: ag.id,
          codigoNombre: ag.codigoNombre,
          descripcionServicio: ag.descripcionServicio,
          area: rcms.find(r => r.area)?.area ?? null,
          rcms
        }
      })
      .filter(cp => cp.rcms.length > 0)

    const totales = emptyTotales()
    totales.codigos = codigos.length
    totales.rcms = rcmsUnicos.size
    for (const tipo of rcmsUnicos.values()) {
      if ((TIPOS_RCM as readonly string[]).includes(tipo)) totales.porTipo[tipo as typeof TIPOS_RCM[number]]++
    }

    return NextResponse.json({ estadoOT: ot.estado, codigos, totales })
  } catch (error) {
    console.error('Error al obtener codificación existente:', error)

    return NextResponse.json({ error: 'Error al obtener la codificación existente' }, { status: 500 })
  }
}
