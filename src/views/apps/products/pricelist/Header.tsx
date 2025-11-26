'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import EditIcon from '@mui/icons-material/EditIcon'
import DeleteIcon from '@mui/icons-material/DeleteIcon'
import OptionMenu from '@mui/material/OptionMenu'

const LISTAS_PRECIO = [
  { id: 1, nombre: 'Lista 1' },
  { id: 2, nombre: 'Lista 2' },
  { id: 3, nombre: 'Lista 3' }
]

interface HeaderProps {
  onSave: (listaId: number) => void
  selectedCount: number
}

const Header = ({ onSave, selectedCount }: HeaderProps) => {
  const [selectedLista, setSelectedLista] = useState<number>(1)

  const handleSave = () => {
    onSave(selectedLista)
  }

  return (
    <Card className='flex justify-between items-center p-6 mb-4'>
      <div>
        <FormControl>
          <InputLabel htmlFor='lista-select'>Lista de Precios</InputLabel>
          <Select
            id='lista-select'
            value={selectedLista}
            onChange={(e) => setSelectedLista(Number(e.target.value))}
            disabled={soloLectura}
          >
            {LISTAS_PRECIO.map(lista => (
              <MenuItem key={lista.id} value={lista.id}>
                {lista.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div>
        <Button disabled={soloLectura}>Nuevo Producto</Button>
        <IconButton disabled={soloLectura}><EditIcon /></IconButton>
        <IconButton disabled={soloLectura}><DeleteIcon /></IconButton>
        <Switch disabled={soloLectura} />
        <OptionMenu iconButtonProps={{ disabled: soloLectura }} ... />
      </div>
    </Card>
  )
}

export default Header
