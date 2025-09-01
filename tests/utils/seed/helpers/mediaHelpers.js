import path from 'path';
import fs from 'fs';
import { getDb } from './db.js';

export async function getAllMedia() {
    const db = getDb();

    const [rows] = await db.execute('SELECT * FROM media');
    return rows;

}
export async function insertMedia(postId = null, tripId, userId, mediaPath, thumbPath, width, height, type) {

    const db = getDb();

    // gota take mediaPath and thumbPath and copy those files to /public/upload
    // then define url and thumbNail url before running the INSERT

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    // Ensure uploads directory exists
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    // Get original filename if not renaming
    let fileName = path.basename(mediaPath);
    let destinationPath = path.join(uploadsDir, fileName);
    // Copy the file
    if (fs.existsSync(destinationPath)) throw Error(`${destinationPath} already exists.`)
    await fs.promises.copyFile(mediaPath, destinationPath);

    let thumbFileName = path.basename(thumbPath);
    destinationPath = path.join(uploadsDir, thumbFileName);
    if (fs.existsSync(destinationPath)) throw Error(`${destinationPath} already exists.`)
    await fs.promises.copyFile(thumbPath, destinationPath);

    const url = "/uploads/" + fileName;
    const thumbnailUrl = "/uploads/" + thumbFileName;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.execute(
        'INSERT INTO media (post_id, trip_id, user_id, url, thumbnail_url, width, height, type, created_at) VALUES (?, ?, ?, ?, ?, ? ,? ,? ,?)',
        [postId, tripId, userId, url, thumbnailUrl, width, height, type, now]
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