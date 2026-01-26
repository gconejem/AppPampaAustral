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

    console.log('=== GET MUESTREOS ===')
    console.log('obra:', obra)

    if (!obra) {
      return NextResponse.json({ data: [] }, { headers: corsHeaders() })
    }

    // Buscar muestreos de hormigón de la obra
    const muestreos = await prisma.ordenTrabajo.findMany({
      where: {
        agenda: {
          obra: {
            numeroObra: obra
          }
        },
        OR: [
          { hormigonFresco: { isNot: null } },
          { muestreoMaterial: { isNot: null } },
          { testigos: { isNot: null } }
        ]
      },
      include: {
        hormigonFresco: true,
        muestreoMaterial: true,
        testigos: true,
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

    console.log(`Found ${muestreos.length} muestreos for obra ${obra}`)

    // Si no hay datos reales, devolver mockup
    if (muestreos.length === 0) {
      console.log('No data found, returning mockup')
      const mockupData = [
        {
          CODIGO: 'MH-001',
          FECHA: new Date('2022-12-01'),
          FECHATXT: '',
          TIPO: 'Hormigón Fresco',
          GRADO: 'H-30',
          ELEMENTO: 'Losa Nivel 2',
          UBICACION: 'Sector Norte',
          PROBETAS: 6,
          ASENTAMIENTO: 12
        },
        {
          CODIGO: 'MT-002',
          FECHA: new Date('2022-11-28'),
          FECHATXT: '',
          TIPO: 'Testigos',
          GRADO: 'H-25',
          ELEMENTO: 'Muro Contención',
          UBICACION: 'Eje A-B',
          PROBETAS: 3,
          ASENTAMIENTO: null
        }
      ]
      return NextResponse.json({ data: mockupData }, { headers: corsHeaders() })
    }

    // Transformar datos reales
    const resultados = muestreos.map(orden => {
      const hormigon = orden.hormigonFresco
      const testigo = orden.testigos
      
      return {
        CODIGO: orden.numeroOT || `OT-${orden.id}`,
        FECHA: orden.createdAt,
        FECHATXT: '',
        TIPO: hormigon ? 'Hormigón Fresco' : testigo ? 'Testigos' : 'Muestreo',
        GRADO: testigo?.grado || hormigon?.tipoHormigon || '',
        ELEMENTO: hormigon?.elementoHormigonado || '',
        UBICACION: hormigon?.ubicacionHormigonado || '',
        PROBETAS: hormigon?.cantidadProbetas || 0,
        ASENTAMIENTO: hormigon?.conoAsentamiento || null
      }
    })

    return NextResponse.json({ data: resultados }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error en muestreos:', error)
    return NextResponse.json({ error: 'Error al obtener muestreos' }, { status: 500, headers: corsHeaders() })
  }
}
