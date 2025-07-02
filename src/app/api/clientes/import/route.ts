import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { clientes } = await request.json()

    if (!Array.isArray(clientes)) {
      return NextResponse.json(
        { error: 'Los datos deben ser un array de clientes' },
        { status: 400 }
      )
    }

    const resultados = {
      exitosos: 0,
      fallidos: 0,
      errores: [] as string[]
    }

    // Procesar cada cliente
    for (const cliente of clientes) {
      try {
        // Validar campos requeridos
        if (!cliente.rut || !cliente.razonSocial || !cliente.nombreCliente) {
          throw new Error('Faltan campos requeridos')
        }

        // Verificar si ya existe un cliente con ese RUT
        const clienteExistente = await prisma.cliente.findUnique({
          where: { rut: cliente.rut }
        })

        if (clienteExistente) {
          throw new Error(`Ya existe un cliente con el RUT ${cliente.rut}`)
        }

        // Crear el cliente
        await prisma.cliente.create({
          data: {
            estado: cliente.estado || 'ACTIVO',
            rut: cliente.rut,
            razonSocial: cliente.razonSocial,
            nombreCliente: cliente.nombreCliente,
            pais: cliente.pais || 'Chile',
            region: cliente.region || '',
            ciudad: cliente.ciudad || '',
            comuna: cliente.comuna || '',
            direccion: cliente.direccion || '',
            fechaCreacion: new Date()
          }
        })

        resultados.exitosos++
      } catch (error: any) {
        resultados.fallidos++
        resultados.errores.push(`Error con cliente ${cliente.rut}: ${error.message}`)
      }
    }

    return NextResponse.json({
      mensaje: 'Importación completada',
      resultados
    })
  } catch (error: any) {
    console.error('Error en la importación:', error)
    
return NextResponse.json(
      { error: 'Error al procesar la importación' },
      { status: 500 }
    )
  }
} 
