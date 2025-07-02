import React, { useState, useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'

import type { Obra } from '@/types/forms/obra'

interface PDFPreviewModalProps {
  open: boolean
  onClose: () => void
  obra: Obra | null
}

const PDFPreviewModal = ({ open, onClose, obra }: PDFPreviewModalProps) => {
  const [loading, setLoading] = useState(true)
  const [htmlContent, setHtmlContent] = useState('')

  useEffect(() => {
    const fetchPDFPreview = async () => {
      if (obra) {
        try {
          setLoading(true)
          const response = await fetch(`/api/obras/${obra.obraId}/pdf?preview=1`)

          if (!response.ok) throw new Error('Error al cargar la previsualización')
          const html = await response.text()

          setHtmlContent(html)
        } catch (error) {
          console.error('Error:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (open && obra) {
      fetchPDFPreview()
    }
  }, [open, obra])

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
          <h2 className='text-xl font-semibold'>Vista Previa PDF {obra ? `- ${obra.numeroObra}` : ''}</h2>
          <div className='flex gap-2'>
            <IconButton onClick={() => window.print()}>
              <i className='ri-download-line' />
            </IconButton>
            <IconButton onClick={onClose}>
              <i className='ri-close-line' />
            </IconButton>
          </div>
        </div>
        {loading ? (
          <div className='flex justify-center items-center h-[60vh]'>
            <CircularProgress />
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='primary'>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PDFPreviewModal 
