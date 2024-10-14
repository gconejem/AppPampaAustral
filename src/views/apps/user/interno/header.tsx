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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
  FormControlLabel,
  Checkbox
} from '@mui/material'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const Header = () => {
  const [showBox, setShowBox] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [muestras, setMuestras] = useState<number[]>([]) // Estado para almacenar muestras dinámicas

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

  const handleAgregarMuestra = () => {
    // Cada vez que se haga clic, agrega un nuevo número de muestra
    setMuestras([...muestras, muestras.length + 1])
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

      {showBox && (
        <Box sx={{ marginTop: 4 }}>
          <Card>
            <CardContent>
              <Typography variant='h5' gutterBottom sx={{ marginBottom: '25px' }}>
                Codificación Registro Control de Muestras
              </Typography>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label='tabs example' variant='fullWidth'>
                <Tab label='Área' sx={{ flex: 1 }} />
                <Tab label='Muestras' sx={{ flex: 1 }} />
              </Tabs>

              <Box sx={{ padding: 2 }}>
                {/* Contenido del Tab "Área" */}
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

                {/* Contenido del Tab "Muestras" */}
                {tabValue === 1 && (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Tarjeta (176712)'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Procedencia'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Ubicación / Sector'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Tipo de Muestra'
                          size='small'
                          select
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Ítem'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Cantidad de Muestras'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2} alignItems='center'>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Específicos Área'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          label='Grado'
                          size='small'
                          sx={{ marginBottom: '10px', marginTop: '10px' }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={8} display='flex' justifyContent='flex-end'>
                        <Button variant='contained' color='primary' onClick={handleAgregarMuestra}>
                          + Añadir Muestra
                        </Button>
                      </Grid>
                    </Grid>

                    {/* Acordeones */}
                    {muestras.map((muestra, index) => (
                      <Accordion key={index} sx={{ marginTop: 2 }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls={`panel${index}-content`}
                          id={`panel${index}-header`}
                        >
                          <Typography>Muestra #{muestra}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant='h6'>Ensayos</Typography>

                          <Grid container spacing={2} sx={{ marginTop: 2 }}>
                            <Grid item xs={12} sm={4}>
                              <TextField fullWidth label='Código Int.' size='small' />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField fullWidth label='Servicio / Ensayo' size='small' />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField fullWidth label='Estado' size='small' select>
                                {/* Opciones de Estado */}
                              </TextField>
                            </Grid>
                          </Grid>

                          <Grid container spacing={2} sx={{ marginTop: 2 }}>
                            <Grid item xs={12} sm={4}>
                              <TextField fullWidth label='Observación' size='small' />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <FormControlLabel control={<Checkbox />} label='Vencimiento' />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField fullWidth label='Fecha Confección' size='small' select>
                                {/* Opciones de Fecha */}
                              </TextField>
                            </Grid>
                            <Grid item xs={12} sm={3} display='flex' justifyContent='flex-end'>
                              <Button variant='contained' color='primary'>
                                + Añadir Ensayo
                              </Button>
                            </Grid>
                          </Grid>

                          {/* Tablas debajo del acordeón */}
                          <Grid container spacing={2} sx={{ marginTop: 4 }}>
                            <Grid item xs={12} sm={6}>
                              <TableContainer component={Paper}>
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Cód Int</TableCell>
                                      <TableCell>Servicio / Ensayo</TableCell>
                                      <TableCell>Estado</TableCell>
                                      <TableCell>Observación</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>200</TableCell>
                                      <TableCell>Compresión</TableCell>
                                      <TableCell>
                                        <Chip label='Codificado' color='primary' />
                                      </TableCell>
                                      <TableCell>Texto</TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                              <TableContainer component={Paper}>
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>#</TableCell>
                                      <TableCell>Cant</TableCell>
                                      <TableCell>Días</TableCell>
                                      <TableCell>Fecha Venc.</TableCell>
                                      <TableCell>Estado</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>1</TableCell>
                                      <TableCell>1</TableCell>
                                      <TableCell>7</TableCell>
                                      <TableCell>31/12/2024</TableCell>
                                      <TableCell>
                                        <Chip label='Ensayado' color='success' />
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  )
}

export default Header
