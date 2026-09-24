---
doc_id: product/user-stories/TSK-3.2
title: 'TSK-3.2: Flujo de Autenticación Opcional de Firebase'
domain: product
audience: [human, agent]
status: descartado
source_of_truth_for:
  - detalle técnico de TSK-3.2
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-3.2: Flujo de Autenticación Opcional de Firebase


- **Historia de Usuario Relacionada:** [US-12: Respaldo Cloud de Tickets e Historial de Eventos](/docs/product/user-stories/epic-3-cloud/US-12.md)
- **Épica:** Epic 3: Cloud Convenience & Connectivity Flow
- **Capa:** Frontend (Auth)
- **Complejidad:** 3 SP
- **Dependencias:** TSK-3.1

## 1. Descripción de la Tarea
Implementar el inicio de sesión opcional para los usuarios. De forma predeterminada, la app asignará una sesión local anónima para evitar barreras de entrada. Si el usuario desea respaldar datos, se le ofrecerá iniciar sesión con Google o Email.

## 2. Detalles de Implementación
1. **Lógica de Autenticación:**
   * Crear `frontend/src/services/firebase/authService.ts`.
   * Implementar funciones `signInAnonymously()`, `signInWithGoogle()`, y `logOut()`.
2. **Hook de Estado de Autenticación:**
   * Crear `frontend/src/hooks/useAuth.ts` expone el estado del usuario logado (`currentUser`, `isAnonymous`, `isAuthenticated`).
3. **UI de Login:**
   * Crear modal simplificado de inicio de sesión rápida `frontend/src/components/auth/LoginModal.tsx`.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/services/firebase/authService.test.ts` (con mock del SDK de auth):
  * Al iniciar la app por primera vez, se crea una sesión de usuario local persistente.
  * Al iniciar sesión con un proveedor real (Google), la sesión se actualiza y vincula correctamente al UID de la cuenta.
