// index.tsx

'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import UserListTable from './UserListTable'
import UserListTable2 from './UserListTable2'
import UserListCards from './UserListCards'

const UserList = ({ userData }: { userData?: UsersType[] }) => {
  const [selectedVisit, setSelectedVisit] = useState<UsersType | null>(null) // Estado para la visita seleccionada

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <UserListCards />
      </Grid>
      <Grid item xs={12}>
        {/* Se pasa la función y el estado como props */}
        <UserListTable tableData={userData} onVisitSelect={setSelectedVisit} selectedVisit={selectedVisit} />
      </Grid>
      {selectedVisit && (
        <Grid item xs={12}>
          {/* Solo se renderiza si hay una visita seleccionada */}
          <UserListTable2 tableData={userData} selectedVisit={selectedVisit} />
        </Grid>
      )}
    </Grid>
  )
}

export default UserList
