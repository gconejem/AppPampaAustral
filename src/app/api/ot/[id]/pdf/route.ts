import { NextResponse } from 'next/server'
import fs from 'fs'
import puppeteer from 'puppeteer'
import { prisma } from '@/lib/prisma'
import { parseDateFromBackend } from '@/utils/dateUtils'

// Función para renderizar el HTML del PDF para Control de Compactación (R-12-03)
function renderControlCompactacionHTML(ot: any, logoBase64: string) {
    const jsonData = ot.jsonOT || {}
    const { cliente, obra } = ot.agenda || {}

    // Extraer datos del JSON según la estructura real
    // Los datos pueden estar en jsonData.RESPUESTA (estructura del archivo de ejemplo)
    // o directamente en jsonData si se almacena de otra forma
    const respuesta = jsonData.RESPUESTA || jsonData
    const controles = respuesta?.controles || []

    // Información del equipo y medición
    const equipoInfo = {
        item: respuesta?.item || '',
        marca: respuesta?.marca || '',
        modelo: respuesta?.modelo || '',
        numeroSerie: respuesta?.numero_de_serie || '',
        codigoEquipo: respuesta?.codigo_equipo || '',
        tipoMedicion: respuesta?.tipo_medicion || '60 seg',
        conteoEstandarD: respuesta?.conteo_estandar_d || '',
        conteoEstandarH: respuesta?.conteo_estandar_h || '',
        descripSuelo: respuesta?.descrip_suelo || '',
        itemObs: respuesta?.item_obs || ''
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 9px;
          line-height: 1.2;
          margin: 0;
          padding: 0;
        }
        
        .header {
          display: flex;
          align-items: center;
          border: 1px solid #000;
          margin-bottom: 2px;
        }
        
        .logo-section {
          width: 120px;
          text-align: center;
          border-right: 1px solid #000;
          padding: 5px;
        }
        
        .logo {
          width: 80px;
          height: auto;
        }
        
        .title-section {
          flex: 1;
          text-align: center;
          padding: 10px;
        }
        
        .title {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 12px;
          margin-bottom: 5px;
        }
        
        .method {
          font-size: 10px;
          font-style: italic;
        }
        
        .document-info {
          width: 140px;
          border-left: 1px solid #000;
          padding: 5px;
        }
        
        .doc-number {
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .client-info {
          display: flex;
          border: 1px solid #000;
          margin-bottom: 2px;
        }
        
        .client-section, .work-section {
          flex: 1;
          padding: 5px;
        }
        
        .work-section {
          border-left: 1px solid #000;
        }
        
        .info-grid {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
        }
        
        .info-grid td {
          border: 1px solid #000;
          padding: 4px 6px;
          font-size: 8px;
          vertical-align: middle;
          width: 16.66%;
        }
        
        .info-label {
          font-weight: bold;
          background-color: #f0f0f0;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .data-table th,
        .data-table td {
          border: 1px solid #000;
          padding: 3px 2px;
          text-align: center;
          font-size: 7px;
          vertical-align: middle;
        }
        
        .data-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          font-size: 7px;
          line-height: 1.1;
        }
        
        .data-table td {
          max-width: 60px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .checklist {
          border: 1px solid #000;
          padding: 8px;
          margin-top: 10px;
        }
        
        .checklist-title {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 8px;
        }
        
        .checklist-item {
          margin-bottom: 4px;
          font-size: 8px;
          line-height: 1.3;
        }
        
        .checklist-question {
          display: inline;
        }
        
        .checklist-answer {
          font-weight: bold;
          margin-left: 5px;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="logo-section">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Logo">` : ''}
        </div>
        <div class="title-section">
          <div class="title">ORDEN DE TRABAJO</div>
          <div class="title">CONTROL DE COMPACTACIÓN</div>
          <div class="subtitle">Método Nuclear</div>
          <div class="method">Según 8.502.1 - 8.502.2 Diciembre 2003 MC-V8</div>
        </div>
        <div class="document-info">
          <div class="doc-number">${ot.tipoOT?.codigo || 'R-12-03'}</div>
          <div>OT N° ${ot.id}</div>
          <div>Autor: ${ot.user?.name || 'Sin asignar'}</div>
          <div>Aprobado por: ${jsonData.aprobadoPor || ''}</div>
          <div>Fecha Aprobación: ${jsonData.fechaAprobacion || ''}</div>
          <div>Versión: ${jsonData.version || '13'}</div>
        </div>
      </div>

      <!-- Client and Work Info -->
      <div class="client-info">
        <div class="client-section">
          <strong>Cliente:</strong> ${cliente?.nombreCliente || 'Sin cliente'}<br>
          <strong>Obra:</strong> ${obra?.nombreObra || 'Sin obra'}
        </div>
        <div class="work-section">
          <strong>Obra:</strong> ${obra?.numeroObra || 'Sin número de obra'}<br>
          <strong>Comuna:</strong> ${obra?.comuna || 'Sin comuna'} - <strong>Región:</strong> ${obra?.region || 'Sin región'}
        </div>
      </div>

      <!-- Info Grid -->
      <table class="info-grid">
        <tr>
          <td class="info-label">Fecha Control:</td>
          <td>${parseDateFromBackend(ot.createdAt).toLocaleDateString('es-CL')}</td>
          <td class="info-label">Laboratorista:</td>
          <td>${ot.user?.name || 'Sin asignar'}</td>
          <td class="info-label">Densímetro:</td>
          <td>${equipoInfo.codigoEquipo} Marca: ${equipoInfo.marca} Modelo: ${equipoInfo.modelo}</td>
        </tr>
        
        <tr>
          <td class="info-label">N° de Serie:</td>
          <td>${equipoInfo.numeroSerie}</td>
          <td class="info-label">Item:</td>
          <td>${equipoInfo.item}</td>
          <td class="info-label">Obs. al Item:</td>
          <td>${equipoInfo.itemObs}</td>
        </tr>
        
        <tr>
          <td class="info-label">Conteo Estándar:</td>
          <td>D: ${equipoInfo.conteoEstandarD}  H: ${equipoInfo.conteoEstandarH}</td>
          <td class="info-label">Tiempo Medición:</td>
          <td>${equipoInfo.tipoMedicion}</td>
          <td class="info-label">Descrip. visual suelo:</td>
          <td>${equipoInfo.descripSuelo}</td>
        </tr>
      </table>

      <!-- Data Table -->
      <table class="data-table">
        <thead>
          <tr>
            <th>N°</th>
            <th>Ubicación</th>
            <th>Frente a</th>
            <th>Entre</th>
            <th>Faja o Lado</th>
            <th>Prof. de Ensayo</th>
            <th>Capa</th>
            <th>D.C.H.<br>(Kg/m3)</th>
            <th>W%</th>
            <th>D.C.S.<br>(Kg/m3)</th>
            <th>DMCS / DR<br>(Kg/m3)</th>
            <th>COMP.<br>(%)</th>
            <th>Exp.<br>(%)</th>
          </tr>
        </thead>
        <tbody>
          ${controles && controles.length > 0 ? controles.map((control: any) => {
        // Construir campo "Entre" combinando entre_1 y entre_2
        let entreText = ''
        if (control.entre_1 && control.entre_2 && !control.entre_na) {
            entreText = control.entre_2 // Usar entre_2 como principal
        } else if (control.entre_na === 'true' || control.entre_na === true) {
            entreText = 'No Aplica'
        } else if (control.entre_1) {
            entreText = control.entre_1
        } else if (control.entre_2) {
            entreText = control.entre_2
        }

        return `
              <tr>
                <td>${control.numero || ''}</td>
                <td>${control.calle_pasaje || ''}</td>
                <td>${control.frente_a || ''}</td>
                <td>${entreText}</td>
                <td>${control.faja_lado || ''}</td>
                <td>${control.profundidad || ''}</td>
                <td>${control.capa || ''}</td>
                <td>${control.dch || ''}</td>
                <td>${control.w || ''}</td>
                <td>${control.dcs || ''}</td>
                <td>${control.dmcs || ''}</td>
                <td>${control.comp || ''}</td>
                <td>${control.exig || ''}</td>
              </tr>
            `
    }).join('') : `
            <tr>
              <td colspan="13" style="text-align: center; padding: 20px;">Sin datos de controles</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- Lista de Chequeo -->
      <div class="checklist">
        <div class="checklist-title">Lista de Chequeo</div>
        ${respuesta?.lista_chequeo && respuesta.lista_chequeo.length > 0 ? respuesta.lista_chequeo.map((item: any) => `
          <div class="checklist-item">
            <span class="checklist-question">${item.texto}</span>
            <span class="checklist-answer">${item.valor}</span>
          </div>
        `).join('') : `
          <div class="checklist-item">Sin lista de chequeo disponible</div>
        `}
      </div>
    </body>
    </html>
  `
}

// Función para renderizar HTML genérico para otros tipos de OT
function renderGenericOTHTML(ot: any, logoBase64: string) {
    const jsonData = ot.jsonOT || {}
    const { cliente, obra } = ot.agenda || {}

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { width: 100px; height: auto; }
        .title { font-size: 24px; font-weight: bold; margin: 20px 0; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
        .info-item { padding: 10px; border: 1px solid #ccc; }
        .label { font-weight: bold; }
        .json-data { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        .json-content { white-space: pre-wrap; font-family: monospace; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Logo">` : ''}
        <h1 class="title">ORDEN DE TRABAJO</h1>
        <h2>${ot.tipoOT?.descripcion || 'Tipo de OT no definido'}</h2>
        <p>Código: ${ot.tipoOT?.codigo || 'Sin código'}</p>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">OT N°:</div>
          <div>${ot.id}</div>
        </div>
        <div class="info-item">
          <div class="label">Fecha:</div>
          <div>${new Date(ot.createdAt).toLocaleDateString('es-CL')}</div>
        </div>
        <div class="info-item">
          <div class="label">Cliente:</div>
          <div>${cliente?.nombreCliente || 'Sin cliente'}</div>
        </div>
        <div class="info-item">
          <div class="label">Obra:</div>
          <div>${obra?.nombreObra || 'Sin obra'}</div>
        </div>
        <div class="info-item">
          <div class="label">Laboratorista:</div>
          <div>${ot.user?.name || 'Sin asignar'}</div>
        </div>
        <div class="info-item">
          <div class="label">Estado:</div>
          <div>${ot.estado}</div>
        </div>
      </div>

      <div class="json-data">
        <h3>Datos de la Orden de Trabajo:</h3>
        <div class="json-content">${JSON.stringify(jsonData, null, 2)}</div>
      </div>
    </body>
    </html>
  `
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id

        // Buscar la OT con toda la información relacionada
        const ot = await prisma.ordenTrabajo.findUnique({
            where: { id },
            include: {
                tipoOT: true,
                user: true,
                agenda: {
                    include: {
                        cliente: true,
                        obra: true
                    }
                }
            }
        })

        if (!ot) {
            return new NextResponse('Orden de Trabajo no encontrada', { status: 404 })
        }

        // Cargar logo como base64
        const logoPath = `${process.cwd()}/public/images/logos/PAMPA_MG_2025_017-2.png`
        const logoBase64 = fs.existsSync(logoPath)
            ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
            : ''

        let html = ''

        // Generar HTML según el tipo de OT
        switch (ot.tipoOT?.codigo) {
            case 'R-12-03': // Control de Compactación
                html = renderControlCompactacionHTML(ot, logoBase64)
                break
            case 'R-12-39': // Muestreo de Hormigón Fresco
                // TODO: Implementar template específico
                html = renderGenericOTHTML(ot, logoBase64)
                break
            default:
                html = renderGenericOTHTML(ot, logoBase64)
                break
        }

        // Si la URL tiene ?preview=1, devolver HTML en lugar de PDF
        const url = new URL(request.url)
        if (url.searchParams.get('preview') === '1') {
            return new NextResponse(html, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            })
        }

        // Generar PDF usando Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-web-security', '--disable-features=VizDisplayCompositor']
        })

        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: 'networkidle0' })

        // Esperar a que las fuentes se carguen completamente
        await page.evaluateHandle('document.fonts.ready')
        await new Promise(resolve => setTimeout(resolve, 1000))

        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
            printBackground: true,
            preferCSSPageSize: true
        })

        await browser.close()

        // Generar nombre del archivo
        const tipoCode = ot.tipoOT?.codigo || 'OT'
        const fileName = `${tipoCode}_${ot.id}.pdf`

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`
            }
        })

    } catch (error) {
        console.error('Error al generar PDF de OT:', error)
        return new NextResponse('Error interno del servidor', { status: 500 })
    }
}
