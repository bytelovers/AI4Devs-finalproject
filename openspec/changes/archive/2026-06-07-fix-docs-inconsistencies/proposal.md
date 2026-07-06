# Proposal: Fix Docs Inconsistencies

## Intent

Resolve technical design, file naming, planning, PRD duplication, and wireframe link inconsistencies across documentation in `docs/`. This ensures a single source of truth for implementation and testing.

## Scope

### In Scope
- Estandarizar arquitectura de sincronización de contactos a Firestore Direct SDK, removiendo el endpoint `/api/v1/contacts/sync`.
- Estandarizar nombre del helper matemático a `mathHelper.ts` (y su test `mathHelper.test.ts`).
- Consolidar `docs/prd/PRD.md` y eliminar `docs/prd/PRD-Perplexity.md`.
- Actualizar `docs/tech-lead/technical_plan.md` para usar identificadores jerárquicos `TSK-x.y`.
- Eliminar o convertir a texto plano las referencias a la carpeta no existente `docs/wireframes/` en las User Stories.

### Out of Scope
- Implementar código del backend o frontend relacionado con estas tareas.
- Diseñar o crear imágenes reales de wireframes.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- None

## Approach

Actualizar la documentación existente en `docs/` en una sola fase aplicando las decisiones aprobadas:
1. Modificar `docs/api/integration_contracts.md` y `docs/user-stories/epic-3-cloud/US-11.md` para remover referencias del API HTTP en sincronización de contactos.
2. Modificar referencias de `pennyAdjustment.ts` a `mathHelper.ts` en `docs/user-stories/epic-2-advanced/US-04.md` y `docs/qa/testing_strategy.md`.
3. Consolidar aportaciones clave en `docs/prd/PRD.md` y borrar `docs/prd/PRD-Perplexity.md`.
4. Reemplazar tareas `T-01` a `T-05` con IDs `TSK-x.y` en `docs/tech-lead/technical_plan.md`.
5. Modificar archivos `docs/user-stories/**/*.md` para cambiar los enlaces de imagen de wireframes rotos a texto plano.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `docs/prd/` | Modified/Removed | Consolidación en `PRD.md` y remoción de `PRD-Perplexity.md` |
| `docs/tech-lead/technical_plan.md` | Modified | Actualización a IDs `TSK-x.y` |
| `docs/user-stories/` | Modified | Conversión de wireframes a texto y cambio a `mathHelper.ts` |
| `docs/api/integration_contracts.md` | Modified | Remoción de endpoint de sync |
| `docs/qa/testing_strategy.md` | Modified | Cambio de `pennyAdjustment.ts` a `mathHelper.ts` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pérdida de información útil de PRD-Perplexity | Low | Revisar y fusionar secciones clave en `PRD.md` antes de borrarlo |

## Rollback Plan

Utilizar control de versiones Git para restaurar el estado anterior de la carpeta `docs/` con `git checkout main -- docs/`.

## Dependencies

- None

## Success Criteria

- [ ] Consistencia total de nombres de archivos en la documentación.
- [ ] No existen enlaces rotos a `docs/wireframes/`.
- [ ] La sincronización de contactos documentada refiere únicamente al SDK de Firestore.
- [ ] No hay archivos duplicados de PRD.
