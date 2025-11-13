# Comparación: Componente de Creación vs Edición de RCM

## Tabla Comparativa

| Aspecto | Creación (StepperVerticalWithNumbers) | Edición (StepperVerticalWithNumbersEdit) |
|---------|--------------------------------------|------------------------------------------|
| **Archivo** | `StepperVerticalWithNumbers.tsx` | `StepperVerticalWithNumbersEdit.tsx` |
| **Props** | `otData`, `tipoOT`, `servicioId`, `loading` | `rcmId`, `loading` |
| **Número RCM** | Se obtiene de `/api/rcm/proximo-numero` | Se carga del RCM existente |
| **Carga Inicial** | Campos vacíos con fecha actual | Carga datos de `/api/rcm/${rcmId}` |
| **Método HTTP** | `POST /api/rcm` | `PUT /api/rcm/${rcmId}` |
| **Botón Principal** | "Codificar" | "Actualizar RCM" |
| **Título** | Sin título específico | "Editar RCM: {numeroRcm}" |
| **Datos Adicionales** | Incluye `clienteId`, `obraId`, `ordenTrabajoId` | Solo datos del RCM |
| **Estado de Carga** | `loading` | `loading` + `loadingData` |
| **Mensaje Éxito** | "RCM {numero} guardado exitosamente" | "RCM {numero} actualizado exitosamente" |

## Diferencias en el Código

### Props Interface

**Creación:**
```typescript
interface StepperVerticalWithNumbersProps {
  otData?: any
  otId?: string | null
  tipoOT?: string | null
  servicioId?: string | null
  loading?: boolean
}
```

**Edición:**
```typescript
interface StepperVerticalWithNumbersEditProps {
  rcmId: string
  loading?: boolean
}
```

### useEffect para Número RCM

**Creación:**
```typescript
useEffect(() => {
  fetch('/api/rcm/proximo-numero')
    .then(res => res.json())
    .then(data => {
      setNumeroRcm(data.numeroRcm)
    })
    .catch(error => {
      console.error('Error al obtener próximo número de RCM:', error)
    })
}, [])
```

**Edición:**
```typescript
useEffect(() => {
  if (rcmId) {
    setLoadingData(true)
    fetch(`/api/rcm/${rcmId}`)
      .then(res => res.json())
      .then(data => {
        // Cargar todos los datos del RCM
        setNumeroRcm(data.numeroRcm || '')
        setFechaCodificacion(...)
        setServicios(...)
        setMuestras(...)
        // ... más mapeo de datos
        setLoadingData(false)
        toast.success('Datos del RCM cargados exitosamente')
      })
      .catch(error => {
        console.error('Error al cargar datos del RCM:', error)
        toast.error('Error al cargar los datos del RCM')
        setLoadingData(false)
      })
  }
}, [rcmId])
```

### Función de Guardado

**Creación (handleSaveRCM):**
```typescript
const dataToSend = {
  fechaCodificacion,
  fechaMuestreo,
  fechaIngreso,
  fechaEntrega: fechaEntrega || null,
  servicios,
  muestras: muestrasTransformadas,
  observaciones,
  clienteId,  // Del otData
  obraId,     // Del otData
  ordenTrabajoId  // Del otData
}

const response = await fetch('/api/rcm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dataToSend)
})
```

**Edición (handleUpdateRCM):**
```typescript
const dataToSend = {
  fechaCodificacion,
  fechaMuestreo,
  fechaIngreso,
  fechaEntrega: fechaEntrega || null,
  servicios,
  muestras: muestrasTransformadas,
  observaciones
  // No incluye clienteId, obraId, ordenTrabajoId
}

const response = await fetch(`/api/rcm/${rcmId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dataToSend)
})
```

### Renderizado del Título

**Creación:**
```tsx
<Card>
  <CardContent>
    <StepperWrapper>
      {/* Sin título específico */}
```

**Edición:**
```tsx
<Card>
  <CardContent>
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Typography variant='h5'>Editar RCM: {numeroRcm}</Typography>
    </Box>
    <StepperWrapper>
```

### Botón de Guardado

**Creación:**
```tsx
<Button
  variant='contained'
  color='primary'
  size='medium'
  startIcon={<i className='ri-save-line' />}
  onClick={handleSaveRCM}
>
  Codificar
</Button>
```

**Edición:**
```tsx
<Button
  variant='contained'
  color='primary'
  size='medium'
  startIcon={<i className='ri-save-line' />}
  onClick={handleUpdateRCM}
>
  Actualizar RCM
</Button>
```

## Similitudes

Ambos componentes comparten:

- ✅ Misma estructura de pasos (General, Muestras, Cierre)
- ✅ Misma lógica de validación
- ✅ Mismo selector de productos con filtros
- ✅ Misma gestión de servicios y muestras
- ✅ Misma gestión de probetas
- ✅ Mismos estados disponibles (CODIFICADO, ENSAYADO)
- ✅ Misma interfaz de usuario
- ✅ Mismas interfaces TypeScript

## Cuándo Usar Cada Uno

### Usar StepperVerticalWithNumbers (Creación)
- Al crear un nuevo RCM desde una Orden de Trabajo
- Cuando necesitas vincular el RCM con cliente, obra y OT
- Cuando necesitas generar un nuevo número de RCM

### Usar StepperVerticalWithNumbersEdit (Edición)
- Al editar un RCM existente desde el navegador
- Cuando solo necesitas actualizar los datos del RCM
- Cuando el RCM ya tiene número y relaciones establecidas

## Ventajas de la Separación

1. **Claridad**: Cada componente tiene un propósito específico
2. **Mantenibilidad**: Cambios en uno no afectan al otro
3. **Testing**: Más fácil de probar por separado
4. **Seguridad**: Diferentes validaciones y permisos
5. **Flexibilidad**: Pueden evolucionar independientemente
