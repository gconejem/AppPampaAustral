import React from 'react'

import { Modal, Box, Typography, TextField, Button } from '@mui/material'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 1,
  boxShadow: 24,
  p: 4
}

interface CreatePackageModalProps {
  open: boolean
  handleClose: () => void
}

const CreatePackageModal: React.FC<CreatePackageModalProps> = ({ open, handleClose }) => {
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant='h6' mb={2}>
          Crear Nuevo Paquete
        </Typography>
        <TextField fullWidth label='SKU' margin='normal' />
        <TextField fullWidth label='Área' margin='normal' />
        <TextField fullWidth label='Familia' margin='normal' />
        <div className='flex justify-end mt-4'>
          <Button onClick={handleClose} color='primary' variant='contained'>
            Guardar
          </Button>
        </div>
      </Box>
    </Modal>
  )
}

export default CreatePackageModal
