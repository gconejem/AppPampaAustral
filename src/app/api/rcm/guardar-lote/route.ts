import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface SubProducto {
    productoId?: number
    sku: string
    nombre: string
    norma?: string
    cantidad: number
    observacion?: string
}

interface Ensayo {
    productoId?: number
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

interface RCMInput {
    id?: number | string           // frontend temp id, ignored on create
    dbId?: number                  // DB id if already persisted — skip creation, just map ids
    rcmType?: string
    sede?: string
    areaId?: number
    familiaId?: number
    fechaCodificacion: string
    fechaServicio?: string
    fechaMuestreo?: string
    fechaIngreso: string
    fechaEntrega?: string
    observaciones?: string
    observacionItem?: string
    informeEnsayo?: boolean
    codigoProducto?: string
    numeroTarjeta?: string
    tipoMaterial?: string
    item?: string
    procedencia?: string
    ubicacionSector?: string
    grado?: string
    elemento?: string
    cantidadMuestras?: number | string
    vencimiento?: boolean
    fechaConfeccion?: string
    tomaMuestra?: string
    cota1?: string
    cota2?: string
    ensayos?: Ensayo[]
    submuestrasVencimiento?: SubMuestraVenc[]
    clienteId?: number
    obraId?: number
    // codigoAgrupadorId resolved after creating agrupadores
}

interface AgrupadorEnsayo {
    productoId?: number
    sku: string
    nombre: string
    cantidad?: number
}

interface AgrupadorInput {
    id?: string                    // frontend temp id like "PRD-001"
    dbId?: number                  // DB id if already persisted — update instead of create
    codigoId: string
    codigoNombre: string
    descripcionServicio?: string
    cantidad?: number
    unidad?: string
    facturacion?: string
    ensayos?: AgrupadorEnsayo[]
    rcmsVinculados?: Array<{ id: number | string }>
}

interface LotePayload {
    rcms: RCMInput[]
    codigosAgrupadores: AgrupadorInput[]
    ordenTrabajoId?: string
    clienteId?: number
    obraId?: number
}

// Helper: resolve sku → productoId for a flat list of skus
async function resolveProductos(skus: string[]): Promise<Record<string, number>> {
    if (skus.length === 0) return {}
    const productos = await prisma.producto.findMany({
        where: { sku: { in: skus } },
        select: { productoId: true, sku: true },
    })
    const map: Record<string, number> = {}
    for (const p of productos) map[p.sku] = p.productoId
    return map
}

// Helper: generate next sequential numeroRcm inside a transaction
async function nextNumeroRcm(tx: typeof prisma): Promise<() => string> {
    const ultimo = await tx.rCM.findFirst({
        orderBy: { id: 'desc' },
        select: { numeroRcm: true },
    })
    let counter = 1
    if (ultimo?.numeroRcm) {
        const n = parseInt(ultimo.numeroRcm)
        if (!isNaN(n)) counter = n + 1
    }
    return () => (counter++).toString()
}

export async function POST(request: Request) {
    try {
        const body: LotePayload = await request.json()
        const { rcms = [], codigosAgrupadores = [], ordenTrabajoId, clienteId, obraId } = body

        // Collect all skus for a single DB round-trip
        const allSkus = new Set<string>()
        for (const rcm of rcms) {
            for (const e of rcm.ensayos ?? []) {
                allSkus.add(e.sku)
                for (const s of e.subProductos ?? []) allSkus.add(s.sku)
            }
        }
        for (const ag of codigosAgrupadores) {
            for (const e of ag.ensayos ?? []) allSkus.add(e.sku)
        }

        const productosMap = await resolveProductos([...allSkus])

        // --- Pre-cómputo FUERA de la transacción para minimizar tiempo de la tx ---
        // Calcular maxNum de agrupadores PRD-### antes de la tx (lectura no atómica)
        const todosAgrupadoresPre = await prisma.codigoAgrupador.findMany({
            select: { codigoNombre: true },
        })
        let maxNumPre = 0
        for (const record of todosAgrupadoresPre) {
            const match = record.codigoNombre.match(/^PRD-(\d+)$/)
            if (match) {
                const num = parseInt(match[1], 10)
                if (num > maxNumPre) maxNumPre = num
            }
        }

        // Pre-asignar codigoNombre / codigoId para agrupadores nuevos (sin dbId)
        let maxNumCounter = maxNumPre
        const agrupadoresPreparados = codigosAgrupadores.map(ag => {
            if (ag.dbId) return { ag, codigoNombre: undefined as string | undefined, codigoId: undefined as string | undefined }
            maxNumCounter++
            const codigoNombre = `PRD-${String(maxNumCounter).padStart(3, '0')}`
            const codigoId = `${codigoNombre}-${Date.now()}`
            return { ag, codigoNombre, codigoId }
        })

        const resultados = await prisma.$transaction(async (tx) => {
            // numeroRcm se calcula dentro de la tx para garantizar correlatividad
            const getNumero = await nextNumeroRcm(tx as unknown as typeof prisma)

            // Map frontend temp RCM id → real DB RCM id
            const rcmIdMap: Record<string | number, number> = {}

            // 1. Crear todos los RCMs en paralelo
            const rcmCreateTasks = rcms.map(async (rcmInput) => {
                // Already persisted: only register in the id map, do not create a duplicate
                if (rcmInput.dbId) {
                    if (rcmInput.id != null) rcmIdMap[rcmInput.id] = rcmInput.dbId
                    return { id: rcmInput.dbId }
                }

                const numero = getNumero()
                const estadoInicial = rcmInput.rcmType === 'Control' ? 'ENSAYADO' : rcmInput.rcmType === 'Servicio' ? 'EJECUTADO' : 'CODIFICADO'
                const ensayos = rcmInput.ensayos ?? []
                const submuestrasVencimiento = rcmInput.submuestrasVencimiento ?? []

                const rcmCriado = await tx.rCM.create({
                    data: {
                        numeroRcm: numero,
                        rcmType: rcmInput.rcmType ?? null,
                        sede: rcmInput.sede ?? null,
                        areaId: rcmInput.areaId ?? null,
                        familiaId: rcmInput.familiaId ?? null,
                        fechaCodificacion: new Date(rcmInput.fechaCodificacion),
                        fechaServicio: rcmInput.fechaServicio ? new Date(rcmInput.fechaServicio) : null,
                        fechaMuestreo: new Date(rcmInput.fechaMuestreo ?? rcmInput.fechaServicio ?? rcmInput.fechaCodificacion),
                        fechaIngreso: new Date(rcmInput.fechaIngreso),
                        fechaEntrega: rcmInput.fechaEntrega ? new Date(rcmInput.fechaEntrega) : null,
                        estadoOperativo: estadoInicial,
                        estadoAdministrativo: 'SIN_INICIO',
                        observaciones: rcmInput.observaciones ?? null,
                        observacionItem: rcmInput.observacionItem ?? null,
                        informeEnsayo: rcmInput.informeEnsayo ?? true,
                        numeroTarjeta: rcmInput.numeroTarjeta ?? null,
                        tipoMaterial: rcmInput.tipoMaterial ?? null,
                        item: rcmInput.item ?? null,
                        procedencia: rcmInput.procedencia ?? null,
                        ubicacionSector: rcmInput.ubicacionSector ?? null,
                        grado: rcmInput.grado ?? null,
                        elemento: rcmInput.elemento ?? null,
                        cantidadMuestras: rcmInput.cantidadMuestras != null ? parseInt(rcmInput.cantidadMuestras.toString()) : null,
                        vencimiento: rcmInput.vencimiento ?? false,
                        fechaConfeccion: rcmInput.fechaConfeccion ? new Date(rcmInput.fechaConfeccion) : null,
                        tomaMuestra: rcmInput.tomaMuestra ?? null,
                        codigoProducto: rcmInput.codigoProducto ?? null,
                        cota1: rcmInput.cota1 ?? null,
                        cota2: rcmInput.cota2 ?? null,
                        clienteId: rcmInput.clienteId ?? clienteId ?? null,
                        obraId: rcmInput.obraId ?? obraId ?? null,
                        ordenTrabajoId: ordenTrabajoId ?? null,
                        // ServicioRCM
                        servicios: {
                            create: ensayos
                                .filter(e => productosMap[e.sku] !== undefined)
                                .map(e => ({
                                    codigo: e.sku,
                                    nombre: e.nombre,
                                    cantidad: e.cantidad,
                                    estado: e.estadoOperativo ?? estadoInicial,
                                    norma: e.norma ?? null,
                                    observacion: e.observacion ?? null,
                                    estadoOperativo: e.estadoOperativo ?? estadoInicial,
                                    esPaquete: e.esPaquete ?? false,
                                    producto: { connect: { productoId: productosMap[e.sku] } },
                                    subProductos: e.esPaquete && (e.subProductos?.length ?? 0) > 0
                                        ? {
                                            create: (e.subProductos ?? [])
                                                .filter(s => productosMap[s.sku] !== undefined)
                                                .map(s => ({
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
                                    numeroMuestra: `${numero}-01`,
                                    numeroTarjeta: rcmInput.numeroTarjeta ?? null,
                                    tipoMaterial: rcmInput.tipoMaterial ?? null,
                                    elemento: rcmInput.elemento ?? null,
                                    item: rcmInput.item ?? null,
                                    grado: rcmInput.grado ?? null,
                                    procedencia: rcmInput.procedencia ?? null,
                                    cotas: rcmInput.cota1 && rcmInput.cota2 ? `${rcmInput.cota1} - ${rcmInput.cota2}` : rcmInput.cota1 ?? rcmInput.cota2 ?? null,
                                    ubicacionSector: rcmInput.ubicacionSector ?? null,
                                    vencimiento: rcmInput.vencimiento ?? false,
                                    observaciones: rcmInput.observaciones ?? null,
                                    cantidadMuestras: rcmInput.cantidadMuestras != null ? parseInt(rcmInput.cantidadMuestras.toString()) : null,
                                    estadoMuestra: estadoInicial,
                                    servicios: {
                                        create: ensayos
                                            .filter(e => productosMap[e.sku] !== undefined)
                                            .map(e => ({
                                                codigo: e.sku,
                                                nombre: e.nombre,
                                                cantidad: e.cantidad,
                                                estado: e.estadoOperativo ?? estadoInicial,
                                                producto: { connect: { productoId: productosMap[e.sku] } },
                                            })),
                                    },
                                    probetas: rcmInput.vencimiento && submuestrasVencimiento.length > 0
                                        ? {
                                            create: submuestrasVencimiento.map((s, idx) => ({
                                                numero: s.numero ?? idx + 1,
                                                fechaConfeccion: rcmInput.fechaConfeccion ? new Date(rcmInput.fechaConfeccion) : new Date(rcmInput.fechaCodificacion),
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
                    select: { id: true },
                })

                if (rcmInput.id != null) rcmIdMap[rcmInput.id] = rcmCriado.id
                return rcmCriado
            })

            const rcmsCriados = await Promise.all(rcmCreateTasks)

            // 2. Crear/actualizar CodigoAgrupadores en paralelo y enlazar RCMs
            const agrupadorTasks = agrupadoresPreparados.map(async ({ ag, codigoNombre, codigoId }) => {
                const rcmIdsVinculados = (ag.rcmsVinculados ?? [])
                    .map(r => rcmIdMap[r.id])
                    .filter((id): id is number => id !== undefined)

                if (rcmIdsVinculados.length === 0) return null

                const ensayosData = (ag.ensayos ?? [])
                    .filter(e => productosMap[e.sku] !== undefined)
                    .map(e => ({
                        sku: e.sku,
                        nombre: e.nombre,
                        producto: { connect: { productoId: productosMap[e.sku] } },
                    }))

                // Check if agrupador already exists (has dbId)
                if (ag.dbId) {
                    // Update existing agrupador
                    return tx.codigoAgrupador.update({
                        where: { id: ag.dbId },
                        data: {
                            descripcionServicio: ag.descripcionServicio ?? undefined,
                            cantidad: ag.cantidad ?? undefined,
                            facturacion: ag.facturacion ?? undefined,
                            ordenTrabajoId: ordenTrabajoId ?? undefined,
                            ensayos: {
                                deleteMany: {},
                                create: ensayosData,
                            },
                            rcms: { connect: rcmIdsVinculados.map(id => ({ id })) },
                        },
                        select: { id: true, codigoId: true, codigoNombre: true },
                    })
                }

                // Create new agrupador con codigoNombre/codigoId pre-asignados
                return tx.codigoAgrupador.create({
                    data: {
                        codigoId: codigoId!,
                        codigoNombre: codigoNombre!,
                        descripcionServicio: ag.descripcionServicio ?? null,
                        cantidad: ag.cantidad ?? 1,
                        unidad: ag.unidad ?? 'unid',
                        facturacion: ag.facturacion ?? 'Unitario',
                        ordenTrabajoId: ordenTrabajoId ?? null,
                        ensayos: {
                            create: ensayosData,
                        },
                        rcms: {
                            connect: rcmIdsVinculados.map(id => ({ id })),
                        },
                    },
                    select: { id: true, codigoId: true, codigoNombre: true },
                })
            })

            const agrupadoresResultados = await Promise.all(agrupadorTasks)
            const agrupadores = agrupadoresResultados.filter(
                (a): a is { id: number; codigoId: string; codigoNombre: string } => a !== null
            )
            // 3. Marcar la OT como CODIFICADA al finalizar la codificación
            if (ordenTrabajoId) {
                await tx.ordenTrabajo.update({
                    where: { id: ordenTrabajoId },
                    data: { estado: 'CODIFICADA' },
                })
            }
            return { rcms: rcmsCriados, agrupadores }
        }, {
            timeout: 15000, // margen de seguridad tras optimización
            maxWait: 5000,
        })

        return NextResponse.json(resultados, { status: 201 })
    } catch (error) {
        console.error('Error en guardar-lote:', error)
        return NextResponse.json(
            {
                error: 'Error al guardar el lote de RCMs',
                message: error instanceof Error ? error.message : 'Error desconocido',
            },
            { status: 500 }
        )
    }
}
