// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'

// Third Party Imports
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import es from 'date-fns/locale/es'

// Data Imports
import { SEGMENTOS } from '@/data/clientData'
import { useUbicacion } from '@/hooks/useUbicacion'

// Definir los nuevos segmentos
const SEGMENTOS_NUEVOS = ['Corporativo Estratégico', 'Consolidado', 'Expansión', 'Ocasional', 'Nuevo prospecto']

// Definir los estados
const ESTADOS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' }
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

  return (
    <Box className='flex flex-wrap items-center justify-between gap-4 p-6'>
      <Box className='flex flex-wrap items-center gap-4'>
        <DatePicker
          selectsRange
          endDate={dateRange[1]}
          selected={dateRange[0]}
          startDate={dateRange[0]}
          onChange={(dates: [Date | null, Date | null]) => handleDateRangeChange(dates)}
          customInput={
            <TextField
              size='small'
              inputProps={{
                readOnly: true,
                placeholder: 'Filtrar por fecha de creación'
              }}
              sx={{
                width: '240px',
                '& .MuiInputBase-input': {
                  cursor: 'pointer'
                }
              }}
            />
          }
          dateFormat='dd/MM/yyyy'
          isClearable={true}
          locale={es}
        />

        <FormControl size='small' sx={{ minWidth: '240px' }}>
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

        <FormControl size='small' sx={{ minWidth: '240px' }}>
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
      </Box>
    </Box>
  )
}

export default TableFilters
