import { NextResponse } from 'next/server'

import * as XLSX from 'xlsx'

import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    // Obtener todas las listas de precios existentes
    const listasPrecios = await prisma.listaPrecio.findMany()
    const listaNombreToId: Record<string, number> = {}

    listasPrecios.forEach(lp => {
      const match = lp.nombre.toLowerCase().match(/lista \d+/)

      if (match) {
        listaNombreToId[match[0]] = lp.id
      }
    })

    for (const row of data as any[]) {
      const producto = await prisma.producto.upsert({
        where: { sku: String(row['SKU']) },
        update: {
          nombre: row['Producto'],
          descripcion: row['Descripción'],
          area: row['Area'],
          familia: row['Familia'],
          tipo: row['Tipo'],
          norma: row['Norma / Método'] || '',
          updatedAt: new Date()
        },
        create: {
          sku: String(row['SKU']),
          nombre: row['Producto'],
          descripcion: row['Descripción'],
          area: row['Area'],
          familia: row['Familia'],
          tipo: row['Tipo'],
          norma: row['Norma / Método'] || '',
          estado: 'ACTIVO',
          aplicaImpuesto: true,
          esPaquete: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })

      for (const key of Object.keys(row)) {
        if (key.toLowerCase().startsWith('lista')) {
          const match = key.toLowerCase().match(/lista \d+/)

          if (!match) continue
          const nombreLista = match[0]
          const listaId = listaNombreToId[nombreLista]

          if (listaId && row[key]) {
            await prisma.productoListaPrecio.upsert({
              where: {
                productoId_listaPrecioId: {
                  productoId: producto.productoId,
                  listaPrecioId: listaId
                }
              },
              update: {
                precio: Number(row[key]),
                updatedAt: new Date()
              },
              create: {
                productoId: producto.productoId,
                listaPrecioId: listaId,
                precio: Number(row[key]),
                activo: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al importar productos:', error)

    return NextResponse.json({ error: error.message || 'Error al procesar el archivo' }, { status: 500 })
  }
}
