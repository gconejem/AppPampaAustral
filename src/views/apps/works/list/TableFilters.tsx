// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

// Date Imports
import { format } from 'date-fns'

// Data Imports
import { ESTADOS_OBRA } from '@/data/obraData'

// Component Imports
import PickersRange from './date'

// Type Imports
import type { WorkType } from '@/types/apps/workTypes'

type Props = {
  setData: (data: WorkType[] | ((prevData: WorkType[]) => WorkType[])) => void
  tableData?: WorkType[]
}

const TableFilters = ({ setData, tableData }: Props) => {
  // States
  const [estado, setEstado] = useState('')

  const [dateRange, setDateRange] = useState<{
    start: Date | null
    end: Date | null
  }>({
    start: null,
    end: null
  })

  useEffect(() => {
    if (!tableData) return

    const filteredData = tableData.filter(obra => {
      // Filtrar por estado
      if (estado && obra.estado !== estado) return false

      // Filtrar por rango de fecha
      if (dateRange.start && dateRange.end) {
        const obraDate = new Date(obra.fechaCreacion)

        return obraDate >= dateRange.start && obraDate <= dateRange.end
      }

      return true
    })

    setData(filteredData)
  }, [estado, dateRange, tableData, setData])

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end })
  }

  return (
    <CardContent>
      <Grid container spacing={5} style={{ marginBottom: '16px' }}>
        {/* Rango de Fechas */}
        <Grid item xs={12} sm={3} sx={{ marginRight: '-79px' }}>
          <PickersRange startDate={dateRange.start} endDate={dateRange.end} onChange={handleDateRangeChange} />
        </Grid>

        {/* Campo de Estado */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select value={estado} label='Estado' onChange={e => setEstado(e.target.value)}>
              <MenuItem value=''>Todos</MenuItem>
              {ESTADOS_OBRA.map(estado => (
                <MenuItem key={estado.value} value={estado.value}>
                  {estado.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
