# Spec: llm-parser-skeleton

## ADDED Requirements

### Structured Parser Worker Communication
The parser MUST run inside a background Web Worker and process raw text.

#### Scenario: Parser Web Worker message handling
Given the Web Worker `llm.worker.ts` is running
When the main thread posts a message containing raw OCR text
Then the Web Worker MUST process the text in the background without blocking the main UI thread.

#### Scenario: Mock structured receipt JSON generation
Given the Web Worker receives raw OCR text
When processing is initiated
Then the Web Worker MUST respond with a mock structured JSON object
And the JSON structure MUST contain mock properties for ticket details, items, and participants.
