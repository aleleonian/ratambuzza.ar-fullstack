import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('./.env.test') });
import mysql from 'mysql2/promise';

console.log("process.env.DB_HOST:", process.env.DB_HOST);

let db;

export async function initDb() {
    db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME || 'ratambuzza.ar_test',
        password: process.env.DB_PASS || '',
    });
}

export function getDb() {
    if (!db) throw new Error("DB not initialized. Call initDb() first.");
    return db;
}
