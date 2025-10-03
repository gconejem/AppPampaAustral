import { NextResponse } from 'next/server'

import { REGIONES_CHILE } from '@/data/clientData'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request, { params }: { params: { region: string } }) {
  try {
    const region = decodeURIComponent(params.region) as keyof typeof REGIONES_CHILE
    const comunas = REGIONES_CHILE[region]?.comunas || []

    return NextResponse.json(comunas)
  } catch (error) {
    console.error('Error al obtener comunas:', error)

    return NextResponse.json({ error: 'Error al obtener las comunas' }, { status: 500 })
  }
}
