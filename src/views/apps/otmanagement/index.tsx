// index.tsx

'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import VisitListTable from './VisitListTable'
import OtListTable from './OtListTable'
import UserListCards from './UserListCards'

interface OrdenTrabajo {
  id: string
  clave: string
  estado: string
  tipoOT: string
  createdAt: string
  userId: string
  user?: {
    name: string
  }
}

interface Agenda {
  id: number
  titulo: string
  tipoVisita: string
  fechaInicio: Date
  fechaFin: Date
  estado: string
  cliente?: {
    nombreCliente: string
  }
  obra?: {
    nombreObra: string
  }
  ordenesTrabajo: OrdenTrabajo[]
}

const UserList = ({ data }: { data: Agenda[] }) => {
  const [selectedVisit, setSelectedVisit] = useState<Agenda | null>(null)

  const handleVisitSelect = (visit: Agenda | null) => {
    setSelectedVisit(visit)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <UserListCards />
      </Grid>
      <Grid item xs={12}>
        <VisitListTable tableData={data} onVisitSelect={handleVisitSelect} selectedVisit={selectedVisit} />
      </Grid>
      <Grid item xs={12}>
        <OtListTable selectedVisit={selectedVisit} />
      </Grid>
    </Grid>
  )
}

export default UserList
