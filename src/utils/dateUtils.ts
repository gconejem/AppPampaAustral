/**
 * Utilidades para manejo de fechas y zonas horarias
 */

/**
 * Formatea una fecha para enviar al backend, ajustando por la zona horaria local
 * para evitar problemas de conversión UTC
 */
export const formatDateForBackend = (date: Date): string => {
    // Crear una nueva fecha ajustando por el offset de zona horaria
    const offset = date.getTimezoneOffset()
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000))
    return adjustedDate.toISOString()
}

/**
 * Formatea una fecha para enviar al backend preservando la hora exacta
 * sin ajustes de zona horaria (útil para fechas que ya tienen la hora correcta)
 */
export const formatDateForBackendPreserveTime = (date: Date): string => {
    // Si la fecha tiene hora 00:00, mantenerla así sin ajustes de zona horaria
    if (date.getHours() === 0 && date.getMinutes() === 0) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}T00:00:00.000Z`
    }

    // Para otras horas, usar el formato normal con ajuste de zona horaria
    return formatDateForBackend(date)
}

/**
 * Parsea una fecha que viene del backend, ajustando por la zona horaria local
 * para mostrar la hora correcta en el frontend
 */
export const parseDateFromBackend = (dateString: string): Date => {
    if (!dateString) {
        return new Date()
    }

    const date = new Date(dateString)

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
        console.warn('Fecha inválida recibida del backend:', dateString)
        return new Date()
    }

    // Ajustar por zona horaria local para mostrar la hora correcta
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() + (offset * 60 * 1000))

    return localDate
}

/**
 * Formatea una fecha para inputs de tipo datetime-local
 */
export const formatDateForInput = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Formatea una fecha que viene del backend para inputs de tipo datetime-local
 */
export const formatBackendDateForInput = (dateString: string): string => {
    if (!dateString) return ''
    const localDate = parseDateFromBackend(dateString)
    return formatDateForInput(localDate)
}

/**
 * Formatea una fecha en formato dd-mm-yyyy para mostrar en la UI
 */
export const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return ''

    // Si la fecha ya está en formato YYYY-MM-DD, convertirla
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateString)
        return dateString
    }

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}-${month}-${year}`
}

/**
 * Formatea una fecha en formato dd-mm-yyyy sin conversión de zona horaria
 * Útil para fechas que vienen del backend en formato YYYY-MM-DD o YYYY-MM-DD HH:mm:ss
 * y deben mostrarse exactamente como están almacenadas
 */
export const formatDateOnly = (dateString: string): string => {
    if (!dateString) return ''

    // Extraer la parte de la fecha directamente del string para evitar problemas de zona horaria
    // Soporta formatos: "YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DDTHH:mm:ss.sssZ"
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)

    if (dateMatch) {
        const [, year, month, day] = dateMatch
        return `${day}-${month}-${year}`
    }

    // Si no coincide con el patrón esperado, devolver el string original
    console.warn('Formato de fecha no reconocido:', dateString)
    return dateString
}
