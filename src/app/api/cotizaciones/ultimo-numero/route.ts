import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Obtener la última cotización
    const ultimaCotizacion = await prisma.cotizacion.findFirst({
      orderBy: {
        numeroCotizacion: 'desc'
      }
    })

    // Si no hay cotizaciones, empezar desde 1
    const siguienteNumero = ultimaCotizacion ? parseInt(ultimaCotizacion.numeroCotizacion) + 1 : 1

    return NextResponse.json({ siguienteNumero })
  } catch (error) {
    console.error('Error al obtener último número:', error)
    return NextResponse.json({ error: 'Error al obtener número de cotización' }, { status: 500 })
  }
}
