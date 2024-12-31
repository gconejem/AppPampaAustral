import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

// GET - Obtener un permiso específico
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const permission = await prisma.permission.findUnique({
      where: { id: params.id }
    })

    if (!permission) {
      return NextResponse.json({ error: 'Permiso no encontrado' }, { status: 404 })
    }

    return NextResponse.json(permission)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener el permiso' }, { status: 500 })
  }
}

// PUT - Actualizar un permiso
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { name, assignedTo } = body

    const permission = await prisma.permission.update({
      where: { id: params.id },
      data: {
        name,
        assignedTo
      }
    })

    return NextResponse.json(permission)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar el permiso' }, { status: 500 })
  }
}

// DELETE - Eliminar un permiso
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.permission.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Permiso eliminado exitosamente' })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar el permiso' }, { status: 500 })
  }
}
