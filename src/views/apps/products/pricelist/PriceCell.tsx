import { useState } from 'react'

import TextField from '@mui/material/TextField'
import axios from 'axios'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import EditIcon from '@mui/icons-material/EditIcon'
import DeleteIcon from '@mui/icons-material/DeleteIcon'
import OptionMenu from '@mui/material/OptionMenu'

interface PriceCellProps {
  initialPrice: number
  productoId: number
  onUpdate: (newPrice: number) => void
}

const PriceCell = ({ initialPrice, productoId, onUpdate }: PriceCellProps) => {
  const [price, setPrice] = useState(initialPrice)
  const [soloLectura, setSoloLectura] = useState(false)

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

  const handleSoloLecturaChange = () => {
    setSoloLectura((prev) => !prev)
  }

  return (
    <>
      <TextField
        value={price}
        onChange={handleChange}
        onBlur={handleBlur}
        size='small'
        type='number'
        sx={{ width: '100px' }}
      />
      <Button disabled={soloLectura}>Agregar Producto</Button>
      <IconButton disabled={soloLectura}><EditIcon /></IconButton>
      <IconButton disabled={soloLectura}><DeleteIcon /></IconButton>
      <Switch disabled={soloLectura} />
      <Button disabled={soloLectura}>Actualizar Precio</Button>
      <OptionMenu iconButtonProps={{ disabled: soloLectura }} ... />
    </>
  )
}

export default PriceCell
