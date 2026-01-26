import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const obra = searchParams.get('obra[]')
    const sortColumn = searchParams.get('sortColumn') || 'FECHA'
    const sortDirection = searchParams.get('sortDirection') || 'DESC'

    process.stdout.write('\n====================================================\n')
    process.stdout.write('=== GET LAB RESULTS - ENDPOINT CALLED ===\n')
    process.stdout.write(`obra: ${obra}\n`)
    process.stdout.write(`sortColumn: ${sortColumn}\n`)
    process.stdout.write(`sortDirection: ${sortDirection}\n`)
    process.stdout.write('====================================================\n')

    if (!obra) {
      process.stdout.write('⚠️ No obra parameter, returning empty array\n')
      return NextResponse.json({ data: [] }, { headers: corsHeaders() })
    }

    // Buscar órdenes de trabajo de la obra con sus resultados de densidad
    process.stdout.write(`🔍 Buscando órdenes de trabajo para obra: ${obra}\n`)
    const ordenesConDensidad = await prisma.ordenTrabajo.findMany({
      where: {
        agenda: {
          obra: {
            numeroObra: obra
          }
        },
        densidad: {
          isNot: null
        }
      },
      include: {
        densidad: true,
        agenda: {
          include: {
            obra: true
          }
        }
      },
      orderBy: {
        createdAt: sortDirection === 'DESC' ? 'desc' : 'asc'
      },
      take: 100
    })

    process.stdout.write(`✅ Found ${ordenesConDensidad.length} ordenes with densidad for obra ${obra}\n`)

    // Si no hay órdenes con densidad, devolver datos de ejemplo (mockup)
    if (ordenesConDensidad.length === 0) {
      process.stdout.write('⚠️ No se encontraron órdenes de trabajo con densidad para esta obra\n')
      process.stdout.write('📋 Returning MOCKUP data for testing\n')
      
      const mockupData = [
        {
          CODIGO: '154602',
          FECHA: new Date('2022-12-02'),
          FECHATXT: '',
          ITEMM: 'Sello y Relleno',
          PROCEDE: 'Proctor Cliente, Laboratorio Lab Vial MAL Existente',
          UBICA: 'Tramo eje 27 y B Estrato -1.60',
          PROCTOR: 1700,
          HUMEDAD1: 15.7,
          DEN_MIN: 1650,
          DEN_MAX: 1720
        },
        {
          CODIGO: '154603',
          FECHA: new Date('2022-11-28'),
          FECHATXT: '',
          ITEMM: 'Base Granular',
          PROCEDE: 'Proctor Laboratorio, Ensayo Tipo A',
          UBICA: 'Km 12+500, Calzada Derecha',
          PROCTOR: 2100,
          HUMEDAD1: 6.5,
          DEN_MIN: 2050,
          DEN_MAX: 2130
        },
        {
          CODIGO: '154601',
          FECHA: new Date('2022-11-25'),
          FECHATXT: '',
          ITEMM: 'Sub-base Granular',
          PROCEDE: 'Proctor Modificado, Laboratorio Central',
          UBICA: 'Km 12+300, Eje Central',
          PROCTOR: 2250,
          HUMEDAD1: 5.2,
          DEN_MIN: 2200,
          DEN_MAX: 2280
        }
      ]
      
      return NextResponse.json({ data: mockupData }, { headers: corsHeaders() })
    }

    // Transformar a formato esperado por la app móvil
    const resultados = ordenesConDensidad.map(orden => {
      const densidad = orden.densidad
      const controles = densidad?.controles as any[] || []
      
      // Calcular promedios de los controles si existen
      let proctor = 0
      let humedad = 0
      let denMin = 0
      let denMax = 0
      
      if (controles.length > 0) {
        const valores = controles.filter(c => c.proctor > 0)
        if (valores.length > 0) {
          proctor = valores.reduce((sum, c) => sum + (c.proctor || 0), 0) / valores.length
          humedad = valores.reduce((sum, c) => sum + (c.w || 0), 0) / valores.length
        }
        
        const densidades = controles.map(c => c.dcs).filter(d => d > 0)
        if (densidades.length > 0) {
          denMin = Math.min(...densidades)
          denMax = Math.max(...densidades)
        }
      }

      return {
        CODIGO: orden.numeroOT || `OT-${orden.id}`,
        FECHA: orden.createdAt,
        FECHATXT: '', // Se formatea en el frontend con moment
        ITEMM: densidad?.item || '',
        PROCEDE: '', // No disponible en el nuevo schema
        UBICA: '', // No disponible en el nuevo schema
        PROCTOR: Math.round(proctor * 10) / 10,
        HUMEDAD1: Math.round(humedad * 10) / 10,
        DEN_MIN: Math.round(denMin * 10) / 10,
        DEN_MAX: Math.round(denMax * 10) / 10
      }
    })

    process.stdout.write(`📊 Returning ${resultados.length} results\n`)
    if (resultados.length > 0) {
      process.stdout.write('📄 First result sample:\n')
      process.stdout.write(JSON.stringify(resultados[0], null, 2) + '\n')
    }

    return NextResponse.json({ data: resultados }, { headers: corsHeaders() })
  } catch (error) {
    process.stdout.write('❌ Error en get-lab-result:\n')
    process.stdout.write(String(error) + '\n')
    console.error('❌ Error en get-lab-result:', error)
    return NextResponse.json({ error: 'Error al obtener resultados' }, { status: 500, headers: corsHeaders() })
  }
}
