import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Obtener áreas únicas de los productos existentes
    const productos = await prisma.producto.findMany({
      select: {
        area: true
      },
      distinct: ['area']
    })

    const areas = productos.map(p => p.area).filter(area => area) // Filtrar valores nulos

    return Response.json(areas)
  } catch (error) {
    console.error('Error al obtener áreas:', error)

    return new Response(JSON.stringify({ error: 'Error al obtener áreas' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
