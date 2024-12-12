import React from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  Chip
} from '@mui/material'

interface HistorialPopupProps {
  open: boolean
  onClose: () => void
  data: {
    registro: string
    funcionario: string
    aplicadoA: string
    tipo: string
    estadoAnterior: string
    estadoNuevo: string
    informe: string
    fechaAccion: string
    observacion: string
  }[]
}

const HistorialPopup: React.FC<HistorialPopupProps> = ({ open, onClose, data }) => {
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          width: '95%',
          maxWidth: '1200px',
          borderRadius: '8px'
        }
      }}
    >
      <DialogTitle>Historial</DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table>
            <TableHead
              sx={{
                backgroundColor: '#f5f5f5',
                boxShadow: '0px 2px 5px rgba(0,0,0,0.1)'
              }}
            >
              <TableRow>
                <TableCell>REGISTRO</TableCell>
                <TableCell>FUNCIONARIO</TableCell>
                <TableCell>TIPO</TableCell>
                <TableCell>EST. ANTERIOR</TableCell>
                <TableCell>EST. NUEVO</TableCell>
                <TableCell>INFORME</TableCell>
                <TableCell>FECHA ACCIÓN</TableCell>
                <TableCell>OBSERVACIÓN</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.registro}</TableCell>
                  <TableCell>{row.funcionario}</TableCell>
                  <TableCell>{row.tipo}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.estadoAnterior}
                      sx={{
                        backgroundColor: '#fff4d6',
                        color: '#ffa726',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.estadoNuevo}
                      sx={{
                        backgroundColor: '#d1f9e4',
                        color: '#43a047',
                        fontWeight: 'bold'
                      }}
                    />
                  </TableCell>
                  <TableCell>{row.informe}</TableCell>
                  <TableCell>{row.fechaAccion}</TableCell>
                  <TableCell>{row.observacion}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component='div'
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary'>
          Cerrar
        </Button>
        <Button onClick={onClose} variant='contained' color='primary'>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default HistorialPopup
