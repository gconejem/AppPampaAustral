// Component Imports
import UserList from '@views/apps/otmanagement'

// Prisma Import
import { prisma } from '@/lib/prisma'

const getAgendaData = async () => {
  const agendas = await prisma.agenda.findMany({
    include: {
      cliente: true,
      obra: true,
      servicios: true,
      asignados: {
        include: {
          user: true
        }
      },
      ordenesTrabajo: {
        include: {
          user: true,
          aceptacionVisita: true,
          densidad: true,
          tipoOT: true
        }
      }
    }
  })

  // Mapear los datos de Prisma al tipo esperado
  return agendas.map(agenda => ({
    id: agenda.id,
    titulo: agenda.titulo,
    tipoVisita: agenda.tipoVisita,
    fechaInicio: agenda.fechaInicio,
    fechaFin: agenda.fechaFin,
    estado: agenda.estado,
    cliente: agenda.cliente ? {
      nombreCliente: agenda.cliente.nombreCliente
    } : undefined,
    obra: agenda.obra ? {
      nombreObra: agenda.obra.nombreObra
    } : undefined,
    ordenesTrabajo: agenda.ordenesTrabajo.map(ot => ({
      id: ot.id.toString(),
      clave: ot.clave || '',
      estado: ot.estado,
      tipoOT: ot.tipoOT?.codigo || '',
      createdAt: ot.createdAt.toISOString(),
      userId: ot.userId || '',
      user: ot.user ? {
        name: ot.user.name || ''
      } : undefined
    }))
  }))
}

// Page Component
const UserListPage = async () => {
  // Vars
  const data = await getAgendaData()

  return <UserList data={data} />
}

export default UserListPage
