// global-setup.js
import { insertUser } from './tests/utils/seed/helpers/userHelpers.js';
import { initDb } from './tests/utils/seed/helpers/db.js';

export default async () => {
  await initDb();
  await insertUser('test-user-1', '12345', 'admin');
};
