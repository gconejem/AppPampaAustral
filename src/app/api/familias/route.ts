import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const areaId = searchParams.get('areaId')

    // Definir el orden personalizado de familias por área
    const ordenFamiliasPorArea: { [key: string]: string[] } = {
      'Suelo': [
        'Controles y Muestreos Terreno',
        'Análisis de Suelo',
        'Mecánica de Suelo',
        'Ensayos de Estructura',
        'Aridos para Suelos'
      ],
      'Hormigón': [
        'Hormigón Fresco',
        'Hormigón Endurecido',
        'Testigos Hormigón',
        'Áridos para Hormigón',
        'Premezcladoras Hormigón',
        'Otros Hormigón'
      ],
      'Asfalto': [
        'Control de Mezclas Terreno',
        'Áridos para Asfalto',
        'Testigos Y Mezclas',
        'Otros Asfalto'
      ],
      'Elementos y Componentes': [
        'Prefabricados de Hormigón',
        'Otros Elementos y Componentes'
      ],
      'Otros': [
        'Pintura'
      ],
      'Servicios': [
        'Adicionales',
        'Profesionales',
        'Otros Servicios'
      ]
    }

    const familias = await prisma.familia.findMany({
      where: areaId ? {
        areaId: parseInt(areaId)
      } : undefined,
      select: {
        id: true,
        nombre: true,
        area: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    // Si hay un areaId, ordenar las familias según el orden personalizado
    if (areaId) {
      const area = familias[0]?.area?.nombre
      if (area && ordenFamiliasPorArea[area]) {
        const ordenPersonalizado = ordenFamiliasPorArea[area]
        familias.sort((a, b) => {
          const indexA = ordenPersonalizado.indexOf(a.nombre)
          const indexB = ordenPersonalizado.indexOf(b.nombre)
          return indexA - indexB
        })
      }
    }

    return NextResponse.json(familias)
  } catch (error) {
    console.error('Error al obtener familias:', error)
    return NextResponse.json({ error: 'Error al obtener familias' }, { status: 500 })
  }
}
