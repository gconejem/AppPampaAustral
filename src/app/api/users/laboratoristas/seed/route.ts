import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const laboratoristasIniciales = [
  {
    name: 'Carlos Salinas',
    email: 'carlos.salinas@pampaustral.cl',
    emailVerified: new Date(),
    image: null
  },
  {
    name: 'Ana Martínez',
    email: 'ana.martinez@pampaustral.cl',
    emailVerified: new Date(),
    image: null
  },
  {
    name: 'Juan Pérez',
    email: 'juan.perez@pampaustral.cl',
    emailVerified: new Date(),
    image: null
  },
  {
    name: 'María González',
    email: 'maria.gonzalez@pampaustral.cl',
    emailVerified: new Date(),
    image: null
  }
]

export async function GET() {
  try {
    // 1. Asegurarse que existe el rol LABORATORISTA
    const rolLaboratorista = await prisma.rol.upsert({
      where: { nombre: 'LABORATORISTA' },
      update: {},
      create: {
        nombre: 'LABORATORISTA',
        descripcion: 'Laboratorista que realiza las visitas'
      }
    })

    // 2. Crear los usuarios y asignarles el rol
    const laboratoristasCreados = await Promise.all(
      laboratoristasIniciales.map(async laboratorista => {
        // Crear o actualizar usuario
        const user = await prisma.user.upsert({
          where: { email: laboratorista.email },
          update: laboratorista,
          create: laboratorista
        })

        // Asignar rol de laboratorista
        await prisma.userRol.upsert({
          where: {
            userId_rolId: {
              userId: user.id,
              rolId: rolLaboratorista.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            rolId: rolLaboratorista.id
          }
        })

        return user
      })
    )

    return NextResponse.json(laboratoristasCreados)
  } catch (error) {
    console.error('Error al crear laboratoristas:', error)

    return NextResponse.json({ error: 'Error al crear laboratoristas' }, { status: 500 })
  }
}
