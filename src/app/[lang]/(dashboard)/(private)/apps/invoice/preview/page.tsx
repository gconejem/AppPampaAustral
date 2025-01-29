'use client'

import Grid from '@mui/material/Grid'
import PreviewTemp from '@/views/apps/invoice/preview/PreviewTemp'

const PreviewPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <PreviewTemp />
      </Grid>
    </Grid>
  )
}

export default PreviewPage
