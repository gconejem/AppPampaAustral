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
      'Áridos': [
        'Muestreo de áridos',
        'Análisis de áridos'
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
    } else {
      // Si no hay areaId, ordenar todas las familias por área y luego por orden personalizado
      const ordenAreas = [
        'Suelo',
        'Hormigón',
        'Asfalto',
        'Elementos y Componentes',
        'Áridos',
        'Otros',
        'Servicios'
      ]
      
      familias.sort((a, b) => {
        const areaA = a.area?.nombre || ''
        const areaB = b.area?.nombre || ''
        
        const indexAreaA = ordenAreas.indexOf(areaA)
        const indexAreaB = ordenAreas.indexOf(areaB)
        
        // Si están en la misma área, ordenar por el orden personalizado de familias
        if (indexAreaA === indexAreaB) {
          const ordenFamilias = ordenFamiliasPorArea[areaA] || []
          const indexFamiliaA = ordenFamilias.indexOf(a.nombre)
          const indexFamiliaB = ordenFamilias.indexOf(b.nombre)
          return indexFamiliaA - indexFamiliaB
        }
        
        // Si están en áreas diferentes, ordenar por área
        return indexAreaA - indexAreaB
      })
    }

    return NextResponse.json(familias)
  } catch (error) {
    console.error('Error al obtener familias:', error)
    return NextResponse.json({ error: 'Error al obtener familias' }, { status: 500 })
  }
}
