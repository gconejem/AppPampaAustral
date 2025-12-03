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
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import OutlinedInput from '@mui/material/OutlinedInput'

// Type Imports
import type { TipoEquipo, Laboratorista } from '@/types/apps/equipoTypes'

export interface AreaUso {
    id: number
    nombre: string
}

interface TableFiltersProps {
    onFilterChange: (filters: {
        tipoEquipoId: string | string[]
        estado: string | string[]
        areaId: string | string[]
        funcionarioAsignadoId: string | string[]
    }) => void
    tiposEquipo: TipoEquipo[]
    laboratoristas: Laboratorista[]
    areas: AreaUso[]
    isLoading?: boolean
}

const ESTADOS_EQUIPO = [
    { value: 'Activo', label: 'Activo' },
    { value: 'Inactivo', label: 'Inactivo' },
    { value: 'Todos', label: 'Todos' },
]

const TableFilters = ({
    onFilterChange,
    tiposEquipo,
    laboratoristas,
    areas,
    isLoading = false
}: TableFiltersProps) => {
    // States
    const [selectedTipo, setSelectedTipo] = useState<string[]>(['Todos'])
    const [selectedEstado, setSelectedEstado] = useState<string[]>(['Todos'])
    const [selectedArea, setSelectedArea] = useState<string[]>(['Todos'])
    const [selectedFuncionario, setSelectedFuncionario] = useState<string[]>([])

    // Notify parent of filter changes
    useEffect(() => {
        // Si "Todos" está seleccionado, enviar string vacío, de lo contrario enviar array
        onFilterChange({
            tipoEquipoId: selectedTipo.includes('Todos') ? '' : selectedTipo,
            estado: selectedEstado.includes('Todos') ? '' : selectedEstado,
            areaId: selectedArea.includes('Todos') ? '' : selectedArea,
            funcionarioAsignadoId: selectedFuncionario.length === 0 ? '' : selectedFuncionario
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTipo, selectedEstado, selectedArea, selectedFuncionario])

    const handleClearFilters = () => {
        setSelectedTipo(['Todos'])
        setSelectedEstado(['Todos'])
        setSelectedArea(['Todos'])
        setSelectedFuncionario([])
    }

    // Handler para multiselección
    const handleMultiSelectChange = (
        event: any,
        setter: (value: string[]) => void,
        allOptions: any[]
    ) => {
        const value = event.target.value as string[]
        const previousValue = event.target.name // No lo usamos pero está disponible

        // Si se acaba de seleccionar "Todos"
        if (value.includes('Todos') && value.length > 1) {
            // Verificar si "Todos" es la última selección (recién clickeada)
            // En ese caso, dejar solo "Todos"
            const lastSelected = value[value.length - 1]
            if (lastSelected === 'Todos') {
                setter(['Todos'])
            } else {
                // Si "Todos" estaba previamente y se selecciona otro, quitar "Todos"
                const newValue = value.filter(v => v !== 'Todos')
                setter(newValue.length > 0 ? newValue : ['Todos'])
            }
        } else if (value.length === 0) {
            // Si se intenta deseleccionar todo, mantener "Todos"
            setter(['Todos'])
        } else {
            // Permitir selección normal
            setter(value)
        }
    }

    // Función para renderizar el valor seleccionado de Tipo
    const renderTipoValue = (selected: string[]) => {
        if (selected.includes('Todos')) {
            return 'Todos'
        }
        const nombres = selected.map(id => {
            const tipo = tiposEquipo.find(t => t.id.toString() === id)
            return tipo?.tipo || id
        })
        return nombres.join(', ')
    }

    // Función para renderizar el valor seleccionado de Estado
    const renderEstadoValue = (selected: string[]) => {
        if (selected.includes('Todos')) {
            return 'Todos'
        }
        return selected.join(', ')
    }

    // Función para renderizar el valor seleccionado de Área
    const renderAreaValue = (selected: string[]) => {
        if (selected.includes('Todos')) {
            return 'Todos'
        }
        const nombres = selected.map(id => {
            const area = areas.find(a => a.id.toString() === id)
            return area?.nombre || id
        })
        return nombres.join(', ')
    }

    // Función para renderizar el valor seleccionado de Funcionario
    const renderFuncionarioValue = (selected: string[]) => {
        if (selected.length === 0) {
            return 'Todos'
        }
        const nombres = selected.map(id => {
            const laboratorista = laboratoristas.find(l => l.id === id)
            return laboratorista?.name || id
        })
        return nombres.join(', ')
    }

    // Handler para multiselección sin "Todos"
    const handleMultiSelectNoTodos = (
        event: any,
        setter: (value: string[]) => void
    ) => {
        const value = event.target.value as string[]
        setter(value)
    }

    return (
        <Card>
            <CardContent>
                <Grid container spacing={4} alignItems='center'>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth disabled={isLoading}>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                multiple
                                value={selectedTipo}
                                label='Tipo'
                                onChange={(e) => handleMultiSelectChange(e, setSelectedTipo, tiposEquipo)}
                                input={<OutlinedInput label='Tipo' />}
                                renderValue={renderTipoValue}
                            >
                                <MenuItem value='Todos'>
                                    <Checkbox checked={selectedTipo.includes('Todos')} />
                                    <ListItemText primary='Todos' />
                                </MenuItem>
                                {tiposEquipo.map((tipo) => (
                                    <MenuItem key={tipo.id} value={tipo.id.toString()}>
                                        <Checkbox checked={selectedTipo.includes(tipo.id.toString())} />
                                        <ListItemText primary={tipo.tipo} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth disabled={isLoading}>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                multiple
                                value={selectedEstado}
                                label='Estado'
                                onChange={(e) => handleMultiSelectChange(e, setSelectedEstado, ESTADOS_EQUIPO.filter(e => e.value !== 'Todos'))}
                                input={<OutlinedInput label='Estado' />}
                                renderValue={renderEstadoValue}
                            >
                                <MenuItem value='Todos'>
                                    <Checkbox checked={selectedEstado.includes('Todos')} />
                                    <ListItemText primary='Todos' />
                                </MenuItem>
                                {ESTADOS_EQUIPO.filter(e => e.value !== 'Todos').map((estado) => (
                                    <MenuItem key={estado.value} value={estado.value}>
                                        <Checkbox checked={selectedEstado.includes(estado.value)} />
                                        <ListItemText primary={estado.label} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth disabled={isLoading}>
                            <InputLabel>Área de uso</InputLabel>
                            <Select
                                multiple
                                value={selectedArea}
                                label='Área de uso'
                                onChange={(e) => handleMultiSelectChange(e, setSelectedArea, areas)}
                                input={<OutlinedInput label='Área de uso' />}
                                renderValue={renderAreaValue}
                            >
                                <MenuItem value='Todos'>
                                    <Checkbox checked={selectedArea.includes('Todos')} />
                                    <ListItemText primary='Todos' />
                                </MenuItem>
                                {areas.map((area) => (
                                    <MenuItem key={area.id} value={area.id.toString()}>
                                        <Checkbox checked={selectedArea.includes(area.id.toString())} />
                                        <ListItemText primary={area.nombre} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.5}>
                        <FormControl fullWidth disabled={isLoading}>
                            <InputLabel>Funcionario asignado</InputLabel>
                            <Select
                                multiple
                                value={selectedFuncionario}
                                label='Funcionario asignado'
                                onChange={(e) => handleMultiSelectNoTodos(e, setSelectedFuncionario)}
                                input={<OutlinedInput label='Funcionario asignado' />}
                                renderValue={renderFuncionarioValue}
                            >
                                {laboratoristas.map((laboratorista) => (
                                    <MenuItem key={laboratorista.id} value={laboratorista.id}>
                                        <Checkbox checked={selectedFuncionario.includes(laboratorista.id)} />
                                        <ListItemText primary={laboratorista.name} />
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
