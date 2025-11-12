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
            contactId: cotizaciones[0].contactId,
            contactoRelacion: cotizaciones[0].contacto,
            contactoDatos: cotizaciones[0].contacto
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
        console.log(`Cotización ${cotizacion.id} - contactId: ${cotizacion.contacto?.contactId}, nombre: ${nombreContacto}`)
      }

      return {
        id: cotizacion.id,
        numeroCotizacion: cotizacion.numeroCotizacion,
        tipoCotizacion: tipoMapeado as string,
        fecha: cotizacion.fechaCreacion.toLocaleDateString(),
        empresa: cotizacion.empresa || 'No especificada',
        comuna: cotizacion.cliente?.comuna || cotizacion.ubicacion?.split(',').pop()?.trim() || 'No especificada',
        tipo: tipoMapeado as string,
        contacto: cotizacion.contacto ? {
          nombre: cotizacion.contacto.nombre,
          cargo: cotizacion.contacto.cargo,
          email: cotizacion.contacto.email,
          telefono1: cotizacion.contacto.telefono1
        } : null,
        estado: cotizacion.estado,
        detalles: [],
        total: parseFloat(cotizacion.total.toString()),
        observacionGestion: cotizacion.observacionGestion
      }
    })
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error)

    return []
  }
}

export default async function Page() {
  // No cargar datos en el servidor, dejar que el componente cliente
  // los cargue con los filtros de fecha del mes actual
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <InvoiceList />
    </Suspense>
  )
}
