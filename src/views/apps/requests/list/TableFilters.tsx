'use client'

// React Imports
import { Fragment } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

// Type Imports
import type { ThemeColor } from '@core/types'

type Props = {
  setData: (val: any) => void
  tableData: any[]
}

const TableFilters = ({ setData, tableData }: Props) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant='h5' component='h2' gutterBottom sx={{ ml: 2 }}>
          Lista de Solicitudes
        </Typography>
      </Grid>
    </Grid>
  )
}

export default TableFilters
