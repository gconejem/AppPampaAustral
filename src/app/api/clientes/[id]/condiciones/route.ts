import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json()
    const clienteId = parseInt(params.id)

    // Primero buscar si existe una condición comercial para este cliente
    const existingCondicion = await prisma.condicionComercial.findFirst({
      where: {
        clienteId: clienteId
      }
    })

    let condiciones

    if (existingCondicion) {
      // Si existe, actualizar
      condiciones = await prisma.condicionComercial.update({
        where: {
          id: existingCondicion.id
        },
        data: {
          vendedor: data.vendedor,
          condicionVenta: data.condicionVenta,
          observaciones: data.observaciones
        }
      })
    } else {
      // Si no existe, crear
      condiciones = await prisma.condicionComercial.create({
        data: {
          clienteId: clienteId,
          vendedor: data.vendedor,
          condicionVenta: data.condicionVenta,
          observaciones: data.observaciones
        }
      })
    }

    return NextResponse.json(condiciones)
  } catch (error) {
    console.error('Error al actualizar condiciones comerciales:', error)

    return NextResponse.json({ error: 'Error al actualizar condiciones comerciales' }, { status: 500 })
  }
}
