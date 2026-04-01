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
            const rows = await prisma.rCMHistory.findMany({
                where: { rcmId },
                orderBy: [{ fechaAccion: 'desc' }, { id: 'desc' }]
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
                informe
            } = req.body ?? {}

            const finalTipo = typeof tipo === 'string' && tipo.trim() ? tipo : 'Ope'
            const finalFuncionario =
                (typeof funcionario === 'string' && funcionario.trim())
                    ? funcionario
                    : (typeof usuario === 'string' && usuario.trim())
                        ? usuario
                        : 'Usuario'

            const created = await prisma.rCMHistory.create({
                data: {
                    rcmId,
                    ...(typeof finalTipo === 'string' ? { tipo: finalTipo } : {}),
                    funcionario: finalFuncionario,
                    fechaAccion: new Date(),
                    estAnterior: estPrev ?? null,
                    estNuevo: estNuevo ?? null,
                    observacion: observacion ?? motivo ?? null,
                    informe: informe ?? null,
                    ...(typeof tipoEstado === 'string' ? { tipoEstado } : {}),
                    ...(typeof motivo === 'string' ? { motivo } : {})
                }
            })

            // actualizar estado operativo en RCM si corresponde (no fatal)
            if (estNuevo) {
                try {
                    await prisma.rCM.update({
                        where: { id: rcmId },
                        data: { estadoOperativo: estNuevo }
                    })
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
