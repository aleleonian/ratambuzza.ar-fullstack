import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { getDb } from './db.js';

export async function changeUserType(userId, newRole) {
  const db = getDb();
  await db.execute(`UPDATE users SET role = ? WHERE id = ? `, [newRole, userId])
}

export async function insertUser(handle, password, role) {

  const db = getDb();

  const hash = await bcrypt.hash(password, 10);

  await db.execute(
    'INSERT INTO users (handle, email, password_hash, avatar_file_name, avatar_head_file_name, description, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [handle, `${handle}@example.com`, hash, `${handle}.png`, `${handle}.head.png`, 'some description', role]
  );

  const avatarDestinationPath = path.join('public/images/avatars', `${handle}.png`);
  // if (fs.existsSync(avatarDestinationPath)) throw Error(`${avatarDestinationPath} exists!`)

  const avatarThumbDestinationPath = path.join('public/images/avatars/thumbs', `${handle}.head.png`);
  // if (fs.existsSync(avatarThumbDestinationPath)) throw Error(`${avatarThumbDestinationPath} exists!`)

  // Copy avatar files (adjust paths as needed)
  fs.copyFileSync(
    path.join('tests/e2e/fixtures/images/avatars', `${handle}.png`),
    avatarDestinationPath
  );
  fs.copyFileSync(
    path.join('tests/e2e/fixtures/images/avatars/thumbs', `${handle}.head.png`),
    avatarThumbDestinationPath
  );
}

export async function removeUser(handle) {
  const db = getDb();

  await db.execute('DELETE FROM users WHERE handle = ?', [handle]);

  const avatarPath = path.join('public/images/avatars', `${handle}.png`);

  const headPath = path.join('public/images/avatars/thumbs', `${handle}.head.png`);

  [avatarPath, headPath].forEach(filePath => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
}

export async function getUserId(handle) {
  const db = getDb();
  const [rows] = await db.execute(
    'SELECT id FROM users WHERE handle = ?',
    [handle]
  );

  if (rows.length === 0) {
    throw new Error(`User not found with handle: ${handle}`);
  }

  return rows[0].id;
}