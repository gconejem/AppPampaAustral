'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Checkbox from '@mui/material/Checkbox'

import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material'

// Component Imports
import StepperWrapper from '@core/styles/stepper'
import StepperCustomDot from '@components/stepper-dot'

// Constants
const steps = [
  { title: '', subtitle: '' },
  { title: 'Muestras', subtitle: '' },
  { title: '...', subtitle: '' }
]

const StepperVerticalWithNumbers = () => {
  const [activeStep, setActiveStep] = useState(0)

  // Tabs for RCM and Muestras
  const [selectedRCMTab, setSelectedRCMTab] = useState(0)
  const [selectedMuestrasTab, setSelectedMuestrasTab] = useState(0)

  const rcmTabs = [{ label: 'RCM 1', id: 1 }]

  const muestrasTabs = [{ label: 'Muestra 1', id: 1 }]

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
  }

  const handleRCMTabChange = (event, newValue) => {
    setSelectedRCMTab(newValue)
  }

  const handleMuestrasTabChange = (event, newValue) => {
    setSelectedMuestrasTab(newValue)
  }

  return (
    <Card>
      <CardHeader title='RCM' />
      <CardContent>
        <StepperWrapper>
          <Stepper activeStep={activeStep} orientation='vertical'>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel StepIconComponent={StepperCustomDot}>
                  <Typography className='step-number' color='text.primary'>{`0${index + 1}`}</Typography>
                  <Typography className='step-title' color='text.primary'>
                    {step.title}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {index === 0 && (
                    <>
                      {/* Tabs for RCM */}
                      <Box display='flex' alignItems='center' gap={2} sx={{ mb: 2 }}>
                        <Tabs value={selectedRCMTab} onChange={handleRCMTabChange}>
                          {rcmTabs.map(tab => (
                            <Tab key={tab.id} label={tab.label} />
                          ))}
                        </Tabs>

                        {/* Read-Only Fields */}
                        <TextField
                          label='Fecha de Codificación'
                          size='small'
                          value='DD-MM-YYYY' // Valor de ejemplo fijo
                          InputProps={{ readOnly: true }}
                          sx={{ width: '200px' }}
                        />
                        <TextField
                          label='Área'
                          size='small'
                          value='Hormigón' // Valor de ejemplo fijo
                          InputProps={{ readOnly: true }}
                          sx={{ width: '200px' }}
                        />
                        <TextField
                          label='Familia'
                          size='small'
                          value='Hormigón Fresco' // Valor de ejemplo fijo
                          InputProps={{ readOnly: true }}
                          sx={{ width: '200px' }}
                        />
                        {/* Tarjeta de Estado */}
                        <Chip
                          label='Sin Inicio'
                          sx={{
                            bgcolor: '#e8f5e9',
                            color: '#388e3c',
                            fontWeight: 'bold',
                            height: '32px'
                          }}
                        />
                      </Box>

                      {/* RCM Details */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={2}>
                          <TextField label='Fecha de Muestreo' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Fecha de Ingreso' fullWidth />
                        </Grid>
                      </Grid>

                      {/* Observación */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={8}>
                          <TextField label='Observación' fullWidth />
                        </Grid>
                        <Grid item xs={2}></Grid>
                      </Grid>

                      {/* Tabla for RCM */}
                      <TableContainer component={Paper} sx={{ mt: 3 }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>CÓD INT</TableCell>
                              <TableCell>Servicio</TableCell>
                              <TableCell>Cantidad</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>100</TableCell>
                              <TableCell>Toma de Muestra</TableCell>
                              <TableCell>2</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      {/* Tabs for Muestras */}
                      <Tabs value={selectedMuestrasTab} onChange={handleMuestrasTabChange} sx={{ mb: 2 }}>
                        {muestrasTabs.map(tab => (
                          <Tab key={tab.id} label={tab.label} />
                        ))}
                      </Tabs>

                      {/* Encabezado Superior */}
                      <Grid container spacing={2} alignItems='center'>
                        {/* Cantidad de muestras */}
                        <Grid item xs={2}>
                          <TextField
                            label='Cantidad Muestras'
                            size='small'
                            value='4' // Valor de ejemplo fijo
                            InputProps={{
                              readOnly: true
                            }}
                          />
                        </Grid>

                        {/* Barra de búsqueda */}
                        <Grid item xs={3}>
                          <TextField
                            size='small'
                            placeholder='Servicio / Ensayo'
                            InputProps={{
                              startAdornment: <i className='ri-search-line' style={{ marginRight: 8 }} />
                            }}
                          />
                        </Grid>

                        {/* Campo de cantidad */}
                        <Grid item xs={2}>
                          <TextField
                            label='Cantidad'
                            size='small'
                            value='2' // Valor de ejemplo fijo
                          />
                        </Grid>

                        {/* Botón Añadir Servicio */}
                        <Grid item xs={3}>
                          <Button
                            variant='contained'
                            color='primary'
                            size='small'
                            startIcon={<i className='ri-add-line' />}
                            fullWidth
                            sx={{ minHeight: '20px' }}
                          >
                            Añadir Servicio
                          </Button>
                        </Grid>

                        {/* Booleano Vencimiento */}
                        <Grid item xs={2} display='flex' alignItems='center' justifyContent='flex-end'>
                          <Checkbox defaultChecked />
                          <Typography>Vencimiento</Typography>
                        </Grid>
                      </Grid>

                      {/* Contenido de las Tablas */}
                      <Grid container spacing={2} sx={{ mt: 3 }}>
                        {/* Primera Tabla */}
                        <Grid item xs={4}>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>TIPO MATERIAL</TableCell>
                                  <TableCell>ITEM</TableCell>
                                  <TableCell>PROCEDENCIA</TableCell>
                                  <TableCell>UBICACIÓN / SECTOR</TableCell>
                                  <TableCell>GRADO</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell>Probeta Cilíndrica</TableCell>
                                  <TableCell>Sobrecrecimiento</TableCell>
                                  <TableCell>Río San Martín</TableCell>
                                  <TableCell>Chillán</TableCell>
                                  <TableCell>G-17</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>

                        {/* Segunda Tabla */}
                        <Grid item xs={4}>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>CÓD. INT.</TableCell>
                                  <TableCell>ENSAYO / ANÁLISIS</TableCell>
                                  <TableCell>ESTADO</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell>HOR004</TableCell>
                                  <TableCell>Serie 3 Cilindros - Compresión</TableCell>
                                  <TableCell>
                                    <Chip label='Codificado' color='primary' />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>

                        {/* Tercera Tabla */}
                        <Grid item xs={4}>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>#</TableCell>
                                  <TableCell>MUESTRA</TableCell>
                                  <TableCell>CONFECCIÓN</TableCell>
                                  <TableCell>CANT.</TableCell>
                                  <TableCell>DÍAS</TableCell>
                                  <TableCell>VENCIMIENTO</TableCell>
                                  <TableCell>ESTADO</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell>1</TableCell>
                                  <TableCell>21764-1</TableCell>
                                  <TableCell>25-10-2024</TableCell>
                                  <TableCell>1</TableCell>
                                  <TableCell>7</TableCell>
                                  <TableCell>DD-MM-YYYY</TableCell>
                                  <TableCell>
                                    <Chip label='Ensayado' color='primary' />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>
                      </Grid>
                    </>
                  )}
                  <div className='flex gap-4 mt-4'>
                    <Button variant='contained' onClick={handleNext} size='small'>
                      {index === steps.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </Button>
                    <Button
                      size='small'
                      color='secondary'
                      variant='outlined'
                      onClick={handleBack}
                      disabled={index === 0}
                    >
                      Atrás
                    </Button>
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </StepperWrapper>
        {activeStep === steps.length && (
          <div className='mt-2'>
            <Typography color='text.primary'>¡Todos los pasos están completados!</Typography>
            <Button variant='contained' onClick={handleReset} size='small' className='mt-2'>
              Reiniciar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StepperVerticalWithNumbers
