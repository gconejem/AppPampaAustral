'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
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
      <DialogTitle>Seleccionar Solicitudes</DialogTitle>
      <DialogContent>
        <Table sx={{ marginTop: '16px' }}>
          <TableHead>
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
        <Button
          onClick={agregarVisitasSeleccionadas} // Llama a la nueva función
          color='primary'
          disabled={selectedVisitas.length === 0}
        >
          Agregar Solicitud
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddPopUp
