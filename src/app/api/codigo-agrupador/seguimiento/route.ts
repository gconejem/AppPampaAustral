import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const lower = (v: unknown) => String(v ?? '').toLowerCase()

const normalizeText = (v: unknown) => {
  try {
    const s = String(v ?? '')
      .replace(/\u00A0/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
    return s
  } catch {
    return ''
  }
}

const normSku = (v: unknown) => String(v ?? '').trim()

// Reglas de informes automáticos por SKU (definidas por negocio)
const AUTO_SKU_DENSIDAD = '1000'
const AUTO_SKU_COMPRESION = '2006'
// Paquetes que incluyen compresión (ej: 2014); se puede extender.
const AUTO_SKUS_COMPRESION_PACKAGES = new Set<string>(['2014'])

const isEnsayadoEstado = (estadoOperativo?: string | null) => {
  return String(estadoOperativo ?? '').trim().toUpperCase() === 'ENSAYADO'
}

const isEventoAbierto = (h: { tipo?: string | null; tipoEstado?: string | null } | null | undefined) => {
  const tipo = String(h?.tipo ?? '').trim()
  const tipoEstado = String(h?.tipoEstado ?? '').trim().toUpperCase()
  return tipo === 'Evento Abierto' || tipoEstado === 'EVENTO'
}

const isEventoCerrado = (h: { tipo?: string | null; tipoEstado?: string | null } | null | undefined) => {
  const tipo = String(h?.tipo ?? '').trim()
  const tipoEstado = String(h?.tipoEstado ?? '').trim().toUpperCase()
  return tipo === 'Evento Cerrado' || tipoEstado === 'EVENTO_CERRADO'
}

// Evento sin resolver: existe un "Evento Abierto" posterior al último "Evento Cerrado".
// Se evalúa sobre historial reciente (ordenado DESC).
const isEventoSinResolver = (history: Array<{ tipo?: string | null; tipoEstado?: string | null }> | null | undefined) => {
  for (const h of history ?? []) {
    if (isEventoCerrado(h)) return false
    if (isEventoAbierto(h)) return true
  }
  return false
}

const normalizeStateKey = (raw?: string | null) => {
  const s = String(raw ?? '').trim()
  if (!s) return null
  if (s.includes('_')) return s.toUpperCase()
  return s.toUpperCase().replace(/\s+/g, '_')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ordenTrabajoId = searchParams.get('ordenTrabajoId')
    const idParam = searchParams.get('id')

    const codigoAgrupadorId = idParam ? Number.parseInt(String(idParam), 10) : null
    if (idParam && (!Number.isFinite(codigoAgrupadorId) || (codigoAgrupadorId as number) <= 0)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const where = {
      ...(ordenTrabajoId ? { ordenTrabajoId } : {}),
      ...(codigoAgrupadorId ? { id: codigoAgrupadorId } : {})
    }

    const agrupadores = await prisma.codigoAgrupador.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ordenTrabajo: {
          select: {
            id: true,
            clave: true,
            correlativ: true,
            agenda: {
              select: {
                id: true,
                comuna: true,
                region: true,
                cliente: {
                  select: {
                    clienteId: true,
                    razonSocial: true,
                    nombreCliente: true,
                    comuna: true,
                    ciudad: true,
                  },
                },
                obra: {
                  select: {
                    obraId: true,
                    numeroObra: true,
                    nombreObra: true,
                    comuna: true,
                    region: true,
                  },
                },
              },
            },
          },
        },
      }
    })

    const agrupadorIds = agrupadores.map(a => a.id)
    const codigoKeys = Array.from(
      new Set(
        agrupadores
          .flatMap(a => [a.codigoNombre, a.codigoId])
          .map(v => String(v ?? '').trim())
          .filter(Boolean)
      )
    )

    // En prod suele existir RCM.codigoProducto (string) con valores tipo PRD-006,
    // aunque no siempre se seteó RCM.codigoAgrupadorId.
    // Para poblar la tabla, traemos RCMs por ambos caminos.
    const rcms = await prisma.rCM.findMany({
      where: {
        ...(ordenTrabajoId ? { ordenTrabajoId } : {}),
        OR: [
          agrupadorIds.length ? { codigoAgrupadorId: { in: agrupadorIds } } : undefined,
          codigoKeys.length ? { codigoProducto: { in: codigoKeys } } : undefined
        ].filter(Boolean) as any,
      },
      select: {
        id: true,
        numeroRcm: true,
        sede: true,
        fechaCodificacion: true,
        fechaMuestreo: true,
        estadoOperativo: true,
        estadoAdministrativo: true,
        ordenTrabajoId: true,
        codigoAgrupadorId: true,
        codigoProducto: true,
        area: { select: { id: true, nombre: true } },
        familia: { select: { id: true, nombre: true } },
        cliente: {
          select: {
            clienteId: true,
            razonSocial: true,
            nombreCliente: true,
            comuna: true,
            ciudad: true
          }
        },
        obra: {
          select: {
            obraId: true,
            numeroObra: true,
            nombreObra: true,
            comuna: true,
            region: true
          }
        },
        servicios: { select: { id: true, cantidad: true, estado: true, estadoOperativo: true, codigo: true, nombre: true } },
        RCMHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { estNuevo: true, tipo: true, tipoEstado: true, informe: true, createdAt: true }
        }
      }
    })

    // index: prefer match by (ordenTrabajoId + codigoNombre)
    const agrupadorByOtAndCodigo = new Map<string, number>()
    const agrupadorByCodigo = new Map<string, number>()
    for (const a of agrupadores) {
      const otId = a.ordenTrabajo?.id ?? a.ordenTrabajoId ?? ''
      const codigoNombre = String(a.codigoNombre ?? '').trim()
      const codigoId = String(a.codigoId ?? '').trim()

      if (otId && codigoNombre) agrupadorByOtAndCodigo.set(`${otId}::${codigoNombre}`, a.id)
      if (otId && codigoId) agrupadorByOtAndCodigo.set(`${otId}::${codigoId}`, a.id)

      if (codigoNombre && !agrupadorByCodigo.has(codigoNombre)) agrupadorByCodigo.set(codigoNombre, a.id)
      if (codigoId && !agrupadorByCodigo.has(codigoId)) agrupadorByCodigo.set(codigoId, a.id)
    }

    const rcmsByAgrupadorId = new Map<number, typeof rcms>()
    for (const a of agrupadores) rcmsByAgrupadorId.set(a.id, [])

    for (const r of rcms) {
      if (r.codigoAgrupadorId && rcmsByAgrupadorId.has(r.codigoAgrupadorId)) {
        rcmsByAgrupadorId.get(r.codigoAgrupadorId)!.push(r)
        continue
      }

      const codigo = String(r.codigoProducto ?? '').trim() || null
      if (!codigo) continue

      const otId = r.ordenTrabajoId ?? ''
      const byOtKey = otId ? agrupadorByOtAndCodigo.get(`${otId}::${codigo}`) : undefined
      const targetId = byOtKey ?? agrupadorByCodigo.get(codigo)
      if (!targetId) continue

      rcmsByAgrupadorId.get(targetId)?.push(r)
    }

    const rows = agrupadores.map(ag => {
      const rcmsForAg = rcmsByAgrupadorId.get(ag.id) ?? []

      // Sedes incluidas (para filtro; un CP puede contener más de una sede)
      const sedes = Array.from(
        new Set(
          (rcmsForAg ?? [])
            .map(r => String((r as any)?.sede ?? '').trim())
            .filter(Boolean)
        )
      ).sort((a, b) => String(a).localeCompare(String(b)))

      // N° de RCMs incluidos (para selección en informes manuales)
      const rcmNumeros = Array.from(
        new Set(
          (rcmsForAg ?? [])
            .map(r => String((r as any)?.numeroRcm ?? '').trim())
            .filter(Boolean)
        )
      ).sort((a, b) => {
        const na = Number(a)
        const nb = Number(b)
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
        return String(a).localeCompare(String(b))
      })

      // RCM representativo para acciones (el más reciente por fecha de codificación)
      let representativeRcmId: number | null = null
      let representativeRcmFecha: Date | null = null
      for (const r of rcmsForAg) {
        if (!r.fechaCodificacion) continue
        if (!representativeRcmFecha || r.fechaCodificacion > representativeRcmFecha) {
          representativeRcmFecha = r.fechaCodificacion
          representativeRcmId = r.id
        }
      }

      // FECHA COD / MUESTREO: primera del grupo (min)
      let fechaCodMinIso: string | null = null
      let fechaMuesMinIso: string | null = null
      for (const r of rcmsForAg) {
        const iso = r.fechaCodificacion ? r.fechaCodificacion.toISOString() : null
        if (iso && (!fechaCodMinIso || iso < fechaCodMinIso)) fechaCodMinIso = iso

        const isoM = r.fechaMuestreo ? r.fechaMuestreo.toISOString() : null
        if (isoM && (!fechaMuesMinIso || isoM < fechaMuesMinIso)) fechaMuesMinIso = isoM
      }

      // Conteos por estado (para filtros/indicadores en UI)
      const estadoOperativoCounts: Record<string, number> = {}
      const estadoAdministrativoCounts: Record<string, number> = {}
      for (const r of rcmsForAg) {
        const opKey = normalizeStateKey(r.estadoOperativo)
        if (opKey) estadoOperativoCounts[opKey] = (estadoOperativoCounts[opKey] ?? 0) + 1

        const adKey = normalizeStateKey(r.estadoAdministrativo)
        if (adKey) estadoAdministrativoCounts[adKey] = (estadoAdministrativoCounts[adKey] ?? 0) + 1
      }

      // Área / Familia: primera no vacía (se asume consistencia dentro del código)
      const firstArea = rcmsForAg.find(r => r.area?.nombre)?.area?.nombre ?? null
      const firstFamilia = rcmsForAg.find(r => r.familia?.nombre)?.familia?.nombre ?? null

      // Cliente/Obra/Ciudad: primera no vacía (fallbacks)
      const firstCliente = rcmsForAg.find(r => r.cliente?.razonSocial || r.cliente?.nombreCliente)?.cliente ?? null
      const firstObra = rcmsForAg.find(r => r.obra?.numeroObra || r.obra?.nombreObra)?.obra ?? null

      // Fallback: OrdenTrabajo -> Agenda -> Cliente/Obra (cuando RCM no trae cliente/obra)
      const agenda = ag.ordenTrabajo?.agenda ?? null
      const fallbackCliente = firstCliente ?? agenda?.cliente ?? null
      const fallbackObra = firstObra ?? agenda?.obra ?? null

      const ciudad =
        firstObra?.comuna ??
        agenda?.comuna ??
        fallbackObra?.comuna ??
        firstCliente?.comuna ??
        firstCliente?.ciudad ??
        fallbackCliente?.comuna ??
        fallbackCliente?.ciudad ??
        null

      // Ensayos (desde ServicioRCM)
      let ensayosTotal = 0
      let ensayosEnsayados = 0

      // Informes automáticos aplicables (se detecta por SKU/código de ServicioRCM)
      let autoDensidad = false
      let autoHormigon = false
      for (const r of rcmsForAg) {
        for (const s of r.servicios ?? []) {
          const qty = Number(s.cantidad ?? 0)
          ensayosTotal += qty
          if (isEnsayadoEstado(s.estadoOperativo)) ensayosEnsayados += qty

          const sku = normSku((s as any)?.codigo)
          const nm = normalizeText((s as any)?.nombre ?? '')

          // (1) Informe Densidad -> SKU 1000 “Densidad en terreno - Método Nuclear”
          if (!autoDensidad) {
            if (sku === AUTO_SKU_DENSIDAD) autoDensidad = true
            else if (nm.includes('densidad') && (nm.includes('terreno') || nm.includes('nuclear'))) autoDensidad = true
          }

          // (2) Informe Hormigón -> SKU 2006 “Compresión” (directo o dentro de paquete con compresión)
          if (!autoHormigon) {
            if (sku === AUTO_SKU_COMPRESION) autoHormigon = true
            else if (AUTO_SKUS_COMPRESION_PACKAGES.has(sku)) autoHormigon = true
            else if (nm.includes('compresion')) autoHormigon = true
          }
        }
      }

      // N° Informe (max) desde el último historial traído por RCM (si existe)
      let informeMax: number | null = null
      for (const r of rcmsForAg) {
        for (const h of r.RCMHistory ?? []) {
          const inf = (h as any)?.informe ?? null
          if (inf === null || inf === undefined) continue
          const n = Number(inf)
          if (Number.isFinite(n) && (informeMax === null || n > informeMax)) informeMax = n
        }
      }

      // Con Evento
      const conEvento = rcmsForAg.some(r => isEventoSinResolver(r.RCMHistory))

      return {
        id: ag.id,
        codigoId: ag.codigoId,
        codigoNombre: ag.codigoNombre,
        descripcionServicio: (ag as any).descripcionServicio ?? null,
        representativeRcmId,
        rcmNumeros,
        sedes,
        ss: ag.ordenTrabajo?.clave ?? null,
        ot: ag.ordenTrabajo?.correlativ ?? null,
        ordenTrabajoId: ag.ordenTrabajo?.id ?? ag.ordenTrabajoId ?? null,
        fechaCodificacionMin: fechaCodMinIso,
        fechaMuestreoMin: fechaMuesMinIso,
        areaNombre: firstArea,
        familiaNombre: firstFamilia,
        ciudad,
        cliente: fallbackCliente,
        obra: fallbackObra,
        totalRcms: rcmsForAg.length,
        estadoOperativoCounts,
        estadoAdministrativoCounts,
        ensayos: { ensayados: ensayosEnsayados, total: ensayosTotal },
        autoTemplates: { DENSIDAD: autoDensidad, HORMIGON: autoHormigon },
        informe: informeMax,
        conEvento
      }
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error('Error en seguimiento de códigos producto:', error)
    return NextResponse.json({ error: 'Error al obtener seguimiento de códigos producto' }, { status: 500 })
  }
}
