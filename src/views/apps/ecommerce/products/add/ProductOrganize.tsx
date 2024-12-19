'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'

// Component Imports
import CustomIconButton from '@core/components/mui/IconButton'

const ProductOrganize = () => {
  // States
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState('')
  const [collection, setCollection] = useState('')
  const [status, setStatus] = useState('')

  return (
    <Card>
      <CardHeader title='Filtros' />
      <CardContent>
        <form onSubmit={e => e.preventDefault()} className='flex flex-col gap-5'>
          <FormControl fullWidth>
            <InputLabel>Seleccionar Familia</InputLabel>
            <Select label='Select Vendor' value={vendor} onChange={e => setVendor(e.target.value)}>
              <MenuItem value={`Men's Clothing`}>Men&apos;s Clothing</MenuItem>
              <MenuItem value={`Women's Clothing`}>Women&apos;s Clothing</MenuItem>
              <MenuItem value={`Kid's Clothing`}>Kid&apos;s Clothing</MenuItem>
            </Select>
          </FormControl>
          <div className='flex items-center gap-4'>
            <FormControl fullWidth>
              <InputLabel>Seleccionar Sub-Familia</InputLabel>
              <Select label='Select Category' value={category} onChange={e => setCategory(e.target.value)}>
                <MenuItem value='Household'>Household</MenuItem>
                <MenuItem value='Office'>Office</MenuItem>
                <MenuItem value='Electronics'>Electronics</MenuItem>
                <MenuItem value='Management'>Management</MenuItem>
                <MenuItem value='Automotive'>Automotive</MenuItem>
              </Select>
            </FormControl>
            <CustomIconButton size='large' variant='outlined' color='primary' className='min-is-fit'>
              <i className='ri-add-line' />
            </CustomIconButton>
          </div>
          <FormControl fullWidth>
            <InputLabel>Seleccionar Área</InputLabel>
            <Select label='Select Collection' value={collection} onChange={e => setCollection(e.target.value)}>
              <MenuItem value={`Men's Clothing`}>Men&apos;s Clothing</MenuItem>
              <MenuItem value={`Women's Clothing`}>Women&apos;s Clothing</MenuItem>
              <MenuItem value={`Kid's Clothing`}>Kid&apos;s Clothing</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Seleccionar Tipo</InputLabel>
            <Select label='Seleccionar Tipo' value={status} onChange={e => setStatus(e.target.value)}>
              <MenuItem value='Published'>Published</MenuItem>
              <MenuItem value='Inactive'>Inactive</MenuItem>
              <MenuItem value='Scheduled'>Scheduled</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth label='Más Campos...' placeholder='Fashion, Trending, Summer' />
        </form>
      </CardContent>
    </Card>
  )
}

export default ProductOrganize
