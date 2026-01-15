// MUI Imports
import { useState } from 'react'
import {
    Box,
    Typography,
    Button,
    Card,
    TextField,
    Chip,
    IconButton,
    Checkbox,
    Grid,
    Collapse
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import LayersIcon from '@mui/icons-material/Layers'

const Step2CreateRcms = () => {
    const [expandedRcm, setExpandedRcm] = useState(true)

    const handleDuplicateLastRcm = () => {
        // TODO: Implementar lógica para duplicar último RCM
        console.log('Duplicar último RCM')
    }

    const handleNewRcm = () => {
        // TODO: Implementar lógica para crear nuevo RCM
        console.log('Nuevo RCM')
    }

    const handleToggleExpand = () => {
        setExpandedRcm(!expandedRcm)
    }

    return (
        <Card>
            <Box sx={{ p: 6 }}>
                {/* Fila superior: Título y Botones */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
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

                {/* RCM Card */}
                <Box
                    sx={{
                        bgcolor: '#E3F2FD',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header del RCM */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            bgcolor: '#E3F2FD'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton size='small' onClick={handleToggleExpand}>
                                <ExpandMoreIcon
                                    sx={{
                                        transform: expandedRcm ? 'rotate(0deg)' : 'rotate(-90deg)',
                                        transition: 'transform 0.3s'
                                    }}
                                />
                            </IconButton>
                            <Chip label='MUESTRA' color='primary' sx={{ fontWeight: 'bold' }} />
                            <Typography variant='body1' sx={{ fontWeight: 600 }}>
                                Tarjeta: LEO-2026-001
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                <LayersIcon fontSize='small' />
                                <Typography variant='body2'>Material: Suelo granular • Ítem: Base</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Checkbox />
                            <IconButton size='small'>
                                <MoreVertIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Contenido colapsable del RCM */}
                    <Collapse in={expandedRcm}>
                        <Box sx={{ p: 3, bgcolor: 'white' }}>
                            {/* Campos principales */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <TextField label='N° Tarjeta' defaultValue='LEO-2026-001' fullWidth />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField label='Tipo Material' defaultValue='Suelo granular' required fullWidth />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField label='Ítem' defaultValue='Base' required fullWidth />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField label='Procedencia' defaultValue='Cantera Los Andes' fullWidth />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField label='Sector' defaultValue='Eje A - Km 2+340' fullWidth />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField label='Cantidad de muestras' defaultValue='3' type='number' required fullWidth />
                                </Grid>
                            </Grid>

                            {/* Ensayos Asociados */}
                            <Box sx={{ mt: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                                        Ensayos Asociados
                                    </Typography>
                                    <Button startIcon={<SearchIcon />} variant='outlined' sx={{ textTransform: 'none' }}>
                                        Buscar ensayo
                                    </Button>
                                </Box>

                                {/* Lista de ensayos */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {/* Ensayo 1 */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 2,
                                            bgcolor: '#F5F5F5',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <IconButton size='small'>
                                                <EditIcon fontSize='small' />
                                            </IconButton>
                                            <Typography variant='body2'>Densidad in situ método cono arena (NCh 1516)</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <TextField size='small' defaultValue='3' type='number' sx={{ width: '80px' }} />
                                            <IconButton size='small' color='error'>
                                                <DeleteIcon fontSize='small' />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Ensayo 2 */}
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 2,
                                            bgcolor: '#F5F5F5',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <IconButton size='small'>
                                                <EditIcon fontSize='small' />
                                            </IconButton>
                                            <Typography variant='body2'>Humedad natural (NCh 1515)</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <TextField size='small' defaultValue='3' type='number' sx={{ width: '80px' }} />
                                            <IconButton size='small' color='error'>
                                                <DeleteIcon fontSize='small' />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Observaciones */}
                            <Box sx={{ mt: 4 }}>
                                <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
                                    Observaciones
                                </Typography>
                                <TextField
                                    multiline
                                    rows={3}
                                    fullWidth
                                    defaultValue='Material con presencia de finos, compactado al 95% Proctor Modificado'
                                />
                            </Box>
                        </Box>
                    </Collapse>
                </Box>
            </Box>
        </Card>
    )
}

export default Step2CreateRcms
