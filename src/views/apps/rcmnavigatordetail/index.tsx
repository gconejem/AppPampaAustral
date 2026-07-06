'use client'

// MUI Imports
import { useEffect, useState } from 'react'
import { useSettings } from '@core/hooks/useSettings'

import Grid from '@mui/material/Grid'

// Component Imports
import Header from './Header'
import UserListTable2 from './UserListTable'

export default function RcmNavigatorPage() {
  const { updatePageSettings } = useSettings()

  useEffect(() => {
    return updatePageSettings({
      contentWidth: 'wide',
      navbarContentWidth: 'wide',
      footerContentWidth: 'wide'
    })
    // updatePageSettings cambia de referencia en cada render; debe ejecutarse solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    servicioEnsayo?: string | null
    sede?: string
  } | undefined>()

  return (
    <div>
      <HeaderComponent onFiltersChange={f => setFilters(f)} />
      <UserListTableComponent filters={filters} />
    </div>
  )
}
