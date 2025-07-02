// index.tsx

'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import VisitListTable from './VisitListTable'
import OtListTable from './OtListTable'
import UserListCards from './UserListCards'

// Type Imports
import type { OrdenTrabajo } from '@/types/otTypes'

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

const UserList = () => {
  const [data, setData] = useState<Agenda[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedVisit, setSelectedVisit] = useState<Agenda | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/agenda')
        const agendaData = await response.json()

        setData(agendaData)
      } catch (error) {
        console.error('Error cargando datos de agenda:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleVisitSelect = (visit: Agenda | null) => {
    setSelectedVisit(visit)
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-[400px]'>
        <CircularProgress />
      </div>
    )
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
