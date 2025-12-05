import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''

        // Obtener filtros (pueden ser múltiples)
        const tipoEquipoIds = searchParams.getAll('tipoEquipoId')
        const estados = searchParams.getAll('estado')
        const areaIds = searchParams.getAll('areaId')
        const funcionarioAsignadoIds = searchParams.getAll('funcionarioAsignadoId')

        const where: any = {}

        if (search) {
            const searchConditions: any[] = [
                { codigo: { contains: search, mode: 'insensitive' } },
                { nombre: { contains: search, mode: 'insensitive' } },
                { descripcion: { contains: search, mode: 'insensitive' } },
                { serie: { contains: search, mode: 'insensitive' } },
                { tipoEquipo: { tipo: { contains: search, mode: 'insensitive' } } },
                { area: { nombre: { contains: search, mode: 'insensitive' } } },
                { funcionarioAsignado: { name: { contains: search, mode: 'insensitive' } } },
                { funcionarioAsignado: { rut: { contains: search, mode: 'insensitive' } } }
            ]

            // Si es un número, buscar también por ID (correlativo)
            const searchNumber = parseInt(search)
            if (!isNaN(searchNumber)) {
                searchConditions.push({ id: searchNumber })
            }

            where.OR = searchConditions
        }

        // Filtros con multiselección
        if (tipoEquipoIds.length > 0) {
            where.tipoEquipoId = {
                in: tipoEquipoIds.map(id => parseInt(id))
            }
        }

        if (estados.length > 0) {
            where.estado = {
                in: estados
            }
        }

        if (areaIds.length > 0) {
            where.areaId = {
                in: areaIds.map(id => parseInt(id))
            }
        }

        if (funcionarioAsignadoIds.length > 0) {
            where.funcionarioAsignadoId = {
                in: funcionarioAsignadoIds
            }
        }

        const equipos = await prisma.equipo.findMany({
            where,
            include: {
                tipoEquipo: true,
                funcionarioAsignado: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        rut: true
                    }
                },
                area: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }
        })

        // Preparar datos para el Excel
        const excelData = equipos.map(equipo => ({
            'Correlativo': String(equipo.id).padStart(3, '0'),
            'Código': equipo.codigo,
            'Tipo': equipo.tipoEquipo.tipo,
            'Descripción': equipo.nombre,
            'N° Serie': equipo.serie || '-',
            'Área de Uso': equipo.area?.nombre || '-',
            'Funcionario Asignado': equipo.funcionarioAsignado?.name || '-',
            'RUT Funcionario': equipo.funcionarioAsignado?.rut || '-',
            'Estado': equipo.estado,
            'Observaciones': equipo.observaciones || '-',
            'Fecha Creación': new Date(equipo.createdAt).toLocaleDateString('es-CL'),
            'Última Actualización': new Date(equipo.updatedAt).toLocaleDateString('es-CL')
        }))

        // Crear libro de Excel
        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipos')

        // Ajustar ancho de columnas
        const maxWidth = 50
        const columnWidths = [
            { wch: 12 }, // Correlativo
            { wch: 15 }, // Código
            { wch: 20 }, // Tipo
            { wch: 30 }, // Descripción
            { wch: 15 }, // N° Serie
            { wch: 20 }, // Área de Uso
            { wch: 25 }, // Funcionario Asignado
            { wch: 15 }, // RUT Funcionario
            { wch: 10 }, // Estado
            { wch: maxWidth }, // Observaciones
            { wch: 15 }, // Fecha Creación
            { wch: 18 }  // Última Actualización
        ]
        worksheet['!cols'] = columnWidths

        // Generar buffer del archivo Excel
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        // Retornar el archivo como respuesta
        return new NextResponse(excelBuffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=equipos_${new Date().toISOString().split('T')[0]}.xlsx`
            }
        })
    } catch (error) {
        console.error('Error al exportar equipos:', error)
        return NextResponse.json({ error: 'Error al exportar los equipos' }, { status: 500 })
    }
}
