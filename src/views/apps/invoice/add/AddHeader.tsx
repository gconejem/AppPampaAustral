import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, Typography, Button } from '@mui/material'

const AddHeader: React.FC = () => {
  const router = useRouter()
  return (
    <Card elevation={0} style={{ marginBottom: '16px' }}>
      <CardContent style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
        <Typography variant='h6' color='textPrimary'>
          Nueva Cotización
        </Typography>
        <Button variant='outlined' sx={{ color: '#454343', borderColor: '#474b4f' }} onClick={() => router.back()}>
          Cerrar
        </Button>
      </CardContent>
    </Card>
  )
}

export default AddHeader
