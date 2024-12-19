'use client'

import React, { useState } from 'react'

import MoreVertIcon from '@mui/icons-material/MoreVert'

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
  TextField,
  Menu,
  MenuItem
} from '@mui/material'

import ResultadosPopup from './ResultadosPopup'

const UserListTable: React.FC = () => {
  const [resultadosOpen, setResultadosOpen] = useState(false)
  const [selectedEnsayador, setSelectedEnsayador] = useState('')

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedMuestra, setSelectedMuestra] = useState<number | null>(null)

  const [muestras, setMuestras] = useState([
    { id: 1, estado: 'Codificado', ensayos: ['Codificado', 'Codificado', 'Codificado'] },
    { id: 2, estado: 'Codificado', ensayos: ['Codificado', 'Codificado', 'Codificado'] }
  ])

  const [isMuestraPopup, setIsMuestraPopup] = useState(false)
  const [selectedRowsMuestra, setSelectedRowsMuestra] = useState<number[]>([])
  const [selectedRowsEnsayos, setSelectedRowsEnsayos] = useState<number[]>([])
  const [selectedState, setSelectedState] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, index: number) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedMuestra(index)
  }

  const handleChangeEnsayoEstado = (index: number) => {
    const updatedMuestras = [...muestras]

    if (selectedMuestra !== null) {
      const muestra = updatedMuestras[selectedMuestra]

      // Alternar estado entre "Ensayado" y "Codificado"
      muestra.ensayos[index] = muestra.ensayos[index] === 'Ensayado' ? 'Codificado' : 'Ensayado'

      // Si todos los ensayos son "Ensayado", actualiza el estado de la muestra
      if (muestra.ensayos.every(e => e === 'Ensayado')) {
        muestra.estado = 'Ensayado'
      } else {
        muestra.estado = 'Codificado'
      }

      setMuestras(updatedMuestras)
    }
  }

  // Función para cerrar el menú

  const handleMenuClose = () => {
    setAnchorEl(null)

    // No reiniciar selectedMuestra a null aquí, mantén su valor actual
  }

  // Función para cambiar el estado de una muestra
  const handleChangeEstado = (newState: string) => {
    const updatedMuestras = [...muestras]

    if (selectedMuestra !== null) {
      const muestra = updatedMuestras[selectedMuestra]

      muestra.estado = newState
      muestra.ensayos = muestra.ensayos.map(() => newState) // Actualiza los ensayos

      setMuestras(updatedMuestras)
    }

    // Mantén el valor de selectedMuestra intacto después de cerrar el menú
    handleMenuClose()
  }

  // Función para abrir el popup de resultados
  const handleOpenResultadosPopup = (ensayador: string) => {
    setSelectedEnsayador(ensayador)
    setResultadosOpen(true)
  }

  // Función para guardar los resultados
  const handleSaveResultados = (resultados: { resultado1: string; resultado2: string }) => {
    console.log('Resultados guardados:', resultados)
  }

  // Función para abrir el diálogo de edición
  const handleOpenDialog = (index: number, isEnsayo: boolean) => {
    setEditingRowIndex(index)
    setIsMuestraPopup(!isEnsayo)
    setOpenDialog(true)
  }

  // Función para cerrar el diálogo
  const handleCloseDialog = () => {
    setSelectedState('')
    setOpenDialog(false)
  }

  // Función para manejar el cambio de estado en el popup
  const handleStateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedState(event.target.value)
  }

  // Función para aceptar cambios en el popup
  const handleAccept = () => {
    const updatedMuestras = [...muestras]

    if (isMuestraPopup && editingRowIndex !== null) {
      const muestra = updatedMuestras[editingRowIndex]

      if (muestra) {
        muestra.estado = selectedState
        muestra.ensayos = muestra.ensayos.map(() => selectedState)
      }
    } else if (!isMuestraPopup && editingRowIndex !== null && selectedMuestra !== null) {
      const muestra = updatedMuestras.find(m => m.id === selectedMuestra)

      if (muestra) {
        muestra.ensayos[editingRowIndex] = selectedState
        muestra.estado = muestra.ensayos.every(e => e === 'Ensayado') ? 'Ensayado' : 'Codificado'
      }
    }

    setMuestras(updatedMuestras)
    handleCloseDialog()
  }

  // Función para seleccionar/deseleccionar una fila
  const handleSelectRow = (index: number, isEnsayo: boolean) => {
    if (isEnsayo) {
      setSelectedRowsEnsayos(prev => (prev.includes(index) ? prev.filter(row => row !== index) : [...prev, index]))
    } else {
      setSelectedRowsMuestra(prev => {
        const newSelection = prev.includes(index) ? prev.filter(row => row !== index) : [index] // Solo selecciona una fila a la vez para sincronización

        // Actualiza la muestra seleccionada (muestra específica)
        setSelectedMuestra(newSelection.length > 0 ? index : null)

        return newSelection
      })
    }
  }

  const muestraSeleccionada = muestras[selectedMuestra ?? -1]

  // Función para seleccionar/deseleccionar todas las filas
  const handleSelectAllRows = (isEnsayo: boolean) => {
    if (isEnsayo) {
      if (selectedMuestra !== null) {
        const muestra = muestras[selectedMuestra]

        if (muestra) {
          setSelectedRowsEnsayos(prev =>
            prev.length === muestra.ensayos.length ? [] : muestra.ensayos.map((_, i) => i)
          )
        }
      }
    } else {
      setSelectedRowsMuestra(prev => (prev.length === muestras.length ? [] : muestras.map((_, i) => i)))
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
            <Chip
              label={`Muestra: ${muestraSeleccionada?.estado || 'N/A'}`}
              sx={{
                backgroundColor: muestraSeleccionada?.estado === 'Ensayado' ? '#dfffe1' : '#e3f2fd',
                color: muestraSeleccionada?.estado === 'Ensayado' ? '#4caf50' : '#1976d2',
                fontWeight: 'bold'
              }}
            />
            <Chip
              label={`Ensayos: ${
                muestraSeleccionada?.ensayos.filter(e => e === 'Ensayado').length || 0
              }/${muestraSeleccionada?.ensayos.length || 0}`}
              sx={{
                backgroundColor: '#fff9c4',
                color: '#f9a825',
                fontWeight: 'bold'
              }}
            />
          </Box>
        </Box>

        {/* Bloque de Información Adicional */}
        <Box
          display='grid'
          gridTemplateColumns='repeat(2, 1fr)'
          gap={2}
          sx={{
            backgroundColor: '#f9f9f9',
            p: 2,
            borderRadius: '8px',
            mb: 4
          }}
        >
          <Typography variant='body2'>
            <strong>Tipo Material:</strong> Tipo Material
          </Typography>
          <Typography variant='body2'>
            <strong>Elemento:</strong> Elemento
          </Typography>
          <Typography variant='body2'>
            <strong>Item:</strong> Item
          </Typography>
          <Typography variant='body2'>
            <strong>Grado:</strong> Grado
          </Typography>
          <Typography variant='body2'>
            <strong>Procedencia:</strong> Procedencia
          </Typography>
          <Typography variant='body2'>
            <strong>Cotas:</strong> Cotas/Cotas
          </Typography>
          <Typography variant='body2'>
            <strong>Ubicación/Sector:</strong> Ubicación/Sector
          </Typography>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            {/* Encabezado de la tabla */}
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

            {/* Cuerpo de la tabla */}
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
                    <Box>
                      <Chip
                        label={muestra.estado}
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleMenuOpen(e, index)
                        }}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: muestra.estado === 'Ensayado' ? '#dfffe1' : '#daf3ff',
                          color: muestra.estado === 'Ensayado' ? '#4caf50' : '#16b1ff',
                          fontWeight: 'bold'
                        }}
                      />
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl && selectedMuestra === index)}
                        onClose={handleMenuClose}
                        MenuListProps={{
                          onClick: e => e.stopPropagation() // Bloquea la propagación del menú
                        }}
                      >
                        <MenuItem onClick={() => handleChangeEstado('Codificado')}>Codificado</MenuItem>
                        <MenuItem onClick={() => handleChangeEstado('Ensayado')}>Ensayado</MenuItem>
                      </Menu>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <IconButton
                        onClick={e => {
                          e.stopPropagation() // Evita que se propague y active selección
                          handleMenuOpen(e, index) // Abre el menú desplegable
                        }}
                      >
                        <i className='ri-checkbox-line' />
                      </IconButton>

                      {/* Menú desplegable de opciones */}
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl && selectedMuestra === index)}
                        onClose={handleMenuClose}
                        MenuListProps={{
                          onClick: e => e.stopPropagation() // Evita propagación
                        }}
                      >
                        <MenuItem
                          onClick={() => handleChangeEstado('Ensayado')}
                          disabled={muestra.estado === 'Ensayado'} // Evita cambios redundantes
                        >
                          Ensayado
                        </MenuItem>
                        <MenuItem
                          onClick={() => handleChangeEstado('Codificado')}
                          disabled={muestra.estado === 'Codificado'}
                        >
                          Codificado
                        </MenuItem>
                      </Menu>
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
                      selectedRowsEnsayos.length < (muestras[selectedMuestra]?.ensayos.length || 0)
                    }
                    checked={
                      selectedMuestra !== null &&
                      selectedRowsEnsayos.length === (muestras[selectedMuestra]?.ensayos.length || 0)
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
                muestras[selectedMuestra]?.ensayos.map((state, index) => (
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
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleChangeEnsayoEstado(index)} // Llamada a la nueva función
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <IconButton onClick={() => handleChangeEnsayoEstado(index)}>
                          <i className='ri-checkbox-line' />
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
