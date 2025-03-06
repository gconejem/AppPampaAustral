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

// Types
type DateRange = [Date | null, Date | null]

type Props = {
  onDateRangeChange: (range: DateRange) => void
}

const TableFilters = ({ onDateRangeChange }: Props) => {
  // States
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date)
    onDateRangeChange([date, endDate])
  }

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date)
    onDateRangeChange([startDate, date])
  }

  const handleClearFilters = () => {
    setStartDate(null)
    setEndDate(null)
    onDateRangeChange([null, null])
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={4} alignItems='center'>
          <Grid item xs={12} md={5}>
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
          <Grid item xs={12} md={5}>
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
          <Grid item xs={12} md={2}>
            <Box display='flex' justifyContent='flex-end'>
              <Button variant='outlined' color='secondary' onClick={handleClearFilters}>
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
