const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve('./.env.test') });

const mysql = require('mysql2/promise');

let db;

export async function cleanDb() {
    await db.execute('DELETE FROM likes_media');
    await db.execute('DELETE FROM likes_posts');
    await db.execute('DELETE FROM media_tags');
    await db.execute('DELETE FROM postcards');
    await db.execute('DELETE FROM media');
    await db.execute('DELETE FROM posts');
    await db.execute('DELETE FROM sessions');
    await db.execute('DELETE FROM tags');
    await db.execute('DELETE FROM trip_members');
    await db.execute('DELETE FROM trips');
    await db.execute('DELETE FROM users');
}

export async function initDb() {
    db = mysql.createPool({
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
