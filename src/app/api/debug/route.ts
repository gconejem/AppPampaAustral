import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const [productos, areas, familias, listasPrecio] = await Promise.all([
      prisma.producto.findMany(),
      prisma.producto.findMany({ select: { area: true }, distinct: ['area'] }),
      prisma.producto.findMany({ select: { familia: true }, distinct: ['familia'] }),
      prisma.listaPrecio.findMany()
    ])

    const response = {
      productos,
      areas: areas.map(a => a.area).filter(Boolean),
      familias: familias.map(f => f.familia).filter(Boolean),
      listasPrecio
    }

    console.log('Datos cargados:', response)

    return Response.json(response)
  } catch (error) {
    console.error('Error en debug endpoint:', error)

    return new Response(JSON.stringify({ error: 'Error en debug endpoint' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function POST() {
  try {
    // Actualizar todos los productos que son paquetes
    const updated = await prisma.producto.updateMany({
      where: {
        tipo: 'Paquete'
      },
      data: {
        esPaquete: true
      }
    })

    return Response.json({ message: 'Paquetes actualizados', updated })
  } catch (error) {
    console.error('Error:', error)

    return Response.json({ error: 'Error al actualizar paquetes' }, { status: 500 })
  }
}
