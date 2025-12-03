'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { TipoEquipo, Laboratorista } from '@/types/apps/equipoTypes'

export interface AreaUso {
    id: number
    nombre: string
}

interface TableFiltersProps {
    onFilterChange: (filters: {
        tipoEquipoId: string
        estado: string
        areaId: string
        funcionarioAsignadoId: string
    }) => void
    tiposEquipo: TipoEquipo[]
    laboratoristas: Laboratorista[]
    areas: AreaUso[]
    isLoading?: boolean
}

const ESTADOS_EQUIPO = [
    { value: 'Activo', label: 'Activo' },
    { value: 'Inactivo', label: 'Inactivo' },
    { value: 'En Mantención', label: 'En Mantención' },
    { value: 'Fuera de Servicio', label: 'Fuera de Servicio' }
]

const TableFilters = ({
    onFilterChange,
    tiposEquipo,
    laboratoristas,
    areas,
    isLoading = false
}: TableFiltersProps) => {
    // States
    const [selectedTipo, setSelectedTipo] = useState<string>('')
    const [selectedEstado, setSelectedEstado] = useState<string>('')
    const [selectedArea, setSelectedArea] = useState<string>('')
    const [selectedFuncionario, setSelectedFuncionario] = useState<string>('')

    // Notify parent of filter changes
    useEffect(() => {
        onFilterChange({
            tipoEquipoId: selectedTipo,
            estado: selectedEstado,
            areaId: selectedArea,
            funcionarioAsignadoId: selectedFuncionario
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTipo, selectedEstado, selectedArea, selectedFuncionario])

    const handleClearFilters = () => {
        setSelectedTipo('')
        setSelectedEstado('')
        setSelectedArea('')
        setSelectedFuncionario('')
    }

    return (
        <Card>
            <CardContent>
                <Grid container spacing={4} alignItems='center'>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth disabled={isLoading}>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={selectedTipo}
                                label='Tipo'
                                onChange={(e) => setSelectedTipo(e.target.value)}
                            >
                                <MenuItem value=''>Todos</MenuItem>
                                {tiposEquipo.map((tipo) => (
                                    <MenuItem key={tipo.id} value={tipo.id.toString()}>
                                        {tipo.tipo}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth disabled={isLoading}>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={selectedEstado}
                                label='Estado'
                                onChange={(e) => setSelectedEstado(e.target.value)}
                            >
                                <MenuItem value=''>Todos</MenuItem>
                                {ESTADOS_EQUIPO.map((estado) => (
                                    <MenuItem key={estado.value} value={estado.value}>
                                        {estado.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth disabled={isLoading}>
                            <InputLabel>Área de uso</InputLabel>
                            <Select
                                value={selectedArea}
                                label='Área de uso'
                                onChange={(e) => setSelectedArea(e.target.value)}
                            >
                                <MenuItem value=''>Todos</MenuItem>
                                {areas.map((area) => (
                                    <MenuItem key={area.id} value={area.id.toString()}>
                                        {area.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.5}>
                        <FormControl fullWidth disabled={isLoading}>
                            <InputLabel>Funcionario asignado</InputLabel>
                            <Select
                                value={selectedFuncionario}
                                label='Funcionario asignado'
                                onChange={(e) => setSelectedFuncionario(e.target.value)}
                            >
                                <MenuItem value=''>Todos</MenuItem>
                                {laboratoristas.map((laboratorista) => (
                                    <MenuItem key={laboratorista.id} value={laboratorista.id}>
                                        {laboratorista.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={12} md={0.5}>
                        <Box display='flex' justifyContent='flex-end' alignItems='center' height='100%'>
                            <Button
                                variant='text'
                                color='secondary'
                                onClick={handleClearFilters}
                                disabled={isLoading}
                                startIcon={<i className='ri-refresh-line' />}
                                sx={{ minWidth: 'auto', px: 1 }}
                                title='Limpiar filtros'
                            >
                                <i className='ri-refresh-line' style={{ fontSize: '20px' }} />
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

export default TableFilters
