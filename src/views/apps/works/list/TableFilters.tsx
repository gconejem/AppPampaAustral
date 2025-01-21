// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Custom Component Imports
import PickersRange from './date'
import { ESTADOS_OBRA } from '@/data/constants'

interface TableFiltersProps {
  workData: any[]
  setFilteredData: (data: any[]) => void
  estados?: string[]
}

const TableFilters = ({ workData, setFilteredData, estados = ESTADOS_OBRA }: TableFiltersProps) => {
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedEstado, setSelectedEstado] = useState<string>('')

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start)
    setEndDate(end)

    let filteredWorks = [...workData]

    if (start && end) {
      filteredWorks = filteredWorks.filter(work => {
        const workDate = new Date(work.createdAt)

        return workDate >= start && workDate <= end
      })
    }

    // Filtrar por estado de forma segura
    if (selectedEstado) {
      filteredWorks = filteredWorks.filter(
        work => work.estado?.toString().toLowerCase() === selectedEstado.toString().toLowerCase()
      )
    }

    setFilteredData(filteredWorks)
  }

  const handleEstadoChange = (event: any) => {
    const estado = event.target.value

    setSelectedEstado(estado)

    let filteredWorks = [...workData]

    // Filtrar por estado de forma segura
    if (estado) {
      filteredWorks = filteredWorks.filter(
        work => work.estado?.toString().toLowerCase() === estado.toString().toLowerCase()
      )
    }

    if (startDate && endDate) {
      filteredWorks = filteredWorks.filter(work => {
        const workDate = new Date(work.createdAt)

        return workDate >= startDate && workDate <= endDate
      })
    }

    setFilteredData(filteredWorks)
  }

  return (
    <Grid container spacing={6} className='px-4 py-4'>
      <Grid item xs={12} sm={6}>
        <PickersRange
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateChange}
          placeholderText='Filtrar por fecha de creación'
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel id='estado-select-label'>Estado</InputLabel>
          <Select labelId='estado-select-label' value={selectedEstado} label='Estado' onChange={handleEstadoChange}>
            <MenuItem value=''>Todos</MenuItem>
            {Array.isArray(estados) &&
              estados.map((estado: string) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  )
}

export default TableFilters
