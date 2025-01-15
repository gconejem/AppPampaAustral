import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('Fetching obras...')

    const obras = await prisma.obra.findMany({
      include: {
        contactos: true
      },
      orderBy: {
        fechaIngreso: 'desc'
      }
    })

    return NextResponse.json(obras)
  } catch (error) {
    console.error('Error al obtener obras:', error)

    return NextResponse.json({ error: 'Error al obtener las obras' }, { status: 500 })
  }
}
