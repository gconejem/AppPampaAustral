# Implementación del Componente de Edición de RCM

## Resumen

Se ha creado un nuevo componente específico para editar RCMs existentes, separado del componente de creación para mantener una clara separación de responsabilidades.

## Archivos Creados

### 1. Componente de Edición
**Ubicación**: `src/views/apps/encoder/StepperVerticalWithNumbersEdit.tsx`

Este componente es idéntico al de creación pero con las siguientes diferencias clave:

- **Props**: Recibe `rcmId` (string) en lugar de `otData`, `tipoOT`, etc.
- **Carga de datos**: Hace fetch a `/api/rcm/${rcmId}` al montar
- **Actualización**: Usa `PUT /api/rcm/${rcmId}` en lugar de `POST /api/rcm`
- **UI**: Muestra "Editar RCM: {numeroRcm}" como título

### 2. Página de Ejemplo
**Ubicación**: `src/app/[lang]/(dashboard)/apps/rcm-edit/[id]/page.tsx`

Página de ejemplo que muestra cómo usar el componente de edición con routing dinámico.

### 3. Documentación
**Ubicación**: `src/views/apps/encoder/README_EDIT.md`

Documentación completa sobre cómo usar el componente, estructura de datos esperada, y ejemplos de integración.

## Cómo Usar

### Opción 1: Desde el Navegador RCM

Agregar un botón de edición en la tabla del navegador RCM:

```tsx
// En src/views/apps/rcmnavigator/UserListTable.tsx (o similar)
import { useRouter } from 'next/navigation'

const router = useRouter()

// En la columna de acciones
<IconButton 
  onClick={() => router.push(`/en/apps/rcm-edit/${row.id}`)}
>
  <i className='ri-edit-line' />
</IconButton>
```

### Opción 2: Uso Directo del Componente

```tsx
import StepperVerticalWithNumbersEdit from '@views/apps/encoder/StepperVerticalWithNumbersEdit'

<StepperVerticalWithNumbersEdit rcmId="123" />
```

### Opción 3: Crear tu Propia Página

```tsx
// src/app/[lang]/(dashboard)/apps/mi-pagina/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import StepperVerticalWithNumbersEdit from '@views/apps/encoder/StepperVerticalWithNumbersEdit'

export default function MiPagina() {
  const searchParams = useSearchParams()
  const rcmId = searchParams.get('id')

  if (!rcmId) {
    return <div>ID de RCM no proporcionado</div>
  }

  return <StepperVerticalWithNumbersEdit rcmId={rcmId} />
}
```

## Flujo de Datos

1. **Carga Inicial**:
   - El componente recibe `rcmId`
   - Hace `GET /api/rcm/${rcmId}`
   - Mapea los datos a los estados del formulario
   - Muestra toast de éxito o error

2. **Edición**:
   - El usuario puede modificar todos los campos
   - Agregar/editar/eliminar servicios
   - Agregar/editar/eliminar muestras
   - Agregar/editar/eliminar probetas

3. **Guardado**:
   - Al hacer clic en "Actualizar RCM"
   - Valida los datos
   - Hace `PUT /api/rcm/${rcmId}` con los datos actualizados
   - Muestra toast de éxito o error
   - Redirige a `/en/apps/rcmnavigator`

## Mapeo de Datos

### Fechas
```typescript
// Del API al componente
fechaCodificacion: new Date(data.fechaCodificacion).toISOString().split('T')[0]

// Del componente al API
fechaCodificacion: fechaCodificacion  // Ya está en formato YYYY-MM-DD
```

### Servicios
```typescript
// Del API al componente
servicios: data.servicios.map(s => ({
  codigo: s.producto?.sku || s.codigo,
  nombre: s.producto?.nombre || s.nombre,
  cantidad: s.cantidad?.toString(),
  productoId: s.productoId,
  estado: s.estado || 'CODIFICADO'
}))
```

### Cotas
```typescript
// Del API al componente (cotas combinadas "X - Y")
const [cota1, cota2] = m.cotas ? m.cotas.split(' - ') : ['', '']

// Del componente al API
cotas: cota1 && cota2 ? `${cota1} - ${cota2}` : cota1 || cota2 || ''
```

## Requisitos del API

El componente espera que existan los siguientes endpoints:

### GET /api/rcm/[id]
Retorna los datos completos del RCM incluyendo:
- Datos generales (fechas, observaciones)
- Servicios con sus productos
- Muestras con sus servicios y probetas

### PUT /api/rcm/[id]
Actualiza el RCM con la misma estructura que POST /api/rcm

## Próximos Pasos

1. **Integrar en el Navegador RCM**: Agregar botón de edición en la tabla
2. **Permisos**: Implementar validación de permisos para editar
3. **Historial**: Considerar agregar un log de cambios
4. **Validaciones**: Agregar validaciones adicionales según reglas de negocio

## Notas Técnicas

- El componente usa los mismos estados y lógica que el de creación
- La separación permite mantener código limpio y fácil de mantener
- Los cambios futuros en uno no afectarán al otro
- Ambos componentes comparten las mismas interfaces TypeScript
