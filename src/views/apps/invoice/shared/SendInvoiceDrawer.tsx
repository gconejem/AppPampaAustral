// React Imports
import { useState } from 'react'
import type { FormEvent } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

type Props = {
  open: boolean
  handleClose: () => void
}

type FormDataType = {
  from: string
  to: string
  subject: string
  message: string
}

// Vars
const initialData: FormDataType = {
  from: 'shelbyComapny@email.com',
  to: 'qConsolidated@email.com',
  subject: 'Asunto de ejemplo',
  message: `

Texto de ejemplo`
}

const SendInvoiceDrawer = ({ open, handleClose }: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleClose()
    setFormData(initialData)
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Enviar Correo</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col items-start gap-5'>
          <TextField
            fullWidth
            label='De'
            variant='outlined'
            value={formData.from}
            onChange={e => setFormData({ ...formData, from: e.target.value })}
          />
          <TextField
            fullWidth
            label='Para'
            variant='outlined'
            value={formData.to}
            onChange={e => setFormData({ ...formData, to: e.target.value })}
          />
          <TextField
            fullWidth
            label='Asunto'
            variant='outlined'
            value={formData.subject}
            onChange={e => setFormData({ ...formData, subject: e.target.value })}
          />
          <TextField
            fullWidth
            label='Mensaje'
            variant='outlined'
            multiline
            rows={10}
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
          />
          <Chip
            size='small'
            color='primary'
            variant='tonal'
            className='rounded'
            label='Invoice Attached'
            icon={<i className='ri-attachment-line' />}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' color='primary' type='submit'>
              Enviar
            </Button>
            <Button variant='outlined' color='secondary' type='reset' onClick={handleReset}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default SendInvoiceDrawer
