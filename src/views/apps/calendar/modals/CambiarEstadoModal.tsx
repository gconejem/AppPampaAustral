import { useState, useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Alert from '@mui/material/Alert'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'

interface CambiarEstadoModalProps {
  open: boolean
  onClose: () => void
  eventId: string | null
  estadoActual: string
  onCambiarEstado: (nuevoEstado: string, observacionEliminada?: string, motivoSuspension?: string, observacionSuspendida?: string, observacionAgendada?: string, observacionAnuladaGeneral?: string) => Promise<void>
  isBulkEdit?: boolean
  eventData?: any // Datos completos del evento para validaciones
}

// Estados disponibles del enum EstadoAgenda
const ESTADOS_AGENDA = {
  AGENDADA: 'Agendada',
  SUSPENDIDA: 'Suspendida',
  ELIMINADA: 'Eliminada'
}

// Función para obtener estados disponibles según el estado actual
const getEstadosDisponibles = (estadoActual: string, isBulkEdit: boolean = false) => {
  // Para edición masiva, solo mostrar estados base (sin eliminada)
  if (isBulkEdit) {
    return {
      AGENDADA: 'Agendada',
      SUSPENDIDA: 'Suspendida'
    }
  }

  // Reglas específicas por estado actual
  switch (estadoActual) {
    case 'CREADA':
      // CREADA puede ir a: AGENDADA, SUSPENDIDA, ELIMINADA
      return {
        AGENDADA: 'Agendada',
        SUSPENDIDA: 'Suspendida',
        ELIMINADA: 'Eliminada'
      }

    case 'AGENDADA':
      // AGENDADA solo puede ir a: SUSPENDIDA
      return {
        SUSPENDIDA: 'Suspendida'
      }

    case 'SUSPENDIDA':
      // SUSPENDIDA no puede cambiar a ningún otro estado
      // Solo puede permanecer como SUSPENDIDA (sin opciones de cambio)
      return {}

    default:
      // Para otros estados, solo permitir AGENDADA y SUSPENDIDA
      return {
        AGENDADA: 'Agendada',
        SUSPENDIDA: 'Suspendida'
      }
  }
}

// Motivos de suspensión del enum MotivoSuspension
const MOTIVOS_SUSPENSION = {
  CLIMA: 'Clima',
  TERRENO_NO_PREPARADO: 'Terreno No Preparado',
  PROBLEMA_PLANTA: 'Problema Planta',
  PROBLEMA_INTERNO_PA: 'Problema Interno PA',
  ACREDITACION_PERSONAL: 'Acreditación Personal',
  OTRO: 'Otro (Especificar)'
}

const CambiarEstadoModal = ({
  open,
  onClose,
  estadoActual,
  onCambiarEstado,
  isBulkEdit = false,
  eventData
}: CambiarEstadoModalProps) => {
  // Obtener el primer estado disponible como valor por defecto
  const estadosDisponibles = getEstadosDisponibles(estadoActual, isBulkEdit)
  const primerEstadoDisponible = Object.keys(estadosDisponibles)[0] || 'AGENDADA'
  const noHayEstadosDisponibles = Object.keys(estadosDisponibles).length === 0

  const [selectedEstado, setSelectedEstado] = useState<string>(primerEstadoDisponible)
  const [observacionEliminada, setObservacionEliminada] = useState<string>('')
  const [motivoSuspension, setMotivoSuspension] = useState<string>('')
  const [observacionSuspendida, setObservacionSuspendida] = useState<string>('')
  const [observacionAgendada, setObservacionAgendada] = useState<string>('')
  const [observacionAnuladaGeneral, setObservacionAnuladaGeneral] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Función para validar campos obligatorios al cambiar de CREADA a AGENDADA
  const validateEventForAgendada = (eventData: any): { isValid: boolean; missingFields: string[] } => {
    if (!eventData) return { isValid: true, missingFields: [] } // Para edición masiva, no validamos

    const missingFields: string[] = []

    // Validar hora de inicio y fin
    if (!eventData.start || !eventData.end) {
      missingFields.push('horas de inicio y fin')
    }

    // Validar laboratoristas asignados
    const asignados = eventData.extendedProps?.asignados || []
    if (asignados.length === 0) {
      missingFields.push('laboratoristas asignados')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  // Resetear al primer estado disponible cuando cambie el estadoActual
  useEffect(() => {
    const nuevosEstadosDisponibles = getEstadosDisponibles(estadoActual, isBulkEdit)
    const nuevoPrimerEstado = Object.keys(nuevosEstadosDisponibles)[0] || 'AGENDADA'
    setSelectedEstado(nuevoPrimerEstado)
    setError('')
  }, [estadoActual, isBulkEdit])

  const handleSubmit = async () => {
    if (isLoading) return // Prevenir múltiples clicks

    setError('')

    // Validar campos obligatorios al cambiar de CREADA a AGENDADA
    if (estadoActual === 'CREADA' && selectedEstado === 'AGENDADA') {
      const validation = validateEventForAgendada(eventData)
      if (!validation.isValid) {
        setError(`No se puede cambiar el estado a "Agendada" porque faltan los siguientes campos obligatorios: ${validation.missingFields.join(', ')}. Por favor, complete estos campos antes de cambiar el estado.`)
        return
      }
    }

    // Validar que si el estado es ELIMINADA, se haya ingresado una observación
    if (selectedEstado === 'ELIMINADA' && !observacionEliminada.trim()) {
      setError('Debe ingresar un motivo para eliminar el evento')
      return
    }

    // Validar que si el estado es SUSPENDIDA, se haya seleccionado un motivo
    if (selectedEstado === 'SUSPENDIDA' && !motivoSuspension) {
      setError('Debe seleccionar un motivo de suspensión')
      return
    }

    // Validar que si el motivo es OTRO, se haya ingresado una observación
    if (selectedEstado === 'SUSPENDIDA' && motivoSuspension === 'OTRO' && !observacionSuspendida.trim()) {
      setError('Debe especificar el motivo de suspensión')
      return
    }

    try {
      setIsLoading(true)

      // Esperar a que se complete la operación completamente
      await onCambiarEstado(
        selectedEstado,
        selectedEstado === 'ELIMINADA' ? observacionEliminada : undefined,
        selectedEstado === 'SUSPENDIDA' ? motivoSuspension : undefined,
        selectedEstado === 'SUSPENDIDA' && motivoSuspension === 'OTRO' ? observacionSuspendida : undefined,
        selectedEstado === 'AGENDADA' ? observacionAgendada : undefined,
        selectedEstado === 'SUSPENDIDA' ? observacionAnuladaGeneral : undefined
      )

      // Solo limpiar campos y cerrar si la operación fue exitosa
      setObservacionEliminada('')
      setMotivoSuspension('')
      setObservacionSuspendida('')
      setObservacionAgendada('')
      setObservacionAnuladaGeneral('')
      setError('')
      onClose()
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Error al cambiar el estado')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    // No permitir cerrar mientras está cargando
    if (isLoading) return

    // Limpiar campos al cerrar y resetear al primer estado disponible
    setSelectedEstado(primerEstadoDisponible)
    setObservacionEliminada('')
    setMotivoSuspension('')
    setObservacionSuspendida('')
    setObservacionAgendada('')
    setObservacionAnuladaGeneral('')
    setError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        {noHayEstadosDisponibles
          ? 'Estado del Evento'
          : (isBulkEdit ? 'Cambiar Estado de Eventos Seleccionados' : 'Cambiar Estado del Evento')
        }
      </DialogTitle>
      <DialogContent>
        {isBulkEdit && (
          <Alert severity='info' sx={{ mb: 2 }}>
            El estado seleccionado se aplicará a todos los eventos seleccionados. En edición masiva no se permite cambiar a "Eliminada".
          </Alert>
        )}

        {!isBulkEdit && estadoActual !== 'CREADA' && estadoActual !== 'SUSPENDIDA' && (
          <Alert severity='warning' sx={{ mb: 2 }}>
            Solo los eventos en estado "Creada" pueden cambiarse a "Eliminada".
          </Alert>
        )}

        {!isBulkEdit && noHayEstadosDisponibles && (
          <Alert severity='info' sx={{ mb: 2 }}>
            Los eventos en estado "Suspendida" no pueden cambiar de estado. Sin embargo, puedes duplicar este evento desde el menú de opciones.
          </Alert>
        )}
        {!noHayEstadosDisponibles && (
          <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
            <InputLabel id='estado-select-label'>Estado</InputLabel>
            <Select
              labelId='estado-select-label'
              value={selectedEstado}
              label='Estado'
              onChange={e => setSelectedEstado(e.target.value)}
            >
              {Object.entries(getEstadosDisponibles(estadoActual, isBulkEdit)).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {!noHayEstadosDisponibles && selectedEstado === 'AGENDADA' && (
          <>
            {estadoActual === 'CREADA' && !validateEventForAgendada(eventData).isValid && (
              <Alert severity='warning' sx={{ mb: 2 }}>
                Para cambiar el estado a "Agendada", el evento debe tener:
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Horas de inicio y fin definidas</li>
                  <li>Al menos un laboratorista asignado</li>
                  <li>Al menos un equipo asignado</li>
                </ul>
                Complete estos campos antes de cambiar el estado.
              </Alert>
            )}
            <TextField
              fullWidth
              label='Observación (opcional)'
              multiline
              rows={3}
              value={observacionAgendada}
              onChange={e => setObservacionAgendada(e.target.value)}
              placeholder='Ingrese una observación opcional para el evento agendado'
              sx={{ mb: 2 }}
            />
          </>
        )}

        {!noHayEstadosDisponibles && selectedEstado === 'ELIMINADA' && (
          <TextField
            fullWidth
            label='Motivo de eliminación'
            multiline
            rows={3}
            value={observacionEliminada}
            onChange={e => setObservacionEliminada(e.target.value)}
            placeholder='Ingrese el motivo por el cual se elimina el evento'
            required
            sx={{ mb: 2 }}
          />
        )}

        {!noHayEstadosDisponibles && selectedEstado === 'SUSPENDIDA' && (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id='motivo-suspension-label'>Motivo de suspensión</InputLabel>
              <Select
                labelId='motivo-suspension-label'
                value={motivoSuspension}
                label='Motivo de suspensión'
                onChange={e => setMotivoSuspension(e.target.value)}
                required
              >
                {Object.entries(MOTIVOS_SUSPENSION).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {motivoSuspension === 'OTRO' && (
              <TextField
                fullWidth
                label='Especificar motivo'
                multiline
                rows={3}
                value={observacionSuspendida}
                onChange={e => setObservacionSuspendida(e.target.value)}
                placeholder='Ingrese el motivo específico de suspensión'
                required
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              fullWidth
              label='Observación (opcional)'
              multiline
              rows={3}
              value={observacionAnuladaGeneral}
              onChange={e => setObservacionAnuladaGeneral(e.target.value)}
              placeholder='Ingrese una observación opcional para el evento suspendido'
              sx={{ mb: 2 }}
            />
          </>
        )}

        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        {!noHayEstadosDisponibles && (
          <Button onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button
          onClick={noHayEstadosDisponibles ? handleClose : handleSubmit}
          variant='contained'
          disabled={
            !noHayEstadosDisponibles && (
              isLoading ||
              (selectedEstado === 'ELIMINADA' && !observacionEliminada.trim()) ||
              (selectedEstado === 'SUSPENDIDA' && !motivoSuspension) ||
              (selectedEstado === 'SUSPENDIDA' && motivoSuspension === 'OTRO' && !observacionSuspendida.trim()) ||
              (estadoActual === 'CREADA' && selectedEstado === 'AGENDADA' && !validateEventForAgendada(eventData).isValid)
            )
          }
          startIcon={isLoading ? <CircularProgress size={20} color='inherit' /> : undefined}
        >
          {noHayEstadosDisponibles
            ? 'Cerrar'
            : (isLoading
              ? 'Actualizando...'
              : (isBulkEdit ? 'Cambiar Estado de Eventos' : 'Cambiar Estado'))
          }
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CambiarEstadoModal
