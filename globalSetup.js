// globalSetup.js
import { execSync } from 'child_process';

export default async () => {
  execSync('node tests/utils/seedTestDB.js', { stdio: 'inherit' });
};
