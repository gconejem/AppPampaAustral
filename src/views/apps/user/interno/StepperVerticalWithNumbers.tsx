'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
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
                      <Tabs value={selectedRCMTab} onChange={handleRCMTabChange} sx={{ mb: 2 }}>
                        {rcmTabs.map(tab => (
                          <Tab key={tab.id} label={tab.label} />
                        ))}
                      </Tabs>

                      {/* RCM Details */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={2}>
                          <Chip label='Codificado' color='primary' />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Fecha de Codificación' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Área' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Servicio Familia' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Servicio / Ensayo' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Cantidad' fullWidth />
                        </Grid>
                      </Grid>

                      {/* Observación */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={2}>
                          <Chip label='Sin Inicio' color='success' />
                        </Grid>
                        <Grid item xs={8}>
                          <TextField label='Observación' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <Button variant='contained' color='primary' fullWidth>
                            + Añadir Servicio
                          </Button>
                        </Grid>
                      </Grid>

                      {/* Tabla for RCM */}
                      <TableContainer component={Paper} sx={{ mt: 3 }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>CÓD INT</TableCell>
                              <TableCell>Servicio</TableCell>
                              <TableCell>Cantidad</TableCell>
                              <TableCell>Observación</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>100</TableCell>

                              <TableCell>Toma de Muestra</TableCell>
                              <TableCell>2</TableCell>
                              <TableCell>Prueba</TableCell>
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

                      <Grid container spacing={2}>
                        {/* Primera Tabla */}
                        <Grid item xs={6}>
                          <TableContainer component={Paper} sx={{ mt: 3 }}>
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
                                  <TableCell>dd-mm-yyyy</TableCell>
                                  <TableCell>1</TableCell>
                                  <TableCell>51</TableCell>
                                  <TableCell>01/01/2025</TableCell>
                                  <TableCell>
                                    <Chip label='Cod.' color='primary' />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>2</TableCell>
                                  <TableCell>21764-2</TableCell>
                                  <TableCell>dd-mm-yyyy</TableCell>
                                  <TableCell>1</TableCell>
                                  <TableCell>69</TableCell>
                                  <TableCell>dd-mm-yyyy</TableCell>
                                  <TableCell>
                                    <Chip label='Cod.' color='primary' />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>3</TableCell>
                                  <TableCell>21764-3</TableCell>
                                  <TableCell>dd-mm-yyyy</TableCell>
                                  <TableCell>1</TableCell>
                                  <TableCell>45</TableCell>
                                  <TableCell>dd-mm-yyyy</TableCell>
                                  <TableCell>
                                    <Chip label='Cod.' color='primary' />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Grid>

                        {/* Segunda Tabla */}
                        <Grid item xs={6}>
                          <TableContainer component={Paper} sx={{ mt: 3 }}>
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
                                  <TableCell>HOR01</TableCell>
                                  <TableCell>Testigo Hormigón Fresco</TableCell>
                                  <TableCell>
                                    <Chip label='Codificado' color='primary' />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>H323</TableCell>
                                  <TableCell>Espesor</TableCell>
                                  <TableCell>
                                    <Chip label='Codificado' color='primary' />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>H324</TableCell>
                                  <TableCell>Densidad</TableCell>
                                  <TableCell>
                                    <Chip label='Codificado' color='primary' />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>H325</TableCell>
                                  <TableCell>Compresión Testigo</TableCell>
                                  <TableCell>
                                    <Chip label='Codificado' color='primary' />
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
