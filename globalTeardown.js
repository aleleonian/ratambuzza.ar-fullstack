import fs from 'fs';
import path from 'path';
import { getDb, cleanDb } from './tests/utils/seed/helpers/db.js';
import { getAllMedia, deleteMediaLikes } from './tests/utils/seed/helpers/mediaHelpers.js';
import { removeUserFiles } from './tests/utils/seed/helpers/userHelpers.js';
import { deleteAllPostcardsMedia } from './tests/utils/seed/helpers/postcardHelpers.js'

export default async () => {

    // clean files
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

    await deleteAllPostcardsMedia();

    //clean db
    const db = getDb();
    await deleteMediaLikes();
    await removeUserFiles(process.env.FIRST_TEST_USER_NAME);
    await removeUserFiles(process.env.SECOND_TEST_USER_NAME);
    await removeUserFiles(process.env.THIRD_TEST_USER_NAME);
    await removeUserFiles(process.env.FOURTH_TEST_USER_NAME);
    await cleanDb()

    // TODO: add code to delete images.
    await db.end(); // Optional: close pool if needed
};
