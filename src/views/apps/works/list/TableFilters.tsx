// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { es } from 'date-fns/locale'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Data Imports
import { ESTADOS_OBRA } from '@/data/obraData'

// Imports para permisos - NUEVO
import { usePermissions } from '@/hooks/usePermissions'
import { permisos } from '@/permisos/permisos'

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
  // States
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [selectedEstado, setSelectedEstado] = useState<string>('')

    // Hook de permisos
  const { hasPermission } = usePermissions()
  
  // Verificar si el usuario solo tiene permisos de lectura
  const soloLectura =
    hasPermission(permisos.empresa.ver) &&
    !hasPermission(permisos.empresa.crear) &&
    !hasPermission(permisos.empresa.editar) &&
    !hasPermission(permisos.empresa.eliminar)

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date)
    applyFilters(date, endDate, selectedEstado)
  }

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date)
    applyFilters(startDate, date, selectedEstado)
  }

  const handleEstadoChange = (event: any) => {
    const estado = event.target.value

    setSelectedEstado(estado)
    applyFilters(startDate, endDate, estado)
  }

  const handleClearFilters = () => {
    setStartDate(null)
    setEndDate(null)
    setSelectedEstado('')
    setFilteredData(workData)
  }

  const applyFilters = (start: Date | null, end: Date | null, estado: string) => {
    let filteredWorks = [...workData]

    if (start && end) {
      filteredWorks = filteredWorks.filter(work => {
        const workDate = new Date(work.createdAt)
        const startOfDay = new Date(start)

        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(end)

        endOfDay.setHours(23, 59, 59, 999)

        return workDate >= startOfDay && workDate <= endOfDay
      })
    }

    if (estado) {
      filteredWorks = filteredWorks.filter(
        work => work.estadoObra?.toString().toLowerCase() === estado.toString().toLowerCase()
      )
    }

    setFilteredData(filteredWorks)
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={4} alignItems='center'>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label='Fecha inicio'
                value={startDate}
                onChange={handleStartDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label='Fecha fin'
                value={endDate}
                onChange={handleEndDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
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
          </Grid>
          <Grid item xs={12} md={2}>
            <Box display='flex' justifyContent='flex-end'>
              <Button variant='outlined' color='secondary' onClick={handleClearFilters} disabled={soloLectura}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default TableFilters
