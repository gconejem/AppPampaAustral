import { Suspense } from 'react'

// Component Imports
import InvoiceList from '@views/apps/invoice/list'

// API Imports
import { prisma } from '@/lib/prisma'

async function getCotizaciones() {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      orderBy: {
        fechaCreacion: 'desc'
      },
      include: {
        cliente: {
          select: {
            nombreCliente: true
          }
        }
      }
    })

    return cotizaciones.map(cotizacion => ({
      id: cotizacion.id,
      numeroCotizacion: cotizacion.numeroCotizacion,
      cliente: cotizacion.cliente?.nombreCliente || 'Sin cliente',
      fecha: cotizacion.fechaCreacion.toLocaleDateString(),
      estado: cotizacion.estado,
      total: parseFloat(cotizacion.total.toString())
    }))
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)
    return []
  }
}

export default async function Page() {
  const invoiceData = await getCotizaciones()

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <InvoiceList invoiceData={invoiceData} />
    </Suspense>
  )
}
