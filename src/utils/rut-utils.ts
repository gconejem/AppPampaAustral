export const formatRut = (rut: string): string => {
  // Eliminar puntos y guión
  let value = rut.replace(/\./g, '').replace(/-/g, '')

  // Eliminar cualquier caracter que no sea número o 'k'
  value = value.replace(/[^0-9kK]/g, '')

  // Si el RUT está vacío, retornar vacío
  if (!value) return ''

  // Obtener el dígito verificador
  const dv = value.slice(-1)

  // Obtener el cuerpo del RUT
  const rutBody = value.slice(0, -1)

  // Si el cuerpo está vacío, retornar vacío
  if (!rutBody) return ''

  // Formatear el cuerpo con puntos
  const formatted = rutBody.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  // Retornar el RUT formateado
  return `${formatted}-${dv}`
}

export const validateRut = (rut: string): boolean => {
  // Eliminar puntos y guión
  const value = rut.replace(/\./g, '').replace(/-/g, '')

  // Validar largo mínimo
  if (value.length < 2) return false

  // Validar que solo contenga números y k
  if (!/^[0-9]+[kK]?$/.test(value)) return false

  const dv = value.slice(-1).toLowerCase()
  const rutBody = value.slice(0, -1)

  // Calcular dígito verificador
  let suma = 0
  let multiplicador = 2

  // Calcular suma
  for (let i = rutBody.length - 1; i >= 0; i--) {
    suma += parseInt(rutBody.charAt(i)) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  // Calcular dígito verificador
  const dvEsperado = 11 - (suma % 11)
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'k' : dvEsperado.toString()

  // Comparar dígito verificador calculado con el ingresado
  return dv === dvCalculado
}
