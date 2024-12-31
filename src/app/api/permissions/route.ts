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

    const permission = await prisma.permission.create({
      data: {
        name,
        assignedTo
      }
    })

    return NextResponse.json(permission)
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear permiso' }, { status: 500 })
  }
}
