import { useState, useEffect } from 'react'

import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import EditIcon from '@mui/icons-material/EditIcon'
import DeleteIcon from '@mui/icons-material/DeleteIcon'
import OptionMenu from '@mui/material/OptionMenu'

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

  return (
    <>
      <TextField disabled={soloLectura} value={value} onChange={handleChange} size='small' type='number' sx={{ width: '100px' }} />
      <Button disabled={soloLectura}>Guardar</Button>
      <IconButton disabled={soloLectura}><EditIcon /></IconButton>
      <IconButton disabled={soloLectura}><DeleteIcon /></IconButton>
      <Switch disabled={soloLectura} />
      <OptionMenu iconButtonProps={{ disabled: soloLectura }} ... />
    </>
  )
}

export default PriceField
