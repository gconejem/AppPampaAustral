'use client'

import Grid from '@mui/material/Grid'

import PreviewCard from '@/views/apps/invoice/preview/PreviewCard'
import PreviewActions from '@/views/apps/invoice/preview/PreviewActions'

const PreviewPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={9}>
        <PreviewCard />
      </Grid>
      <Grid item xs={12} md={3}>
        <PreviewActions />
      </Grid>
    </Grid>
  )
}

export default PreviewPage
