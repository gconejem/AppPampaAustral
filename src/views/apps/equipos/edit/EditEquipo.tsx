'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import axios from 'axios'

// Type Imports
import type { Equipo, EquipoFormData, TipoEquipo, Laboratorista } from '@/types/apps/equipoTypes'

type Props = {
    open: boolean
    handleClose: () => void
    setData: (data: Equipo[] | ((prevData: Equipo[]) => Equipo[])) => void
    equipo: Equipo
    tiposEquipo: TipoEquipo[]
    laboratoristas: Laboratorista[]
}

const EditEquipo = ({ open, handleClose, setData, equipo, tiposEquipo, laboratoristas }: Props) => {
    // States
    const [isLoading, setIsLoading] = useState(false)

    // Hooks
    const {
        control,
        reset,
        handleSubmit,
        formState: { errors }
    } = useForm<EquipoFormData>()

    useEffect(() => {
        if (equipo && open) {
            reset({
                codigo: equipo.codigo,
                nombre: equipo.nombre,
                tipoEquipoId: equipo.tipoEquipoId,
                descripcion: equipo.descripcion || '',
                serie: equipo.serie || '',
                funcionarioAsignadoId: equipo.funcionarioAsignadoId || null,
                estado: equipo.estado,
                observaciones: equipo.observaciones || ''
            })
        }
    }, [equipo, open, reset])

    const onSubmit = async (data: EquipoFormData) => {
        setIsLoading(true)

        try {
            const payload = {
                ...data,
                tipoEquipoId: data.tipoEquipoId || undefined,
                funcionarioAsignadoId: data.funcionarioAsignadoId || null
            }

            const response = await axios.put(`/api/equipos/${equipo.id}`, payload)

            setData(prevData =>
                prevData.map(item =>
                    item.id === equipo.id ? response.data : item
                )
            )

            toast.success('Equipo actualizado correctamente')
            handleClose()
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'Error al actualizar el equipo'
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = () => {
        reset()
        handleClose()
    }

    return (
        <Drawer
            open={open}
            anchor='right'
            variant='temporary'
            onClose={handleReset}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
        >
            <div className='flex items-center justify-between pli-5 plb-4'>
                <Typography variant='h5'>Editar Equipo</Typography>
                <IconButton size='small' onClick={handleReset}>
                    <i className='ri-close-line text-2xl' />
                </IconButton>
            </div>
            <Divider />
            <div className='p-5'>
                <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Controller
                                name='codigo'
                                control={control}
                                rules={{ required: 'Este campo es requerido' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label='Código *'
                                        placeholder='Ej: EQ-001'
                                        error={!!errors.codigo}
                                        helperText={errors.codigo?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name='nombre'
                                control={control}
                                rules={{ required: 'Este campo es requerido' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label='Nombre *'
                                        placeholder='Nombre del equipo'
                                        error={!!errors.nombre}
                                        helperText={errors.nombre?.message}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name='tipoEquipoId'
                                control={control}
                                rules={{ required: 'Este campo es requerido' }}
                                render={({ field }) => (
                                    <FormControl fullWidth error={!!errors.tipoEquipoId}>
                                        <InputLabel>Tipo de Equipo *</InputLabel>
                                        <Select
                                            {...field}
                                            value={field.value || ''}
                                            label='Tipo de Equipo *'
                                        >
                                            {tiposEquipo.map(tipo => (
                                                <MenuItem key={tipo.id} value={tipo.id}>
                                                    {tipo.tipo}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.tipoEquipoId && (
                                            <Typography variant='caption' color='error' sx={{ mt: 1, ml: 2 }}>
                                                {errors.tipoEquipoId.message}
                                            </Typography>
                                        )}
                                    </FormControl>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name='serie'
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label='Número de Serie'
                                        placeholder='Número de serie del equipo'
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name='funcionarioAsignadoId'
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Laboratorista Asignado</InputLabel>
                                        <Select
                                            {...field}
                                            value={field.value || ''}
                                            label='Laboratorista Asignado'
                                        >
                                            <MenuItem value=''>
                                                <em>Sin asignar</em>
                                            </MenuItem>
                                            {laboratoristas.map(laboratorista => (
                                                <MenuItem key={laboratorista.id} value={laboratorista.id}>
                                                    {laboratorista.name} {laboratorista.rut && `(${laboratorista.rut})`}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name='estado'
                                control={control}
                                render={({ field }) => (
                                    <FormControl fullWidth>
                                        <InputLabel>Estado</InputLabel>
                                        <Select {...field} label='Estado'>
                                            <MenuItem value='Activo'>Activo</MenuItem>
                                            <MenuItem value='Inactivo'>Inactivo</MenuItem>
                                            <MenuItem value='En Mantención'>En Mantención</MenuItem>
                                            <MenuItem value='Fuera de Servicio'>Fuera de Servicio</MenuItem>
                                        </Select>
                                    </FormControl>
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name='descripcion'
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label='Descripción'
                                        placeholder='Descripción del equipo'
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Controller
                                name='observaciones'
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label='Observaciones'
                                        placeholder='Observaciones adicionales'
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>

                    <div className='flex items-center gap-4 pt-4'>
                        <Button variant='contained' type='submit' disabled={isLoading}>
                            {isLoading ? 'Actualizando...' : 'Actualizar Equipo'}
                        </Button>
                        <Button variant='outlined' color='error' type='reset' onClick={handleReset}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            </div>
        </Drawer>
    )
}

export default EditEquipo
