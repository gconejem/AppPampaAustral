import React from 'react'

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  IconButton,
  Checkbox,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EditIcon from '@mui/icons-material/Edit'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'

interface Muestra {
  id: number
  content: JSX.Element
}

interface AcordeonProps {
  muestras: Muestra[]
}

const Acordeon: React.FC<AcordeonProps> = ({ muestras }) => {
  return (
    <Box sx={{ marginTop: 4 }}>
      {muestras.map(muestra => (
        <Accordion key={muestra.id} sx={{ marginBottom: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#f5f5f5', padding: '0 16px' }}>
            <Typography>Muestra #{muestra.id}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2} alignItems='center' sx={{ padding: '16px 0' }}>
              {/* Fila 1: N° Tarjeta y Estado */}
              <Grid item xs={3} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='N° Tarjeta' size='small' />
              </Grid>
              <Grid item xs={3} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Estado' select size='small'>
                  <MenuItem value='Activo'>Activo</MenuItem>
                  <MenuItem value='Inactivo'>Inactivo</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} display='flex' justifyContent='flex-end' sx={{ marginBottom: 2 }}>
                <IconButton>
                  <EditIcon />
                </IconButton>
                <IconButton>
                  <ContentCopyIcon />
                </IconButton>
                <IconButton>
                  <DeleteIcon />
                </IconButton>
                <Button variant='contained' color='primary' sx={{ marginLeft: 2 }}>
                  Guardar Muestra
                </Button>
              </Grid>

              {/* Fila 2: Tipo Material, Ítem, Procedencia, Ubicación/Sector */}
              <Grid item xs={3} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Tipo Material' select size='small' />
              </Grid>
              <Grid item xs={3} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Ítem' select size='small' />
              </Grid>
              <Grid item xs={3} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Procedencia' size='small' />
              </Grid>
              <Grid item xs={3} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Ubicación / Sector' size='small' />
              </Grid>

              {/* Fila 3: Muestra, Fecha, Cantidad Muestras, Días, Estado, Vencimiento */}
              <Grid item xs={2} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Muestra' size='small' />
              </Grid>
              <Grid item xs={2} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Fecha' select size='small' />
              </Grid>
              <Grid item xs={2} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Cantidad Muestras' size='small' />
              </Grid>
              <Grid item xs={2} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Días' select size='small' />
              </Grid>
              <Grid item xs={2} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Estado' select size='small' />
              </Grid>
              <Grid item xs={2} display='flex' alignItems='center' sx={{ marginBottom: 2 }}>
                <Checkbox /> <Typography>Vencimiento</Typography>
              </Grid>

              {/* Fila 4: Observaciones */}
              <Grid item xs={12} sx={{ marginBottom: 2 }}>
                <TextField fullWidth label='Observaciones' multiline rows={2} size='small' />
              </Grid>

              {/* Botón Añadir Ensayo antes de las tablas */}
              <Grid item xs={12} display='flex' justifyContent='flex-end' sx={{ marginBottom: 2 }}>
                <Button variant='contained' color='primary'>
                  + Añadir Ensayo
                </Button>
              </Grid>

              {/* Tablas con margen entre ellas */}
              <Grid container spacing={2}>
                {/* Tabla de muestras */}
                <Grid item xs={12} md={6}>
                  <TableContainer component={Paper} sx={{ boxShadow: 3, padding: 2 }}>
                    <Table size='small'>
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
                          <TableCell>dd-mm-yyyy</TableCell>
                          <TableCell>
                            <Chip label='Cod.' color='primary' sx={{ backgroundColor: '#D1E9FF', color: '#007BFF' }} />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Tabla de ensayos */}
                <Grid item xs={12} md={6}>
                  <TableContainer component={Paper} sx={{ boxShadow: 3, padding: 2 }}>
                    <Table size='small'>
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
                            <Chip
                              label='Codificado'
                              color='primary'
                              sx={{ backgroundColor: '#D1E9FF', color: '#007BFF' }}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}

export default Acordeon
