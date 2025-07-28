/**
 * Pruebas para las utilidades de fecha
 * Este archivo es solo para verificar el funcionamiento, no es un test unitario formal
 */

import { formatDateForBackend, parseDateFromBackend, formatDateForInput, formatBackendDateForInput } from './dateUtils'

// Ejemplo de uso y verificación
console.log('=== Pruebas de utilidades de fecha ===')

// Crear una fecha de prueba: 28 de enero de 2025, 22:00
const testDate = new Date(2025, 0, 28, 22, 0, 0) // Mes 0 = enero
console.log('Fecha original:', testDate.toString())
console.log('Fecha original ISO:', testDate.toISOString())

// Formatear para backend
const backendFormat = formatDateForBackend(testDate)
console.log('Formato para backend:', backendFormat)

// Parsear desde backend
const parsedDate = parseDateFromBackend(backendFormat)
console.log('Fecha parseada desde backend:', parsedDate.toString())

// Formatear para input
const inputFormat = formatDateForInput(testDate)
console.log('Formato para input:', inputFormat)

// Formatear desde backend para input
const backendToInputFormat = formatBackendDateForInput(backendFormat)
console.log('Desde backend a input:', backendToInputFormat)

// Verificar que las horas se mantienen
console.log('\n=== Verificación de horas ===')
console.log('Hora original:', testDate.getHours() + ':' + testDate.getMinutes().toString().padStart(2, '0'))
console.log('Hora parseada:', parsedDate.getHours() + ':' + parsedDate.getMinutes().toString().padStart(2, '0'))

export { } // Para que TypeScript trate esto como un módulo
