import React from 'react'
import {
    Box,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    Typography,
    Chip,
    Button,
    FormControlLabel,
    Switch,
    Paper
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import type { ProductoType } from '../types/rcm-types'
import { ITEMS_PER_PAGE } from '../types/rcm-types'

interface ProductSearchInlineProps {
    searchTerm: string
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    paginatedProductos: ProductoType[]
    totalProductos: number
    productsPage: number
    onPageChange: (page: number) => void
    areaName?: string
    showOnlyPaquetes: boolean
    onShowOnlyPaquetesChange: () => void
    onSelectProduct: (producto: ProductoType) => void
    width?: number | string
    maxWidth?: string
}

const ProductSearchInline: React.FC<ProductSearchInlineProps> = ({
    searchTerm,
    onSearchChange,
    paginatedProductos,
    totalProductos,
    productsPage,
    onPageChange,
    areaName,
    showOnlyPaquetes,
    onShowOnlyPaquetesChange,
    onSelectProduct,
    maxWidth = '100%',
}) => {
    return (
        <Paper 
            elevation={0} 
            sx={{ 
                border: '1px solid #E0E0E0', 
                borderRadius: '8px', 
                overflow: 'hidden',
                backgroundColor: '#FAFAFA',
                mt: 2,
                maxWidth
            }}
        >
            <Box sx={{ p: 2, borderBottom: '1px solid #E0E0E0', backgroundColor: '#FFFFFF' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#1976D2' }}>
                    Añadir nuevos ensayos o servicios
                </Typography>
                <TextField
                    fullWidth
                    size='small'
                    placeholder='Buscar por nombre, descripción o norma...'
                    value={searchTerm}
                    onChange={onSearchChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position='start'>
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        sx: { backgroundColor: '#F5F5F5' }
                    }}
                />
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {areaName && (
                        <Chip
                            label={`Área: ${areaName}`}
                            size='small'
                            color='primary'
                            variant='outlined'
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                    <FormControlLabel
                        control={
                            <Switch checked={showOnlyPaquetes} onChange={onShowOnlyPaquetesChange} size='small' />
                        }
                        label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Solo Paquetes</Typography>}
                    />
                </Box>
            </Box>
            
            <List sx={{ pt: 0, maxHeight: '350px', overflowY: 'auto', backgroundColor: '#FFFFFF' }}>
                {paginatedProductos.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant='body2' color='text.secondary'>
                            No se encontraron ensayos que coincidan con la búsqueda.
                        </Typography>
                    </Box>
                ) : (
                    paginatedProductos.map(producto => (
                        <ListItem
                            key={producto.id}
                            onClick={() => onSelectProduct(producto)}
                            sx={{
                                cursor: 'pointer',
                                borderBottom: '1px solid #F0F0F0',
                                '&:hover': { backgroundColor: '#EEF6FF' },
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                py: 1.5,
                                transition: 'background-color 0.2s'
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                            {producto.nombre}
                                        </Typography>
                                        {producto.norma && (
                                            <Typography component='span' variant="caption" color='text.secondary'>
                                                - {producto.norma}
                                            </Typography>
                                        )}
                                        {producto.esPaquete && (
                                            <Chip label="Paquete" size="small" color="info" sx={{ height: 18, fontSize: '10px', fontWeight: 700 }} />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 0.5 }}>
                                        <Typography variant='caption' color='text.secondary'>
                                            {producto.area} {producto.tipo && `• ${producto.tipo}`} {producto.familia && `• ${producto.familia}`}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))
                )}
            </List>
            
            <Box sx={{ p: 1.5, borderTop: '1px solid #E0E0E0', display: 'flex', justifyContent: 'center', gap: 2, backgroundColor: '#FAFAFA' }}>
                <Button
                    size='small'
                    variant="text"
                    onClick={() => onPageChange(Math.max(0, productsPage - 1))}
                    disabled={productsPage === 0}
                    sx={{ textTransform: 'none' }}
                >
                    Anterior
                </Button>
                <Typography variant='caption' sx={{ alignSelf: 'center', fontWeight: 600 }}>
                    Página {productsPage + 1} de {Math.max(1, Math.ceil(totalProductos / ITEMS_PER_PAGE))}
                </Typography>
                <Button
                    size='small'
                    variant="text"
                    onClick={() => onPageChange(productsPage + 1)}
                    disabled={(productsPage + 1) * ITEMS_PER_PAGE >= totalProductos}
                    sx={{ textTransform: 'none' }}
                >
                    Siguiente
                </Button>
            </Box>
        </Paper>
    )
}

export default ProductSearchInline
