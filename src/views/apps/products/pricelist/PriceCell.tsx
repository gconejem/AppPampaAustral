import { useState } from 'react'

import TextField from '@mui/material/TextField'
import axios from 'axios'

interface PriceCellProps {
  initialPrice: number
  productoId: number
  onUpdate: (newPrice: number) => void
}

const PriceCell = ({ initialPrice, productoId, onUpdate }: PriceCellProps) => {
  const [price, setPrice] = useState(initialPrice)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(parseFloat(e.target.value))
  }

  const handleBlur = async () => {
    if (price === initialPrice) return

    try {
      await axios.patch(`/api/productos/${productoId}/precio`, { precio: price })
      onUpdate(price)
    } catch (error) {
      console.error('Error updating price:', error)
      setPrice(initialPrice) // Revertir al precio original si hay error
    }
  }

  return (
    <TextField
      value={price}
      onChange={handleChange}
      onBlur={handleBlur}
      size='small'
      type='number'
      sx={{ width: '100px' }}
    />
  )
}

export default PriceCell
