'use client'
import { useState } from 'react'
import Grid from '@mui/material/Grid'

// Component Imports
import Header from './Header'
import UserListTable2 from './UserListTable'

type Filters = {
  dateField?: 'fecha_codificacion' | 'fecha_muestreo'
  start?: string
  end?: string
  estadoOperativo?: string
}

export default function RcmDetalleNavigatorPage() {
  const [filters, setFilters] = useState<Filters | undefined>()

  return (
    <div>
      <Header
        onFiltersChange={(f) =>
          setFilters((prev) => {
            // f === undefined -> clear all filters
            if (f === undefined) return undefined

            const next: Partial<Filters> = { ...(prev ?? {}) }
            Object.keys(f).forEach((key) => {
              const val = (f as any)[key]
              // if incoming value is undefined or empty string -> remove that filter key
              if (val === undefined || val === '') {
                delete (next as any)[key]
              } else {
                ; (next as any)[key] = val
              }
            })
            // if no keys left, return undefined
            return Object.keys(next).length ? (next as Filters) : undefined
          })
        }
      />
      <UserListTable2 filters={filters} />
    </div>
  )
}
