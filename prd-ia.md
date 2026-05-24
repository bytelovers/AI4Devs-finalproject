Para que un agente de IA (como Devin, Bolt.new o cualquier LLM de codificación) ejecute este proyecto de forma impecable sin cometer errores de arquitectura o inventar funcionalidades, el PRD debe cambiar su enfoque. La IA no necesita narración; necesita **especificaciones deterministas, esquemas de datos exactos, reglas de negocio sin ambigüedad y casos de prueba claros**.

Aquí tienes el PRD optimizado como un **"AI-Agent Promptable Specification"**, diseñado para que lo copies, lo pegues en el contexto de tu agente de IA y este genere el código correcto a la primera.

---

## 1. Contexto Global y Arquitectura del Sistema (System Context)

El agente de IA debe construir una aplicación web SPA (Single Page Application) utilizando **Next.js (App Router), Tailwind CSS y TypeScript**, conectada a una base de datos **PostgreSQL (Supabase)**.

### Esquema de Base de Datos Base (DDL)

El agente debe inicializar la base de datos con las siguientes tablas y relaciones exactas:

```sql
-- Tabla de Mazos
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Tarjetas Polimórficas
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
    card_type VARCHAR(50) NOT NULL, -- 'classic', 'single_choice', 'multiple_choice', 'cloze'
    content JSONB NOT NULL, -- Estructura mutable según card_type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Progreso Individual (Core Algorítmico)
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Mapeado al sistema de Auth de Supabase
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    current_box INT DEFAULT 1 CHECK (current_box >= 1 AND current_box <= 5),
    next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fail_count INT DEFAULT 0,
    UNIQUE(user_id, card_id)
);

```

### Tipos de Datos Estrictos (TypeScript Types)

El agente debe tipar el campo `content` de la tabla `cards` utilizando estrictamente estas uniones:

```typescript
type CardContent = 
  | { type: 'classic'; front: string; back: string }
  | { type: 'single_choice'; question: string; options: string[]; correct_index: number }
  | { type: 'multiple_choice'; question: string; options: string[]; correct_indices: number[] }
  | { type: 'cloze'; text_with_blank: string; hidden_answer: string };

```

---

## 2. Secuencia de Implementación para el Agente de IA

Para evitar que la IA rompa el código al construir componentes dependientes, debe seguir estrictamente este orden secuencial de desarrollo:

1. **Fase de Base de Datos y Tipos:** Paso 1.
Crear las tablas en PostgreSQL, configurar las claves foráneas, los índices para `next_review_date` y exportar las definiciones de tipos de TypeScript al proyecto Next.js.


2. **Módulo de Creación Manual Dinámica:** Paso 2.
Implementar el formulario web que renderiza inputs dinámicos basados en el estado del selector `card_type` e inserta el JSON correcto en la tabla `cards`.


3. **Motor Algorítmico Leitner (Backend):** Paso 3.
Desarrollar la función del servidor que calcula el nuevo `current_box` y la `next_review_date` tras una respuesta, forzando el retorno a la Caja 1 si hay un fallo.


4. **Interfaz de Estudio y Temporizador:** Paso 4.
Construir la pantalla de estudio que consume el motor Leitner e integrar el estado de React (`useState`) para el temporizador Pomodoro de 25/5 minutos a nivel local.


---

## 3. Historias de Usuario Traducidas a Instrucciones de Agente (Prompts de Ejecución)

Copia y entrega cada uno de los siguientes bloques a la IA como instrucciones de desarrollo individuales:

### Prompt para US1: Generador Dinámico de Formularios de Tarjetas

```text
INSTRUCCIÓN DE CODIFICACIÓN:
Crea un componente de React llamado `CardCreatorForm` dentro de Next.js.
1. Debe incluir un elemento <select> con las opciones: 'classic', 'single_choice', 'multiple_choice', 'cloze'.
2. Usa un estado de React para manejar el tipo seleccionado y mutar los campos visibles del formulario:
   - Si 'classic': Renderiza dos textareas ('Frente' y 'Dorso').
   - Si 'single_choice': Renderiza un input para la pregunta, un botón para añadir hasta 5 strings de opciones y radio buttons para marcar cuál es la correcta.
   - Si 'multiple_choice': Igual que el anterior, pero usando checkboxes para permitir múltiples respuestas correctas.
   - Si 'cloze': Renderiza un input para el texto base (que debe contener '[...]') y un input para la palabra oculta.
3. Al hacer submit, valida que los campos obligatorios no estén vacíos y realiza un INSERT en la tabla `cards` guardando la estructura exacta de la unión de tipos `CardContent`.

```

### Prompt para US2: Motor Leitner y Lógica de Mutación de Cajas

```text
INSTRUCCIÓN DE CODIFICACIÓN:
Escribe una función de servidor (Server Action o API Route) llamada `submitCardReview(userId: string, cardId: string, isCorrect: boolean)`.
La función debe leer el estado actual de la tarjeta para ese usuario en la tabla `user_progress`.
Reglas de computación que debes programar obligatoriamente:
- Si el registro no existe en `user_progress`, créalo con `current_box = 1`.
- Si `isCorrect` es TRUE:
  - Incrementa `current_box` en 1 (Máximo permitido: 5).
  - Calcula `next_review_date` sumando los días correspondientes a la nueva caja: Caja 1 (+1 día), Caja 2 (+2 días), Caja 3 (+4 días), Caja 4 (+7 días), Caja 5 (+14 días).
- Si `isCorrect` es FALSE:
  - Setea `current_box = 1` de manera inmediata.
  - Setea `next_review_date = NOW()` para que aparezca de nuevo en la misma sesión o al día siguiente.
  - Incrementa el campo `fail_count` en 1.
Guarda los cambios en la base de datos y retorna el nuevo estado.

```

### Prompt para US3: Interfaz de Estudio y Lógica de Bloqueo Pomodoro

```text
INSTRUCCIÓN DE CODIFICACIÓN:
Crea la pantalla de estudio `/deck/[id]/study`. Esta pantalla debe pedir al backend las tarjetas cuyo `next_review_date` sea menor o igual a NOW().
1. Renderiza el Frente de la tarjeta actual según su tipo. Al hacer clic en "Ver Respuesta", muestra el Dorso o las respuestas correctas junto con dos botones: "Lo sabía" (ejecuta submitCardReview con isCorrect: true) y "No lo sabía" (ejecuta con isCorrect: false).
2. Agrega un componente invisible en el backend pero visible en la esquina superior del frontend: un temporizador Pomodoro.
3. El temporizador se ejecuta mediante un `useEffect` con un intervalo de 1 segundo. Inicializa en 25:00 minutos.
4. Si el temporizador llega a 00:00, cambia el estado de la UI a 'BREAK_MODE'. Esto debe renderizar una capa modal opaca sobre toda la pantalla que impida interactuar con las tarjetas. El modal debe mostrar una cuenta regresiva de 5:00 minutos para descanso. Al llegar a 00:00 del break, destruye el modal y reinicia el ciclo a 25:00 minutos de estudio.

```

---

## 4. Casos de Prueba Automatizados para la IA (Criterios de Aceptación Técnicos)

Indica a tu agente de IA que valide su propio código utilizando estos escenarios de prueba lógicos:

* **Prueba de Degradación Leitner:** Si una tarjeta está en la `Caja 4` y el usuario hace clic en "No lo sabía", el registro en `user_progress` para esa tarjeta debe cambiar su valor de `current_box` a `1` inmediatamente en la base de datos.
* **Prueba de Protección de Estructura:** Si se intenta guardar una tarjeta tipo `single_choice` sin especificar el campo `correct_index`, el backend debe rechazar la petición con un error HTTP 400 y no guardar datos corruptos en el objeto JSONB.
* **Prueba de Estado Pomodoro:** Al activarse el modo de descanso de 5 minutos, la interfaz de usuario debe deshabilitar o cubrir los botones de evaluación ("Lo sabía" / "No lo sabía") para garantizar que el usuario no pueda seguir sumando respuestas durante el break.