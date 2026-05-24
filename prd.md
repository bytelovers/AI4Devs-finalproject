# Documento de Requisitos del Producto (PRD) Final — MVP: Sistema de Flashcards Adaptativo y Gestión del Tiempo

**Autor:** Senior Product Manager

**Fecha:** Mayo 2026

**Estado:** Aprobado para Desarrollo (Scope Frozen)

**Audiencia:** Equipo de Ingeniería, Diseñador UX/UI, Inversores

---

## 1. Resumen Ejecutivo y Problema

El método de estudio tradicional es desorganizado e ineficiente. Los estudiantes dedican el mismo tiempo a conceptos que ya dominan que a los que olvidan con facilidad. Este producto resuelve esa ineficiencia mediante un sistema de estudio basado en el **Método Leitner (Repetición Espaciada)**, obligando al cerebro a concentrarse en sus flaquezas detectadas.

Para este MVP, el producto adopta un enfoque **B2C enfocado en adultos** (universitarios, opositores y profesionales) con una interfaz limpia, eliminando costos de Inteligencia Artificial mediante una estrategia inteligente y añadiendo un optimizador de tiempo (Pomodoro) de bajo costo técnico para maximizar el valor inmediato.

---

## 2. Objetivos y Métricas de Éxito (KPIs)

### Objetivos del Negocio

* Materializar un MVP funcional en **6 semanas** con un presupuesto de infraestructura y APIs menor a **$10 USD**.
* Validar la retención y el encaje producto-mercado (*Product-Market Fit*) antes de la expansión a un modelo B2B.

### Métricas Clave (KPIs)

* **Activación:** % de usuarios que se registran, crean un mazo y completan su primer bloque Pomodoro de 25 minutos. (Meta: > 45%).
* **Retención D7 (Día 7):** % de usuarios que vuelven a revisar sus cajas Leitner a la semana de iniciar. (Meta: > 25%).
* **Costo Operativo API:** $0 USD en servidores para procesamiento de IA en la primera fase del MVP.

---

## 3. Especificación de Funcionalidades Core

### 3.1 Sistema Polimórfico de Tarjetas (Creación Manual)

El sistema soportará una estructura de datos flexible (JSON) para renderizar 4 tipos de estudio desde un formulario de creación individual y manual:

| Tipo de Tarjeta | Interfaz de Creación | Comportamiento en Estudio |
| --- | --- | --- |
| **Flashcard Clásica** | Texto Frente / Texto Dorso. | Muestra Frente -> Voltear -> Muestra Dorso. |
| **Única Respuesta** | Pregunta + 4 opciones de radio. | Bloquea voltear hasta que se seleccione una opción. Marca verde/rojo. |
| **Múltiple Respuesta** | Pregunta + Checkboxes dinámicos. | Requiere acertar todas las opciones correctas para validar. |
| **Completar Frase** | Texto con guiones `[...]`. | Muestra la frase incompleta y revela la palabra oculta al voltear. |

### 3.2 El Motor Adaptativo (Algoritmo Leitner)

Cada usuario tendrá un progreso **100% individual** mapeado en 5 cajas virtuales. El backend programará las revisiones automáticamente:

* **Caja 1:** Se repasa **cada día**. (Estado inicial de toda tarjeta nueva).
* **Caja 2:** Se repasa **cada 2 días**.
* **Caja 3:** Se repasa **cada 4 días**.
* **Caja 4:** Se repasa **cada 7 días**.
* **Caja 5:** Se repasa **cada 14 días** (Memoria a largo plazo).

> ⚠️ **Regla de Oro del Motor:** Si el usuario presiona "Lo sabía", la tarjeta avanza una caja (+1). Si presiona "No lo sabía", la tarjeta **cae inmediatamente a la Caja 1**, sin importar dónde estuviera.

### 3.3 Lean Pomodoro (Organización del Tiempo)

Un temporizador nativo de *frontend* integrado directamente en la pantalla de estudio del mazo para evitar el *burnout*.

* **Ciclo Fijo:** 25 minutos de estudio / 5 minutos de descanso.
* **Restricción del MVP:** No es configurable (no se pueden cambiar los minutos) y no se guarda el histórico en la base de datos para ahorrar tiempo de desarrollo.

---

## 4. Historias de Usuario (User Stories) y Criterios de Aceptación

### US1: Creación Flexible de Contenido

**Como** estudiante de oposiciones,

**quiero** añadir tarjetas de opción múltiple y frases para completar a mi mazo,

**para** poder simular de forma realista el examen real al que me presento.

* **Criterios de Aceptación:**
* El usuario debe ver un selector para elegir el tipo de tarjeta antes de escribir.
* Si se selecciona "Única Respuesta" o "Múltiple Respuesta", debe permitir añadir o remover opciones (mínimo 2, máximo 5).
* El mazo guarda los cambios localmente y sincroniza con la base de datos en texto plano.



### US2: El Algoritmo de Repetición Espaciada

**Como** profesional con poco tiempo para estudiar,

**quiero** que el sistema filtre y me muestre primero las tarjetas que fallé ayer,

**para** no perder tiempo repasando conceptos que ya memoricé.

* **Criterios de Aceptación:**
* Al iniciar el modo estudio, el sistema calcula qué tarjetas de las Cajas 1 a 5 están "vencidas" para el día de hoy.
* La interfaz muestra los botones dominantes "Lo sabía" y "No lo sabía".
* Al fallar, el backend actualiza el estado de la tarjeta a la Caja 1 de manera inmediata.



### US3: Temporizador Integrado (Lean Pomodoro)

**Como** estudiante universitario propenso a perder la concentración,

**quiero** que la aplicación me avise cuándo parar para descansar la vista,

**para** mantener mi cerebro fresco durante sesiones largas.

* **Criterios de Aceptación:**
* El timer de 25:00 se inicia automáticamente al renderizar la primera tarjeta del mazo.
* Al llegar a 00:00, se despliega un bloqueo visual (modal o capa superior) que impide seguir estudiando e inicia la cuenta atrás de 5:00 minutos.
* Un botón de "Pausa" permite congelar el tiempo ante interrupciones externas.



---

## 5. Estrategia Arquitectura de Datos (Preparados para el Futuro)

Para garantizar la escalabilidad hacia la **Fase 2 (Colaborativa)** y **Fase 3 (IA con Documentos)** sin reescribir el core, ingeniería implementará este modelo desacoplado:

```
[Tabla: Decks] ── (1:N) ──> [Tabla: Cards (JSON Polimórfico)]
                                  │
                                  └── (1:N) ──> [Tabla: User_Progress]
                                                      ├── User_ID
                                                      ├── Card_ID
                                                      ├── Current_Box (1 a 5)
                                                      └── Next_Review_Date

```

*Esto asegura que si el Mazo es compartido (Fase 2), la tabla `User_Progress` mantiene los fallos y las cajas de forma estrictamente individual.*

---

## 6. Gestión de Riesgos y Mitigación del Presupuesto ($10 USD)

### Riesgo 1: El costo de la IA destruye el presupuesto del MVP

* **Impacto:** Crítico.
* **Mitigación:** La IA queda fuera del alcance del código del servidor en el MVP. Se incluye un botón estético "Generar con IA (Fase 3)" que abre un formulario de preventa o una sección **BYOK (Bring Your Own Key)**. El usuario introduce su propia API Key de OpenAI si quiere activar la extracción automática de documentos en su entorno local. El costo para nuestra startup es $0.

### Riesgo 2: Retraso por exceso de características (Scope Creep)

* **Impacto:** Alto.
* **Mitigación:** Quedan completamente descartadas del MVP las siguientes funciones: rankings, personalización del tiempo Pomodoro, login con múltiples redes sociales (solo email/password), edición de mazos en tiempo real por dos usuarios y analíticas avanzadas de horas de estudio.

---

## 7. Plan de Lanzamiento e Iteraciones Futuras

```
 FASE 1: MVP (Este PRD)      FASE 2: Colaboración       FASE 3: IA Avanzada
┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
│ • Creación Manual      │  │ • Compartir Mazos Link │  │ • Subida de PDF/Docs   │
│ • Motor Leitner Core   │─>│ • Métricas Individuales│─>│ • Prompt personalizado │
│ • Lean Pomodoro (25/5) │  │ • Retos Comunitarios   │  │ • Monetización/Tokens  │
└────────────────────────┘  └────────────────────────┘  └────────────────────────┘

```

Con este alcance cerrado, el equipo de diseño puede finalizar los *wireframes* de la interfaz de estudio y el equipo de ingeniería puede proceder a la creación del repositorio y el modelo de datos.