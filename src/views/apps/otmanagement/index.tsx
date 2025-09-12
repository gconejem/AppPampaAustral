// index.tsx

'use client'

// React Imports
import { useState, useCallback } from 'react'

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
  const [selectedVisits, setSelectedVisits] = useState<Agenda[]>([])
  const [dateFilters, setDateFilters] = useState<{ fechaInicio: string, fechaFin: string }>({
    fechaInicio: '',
    fechaFin: ''
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleVisitSelect = (visit: Agenda | null) => {
    setSelectedVisit(visit)
  }

  const handleSelectedVisitsChange = useCallback((visits: Agenda[]) => {
    setSelectedVisits(visits)
  }, [])

  const handleFiltersChange = useCallback((filters: { fechaInicio: string, fechaFin: string }) => {
    setDateFilters(filters)
  }, [])

  const handleVisitStatusChange = useCallback(() => {
    // Incrementar el trigger para forzar el refresh de la tabla de OTs
    setRefreshTrigger(prev => prev + 1)
  }, [])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <UserListCards />
      </Grid>
      <Grid item xs={12}>
        <VisitListTable
          tableData={data}
          onVisitSelect={handleVisitSelect}
          selectedVisit={selectedVisit}
          onFiltersChange={handleFiltersChange}
          onSelectedVisitsChange={handleSelectedVisitsChange}
          onVisitStatusChange={handleVisitStatusChange}
        />
      </Grid>
      <Grid item xs={12}>
        <OtListTable
          selectedVisit={selectedVisit}
          selectedVisits={selectedVisits}
          fechaInicio={dateFilters.fechaInicio}
          fechaFin={dateFilters.fechaFin}
          refreshTrigger={refreshTrigger}
        />
      </Grid>
    </Grid>
  )
}

export default UserList
