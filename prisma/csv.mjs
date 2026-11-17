import { createReadStream } from 'node:fs'

export async function* readCsv(path) {
  const decoder = new TextDecoder('windows-1252')
  let buffer = ''
  let row = []
  let field = ''
  let quoted = false
  let firstField = true

  for await (const chunk of createReadStream(path)) {
    buffer += decoder.decode(chunk, { stream: true })
    let index = 0

    while (index < buffer.length) {
      const character = buffer[index]

      if (quoted) {
        if (character === '"') {
          if (index + 1 === buffer.length) break

          if (buffer[index + 1] === '"') {
            field += '"'
            index += 2
          } else {
            quoted = false
            index += 1
          }
        } else {
          field += character
          index += 1
        }
      } else if (character === '"' && field.length === 0) {
        quoted = true
        index += 1
      } else if (character === ',') {
        row.push(field)
        field = ''
        index += 1
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && index + 1 === buffer.length) break
        row.push(field)
        if (firstField && row[0]?.charCodeAt(0) === 0xfeff) row[0] = row[0].slice(1)
        yield row
        row = []
        field = ''
        firstField = false
        index += character === '\r' && buffer[index + 1] === '\n' ? 2 : 1
      } else {
        field += character
        index += 1
      }
    }

    buffer = buffer.slice(index)
  }

  buffer += decoder.decode()

  for (let index = 0; index < buffer.length; index += 1) {
    const character = buffer[index]

    if (quoted) {
      if (character === '"') {
        if (buffer[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        field += character
      }
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n' || character === '\r') {
      row.push(field)
      if (firstField && row[0]?.charCodeAt(0) === 0xfeff) row[0] = row[0].slice(1)
      yield row
      row = []
      field = ''
      firstField = false
      if (character === '\r' && buffer[index + 1] === '\n') index += 1
    } else if (character === '"' && field.length === 0) {
      quoted = true
    } else {
      field += character
    }
  }

  if (quoted) throw new Error('El CSV terminó dentro de un campo entrecomillado.')

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (firstField && row[0]?.charCodeAt(0) === 0xfeff) row[0] = row[0].slice(1)
    yield row
  }
}

export const clean = value => (value ?? '').trim().replace(/^\\N$/, '')

export function escapeCsv(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}
