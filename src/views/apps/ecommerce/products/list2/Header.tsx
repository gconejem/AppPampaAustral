'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

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

  return <Card className='flex justify-between items-center p-6 mb-4'></Card>
}

export default Header
