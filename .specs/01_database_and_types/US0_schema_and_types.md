# Épica 1: Infraestructura de Datos y Tipado Estricto (Turso & TypeScript)

## 1. Contexto del Dominio
Inicialización del esquema de base de datos relacional en Turso (libSQL) optimizando el almacenamiento con soporte nativo de UUIDv4 generados por el motor y tipos estrictos de TypeScript para el control del campo mutable `content`.

## 2. Especificación Técnica (DDL SQL)
-- Tabla de Mazos con soporte para alias humanizables (slugs) y UUID nativos
CREATE TABLE decks (
    id TEXT PRIMARY KEY DEFAULT (uuid()), 
    slug TEXT NOT NULL UNIQUE, 
    title TEXT NOT NULL,
    category TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

-- Tabla de Tarjetas Polimórficas
CREATE TABLE cards (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    deck_id TEXT NOT NULL,
    card_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

CREATE INDEX idx_decks_slug ON decks(slug);
CREATE INDEX idx_cards_deck ON cards(deck_id);

-- Tabla de Progreso Individual (Core Algorítmico)
CREATE TABLE user_progress (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    user_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    current_box INTEGER DEFAULT 1,
    next_review_date TEXT DEFAULT (strftime('%Y-%m-%d 00:00:00', 'now')),
    fail_count INTEGER DEFAULT 0,
    UNIQUE(user_id, card_id),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_progress_review ON user_progress(user_id, next_review_date);

## 3. Tipos de Datos (TypeScript)

```typescript
export type CardType = 'classic' | 'single_choice' | 'multiple_choice' | 'cloze';

export type CardContent = 
  | { type: 'classic'; front: string; back: string }
  | { type: 'single_choice'; question: string; options: string[]; correct_index: number }
  | { type: 'multiple_choice'; question: string; options: string[]; correct_indices: number[] }
  | { type: 'cloze'; text_with_blank: string; hidden_answer: string };

export interface Deck {
  id: string;
  slug: string;
  title: string;
  category?: string;
  created_at: string;
}

export interface Card {
  id: string;
  deck_id: string;
  card_type: CardType;
  content: CardContent; 
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  card_id: string;
  current_box: number; 
  next_review_date: string; 
  fail_count: number;
}
```

## 4. Requerimientos de Testing de Integración de Base de Datos (Vitest + libSQL)
La IA debe crear un archivo `src/lib/db-constraints.test.ts` que se ejecute sobre una base de datos de pruebas (o una instancia local/memoria de libSQL).

* **Casos de prueba obligatorios:**
  1. **Validación de Clave Única (user_id, card_id):** Verificar que intentar insertar dos registros idénticos en `user_progress` con el mismo `user_id` y `card_id` lance un error de restricción de base de datos (`SQLITE_CONSTRAINT_UNIQUE`).
  2. **Validación de Cascada (ON DELETE CASCADE):** 
     - Insertar un mazo, una tarjeta vinculada a ese mazo, y un registro en `user_progress` para esa tarjeta.
     - Eliminar el mazo de la tabla `decks`.
     - Verificar mediante consultas `SELECT` que tanto la tarjeta como el progreso han sido eliminados de sus respectivas tablas de forma automática.


