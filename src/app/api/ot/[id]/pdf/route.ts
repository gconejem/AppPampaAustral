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
        
        
        .info-section {
          border: 1px solid #000;
          padding: 8px;
          margin-bottom: 5px;
          font-size: 9px;
          line-height: 1.4;
        }
        
        .info-line {
          margin-bottom: 4px;
        }
        
        .info-line:last-child {
          margin-bottom: 0;
        }
        
        .info-label {
          font-weight: bold;
          display: inline;
        }
        
        .info-two-column {
          display: flex;
          justify-content: space-between;
        }
        
        .info-left, .info-right {
          flex: 1;
        }
        
        .info-right {
          text-align: right;
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

      <!-- Info Section -->
      <div class="info-section">
        <div class="info-line">
          <span class="info-label">Cliente:</span> ${cliente?.rut || ''} - ${cliente?.nombreCliente || 'Sin cliente'}
        </div>
        <div class="info-line">
          <span class="info-label">Obra:</span> ${obra?.numeroObra || ''} - ${obra?.nombreObra || 'Sin obra'} - Comuna de ${obra?.comuna || 'Sin comuna'} - Región ${obra?.region || 'Sin región'}
        </div>
        
        <br>
        
        <div class="info-line info-two-column">
          <div class="info-left">
            <span class="info-label">Fecha Control:</span> ${parseDateFromBackend(ot.createdAt).toLocaleDateString('es-CL')}
          </div>
          <div class="info-right">
            <span class="info-label">Laboratorista:</span> ${ot.user?.name || 'Sin asignar'}
          </div>
        </div>
        <div class="info-line info-two-column">
          <div class="info-left">
            <span class="info-label">Densímetro:</span> ${equipoInfo.codigoEquipo} Marca:${equipoInfo.marca} Modelo:${equipoInfo.modelo}
          </div>
          <div class="info-right">
            <span class="info-label">Item:</span> ${equipoInfo.item} &nbsp;&nbsp;&nbsp;&nbsp; ${equipoInfo.itemObs || ''}
          </div>
        </div>
        <div class="info-line info-two-column">
          <div class="info-left">
            <span class="info-label">N° de Serie:</span> ${equipoInfo.numeroSerie}
          </div>
          <div class="info-right">
            <span class="info-label">Obs. al item:</span> ${equipoInfo.itemObs || ''}
          </div>
        </div>
        <div class="info-line">
          <span class="info-label">Conteo Estándar:</span> D:${equipoInfo.conteoEstandarD} H:${equipoInfo.conteoEstandarH}
        </div>
        <div class="info-line">
          <span class="info-label">Tiempo Medición:</span> ${equipoInfo.tipoMedicion}
        </div>
        <div class="info-line">
          <span class="info-label">Descrip. visual suelo:</span> ${equipoInfo.descripSuelo}
        </div>
        <div class="info-line">
          <span class="info-label">Observaciones:</span> ${respuesta?.observaciones || 'Sin observaciones'}
        </div>
      </div>

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

// Función para renderizar el HTML del PDF para Retiro de Probetas (R-12-99)
function renderRetiroProbetasHTML(ot: any, logoBase64: string) {
  const jsonData = ot.jsonOT || {}
  const { cliente, obra } = ot.agenda || {}

  // Extraer datos del JSON según la estructura real
  const respuesta = jsonData.RESPUESTA || jsonData

  // Información del retiro de probetas
  const retiroInfo = {
    horaRetiro: respuesta?.hora_retiro || '',
    numTarjeta: respuesta?.num_tarjeta || '',
    otMuestreo: respuesta?.ot_muestreo || '',
    fechaRetiro: respuesta?.fecha_retiro || '',
    tempFinCurado: respuesta?.temp_fin_curado || '',
    formaTransporte: respuesta?.forma_transporte || '',
    condicionAlRetirar: respuesta?.condicion_al_retirar || '',
    condicionTransporte: respuesta?.condicion_transporte || ''
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
          font-size: 10px;
          line-height: 1.3;
          margin: 0;
          padding: 0;
        }
        
        .header {
          display: flex;
          align-items: center;
          border: 1px solid #000;
          margin-bottom: 10px;
        }
        
        .logo-section {
          width: 120px;
          text-align: center;
          border-right: 1px solid #000;
          padding: 10px 5px;
        }
        
        .logo {
          width: 80px;
          height: auto;
        }
        
        .title-section {
          flex: 1;
          text-align: center;
          padding: 15px;
        }
        
        .title {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        .code {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 11px;
          font-style: italic;
        }
        
        .version-info {
          width: 100px;
          border-left: 1px solid #000;
          padding: 10px 5px;
          text-align: center;
        }
        
        .info-section {
          margin-bottom: 15px;
          font-size: 10px;
          line-height: 1.6;
        }
        
        .info-line {
          margin-bottom: 8px;
          border-bottom: 1px solid #000;
          padding-bottom: 3px;
        }
        
        .info-line:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .info-label {
          font-weight: bold;
          display: inline;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 8px;
        }
        
        .info-field {
          flex: 1;
          border-bottom: 1px solid #000;
          padding-bottom: 3px;
          margin-right: 20px;
        }
        
        .info-field:last-child {
          margin-right: 0;
        }
        
        .info-field-half {
          flex: 0.5;
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
          <div class="title">RETIRO DE PROBETAS</div>
          <div class="code">R-12-99</div>
          <div class="subtitle">Confección y curado en Obra<br>(NCh 1017-2009)</div>
        </div>
        <div class="version-info">
          <div style="font-weight: bold;">Versión: 5</div>
        </div>
      </div>

      <!-- Info Section -->
      <div class="info-section">
        <div class="info-line">
          <span class="info-label">Cliente:</span> ${cliente?.rut || ''} - ${cliente?.nombreCliente || 'Sin cliente'}
        </div>
        
        <div class="info-line">
          <span class="info-label">Obra:</span> ${obra?.numeroObra || ''} - ${obra?.nombreObra || 'Sin obra'} - Comuna de ${obra?.comuna || 'Sin comuna'} - Región ${obra?.region || 'Sin región'}
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Laboratorista:</span> ${ot.user?.name || 'Sin asignar'}
          </div>
          <div class="info-field info-field-half">
            <span class="info-label">N° Tarjeta:</span> ${retiroInfo.numTarjeta}
          </div>
          <div class="info-field info-field-half">
            <span class="info-label">OT Muestreo:</span> ${retiroInfo.otMuestreo}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Fecha retiro:</span> ${retiroInfo.fechaRetiro}
          </div>
          <div class="info-field">
            <span class="info-label">Hora retiro:</span> ${retiroInfo.horaRetiro}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Condición de Probetas al retirar:</span> ${retiroInfo.condicionAlRetirar}
          </div>
          <div class="info-field">
            <span class="info-label">T° Fin de curado:</span> ${retiroInfo.tempFinCurado}°C
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Forma de transporte:</span> ${retiroInfo.formaTransporte}
          </div>
          <div class="info-field">
            <span class="info-label">Condición Transporte al Lab:</span> ${retiroInfo.condicionTransporte}
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Función para renderizar el HTML del PDF para Muestreo Hormigón Fresco (R-12-39)
function renderMuestreoHormigonFrescoHTML(ot: any, logoBase64: string) {
  const jsonData = ot.jsonOT || {}
  const { cliente, obra } = ot.agenda || {}

  // Extraer datos del JSON según la estructura real
  const respuesta = jsonData.RESPUESTA || jsonData

  // Información del muestreo de hormigón fresco
  const muestreoInfo = {
    item: respuesta?.item || '',
    clima: respuesta?.clima || '',
    regla: respuesta?.regla || '',
    tAmbiente: respuesta?.t_ambiente || '',
    tHormigon: respuesta?.t_hormigon || '',
    termometro: respuesta?.termometro || '',
    vibradores: respuesta?.vibradores || '',
    conoAbrams: respuesta?.cono_abrams || '',
    numTarjeta: respuesta?.num_tarjeta || '',
    numeroGuia: respuesta?.numero_guia || '',
    tipoMuestra: respuesta?.tipo_muestra || '',
    tipoProbeta: respuesta?.tipo_probeta || '',
    codigoMoldes: respuesta?.codigo_moldes || '',
    fechaIngreso: respuesta?.fecha_ingreso || '',
    horaMuestreo: respuesta?.hora_muestreo || '',
    numeroCamion: respuesta?.numero_camion || '',
    observaciones: respuesta?.observaciones || '',
    tipoHormigon: respuesta?.tipo_hormigon || '',
    fechaMuestreo: respuesta?.fecha_muestreo || '',
    muestreadoPor: respuesta?.muestreado_por || '',
    patenteCamion: respuesta?.patente_camion || '',
    tInicioCurado: respuesta?.t_inicio_curado || '',
    tipoColocacion: respuesta?.tipo_colocacion || '',
    tipoTransporte: respuesta?.tipo_transporte || '',
    lugarExtraccion: respuesta?.lugar_extraccion || '',
    volumenHormigon: respuesta?.volumen_hormigon || '',
    cantidadProbetas: respuesta?.cantidad_probetas || '',
    conoAsentamiento: respuesta?.cono_asentamiento || '',
    ensayoSolicitado: respuesta?.ensayo_solicitado || '',
    horaLlegadaObra: respuesta?.hora_llegada_obra || '',
    horaSalidaPlanta: respuesta?.hora_salida_planta || '',
    horaInicioDescarga: respuesta?.hora_inicio_descarga || '',
    horaTerminoDescarga: respuesta?.hora_termino_descarga || '',
    compactacionProbeta: respuesta?.compactacion_probeta || '',
    caracteristicasMezcla: respuesta?.caracteristicas_mezcla || '',
    curadoInicial: respuesta?.curado_inicial || [],
    procedenciaHormigon: respuesta?.procedencia_hormigon || '',
    probetas: respuesta?.probetas || []
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 8mm;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 8px;
          line-height: 1.2;
          margin: 0;
          padding: 0;
        }
        
        .header {
          display: flex;
          align-items: center;
          border: 1px solid #000;
          margin-bottom: 8px;
        }
        
        .logo-section {
          width: 100px;
          text-align: center;
          border-right: 1px solid #000;
          padding: 8px 5px;
        }
        
        .logo {
          width: 70px;
          height: auto;
        }
        
        .title-section {
          flex: 1;
          text-align: center;
          padding: 10px;
        }
        
        .title {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .references {
          font-size: 7px;
          line-height: 1.1;
          margin-bottom: 3px;
        }
        
        .document-info {
          width: 140px;
          border-left: 1px solid #000;
          padding: 8px 5px;
          font-size: 8px;
        }
        
        .info-section {
          margin-bottom: 8px;
          font-size: 8px;
          line-height: 1.4;
        }
        
        .info-line {
          margin-bottom: 4px;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
        }
        
        .info-line:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .info-label {
          font-weight: bold;
          display: inline;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 4px;
        }
        
        .info-field {
          flex: 1;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          margin-right: 15px;
        }
        
        .info-field:last-child {
          margin-right: 0;
        }
        
        .info-field-narrow {
          flex: 0.6;
        }
        
        .equipment-table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
          font-size: 8px;
        }
        
        .equipment-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          text-align: center;
        }
        
        .equipment-table .label {
          font-weight: bold;
          background-color: #f0f0f0;
        }
        
        .probetas-section {
          display: flex;
          margin: 8px 0;
          gap: 20px;
        }
        
        .probetas-table {
          border-collapse: collapse;
          font-size: 8px;
        }
        
        .probetas-table th,
        .probetas-table td {
          border: 1px solid #000;
          padding: 4px 8px;
          text-align: center;
        }
        
        .probetas-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .observaciones-box {
          flex: 1;
          border: 1px solid #000;
          padding: 8px;
          min-height: 60px;
        }
        
        .obs-title {
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .note-section {
          margin-top: 10px;
          font-size: 7px;
          line-height: 1.3;
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
          <div class="title">MUESTREO HORMIGÓN FRESCO</div>
          <div class="references">
            <strong>REFERENCIAS:</strong> Extracción de muestra del hormigón<br>
            fresco (NCh 171:2008) Requisitos generales de calidad (NCh<br>
            170:2016);Confección y curado en Obra (NCh 1017:2009)<br>
            Determinación de la docilidad (NCh 1019:Of 2009)
          </div>
        </div>
        <div class="document-info">
          <div><strong>R-12-39</strong> &nbsp;&nbsp;&nbsp; <strong>OT N°</strong> ${ot.id}</div>
          <div>Autor: ${ot.user?.name || 'Sin asignar'}</div>
          <div>Aprobado por: Juan Salas Sepulveda</div>
          <div>Fecha Aprobación: 01-11-2021</div>
          <div>Versión: 11</div>
        </div>
      </div>

      <!-- Client and Work Info -->
      <div class="info-section">
        <div class="info-line">
          <span class="info-label">Cliente:</span> ${cliente?.rut || ''} - ${cliente?.nombreCliente || 'Sin cliente'}
        </div>
        <div class="info-line">
          <span class="info-label">Obra:</span> ${obra?.numeroObra || ''} - ${obra?.nombreObra || 'Sin obra'}
        </div>
      </div>

      <!-- Detailed Info -->
      <div class="info-section">
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Laboratorista:</span> ${ot.user?.name || 'Sin asignar'}
          </div>
          <div class="info-field">
            <span class="info-label">Muestreado por:</span> ${muestreoInfo.muestreadoPor}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Item:</span> ${muestreoInfo.item}
          </div>
          <div class="info-field info-field-narrow">
            <span class="info-label">Fecha Muestreo:</span> ${muestreoInfo.fechaMuestreo}
          </div>
          <div class="info-field info-field-narrow">
            <span class="info-label">Hora Muestreo:</span> ${muestreoInfo.horaMuestreo}
          </div>
          <div class="info-field">
            <span class="info-label">T° Inicio Curado:</span> ${muestreoInfo.tInicioCurado}°C
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Fecha Ingreso:</span> ${muestreoInfo.fechaIngreso}
          </div>
          <div class="info-field">
            <span class="info-label">Lugar de Extracción:</span> ${muestreoInfo.lugarExtraccion}
          </div>
          <div class="info-field">
            <span class="info-label">N° de Tarjeta:</span> ${muestreoInfo.numTarjeta}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">N° Correlativo muestra para obra:</span> (No informado)
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Elemento Hormigonado:</span> ${muestreoInfo.item}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Ubicación elemento hormigonado:</span> ${muestreoInfo.lugarExtraccion}
          </div>
        </div>
      </div>

      <!-- Equipment Table -->
      <table class="equipment-table">
        <tr>
          <td class="label">Termómetro:</td>
          <td>${muestreoInfo.termometro}</td>
          <td class="label">Cono Abrams:</td>
          <td>${muestreoInfo.conoAbrams}</td>
          <td class="label">Vibrador:</td>
          <td>${muestreoInfo.vibradores}</td>
          <td class="label">Regla:</td>
          <td>${muestreoInfo.regla}</td>
        </tr>
      </table>

      <!-- Additional Info Grid -->
      <div class="info-section">
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Tipo de Probeta:</span> ${muestreoInfo.tipoProbeta}
          </div>
          <div class="info-field">
            <span class="info-label">Cantidad de Probetas:</span> ${muestreoInfo.cantidadProbetas}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Clima:</span> ${muestreoInfo.clima}
          </div>
          <div class="info-field">
            <span class="info-label">T° Ambiente:</span> ${muestreoInfo.tAmbiente}°C
          </div>
          <div class="info-field">
            <span class="info-label">T° Hormigón:</span> ${muestreoInfo.tHormigon}°C
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Número de Guía:</span> ${muestreoInfo.numeroGuia}
          </div>
          <div class="info-field">
            <span class="info-label">Número de Camión:</span> ${muestreoInfo.numeroCamion}
          </div>
          <div class="info-field">
            <span class="info-label">Patente Camión:</span> ${muestreoInfo.patenteCamion}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Tipo de Hormigón:</span> ${muestreoInfo.tipoHormigon}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Ensayo Solicitado:</span> ${muestreoInfo.ensayoSolicitado}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Hora Salida Planta:</span> ${muestreoInfo.horaSalidaPlanta}
          </div>
          <div class="info-field">
            <span class="info-label">Hora Llegada Obra:</span> ${muestreoInfo.horaLlegadaObra}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Hora Inicio Descarga:</span> ${muestreoInfo.horaInicioDescarga}
          </div>
          <div class="info-field">
            <span class="info-label">Hora Término Descarga:</span> ${muestreoInfo.horaTerminoDescarga}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Tipo de Transporte:</span> ${muestreoInfo.tipoTransporte}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Volumen Hormigón:</span> ${muestreoInfo.volumenHormigon} m3
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Cono Asentamiento:</span> ${muestreoInfo.conoAsentamiento} cm
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Tipo Muestra:</span> ${muestreoInfo.tipoMuestra}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Compactación de la probeta:</span> ${muestreoInfo.compactacionProbeta}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Tipo de Colocación:</span> ${muestreoInfo.tipoColocacion}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Características de la mezcla:</span> ${muestreoInfo.caracteristicasMezcla}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Curado Inicial:</span> ${Array.isArray(muestreoInfo.curadoInicial) ? muestreoInfo.curadoInicial.join(', ') : muestreoInfo.curadoInicial}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Código de los moldes:</span> ${muestreoInfo.codigoMoldes}
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Procedencia del hormigón:</span> ${muestreoInfo.procedenciaHormigon}
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="note-section">
        <p><strong>Nota:</strong> Es responsabilidad del cliente la custodia de las probetas en obra, por tanto ante la pérdida o extravío de estas, serán de su cargo.</p>
        <p>El cliente es responsable del curado inicial de las probetas y no deberán moverse estas del lugar de donde fueron muestreadas hasta el retiro de ellas.</p>
      </div>

      <!-- Probetas Table and Observations -->
      <div class="probetas-section">
        <table class="probetas-table">
          <thead>
            <tr>
              <th>Cantidad</th>
              <th>Días de Ensayo</th>
            </tr>
          </thead>
          <tbody>
            ${muestreoInfo.probetas && muestreoInfo.probetas.length > 0 ? muestreoInfo.probetas.map((probeta: any) => `
              <tr>
                <td>${probeta.cantidad || ''}</td>
                <td>${probeta.dias || ''}</td>
              </tr>
            `).join('') : `
              <tr>
                <td>1</td>
                <td>7</td>
              </tr>
              <tr>
                <td>2</td>
                <td>28</td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="observaciones-box">
          <div class="obs-title">Observaciones:</div>
          <div>${muestreoInfo.observaciones}</div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Función para renderizar el HTML del PDF para Muestreo de Materiales (R-12-27)
function renderMuestreoMaterialesHTML(ot: any, logoBase64: string) {
  const jsonData = ot.jsonOT || {}
  const { cliente, obra } = ot.agenda || {}

  // Extraer datos del JSON según la estructura real
  const respuesta = jsonData.RESPUESTA || jsonData
  const controles = respuesta?.controles || []
  const obsServicio = respuesta?.obs_servicio || ''
  const muestreadoPor = respuesta?.muestreado_por || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 8mm;
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
          margin-bottom: 8px;
        }
        
        .logo-section {
          width: 100px;
          text-align: center;
          border-right: 1px solid #000;
          padding: 8px 5px;
        }
        
        .logo {
          width: 70px;
          height: auto;
        }
        
        .title-section {
          flex: 1;
          text-align: center;
          padding: 15px;
        }
        
        .title {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 5px;
        }
        
        .document-info {
          width: 140px;
          border-left: 1px solid #000;
          padding: 8px 5px;
          font-size: 8px;
        }
        
        .info-section {
          margin-bottom: 8px;
          font-size: 9px;
          line-height: 1.4;
        }
        
        .info-line {
          margin-bottom: 4px;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
        }
        
        .info-line:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .info-label {
          font-weight: bold;
          display: inline;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 4px;
        }
        
        .info-field {
          flex: 1;
          margin-right: 20px;
        }
        
        .info-field:last-child {
          margin-right: 0;
        }
        
        .muestras-title {
          font-weight: bold;
          font-size: 14px;
          margin: 15px 0 8px 0;
        }
        
        .muestras-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 8px;
        }
        
        .muestras-table th,
        .muestras-table td {
          border: 1px solid #000;
          padding: 4px;
          vertical-align: top;
        }
        
        .muestras-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        
        .muestra-row {
          page-break-inside: avoid;
        }
        
        .numero-cell {
          width: 30px;
          text-align: center;
          font-weight: bold;
          vertical-align: middle;
        }
        
        .tarjeta-cell {
          width: 80px;
        }
        
        .area-cell {
          width: 60px;
        }
        
        .ensayos-cell {
          width: 180px;
        }
        
        .item-cell {
          width: 80px;
        }
        
        .tipo-cell {
          width: 80px;
        }
        
        .procedencia-cell {
          width: 120px;
        }
        
        .sector-cell {
          width: 100px;
        }
        
        .obs-cell {
          width: 120px;
        }
        
        .field-label {
          font-weight: bold;
          display: block;
          margin-bottom: 2px;
        }
        
        .field-value {
          display: block;
        }
        
        .ensayos-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .ensayos-list li {
          margin-bottom: 2px;
          font-size: 7px;
          line-height: 1.1;
        }
        
        .observaciones-finales {
          border: 1px solid #000;
          padding: 8px;
          margin-top: 10px;
          min-height: 40px;
        }
        
        .obs-title {
          font-weight: bold;
          margin-bottom: 5px;
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
          <div class="title">MUESTREO DE MATERIALES</div>
        </div>
        <div class="document-info">
          <div><strong>R-12-27</strong> &nbsp;&nbsp;&nbsp; <strong>OT N°</strong> ${ot.id}</div>
          <div>Autor: ${ot.user?.name || 'Sin asignar'}</div>
          <div>Aprobado por: Cristián Salinas Celedón</div>
          <div>Fecha Aprobación: 04-10-2023</div>
          <div>Versión: 12</div>
        </div>
      </div>

      <!-- Client and Work Info -->
      <div class="info-section">
        <div class="info-line">
          <span class="info-label">Cliente:</span> ${cliente?.rut || ''} - ${cliente?.nombreCliente || 'Sin cliente'}
        </div>
        <div class="info-line">
          <span class="info-label">Obra:</span> ${obra?.numeroObra || ''} - ${obra?.nombreObra || 'Sin obra'} - Comuna de ${obra?.comuna || 'Sin comuna'} - Región ${obra?.region || 'Sin región'}
        </div>
      </div>

      <!-- Date and Laboratorist Info -->
      <div class="info-section">
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Fecha de Muestreo:</span> ${parseDateFromBackend(ot.createdAt).toLocaleDateString('es-CL')}
          </div>
        </div>
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Laboratorista:</span> ${ot.user?.name || 'Sin asignar'}
          </div>
          <div class="info-field">
            <span class="info-label">Muestreado por:</span> ${muestreadoPor}
          </div>
        </div>
      </div>

      <!-- Muestras Title -->
      <div class="muestras-title">Muestras</div>

      <!-- Muestras Table -->
      <table class="muestras-table">
        <thead>
          <tr>
            <th class="numero-cell">#</th>
            <th class="tarjeta-cell">N° Tarjeta:</th>
            <th class="area-cell">Área:</th>
            <th class="ensayos-cell">Ensayos / Servicios:</th>
            <th class="item-cell">Item:</th>
            <th class="tipo-cell">Tipo Material:</th>
            <th class="procedencia-cell">Procedencia:</th>
            <th class="sector-cell">Sector:</th>
            <th class="obs-cell">Observaciones:</th>
          </tr>
        </thead>
        <tbody>
          ${controles && controles.length > 0 ? controles.map((control: any, index: number) => {
    // Formatear la lista de ensayos/servicios
    const ensayosList = control.services && control.services.length > 0
      ? control.services.map((service: any) => service.descripcion || '').join('<br>- ')
      : 'Sin ensayos definidos'

    return `
              <tr class="muestra-row">
                <td class="numero-cell">${control.numero || (index + 1)}</td>
                <td class="tarjeta-cell">
                  <span class="field-label">N° Tarjeta:</span> <span class="field-value">${control.n_tarjeta || ''}</span><br>
                  <span class="field-label">Item:</span><br>
                  <span class="field-value">${control.item || ''}</span>
                </td>
                <td class="area-cell">
                  <span class="field-label">Área:</span> <span class="field-value">${control.area || ''}</span><br>
                  <span class="field-label">Tipo Material:</span><br>
                  <span class="field-value">${control.tipo_material || ''}</span>
                </td>
                <td class="ensayos-cell">
                  - ${ensayosList}
                </td>
                <td class="item-cell">
                  <!-- Campo vacío según captura -->
                </td>
                <td class="tipo-cell">
                  <!-- Campo vacío según captura -->
                </td>
                <td class="procedencia-cell">
                  <span class="field-label">Procedencia:</span><br>
                  <span class="field-value">${control.procedencia || ''}</span><br><br>
                  <span class="field-label">Sector:</span><br>
                  <span class="field-value">${control.sector || ''}</span>
                </td>
                <td class="sector-cell">
                  <!-- Campo vacío según captura -->
                </td>
                <td class="obs-cell">
                  <span class="field-label">Observaciones:</span> <span class="field-value">${control.obs_control || 'Sin observaciones'}</span>
                </td>
              </tr>
            `
  }).join('') : `
            <tr>
              <td colspan="9" style="text-align: center; padding: 20px;">Sin muestras registradas</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- Observaciones Finales -->
      <div class="observaciones-finales">
        <div class="obs-title">Observaciones:</div>
        <div>${obsServicio || 'Sin observaciones'}</div>
      </div>
    </body>
    </html>
  `
}

// Función para renderizar el HTML del PDF para Muestreo de Testigos (R-12-58)
function renderMuestreoTestigosHTML(ot: any, logoBase64: string) {
  const jsonData = ot.jsonOT || {}
  const { cliente, obra } = ot.agenda || {}

  // Extraer datos del JSON según la estructura real
  const respuesta = jsonData.RESPUESTA || jsonData
  const controles = respuesta?.controles || []

  // Información específica de testigos
  const testigoInfo = {
    grado: respuesta?.grado || '',
    comuna: respuesta?.comuna || '',
    diametro: respuesta?.diametro || '',
    nombreCapa: respuesta?.nombre_capa || '',
    itemTestigo: respuesta?.item_testigo || '',
    tipoTestigo: respuesta?.tipo_testigo || '',
    fechaMuestreo: respuesta?.fecha_muestreo || '',
    muestreadoPor: respuesta?.muestreado_por || '',
    numeroTarjeta: respuesta?.numero_tarjeta || '',
    tipoPavimento: respuesta?.tipo_pavimento || '',
    marshallMezcla: respuesta?.marshall_mezcla || '',
    codigoTestigera: respuesta?.codigo_testigera || '',
    procedenciaMezcla: respuesta?.procedencia_mezcla || '',
    compactacionExigido: respuesta?.compactacion_exigido || '',
    tiempoUsoTestigera: respuesta?.tiempo_uso_testigera || ''
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 8mm;
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
          margin-bottom: 8px;
        }
        
        .logo-section {
          width: 100px;
          text-align: center;
          border-right: 1px solid #000;
          padding: 8px 5px;
        }
        
        .logo {
          width: 70px;
          height: auto;
        }
        
        .title-section {
          flex: 1;
          text-align: center;
          padding: 10px;
        }
        
        .title {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 3px;
        }
        
        .subtitle {
          font-size: 8px;
          font-style: italic;
          line-height: 1.1;
        }
        
        .document-info {
          width: 140px;
          border-left: 1px solid #000;
          padding: 8px 5px;
          font-size: 8px;
        }
        
        .info-section {
          margin-bottom: 8px;
          font-size: 9px;
          line-height: 1.4;
        }
        
        .info-line {
          margin-bottom: 4px;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
        }
        
        .info-line:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        
        .info-label {
          font-weight: bold;
          display: inline;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 4px;
        }
        
        .info-field {
          flex: 1;
          margin-right: 20px;
        }
        
        .info-field:last-child {
          margin-right: 0;
        }
        
        .info-field-small {
          flex: 0.6;
        }
        
        .testigos-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 8px;
        }
        
        .testigos-table th,
        .testigos-table td {
          border: 1px solid #000;
          padding: 4px;
          vertical-align: top;
          text-align: center;
        }
        
        .testigos-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .testigo-row {
          page-break-inside: avoid;
        }
        
        .numero-col {
          width: 30px;
        }
        
        .ubicacion-col {
          width: 80px;
        }
        
        .fecha-col {
          width: 70px;
        }
        
        .faja-col {
          width: 60px;
        }
        
        .frente-col {
          width: 80px;
        }
        
        .entre-col {
          width: 70px;
        }
        
        .espesor-col {
          width: 60px;
        }
        
        .obs-col {
          width: 80px;
        }
        
        .additional-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 15px 0;
          font-size: 8px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 5px 10px;
          align-items: center;
        }
        
        .grid-label {
          font-weight: bold;
          text-align: right;
        }
        
        .grid-value {
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          min-height: 14px;
        }
        
        .informacion-section {
          margin: 15px 0;
        }
        
        .informacion-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .tiempo-codigo-row {
          display: flex;
          gap: 50px;
          margin-bottom: 15px;
        }
        
        .empty-box {
          border: 1px solid #000;
          height: 80px;
          margin: 15px 0;
        }
        
        .legal-note {
          font-size: 7px;
          line-height: 1.2;
          margin-top: 15px;
          font-style: italic;
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
          <div class="title">MUESTREO DE TESTIGOS</div>
          <div class="subtitle">
            Según Normas NCh 1171/1-2012 (Hormigón)<br>
            ASTM D3549/D3549M-17 (Asfalto)
          </div>
        </div>
        <div class="document-info">
          <div><strong>R-12-58</strong> &nbsp;&nbsp;&nbsp; <strong>OT N°</strong> ${ot.id}</div>
          <div>Autor: ${ot.user?.name || 'Sin asignar'}</div>
          <div>Aprobado por: Cristián Salinas Celedón</div>
          <div>Fecha Aprobación: 15-11-2023</div>
          <div>Versión: 5</div>
        </div>
      </div>

      <!-- Client and Work Info -->
      <div class="info-section">
        <div class="info-line">
          <span class="info-label">Cliente:</span> ${cliente?.rut || ''} - ${cliente?.nombreCliente || 'Sin cliente'}
        </div>
        <div class="info-line">
          <span class="info-label">Obra:</span> ${obra?.numeroObra || ''} - ${obra?.nombreObra || 'Sin obra'} - Región ${obra?.region || 'Sin región'}
        </div>
      </div>

      <!-- Detailed Info -->
      <div class="info-section">
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Comuna (Sector):</span> ${testigoInfo.comuna || obra?.comuna || ''}
          </div>
        </div>
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Laboratorista:</span> ${ot.user?.name || 'Sin asignar'}
          </div>
        </div>
        <div class="info-row">
          <div class="info-field info-field-small">
            <span class="info-label">Fecha de Muestreo:</span> ${testigoInfo.fechaMuestreo}
          </div>
          <div class="info-field info-field-small">
            <span class="info-label">Muestreado por:</span> ${testigoInfo.muestreadoPor}
          </div>
          <div class="info-field info-field-small">
            <span class="info-label">N° Tarjeta:</span> ${testigoInfo.numeroTarjeta}
          </div>
        </div>
        <div class="info-row">
          <div class="info-field info-field-small">
            <span class="info-label">Tipo de Pavimento:</span> ${testigoInfo.tipoPavimento}
          </div>
          <div class="info-field info-field-small">
            <span class="info-label">Tipo Testigo:</span> ${testigoInfo.tipoTestigo}
          </div>
          <div class="info-field info-field-small">
            <span class="info-label">Diámetro:</span> ${testigoInfo.diametro}
          </div>
        </div>
        <div class="info-row">
          <div class="info-field info-field-small">
            <span class="info-label">Item Testigo:</span> ${testigoInfo.itemTestigo}
          </div>
          <div class="info-field info-field-small">
            <span class="info-label">Grado Hormigón:</span> ${testigoInfo.grado}
          </div>
        </div>
      </div>

      <!-- Testigos Table -->
      <table class="testigos-table">
        <thead>
          <tr>
            <th class="numero-col">N°</th>
            <th class="ubicacion-col">Ubicación</th>
            <th class="fecha-col">Fecha Confección</th>
            <th class="faja-col">Faja o Lado</th>
            <th class="frente-col">Frente a Casa y/o Kilómetro</th>
            <th class="entre-col">Entre Calles</th>
            <th class="espesor-col">Espesor de extracción (cm)</th>
            <th class="obs-col">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${controles && controles.length > 0 ? controles.map((control: any) => {
    // Construir campo "Entre Calles"
    let entreText = 'No Aplica'
    if (control.entre_na !== 'true' && control.entre_na !== true) {
      if (control.entre_1 && control.entre_2) {
        entreText = `${control.entre_1} - ${control.entre_2}`
      } else if (control.entre_1) {
        entreText = control.entre_1
      } else if (control.entre_2) {
        entreText = control.entre_2
      }
    }

    return `
              <tr class="testigo-row">
                <td class="numero-col">${control.numero || ''}</td>
                <td class="ubicacion-col">${control.ubicacion || ''}</td>
                <td class="fecha-col">${control.fecha_confeccion || ''}</td>
                <td class="faja-col">${control.faja_lado || ''}</td>
                <td class="frente-col">${control.frente_a || 'No Aplica'}</td>
                <td class="entre-col">${entreText}</td>
                <td class="espesor-col">${control.espesor || ''}</td>
                <td class="obs-col">${control.observaciones || ''}</td>
              </tr>
            `
  }).join('') : `
            <tr>
              <td colspan="8" style="text-align: center; padding: 20px;">Sin testigos registrados</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- Additional Information -->
      <div class="additional-info">
        <div class="info-grid">
          <div class="grid-label">Marshall Mezcla:</div>
          <div class="grid-value">${testigoInfo.marshallMezcla || 'No Aplica'}</div>
          <div class="grid-label">Procedencia Mezcla:</div>
          <div class="grid-value">${testigoInfo.procedenciaMezcla || 'No Aplica'}</div>
          <div class="grid-label">Compactación Exigido:</div>
          <div class="grid-value">${testigoInfo.compactacionExigido || 'No Aplica'}</div>
          <div class="grid-label">Nombre de la Capa:</div>
          <div class="grid-value">${testigoInfo.nombreCapa || 'No Aplica'}</div>
        </div>
      </div>

      <!-- Información -->
      <div class="informacion-section">
        <div class="informacion-title">Información</div>
        <div class="tiempo-codigo-row">
          <div>
            <span class="info-label">Tiempo de uso de la Testigera:</span> ${testigoInfo.tiempoUsoTestigera} minutos
          </div>
          <div>
            <span class="info-label">Código de la Testigera:</span> ${testigoInfo.codigoTestigera}
          </div>
        </div>
      </div>

      <!-- Empty Box -->
      <div class="empty-box"></div>

      <!-- Legal Note -->
      <div class="legal-note">
        <em>En el evento que por motivos ajenos al Laboratorio Pampa Austral, no sea factible efectuar la muestra y controles solicitados, el costo asociado de la movilización deberá ser cancelado por el cliente.</em>
      </div>
    </body>
    </html>
  `
}

// Función para renderizar el HTML del PDF para Toma de Muestra de Extracción (R-12-31)
function renderExtraccionAsfálticaHTML(ot: any, logoBase64: string) {
  const jsonData = ot.jsonOT || {}
  const { cliente, obra } = ot.agenda || {}

  // Extraer datos del JSON según la estructura real
  const respuesta = jsonData.RESPUESTA || jsonData
  const controles = respuesta?.controles || []

  // Información específica de extracción asfáltica
  const extraccionInfo = {
    item: respuesta?.item || '',
    metodo: respuesta?.metodo || '',
    bitumen: respuesta?.bitumen === 'true' || respuesta?.bitumen === true,
    cubicidad: respuesta?.cubicidad === 'true' || respuesta?.cubicidad === true,
    granulometria: respuesta?.granulometria === 'true' || respuesta?.granulometria === true,
    fechaMuestreo: respuesta?.fecha_muestreo || '',
    muestreadoPor: respuesta?.muestreado_por || '',
    fechaConfeccion: respuesta?.fecha_confeccion || '',
    procedenciaAsfalto: respuesta?.procedencia_asfalto || ''
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 8mm;
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
          margin-bottom: 5px;
        }
        
        .logo-section {
          width: 100px;
          text-align: center;
          border-right: 1px solid #000;
          padding: 8px 5px;
        }
        
        .logo {
          width: 70px;
          height: auto;
        }
        
        .title-section {
          flex: 1;
          text-align: center;
          padding: 10px;
        }
        
        .title {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 3px;
        }
        
        .document-info {
          width: 140px;
          border-left: 1px solid #000;
          padding: 8px 5px;
          font-size: 8px;
        }
        
        .references {
          border: 1px solid #000;
          padding: 5px;
          margin-bottom: 5px;
          font-size: 8px;
        }
        
        .ref-title {
          font-weight: bold;
          margin-bottom: 3px;
        }
        
        .info-section {
          margin-bottom: 8px;
          font-size: 9px;
          line-height: 1.4;
        }
        
        .info-line {
          margin-bottom: 4px;
        }
        
        .info-label {
          font-weight: bold;
          display: inline;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 4px;
        }
        
        .info-field {
          flex: 1;
          margin-right: 20px;
        }
        
        .info-field:last-child {
          margin-right: 0;
        }
        
        .info-field-small {
          flex: 0.6;
        }
        
        .ensayos-section {
          display: flex;
          gap: 30px;
          margin: 10px 0;
          font-size: 9px;
        }
        
        .ensayo-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .checkbox {
          width: 12px;
          height: 12px;
          border: 1px solid #000;
          display: inline-block;
          text-align: center;
          line-height: 10px;
          font-size: 8px;
        }
        
        .checked {
          background-color: #000;
          color: white;
        }
        
        .muestras-title {
          font-weight: bold;
          font-size: 12px;
          margin: 15px 0 8px 0;
        }
        
        .muestras-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 7px;
        }
        
        .muestras-table th,
        .muestras-table td {
          border: 1px solid #000;
          padding: 3px;
          vertical-align: top;
          text-align: center;
        }
        
        .muestras-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .muestra-row {
          page-break-inside: avoid;
        }
        
        .num-col { width: 25px; }
        .tarjeta-col { width: 60px; }
        .tipo-ligante-col { width: 80px; }
        .muestra-cliente-col { width: 70px; }
        .agregado-col { width: 70px; }
        .km-inicial-col { width: 50px; }
        .km-final-col { width: 50px; }
        .punto-km-col { width: 60px; }
        .faja-col { width: 80px; }
        .proposito-col { width: 80px; }
        .cantidad-col { width: 70px; }
        .obs-col { width: 80px; }
        
        .observaciones-finales {
          border: 1px solid #000;
          padding: 8px;
          margin-top: 10px;
          min-height: 60px;
        }
        
        .obs-title {
          font-weight: bold;
          margin-bottom: 5px;
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
          <div class="title">TOMA DE MUESTRA DE EXTRACCIÓN</div>
        </div>
        <div class="document-info">
          <div><strong>R-12-31</strong> &nbsp;&nbsp;&nbsp; <strong>OT N°</strong> ${ot.id}</div>
          <div>Autor: ${ot.user?.name || 'Sin asignar'}</div>
          <div>Aprobado por: Cristián Salinas Celedón</div>
          <div>Fecha Aprobación: 15-11-2023</div>
          <div>Versión: 4</div>
        </div>
      </div>

      <!-- References -->
      <div class="references">
        <div class="ref-title">Referencias:</div>
        <div>Método de Muestreo de Mezclas 8.302.27, Diciembre 2003, MC-V8</div>
        <div>Contenido de Bitumen en mezclas. Ensayo de Extracción Según 8.302.36 (MC-V6-2010)</div>
        <div>Método para análisis Granulométrico de agregados proveniente de Extracción Según 8.302.28, Dic 2003, MC-V8</div>
      </div>

      <!-- Client and Basic Info -->
      <div class="info-section">
        <div class="info-line">
          <span class="info-label">Cliente:</span> ${cliente?.rut || ''} - ${cliente?.nombreCliente || 'Sin cliente'}
        </div>
        <div class="info-line">
          <span class="info-label">Obra:</span> ${obra?.numeroObra || ''} - ${obra?.nombreObra || 'Sin obra'} - Comuna de ${obra?.comuna || 'Sin comuna'}
        </div>
        <div class="info-line">
          <span class="info-label">Laboratorista:</span> ${ot.user?.name || 'Sin asignar'}
        </div>
      </div>

      <!-- Detailed Info -->
      <div class="info-section">
        <div class="info-row">
          <div class="info-field info-field-small">
            <span class="info-label">Item:</span> ${extraccionInfo.item}
          </div>
          <div class="info-field info-field-small">
            <span class="info-label">Fecha de Muestreo:</span> ${extraccionInfo.fechaMuestreo}
          </div>
          <div class="info-field">
            <span class="info-label">Muestreado por:</span> ${extraccionInfo.muestreadoPor}
          </div>
        </div>
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Procedencia del Asfalto:</span> ${extraccionInfo.procedenciaAsfalto}
          </div>
          <div class="info-field info-field-small">
            <span class="info-label">Fecha de Confección:</span> ${extraccionInfo.fechaConfeccion}
          </div>
        </div>
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Método de Ensayo:</span> ${extraccionInfo.metodo}
          </div>
        </div>
      </div>

      <!-- Ensayos -->
      <div class="info-section">
        <div class="info-label">Ensayos:</div>
        <div class="ensayos-section">
          <div class="ensayo-item">
            <span class="checkbox ${extraccionInfo.granulometria ? 'checked' : ''}">
              ${extraccionInfo.granulometria ? 'X' : ''}
            </span>
            <span>Granulometría</span>
          </div>
          <div class="ensayo-item">
            <span class="checkbox ${extraccionInfo.bitumen ? 'checked' : ''}">
              ${extraccionInfo.bitumen ? 'X' : ''}
            </span>
            <span>% de Bitumen en la mezcla</span>
          </div>
          <div class="ensayo-item">
            <span class="checkbox ${extraccionInfo.cubicidad ? 'checked' : ''}">
              ${extraccionInfo.cubicidad ? 'X' : ''}
            </span>
            <span>Cubicidad de partículas</span>
          </div>
        </div>
      </div>

      <!-- Muestras Title -->
      <div class="muestras-title">Muestras:</div>

      <!-- Muestras Table -->
      <table class="muestras-table">
        <thead>
          <tr>
            <th class="num-col">#</th>
            <th class="tarjeta-col">N° de Tarjeta</th>
            <th class="tipo-ligante-col">Tipo de Ligante Asfáltico</th>
            <th class="muestra-cliente-col">N° Muestra Cliente:</th>
            <th class="agregado-col">Agregado Usado:</th>
            <th class="km-inicial-col">Km. Inicial:</th>
            <th class="km-final-col">Km. Final:</th>
            <th class="punto-km-col">Punto Kilométrico:</th>
            <th class="faja-col">Faja o lugar de muestreo:</th>
            <th class="proposito-col">Propósito toma de muestra:</th>
            <th class="cantidad-col">Cantidad Representada:</th>
            <th class="obs-col">Sin Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${controles && controles.length > 0 ? controles.map((control: any) => `
            <tr class="muestra-row">
              <td class="num-col">${control.numero || ''}</td>
              <td class="tarjeta-col">${control.n_tarjeta || ''}</td>
              <td class="tipo-ligante-col">${control.tipo_ligante || ''}</td>
              <td class="muestra-cliente-col">${control.n_muestra_cliente || ''}</td>
              <td class="agregado-col">${control.agregado_usado || ''}</td>
              <td class="km-inicial-col">${control.km_inicial || ''}</td>
              <td class="km-final-col">${control.km_final || ''}</td>
              <td class="punto-km-col">${control.punto_kilometrico || ''}</td>
              <td class="faja-col">${control.faja_o_lugar || ''}</td>
              <td class="proposito-col">${control.proposito_muestra || ''}</td>
              <td class="cantidad-col">${control.cantidad_representada || ''}</td>
              <td class="obs-col">${control.observaciones || 'Sin Observaciones'}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="12" style="text-align: center; padding: 20px;">Sin muestras registradas</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- Observaciones Finales -->
      <div class="observaciones-finales">
        <div class="obs-title">Sin Observaciones</div>
      </div>
    </body>
    </html>
  `
}

// Función para renderizar el HTML del PDF para Orden de Trabajo General (R-12-34)
function renderOrdenTrabajoGeneralHTML(ot: any, logoBase64: string) {
  const jsonData = ot.jsonOT || {}
  const { cliente, obra } = ot.agenda || {}

  // Extraer datos del JSON según la estructura real
  const respuesta = jsonData.RESPUESTA || jsonData
  const ensayos = respuesta?.ensayos || []
  const observaciones = respuesta?.observaciones || ''
  const muestreadoPor = respuesta?.muestreado_por || ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page {
          size: A4;
          margin: 8mm;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          line-height: 1.3;
          margin: 0;
          padding: 0;
        }
        
        .header {
          display: flex;
          align-items: center;
          border: 1px solid #000;
          margin-bottom: 10px;
        }
        
        .logo-section {
          width: 100px;
          text-align: center;
          border-right: 1px solid #000;
          padding: 10px 5px;
        }
        
        .logo {
          width: 70px;
          height: auto;
        }
        
        .title-section {
          flex: 1;
          text-align: center;
          padding: 15px;
        }
        
        .title {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 3px;
        }
        
        .document-info {
          width: 140px;
          border-left: 1px solid #000;
          padding: 10px 5px;
          font-size: 9px;
        }
        
        .info-section {
          margin-bottom: 10px;
          font-size: 10px;
          line-height: 1.4;
        }
        
        .info-line {
          margin-bottom: 5px;
        }
        
        .info-label {
          font-weight: bold;
          display: inline;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 5px;
        }
        
        .info-field {
          flex: 1;
          margin-right: 30px;
        }
        
        .info-field:last-child {
          margin-right: 0;
        }
        
        .muestras-title {
          font-weight: bold;
          font-size: 14px;
          margin: 20px 0 10px 0;
        }
        
        .muestras-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 9px;
        }
        
        .muestras-table th,
        .muestras-table td {
          border: 1px solid #000;
          padding: 8px;
          vertical-align: top;
        }
        
        .muestras-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        
        .muestra-row {
          page-break-inside: avoid;
        }
        
        .numero-col {
          width: 30px;
          text-align: center;
        }
        
        .servicio-col {
          width: 60%;
        }
        
        .observaciones-col {
          width: 40%;
        }
        
        .observaciones-finales {
          border: 1px solid #000;
          padding: 10px;
          margin-top: 20px;
          min-height: 100px;
        }
        
        .obs-title {
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .obs-content {
          white-space: pre-line;
          line-height: 1.4;
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
          <div class="title">ORDEN DE TRABAJO GENERAL</div>
        </div>
        <div class="document-info">
          <div><strong>R-12-34</strong> &nbsp;&nbsp;&nbsp; <strong>OT N°</strong> ${ot.id}</div>
          <div>Autor: ${ot.user?.name || 'Sin asignar'}</div>
          <div>Aprobado por: Cristián Salinas Celedón</div>
          <div>Fecha Aprobación: 04-10-2023</div>
          <div>Versión: 1</div>
        </div>
      </div>

      <!-- Client and Work Info -->
      <div class="info-section">
        <div class="info-line">
          <span class="info-label">Cliente:</span> ${cliente?.rut || ''} - ${cliente?.nombreCliente || 'Sin cliente'}
        </div>
        <div class="info-line">
          <span class="info-label">Obra:</span> ${obra?.numeroObra || ''} - ${obra?.nombreObra || 'Sin obra'} - Comuna de ${obra?.comuna || 'Sin comuna'} - Región ${obra?.region || 'Sin región'}
        </div>
      </div>

      <!-- Date and Laboratorist Info -->
      <div class="info-section">
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Fecha de Muestreo:</span> ${parseDateFromBackend(ot.createdAt).toLocaleDateString('es-CL')}
          </div>
        </div>
        <div class="info-row">
          <div class="info-field">
            <span class="info-label">Laboratorista:</span> ${ot.user?.name || 'Sin asignar'}
          </div>
          <div class="info-field">
            <span class="info-label">Muestreado por:</span> ${muestreadoPor}
          </div>
        </div>
      </div>

      <!-- Muestras Title -->
      <div class="muestras-title">Muestras</div>

      <!-- Muestras Table -->
      <table class="muestras-table">
        <thead>
          <tr>
            <th class="numero-col">#</th>
            <th class="servicio-col">Servicio</th>
            <th class="observaciones-col">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${ensayos && ensayos.length > 0 ? ensayos.map((ensayo: any) => {
    // Construir descripción del servicio con norma
    const servicioCompleto = ensayo.norma
      ? `${ensayo.descripcion} ${ensayo.norma}`
      : ensayo.descripcion || 'Servicio no definido'

    return `
              <tr class="muestra-row">
                <td class="numero-col">${ensayo.numero || ''}</td>
                <td class="servicio-col">${servicioCompleto}</td>
                <td class="observaciones-col">${ensayo.obs_muestra || 'Sin observaciones'}</td>
              </tr>
            `
  }).join('') : `
            <tr>
              <td colspan="3" style="text-align: center; padding: 20px;">Sin ensayos registrados</td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- Observaciones Finales -->
      <div class="observaciones-finales">
        <div class="obs-title">Observaciones:</div>
        <div class="obs-content">${observaciones || 'Sin observaciones'}</div>
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
      case 'R-12-99': // Retiro de Probetas
        html = renderRetiroProbetasHTML(ot, logoBase64)
        break
      case 'R-12-39': // Muestreo de Hormigón Fresco
        html = renderMuestreoHormigonFrescoHTML(ot, logoBase64)
        break
      case 'R-12-27': // Muestreo de Materiales
        html = renderMuestreoMaterialesHTML(ot, logoBase64)
        break
      case 'R-12-58': // Muestreo de Testigos
        html = renderMuestreoTestigosHTML(ot, logoBase64)
        break
      case 'R-12-31': // Toma de Muestra de Extracción
        html = renderExtraccionAsfálticaHTML(ot, logoBase64)
        break
      case 'R-12-34': // Orden de Trabajo General
        html = renderOrdenTrabajoGeneralHTML(ot, logoBase64)
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
