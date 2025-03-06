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
import { ESTADOS_OBRA } from '@/data/obraData'

interface Estado {
  value: string
  label: string
}

interface TableFiltersProps {
  workData: any[]
  setFilteredData: (data: any[]) => void
  estados?: Estado[]
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
        const startOfDay = new Date(start.setHours(0, 0, 0, 0))
        const endOfDay = new Date(end.setHours(23, 59, 59, 999))

        return workDate >= startOfDay && workDate <= endOfDay
      })
    }

    if (selectedEstado) {
      filteredWorks = filteredWorks.filter(
        work => work.estadoObra?.toString().toLowerCase() === selectedEstado.toString().toLowerCase()
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
        work => work.estadoObra?.toString().toLowerCase() === estado.toString().toLowerCase()
      )
    }

    if (startDate && endDate) {
      filteredWorks = filteredWorks.filter(work => {
        const workDate = new Date(work.createdAt)
        const startOfDay = new Date(startDate.setHours(0, 0, 0, 0))
        const endOfDay = new Date(endDate.setHours(23, 59, 59, 999))

        return workDate >= startOfDay && workDate <= endOfDay
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
            {estados.map(estado => (
              <MenuItem key={estado.value} value={estado.value}>
                {estado.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  )
}

export default TableFilters
