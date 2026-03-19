"use client";

import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

type Equipo = {
    [key: string]: any;
};

export default function ApiEquiposPage() {
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState<string[]>([]);
    const searchParams = useSearchParams();
    const endpoint = searchParams?.get('endpoint') || 'api-get-lbrutas-join-lbequipos';

    useEffect(() => {
        fetch(`/api/v1/lab/${endpoint}`)
            .then(res => res.json())
            .then(data => {
                console.log('Equipos recibidos:', data);

                const rows = Array.isArray(data)
                    ? data
                    : (data && Array.isArray(data.data) ? data.data : []);

                if (Array.isArray(rows) && rows.length > 0) {
                    const allKeys = Object.keys(rows[0]);

                    setColumns(allKeys);
                    setEquipos(rows);
                } else {
                    setEquipos([]);
                }

                setLoading(false);
            })
            .catch(err => {
                console.error('Error al cargar equipos:', err);
                setLoading(false);
            });
    }, [endpoint]);

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(equipos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = 'equipos.json';
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
                <h2 style={{ margin: 0 }}>Equipos API ({equipos.length} registros)</h2>
                <button onClick={handleDownload} style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 500, cursor: 'pointer' }}>
                    Descargar JSON
                </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 24 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>Cargando...</div>
                ) : equipos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>No hay equipos disponibles</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5' }}>
                                    {columns.map(col => (
                                        <th key={col} style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {equipos.map((equipo, index) => (
                                    <tr key={equipo.CODIGO || equipo.codigo || index} style={{ borderBottom: '1px solid #eee' }}>
                                        {columns.map(col => (
                                            <td key={col} style={{ padding: '10px 8px' }}>
                                                {equipo[col] !== null && equipo[col] !== undefined ? String(equipo[col]) : '-'}
                                            </td>
                                        ))}
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
