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
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'

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

    let filteredData = [...tableData]

    // Filtrar por estado
    if (estado) {
      filteredData = filteredData.filter(obra => obra.estado === estado)
    }

    // Filtrar por rango de fechas
    if (dateRange.start && dateRange.end) {
      filteredData = filteredData.filter(obra => {
        try {
          const fechaCreacion = new Date(obra.createdAt)
          const startDate = startOfDay(dateRange.start)
          const endDate = endOfDay(dateRange.end)

          // Agregar logs para debugging
          console.log('Comparando fechas para obra:', obra.numeroObra, {
            fechaCreacion: fechaCreacion.toISOString(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          })

          const isWithinRange = fechaCreacion >= startDate && fechaCreacion <= endDate

          console.log('¿Está en el rango?:', isWithinRange)

          return isWithinRange
        } catch (error) {
          console.error('Error al procesar fecha para obra:', obra.numeroObra, error)

          return false
        }
      })
    }

    console.log('Datos filtrados:', filteredData.length, 'registros')
    setData(filteredData)
  }, [estado, dateRange, tableData, setData])

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    try {
      console.log('Fechas recibidas:', {
        start: start ? format(start, 'yyyy-MM-dd') : null,
        end: end ? format(end, 'yyyy-MM-dd') : null
      })
      setDateRange({ start, end })
    } catch (error) {
      console.error('Error al cambiar fechas:', error)
    }
  }

  return (
    <CardContent>
      <Grid container spacing={5} style={{ marginBottom: '16px' }}>
        {/* Rango de Fechas */}
        <Grid item xs={12} sm={3} sx={{ marginRight: '-79px' }}>
          <PickersRange
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={handleDateRangeChange}
            placeholderText='Filtrar por fecha de creación'
          />
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
