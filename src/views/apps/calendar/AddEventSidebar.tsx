import { useState } from 'react'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import AddIcon from '@mui/icons-material/Add'
import StarIcon from '@mui/icons-material/Star'
import DeleteIcon from '@mui/icons-material/Delete'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'

const AddEventSidebar = ({ addEventSidebarOpen, handleAddEventSidebarToggle }) => {
  const [values, setValues] = useState({
    tipoVisita: '',
    fecha: '',
    horaInicio: '',
    horaTermino: ''
  })

  const handleInputChange = (field, value) => {
    setValues({ ...values, [field]: value })
  }

  const data = [
    { codigo: '123', servicio: 'Servicios elegidos...', cantidad: 10, descripcion: 'Texto' },
    { codigo: '124', servicio: 'Servicios elegidos...', cantidad: 2, descripcion: 'Texto' }
  ]

  const laboratoristaData = [
    { idLaboratorista: '123', nombre: 'Cristian Salinas' },
    { idLaboratorista: '124', nombre: 'Nombre Laboratorista' }
  ]

  const equipoData = [
    { idEquipo: '12345', equipo: 'Jornada' },
    { idEquipo: '12345', equipo: 'Jornada' }
  ]

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleAddEventSidebarToggle}
      sx={{
        '& .MuiDrawer-paper': {
          width: '80%',
          maxWidth: '100vw',
          padding: '16px',
          boxSizing: 'border-box'
        }
      }}
    >
      <Box sx={{ width: '100%', padding: '16px', boxSizing: 'border-box' }}>
        {/* Header */}
        <Grid container alignItems='center' justifyContent='space-between' spacing={2}>
          <Grid item xs={9}>
            <Box display='flex' alignItems='center' gap={1}>
              {/* Ajustar la separación */}
              <Typography variant='h5'>Agendar Una Visita</Typography>
              <Typography variant='body2' color='textSecondary'>
                * Campo obligatorio
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={2}>
            <Box display='flex' alignItems='center'>
              <Typography variant='body2'>Estado</Typography>
              <IconButton size='small'>
                <EditIcon fontSize='small' />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={1} display='flex' justifyContent='flex-end'>
            <Button variant='outlined' color='error'>
              Cancelar
            </Button>
          </Grid>
        </Grid>

        {/* Fila Tipo de Visita */}
        <Grid container spacing={2} alignItems='center' mt={4}>
          {/* Tipo de Visita */}
          <Grid item xs={2}>
            <Typography>Tipo de Visita:</Typography>
          </Grid>

          {/* Booleanos */}
          <Grid item xs={1}>
            <FormControlLabel control={<Checkbox />} label='Evento' labelPlacement='end' />
          </Grid>
          <Grid item xs={1}>
            <FormControlLabel control={<Checkbox />} label='Recurrente' labelPlacement='end' />
          </Grid>

          {/* Fecha */}
          <Grid item xs={2}>
            <FormControl fullWidth>
              <InputLabel>Fecha</InputLabel>
              <Select value={values.fecha} onChange={e => handleInputChange('fecha', e.target.value)}>
                <MenuItem value='Fecha 1'>Fecha 1</MenuItem>
                <MenuItem value='Fecha 2'>Fecha 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Hora Inicio */}
          <Grid item xs={3}>
            <TextField
              fullWidth
              label='Hora Inicio'
              value={values.horaInicio}
              onChange={e => handleInputChange('horaInicio', e.target.value)}
            />
          </Grid>

          {/* Hora Término */}
          <Grid item xs={3}>
            <TextField
              fullWidth
              label='Hora Término'
              value={values.horaTermino}
              onChange={e => handleInputChange('horaTermino', e.target.value)}
            />
          </Grid>
          <Grid container spacing={2} mt={2}>
            {/* Cliente */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Cliente *</InputLabel>
                <Select value={values.cliente} onChange={e => handleInputChange('cliente', e.target.value)}>
                  <MenuItem value='Cliente 1'>Cliente 1</MenuItem>
                  <MenuItem value='Cliente 2'>Cliente 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Obra */}
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Obra *</InputLabel>
                <Select value={values.obra} onChange={e => handleInputChange('obra', e.target.value)}>
                  <MenuItem value='Obra 1'>Obra 1</MenuItem>
                  <MenuItem value='Obra 2'>Obra 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Solicitud con ícono de + */}
            <Grid item xs={11} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Solicitud</InputLabel>
                <Select value={values.solicitud} onChange={e => handleInputChange('solicitud', e.target.value)}>
                  <MenuItem value='Solicitud 1'>Solicitud 1</MenuItem>
                  <MenuItem value='Solicitud 2'>Solicitud 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* IconButton */}
            <Grid item xs={1} sm={1} display='flex' alignItems='center' justifyContent='center'>
              <IconButton size='large'>
                <AddIcon fontSize='large' />
              </IconButton>
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ marginTop: 2 }}>
            {/* Sector Comercial - 6 columnas */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sector Comercial *</InputLabel>
                <Select
                  value={values.sectorComercial}
                  onChange={e => handleInputChange('sectorComercial', e.target.value)}
                >
                  <MenuItem value='Sector 1'>Sector 1</MenuItem>
                  <MenuItem value='Sector 2'>Sector 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Región - 3 columnas */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Región *</InputLabel>
                <Select value={values.region} onChange={e => handleInputChange('region', e.target.value)}>
                  <MenuItem value='Región 1'>Región 1</MenuItem>
                  <MenuItem value='Región 2'>Región 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Comuna - 3 columnas */}
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Comuna *</InputLabel>
                <Select value={values.comuna} onChange={e => handleInputChange('comuna', e.target.value)}>
                  <MenuItem value='Comuna 1'>Comuna 1</MenuItem>
                  <MenuItem value='Comuna 2'>Comuna 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2} mt={2}>
            {/* Dirección */}
            <Grid item xs={12} sm={6} display='flex' alignItems='center'>
              <TextField
                fullWidth
                label='Dirección *'
                value={values.direccion}
                onChange={e => handleInputChange('direccion', e.target.value)}
              />
              <IconButton size='small' sx={{ marginLeft: '8px' }}>
                <EditIcon />
              </IconButton>
            </Grid>

            {/* Referencia */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Referencia'
                value={values.referencia}
                onChange={e => handleInputChange('referencia', e.target.value)}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2} mt={4} sx={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
            {/* Cabecera de la tabla */}
            <Grid item xs={4}>
              <Typography variant='subtitle2' align='left'>
                ROL
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant='subtitle2' align='left'>
                NOMBRE
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant='subtitle2' align='left'>
                ACCIÓN
              </Typography>
            </Grid>
          </Grid>
          <Grid container spacing={2} mt={2}>
            {/* Fila de la tabla */}
            <Grid item xs={4}>
              <Typography>Solicitante</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>Nombre Encargado</Typography>
            </Grid>
            <Grid item xs={2} style={{ textAlign: 'left' }}>
              <IconButton size='small'>
                <AddIcon />
              </IconButton>
              <IconButton size='small'>
                <EditIcon />
              </IconButton>
              <IconButton size='small'>
                <StarIcon />
              </IconButton>
              <IconButton size='small'>
                <DeleteIcon />
              </IconButton>
            </Grid>

            {/* Segunda fila con campo de texto para ingresar datos */}
            <Grid item xs={4}>
              <Typography>Solicitante</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField label='Nombre' fullWidth />
            </Grid>
            <Grid item xs={2} style={{ textAlign: 'left' }}>
              <IconButton size='small'>
                <AddIcon />
              </IconButton>
              <IconButton size='small'>
                <EditIcon />
              </IconButton>
              <IconButton size='small'>
                <StarIcon />
              </IconButton>
              <IconButton size='small'>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
          <Grid container spacing={2} mt={4}>
            <Grid item xs={12}>
              <Typography variant='h5' sx={{ fontWeight: '' }}>
                Detalles
              </Typography>
            </Grid>
          </Grid>
          <Grid container spacing={2} mt={2}>
            {/* Servicio Extra (con icono de búsqueda) */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label='Servicio Extra'
                variant='outlined'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Cantidad */}
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label='Cantidad' variant='outlined' />
            </Grid>

            {/* Observación */}
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label='Observación' variant='outlined' />
            </Grid>

            {/* 2da Visita (checkbox) */}
            <Grid item xs={12} sm={1}>
              <FormControlLabel control={<Checkbox />} label='2a Visita' />
            </Grid>

            {/* Botón Agregar */}
            <Grid item xs={12} sm={2}>
              <Button variant='contained' color='primary' fullWidth startIcon={<AddIcon />}>
                + Agregar
              </Button>
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ marginTop: 2 }}>
            <Grid item xs={12}>
              <Box sx={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                <Grid container>
                  <Grid item xs={2}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      CÓDIGO
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      SERVICIOS
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      CANTIDAD
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      DESCRIPCIÓN / OBSERVACIÓN
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      ACCIÓN
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Aquí van las filas dinámicas */}
              {data.map((item, index) => (
                <Grid container key={index} sx={{ borderBottom: '1px solid #e0e0e0', padding: '8px 0' }}>
                  <Grid item xs={2}>
                    <Typography>{item.codigo}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography>{item.servicio}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography>{item.cantidad}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography>{item.descripcion}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Box display='flex' gap={1} justifyContent='center'>
                      <IconButton size='small'>
                        <EditIcon />
                      </IconButton>
                      <IconButton size='small'>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid container spacing={2} mt={2}>
            {/* Título Laboratorista con ícono */}
            <Grid item xs={6}>
              <Box display='flex' alignItems='center' justifyContent='flex-start'>
                <Typography variant='h5'>Laboratorista</Typography>
                <IconButton size='small' sx={{ marginLeft: 1 }}>
                  <AddIcon />
                </IconButton>
              </Box>

              {/* Tabla Laboratorista */}
              <Box mt={2} sx={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                <Grid container>
                  <Grid item xs={6}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      ID LABORATORISTA
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      NOMBRE
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Filas de datos Laboratorista */}
              {laboratoristaData.map((item, index) => (
                <Grid container key={index} sx={{ borderBottom: '1px solid #e0e0e0', padding: '8px 0' }}>
                  <Grid item xs={6}>
                    <Typography>{item.idLaboratorista}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>{item.nombre}</Typography>
                  </Grid>
                </Grid>
              ))}
            </Grid>

            {/* Título Equipo con ícono */}
            <Grid item xs={6}>
              <Box display='flex' alignItems='center' justifyContent='flex-start'>
                <Typography variant='h5'>Equipo</Typography>
                <IconButton size='small' sx={{ marginLeft: 1 }}>
                  <AddIcon />
                </IconButton>
              </Box>

              {/* Tabla Equipo */}
              <Box mt={2} sx={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                <Grid container>
                  <Grid item xs={6}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      ID EQUIPO
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      EQUIPO
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Filas de datos Equipo */}
              {equipoData.map((item, index) => (
                <Grid container key={index} sx={{ borderBottom: '1px solid #e0e0e0', padding: '8px 0' }}>
                  <Grid item xs={6}>
                    <Typography>{item.idEquipo}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>{item.equipo}</Typography>
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid container spacing={2} mt={4}>
            {/* Observaciones Visita */}
            <Grid item xs={4}>
              <Typography>Observaciones Visita:</Typography>
            </Grid>
            <Grid item xs={8}>
              <TextField fullWidth label='Observaciones' placeholder='Observaciones' />
            </Grid>
          </Grid>

          {/* Botón Agregar */}
          <Grid container spacing={2} mt={2}>
            <Grid item xs={12} display='flex' justifyContent='flex-start'>
              <Button variant='contained' color='primary'>
                Agendar
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  )
}

export default AddEventSidebar
