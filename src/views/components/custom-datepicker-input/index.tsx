// React Imports
import { forwardRef } from 'react'

// MUI Imports
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import { format } from 'date-fns'
import es from 'date-fns/locale/es'

interface Props extends Omit<TextFieldProps, 'value'> {
  label?: string
  start: Date | null
  end: Date | null
}

const CustomInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { label = 'Seleccionar Fecha', start, end, ...rest } = props

  const formatDate = (date: Date | null) => {
    if (!date) return ''

    return format(date, 'dd/MM/yyyy', { locale: es })
  }

  const value = start ? (end ? `${formatDate(start)} - ${formatDate(end)}` : formatDate(start)) : ''

  return (
    <TextField
      {...rest}
      size='small'
      inputRef={ref}
      label={label}
      value={value}
      InputProps={{
        readOnly: true
      }}
    />
  )
})

CustomInput.displayName = 'CustomInput'

export default CustomInput
