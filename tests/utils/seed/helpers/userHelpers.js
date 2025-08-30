import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import db from './db.js';

export async function insertUser(handle, password, role) {
  const hash = await bcrypt.hash(password, 10);

  await db.execute(
    'INSERT INTO users (handle, email, password_hash, avatar_file_name, avatar_head_file_name, role) VALUES (?, ?, ?, ?, ?, ?)',
    [handle, `${handle}@example.com`, hash, `${handle}.jpg`, `${handle}.head.jpg`, role]
  );

  // Copy avatar files (adjust paths as needed)
  fs.copyFileSync(
    path.join('seed/fixtures/images/avatars', `${handle}.jpg`),
    path.join('public/images/avatars', `${handle}.jpg`)
  );
  fs.copyFileSync(
    path.join('seed/fixtures/images/avatars/thumbs', `${handle}.head.jpg`),
    path.join('public/images/avatars/thumbs', `${handle}.head.jpg`)
  );
}

export async function removeUser(handle) {
  await db.execute('DELETE FROM users WHERE handle = ?', [handle]);

  const avatarPath = path.join('public/images/avatars', `${handle}.jpg`);
  const headPath = path.join('public/images/avatars/thumbs', `${handle}.head.jpg`);

  [avatarPath, headPath].forEach(filePath => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
}
