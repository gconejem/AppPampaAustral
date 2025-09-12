'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'

// Icon Imports
import UploadFileIcon from '@mui/icons-material/UploadFile'

// Types
interface Agenda {
  id: number
  titulo: string
  tipoVisita: string
  fechaInicio: Date
  fechaFin: Date
  estado: string
  horaLlegada: string | null
  horaSalida: string | null
  movilizacion: string | null
  kmAdicionales: string | null
  cliente: {
    clienteId: number
    nombreCliente: string
    rut: string
  } | null
  obra: {
    obraId: number
    nombreObra: string
    numeroObra: string | null
    comuna: string | null
    region: string | null
  } | null
  asignados: Array<{
    userId: string
    user: {
      name: string | null
    }
  }>
}

//const userId = "cmalj98pw0000c1tc3omxsb3x"

interface Props {
  agendas: Agenda[]
}

const JsonUpload = ({ agendas }: Props) => {
  // States
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState<{ type: 'ots' | 'aceptacion', agendaId: number } | null>(null)
  const [completedOts, setCompletedOts] = useState<Set<number>>(new Set())

  const handleFileSelect = (type: 'ots' | 'aceptacion', agendaId: number) => {
    setUploadingFile({ type, agendaId })
    const inputId = `${type}-${agendaId}`
    const input = document.getElementById(inputId) as HTMLInputElement
    if (input) {
      input.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'ots' | 'aceptacion', agendaId: number) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          const jsonData = JSON.parse(content)

          console.log('JSON original:', jsonData)
          console.log('Agenda ID:', agendaId)
          console.log('Tipo:', type)

          // Crear una copia profunda del JSON y modificar los campos según el tipo
          if (jsonData.data) {
            const modifiedJsonData = {
              ...jsonData,
              usuario: {
                ...jsonData.usuario
              },
              data: jsonData.data.map((item: any) => ({
                ...item,
                ...(type === 'ots' ? { FKLBRUTAS: agendaId.toString() } : {}),
                ...(type === 'aceptacion' ? { CLAVE: agendaId.toString() } : {})
              }))
            }

            // Para OTs, agregar el JSON completo de cada OT individual
            if (type === 'ots') {
              modifiedJsonData.data = jsonData.data.map((item: any) => ({
                ...item,
                FKLBRUTAS: agendaId.toString(),
                jsonOT: item // Almacenar el JSON completo de la OT
              }))
            }

            console.log('JSON modificado:', modifiedJsonData)

            const response = await fetch('/api/ot', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(modifiedJsonData)
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Error al enviar los datos')
            }

            const result = await response.json()
            console.log('Respuesta del servidor:', result)

            if (type === 'ots') {
              setCompletedOts(prev => new Set([...prev, agendaId]))
            }

            setSuccess(`Archivo JSON de ${type === 'ots' ? 'OTs' : 'aceptación'} subido correctamente`)
          }
        } catch (parseError) {
          setError(parseError instanceof Error ? parseError.message : 'El archivo no es un JSON válido')
        }
      }
      reader.readAsText(file)
    } catch (error) {
      setError('Error al procesar el archivo')
    } finally {
      setUploadingFile(null)
      // Limpiar el input
      event.target.value = ''
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'AGENDADA':
        return 'info'
      case 'COMPLETADA':
        return 'success'
      case 'SUSPENDIDA':
        return 'warning'
      case 'CANCELADA':
        return 'error'
      case 'EN_PROCESO':
        return 'primary'
      default:
        return 'default'
    }
  }

  return (
    <>
      <Card>
        <CardHeader title='Agendas' />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Tipo de Visita</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Obra</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agendas.map((agenda) => (
                  <TableRow key={agenda.id}>
                    <TableCell>{agenda.id}</TableCell>
                    <TableCell>{agenda.titulo}</TableCell>
                    <TableCell>{agenda.tipoVisita}</TableCell>
                    <TableCell>{new Date(agenda.fechaInicio).toLocaleString()}</TableCell>
                    <TableCell>{new Date(agenda.fechaFin).toLocaleString()}</TableCell>
                    <TableCell>{agenda.cliente?.nombreCliente || '-'}</TableCell>
                    <TableCell>{agenda.obra?.nombreObra || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={agenda.estado}
                        color={getEstadoColor(agenda.estado)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <input
                          type="file"
                          accept=".json"
                          style={{ display: 'none' }}
                          id={`ots-${agenda.id}`}
                          onChange={(e) => handleFileChange(e, 'ots', agenda.id)}
                        />
                        <input
                          type="file"
                          accept=".json"
                          style={{ display: 'none' }}
                          id={`aceptacion-${agenda.id}`}
                          onChange={(e) => handleFileChange(e, 'aceptacion', agenda.id)}
                        />
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            '&:hover': {
                              opacity: 0.7
                            }
                          }}
                          onClick={() => handleFileSelect('ots', agenda.id)}
                        >
                          <IconButton
                            size='small'
                            color='primary'
                            disabled={uploadingFile?.agendaId === agenda.id && uploadingFile?.type === 'ots'}
                          >
                            <UploadFileIcon />
                          </IconButton>
                          <Typography variant='body2'>1. Subir JSON OTs</Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: completedOts.has(agenda.id) ? 'pointer' : 'not-allowed',
                            opacity: completedOts.has(agenda.id) ? 1 : 0.5,
                            '&:hover': {
                              opacity: completedOts.has(agenda.id) ? 0.7 : 0.5
                            }
                          }}
                          onClick={() => completedOts.has(agenda.id) && handleFileSelect('aceptacion', agenda.id)}
                        >
                          <IconButton
                            size='small'
                            color='primary'
                            disabled={uploadingFile?.agendaId === agenda.id && uploadingFile?.type === 'aceptacion' || !completedOts.has(agenda.id)}
                          >
                            <UploadFileIcon />
                          </IconButton>
                          <Typography variant='body2'>2. Subir JSON aceptacion visita</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

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
    </>
  )
}

export default JsonUpload 
