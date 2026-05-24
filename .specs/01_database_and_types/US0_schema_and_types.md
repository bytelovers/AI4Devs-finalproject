# Épica 1: Infraestructura de Datos y Tipado Estricto (Turso & TypeScript)

## 1. Contexto del Dominio
Inicialización del esquema de base de datos relacional optimizado para SQLite/Turso. Configuración de tipos estrictos en TypeScript para garantizar la integridad estructural del campo polimórfico `content` de las tarjetas.

## 2. Especificación Técnica

### Esquema SQL (Turso / libSQL DDL)
```sql
-- Tabla de Mazos con soporte para alias humanizables (slugs)
CREATE TABLE decks (
    id TEXT PRIMARY KEY DEFAULT (uuid()), -- Almacenará un UUID generado en cliente/servidor
    slug TEXT NOT NULL UNIQUE, -- Alias humanizable único para las URLs
    title TEXT NOT NULL,
    category TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now'))
);

-- Tabla de Tarjetas Polimórficas
CREATE TABLE cards (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    deck_id TEXT NOT NULL,
    card_type TEXT NOT NULL, -- 'classic', 'single_choice', 'multiple_choice', 'cloze'
    content TEXT NOT NULL, -- JSON Stringificado que cumple con CardContent
    created_at TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now')),
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
);

-- Índices de optimización para búsquedas rápidas
CREATE INDEX idx_decks_slug ON decks(slug);
CREATE INDEX idx_cards_deck ON cards(deck_id);

-- Tabla de Progreso Individual (Core Algorítmico)
CREATE TABLE user_progress (
    id TEXT PRIMARY KEY DEFAULT (uuid()),
    user_id TEXT NOT NULL, -- Extraído del JWT de sesión de manera segura
    card_id TEXT NOT NULL,
    current_box INTEGER DEFAULT 1,
    next_review_date TEXT DEFAULT (strftime('%Y-%m-%d 00:00:00', 'now')), -- Siempre al inicio del día
    fail_count INTEGER DEFAULT 0,
    UNIQUE(user_id, card_id),
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Índices de consulta para el motor Leitner
CREATE INDEX idx_user_progress_review ON user_progress(user_id, next_review_date);

# Tipos de datos (TypeScript)

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
  content: CardContent; // Debe parsearse desde el JSON de la DB
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  card_id: string;
  current_box: number; // Rango estricto 1 a 5
  next_review_date: string; // Formato YYYY-MM-DD 00:00:00
  fail_count: number;
}
```
# INSTRUCCIÓN DE CONFIGURACIÓN:
1. Configura una conexión a base de datos Turso utilizando el SDK oficial `@libsql/client`.
2. Crea un archivo de definición de tipos `types/flashcards.ts` que contenga exactamente la unión discriminada de tipos expuesta arriba.
3. Asegúrate de implementar una función helper de parseo seguro que valide que el string JSON recuperado de la columna `cards.content` se mapee correctamente al tipo `CardContent` en tiempo de ejecución.
