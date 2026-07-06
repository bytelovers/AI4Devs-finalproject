import Dexie, { type Table } from 'dexie';

export interface Ticket {
  id?: number;
  rawText: string;
  confidence: number;
  totalAmount: number;
  createdAt: Date;
}

export interface Item {
  id?: number;
  ticketId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Participant {
  id?: number;
  name: string;
}

export class LocalDB extends Dexie {
  tickets!: Table<Ticket, number>;
  items!: Table<Item, number>;
  participants!: Table<Participant, number>;

  constructor() {
    super('SplitEatLocalDB');
    this.version(1).stores({
      tickets: '++id, confidence, totalAmount, createdAt',
      items: '++id, ticketId, name, price, quantity',
      participants: '++id, name',
    });
  }
}

export const db = new LocalDB();
