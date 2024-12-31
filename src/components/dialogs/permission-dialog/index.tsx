// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import { useState, useEffect } from 'react'

type PermissionDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  data?: string
  onSubmit?: (data: { name: string; assignedTo: string[] }) => void
}

const AddContent = ({ handleClose, onSubmit }: { handleClose: () => void; onSubmit?: (data: any) => void }) => {
  const [name, setName] = useState('')
  const [isCore, setIsCore] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    const permissionData = {
      name: name.trim(),
      assignedTo: isCore ? ['core'] : []
    }

    if (onSubmit) {
      onSubmit(permissionData)
    }

    setName('')
    setIsCore(false)
    handleClose()
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <IconButton onClick={handleClose} className='absolute block-start-4 inline-end-4'>
          <i className='ri-close-line text-textSecondary' />
        </IconButton>
        <TextField
          fullWidth
          label='Permission Name'
          variant='outlined'
          placeholder='Enter Permission Name'
          className='mbe-2'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={isCore}
              onChange={(e) => setIsCore(e.target.checked)}
            />
          }
          label='Set as core permission'
        />
      </DialogContent>
      <DialogActions className='max-sm:flex-col max-sm:items-center gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16'>
        <Button type='submit' variant='contained'>
          Create Permission
        </Button>
        <Button onClick={handleClose} variant='outlined'>
          Discard
        </Button>
      </DialogActions>
    </form>
  )
}

const EditContent = ({ handleClose, data, onSubmit }: { handleClose: () => void; data: string; onSubmit?: (data: any) => void }) => {
  const [name, setName] = useState('')
  const [isCore, setIsCore] = useState(false)

  useEffect(() => {
    // Cargar los datos del permiso cuando se abre el diálogo de edición
    const fetchPermissionData = async () => {
      try {
        const response = await fetch(`/api/permissions/${data}`)
        const permissionData = await response.json()
        setName(permissionData.name)
        setIsCore(permissionData.assignedTo.includes('core'))
      } catch (error) {
        console.error('Error al cargar el permiso:', error)
      }
    }

    if (data) {
      fetchPermissionData()
    }
  }, [data])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    if (onSubmit) {
      onSubmit({
        name: name.trim(),
        assignedTo: isCore ? ['core'] : []
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogContent className='overflow-visible pbs-0 sm:pli-16'>
        <IconButton onClick={handleClose} className='absolute block-start-4 inline-end-4'>
          <i className='ri-close-line text-textSecondary' />
        </IconButton>
        <Alert severity='warning' className='mbe-8'>
          <AlertTitle>Warning!</AlertTitle>
          By editing the permission name, you might break the system permissions functionality. Please ensure you're
          absolutely certain before proceeding.
        </Alert>
        <TextField
          fullWidth
          label='Permission Name'
          variant='outlined'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={isCore}
              onChange={(e) => setIsCore(e.target.checked)}
            />
          }
          label='Set as core permission'
        />
      </DialogContent>
      <DialogActions className='max-sm:flex-col max-sm:items-center gap-2 justify-center pbs-0 sm:pbe-16 sm:pli-16'>
        <Button type='submit' variant='contained'>
          Update Permission
        </Button>
        <Button onClick={handleClose} variant='outlined'>
          Cancel
        </Button>
      </DialogActions>
    </form>
  )
}

const PermissionDialog = ({ open, setOpen, data, onSubmit }: PermissionDialogProps) => {
  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle variant='h4' className='flex flex-col gap-2 text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        {data ? 'Edit Permission' : 'Add New Permission'}
        <Typography component='span' className='flex flex-col text-center'>
          {data ? 'Edit permission as per your requirements.' : 'Permissions you may use and assign to your users.'}
        </Typography>
      </DialogTitle>
      {data ? (
        <EditContent handleClose={handleClose} data={data} onSubmit={onSubmit} />
      ) : (
        <AddContent handleClose={handleClose} onSubmit={onSubmit} />
      )}
    </Dialog>
  )
}

export default PermissionDialog
