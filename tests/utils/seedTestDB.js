// tests/utils/seedTestDB.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config({ path: '.env.test' });

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
});

const seed = async () => {
    console.log('Seeding test database...');

    await db.execute('DELETE FROM media');
    await db.execute('DELETE FROM users');
    await db.execute('DELETE FROM likes_media');
    await db.execute('DELETE FROM likes_posts');
    await db.execute('DELETE FROM media_tags');
    await db.execute('DELETE FROM posts');
    await db.execute('DELETE FROM sessions');
    await db.execute('DELETE FROM tags');
    await db.execute('DELETE FROM trips');
    await db.execute('DELETE FROM trip_members');


    await insertUsers();

    const testImagesDir = path.join(process.cwd(), 'tests', 'fixtures', 'images');
    const files = fs.readdirSync(testImagesDir);

    for (const file of files) {
        const filePath = path.join(testImagesDir, file);
        const content = fs.readFileSync(filePath);

        await db.execute(
            'INSERT INTO media (user_id, filename, original_filename) VALUES (?, ?, ?)',
            [userResult.insertId, file, file]
        );

        const targetPath = path.join(process.env.MEDIA_UPLOAD_DIR, file);
        fs.writeFileSync(targetPath, content);
    }

    console.log('✅ Test DB seeded.');
    await db.end();
};

seed().catch(console.error);

async function insertUsers() {


    // await req.db.execute(
    //     'INSERT INTO users (email, password_hash, handle, avatar_file_name, avatar_head_file_name) VALUES (?, ?, ?, ?, ?)',
    //     [email, hash, handle, avatar_file_name, avatar_head_file_name]
    // )


}

async function insertUser(handle, password, role) {

    const hash = await bcrypt.hash(password, 10)

    const user_avatar_head_file_name = `${handle}_head_file_name`;
    const user_avatar_file_name = `${handle}_head_file_name_file_name`;

    const [userResult] = await db.execute(
        'INSERT INTO users (handle, email, password_hash, avatar_file_name, avatar_head_file_name, role) VALUES (?, ?, ?, ?, ?, ?)',
        [handle, `${handle}@example.com`, hash, role]
    );

    console.log(userResult);

    const sourceHeadImage = path.join(__dirname, `../fixtures/images/avatars/${handle}.head.jpg`);
    const targetHeadImage = path.join(__dirname, `../../public/images/avatars/${handle}.head.jpg`);

}