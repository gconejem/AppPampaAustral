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

            const created = await prisma.rCMHistory.create({
                data: {
                    rcmId,
                    tipo: finalTipo,
                    funcionario: finalFuncionario,
                    fechaAccion: new Date(),
                    estAnterior: finalEstPrev,
                    estNuevo: estNuevo ?? null,
                    observacion: observacion ?? motivo ?? null,
                    informe: informe ?? null,
                    aplicadoA: (typeof aplicadoA === 'string' && aplicadoA.trim()) ? aplicadoA.trim() : null,
                    ...(typeof tipoEstado === 'string' ? { tipoEstado } : {}),
                    ...(typeof motivo === 'string' ? { motivo } : {})
                }
            })

            // actualizar estado operativo en RCM si corresponde (no fatal)
            if (estNuevo) {
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
                                data: { estadoOperativo: estNuevo }
                            })
                        } else if (base?.codigoProducto && base?.ordenTrabajoId) {
                            await prisma.rCM.updateMany({
                                where: { codigoProducto: base.codigoProducto, ordenTrabajoId: base.ordenTrabajoId },
                                data: { estadoOperativo: estNuevo }
                            })
                        } else {
                            await prisma.rCM.update({
                                where: { id: rcmId },
                                data: { estadoOperativo: estNuevo }
                            })
                        }
                    } else {
                        await prisma.rCM.update({
                            where: { id: rcmId },
                            data: { estadoOperativo: estNuevo }
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

        return res.status(405).json({ error: 'Method not allowed' })
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error creating/reading RCMHistory', err)
        return res.status(500).json({ error: 'Server error', details: String(err) })
    }
}
