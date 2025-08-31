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
