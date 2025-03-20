import React from 'react'

import Typography from '@mui/material/Typography'

import type { OrdenTrabajo } from '@/types/otTypes'

interface HormigonFrescoPDFProps {
  ot: OrdenTrabajo
}

const HormigonFrescoPDF: React.FC<HormigonFrescoPDFProps> = ({ ot }) => {
  return (
    <div>
      <Typography variant='h6'>Muestreo de Hormigón Fresco</Typography>
      <Typography>OT: {ot.clave}</Typography>
      <Typography>Fecha: {new Date(ot.createdAt).toLocaleDateString()}</Typography>
      {ot.hormigonFresco && (
        <>
          <Typography>Item: {ot.hormigonFresco.item}</Typography>
          <Typography>Clima: {ot.hormigonFresco.clima}</Typography>
          <Typography>Temperatura Ambiente: {ot.hormigonFresco.tAmbiente}°C</Typography>
          <Typography>Temperatura Hormigón: {ot.hormigonFresco.tHormigon}°C</Typography>
          <Typography>N° Tarjeta: {ot.hormigonFresco.numTarjeta}</Typography>
          <Typography>Tipo Hormigón: {ot.hormigonFresco.tipoHormigon}</Typography>
          <Typography>Volumen: {ot.hormigonFresco.volumenHormigon} m³</Typography>
          <Typography>Cantidad Probetas: {ot.hormigonFresco.cantidadProbetas}</Typography>
          <Typography>Cono Asentamiento: {ot.hormigonFresco.conoAsentamiento} cm</Typography>
          <Typography>Elemento Hormigonado: {ot.hormigonFresco.elementoHormigonado}</Typography>
          <Typography>Ubicación: {ot.hormigonFresco.ubicacionHormigonado}</Typography>
          <Typography>Características Mezcla: {ot.hormigonFresco.caracteristicasMezcla}</Typography>
        </>
      )}
    </div>
  )
}

export default HormigonFrescoPDF
