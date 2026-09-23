---
doc_id: traceability/user-stories-traceability
title: Matriz de trazabilidad de historias de usuario
domain: traceability
audience: [human, agent]
status: mixto
source_of_truth_for:
  - matriz de trazabilidad entre cada historia de usuario, su registro canónico, su artefacto entregado y su estado
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Matriz de trazabilidad de historias de usuario

## Resumen

Cada una de las 15 historias de usuario se puede seguir hasta tres hechos: su registro canónico en
`docs/product/user-stories/**`, el artefacto entregado que documenta el bloque de correspondencia
de ese registro y su estado según `docs/product/backlog.md`. Una cuarta traza —qué commits
implementaron cada historia— **no se puede construir**: los commits del repositorio no citan
identificadores `US-xx` ni `TSK-x.y`, de modo que ningún mapeo de historia a commit tendría fuente.
Este documento cubre más de un estado: las tres trazas verificables están entregadas y la traza por
commit está descartada, y esa separación se declara en la tabla de `## Estado`. Quedan fuera la
prioridad y la complejidad de cada elemento, cuyo registro canónico es el backlog.

## Estado

| Área | Estado | Permanencia | Evidencia |
| :--- | :--- | :--- | :--- |
| Correspondencia `US-xx` → registro canónico | `entregado` | `definitivo` | Las 15 filas de la tabla de historias enlazan con `docs/product/user-stories/**` |
| Correspondencia `US-xx` → artefacto entregado | `entregado` | `definitivo` | Columna «Artefacto entregado», tomada del bloque de correspondencia de cada registro |
| Estado por historia, tomado del backlog | `entregado` | `definitivo` | 8 `entregado`, 2 `parcial`, 0 `latente` y 5 `descartado`; la reconciliación con `docs/product/backlog.md` está en `## Detalle` |
| Trazabilidad a nivel de commit (`US-xx` → commits) | `descartado` | — | `git log --oneline \| grep -cE '\bUS-[0-9]\|\bTSK-[0-9]'` → 1, y ese único acierto es un commit de documentación; `DEC-TRA-01` |

La columna `permanencia` no lleva ningún valor `temporal`: no hay una traza provisional que
estuviera destinada a ser sustituida. La traza a nivel de commit no lleva permanencia porque su
estado es `descartado` y no hay nada que sustituir: el repositorio no registra en ninguna parte qué
historia implementó cada commit, así que no existe material que una versión futura pudiera
recuperar.

## Detalle

### Qué traza esta matriz y qué no

Esta matriz es una vista derivada. No crea hechos: los toma de los tres registros que sí los
tienen y los pone en una sola tabla para que una historia se pueda seguir de un vistazo. La
consecuencia práctica es que ninguna de sus columnas es autoritativa por sí misma y que cualquier
corrección del estado, de la prioridad o del texto funcional se hace en el registro de origen.

| Traza | Origen del dato | ¿Se puede construir? |
| :--- | :--- | :--- |
| Historia → registro canónico | `docs/product/user-stories/**` | Sí |
| Historia → artefacto entregado | Bloque de correspondencia del propio registro | Sí |
| Historia → estado | `docs/product/backlog.md` | Sí |
| Historia → commits o pull requests | Historial de git | No: los commits no citan identificadores de historia |

La columna de prioridad y complejidad no aparece aquí por la misma razón: su fuente canónica es el
backlog y repetirla convertiría la matriz en un segundo registro de un hecho que ya tiene uno.

### Historias de usuario

Los epics se numeran como en el backlog. La correspondencia completa de cada número de epic con su
título está en `docs/product/backlog.md`.

| id | Historia | Epic | Estado | Registro canónico | Artefacto entregado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `US-01` | Escaneo OCR inteligente de tickets | Epic 1 | `entregado` | [US-01](/docs/product/user-stories/epic-1-core/US-01.md) | `frontend/src/lib/scan/receipt-parser.ts`, `frontend/src/lib/scan/orchestrator.ts` |
| `US-02` | Edición manual y OCR fallback | Epic 1 | `entregado` | [US-02](/docs/product/user-stories/epic-1-core/US-02.md) | `frontend/src/components/ticket/TicketItemsEditor.tsx`, `frontend/src/lib/store.ts` |
| `US-03` | Asignación unitaria visual | Epic 1 | `entregado` | [US-03](/docs/product/user-stories/epic-1-core/US-03.md) | `frontend/src/components/ticket/` |
| `US-04` | División de platos compartidos con ajuste de redondeo | Epic 2 | `entregado` | [US-04](/docs/product/user-stories/epic-2-advanced/US-04.md) | `frontend/src/lib/calc.ts` |
| `US-05` | Asignación rápida de comunes y entrantes | Epic 2 | `entregado` | [US-05](/docs/product/user-stories/epic-2-advanced/US-05.md) | `frontend/src/components/ticket/`, `frontend/src/lib/store.ts` |
| `US-06` | Alertas de platos huérfanos y descuadres | Epic 2 | `entregado` | [US-06](/docs/product/user-stories/epic-2-advanced/US-06.md) | `frontend/src/lib/calc.ts` (`verifyCuadre`), `frontend/src/components/ticket/` |
| `US-07` | Redondeo visual e individual y propina común | Epic 2 | `parcial` | [US-07](/docs/product/user-stories/epic-2-advanced/US-07.md) | `frontend/src/lib/calc.ts` (propina); el redondeo seleccionable no tiene contraparte |
| `US-08` | Gamificación: la ruleta del pagador | Epic 2 | `descartado` | [US-08](/docs/product/user-stories/epic-2-advanced/US-08.md) | Ninguna: el sorteo no se implementó; `frontend/src/components/Drawer.tsx` apunta a `/wheel` pero es código muerto |
| `US-09` | Dictado al camarero e historial de sesión local | Epic 2 | `entregado` | [US-09](/docs/product/user-stories/epic-2-advanced/US-09.md) | Sin contraparte entregada en el bloque de correspondencia del registro |
| `US-10` | Códigos QR de cobro Bizum personalizados | Epic 3 | `descartado` | [US-10](/docs/product/user-stories/epic-3-cloud/US-10.md) | Ninguna: la historia pertenece al epic 3, de alcance abandonado |
| `US-11` | Sincronización cloud de amigos y grupos | Epic 3 | `descartado` | [US-11](/docs/product/user-stories/epic-3-cloud/US-11.md) | Ninguna: la historia pertenece al epic 3, de alcance abandonado |
| `US-12` | Respaldo cloud de tickets e historial | Epic 3 | `descartado` | [US-12](/docs/product/user-stories/epic-3-cloud/US-12.md) | Ninguna: la historia pertenece al epic 3, de alcance abandonado |
| `US-13` | Exportación financiera avanzada (Excel/PDF) | Epic 4 | `parcial` | [US-13](/docs/product/user-stories/epic-4-analytics/US-13.md) | Copia de seguridad en JSON: `frontend/src/lib/store.ts` (`exportData`), `frontend/src/views/SettingsView.tsx`; el informe PDF o Excel no tiene contraparte |
| `US-14` | Mapa de restaurantes y analíticas de consumo | Epic 4 | `descartado` | [US-14](/docs/product/user-stories/epic-4-analytics/US-14.md) | Ninguna: la historia depende del histórico en la nube, que no existe |
| `US-15` | Selector de tema y rediseño visual Sage & Amber | Epic 2 | `entregado` | [US-15](/docs/product/user-stories/epic-2-advanced/US-15.md) | `frontend/src/components/ThemeSelector.tsx`, `frontend/src/hooks/useTheme.ts`, `frontend/src/views/HomeView.tsx` |

El artefacto entregado de cada fila es el que declara el propio registro en su bloque de
correspondencia, o el que el registro identifica en su nota de alcance cuando el bloque no lista
una contraparte. Dos registros no listan ninguna: el de `US-08` y el de `US-09` declaran que sus
rutas planificadas no tienen contraparte entregada. Esta matriz reproduce ese dato tal cual y no lo
resuelve, porque el estado y la capacidad no son suyos para reinterpretarlos: el estado se toma del
backlog, que es su fuente canónica.

### Reconciliación con el backlog

El backlog es el registro canónico de los estados. Contiene 42 elementos —15 historias de usuario y
27 tareas técnicas— y esta matriz cubre las 15 historias; las 27 tareas técnicas restantes se
consultan directamente en `docs/product/backlog.md`.

| Grupo | Elementos | `entregado` | `parcial` | `latente` | `descartado` |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Historias de usuario `US-01`…`US-15` | 15 | 8 | 2 | 0 | 5 |
| Tareas técnicas `TSK-x.y` | 27 | 11 | 6 | 3 | 7 |
| **Total del backlog** | **42** | **19** | **8** | **3** | **12** |

Historias por estado:

| Estado | Historias | Recuento |
| :--- | :--- | ---: |
| `entregado` | `US-01`, `US-02`, `US-03`, `US-04`, `US-05`, `US-06`, `US-09`, `US-15` | 8 |
| `parcial` | `US-07`, `US-13` | 2 |
| `latente` | Ninguna historia: los tres elementos `latente` del backlog son tareas técnicas (`TSK-1.5`, `TSK-3.5` y `TSK-4.3`) | 0 |
| `descartado` | `US-08`, `US-10`, `US-11`, `US-12`, `US-14` | 5 |

El reparto por epic explica la forma del conjunto: el epic 1 y el epic 2 están entregados salvo
`US-07`, que quedó parcial por el redondeo seleccionable, y `US-08`, cuyo sorteo no se implementó; el
epic 3 está abandonado salvo su tarea de OCR de servidor, que sigue `latente`; y el
epic 4 mezcla la copia de seguridad entregada con el alcance premium que no se cubrió y con las dos
historias que dependían del epic 3. El motivo de cada estado es del backlog y de las decisiones
`DEC-PROD-xx`; esta matriz no lo repite.

### El límite de la trazabilidad a nivel de commit

La matriz anterior insinuaba una cuarta traza, la de historia a commits, y no existía ninguna
evidencia que la sostuviera. La comprobación es directa: se buscan identificadores de historia o de
tarea en los asuntos de los commits.

```bash
git log --oneline | grep -cE '\bUS-[0-9]|\bTSK-[0-9]'
```

La salida es `1`, y ese único acierto es un commit de documentación que menciona `TSK-2.1` en su
mensaje, no un commit de implementación. Sobre el estado de código entregado la búsqueda no
devuelve ninguno:

```bash
git log --oneline c66fd3f | grep -cE '\bUS-[0-9]|\bTSK-[0-9]'
```

La salida es `0`. Por tanto, un mapeo de `US-xx` a los commits que la implementaron no se puede
construir con honestidad: cualquier fila de esa columna sería una inferencia por fecha, por autor o
por mensaje, y no una traza. La decisión de trazar por las tres dimensiones que sí existen y de
descartar esta cuarta está en `DEC-TRA-01`.

### Aviso sobre un marcador heredado

La versión anterior de esta matriz etiquetaba las 15 historias con un marcador de tablero ágil.
Ese marcador no pertenece al vocabulario de estado del estándar y no decía si algo existía en el
producto: nombraba el estado del andamiaje documental, no el de la capacidad. La columna `Estado`
de la tabla de arriba lo sustituye por el término del backlog, que es el que se puede comprobar.

### Documentos de referencia general

Las historias apuntan a documentos de dominio en lugar de repetir su contenido. Cada uno es la
fuente canónica de lo que cubre.

| Materia | Documento |
| :--- | :--- |
| Arquitectura del sistema entregado | [overview.md](/docs/architecture/overview.md) |
| Stack tecnológico y sus decisiones | [stack.md](/docs/architecture/stack.md) |
| Modelo de datos y persistencia local | [local-model.md](/docs/data/local-model.md) |
| Contratos de integración | [contracts.md](/docs/integrations/contracts.md) |
| Estrategia de pruebas y calidad | [testing-strategy.md](/docs/quality/testing-strategy.md) |
| Entrega y estrategia de ramas | [delivery-and-branching.md](/docs/process/delivery-and-branching.md) |
| Backlog, epics, identificadores y estados | [backlog.md](/docs/product/backlog.md) |

## Decisiones

| id | fecha | decisión | contexto | alternativas | elección | motivo | estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DEC-TRA-01` | 2026-09-22 | No construir la trazabilidad a nivel de commit y trazar cada historia por su registro canónico, su artefacto entregado y su estado | Los commits del repositorio no citan identificadores `US-xx` ni `TSK-x.y`: la búsqueda devuelve un único acierto, y es un commit de documentación | Inferir el mapeo historia-commit por fecha, autor o mensaje; dejar la matriz sin dimensión de evidencia; trazar por las tres dimensiones verificables y declarar el límite | Trazar por registro canónico, artefacto entregado y estado, y declarar que la dimensión commit no se puede construir | Un mapeo inferido no es trazabilidad: sería una afirmación sin fuente y sin forma de comprobarla. Las tres dimensiones que sí existen se verifican contra el backlog, contra los registros y contra el árbol de código | `descartado` |
| `DEC-TRA-02` | 2026-09-22 | Tomar el estado de cada historia del backlog y no volver a declararlo en la matriz | La matriz anterior etiquetaba las 15 historias con un marcador de tablero fuera del vocabulario del estándar, y el backlog es el registro canónico de prioridad y estado | Mantener un estado propio en la matriz; derivar el estado del código; tomarlo de `docs/product/backlog.md` | Tomarlo del backlog en cada fila, que es donde vive el dato | Una sola fuente por hecho evita la divergencia que ya se produjo entre las historias duplicadas. La matriz es una vista derivada y no un segundo registro de estado | `entregado` |

## Cómo verificar este documento

- [ ] Frontmatter completo:

```bash
for k in doc_id title domain audience status source_of_truth_for last_verified verified_against; do
  grep -q "^$k:" docs/traceability/user-stories-traceability.md && echo "OK: $k" || echo "FALLO: $k"
done
```

- [ ] Las seis secciones canónicas están presentes y en orden relativo creciente:

```bash
for s in '## Resumen' '## Estado' '## Detalle' '## Decisiones' '## Cómo verificar este documento' '## Referencias'; do
  awk -v s="$s" '/^```/{f=!f; next} !f && index($0,s)==1{found=1} END{exit !found}' docs/traceability/user-stories-traceability.md \
    && echo "OK: $s" || echo "FALLO: $s"
done
grep -nE '^## ' docs/traceability/user-stories-traceability.md
```

- [ ] El estado del frontmatter pertenece al vocabulario cerrado y ninguna fila de `## Estado` usa `mixto`:

```bash
grep -qE '^status: (entregado|parcial|latente|descartado|planificado|mixto)$' docs/traceability/user-stories-traceability.md \
  && echo "OK: status" || echo "FALLO: status"
awk '/^## Estado/{f=1; next} /^## Detalle/{f=0} f && /^\| /' docs/traceability/user-stories-traceability.md | grep -c '`mixto`'
```

- [ ] Hay una fila por historia de usuario, con 15 en total:

```bash
grep -cE '^\| `US-[0-9]{2}`' docs/traceability/user-stories-traceability.md
```

- [ ] Los estados de la tabla de historias reconciliación con el backlog: 9 `entregado`, 2 `parcial` y 4 `descartado`:

```bash
awk '/^\| `US-[0-9]{2}`/' docs/traceability/user-stories-traceability.md \
  | grep -oE '`(entregado|parcial|latente|descartado)`' | sort | uniq -c
```

- [ ] El recuento del backlog coincide con el declarado: 20 `entregado`, 8 `parcial`, 3 `latente` y 11 `descartado` sobre 42 elementos:

```bash
awk '/^## Detalle/{f=1} /^### Reconciliación/{r=1} /^### El límite/{r=0} f && r && /^\| \*\*Total/' docs/traceability/user-stories-traceability.md
```

- [ ] Ningún enlace sube directorios y todo enlace lleva barra inicial:

```bash
grep -n '](\.\./' docs/traceability/user-stories-traceability.md && echo "FALLO" || echo "OK: sin rutas relativas profundas"
grep -nE '\]\([a-z]' docs/traceability/user-stories-traceability.md && echo "FALLO" || echo "OK: todo enlace lleva barra inicial"
```

- [ ] No hay expresiones ambiguas en uso:

```bash
grep -niE 'prev[i]sto|se us[a]rá|est[a] definido|planificad[o] para|se implement[a]rá|\[Pend[i]ng\]|\bRea[d]y\b' docs/traceability/user-stories-traceability.md \
  | grep -viE '«|»|`' && echo "FALLO" || echo "OK: sin expresiones ambiguas en uso"
```

- [ ] No queda ningún marcador de estado con emoji:

```bash
perl -CSD -ne 'print "$.: $_" if /[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}\x{FE0F}]/' docs/traceability/user-stories-traceability.md \
  | grep -q . && echo "FALLO: emoji" || echo "OK: sin emoji"
```

- [ ] Las decisiones propias se declaran sólo aquí:

```bash
grep -oE 'DEC-TRA-[0-9]{2}' docs/traceability/user-stories-traceability.md | sort -u | tr '\n' ' '
```

## Referencias

- [Backlog del producto](/docs/product/backlog.md) — registro canónico de epics, identificadores, prioridad y estado; `DEC-PROD-07` a `DEC-PROD-11`
- [Historias de usuario](/docs/product/user-stories/) — detalle funcional canónico de cada historia y su bloque de correspondencia
- [Evidencia y métricas](/docs/traceability/evidence.md) — métricas verificables del proyecto, entre ellas la búsqueda de identificadores en los commits
- [Estándar de escritura dual](/docs/DOC-STANDARD.md) — fuente canónica del esquema de frontmatter, del esqueleto de seis secciones y del vocabulario de estado
- [Arquitectura del sistema](/docs/architecture/overview.md) — contenedores y componentes del producto entregado
- [Estrategia de pruebas y calidad](/docs/quality/testing-strategy.md) — inventario real de la suite de pruebas
- [Entrega y estrategia de ramas](/docs/process/delivery-and-branching.md) — modelo de ramas y los cinco workflows reales
- [Plan de reorganización documental](/docs/plan-reorganizacion.md) — fichas T8 y T10, y el diagnóstico de las rutas rotas
