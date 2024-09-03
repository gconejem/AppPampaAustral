// React Imports
import { useState, forwardRef } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import { format, addDays } from 'date-fns'

// Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

type CustomInputProps = TextFieldProps & {
  label: string
  end: Date | number
  start: Date | number
}

const PickersRange = () => {
  // States
  const [startDate, setStartDate] = useState<Date | null | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | null | undefined>(addDays(new Date(), 15))

  const handleOnChange = (dates: any) => {
    const [start, end] = dates

    setStartDate(start)
    setEndDate(end)
  }

  const CustomInput = forwardRef((props: CustomInputProps, ref) => {
    const { label, start, end, ...rest } = props

    const startDate = format(start, 'MM/dd/yyyy')
    const endDate = end !== null ? ` - ${format(end, 'MM/dd/yyyy')}` : null

    const value = `${startDate}${endDate !== null ? endDate : ''}`

    return <TextField fullWidth inputRef={ref} {...rest} label={label} value={value} />
  })

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        {/* Ajustar el tamaño y la alineación del Datepicker */}
        <div style={{ maxWidth: '250px', marginLeft: '0px' }}>
          <AppReactDatepicker
            selectsRange
            endDate={endDate}
            selected={startDate}
            startDate={startDate}
            id='date-range-picker'
            onChange={handleOnChange}
            shouldCloseOnSelect={false}
            customInput={
              <CustomInput label='Rango de Fechas}' start={startDate as Date | number} end={endDate as Date | number} />
            }
          />
        </div>
      </Grid>
    </Grid>
  )
}

export default PickersRange
