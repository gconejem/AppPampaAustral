import React from 'react'

import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

interface Muestra {
  id: number
  content: JSX.Element
}

interface AcordeonProps {
  muestras: Muestra[]
}

const Acordeon: React.FC<AcordeonProps> = ({ muestras }) => {
  return (
    <Box sx={{ marginTop: 4 }}>
      {muestras.map(muestra => (
        <Accordion key={muestra.id} sx={{ marginBottom: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Muestra #{muestra.id}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Contenido*/}
            {muestra.content}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}

export default Acordeon
