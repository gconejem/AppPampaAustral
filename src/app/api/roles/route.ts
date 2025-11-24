import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

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

export async function POST(req: Request) {
    const data = await req.json()
    // data: { nombre, descripcion, permisos: [permissionId, ...] }
    const rol = await prisma.rol.create({
        data: {
            nombre: data.nombre,
            descripcion: data.descripcion,
            permisos: {
                create: data.permisos.map((permissionId: string) => ({
                    permissionId
                }))
            }
        }
    })
    return NextResponse.json(rol)
}
