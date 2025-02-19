'use client'

import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

const RequestQuotation = () => {
  const handleCreateQuotation = () => {
    window.open('/en/apps/invoice/add', '_blank')
  }

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h6'>Cotización</Typography>
          <Button
            variant='contained'
            color='primary'
            startIcon={<i className='ri-add-line' />}
            onClick={handleCreateQuotation}
          >
            Crear Cotización
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Mensaje cuando no hay cotización */}
        <Box sx={{
          py: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'action.hover',
          borderRadius: 1
        }}>
          <Typography color='text.secondary'>
            No hay cotización asociada a esta solicitud
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default RequestQuotation
