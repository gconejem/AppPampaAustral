// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
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
    <Box className='flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between'>
      <Box className='flex flex-1 items-center gap-4'>
        <Box className='flex-1 max-w-[240px]'>
          <PickersRange
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            placeholderText='Filtrar por fecha de creación'
          />
        </Box>
        <FormControl size='small' sx={{ minWidth: '240px' }}>
          <InputLabel>Estado</InputLabel>
          <Select value={selectedEstado} label='Estado' onChange={handleEstadoChange}>
            <MenuItem value=''>Todos</MenuItem>
            {Array.isArray(estados) &&
              estados.map((estado: string) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  )
}

export default TableFilters
