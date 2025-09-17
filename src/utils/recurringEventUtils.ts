import { RecurringEventData } from '@/views/apps/calendar/modals/RecurringEventModal'
import { formatDateForBackend } from './dateUtils'

export interface RecurringEventInstance {
    fecha: Date
    fechaInicio: string
    fechaFin: string
}

/**
 * Genera todas las instancias de un evento recurrente
 */
export function generateRecurringEventInstances(config: RecurringEventData): RecurringEventInstance[] {
    const {
        fechaInicio,
        fechaFin,
        frecuencia,
        intervalo,
        diasSemana,
        fechaTermino,
        cantidadEventos
    } = config

    const instancias: RecurringEventInstance[] = []
    let currentDate = new Date(fechaInicio)
    let count = 0
    const maxEvents = cantidadEventos || 1000

    // Calcular la duración del evento original
    const duracionMinutos = fechaFin.getTime() - fechaInicio.getTime()

    while (count < maxEvents && currentDate <= fechaTermino) {
        if (frecuencia === 'diaria') {
            const eventoInicio = new Date(currentDate)
            // Siempre preservar la hora original del evento (incluyendo 00:00 si fue seleccionada)
            eventoInicio.setHours(fechaInicio.getHours(), fechaInicio.getMinutes(), fechaInicio.getSeconds(), fechaInicio.getMilliseconds())
            const eventoFin = new Date(eventoInicio.getTime() + duracionMinutos)

            instancias.push({
                fecha: new Date(eventoInicio),
                fechaInicio: formatDateForBackend(eventoInicio),
                fechaFin: formatDateForBackend(eventoFin)
            })

            currentDate.setDate(currentDate.getDate() + intervalo)
            count++
        } else if (frecuencia === 'semanal') {
            // Para frecuencia semanal, necesitamos manejar múltiples días por semana
            const weekStart = new Date(currentDate)
            weekStart.setDate(currentDate.getDate() - currentDate.getDay()) // Ir al domingo de esa semana

            let eventosEstaSemanana = 0
            for (const dia of diasSemana.sort()) {
                if (count >= maxEvents) break

                const eventoInicio = new Date(weekStart)
                eventoInicio.setDate(weekStart.getDate() + dia)
                // Siempre preservar la hora original del evento (incluyendo 00:00 si fue seleccionada)
                eventoInicio.setHours(fechaInicio.getHours(), fechaInicio.getMinutes(), fechaInicio.getSeconds(), fechaInicio.getMilliseconds())

                // Solo agregar si la fecha está dentro del rango válido
                if (eventoInicio >= fechaInicio && eventoInicio <= fechaTermino) {
                    const eventoFin = new Date(eventoInicio.getTime() + duracionMinutos)

                    instancias.push({
                        fecha: new Date(eventoInicio),
                        fechaInicio: formatDateForBackend(eventoInicio),
                        fechaFin: formatDateForBackend(eventoFin)
                    })

                    count++
                    eventosEstaSemanana++
                }
            }

            // Si no se agregó ningún evento esta semana, avanzar a la siguiente
            if (eventosEstaSemanana === 0) {
                currentDate.setDate(currentDate.getDate() + (7 * intervalo))
            } else {
                // Avanzar según el intervalo de semanas
                currentDate.setDate(currentDate.getDate() + (7 * intervalo))
            }
        } else if (frecuencia === 'mensual') {
            const eventoInicio = new Date(currentDate)
            // Siempre preservar la hora original del evento (incluyendo 00:00 si fue seleccionada)
            eventoInicio.setHours(fechaInicio.getHours(), fechaInicio.getMinutes(), fechaInicio.getSeconds(), fechaInicio.getMilliseconds())
            const eventoFin = new Date(eventoInicio.getTime() + duracionMinutos)

            if (eventoInicio <= fechaTermino) {
                instancias.push({
                    fecha: new Date(eventoInicio),
                    fechaInicio: formatDateForBackend(eventoInicio),
                    fechaFin: formatDateForBackend(eventoFin)
                })
            }

            currentDate.setMonth(currentDate.getMonth() + intervalo)
            count++
        }

        // Protección contra loops infinitos
        if (count > 2000) {
            console.warn('Se alcanzó el límite máximo de eventos recurrentes')
            break
        }
    }

    return instancias.sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
}

/**
 * Valida la configuración de un evento recurrente
 */
export function validateRecurringConfig(config: RecurringEventData): string[] {
    const errors: string[] = []

    if (!config.fechaInicio) {
        errors.push('La fecha de inicio es requerida')
    }

    if (!config.fechaFin) {
        errors.push('La fecha de fin es requerida')
    }

    if (!config.fechaTermino) {
        errors.push('La fecha de término es requerida')
    }

    if (config.fechaInicio && config.fechaTermino && config.fechaInicio > config.fechaTermino) {
        errors.push('La fecha de término debe ser posterior a la fecha de inicio')
    }

    if (config.intervalo < 1) {
        errors.push('El intervalo debe ser mayor a 0')
    }

    if (config.frecuencia === 'semanal' && config.diasSemana.length === 0) {
        errors.push('Debe seleccionar al menos un día de la semana')
    }

    if (config.cantidadEventos && config.cantidadEventos < 1) {
        errors.push('La cantidad de eventos debe ser mayor a 0')
    }

    return errors
}

/**
 * Obtiene una descripción legible de la configuración recurrente
 */
export function getRecurringDescription(config: RecurringEventData): string {
    const { frecuencia, intervalo, diasSemana } = config

    if (frecuencia === 'diaria') {
        return intervalo === 1 ? 'Todos los días' : `Cada ${intervalo} días`
    }

    if (frecuencia === 'semanal') {
        const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        const diasSeleccionados = diasSemana.map(dia => diasNombres[dia]).join(', ')

        if (intervalo === 1) {
            return `Todas las semanas los ${diasSeleccionados}`
        } else {
            return `Cada ${intervalo} semanas los ${diasSeleccionados}`
        }
    }

    if (frecuencia === 'mensual') {
        return intervalo === 1 ? 'Todos los meses' : `Cada ${intervalo} meses`
    }

    return 'Configuración no válida'
}
