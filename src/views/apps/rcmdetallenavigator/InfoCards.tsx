import React from 'react'

import { Box, Typography, Card, CardContent } from '@mui/material'

return (
  <Box display='flex' justifyContent='space-between' gap={2} mb={4}>
    {
      <CardContent>
        <Typography
          variant='subtitle2'
          sx={{ color: '#424242', fontWeight: 'bold' }} // Texto gris oscuro
        >
          {card.title}
        </Typography>
        <Typography variant='h5' sx={{ fontWeight: 'bold', color: '#000' }}>
          {' '}
          {/* Texto negro */}
          {card.value}
        </Typography>
      </CardContent>
        </Card>
))}
    </Box >
  )
}

export default InfoCards
