import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

const serviciosIniciales = [
  {
    codigo: 'DENS-01',
    nombre: 'Densidad en Terreno',
    descripcion: 'Ensayo de densidad in situ'
  },
  {
    codigo: 'HORM-01',
    nombre: 'Toma de Muestra de Hormigón',
    descripcion: 'Muestreo y ensayo de hormigón fresco'
  },
  {
    codigo: 'COMP-01',
    nombre: 'Compresión Simple',
    descripcion: 'Ensayo de resistencia a la compresión'
  },
  {
    codigo: 'GRAN-01',
    nombre: 'Granulometría',
    descripcion: 'Análisis granulométrico de suelos'
  },
  {
    codigo: 'CBR-01',
    nombre: 'CBR en Terreno',
    descripcion: 'Ensayo CBR in situ'
  },
  {
    codigo: 'PROT-01',
    nombre: 'Proctor Modificado',
    descripcion: 'Ensayo de compactación Proctor modificado'
  },
  {
    codigo: 'FLEX-01',
    nombre: 'Flexión en Vigas',
    descripcion: 'Ensayo de resistencia a la flexión en vigas de hormigón'
  },
  {
    codigo: 'TRAC-01',
    nombre: 'Tracción en Barras',
    descripcion: 'Ensayo de tracción en barras de acero'
  },
  {
    codigo: 'CONO-01',
    nombre: 'Cono de Arena',
    descripcion: 'Determinación de densidad in situ mediante cono de arena'
  },
  {
    codigo: 'LIMT-01',
    nombre: 'Límites de Atterberg',
    descripcion: 'Determinación de límites líquido y plástico'
  },
  {
    codigo: 'NUCK-01',
    nombre: 'Núcleos de Hormigón',
    descripcion: 'Extracción y ensayo de testigos de hormigón'
  },
  {
    codigo: 'VISC-01',
    nombre: 'Viscosidad Marshall',
    descripcion: 'Ensayo de viscosidad en mezclas asfálticas'
  }
]

export async function GET() {
  try {
    const serviciosCreados = await Promise.all(
      serviciosIniciales.map(servicio =>
        prisma.servicio.upsert({
          where: { codigo: servicio.codigo },
          update: servicio,
          create: servicio
        })
      )
    )

    return NextResponse.json(serviciosCreados)
  } catch (error) {
    console.error('Error al crear servicios iniciales:', error)

    return NextResponse.json({ error: 'Error al crear servicios iniciales' }, { status: 500 })
  }
}
