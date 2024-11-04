'use client'

import React, { useState } from 'react'

import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import Acordeon from './Acordeon' // Importando el componente Acordeon

const Header = () => {
  const [sections, setSections] = useState<
    { id: number; tabs: { label: string; content: JSX.Element }[]; tabValue?: number; muestras?: any[] }[]
  >([])

  const [rows, setRows] = useState([
    { codigoInt: '100', servicio: 'Toma de Muestra', cantidad: 1, observacion: 'Texto' },
    { codigoInt: '101', servicio: 'Docilidad Cono Abrams', cantidad: 1, observacion: 'Texto' },
    { codigoInt: '102', servicio: 'Piscina de Curado', cantidad: 1, observacion: 'Texto' }
  ])

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  const handleTabChange = (sectionIndex: number) => (event: React.SyntheticEvent, newValue: number) => {
    const updatedSections = [...sections]

    updatedSections[sectionIndex].tabValue = newValue
    setSections(updatedSections)
  }

  const handleAddSection = () => {
    const newSectionId = sections.length + 1

    setSections([
      ...sections,
      {
        id: newSectionId,
        tabs: [
          {
            label: `RCM ${newSectionId}`,
            content: (
              <>
                <Grid container spacing={2} sx={{ marginTop: 2 }}>
                  <Grid item xs={1}>
                    <Chip label='Codificado' color='primary' sx={{ backgroundColor: '#D1E9FF', color: '#007BFF' }} />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField fullWidth label='Fecha Codificación' select size='small' />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField fullWidth label='Área' select size='small' />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField fullWidth label='Servicio Familia' select size='small' />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label='Servicio / Ensayo'
                      size='small'
                      InputProps={{
                        startAdornment: <i className='ri-search-line' />
                      }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField fullWidth label='Cantidad' size='small' />
                  </Grid>

                  <Grid item xs={2}>
                    <Chip label='Sin Inicio' color='success' sx={{ backgroundColor: '#DFF5D5', color: '#4CAF50' }} />
                  </Grid>
                  <Grid item xs={8}>
                    <TextField fullWidth label='Observación' size='small' />
                  </Grid>
                  <Grid item xs={2}>
                    <Button variant='contained' color='primary'>
                      + Añadir Servicio
                    </Button>
                  </Grid>
                </Grid>

                <Box sx={{ marginTop: 4 }}>
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
                        {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.codigoInt}</TableCell>
                            <TableCell>{row.servicio}</TableCell>
                            <TableCell>{row.cantidad}</TableCell>
                            <TableCell>{row.observacion}</TableCell>
                            <TableCell>
                              <IconButton sx={{ color: '#B0B0B0' }}>
                                <EditIcon />
                              </IconButton>
                              <IconButton sx={{ color: '#B0B0B0' }}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    component='div'
                    count={rows.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={event => setRowsPerPage(parseInt(event.target.value, 10))}
                  />
                </Box>
              </>
            )
          }
        ],
        muestras: []
      }
    ])
  }

  const handleAddMuestra = (sectionIndex: number) => {
    const updatedSections = [...sections]

    if (!updatedSections[sectionIndex].muestras) {
      updatedSections[sectionIndex].muestras = []
    }

    const newMuestraId = updatedSections[sectionIndex].muestras.length + 1

    updatedSections[sectionIndex].muestras.push({ id: newMuestraId })
    setSections(updatedSections)
  }

  return (
    <Box sx={{ marginBottom: 4 }}>
      <Card sx={{ marginBottom: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} sm={6}>
              <Typography variant='h5' gutterBottom sx={{ marginBottom: '15px' }}>
                Control de Muestras{' '}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} display='flex' justifyContent='flex-end'>
              <Button variant='contained' color='primary' onClick={handleAddSection} sx={{ marginBottom: '20px' }}>
                + Nuevo Registro
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {/* Fila 1: Orden de trabajo, Cliente, Número de obra, Nombre Cliente */}
            <Grid item xs={4}>
              <TextField fullWidth label='Orden de Trabajo' size='small' />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label='Cliente' size='small' />
            </Grid>
            <Grid item xs={1}>
              <TextField fullWidth label='N° Obra' size='small' />
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label='Nombre Cliente' size='small' />
            </Grid>

            {/* Fila 2: Fecha de Muestreo, Fecha de Ingreso, Tipo Servicio, Muestreado por */}
            <Grid item xs={3}>
              <TextField fullWidth label='Fecha de Muestreo' select size='small'>
                {/* Agrega opciones aquí */}
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label='Fecha de Ingreso' select size='small'>
                {/* Agrega opciones aquí */}
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label='Tipo Servicio' select size='small'>
                {/* Agrega opciones aquí */}
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label='Muestreado por...' size='small' />
            </Grid>

            {/* Fila 3: Laboratorista, Comuna, Mandante */}
            <Grid item xs={4}>
              <TextField fullWidth label='Laboratorista' size='small' />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label='Comuna' size='small' />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label='Mandante' size='small' />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {sections.map((section, sectionIndex) => (
        <Card key={section.id} sx={{ marginBottom: 4 }}>
          <CardContent>
            <Grid container spacing={2} alignItems='center'>
              <Grid item xs={10}>
                <Tabs
                  value={section.tabValue || 0}
                  onChange={handleTabChange(sectionIndex)}
                  aria-label={`RCM Tabs ${section.id}`}
                >
                  {section.tabs.map((tab, tabIndex) => (
                    <Tab
                      key={tabIndex}
                      label={
                        <Box display='flex' alignItems='center'>
                          <Typography sx={{ marginRight: '8px', color: '#1976D2', fontWeight: 600 }}>RCM</Typography>
                          <TextField
                            value={tab.label.split(' ')[1]}
                            variant='outlined'
                            size='small'
                            sx={{
                              '& .MuiInputBase-input': {
                                padding: '6px 10px',
                                textAlign: 'center',
                                width: '80px'
                              }
                            }}
                            InputProps={{
                              readOnly: true
                            }}
                          />
                        </Box>
                      }
                    />
                  ))}
                </Tabs>
              </Grid>
            </Grid>

            <Box sx={{ marginTop: 2, padding: 2 }}>
              {section.tabs[section.tabValue || 0] && section.tabs[section.tabValue || 0].content}
            </Box>

            {sections.length > 0 && (
              <Box display='flex' justifyContent='flex-end' sx={{ marginTop: 2 }}>
                <Button variant='contained' color='primary' onClick={() => handleAddMuestra(sectionIndex)}>
                  + Añadir Muestra
                </Button>
              </Box>
            )}

            <Acordeon muestras={section.muestras} />
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

export default Header
