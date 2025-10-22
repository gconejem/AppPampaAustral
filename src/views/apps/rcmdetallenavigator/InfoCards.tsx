import React from 'react'

import { Box, Typography, Card, CardContent } from '@mui/material'

const InfoCards = () => {
  const cards = [
    { title: 'Por Ensayar', value: 347, color: '#9e9e9e', flex: 2 }, // Gris
    { title: 'Por Digitar', value: 125, color: '#2196f3', flex: 1 }, // Azul
    { title: 'Por Enviar Digitación', value: 136, color: '#00bcd4', flex: 1 }, // Celeste
    { title: 'Por Revisar', value: 77, color: '#9c27b0', flex: 2 }, // Morado
    { title: 'Por Corregir', value: 0, color: '#f44336', flex: 2 }, // Rojo
    { title: 'Por Firmar', value: 200, color: '#ff9800', flex: 2 }, // Amarillo
    { title: 'Por Enviar (Firmados)', value: 629, color: '#4caf50', flex: 1 }, // Verde
    { title: 'Firmados Pagados', value: '18/2,9%', color: '#388e3c', flex: 1 } // Verde
  ]

  return (
    <Box display='flex' justifyContent='space-between' gap={2} mb={4}>
      {cards.map((card, index) => (
        <Card
          key={index}
          sx={{
            flex: card.flex,
            backgroundColor: '#ffffff', // Fondo blanco
            borderRadius: 2,
            boxShadow: '0px 3px 5px rgba(0,0,0,0.1)', // Sombra suave
            borderBottom: `2px solid ${card.color}`, // Línea de color en la parte inferior
            textAlign: 'center'
          }}
        >
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
    </Box>
  )
}

export default InfoCards
