// global-teardown.js
import { removeUser } from './tests/utils/seed/helpers/userHelpers.js';
import { getDb } from './tests/utils/seed/helpers/db.js';

export default async () => {
    const db = getDb();
    await removeUser('test-user-1');
    await db.end(); // Optional: close pool if needed
};
