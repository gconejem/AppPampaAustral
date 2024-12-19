'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

// Styled Component Imports
import StepperWrapper from '@core/styles/stepper'
import StepperCustomDot from '@components/stepper-dot'

type FormDataType = {
  rcmNumber: string
  fechaCodificacion: string
  area: string
  servicioFamilia: string
  servicioEnsayo: string
  cantidad: string
  observacion: string
}

const steps = [{ title: 'RCM' }, { title: 'TABLA' }, { title: '...' }]

const StepperAlternativeLabel = () => {
  const [activeStep, setActiveStep] = useState(0)

  const [formData, setFormData] = useState<FormDataType>({
    rcmNumber: '',
    fechaCodificacion: '',
    area: '',
    servicioFamilia: '',
    servicioEnsayo: '',
    cantidad: '',
    observacion: ''
  })

  const [tableData, setTableData] = useState([
    { codigoInt: '100', servicio: 'Toma de Muestra', cantidad: 1, observacion: 'Texto' },
    { codigoInt: '101', servicio: 'Docilidad Cono Abrams', cantidad: 1, observacion: 'Texto' },
    { codigoInt: '102', servicio: 'Piscina de Curado', cantidad: 1, observacion: 'Texto' }
  ])

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const renderStepContent = (activeStep: number) => {
    switch (activeStep) {
      case 0:
        return (
          <>
            {/* RCM Number on a single row */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Número de RCM'
                placeholder='Ingrese el número de RCM'
                value={formData.rcmNumber}
                onChange={e => setFormData({ ...formData, rcmNumber: e.target.value })}
              />
            </Grid>
            {/* Main Fields Row */}
            <Grid item xs={2}>
              <Chip label='Codificado' color='primary' sx={{ backgroundColor: '#D1E9FF', color: '#007BFF' }} />
            </Grid>
            <Grid item xs={2}>
              <TextField
                fullWidth
                label='Fecha de Codificación'
                placeholder='dd-mm-yyyy'
                value={formData.fechaCodificacion}
                onChange={e => setFormData({ ...formData, fechaCodificacion: e.target.value })}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                fullWidth
                label='Área'
                placeholder='Ingrese el área'
                value={formData.area}
                onChange={e => setFormData({ ...formData, area: e.target.value })}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                fullWidth
                label='Servicio Familia'
                placeholder='Ingrese servicio familia'
                value={formData.servicioFamilia}
                onChange={e => setFormData({ ...formData, servicioFamilia: e.target.value })}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                fullWidth
                label='Servicio / Ensayo'
                placeholder='Buscar servicio / ensayo'
                value={formData.servicioEnsayo}
                onChange={e => setFormData({ ...formData, servicioEnsayo: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-search-line' />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={2}>
              <TextField
                fullWidth
                label='Cantidad'
                placeholder='Ingrese cantidad'
                value={formData.cantidad}
                onChange={e => setFormData({ ...formData, cantidad: e.target.value })}
              />
            </Grid>
            {/* Observation Row */}
            <Grid item xs={2}>
              <Chip label='Sin Inicio' color='success' sx={{ backgroundColor: '#DFF5D5', color: '#4CAF50' }} />
            </Grid>
            <Grid item xs={10}>
              <TextField
                fullWidth
                label='Observación'
                placeholder='Ingrese observación'
                value={formData.observacion}
                onChange={e => setFormData({ ...formData, observacion: e.target.value })}
              />
            </Grid>
          </>
        )
      case 1:
        return (
          <TableContainer component={Paper}>
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
                {tableData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.codigoInt}</TableCell>
                    <TableCell>{row.servicio}</TableCell>
                    <TableCell>{row.cantidad}</TableCell>
                    <TableCell>{row.observacion}</TableCell>
                    <TableCell>
                      <IconButton>
                        <EditIcon />
                      </IconButton>
                      <IconButton>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      case 2:
        return <Typography></Typography>
      default:
        return 'Unknown step'
    }
  }

  return (
    <>
      <StepperWrapper>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map(label => (
            <Step key={label.title}>
              <StepLabel StepIconComponent={StepperCustomDot}>
                <div className='step-label'>
                  <Typography className='step-title' color='text.primary'>
                    {label.title}
                  </Typography>
                  <Typography className='step-subtitle' color='text.primary'>
                    {label.subtitle}
                  </Typography>
                </div>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </StepperWrapper>
      <Card className='mt-4'>
        <CardContent>
          <form onSubmit={e => e.preventDefault()}>
            <Grid container spacing={5}>
              {renderStepContent(activeStep)}
              <Grid item xs={12} className='flex justify-between'>
                <Button variant='outlined' disabled={activeStep === 0} onClick={handleBack} color='secondary'>
                  Atrás
                </Button>
                <Button variant='contained' onClick={handleNext}>
                  {activeStep === steps.length - 1 ? 'Submit' : 'Siguiente'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default StepperAlternativeLabel
