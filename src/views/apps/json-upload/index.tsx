'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

// Third-party Imports
import { useDropzone } from 'react-dropzone'

// Styled Component Imports
import AppReactDropzone from '@/libs/styles/AppReactDropzone'

const JsonUpload = () => {
  // States
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Hooks
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/json': ['.json']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles: File[]) => {
      setError(null)
      setSuccess(null)
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0])
      }
    }
  })

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecciona un archivo JSON')
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const jsonData = JSON.parse(content)
          
          // Enviar el JSON al endpoint
          const response = await fetch('/api/ot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData)
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Error al enviar los datos')
          }

          const result = await response.json()
          console.log('Respuesta del servidor:', result)
          
          setSuccess('Archivo JSON subido correctamente')
          setFile(null)
        } catch (parseError) {
          setError(parseError instanceof Error ? parseError.message : 'El archivo no es un JSON válido')
        }
      }
      reader.readAsText(file)
    } catch (error) {
      setError('Error al procesar el archivo')
    }
  }

  return (
    <Card>
      <CardHeader title='Subir Archivo JSON' />
      <CardContent>
        <div {...getRootProps()} className='border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary'>
          <input {...getInputProps()} />
          <Typography variant='body1' className='mb-2'>
            Arrastra y suelta un archivo JSON aquí, o haz clic para seleccionar
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Solo se aceptan archivos .json
          </Typography>
        </div>

        {file && (
          <div className='mt-4'>
            <Typography variant='body1'>
              Archivo seleccionado: {file.name}
            </Typography>
            <Button
              variant='contained'
              color='primary'
              className='mt-4'
              onClick={handleUpload}
            >
              Subir Archivo
            </Button>
          </div>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert severity='success' onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  )
}

export default JsonUpload 
