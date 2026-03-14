import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";

const globalForDb = globalThis as unknown as { _mongoClientPromise?: Promise<MongoClient> };

export async function getClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  if (!globalForDb._mongoClientPromise) {
    globalForDb._mongoClientPromise = new MongoClient(uri).connect();
  }
  return globalForDb._mongoClientPromise;
}

const DB_NAME = "memory-vocab";
const VOCAB_COLLECTION = "vocab";
const CATEGORY_COLLECTION = "categories";

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(DB_NAME);
}

export async function getVocabCollection() {
  const db = await getDb();
  return db.collection<import("@/types/vocab").VocabEntry>(VOCAB_COLLECTION);
}

export async function getCategoryCollection() {
  const db = await getDb();
  return db.collection<import("@/types/category").Category>(CATEGORY_COLLECTION);
}
