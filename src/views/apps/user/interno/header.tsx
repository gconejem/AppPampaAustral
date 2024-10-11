'use client'

import React, { useState } from 'react'

import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination
} from '@mui/material'

const Header = () => {
  const [showBox, setShowBox] = useState(false)
  const [tabValue, setTabValue] = useState(0)

  // Datos de ejemplo para la tabla
  const [rows, setRows] = useState([
    { codigoInterno: '100', servicio: 'Toma de Muestra', cantidad: 1, observacion: 'Texto', estado: 'Ensayado' },
    { codigoInterno: '101', servicio: 'Docilidad Cono Abrams', cantidad: 1, observacion: 'Texto', estado: 'Ensayado' },
    { codigoInterno: '102', servicio: 'Piscina de Curado', cantidad: 1, observacion: 'Texto', estado: 'Ensayado' }
  ])

  const handleButtonClick = () => {
    setShowBox(!showBox)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ marginBottom: 4 }}>
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={6}>
              <Typography variant='h5' gutterBottom sx={{ marginBottom: '15px' }}>
                Codificación Registro Control de Muestras
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} display='flex' justifyContent='flex-end'>
              <Button variant='contained' color='primary' onClick={handleButtonClick} sx={{ marginBottom: '20px' }}>
                + Nuevo Registro
              </Button>
            </Grid>
          </Grid>

          {/* Primera fila con 2-3-3-2-2 para los campos */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='Orden de Trabajo' size='small' sx={{ marginBottom: '15px' }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='Cliente' size='small' />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='N° Obra' size='small' />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='Nombre Cliente' size='small' />
            </Grid>

            {/* Segunda fila con 2-3-3-2 */}
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label='Muestreado por...' size='small' />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='Fecha de Muestreo' size='small' select />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth label='Fecha de Ingreso' size='small' />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label='Comuna' size='small' />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label='Mandante' size='small' />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Mostrar la nueva caja cuando se presiona el botón */}
      {showBox && (
        <Box sx={{ marginTop: 4 }}>
          <Card>
            <CardContent>
              <Typography variant='h5' gutterBottom sx={{ marginBottom: '25px' }}>
                Codificación Registro Control de Muestras
              </Typography>
              {/* Tabs */}
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label='tabs example'
                variant='fullWidth' // Para que los tabs ocupen todo el ancho
              >
                <Tab label='Área' sx={{ flex: 1 }} />
                <Tab label='Muestras' sx={{ flex: 1 }} />
              </Tabs>
              {/* Contenido de los tabs */}
              <Box sx={{ padding: 2 }}>
                {tabValue === 0 && (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Área'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='RCM'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Estado'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                          select
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Código Interno'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                          label='Servicio / Ensayo'
                          InputProps={{
                            startAdornment: <i className='ri-search-line'></i>
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={2}>
                        <TextField fullWidth label='Cantidad' size='small' />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth label='Observación' size='small' />
                      </Grid>
                      <Grid item xs={12} sm={6} display='flex' justifyContent='flex-end'>
                        <Button variant='contained' color='primary'>
                          + Agregar
                        </Button>
                      </Grid>
                    </Grid>

                    {/* Agregar la tabla solo en el tab "Área" */}
                    <Box sx={{ marginTop: 4 }}>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Cód Int</TableCell>
                              <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Servicio / Ensayo</TableCell>
                              <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Cantidad</TableCell>
                              <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Observación</TableCell>
                              <TableCell sx={{ backgroundColor: '#f5f5f5' }}>Estado</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {rows.map((row, index) => (
                              <TableRow key={index}>
                                <TableCell>{row.codigoInterno}</TableCell>
                                <TableCell>{row.servicio}</TableCell>
                                <TableCell>{row.cantidad}</TableCell>
                                <TableCell>{row.observacion}</TableCell>
                                <TableCell>
                                  <Chip label={row.estado} color='success' />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <TablePagination
                        component='div'
                        count={rows.length}
                        page={0}
                        rowsPerPage={5}
                        onPageChange={() => {}}
                        onRowsPerPageChange={() => {}}
                      />
                    </Box>
                  </>
                )}

                {tabValue === 1 && <Typography>Contenido del Tab "Muestras"</Typography>}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  )
}

export default Header
