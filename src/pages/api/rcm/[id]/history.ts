import type { NextApiRequest, NextApiResponse } from 'next'
import { format } from 'date-fns'

// IMPORT: usar named import porque your lib/prisma no exporta default
import { prisma } from '@/lib/prisma' // <-- asegúrate que lib/prisma exporta `prisma`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query
    const rcmId = Number(id)
    if (Number.isNaN(rcmId)) return res.status(400).json({ error: 'Invalid RCM id' })

    if (!prisma) {
        console.error('Prisma client not available from @/lib/prisma')
        return res.status(500).json({ error: 'Prisma client not configured' })
    }

    try {
        // Nombre del cliente generado para el modelo RCMHistory suele ser rCMHistory (basado en el modelo)
        const historyClient = (prisma as any).rCMHistory ?? (prisma as any).rcmHistory ?? (prisma as any).rcm_history

        if (!historyClient) {
            console.error('Prisma client does not expose a history model property. Prisma client keys:', Object.keys(prisma as any))
            return res.status(500).json({ error: 'History model not available on Prisma client' })
        }

        if (req.method === 'GET') {
            const rows = await historyClient.findMany({
                where: { rcmId },
                orderBy: { createdAt: 'desc' }
            })

            const mapped = rows.map((r: any) => ({
                id: r.id,
                registro: r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy-HH:mm') : null,
                funcionario: r.funcionario ?? '',
                tipo: r.tipo ?? '',
                estAnterior: r.estAnterior ?? '',
                estNuevo: r.estNuevo ?? '',
                informe: r.informe ?? '---',
                fechaAccion: r.fechaAccion ? format(new Date(r.fechaAccion), 'dd/MM/yyyy') : '',
                observacion: r.observacion ?? ''
            }))

            return res.status(200).json(mapped)
        }

        if (req.method === 'POST') {
            const {
                tipo,
                funcionario,
                estAnterior,
                estNuevo,
                informe,
                fechaAccion,
                observacion
            } = req.body

            if (!tipo || !estNuevo) {
                return res.status(400).json({ error: 'tipo and estNuevo are required' })
            }

            const created = await historyClient.create({
                data: {
                    rcmId,
                    tipo,
                    funcionario: funcionario ?? null,
                    estAnterior: estAnterior ?? null,
                    estNuevo,
                    informe: informe ? Number(informe) : null,
                    fechaAccion: fechaAccion ? new Date(fechaAccion) : null,
                    observacion: observacion ?? null
                }
            })

            const mapped = {
                id: created.id,
                registro: created.createdAt ? format(new Date(created.createdAt), 'dd/MM/yyyy-HH:mm') : null,
                funcionario: created.funcionario ?? '',
                tipo: created.tipo ?? '',
                estAnterior: created.estAnterior ?? '',
                estNuevo: created.estNuevo ?? '',
                informe: created.informe ?? '---',
                fechaAccion: created.fechaAccion ? format(new Date(created.fechaAccion), 'dd/MM/yyyy') : '',
                observacion: created.observacion ?? ''
            }

            return res.status(201).json(mapped)
        }

        res.setHeader('Allow', ['GET', 'POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    } catch (err) {
        console.error('RCM history API error', err)
        return res.status(500).json({ error: 'server error' })
    }
}
