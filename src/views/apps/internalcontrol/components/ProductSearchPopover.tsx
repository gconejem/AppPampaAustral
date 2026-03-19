import React from 'react'
import {
    Popover,
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
    Switch
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import type { ProductoType } from '../types/rcm-types'
import { ITEMS_PER_PAGE } from '../types/rcm-types'

interface ProductSearchPopoverProps {
    anchorEl: HTMLElement | null
    onClose: () => void
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
    zIndex?: number
    autoFocus?: boolean
    width?: number | string
    maxWidth?: string
    anchorOrigin?: { vertical: 'bottom' | 'top'; horizontal: 'left' | 'right' | 'center' }
    transformOrigin?: { vertical: 'bottom' | 'top'; horizontal: 'left' | 'right' | 'center' }
}

const ProductSearchPopover: React.FC<ProductSearchPopoverProps> = ({
    anchorEl,
    onClose,
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
    zIndex = 1300,
    autoFocus = false,
    width,
    maxWidth = '500px',
    anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
    transformOrigin = { vertical: 'top', horizontal: 'right' },
}) => {
    return (
        <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={anchorOrigin}
            transformOrigin={transformOrigin}
            PaperProps={{
                sx: {
                    width: width || '100%',
                    maxWidth: width ? undefined : maxWidth,
                    maxHeight: '400px',
                    overflow: 'auto',
                    zIndex,
                }
            }}
        >
            <Box sx={{ p: 2 }}>
                <TextField
                    fullWidth
                    size='small'
                    placeholder='Buscar por nombre, descripción o norma...'
                    value={searchTerm}
                    onChange={onSearchChange}
                    autoFocus={autoFocus}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position='start'>
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                />
                {areaName && (
                    <Box sx={{ mt: 1 }}>
                        <Chip
                            label={`Área: ${areaName}`}
                            size='small'
                            color='primary'
                            variant='outlined'
                        />
                    </Box>
                )}
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch checked={showOnlyPaquetes} onChange={onShowOnlyPaquetesChange} size='small' />
                        }
                        label='Solo Paquetes'
                    />
                </Box>
            </Box>
            <List sx={{ pt: 0 }}>
                {paginatedProductos.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant='body2' color='text.secondary'>
                            No se encontraron ensayos
                        </Typography>
                    </Box>
                ) : (
                    paginatedProductos.map(producto => (
                        <ListItem
                            key={producto.id}
                            onClick={() => onSelectProduct(producto)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'action.hover' },
                                flexDirection: 'column',
                                alignItems: 'flex-start'
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant='body1'>
                                            {producto.nombre}
                                            {producto.norma && (
                                                <Typography component='span' color='text.secondary'>
                                                    {' '}- {producto.norma}
                                                </Typography>
                                            )}
                                        </Typography>
                                        {producto.esPaquete && (
                                            <Typography
                                                variant='caption'
                                                sx={{
                                                    backgroundColor: 'primary.main',
                                                    color: 'white',
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    ml: 1
                                                }}
                                            >
                                                Paquete
                                            </Typography>
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Box>
                                        <Typography variant='caption' color='text.secondary'>
                                            {producto.area} {producto.tipo && `- ${producto.tipo}`} {producto.familia && `- ${producto.familia}`}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </ListItem>
                    ))
                )}
            </List>
            <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button
                    size='small'
                    onClick={() => onPageChange(Math.max(0, productsPage - 1))}
                    disabled={productsPage === 0}
                >
                    Anterior
                </Button>
                <Typography variant='body2' sx={{ alignSelf: 'center' }}>
                    Página {productsPage + 1} de {Math.max(1, Math.ceil(totalProductos / ITEMS_PER_PAGE))}
                </Typography>
                <Button
                    size='small'
                    onClick={() => onPageChange(productsPage + 1)}
                    disabled={(productsPage + 1) * ITEMS_PER_PAGE >= totalProductos}
                >
                    Siguiente
                </Button>
            </Box>
        </Popover>
    )
}

export default ProductSearchPopover
