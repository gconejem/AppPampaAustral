// React Imports
import { forwardRef } from 'react'

// MUI Imports
import TextField from '@mui/material/TextField'

// Third Party Imports
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'

interface PickersRangeProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (start: Date | null, end: Date | null) => void
  placeholderText?: string
}

const CustomInput = forwardRef((props: any, ref) => {
  const { onClick } = props

  return (
    <TextField
      fullWidth
      inputRef={ref}
      onClick={onClick}
      onKeyDown={e => e.preventDefault()}
      readOnly
      sx={{
        width: '240px',
        '& .MuiInputBase-input': {
          cursor: 'pointer'
        }
      }}
      {...props}
    />
  )
})

const PickersRange = ({ startDate, endDate, onChange, placeholderText }: PickersRangeProps) => {
  return (
    <div className='flex items-center'>
      <DatePicker
        selectsRange
        endDate={endDate}
        selected={startDate}
        startDate={startDate}
        onChange={(dates: [Date | null, Date | null]) => {
          onChange(dates[0], dates[1])
        }}
        placeholderText={placeholderText || 'Filtrar por fecha de creación'}
        customInput={<CustomInput />}
        dateFormat='dd/MM/yyyy'
        isClearable={true}
        locale={es}
      />
    </div>
  )
}

export default PickersRange
