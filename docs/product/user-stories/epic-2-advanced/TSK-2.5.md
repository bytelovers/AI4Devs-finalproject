---
doc_id: product/user-stories/TSK-2.5
title: 'TSK-2.5: Componente de Ruleta de Sorteo (Gamification Wheel)'
domain: product
audience: [human, agent]
status: entregado
source_of_truth_for:
  - detalle técnico de TSK-2.5
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-2.5: Componente de Ruleta de Sorteo (Gamification Wheel)

> **Layout de ficheros: el de este registro es el planificado, no el entregado.** Las rutas que
> aparecen más abajo describen la estructura que se proyectó para esta tarea; el árbol real es
> distinto. La estructura entregada está en `/docs/architecture/overview.md`.
>
> | Ruta planificada en este registro | Ruta entregada |
> | :--- | :--- |
> | `frontend/src/components/game/SpinnerWheel.tsx` | `Ninguna: el componente de ruleta no se implementó` |
> | `SpinnerWheel.test.tsx` | `Ninguna: el componente de ruleta no se implementó` |
>
> El estado `entregado` de este registro se refiere a la **capacidad**, no a los ficheros
> planificados.

- **Historia de Usuario Relacionada:** [US-08: Gamificación: "La Ruleta del Pagador"](/docs/product/user-stories/epic-2-advanced/US-08.md)
- **Épica:** Epic 2: Advanced Reparto, Rounding & Gamification Flow
- **Capa:** Frontend (UI Component - Canvas)
- **Complejidad:** 4 SP
- **Dependencias:** TSK-1.1, TSK-1.6

## 1. Descripción de la Tarea
Crear el minijuego de azar interactivo local de la ruleta. Se utilizará un canvas HTML5 o transiciones CSS avanzadas para girar un círculo dividido en sectores de colores correspondientes a cada participante creado en la mesa. Sirve para elegir aleatoriamente quién se hace cargo de un plato o del total.

## 2. Detalles de Implementación
1. **Lógica de Renderizado Canvas:**
   * Crear `frontend/src/components/game/SpinnerWheel.tsx`.
   * Dibujar los sectores de forma dinámica basándose en la lista de nombres de participantes activos. Cada sector se pinta con un color de la paleta CSS.
2. **Animación y Física básica:**
   * Utilizar `requestAnimationFrame` para crear un giro con desaceleración progresiva.
   * El ángulo final se calcula de forma aleatoria al pulsar "Girar".
   * Soportar la API de vibración móvil (`navigator.vibrate`) para emitir pulsos de vibración cortos (haptics) a medida que los sectores cruzan el indicador de selección.
3. **Botón de Escape:**
   * Permitir cancelar el juego en cualquier momento para volver al tablero normal sin alterar los datos del ticket.

## 3. Criterios de Aceptación y Pruebas (DoD)
* El componente es autocontenido y funciona de forma offline.
* El test en `SpinnerWheel.test.tsx` comprueba que al detenerse el giro, se dispara un callback `onFinished` retornando el `participantId` del sector ganador.
* El componente limpia sus timers y animaciones al desmontarse de la vista para evitar fugas de memoria.
