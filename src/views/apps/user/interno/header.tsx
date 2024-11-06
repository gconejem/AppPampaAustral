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
  TablePagination,
  Collapse
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

import Acordeon from './Acordeon' // Importando el componente Acordeon

const Header = () => {
  const [expanded, setExpanded] = useState(true)

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

  // Alterna el estado de la sección inicial entre expandido y colapsado
  const toggleExpanded = () => {
    setExpanded(prev => !prev)
  }

  const handleAddSection = () => {
    setExpanded(false) // Colapsa la sección inicial al crear un nuevo registro
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
            <Grid item xs={12} sm={6} onClick={toggleExpanded} sx={{ cursor: 'pointer' }}>
              <Typography variant='h5' gutterBottom sx={{ marginBottom: '15px' }}>
                Control de Muestras
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} display='flex' justifyContent='flex-end'>
              <Button variant='contained' color='primary' onClick={handleAddSection} sx={{ marginBottom: '20px' }}>
                + Nuevo Registro
              </Button>
            </Grid>
          </Grid>

          {/* Contenido colapsable */}
          <Collapse in={expanded}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField fullWidth label='Orden de Trabajo' size='small' />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label='Cliente' size='small' />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label='N° Obra' size='small' />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label='Fecha de Muestreo' size='small' />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label='Muestreado por....' select size='small'>
                  {/* Opciones */}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label='Comuna' select size='small'>
                  {/* Opciones */}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label='Fecha de Ingreso' select size='small'>
                  {/* Opciones */}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label='Laboratorista' size='small' />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label='Mandante' size='small' />
              </Grid>
              <Grid item xs={4}>
                <TextField fullWidth label='Tipo de Servcio' size='small' />
              </Grid>
            </Grid>
          </Collapse>
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
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

export default Header
