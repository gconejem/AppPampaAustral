'use client'

import { useState } from 'react'

import { Box, Typography, Button, TextField, Grid } from '@mui/material'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'

const Header = () => {
  const [listName, setListName] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('(AB) Todos los Productos')

  const handleListNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListName(event.target.value)
  }

  const handleProductChange = (event: any) => {
    setSelectedProduct(event.target.value)
  }

  return (
    <Box
      sx={{
        padding: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}
    >
      <Typography variant='h5' sx={{ color: '', marginBottom: '16px' }}>
        Precios Por Lista
      </Typography>

      <Grid container spacing={3} alignItems='center'>
        {/* Campo de Nombre de la Lista */}
        <Grid item xs={12} sm={3}>
          <TextField
            label='Nombre de la Lista'
            variant='outlined'
            fullWidth
            value={listName}
            onChange={handleListNameChange}
          />
        </Grid>

        <Grid item xs={12} sm={4} container alignItems='center' spacing={2}>
          <Grid item></Grid>
        </Grid>

        <Grid item xs={12} sm={5} container justifyContent='flex-end'>
          <Button variant='contained'>Guardar Cambios</Button>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Header
