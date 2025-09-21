import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import fs from 'fs'

export async function POST(request: Request) {
    try {
        const agendaData = await request.json()

        const { laboratorista, fecha, eventos } = agendaData

        // Filtrar eventos solo para el laboratorista seleccionado
        const eventosFiltrados = eventos.filter((evento: any) => {
            const asignados = evento.extendedProps?.asignados || []
            return asignados.some((asignado: any) => {
                const asignadoId = asignado.user?.id || asignado.id || asignado
                const laboratoristaId = laboratorista?.id
                return String(asignadoId) === String(laboratoristaId)
            })
        })

        // Cargar logo como base64
        const logoPath = `${process.cwd()}/public/images/logos/PAMPA_MG_2025_017-2.png`
        const logoBase64 = fs.existsSync(logoPath)
            ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
            : ''

        const html = renderAgendaDiariaHTML(agendaData, eventosFiltrados, logoBase64)

        // Generar PDF con Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-web-security', '--disable-features=VizDisplayCompositor']
        })
        const page = await browser.newPage()
        await page.setContent(html, { waitUntil: 'networkidle0' })

        // Esperar a que las fuentes se carguen completamente
        await page.evaluateHandle('document.fonts.ready')
        await new Promise(resolve => setTimeout(resolve, 1000)) // Esperar 1 segundo adicional para asegurar carga de fuentes

        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: '5mm', right: '5mm', bottom: '25mm', left: '5mm' },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
        <div style="width:100%;font-family:'Segoe UI','Trebuchet MS','Lucida Grande','Lucida Sans Unicode','Lucida Sans',Tahoma,sans-serif;font-size:9px;color:#736e7d;text-align:center;line-height:1.2;position:relative;">
          <span style="color:#0300b4; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">Descubrir</span> <span style="color:#ff0295; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">•</span> <span style="color:#0300b4; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">Proyectar</span> <span style="color:#ff0295; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">•</span> <span style="color:#0300b4; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">Concretar</span><br>
          Casa Matriz: Calle Santa Blanca N°51, Chillán - Chile<br>
          Fono: 42-223 82 90 | 42-224 02 55 – Horario Atención: 8:00h a 18:00h (viernes hasta 17:00h)<br>
          <span style="font-weight:bold;">contacto@pampaustral.cl</span>
          <div style="position:absolute;left:20px;bottom:0;font-size:12px;color:#736e7d;">
            Agenda Diaria - ${new Date(fecha).toLocaleDateString('es-ES')}
          </div>
          <div style="position:absolute;right:20px;bottom:0;font-size:12px;color:#736e7d;">
            Página <span class='pageNumber'></span> de <span class='totalPages'></span>
          </div>
        </div>
      `
        })
        await browser.close()

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="agenda-diaria-${laboratorista?.name || 'laboratorista'}-${new Date(fecha).toISOString().split('T')[0]}.pdf"`
            }
        })
    } catch (error) {
        console.error('Error al generar PDF de agenda diaria:', error)
        return new NextResponse('Error al generar el PDF de agenda diaria', { status: 500 })
    }
}

function renderAgendaDiariaHTML(agendaData: any, eventos: any[], logoBase64: string) {
    const { laboratorista, fecha } = agendaData

    // Función para formatear hora
    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    // Función para formatear fecha
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // Función para formatear estado
    const formatStatus = (estado: string) => {
        if (!estado) return 'AGENDADA'
        return estado.replace(/_/g, ' ')
    }

    return `
  <html>
    <head>
      <meta charset="utf-8" />
      <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700,800,900&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=block" rel="stylesheet">
      <style>
        @font-face {
          font-family: 'Poppins';
          font-style: normal;
          font-weight: 700;
          font-display: block;
          src: url(https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2) format('woff2');
        }
      </style>
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
        .table th { background-color: #f0f0f0; color: #736e7d; font-weight: bold; font-size: 12px; padding: 6px; text-align: left; font-family: 'Inter', sans-serif; }
        .table td { font-size: 0.8125rem; padding: 6px; border-bottom: 1px solid #eee; vertical-align: top; color: #736e7d; font-family: 'Inter', sans-serif; }
        .table tbody { font-size: 0.8125rem; }
        .event-row { page-break-inside: avoid; }
        @page {
          margin: 5mm 5mm 25mm 5mm;
        }
        .agenda-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #736e7d;
          text-align: center;
          margin: 20px 0;
          font-family: 'Inter', sans-serif;
        }
        .laboratorista-info {
          background-color: #f5f5f5;
          padding: 16px;
          margin: 16px 0;
          border-radius: 8px;
          border-left: 4px solid #FF0096;
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="header">
          <div class="header-left">
            <div class="logo-title">
              <img src="${logoBase64}" class="logo" />
              <span class="title">Laboratorio Pampa Austral</span>
            </div>
            <div class="subtitle">Laboratorio Acreditado INN - Chile ISO/IEC 17025-2017</div>
          </div>
          <div class="header-right">
            <div><span class="label">Fecha:</span> ${formatDate(fecha)}</div>
            <div><span class="label">Laboratorista:</span> ${laboratorista?.name || 'No especificado'}</div>
            <div>RPG-05-02 Rev. N° 4</div>
          </div>
        </div>

        <div class="section">
          <div class="agenda-title">Agenda Diaria</div>

          <div class="laboratorista-info">
            <div class="label">Información del Laboratorista</div>
            <div class="value"><b>Nombre:</b> ${laboratorista?.name || 'No especificado'}</div>
            <div class="value"><b>Fecha:</b> ${formatDate(fecha)}</div>
            <div class="value"><b>Total de Visitas:</b> ${eventos.length}</div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Obra</th>
                <th>Comuna</th>
                <th>Estado</th>
                <th>Servicios</th>
              </tr>
            </thead>
            <tbody>
              ${eventos.map((evento: any) => {
        const horaInicio = formatTime(evento.start)
        const horaFin = evento.end ? formatTime(evento.end) : ''
        const cliente = evento.extendedProps?.cliente?.nombreCliente || 'Sin Cliente'
        const obra = evento.extendedProps?.obra?.nombreObra || evento.extendedProps?.direccion || 'Sin ubicación'
        const comuna = evento.extendedProps?.comuna || 'Sin comuna'
        const estado = formatStatus(evento.extendedProps?.estado || 'AGENDADA')

        // Formatear servicios
        const servicios = evento.extendedProps?.servicios || []
        const serviciosText = servicios.map((servicio: any) => {
            if (typeof servicio === 'string') return servicio
            const nombreServicio = servicio.servicio || servicio.nombre || servicio.tipoServicio || servicio.descripcion || 'Servicio'
            const cantidad = servicio.cantidad ? ` (Cant: ${servicio.cantidad})` : ''
            const observaciones = servicio.observaciones ? ` - ${servicio.observaciones}` : ''
            return `${nombreServicio}${cantidad}${observaciones}`
        }).join('<br>')

        return `
                  <tr class="event-row">
                    <td><b>${horaInicio}</b>${horaFin ? `<br><small style="color: #999;">${horaFin}</small>` : ''}</td>
                    <td>${cliente}</td>
                    <td>${obra}</td>
                    <td>${comuna}</td>
                    <td>
                      <span style="padding: 2px 6px; border-radius: 8px; font-size: 10px; font-weight: bold;
                        background-color: ${evento.extendedProps?.estado === 'AGENDADA' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'};
                        color: ${evento.extendedProps?.estado === 'AGENDADA' ? '#4CAF50' : '#F44336'};">
                        ${estado}
                      </span>
                    </td>
                    <td style="font-size: 10px; white-space: pre-wrap;">${serviciosText || 'Sin servicios'}</td>
                  </tr>
                `
    }).join('')}
            </tbody>
          </table>

          ${eventos.length === 0 ? `
            <div style="text-align: center; padding: 40px; color: #999; font-style: italic;">
              No hay visitas programadas para esta fecha
            </div>
          ` : ''}
        </div>
      </div>
    </body>
  </html>
  `
}

