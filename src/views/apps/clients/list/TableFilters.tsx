// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'

// Type Imports
import type { Cliente } from '@/types/forms/cliente'

// Data Imports
import { ESTADOS_CLIENTE, SEGMENTOS } from '@/data/clientData'

interface Props {
  value: string
  selectedEstado: string
  selectedSegmento: string
  dateRange: string
  handleFilter: (val: string) => void
  handleEstadoChange: (val: string) => void
  handleSegmentoChange: (val: string) => void
  handleDateRangeChange: (val: string) => void
}

const TableFilters = ({
  value,
  selectedEstado,
  selectedSegmento,
  dateRange,
  handleFilter,
  handleEstadoChange,
  handleSegmentoChange,
  handleDateRangeChange
}: Props) => {
  return (
    <Box sx={{ p: 5, pb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
      <TextField
        size='small'
        type='text'
        value={dateRange}
        placeholder='MM/DD/YYYY - MM/DD/YYYY'
        onChange={e => handleDateRangeChange(e.target.value)}
        sx={{ width: '250px' }}
      />

      <FormControl size='small' sx={{ width: '150px' }}>
        <InputLabel>Estado</InputLabel>
        <Select value={selectedEstado} onChange={e => handleEstadoChange(e.target.value)} label='Estado'>
          <MenuItem value=''>Todos</MenuItem>
          {ESTADOS_CLIENTE.map(estado => (
            <MenuItem key={estado.value} value={estado.value}>
              {estado.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size='small' sx={{ width: '150px' }}>
        <InputLabel>Segmento</InputLabel>
        <Select value={selectedSegmento} onChange={e => handleSegmentoChange(e.target.value)} label='Segmento'>
          <MenuItem value=''>Todos</MenuItem>
          {SEGMENTOS.map(segmento => (
            <MenuItem key={segmento.value} value={segmento.value}>
              {segmento.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

export default TableFilters
