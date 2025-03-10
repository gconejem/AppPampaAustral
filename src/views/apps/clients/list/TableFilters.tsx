// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { es } from 'date-fns/locale'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'

// Third Party Imports
import 'react-datepicker/dist/react-datepicker.css'

// Data Imports
import { SEGMENTOS } from '@/data/clientData'
import { useUbicacion } from '@/hooks/useUbicacion'

// Definir los nuevos segmentos
const SEGMENTOS_NUEVOS = ['Corporativo Estratégico', 'Consolidado', 'Expansión', 'Ocasional', 'Nuevo prospecto']

// Definir los estados
const ESTADOS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'blocked', label: 'Bloqueado' }
]

interface Props {
  value: string
  selectedEstado: string
  selectedSegmento: string
  dateRange: [Date | null, Date | null]
  handleFilter: (val: string) => void
  handleEstadoChange: (val: string) => void
  handleSegmentoChange: (val: string) => void
  handleDateRangeChange: (dates: [Date | null, Date | null]) => void
  selectedRegion: string
  handleRegionChange: (val: string) => void
}

const TableFilters = ({
  value,
  selectedEstado,
  selectedSegmento,
  dateRange,
  handleFilter,
  handleEstadoChange,
  handleSegmentoChange,
  handleDateRangeChange,
  selectedRegion,
  handleRegionChange
}: Props) => {
  const { regiones } = useUbicacion()

  const handleStartDateChange = (date: Date | null) => {
    handleDateRangeChange([date, dateRange[1]])
  }

  const handleEndDateChange = (date: Date | null) => {
    handleDateRangeChange([dateRange[0], date])
  }

  const handleClearFilters = () => {
    handleDateRangeChange([null, null])
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} alignItems='center'>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
              <DatePicker
                label='Fecha inicio'
                value={dateRange[0]}
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
                value={dateRange[1]}
                onChange={handleEndDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={selectedEstado} onChange={e => handleEstadoChange(e.target.value)} label='Estado'>
                <MenuItem value=''>Todos</MenuItem>
                {ESTADOS.map(estado => (
                  <MenuItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Segmento</InputLabel>
              <Select value={selectedSegmento} onChange={e => handleSegmentoChange(e.target.value)} label='Segmento'>
                <MenuItem value=''>Todos</MenuItem>
                {SEGMENTOS_NUEVOS.map(segmento => (
                  <MenuItem key={segmento} value={segmento}>
                    {segmento}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button fullWidth variant='outlined' color='secondary' onClick={handleClearFilters}>
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default TableFilters
