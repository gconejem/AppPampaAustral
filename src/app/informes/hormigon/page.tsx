import React from 'react'
import ReportTemplate from '../../../views/informes/ReportTemplate'
import templateJson from '../../../data/informe-hormigon-template.json'

const mockData = {
    CODIGO: 'HMO001',
    FORMULARIO: 'R-XX-YY',
    DESCRIP: 'Informe Hormigón - mockup'
}

export default function Page() {
    return (
        <div style={{ padding: 20 }}>
            <ReportTemplate template={templateJson as any} data={mockData} />
        </div>
    )
}
