// Component Imports
import RequestList from '@/views/apps/requests/list'

// API Imports
import { prisma } from '@/lib/prisma'

interface PageProps {
  params: {
    lang: string
  }
}

async function getSolicitudes() {
  try {
    const solicitudes = await prisma.solicitud.findMany({
      orderBy: {
        id: 'asc'
      },
      include: {
        cliente: {
          select: {
            nombreCliente: true
          }
        },
        obra: {
          select: {
            numeroObra: true,
            comuna: true
          }
        }
      }
    })

    return solicitudes.map((solicitud, index) => ({
      id: solicitud.id,
      numeroSolicitud: String(solicitud.numeroSolicitud).padStart(4, '0'),
      fecha: solicitud.fechaCreacion.toLocaleDateString(),
      cliente: solicitud.cliente?.nombreCliente || 'Sin cliente',
      obra: solicitud.obra?.numeroObra || 'Sin obra',
      comuna: solicitud.obra?.comuna || 'Sin comuna',
      estadoOperacional: solicitud.estadoOperativo,
      estadoAdministrativo: solicitud.estadoAdministrativo
    }))
  } catch (error) {
    console.error('Error al obtener solicitudes:', error)

    return []
  }
}

const RequestListPage = async ({ params }: PageProps) => {
  const data = await getSolicitudes()

  return <RequestList requestData={data} />
}

export default RequestListPage
