---
doc_id: prompts
title: Registro de peticiones que originaron la documentación
domain: process
audience: [human, agent]
status: mixto
source_of_truth_for:
  - texto original de las peticiones que originaron los documentos del proyecto
  - correspondencia entre cada petición y el documento que originó
last_verified: 2026-09-22
verified_against: c66fd3f
---

# Registro de peticiones que originaron la documentación

**Naturaleza de este documento.** No es una página de presentación ni una plantilla de entrega: es
un **registro**. Recopila, en cita literal, las peticiones que originaron los documentos del
proyecto. La estructura de secciones que este archivo tenía al principio era copia de una plantilla
antigua de `readme.md` y se ha retirado: los encabezados que quedan agrupan peticiones por documento
de destino, y la correspondencia con las secciones del readme de origen se conserva en una tabla de
trazabilidad. **Ninguna petición se ha eliminado.**

**Sobre la cita literal.** Los bloques entrecomillados reproducen el texto original, con su
ortografía y su puntuación. Se citan, no se afirman: algunas peticiones describen alcance que
después se descartó, y su valor es precisamente mostrar de dónde salió cada documento. El estado de
lo que cada petición describe no se declara aquí; vive en el documento canónico correspondiente.

**Quién consume este registro.** El documento que lo consume es
[docs/process/ai-workflow.md](/docs/process/ai-workflow.md), que describe el ciclo de trabajo
asistido por IA y registra la ausencia de peticiones en el apartado de pull requests.

---

## Resumen

Las dieciséis peticiones que se conservan aquí son el origen documental del proyecto: el brief del
producto, el principio de móvil y sin conexión, la pregunta sobre la versión de React, la petición
de metadatos EXIF y la petición de revisión adversarial, entre otras. Cada una se agrupa por el
documento que originó y se conserva íntegra; el apartado de pull requests no conserva ninguna
petición, y esa ausencia se declara en lugar de rellenarse. Este documento es la fuente canónica del
texto original de las peticiones y de su correspondencia con los documentos; queda fuera el ciclo de
trabajo que las ejecutó, canónico en `docs/process/ai-workflow.md`.

## Estado

| Grupo de peticiones | Peticiones | Estado | Evidencia |
| :--- | ---: | :--- | :--- |
| Brief, principios y funcionalidades | 3 | `entregado` | Los tres bloques están en `## Detalle` › Peticiones del brief y de los principios |
| Arquitectura, stack, infraestructura y coste de migración | 5 | `entregado` | Los cinco bloques están en `## Detalle` › Peticiones de arquitectura y stack |
| Modelo de datos y metadatos | 2 | `entregado` | Los dos bloques están en `## Detalle` › Peticiones del modelo de datos |
| Revisión de la documentación | 1 | `entregado` | El bloque está en `## Detalle` › Petición de revisión de la documentación |
| Historias de usuario | 2 | `entregado` | Los dos bloques están en `## Detalle` › Peticiones de historias de usuario |
| Backlog y tareas técnicas | 3 | `entregado` | Los tres bloques están en `## Detalle` › Peticiones de backlog y tareas |
| Pull requests | 0 | `parcial` | El apartado existe y no conserva ninguna petición: no se registró ninguna. `docs/process/ai-workflow.md` declara la misma ausencia |

## Detalle

### Cómo se lee este registro

Cada grupo corresponde a los documentos que sus peticiones originaron. Dentro de cada grupo, cada
bloque lleva su número de petición y, cuando aporta contexto, una línea de resultado que enlaza el
documento que terminó recogiendo el contenido. La tabla siguiente conserva la trazabilidad con el
readme de origen, cuya numeración de secciones ya no existe en este archivo.

| Grupo de este registro | Sección del readme de origen | Documentos que originó |
| :--- | :--- | :--- |
| Brief, principios y funcionalidades | 1. Descripción general del producto | [docs/product/brief.md](/docs/product/brief.md), [docs/product/prd.md](/docs/product/prd.md) |
| Arquitectura, stack, infraestructura y coste de migración | 2. Arquitectura del sistema | [docs/architecture/overview.md](/docs/architecture/overview.md), [docs/architecture/stack.md](/docs/architecture/stack.md), [docs/process/delivery-and-branching.md](/docs/process/delivery-and-branching.md) |
| Modelo de datos y metadatos | 3. Modelo de datos | [docs/data/local-model.md](/docs/data/local-model.md), [docs/data/scope-evolution.md](/docs/data/scope-evolution.md) |
| Revisión de la documentación | 4. Especificación de la API | [docs/quality/judgment-report.md](/docs/quality/judgment-report.md) |
| Historias de usuario | 5. Historias de usuario | [docs/product/user-stories/](/docs/product/user-stories/) |
| Backlog y tareas técnicas | 6. Tickets de trabajo | [docs/product/backlog.md](/docs/product/backlog.md) |
| Pull requests | 7. Pull requests | Ninguno: no se conserva ninguna petición para esta sección |

Inventario de las dieciséis peticiones y del documento que originó cada una:

| Petición | Tema | Documento que originó |
| :--- | :--- | :--- |
| P1 | Brief: dividir el ticket de un grupo entre varias personas a partir de texto o foto | [docs/product/brief.md](/docs/product/brief.md) |
| P2 | Sostenibilidad del coste y apuestas de futuro: redondeo, sorteo y platos huérfanos | [docs/product/prd.md](/docs/product/prd.md) |
| P3 | Principio de diseño: móvil y sin conexión primero | [docs/product/brief.md](/docs/product/brief.md) |
| P4 | Listado de documentos y diagramas necesarios, en archivos separados | [docs/architecture/overview.md](/docs/architecture/overview.md) |
| P5 | Evaluar un MVP con base de datos en el navegador y migración posterior a la nube | [docs/data/scope-evolution.md](/docs/data/scope-evolution.md) |
| P6 | Por qué React 18 y no React 19 | [docs/architecture/stack.md](/docs/architecture/stack.md) |
| P7 | Coste de migrar todo el stack a versiones más modernas | [docs/architecture/stack.md](/docs/architecture/stack.md) |
| P8 | Tratar la infraestructura como registro propio | [docs/process/delivery-and-branching.md](/docs/process/delivery-and-branching.md) |
| P9 | Extraer metadatos de la imagen, IVA, establecimiento, propinas y fecha | [docs/data/local-model.md](/docs/data/local-model.md) |
| P10 | Cuadre de la división de platos y privacidad de los datos | [docs/data/local-model.md](/docs/data/local-model.md) |
| P11 | Revisar la documentación y su estado con la revisión adversarial | [docs/quality/judgment-report.md](/docs/quality/judgment-report.md) |
| P12 | Replantear las épicas como flujos completos, priorizando el núcleo | [docs/product/user-stories/](/docs/product/user-stories/) |
| P13 | Crear el andamiaje de las historias dentro de `docs/` | [docs/product/user-stories/](/docs/product/user-stories/) |
| P14 | Generar el backlog de tareas técnicas con detalle suficiente | [docs/product/backlog.md](/docs/product/backlog.md) |
| P15 | Las tareas acompañan a las historias y no se separan en otra carpeta | [docs/product/backlog.md](/docs/product/backlog.md) |
| P16 | Las tareas técnicas van en archivos propios dentro de las historias | [docs/product/backlog.md](/docs/product/backlog.md) |

### Peticiones del brief y de los principios

**Prompt 1:**

> "Necesito generar una aplicación que sirve para que sea mas sencillo el dividir los tickets de los restaurantes cuando van muchas personas (grupos) y al final es un lío para los camareros.
> - dada una entrada tanto de texto (hablado, o transcrito) como mediante foto, a un ticket, principalmente de comida haga lo siguiente:
> - Escanee el ticket
> - Reconozca los conceptos, en el caso de un ticket de restaurante, debe reconocer lo que se ha consumido, las unidades, precio unitario
> - Se mostrará una lista seleccionable para saber qué productos ha consumido cada persona..."

**Prompt 2:**

> "Quiero mantener la aplicación de manera gratuíta el mayor tiempo posible, es por ello que estas ideas pueden ser una apuesta a futuro. Ahora nos interesa tener ideas que se puedan usar de implantación como la ruleta del redondeo, quien le toca pagar la cuenta por una apuesta o la alerta de platos huérfanos"

**Prompt 3:**

> "La base / filosofía es mobile & offline first, por lo que los tickets compartidos pueden ser una opción pero no la principal"

Resultado de este grupo: el brief y los principios del producto, más las funciones que se
priorizaron en el PRD. El sorteo entre participantes que aparece en el segundo bloque se evaluó
dentro del catálogo de funciones y su estado es canónico en
[docs/product/backlog.md](/docs/product/backlog.md).

### Peticiones de arquitectura y stack

**Prompt 1:**

> "como /product-owner  y /tech-lead Para la creación  de los diseños técnicos, hazme un listado de todos los diagramas y documentaciones necesarias que tiene que tener un proyecto, como por ejemplo PRD, C4, Stack tecnológico, etc.... genera ficheros de documentación separados. Pregúntame si no lo tienes 100% definido y claro"

**Prompt 2:**

> "de la ayuda de /product-owner y /tech-lead valorar la posibilidad de que el MVP pueda realizarse con una base de datos en el navegador para hacer las primeras pruebas y luego que sea migrable / escalable a una base de datos en la nube (firebase)"

Esta es la petición que originó el plan de nube del proyecto. El plan se evaluó y después se
descartó: lo que ocurrió con él, y por qué, está documentado en
[docs/data/scope-evolution.md](/docs/data/scope-evolution.md).

**Prompt 3:**

> "investiga por qué usar react 18 y no vamos con la version 19"

**Prompt 4:**

> "cual es el coste de migración posterior de toda la arquitectura a versiones / stack más moderno"

**Prompt 5:**

> "el punto 6 lo metería como registro ya que requiere infraestructura"

Resultado de este grupo: el conjunto de documentos de arquitectura, la elección de versiones del
stack y el apartado de despliegue como registro propio. El detalle del stack entregado está en
[docs/architecture/stack.md](/docs/architecture/stack.md).

### Peticiones del modelo de datos

**Prompt 1:**

> "Incluiremos que al analizar la foto subida para sacar la cuenta, podemos extraer los metadatos de la imagen (telefono, tipo de camara, geoposicionamiento, etc) al igual que iva aplicado, nombre del establecimiento, propinas, día del evento ,etc"

**Prompt 2:**

> "1) era el planteamiento que quería
> 2) si permitimos la división de platos, tenemos que tener en cuenta que luego cuadre con el total del ticket
> 3) De momento esa inforamción será privada de nuestra aplicación con el posible fin de explotar los datos analíticos"

Resultado de este grupo: el esquema de datos y el análisis de los metadatos de la imagen. El
segundo bloque fijó dos requisitos que siguen vigentes: la división de platos tiene que cuadrar con
el total del ticket y los datos permanecen en la aplicación. El esquema persistido está en
[docs/data/local-model.md](/docs/data/local-model.md).

### Petición de revisión de la documentación

**Prompt 1:**

> "/judgment-day revisa la documentación y revisa el estado. Indícame si está en lo correcto o por el contrario hay que modificar"

Resultado de este grupo: la revisión adversarial de la documentación y su informe. El informe se
conserva, con la nota que invalida su veredicto frente al estado posterior de los documentos, en
[docs/quality/judgment-report.md](/docs/quality/judgment-report.md).

### Peticiones de historias de usuario

**Prompt 1:**

> "Replantea las épicas como si fueran historias o flujos completos, prevaleciendo las funcionalidades core, que son necesarias para todos los flujos como la primera épica. Las funcionalidades que requieren registro las podemos poner despues de las de 'sin registro'"

**Prompt 2:**

> "con la ayuda de /product-owner y /tech-lead coge las historias de usuario y crea un scaffold dentro de `docs/` en el cual se pueda agrupar las historias de usuario con la documentación correspondiente y asociada que se pueda generar despues."

Resultado de este grupo: el reparto de las historias en epics y el árbol de documentación que las
agrupa. Las historias y sus archivos viven en
[docs/product/user-stories/](/docs/product/user-stories/), y sus identificadores y su estado son
canónicos en [docs/product/backlog.md](/docs/product/backlog.md).

### Peticiones de backlog y tareas

**Prompt 1:**

> "generemos un backlog, separado por carpetas si es necesario con las tareas técnicas que deberemos abordar. Sé lo más detallado posible para que la skill que lo tenga que hacer no tenga ambigüedades."

**Prompt 2:**

> "las tareas deben ir con las historias de usuario en la documentación, no deben ir en la carpeta de tech-lead porque las puede interpretar otra skill"

**Prompt 3:**

> "Las tareas técnicas no deben pertenecer a las historias de usuario, deben ir en ficheros independientes dentro de las historias de usuario"

Resultado de este grupo: el backlog y la decisión de alojar cada tarea técnica en un archivo
independiente dentro de su epic. Los dos últimos bloques se contradicen entre sí y la petición
posterior prevalece; el resultado está en
[docs/product/user-stories/](/docs/product/user-stories/) y su registro canónico en
[docs/product/backlog.md](/docs/product/backlog.md).

### Pull requests

Este apartado no conserva ninguna petición: no se registró ninguna para las pull requests del
proyecto. Se deja declarado en lugar de rellenarse con texto que no sea una petición original. Las
pull requests que sí existieron están documentadas en el readme, con su rama y su commit de merge
([readme.md](/readme.md), apartado 7), y su ciclo de revisión en
[docs/process/ai-workflow.md](/docs/process/ai-workflow.md).

## Decisiones

Este documento no toma decisiones propias: recopila las peticiones que originaron las decisiones y
los documentos del proyecto. Las decisiones que esas peticiones provocaron tienen su registro
canónico en [docs/architecture/decisions.md](/docs/architecture/decisions.md) y en
[docs/product/prd.md](/docs/product/prd.md); las convenciones con las que están escritos los
documentos son de [docs/DOC-STANDARD.md](/docs/DOC-STANDARD.md).

## Cómo verificar este documento

- [ ] Frontmatter completo:

```bash
for k in doc_id title domain audience status source_of_truth_for last_verified verified_against; do
  grep -q "^$k:" prompts.md && echo "OK: $k" || echo "FALLO: $k"
done
```

- [ ] Estado dentro del vocabulario cerrado del estándar:

```bash
grep -qE '^status: (entregado|parcial|latente|descartado|planificado|mixto)$' prompts.md \
  && echo "OK: status" || echo "FALLO: status"
```

- [ ] El H1 repite el campo `title`:

```bash
grep -n '^# ' prompts.md
```

- [ ] Las dieciséis peticiones siguen en el registro, y ninguna línea de cita se ha perdido:

```bash
grep -c '^\*\*Prompt' prompts.md
grep -c '^> "' prompts.md
```

- [ ] El inventario de peticiones y los grupos cubren las dieciséis:

```bash
grep -cE '^\| P(1[0-6]|[1-9]) \|' prompts.md
```

- [ ] La petición que originó el plan de nube enlaza su registro histórico:

```bash
grep -n 'migrable / escalable a una base de datos en la nube' prompts.md
grep -n '](/docs/data/scope-evolution.md)' prompts.md
```

- [ ] El documento que consume este registro está enlazado:

```bash
grep -c '](/docs/process/ai-workflow.md)' prompts.md
```

- [ ] No hay expresiones ambiguas ni enlaces que suban directorios:

```bash
grep -rniE 'previsto|se usará|está definido|planificado para|se implementará|\[Pending\]|\bReady\b' prompts.md | grep -viE '«|»|`'
grep -n '](\.\./' prompts.md
```

## Referencias

- [docs/process/ai-workflow.md](/docs/process/ai-workflow.md) — documento que consume este registro: ciclo de trabajo asistido por IA, sus puertas de aprobación y el registro de errores del asistente
- [docs/data/scope-evolution.md](/docs/data/scope-evolution.md) — registro histórico del plan de nube que originó la petición P5
- [docs/data/local-model.md](/docs/data/local-model.md) — esquema entregado que recogió las peticiones del modelo de datos
- [docs/product/brief.md](/docs/product/brief.md) — visión, problema y exclusiones de negocio
- [docs/product/prd.md](/docs/product/prd.md) — funciones del producto y requisitos de negocio
- [docs/product/backlog.md](/docs/product/backlog.md) — registro canónico de epics, historias y tareas técnicas
- [docs/product/user-stories/](/docs/product/user-stories/) — detalle funcional de historias y tareas
- [docs/architecture/decisions.md](/docs/architecture/decisions.md) — registro canónico de las decisiones `DEC-ARCH-xx`
- [docs/quality/judgment-report.md](/docs/quality/judgment-report.md) — informe de la revisión adversarial de la documentación
- [docs/DOC-STANDARD.md](/docs/DOC-STANDARD.md) — estándar de escritura dual que gobierna este documento
- [readme.md](/readme.md) — puerta de entrada del repositorio, con las pull requests del proyecto en su apartado 7
