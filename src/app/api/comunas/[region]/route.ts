import { NextResponse } from 'next/server'

import { REGIONES_CHILE } from '@/data/clientData'

// Tipo para las regiones
type RegionKey = keyof typeof REGIONES_CHILE

export async function GET(request: Request, { params }: { params: { region: string } }) {
  try {
    const region = decodeURIComponent(params.region)
    
    // Verificar si la región existe en nuestro objeto
    const isValidRegion = Object.keys(REGIONES_CHILE).includes(region)
    const comunas = isValidRegion ? REGIONES_CHILE[region as RegionKey].comunas : []

    return NextResponse.json(comunas)
  } catch (error) {
    console.error('Error al obtener comunas:', error)

    return NextResponse.json({ error: 'Error al obtener las comunas' }, { status: 500 })
  }
}
