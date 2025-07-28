# Solución para el Problema de Zona Horaria en el Calendario

## Problema Identificado
Cuando se creaba una visita seleccionando una hora como 22:00-23:00 para el día 28, se guardaba con día 29 y hora 02:00-03:00. Esto se debía a problemas de conversión entre zona horaria local y UTC.

## Causa Raíz
1. El frontend usaba `toISOString()` que convierte fechas a UTC
2. El backend interpretaba estas fechas como UTC sin considerar la zona horaria local
3. Esto causaba un desplazamiento de 4 horas (probablemente GMT-4)

## Solución Implementada

### 1. Utilidades de Fecha (`src/utils/dateUtils.ts`)
Se crearon funciones especializadas para manejar conversiones de zona horaria:

- `formatDateForBackend()`: Ajusta fechas antes de enviar al backend
- `parseDateFromBackend()`: Interpreta fechas que vienen del backend
- `formatDateForInput()`: Formatea fechas para inputs datetime-local
- `formatBackendDateForInput()`: Combina parseo y formateo para inputs

### 2. Cambios en el Frontend

#### AddEventSidebar.tsx
- Importa y usa `formatDateForBackend()` en lugar de `toISOString()`
- Mantiene la hora local correcta al enviar datos al backend

#### EditEventSidebar.tsx
- Usa las utilidades para formatear fechas desde el backend
- Usa `parseDateFromBackend()` para establecer fechas en DatePickers
- Usa `formatBackendDateForInput()` para inputs datetime-local

#### Calendar.tsx
- Elimina conversiones innecesarias a ISO string
- Usa objetos Date directamente para FullCalendar
- Corrige filtros de fecha para evitar doble conversión

### 3. Cambios en el Backend

#### `/api/agenda/route.ts` (POST)
- Agrega función helper `parseLocalDate()`
- Maneja fechas que vienen pre-ajustadas del frontend

#### `/api/agenda/[id]/route.ts` (PUT)
- Misma función helper para actualizaciones
- Mantiene consistencia en el manejo de fechas

## Cómo Probar la Solución

### Prueba 1: Crear Nueva Visita
1. Abrir el calendario
2. Hacer clic en "Agregar Evento"
3. Seleccionar fecha: 28 de enero de 2025
4. Seleccionar hora: 22:00 a 23:00
5. Completar otros campos requeridos
6. Guardar
7. **Verificar**: La visita debe aparecer el día 28 de 22:00 a 23:00

### Prueba 2: Editar Visita Existente
1. Abrir una visita existente para editar
2. Verificar que las fechas y horas se muestran correctamente
3. Cambiar la hora a 22:00-23:00
4. Guardar cambios
5. **Verificar**: Los cambios se reflejan correctamente sin desplazamiento

### Prueba 3: Visualización en Calendario
1. Navegar por diferentes vistas del calendario (mes, semana, día)
2. **Verificar**: Las visitas aparecen en las horas correctas
3. **Verificar**: No hay desplazamientos de fecha/hora
4. **Verificar**: Los eventos que empiezan a medianoche (00:00) se muestran correctamente

### Prueba 4: Eventos de Medianoche
1. Crear o buscar un evento que empiece a las 00:00
2. **Verificar**: El evento aparece en el día correcto a las 00:00
3. **Verificar**: No se muestra en el día anterior a las 20:00 (GMT-4)

## Archivos Modificados

```
src/utils/dateUtils.ts                    (NUEVO)
src/views/apps/calendar/AddEventSidebar.tsx
src/views/apps/calendar/edit/EditEventSidebar.tsx
src/views/apps/calendar/Calendar.tsx
src/app/api/agenda/route.ts
src/app/api/agenda/[id]/route.ts
```

## Archivos de Prueba (Opcionales)
```
src/utils/dateUtils.test.ts              (NUEVO - para verificación)
TIMEZONE_FIX_README.md                   (NUEVO - este archivo)
```

## Notas Técnicas

### Zona Horaria Detectada
El problema sugiere una diferencia de 4 horas, lo que indica zona horaria GMT-4 (posiblemente Chile en horario de verano).

### Estrategia de Solución
En lugar de cambiar la configuración de zona horaria del servidor o base de datos, se optó por:
1. Ajustar fechas en el frontend antes de enviar
2. Interpretar correctamente fechas que vienen del backend
3. Mantener la lógica de negocio intacta

### Compatibilidad
- La solución es compatible con diferentes zonas horarias
- No requiere cambios en la base de datos
- Mantiene la funcionalidad existente

## Problema Específico Resuelto

Basado en los datos de tu API, el problema específico era:
- Eventos a las 00:00-01:00 se guardaban como `00:00:00.000Z` a `01:00:00.000Z` en UTC
- Al convertir a zona local (GMT-4), se mostraban como 20:00-21:00 del día anterior
- Esto causaba que eventos de medianoche "desaparecieran" del día correcto

### Solución Aplicada:
1. **Frontend**: Usa `parseDateFromBackend()` para interpretar fechas UTC como hora local
2. **Filtros**: Corrige doble conversión en filtros de fecha del calendario
3. **Visualización**: Los eventos de medianoche ahora aparecen correctamente a las 00:00

### Resultado:
- Evento ID 18: Ahora se muestra correctamente el 29/07 de 00:00 a 01:00
- Evento ID 19: Se mantiene correctamente el 29/07 de 18:00 a 19:00

## Próximos Pasos
1. Probar exhaustivamente en el entorno de desarrollo
2. Verificar que no hay regresiones en otras funcionalidades
3. Considerar agregar tests unitarios para las utilidades de fecha
4. Documentar el manejo de zona horaria para futuros desarrolladores
