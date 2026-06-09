import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ordenTrabajoTarjetasToLegacyString } from '@/lib/orden-trabajo-tarjetas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ORIGINS = new Set([
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost'
])

function corsHeaders(origin?: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : null
  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders(request.headers.get('origin')) })
}

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin')
    const { searchParams } = new URL(request.url)
    const obra = searchParams.get('obra[]')
    const sortColumn = searchParams.get('sortColumn') || 'FECHA'
    const sortDirection = searchParams.get('sortDirection') || 'DESC'
    const sinRetiro = searchParams.get('sinRetiro') === 'true' // Nuevo parámetro para filtrar sin retiro

    process.stdout.write('\n====================================================\n')
    process.stdout.write('=== GET MUESTREOS - ENDPOINT CALLED ===\n')
    process.stdout.write(`obra: ${obra}\n`)
    process.stdout.write(`sortColumn: ${sortColumn}\n`)
    process.stdout.write(`sortDirection: ${sortDirection}\n`)
    process.stdout.write(`sinRetiro: ${sinRetiro}\n`)
    process.stdout.write('====================================================\n')

    if (!obra) {
      process.stdout.write('⚠️ No obra parameter, returning empty array\n')
      return NextResponse.json({ data: [] }, { headers: corsHeaders(origin) })
    }

    // Construir condiciones de WHERE
    const whereConditions: any = {
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
    }

    // Si se solicita solo muestreos sin retiro
    if (sinRetiro) {
      whereConditions.retiroProbeta = null
      process.stdout.write('🔍 Filtrando solo muestreos SIN retiro asociado\n')
    }

    // Buscar muestreos de hormigón de la obra
    process.stdout.write(`🔍 Buscando muestreos para obra: ${obra}\n`)
    const muestreos = await prisma.ordenTrabajo.findMany({
      where: whereConditions,
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

    process.stdout.write(`✅ Found ${muestreos.length} muestreos for obra ${obra}\n`)

    if (muestreos.length > 0) {
      process.stdout.write('\n📦 TIPOS DE MUESTREOS ENCONTRADOS:\n')
      muestreos.forEach((m, idx) => {
        const tipo = m.hormigonFresco ? 'Hormigón Fresco' : m.testigos ? 'Testigos' : m.muestreoMaterial ? 'Material' : 'Otro'
        process.stdout.write(`  [${idx + 1}] ${m.clave} - ${tipo}\n`)
      })
    }

    // Si no hay datos reales, devolver mockup
    if (muestreos.length === 0) {
      process.stdout.write('⚠️ No muestreos found, returning mockup\n')
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
      return NextResponse.json({ data: mockupData }, { headers: corsHeaders(origin) })
    }

    // Transformar datos reales
    const resultados = muestreos.map(orden => {
      const hormigon = orden.hormigonFresco
      const testigo = orden.testigos
      const tipo = hormigon ? 'Hormigón Fresco' : testigo ? 'Testigos' : 'Muestreo'
      
      const numeroTarjeta = ordenTrabajoTarjetasToLegacyString(orden.numeroTarjeta)

      return {
        CODIGO: orden.clave || numeroTarjeta || `OT-${orden.id}`,
        OTNUMERO: orden.clave || numeroTarjeta || `OT-${orden.id}`, // Para el combobox de retiro
        num_tarjeta: numeroTarjeta, // Para el combobox de retiro
        descrip_tipo_probeta: tipo, // Para el combobox de retiro
        FECHA: orden.createdAt,
        FECHATXT: '',
        TIPO: tipo,
        GRADO: testigo?.grado || hormigon?.tipoHormigon || '',
        ELEMENTO: hormigon?.elementoHormigonado || '',
        UBICACION: hormigon?.ubicacionHormigonado || '',
        PROBETAS: hormigon?.cantidadProbetas || 0,
        ASENTAMIENTO: hormigon?.conoAsentamiento || null
      }
    })

    process.stdout.write(`\n📊 Returning ${resultados.length} muestreos\n`)
    if (resultados.length > 0) {
      process.stdout.write('📄 First muestreo sample:\n')
      process.stdout.write(JSON.stringify(resultados[0], null, 2) + '\n')
    }

    return NextResponse.json({ data: resultados }, { headers: corsHeaders(origin) })
  } catch (error) {
    process.stdout.write('❌ Error en muestreos:\n')
    process.stdout.write(String(error) + '\n')
    console.error('❌ Error en muestreos:', error)
    return NextResponse.json({ error: 'Error al obtener muestreos' }, { status: 500, headers: corsHeaders(request.headers.get('origin')) })
  }
}
