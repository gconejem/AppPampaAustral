// React Imports
import { useState, forwardRef } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
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
    const [startDateRange, setStartDateRange] = useState<Date | null | undefined>(new Date())
    const [endDateRange, setEndDateRange] = useState<Date | null | undefined>(addDays(new Date(), 45))

    const handleOnChange = (dates: any) => {
        const [start, end] = dates

        setStartDate(start)
        setEndDate(end)
    }

    const handleOnChangeRange = (dates: any) => {
        const [start, end] = dates

        setStartDateRange(start)
        setEndDateRange(end)
    }

    const CustomInput = forwardRef((props: CustomInputProps, ref) => {
        const { label, start, end, ...rest } = props

        const startDate = format(start, 'MM/dd/yyyy')
        const endDate = end !== null ? ` - ${format(end, 'MM/dd/yyyy')}` : null

        const value = `${startDate}${endDate !== null ? endDate : ''}`

        return <TextField fullWidth inputRef={ref} {...rest} label={label} value={value} />
    })

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid xs={12}>
                    <AppReactDatepicker
                        selectsRange
                        endDate={endDate as Date}
                        selected={startDate}
                        startDate={startDate as Date}
                        id='date-range-picker'
                        onChange={handleOnChange}
                        shouldCloseOnSelect={false}
                        customInput={
                            <CustomInput label='Rango de Fechas' start={startDate as Date | number} end={endDate as Date | number} />
                        }
                        boxProps={{
                            className: 'flex justify-center is-full',
                            sx: { '& .react-datepicker': { boxShadow: 'none !important', border: 'none !important' } }
                        }}
                    />
                </Grid>
            </Grid>
        </Box>
    )
}

export default PickersRange
