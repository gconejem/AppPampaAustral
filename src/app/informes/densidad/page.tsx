import React from 'react'
import ReportTemplate from '../../../views/informes/ReportTemplate'
import templateJson from '../../../data/informe-densidad-template.json'

const mockData = {
    CODIGO: 'SLO005',
    FORMULARIO: 'R-12-03',
    DESCRIP: 'Densidades Suelo Método Nuclear'
}

export default function Page() {
    return (
        <div style={{ padding: 20 }}>
            <ReportTemplate template={templateJson as any} data={mockData} />
        </div>
    )
}
