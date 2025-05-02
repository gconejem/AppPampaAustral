// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import JsonUpload from '@/views/apps/json-upload'

const JsonUploadPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <JsonUpload />
      </Grid>
    </Grid>
  )
}

export default JsonUploadPage 
