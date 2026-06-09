export const normalizeOrdenTrabajoTarjetas = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value)) return undefined

  return value
    .map(tarjeta => String(tarjeta).trim())
    .filter(tarjeta => tarjeta.length > 0)
}

export const ordenTrabajoTarjetasToLegacyString = (tarjetas: readonly string[] | null | undefined) =>
  tarjetas?.join(',') ?? ''
