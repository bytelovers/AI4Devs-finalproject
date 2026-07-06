# Spec: local-datastore-skeleton

## ADDED Requirements

### Database Schema Initialization and Persistence
The system MUST support client-side offline database initialization and persistence via Dexie.js.

#### Scenario: Dexie database schema initialization
Given the application initializes for the first time
When the local database manager loads
Then the system MUST initialize Dexie.js with a schema versioned 1
And the schema MUST define tables for tickets, items, and participants with indexed primary keys.

#### Scenario: Storing tickets and items offline
Given the local database is initialized
When the application saves a processed receipt
Then the database MUST store the ticket and its associated items in their respective tables.

#### Scenario: Storing participants offline
Given the local database is initialized
When a new participant is registered for a split ticket
Then the database MUST store the participant record in the participant table.
