// index.tsx

'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import UserListTable from './UserListTable'
import UserListTable2 from './UserListTable2'
import UserListCards from './UserListCards'

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
        <UserListTable tableData={data} onVisitSelect={handleVisitSelect} selectedVisit={selectedVisit} />
      </Grid>
      {selectedVisit && (
        <Grid item xs={12}>
          <UserListTable2 tableData={data} selectedVisit={selectedVisit} />
        </Grid>
      )}
    </Grid>
  )
}

export default UserList
