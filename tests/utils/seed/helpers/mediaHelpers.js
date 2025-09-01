import { getDb } from './db.js';

export async function getAllMedia() {
    const db = getDb();

    const [rows] = await db.execute('SELECT * FROM media');
    return rows;

}
export async function insertMedia(postId = null, tripId, userId, url, thumbnailUrl, width, height, type) {

    const db = getDb();

    await db.execute(
        'INSERT INTO media (post_id, trip_id, user_id, url, thumbnail_url, width, height, type, created_at) VALUES (?, ?, ?, ?, ?, ? ,? ,? ,?)',
        [postId, tripId, userId, url, thumbnailUrl, width, height, type, Date.now()]
    );

}

export async function removeMedia(mediaId) {
    const db = getDb();

    // delete the actual files

    await db.execute(
        'DELETE FROM media WHERE id = ?',
        [mediaId]
    );

    // also make sure to delete media references from other tables
}