# Guía de Pruebas - Edición de RCM

## Cambios Realizados

### 1. Componente de Edición
✅ Creado `StepperVerticalWithNumbersEdit.tsx` con carga completa de datos

### 2. Integración con Navegador RCM
✅ Modificada función `handleEdit` en `UserListTable.tsx` para redirigir a la página de edición

### 3. Página de Edición
✅ Creada página en `/en/apps/rcm-edit/[id]`

## Flujo de Datos Verificado

### Carga de Datos (GET /api/rcm/[id])

El componente carga y mapea correctamente:

#### ✅ Datos Generales
- `numeroRcm` → Mostrado en el título
- `fechaCodificacion` → Convertida a formato YYYY-MM-DD
- `fechaMuestreo` → Convertida a formato YYYY-MM-DD
- `fechaIngreso` → Convertida a formato YYYY-MM-DD
- `fechaEntrega` → Convertida a formato YYYY-MM-DD
- `observaciones` → Cargadas en el paso 3

#### ✅ Servicios Generales (Paso 1)
```typescript
servicios.map(s => ({
  codigo: s.producto?.sku || s.codigo,
  nombre: s.producto?.nombre || s.nombre,
  cantidad: s.cantidad.toString(),
  productoId: s.productoId,
  estado: s.estado || 'CODIFICADO'
}))
```

#### ✅ Muestras (Paso 2)
Para cada muestra se carga:
- `numeroMuestra`
- `numeroTarjeta`
- `tipoMaterial`
- `elemento`
- `item`
- `grado`
- `procedencia`
- `cota1` y `cota2` (separadas de `cotas`)
- `ubicacionSector`
- `vencimiento` (boolean)
- `observaciones`

#### ✅ Servicios de Muestra
Para cada servicio dentro de una muestra:
- `codigo` (del producto)
- `nombre` (del producto)
- `cantidad`
- `productoId`
- `estado`

#### ✅ Probetas
Para cada probeta:
- `numero`
- `fechaConfeccion` (convertida a YYYY-MM-DD)
- `cantidad`
- `dias`
- `fechaVencimiento` (convertida a YYYY-MM-DD)
- `estado`

## Cómo Probar

### Paso 1: Navegar al Navegador RCM
```
http://localhost:3000/en/apps/rcmnavigator
```

### Paso 2: Hacer clic en el menú de acciones (⋮) de cualquier RCM

### Paso 3: Seleccionar "Editar"
- Se abrirá una nueva pestaña con la URL: `/en/apps/rcm-edit/[ID]`
- Debe mostrar "Editar RCM: [NUMERO_RCM]" en el título

### Paso 4: Verificar Carga de Datos

#### En el Paso 1 (General):
- [ ] Las 4 fechas están cargadas correctamente
- [ ] Los servicios generales aparecen en la tabla
- [ ] Se pueden editar las cantidades de los servicios
- [ ] Se pueden eliminar servicios
- [ ] Se pueden agregar nuevos servicios

#### En el Paso 2 (Muestras):
- [ ] Las muestras agregadas aparecen en acordeones
- [ ] Cada muestra muestra:
  - Número de muestra
  - Número de tarjeta
  - Todos los campos de la muestra
  - Servicios de la muestra con sus estados
  - Probetas (si tiene vencimiento)
- [ ] Se puede agregar una nueva muestra
- [ ] Los servicios de la muestra se pueden editar/eliminar
- [ ] Los estados de los servicios se pueden cambiar

#### En el Paso 3 (Cierre):
- [ ] Las observaciones están cargadas
- [ ] El botón dice "Actualizar RCM" (no "Codificar")

### Paso 5: Editar Datos
- Modificar alguna fecha
- Cambiar cantidad de un servicio
- Agregar una nueva muestra
- Modificar observaciones

### Paso 6: Guardar
- Hacer clic en "Actualizar RCM"
- Debe mostrar toast: "RCM [NUMERO] actualizado exitosamente"
- Debe redirigir a `/en/apps/rcmnavigator`

### Paso 7: Verificar Cambios
- Volver a abrir el RCM en modo edición
- Verificar que los cambios se guardaron correctamente

## Casos de Prueba Específicos

### Caso 1: RCM Simple (sin muestras)
```
- Solo servicios generales
- Sin muestras
- Verificar que se pueda editar y guardar
```

### Caso 2: RCM con Muestras (sin probetas)
```
- Servicios generales
- Múltiples muestras
- Cada muestra con servicios
- Sin probetas
```

### Caso 3: RCM Completo (con probetas)
```
- Servicios generales
- Muestras con vencimiento
- Probetas con fechas
- Verificar que las fechas de probetas se cargan correctamente
```

### Caso 4: Edición de Estados
```
- Cambiar estado de un servicio de muestra de CODIFICADO a ENSAYADO
- Guardar
- Verificar que el estado se actualizó
```

### Caso 5: Agregar Nueva Muestra
```
- Abrir RCM existente
- Ir al paso 2
- Agregar una nueva muestra con servicios
- Guardar
- Verificar que la nueva muestra se agregó
```

## Estructura de Datos Esperada del API

### GET /api/rcm/[id] debe retornar:
```json
{
  "id": 123,
  "numeroRcm": "RCM-2024-001",
  "fechaCodificacion": "2024-01-15T00:00:00.000Z",
  "fechaMuestreo": "2024-01-14T00:00:00.000Z",
  "fechaIngreso": "2024-01-15T00:00:00.000Z",
  "fechaEntrega": "2024-01-20T00:00:00.000Z",
  "observaciones": "Observaciones generales",
  "servicios": [
    {
      "codigo": "S001",
      "nombre": "Servicio 1",
      "cantidad": 2,
      "productoId": 10,
      "estado": "CODIFICADO",
      "producto": {
        "sku": "S001",
        "nombre": "Servicio 1"
      }
    }
  ],
  "muestras": [
    {
      "numeroMuestra": "RCM-2024-001-1",
      "numeroTarjeta": "T001",
      "tipoMaterial": "Hormigón",
      "elemento": "Losa",
      "item": "Item 1",
      "grado": "H30",
      "procedencia": "Planta A",
      "cotas": "10.5 - 12.3",
      "ubicacionSector": "Sector Norte",
      "vencimiento": true,
      "observaciones": "Observaciones de muestra",
      "servicios": [
        {
          "codigo": "E001",
          "nombre": "Ensayo 1",
          "cantidad": 1,
          "productoId": 20,
          "estado": "CODIFICADO",
          "producto": {
            "sku": "E001",
            "nombre": "Ensayo 1"
          }
        }
      ],
      "probetas": [
        {
          "numero": 1,
          "fechaConfeccion": "2024-01-15T00:00:00.000Z",
          "cantidad": 3,
          "dias": 7,
          "fechaVencimiento": "2024-01-22T00:00:00.000Z",
          "estado": "PENDIENTE"
        }
      ]
    }
  ]
}
```

### PUT /api/rcm/[id] debe aceptar:
```json
{
  "fechaCodificacion": "2024-01-15",
  "fechaMuestreo": "2024-01-14",
  "fechaIngreso": "2024-01-15",
  "fechaEntrega": "2024-01-20",
  "servicios": [...],
  "muestras": [...],
  "observaciones": "Observaciones actualizadas"
}
```

## Problemas Conocidos y Soluciones

### Problema: "Error al cargar los datos del RCM"
**Causa**: El endpoint GET /api/rcm/[id] no existe o retorna error
**Solución**: Verificar que el endpoint esté implementado y retorne la estructura correcta

### Problema: Las fechas no se muestran
**Causa**: Las fechas vienen en formato incorrecto del API
**Solución**: El componente convierte automáticamente usando `new Date().toISOString().split('T')[0]`

### Problema: Las cotas no se separan
**Causa**: El campo `cotas` no viene en formato "X - Y"
**Solución**: El componente maneja tanto cotas separadas como combinadas

### Problema: Los servicios no muestran el nombre del producto
**Causa**: El API no incluye el objeto `producto` anidado
**Solución**: El componente usa fallback: `s.producto?.nombre || s.nombre`

## Checklist de Verificación Final

- [ ] El botón "Editar" en el navegador RCM funciona
- [ ] Se abre la página de edición en nueva pestaña
- [ ] El título muestra "Editar RCM: [NUMERO]"
- [ ] Todos los datos se cargan correctamente
- [ ] Se pueden editar todos los campos
- [ ] Se pueden agregar/editar/eliminar servicios
- [ ] Se pueden agregar/editar/eliminar muestras
- [ ] Los estados de servicios se pueden cambiar
- [ ] El botón dice "Actualizar RCM"
- [ ] Al guardar, muestra mensaje de éxito
- [ ] Redirige al navegador después de guardar
- [ ] Los cambios se persisten en la base de datos

## Notas Adicionales

- El componente muestra un spinner mientras carga los datos
- Si hay error al cargar, muestra un toast de error
- El componente valida que todos los campos requeridos estén completos antes de guardar
- Las fechas se manejan en formato ISO (YYYY-MM-DD)
- Los estados de servicios se pueden cambiar haciendo clic en el chip de estado
