import { NextResponse } from 'next/server'

const comunasPorRegion: { [key: string]: string[] } = {
  'Región Metropolitana': [
    'Santiago',
    'Providencia',
    'Las Condes',
    'La Florida',
    'Maipú',
    'Ñuñoa'

    // ... otras comunas
  ],
  'Región de Valparaíso': [
    'Valparaíso',
    'Viña del Mar',
    'Quilpué',
    'Villa Alemana'

    // ... otras comunas
  ]

  // ... otras regiones
}

export async function GET(request: Request, { params }: { params: { region: string } }) {
  try {
    const region = decodeURIComponent(params.region)
    const comunas = comunasPorRegion[region] || []

    return NextResponse.json(comunas)
  } catch (error) {
    console.error('Error al obtener comunas:', error)

    return NextResponse.json({ error: 'Error al obtener las comunas' }, { status: 500 })
  }
}
