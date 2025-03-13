import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

// GET /api/ot - Obtener todas las OTs
export async function GET() {
  try {
    const ordenesTrabajo = await prisma.ordenTrabajo.findMany({
      include: {
        aceptacionVisita: true,
        densidad: true,
        hormigonFresco: true,
        testigos: true,
        extraccionAsfaltica: true,
        muestreoMaterial: true,
        retiroProbeta: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(ordenesTrabajo)
  } catch (error) {
    console.error('Error al obtener OTs:', error)

    return NextResponse.json({ error: 'Error al obtener las órdenes de trabajo' }, { status: 500 })
  }
}

// POST /api/ot - Crear una nueva OT
export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Validar datos mínimos requeridos
    if (!data.clave || !data.tipoOT) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }

    const ordenTrabajo = await prisma.ordenTrabajo.create({
      data,
      include: {
        aceptacionVisita: true,
        densidad: true,
        hormigonFresco: true,
        testigos: true,
        extraccionAsfaltica: true,
        muestreoMaterial: true,
        retiroProbeta: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(ordenTrabajo, { status: 201 })
  } catch (error) {
    console.error('Error al crear OT:', error)

    return NextResponse.json({ error: 'Error al crear la orden de trabajo' }, { status: 500 })
  }
}
