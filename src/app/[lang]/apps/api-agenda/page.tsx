"use client";
import { useEffect, useState } from 'react';

type Agenda = {
  id: number;
  fechaInicio: string;
  horaInicio?: string;
  fechaFin: string;
  horaFin?: string;
  cliente?: {
    rut?: string;
    razonSocial?: string;
  };
  obra?: {
    idObra?: number;
    direccion?: string;
  };
  servicios?: { servicio?: string }[];
  asignados?: {
    codigo?: string;
    rut?: string;
    nombre?: string;
    nombreUso?: string;
    nombreCom?: string;
    userId?: string;
    roles?: string[];
  }[];
  equipos?: { codigo?: string }[];
};

export default function ApiAgendaPage() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agenda/app')
      .then(res => res.json())
      .then(data => {
        setAgendas(data);
        setLoading(false);
      });
  }, []);


  // Descargar JSON
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(agendas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agendas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const goHome = () => {
    window.location.href = '/home/apps/api';
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={goHome} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 500, cursor: 'pointer' }}>
          ← Volver
        </button>
        <h2 style={{ margin: 0 }}>Agendas API</h2>
        <button onClick={handleDownload} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 500, cursor: 'pointer' }}>
          Descargar JSON
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>ID</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Fecha Inicio</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Hora Inicio</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Fecha Fin</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Hora Fin</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Cliente RUT</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Cliente Razón Social</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Obra ID</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Obra Dirección</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Servicios</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Asignados</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>Equipos</th>
              </tr>
            </thead>
            <tbody>
              {agendas.map(agenda => (
                <tr key={agenda.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 8px' }}>{agenda.id}</td>
                  <td style={{ padding: '10px 8px' }}>{agenda.fechaInicio}</td>
                  <td style={{ padding: '10px 8px' }}>{agenda.horaInicio}</td>
                  <td style={{ padding: '10px 8px' }}>{agenda.fechaFin}</td>
                  <td style={{ padding: '10px 8px' }}>{agenda.horaFin}</td>
                  <td style={{ padding: '10px 8px' }}>{agenda.cliente?.rut}</td>
                  <td style={{ padding: '10px 8px' }}>{agenda.cliente?.razonSocial}</td>
                  <td style={{ padding: '10px 8px' }}>{agenda.obra?.idObra}</td>
                  <td style={{ padding: '10px 8px' }}>{agenda.obra?.direccion}</td>
                  <td style={{ padding: '10px 8px' }}>
                    {agenda.servicios?.map((s, i) => (
                      <div key={i}>{s.servicio}</div>
                    ))}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    {agenda.asignados?.map((a, i) => (
                      <div key={i} style={{ marginBottom: 4 }}>
                        {a.codigo && <span style={{ marginRight: 6 }}>Código: {a.codigo}</span>}
                        {a.rut && <span style={{ marginRight: 6 }}>RUT: {a.rut}</span>}
                        {a.nombre && <span style={{ marginRight: 6 }}>Nombre: {a.nombre}</span>}
                        {a.nombreUso && <span style={{ marginRight: 6 }}>NombreUso: {a.nombreUso}</span>}
                        {a.nombreCom && <span style={{ marginRight: 6 }}>NombreCom: {a.nombreCom}</span>}
                        {a.userId && <span style={{ marginRight: 6 }}>UserID: {a.userId}</span>}
                        {a.roles && <span style={{ marginRight: 6 }}>Roles: {a.roles.join(', ')}</span>}
                      </div>
                    ))}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    {agenda.equipos?.map((e, i) => (
                      <div key={i}>{e.codigo}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
