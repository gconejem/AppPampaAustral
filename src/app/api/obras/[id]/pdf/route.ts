import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'
import fs from 'fs'

function renderObraHTML(obra: any, logoBase64: string) {
  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700,800,900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; margin: 0; padding: 0; color: #736e7d; font-size: 0.9375rem; }
        .header, .header-left, .logo-title, .logo, .title, .subtitle, .header-right, .header-right .label { font-size: initial; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; background: #fff; padding: 16px 32px 8px 32px; border-bottom: 2px solid #FF0096; }
        .header-left { display: flex; flex-direction: column; align-items: flex-start; }
        .logo-title { display: flex; align-items: center; }
        .logo { height: 40px; }
        .title { font-size: 1.25rem; font-weight: bold; margin-left: 16px; color: #736e7d; font-family: 'Inter', sans-serif; }
        .subtitle { font-size: 12px; color: #736e7d; font-style: italic; margin-top: 2px; font-family: 'Inter', sans-serif; }
        .header-right { text-align: right; color: #736e7d; font-size: 12px; min-width: 220px; font-family: 'Inter', sans-serif; }
        .header-right .label { font-weight: bold; color: #736e7d; font-family: 'Inter', sans-serif; font-size: 12px; }
        .pdf-container { width: 100%; }
        .pink-line { height: 2px; background: #FF0096; border: none; margin: 8px 0 0 0; width: 100%; display: block; position: relative; }
        .section { margin: 24px 32px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .col { flex: 1; }
        .label { color: #736e7d; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; font-family: 'Inter', sans-serif; }
        .value { color: #736e7d; font-size: 12px; margin-bottom: 2px; font-family: 'Inter', sans-serif; }
        .table { width: 100%; border-collapse: collapse; margin-top: 24px; font-family: 'Inter', sans-serif; }
        .table th { background-color: #f0f0f0; color: #736e7d; font-weight: bold; font-size: 12px; padding: 16px; text-align: left; font-family: 'Inter', sans-serif; }
        .table td { font-size: 0.8125rem; padding: 16px; border-bottom: 1px solid #eee; vertical-align: top; color: #736e7d; font-family: 'Inter', sans-serif; }
        .section-title { font-size: 1.25rem; font-weight: bold; margin-bottom: 16px; color: #736e7d; }
        .grid-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .grid-item { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="header">
          <div class="header-left">
            <div class="logo-title">
              <img src="${logoBase64}" class="logo" />
              <span class="title">PAMPAUSTRAL</span>
            </div>
            <div class="subtitle">Laboratorio acreditado de acuerdo con la Norma NCh-ISO/IEC 17025:2017</div>
          </div>
          <div class="header-right">
            <div><span class="label">N° Obra:</span> ${obra.numeroObra}</div>
            <div><span class="label">Fecha Ingreso:</span> ${new Date(obra.fechaIngreso).toLocaleDateString('es-CL')}</div>
            <div><span class="label">Estado:</span> ${obra.estadoObra}</div>
          </div>
        </div>

        <!-- Datos Principales -->
        <div class="section">
          <div class="section-title">Datos Principales</div>
          <div class="grid-container">
            <div class="grid-item">
              <div class="label">Número Obra</div>
              <div class="value">${obra.numeroObra}</div>
            </div>
            <div class="grid-item">
              <div class="label">Fecha Ingreso</div>
              <div class="value">${obra.fechaIngreso ? new Date(obra.fechaIngreso).toLocaleDateString() : '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Estado Obra</div>
              <div class="value">${obra.estadoObra}</div>
            </div>
            <div class="grid-item">
              <div class="label">RUT Cliente</div>
              <div class="value">${obra.rut}</div>
            </div>
            <div class="grid-item">
              <div class="label">Nombre Cliente</div>
              <div class="value">${obra.nombreCliente}</div>
            </div>
          </div>
        </div>

        <!-- Antecedentes -->
        <div class="section">
          <div class="section-title">Antecedentes</div>
          <div class="grid-container">
            <div class="grid-item" style="grid-column: span 2;">
              <div class="label">Nombre Obra</div>
              <div class="value">${obra.nombreObra}</div>
            </div>
            <div class="grid-item" style="grid-column: span 2;">
              <div class="label">Dirección</div>
              <div class="value">${obra.direccion}</div>
            </div>
            <div class="grid-item">
              <div class="label">Región</div>
              <div class="value">${obra.region}</div>
            </div>
            <div class="grid-item">
              <div class="label">Comuna</div>
              <div class="value">${obra.comuna}</div>
            </div>
            <div class="grid-item">
              <div class="label">Sector</div>
              <div class="value">${obra.sector || '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Georreferencia</div>
              <div class="value">${obra.georreferencia || '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Referencia</div>
              <div class="value">${obra.referencia || '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Mandante</div>
              <div class="value">${obra.mandante || '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Informe a Mandante</div>
              <div class="value">${obra.informeMandante ? 'Sí' : 'No'}</div>
            </div>
            ${obra.informeMandante ? `
              <div class="grid-item" style="grid-column: span 2;">
                <div class="label">Texto Mandante</div>
                <div class="value">${obra.textoMandante || '-'}</div>
              </div>
            ` : ''}
            <div class="grid-item" style="grid-column: span 2;">
              <div class="label">Correos</div>
              <div class="value">${Array.isArray(obra.correos) ? obra.correos.join(', ') : '-'}</div>
            </div>
          </div>
        </div>

        <!-- Requisitos -->
        <div class="section">
          <div class="section-title">Requisitos</div>
          <div class="grid-container">
            <div class="grid-item">
              <div class="label">Acreditación Personal</div>
              <div class="value">${obra.acreditacionPersonal ? 'Sí' : 'No'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Especificaciones Técnicas</div>
              <div class="value">${obra.especificacionesTecnicas ? 'Sí' : 'No'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Acreditación Equipos</div>
              <div class="value">${obra.acreditacionEquipos ? 'Sí' : 'No'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Carta Compromiso</div>
              <div class="value">${obra.cartaCompromiso ? 'Sí' : 'No'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Mandato y Envío de Informes a SERVIU</div>
              <div class="value">${obra.mandatoServiu ? 'Sí' : 'No'}</div>
            </div>
            <div class="grid-item" style="grid-column: span 2;">
              <div class="label">Otros Requisitos</div>
              <div class="value">${obra.otrosRequisitos || '-'}</div>
            </div>
          </div>
        </div>

        <!-- Facturación -->
        <div class="section">
          <div class="section-title">Facturación</div>
          <div class="grid-container">
            <div class="grid-item">
              <div class="label">Razón Social</div>
              <div class="value">${obra.razonSocial}</div>
            </div>
            <div class="grid-item">
              <div class="label">RUT</div>
              <div class="value">${obra.rut}</div>
            </div>
            <div class="grid-item">
              <div class="label">Giro</div>
              <div class="value">${obra.giro || '-'}</div>
            </div>
            <div class="grid-item" style="grid-column: span 2;">
              <div class="label">Dirección Comercial</div>
              <div class="value">${obra.direccionComercial}</div>
            </div>
            <div class="grid-item">
              <div class="label">Comuna</div>
              <div class="value">${obra.comunaFacturacion || '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Teléfono</div>
              <div class="value">${obra.telefonoFacturacion || '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Lista de Precios</div>
              <div class="value">${obra.listaPrecio?.nombre || '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Mail Recepción Factura</div>
              <div class="value">${obra.mailRecepcionFactura || '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">RUT Representante Legal</div>
              <div class="value">${obra.rutRepresentanteLegal || '-'}</div>
            </div>
            <div class="grid-item">
              <div class="label">Representante Legal</div>
              <div class="value">${obra.representanteLegal || '-'}</div>
            </div>
          </div>
        </div>

        <!-- Contactos -->
        <div class="section">
          <div class="section-title">Contactos</div>
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Email</th>
                <th>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              ${obra.contactos
                ?.sort((a, b) => {
                  if (a.isPrincipal && !b.isPrincipal) return -1
                  if (!a.isPrincipal && b.isPrincipal) return 1
                  return 0
                })
                .map((contact: any) => `
                  <tr>
                    <td>${contact.nombre}${contact.isPrincipal ? ' (Principal)' : ''}</td>
                    <td>${contact.rol || '-'}</td>
                    <td>${contact.email || '-'}</td>
                    <td>${contact.telefono1 || '-'}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4">No hay contactos registrados</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </body>
  </html>
  `
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const obra = await prisma.obra.findUnique({
      where: {
        obraId: parseInt(params.id)
      },
      include: {
        contactos: true
      }
    })

    if (!obra) {
      return new NextResponse('Obra no encontrada', { status: 404 })
    }

    // Cargar logo como base64
    const logoPath = `${process.cwd()}/public/images/logos/PAMPA_MG_2025_017-2.png`
    const logoBase64 = fs.existsSync(logoPath)
      ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
      : ''

    const html = renderObraHTML(obra, logoBase64)

    // Si la URL tiene ?preview=1, devolvemos el HTML en vez del PDF
    const url = new URL(request.url)
    if (url.searchParams.get('preview') === '1') {
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' }
    })
    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="obra_${obra.numeroObra}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error al generar PDF:', error)
    return new NextResponse('Error al generar el PDF', { status: 500 })
  }
} 
