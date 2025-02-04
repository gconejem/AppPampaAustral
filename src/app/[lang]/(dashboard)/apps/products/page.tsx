// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ProductListTable from '@views/apps/products/products/ProductListTable'

const ProductsPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ProductListTable />
      </Grid>
    </Grid>
  )
}

export default ProductsPage
