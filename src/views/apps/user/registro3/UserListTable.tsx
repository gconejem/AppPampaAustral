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
  // Estado general de las muestras
  const [muestras, setMuestras] = useState([
    { id: 1, estado: 'Codificado', ensayos: ['Codificado', 'Codificado', 'Codificado'] },
    { id: 2, estado: 'Codificado', ensayos: ['Codificado', 'Codificado', 'Codificado'] }
  ])

  // Muestra seleccionada
  const [selectedMuestra, setSelectedMuestra] = useState<number | null>(null)

  // Estado de las filas seleccionadas en la tabla de muestras
  const [selectedRowsMuestra, setSelectedRowsMuestra] = useState<number[]>([])

  // Estado de las filas seleccionadas en la tabla de ensayos
  const [selectedRowsEnsayos, setSelectedRowsEnsayos] = useState<number[]>([])

  // Estado seleccionado en el popup
  const [selectedState, setSelectedState] = useState('')

  // Estado para abrir/cerrar el diálogo
  const [openDialog, setOpenDialog] = useState(false)

  // Índice del ensayo en edición
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null)

  // Abrir el diálogo para un ensayo específico
  const handleOpenDialog = (index: number) => {
    setEditingRowIndex(index)
    setOpenDialog(true)
  }

  // Cerrar el diálogo
  const handleCloseDialog = () => {
    setSelectedState('')
    setOpenDialog(false)
  }

  // Manejar cambio de estado en el popup
  const handleStateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedState(event.target.value)
  }

  // Guardar el estado seleccionado en el popup
  const handleAccept = () => {
    if (editingRowIndex !== null && selectedMuestra !== null) {
      const updatedMuestras = [...muestras]
      const muestra = updatedMuestras.find(m => m.id === selectedMuestra)

      if (muestra) {
        muestra.ensayos[editingRowIndex] = selectedState

        // Verificar si todos los ensayos están en "Ensayado"
        if (muestra.ensayos.every(state => state === 'Ensayado')) {
          muestra.estado = 'Ensayado'
        } else {
          muestra.estado = 'Codificado'
        }

        setMuestras(updatedMuestras)
      }
    }

    handleCloseDialog()
  }

  // Seleccionar/deseleccionar una fila en la tabla
  const handleSelectRow = (index: number, isEnsayo: boolean) => {
    if (isEnsayo) {
      setSelectedRowsEnsayos(prev => (prev.includes(index) ? prev.filter(row => row !== index) : [...prev, index]))
    } else {
      setSelectedRowsMuestra(prev => (prev.includes(index) ? prev.filter(row => row !== index) : [...prev, index]))
      setSelectedMuestra(index + 1) // Actualizar la muestra seleccionada (asume IDs consecutivos)
    }
  }

  // Seleccionar/deseleccionar todas las filas en la tabla
  const handleSelectAllRows = (isEnsayo: boolean) => {
    if (isEnsayo && selectedMuestra !== null) {
      const muestra = muestras.find(m => m.id === selectedMuestra)

      if (muestra) {
        setSelectedRowsEnsayos(
          selectedRowsEnsayos.length === muestra.ensayos.length ? [] : muestra.ensayos.map((_, index) => index)
        )
      }
    } else {
      setSelectedRowsMuestra(selectedRowsMuestra.length === muestras.length ? [] : muestras.map(m => m.id - 1))
    }
  }

  return (
    <Box sx={{ p: 4, backgroundColor: 'white', boxShadow: 2, borderRadius: 2 }}>
      {/* Tabla de muestras */}
      <Box sx={{ mb: 4 }}>
        <Box display='flex' alignItems='center' justifyContent='space-between' sx={{ mb: 4 }}>
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
          <Box display='flex' alignItems='center' gap={2}>
            {selectedMuestra !== null ? (
              <>
                <Chip
                  label={`Muestra: ${muestras.find(m => m.id === selectedMuestra)?.estado || 'N/A'}`}
                  sx={{
                    backgroundColor:
                      muestras.find(m => m.id === selectedMuestra)?.estado === 'Ensayado' ? '#dfffe1' : '#e3f2fd',
                    color: muestras.find(m => m.id === selectedMuestra)?.estado === 'Ensayado' ? '#4caf50' : '#1976d2',
                    fontWeight: 'bold'
                  }}
                />
                <Chip
                  label={`Ensayos: ${
                    muestras.find(m => m.id === selectedMuestra)?.ensayos.filter(e => e === 'Ensayado').length
                  }/${muestras.find(m => m.id === selectedMuestra)?.ensayos.length || 0}`}
                  sx={{
                    backgroundColor: '#fff9c4',
                    color: '#f9a825',
                    fontWeight: 'bold'
                  }}
                />
              </>
            ) : (
              <Typography variant='body1' color='text.secondary'></Typography>
            )}
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>
                  <Checkbox
                    indeterminate={
                      selectedMuestra !== null &&
                      selectedRowsEnsayos.length > 0 &&
                      selectedRowsEnsayos.length < (muestras.find(m => m.id === selectedMuestra)?.ensayos.length || 0)
                    }
                    checked={
                      selectedMuestra !== null &&
                      selectedRowsEnsayos.length === (muestras.find(m => m.id === selectedMuestra)?.ensayos.length || 0)
                    }
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
              {muestras.map((muestra, index) => (
                <TableRow key={muestra.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRowsMuestra.includes(index)}
                      onChange={() => handleSelectRow(index, false)}
                    />
                  </TableCell>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{muestra.id}</TableCell>
                  <TableCell>01/01/2024</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>23</TableCell>
                  <TableCell>01/01/2025</TableCell>
                  <TableCell>
                    <Chip
                      label={muestra.estado}
                      sx={{
                        backgroundColor: muestra.estado === 'Ensayado' ? '#dfffe1' : '#daf3ff',
                        color: muestra.estado === 'Ensayado' ? '#4caf50' : '#16b1ff',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display='flex' justifyContent='center' gap={1}>
                      <IconButton color='secondary'>
                        <i className='ri-checkbox-line' />
                      </IconButton>
                      <IconButton color='secondary'>
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
            width: '400px',
            maxWidth: '100%'
          }
        }}
      >
        <DialogTitle>Editar Estado</DialogTitle>
        <DialogContent>
          <TextField
            select
            label='Estado'
            fullWidth
            SelectProps={{
              native: true
            }}
            value={selectedState}
            onChange={handleStateChange}
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
          <Button onClick={handleAccept} variant='contained' color='primary'>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
      {/* Tabla de ensayos */}

      <Box sx={{ mb: 4 }}>
        <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 4 }}>
          Ensayos
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>
                  <Checkbox
                    indeterminate={
                      selectedMuestra !== null &&
                      selectedRowsEnsayos.length > 0 &&
                      selectedRowsEnsayos.length < (muestras.find(m => m.id === selectedMuestra)?.ensayos.length || 0)
                    }
                    checked={
                      selectedMuestra !== null &&
                      selectedRowsEnsayos.length === (muestras.find(m => m.id === selectedMuestra)?.ensayos.length || 0)
                    }
                    onChange={() => handleSelectAllRows(true)}
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
              {selectedMuestra !== null &&
                muestras
                  .find(m => m.id === selectedMuestra)
                  ?.ensayos.map((state, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRowsEnsayos.includes(index)}
                          onChange={() => handleSelectRow(index, true)}
                        />
                      </TableCell>
                      <TableCell>HOR{index + 1}</TableCell>
                      <TableCell>Ensayo {index + 1}</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>
                        <Chip
                          label={state}
                          sx={{
                            backgroundColor: state === 'Ensayado' ? '#dfffe1' : '#daf3ff',
                            color: state === 'Ensayado' ? '#4caf50' : '#16b1ff',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display='flex' justifyContent='center' gap={1}>
                          <IconButton color='secondary' onClick={() => handleOpenDialog(index)}>
                            <i className='ri-checkbox-line' />
                          </IconButton>
                          <IconButton color='secondary'>
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
    </Box>
  )
}

export default UserListTable
