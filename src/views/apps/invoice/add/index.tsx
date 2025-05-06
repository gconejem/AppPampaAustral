'use client'

import { useState } from 'react'

import Grid from '@mui/material/Grid'

import AddCard from './AddCard'
import AddActions from './AddActions'

const InvoiceAdd = () => {
  const [formData, setFormData] = useState<any>(null)

  const handleFormDataChange = (newData: any) => {
    setFormData(newData)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={9}>
        <AddCard onFormDataChange={handleFormDataChange} />
      </Grid>
      <Grid item xs={12} md={3}>
        <AddActions currentFormData={formData} />
      </Grid>
    </Grid>
  )
}

export default InvoiceAdd
