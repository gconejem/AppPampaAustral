import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

const equiposIniciales = [
  {
    codigo: 'EQ-001',
    nombre: 'Densímetro Nuclear',
    descripcion: 'Equipo para medición de densidad',
    estado: true
  },
  {
    codigo: 'EQ-002',
    nombre: 'Prensa Hidráulica',
    descripcion: 'Equipo para ensayos de compresión',
    estado: true
  },
  {
    codigo: 'EQ-003',
    nombre: 'Tamizador',
    descripcion: 'Equipo para análisis granulométrico',
    estado: true
  },
  {
    codigo: 'EQ-004',
    nombre: 'Cono de Arena',
    descripcion: 'Equipo para densidad in situ',
    estado: true
  }
]

export async function GET() {
  try {
    const equiposCreados = await Promise.all(
      equiposIniciales.map(equipo =>
        prisma.equipo.upsert({
          where: { codigo: equipo.codigo },
          update: equipo,
          create: equipo
        })
      )
    )

    return NextResponse.json(equiposCreados)
  } catch (error) {
    console.error('Error al crear equipos iniciales:', error)

    return NextResponse.json({ error: 'Error al crear equipos iniciales' }, { status: 500 })
  }
}
