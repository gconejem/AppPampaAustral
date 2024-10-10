'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Grid,
  TextField
} from '@mui/material'

// Datos simulados para las solicitudes con múltiples visitas
const solicitudesData = {
  'Obra 1': [
    {
      solicitud: '01',
      visitas: [
        { visita: 'Visita 1', ots: 'OT001', estado: 'Sin Inicio', valor: 100 },
        { visita: 'Visita 2', ots: 'OT002', estado: 'Sin Inicio', valor: 150 }
      ]
    },
    {
      solicitud: '02',
      visitas: [{ visita: 'Visita 1', ots: 'OT003', estado: 'Sin Inicio', valor: 200 }]
    }
  ]
}

const AddPopUp = ({ open, obra, handleClose, handleAgregarVisitas }) => {
  const [selectedVisitas, setSelectedVisitas] = useState([])

  const handleSelectVisita = (solicitudIndex, visitaIndex) => {
    const selectedKey = `${solicitudIndex}-${visitaIndex}`

    setSelectedVisitas(prev =>
      prev.includes(selectedKey) ? prev.filter(i => i !== selectedKey) : [...prev, selectedKey]
    )
  }

  const handleSelectAll = () => {
    const allVisitas = []

    solicitudesData[obra]?.forEach((solicitud, solicitudIndex) => {
      solicitud.visitas.forEach((_, visitaIndex) => {
        allVisitas.push(`${solicitudIndex}-${visitaIndex}`)
      })
    })
    setSelectedVisitas(allVisitas)
  }

  const agregarVisitasSeleccionadas = () => {
    const visitasAAgregar = []

    selectedVisitas.forEach(selectedKey => {
      const [solicitudIndex, visitaIndex] = selectedKey.split('-')
      const solicitud = solicitudesData[obra][solicitudIndex]
      const visita = solicitud.visitas[visitaIndex]

      visitasAAgregar.push({
        solicitud: solicitud.solicitud,
        visita: visita.visita,
        ots: visita.ots,
        estado: visita.estado,
        valor: visita.valor
      })
    })

    handleAgregarVisitas(visitasAAgregar)
    setSelectedVisitas([]) // Limpiamos las visitas seleccionadas
    handleClose() // Cerramos el diálogo
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>Solicitudes Pendientes</DialogTitle>

      {/* Header debajo del título */}
      <DialogContent>
        <Grid container spacing={2} sx={{ marginBottom: '16px' }}>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Fecha Inicio'
              fullWidth
              sx={{
                width: '280px', // Ajusta el ancho aquí
                '& .MuiInputBase-root': {
                  height: '40px' // Ajusta la altura del input
                },
                '& .MuiInputLabel-root': {
                  fontSize: '12px', // Ajusta el tamaño del texto del label
                  transform: 'translate(14px, 12px) scale(1)' // Ajusta la posición del label
                },
                '& .MuiInputLabel-shrink': {
                  transform: 'translate(14px, -6px) scale(0.75)' // Ajusta el label cuando el campo está enfocado o tiene texto
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Fecha Fin'
              fullWidth
              sx={{
                width: '280px', // Ajusta el ancho aquí
                '& .MuiInputBase-root': {
                  height: '40px' // Ajusta la altura del input
                },
                '& .MuiInputLabel-root': {
                  fontSize: '12px', // Ajusta el tamaño del texto del label
                  transform: 'translate(14px, 12px) scale(1)' // Ajusta la posición del label
                },
                '& .MuiInputLabel-shrink': {
                  transform: 'translate(14px, -6px) scale(0.75)' // Ajusta el label cuando el campo está enfocado o tiene texto
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              startIcon={<ContentCopyIcon />} // Aquí reemplazamos el Checkbox por el ícono
              sx={{ width: '280px', height: '40px' }}
            >
              Seleccionar Todo
            </Button>
          </Grid>
        </Grid>

        {/* Tabla de solicitudes */}
        <Table sx={{ marginTop: '16px' }}>
          <TableHead
            sx={{
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#F5F5F5', // Leve gris
              borderBottom: '1px solid #E0E0E0' // Borde inferior similar
            }}
          >
            <TableRow>
              <TableCell>N° Solicitud</TableCell>
              <TableCell>Visitas</TableCell>
              <TableCell>OTS</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>
                <Checkbox
                  checked={selectedVisitas.length === Object.keys(solicitudesData[obra] || {}).length}
                  onChange={handleSelectAll}
                />
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {solicitudesData[obra]?.map((solicitud, solicitudIndex) =>
              solicitud.visitas.map((visita, visitaIndex) => (
                <TableRow key={`${solicitudIndex}-${visitaIndex}`}>
                  {visitaIndex === 0 && <TableCell rowSpan={solicitud.visitas.length}>{solicitud.solicitud}</TableCell>}
                  <TableCell>{visita.visita}</TableCell>
                  <TableCell>{visita.ots}</TableCell>
                  <TableCell>{visita.estado}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={selectedVisitas.includes(`${solicitudIndex}-${visitaIndex}`)}
                      onChange={() => handleSelectVisita(solicitudIndex, visitaIndex)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color='primary'>
          Cancelar
        </Button>
        <Button onClick={agregarVisitasSeleccionadas} color='primary' disabled={selectedVisitas.length === 0}>
          Agregar Solicitud
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddPopUp
