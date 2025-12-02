"use client";
import { useRouter } from 'next/navigation';
import React from 'react';

type Endpoint = { id: number; name: string; estado: string; detalle?: string };

const ENDPOINTS: Endpoint[] = [
    { id: 1, name: 'api-get-lbrutas-check-integracion', estado: 'Construido', detalle: 'LBRUTAS - Disponible' },
    { id: 2, name: 'api-get-lab-result', estado: 'Pendiente', detalle: 'LBRESULT aún no Homologado' },
    { id: 3, name: 'api-get-lab-muestreos', estado: 'Pendiente', detalle: 'LBRUTAOT aún no Homologado' },
    { id: 4, name: 'api-get-lbottmae', estado: 'Pendiente' },
    { id: 5, name: 'api-get-lbrutaot-check-integracion', estado: 'Pendiente' },
    { id: 6, name: 'get-obras', estado: 'Construido', detalle: 'LBOBRAS - Disponible' },
    { id: 7, name: 'api-get-lbrutas-join-lbequipos', estado: 'Construido', detalle: 'LBEQUIPO - Disponible' },
    { id: 8, name: 'api-get-lbrutser', estado: 'Construido', detalle: 'LBRUTSER - Disponible' },
    { id: 9, name: 'api-get-lbdocver', estado: 'Pendiente' },
];

export default function ApiListPage() {
    const router = useRouter();

    const lang = typeof window !== 'undefined'
        ? window.location.pathname.split('/')[1] || 'home'
        : 'home';

    const handleVer = (endpoint: Endpoint) => {
        // rutas especiales según endpoint
        if (endpoint.name === 'get-obras') {
            router.push(`/${lang}/apps/api-obras?endpoint=${encodeURIComponent(endpoint.name)}`);
            return;
        }
        if (endpoint.name === 'api-get-lbrutas-join-lbequipos') {
            router.push(`/${lang}/apps/api-equipos?endpoint=${encodeURIComponent(endpoint.name)}`);
            return;
        }
        // nuevo: TipoOrdenTrabajo para 'api-get-lbrutser'
        if (endpoint.name === 'api-get-lbrutser') {
            router.push(`/${lang}/apps/api-tipo-orden-trabajo?endpoint=${encodeURIComponent(endpoint.name)}`);
            return;
        }

        // fallback: agenda
        router.push(`/${lang}/apps/api-agenda?endpoint=${encodeURIComponent(endpoint.name)}`);
    };

    return (
        <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => router.push(`/${lang}`)}
                        style={{
                            background: 'transparent',
                            color: '#1976d2',
                            border: '1px solid #1976d2',
                            borderRadius: 6,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        ← Volver
                    </button>
                    <h2 style={{ margin: 0 }}>API - Endpoints</h2>
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 18 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>N°</th>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Endpoint</th>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Estado</th>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Observación</th>
                            <th style={{ padding: '10px 8px', textAlign: 'left' }}>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ENDPOINTS.map(ep => (
                            <tr key={ep.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px 8px' }}>{ep.id}</td>
                                <td style={{ padding: '12px 8px' }}>{ep.name}</td>
                                <td style={{ padding: '12px 8px' }}>{ep.estado}</td>
                                <td style={{ padding: '12px 8px' }}>{ep.detalle ?? '-'}</td>
                                <td style={{ padding: '12px 8px' }}>
                                    <button
                                        onClick={() => handleVer(ep)}
                                        disabled={!(ep.id === 1 || ep.name === 'get-obras' || ep.name === 'api-get-lbrutas-join-lbequipos' || ep.name === 'api-get-lbrutser')}
                                        title={(ep.id === 1 || ep.name === 'get-obras' || ep.name === 'api-get-lbrutas-join-lbequipos' || ep.name === 'api-get-lbrutser') ? 'Ver endpoint' : 'No disponible'}
                                        style={{
                                            background: (ep.id === 1 || ep.name === 'get-obras' || ep.name === 'api-get-lbrutas-join-lbequipos' || ep.name === 'api-get-lbrutser') ? '#1976d2' : '#e0e0e0',
                                            color: (ep.id === 1 || ep.name === 'get-obras' || ep.name === 'api-get-lbrutas-join-lbequipos' || ep.name === 'api-get-lbrutser') ? '#fff' : '#8a8a8a',
                                            border: 'none',
                                            borderRadius: 6,
                                            padding: '6px 12px',
                                            cursor: (ep.id === 1 || ep.name === 'get-obras' || ep.name === 'api-get-lbrutas-join-lbequipos' || ep.name === 'api-get-lbrutser') ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        VER
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
