import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    const roles = await prisma.rol.findMany({
        include: {
            permisos: {
                include: { permission: true }
            }
        }
    })
    return NextResponse.json(roles)
}
