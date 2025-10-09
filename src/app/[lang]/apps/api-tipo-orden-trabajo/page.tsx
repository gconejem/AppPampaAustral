"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ApiTipoOrdenTrabajoPage() {
    const [columns, setColumns] = useState<string[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;
        fetch("/api/tipo-orden-trabajo/app")
            .then(r => r.json())
            .then(data => {
                if (!mounted) return;
                // backend puede responder array o { columns, rows }
                if (data && Array.isArray(data.columns) && Array.isArray(data.rows)) {
                    setColumns(data.columns);
                    setRows(data.rows);
                } else if (Array.isArray(data)) {
                    const cols = Array.from(new Set(data.flatMap((o: any) => Object.keys(o))));
                    setColumns(cols);
                    setRows(data);
                } else {
                    setColumns([]);
                    setRows([]);
                }
            })
            .catch(() => { setColumns([]); setRows([]); })
            .finally(() => mounted && setLoading(false));
        return () => { mounted = false; };
    }, []);

    const goHome = () => {
        const lang = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "home" : "home";
        router.push(`/home/apps/api`);
    };

    const handleDownload = () => {
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tipo_orden_trabajo.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={goHome} style={{ background: "transparent", color: "#1976d2", border: "1px solid #1976d2", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontWeight: 500 }}>← Volver</button>
                    <h2 style={{ margin: 0 }}>API - TipoOrdenTrabajo</h2>
                </div>

                <button onClick={handleDownload} style={{ background: "#43a047", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", fontWeight: 500, cursor: "pointer" }}>Descargar JSON</button>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.07)", padding: 18 }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: 40 }}>Cargando...</div>
                ) : columns.length === 0 ? (
                    <div style={{ padding: 20 }}>No hay datos para mostrar.</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: "#f5f5f5" }}>
                                    {columns.map(col => <th key={col} style={{ padding: "10px 8px", fontWeight: 600, textAlign: "left" }}>{col}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                                        {columns.map(col => (
                                            <td key={col} style={{ padding: "10px 8px", verticalAlign: "top", whiteSpace: "pre-wrap" }}>
                                                {row[col] === null || row[col] === undefined ? "-" : (typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col]))}
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
