import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const GET = async () => {
  try {
    const [total, pendientes, enProceso, finalizadas] = await Promise.all([
      // Total de solicitudes
      prisma.solicitud.count(),

      // Solicitudes pendientes
      prisma.solicitud.count({
        where: {
          estadoOperativo: 'PENDIENTE'
        }
      }),

      // Solicitudes en proceso
      prisma.solicitud.count({
        where: {
          estadoOperativo: 'EN_PROCESO'
        }
      }),

      // Solicitudes finalizadas
      prisma.solicitud.count({
        where: {
          estadoOperativo: 'FINALIZADO'
        }
      })
    ])

    return NextResponse.json({
      total,
      pendientes,
      enProceso,
      finalizadas
    })
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)

    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
