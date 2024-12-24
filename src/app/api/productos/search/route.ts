import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const area = searchParams.get('area')
  const familia = searchParams.get('familia')
  const tipo = searchParams.get('tipo')
  const estado = searchParams.get('estado')
  
  try {
    const whereClause: any = {
      AND: []
    }

    // Búsqueda por texto en nombre, SKU o descripción
    if (query) {
      whereClause.AND.push({
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { descripcion: { contains: query, mode: 'insensitive' } }
        ]
      })
    }

    // Filtros específicos
    if (area) whereClause.AND.push({ area })
    if (familia) whereClause.AND.push({ familia })
    if (tipo) whereClause.AND.push({ tipo })
    if (estado) whereClause.AND.push({ estado })

    // Si no hay condiciones AND, eliminar el array vacío
    if (whereClause.AND.length === 0) delete whereClause.AND

    const productos = await prisma.producto.findMany({
      where: whereClause,
      select: {
        productoId: true,
        sku: true,
        nombre: true,
        descripcion: true,
        area: true,
        familia: true,
        tipo: true,
        precio: true,
        estado: true,
        esPaquete: true,
        norma: true,
        listaPrecios: true,
        aplicaImpuesto: true
      }
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error('Error searching productos:', error)
    return NextResponse.json({ error: 'Error al buscar productos' }, { status: 500 })
  }
} 
