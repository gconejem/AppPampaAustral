import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const ultimoRCM = await prisma.rCM.findFirst({
                orderBy: {
                    id: 'desc'
                },
                select: {
                    numeroRcm: true
                }
            })

            let nuevoNumeroRcm = '1'
            if (ultimoRCM && ultimoRCM.numeroRcm) {
                const ultimoNumero = parseInt(ultimoRCM.numeroRcm)
                nuevoNumeroRcm = (ultimoNumero + 1).toString()
            }

            res.status(200).json({ numeroRcm: nuevoNumeroRcm })
        } catch (error) {
            console.error('Error al obtener próximo número de RCM:', error)
            res.status(500).json({ error: 'Error al obtener próximo número de RCM' })
        }
    } else {
        res.status(405).json({ error: 'Método no permitido' })
    }
}
