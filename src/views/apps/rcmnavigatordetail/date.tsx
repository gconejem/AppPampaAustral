// React Imports
import { useState, useEffect, forwardRef } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import { format } from 'date-fns'

// Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

type CustomInputProps = TextFieldProps & {
  label: string
  end: Date | number | null | undefined
  start: Date | number | null | undefined
}

interface PickersRangeProps {
  onChange?: (range: [Date | null, Date | null]) => void
  initialStart?: Date | null
  initialEnd?: Date | null
  maxWidth?: number | string
}

const PickersRange = ({ onChange, initialStart = null, initialEnd = null, maxWidth = '250px' }: PickersRangeProps) => {
  const [startDate, setStartDate] = useState<Date | null | undefined>(initialStart)
  const [endDate, setEndDate] = useState<Date | null | undefined>(initialEnd)

  const handleOnChange = (dates: any) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    // emitir hacia el padre en formato [Date|null,Date|null]
    onChange?.([start ?? null, end ?? null])
    console.log('PickersRange -> onChange emitted', { start, end })
  }

  // emitir el valor inicial al montar (útil para que Header reciba filtro inicial)
  useEffect(() => {
    onChange?.([startDate ?? null, endDate ?? null])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const CustomInput = forwardRef<any, CustomInputProps>((props, ref) => {
    const { label, start, end, ...rest } = props
    // formato dia/mes/año
    const startDateStr = start ? format(start as Date, 'dd/MM/yyyy') : ''
    const endDateStr = end ? ` - ${format(end as Date, 'dd/MM/yyyy')}` : ''
    const value = `${startDateStr}${endDateStr}`
    return <TextField fullWidth inputRef={ref} {...rest} label={label} value={value} />
  })
  CustomInput.displayName = 'PickersRangeCustomInput'

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <div style={{ maxWidth: maxWidth, marginLeft: 0 }}>
          <AppReactDatepicker
            selectsRange
            endDate={endDate}
            selected={startDate}
            startDate={startDate}
            id='date-range-picker'
            onChange={handleOnChange}
            shouldCloseOnSelect={false}
            customInput={<CustomInput label='Rango de Fechas' start={startDate as Date | number} end={endDate as Date | number} />}
          />
        </div>
      </Grid>
    </Grid>
  )
}

export default PickersRange
