import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET() {
    const permissions = await prisma.permission.findMany()
    return NextResponse.json(permissions)
}

export async function POST(req: Request) {
    const data = await req.json()
    // data: { name, descripcion, categoria }
    const permission = await prisma.permission.create({
        data
    })
    return NextResponse.json(permission)
}
