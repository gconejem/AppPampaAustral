export const formatRut = (rut: string): string => {
  // Eliminar puntos y guión
  let value = rut.replace(/\./g, '').replace(/-/g, '')

  // Eliminar caracteres no válidos
  value = value.replace(/[^0-9kK]/g, '')

  // Si está vacío, retornar valor limpio
  if (value.length === 0) return value

  // Obtener dígito verificador
  const dv = value.slice(-1)

  // Obtener cuerpo del RUT
  const rutBody = value.slice(0, -1)

  // Formatear con puntos y guión
  if (rutBody.length > 0) {
    let formatted = ''

    for (let i = rutBody.length - 1, j = 0; i >= 0; i--, j++) {
      if (j % 3 === 0 && j > 0) formatted = '.' + formatted
      formatted = rutBody.charAt(i) + formatted
    }

    return `${formatted}-${dv}`
  }

  return value
}

export const validateRut = (rut: string): boolean => {
  // Si el RUT está vacío, retornar false
  if (!rut) return false

  // Limpiar el RUT de puntos y guión
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toLowerCase()

  // Validar el formato básico
  if (!/^[0-9]{7,8}[0-9k]$/.test(cleanRut)) return false

  const rutDigits = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)

  let sum = 0
  let multiplier = 2

  // Calcular dígito verificador
  for (let i = rutDigits.length - 1; i >= 0; i--) {
    sum += parseInt(rutDigits.charAt(i)) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const expectedDv = 11 - (sum % 11)
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'k' : expectedDv.toString()

  return calculatedDv === dv
}
