'use client'

import React from 'react'

type Field = {
    id: string
    label?: string
    key?: string
    left: number // porcentaje
    top: number // porcentaje
    width: number // porcentaje
    fontSize?: number
}

type PageTemplate = {
    page: number
    fields: Field[]
}

type Template = {
    pdfUrl: string
    pages: PageTemplate[]
}

export default function ReportTemplate({ template, data }: { template: Template; data?: Record<string, any> }) {
    const page = (template?.pages && template.pages[0]) || { fields: [] as Field[] }

    return (
        <div style={{ padding: 16 }}>
            <div style={{ position: 'relative', width: '100%', minHeight: 700, background: '#f5f5f5' }}>
                <object
                    data={template?.pdfUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{ minHeight: 700, display: 'block' }}
                >
                    <p>
                        Tu navegador no soporta PDF embebido. Descargar:{' '}
                        <a href={template?.pdfUrl}>{'Informe'}</a>
                    </p>
                </object>

                {page.fields.map(f => {
                    const text = data && f.key ? (data[f.key] ?? '') : ''
                    return (
                        <div
                            key={f.id}
                            style={{
                                position: 'absolute',
                                left: `${f.left}%`,
                                top: `${f.top}%`,
                                width: `${f.width}%`,
                                fontSize: f.fontSize ?? 12,
                                pointerEvents: 'none',
                                color: '#003366',
                                whiteSpace: 'pre-wrap',
                                transform: 'translateY(-50%)'
                            }}
                        >
                            {text || <span style={{ opacity: 0.35 }}>{f.label}</span>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
