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
          densidad: true
        }
      }
    }
  })

  return agendas
}

// Page Component
const UserListPage = async () => {
  return <UserList />
}

export default UserListPage
