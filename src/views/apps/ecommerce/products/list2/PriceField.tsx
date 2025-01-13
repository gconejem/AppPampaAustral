import { useState, useEffect } from 'react'

import TextField from '@mui/material/TextField'

interface PriceFieldProps {
  initialValue: number
  productoId: number
  onPriceChange: (productoId: number, newPrice: number) => void
}

const PriceField = ({ initialValue, productoId, onPriceChange }: PriceFieldProps) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value)

    setValue(newValue)
    onPriceChange(productoId, newValue)
  }

  return <TextField value={value} onChange={handleChange} size='small' type='number' sx={{ width: '100px' }} />
}

export default PriceField
