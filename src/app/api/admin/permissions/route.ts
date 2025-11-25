import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const permisos = await prisma.permission.findMany()
    return NextResponse.json(permisos)
}
