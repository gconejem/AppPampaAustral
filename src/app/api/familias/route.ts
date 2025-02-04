import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Obtener familias únicas de los productos existentes
    const productos = await prisma.producto.findMany({
      select: {
        familia: true
      },
      distinct: ['familia']
    })

    const familias = productos.map(p => p.familia).filter(familia => familia) // Filtrar valores nulos

    return Response.json(familias)
  } catch (error) {
    console.error('Error al obtener familias:', error)

    return new Response(JSON.stringify({ error: 'Error al obtener familias' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
