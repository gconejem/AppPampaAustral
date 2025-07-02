import { useState } from 'react'

import { Button, Card, CardContent, Typography, Box, Alert, Paper } from '@mui/material'
import * as XLSX from 'xlsx'
import axios from 'axios'
import { toast } from 'react-hot-toast'

interface ImportClientsExcelProps {
  onSuccess?: () => void
}

const ImportClientsExcel = ({ onSuccess }: ImportClientsExcelProps) => {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]

    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile)
        setError(null)
        setSuccess(false)
      } else {
        setError('Por favor, seleccione un archivo Excel válido (.xlsx o .xls)')
        setFile(null)
        setSuccess(false)
      }
    }
  }

  const processExcelFile = async () => {
    if (!file) return

    try {
      setLoading(true)
      setError(null)

      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

          // Validar y transformar los datos
          const camposRequeridos = [
            'estado', 'rut', 'razonSocial', 'nombreCliente', 'pais', 'region', 'ciudad', 'comuna', 'direccion'
          ]

          const clientes: any[] = []

          for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i]


            // Verificar si la fila está completamente vacía
            const isEmptyRow = camposRequeridos.every(campo => {
              const valor = row[campo]


              return valor === undefined || valor === null || String(valor).trim() === ''
            })

            if (isEmptyRow) break // Detener procesamiento al encontrar la primera fila vacía
            clientes.push({
              estado: row.estado?.toString().trim() || '',
              rut: row.rut?.toString().trim() || '',
              razonSocial: row.razonSocial?.toString().trim() || '',
              nombreCliente: row.nombreCliente?.toString().trim() || '',
              pais: row.pais?.toString().trim() || '',
              region: row.region?.toString().trim() || '',
              ciudad: row.ciudad?.toString().trim() || '',
              comuna: row.comuna?.toString().trim() || '',
              direccion: row.direccion?.toString().trim() || ''
            })
          }

          // Validar datos requeridos y recolectar errores detallados
          const errores: string[] = []

          clientes.forEach((cliente, idx) => {
            const filaExcel = idx + 2 // +2 porque la fila 1 es encabezado y el array es 0-based
            const camposFaltantes: string[] = []

            camposRequeridos.forEach(campo => {
              if (!cliente[campo]) camposFaltantes.push(campo)
            })

            if (camposFaltantes.length > 0) {
              errores.push(`Fila ${filaExcel}: falta(n) ${camposFaltantes.join(', ')}`)
            }
          })

          if (errores.length > 0) {
            setError('Corrige los siguientes errores en tu archivo Excel:\n' + errores.join('\n'))

            return
          }

          // Enviar datos al servidor
          const response = await axios.post('/api/clientes/import', { clientes })

          toast.success('Clientes importados correctamente')
          setSuccess(true)

          if (onSuccess) {
            onSuccess()
          }
        } catch (error: any) {
          setError(error.response?.data?.error || 'Error al procesar el archivo')
        } finally {
          setLoading(false)
        }
      }

      reader.onerror = () => {
        setError('Error al leer el archivo')
        setLoading(false)
      }

      reader.readAsBinaryString(file)
    } catch (error) {
      setError('Error al procesar el archivo')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Importar Clientes desde Excel
        </Typography>

        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Todos los siguientes campos son requeridos:
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • estado
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • rut
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • razonSocial
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • nombreCliente
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • pais
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • region
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • ciudad
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • comuna
          </Typography>
          <Typography variant="body2">
            • direccion
          </Typography>
        </Paper>

        <Box sx={{ mb: 2 }}>
          <input
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            id="excel-file-input"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="excel-file-input">
            <Button
              variant="outlined"
              component="span"
              disabled={loading}
            >
              Seleccionar Archivo Excel
            </Button>
          </label>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Archivo seleccionado: {file.name}
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.split('\n').map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ¡Importación realizada correctamente!
          </Alert>
        )}

        <Button
          variant="contained"
          onClick={processExcelFile}
          disabled={!file || loading}
        >
          {loading ? 'Procesando...' : 'Importar Clientes'}
        </Button>
      </CardContent>
    </Card>
  )
}

export default ImportClientsExcel 
