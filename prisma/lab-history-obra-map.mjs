export function createObraLookup(obras) {
  const lookup = new Map()

  for (const obra of obras) {
    const numeroObra = String(obra.numeroObra ?? '').trim()

    if (!numeroObra) continue
    const obrasConNumero = lookup.get(numeroObra) ?? []

    obrasConNumero.push(obra.obraId)
    lookup.set(numeroObra, obrasConNumero)
  }

  return lookup
}

export function resolveObraId(numeroObra, lookup) {
  const obras = lookup.get(String(numeroObra ?? '').trim()) ?? []

  if (obras.length > 1) return { status: 'ambiguous' }

  if (obras.length === 0) return { status: 'missing' }

  return { status: 'found', obraId: obras[0] }
}
