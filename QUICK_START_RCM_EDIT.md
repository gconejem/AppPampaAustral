# Guía Rápida: Edición de RCM

## ¿Qué se creó?

Se creó un componente completamente funcional para **editar RCMs existentes**, separado del componente de creación.

## Archivos Creados

```
src/views/apps/encoder/
├── StepperVerticalWithNumbersEdit.tsx  ← Componente de edición
└── README_EDIT.md                      ← Documentación del componente

src/app/[lang]/(dashboard)/apps/rcm-edit/[id]/
└── page.tsx                            ← Página de ejemplo

Documentos raíz:
├── RCM_EDIT_IMPLEMENTATION.md          ← Guía de implementación
├── COMPARISON_CREATE_VS_EDIT.md        ← Comparación entre componentes
└── QUICK_START_RCM_EDIT.md            ← Esta guía
```

## Uso Inmediato

### 1. Acceder a la Página de Edición

Navega a: `http://localhost:3000/en/apps/rcm-edit/[ID_DEL_RCM]`

Ejemplo: `http://localhost:3000/en/apps/rcm-edit/123`

### 2. Agregar Botón de Edición en el Navegador RCM

Encuentra el archivo de la tabla del navegador RCM y agrega:

```tsx
import { useRouter } from 'next/navigation'

// Dentro del componente
const router = useRouter()

// En la columna de acciones de la tabla
<IconButton 
  onClick={() => router.push(`/en/apps/rcm-edit/${row.id}`)}
  title="Editar RCM"
>
  <i className='ri-edit-line' />
</IconButton>
```

### 3. Usar el Componente Directamente

```tsx
import StepperVerticalWithNumbersEdit from '@views/apps/encoder/StepperVerticalWithNumbersEdit'

function MiComponente() {
  return <StepperVerticalWithNumbersEdit rcmId="123" />
}
```

## Flujo de Usuario

1. Usuario hace clic en "Editar" en el navegador RCM
2. Se abre la página de edición con los datos cargados
3. Usuario modifica los datos necesarios:
   - Fechas
   - Servicios (agregar, editar, eliminar)
   - Muestras (agregar, editar, eliminar)
   - Probetas (si aplica)
   - Observaciones
4. Usuario hace clic en "Actualizar RCM"
5. Se guarda y redirige al navegador RCM

## Características

✅ Carga automática de datos del RCM
✅ Edición de todos los campos
✅ Agregar/editar/eliminar servicios
✅ Agregar/editar/eliminar muestras
✅ Agregar/editar/eliminar probetas
✅ Validaciones completas
✅ Mensajes de éxito/error
✅ Redirección automática después de guardar

## Requisitos del API

Asegúrate de que existan estos endpoints:

### GET /api/rcm/[id]
```typescript
// Respuesta esperada
{
  numeroRcm: string
  fechaCodificacion: Date
  fechaMuestreo: Date
  fechaIngreso: Date
  fechaEntrega: Date
  observaciones: string
  servicios: Array<{...}>
  muestras: Array<{...}>
}
```

### PUT /api/rcm/[id]
```typescript
// Body esperado
{
  fechaCodificacion: string
  fechaMuestreo: string
  fechaIngreso: string
  fechaEntrega: string
  servicios: Array<{...}>
  muestras: Array<{...}>
  observaciones: string
}
```

## Próximos Pasos

### Paso 1: Integrar en el Navegador
Agrega el botón de edición en la tabla del navegador RCM.

### Paso 2: Probar
1. Navega a un RCM existente
2. Haz clic en editar
3. Modifica algunos datos
4. Guarda y verifica los cambios

### Paso 3: Personalizar (Opcional)
- Ajusta estilos según tu diseño
- Agrega validaciones adicionales
- Implementa permisos de edición

## Solución de Problemas

### Error: "No se encontró el RCM"
- Verifica que el ID sea correcto
- Verifica que el endpoint GET /api/rcm/[id] funcione

### Error: "Error al actualizar el RCM"
- Verifica que el endpoint PUT /api/rcm/[id] funcione
- Revisa la consola del navegador para más detalles
- Verifica que los datos enviados sean válidos

### Los datos no se cargan
- Abre la consola del navegador
- Verifica que la respuesta del API tenga la estructura correcta
- Revisa el mapeo de datos en el useEffect del componente

## Diferencias con el Componente de Creación

| Aspecto | Creación | Edición |
|---------|----------|---------|
| Props | `otData`, `tipoOT` | `rcmId` |
| Número RCM | Se genera nuevo | Se carga existente |
| Método | POST | PUT |
| Botón | "Codificar" | "Actualizar RCM" |

## Soporte

Para más información, consulta:
- `README_EDIT.md` - Documentación detallada del componente
- `RCM_EDIT_IMPLEMENTATION.md` - Guía de implementación completa
- `COMPARISON_CREATE_VS_EDIT.md` - Comparación detallada

## Ejemplo Completo de Integración

```tsx
// src/views/apps/rcmnavigator/UserListTable.tsx
import { useRouter } from 'next/navigation'
import IconButton from '@mui/material/IconButton'

export default function UserListTable() {
  const router = useRouter()

  return (
    <Table>
      <TableBody>
        {rcms.map((rcm) => (
          <TableRow key={rcm.id}>
            <TableCell>{rcm.numeroRcm}</TableCell>
            <TableCell>{rcm.fechaCodificacion}</TableCell>
            <TableCell>
              {/* Botón de edición */}
              <IconButton 
                onClick={() => router.push(`/en/apps/rcm-edit/${rcm.id}`)}
                color="primary"
                title="Editar RCM"
              >
                <i className='ri-edit-line' />
              </IconButton>
              
              {/* Otros botones de acción */}
              <IconButton title="Ver detalles">
                <i className='ri-eye-line' />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

¡Listo para usar! 🚀
