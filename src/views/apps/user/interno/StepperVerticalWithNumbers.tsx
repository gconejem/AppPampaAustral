'use client'

// React Imports
import { useState } from 'react'

// MUI Imports

import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import MenuItem from '@mui/material/MenuItem'

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

import iconButton from '@/@core/theme/overrides/icon-button'

// Component Imports
import StepperWrapper from '@core/styles/stepper'
import StepperCustomDot from '@components/stepper-dot'

// Constants
const steps = [
  { title: 'General', subtitle: '' },
  { title: 'Muestras', subtitle: '' },
  { title: 'Cierre', subtitle: '' }
]

const StepperVerticalWithNumbers = () => {
  const [activeStep, setActiveStep] = useState(0)

  // Tabs for RCM and Muestras
  const [selectedRCMTab, setSelectedRCMTab] = useState(0)
  const [selectedMuestrasTab, setSelectedMuestrasTab] = useState(0)

  const rcmTabs = [{ label: 'RCM 1528', id: 1 }]

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
                      {/* RCM Details */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={4}>
                          <TextField label='Fecha de Codificación' size='small' fullWidth />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField label='Fecha de Muestreo' size='small' fullWidth />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField label='Fecha de Ingreso' size='small' fullWidth />
                        </Grid>
                      </Grid>

                      {/* Nuevos Campos */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={8}>
                          <TextField
                            label='Servicio / Ensayo'
                            size='small'
                            fullWidth
                            InputProps={{
                              startAdornment: <i className='ri-search-line' style={{ marginRight: 8 }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Cantidad' size='small' fullWidth />
                        </Grid>

                        <Grid item xs={2}>
                          <Button
                            variant='contained'
                            color='primary'
                            size='medium'
                            startIcon={<i className='ri-add-line' />}
                            sx={{
                              width: '170px', // Ajusta el ancho para que sea justo
                              padding: '8px 16px', // Ajusta padding interno
                              textAlign: 'center'
                            }}
                          >
                            Añadir Servicio
                          </Button>
                        </Grid>
                      </Grid>

                      {/* Tabla for RCM */}
                      <TableContainer
                        component={Paper}
                        sx={{
                          mt: 10, // Margen superior para separar la tabla de los campos
                          mb: 10, // Margen inferior para separar la tabla del campo de observación
                          p: 2 // Espaciado interno opcional
                        }}
                      >
                        <Table>
                          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            {/* Tono gris claro */}
                            <TableRow>
                              <TableCell
                                sx={{
                                  backgroundColor: '#f5f5f5', // Asegura que el fondo sea uniforme
                                  padding: '8px' // Ajusta el padding según lo necesario
                                }}
                              >
                                <Typography variant='subtitle2' sx={{ fontWeight: '', color: '#424242' }}>
                                  CÓD INT
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: '#f5f5f5',
                                  padding: '8px'
                                }}
                              >
                                <Typography variant='subtitle2' sx={{ fontWeight: '', color: '#424242' }}>
                                  Servicio
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{
                                  backgroundColor: '#f5f5f5',
                                  padding: '8px'
                                }}
                              >
                                <Typography variant='subtitle2' sx={{ fontWeight: '', color: '#424242' }}>
                                  Cantidad
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>100</TableCell>
                              <TableCell>Toma de Muestra</TableCell>
                              <TableCell>2</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>101</TableCell>
                              <TableCell>Servicio Ingenieria HH</TableCell>
                              <TableCell>1</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Observación y Botón Codificar */}
                      <Box display='flex' alignItems='center' justifyContent='space-between' sx={{ mt: 2 }}>
                        <TextField label='Observación' fullWidth />
                        <Button
                          variant='outlined'
                          color='primary'
                          startIcon={<i className='ri-check-line' />}
                          sx={{ ml: 2 }}
                        >
                          Codificar
                        </Button>
                      </Box>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      {/* Acordeón para Muestra #1 */}
                      <Accordion defaultExpanded sx={{ mt: 3 }}>
                        <AccordionSummary
                          expandIcon={<i className='ri-arrow-down-s-line' />}
                          sx={{
                            backgroundColor: '#f5f5f5',
                            borderBottom: '1px solid #ddd',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <Box display='flex' alignItems='center' gap={2}>
                            <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                              Muestra #1
                            </Typography>
                            <Chip
                              label='180280-1'
                              sx={{
                                backgroundColor: '#e0e0e0',
                                color: '#424242',
                                fontWeight: 'bold',
                                height: '24px'
                              }}
                            />
                          </Box>
                          <Box display='flex' alignItems='center' gap={2} sx={{ marginLeft: 'auto' }}>
                            <Box display='flex' alignItems='center' gap={1}>
                              <Typography variant='body2'>Vencimiento</Typography>
                              <Checkbox
                                defaultChecked
                                color='primary'
                                onClick={e => {
                                  e.stopPropagation()
                                  console.log('Checkbox clickeado en Muestra #1')
                                }}
                              />
                            </Box>
                            <IconButton
                              color='primary'
                              onClick={e => {
                                e.stopPropagation()
                                console.log('Editar clickeado en Muestra #1')
                              }}
                            >
                              <i className='ri-edit-line' />
                            </IconButton>
                            <IconButton
                              color='primary'
                              onClick={e => {
                                e.stopPropagation()
                                console.log('Duplicar clickeado en Muestra #1')
                              }}
                            >
                              <i className='ri-file-copy-line' />
                            </IconButton>
                            <IconButton
                              color='primary'
                              onClick={e => {
                                e.stopPropagation()
                                console.log('Eliminar clickeado en Muestra #1')
                              }}
                            >
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                          </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                          {/* Campos organizados */}
                          <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Tipo Material' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 2 }}>
                              <TextField label='Elemento' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Ítem' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Grado' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Procedencia' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={3} sx={{ mb: 4 }}>
                              <TextField label='Cotas' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={3} sx={{ mb: 4 }}>
                              <TextField label='Cotas' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Ubicación / Sector' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={8} sx={{ mb: 4 }}>
                              <TextField
                                label='Servicio / Ensayo'
                                size='small'
                                fullWidth
                                InputProps={{
                                  startAdornment: <i className='ri-search-line' style={{ marginRight: 8 }} />
                                }}
                              />
                            </Grid>
                            <Grid item xs={2} sx={{ mb: 4 }}>
                              <TextField label='Cantidad' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={2} sx={{ mb: 2 }}>
                              <Button
                                variant='contained'
                                color='primary'
                                size='small'
                                startIcon={<i className='ri-add-line' />}
                                sx={{
                                  maxWidth: '150px',
                                  width: '100%',
                                  padding: '6px 12px'
                                }}
                              >
                                Añadir Servicio
                              </Button>
                            </Grid>
                          </Grid>

                          {/* Tabla Centralizada */}
                          <Box sx={{ mt: 4 }}>
                            <TableContainer component={Paper}>
                              <Table>
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableRow>
                                    <TableCell>CÓD. INT.</TableCell>
                                    <TableCell>ENSAYO / ANÁLISIS</TableCell>
                                    <TableCell>CANTIDAD</TableCell>
                                    <TableCell>ESTADO</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>HOR01</TableCell>
                                    <TableCell>Testigo Hormigón Fresco</TableCell>
                                    <TableCell>3</TableCell>
                                    <TableCell>
                                      <Chip
                                        label='Codificado'
                                        sx={{
                                          backgroundColor: '#daf3ff', // Fondo celeste
                                          color: '#16b1ff' // Texto azul
                                        }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        </AccordionDetails>
                      </Accordion>

                      {/* Acordeón para Muestra #2 */}
                      <Accordion defaultExpanded sx={{ mt: 3 }}>
                        <AccordionSummary
                          expandIcon={<i className='ri-arrow-down-s-line' />}
                          sx={{
                            backgroundColor: '#f5f5f5',
                            borderBottom: '1px solid #ddd',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <Box display='flex' alignItems='center' gap={2}>
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
                          </Box>
                          <Box display='flex' alignItems='center' gap={2} sx={{ marginLeft: 'auto' }}>
                            <Box display='flex' alignItems='center' gap={1}>
                              <Typography variant='body2'>Vencimiento</Typography>
                              <Checkbox
                                defaultChecked
                                color='primary'
                                onClick={e => {
                                  e.stopPropagation()
                                  console.log('Checkbox clickeado en Muestra #2')
                                }}
                              />
                            </Box>
                            <IconButton
                              color='primary'
                              onClick={e => {
                                e.stopPropagation()
                                console.log('Editar clickeado en Muestra #2')
                              }}
                            >
                              <i className='ri-edit-line' />
                            </IconButton>
                            <IconButton
                              color='primary'
                              onClick={e => {
                                e.stopPropagation()
                                console.log('Duplicar clickeado en Muestra #2')
                              }}
                            >
                              <i className='ri-file-copy-line' />
                            </IconButton>
                            <IconButton
                              color='primary'
                              onClick={e => {
                                e.stopPropagation()
                                console.log('Eliminar clickeado en Muestra #2')
                              }}
                            >
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                          </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                          {/* Campos organizados */}
                          <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Tipo Material' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 2 }}>
                              <TextField label='Elemento' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Ítem' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Grado' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Procedencia' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Cotas' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={6} sx={{ mb: 4 }}>
                              <TextField label='Ubicación / Sector' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={8} sx={{ mb: 4 }}>
                              <TextField
                                label='Servicio / Ensayo'
                                size='small'
                                fullWidth
                                InputProps={{
                                  startAdornment: <i className='ri-search-line' style={{ marginRight: 8 }} />
                                }}
                              />
                            </Grid>
                            <Grid item xs={2} sx={{ mb: 4 }}>
                              <TextField label='Cantidad' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={2} sx={{ mb: 2 }}>
                              <Button
                                variant='contained'
                                color='primary'
                                size='small'
                                startIcon={<i className='ri-add-line' />}
                                sx={{
                                  maxWidth: '150px',
                                  width: '100%',
                                  padding: '6px 12px'
                                }}
                              >
                                Añadir Servicio
                              </Button>
                            </Grid>
                          </Grid>

                          {/* Tabla Centralizada */}
                          <Box sx={{ mt: 4 }}>
                            <TableContainer component={Paper}>
                              <Table>
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableRow>
                                    <TableCell>CÓD. INT.</TableCell>
                                    <TableCell>ENSAYO / ANÁLISIS</TableCell>
                                    <TableCell>CANTIDAD</TableCell>
                                    <TableCell>ESTADO</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>HOR02</TableCell>
                                    <TableCell>Testigo Hormigón Seco</TableCell>
                                    <TableCell>5</TableCell>
                                    <TableCell>
                                      <Chip
                                        label='Codificado'
                                        sx={{
                                          backgroundColor: '#daf3ff', // Fondo celeste
                                          color: '#16b1ff' // Texto azul
                                        }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>

                          {/* Campos Adicionales */}
                          <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={2}>
                              <TextField label='Muestra' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={1}>
                              <TextField label='N°' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={2}>
                              <TextField label='Fecha Confección' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={2}>
                              <TextField label='Cantidad' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={1}>
                              <TextField label='Días' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={2}>
                              <TextField label='Fecha Vencimiento' size='small' fullWidth />
                            </Grid>
                            <Grid item xs={2}>
                              <Button
                                variant='contained'
                                color='primary'
                                size='small'
                                startIcon={<i className='ri-add-line' />}
                                sx={{
                                  maxWidth: '150px',
                                  width: '100%',
                                  padding: '6px 12px'
                                }}
                              >
                                Añadir
                              </Button>
                            </Grid>
                          </Grid>
                          <Box sx={{ mt: 4 }}>
                            {/* Tabla Agregada */}
                            <TableContainer component={Paper}>
                              <Table>
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                  <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>Muestra</TableCell>
                                    <TableCell>Confección</TableCell>
                                    <TableCell>Cantidad</TableCell>
                                    <TableCell>Días</TableCell>
                                    <TableCell>Vencimiento</TableCell>
                                    <TableCell>Estado</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {/* Fila de Ejemplo */}
                                  <TableRow>
                                    <TableCell>1</TableCell>
                                    <TableCell>2182-6</TableCell>
                                    <TableCell>01/01/2024</TableCell>
                                    <TableCell>1</TableCell>
                                    <TableCell>23</TableCell>
                                    <TableCell>01/01/2025</TableCell>
                                    <TableCell>
                                      <Chip
                                        label='Codificado'
                                        sx={{
                                          backgroundColor: '#daf3ff', // Fondo celeste
                                          color: '#16b1ff' // Texto azul
                                        }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                          <Box sx={{ mt: 4 }}>
                            {/* Campo de Observaciones */}
                            <Grid container spacing={2} sx={{ mt: 4 }}>
                              <Grid item xs={12}>
                                <TextField label='Observaciones Muestra' size='small' fullWidth multiline rows={1} />
                              </Grid>
                            </Grid>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    </>
                  )}

                  {index === 2 && (
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={9}>
                          <TextField label='Observaciones' size='small' fullWidth multiline rows={2} />
                        </Grid>
                        <Grid item xs={3} display='flex' justifyContent='flex-end' alignItems='center'>
                          <Button
                            variant='contained'
                            color='primary'
                            size='medium'
                            startIcon={<i className='ri-save-line' />}
                          >
                            Guardar
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
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
