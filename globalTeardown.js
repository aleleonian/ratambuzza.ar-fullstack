import fs from 'fs';
import path from 'path';
import { removeUser } from './tests/utils/seed/helpers/userHelpers.js';
import { getDb } from './tests/utils/seed/helpers/db.js';
import { getAllMedia } from './tests/utils/seed/helpers/mediaHelpers.js';

export default async () => {

    const rows = await getAllMedia();

    rows.forEach(row => {
        const mediaPath = path.join(process.cwd(), 'public', row.url);             // e.g. /full/path/to/project/public/uploads/xxx.jpeg
        const thumbPath = path.join(process.cwd(), 'public', row.thumbnail_url);   // same here

        try {
            if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }
        catch (error) {
            console.log("error->", error)
        }
    });

    const db = getDb();
    await removeUser('test-user-1');

    // TODO: add code to delete images.
    await db.end(); // Optional: close pool if needed
};
