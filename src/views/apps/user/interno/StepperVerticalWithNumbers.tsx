'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Step from '@mui/material/Step'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Stepper from '@mui/material/Stepper'
import StepLabel from '@mui/material/StepLabel'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import StepContent from '@mui/material/StepContent'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import FormControlLabel from '@mui/material/FormControlLabel' // Importa FormControlLabel
import Checkbox from '@mui/material/Checkbox' // Importa Checkbox

// Third-party Imports
import { toast } from 'react-toastify'
import classNames from 'classnames'

// Component Imports
import StepperWrapper from '@core/styles/stepper'
import StepperCustomDot from '@components/stepper-dot'

// Vars
const steps = [
  {
    title: 'RCM',
    subtitle: ''
  },
  {
    title: 'Muestras',
    subtitle: ''
  },
  {
    title: 'Planificación',
    subtitle: ''
  }
]

const StepperVerticalWithNumbers = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [rcmNumber, setRcmNumber] = useState('')
  const [fechaCodificacion, setFechaCodificacion] = useState('')
  const [area, setArea] = useState('')
  const [servicioFamilia, setServicioFamilia] = useState('')
  const [servicioEnsayo, setServicioEnsayo] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [observacion, setObservacion] = useState('')

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)

    if (activeStep === steps.length - 1) {
      toast.success('Completed All Steps!!')
    }
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
  }

  return (
    <Card>
      <CardHeader title='RCM' />
      <CardContent>
        <StepperWrapper>
          <Stepper activeStep={activeStep} orientation='vertical'>
            {steps.map((step, index) => (
              <Step key={index} className={classNames({ active: activeStep === index })}>
                <StepLabel StepIconComponent={StepperCustomDot}>
                  <div className='step-label'>
                    <Typography className='step-number' color='text.primary'>{`0${index + 1}`}</Typography>
                    <div>
                      <Typography className='step-title' color='text.primary'>
                        {step.title}
                      </Typography>
                      <Typography className='step-subtitle' color='text.primary'>
                        {step.subtitle}
                      </Typography>
                    </div>
                  </div>
                </StepLabel>
                <StepContent>
                  {index === 0 ? (
                    <>
                      {/* Primer Paso: Campos de Número de RCM y otros detalles */}
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            label='Número de RCM'
                            placeholder='Ingrese el número de RCM'
                            value={rcmNumber}
                            onChange={e => setRcmNumber(e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Chip label='Codificado' color='primary' />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Fecha de Codificación'
                            placeholder='dd-mm-yyyy'
                            value={fechaCodificacion}
                            onChange={e => setFechaCodificacion(e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Área'
                            placeholder='Ingrese el área'
                            value={area}
                            onChange={e => setArea(e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Servicio Familia'
                            placeholder='Ingrese servicio familia'
                            value={servicioFamilia}
                            onChange={e => setServicioFamilia(e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Servicio / Ensayo'
                            placeholder='Buscar servicio / ensayo'
                            value={servicioEnsayo}
                            onChange={e => setServicioEnsayo(e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Cantidad'
                            placeholder='Ingrese cantidad'
                            value={cantidad}
                            onChange={e => setCantidad(e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Chip label='Sin Inicio' color='success' />
                        </Grid>
                        <Grid item xs={10}>
                          <TextField
                            label='Observación'
                            placeholder='Ingrese observación'
                            value={observacion}
                            onChange={e => setObservacion(e.target.value)}
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      {/* Tabla de detalles */}
                      <TableContainer component={Paper} sx={{ mt: 3 }}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>CÓD INT</TableCell>
                              <TableCell>SERVICIO / ENSAYO</TableCell>
                              <TableCell>CANTIDAD</TableCell>
                              <TableCell>OBSERVACIÓN</TableCell>
                              <TableCell>ACCIONES</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>100</TableCell>
                              <TableCell>Toma de Muestra</TableCell>
                              <TableCell>1</TableCell>
                              <TableCell>Texto</TableCell>
                              <TableCell>
                                <IconButton>
                                  <EditIcon />
                                </IconButton>
                                <IconButton>
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>101</TableCell>
                              <TableCell>Docilidad Cono Abrams</TableCell>
                              <TableCell>1</TableCell>
                              <TableCell>Texto</TableCell>
                              <TableCell>
                                <IconButton>
                                  <EditIcon />
                                </IconButton>
                                <IconButton>
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>102</TableCell>
                              <TableCell>Piscina de Curado</TableCell>
                              <TableCell>1</TableCell>
                              <TableCell>Texto</TableCell>
                              <TableCell>
                                <IconButton>
                                  <EditIcon />
                                </IconButton>
                                <IconButton>
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  ) : index === 1 ? (
                    <>
                      {/* Segundo Paso: Campos adicionales */}
                      <Grid container spacing={2}>
                        <Grid item xs={3}>
                          <TextField label='N° Tarjeta' placeholder='Ingrese N° Tarjeta' fullWidth />
                        </Grid>
                        <Grid item xs={3}>
                          <Select label='Estado' defaultValue='' displayEmpty fullWidth>
                            <MenuItem value='' disabled>
                              Seleccione Estado
                            </MenuItem>
                            <MenuItem value='Activo'>Activo</MenuItem>
                            <MenuItem value='Inactivo'>Inactivo</MenuItem>
                          </Select>
                        </Grid>
                        <Grid item xs={3}>
                          <IconButton>
                            <EditIcon />
                          </IconButton>
                          <IconButton>
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                        <Grid item xs={3}>
                          <Button variant='contained'>Guardar</Button>
                        </Grid>
                      </Grid>

                      {/* Primera fila adicional */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={3}>
                          <TextField label='Tipo Material' placeholder='Ingrese Tipo Material' fullWidth />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField label='Ítem' placeholder='Ingrese Ítem' fullWidth />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField label='Procedencia' placeholder='Ingrese Procedencia' fullWidth />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField label='Ubicación / Sector' placeholder='Ingrese Ubicación' fullWidth />
                        </Grid>
                      </Grid>

                      {/* Segunda fila adicional */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={2}>
                          <TextField label='Muestra' placeholder='Ingrese Muestra' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Fecha' placeholder='Seleccione Fecha' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Cantidad Muestras' placeholder='Ingrese Cantidad' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField label='Días' placeholder='Seleccione Días' fullWidth />
                        </Grid>
                        <Grid item xs={2}>
                          <Select label='Estado' defaultValue='' displayEmpty fullWidth>
                            <MenuItem value='' disabled>
                              Seleccione Estado
                            </MenuItem>
                            <MenuItem value='Activo'>Activo</MenuItem>
                            <MenuItem value='Inactivo'>Inactivo</MenuItem>
                          </Select>
                        </Grid>
                        <Grid item xs={2}>
                          <FormControlLabel control={<Checkbox />} label='Vencimiento' />
                        </Grid>
                      </Grid>

                      {/* Contenedor de tablas en la misma fila */}
                      <Grid container spacing={2} sx={{ mt: 3 }}>
                        <Grid item xs={6}>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>#</TableCell>
                                  <TableCell>Muestra</TableCell>
                                  <TableCell>Confección</TableCell>
                                  <TableCell>Cant.</TableCell>
                                  <TableCell>Días</TableCell>
                                  <TableCell>Venc.</TableCell>
                                  <TableCell>Est.</TableCell>
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
                        <Grid item xs={6}>
                          <TableContainer component={Paper}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>CÓD. INT.</TableCell>
                                  <TableCell>Ensayo / Análisis</TableCell>
                                  <TableCell>Estado</TableCell>
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
                  ) : (
                    <Typography color='text.primary'>{index + 1}</Typography>
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
