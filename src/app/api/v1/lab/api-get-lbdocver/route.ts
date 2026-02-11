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
    
    // Formularios basados en tabla LBDOCVER
    // TODO: Migrar estos datos a la base de datos
    const formularios = [
      {
        CLAVE: 'R-12-03001',
        FORMULARIO: 'R-12-03',
        DOCVERSION: '1',
        APROBADO: 'Juan Salas',
        APROFECHA: '19-02-2021',
        OPCIONES: JSON.stringify({
          formulario: 'Densidades',
          codigo: 'DENSD',
          version: '1.0',
          opciones: [
            {
              // Formularios basados en tabla LBDOCVER (mock)
              const formularios = LAB_FORMULARIOS
      {
        CLAVE: 'R-12-58004',
        FORMULARIO: 'R-12-58',
        DOCVERSION: '4',
        APROBADO: 'Juan Salas',
        APROFECHA: '19-02-2021',
        OPCIONES: JSON.stringify({
          formulario: 'Testigos',
          codigo: 'TESTIGO',
          version: '1.0',
          opciones: [
            {
              nombre: 'Testigo Normal',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Calzada' },
                { posicion: 2, texto: 'Acera' }
              ]
            },
            {
              nombre: 'Tipo Extracción',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Seco' },
                { posicion: 2, texto: 'Húmedo' }
              ]
            },
            {
              nombre: 'Tipo de Hormigón',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'H-5' },
                { posicion: 2, texto: 'H-10' },
                { posicion: 3, texto: 'H-15' },
                { posicion: 4, texto: 'H-20' },
                { posicion: 5, texto: 'H-25' },
                { posicion: 6, texto: 'H-30' },
                { posicion: 7, texto: 'H-35' },
                { posicion: 8, texto: 'H-40' },
                { posicion: 9, texto: 'Desconocido' }
              ]
            },
            {
              nombre: 'Destino del Testigo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Resistencia a la Compresión' },
                { posicion: 2, texto: 'Resistencia a la Tracción' },
                { posicion: 3, texto: 'Módulo de Elasticidad' },
                { posicion: 4, texto: 'Densidad y Absorción' },
                { posicion: 5, texto: 'Inspección Visual' },
                { posicion: 6, texto: 'Otro' }
              ]
            },
            {
              nombre: 'Diámetro Testigo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: '75 mm' },
                { posicion: 2, texto: '100 mm' },
                { posicion: 3, texto: '150 mm' },
                { posicion: 4, texto: '200 mm' }
              ]
            },
            {
              nombre: 'Estado del Testigo',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Bueno' },
                { posicion: 2, texto: 'Fisurado' },
                { posicion: 3, texto: 'Dañado' },
                { posicion: 4, texto: 'Con segregación' }
              ]
            }
          ]
        }),
        ESTADO: 'A',
        TIPO: 'D',
        IDREPORT: 'OtTestigos'
      },
      {
        CLAVE: 'R-12-69001',
        FORMULARIO: 'R-12-69',
        DOCVERSION: '1',
        APROBADO: 'Cristián Salinas',
        APROFECHA: '24-11-2023',
        OPCIONES: JSON.stringify({
          formulario: 'Dosificaciones',
          codigo: 'DOSIF',
          version: '1.0',
          opciones: [
            {
              nombre: 'grado',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'H-5' },
                { posicion: 2, texto: 'H-10' },
                { posicion: 3, texto: 'H-15' },
                { posicion: 4, texto: 'H-20' },
                { posicion: 5, texto: 'H-25' },
                { posicion: 6, texto: 'H-30' },
                { posicion: 7, texto: 'H-35' },
                { posicion: 8, texto: 'H-40' },
                { posicion: 9, texto: 'H-45' },
                { posicion: 10, texto: 'H-50' }
              ]
            },
            {
              nombre: 'Tipo de Cemento',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Corriente' },
                { posicion: 2, texto: 'Alta Resistencia' },
                { posicion: 3, texto: 'Puzolánico' },
                { posicion: 4, texto: 'Siderúrgico' },
                { posicion: 5, texto: 'Compuesto' }
              ]
            }
          ]
        }),
        ESTADO: 'A',
        TIPO: 'D',
        IDREPORT: 'OTDosificaciones'
      },
      {
        CLAVE: 'R-12-99004',
        FORMULARIO: 'R-12-99',
        DOCVERSION: '10',
        APROBADO: 'Juan Salas',
        APROFECHA: '19-02-2021',
        OPCIONES: JSON.stringify({
          formulario: 'Retiro Probetas',
          codigo: 'R-12-99',
          version: '1.0',
          opciones: [
            {
              nombre: 'Condicion de transporte',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Cama de arena' },
                { posicion: 2, texto: 'Caja de traslado' },
                { posicion: 3, texto: 'Cubierta con paño húmedo' },
                { posicion: 4, texto: 'Sin protección especial' }
              ]
            },
            {
              nombre: 'Tipo de Probeta',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Cilindro 15 x 30 cm' },
                { posicion: 2, texto: 'Cilindro 10 x 20 cm' },
                { posicion: 3, texto: 'Cubo 20 x 20 cm' },
                { posicion: 4, texto: 'Viga 15 x 15 x 50 cm' }
              ]
            }
          ]
        }),
        ESTADO: 'A',
        TIPO: 'D',
        IDREPORT: 'RetiroProbetas'
      },
      {
        CLAVE: 'X-1001',
        FORMULARIO: 'X-1',
        DOCVERSION: '1',
        APROBADO: 'Eric Concha',
        APROFECHA: '20-02-2021',
        OPCIONES: JSON.stringify({
          formulario: 'Cancelacion',
          codigo: 'X-1',
          version: '1.0',
          opciones: [
            {
              nombre: 'motivoCancelacion',
              tipo: 'select',
              opciones: [
                { posicion: 1, texto: 'Clima' },
                { posicion: 2, texto: 'Problema Interno (Pampa Austral)' },
                { posicion: 3, texto: 'Problema Planta (Hormigón)' }
              ]
            }
          ]
        }),
        ESTADO: 'A',
        TIPO: 'D',
        IDREPORT: 'FormCancelacion'
      }
    ]

    console.log('=== GET FORMULARIOS BACKEND - ENVIANDO ===')
    console.log('Total formularios activos:', formularios.length)
    console.log('Primer formulario:', formularios[0])

    return NextResponse.json(
      { data: formularios },
      { headers: corsHeaders(origin), status: 200 }
    )
  } catch (error: any) {
    console.error('Error en api-get-lbdocver:', error)
    return NextResponse.json(
      { error: error?.message ?? 'unknown' },
      { status: 500, headers: corsHeaders(request.headers.get('origin')) }
    )
  }
}
