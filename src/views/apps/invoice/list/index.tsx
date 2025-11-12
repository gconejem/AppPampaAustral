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
  const [filteredData, setFilteredData] = useState<InvoiceType[] | undefined>(invoiceData)

  // Callback para refrescar las estadísticas
  const handleCotizacionDeleted = useCallback(() => {
    setRefreshStats(prev => prev + 1)
  }, [])

  // Callback para actualizar las cards cuando se filtran los datos
  const handleDataFiltered = useCallback((data: InvoiceType[]) => {
    setFilteredData(data)
  }, [])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <InvoiceCard refreshTrigger={refreshStats} filteredData={filteredData} />
      </Grid>
      <Grid item xs={12}>
        <InvoiceListTable
          invoiceData={invoiceData}
          onCotizacionDeleted={handleCotizacionDeleted}
          onDataFiltered={handleDataFiltered}
        />
      </Grid>
    </Grid>
  )
}

export default InvoiceList
