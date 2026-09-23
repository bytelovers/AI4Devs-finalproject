---
doc_id: product/brief
title: Brief del producto SplitEat
domain: product
audience: [human, agent]
status: mixto
source_of_truth_for:
  - visión, problema y propuesta de valor del producto
  - público objetivo del producto
  - exclusiones de alcance de negocio
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Brief del producto SplitEat

## Resumen

SplitEat es una PWA de cliente, sin backend, que digitaliza el ticket de un restaurante y reparte
la cuenta entre los comensales: el OCR se ejecuta en el dispositivo y la persistencia es local.
Este brief es la fuente canónica de la visión, el problema, el público objetivo y las exclusiones
de negocio del producto. El MVP entregado son las funciones locales F-01…F-11, detalladas en
`docs/product/prd.md`; las funciones premium con registro y nube quedaron descartadas porque el
producto entregado no tiene servidor. El documento cubre más de un estado y lo declara en la tabla
de `## Estado`.

## Estado

| Área | Estado | Evidencia |
| :--- | :--- | :--- |
| Visión y filosofía «mobile & offline first» | `entregado` | La PWA funciona sin conexión; `frontend/src/` |
| Problema clave y público objetivo | `entregado` | El flujo entregado resuelve la división en mesa para los dos perfiles descritos |
| Funciones 100 % locales (MVP) | `entregado` | F-01…F-11 en `docs/product/prd.md`; `grep -ril firebase frontend/src` → 0 archivos |
| Persistencia local del producto | `entregado` | `frontend/src/lib/store.ts` persiste con Zustand sobre `localStorage` |
| Funciones premium con registro y nube | `descartado` | `DEC-PROD-01`; `backend/` y `db/` no contienen código: solo `.keep` y una nota de ubicación |
| Prioridades 3 y 4 (registro y nube) | `descartado` | `DEC-PROD-01`; sin backend no hay trabajo ejecutable |
| Métricas de éxito comercial | `parcial` | El tiempo de resolución y la tasa offline son verificables en el flujo local; el NPS exige usuarios activos y no se mide |
| Exclusiones de alcance (pasarelas de pago, POS) | `descartado` | `DEC-PROD-03`; el producto es informativo y no integra cobros |
| Restricciones legales (RGPD) | `entregado` | Procesamiento local de imagen y metadatos EXIF: `frontend/src/utils/exifHelper.ts` |

## Detalle

### El problema

Grupos numerosos que comparten una comida afrontan la misma fricción: el cálculo manual en la mesa
es lento y propenso a errores, el personal del local pierde tiempo con cobros individuales
desorganizados y las herramientas existentes suelen exigir conexión o registro, justo donde no hay
cobertura. SplitEat ataca ese punto con un flujo local: la cuenta se divide en el dispositivo, en
mesa, sin cuenta de usuario y sin conexión.

### Público objetivo

| Segmento | Descripción | Necesidad principal |
| :--- | :--- | :--- |
| Grupos de amigos y compañeros de trabajo | Almuerzos y cenas frecuentes en grupo | Pagar exactamente lo consumido |
| Familias y subgrupos | Parejas o padres con hijos que pagan agrupados dentro de una cuenta común | Consolidar el pago del subgrupo sin sumar persona a persona |

### MVP entregado

El MVP entregado es el conjunto de funciones locales F-01…F-11 descrito en `docs/product/prd.md` y
detallado por historia en `docs/product/user-stories/`. No requiere backend, ni cuenta, ni base de
datos en la nube.

| Área funcional | Evidencia en el código |
| :--- | :--- |
| Captura y OCR en dispositivo | `frontend/src/lib/scan/`, `frontend/src/workers/ocr.worker.ts` |
| División y cuadre al céntimo | `frontend/src/lib/calc.ts` |
| Asignación y edición del ticket | `frontend/src/views/`, `frontend/src/components/ticket/` |
| Persistencia e historial local | `frontend/src/lib/store.ts` |
| Metadatos EXIF | `frontend/src/utils/exifHelper.ts` |
| Selector de tema | `frontend/src/components/ThemeSelector.tsx` |

### Alcance evolutivo: funciones premium con registro

Las tres funciones premium se planificaron sobre infraestructura de nube y quedaron descartadas al
entregar un producto de cliente sin backend. La decisión está registrada en `DEC-PROD-01`.

| Función | Estado | Motivo del descarte |
| :--- | :--- | :--- |
| Bizum QR y mensajería dinámica | `descartado` | Requiere backend para generar el enlace de pago y las plantillas |
| Sincronización cloud de amigos y grupos | `descartado` | Requiere cuenta de usuario y base de datos en la nube |
| Respaldo e historial cloud completo | `descartado` | Requiere base de datos en la nube; se conserva el backup JSON local como mitigación |

### Priorización

Las prioridades 1 y 2 son locales y están entregadas. Las prioridades 3 y 4 dependían de registro y
nube, y quedaron descartadas.

| Prioridad | Contenido | Estado |
| :--- | :--- | :--- |
| 1 (Core offline) | Escaneo del ticket, asignación visual, alerta de platos huérfanos, cuadre offline y edición manual | `entregado` |
| 2 (Alta offline) | Asignación compartida de entrantes, redondeo y propina individuales, ruleta del pagador | `entregado` |
| 3 (Media, registro/nube) | QR Bizum personalizado y sincronización de grupos frecuentes en la nube | `descartado` |
| 4 (Baja, nube) | Mapa de visitas geolocalizadas, analítica privada del histórico y backups automáticos en la nube | `descartado` |

La ruleta del pagador figuraba en la prioridad 3 del brief original, pero se entregó como función
local (F-08). Se reclasifica en la prioridad 2 porque no depende de la nube.

### Viabilidad comercial y valor diferencial

SplitEat se enfoca en la resolución inmediata del pago en mesa, con un desglose que se puede dictar
al camarero sin fricción. El producto es informativo y B2C, y el registro de usuario dejó de ser
una capa opcional para quedar descartado junto con la nube. El valor diferencial entregado son el
modo de dictado al camarero, el soporte de subgrupos familiares y el cuadre offline con redondeo
visual.

### Excluido del alcance

| Exclusión | Estado | Motivo |
| :--- | :--- | :--- |
| Pasarelas de pago integradas (Stripe, Bizum directo) | `descartado` | El producto es informativo; el cobro se realiza físicamente en mesa |
| Integración con el POS del restaurante | `descartado` | El producto funciona del lado del cliente sin depender del software del local |

### Restricciones y aspectos legales

| Restricción | Estado | Detalle |
| :--- | :--- | :--- |
| Privacidad y procesamiento local (RGPD) | `entregado` | La imagen y los metadatos EXIF se procesan en el dispositivo; `frontend/src/utils/exifHelper.ts` |
| Independencia del software del restaurante | `entregado` | No se requiere integración con el terminal del local |
| Acceso a la cámara | `entregado` | Permisos de navegador; `frontend/src/components/camera/` |

## Decisiones

| id | fecha | decisión | contexto | alternativas | elección | motivo | estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DEC-PROD-01` | 2026-09-22 | Reencuadrar las funciones premium con registro como alcance descartado | El brief las presentaba como prioridades 3 y 4 ligadas a infraestructura de nube | Mantenerlas como trabajo pendiente; marcarlas `latente`; descartarlas | `descartado` | El producto entregado es de cliente y no existe backend ni vía de retorno abierta; el único elemento latente es el motor OCR de servidor, documentado en `docs/product/prd.md` | `descartado` |
| `DEC-PROD-02` | 2026-09-22 | Describir la persistencia como `localStorage` | El brief citaba «IndexedDB/localStorage» y `dexie` figura en `frontend/package.json` sin importarse en ninguna parte | Mantener la ambigüedad; declarar `localStorage`; declarar IndexedDB | `localStorage` con Zustand persist | Verificado en `frontend/src/lib/store.ts`; `dexie@4.4.4` no tiene ningún import | `entregado` |
| `DEC-PROD-03` | 2026-09-22 | Mantener las exclusiones de alcance de negocio | El producto podría ampliarse a cobros o a integración con el terminal del local | Incluir pasarela de pago; integrar POS; mantener las exclusiones | Mantener las exclusiones | El producto es informativo y B2C; el cobro se realiza en mesa | `entregado` |

## Cómo verificar este documento

- [ ] `for k in doc_id title domain audience status source_of_truth_for last_verified verified_against; do grep -q "^$k:" docs/product/brief.md && echo "OK: $k" || echo "FALLO: $k"; done` → ocho líneas `OK`
- [ ] `awk '/^```/{f=!f; next} !f && /^# /{print NR": "$0}' docs/product/brief.md` → un H1 igual al campo `title`
- [ ] `for s in '## Resumen' '## Estado' '## Detalle' '## Decisiones' '## Cómo verificar este documento' '## Referencias'; do grep -qF "$s" docs/product/brief.md && echo "OK: $s" || echo "FALLO: $s"; done` → seis líneas `OK`
- [ ] `grep -rn 'src/' docs/product/brief.md | grep -v 'frontend/src/'` → sin salida
- [ ] `grep -rniE 'previsto|se usará|está definido|planificado para|se implementará' docs/product/brief.md` → sin salida
- [ ] `grep -o 'DEC-[0-9][0-9]' docs/product/brief.md | sort -u | tr '\n' ' '` → `DEC-PROD-01 DEC-PROD-02 DEC-PROD-03`
- [ ] `grep -c '^| ' docs/product/brief.md` → al menos 25 filas de tabla

## Referencias

- `docs/product/prd.md` — funciones del producto, requisitos y métricas
- `docs/product/backlog.md` — epics, identificadores, prioridad y estado de cada elemento
- `docs/product/user-stories/` — detalle funcional de las historias y tareas
- `docs/DOC-STANDARD.md` — estándar de escritura dual que gobierna este documento
- `docs/plan-reorganizacion.md` — diagnóstico y plan de la reorganización documental
