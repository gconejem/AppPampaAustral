'use client'

// React Imports
import { useState, useCallback } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

// Component Imports
import InvoiceListTable from './InvoiceListTable'
import InvoiceCard from './InvoiceCard'

const InvoiceList = ({ invoiceData }: { invoiceData?: InvoiceType[] }) => {
  const [refreshStats, setRefreshStats] = useState(0)

  // Callback para refrescar las estadísticas
  const handleCotizacionDeleted = useCallback(() => {
    setRefreshStats(prev => prev + 1)
  }, [])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <InvoiceCard refreshTrigger={refreshStats} />
      </Grid>
      <Grid item xs={12}>
        <InvoiceListTable
          invoiceData={invoiceData}
          onCotizacionDeleted={handleCotizacionDeleted}
        />
      </Grid>
    </Grid>
  )
}

export default InvoiceList
