import 'dotenv/config'
import { writeFile } from 'node:fs/promises'

import { PrismaClient } from '@prisma/client'

import { clean, escapeCsv, readCsv } from './csv.mjs'
import { createObraLookup, resolveObraId } from './lab-history-obra-map.mjs'

const prisma = new PrismaClient()
const expectedDatabase = 'pampa_database_prod_20261115_1519'

async function main() {
  const inputPath = process.argv[2]

  if (!inputPath) throw new Error('Uso: node prisma/import-lbotmae-local.mjs <archivo.csv>')

  const databaseUrl = new URL(process.env.DATABASE_URL || '')
  const database = decodeURIComponent(databaseUrl.pathname.slice(1))

  if (database !== expectedDatabase || !['localhost', '127.0.0.1', '::1'].includes(databaseUrl.hostname) || databaseUrl.port !== '5433') {
    throw new Error('Importación cancelada: solo está permitida en el respaldo local pampa_database_prod_20261115_1519 de localhost:5433.')
  }

  const identity = await prisma.$queryRaw`SELECT current_database() AS database, current_setting('port') AS port`

  if (identity[0]?.database !== expectedDatabase || identity[0]?.port !== '5433') {
    throw new Error('Importación cancelada: la conexión activa no corresponde al respaldo local esperado.')
  }

  const existingCount = await prisma.referenciaLbotmae.count()

  if (existingCount > 0) {
    throw new Error(`Importación cancelada: ReferenciaLbotmae ya contiene ${existingCount} filas; no se sobrescribieron datos.`)
  }

  const obras = await prisma.obra.findMany({ select: { obraId: true, numeroObra: true } })
  const obrasByNumero = createObraLookup(obras)
  const iterator = readCsv(inputPath)
  const header = (await iterator.next()).value

  if (!header) throw new Error('El CSV está vacío.')

  const indexes = {}

  for (const column of ['CODIGO', 'OBRA', 'ESTADO', 'ITEMM', 'PROCEDE', 'UBICA']) {
    const index = header.indexOf(column)

    if (index < 0) throw new Error(`Falta la columna requerida ${column}.`)
    indexes[column] = index
  }

  const accepted = []
  const omitted = []
  const codes = new Set()
  let sourceRows = 0

  for await (const values of iterator) {
    if (values.length === 1 && values[0] === '') continue
    sourceRows += 1
    const codigo = clean(values[indexes.CODIGO])
    const numeroObra = clean(values[indexes.OBRA])
    const estado = clean(values[indexes.ESTADO])

    if (!codigo || !/^\d+$/.test(numeroObra)) throw new Error(`Fila ${sourceRows + 1}: CODIGO u OBRA no válido; se canceló antes de insertar.`)
    if (estado !== 'A' && estado !== 'F') throw new Error(`Fila ${sourceRows + 1}: estado inesperado ${estado || '(vacío)'}; se canceló antes de insertar.`)
    if (codes.has(codigo)) throw new Error(`CODIGO duplicado en LBOTMAE: ${codigo}; se canceló antes de insertar.`)
    codes.add(codigo)

    const obra = resolveObraId(numeroObra, obrasByNumero)

    if (obra.status === 'ambiguous') {
      throw new Error(`Fila ${sourceRows + 1}: OBRA ${numeroObra} coincide con varias obras locales; se canceló antes de insertar.`)
    }

    if (obra.status === 'missing') {
      omitted.push(values)
      continue
    }

    accepted.push({
      obraId: obra.obraId,
      codigo,
      estado,
      item: clean(values[indexes.ITEMM]) || null,
      procedencia: clean(values[indexes.PROCEDE]) || null,
      ubicacion: clean(values[indexes.UBICA]) || null
    })
  }

  if (sourceRows !== 135664) throw new Error(`Se esperaban 135664 filas en LBOTMAE y se leyeron ${sourceRows}; se canceló antes de insertar.`)

  const reportPath = inputPath.replace(/\.csv$/i, '') + '_omisiones_por_obra_no_encontrada.csv'

  const report = [
    header.concat('MOTIVO_OMISION').map(escapeCsv).join(','),
    ...omitted.map(values => values.concat('Sin Obra.numeroObra local coincidente.').map(escapeCsv).join(','))
  ].join('\r\n')

  await writeFile(reportPath, `\ufeff${report}\r\n`, 'utf8')

  const counts = { A: 0, F: 0 }

  accepted.forEach(row => { counts[row.estado] += 1 })

  await prisma.$transaction(async tx => {
    for (let offset = 0; offset < accepted.length; offset += 500) {
      await tx.referenciaLbotmae.createMany({ data: accepted.slice(offset, offset + 500) })
    }
  }, { maxWait: 10000, timeout: 600000 })

  const importedCount = await prisma.referenciaLbotmae.count()

  if (importedCount !== accepted.length) throw new Error(`Verificación posterior falló: se esperaban ${accepted.length} filas y hay ${importedCount}.`)

  console.log(JSON.stringify({
    database: identity[0].database,
    sourceRows,
    importedRows: importedCount,
    activeRows: counts.A,
    annulledRows: counts.F,
    skippedRows: omitted.length,
    skippedWorkIds: new Set(omitted.map(row => clean(row[indexes.OBRA]))).size,
    reportPath,
    dateRangeFilter: 'none'
  }))
}

main()
  .catch(error => {
    console.error('Error importando LBOTMAE al respaldo local:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
