// React Imports
import { forwardRef } from 'react'

// MUI Imports
import TextField from '@mui/material/TextField'

// Third Party Imports
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface PickersRangeProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (start: Date | null, end: Date | null) => void
}

const CustomInput = forwardRef((props: any, ref) => {
  return <TextField fullWidth inputRef={ref} {...props} />
})

const PickersRange = ({ startDate, endDate, onChange }: PickersRangeProps) => {
  return (
    <div className='flex items-center'>
      <DatePicker
        selectsRange
        endDate={endDate as Date}
        selected={startDate}
        startDate={startDate as Date}
        onChange={(dates: [Date | null, Date | null]) => {
          onChange(dates[0], dates[1])
        }}
        placeholderText='Rango de Fechas'
        customInput={<CustomInput />}
        dateFormat='dd/MM/yyyy'
        isClearable={true}
      />
    </div>
  )
}

export default PickersRange
