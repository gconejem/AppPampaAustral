"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Obra = {
    CODIGO?: string | number;
    ESTADO?: string;
    NOMBRE?: string;
    DIRECC?: string;
    CLIE_RUT?: string;
    ciudad?: {
        CODIGO?: string | number;
        NOMBRE?: string;
    };
    [key: string]: any; // para otros campos dinámicos
};

export default function ApiObrasPage() {
    const [obras, setObras] = useState<Obra[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const endpoint = searchParams?.get('endpoint') || 'get-obras';

    useEffect(() => {
        fetch(`/api/v1/lab/${endpoint}`)
            .then(res => res.json())
            .then(data => {
                console.log('Obras recibidas:', data);
                setObras(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error al cargar obras:', err);
                setLoading(false);
            });
    }, [endpoint]);

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(obras, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'obras.json';
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
                <h2 style={{ margin: 0 }}>Obras API ({obras.length} registros)</h2>
                <button onClick={handleDownload} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 500, cursor: 'pointer' }}>
                    Descargar JSON
                </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
                ) : obras.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>No hay obras disponibles</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>CODIGO</th>
                                    <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>ESTADO</th>
                                    <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>NOMBRE</th>
                                    <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>DIRECC</th>
                                    <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>CLIE_RUT</th>
                                    <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left' }}>CIUDAD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {obras.map((obra, index) => (
                                    <tr key={obra.CODIGO || index} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px 8px' }}>{obra.CODIGO ?? '-'}</td>
                                        <td style={{ padding: '10px 8px' }}>{obra.ESTADO ?? '-'}</td>
                                        <td style={{ padding: '10px 8px' }}>{obra.NOMBRE ?? '-'}</td>
                                        <td style={{ padding: '10px 8px' }}>{obra.DIRECC ?? '-'}</td>
                                        <td style={{ padding: '10px 8px' }}>{obra.CLIE_RUT ?? '-'}</td>
                                        <td style={{ padding: '10px 8px' }}>{obra.ciudad?.NOMBRE ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
