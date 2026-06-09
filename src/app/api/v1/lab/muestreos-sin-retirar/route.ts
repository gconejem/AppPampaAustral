import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ordenTrabajoTarjetasToLegacyString } from '@/lib/orden-trabajo-tarjetas'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://localhost',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const obraId = searchParams.get('obraId')

    process.stdout.write('\n====================================================\n')
    process.stdout.write('=== GET MUESTREOS SIN RETIRAR - ENDPOINT CALLED ===\n')
    process.stdout.write(`obraId: ${obraId}\n`)
    process.stdout.write('====================================================\n')

    if (!obraId) {
      process.stdout.write('⚠️ No obraId parameter, returning empty array\n')
      return NextResponse.json({ data: [] }, { headers: corsHeaders() })
    }

    // Buscar órdenes de trabajo con hormigón fresco o testigos que NO tengan retiro de probeta
    process.stdout.write(`🔍 Buscando muestreos sin retirar para obra: ${obraId}\n`)
    
    const muestreosSinRetirar = await prisma.ordenTrabajo.findMany({
      where: {
        agenda: {
          obraId: parseInt(obraId)
        },
        OR: [
          { 
            hormigonFresco: { 
              isNot: null 
            }
          },
          { 
            testigos: { 
              isNot: null 
            }
          }
        ],
        retiroProbeta: null // No tiene retiro asociado
      },
      include: {
        hormigonFresco: true,
        testigos: true,
        tipoOT: true,
        agenda: {
          include: {
            obra: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    process.stdout.write(`✅ Found ${muestreosSinRetirar.length} muestreos sin retirar\n`)

    if (muestreosSinRetirar.length > 0) {
      process.stdout.write('\n📦 MUESTREOS SIN RETIRAR:\n')
      muestreosSinRetirar.forEach((m, idx) => {
        const tipo = m.hormigonFresco ? 'Hormigón Fresco' : 'Testigos'
        const tarjeta = ordenTrabajoTarjetasToLegacyString(m.numeroTarjeta) || 'Sin tarjeta'
        process.stdout.write(`  [${idx + 1}] OT: ${m.clave} | Tipo: ${tipo} | Tarjeta: ${tarjeta} | Fecha: ${m.createdAt.toISOString().split('T')[0]}\n`)
      })
    }

    // Transformar datos
    const resultados = muestreosSinRetirar.map(orden => {
      const hormigon = orden.hormigonFresco
      const testigo = orden.testigos
      const tipo = hormigon ? 'Hormigón Fresco' : testigo ? 'Testigos' : 'Muestreo'
      const descripcion = hormigon 
        ? `${hormigon.tipoHormigon || ''} - ${hormigon.elementoHormigonado || ''}`.trim()
        : testigo 
        ? `${testigo.grado || ''} - ${testigo.elemento || ''}`.trim()
        : ''

      const numeroTarjeta = ordenTrabajoTarjetasToLegacyString(orden.numeroTarjeta)

      return {
        OTNUMERO: orden.clave,
        FECHA: orden.createdAt,
        num_tarjeta: numeroTarjeta,
        descrip_tipo_probeta: tipo,
        descripcion: descripcion,
        tipo_hormigon: hormigon?.tipoHormigon || testigo?.grado || '',
        cantidad_probetas: hormigon?.cantidadProbetas || 0,
        elemento: hormigon?.elementoHormigonado || testigo?.elemento || ''
      }
    })

    process.stdout.write(`\n📊 Returning ${resultados.length} muestreos sin retirar\n`)
    if (resultados.length > 0) {
      process.stdout.write('📄 First result sample:\n')
      process.stdout.write(JSON.stringify(resultados[0], null, 2) + '\n')
    }

    return NextResponse.json({ data: resultados }, { headers: corsHeaders() })
  } catch (error) {
    process.stdout.write('❌ Error en muestreos-sin-retirar:\n')
    process.stdout.write(String(error) + '\n')
    console.error('❌ Error en muestreos-sin-retirar:', error)
    return NextResponse.json(
      { error: 'Error al obtener muestreos sin retirar' },
      { status: 500, headers: corsHeaders() }
    )
  }
}
