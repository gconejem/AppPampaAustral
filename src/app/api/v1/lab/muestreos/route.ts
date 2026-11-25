import { NextResponse } from 'next/server'
import { loadMuestreosConRetiro } from '@/lib/lab-muestreos'
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

    // Buscar muestreos de hormigón de la obra
    process.stdout.write(`🔍 Buscando muestreos para obra: ${obra}\n`)
    const muestreos = await loadMuestreosConRetiro({
      obra: { numeroObra: obra },
      sinRetiro,
      sortDirection: sortDirection === 'DESC' ? 'desc' : 'asc',
      take: 100
    })

    process.stdout.write(`✅ Found ${muestreos.length} muestreos for obra ${obra}\n`)

    if (muestreos.length > 0) {
      process.stdout.write('\n📦 TIPOS DE MUESTREOS ENCONTRADOS:\n')
      muestreos.forEach((item, idx) => {
        const tipo = item.orden.hormigonFresco ? 'Hormigón Fresco' : item.orden.testigos ? 'Testigos' : item.orden.muestreoMaterial ? 'Material' : 'Otro'
        process.stdout.write(`  [${idx + 1}] ${item.orden.clave} - ${tipo} - retirada: ${item.retirada}\n`)
      })
    }

    // Transformar datos reales
    const resultados = muestreos.map(({ orden, respuesta, retirada }) => {
      const hormigon = orden.hormigonFresco
      const testigo = orden.testigos
      const tipo = hormigon || orden.fklbdocver.startsWith('R-12-39')
        ? 'Hormigón Fresco'
        : testigo
          ? 'Testigos'
          : 'Muestreo'
      
      const tarjetasRespuesta = Array.isArray(respuesta.nTarjetaArray)
        ? respuesta.nTarjetaArray.map((tarjeta: unknown) => String(tarjeta))
        : []
      const numeroTarjeta = ordenTrabajoTarjetasToLegacyString(orden.numeroTarjeta) ||
        tarjetasRespuesta.join(',') ||
        String(respuesta.num_tarjeta || '')

      return {
        CODIGO: orden.clave || numeroTarjeta || `OT-${orden.id}`,
        OTNUMERO: orden.clave || numeroTarjeta || `OT-${orden.id}`, // Para el combobox de retiro
        num_tarjeta: numeroTarjeta, // Para el combobox de retiro
        descrip_tipo_probeta: tipo, // Para el combobox de retiro
        FECHA: orden.createdAt,
        FECHATXT: '',
        TIPO: tipo,
        GRADO: testigo?.grado || hormigon?.tipoHormigon || respuesta.tipo_hormigon || '',
        ELEMENTO: hormigon?.elementoHormigonado || respuesta.elemento_hormigonado || '',
        UBICACION: hormigon?.ubicacionHormigonado || respuesta.ubicacion_hormigonado || '',
        PROBETAS: hormigon?.cantidadProbetas || respuesta.cantidad_probetas || 0,
        ASENTAMIENTO: hormigon?.conoAsentamiento || respuesta.cono_asentamiento || null,
        retirada,
        RETIRADA: retirada
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
