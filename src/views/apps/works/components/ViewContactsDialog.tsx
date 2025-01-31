import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'

import type { ContactoObra } from '@/types/forms/obra'

interface ViewContactsDialogProps {
  open: boolean
  onClose: () => void
  contacts: ContactoObra[]
}

const ViewContactsDialog = ({ open, onClose, contacts }: ViewContactsDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Encargado de Obra</DialogTitle>
      <DialogContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>NOMBRE</TableCell>
                <TableCell>CARGO</TableCell>
                <TableCell>EMAIL</TableCell>
                <TableCell>TELÉFONO 1</TableCell>
                <TableCell>TELÉFONO 2</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contacts.map((contact, index) => (
                <TableRow key={index}>
                  <TableCell>{contact.nombre}</TableCell>
                  <TableCell>{contact.rol}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.telefono1}</TableCell>
                  <TableCell>{contact.telefono2 || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Aceptar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewContactsDialog
