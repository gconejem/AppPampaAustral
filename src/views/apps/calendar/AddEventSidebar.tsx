// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Checkbox from '@mui/material/Checkbox'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Type Imports
import type { AddEventSidebarType } from '@/types/apps/calendarTypes'

interface DefaultStateType {
  title: string
  allDay: boolean
  calendar: string
  description: string
  endDate: Date
  startDate: Date
}

const defaultState: DefaultStateType = {
  title: '',
  allDay: true,
  description: '',
  endDate: new Date(),
  calendar: 'Business',
  startDate: new Date()
}

const AddEventSidebar = (props: AddEventSidebarType) => {
  const { addEventSidebarOpen, handleAddEventSidebarToggle } = props
  const [values, setValues] = useState<DefaultStateType>(defaultState)

  const [detalleRows, setDetalleRows] = useState([
    { servicio: '', cantidad: '', descripcion: '', segundaVisita: false }
  ])

  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues: { title: '' } })

  const isBelowSmScreen = useMediaQuery('(max-width:600px)')

  const onSubmit = (data: { title: string }) => {
    // Submit logic
  }

  const handleInputChange = (index: number, field: string, value: any) => {
    const updatedRows = [...detalleRows]

    updatedRows[index][field] = value
    setDetalleRows(updatedRows)
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleAddEventSidebarToggle}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', '90vw'], maxWidth: '100vw' } }}
    >
      <Box p={4}>
        <Typography variant='h5' mb={2} align='center'>
          Agendar Una Visita
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            {/* Fila 1: VISITA, EVENTO, RECURRENTE, FECHA, HORA INICIO, HORA FINAL */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel id='tipo-evento-label'>Visita</InputLabel>
                <Select labelId='tipo-evento-label' label='Visita' value={values.title}>
                  <MenuItem value='visita'>Visita</MenuItem>
                  <MenuItem value='evento'>Evento</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <FormControlLabel control={<Switch defaultChecked />} label='Evento' />
            </Grid>

            <Grid item xs={12} sm={2}>
              <FormControlLabel control={<Switch />} label='Recurrente' />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField label='Fecha' fullWidth />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField label='Hora Inicio' fullWidth />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <TextField label='Hora Final' fullWidth />
            </Grid>

            {/* Fila 2: ESTADO ACTUAL y SOLICITUD */}
            <Grid item xs={12} sm={6} md={6}>
              <FormControl fullWidth>
                <InputLabel id='estado-actual-label'>Estado Actual</InputLabel>
                <Select labelId='estado-actual-label' label='Estado Actual' value={values.title}>
                  <MenuItem value='pendiente'>Pendiente</MenuItem>
                  <MenuItem value='completado'>Completado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <FormControl fullWidth>
                <InputLabel id='solicitud-label'>Solicitud</InputLabel>
                <Select labelId='solicitud-label' label='Solicitud' value={values.title}>
                  <MenuItem value='solicitud1'>Solicitud 1</MenuItem>
                  <MenuItem value='solicitud2'>Solicitud 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Fila 3: CLIENTE y OBRA */}
            <Grid item xs={12} sm={6} md={6}>
              <FormControl fullWidth>
                <InputLabel id='cliente-label'>Cliente</InputLabel>
                <Select labelId='cliente-label' label='Cliente' value={values.title}>
                  <MenuItem value='cliente1'>Cliente 1</MenuItem>
                  <MenuItem value='cliente2'>Cliente 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <FormControl fullWidth>
                <InputLabel id='obra-label'>Obra</InputLabel>
                <Select labelId='obra-label' label='Obra' value={values.title}>
                  <MenuItem value='obra1'>Obra 1</MenuItem>
                  <MenuItem value='obra2'>Obra 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Fila 4: SECTOR COMERCIAL, REGIÓN, COMUNA */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel id='sector-comercial-label'>Sector Comercial</InputLabel>
                <Select labelId='sector-comercial-label' label='Sector Comercial' value={values.title}>
                  <MenuItem value='sector1'>Sector 1</MenuItem>
                  <MenuItem value='sector2'>Sector 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel id='region-label'>Región</InputLabel>
                <Select labelId='region-label' label='Región' value={values.title}>
                  <MenuItem value='region1'>Región 1</MenuItem>
                  <MenuItem value='region2'>Región 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel id='comuna-label'>Comuna</InputLabel>
                <Select labelId='comuna-label' label='Comuna' value={values.title}>
                  <MenuItem value='comuna1'>Comuna 1</MenuItem>
                  <MenuItem value='comuna2'>Comuna 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Fila 5: DIRECCIÓN y REFERENCIA */}
            <Grid item xs={12} sm={6} md={6}>
              <TextField label='Dirección' fullWidth />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <TextField label='Referencia' fullWidth />
            </Grid>

            {/* Fila 6: SOLICITANTE y NOMBRE */}
            <Grid item xs={12} sm={6} md={6}>
              <FormControl fullWidth>
                <InputLabel id='solicitante-label'>Solicitante</InputLabel>
                <Select labelId='solicitante-label' label='Solicitante' value={values.title}>
                  <MenuItem value='solicitante1'>Solicitante 1</MenuItem>
                  <MenuItem value='solicitante2'>Solicitante 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <TextField label='Nombre' fullWidth />
            </Grid>

            {/* Detalle */}
            <Grid item xs={12} mt={3}>
              <Typography variant='h6' gutterBottom>
                Detalle
              </Typography>
              <Grid container spacing={2}>
                {detalleRows.map((row, index) => (
                  <Grid container spacing={2} key={index}>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Servicios</InputLabel>
                        <Select
                          value={row.servicio}
                          onChange={e => handleInputChange(index, 'servicio', e.target.value)}
                        >
                          <MenuItem value='servicio1'>Servicios</MenuItem>
                          <MenuItem value='servicio2'>Control de Compactación</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={2}>
                      <TextField
                        label='Cantidad'
                        value={row.cantidad}
                        onChange={e => handleInputChange(index, 'cantidad', e.target.value)}
                        fullWidth
                      />
                    </Grid>

                    <Grid item xs={12} sm={5}>
                      <TextField
                        label='Descripción'
                        value={row.descripcion}
                        onChange={e => handleInputChange(index, 'descripcion', e.target.value)}
                        fullWidth
                      />
                    </Grid>

                    <Grid item xs={12} sm={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={row.segundaVisita}
                            onChange={e => handleInputChange(index, 'segundaVisita', e.target.checked)}
                          />
                        }
                        label='2da Visita'
                      />
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Sección Extras */}
            <Grid item xs={12} mt={3}>
              <Typography variant='h6' gutterBottom>
                Extras
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Jornada Laboratorista</InputLabel>
                    <Select value={values.title}>
                      <MenuItem value='laboratorista1'>Laboratorista</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Equipos Asignados</InputLabel>
                    <Select value={values.title}>
                      <MenuItem value='equipos1'>Equipos Asignados</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label='Observación Visita' fullWidth />
                </Grid>

                {/* Fila 2 */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Media Jornada Laboratorista</InputLabel>
                    <Select value={values.title}>
                      <MenuItem value='laboratorista1'>Laboratorista</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Equipos Asignados</InputLabel>
                    <Select value={values.title}>
                      <MenuItem value='equipos1'>Equipos Asignados</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label='Observación Visita' fullWidth />
                </Grid>

                {/* Fila 3 */}
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Visita Profesional</InputLabel>
                    <Select value={values.title}>
                      <MenuItem value='laboratorista1'>Laboratorista</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Equipos Asignados</InputLabel>
                    <Select value={values.title}>
                      <MenuItem value='equipos1'>Equipos Asignados</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label='Observación Visita' fullWidth />
                </Grid>
              </Grid>
            </Grid>

            {/* Botones */}
            <Grid item xs={12}>
              <Box display='flex' justifyContent='flex-end' mt={2}>
                <Button variant='outlined' color='warning' onClick={handleAddEventSidebarToggle} sx={{ mr: 2 }}>
                  Cancelar
                </Button>
                <Button variant='contained' color='primary' type='submit'>
                  Agendar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Drawer>
  )
}

export default AddEventSidebar
