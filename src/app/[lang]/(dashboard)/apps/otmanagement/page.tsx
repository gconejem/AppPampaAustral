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
      }
    }
  })

  return agendas
}

// Page Component
const UserListPage = async () => {
  // Vars
  const data = await getAgendaData()

  return <UserList data={data} />
}

export default UserListPage
