'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

const RequestVisits = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h6'>Visitas</Typography>
          <Button
            variant='contained'
            color='primary'
            startIcon={<i className='ri-add-line' />}
          >
            Crear Visita
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Lista de visitas */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography>Visita 21 Julio 2024</Typography>
            <Chip label="Completada" size="small" color="success" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography>Visita 22 Julio 2024</Typography>
            <Chip label="Suspendida" size="small" color="error" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default RequestVisits
