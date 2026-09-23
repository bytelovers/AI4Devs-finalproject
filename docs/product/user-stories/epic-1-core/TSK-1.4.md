---
doc_id: product/user-stories/TSK-1.4
title: 'TSK-1.4: Motor de Expresiones Regulares para Parseo de Tickets (Regex Engine)'
domain: product
audience: [human, agent]
status: entregado
source_of_truth_for:
  - detalle técnico de TSK-1.4
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-1.4: Motor de Expresiones Regulares para Parseo de Tickets (Regex Engine)

> **Layout de ficheros: el de este registro es el planificado, no el entregado.** Las rutas que
> aparecen más abajo describen la estructura que se proyectó para esta tarea; el árbol real es
> distinto. La estructura entregada está en `/docs/architecture/overview.md`.
>
> | Ruta planificada en este registro | Ruta entregada |
> | :--- | :--- |
> | `frontend/src/services/ocr/RegexParser.ts` | `frontend/src/lib/scan/receipt-parser.ts` |
> | `frontend/src/services/ocr/RegexParser.test.ts` | `frontend/src/lib/scan/receipt-parser.test.ts` |
>
> El estado `entregado` de este registro se refiere a la **capacidad**, no a los ficheros
> planificados.

- **Historia de Usuario Relacionada:** [US-01: Escaneo OCR Inteligente de Tickets](/docs/product/user-stories/epic-1-core/US-01.md)
- **Épica:** Epic 1: Core Digitalization & Basic Assignment Flow
- **Capa:** Frontend (Utilities)
- **Complejidad:** 4 SP
- **Dependencias:** TSK-1.1

## 1. Descripción de la Tarea
Crear un procesador de texto por expresiones regulares que reciba la cadena de texto cruda generada por el OCR (tanto local como en la nube) y extraiga de forma estructurada los conceptos del ticket: nombre del restaurante, fecha, artículos (cantidad, nombre, precio unitario, precio total), tasas de IVA y total de la cuenta.

## 2. Detalles de Implementación
1. **Lógica del Parser:**
   * Crear `frontend/src/services/ocr/RegexParser.ts`.
   * Implementar función `parseReceiptText(rawText: string): ParsedReceipt`:
     ```typescript
     export interface ParsedReceipt {
       restaurantName?: string;
       date?: string; // ISO String
       items: Omit<TicketItem, 'ticketId'>[];
       subtotal: number;
       taxAmount: number;
       totalAmount: number;
     }
     ```
   * Diseñar expresiones regulares específicas para el mercado español:
     * Detección de líneas de artículo: `^(\d+)?\s*(x|X|\*)\s*([\w\s]+)\s+(\d+[\.,]\d{2})` o similar para capturar cantidad, descripción y precio.
     * Detección de total y subtotal: `(?:TOTAL|IMPORT|SUMA|A PAGAR)\s*:?\s*(\d+[\.,]\d{2})`.
     * Identificación de IVA: `(?:IVA|I\.V\.A|TAX)\s*(\d+)?\s*%\s*(\d+[\.,]\d{2})?`.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Crear `frontend/src/services/ocr/RegexParser.test.ts` con 5 fixtures reales de tickets (texto plano en strings multilínea):
  * Comprobar que extrae correctamente artículos con cantidades explícitas (e.g. "2 cervezas 3.00 6.00").
  * Comprobar que asume cantidad = 1 si no se detecta multiplicador (e.g. "Pizza Carbonara 12.50").
  * Comprobar que se sanean los caracteres decimales de comas a puntos (e.g. `12,50` -> `12.50`).
  * El error de cuadre entre la suma de los ítems y el campo total Amount no debe superar el 5% (tolerancia de lectura OCR); de lo contrario, levantar flag `high_discrepancy`.
