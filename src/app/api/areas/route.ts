import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const ordenPersonalizado = [
      'Suelo',
      'Hormigón',
      'Asfalto',
      'Elementos y Componentes',
      'Áridos',
      'Otros',
      'Servicios'
    ]

    const areas = await prisma.area.findMany({
      select: {
        id: true,
        nombre: true
      }
    })

    // Ordenar las áreas según el orden personalizado
    const areasOrdenadas = areas.sort((a, b) => {
      const indexA = ordenPersonalizado.indexOf(a.nombre)
      const indexB = ordenPersonalizado.indexOf(b.nombre)
      return indexA - indexB
    })

    return NextResponse.json(areasOrdenadas)
  } catch (error) {
    console.error('Error al obtener áreas:', error)
    return NextResponse.json({ error: 'Error al obtener áreas' }, { status: 500 })
  }
}
