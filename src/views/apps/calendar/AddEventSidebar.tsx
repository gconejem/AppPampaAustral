// React Imports
import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import StarIcon from '@mui/icons-material/Star'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'

// Header + Formulario
const AddEventSidebar = ({ addEventSidebarOpen, handleAddEventSidebarToggle }) => {
  const [values, setValues] = useState({
    tipoVisita: '',
    cliente: '',
    obra: '',
    solicitud: '',
    sectorComercial: '',
    region: '',
    comuna: '',
    direccion: '',
    referencia: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setValues({ ...values, [field]: value })
  }

  return (
    <Drawer
      anchor='right'
      open={addEventSidebarOpen}
      onClose={handleAddEventSidebarToggle}
      sx={{ '& .MuiDrawer-paper': { width: ['100%', '90vw'], maxWidth: '100vw' } }}
    >
      <Box sx={{ maxWidth: '1900px', margin: '0 auto', padding: '16px' }}>
        {/* Header */}
        <Grid container alignItems='center' justifyContent='space-between'>
          <Typography variant='h6'>
            Agendar Una Visita <span style={{ color: 'red' }}>* Campo obligatorio</span>
          </Typography>
          <Box display='flex' alignItems='center' gap={2}>
            <Button variant='outlined' color='error'>
              Cancelar
            </Button>
            <Box display='flex' alignItems='center'>
              <Typography variant='body2'>Estado</Typography>
              <IconButton size='small'>
                <EditIcon fontSize='small' />
              </IconButton>
            </Box>
          </Box>
        </Grid>

        {/* Formulario */}
        <Grid container spacing={2} mt={4}>
          {/* Primera Fila */}
          <Grid item xs={12} sm={2}>
            <Typography>Tipo de Visita:</Typography>
          </Grid>
          <Grid item xs={2} sm={1}>
            <FormControlLabel control={<Checkbox />} label='Evento' labelPlacement='end' />
          </Grid>
          <Grid item xs={2} sm={1}>
            <FormControlLabel control={<Checkbox />} label='Recurrente' labelPlacement='end' />
          </Grid>

          {/* Fecha, Hora Inicio, Hora Término */}
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Fecha</InputLabel>
              <Select value={values.tipoVisita} onChange={e => handleInputChange('tipoVisita', e.target.value)}>
                <MenuItem value='Fecha 1'>Fecha 1</MenuItem>
                <MenuItem value='Fecha 2'>Fecha 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label='Hora Inicio' fullWidth />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label='Hora Término' fullWidth />
          </Grid>

          {/* Segunda Fila */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Cliente *</InputLabel>
              <Select value={values.cliente} onChange={e => handleInputChange('cliente', e.target.value)}>
                <MenuItem value='Cliente 1'>Cliente 1</MenuItem>
                <MenuItem value='Cliente 2'>Cliente 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Obra *</InputLabel>
              <Select value={values.obra} onChange={e => handleInputChange('obra', e.target.value)}>
                <MenuItem value='Obra 1'>Obra 1</MenuItem>
                <MenuItem value='Obra 2'>Obra 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={11} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Solicitud</InputLabel>
              <Select value={values.solicitud} onChange={e => handleInputChange('solicitud', e.target.value)}>
                <MenuItem value='Solicitud 1'>Solicitud 1</MenuItem>
                <MenuItem value='Solicitud 2'>Solicitud 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={1} sm={1} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <IconButton size='large'>
              <AddIcon fontSize='large' />
            </IconButton>
          </Grid>

          {/* Tercera Fila */}
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Región *</InputLabel>
              <Select value={values.region} onChange={e => handleInputChange('region', e.target.value)}>
                <MenuItem value='Región 1'>Región 1</MenuItem>
                <MenuItem value='Región 2'>Región 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Comuna *</InputLabel>
              <Select value={values.comuna} onChange={e => handleInputChange('comuna', e.target.value)}>
                <MenuItem value='Comuna 1'>Comuna 1</MenuItem>
                <MenuItem value='Comuna 2'>Comuna 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Cuarta Fila - Dirección y Referencia */}
          <Grid item xs={5}>
            <TextField label='Dirección *' fullWidth />
          </Grid>
          <Grid item xs={1}>
            <IconButton size='large'>
              <EditIcon />
            </IconButton>
          </Grid>
          <Grid item xs={6}>
            <TextField label='Referencia' fullWidth />
          </Grid>

          {/* Quinta Fila - Lista con Rol, Nombre y Acciones */}
          <Grid container spacing={2} mt={4} alignItems='center' sx={{ paddingLeft: '15px' }}>
            {/* Cabeceras de la tabla */}
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

            {/* Filas de datos */}
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

            {/* Segunda fila de ejemplo */}
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
          <Grid container spacing={2} mt={4} alignItems='center' sx={{ paddingLeft: '15px' }}>
            {/* Título "Detalle" */}
            <Grid item xs={12}>
              <Typography sx={{ fontSize: '20px', fontWeight: 'bold', mb: 4 }}>Detalle</Typography>
            </Grid>

            {/* Campos debajo del título */}
            <Grid container item spacing={2} alignItems='center'>
              {/* Servicio - xs={3} */}
              <Grid item xs={3}>
                <TextField
                  label='Servicio'
                  variant='outlined'
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              {/* Cantidad - xs={2} */}
              <Grid item xs={2}>
                <TextField label='Cantidad' variant='outlined' fullWidth />
              </Grid>

              {/* Descripción - xs={4} */}
              <Grid item xs={4}>
                <TextField label='Descripción' variant='outlined' fullWidth />
              </Grid>

              {/* Checkbox 2a Visita - xs={1} */}
              <Grid item xs={1}>
                <FormControlLabel control={<Checkbox />} label='2a Visita' />
              </Grid>

              {/* Botón Agregar - xs={2} */}
              <Grid item xs={2}>
                <Button variant='contained' color='primary' fullWidth startIcon={<AddIcon />}>
                  Agregar
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid container spacing={2} mt={4} alignItems='center' sx={{ paddingLeft: '15px' }}>
            {/* Cabeceras de la tabla */}
            <Grid item xs={2}>
              <Typography variant='subtitle2' align='left'>
                CÓDIGO
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant='subtitle2' align='left'>
                SERVICIOS
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant='subtitle2' align='left'>
                CANTIDAD
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant='subtitle2' align='left'>
                DESCRIPCIÓN / OBSERVACIÓN
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant='subtitle2' align='left'>
                ACCIÓN
              </Typography>
            </Grid>

            {/* Filas de datos, ejemplo 1 */}
            <Grid item xs={2}>
              <Typography>123</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>Servicios elegidos...</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>10</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>Texto</Typography>
            </Grid>
            <Grid item xs={2}>
              <IconButton size='small'>
                <EditIcon />
              </IconButton>
              <IconButton size='small'>
                <DeleteIcon />
              </IconButton>
            </Grid>

            {/* Filas de datos, ejemplo 2 */}
            <Grid item xs={2}>
              <Typography>124</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>Servicios elegidos...</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>2</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>Texto</Typography>
            </Grid>
            <Grid item xs={2}>
              <IconButton size='small'>
                <EditIcon />
              </IconButton>
              <IconButton size='small'>
                <DeleteIcon />
              </IconButton>
            </Grid>

            {/* Filas de datos, ejemplo 3 */}
            <Grid item xs={2}>
              <Typography>125</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>Control de Compactación</Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography>1</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography>Texto</Typography>
            </Grid>
            <Grid item xs={2}>
              <IconButton size='small'>
                <EditIcon />
              </IconButton>
              <IconButton size='small'>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  )
}

export default AddEventSidebar
