import 'dotenv/config'
import { resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'

import { PrismaClient } from '@prisma/client'

import { clean, escapeCsv, readCsv } from './csv.mjs'
import { createObraLookup, resolveObraId } from './lab-history-obra-map.mjs'

const prisma = new PrismaClient()
const expectedRows = { density: 20240, lbotmae: 135664 }
const batchSize = 500

function getOptions(args) {
  const [densityPath, lbotmaePath, ...flags] = args
  let expectedDatabase = null
  let reportDirectory = process.cwd()
  let apply = false
  let replace = false

  for (let index = 0; index < flags.length; index += 1) {
    if (flags[index] === '--apply') {
      apply = true
    } else if (flags[index] === '--replace') {
      replace = true
    } else if (flags[index] === '--expected-database') {
      expectedDatabase = flags[index + 1]
      index += 1
    } else if (flags[index] === '--report-dir') {
      reportDirectory = flags[index + 1]
      index += 1
    } else {
      throw new Error(`Opción desconocida: ${flags[index]}`)
    }
  }

  if (!densityPath || !lbotmaePath) {
    throw new Error('Uso: node prisma/import-lab-history.mjs <LBRESULT.csv> <LBOTMAE.csv> [--apply --expected-database <base> [--replace] --report-dir <directorio>]')
  }

  if (apply && !expectedDatabase) {
    throw new Error('Para escribir se requiere --expected-database con el nombre exacto de la base destino.')
  }

  if (replace && !apply) {
    throw new Error('Para reemplazar las tablas destino se requiere --apply y --expected-database.')
  }

  return { densityPath, lbotmaePath, expectedDatabase, reportDirectory: resolve(reportDirectory), apply, replace }
}

function getColumnIndexes(header, columns, fileName) {
  const indexes = {}

  for (const column of columns) {
    const index = header.indexOf(column)

    if (index < 0) throw new Error(`${fileName}: falta la columna requerida ${column}.`)
    indexes[column] = index
  }

  return indexes
}

function parseNumber(value, fileName, rowNumber, column) {
  const normalized = clean(value)

  if (!normalized) return null

  if (!/^-?\d+(?:[.,]\d+)?$/.test(normalized)) {
    throw new Error(`${fileName}, fila ${rowNumber}: valor numérico inválido en ${column}; se canceló antes de insertar.`)
  }

  const parsed = Number(normalized.replace(',', '.'))

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fileName}, fila ${rowNumber}: valor numérico fuera de rango en ${column}; se canceló antes de insertar.`)
  }

  return parsed
}

function parseDate(value, rowNumber) {
  const normalized = clean(value)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`LBRESULT, fila ${rowNumber}: FECHA debe usar YYYY-MM-DD; se canceló antes de insertar.`)
  }

  const date = new Date(`${normalized}T00:00:00.000Z`)

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
    throw new Error(`LBRESULT, fila ${rowNumber}: FECHA no es válida; se canceló antes de insertar.`)
  }

  return date
}

async function loadDensity(path, obrasByNumero) {
  const iterator = readCsv(path)
  const header = (await iterator.next()).value

  if (!header) throw new Error('LBRESULT está vacío.')

  const indexes = getColumnIndexes(header, ['CODIGO', 'OBRA', 'FECHA', 'DEN_MIN', 'DEN_MAX', 'PROCTOR', 'HUMEDAD1'], 'LBRESULT')
  const accepted = []
  const omitted = []
  let sourceRows = 0

  for await (const values of iterator) {
    if (values.length === 1 && values[0] === '') continue
    sourceRows += 1
    const codigo = clean(values[indexes.CODIGO])
    const numeroObra = clean(values[indexes.OBRA])
    const rowNumber = sourceRows + 1

    if (!codigo || !/^\d+$/.test(numeroObra)) {
      throw new Error(`LBRESULT, fila ${rowNumber}: CODIGO u OBRA no válido; se canceló antes de insertar.`)
    }

    const obra = resolveObraId(numeroObra, obrasByNumero)

    if (obra.status === 'ambiguous') {
      throw new Error(`LBRESULT, fila ${rowNumber}: OBRA ${numeroObra} coincide con varias obras locales; se canceló antes de insertar.`)
    }

    const row = {
      codigo,
      fecha: parseDate(values[indexes.FECHA], rowNumber),
      densidadMin: parseNumber(values[indexes.DEN_MIN], 'LBRESULT', rowNumber, 'DEN_MIN'),
      densidadMax: parseNumber(values[indexes.DEN_MAX], 'LBRESULT', rowNumber, 'DEN_MAX'),
      proctor: parseNumber(values[indexes.PROCTOR], 'LBRESULT', rowNumber, 'PROCTOR'),
      humedad: parseNumber(values[indexes.HUMEDAD1], 'LBRESULT', rowNumber, 'HUMEDAD1')
    }

    if (obra.status === 'found') {
      accepted.push({ obraId: obra.obraId, ...row })
    } else {
      omitted.push(values)
    }
  }

  if (sourceRows !== expectedRows.density) {
    throw new Error(`Se esperaban ${expectedRows.density} filas en LBRESULT y se leyeron ${sourceRows}; se canceló antes de insertar.`)
  }

  return { header, indexes, accepted, omitted, sourceRows }
}

async function loadLbotmae(path, obrasByNumero) {
  const iterator = readCsv(path)
  const header = (await iterator.next()).value

  if (!header) throw new Error('LBOTMAE está vacío.')

  const indexes = getColumnIndexes(header, ['CODIGO', 'OBRA', 'ESTADO', 'ITEMM', 'PROCEDE', 'UBICA'], 'LBOTMAE')
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
    const rowNumber = sourceRows + 1

    if (!codigo || !/^\d+$/.test(numeroObra)) {
      throw new Error(`LBOTMAE, fila ${rowNumber}: CODIGO u OBRA no válido; se canceló antes de insertar.`)
    }

    const obra = resolveObraId(numeroObra, obrasByNumero)

    if (obra.status === 'ambiguous') {
      throw new Error(`LBOTMAE, fila ${rowNumber}: OBRA ${numeroObra} coincide con varias obras locales; se canceló antes de insertar.`)
    }

    if (estado !== 'A' && estado !== 'F') {
      throw new Error(`LBOTMAE, fila ${rowNumber}: estado inesperado ${estado || '(vacío)'}; se canceló antes de insertar.`)
    }

    if (codes.has(codigo)) {
      throw new Error(`CODIGO duplicado en LBOTMAE: ${codigo}; se canceló antes de insertar.`)
    }

    codes.add(codigo)

    if (obra.status === 'found') {
      accepted.push({
        obraId: obra.obraId,
        codigo,
        estado,
        item: clean(values[indexes.ITEMM]) || null,
        procedencia: clean(values[indexes.PROCEDE]) || null,
        ubicacion: clean(values[indexes.UBICA]) || null
      })
    } else {
      omitted.push(values)
    }
  }

  if (sourceRows !== expectedRows.lbotmae) {
    throw new Error(`Se esperaban ${expectedRows.lbotmae} filas en LBOTMAE y se leyeron ${sourceRows}; se canceló antes de insertar.`)
  }

  return { header, indexes, accepted, omitted, sourceRows }
}

async function writeOmissions(reportDirectory, name, data) {
  const reportPath = resolve(reportDirectory, `${name}_omisiones_por_obra_no_encontrada.csv`)

  const reportRows = [
    data.header.concat('MOTIVO_OMISION').map(escapeCsv).join(','),
    ...data.omitted.map(values => values.concat('Sin Obra.numeroObra local coincidente.').map(escapeCsv).join(','))
  ].join('\r\n')

  await writeFile(reportPath, `\ufeff${reportRows}\r\n`, 'utf8')

  return reportPath
}

async function createInBatches(tx, model, rows) {
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    await tx[model].createMany({ data: rows.slice(offset, offset + batchSize) })
  }
}

async function main() {
  const options = getOptions(process.argv.slice(2))
  const databaseUrl = new URL(process.env.DATABASE_URL || '')
  const identity = await prisma.$queryRaw`SELECT current_database() AS database, current_setting('port') AS port`
  const database = identity[0]?.database

  if (!database || decodeURIComponent(databaseUrl.pathname.slice(1)) !== database) {
    throw new Error('Importación cancelada: la base activa no coincide con DATABASE_URL.')
  }

  if (options.apply && database !== options.expectedDatabase) {
    throw new Error(`Importación cancelada: la base conectada es "${database}", no coincide con --expected-database.`)
  }

  if (database === 'pampa_database_prod_20261115_1519' && options.apply) {
    throw new Error('Importación cancelada: use el importador local protegido para el respaldo, no este importador de producción.')
  }

  const [densityCount, lbotmaeCount] = await Promise.all([
    prisma.referenciaDensidad.count(),
    prisma.referenciaLbotmae.count()
  ])

  if (options.apply && (densityCount > 0 || lbotmaeCount > 0) && !options.replace) {
    throw new Error(`Importación cancelada: las tablas destino deben estar vacías (ReferenciaDensidad=${densityCount}, ReferenciaLbotmae=${lbotmaeCount}).`)
  }

  const obras = await prisma.obra.findMany({ select: { obraId: true, numeroObra: true } })
  const obrasByNumero = createObraLookup(obras)

  const [density, lbotmae] = await Promise.all([
    loadDensity(options.densityPath, obrasByNumero),
    loadLbotmae(options.lbotmaePath, obrasByNumero)
  ])

  const states = lbotmae.accepted.reduce((counts, row) => {
    counts[row.estado] += 1

    return counts
  }, { A: 0, F: 0 })

  const summary = {
    database,
    mode: options.apply ? (options.replace ? 'replace' : 'apply') : 'dry-run',
    existingRows: { referenciaDensidad: densityCount, referenciaLbotmae: lbotmaeCount },
    density: { sourceRows: density.sourceRows, importedRows: density.accepted.length, skippedRows: density.omitted.length },
    lbotmae: { sourceRows: lbotmae.sourceRows, importedRows: lbotmae.accepted.length, activeRows: states.A, annulledRows: states.F, skippedRows: lbotmae.omitted.length },
    dateRangeFilter: 'none'
  }

  if (!options.apply) {
    console.log(JSON.stringify(summary))

    return
  }

  const densityReport = await writeOmissions(options.reportDirectory, 'LBRESULT', density)
  const lbotmaeReport = await writeOmissions(options.reportDirectory, 'LBOTMAE', lbotmae)

  await prisma.$transaction(async tx => {
    const [existingDensityCount, existingLbotmaeCount] = await Promise.all([
      tx.referenciaDensidad.count(),
      tx.referenciaLbotmae.count()
    ])

    if ((existingDensityCount > 0 || existingLbotmaeCount > 0) && !options.replace) {
      throw new Error('Importación cancelada dentro de la transacción: una tabla destino dejó de estar vacía.')
    }

    if (options.replace) {
      await tx.referenciaDensidad.deleteMany()
      await tx.referenciaLbotmae.deleteMany()
    }

    await createInBatches(tx, 'referenciaDensidad', density.accepted)
    await createInBatches(tx, 'referenciaLbotmae', lbotmae.accepted)

    const [importedDensityCount, importedLbotmaeCount] = await Promise.all([
      tx.referenciaDensidad.count(),
      tx.referenciaLbotmae.count()
    ])

    if (importedDensityCount !== density.accepted.length || importedLbotmaeCount !== lbotmae.accepted.length) {
      throw new Error(`Verificación falló dentro de la transacción: ReferenciaDensidad=${importedDensityCount}, ReferenciaLbotmae=${importedLbotmaeCount}.`)
    }
  }, { maxWait: 10000, timeout: 600000, isolationLevel: 'Serializable' })

  console.log(JSON.stringify({ ...summary, densityReport, lbotmaeReport }))
}

main()
  .catch(error => {
    console.error('Error importando antecedentes históricos de laboratorio:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
