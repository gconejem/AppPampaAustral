import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Use a singleton PrismaClient to avoid multiple instances in dev (HMR)
 */
const prisma: PrismaClient = (global as any).prisma || new PrismaClient()
    ; (global as any).prisma = prisma

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Missing rcm id' })
    const rcmId = Number(id)
    if (Number.isNaN(rcmId)) return res.status(400).json({ error: 'Invalid rcm id' })

    try {
        if (req.method === 'GET') {
            // devolver historial para el RCM
            const takeRaw = Array.isArray(req.query.take) ? req.query.take[0] : (req.query.take as any)
            const take = takeRaw != null ? Number(takeRaw) : null
            const rows = await prisma.rCMHistory.findMany({
                where: { rcmId },
                orderBy: [{ fechaAccion: 'desc' }, { id: 'desc' }],
                ...(Number.isFinite(take) && (take as number) > 0 ? { take: Math.min(500, Math.max(1, take as number)) } : {})
            })
            return res.status(200).json(rows)
        }

        if (req.method === 'POST') {
            const {
                tipo,
                tipoEstado,
                motivo,
                observacion,
                usuario,
                funcionario,
                estPrev,
                estNuevo,
                informe,
                aplicadoA
            } = req.body ?? {}

            const finalTipo = typeof tipo === 'string' && tipo.trim() ? tipo : 'Ope'
            const finalFuncionario =
                (typeof funcionario === 'string' && funcionario.trim())
                    ? funcionario
                    : (typeof usuario === 'string' && usuario.trim())
                        ? usuario
                        : 'Usuario'

            // Si el front no envía estPrev (o viene vacío), usar el estado actual desde BBDD.
            // Esto evita que el historial muestre "-" en EST. ANTERIOR.
            const dbPrev = await prisma.rCM.findUnique({
                where: { id: rcmId },
                select: { estadoOperativo: true }
            })
            const finalEstPrev =
                (typeof estPrev === 'string' && estPrev.trim())
                    ? estPrev.trim()
                    : (typeof estPrev === 'string' ? null : (estPrev ?? null)) ?? dbPrev?.estadoOperativo ?? null

            const explicitEstNuevo = (typeof estNuevo === 'string' && estNuevo.trim()) ? estNuevo.trim() : null
            const tipoEstadoNorm = String(tipoEstado ?? '').trim().toUpperCase()
            const isInformeEvent = tipoEstadoNorm === 'INFORME_AUTO' || tipoEstadoNorm === 'INFORME_MANUAL'
            // `RCMHistory.estNuevo` es obligatorio en Prisma. Para entradas que no cambian el estado (ej: INFORME_AUTO),
            // guardamos un valor informativo, pero NO actualizamos `RCM.estadoOperativo`.
            const finalEstNuevo =
                explicitEstNuevo ??
                (isInformeEvent ? (dbPrev?.estadoOperativo ?? 'SIN_CAMBIO') : null) ??
                ((typeof tipoEstado === 'string' && tipoEstado.trim()) ? tipoEstado.trim() : null) ??
                'SIN_CAMBIO'

            const created = await prisma.rCMHistory.create({
                data: {
                    rcm: { connect: { id: rcmId } },
                    tipo: finalTipo,
                    funcionario: finalFuncionario,
                    fechaAccion: new Date(),
                    estAnterior: finalEstPrev,
                    estNuevo: finalEstNuevo,
                    observacion: observacion ?? motivo ?? null,
                    informe: informe ?? null,
                    aplicadoA: (typeof aplicadoA === 'string' && aplicadoA.trim()) ? aplicadoA.trim() : null,
                    ...(typeof tipoEstado === 'string' ? { tipoEstado } : {}),
                    ...(typeof motivo === 'string' ? { motivo } : {})
                }
            })

            // actualizar estado operativo en RCM si corresponde (no fatal)
            // Solo cuando el front envía un `estNuevo` explícito (cambio de estado real).
            if (explicitEstNuevo) {
                try {
                    const appliedKey = String(aplicadoA ?? '').trim().toUpperCase()
                    const applyToCp = appliedKey === 'CP' || appliedKey === 'CODIGO_PRODUCTO' || appliedKey === 'CODIGO PRODUCTO'

                    const isEvento =
                        String(tipoEstado ?? '').trim().toUpperCase() === 'EVENTO' ||
                        String(finalTipo ?? '').trim() === 'Evento Abierto'

                    // Si la acción se aplica al CP (Código Producto), hay que propagar el estado a todos los RCM
                    // del mismo agrupador para que el seguimiento (que agrupa por CP) refleje el cambio.
                    if (applyToCp || isEvento) {
                        const base = await prisma.rCM.findUnique({
                            where: { id: rcmId },
                            select: { codigoAgrupadorId: true, codigoProducto: true, ordenTrabajoId: true }
                        })

                        if (base?.codigoAgrupadorId) {
                            await prisma.rCM.updateMany({
                                where: { codigoAgrupadorId: base.codigoAgrupadorId },
                                data: { estadoOperativo: explicitEstNuevo }
                            })
                        } else if (base?.codigoProducto && base?.ordenTrabajoId) {
                            await prisma.rCM.updateMany({
                                where: { codigoProducto: base.codigoProducto, ordenTrabajoId: base.ordenTrabajoId },
                                data: { estadoOperativo: explicitEstNuevo }
                            })
                        } else {
                            await prisma.rCM.update({
                                where: { id: rcmId },
                                data: { estadoOperativo: explicitEstNuevo }
                            })
                        }
                    } else {
                        await prisma.rCM.update({
                            where: { id: rcmId },
                            data: { estadoOperativo: explicitEstNuevo }
                        })
                    }
                } catch (e) {
                    // no bloquear la creación del historial si falla la actualización del RCM
                    // eslint-disable-next-line no-console
                    console.warn('Warning: failed to update RCM.estadoOperativo', e)
                }
            }

            return res.status(201).json(created)
        }

        if (req.method === 'PUT') {
            const {
                historyId,
                tipo,
                tipoEstado,
                motivo,
                observacion,
                usuario,
                funcionario,
                estPrev,
                estNuevo,
                informe,
                aplicadoA
            } = req.body ?? {}

            const hid = Number(historyId)
            if (!Number.isFinite(hid) || hid <= 0) {
                return res.status(400).json({ error: 'Invalid historyId' })
            }

            const existing = await prisma.rCMHistory.findFirst({
                where: { id: hid, rcmId }
            })

            if (!existing) {
                return res.status(404).json({ error: 'History entry not found for this RCM' })
            }

            const finalTipo = typeof tipo === 'string' && tipo.trim() ? tipo : existing.tipo
            const finalFuncionario =
                (typeof funcionario === 'string' && funcionario.trim())
                    ? funcionario
                    : (typeof usuario === 'string' && usuario.trim())
                        ? usuario
                        : existing.funcionario || 'Usuario'

            const finalEstPrev =
                (typeof estPrev === 'string' && estPrev.trim())
                    ? estPrev.trim()
                    : (estPrev !== undefined ? (estPrev ?? null) : existing.estAnterior)

            const explicitEstNuevo = (typeof estNuevo === 'string' && estNuevo.trim()) ? estNuevo.trim() : null
            const tipoEstadoNorm = String(tipoEstado ?? existing.tipoEstado ?? '').trim().toUpperCase()
            const isInformeEvent = tipoEstadoNorm === 'INFORME_AUTO' || tipoEstadoNorm === 'INFORME_MANUAL'
            const finalEstNuevo =
                explicitEstNuevo ??
                (isInformeEvent ? (existing.estNuevo ?? 'SIN_CAMBIO') : null) ??
                ((typeof tipoEstado === 'string' && tipoEstado.trim()) ? tipoEstado.trim() : null) ??
                existing.estNuevo ??
                'SIN_CAMBIO'

            const finalObservacion =
                observacion !== undefined
                    ? observacion
                    : (motivo !== undefined ? motivo : existing.observacion)

            const finalAplicadoA =
                aplicadoA !== undefined
                    ? ((typeof aplicadoA === 'string' && aplicadoA.trim()) ? aplicadoA.trim() : null)
                    : existing.aplicadoA

            const updated = await prisma.rCMHistory.update({
                where: { id: hid },
                data: {
                    tipo: finalTipo,
                    funcionario: finalFuncionario,
                    estAnterior: finalEstPrev,
                    estNuevo: finalEstNuevo,
                    observacion: finalObservacion,
                    informe: informe !== undefined ? (informe ?? null) : existing.informe,
                    aplicadoA: finalAplicadoA,
                    ...(typeof tipoEstado === 'string' ? { tipoEstado } : {}),
                    ...(typeof motivo === 'string' ? { motivo } : {})
                }
            })

            if (explicitEstNuevo) {
                try {
                    const appliedKey = String(aplicadoA ?? updated.aplicadoA ?? '').trim().toUpperCase()
                    const applyToCp = appliedKey === 'CP' || appliedKey === 'CODIGO_PRODUCTO' || appliedKey === 'CODIGO PRODUCTO'

                    const isEvento =
                        String(tipoEstado ?? updated.tipoEstado ?? '').trim().toUpperCase() === 'EVENTO' ||
                        String(finalTipo ?? '').trim() === 'Evento Abierto'

                    if (applyToCp || isEvento) {
                        const base = await prisma.rCM.findUnique({
                            where: { id: rcmId },
                            select: { codigoAgrupadorId: true, codigoProducto: true, ordenTrabajoId: true }
                        })

                        if (base?.codigoAgrupadorId) {
                            await prisma.rCM.updateMany({
                                where: { codigoAgrupadorId: base.codigoAgrupadorId },
                                data: { estadoOperativo: explicitEstNuevo }
                            })
                        } else if (base?.codigoProducto && base?.ordenTrabajoId) {
                            await prisma.rCM.updateMany({
                                where: { codigoProducto: base.codigoProducto, ordenTrabajoId: base.ordenTrabajoId },
                                data: { estadoOperativo: explicitEstNuevo }
                            })
                        } else {
                            await prisma.rCM.update({
                                where: { id: rcmId },
                                data: { estadoOperativo: explicitEstNuevo }
                            })
                        }
                    } else {
                        await prisma.rCM.update({
                            where: { id: rcmId },
                            data: { estadoOperativo: explicitEstNuevo }
                        })
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn('Warning: failed to update RCM.estadoOperativo on history PUT', e)
                }
            }

            return res.status(200).json(updated)
        }

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error creating/reading RCMHistory', err)
        return res.status(500).json({ error: 'Server error', details: String(err) })
    }
}
