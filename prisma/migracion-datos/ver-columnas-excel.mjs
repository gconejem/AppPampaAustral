import xlsx from 'xlsx'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const archivoExcel = join(__dirname, 'PA-carga-inicial-mantenedores-(al-05-12-2025).xlsx')
const workbook = xlsx.readFile(archivoExcel)

const nombreHoja = process.argv[2] || 'Cliente-Contacto'
const hoja = workbook.Sheets[nombreHoja]

const datos = xlsx.utils.sheet_to_json(hoja, { 
  header: 1,
  range: 0,  // Incluir la fila 1 (encabezados)
  defval: ''
})

console.log('\n=== TOTAL DE FILAS ===')
console.log(datos.length)

console.log('\n=== ENCABEZADOS (Fila 1) ===')
if (datos.length > 0) {
  datos[0].forEach((val, idx) => {
    console.log(`[${idx}]: ${JSON.stringify(val)}`)
  })
}

console.log('\n=== PRIMERA FILA CON ÍNDICES ===')
if (datos.length > 0) {
  datos[0].forEach((val, idx) => {
    console.log(`[${idx}]: ${JSON.stringify(val)}`)
  })
}

console.log('\n=== SEGUNDA FILA ===')
if (datos.length > 1) {
  console.log(JSON.stringify(datos[1], null, 2))
}
