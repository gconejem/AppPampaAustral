'use client'

// MUI Imports
import dynamic from 'next/dynamic'

import Grid from '@mui/material/Grid'

// Component Imports

// Type Imports
import type { Obra } from '@/types/forms/obra'

// Importaciones dinámicas para evitar problemas de SSR
const UserListCards = dynamic(() => import('./UserListCards'), { ssr: false })
const WorkListTable = dynamic(() => import('./WorkListTable'), { ssr: false })

export interface WorkListProps {
  userData?: Obra[]
}

const WorkList = ({ userData }: WorkListProps): JSX.Element => {
  if (!userData) return <div>No hay datos disponibles</div>

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <UserListCards />
      </Grid>
      <Grid item xs={12}>
        <WorkListTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default WorkList
