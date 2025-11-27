import { NextResponse } from 'next/server'
import fs from 'fs'
import puppeteer from 'puppeteer'
import { prisma } from '@/lib/prisma'
import { parseDateFromBackend } from '@/utils/dateUtils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Función para renderizar el HTML del PDF para Comprobante de Visita (R-12-47)
function renderComprobanteVisitaHTML(agenda: any, logoBase64: string) {
    const comprobanteData = agenda.comprobanteVisitaJSON as any || {}
    const acepVisita = comprobanteData.ACEPVISITA || {}

    // Información del cliente y obra
    const cliente = agenda.cliente
    const obra = agenda.obra

    // Información del laboratorista (primer usuario asignado)
    const laboratorista = agenda.asignados?.[0]?.user?.name || 'No asignado'

    // Fecha de la visita
    const fechaVisita = agenda.fechaInicio ? parseDateFromBackend(agenda.fechaInicio) : new Date()
    const fechaFormateada = fechaVisita.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    })

    // Información de las órdenes de trabajo
    const ordenesTrabajo = agenda.ordenesTrabajo || []

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
          align-items: stretch;
          border: 1px solid #000;
          margin-bottom: 2px;
          min-height: 60px;
        }
        
        .logo-section {
          width: 120px;
          text-align: center;
          border-right: 1px solid #000;
          padding: 5px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .logo {
          width: 80px;
          height: auto;
        }
        
        .title-section {
          flex: 1;
          text-align: center;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
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
          font-size: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .info-row {
          margin-bottom: 2px;
        }
        
        .info-label {
          font-weight: bold;
        }
        
        .section {
          border: 1px solid #000;
          margin-bottom: 2px;
          padding: 5px;
        }
        
        .section-title {
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .field-row {
          display: flex;
          margin-bottom: 2px;
        }
        
        .field-label {
          width: 80px;
          font-weight: bold;
        }
        
        .field-value {
          flex: 1;
          border-bottom: 1px solid #000;
          min-height: 12px;
          padding-left: 5px;
        }
        
        .field-row-inline {
          display: flex;
          margin-bottom: 2px;
        }
        
        .field-inline {
          display: flex;
          align-items: center;
          margin-right: 20px;
        }
        
        .field-inline-label {
          font-weight: bold;
          margin-right: 5px;
        }
        
        .field-inline-value {
          border-bottom: 1px solid #000;
          min-width: 60px;
          min-height: 12px;
          padding-left: 5px;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
        }
        
        .table th,
        .table td {
          border: 1px solid #000;
          padding: 3px;
          text-align: left;
        }
        
        .table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        
        .table td {
          text-align: center;
        }
        
        .table td:nth-child(2),
        .table td:nth-child(5) {
          text-align: left;
        }
        
        .company-name {
          font-weight: bold;
          margin-bottom: 2px;
          text-align: center;
        }
        
        .company-subtitle {
          font-size: 8px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="logo-section">
          <img src="${logoBase64}" alt="Logo" class="logo">
          <div class="company-name">PAMPAUSTRAL Ltda.</div>
          <div class="company-subtitle">Laboratorio Oficial Acreditado INN - CHILE</div>
        </div>
        
        <div class="title-section">
          <div class="title">ACEPTACIÓN VISITA TERRENO</div>
        </div>
        
        <div class="document-info">
          <div class="info-row">
            <span class="info-label">R-12-47</span>
          </div>
          <div class="info-row">
            <span class="info-label">Autor:</span> Katherine Rivas Castillo
          </div>
          <div class="info-row">
            <span class="info-label">Aprobado por:</span> Juan Salas Sepúlveda
          </div>
          <div class="info-row">
            <span class="info-label">Fecha Aprobación:</span> 04-08-2022
          </div>
          <div class="info-row">
            <span class="info-label">Versión:</span> 2
          </div>
        </div>
      </div>
      
      <!-- Información del Cliente y Obra -->
      <div class="section">
        <div class="field-row">
          <div class="field-label">Cliente:</div>
          <div class="field-value">${cliente?.rut || ''} - ${cliente?.nombreCliente || ''}</div>
        </div>
        <div class="field-row">
          <div class="field-label">Obra:</div>
          <div class="field-value">${obra?.numeroObra || ''} - ${obra?.nombreObra || ''}</div>
        </div>
      </div>
      
      <!-- Detalles de la Visita -->
      <div class="section">
        <div class="field-row-inline">
          <div class="field-inline">
            <span class="field-inline-label">Laboratorista</span>
            <div class="field-inline-value">${laboratorista}</div>
          </div>
          <div class="field-inline">
            <span class="field-inline-label">Fecha:</span>
            <div class="field-inline-value">${fechaFormateada}</div>
          </div>
          <div class="field-inline">
            <span class="field-inline-label">Hora llegada:</span>
            <div class="field-inline-value">${acepVisita.hora_llegada || ''}</div>
          </div>
        </div>
        <div class="field-row-inline">
          <div class="field-inline">
            <span class="field-inline-label">Hora Salida:</span>
            <div class="field-inline-value">${acepVisita.hora_salida || ''}</div>
          </div>
          <div class="field-inline">
            <span class="field-inline-label">Movilización:</span>
            <div class="field-inline-value">${acepVisita.movilizacion === 'si' ? 'Si' : 'No'}</div>
          </div>
          <div class="field-inline">
            <span class="field-inline-label">Km. Adicionales:</span>
            <div class="field-inline-value">${acepVisita.km_adicionales || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      <!-- Tabla de Órdenes de Trabajo -->
      <div class="section">
        <table class="table">
          <thead>
            <tr>
              <th>N° OT</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${ordenesTrabajo.map((ot: any) => `
              <tr>
                <td>${ot.id}</td>
                <td>${ot.descripcion || ot.tipoOT?.nombre || ''}</td>
                <td>Digital</td>
                <td>${ot.estadoOT?.nombre || 'Completado'}</td>
                <td>Sin Obs.</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const agendaId = parseInt(params.id)

        // Obtener la agenda con toda la información necesaria
        const agenda = await prisma.agenda.findUnique({
            where: { id: agendaId },
            include: {
                cliente: true,
                obra: true,
                asignados: {
                    include: {
                        user: true
                    }
                },
                ordenesTrabajo: {
                    include: {
                        tipoOT: true,
                        estadoOT: true
                    }
                }
            }
        })

        if (!agenda) {
            return new NextResponse('Agenda no encontrada', { status: 404 })
        }

        // Verificar que existe el comprobanteVisitaJSON
        if (!agenda.comprobanteVisitaJSON) {
            return new NextResponse('No se encontró el comprobante de visita', { status: 404 })
        }

        // Cargar logo como base64 (mismo que se usa en PDFs de OT)
        const logoPath = `${process.cwd()}/public/images/logos/PAMPA_MG_2025_017-2.png`
        const logoBase64 = fs.existsSync(logoPath)
            ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
            : ''

        // Generar HTML
        const html = renderComprobanteVisitaHTML(agenda, logoBase64)

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
        const fileName = `Comprobante_Visita_${agendaId}.pdf`

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`
            }
        })

    } catch (error) {
        console.error('Error al generar PDF del comprobante de visita:', error)
        return new NextResponse('Error interno del servidor', { status: 500 })
    }
}
