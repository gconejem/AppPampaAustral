import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const obraNumero = searchParams.get('obra') || '9139'

    console.log('🔍 Verificando datos en la base de datos...')

    // 1. Verificar si existe la obra
    const obra = await prisma.obra.findFirst({
      where: { numeroObra: obraNumero }
    })
    console.log(`📋 Obra ${obraNumero}:`, obra ? `Encontrada (ID: ${obra.obraId}, Nombre: ${obra.nombreObra})` : 'NO ENCONTRADA')

    if (!obra) {
      return NextResponse.json({
        error: `Obra ${obraNumero} no existe en la base de datos`,
        obraNumero,
        exists: false
      })
    }

    // 2. Verificar agendas asociadas a la obra
    const agendas = await prisma.agenda.findMany({
      where: { obraId: obra.obraId },
      take: 5
    })
    console.log(`📅 Agendas para obra ${obraNumero}: ${agendas.length}`)

    // 3. Verificar órdenes de trabajo
    const ordenesTrabajo = await prisma.ordenTrabajo.findMany({
      where: {
        agenda: {
          obraId: obra.obraId
        }
      },
      include: {
        tipoOT: true,
        hormigonFresco: true,
        densidad: true,
        testigos: true,
        retiroProbeta: true
      },
      take: 10
    })
    console.log(`📝 Órdenes de trabajo: ${ordenesTrabajo.length}`)

    // 4. Desglose por tipo
    const conHormigon = ordenesTrabajo.filter(ot => ot.hormigonFresco).length
    const conDensidad = ordenesTrabajo.filter(ot => ot.densidad).length
    const conTestigos = ordenesTrabajo.filter(ot => ot.testigos).length
    const conRetiro = ordenesTrabajo.filter(ot => ot.retiroProbeta).length
    const sinRetiro = ordenesTrabajo.filter(ot => (ot.hormigonFresco || ot.testigos) && !ot.retiroProbeta).length

    console.log(`  - Con hormigonFresco: ${conHormigon}`)
    console.log(`  - Con densidad: ${conDensidad}`)
    console.log(`  - Con testigos: ${conTestigos}`)
    console.log(`  - Con retiroProbeta: ${conRetiro}`)
    console.log(`  - Muestreos SIN retiro: ${sinRetiro}`)

    // 5. Mostrar algunas órdenes de ejemplo
    const ejemplos = ordenesTrabajo.slice(0, 3).map(ot => ({
      id: ot.id,
      clave: ot.clave,
      tipoOT: ot.tipoOT?.descripcion,
      numeroTarjeta: ot.numeroTarjeta,
      tieneHormigon: !!ot.hormigonFresco,
      tieneDensidad: !!ot.densidad,
      tieneTestigos: !!ot.testigos,
      tieneRetiro: !!ot.retiroProbeta,
      createdAt: ot.createdAt
    }))

    return NextResponse.json({
      obra: {
        id: obra.obraId,
        numero: obra.numeroObra,
        nombre: obra.nombreObra
      },
      estadisticas: {
        agendas: agendas.length,
        ordenesTrabajo: ordenesTrabajo.length,
        conHormigon,
        conDensidad,
        conTestigos,
        conRetiro,
        sinRetiro
      },
      ejemplosOrdenes: ejemplos,
      mensaje: ordenesTrabajo.length === 0 
        ? '⚠️ No hay órdenes de trabajo para esta obra. Necesitas crear datos de prueba.'
        : sinRetiro === 0
        ? '⚠️ No hay muestreos sin retiro. Todos los muestreos ya tienen retiro asociado.'
        : `✅ Hay ${sinRetiro} muestreos disponibles para retiro`
    })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
