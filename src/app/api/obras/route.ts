import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import { createObra, getObras, getObraById, updateObra, deleteObra } from './index'

// GET - Obtener todas las obras
export async function GET() {
  try {
    console.log('Fetching obras...')

    const obras = await prisma.obra.findMany({
      include: {
        contactos: true
      }
    })

    return NextResponse.json(obras)
  } catch (error) {
    console.error('Error al obtener obras:', error)

    return NextResponse.json({ error: 'Error al obtener las obras' }, { status: 500 })
  }
}

// POST - Crear una nueva obra
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const obra = await createObra(body)

    return NextResponse.json(obra, { status: 201 })
  } catch (error) {
    console.error('Error creating obra:', error)

    return NextResponse.json({ error: 'Error al crear la obra' }, { status: 500 })
  }
}
