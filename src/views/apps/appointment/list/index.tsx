// index.tsx

'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import VisitListTable from './VisitListTable'
import OtListTable from './OtListTable'
import UserListCards from './UserListCards'

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  const [selectedVisit, setSelectedVisit] = useState<UsersType | null>(null)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <UserListCards />
      </Grid>
      <Grid item xs={12}>
        <VisitListTable tableData={userData} onVisitSelect={setSelectedVisit} selectedVisit={selectedVisit} />
      </Grid>
      {selectedVisit && (
        <Grid item xs={12}>
          <OtListTable tableData={userData} selectedVisit={selectedVisit} />
        </Grid>
      )}
    </Grid>
  )
}

export default UserList
