import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    const permisos = await prisma.permission.findMany()
    return NextResponse.json(permisos)
}
