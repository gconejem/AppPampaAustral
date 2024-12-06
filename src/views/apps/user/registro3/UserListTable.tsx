'use client'

import React, { useState } from 'react'

import ScienceIcon from '@mui/icons-material/Science'
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField
} from '@mui/material'

const UserListTable: React.FC = () => {
  const [selectedRowsMuestra1, setSelectedRowsMuestra1] = useState<number[]>([])
  const [selectedRowsMuestra2, setSelectedRowsMuestra2] = useState<number[]>([])
  const [openDialog, setOpenDialog] = useState(false) // Estado para manejar el diálogo

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleSelectAllMuestra1 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRowsMuestra1([0])
    } else {
      setSelectedRowsMuestra1([])
    }
  }

  const handleSelectRowMuestra1 = (index: number) => {
    setSelectedRowsMuestra1(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]))
  }

  const handleSelectAllMuestra2 = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRowsMuestra2([0, 1])
    } else {
      setSelectedRowsMuestra2([])
    }
  }

  const handleSelectRowMuestra2 = (index: number) => {
    setSelectedRowsMuestra2(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]))
  }

  return (
    <Box sx={{ p: 4, backgroundColor: 'white', boxShadow: 2, borderRadius: 2 }}>
      {/* Tabla de muestras */}
      <Box sx={{ mb: 4 }}>
        {/* Título y tarjetas de estado */}
        <Box display='flex' alignItems='center' justifyContent='space-between' sx={{ mb: 4 }}>
          {/* Contenedor del título y N° Tarjeta */}
          <Box display='flex' alignItems='center' gap={2}>
            <Typography variant='h5' sx={{ fontWeight: 'bold' }}>
              Muestra 180280-1
            </Typography>
            <Chip
              label='N° Tarjeta: 1234'
              sx={{
                backgroundColor: '#e0e0e0',
                color: '#424242',
                fontWeight: 'bold'
              }}
            />
          </Box>
          {/* Contenedor de los otros chips */}
          <Box display='flex' alignItems='center' gap={2}>
            <Chip
              label='Muestra: En Proceso'
              sx={{
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                fontWeight: 'bold'
              }}
            />
            <Chip
              label='Ensayos: 1/4'
              sx={{
                backgroundColor: '#fff9c4',
                color: '#f9a825',
                fontWeight: 'bold'
              }}
            />
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ width: '50px' }}>
                  <Checkbox
                    indeterminate={selectedRowsMuestra2.length > 0 && selectedRowsMuestra2.length < 2}
                    checked={selectedRowsMuestra2.length === 2}
                    onChange={handleSelectAllMuestra2}
                  />
                </TableCell>
                <TableCell>#</TableCell>
                <TableCell>MUESTRA</TableCell>
                <TableCell>CONFECCIÓN</TableCell>
                <TableCell>CANTIDAD</TableCell>
                <TableCell>DÍAS</TableCell>
                <TableCell>VENCIMIENTO</TableCell>
                <TableCell>ESTADO</TableCell>
                <TableCell sx={{ width: '150px', textAlign: 'center' }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2].map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRowsMuestra2.includes(index)}
                      onChange={() => handleSelectRowMuestra2(index)}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>2182-{index + 6}</TableCell>
                  <TableCell>01/01/2024</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>23</TableCell>
                  <TableCell>01/01/2025</TableCell>
                  <TableCell>
                    <Chip
                      label='Codificado'
                      sx={{
                        backgroundColor: '#daf3ff',
                        color: '#16b1ff'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display='flex' justifyContent='center' gap={1}>
                      <IconButton color='secondary' onClick={handleOpenDialog}>
                        <i className='ri-checkbox-line' />
                      </IconButton>
                      <IconButton color='secondary' onClick={() => console.log('Probeta')}>
                        <ScienceIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Tabla de ensayos */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 4 }}>
          Ensayos
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ width: '50px' }}>
                  <Checkbox
                    indeterminate={selectedRowsMuestra1.length > 0 && selectedRowsMuestra1.length < 1}
                    checked={selectedRowsMuestra1.length === 1}
                    onChange={handleSelectAllMuestra1}
                  />
                </TableCell>
                <TableCell>CÓD. INT.</TableCell>
                <TableCell>ENSAYO / ANÁLISIS</TableCell>
                <TableCell>CANTIDAD</TableCell>
                <TableCell>ESTADO</TableCell>
                <TableCell sx={{ width: '150px', textAlign: 'center' }}>ACCIONES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[0].map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRowsMuestra1.includes(index)}
                      onChange={() => handleSelectRowMuestra1(index)}
                    />
                  </TableCell>
                  <TableCell>HOR01</TableCell>
                  <TableCell>Testigo Hormigón Fresco</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>
                    <Chip
                      label='Codificado'
                      sx={{
                        backgroundColor: '#daf3ff',
                        color: '#16b1ff'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display='flex' justifyContent='center' gap={1}>
                      <IconButton color='secondary' onClick={handleOpenDialog}>
                        <i className='ri-checkbox-line' />
                      </IconButton>
                      <IconButton color='secondary' onClick={() => console.log('Probeta')}>
                        <ScienceIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mini Pop-Up */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        sx={{
          '& .MuiDialog-paper': {
            width: '400px', // Ancho personalizado
            maxWidth: '100%' // Evita que exceda el ancho de la pantalla
          }
        }}
      >
        <DialogTitle>Editar Estado</DialogTitle>
        <DialogContent>
          <TextField
            select
            label=''
            fullWidth
            SelectProps={{
              native: true
            }}
            defaultValue=''
          >
            <option value=''>Seleccionar</option>
            <option value='Codificado'>Codificado</option>
            <option value='Ensayado'>Ensayado</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color='secondary'>
            Cerrar
          </Button>
          <Button onClick={() => console.log('Estado actualizado')} variant='contained' color='primary'>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UserListTable
