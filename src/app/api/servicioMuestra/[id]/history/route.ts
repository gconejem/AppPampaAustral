import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params

    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    try {
        const servicioMuestraId = Number(id)

        console.log(`📊 ===== INICIANDO BÚSQUEDA DE HISTORIAL =====`)
        console.log(`📊 servicioMuestraId recibido: ${servicioMuestraId}`)
        console.log(`📊 Tipo: ${typeof servicioMuestraId}`)

        // ✅ Primero verificar si el ServicioMuestra existe
        const servicioMuestra = await prisma.servicioMuestra.findUnique({
            where: { id: servicioMuestraId },
            select: {
                id: true,
                muestraId: true,
                productoId: true,
                estado: true
            }
        })

        console.log(`📦 ServicioMuestra encontrado:`, servicioMuestra)

        if (!servicioMuestra) {
            console.log(`⚠️ ServicioMuestra ${servicioMuestraId} no existe`)
            return NextResponse.json({ error: 'ServicioMuestra no encontrado' }, { status: 404 })
        }

        // ✅ Consultar historial
        console.log(`🔍 Buscando en ServicioMuestraHistorial donde servicioMuestraId = ${servicioMuestraId}`)

        const historial = await prisma.servicioMuestraHistorial.findMany({
            where: { servicioMuestraId },
            orderBy: { registro: 'desc' },
            include: {
                servicioMuestra: {
                    include: {
                        producto: true,
                        muestra: true
                    }
                }
            }
        })

        console.log(`📊 Registros encontrados: ${historial.length}`)

        if (historial.length > 0) {
            console.log(`📋 Primer registro completo:`, JSON.stringify(historial[0], null, 2))
        } else {
            console.log(`⚠️ No se encontraron registros de historial para servicioMuestraId: ${servicioMuestraId}`)

            // Debug adicional: buscar TODOS los registros para ver qué IDs existen
            const todosLosRegistros = await prisma.servicioMuestraHistorial.findMany({
                select: {
                    id: true,
                    servicioMuestraId: true,
                    tipo: true,
                    registro: true
                },
                take: 10
            })

            console.log(`📊 Muestra de registros existentes en ServicioMuestraHistorial:`, todosLosRegistros)
        }

        // ✅ Mapear al formato esperado por el frontend
        const mapped = historial.map(h => ({
            registro: h.registro,
            funcionario: h.funcionario,
            aplicadoA: h.aplicadoA,
            ensayoServicio: h.ensayoServicio ?? h.servicioMuestra?.producto?.nombre ?? null,
            tipo: h.tipo,
            estAnterior: h.estAnterior,
            estNuevo: h.estNuevo,
            fechaAccion: h.fechaAccion,
            fechaInicioEnsayo: h.fechaInicioEnsayo,
            fechaFinEnsayo: h.fechaFinEnsayo,
            observacion: h.observacion,
            motivo: h.motivo,
            informe: h.informe
        }))

        console.log(`✅ Retornando ${mapped.length} registros mapeados`)

        return NextResponse.json(mapped)
    } catch (error) {
        console.error('❌ Error fetching servicioMuestra history:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // ✅ servicioMuestraId viene del parámetro de la URL
        const servicioMuestraId = parseInt(params.id)

        if (isNaN(servicioMuestraId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const body = await request.json()

        console.log('📝 Creating history entry:', { servicioMuestraId, body })

        // Validación básica
        if (!body.tipo || !body.estNuevo) {
            return NextResponse.json(
                { error: 'Campos requeridos: tipo, estNuevo' },
                { status: 400 }
            )
        }

        const estadoNuevo = String(body.estNuevo)
        const estadoNuevoUpper = estadoNuevo.trim().toUpperCase()
        const skipServicioEstadoUpdate = Boolean(body.skipServicioEstadoUpdate)
        let fechaAccion = new Date()

        if (body?.fechaAccion) {
            const rawFechaAccion = String(body.fechaAccion).trim()

            if (/^\d{4}-\d{2}-\d{2}$/.test(rawFechaAccion)) {
                const [year, month, day] = rawFechaAccion.split('-').map(Number)

                fechaAccion = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
            } else {
                const parsed = new Date(rawFechaAccion)

                if (!isNaN(parsed.getTime())) {
                    fechaAccion = parsed
                }
            }
        }

        const fechaFinEnsayo =
            body?.fechaFinEnsayo
                ? new Date(String(body.fechaFinEnsayo))
                : estadoNuevoUpper === 'ENSAYADO'
                    ? new Date()
                    : null

        const { historyEntry, servicioRcmSyncCount } = await prisma.$transaction(async tx => {
            const historialInicioPrevio = estadoNuevoUpper === 'ENSAYADO' && !body?.fechaInicioEnsayo
                ? await tx.servicioMuestraHistorial.findFirst({
                    where: { servicioMuestraId, fechaInicioEnsayo: { not: null } },
                    orderBy: { registro: 'desc' },
                    select: { fechaInicioEnsayo: true }
                })
                : null
            const fechaInicioEnsayo = body?.fechaInicioEnsayo
                ? new Date(String(body.fechaInicioEnsayo))
                : historialInicioPrevio?.fechaInicioEnsayo ?? (estadoNuevoUpper === 'EN_PROCESO' ? new Date() : null)

            // ✅ Crear registro de historial - servicioMuestraId viene del param, NO del body
            const createdHistoryEntry = await tx.servicioMuestraHistorial.create({
                data: {
                    servicioMuestraId, // ← CORRECTO: usa el param de la URL
                    registro: new Date(),
                    funcionario: body.funcionario ?? 'Usuario',
                    aplicadoA: body.aplicadoA ?? null,
                    ensayoServicio: body.ensayoServicio ?? null,
                    tipo: body.tipo,
                    estAnterior: body.estAnterior ?? body.estPrev ?? null,
                    estNuevo: estadoNuevo,
                    fechaAccion,
                    fechaInicioEnsayo: fechaInicioEnsayo && !isNaN(fechaInicioEnsayo.getTime()) ? fechaInicioEnsayo : null,
                    fechaFinEnsayo: fechaFinEnsayo && !isNaN(fechaFinEnsayo.getTime()) ? fechaFinEnsayo : null,
                    observacion: body.observacion ?? null,
                    motivo: body.motivo ?? null,
                    informe: body.informe ?? null
                }
            })

            if (skipServicioEstadoUpdate) {
                return {
                    historyEntry: createdHistoryEntry,
                    servicioRcmSyncCount: 0
                }
            }

            // ✅ Actualizar estado del servicio de muestra
            const servicioMuestra = await tx.servicioMuestra.update({
                where: { id: servicioMuestraId },
                data: { estado: estadoNuevo },
                select: {
                    id: true,
                    productoId: true,
                    muestra: {
                        select: {
                            rcmId: true
                        }
                    }
                }
            })

            // ✅ Sincronizar también ServicioRCM para evitar desfase entre pantallas
            const syncServicioRcm = await tx.servicioRCM.updateMany({
                where: {
                    rcmId: servicioMuestra.muestra.rcmId,
                    productoId: servicioMuestra.productoId
                },
                data: {
                    estadoOperativo: estadoNuevo,
                    estado: estadoNuevo
                }
            })

            return {
                historyEntry: createdHistoryEntry,
                servicioRcmSyncCount: syncServicioRcm.count
            }
        })

        console.log('✅ History entry created:', historyEntry)
        if (skipServicioEstadoUpdate) {
            console.log(`✅ Saved subitem history for servicioMuestra ${servicioMuestraId} without updating parent state`)
        } else {
            console.log(`✅ Updated servicioMuestra ${servicioMuestraId} estado to ${estadoNuevo}`)
            console.log(`✅ Synced ServicioRCM rows: ${servicioRcmSyncCount}`)
        }

        return NextResponse.json(
            {
                ...historyEntry,
                servicioRcmSyncCount
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('❌ Error creating servicioMuestra history:', error)
        return NextResponse.json(
            {
                error: 'Error al crear historial',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}
