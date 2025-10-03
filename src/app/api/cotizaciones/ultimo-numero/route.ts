import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Forzar que este endpoint no use cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Obtener la última cotización con datos frescos
    const ultimaCotizacion = await prisma.cotizacion.findFirst({
      orderBy: {
        numeroCotizacion: 'desc'
      }
    })

    // Si no hay cotizaciones, empezar desde 1
    const siguienteNumero = ultimaCotizacion ? parseInt(ultimaCotizacion.numeroCotizacion) + 1 : 1

    return NextResponse.json(
      { siguienteNumero },
      {
        headers: {
          // Prevenir caching del navegador y CDN
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  } catch (error) {
    console.error('Error al obtener último número:', error)
    return NextResponse.json({ error: 'Error al obtener número de cotización' }, { status: 500 })
  }
}
