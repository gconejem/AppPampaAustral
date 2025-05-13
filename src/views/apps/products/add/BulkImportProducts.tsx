'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

const BulkImportProducts = () => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setSuccess(null)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setSuccess(null)
    setError(null)

    const formData = new FormData()

    formData.append('file', file)

    try {
      const res = await fetch('/api/productos/bulk/importar', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('¡Productos importados exitosamente!')
        setFile(null)
      } else {
        setError(data.error || 'Error al importar productos')
      }
    } catch (err) {
      setError('Error de red o del servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card sx={{ maxWidth: 500, margin: '0 auto', mt: 8 }}>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Importar productos desde Excel
        </Typography>
        <form onSubmit={handleSubmit}>
          <input
            type='file'
            accept='.xlsx,.xls'
            onChange={handleFileChange}
            disabled={loading}
            style={{ marginBottom: 16 }}
          />
          <br />
          <Button type='submit' variant='contained' disabled={!file || loading}>
            {loading ? <CircularProgress size={24} /> : 'Importar'}
          </Button>
        </form>
        {success && (
          <Alert severity='success' sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default BulkImportProducts
