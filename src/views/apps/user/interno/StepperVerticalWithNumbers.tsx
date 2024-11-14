'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Pagination from '@mui/material/Pagination'
import AddIcon from '@mui/icons-material/Add'

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Step,
  StepContent,
  StepLabel,
  Stepper,
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
  Checkbox
} from '@mui/material'

// Third-party Imports
import { toast } from 'react-toastify'
import classNames from 'classnames'

// Component Imports
import StepperWrapper from '@core/styles/stepper'
import StepperCustomDot from '@components/stepper-dot'

// Constants
const steps = [
  { title: 'RCM', subtitle: '' },
  { title: 'Muestras', subtitle: '' },
  { title: '...', subtitle: '' }
]

const StepperVerticalWithNumbers = () => {
  const [activeStep, setActiveStep] = useState(0)

  const [rcmTabs, setRcmTabs] = useState([
    { label: 'RCM 1', id: 1 },
    { label: 'RCM 2', id: 2 },
    { label: 'RCM 3', id: 3 },
    { label: 'RCM 4', id: 4 },
    { label: 'RCM 5', id: 5 },
    { label: 'RCM 6', id: 6 },
    { label: 'RCM 7', id: 7 },
    { label: 'RCM 8', id: 8 },
    { label: 'RCM 9', id: 9 },
    { label: 'RCM 10', id: 10 }
  ])

  const [selectedTab, setSelectedTab] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  const [rcmData, setRcmData] = useState({
    1: {
      rcmNumber: '176712',
      fechaCodificacion: '',
      area: '',
      servicioFamilia: '',
      servicioEnsayo: '',
      cantidad: '',
      observacion: ''
    }
  })

  const addNewPage = () => {
    const newId = rcmTabs.length + 1

    setRcmTabs([...rcmTabs, { label: `RCM ${newId}`, id: newId }])
    setRcmData({
      ...rcmData,
      [newId]: {
        rcmNumber: '',
        fechaCodificacion: '',
        area: '',
        servicioFamilia: '',
        servicioEnsayo: '',
        cantidad: '',
        observacion: ''
      }
    })

    // Asegura que la paginación vaya a la última página cuando se añade un nuevo "RCM"
    setCurrentPage(Math.ceil((rcmTabs.length + 1) / 5))
  }

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)

    if (activeStep === steps.length - 1) {
      toast.success('¡Todos los pasos completados!')
    }
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
  }

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
  }

  const addNewTab = () => {
    const newId = rcmTabs.length + 1

    setRcmTabs([...rcmTabs, { label: `RCM ${newId}`, id: newId }])
    setRcmData({
      ...rcmData,
      [newId]: {
        rcmNumber: '',
        fechaCodificacion: '',
        area: '',
        servicioFamilia: '',
        servicioEnsayo: '',
        cantidad: '',
        observacion: ''
      }
    })
    setSelectedTab(rcmTabs.length)
  }

  const handleInputChange = (tabId, field, value) => {
    setRcmData({
      ...rcmData,
      [tabId]: {
        ...rcmData[tabId],
        [field]: value
      }
    })
  }

  const [muestrasTabs, setMuestrasTabs] = useState([{ label: 'Muestra 1', id: 1 }])
  const [selectedMuestrasTab, setSelectedMuestrasTab] = useState(0)

  const [muestrasData, setMuestrasData] = useState({
    1: {
      numeroTarjeta: '',
      estado: '',
      tipoMaterial: '',
      item: '',
      procedencia: '',
      ubicacion: '',
      muestra: '',
      fecha: '',
      cantidadMuestras: '',
      dias: '',
      vencimiento: false
    }
  })

  const handleMuestrasTabChange = (event, newValue) => {
    setSelectedMuestrasTab(newValue)
  }

  const addNewMuestraTab = () => {
    const newId = muestrasTabs.length + 1

    setMuestrasTabs([...muestrasTabs, { label: `Muestra ${newId}`, id: newId }])
    setMuestrasData({
      ...muestrasData,
      [newId]: {
        numeroTarjeta: '',
        estado: '',
        tipoMaterial: '',
        item: '',
        procedencia: '',
        ubicacion: '',
        muestra: '',
        fecha: '',
        cantidadMuestras: '',
        dias: '',
        vencimiento: false
      }
    })
    setSelectedMuestrasTab(muestrasTabs.length)
  }

  const handleMuestrasInputChange = (tabId, field, value) => {
    setMuestrasData({
      ...muestrasData,
      [tabId]: {
        ...muestrasData[tabId],
        [field]: value
      }
    })
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
                  <Typography className='step-number' color='text.primary'>{`0${index + 1}`}</Typography>
                  <Typography className='step-title' color='text.primary'>
                    {step.title}
                  </Typography>
                  <Typography className='step-subtitle' color='text.primary'>
                    {step.subtitle}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {index === 0 ? (
                    <>
                      {/* Paginación para RCM con botón de agregar */}
                      <Box display='flex' alignItems='center' sx={{ mb: 2 }}>
                        <Pagination
                          count={Math.ceil(rcmTabs.length / 5)} // Número de páginas basado en 5 elementos por página
                          variant='tonal'
                          color='primary'
                          page={currentPage}
                          onChange={(_, value) => setCurrentPage(value)}
                          siblingCount={2} // Esto permitirá que se muestren más elementos en cada lado
                        />
                        <IconButton onClick={addNewPage} color='primary' sx={{ ml: 1 }}>
                          <AddIcon />
                        </IconButton>
                      </Box>

                      {/* Campos de Número de RCM y otros detalles */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={2}>
                          <Chip label='Codificado' color='primary' />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Fecha de Codificación'
                            value={rcmData[currentPage]?.fechaCodificacion || ''}
                            onChange={e => handleInputChange(currentPage, 'fechaCodificacion', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Área'
                            value={rcmData[currentPage]?.area || ''}
                            onChange={e => handleInputChange(currentPage, 'area', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Servicio Familia'
                            value={rcmData[currentPage]?.servicioFamilia || ''}
                            onChange={e => handleInputChange(currentPage, 'servicioFamilia', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Servicio / Ensayo'
                            value={rcmData[currentPage]?.servicioEnsayo || ''}
                            onChange={e => handleInputChange(currentPage, 'servicioEnsayo', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Cantidad'
                            value={rcmData[currentPage]?.cantidad || ''}
                            onChange={e => handleInputChange(currentPage, 'cantidad', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      {/* Segunda fila: 2-8-2 */}
                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={2}>
                          <Chip label='Sin Inicio' color='success' />
                        </Grid>
                        <Grid item xs={8}>
                          <TextField
                            label='Observación'
                            value={rcmData[currentPage]?.observacion || ''}
                            onChange={e => handleInputChange(currentPage, 'observacion', e.target.value)}
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <Button variant='contained' color='primary' fullWidth>
                            + Añadir Servicio
                          </Button>
                        </Grid>
                      </Grid>

                      {/* Tabla de detalles con datos de ejemplo */}
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
                            {/* Datos de ejemplo */}
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
                      {/* Tabs de Muestras */}
                      <Tabs value={selectedMuestrasTab} onChange={handleMuestrasTabChange} sx={{ mb: 2 }}>
                        {muestrasTabs.map((tab, tabIndex) => (
                          <Tab key={tab.id} label={tab.label} />
                        ))}
                        <Button onClick={addNewMuestraTab} sx={{ ml: 2 }}>
                          +
                        </Button>
                      </Tabs>

                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={3}>
                          <TextField
                            label='N° Tarjeta'
                            value={muestrasData[muestrasTabs[selectedMuestrasTab].id].numeroTarjeta}
                            onChange={e =>
                              handleMuestrasInputChange(
                                muestrasTabs[selectedMuestrasTab].id,
                                'numeroTarjeta',
                                e.target.value
                              )
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Select
                            label='Estado'
                            value={muestrasData[muestrasTabs[selectedMuestrasTab].id].estado}
                            onChange={e =>
                              handleMuestrasInputChange(muestrasTabs[selectedMuestrasTab].id, 'estado', e.target.value)
                            }
                            displayEmpty
                            fullWidth
                          >
                            <MenuItem value='' disabled>
                              Seleccione Estado
                            </MenuItem>
                            <MenuItem value='Activo'>Activo</MenuItem>
                            <MenuItem value='Inactivo'>Inactivo</MenuItem>
                          </Select>
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            label='Tipo Material'
                            value={muestrasData[muestrasTabs[selectedMuestrasTab].id].tipoMaterial}
                            onChange={e =>
                              handleMuestrasInputChange(
                                muestrasTabs[selectedMuestrasTab].id,
                                'tipoMaterial',
                                e.target.value
                              )
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            label='Ítem'
                            value={muestrasData[muestrasTabs[selectedMuestrasTab].id].item}
                            onChange={e =>
                              handleMuestrasInputChange(muestrasTabs[selectedMuestrasTab].id, 'item', e.target.value)
                            }
                            fullWidth
                          />
                        </Grid>
                      </Grid>

                      <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={2}>
                          <TextField
                            label='Muestra'
                            value={muestrasData[muestrasTabs[selectedMuestrasTab].id].muestra}
                            onChange={e =>
                              handleMuestrasInputChange(muestrasTabs[selectedMuestrasTab].id, 'muestra', e.target.value)
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Fecha'
                            value={muestrasData[muestrasTabs[selectedMuestrasTab].id].fecha}
                            onChange={e =>
                              handleMuestrasInputChange(muestrasTabs[selectedMuestrasTab].id, 'fecha', e.target.value)
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Cantidad Muestras'
                            value={muestrasData[muestrasTabs[selectedMuestrasTab].id].cantidadMuestras}
                            onChange={e =>
                              handleMuestrasInputChange(
                                muestrasTabs[selectedMuestrasTab].id,
                                'cantidadMuestras',
                                e.target.value
                              )
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            label='Días'
                            value={muestrasData[muestrasTabs[selectedMuestrasTab].id].dias}
                            onChange={e =>
                              handleMuestrasInputChange(muestrasTabs[selectedMuestrasTab].id, 'dias', e.target.value)
                            }
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={2}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={muestrasData[muestrasTabs[selectedMuestrasTab].id].vencimiento}
                                onChange={e =>
                                  handleMuestrasInputChange(
                                    muestrasTabs[selectedMuestrasTab].id,
                                    'vencimiento',
                                    e.target.checked
                                  )
                                }
                              />
                            }
                            label='Vencimiento'
                          />
                        </Grid>
                      </Grid>

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
