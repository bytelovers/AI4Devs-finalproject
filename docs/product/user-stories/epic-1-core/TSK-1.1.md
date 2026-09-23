---
doc_id: product/user-stories/TSK-1.1
title: 'TSK-1.1: Inicialización del Proyecto, Configuración de Entorno de Tests y Tokens CSS'
domain: product
audience: [human, agent]
status: entregado
source_of_truth_for:
  - detalle técnico de TSK-1.1
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-1.1: Inicialización del Proyecto, Configuración de Entorno de Tests y Tokens CSS


- **Historia de Usuario Relacionada:** Requisito transversal / General
- **Épica:** Epic 1: Core Digitalization & Basic Assignment Flow
- **Capa:** Frontend (Setup)
- **Complejidad:** 2 SP (Story Points)
- **Dependencias:** Ninguna

## 1. Descripción de la Tarea
Crear el andamiaje básico del proyecto utilizando Vite con React + TypeScript y configurar el entorno de tests unitarios (Vitest o Jest) y auditorías de accesibilidad a nivel de desarrollo. Crear los tokens CSS base de diseño (colores, fuentes, sombras y espaciados).

## 2. Detalles de Implementación
1. **Inicialización:**
   * Crear estructura de directorios:
     * `frontend/src/components/` (Componentes UI reutilizables)
     * `frontend/src/views/` (Vistas completas de la aplicación)
     * `frontend/src/services/` (Lógica de negocio y base de datos)
     * `frontend/src/hooks/` (Hooks personalizados de React)
     * `frontend/src/styles/` (Diseño y CSS global)
     * `frontend/src/utils/` (Funciones auxiliares matemáticas e instrumentales)
2. **Fichero de Estilos Globals:**
   * Crear `frontend/src/styles/variables.css` con variables CSS para el sistema de diseño (Palette HSL, Light/Dark theme variables, tipografía Inter/Outfit).
   * Crear `frontend/src/styles/global.css` importando las variables y reseteando estilos base del navegador.
3. **Setup de Tests:**
   * Instalar `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, y `@testing-library/user-event`.
   * Crear fichero de configuración `vitest.config.ts`.
   * Configurar en `package.json` el script `"test": "vitest run"`.

## 3. Criterios de Aceptación y Pruebas (DoD)
* El proyecto compila limpiamente mediante `npm run build` sin advertencias de TypeScript.
* Ejecutar un test dummy exitoso: `npm run test` debe pasar.
* Validar que la carga en navegador móvil aplica las fuentes del sistema definidas en `variables.css`.
