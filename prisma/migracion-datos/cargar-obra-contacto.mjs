import { PrismaClient } from '@prisma/client'
import xlsx from 'xlsx'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const prisma = new PrismaClient()

/**
 * Normaliza el rol/cargo a minúsculas sin acentos y con guiones bajos
 */
function normalizarRol(rol) {
  if (!rol) return ''
  return rol.toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/\s+/g, '_')
}

async function cargarObraContacto() {
  try {
    console.log('Iniciando carga de relaciones Obra-Contacto desde Excel...')
    
    // Leer el archivo Excel
    const archivoExcel = join(__dirname, 'PA-carga-inicial-mantenedores-(al-05-12-2025).xlsx')
    const workbook = xlsx.readFile(archivoExcel)
    
    // Obtener la hoja "Obra-Contacto"
    const nombreHoja = 'Obra-Contacto'
    const hoja = workbook.Sheets[nombreHoja]
    
    if (!hoja) {
      throw new Error(`No se encontró la hoja "${nombreHoja}" en el archivo Excel`)
    }
    
    // Convertir la hoja a JSON sin usar encabezados (usar índices de columna)
    const datos = xlsx.utils.sheet_to_json(hoja, { 
      header: 1, // Usar arrays en lugar de objetos con encabezados
      range: 1, // Empezar desde la fila 2 (índice 1, ya que 0 es la fila 1)
      defval: '' // Valor por defecto para celdas vacías
    })
    
    console.log(`Se encontraron ${datos.length} registros en la hoja "${nombreHoja}"`)
    
    let insertados = 0
    let errores = 0
    let obrasNoEncontradas = 0
    let contactosNoEncontrados = 0
    
    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i]
      
      try {
        // Extraer datos de las columnas
        const nombre = (fila[0] || '').toString().trim()
        const cargoExcel = (fila[1] || '').toString().trim()
        const email = (fila[2] || '').toString().trim()
        const telefono1 = (fila[3] || '').toString().trim() || null
        const telefono2 = (fila[4] || '').toString().trim() || null
        const numeroObra = (fila[8] || '').toString().trim()
        
        const rol = normalizarRol(cargoExcel)
        const isPrincipal = true
        
        // Validar datos requeridos
        if (!numeroObra) {
          console.warn(`Fila ${i + 2}: numeroObra vacío, saltando...`)
          errores++
          continue
        }
        
        if (!nombre) {
          console.warn(`Fila ${i + 2}: Nombre vacío, saltando...`)
          errores++
          continue
        }
        
        // Buscar la obra por numeroObra
        const obra = await prisma.obra.findFirst({
          where: { numeroObra: numeroObra }
        })
        
        if (!obra) {
          console.warn(`Fila ${i + 2}: Obra con numeroObra "${numeroObra}" no encontrada`)
          obrasNoEncontradas++
          errores++
          continue
        }
        
        // Buscar el contacto por email (opcional)
        let contactId = null
        if (email) {
          const contacto = await prisma.contacto.findFirst({
            where: { email: email }
          })
          
          if (contacto) {
            contactId = contacto.contactId
          } else {
            console.warn(`Fila ${i + 2}: Contacto con email "${email}" no encontrado (se insertará sin contactId)`)
            contactosNoEncontrados++
          }
        }
        
        // Insertar la relación
        await prisma.contactoObra.create({
          data: {
            obraId: obra.obraId,
            contactId: contactId,
            nombre: nombre,
            rol: rol,
            email: email || null,
            telefono1: telefono1,
            telefono2: telefono2,
            isPrincipal: isPrincipal
          }
        })
        
        insertados++
        const contactoInfo = contactId ? `con contacto ID ${contactId}` : 'sin contacto vinculado'
        console.log(`✓ Fila ${i + 2}: Relación creada para obra "${numeroObra}" - "${nombre}" (${email || 'sin email'}) ${contactoInfo} con rol: ${rol}`)
        
      } catch (error) {
        console.error(`Error en fila ${i + 2}:`, error.message)
        errores++
      }
    }
    
    console.log('\n=== RESUMEN ===')
    console.log(`Total de registros procesados: ${datos.length}`)
    console.log(`Relaciones insertadas: ${insertados}`)
    console.log(`Errores: ${errores}`)
    console.log(`Obras no encontradas: ${obrasNoEncontradas}`)
    console.log(`Contactos no encontrados (se insertaron sin contactId): ${contactosNoEncontrados}`)
    
  } catch (error) {
    console.error('Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cargarObraContacto()
