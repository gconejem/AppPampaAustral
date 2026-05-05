'use client'

// MUI Imports
import { useState } from 'react'

import Grid from '@mui/material/Grid'

// Component Imports
import Header from './Header'
import UserListTable2 from './UserListTable'

export default function RcmNavigatorPage() {
  const HeaderComponent: any = (Header as any)?.default ?? Header
  const UserListTableComponent: any = (UserListTable2 as any)?.default ?? UserListTable2

  const [filters, setFilters] = useState<{
    dateField?: 'fecha_codificacion' | 'fecha_muestreo' | 'fecha_ingreso' | 'fecha_vencimiento'
    start?: string
    end?: string
    estadoOperativo?: string
    estadoAdministrativo?: string
    areaId?: number | null
    areaName?: string | null
    familia?: string
    ensayador?: string | null
    sede?: string
  } | undefined>()

  return (
    <div>
      <HeaderComponent onFiltersChange={f => setFilters(f)} />
      <UserListTableComponent filters={filters} />
    </div>
  )
}
