'use client'

// React Imports
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Grid from '@mui/material/Grid'

// Component Imports
import StepperVerticalWithNumbersEdit from '@views/apps/encoder/StepperVerticalWithNumbersEdit'
import Header from '@views/apps/encoder/header'

export default function EditRCMPage() {
    const params = useParams()
    const rcmId = (params?.id as string) || ''
    const [rcmEstado, setRcmEstado] = useState<string>('CODIFICADO')
    const [otData, setOtData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const handleRcmEstadoChange = (estado: string) => {
        setRcmEstado(estado)
    }

    const handleOtDataLoad = (data: any) => {
        setOtData(data)
        setLoading(false)
    }

    return (
        <Grid container spacing={6}>
            {/* Header */}
            <Grid item xs={12}>
                <Header
                    otData={otData}
                    rcmEstado={rcmEstado}
                    loading={loading}
                />
            </Grid>

            {/* Edit Form */}
            <Grid item xs={12}>
                <StepperVerticalWithNumbersEdit
                    rcmId={rcmId}
                    onRcmEstadoChange={handleRcmEstadoChange}
                    onOtDataLoad={handleOtDataLoad}
                />
            </Grid>
        </Grid>
    )
}
