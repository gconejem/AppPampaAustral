import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { LAB_FORMULARIOS } from '@/lib/lab-formularios'

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
    const fk_lbrutas = searchParams.get('fk_lbrutas[]')

    console.log('=== GET LBRUTAOT CHECK INTEGRACION ===')
    console.log('fk_lbrutas:', fk_lbrutas)

    if (!fk_lbrutas) {
      return NextResponse.json({ data: [] }, { headers: corsHeaders(origin) })
    }

    const agendaId = parseInt(fk_lbrutas)

    if (Number.isNaN(agendaId)) {
      console.log('=== GET LBRUTAOT CHECK INTEGRACION ===')
      console.log('Invalid agendaId from fk_lbrutas[]:', fk_lbrutas)
      return NextResponse.json({ data: [] }, { headers: corsHeaders(origin) })
    }

    // Buscar órdenes de trabajo asociadas a la agenda
    const ordenesTrabajo = await prisma.ordenTrabajo.findMany({
      where: {
        agendaId: agendaId
      },
      include: {
        tipoOT: true,
        estadoOT: true,
        user: true
      }
    })

    console.log(`Found ${ordenesTrabajo.length} OTs for agenda ${agendaId}`)

    // Sin datos: devolver vacío (evita OTs fantasmas/servicios en blanco en AppLab)
    if (ordenesTrabajo.length === 0) {
      console.log('No OTs found, returning empty')
      return NextResponse.json({ data: [] }, { headers: corsHeaders(origin) })
    }

    const findFormulario = (fklbdocver: string) =>
      LAB_FORMULARIOS.find(f => f.CLAVE === fklbdocver) || null

    // Transformar datos reales a estructura esperada por AppLab (ensayos/servicios)
    const resultados = ordenesTrabajo.map(ot => {
      const formulario = findFormulario(ot.fklbdocver)

      const servicio = {
        CODIGO: ot.fklbrutser || ot.tipoOT?.codigo || null,
        FORMULARIO: ot.tipoOT?.codigo || ot.fklbrutser || null,
        DESCRIP: ot.tipoOT?.descripcion || null
      }

      return {
        CLAVE: ot.clave,
        FKLBRUTAS: ot.fklbrutas || String(agendaId),
        CORRELATIV: ot.correlativ,
        FKLBDOCVER: ot.fklbdocver,
        OTNUMERO: ot.numeroTarjeta ?? null,
        DATOS: ot.jsonOT ?? null,
        OPCIONES: formulario?.OPCIONES ?? null,
        RESPUESTA: [],
        ORIGEN: ot.origen,
        ESTADO: ot.estado,
        OBSESTADO: null,
        COLORVER: null,
        lbrutser: servicio,
        lbdocver: formulario,
        UPDATED: false,
        CREATED: null,
        FKLBRUTSER: ot.fklbrutser
      }
    })

    // Log acotado para QA: no imprimir OPCIONES/jsonOT
    console.log('Returning OTs:', resultados.length)
    const sample = resultados.slice(0, 5).map((r: any) => ({
      CLAVE: r.CLAVE,
      CORRELATIV: r.CORRELATIV,
      FKLBDOCVER: r.FKLBDOCVER,
      FKLBRUTSER: r.FKLBRUTSER,
      FORMULARIO: r.lbrutser?.FORMULARIO,
      DESCRIP: r.lbrutser?.DESCRIP,
      ESTADO: r.ESTADO,
      ORIGEN: r.ORIGEN,
      hasFormulario: !!r.lbdocver,
      hasOpciones: !!r.OPCIONES
    }))
    console.log('Sample OTs (max 5):', sample)

    const missingForm = resultados.filter((r: any) => !r.lbdocver).length
    if (missingForm > 0) {
      console.log('WARN: OTs sin lbdocver (no se encontró FKLBDOCVER en LAB_FORMULARIOS):', missingForm)
    }

    return NextResponse.json({ data: resultados }, { headers: corsHeaders(origin) })
  } catch (error) {
    console.error('Error en api-get-lbrutaot-check-integracion:', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500, headers: corsHeaders(request.headers.get('origin')) })
  }
}
