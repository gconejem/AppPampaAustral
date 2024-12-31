import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

// GET - Obtener todos los permisos
export async function GET() {
  try {
    const permissions = await prisma.permission.findMany()

    return NextResponse.json(permissions)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener permisos' }, { status: 500 })
  }
}

// POST - Crear nuevo permiso
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, assignedTo } = body

    console.log('Recibiendo datos en API:', { name, assignedTo }) // Para debugging

    // Validación
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'El nombre del permiso es requerido' },
        { status: 400 }
      )
    }

    // Asegurarse de que assignedTo sea un array
    const assignedToArray = Array.isArray(assignedTo) ? assignedTo : []

    const permission = await prisma.permission.create({
      data: {
        name,
        assignedTo: assignedToArray
      }
    })

    console.log('Permiso creado:', permission) // Para debugging

    return NextResponse.json(permission)
  } catch (error) {
    console.error('Error al crear permiso:', error) // Para debugging
    return NextResponse.json(
      { error: 'Error al crear permiso', details: error },
      { status: 500 }
    )
  }
}
