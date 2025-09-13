import { getDb } from './db.js';
import { path } from 'path';

export async function getAllPostcardsMedia() {
    const db = getDb();
    const [rows] = await db.execute('SELECT image_url, thumbnail_url FROM postcards');
    return rows;
}

export async function deleteAllPostcardsMedia() {

    const rows = await getAllPostcardsMedia();

    rows.forEach(row => {
        const mediaPath = path.join(process.cwd(), 'public', row.image_url);             // e.g. /full/path/to/project/public/uploads/xxx.jpeg
        const thumbPath = path.join(process.cwd(), 'public', row.thumbnail_url);   // same here

        try {
            if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }
        catch (error) {
            console.log("error->", error)
        }
    });

}


