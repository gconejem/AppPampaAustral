import React from 'react'

import { Card, CardContent, Typography, Button } from '@mui/material'

const PreviewHeader: React.FC = () => {
  return (
    <Card elevation={0} style={{ marginBottom: '16px' }}>
      <CardContent style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
        <Typography variant='h6' color='textPrimary'>
          Nueva Cotización
        </Typography>
        <div style={{ display: 'flex', gap: '8px' }}>
          {' '}
          {/* Añadimos un div para organizar los botones */}
          <Button variant='outlined' color='inherit'>
            Previsualizar
          </Button>
          <Button variant='contained' sx={{ backgroundColor: '#717171', color: '#ffffff' }}>
            Enviar Correo
          </Button>
          <Button variant='contained' color='primary'>
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default PreviewHeader
