// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import JsonUpload from '@views/apps/json-upload'

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
const JsonUploadPage = async () => {
  // Vars
  const data = await getAgendaData()

  return <JsonUpload agendas={data} />
}

export default JsonUploadPage 
