import { test, expect } from '@playwright/test';
import { insertUser, removeUser } from './utils/seed/helpers/userHelpers.js';
import db from '.utils/seed/helpers/db.js';

test.describe('Database Seeding', () => {
    const testHandle = 'test-user-1';
    const testPassword = '12345';
    const testRole = 'admin';

    test.beforeAll(async () => {
        await insertUser(testHandle, testPassword, testRole);
    });

    test.afterAll(async () => {
        await removeUser(testHandle);
    });

    test('should insert user into the database', async () => {
        const [rows] = await db.execute('SELECT * FROM users WHERE handle = ?', [testHandle]);
        expect(rows.length).toBe(1);
        expect(rows[0].handle).toBe(testHandle);
    });
});
