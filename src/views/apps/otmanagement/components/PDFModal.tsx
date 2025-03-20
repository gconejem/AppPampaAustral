'use client'

import type { ReactNode } from 'react'

import { Dialog, DialogContent, DialogActions, Button, IconButton } from '@mui/material'

import type { OrdenTrabajo } from '@/types/otTypes'

interface PDFModalProps {
  open: boolean
  onClose: () => void
  ot?: OrdenTrabajo
  children: ReactNode
}

const PDFModal = ({ open, onClose, ot, children }: PDFModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogContent>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-semibold'>Vista Previa PDF {ot ? `- ${ot.clave}` : ''}</h2>
          <div className='flex gap-2'>
            <IconButton onClick={() => window.print()}>
              <i className='ri-download-line' />
            </IconButton>
            <IconButton onClick={onClose}>
              <i className='ri-close-line' />
            </IconButton>
          </div>
        </div>
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='primary'>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PDFModal
