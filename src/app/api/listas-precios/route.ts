import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const listasPrecio = await prisma.listaPrecio.findMany({
      select: {
        id: true,
        nombre: true,
        precio: true
      }
    })

    const listasFormateadas = listasPrecio.map(lista => ({
      id: lista.id,
      nombre: lista.nombre,
      precio: Number(lista.precio)
    }))

    console.log('Enviando listas de precios:', listasFormateadas)

    return Response.json(listasFormateadas)
  } catch (error) {
    console.error('Error al obtener listas de precios:', error)

    return new Response(JSON.stringify({ error: 'Error al obtener listas de precios' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

// POST - Crear una nueva lista de precios
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre } = body

    const listaPrecio = await prisma.listaPrecio.create({
      data: {
        nombre
      }
    })

    return NextResponse.json(listaPrecio, { status: 201 })
  } catch (error) {
    console.error('Error al crear lista de precios:', error)

    return NextResponse.json({ error: 'Error al crear lista de precios' }, { status: 500 })
  }
}
