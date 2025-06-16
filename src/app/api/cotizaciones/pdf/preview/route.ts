import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import fs from 'fs'

// Mapeo de formas de pago
const FORMAS_PAGO = {
  CONTADO: 'Contado',
  CREDITO_30: 'Crédito 30 días',
  CREDITO_60: 'Crédito 60 días',
  CREDITO_90: 'Crédito 90 días'
} as const

// Función para formatear la forma de pago
const formatearFormaPago = (formaPago: string): string => {
  return FORMAS_PAGO[formaPago as keyof typeof FORMAS_PAGO] || formaPago
}

function renderCotizacionHTML(cotizacion: any, logoBase64: string) {

    console.log('cotizacionn', cotizacion)

  // Notas para tipo A (Valores Unitarios)
  const notasTipoA = `
    <h2 style="font-size: 1.25rem; color: #736e7d; font-family: 'Inter', sans-serif; margin-top: 40px;">Notas</h2>
    <div class="terminos-condiciones" style="font-size: 12px; color: #736e7d; font-family: 'Inter', sans-serif; text-align: justify;">
      <ol style="margin-top: 0; margin-bottom: 12px; padding-left: 18px;">
        <li><b>Valores unitarios Neto (<span style='text-decoration: underline;'>sin IVA incluido</span>)</b></li>
        <li><b>Adicionales en Terreno (contra evento):</b>
          <ul style="margin-top: 4px; margin-bottom: 8px;">
            <li>Costo adicional del Laboratorista por hora: 1,7 UF – (Se considera una permanencia máxima de 1 hora en obra)</li>
            <li>Jornada completa de Laboratorista (8 horas): 8,4 UF.</li>
            <li>Recargos por jornadas extraordinarias (aplicables a todos los ítems cotizados).
              <ul style="margin-top: 2px; margin-bottom: 2px;">
                <li>50% Adicional: Lunes a jueves desde 18:00 a 21:00 horas, viernes 17:00 a 21:00 horas.</li>
                <li>100% Adicional: Sábado, Domingo o Festivo.</li>
              </ul>
            </li>
          </ul>
        </li>
        <li><b>Adicionales relacionados a los Informes de Laboratorio.</b>
          <ul style="margin-top: 4px; margin-bottom: 8px;">
            <li>Copia digital adicional: 0.15 UF neto.</li>
            <li>Anexo de Informe: 0.42 UF neto - Sin costo si la modificación es responsabilidad del Laboratorio Pampa Austral.</li>
            <li>Informe con firma y timbres físicos: 0.58 UF neto</li>
          </ul>
        </li>
        <li><b>Requisitos adicionales:</b> Todo requerimiento especial como certificaciones, acreditaciones de personal, normativas, reglamentos o exigencias de seguridad y medioambiente, debe informarse previamente para su evaluación y nueva cotización si corresponde.</li>
      </ol>
    </div>
  `;

  // Notas para tipo B (EMS), adaptadas al estilo del PDF
  const notasTipoB = `
    <h2 style="font-size: 1.25rem; color: #736e7d; font-family: 'Inter', sans-serif; margin-top: 40px;">Notas</h2>
    <div class="terminos-condiciones" style="font-size: 12px; color: #736e7d; font-family: 'Inter', sans-serif; text-align: justify;">
      <ul style="margin-top: 0; margin-bottom: 12px; padding-left: 18px;">
        <li><strong>Relacionado al valor del servicio cotizado:</strong>
          <ul style="margin-top: 4px; margin-bottom: 8px;">
            <li>Valor Neto (sin IVA incluido)</li>
            <li>El valor cotizado considera movilización, traslado de personal, equipos y muestras.</li>
            <li>El servicio incluye la emisión de informes digitales sin costo adicional.</li>
          </ul>
        </li>
        <li><strong>Costos Adicionales contra evento:</strong>
          <ul style="margin-top: 4px; margin-bottom: 8px;">
            <li>La solicitud de copia de un Estudio, con firma y timbres en original, tendrá un costo de:
              <ul style="margin-top: 2px; margin-bottom: 2px;">
                <li>Para Estudio con Ingeniería: <strong>3 UF + IVA.</strong></li>
                <li>Para Estudio sin Ingeniería: <strong>1.5 UF + IVA.</strong></li>
              </ul>
            </li>
            <li>Cuando el cliente lo solicita, los estudios podrán ser distribuidos a domicilio indicado, con un costo de envío <strong>0.25 UF neto + IVA.</strong></li>
          </ul>
        </li>
        <li><strong>Consideraciones adicionales y requisitos especiales:</strong>
          <ul style="margin-top: 4px; margin-bottom: 8px;">
            <li>Esta cotización ha sido elaborada en base a los antecedentes proporcionados por el cliente. Cualquier requerimiento adicional deberá ser informado previamente para su evaluación y eventual recotización.</li>
            <li>Los requerimientos adicionales pueden incluir: Normativas técnicas específicas, Acreditaciones de personal, Exigencias de seguridad, medio ambiente u otras disposiciones del mandante.</li>
          </ul>
        </li>
        <li><strong>Condiciones para terreno y accesos:</strong>
          <ul style="margin-top: 4px; margin-bottom: 8px;">
            <li>El cliente debe marcar previamente los puntos de prospección (idealmente con georreferencias).</li>
            <li>Accesos deben estar garantizados por el cliente y el sector a explorar libre de ductos, tuberías, redes subterráneas o cualquier otro elemento que impida la buena ejecución de los trabajos o puedan atentar la seguridad del equipo de trabajo.</li>
            <li>No se considera rotura de pavimento.</li>
          </ul>
        </li>
      </ul>
    </div>
  `;

  // Notas para tipo C (Mensual), adaptadas al estilo del PDF
  const notasTipoC = `
    <h2 style="font-size: 1.25rem; color: #736e7d; font-family: 'Inter', sans-serif; margin-top: 40px;">Notas</h2>
    <div class="terminos-condiciones" style="font-size: 12px; color: #736e7d; font-family: 'Inter', sans-serif; text-align: justify;">
      <ul style="margin-top: 0; margin-bottom: 12px; padding-left: 18px;">
        <li><strong>Valor Neto (<span style='text-decoration: underline;'>sin IVA incluido</span>)</strong></li>
        <li><strong>Adicionales contra evento:</strong>
          <ul style="margin-top: 4px; margin-bottom: 8px;">
            <li><span style='text-decoration: underline;'>Copia</span> digital adicional tiene un costo de <strong>0.15 UF neto.</strong></li>
            <li>Anexo de Informe, tendrá un costo de <strong>0.42 UF neto</strong>, salvo que las modificaciones sean de responsabilidad de Laboratorio Pampa Austral Ltda.</li>
            <li>Informe con firma y timbres físicos tiene un costo de <strong>0.58 UF neto</strong></li>
            <li><strong>Recargos por jornadas extraordinarias</strong> (a todos los ítem de la cotización):
              <ul style="margin-top: 2px; margin-bottom: 2px;">
                <li><strong>50% Adicional</strong> Lunes a jueves desde 18:00 a 21:00 horas, viernes 17:00 a 21:00 horas.</li>
                <li><strong>100% Adicional</strong> Sábado, Domingo o Festivo.</li>
              </ul>
            </li>
          </ul>
        </li>
        <li><strong>Cualquier requisito adicional</strong>, como certificaciones, acreditaciones de personal, normativas, reglamentos o exigencias de seguridad y medioambiente, debe informarse previamente para su evaluación y nueva cotización si corresponde.</li>
      </ul>
    </div>
  `;

  // Selección dinámica de notas
  let notasHTML = notasTipoA;
  if (cotizacion.tipoCotizacion === 'B') notasHTML = notasTipoB;
  else if (cotizacion.tipoCotizacion === 'C') notasHTML = notasTipoC;

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
        .table th { background-color: #f0f0f0; color: #736e7d; font-weight: bold; font-size: 12px; padding: 6px; text-align: left; font-family: 'Inter', sans-serif; }
        .table td { font-size: 0.8125rem; padding: 6px; border-bottom: 1px solid #eee; vertical-align: top; color: #736e7d; font-family: 'Inter', sans-serif; }
        .area-row { background-color: #f5f5f5; font-weight: bold; color: #736e7d; font-family: 'Inter', sans-serif; }
        .totales { margin-top: 16px; text-align: right; color: #736e7d; font-family: 'Inter', sans-serif; font-size: 12px; }
        .totales strong { font-size: 12px; color: #736e7d; font-family: 'Inter', sans-serif; }
        .table tbody { font-size: 0.8125rem; }
        .terminos-condiciones, .terminos-condiciones li { text-align: justify; }
        /* Evitar cortes en saltos de página */
        .table tr { page-break-inside: avoid; }
        .table ul { page-break-inside: avoid; }
        .table li { page-break-inside: avoid; }
        @page { 
          margin: 5mm 5mm 25mm 5mm;
        }
        /* Pie de página con correo en negrita usando pseudo-elemento */
        @page :footer {
          content: "";
        }
        .footer-email {
          font-weight: bold;
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
            <div class="subtitle">Laboratorio acreditado de acuerdo con la Norma NCh-ISO/IEC 17025:2017</div>
          </div>
          <div class="header-right">
            <div><span class="label">N° Cotización:</span> ${cotizacion.numeroCotizacion}</div>
            <div><span class="label">Fecha Emisión:</span> ${new Date(cotizacion.fechaInicio || cotizacion.fechaCreacion).toLocaleDateString('es-CL')}</div>
            <div><span class="label">Fecha Vencimiento:</span> ${new Date(cotizacion.fechaFin || cotizacion.fechaCreacion).toLocaleDateString('es-CL')}</div>
            <div>RPG-05-02 Rev. N° 2</div>
          </div>
        </div>
        <div class="section">
          <div class="row">
            <div class="col">
              <div class="label">En atención a:</div>
              <div class="value"><b>Nombre:</b> ${cotizacion.contacto?.nombre || '-'}</div>
              <div class="value"><b>Cargo:</b> ${cotizacion.contacto?.cargo || '-'}</div>
              <div class="value"><b>Empresa:</b> ${cotizacion.contacto?.empresa || '-'}</div>
              <div class="value"><b>Email:</b> ${cotizacion.contacto?.email || '-'}</div>
            </div>
            <div class="col" style="flex: 1; min-width: 0;">
              <div class="label">Datos Bancarios</div>
              <div class="value">Nombre: Sociedad Laboratorio Pampa Austral Ltda.</div>
              <div class="value">Rut: 77.390.460-K</div>
              <div class="value">Dirección: Calle Santa Blanca N° 51, Chillán. Región de Ñuble, Chile</div>
              <div class="value">Cuenta Corriente: 220-02813-03, Banco de Chile</div>
              <div class="value">Forma de pago: ${formatearFormaPago(cotizacion.formaPago || '-')}</div>
              <div class="value"><b>Métodos de pago:</b> Transferencia, Tarjetas vía flow.cl, solicitar link.</div>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <div class="label">Datos del Proyecto</div>
              <div class="value"><b>Tipo:</b> ${cotizacion.tipoCotizacion === 'A' ? 'Valores Unitarios' : cotizacion.tipoCotizacion === 'B' ? 'EMS' : 'Mensual'}</div>
              <div class="value"><b>Proyecto:</b> ${cotizacion.nombreProyecto || '-'}</div>
              <div class="value"><b>Empresa:</b> ${cotizacion.empresa || '-'}</div>
              <div class="value"><b>Ubicación:</b> ${cotizacion.ubicacion || '-'}</div>
            </div>
          </div>
          ${cotizacion.tipoCotizacion === 'B' ? `
          <div class="row" style="margin-top: 16px;">
            <div class="col">
              <div class="label">Información EMS</div>
              <div class="value"><b>Superficie EMS:</b><br>${(cotizacion.superficieEMS || '-').replace(/\r?\n/g, '<br>')}</div>
              <div class="value"><b>Antecedentes EMS:</b><br>${(cotizacion.antecedentesEMS || '-').replace(/\r?\n/g, '<br>')}</div>
              <div class="value"><b>Plazo de Entrega:</b><br>${(cotizacion.plazoEntregaEMS || '-').replace(/\r?\n/g, '<br>')}</div>
            </div>
          </div>
          ` : ''}
          <table class="table">
            <thead>
              <tr>
                <th style="box-shadow: 0 0 0 1000px #f0f0f0 inset; color: #736e7d; font-weight: bold; font-size: 12px; padding: 6px; text-align: left; font-family: 'Inter', sans-serif;">ÁREA</th>
                <th style="box-shadow: 0 0 0 1000px #f0f0f0 inset; color: #736e7d; font-weight: bold; font-size: 12px; padding: 6px; text-align: left; font-family: 'Inter', sans-serif;">SERVICIO</th>
                <th style="box-shadow: 0 0 0 1000px #f0f0f0 inset; color: #736e7d; font-weight: bold; font-size: 12px; padding: 6px; text-align: left; font-family: 'Inter', sans-serif;">DESCRIPCIÓN</th>
                ${cotizacion.precioEMSPorProducto ? `
                <th style="box-shadow: 0 0 0 1000px #f0f0f0 inset; color: #736e7d; font-weight: bold; font-size: 12px; padding: 6px; text-align: left; font-family: 'Inter', sans-serif;">CANTIDAD</th>
                <th style="box-shadow: 0 0 0 1000px #f0f0f0 inset; color: #736e7d; font-weight: bold; font-size: 12px; padding: 6px; text-align: left; font-family: 'Inter', sans-serif;">PRECIO UNITARIO UF</th>
                <th style="box-shadow: 0 0 0 1000px #f0f0f0 inset; color: #736e7d; font-weight: bold; font-size: 12px; padding: 6px; text-align: left; font-family: 'Inter', sans-serif;">TOTAL NETO UF</th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${(() => {
                let html = '';
                let currentArea = '';
                
                // Recorrer los detalles secuencialmente
                for (let i = 0; i < cotizacion.detalles.length; i++) {
                  const detalle = cotizacion.detalles[i];
                  const area = detalle.producto?.area || detalle.area || 'Sin área';
                  
                  // Si es un subproducto, lo saltamos ya que se mostrará con su paquete
                  if (detalle.esSubProducto) continue;
                  
                  // Si cambia el área y no es un subproducto, mostrar el encabezado del área
                  if (area !== currentArea && !detalle.esSubProducto) {
                    currentArea = area;
                    html += `<tr class="area-row" style="box-shadow: 0 0 0 1000px #f5f5f5 inset; font-weight: bold; color: #736e7d; font-family: 'Inter', sans-serif;">`;
                    html += `<td colspan="${cotizacion.precioEMSPorProducto ? 6 : 3}">${area}</td></tr>`;
                  }
                  
                  // Mostrar el detalle actual
                  if (detalle.esPaquete) {
                    // Construir nombre completo (nombre - norma) en negrita
                    const nombreNorma = `<b>${detalle.servicio || '-'}</b>`;
                    // Label PAQUETE
                    const labelPaquete = '<span style="background-color: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 8px; font-weight: bold;">PAQUETE</span>';
                    // Buscar subproductos
                    let subproductosHtml = '';
                    let j = i + 1;
                    const subproductos: any[] = [];
                    while (j < cotizacion.detalles.length && cotizacion.detalles[j].esSubProducto) {
                      const sub = cotizacion.detalles[j];
                      // Mostrar nombre y norma si existe
                      let nombreSub = sub.servicio || '';
                      if (sub.norma) {
                        nombreSub += ' - ' + sub.norma;
                      }
                      subproductos.push(`<li>${nombreSub}</li>`);
                      j++;
                    }
                    if (subproductos.length > 0) {
                      subproductosHtml = `<ul style='margin: 8px 0 0 0; padding-left: 32px;'>${subproductos.join('')}</ul>`;
                    }
                    html += `<tr>`;
                    html += `<td>${area}</td>`;
                    html += `<td>${nombreNorma}${labelPaquete}${subproductosHtml}</td>`;
                    html += `<td>${detalle.descripcion || '-'}</td>`;
                    if (cotizacion.precioEMSPorProducto) {
                      html += `<td>${detalle.cantidad || '-'}</td>`;
                      html += `<td>${detalle.precioUnitarioUF ? Number(detalle.precioUnitarioUF).toFixed(2) : '-'}</td>`;
                      html += `<td>${detalle.totalNetoUF ? Number(detalle.totalNetoUF).toFixed(2) : '-'}</td>`;
                    }
                    html += `</tr>`;
                    // Saltar los subproductos en el bucle principal
                    i = j - 1;
                  } else {
                    // Producto normal
                    html += `<tr>`;
                    html += `<td>${area}</td>`;
                    html += `<td>${detalle.servicio || '-'}</td>`;
                    html += `<td>${detalle.descripcion || '-'}</td>`;
                    if (cotizacion.precioEMSPorProducto) {
                      html += `<td>${detalle.cantidad || '-'}</td>`;
                      html += `<td>${detalle.precioUnitarioUF ? Number(detalle.precioUnitarioUF).toFixed(2) : '-'}</td>`;
                      html += `<td>${detalle.totalNetoUF ? Number(detalle.totalNetoUF).toFixed(2) : '-'}</td>`;
                    }
                    html += `</tr>`;
                  }
                }
                return html;
              })()}
            </tbody>
          </table>
          <div class="totales">
            ${(() => {
              const subtotal = Number(cotizacion.precioEMSPorProducto ? cotizacion.subtotal : cotizacion.precioEMSTotal);
              const descuento = Number(cotizacion.descuento || 0);
              const subtotalConDescuento = subtotal - descuento;
              const iva = subtotalConDescuento * 0.19;
              const total = subtotalConDescuento + iva;

              return `
                <div><strong>Subtotal:</strong> UF ${subtotal.toFixed(2)}</div>
                <div><strong>Descuento:</strong> UF ${descuento.toFixed(2)}</div>
                <div><strong>IVA (19%):</strong> UF ${iva.toFixed(2)}</div>
                <div><strong>Total: UF ${total.toFixed(2)}</strong></div>
              `;
            })()}
          </div>
          <div style="margin-top:16px; font-size: 12px;"><b>Observaciones:</b><br>${cotizacion.observaciones ? cotizacion.observaciones.replace(/\r?\n/g, '<br>') : 'Sin observaciones'}</div>

          <!-- Página de Notas -->
          <div style="page-break-before: always; width: 100%; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start;">
            <div style="margin: 24px 32px 24px 8px;">
              ${notasHTML}
            </div>
          </div>

          <!-- Primera página de Términos y Condiciones -->
          <div style="page-break-before: always; width: 100%; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-start; align-items: center;">
            <h2 style="font-size: 1.25rem; color: #736e7d; font-family: 'Inter', sans-serif; margin-top: 40px;">TÉRMINOS Y CONDICIONES DEL SERVICIO</h2>
            <div class="terminos-condiciones" style="font-size: 12px; color: #736e7d; font-family: 'Inter', sans-serif; text-align: justify;">
              <br>
              <ol>
                <li><strong>Formalización del Servicio y Condiciones de Facturación:</strong></li>
                  <ol type="a">
                    <li>El trabajo inicia con la <strong>recepción de la OC y el Formulario de ingreso de obra (RPG-05-03)</strong>, confirmando la aceptación de esta cotización.</li>
                    <li>Los volúmenes indicados son referenciales. Se factura en base a servicios realmente ejecutados y conforme a los informes de ensayo emitidos.</li>
                    <li>El <strong>cliente es responsable de verificar la exactitud de la información en OC y documentos enviados para facturación.</strong> Pampa Austral Ltda. no asume responsabilidad por errores en estos documentos, evitando así retrasos en la facturación, pago y entrega de informes.</li>
                    <li>No se emitirán facturas a razones sociales de terceros.</li>
                    <li>Si la facturación requiere la aprobación de la <strong>Minuta de Trabajo</strong>, el <strong><u>plazo máximo para ello será de 5 días</u></strong>. Transcurrido ese plazo sin observaciones, se considera aprobada.</li>
                  </ol>
                <li><strong>Programación de servicios en terreno:</strong></li>
                  <ol type="a">
                    <li>Los <strong>servicios deben programarse con al menos 24 horas de anticipación</strong> al correo <strong>recepcion@pampaustral.cl</strong>, directamente con el Laboratorio y no con personal técnico en terreno.</li>
                    <li><strong><u>El envío de solicitud no garantiza la visita.</u></strong> Esta debe ser confirmada por el Laboratorio.</li>
                    <li>Las solicitudes fuera del horario hábil (lunes a viernes, 08:00 - 18:00) se procesarán el <strong><u>siguiente día hábil</u></strong>.</li>
                    <li>Suspensiones sin aviso previo de 24 h generarán cargos por viáticos y movilización.</li>
                    <li>El laboratorio puede <strong>reprogramar servicios</strong> por condiciones climáticas adversas, según disponibilidad de ambas partes.</li>
                    <li>Informar <strong><u>previo</u></strong> a la programación del servicio si se <strong>requiere acreditación del personal.</strong></li>
                    <li>El cliente debe facilitar los accesos y colaborar en todo lo necesario para evitar retrasos.</li>
                  </ol>
                <li><strong>Toma de Muestras:</strong></li>
                  <ol type="a">
                    <li>Los trabajos en terreno se registrarán en <strong>Órdenes de Trabajo (OT)</strong>, las cuales <u><strong>deberán ser firmadas por representante del cliente</strong> (se sugiere Encargo de Obra, Profesional a cargo o Administrador de Obra).</u> La OT es el documento oficial para la elaboración de informes. Una vez firmada, se considera conforme la información y el volumen de trabajo registrado. Cualquier modificación a la OT debe solicitarse por correo electrónico y será evaluada por el Jefe de Laboratorio.</li>
                    <li>Para <strong>muestreos consecutivos</strong>, el tiempo de espera máximo es de <strong>30 minutos</strong>.</li>
                    <li>Las <strong>muestras tomadas por el cliente se informan como auto control.</strong> El laboratorio solo garantiza la veracidad de los datos obtenidos por su personal técnico en muestreos o controles realizados directamente en obra.</li>
                  </ol>
                <li><strong>Consideraciones técnicas del Servicio:</strong></li>
                  <ol type="a">
                    <li>Serán prestados los servicios de acuerdo a métodos de ensayo y/o normativas vigentes que Pampa Austral Ltda., considere adecuado por razones reglamentarias y normativas técnicas. <strong>De requerir un criterio de ensayo diferente a los aquí expuestos, deben ser establecidos por el mandante previo a la aceptación de esta cotización. Las variantes de ensayos pueden incluir una variación en los precios y plazos establecidos.</strong></li>
                    <li><strong>Los rechequeos por resultados insatisfactorios tendrán valores según listado de precios del Laboratorio.</strong></li>
                    <li>El laboratorio podrá subcontratar servicios acreditados, con acuerdo del cliente.</li>
                    <li>Las muestras se conservan durante 30 días, previa solicitud.</li>
                    <li>Los resultados e informes se emiten y entregan exclusivamente al solicitante del servicio.</li>
                  </ol>
                <li><strong>Pago de Servicios y Entrega de Informes:</strong></li>
                  <ol type="a">
                    <li>Los <strong>Informes Oficiales se entregarán únicamente tras pago de facturas relacionadas.</strong></li>
                    <li><strong>No se emiten informes con resultados provisorios.</strong> Los plazos de entrega varían según el tipo de material y ensayo. Consultas al correo <strong>info@pampaustral.cl</strong>.</li>
                    <li>Los Informes Oficiales se entregan en <strong>formato digital</strong>, y su distribución a terceros es responsabilidad del cliente. Salvo solicitudes formales para <strong>SERVIU</strong>, la cual debe ser realizada mediante carta indicando destinatario, dirección, obra, resolución y mandante.</li>
                    <li>El <strong>comprobante de pago</strong> debe enviarse a <strong>facturacion@pampaustral.cl</strong> con copia a <strong>contacto@pampaustral.cl</strong>, indicando: <strong>número de factura y cotización correspondiente.</strong></li>
                    <li>En caso de morosidad, el laboratorio podrá suspender o finalizar los servicios y en caso de persistir, informar al boletín comercial. El cliente asume costos legales e intereses.</li>
                  </ol>
              </ol>
            </div>
          </div>

          <!-- Segunda página de Términos y Condiciones -->
          <div style="page-break-before: always; width: 100%; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start;">
            <div class="terminos-condiciones" style="font-size: 12px; color: #736e7d; font-family: 'Inter', sans-serif; text-align: justify;">
              <ol start="6">
                <li><strong>Modificaciones y/o observaciones a informes de ensayo:</strong></li>
                  <ol type="a">
                    <li>Se pueden presentar <strong><u>observaciones dentro de 48 horas tras recibir el informe.</u></strong> Transcurrido dicho plazo, el Informe Oficial se dará por Aprobado.</li>
                    <li>Se evaluará la pertinencia de incorporarlas a un <strong>Anexo de Informe</strong>, el cual reemplaza el Informe Emitido, atribución exclusiva del Laboratorio. El Anexo de Informe, deberá ser entregado al Cliente a los <strong>5 días</strong> de recibida las observaciones. Este nuevo informe tendrá un costo, indicado en la presente propuesta económica, salvo que las modificaciones sean de responsabilidad de Laboratorio Pampa Austral Ltda.</li>
                  </ol>
                <li><strong>De responsabilidad del solicitante y/o Cliente:</strong></li>
                  <ol type="a">
                    <li>Gestionar permisos de ingreso del personal, vehículos y equipos, garantizando accesos expeditos y medidas de seguridad adecuadas en faena. En caso de desviaciones, el laboratorio notificará la ocurrencia y/o recurrencia de las desviaciones, si no hubiera respuesta, Pampa Austral Ltda., queda facultado para suspender el servicio y/o adecuar estos, notificando al cliente.  Si por responsabilidad del cliente no es posible efectuar el servicio en terreno, éste será cobrado como si se hubiese efectuado.</li>
                    <li>La custodia de probetas de hormigón fresco es responsabilidad exclusiva del cliente. Su pérdida o extravío será de su cargo.</li>
                    <li>Si se requiere que personal del laboratorio comparezca en procedimientos judiciales o administrativos, los costos asociados serán cotizados previamente.</li>
                  </ol>
                <li><strong>Aspectos de confidencialidad e imparcialidad:</strong></li>
                  <ol type="a">
                    <li>Laboratorio Pampa Austral Ltda. y su personal garantizan la confidencialidad, imparcialidad e independencia en la ejecución de sus servicios. Se comprometen a la protección y uso reservado de la información obtenida o creada durante sus actividades, incluyendo los derechos de propiedad del cliente.</li>
                    <li>En caso de que la ley exija la divulgación de información confidencial o cuando esté autorizado por compromisos contractuales, el cliente será notificado vía correo electrónico con anticipación, salvo que esté prohibido por ley.</li>
                    <li>Laboratorio Pampa Austral Ltda., en su calidad de laboratorio de ensayos acreditado, es auditado periódicamente por la División de Acreditación (DAC) del Instituto Nacional de Normalización (INN), la cual puede acceder de forma aleatoria a información técnica y registros vinculados a los servicios prestados a los clientes, <strong><u>previa suscripción del compromiso de confidencialidad correspondiente</u></strong>, conforme a lo establecido en nuestro Sistema de Gestión de Calidad.</li>
                    <li>Al aceptar esta cotización, el cliente (o su representante) autoriza el ingreso del equipo evaluador de la DAC del INN a sus instalaciones, en caso de que se requiera verificar in situ el desempeño del laboratorio durante la ejecución de ensayos o la toma de muestras, en cumplimiento de los requisitos propios de su condición de Organismo Evaluador de la Conformidad (OEC).</li>
                  </ol>
              </ol>
            </div>
          </div>

          <!-- Página final con firma -->
          <div style="page-break-before: always; width: 100%; min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
            <div style="margin-bottom: 40px; font-size: 12px; color: #736e7d; font-family: 'Inter', sans-serif; text-align: center;">
              MERCEDES LILLO REYES<br />p.p: Sociedad Laboratorio Pampa Austral Ltda.
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}

export async function POST(request: Request) {
  try {
    const cotizacion = await request.json()

    // Cargar logo como base64
    const logoPath = `${process.cwd()}/public/images/logos/PAMPA_MG_2025_017-2.png`;
    const logoBase64 = fs.existsSync(logoPath)
      ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
      : '';

    const html = renderCotizacionHTML(cotizacion, logoBase64);

    // TEMPORAL: devolver HTML en vez de PDF
    /* return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    }) */

    // --- PDF original ---
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '5mm', right: '5mm', bottom: '25mm', left: '5mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-family:'Inter',sans-serif;font-size:9px;color:#736e7d;text-align:center;line-height:1.2;position:relative;">
          Casa Matriz: Calle Santa Blanca N°51, Chillán - Chile<br>
          Fono: 42-223 82 90 | 42-224 02 55 – Horario Atención 8:00h a 18:00h<br>
          <span style="font-weight:bold;">contacto@pampaustral.cl</span>
          <div style="position:absolute;right:20px;bottom:0;font-size:12px;color:#736e7d;">Página <span class='pageNumber'></span> de <span class='totalPages'></span></div>
        </div>
      `
    })
    await browser.close()
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion-preview.pdf"`
      }
    })
  } catch (error) {
    console.error('Error al generar PDF:', error)
    return new NextResponse('Error al generar el PDF', { status: 500 })
  }
} 
