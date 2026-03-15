import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";

const globalForDb = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _indexesEnsured?: Promise<void>;
};

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
  const db = client.db(DB_NAME);
  if (!globalForDb._indexesEnsured) {
    globalForDb._indexesEnsured = ensureIndexes(db);
  }
  await globalForDb._indexesEnsured;
  return db;
}

/** Tạo index cho các collection để query nhanh hơn. Chỉ chạy một lần khi khởi tạo DB. */
async function ensureIndexes(db: Db): Promise<void> {
  const vocab = db.collection(VOCAB_COLLECTION);
  const categories = db.collection(CATEGORY_COLLECTION);

  await Promise.all([
    // vocab: id (unique) — getById, update, delete, getEntriesByIds
    vocab.createIndex({ id: 1 }, { unique: true }),
    // vocab: sort theo createdAt — getAll, getByDate, getByDateRange
    vocab.createIndex({ createdAt: -1 }),
    // vocab: filter theo categoryId + sort createdAt — getByCategoryId
    vocab.createIndex({ categoryId: 1, createdAt: -1 }),
    // vocab: filter theo topic + sort createdAt — getByTopic
    vocab.createIndex({ topic: 1, createdAt: -1 }),
    // vocab: search by word (regex/autocomplete)
    vocab.createIndex({ word: 1 }),
    // vocab: multikey — removeIdFromReferences (wordFamilyIds, synonymIds, antonymIds)
    vocab.createIndex({ wordFamilyIds: 1 }),
    vocab.createIndex({ synonymIds: 1 }),
    vocab.createIndex({ antonymIds: 1 }),

    // categories: id (unique) — getCategoryById, update, delete
    categories.createIndex({ id: 1 }, { unique: true }),
    // categories: sort theo name — getAllCategories
    categories.createIndex({ name: 1 }),
  ]);
}

export async function getVocabCollection() {
  const db = await getDb();
  return db.collection<import("@/types/vocab").VocabEntry>(VOCAB_COLLECTION);
}

export async function getCategoryCollection() {
  const db = await getDb();
  return db.collection<import("@/types/category").Category>(CATEGORY_COLLECTION);
}
