import { getDb } from './db.js';

export async function insertTrip(name, slug, startDate, endDate, landscapeImg) {

    const db = getDb();

    await db.execute(
        'INSERT INTO trips (name, slug, start_date, end_date, landscape_image) VALUES (?, ?, ?, ?, ?)',
        [name, slug, startDate, endDate, landscapeImg]
    );

}

export async function removeTrip(name) {

    const db = getDb();

    await db.execute(`DELETE FROM trips WHERE name = '${name}'`);
}

export async function getTripId(tripName) {
    const db = getDb();

    const [rows] = await db.execute('SELECT id FROM trips WHERE name = ?', [tripName]);

    if (rows.length === 0) {
        throw new Error(`User not found with handle: ${handle}`);
    }

    return rows[0].id;
}