// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports

// Component Imports

// Vars
const data: UserDataType[] = []

const UserListCards = () => {
  return (
    <Grid container spacing={6}>
      {data.map((item, i) => (
        <Grid key={i} item xs={12} sm={6} md={3}></Grid>
      ))}
    </Grid>
  )
}

export default UserListCards
