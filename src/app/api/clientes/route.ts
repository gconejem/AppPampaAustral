import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        contactos: true,
        condicionesComerciales: true
      }
    })

    return NextResponse.json(clientes)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Error al obtener los clientes' },
      { status: 500 }
    )
  }
}
