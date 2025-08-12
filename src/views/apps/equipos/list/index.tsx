'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { Equipo } from '@/types/apps/equipoTypes'

// Component Imports
import EquipoListTable from './EquipoListTable'

const EquiposList = () => {
    // States
    const [data, setData] = useState<Equipo[]>([])

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <EquipoListTable equipoData={data} setData={setData} />
            </Grid>
        </Grid>
    )
}

export default EquiposList
