import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim()

    console.log('Query recibido:', query)

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    // Búsqueda simple sin filtros inicialmente
    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { rut: { contains: query, mode: 'insensitive' } },
          { nombreCliente: { contains: query, mode: 'insensitive' } }
        ]
      }
    })

    console.log('Clientes encontrados:', clientes.length)
    console.log('Muestra de clientes:', clientes.slice(0, 2))

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error detallado al buscar clientes:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack available')

    return NextResponse.json(
      {
        error: 'Error al buscar clientes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
