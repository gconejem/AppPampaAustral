'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

const RequestInternalControl = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h6'>Control Interno</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Ejemplo de OT */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <input type="checkbox" />
            <Typography>OT 114793 Muestreo Materiales</Typography>
            <Chip label="Estado OP: Digitado" size="small" color="info" />
          </Box>

          {/* Tabla simple */}
          <Box sx={{ ml: 4 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(58, 53, 65, 0.12)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>RCM</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>Codificado</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>Área</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>Familia</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.875rem' }}>Estado OP</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', fontSize: '0.875rem' }}>180280</td>
                  <td style={{ padding: '8px', fontSize: '0.875rem' }}>17/12/2024</td>
                  <td style={{ padding: '8px', fontSize: '0.875rem' }}>Suelo</td>
                  <td style={{ padding: '8px', fontSize: '0.875rem' }}>Análisis de Suelo</td>
                  <td style={{ padding: '8px', fontSize: '0.875rem' }}>Digitado</td>
                </tr>
              </tbody>
            </table>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default RequestInternalControl
