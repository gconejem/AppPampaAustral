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
            nombreCliente: true,
            comuna: true
          }
        },
        contacto: true
      }
    })

    // Log para diagnóstico
    console.log(
      'Ejemplo de datos de contacto:',
      cotizaciones.length > 0
        ? JSON.stringify(
            {
              contactoId: cotizaciones[0].contactoId,
              contactoRelacion: cotizaciones[0].contacto,
              contactoDatos: cotizaciones[0].contacto?.contacto
            },
            null,
            2
          )
        : 'No hay cotizaciones'
    )

    return cotizaciones.map(cotizacion => {
      const tipoMapeado = cotizacion.tipoCotizacion

      // Obtener el nombre del contacto
      const nombreContacto = cotizacion.contacto?.nombre || 'Sin contacto'

      // Log para diagnóstico de cada contacto
      if (cotizacion.contacto?.contactId) {
        console.log(`Cotización ${cotizacion.id} - contactoId: ${cotizacion.contacto?.contactId}, nombre: ${nombreContacto}`)
      }

      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        fecha: cotizacion.fechaCreacion.toLocaleDateString(),
        empresa: cotizacion.empresa || 'No especificada',
        comuna: cotizacion.cliente?.comuna || cotizacion.ubicacion?.split(',').pop()?.trim() || 'No especificada',
        tipo: tipoMapeado,
        contacto: cotizacion.contacto,
        estado: cotizacion.estado,
        total: parseFloat(cotizacion.total.toString())
      }
    })
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
