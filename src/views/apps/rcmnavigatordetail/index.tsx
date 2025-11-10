'use client'
// MUI Imports
import Grid from '@mui/material/Grid'
import { useState } from 'react'

// Component Imports
import Header from './Header'
import UserListTable2 from './UserListTable'

export default function RcmNavigatorPage() {
  const [filters, setFilters] = useState<{
    dateField?: 'fecha_codificacion' | 'fecha_muestreo'
    start?: string
    end?: string
    estadoOperativo?: string
    estadoAdministrativo?: string
    areaId?: number | null
    areaName?: string | null
    familia?: string
  } | undefined>()

  return (
    <div>
      <Header onFiltersChange={(f) => setFilters(f)} />
      <UserListTable2 filters={filters} />
    </div>
  )
}
