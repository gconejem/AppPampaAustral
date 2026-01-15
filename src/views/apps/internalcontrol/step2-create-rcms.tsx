// MUI Imports
import { Box, Typography, Button } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

const Step2CreateRcms = () => {
    const handleDuplicateLastRcm = () => {
        // TODO: Implementar lógica para duplicar último RCM
        console.log('Duplicar último RCM')
    }

    const handleNewRcm = () => {
        // TODO: Implementar lógica para crear nuevo RCM
        console.log('Nuevo RCM')
    }

    return (
        <Box sx={{ mb: 4 }}>
            {/* Fila superior: Título y Botones */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                {/* Título y subtítulo */}
                <Box>
                    <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 1 }}>
                        Paso 2: Crear RCMs (Registro de Control de Muestras)
                    </Typography>
                    <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                        Registre las muestras, controles o servicios recolectados en terreno
                    </Typography>
                </Box>

                {/* Botones */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant='outlined'
                        startIcon={<ContentCopyIcon />}
                        onClick={handleDuplicateLastRcm}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            px: 3,
                            color: '#9C27B0',
                            borderColor: '#9C27B0',
                            '&:hover': {
                                borderColor: '#7B1FA2',
                                bgcolor: 'rgba(156, 39, 176, 0.04)'
                            }
                        }}
                    >
                        Duplicar último RCM
                    </Button>
                    <Button
                        variant='contained'
                        color='primary'
                        startIcon={<AddIcon />}
                        onClick={handleNewRcm}
                        sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
                    >
                        Nuevo RCM
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default Step2CreateRcms
