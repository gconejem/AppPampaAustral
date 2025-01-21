// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

// Third-party Imports
import DatePicker from 'react-datepicker'
import es from 'date-fns/locale/es'

// Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomInput from '@/views/components/custom-datepicker-input'

// Data Imports
import { ESTADOS_CLIENTE, SEGMENTOS } from '@/data/clientData'

interface Props {
  value: string
  selectedEstado: string
  selectedSegmento: string
  dateRange: [Date | null, Date | null]
  handleFilter: (val: string) => void
  handleEstadoChange: (val: string) => void
  handleSegmentoChange: (val: string) => void
  handleDateRangeChange: (dates: [Date | null, Date | null]) => void
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
  const [startDate, endDate] = dateRange

  return (
    <Box sx={{ p: 5, pb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
        <AppReactDatepicker>
          <DatePicker
            selectsRange
            monthsShown={1}
            endDate={endDate}
            selected={startDate}
            startDate={startDate}
            shouldCloseOnSelect={false}
            locale={es}
            dateFormat='dd/MM/yyyy'
            id='date-range-picker'
            customInput={
              <CustomInput
                label='Fecha de Creación'
                start={startDate}
                end={endDate}
                size='small'
                sx={{ width: '240px' }}
              />
            }
            onChange={(dates: [Date | null, Date | null]) => handleDateRangeChange(dates)}
          />
        </AppReactDatepicker>

        <FormControl size='small' sx={{ minWidth: '240px' }}>
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

        <FormControl size='small' sx={{ minWidth: '240px' }}>
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
    </Box>
  )
}

export default TableFilters
