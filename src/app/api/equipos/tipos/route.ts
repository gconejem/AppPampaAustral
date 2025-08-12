import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const tiposEquipo = await prisma.tipoEquipo.findMany({
            orderBy: {
                tipo: 'asc'
            }
        })

        return NextResponse.json(tiposEquipo)
    } catch (error) {
        console.error('Error al obtener tipos de equipo:', error)
        return NextResponse.json({ error: 'Error al obtener los tipos de equipo' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { tipo } = body

        if (!tipo || tipo.trim() === '') {
            return NextResponse.json(
                { error: 'El tipo de equipo es requerido' },
                { status: 400 }
            )
        }

        // Verificar si el tipo ya existe
        const tipoExistente = await prisma.tipoEquipo.findUnique({
            where: { tipo: tipo.trim() }
        })

        if (tipoExistente) {
            return NextResponse.json(
                { error: 'Ya existe un tipo de equipo con este nombre' },
                { status: 400 }
            )
        }

        const tipoEquipo = await prisma.tipoEquipo.create({
            data: {
                tipo: tipo.trim()
            }
        })

        return NextResponse.json(tipoEquipo, { status: 201 })
    } catch (error) {
        console.error('Error al crear tipo de equipo:', error)
        return NextResponse.json({ error: 'Error al crear el tipo de equipo' }, { status: 500 })
    }
}
