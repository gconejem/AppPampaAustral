import { Box, Typography, Modal } from '@mui/material'

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  html: string
}

const PreviewModal = ({ open, onClose, html }: PreviewModalProps) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
        <Typography variant="h6" component="h2">
          Vista previa
        </Typography>
        <Box sx={{ mt: 2 }}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </Box>
        <Typography sx={{ mt: 2 }}>
          Esta es una vista previa del documento.
        </Typography>
      </Box>
    </Modal>
  )
}

export default PreviewModal

{/* Observaciones */ }

{
  cotizacion.observaciones && (
    <Box sx={{ mb: 4 }}>
      <Typography variant='subtitle2' sx={{ mb: 1 }}>
        Observaciones
      </Typography>
      <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
        {cotizacion.observaciones}
      </Typography>
    </Box>
  )
}

{/* Notas */ }

{
  cotizacion.notas && (
    <Box sx={{ mb: 4 }}>
      <Typography variant='subtitle2' sx={{ mb: 1 }}>
        Notas
      </Typography>
      <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
        {cotizacion.notas}
      </Typography>
    </Box>
  )
}

{/* Totales */ } 
