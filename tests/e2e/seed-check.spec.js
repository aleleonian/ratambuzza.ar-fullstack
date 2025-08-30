import { test as base, expect } from '@playwright/test';
import { insertUser, removeUser } from '../utils/seed/helpers/userHelpers.js';
import { initDb, getDb } from '../utils/seed/helpers/db.js';

// Create a custom test without a browser context
const test = base.extend({ page: async () => null });

test.describe('Database Seeding', () => {
    const testHandle = 'test-user-1';
    const testPassword = '12345';
    const testRole = 'admin';

    test.beforeAll(async () => {
        await initDb();
        await insertUser(testHandle, testPassword, testRole);
    });

    test.afterAll(async () => {
        await removeUser(testHandle);
    });

    test('should insert user into the database', async () => {
        const db = getDb();
        const [rows] = await db.execute('SELECT * FROM users WHERE handle = ?', [testHandle]);
        expect(rows.length).toBe(1);
        expect(rows[0].handle).toBe(testHandle);
    });
});
