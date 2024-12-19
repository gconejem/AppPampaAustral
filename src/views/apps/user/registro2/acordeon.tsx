'use client'

import { useState } from 'react'

import { Box, Chip, Typography, Table, TableHead, TableRow, TableCell, TableBody, Checkbox } from '@mui/material'

const Acordeon = () => {
  const [estado, setEstado] = useState('Codificado') // Estado inicial

  const handleEstadoChange = () => {
    setEstado(prevEstado => (prevEstado === 'Codificado' ? 'Ensayado' : 'Codificado'))
  }

  const getChipStyles = (estado: string) => {
    if (estado === 'Codificado') {
      return {
        backgroundColor: '#daf3ff', // Celeste
        color: '#16b1ff' // Texto azul
      }
    } else if (estado === 'Ensayado') {
      return {
        backgroundColor: '#dfffe1', // Verde claro
        color: '#4caf50' // Texto verde
      }
    }
  }

  return (
    <Box sx={{ mt: 3, boxShadow: 2, borderRadius: 2, backgroundColor: 'white', p: 4 }}>
      {/* Encabezado estático */}
      <Box display='flex' alignItems='center' gap={2} sx={{ mb: 4 }}>
        <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
          Muestra #2
        </Typography>
        <Chip
          label='180280-2'
          sx={{
            backgroundColor: '#e0e0e0',
            color: '#424242',
            fontWeight: 'bold',
            height: '24px'
          }}
        />
        <Chip
          label='N° Tarjeta: 1234'
          sx={{
            backgroundColor: '#e0e0e0',
            color: '#424242',
            fontWeight: 'bold',
            height: '24px'
          }}
        />
      </Box>

      {/* Contenido estático */}
      <Box sx={{ mt: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f9f9f9' }}>
            <TableRow>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>CÓD. INT.</TableCell>
              <TableCell>ENSAYO / ANÁLISIS</TableCell>
              <TableCell>CANTIDAD</TableCell>
              <TableCell>ID MUESTRA</TableCell>

              <TableCell>DÍAS</TableCell>
              <TableCell>FECHA ENSAYO</TableCell>
              <TableCell>ESTADO OP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>H003</TableCell>
              <TableCell>Compresión</TableCell>

              <TableCell>1</TableCell>
              <TableCell>1234-1</TableCell>
              <TableCell>7</TableCell>
              <TableCell>00/00/0000</TableCell>
              <TableCell>
                <Chip
                  label={estado}
                  sx={{
                    ...getChipStyles(estado),
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={handleEstadoChange}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}

export default Acordeon
