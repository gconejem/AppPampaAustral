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
    const codigo = searchParams.get('codigo[]')

    console.log('=== GET LAB LBOTMAE ===')
    console.log('codigo:', codigo)

    // Si no hay código o está vacío, devolver array vacío
    if (!codigo || codigo.trim() === '') {
      console.log('No codigo parameter or empty, returning empty array')
      return NextResponse.json({ data: [] }, { headers: corsHeaders() })
    }

    // Buscar órdenes de trabajo por código
    const codigos = codigo.split(',').map(c => c.trim()).filter(c => c.length > 0)
    
    const ordenesTrabajo = await prisma.ordenTrabajo.findMany({
      where: {
        numeroOT: {
          in: codigos
        }
      },
      include: {
        tipoOT: true,
        estadoOT: true
      }
    })

    console.log(`Found ${ordenesTrabajo.length} ordenes for codigos: ${codigos.join(', ')}`)

    // Si no hay datos, devolver mockup
    if (ordenesTrabajo.length === 0) {
      console.log('No data found, returning mockup')
      const mockupData = codigos.map((cod, idx) => ({
        CODIGO: cod,
        NUMERO_OT: cod,
        ESTADO: 'Pendiente',
        TIPO: 'Laboratorio',
        FECHA_CREACION: new Date(),
        OBSERVACION: 'Orden de trabajo mockup'
      }))
      return NextResponse.json({ data: mockupData }, { headers: corsHeaders() })
    }

    // Transformar datos reales
    const resultados = ordenesTrabajo.map(ot => ({
      CODIGO: ot.numeroOT,
      NUMERO_OT: ot.numeroOT,
      ESTADO: ot.estadoOT?.nombre || 'Pendiente',
      TIPO: ot.tipoOT?.nombre || '',
      FECHA_CREACION: ot.createdAt,
      OBSERVACION: ''
    }))

    return NextResponse.json({ data: resultados }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error en api-get-lab-lbotmae:', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500, headers: corsHeaders() })
  }
}
