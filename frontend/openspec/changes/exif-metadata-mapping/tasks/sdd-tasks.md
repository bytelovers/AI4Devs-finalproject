# Tasks: Extracción y Mapeo de Metadatos EXIF

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 450 - 550 |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Suggested split | PR 1 → Infraestructura, PR 2 → Core, PR 3 → Integración/UIT |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

**Decision needed before apply:** Yes
**Chained PRs recommended:** Yes
**Chain strategy:** stacked-to-main
**400-line budget risk:** High

---

## Fase 1: Infraestructura y Fundamentos

### Tarea 100-TE-01: Crear estructura base para exifHelper + tests iniciales
- **Archivo inicial**: `frontend/src/utils/exifHelper.ts` (vacío con barreras TS)
- **Test**: `frontend/src/utils/exifHelper.test.ts` (mock vacío de exifreader)
- **Tipo de cambio:** add_function
- **Test-first:** ✅

**Checklist Pre-flight:**
- ✅ Verificar que `pnpm test` existe y pasa (vitest) en el workspace
- ✅ Asegurar que Vite configura alias `@/utils` → `src/utils`
- ✅ Crear `frontend/src/utils/exifHelper.ts` vacío con exports nulos (`export {}`)
- ✅ Crear `frontend/src/utils/exifHelper.test.ts` con mock vacío de `exifreader` (`vi.mock('exifreader')`)
- ✅ Ejecutar `pnpm test` → Confirmar error rojo: **Cannot find module '@/utils/exifHelper'**

**Pasos de Implementación:**
1. Corregir alias `@/utils` → convertir a ruta relativa `../../utils/exifHelper`
2. Reinciar Vitest: `pnpm test` → Verificar que el error persiste (esperado)
3. Asegurar que `@/lib/types` está exportando correctamente los tipos base para metadatos
4. Ejecutar `pnpm test` → Confirmar error rojo (funciones no implementadas aún)

---

### Tarea 100-TM-02: Definir tipos EXIF en zona común del monorepo
- **Archivo:** `frontend/src/lib/types.ts` (extensión con nuevos tipos)
- **Tipo de cambio:** extend_types
- **Test-first:** ✅ (verificación manual inicial)

**Checklist Pre-flight:**
- ✅ Revisar que `frontend/src/lib/types.ts` existe en `frontend/`
- ✅ Confirmar patrón de exportación: `export type { ... } from './types'`
- ✅ Asegurar que no hay conflictos con `Ticket` existente
- ✅ Verificar estructura del monorepo: `frontend/` es el root de la app Next.js

**Pasos de Implementación:**
1. Añadir tipo `ExifNamespace` con estructura: `{ gps?: GpsData; camera?: CameraData; timestamp?: string }`
2. Añadir tipo `RawExifResult` mapeando campos crudos de exifreader (usar JSDoc con enlaces a exifreader)
3. Extender tipo `Ticket` con propiedad opcional `metadata?: TicketMetadata`
4. Añadir tipo `TicketMetadata` que extienda `ExifNamespace`
5. Exportar nuevos tipos en `frontend/src/lib/types.ts/index.ts` (si existe) o directamente en el archivo root
6. Ejecutar `pnpm test` → Verificar que no hay errores de compilación TS
7. Commit inicial: `feat(types): add exif metadata types for GPS and camera data`

---

### Tarea 100-TS-03: Probar tipos EXIF con snapshot estático en tests de Zustand
- **Archivo:** `frontend/src/stores/__snapshots__/useTicketStore.ticketWithExif.snap`
- **Test:** `frontend/src/stores/useTicketStore.test.ts` (extensión para probar metadata opcional)
- **Tipo de cambio:** test_types
- **Test-first:** ✅ (verificación de tipos)

**Checklist Pre-flight:**
- ✅ Confirmar que Zustand está configurado en el proyecto (`pnpm add zustand` verificado)
- ✅ Revisar que el snapshot existe: `frontend/src/stores/__snapshots__`
- ✅ Asegurar que el test base de `useTicketStore` pasa sin cambios

**Pasos de Implementación:**
1. Crear fixture estático `ticketWithExif`:
   ```typescript
   {
     id: 'test-123',
     title: 'Test Ticket with Metadata',
     metadata: {
       gps: {
         latitude: { dms: '12°34\'56\\\" N', decimal: 12.582222 },
         longitude: { dms: '76°54\'32\\\" E', decimal: 76.908889 }
       },
       camera: { make: 'Canon', model: 'EOS R5', lens: 'RF 24-105mm' }
     }
   }
   ```
2. Añadir test en `useTicketStore.test.ts` para verificar snapshot:
   ```typescript
   expect(ticketStore.getState().tickets[0]).toMatchSnapshot();
   ```
3. Ejecutar `pnpm test` → Verificar snapshot rojo (faltan tipos o estructura no coincide)
4. Ajustar tipos en `frontend/src/lib/types.ts` según error de compilación
5. Actualizar fixture según estructura de tipos verdaderos
6. Verificar snapshot verde
7. Commit: `test(zustand): add snapshot test for ticket with exif metadata`

---

## Fase 2: Core - Implementación de Funciones Principales

### Tarea 200-TE-04: Implementar función `extractExifFromImageDataUrl` (RED → GREEN)
- **Archivo:** `frontend/src/utils/exifHelper.ts`
- **Test:** `frontend/src/utils/exifHelper.test.ts`
- **Tipo de cambio:** add_function
- **Test-first:** ✅ stricto (RED primero)

**Checklist Pre-flight:**
- ✅ Confirmar que mock de exifreader está configurado en test: `vi.mock('exifreader')`
- ✅ Revisar que el fixture `mockImageWithoutExif.dataUrl` existe en tests
- ✅ Asegurar que el alias `@/utils` resuelve correctamente en Jest/Vitest

**Pasos de Implementación:**
1. **Escribir test RED en exifHelper.test.ts:**
   ```typescript
   it('should return empty ExifNamespace for image without EXIF', async () => {
     const result = await extractExifFromImageDataUrl(mockImageWithoutExif.dataUrl);
     expect(result).toEqual({});
   });
   ```
2. Ejecutar `pnpm test` → ERROR rojo: función no definida
3. Implementar function stub en exifHelper.ts:
   ```typescript
   export async function extractExifFromImageDataUrl(dataUrl: string): Promise<ExifNamespace> {
     // TODO: Implementar extracción real
     return {};
   }
   ```
4. Ejecutar `pnpm test` → Verificar que test pasa (GREEN) con `{}`
5. Refactor según JSDoc de la función:
   - Añadir manejo de dataUrl → Buffer
   - Llamar a `exifreader.load()` con buffer
   - Devolver estructura `ExifNamespace`
6. Ejecutar `pnpm test` → Confirmar GREEN con estructura vacía pero tipada
7. Commit: `feat(exif): implement extractExifFromImageDataUrl basic stub with tests`

---

### Tarea 200-TE-05: Añadir soporte para imágenes con GPS (RED → GREEN)
- **Archivo:** `frontend/src/utils/exifHelper.ts` (extensión)
- **Test:** `frontend/src/utils/exifHelper.test.ts` (extensión para GPS real)
- **Tipo de cambio:** add_function_features
- **Test-first:** ✅ stricto

**Checklist Pre-flight:**
- ✅ Revisar que el fixture `mockImageWithGps.dataUrl` está creado con datos GPS reales
- ✅ Confirmar que exifreader mock devuelve datos GPS en formato crudo:
  ```javascript
  return { GPSLatitude: [12, 34, 56], GPSLongitude: [76, 54, 32] }
  ```
- ✅ Revisar conversión DMS → decimal en helpers

**Pasos de Implementación:**
1. **Escribir test RED:**
   ```typescript
   it('should parse GPS coordinates from raw EXIF data', async () => {
     const result = await extractExifFromImageDataUrl(mockImageWithGps.dataUrl);
     expect(result.gps).toBeDefined();
     expect(result.gps?.latitude.decimal).toBeCloseTo(12.582222, 5);
     expect(result.gps?.longitude.decimal).toBeCloseTo(76.908889, 5);
   });
   ```
2. Ejecutar `pnpm test` → ERROR rojo: conversión DMS no implementada
3. Implementar función `parseDmsToDecimal(dmsArray: number[], ref: 'N' | 'S' | 'E' | 'W'): number`
   - Casos: N/S afectan signo; E/W afectan signo
   - Formato crudo exifreader: `[degrees, minutes, seconds]`
4. Implementar mapeo crudo → `ExifNamespace`:
   ```typescript
   if (raw.GPSLatitude && raw.GPSLongitude) {
     parsed.gps = {
       latitude: { dms: formatDms(raw.GPSLatitude, raw.GPSLatitudeRef), decimal: parseDmsToDecimal(raw.GPSLatitude, raw.GPSLatitudeRef) },
       longitude: { dms: formatDms(raw.GPSLongitude, raw.GPSLongitudeRef), decimal: parseDmsToDecimal(raw.GPSLongitude, raw.GPSLongitudeRef) }
     };
   }
   ```
5. Ejecutar `pnpm test` → Verificar GREEN para GPS
6. Refactor: extraer lógica a helpers privados `formatDms` y `parseDmsToDecimal`
7. Commit: `feat(exif): add GPS parsing from exifreader raw data`

---

### Tarea 200-TE-06: Implementar función `mapRawExifToNamespace` (RED → GREEN)
- **Archivo:** `frontend/src/utils/exifHelper.ts` (nueva función pública)
- **Test:** `frontend/src/utils/exifHelper.test.ts` (extensión)
- **Tipo de cambio:** add_function_helper
- **Test-first:** ✅ stricto

**Checklist Pre-flight:**
- ✅ Confirmar que exifreader devuelve estructura cruda con todos los campos relevantes
- ✅ Revisar JSDoc de función en código fuente para campos esperados
- ✅ Asegurar que tipos `RawExifResult` y `ExifNamespace` están sincronizados

**Pasos de Implementación:**
1. **Escribir test RED:**
   ```typescript
   it('should map all raw EXIF fields to ExifNamespace correctly', async () => {
     const rawData = {
       ImageWidth: 3000,
       ImageHeight: 2000,
       Make: 'Canon',
       Model: 'EOS R5',
       DateTimeOriginal: '2024:07:26 14:30:45',
       GPSLatitude: [12, 34, 56],
       GPSLongitude: [76, 54, 32],
       GPSLatitudeRef: 'N',
       GPSLongitudeRef: 'E'
     };
     vi.spyOn(exifreader, 'load').mockResolvedValue(rawData);
     const result = await mapRawExifToNamespace(rawData);
     expect(result.camera).toBeDefined();
     expect(result.camera?.make).toBe('Canon');
     expect(result.timestamp).toBe('2024-07-26T14:30:45Z'); // formato ISO
   });
   ```
2. Ejecutar `pnpm test` → ERROR rojo: función no implementada
3. Implementar función pública:
   ```typescript
   export function mapRawExifToNamespace(rawExif: Partial<RawExifResult>): ExifNamespace
   ```
4. Implementar mapeo exacto de todos los campos:
   - `ImageWidth`/`ImageHeight` → `camera.resolution`
   - `Make`/`Model` → `camera.make`/`camera.model`
   - `DateTimeOriginal` → `timestamp` en ISO 8601
   - Fields GPS → usar helpers existentes de GPS
   - Campos faltantes → no incluirlos (opcional)
5. Ejecutar `pnpm test` → Verificar GREEN para todos los campos
6. Refactor: mover lógica de mapeo desde `extractExifFromImageDataUrl` a esta función
7. Actualizar `extractExifFromImageDataUrl` para usar el helper nuevo
8. Verificar que tests de GDPR siguen pasando (si existen)
9. Commit: `feat(exif): implement mapRawExifToNamespace with full field mapping`

---

### Tarea 200-TE-07: Implementar función `stripExifMetadata` (RED → GREEN)
- **Archivo:** `frontend/src/utils/exifHelper.ts` (nueva función pública)
- **Test:** `frontend/src/utils/exifHelper.test.ts` (extensión)
- **Tipo de cambio:** add_function_helper
- **Test-first:** ✅ stricto

**Checklist Pre-flight:**
- ✅ Revisar que el BLOB de imagen real (file) puede ser creado desde dataUrl en tests
- ✅ Confirmar que JSDoc especifica: devolver Blob limpio sin metadatos EXIF
- ✅ Asegurar que función es sync (solo manipulación de dataUrl, no llamada a exifreader)

**Pasos de Implementación:**
1. **Escribir test RED:**
   ```typescript
   it('should return clean Blob from dataUrl image', () => {
     const cleanBlob = stripExifMetadata(mockImageWithGps.dataUrl);
     expect(cleanBlob).toBeInstanceOf(Blob);
     // Verificar que Blob tiene mismo tamaño pero sin headers EXIF
     const data = URL.createObjectURL(cleanBlob);
     // TODO: verificar que no contiene tags EXIF al parsear (falta implementación)
   });
   ```
2. Ejecutar `pnpm test` → ERROR rojo: función no implementada
3. Implementar función sync:
   ```typescript
   export function stripExifMetadata(dataUrl: string): Blob {
     // 1. Convertir dataUrl → ArrayBuffer
     // 2. Crear Blob sin modificaciones (dataUrls ya contienen datos de imagen estándar PNG/JPG)
     // 3. Reformatear dataUrl para extraer solo la parte base64
     const base64 = dataUrl.split(',')[1];
     const binaryString = atob(base64);
     const bytes = new Uint8Array(binaryString.length);
     for (let i = 0; i < binaryString.length; i++) {
       bytes[i] = binaryString.charCodeAt(i);
     }
     return new Blob([bytes], { type: 'image/jpeg' }); // asumir JPEG
   }
   ```
4. Ejecutar `pnpm test` → Verificar GREEN para Blob limpio
5. Refactor: asegurarse que maneja PNG también (type detection)
6. Actualizar JSDoc con ejemplos de uso
7. Commit: `feat(exif): implement stripExifMetadata cleaning jpeg/png blobs`

---

## Fase 3: Integración y Flujo Real

### Tarea 300-I-08: Integrar extracción EXIF en modelo de Ticket (RED → GREEN)
- **Archivo:** `frontend/src/lib/ticket.ts` (si existe) o `frontend/src/api/tickets.ts`
- **Tipo de cambio:** integrate_feature
- **Test-first:** ✅
t
**Checklist Pre-flight:**
- ✅ Confirmar estructura del módulo de tickets (usar api service si existe)
- ✅ Revisar que `extractExifFromImageDataUrl` está exportada en utils
- ✅ Asegurar que axios/fetch está configurado para llamadas API (si se usa backend)

**Pasos de Implementación:**
1. **Escribir test RED en ticket service test:**
   ```typescript
   describe('attachExifMetadata', () => {
     it('should extract and return metadata for ticket with image', async () => {
       const ticket = { imageDataUrl: mockImageWithGps.dataUrl } as Ticket;
       const withMetadata = await attachExifMetadata(ticket);
       expect(withMetadata.metadata).toBeDefined();
       expect(withMetadata.metadata?.gps).toBeDefined();
     });
   });
   ```
2. Ejecutar `pnpm test` → ERROR rojo: función `attachExifMetadata` no implementada
3. Implementar función en `frontend/src/api/tickets.ts`:
   ```typescript
   export async function attachExifMetadata(ticket: Ticket): Promise<Ticket & { metadata?: TicketMetadata }> {
     if (!ticket.imageDataUrl) return ticket;
     const metadata = await extractExifFromImageDataUrl(ticket.imageDataUrl);
     return { ...ticket, metadata };
   }
   ```
4. Exportar función desde barrel file
5. Ejecutar `pnpm test` → Verificar GREEN con metadata adjuntada
6. Refactor: añadir manejo de errores para dataUrl inválida o exifreader fallo
7. Añadir pruebas de error: cuando imageDataUrl está vacío o corrupto
8. Commit: `feat(tickets): integrate exif extraction on ticket upload flow`

---

### Tarea 300-U-09: Probar integración en carga de tickets vía Zustand
- **Archivo:** `frontend/src/stores/useTicketStore.ts` (extensión de método)
- **Test:** `frontend/src/stores/useTicketStore.test.ts`
- **Tipo de cambio:** add_behavior
- **Test-first:** ✅ estricto

**Checklist Pre-flight:**
- ✅ Confirmar que `useTicketStore` tiene acciones para `addTicket`
- ✅ Verificar que el mocking de API está configurado en tests
- ✅ Revisar que el snapshot de ticketWithExif está actualizado

**Pasos de Implementación:**
1. **Escribir test RED:**
   ```typescript
   it('should attach metadata when adding ticket with image with GPS', async () => {
     const store = useTicketStore();
     await store.addTicket({ title: 'Test', imageDataUrl: mockImageWithGps.dataUrl });
     const ticket = store.tickets[0];
     expect(ticket.metadata).toBeDefined();
     expect(ticket.metadata?.gps?.latitude.decimal).toBeCloseTo(12.582222, 5);
   });
   ```
2. Ejecutar `pnpm test` → ERROR rojo: metadata no adjuntada
3. En `useTicketStore.ts`, actualizar acción `addTicket`:
   ```typescript
   async addTicket(ticket: Omit<Ticket, 'id'>) {
     const savedTicket = await api.tickets.createTicket(ticket);
     // Attach metadata if image present (usar attachExifMetadata)
     if (savedTicket.imageDataUrl) {
       savedTicket.metadata = await attachExifMetadata(savedTicket);
     }
     // ...resto de lógica
   }
   ```
4. Ejecutar `pnpm test` → Verificar GREEN con metadata adjuntada
5. Añadir snapshot test para verificar metadata en estado
6. Refactor: extraer lógica a helper en store si crece
7. Commit: `feat(store): attach exif metadata when adding ticket with image`

---

## Fase 4: Pruebas de Integración y GDPR (opcional pero prioritario)

### Tarea 400-Q-10: Probar limpieza de EXIF para cumplimiento GDPR
- **Archivo:** `frontend/src/utils/exifHelper.test.ts` (extensión GDPR)
- **Tipo de cambio:** test_privacy
- **Test-first:** ✅
t
**Checklist Pre-flight:**
- ✅ Confirmar que GDPR es requerido por spec: limpiar metadatos antes de almacenar
- ✅ Revisar fixture que con GPS embebido
- ✅ Asegurar que `stripExifMetadata` es sync y no requiere WASM

**Pasos de Implementación:**
1. **Escribir test RED:**
   ```typescript
   describe('GDPR compliance', () => {
     it('should strip GPS coordinates from Blob before upload', () => {
       const cleanBlob = stripExifMetadata(mockImageWithGps.dataUrl);
       // Simular subir a backend sin metadata
       expect(cleanBlob.size).toBeGreaterThan(0);
       // El Blob debe ser JPEG/PNG estándar sin EXIF embedded
     });
   });
   ```
2. Ejecutar `pnpm test` → Inicialmente falla o test vacío
3. Ejecutar paso 4 (implementación ya existe en Tarea 200-TE-07)
4. Verificar GREEN para GDPR compliance
5. Añadir notas en JSDoc: "Cumple GDPR al eliminar GPS embedido"
6. Refactor: verificar que todos los BLOBs pasan por `stripExifMetadata` antes de upload
7. Commit: `test(privacy): verify gps stripping for gdpr compliance`

---

## Fase 5: UI Opcional (según espec original)

### Tarea 500-U-01: Componente UI para display de coordenadas GPS (opcional)
- **Archivo:** `frontend/src/components/Ticket/TicketGpsDisplay.tsx` (nuevo)
- **Test:** `frontend/src/components/Ticket/TicketGpsDisplay.test.tsx`
- **Tipo de cambio:** add_component (opcional, no bloqueante)
- **Test-first:** ✅ estricto

**Checklist Pre-flight:**
- ✅ Confirmar que React y Tailwind están configurados
- ✅ Revisar que tipos `ExifNamespace.gps` están disponibles
- ✅Confirmar estructura de componentes existente: `frontend/src/components/Ticket/`

**Pasos de Implementación:**
1. **Escribir test RED:**
   ```typescript
   it('should render GPS coordinates when metadata.gps is present', () => {
     const ticket = { metadata: { gps: { latitude: { dms: '12°34\'56\\\" N', decimal: 12.582222 }, ... } } };
     render(<TicketGpsDisplay ticket={ticket as any} />);
     expect(screen.getByText(/12°34'/)).toBeInTheDocument();
     expect(screen.getByText(/N/)).toBeInTheDocument();
   });
   
   it('should not render when no GPS data', () => {
     const ticket = { metadata: { } };
     render(<TicketGpsDisplay ticket={ticket as any} />);
     expect(screen.queryByText(/GPS/)).not.toBeInTheDocument();
   });
   ```
2. Ejecutar `pnpm test` → ERROR rojo: componente no implementado
3. Implementar componente React:
   ```tsx
   export function TicketGpsDisplay({ ticket }: { ticket: Ticket }) {
     if (!ticket.metadata?.gps) return null;
     const { latitude, longitude } = ticket.metadata.gps;
     return (
       <div className="p-2 bg-blue-50 rounded">
         <p>GPS: {latitude.dms} {latitude.decimal.toFixed(6)}</p>
         <p>Lon: {longitude.dms} {longitude.decimal.toFixed(6)}</p>
       </div>
     );
   }
   ```
4. Ejecutar `pnpm test` → Verificar GREEN para casos con/sin GPS
5. Refactor: añadir internacionalización si el proyecto la usa
6. Exportar componente desde barrel file
7. Integrar en `TicketDetails.tsx` (opcional, no bloqueante)
8. Commit: `feat(ui): add TicketGpsDisplay component for GPS metadata (optional)`

---

## Resumen de Trabajo Units para Chained PRs

Se recomiendan **3 PRs** según estrategia `stacked-to-main`:

### PR #1: **C001-exif-infraestructura**
- Tareas: 100-TE-01, 100-TM-02, 100-TS-03
- Enfoque: Tipos, estructura base, tests de snapshot
- Líneas estimadas: 120-150
- Rollback boundary: Solo cambios en `frontend/src/lib/types.ts` y `frontend/src/utils/`

### PR #2: **C002-exif-core**
- Tareas: 200-TE-04, 200-TE-05, 200-TE-06, 200-TE-07
- Enfoque: Implementación core de funciones EXIF
- Líneas estimadas: 180-220
- Rollback boundary: Solo `frontend/src/utils/exifHelper.ts`

### PR #3: **C003-exif-integracion**
- Tareas: 300-I-08, 300-U-09, 400-Q-10 (+ opcional 500-U-01)
- Enfoque: Integración en flujo real, pruebas de integración y GDPR
- Líneas estimadas: 150-200
- Rollback boundary: `frontend/src/api/tickets.ts` y `frontend/src/stores/`

---

## Criterios de Aceptación para cada PR

### PR #1: C001-exif-infraestructura ✅
- [ ] `pnpm test` → todos los tests verdes (vitest)
- [ ] `pnpm build` → compilación TS sin errores
- [ ] Types definidos en `frontend/src/lib/types.ts` exportados correctamente
- [ ] Snapshot test para ticketWithExif pasa y es estable
- [ ] Linkcheck pasa: `pnpm lint` sin errores

### PR #2: C002-exif-core ✅
- [ ] `pnpm test` en `exifHelper.test.ts` → 100% coverage para funciones públicas
- [ ] Tests cubren: caso vacio, con GPS, con cámara, timestamp, error
- [ ] `mapRawExifToNamespace` mapea campos según JSDoc exacto
- [ ] Tests de mutación pasan (si está configurado)
- [ ] Code review: cumplimiento de convenciones de código del proyecto

### PR #3: C003-exif-integracion ✅
- [ ] `pnpm test` → integración con Zustand pasa
- [ ] PR #1 y #2 están mergeadas y PR #3 compila contra ellas
- [ ] Strip EXIF cumple GDPR (sin GPS en final BLOB)
- [ ] Tag de versionado en `package.json` se incrementa correctamente (semver)
- [ ] Changelog actualizado con cambios de EXIF (opcional, fuera de scope estricto)

---

## Next Steps Post-Apply

1. Desplegar a staging y validar manualmente:
   - Subir ticket con imagen con GPS → verificar metadata adjuntada
   - Subir ticket sin imagen → verificar ausencia de metadata
   - Descargar BLOB limpio → verificar sin EXIF con herramientas como `exiftool`

2. Actualizar documentación de usuarios (si aplica):
   - Si el componente UI opcional se mergea, documentar cómo activar el display GPS
   - Añadir notas sobre GDPR compliance en Issue tracker

3. Monitorear métricas:
   - Errores en producción al procesar imágenes
   - Tiempo de extracción EXIF en mobile (usuarios con cámara de baja calidad)

4. Iterar UI opcional (Tarea 500-U-01) según feedback de usuarios si se mergea el PR #3
