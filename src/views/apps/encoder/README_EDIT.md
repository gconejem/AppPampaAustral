# StepperVerticalWithNumbersEdit Component

## Descripción
Este componente es una versión específica para **editar** RCMs existentes. Es idéntico al componente de creación (`StepperVerticalWithNumbers`) pero carga y muestra los datos de un RCM existente.

## Diferencias clave con el componente de creación

1. **Props diferentes**: Recibe `rcmId` en lugar de `otData`, `tipoOT`, etc.
2. **Carga de datos**: Al montar el componente, hace un fetch a `/api/rcm/${rcmId}` para cargar los datos existentes
3. **Actualización**: Usa `PUT /api/rcm/${rcmId}` en lugar de `POST /api/rcm`
4. **Título**: Muestra "Editar RCM: {numeroRcm}" en lugar del título de creación

## Uso

```tsx
import StepperVerticalWithNumbersEdit from '@views/apps/encoder/StepperVerticalWithNumbersEdit'

// En tu página o componente
<StepperVerticalWithNumbersEdit 
  rcmId="123" 
  loading={false} 
/>
```

## Props

- `rcmId` (string, requerido): ID del RCM a editar
- `loading` (boolean, opcional): Estado de carga inicial

## Ejemplo de integración en una página

```tsx
// src/app/[lang]/(dashboard)/apps/rcm/edit/[id]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import StepperVerticalWithNumbersEdit from '@views/apps/encoder/StepperVerticalWithNumbersEdit'

export default function EditRCMPage() {
  const params = useParams()
  const rcmId = params.id as string

  return (
    <div>
      <StepperVerticalWithNumbersEdit rcmId={rcmId} />
    </div>
  )
}
```

## Flujo de datos

1. El componente recibe el `rcmId`
2. En el `useEffect`, hace fetch a `/api/rcm/${rcmId}`
3. Mapea los datos recibidos a los estados del formulario:
   - Fechas se convierten a formato ISO
   - Servicios se mapean con sus productos
   - Muestras se cargan con sus servicios y probetas
   - Las cotas combinadas se separan en cota1 y cota2
4. El usuario puede editar los datos
5. Al guardar, se envía `PUT /api/rcm/${rcmId}` con los datos actualizados
6. Redirige a `/en/apps/rcmnavigator` después de guardar

## Estructura de datos esperada del API

```typescript
{
  numeroRcm: string
  fechaCodificacion: Date
  fechaMuestreo: Date
  fechaIngreso: Date
  fechaEntrega: Date
  observaciones: string
  servicios: Array<{
    codigo: string
    nombre: string
    cantidad: number
    productoId: number
    estado: string
    producto: {
      sku: string
      nombre: string
    }
  }>
  muestras: Array<{
    numeroMuestra: string
    numeroTarjeta: string
    tipoMaterial: string
    elemento: string
    item: string
    grado: string
    procedencia: string
    cotas: string  // Se separa en cota1 y cota2
    ubicacionSector: string
    vencimiento: boolean
    observaciones: string
    servicios: Array<...>
    probetas: Array<...>
  }>
}
```

## Notas importantes

- El componente maneja automáticamente la separación de cotas combinadas ("X - Y") en cota1 y cota2
- Los servicios y muestras se pueden agregar, editar y eliminar igual que en el componente de creación
- El estado de carga (`loadingData`) se muestra mientras se cargan los datos del RCM
- Si hay error al cargar, muestra un toast de error y mantiene el estado de carga en false
